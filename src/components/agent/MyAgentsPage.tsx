'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agentStore, SavedAgent, AgentSource } from '@/lib/agentStore';
import { useAuth } from '@/hooks/useAuth';
import { getLessonByFolder } from '@/lib/lessons';
import { registerLineageOnChain } from '@/lib/lineage';
import { useToast } from '@/components/shared/Toast';
import { AgentBattleHistoryModal } from '@/components/battle/AgentBattleHistoryModal';

export function MyAgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | AgentSource>('all');

  const refresh = async () => {
    try {
      const list = await agentStore.list();
      setAgents(list);
    } catch (e) {
      console.error('Failed to load agents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, user]); // reload when auth state settles/changes

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: '10px' }}>
          your collection
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          My Agents
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--t2)', marginTop: '8px', lineHeight: 1.65, maxWidth: '460px' }}>
          {user
            ? 'Saved to your wallet — synced across devices.'
            : 'Saved locally in this browser. Connect a wallet to sync across devices.'}
        </p>
      </div>

      {/* Filter tabs */}
      {!loading && agents.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {(['all', 'created', 'forked_free', 'purchased'] as const).map(key => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: '5px',
                border: `0.5px solid ${sourceFilter === key ? 'var(--acc)' : 'var(--bd2)'}`,
                background: sourceFilter === key ? 'var(--bg2)' : 'transparent',
                color: sourceFilter === key ? 'var(--t1)' : 'var(--t3)',
                cursor: 'pointer',
              }}
            >
              {key === 'all' ? 'All' : SOURCE_META[key].label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <EmptyState label="Loading agents…" />
      ) : agents.length === 0 ? (
        <EmptyState
          label="No saved agents yet."
          action={
            <Link href="/learn" style={linkBtnStyle}>
              <i className="ti ti-player-play" style={{ fontSize: '14px' }} aria-hidden />
              Start a lesson
            </Link>
          }
        />
      ) : (
        (() => {
          const visible = sourceFilter === 'all' ? agents : agents.filter(a => a.source === sourceFilter);
          if (visible.length === 0) {
            return <EmptyState label="No agents match this filter." />;
          }
          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {visible.map(agent => (
                <AgentCard key={agent.id} agent={agent} onUpdate={refresh} canDeploy={!!user} />
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}

function EmptyState({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        border: '0.5px dashed var(--bd2)',
        borderRadius: '10px',
        background: 'var(--bg2)',
        padding: '56px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'var(--bg3)',
          border: '0.5px solid var(--bd2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="ti ti-robot" style={{ fontSize: '20px', color: 'var(--t3)' }} aria-hidden />
      </div>
      <span style={{ fontSize: '13px', color: 'var(--t2)' }}>{label}</span>
      {action}
    </div>
  );
}

const SOURCE_META: Record<AgentSource, { label: string; color: string; bg: string; border: string }> = {
  created: { label: 'Created', color: 'var(--purple)', bg: 'transparent', border: 'var(--bd2)' },
  forked_free: { label: 'Forked', color: 'var(--t2)', bg: 'var(--bg3)', border: 'var(--bd2)' },
  purchased: { label: 'Purchased', color: 'var(--acc)', bg: 'transparent', border: 'var(--acc)' },
};

function SourceBadge({ source }: { source: AgentSource }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.created;
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: '3px',
        color: meta.color,
        background: meta.bg,
        border: `0.5px solid ${meta.border}`,
        fontFamily: 'var(--mono)',
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  );
}

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  fontWeight: 500,
  padding: '8px 18px',
  borderRadius: '6px',
  background: 'var(--acc)',
  color: '#000',
  textDecoration: 'none',
};

function AgentCard({ agent, onUpdate, canDeploy }: { agent: SavedAgent; onUpdate: () => void; canDeploy: boolean }) {
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(agent.name);
  const [busy, setBusy] = useState(false);
  const [deploySlug, setDeploySlug] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isListed, setIsListed] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState('0');
  const [listDesc, setListDesc] = useState('');
  const [lineageTx, setLineageTx] = useState<string | null>(null);
  const { showToast } = useToast();

  const lesson = getLessonByFolder(agent.lessonId);
  const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (!canDeploy) return;
    fetch(`/api/agents/${agent.id}/deploy`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : null))
      .then(d => setDeploySlug(d && d.is_public ? d.public_url : null))
      .catch(() => {});
    fetch(`/api/agents/${agent.id}/list`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : null))
      .then(d => setIsListed(!!(d && d.is_active)))
      .catch(() => {});
    fetch(`/api/agents/${agent.id}`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : null))
      .then(d => setLineageTx(d?.lineage_tx ?? null))
      .catch(() => {});
  }, [agent.id, canDeploy]);

  const handleDeploy = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/deploy`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error('Deploy failed');
      const data = await res.json();
      setDeploySlug(data.public_url);
    } catch (e) {
      console.error('Deploy failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/deploy`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Unpublish failed');
      setDeploySlug(null);
    } catch (e) {
      console.error('Unpublish failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = () => {
    if (!deploySlug) return;
    const url = `${window.location.origin}/p/${deploySlug}`;
    navigator.clipboard.writeText(url);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus(null), 1500);
  };

  const handleList = async () => {
    setBusy(true);
    try {
      let newLineageTx: string | undefined;
      if (!lineageTx) {
        showToast('Sign in Phantom to register this agent on-chain…', 'success');
        newLineageTx = await registerLineageOnChain(agent.id, agent.code);
      }

      const priceLamports = Math.round(parseFloat(listPrice || '0') * 1_000_000_000);
      const res = await fetch(`/api/agents/${agent.id}/list`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ priceLamports, description: listDesc.trim() || null, lineageTx: newLineageTx }),
      });
      if (!res.ok) throw new Error('List failed');
      setIsListed(true);
      setShowListModal(false);
      if (newLineageTx) setLineageTx(newLineageTx);
    } catch (e) {
      console.error('List failed:', e);
      showToast(e instanceof Error ? e.message : 'List failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlist = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/list`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Unlist failed');
      setIsListed(false);
    } catch (e) {
      console.error('Unlist failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === agent.name) {
      setShowRename(false);
      return;
    }
    setBusy(true);
    try {
      await agentStore.rename(agent.id, newName.trim());
      setShowRename(false);
      onUpdate();
    } catch (e) {
      console.error('Rename failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${agent.name}"?`)) return;
    setBusy(true);
    try {
      await agentStore.delete(agent.id);
      onUpdate();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        border: '0.5px solid var(--bd2)',
        borderRadius: '10px',
        background: 'var(--bg2)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className={`ti ${lesson?.icon ?? 'ti-robot'}`} style={{ fontSize: '15px', color: 'var(--purple)' }} aria-hidden />
          <span style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
            {lesson ? `${String(lesson.num).padStart(2, '0')} · ${lesson.title}` : agent.lessonId}
          </span>
        </div>
        <SourceBadge source={agent.source} />
      </div>

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t1)' }}>{agent.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
            {new Date(agent.createdAt).toLocaleDateString()}
          </span>
          {lineageTx && (
            <a
              href={`https://explorer.solana.com/tx/${lineageTx}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '9px', color: 'var(--green)', fontFamily: 'var(--mono)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              <i className="ti ti-link" style={{ fontSize: '10px' }} aria-hidden />
              on-chain
            </a>
          )}
        </div>
      </div>

      {/* Code preview */}
      <div
        style={{
          flex: 1,
          minHeight: '72px',
          background: 'var(--bg)',
          border: '0.5px solid var(--bd)',
          borderRadius: '6px',
          padding: '10px',
          overflow: 'hidden',
        }}
      >
        <code style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
          {agent.code.slice(0, 160)}
          {agent.code.length > 160 ? '…' : ''}
        </code>
      </div>

      {/* Actions */}
      {!showRename ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Link href={`/learn/${agent.lessonId}?loadAgent=${agent.id}`} style={{ ...cardPrimaryBtn, flex: 1 }}>
              <i className="ti ti-external-link" style={{ fontSize: '12px' }} aria-hidden />
              Open
            </Link>
            <button onClick={() => setShowRename(true)} disabled={busy} style={{ ...cardGhostBtn, flex: 1 }}>
              Rename
            </button>
            <button onClick={handleDelete} disabled={busy} style={{ ...cardGhostBtn, flex: 1, color: '#ef4444' }}>
              Delete
            </button>
          </div>
          {canDeploy && (
            <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '0.5px solid var(--bd)' }}>
              {deploySlug ? (
                <>
                  <button onClick={handleCopyLink} disabled={busy} style={{ ...cardGhostBtn, flex: 1, color: 'var(--green)', border: '0.5px solid var(--green2)' }}>
                    <i className="ti ti-link" style={{ fontSize: '12px' }} aria-hidden />
                    {copyStatus ?? 'Copy public link'}
                  </button>
                  <button onClick={handleUnpublish} disabled={busy} style={cardGhostBtn}>
                    Unpublish
                  </button>
                </>
              ) : (
                <button onClick={handleDeploy} disabled={busy} style={{ ...cardGhostBtn, flex: 1 }}>
                  <i className="ti ti-world" style={{ fontSize: '12px' }} aria-hidden />
                  Make public
                </button>
              )}
            </div>
          )}
          {canDeploy && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {isListed ? (
                <button onClick={handleUnlist} disabled={busy} style={{ ...cardGhostBtn, flex: 1, color: 'var(--purple)' }}>
                  <i className="ti ti-shopping-cart" style={{ fontSize: '12px' }} aria-hidden />
                  Unlist from marketplace
                </button>
              ) : (
                <button onClick={() => setShowListModal(true)} disabled={busy} style={{ ...cardGhostBtn, flex: 1, color: 'var(--purple)' }}>
                  <i className="ti ti-shopping-cart" style={{ fontSize: '12px' }} aria-hidden />
                  List on marketplace
                </button>
              )}
            </div>
          )}
          <BattleHistory agentId={agent.id} agentName={agent.name} authHeaders={authHeaders} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            style={{
              flex: 1,
              fontSize: '12px',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '0.5px solid var(--bd2)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              outline: 'none',
            }}
          />
          <button onClick={handleRename} disabled={busy} style={{ ...cardGhostBtn, color: 'var(--green)', border: '0.5px solid var(--green2)' }}>
            Save
          </button>
          <button onClick={() => setShowRename(false)} disabled={busy} style={cardGhostBtn}>
            Cancel
          </button>
        </div>
      )}

      {showListModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowListModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '24px', maxWidth: '380px', width: '90%' }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px' }}>
              List &ldquo;{agent.name}&rdquo; on marketplace
            </h3>
            <label style={{ fontSize: '11px', color: 'var(--t3)', display: 'block', marginBottom: '4px' }}>Price (SOL, 0 = free)</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={listPrice}
              onChange={e => setListPrice(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '0.5px solid var(--bd2)', background: 'var(--bg)', color: 'var(--t1)', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <label style={{ fontSize: '11px', color: 'var(--t3)', display: 'block', marginBottom: '4px' }}>Description (optional)</label>
            <textarea
              value={listDesc}
              onChange={e => setListDesc(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '0.5px solid var(--bd2)', background: 'var(--bg)', color: 'var(--t1)', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', resize: 'none', fontFamily: 'var(--sans)' }}
              placeholder="What does this agent do?"
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleList}
                disabled={busy}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'var(--acc)', color: '#000', border: 'none', fontWeight: 500, cursor: 'pointer' }}
              >
                List it
              </button>
              <button
                onClick={() => setShowListModal(false)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'transparent', border: '0.5px solid var(--bd2)', color: 'var(--t2)', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BattleHistory({ agentId, agentName, authHeaders }: { agentId: string; agentName: string; authHeaders: () => HeadersInit }) {
  const [battleCount, setBattleCount] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${agentId}/battles`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : []))
      .then(data => setBattleCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setBattleCount(0));
  }, [agentId]);

  if (!battleCount) return null;

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ ...cardGhostBtn, width: '100%' }}>
        <i className="ti ti-sword" style={{ fontSize: '12px' }} aria-hidden />
        Battle history ({battleCount})
      </button>
      {showModal && (
        <AgentBattleHistoryModal agentId={agentId} agentName={agentName} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

const cardPrimaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  fontSize: '11px',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: '5px',
  background: 'var(--acc)',
  color: '#000',
  textDecoration: 'none',
  cursor: 'pointer',
};

const cardGhostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  fontSize: '11px',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: '5px',
  border: '0.5px solid var(--bd2)',
  background: 'transparent',
  color: 'var(--t2)',
  cursor: 'pointer',
};
