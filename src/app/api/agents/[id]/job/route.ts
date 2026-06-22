import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

const ROLES = ['trader', 'warrior', 'researcher'] as const;

// GET /api/agents/[id]/job — fetch the current job assignment (if any) for this agent.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('agent_jobs')
    .select('role, status, last_run_at')
    .eq('agent_id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

// POST /api/agents/[id]/job — assign or update a job for this agent. Owner-only.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Connect your wallet' }, { status: 401 });

  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('id, user_id')
    .eq('id', id)
    .single();
  if (agentError || !agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  if (agent.user_id !== auth.userId) return NextResponse.json({ error: 'Not your agent' }, { status: 403 });

  const { role, status } = await req.json();
  if (!ROLES.includes(role)) return NextResponse.json({ error: `Role must be one of: ${ROLES.join(', ')}` }, { status: 400 });
  const jobStatus = status === 'paused' ? 'paused' : 'active';

  const { error } = await supabaseAdmin
    .from('agent_jobs')
    .upsert({ agent_id: id, role, status: jobStatus }, { onConflict: 'agent_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, role, status: jobStatus });
}
