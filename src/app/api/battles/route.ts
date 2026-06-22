import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { callAgentForScenario, judgeBattle } from '@/lib/battleJudge';
import { recordBattleProof } from '@/lib/serverWallet';
import { awardAgentXp } from '@/lib/agentStats';

const DEFAULT_SCENARIO =
  'A user asks: "I need to decide between two approaches under uncertainty and a tight deadline — walk me through how you would handle this." Respond as your agent would.';

// POST /api/battles — pit two of the caller's own agents against a shared scenario
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`battle:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many battles, slow down and try again in a minute.' }, { status: 429 });
    }

    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Connect your wallet to start a battle' }, { status: 401 });

    const { agentAId, agentBId, scenario } = await req.json();
    if (!agentAId || !agentBId) {
      return NextResponse.json({ error: 'agentAId and agentBId are required' }, { status: 400 });
    }
    if (agentAId === agentBId) {
      return NextResponse.json({ error: 'Pick two different agents' }, { status: 400 });
    }

    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('id, name, lesson_id, code, user_id, wins, losses')
      .in('id', [agentAId, agentBId]);
    if (agentsError) throw agentsError;

    const agentA = agents?.find(a => a.id === agentAId);
    let agentB = agents?.find(a => a.id === agentBId);
    if (!agentA || !agentB) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (agentA.user_id !== auth.userId) {
      return NextResponse.json({ error: "Agent A must be one of your own agents" }, { status: 403 });
    }

    let forkedAgentId: string | undefined;

    // Challenging someone else's agent: it must be freely listed, and we fork
    // a copy into the caller's own collection before battling with it.
    if (agentB.user_id !== auth.userId) {
      const { data: listing } = await supabaseAdmin
        .from('marketplace_listings')
        .select('price_lamports')
        .eq('agent_id', agentB.id)
        .eq('is_active', true)
        .single();
      if (!listing || listing.price_lamports > 0) {
        return NextResponse.json(
          { error: 'This agent must be purchased, or freely listed on the marketplace, before you can battle it.' },
          { status: 403 }
        );
      }

      const { data: forkedAgent, error: forkError } = await supabaseAdmin
        .from('agents')
        .insert([{
          user_id: auth.userId,
          lesson_id: agentB.lesson_id,
          name: `${agentB.name} (forked)`,
          code: agentB.code,
          parent_agent_id: agentB.id,
          source: 'forked_free',
        }])
        .select('id, name, lesson_id, code, user_id, wins, losses')
        .single();
      if (forkError) throw forkError;
      agentB = forkedAgent;
      forkedAgentId = forkedAgent.id;
    }

    const battleScenario = (typeof scenario === 'string' && scenario.trim()) || DEFAULT_SCENARIO;

    const [outputA, outputB] = await Promise.all([
      callAgentForScenario(agentA.lesson_id, agentA.code, battleScenario),
      callAgentForScenario(agentB.lesson_id, agentB.code, battleScenario),
    ]);

    const { winner, reasoning } = await judgeBattle(battleScenario, agentA.name, outputA, agentB.name, outputB);
    const winnerAgentId = winner === 'a' ? agentA.id : winner === 'b' ? agentB.id : null;

    const { data: battleRow, error: insertError } = await supabaseAdmin
      .from('battles')
      .insert([{
        agent_a_id: agentA.id,
        agent_b_id: agentB.id,
        scenario: battleScenario,
        output_a: outputA,
        output_b: outputB,
        winner_agent_id: winnerAgentId,
        judge_reasoning: reasoning,
        created_by: auth.wallet,
      }])
      .select()
      .single();
    if (insertError) throw insertError;

    let levelUp: { agentId: string; agentName: string; newLevel: number } | undefined;
    if (winnerAgentId) {
      const loserAgentId = winnerAgentId === agentA.id ? agentB.id : agentA.id;
      const winnerRow = winnerAgentId === agentA.id ? agentA : agentB;
      const loserRow = winnerAgentId === agentA.id ? agentB : agentA;
      await supabaseAdmin.from('agents').update({ wins: (winnerRow.wins ?? 0) + 1 }).eq('id', winnerAgentId);
      await supabaseAdmin.from('agents').update({ losses: (loserRow.losses ?? 0) + 1 }).eq('id', loserAgentId);
      const winnerXp = await awardAgentXp(winnerAgentId, { xp: 20, power: 2 });
      await awardAgentXp(loserAgentId, { xp: 5 });
      if (winnerXp?.leveledUp) levelUp = { agentId: winnerAgentId, agentName: winnerRow.name, newLevel: winnerXp.newLevel };
    }

    let proofTx: string | undefined;
    try {
      const proof = await recordBattleProof({ battleId: battleRow.id, winner, outputA, outputB });
      proofTx = proof.proofTx;
      await supabaseAdmin.from('battles').update({ proof_tx: proof.proofTx }).eq('id', battleRow.id);
    } catch (proofError) {
      // Best-effort: a missing/unfunded signer shouldn't block the battle result.
      console.error('Failed to record battle proof:', proofError);
    }

    return NextResponse.json({
      battleId: battleRow.id,
      outputA,
      outputB,
      winner,
      winnerAgentId,
      reasoning,
      proofTx,
      forkedAgentId,
      levelUp,
    });
  } catch (error) {
    console.error('POST /api/battles error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Battle failed' },
      { status: 500 }
    );
  }
}
