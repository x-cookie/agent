import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/serverAuth';
import { awardAgentXp } from '@/lib/agentStats';

const RUN_INTERVAL_HOURS = 24;
const ROLE_PROMPTS: Record<string, string> = {
  trader: 'You are this agent working as a trader while your owner is away. Briefly report a plausible market read and one action you took. Keep it under 60 words.',
  warrior: 'You are this agent working as a warrior while your owner is away. Briefly report what you trained or defended against. Keep it under 60 words.',
  researcher: 'You are this agent working as a researcher while your owner is away. Briefly report one finding or insight you logged. Keep it under 60 words.',
};

async function runJobOnce(lessonId: string, code: string, role: string): Promise<string> {
  const system = `You are simulating a Node.js AI agent (lesson: ${lessonId}) doing unattended background work.\n\nAgent code (for context only, don't explain it):\n${code.slice(0, 1500)}\n\n${ROLE_PROMPTS[role]}`;
  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/ministral-3b-2512',
      max_tokens: 150,
      messages: [{ role: 'system', content: system }, { role: 'user', content: 'Report your activity.' }],
    }),
  });
  if (!upstream.ok) throw new Error(`OpenRouter error: ${await upstream.text()}`);
  const data = await upstream.json();
  return data.choices?.[0]?.message?.content ?? '[No output returned]';
}

async function runJobs(): Promise<NextResponse> {
  const cutoff = new Date(Date.now() - RUN_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('agent_jobs')
    .select('id, agent_id, role, last_run_at')
    .eq('status', 'active')
    .or(`last_run_at.is.null,last_run_at.lt.${cutoff}`);
  if (jobsError) return NextResponse.json({ error: jobsError.message }, { status: 500 });
  if (!jobs || jobs.length === 0) return NextResponse.json({ ran: 0 });

  const agentIds = jobs.map(j => j.agent_id);
  const { data: agents, error: agentsError } = await supabaseAdmin
    .from('agents')
    .select('id, lesson_id, code')
    .in('id', agentIds);
  if (agentsError) return NextResponse.json({ error: agentsError.message }, { status: 500 });
  const agentById = new Map((agents ?? []).map(a => [a.id, a]));

  let ran = 0;
  const errors: string[] = [];
  for (const job of jobs) {
    const agent = agentById.get(job.agent_id);
    if (!agent) continue;
    try {
      const output = await runJobOnce(agent.lesson_id, agent.code, job.role);
      await supabaseAdmin.from('job_logs').insert([{ agent_id: agent.id, role: job.role, output }]);
      await supabaseAdmin.from('agent_jobs').update({ last_run_at: new Date().toISOString() }).eq('id', job.id);
      await awardAgentXp(agent.id, { xp: 8, intel: 1 });
      ran++;
    } catch (e) {
      errors.push(`${agent.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ ran, errors });
}

function checkSecret(provided: string | null): boolean {
  return !!provided && provided === process.env.CRON_SECRET;
}

// POST /api/cron/run-jobs — called by an external scheduler.
// Requires header `x-cron-secret` matching CRON_SECRET.
export async function POST(req: NextRequest) {
  if (!checkSecret(req.headers.get('x-cron-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runJobs();
}

// GET /api/cron/run-jobs?secret=... — same as POST, but triggerable from a browser address bar for local testing.
export async function GET(req: NextRequest) {
  if (!checkSecret(req.nextUrl.searchParams.get('secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runJobs();
}
