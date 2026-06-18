import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/serverAuth';

// GET /api/marketplace — browse active listings (public, no auth)
export async function GET() {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('marketplace_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!listings || listings.length === 0) return NextResponse.json([]);

    const agentIds = listings.map(l => l.agent_id);
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('id, name, lesson_id, code')
      .in('id', agentIds);

    if (agentsError) throw agentsError;

    // Only ever expose a capped preview slice of the code — full code is gated behind purchase/fork.
    const agentById = new Map((agents ?? []).map(a => {
      const previewLen = Math.min(600, Math.floor(a.code.length * 0.3));
      return [a.id, { id: a.id, name: a.name, lesson_id: a.lesson_id, code_preview: a.code.slice(0, previewLen), code_truncated: previewLen < a.code.length }];
    }));
    const { data: logs } = await supabaseAdmin
      .from('execution_logs')
      .select('agent_id')
      .in('agent_id', agentIds);

    const runCountByAgent = new Map<string, number>();
    for (const log of logs ?? []) {
      runCountByAgent.set(log.agent_id, (runCountByAgent.get(log.agent_id) ?? 0) + 1);
    }

    const merged = listings.map(l => ({
      ...l,
      agent: agentById.get(l.agent_id) ?? null,
      run_count: runCountByAgent.get(l.agent_id) ?? 0,
    }));

    return NextResponse.json(merged);
  } catch (error) {
    console.error('GET /api/marketplace error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch marketplace' },
      { status: 500 }
    );
  }
}
