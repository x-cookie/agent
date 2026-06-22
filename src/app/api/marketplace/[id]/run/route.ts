import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';
import { LESSONS } from '@/lib/lessons';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { recordExecutionProof } from '@/lib/serverWallet';
import { awardAgentXp } from '@/lib/agentStats';
import { x402Server, X402_NETWORK, priceForListingRequest, payToListingSeller, listingPrice } from '@/lib/x402Server';

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

/** Runs the listed agent, logs the execution, forks a copy into the buyer's collection, and records an on-chain proof. */
async function runListing(req: NextRequest, listingId: string, prompt: string): Promise<NextResponse> {
  const { data: listing, error: listingError } = await supabaseAdmin
    .from('marketplace_listings')
    .select('*')
    .eq('id', listingId)
    .eq('is_active', true)
    .single();
  if (listingError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('id, name, lesson_id, code')
    .eq('id', listing.agent_id)
    .single();
  if (agentError || !agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const auth = getUserFromRequest(req);
  if (listing.price_usd > 0 && auth?.userId === listing.seller_wallet) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 403 });
  }
  const buyerWallet = auth?.wallet ?? 'anonymous';

  const { data: logRow, error: logError } = await supabaseAdmin.from('execution_logs').insert([{
    agent_id: agent.id,
    listing_id: listing.id,
    buyer_wallet: buyerWallet,
    amount_usd: listing.price_usd,
  }]).select().single();
  const executionLogId = logError ? undefined : logRow.id;

  let forked = false;
  if (auth && auth.userId !== listing.seller_wallet) {
    const { error: forkError } = await supabaseAdmin.from('agents').insert([{
      user_id: auth.userId,
      lesson_id: agent.lesson_id,
      name: listing.price_usd > 0 ? `${agent.name} (purchased)` : `${agent.name} (forked)`,
      code: agent.code,
      parent_agent_id: agent.id,
      source: listing.price_usd > 0 ? 'purchased' : 'forked_free',
    }]);
    forked = !forkError;
  }

  const output = await callOpenRouter(agent.lesson_id, agent.code, prompt || 'Run the agent.');
  const xpResult = await awardAgentXp(agent.id, { xp: listing.price_usd > 0 ? 10 : 3, reputation: listing.price_usd > 0 ? 2 : 0 });
  const levelUp = xpResult?.leveledUp ? { agentId: agent.id, agentName: agent.name, newLevel: xpResult.newLevel } : undefined;

  let proofTx: string | undefined;
  if (executionLogId && listing.price_usd > 0) {
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

  return NextResponse.json({ output, forked, proofTx, levelUp });
}

const x402Handler = withX402(
  async (req: NextRequest) => {
    const id = req.nextUrl.pathname.match(/\/api\/marketplace\/([^/]+)\/run/)?.[1] ?? '';
    const { prompt } = await req.json();
    return runListing(req, id, prompt || 'Run the agent.');
  },
  {
    accepts: {
      scheme: 'exact',
      price: priceForListingRequest,
      network: X402_NETWORK,
      payTo: payToListingSeller,
    },
    description: 'Run a marketplace agent listing',
    mimeType: 'application/json',
  },
  x402Server
);

// POST /api/marketplace/[id]/run — free listings run directly; priced ones go through the x402 402-pay-retry flow.
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

    const price = await listingPrice(id);
    if (price === null) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    if (price === 0) {
      const { prompt } = await req.json();
      return runListing(req, id, prompt || 'Run the agent.');
    }

    if (!getUserFromRequest(req)) {
      return NextResponse.json({ error: 'Connect your wallet to run a paid agent' }, { status: 401 });
    }

    return x402Handler(req);
  } catch (error) {
    console.error('POST /api/marketplace/[id]/run error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Run failed' },
      { status: 500 }
    );
  }
}
