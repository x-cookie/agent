'use client';

import { useEffect, useState } from 'react';
import { agentStore, SavedAgent } from '@/lib/agentStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import { AgentBattleHistoryModal } from '@/components/battle/AgentBattleHistoryModal';

type LeaderboardEntry = { id: string; name: string; wins: number; losses: number; ownerWallet: string };

type BattleResult = {
  battleId: string;
  outputA: string;
  outputB: string;
  winner: 'a' | 'b' | 'tie';
  winnerAgentId: string | null;
  reasoning: string;
  proofTx?: string;
  forkedAgentId?: string;
};

type ChallengeOption = { agentId: string; name: string; ownerWallet: string };

const toggleBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  fontSize: '12px',
  fontWeight: 500,
  padding: '7px 10px',
  borderRadius: '5px',
  border: `0.5px solid ${active ? 'var(--acc)' : 'var(--bd2)'}`,
  background: active ? 'var(--bg2)' : 'transparent',
  color: active ? 'var(--t1)' : 'var(--t3)',
  cursor: 'pointer',
});

const selectStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '8px 10px',
  borderRadius: '5px',
  border: '0.5px solid var(--bd2)',
  background: 'var(--bg2)',
  color: 'var(--t2)',
  fontFamily: 'var(--sans)',
  width: '100%',
};

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function BattleArena() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [agentAId, setAgentAId] = useState('');
  const [agentBId, setAgentBId] = useState('');
  const [scenario, setScenario] = useState('');
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const [agentBMode, setAgentBMode] = useState<'own' | 'challenge'>('own');
  const [challengeOptions, setChallengeOptions] = useState<ChallengeOption[]>([]);

  const refreshAgents = () => {
    if (!user) return;
    agentStore.list().then(setAgents).catch(() => setAgents([]));
  };

  useEffect(() => {
    refreshAgents();
  }, [user]);

  useEffect(() => {
    fetch('/api/marketplace')
      .then(res => res.json())
      .then((data: { agent_id: string; price_lamports: number; seller_wallet: string; agent: { id: string; name: string } | null }[]) => {
        if (!Array.isArray(data)) return;
        const free = data
          .filter(l => l.price_lamports === 0 && l.agent && l.seller_wallet !== user?.wallet)
          .map(l => ({ agentId: l.agent!.id, name: l.agent!.name, ownerWallet: l.seller_wallet }));
        setChallengeOptions(free);
      })
      .catch(() => setChallengeOptions([]));
  }, [user]);

  const refreshLeaderboard = () => {
    fetch('/api/battles/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => setLeaderboard([]));
  };

  useEffect(() => {
    refreshLeaderboard();
  }, []);

  const handleFight = async () => {
    if (!agentAId || !agentBId) {
      showToast('Pick two agents first', 'error');
      return;
    }
    if (agentAId === agentBId) {
      showToast('Pick two different agents', 'error');
      return;
    }
    setFighting(true);
    setResult(null);
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ agentAId, agentBId, scenario: scenario.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Battle failed');
      setResult(data);
      refreshLeaderboard();
      if (data.forkedAgentId) {
        showToast(`Added a free copy of "${agentBName}" to My Agents`);
        refreshAgents();
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Battle failed', 'error');
    } finally {
      setFighting(false);
    }
  };

  const agentA = agents.find(a => a.id === agentAId);
  const agentBOwn = agents.find(a => a.id === agentBId);
  const agentBChallenge = challengeOptions.find(c => c.agentId === agentBId);
  const agentBName = agentBOwn?.name ?? agentBChallenge?.name ?? '';
  const agentB = agentBOwn ?? (agentBChallenge ? { name: agentBChallenge.name } : undefined);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
      <div style={{ minHeight: '320px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--t1)', marginBottom: '20px' }}>Battle Arena</h1>

        {!user ? (
          <p style={{ fontSize: '13px', color: 'var(--t2)', marginBottom: '24px' }}>Connect your wallet to battle your agents.</p>
        ) : (
          <>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--t3)' }}>Agent A — always one of your own agents</span>
              <select style={{ ...selectStyle, marginTop: '4px' }} value={agentAId} onChange={e => setAgentAId(e.target.value)}>
                <option value="">Agent A…</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--t3)' }}>Agent B</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', marginBottom: '8px' }}>
                <button
                  style={toggleBtn(agentBMode === 'own')}
                  onClick={() => { setAgentBMode('own'); setAgentBId(''); }}
                >
                  Battle your own agent
                </button>
                <button
                  style={toggleBtn(agentBMode === 'challenge')}
                  onClick={() => { setAgentBMode('challenge'); setAgentBId(''); }}
                >
                  Challenge someone else's agent
                </button>
              </div>

              {agentBMode === 'own' ? (
                <select style={selectStyle} value={agentBId} onChange={e => setAgentBId(e.target.value)}>
                  <option value="">Agent B…</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              ) : (
                <>
                  <select style={selectStyle} value={agentBId} onChange={e => setAgentBId(e.target.value)}>
                    <option value="">Pick a free public agent…</option>
                    {challengeOptions.map(c => (
                      <option key={c.agentId} value={c.agentId}>
                        {c.name} (by {c.ownerWallet.slice(0, 6)}…{c.ownerWallet.slice(-4)})
                      </option>
                    ))}
                  </select>
                  {challengeOptions.length === 0 && (
                    <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '6px' }}>No free public agents to challenge yet.</p>
                  )}
                  {agentBId && (
                    <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '6px' }}>
                      This will add a free copy of &quot;{agentBName}&quot; to your collection before battling.
                    </p>
                  )}
                </>
              )}
            </div>

            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder="Optional: describe a scenario for both agents to respond to. Leave blank for a default scenario."
              style={{ width: '100%', minHeight: '70px', padding: '10px', borderRadius: '5px', border: '0.5px solid var(--bd2)', background: 'var(--bg2)', color: 'var(--t1)', fontSize: '12px', fontFamily: 'var(--mono)', marginBottom: '12px', boxSizing: 'border-box' }}
            />

            <button
              onClick={handleFight}
              disabled={fighting}
              style={{ padding: '8px 18px', borderRadius: '5px', background: fighting ? 'var(--t4)' : 'var(--acc)', color: '#000', border: 'none', fontWeight: 500, cursor: fighting ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
            >
              {fighting ? 'Fighting…' : agentBMode === 'challenge' ? 'Fork & Fight' : 'Fight'}
            </button>
          </>
        )}

        {result && agentA && agentB && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', alignItems: 'start' }}>
            {[{ side: 'a' as const, agent: agentA, output: result.outputA }, { side: 'b' as const, agent: agentB, output: result.outputB }].map(({ side, agent, output }) => (
              <div key={side} style={{ display: 'flex', flexDirection: 'column', border: `0.5px solid ${result.winner === side ? 'var(--acc)' : 'var(--bd2)'}`, borderRadius: '8px', background: 'var(--bg2)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500, color: 'var(--t1)', padding: '10px 14px', borderBottom: '0.5px solid var(--bd2)' }}>
                  <span>{agent.name}</span>
                  {result.winner === side && <span style={{ fontSize: '10px', color: 'var(--acc)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Winner</span>}
                </div>
                <pre style={{ fontSize: '11px', color: 'var(--t2)', fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, padding: '14px', maxHeight: '420px', overflowY: 'auto' }}>{output}</pre>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div style={{ border: '0.5px solid var(--acc)', borderRadius: '8px', background: 'var(--bg2)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 600, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              <i className="ti ti-gavel" aria-hidden />
              Judge's verdict {result.winner === 'tie' && '— Tie'}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--t1)', lineHeight: 1.5, margin: 0 }}>{result.reasoning}</p>
            {result.proofTx && (
              <a
                href={`https://explorer.solana.com/tx/${result.proofTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--green)', marginTop: '10px', textDecoration: 'none' }}
              >
                <i className="ti ti-link" style={{ fontSize: '12px' }} aria-hidden />
                view on-chain proof
              </a>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'sticky', top: '76px', borderLeft: '0.5px solid var(--bd2)', paddingLeft: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--t1)', marginBottom: '20px' }}>Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--t3)' }}>No battles yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {leaderboard.map((entry, i) => {
              const total = entry.wins + entry.losses;
              const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;
              return (
                <div
                  key={entry.id}
                  className="leaderboard-entry"
                  onClick={() => setHistoryTarget({ id: entry.id, name: entry.name })}
                  style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: 'var(--t2)', padding: '8px 10px', border: '0.5px solid var(--bd2)', borderRadius: '5px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>#{i + 1} {entry.name}</span>
                    <span>{winRate}% ({entry.wins}W / {entry.losses}L)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
                      by {entry.ownerWallet.slice(0, 8)}…{entry.ownerWallet.slice(-8)}
                    </span>
                    <span className="leaderboard-entry-hint" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--t3)' }}>
                      <i className="ti ti-sword" style={{ fontSize: '10px' }} aria-hidden />
                      View history
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {historyTarget && (
        <AgentBattleHistoryModal agentId={historyTarget.id} agentName={historyTarget.name} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
