import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { supabaseAdmin } from '@/lib/serverAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { x402Server, X402_NETWORK, priceForRequest, payToAddress, deploymentPrice } from '@/lib/x402Server';

function buildAgentSystemPrompt(lessonId: string, code: string): string {
  return `You are simulating the execution of a Node.js AI agent written by a student in the "AI Agents from Scratch" course.

**Lesson:** ${lessonId}

The student's agent code:
\`\`\`js
${code.slice(0, 3000)}
\`\`\`

Act as if you ARE this agent running against the user's input below. Produce realistic console-style output ending with a final answer. Keep it under 200 words. Do not explain the code — actually run the persona.`;
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

async function runDeployedAgent(slug: string, prompt: string): Promise<NextResponse> {
  const { data: deployment } = await supabaseAdmin
    .from('deployments')
    .select('agent_id')
    .eq('public_url', slug)
    .eq('is_public', true)
    .single();
  if (!deployment) return NextResponse.json({ error: 'Agent not found or not public' }, { status: 404 });

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id, lesson_id, code')
    .eq('id', deployment.agent_id)
    .single();
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const output = await callOpenRouter(agent.lesson_id, agent.code, prompt);
  return NextResponse.json({ output });
}

const x402Handler = withX402(
  async (req: NextRequest) => {
    const slug = req.nextUrl.pathname.match(/\/api\/public\/([^/]+)\/run/)?.[1] ?? '';
    const { prompt } = await req.json();
    return runDeployedAgent(slug, prompt || 'Run the agent.');
  },
  {
    accepts: {
      scheme: 'exact',
      price: priceForRequest,
      network: X402_NETWORK,
      payTo: payToAddress,
    },
    description: 'Run a publicly deployed agent',
    mimeType: 'application/json',
  },
  x402Server
);

// POST /api/public/[slug]/run — free deployments run directly; priced ones go through the x402 402-pay-retry flow.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`public-run:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many runs, slow down and try again in a minute.' }, { status: 429 });
    }

    const price = await deploymentPrice(slug);
    if (price === null) return NextResponse.json({ error: 'Agent not found or not public' }, { status: 404 });

    if (price === 0) {
      const { prompt } = await req.json();
      return runDeployedAgent(slug, prompt || 'Run the agent.');
    }

    return x402Handler(req);
  } catch (error) {
    console.error('POST /api/public/[slug]/run error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Run failed' },
      { status: 500 }
    );
  }
}
