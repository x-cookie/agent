import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';
import { getConnection } from '@/lib/solana';
import { LESSONS } from '@/lib/lessons';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { recordExecutionProof } from '@/lib/serverWallet';

function buildAgentSystemPrompt(lessonId: string, code: string): string {
  const lesson = LESSONS.find(l => l.folder === lessonId);
  const lessonContext = lesson
    ? `**Lesson:** ${lesson.num} — ${lesson.title} (${lesson.tag})\n**Pattern:** ${lesson.desc}\n**Key concepts:** ${lesson.keys.join(', ')}`
    : `**Lesson:** ${lessonId}`;

  return `You are simulating the execution of a Node.js AI agent written by a student in the "AI Agents from Scratch" course.

${lessonContext}

The student's agent code:
\`\`\`js
${code.slice(0, 3000)}
\`\`\`

Act as if you ARE this agent running against the user's input below. Follow the reasoning pattern implied by the lesson and produce realistic console-style output ending with a final answer. Keep it under 200 words. Do not explain the code — actually run the persona.`;
}

async function callOpenRouter(lessonId: string, code: string, prompt: string): Promise<string> {
  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/ministral-3b-2512',
      max_tokens: 500,
      messages: [
        { role: 'system', content: buildAgentSystemPrompt(lessonId, code) },
        { role: 'user', content: prompt || 'Run the agent.' },
      ],
    }),
  });
  if (!upstream.ok) throw new Error(`OpenRouter error: ${await upstream.text()}`);
  const data = await upstream.json();
  return data.choices?.[0]?.message?.content ?? '[No output returned]';
}

/** Verify an on-chain SOL transfer of at least `minLamports` to `recipient`. */
async function verifyPayment(txSignature: string, recipient: string, minLamports: number): Promise<boolean> {
  const connection = getConnection();
  const tx = await connection.getParsedTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
  if (!tx || tx.meta?.err) return false;

  const accountKeys = tx.transaction.message.accountKeys.map(k => k.pubkey.toBase58());
  const recipientIndex = accountKeys.indexOf(recipient);
  if (recipientIndex === -1) return false;

  const pre = tx.meta?.preBalances?.[recipientIndex] ?? 0;
  const post = tx.meta?.postBalances?.[recipientIndex] ?? 0;
  return post - pre >= minLamports;
}

// POST /api/marketplace/[id]/run — run a listed agent, verifying payment for paid listings
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`marketplace-run:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many runs, slow down and try again in a minute.' }, { status: 429 });
    }

    const { txSignature, prompt } = await req.json();

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('marketplace_listings')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    if (listingError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, name, lesson_id, code')
      .eq('id', listing.agent_id)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    let buyerWallet = 'anonymous';
    let forked = false;
    let executionLogId: string | undefined;

    const auth = getUserFromRequest(req);

    if (listing.price_lamports > 0) {
      if (!auth) return NextResponse.json({ error: 'Connect your wallet to run a paid agent' }, { status: 401 });
      if (auth.userId === listing.seller_wallet) {
        return NextResponse.json({ error: "You can't buy your own listing." }, { status: 403 });
      }
      buyerWallet = auth.wallet;

      if (!txSignature) return NextResponse.json({ error: 'Payment signature required' }, { status: 402 });

      const valid = await verifyPayment(txSignature, listing.seller_wallet, listing.price_lamports);
      if (!valid) return NextResponse.json({ error: 'Payment could not be verified' }, { status: 402 });

      const { data: logRow, error: logError } = await supabaseAdmin.from('execution_logs').insert([{
        agent_id: agent.id,
        listing_id: listing.id,
        buyer_wallet: buyerWallet,
        tx_signature: txSignature,
        amount_lamports: listing.price_lamports,
      }]).select().single();
      if (logError) {
        if (logError.code === '23505') {
          return NextResponse.json({ error: 'This payment has already been used' }, { status: 409 });
        }
        throw logError;
      }
      executionLogId = logRow.id;
    } else {
      if (auth) buyerWallet = auth.wallet;

      const { data: logRow, error: logError } = await supabaseAdmin.from('execution_logs').insert([{
        agent_id: agent.id,
        listing_id: listing.id,
        buyer_wallet: buyerWallet,
        amount_lamports: 0,
      }]).select().single();
      if (!logError) executionLogId = logRow.id;
    }

    // Running an agent you don't already own — paid or free — grants a copy in your collection.
    if (auth && auth.userId !== listing.seller_wallet) {
      const { error: forkError } = await supabaseAdmin.from('agents').insert([{
        user_id: auth.userId,
        lesson_id: agent.lesson_id,
        name: listing.price_lamports > 0 ? `${agent.name} (purchased)` : `${agent.name} (forked)`,
        code: agent.code,
        parent_agent_id: agent.id,
        source: listing.price_lamports > 0 ? 'purchased' : 'forked_free',
      }]);
      forked = !forkError;
    }

    const output = await callOpenRouter(agent.lesson_id, agent.code, prompt || 'Run the agent.');

    let proofTx: string | undefined;
    if (executionLogId && listing.price_lamports > 0) {
      try {
        const proof = await recordExecutionProof({ agentId: agent.id, buyerWallet, output });
        proofTx = proof.proofTx;
        await supabaseAdmin
          .from('execution_logs')
          .update({ proof_tx: proof.proofTx, output_hash: proof.outputHash })
          .eq('id', executionLogId);
      } catch (proofError) {
        // Best-effort: a missing/unfunded signer shouldn't block the buyer from getting their output.
        console.error('Failed to record execution proof:', proofError);
      }
    }

    return NextResponse.json({ output, forked, proofTx });
  } catch (error) {
    console.error('POST /api/marketplace/[id]/run error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Run failed' },
      { status: 500 }
    );
  }
}
