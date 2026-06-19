import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

// GET /api/agents/[id]/battles — battle history for one agent (public summary;
// full scenario/output/reasoning only included for the agent's owner).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, user_id')
      .eq('id', id)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const auth = getUserFromRequest(req);
    const isOwner = auth?.userId === agent.user_id;

    const { data: battles, error: battlesError } = await supabaseAdmin
      .from('battles')
      .select('id, agent_a_id, agent_b_id, winner_agent_id, proof_tx, created_at, scenario, output_a, output_b, judge_reasoning')
      .or(`agent_a_id.eq.${id},agent_b_id.eq.${id}`)
      .order('created_at', { ascending: false });
    if (battlesError) throw battlesError;

    const opponentIds = (battles ?? []).map(b => (b.agent_a_id === id ? b.agent_b_id : b.agent_a_id));
    const { data: opponents } = await supabaseAdmin
      .from('agents')
      .select('id, name')
      .in('id', opponentIds.length > 0 ? opponentIds : ['00000000-0000-0000-0000-000000000000']);
    const opponentNameById = new Map((opponents ?? []).map(o => [o.id, o.name]));

    const history = (battles ?? []).map(b => {
      const opponentId = b.agent_a_id === id ? b.agent_b_id : b.agent_a_id;
      const result = b.winner_agent_id === id ? 'win' : b.winner_agent_id === opponentId ? 'loss' : 'tie';

      const base = {
        id: b.id,
        opponentId,
        opponentName: opponentNameById.get(opponentId) ?? 'Unknown agent',
        result,
        createdAt: b.created_at,
        proofTx: b.proof_tx,
      };

      if (!isOwner) return base;

      return {
        ...base,
        scenario: b.scenario,
        myOutput: b.agent_a_id === id ? b.output_a : b.output_b,
        opponentOutput: b.agent_a_id === id ? b.output_b : b.output_a,
        reasoning: b.judge_reasoning,
      };
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('GET /api/agents/[id]/battles error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch battle history' },
      { status: 500 }
    );
  }
}
