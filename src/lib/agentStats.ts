import { supabaseAdmin } from '@/lib/serverAuth';

const STAT_CAP = 100;

/** Rough estimated USDC market value, derived from level/wins/reputation. Display-only, not a price floor. */
export function estimateMarketValue(agent: { level: number; wins: number; reputation: number; lineageTx?: string | null }): number {
  const base = agent.level * 0.01 + agent.wins * 0.005 + agent.reputation * 0.002;
  const lineageBonus = agent.lineageTx ? 0.01 : 0;
  return Math.round((base + lineageBonus) * 10000) / 10000;
}

/** True once an agent has enough verifiable history (on-chain lineage + a few battles) to show a trust badge. */
export function isVerifiedPerformance(agent: { wins: number; losses: number; lineageTx?: string | null }): boolean {
  return !!agent.lineageTx && agent.wins + agent.losses >= 3;
}

/**
 * Adds xp and an optional power/intel/reputation delta to an agent, then recomputes
 * level from the new xp total (level N requires N*100 cumulative xp). Best-effort —
 * callers should not let a stats-update failure block the action that triggered it.
 */
export async function awardAgentXp(
  agentId: string,
  delta: { xp: number; power?: number; intel?: number; reputation?: number }
): Promise<{ leveledUp: boolean; newLevel: number } | null> {
  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('power, intel, reputation, xp, level')
    .eq('id', agentId)
    .single();
  if (error || !agent) return null;

  const newXp = agent.xp + delta.xp;
  let newLevel = agent.level;
  while (newXp >= newLevel * 100) newLevel++;

  await supabaseAdmin
    .from('agents')
    .update({
      xp: newXp,
      level: newLevel,
      power: Math.min(STAT_CAP, agent.power + (delta.power ?? 0)),
      intel: Math.min(STAT_CAP, agent.intel + (delta.intel ?? 0)),
      reputation: Math.min(STAT_CAP, agent.reputation + (delta.reputation ?? 0)),
    })
    .eq('id', agentId);

  return { leveledUp: newLevel > agent.level, newLevel };
}
