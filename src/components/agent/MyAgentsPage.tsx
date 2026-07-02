'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { agentStore, SavedAgent, AgentSource } from '@/lib/agentStore';
import { useAuth } from '@/hooks/useAuth';
import { getLessonByFolder, LESSONS } from '@/lib/lessons';
import { registerLineageOnChain } from '@/lib/lineage';
import { useToast } from '@/components/shared/Toast';
import { AgentBattleHistoryModal } from '@/components/battle/AgentBattleHistoryModal';
import { badgeImageForLesson } from '@/lib/badgeAssets';

export function MyAgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | AgentSource>('all');
  const [badges, setBadges] = useState<{ lesson_id: string; badge_tx: string | null }[]>([]);

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

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;
    fetch('/api/badges', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : []))
      .then(d => Array.isArray(d) && setBadges(d))
      .catch(() => {});
  }, [user]);

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

      {/* Skill badge collection — mastery earned across lessons */}
      {user && (
        <div style={{ marginBottom: '28px', background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '10px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image src={badgeImageForLesson(1)} alt="" width={16} height={16} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t1)' }}>Skill Badges</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
              {badges.length}/{LESSONS.length} earned
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {LESSONS.map(l => {
              const earned = badges.find(b => b.lesson_id === l.folder);
              const chip = (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '10px', fontFamily: 'var(--mono)',
                  color: earned ? 'var(--t2)' : 'var(--t4)',
                  background: earned ? 'var(--bg)' : 'transparent',
                  border: `0.5px solid ${earned ? 'var(--bd2)' : 'var(--bd)'}`,
                  padding: '4px 8px', borderRadius: '4px',
                  opacity: earned ? 1 : 0.5,
                }}>
                  {earned ? (
                    <Image src={badgeImageForLesson(l.num)} alt="" width={14} height={14} />
                  ) : (
                    <i className={`ti ${l.icon}`} style={{ fontSize: '11px', color: 'var(--t4)' }} aria-hidden />
                  )}
                  {l.title}
                </span>
              );
              return earned?.badge_tx ? (
                <a key={l.folder} href={`https://explorer.solana.com/tx/${earned.badge_tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{chip}</a>
              ) : (
                <span key={l.folder}>{chip}</span>
              );
            })}
          </div>
          {badges.length === 0 && (
            <p style={{ fontSize: '11px', color: 'var(--t4)', marginTop: '10px', marginBottom: 0 }}>
              Complete a lesson to earn your first badge — agents you build from it start stronger.
            </p>
          )}
        </div>
      )}

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

interface AuditSubscores {
  reasoning_loop: number;
  tool_definitions: number;
  error_handling: number;
  prompt_design: number;
}

interface AuditFix {
  issue: string;
  fix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface AuditReport {
  grade: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  fixes: AuditFix[];
  subscores: AuditSubscores;
  timestamp: string;
  lessonId: number;
}

interface AuditResult {
  json: AuditReport;
  markdown: string;
}

function AgentCard({ agent, onUpdate, canDeploy }: { agent: SavedAgent; onUpdate: () => void; canDeploy: boolean }) {
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(agent.name);
  const [busy, setBusy] = useState(false);
  const [deploySlug, setDeploySlug] = useState<string | null>(null);
  const [deployPrice, setDeployPrice] = useState(0);
  const [priceInput, setPriceInput] = useState('0');
  const [priceSaved, setPriceSaved] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isListed, setIsListed] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState('0');
  const [listDesc, setListDesc] = useState('');
  const [payoutEvmAddress, setPayoutEvmAddress] = useState<string | null>(null);
  const [connectingEvm, setConnectingEvm] = useState(false);
  const [lineageTx, setLineageTx] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
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
      .then(d => {
        setDeploySlug(d && d.is_public ? d.public_url : null);
        if (d) {
          setDeployPrice(Number(d.price_usd) || 0);
          setPriceInput(String(d.price_usd ?? '0'));
        }
      })
      .catch(() => {});
    fetch(`/api/agents/${agent.id}/list`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : null))
      .then(d => {
        setIsListed(!!(d && d.is_active));
        if (d?.payout_evm_address) setPayoutEvmAddress(d.payout_evm_address);
        if (d?.price_usd) setListPrice(String(d.price_usd));
      })
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
      setDeployPrice(Number(data.price_usd) || 0);
      setPriceInput(String(data.price_usd ?? '0'));
    } catch (e) {
      console.error('Deploy failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleSetPrice = async () => {
    const price = parseFloat(priceInput || '0');
    if (!Number.isFinite(price) || price < 0) {
      showToast('Enter a valid price', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/deploy`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ priceUsd: price }),
      });
      if (!res.ok) throw new Error('Failed to set price');
      setDeployPrice(price);
      setEditingPrice(false);
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 1500);
    } catch (e) {
      console.error('Set price failed:', e);
      showToast(e instanceof Error ? e.message : 'Failed to set price', 'error');
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

  const handleConnectEvm = async () => {
    setConnectingEvm(true);
    try {
      const phantom = (window as any).phantom;
      const provider = phantom?.ethereum || ((window as any).ethereum?.isPhantom ? (window as any).ethereum : null);
      if (!provider) throw new Error('Phantom EVM wallet not found. Enable "Ethereum" networks in Phantom settings.');
      const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts[0]) throw new Error('No EVM account returned by Phantom');
      setPayoutEvmAddress(accounts[0]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to connect Phantom EVM wallet', 'error');
    } finally {
      setConnectingEvm(false);
    }
  };

  const handleList = async () => {
    const price = parseFloat(listPrice || '0');
    if (price > 0 && !payoutEvmAddress) {
      showToast('Connect a Phantom EVM (Base) wallet to receive USDC payouts first', 'error');
      return;
    }
    setBusy(true);
    try {
      let newLineageTx: string | undefined;
      if (!lineageTx) {
        showToast('Sign in Phantom to register this agent on-chain…', 'success');
        newLineageTx = await registerLineageOnChain(agent.id, agent.code);
      }

      const res = await fetch(`/api/agents/${agent.id}/list`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ priceUsd: price, payoutEvmAddress, description: listDesc.trim() || null, lineageTx: newLineageTx }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'List failed');
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

  const handleQuickAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const response = await fetch('/api/auditor/audit', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: agent.code, lessonId: parseInt(agent.lessonId) || 1 }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setAuditError(errorData.error || 'Audit failed');
        return;
      }
      const data = await response.json();
      setAuditResult(data);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Audit request failed');
    } finally {
      setAuditLoading(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          <Link href={`/agents/${agent.id}`} style={{ fontSize: '9px', color: 'var(--t1)', fontFamily: 'var(--mono)', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', padding: '2px 6px', borderRadius: '3px', textDecoration: 'none' }}>
            LVL {agent.level} · profile
          </Link>
          <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
            ⚔ {agent.power} · 🧠 {agent.intel} · ★ {agent.reputation}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
            {agent.xp} xp
          </span>
        </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={handleCopyLink} disabled={busy} style={{ ...cardGhostBtn, flex: 1, color: 'var(--green)', border: '0.5px solid var(--green2)' }}>
                      <i className="ti ti-link" style={{ fontSize: '12px' }} aria-hidden />
                      {copyStatus ?? 'Copy public link'}
                    </button>
                    <button onClick={handleUnpublish} disabled={busy} style={cardGhostBtn}>
                      Unpublish
                    </button>
                  </div>
                  {editingPrice ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSetPrice()}
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          background: 'var(--bg)',
                          border: '0.5px solid var(--bd2)',
                          color: 'var(--t1)',
                          fontFamily: 'var(--mono)',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>USDC</span>
                      <button
                        onClick={handleSetPrice}
                        disabled={busy || parseFloat(priceInput || '0') === deployPrice}
                        style={cardGhostBtn}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setPriceInput(String(deployPrice)); setEditingPrice(false); }}
                        disabled={busy}
                        style={cardGhostBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontFamily: 'var(--mono)',
                          color: deployPrice > 0 ? 'var(--green)' : 'var(--t3)',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          background: 'var(--bg)',
                          border: '0.5px solid var(--bd2)',
                        }}
                      >
                        <i className={`ti ${deployPrice > 0 ? 'ti-circle-check' : 'ti-circle-dashed'}`} style={{ fontSize: '12px' }} aria-hidden />
                        {deployPrice > 0 ? `$${deployPrice} USDC — live` : 'Free — live'}
                        {priceSaved && <span style={{ color: 'var(--green)' }}>· Saved</span>}
                      </span>
                      <button onClick={() => setEditingPrice(true)} disabled={busy} style={cardGhostBtn}>
                        Edit price
                      </button>
                    </div>
                  )}
                  <span style={{ fontSize: '10px', color: 'var(--t4)' }}>
                    {deployPrice > 0
                      ? `Runners pay $${deployPrice} USDC via x402 (Phantom, Base Sepolia) before each run.`
                      : 'Free to run. Set a price to gate runs behind x402 USDC payment.'}
                  </span>
                </div>
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
          <button
            onClick={handleQuickAudit}
            disabled={auditLoading}
            style={{ ...cardGhostBtn, width: '100%', color: 'var(--purple)', border: '0.5px solid var(--purple)' }}
          >
            <i className="ti ti-checkup-list" style={{ fontSize: '12px' }} aria-hidden />
            {auditLoading ? 'Auditing…' : 'Quick Audit'}
          </button>
          <Link href="/missions" style={{ ...cardGhostBtn, width: '100%' }}>
            <i className="ti ti-briefcase" style={{ fontSize: '12px' }} aria-hidden />
            Send to mission
          </Link>
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

      {/* Audit Results */}
      {auditError && (
        <div
          style={{
            padding: '10px',
            background: '#2c1414',
            border: '0.5px solid #8b3a3a',
            borderRadius: '6px',
            color: '#ff6b6b',
            fontSize: '12px',
          }}
        >
          <strong>Audit error:</strong> {auditError}
          <button
            onClick={() => setAuditError(null)}
            style={{ float: 'right', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {auditResult && (
        <div
          style={{
            padding: '12px',
            background: 'var(--bg)',
            border: '0.5px solid var(--bd2)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '12px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--purple)' }}>{auditResult.json.grade}</span>
              <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                {auditResult.json.score}/100
              </span>
            </div>
            <button
              onClick={() => setAuditResult(null)}
              style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>

          {/* Summary */}
          <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.4 }}>
            {auditResult.json.summary}
          </div>

          {/* Strengths */}
          {auditResult.json.strengths.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--green)', marginBottom: '4px' }}>Strengths</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: 'var(--t3)' }}>
                {auditResult.json.strengths.slice(0, 2).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {auditResult.json.weaknesses.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#ff6b6b', marginBottom: '4px' }}>Weaknesses</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: 'var(--t3)' }}>
                {auditResult.json.weaknesses.slice(0, 2).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Subscores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
            <div style={{ color: 'var(--t4)' }}>
              Loop: <span style={{ color: 'var(--t2)' }}>{auditResult.json.subscores.reasoning_loop}</span>
            </div>
            <div style={{ color: 'var(--t4)' }}>
              Tools: <span style={{ color: 'var(--t2)' }}>{auditResult.json.subscores.tool_definitions}</span>
            </div>
            <div style={{ color: 'var(--t4)' }}>
              Error: <span style={{ color: 'var(--t2)' }}>{auditResult.json.subscores.error_handling}</span>
            </div>
            <div style={{ color: 'var(--t4)' }}>
              Prompt: <span style={{ color: 'var(--t2)' }}>{auditResult.json.subscores.prompt_design}</span>
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: '9px', color: 'var(--t4)', borderTop: '0.5px solid var(--bd)', paddingTop: '6px' }}>
            {new Date(auditResult.json.timestamp).toLocaleString()}
          </div>
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
            <label style={{ fontSize: '11px', color: 'var(--t3)', display: 'block', marginBottom: '4px' }}>Price (USDC, 0 = free)</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={listPrice}
              onChange={e => setListPrice(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '0.5px solid var(--bd2)', background: 'var(--bg)', color: 'var(--t1)', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            {parseFloat(listPrice || '0') > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--t3)', display: 'block', marginBottom: '4px' }}>USDC payout wallet (Base)</label>
                {payoutEvmAddress ? (
                  <div style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ti ti-check" style={{ fontSize: '12px' }} aria-hidden />
                    {payoutEvmAddress.slice(0, 6)}…{payoutEvmAddress.slice(-4)}
                    <button onClick={handleConnectEvm} disabled={connectingEvm} style={{ fontSize: '10px', color: 'var(--t3)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectEvm}
                    disabled={connectingEvm}
                    style={{ ...cardGhostBtn, width: '100%' }}
                  >
                    <i className="ti ti-wallet" style={{ fontSize: '12px' }} aria-hidden />
                    {connectingEvm ? 'Connecting…' : 'Connect Phantom (Base)'}
                  </button>
                )}
              </div>
            )}
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
