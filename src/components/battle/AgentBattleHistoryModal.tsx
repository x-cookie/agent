'use client';

import { useEffect, useState } from 'react';

export type BattleHistoryEntry = {
  id: string;
  opponentName: string;
  result: 'win' | 'loss' | 'tie';
  createdAt: string;
  proofTx: string | null;
  scenario?: string;
  myOutput?: string;
  opponentOutput?: string;
  reasoning?: string;
};

const RESULT_META: Record<BattleHistoryEntry['result'], { label: string; color: string }> = {
  win: { label: 'Win', color: 'var(--green)' },
  loss: { label: 'Loss', color: '#ef4444' },
  tie: { label: 'Tie', color: 'var(--t3)' },
};

const HISTORY_PAGE_SIZE = 10;

const loadMoreBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: '5px',
  border: '0.5px solid var(--bd2)',
  background: 'transparent',
  color: 'var(--t2)',
  cursor: 'pointer',
  flexShrink: 0,
};

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Modal showing one agent's battle history. Public summary for anyone; full detail only if the viewer owns the agent (server-enforced). */
export function AgentBattleHistoryModal({ agentId, agentName, onClose }: { agentId: string; agentName: string; onClose: () => void }) {
  const [history, setHistory] = useState<BattleHistoryEntry[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);

  useEffect(() => {
    fetch(`/api/agents/${agentId}/battles`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : []))
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, [agentId]);

  const wins = history?.filter(h => h.result === 'win').length ?? 0;
  const losses = history?.filter(h => h.result === 'loss').length ?? 0;
  const visible = history?.slice(0, visibleCount) ?? [];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '20px', maxWidth: '460px', width: '90%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--t1)' }}>Battle History — {agentName}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '14px' }}>
          {history === null ? 'Loading…' : `${history.length} battles · ${wins}W / ${losses}L`}
        </p>

        {history !== null && history.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--t3)' }}>No battles yet.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visible.map(entry => (
              <div key={entry.id} style={{ border: '0.5px solid var(--bd2)', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
                <button
                  onClick={() => setOpenId(openId === entry.id ? null : entry.id)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--t2)' }}
                >
                  <span>vs {entry.opponentName}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: RESULT_META[entry.result].color, fontWeight: 500 }}>{RESULT_META[entry.result].label}</span>
                    <span style={{ color: 'var(--t4)' }}>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </span>
                </button>
                {openId === entry.id && (
                  <div style={{ padding: '10px', borderTop: '0.5px solid var(--bd2)', background: 'var(--bg)' }}>
                    {entry.reasoning ? (
                      <>
                        <p style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, marginBottom: '8px' }}>{entry.reasoning}</p>
                        {entry.proofTx && (
                          <a href={`https://explorer.solana.com/tx/${entry.proofTx}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: 'var(--green)' }}>
                            view on-chain proof
                          </a>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: '11px', color: 'var(--t3)' }}>
                        Detailed scenario and outputs are private to the agent&apos;s owner.
                        {entry.proofTx && (
                          <>
                            {' '}
                            <a href={`https://explorer.solana.com/tx/${entry.proofTx}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>
                              View on-chain proof
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {history !== null && visibleCount < history.length && (
              <button onClick={() => setVisibleCount(c => c + HISTORY_PAGE_SIZE)} style={loadMoreBtn}>
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
