'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { getLessonByFolder, STAGES, LESSONS } from '@/lib/lessons';
import { useAuth } from '@/hooks/useAuth';
import { runWithX402Payment } from '@/lib/payX402';
import { useToast } from '@/components/shared/Toast';

type Listing = {
  id: string;
  agent_id: string;
  seller_wallet: string;
  price_usd: number;
  payout_evm_address: string | null;
  description: string | null;
  created_at: string;
  agent: { id: string; name: string; lesson_id: string; code_preview: string; code_truncated: boolean; wins: number; losses: number; level: number; reputation: number; market_value: number; verified: boolean } | null;
  run_count: number;
};

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'level_desc' | 'verified_first';

function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const sorted = [...listings];
  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price_usd - b.price_usd);
    case 'price_desc':
      return sorted.sort((a, b) => b.price_usd - a.price_usd);
    case 'popular':
      return sorted.sort((a, b) => b.run_count - a.run_count);
    case 'level_desc':
      return sorted.sort((a, b) => (b.agent?.level ?? 0) - (a.agent?.level ?? 0));
    case 'verified_first':
      return sorted.sort((a, b) => Number(b.agent?.verified ?? false) - Number(a.agent?.verified ?? false));
    default:
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

function ListingSkeleton() {
  const bar = (width: string, height = '10px'): React.CSSProperties => ({
    width,
    height,
    borderRadius: '3px',
    background: 'var(--bg3)',
    animation: 'pulse 1.4s ease-in-out infinite',
  });

  return (
    <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '10px', background: 'var(--bg2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={bar('60%')} />
      <div style={bar('80%', '14px')} />
      <div style={bar('100%')} />
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid var(--bd)' }}>
        <div style={bar('40px')} />
        <div style={bar('60px')} />
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '6px 10px',
  borderRadius: '5px',
  border: '0.5px solid var(--bd2)',
  background: 'var(--bg2)',
  color: 'var(--t2)',
  fontFamily: 'var(--sans)',
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [patternFilter, setPatternFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/marketplace')
      .then(res => res.json())
      .then(data => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: '10px' }}>
            agent economy
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Marketplace
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--t2)', marginTop: '8px', lineHeight: 1.65, maxWidth: '480px' }}>
            Browse agents listed by other builders. Paid agents charge USDC via x402 (Base Sepolia) — connect Phantom to run them.
          </p>
        </div>

        {!loading && listings.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All stages</option>
              {STAGES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <select
              value={patternFilter}
              onChange={e => setPatternFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All patterns mastered</option>
              {LESSONS.map(l => (
                <option key={l.folder} value={l.folder}>{l.title}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={selectStyle}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most run</option>
              <option value="level_desc">Highest level</option>
              <option value="verified_first">Verified first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        )}

        {(() => {
          const filtered = listings
            .filter(l => stageFilter === 'all' || (l.agent && getLessonByFolder(l.agent.lesson_id)?.stage === stageFilter))
            .filter(l => patternFilter === 'all' || l.agent?.lesson_id === patternFilter);
          const visible = sortListings(filtered, sort);

          if (loading) {
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
                {[0, 1, 2].map(i => <ListingSkeleton key={i} />)}
              </div>
            );
          }

          if (listings.length === 0) {
            return (
              <div style={{ border: '0.5px dashed var(--bd2)', borderRadius: '10px', background: 'var(--bg2)', padding: '56px 24px', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--t2)' }}>
                  No agents listed yet. List one from{' '}
                  <a href="/agents" style={{ color: 'var(--acc)', textDecoration: 'none' }}>My Agents</a>.
                </span>
              </div>
            );
          }

          if (visible.length === 0) {
            return (
              <div style={{ border: '0.5px dashed var(--bd2)', borderRadius: '10px', background: 'var(--bg2)', padding: '56px 24px', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--t2)' }}>No agents match this filter.</span>
              </div>
            );
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {visible.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const lesson = listing.agent ? getLessonByFolder(listing.agent.lesson_id) : undefined;
  const isOwnListing = !!user && user.wallet === listing.seller_wallet;
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [forked, setForked] = useState(false);
  const [previewCopied, setPreviewCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);
  const [proofTx, setProofTx] = useState<string | null>(null);

  const handleCopyPreview = () => {
    if (!listing.agent) return;
    navigator.clipboard.writeText(listing.agent.code_preview);
    setPreviewCopied(true);
    setTimeout(() => setPreviewCopied(false), 1500);
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 1500);
  };

  const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
    'Content-Type': 'application/json',
  });

  const handleConfirm = async () => {
    setShowConfirm(false);
    setRunning(true);
    setError(null);
    setOutput(null);
    try {
      if (listing.price_usd > 0) {
        if (!user) throw new Error('Connect your wallet to run a paid agent.');
        if (user.wallet === listing.seller_wallet) throw new Error("You can't buy your own listing.");
        setStage('Waiting for Phantom approval (USDC, Base Sepolia)…');
      } else {
        setStage('Running agent…');
      }

      const data = await runWithX402Payment(`/api/marketplace/${listing.id}/run`, { prompt: 'Run the agent.' }, authHeaders());
      setOutput(data.output);
      if (data.forked) setForked(true);
      if (data.proofTx) setProofTx(data.proofTx);
      const name = listing.agent?.name ?? 'agent';
      if (listing.price_usd > 0) {
        showToast(
          data.forked
            ? `Purchased "${name}" for $${listing.price_usd} USDC — added to My Agents`
            : `Purchased "${name}" for $${listing.price_usd} USDC — you already have a copy in My Agents`
        );
      } else if (data.forked) {
        showToast(`Added "${name}" to My Agents`);
      }
      if (data.levelUp) {
        showToast(`⚡ "${data.levelUp.agentName}" leveled up to LVL ${data.levelUp.newLevel}!`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
      setStage('');
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
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className={`ti ${lesson?.icon ?? 'ti-robot'}`} style={{ fontSize: '15px', color: 'var(--purple)' }} aria-hidden />
        <span style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
          {lesson ? `${String(lesson.num).padStart(2, '0')} · ${lesson.title}` : listing.agent?.lesson_id ?? 'unknown'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t1)' }}>
          {listing.agent?.name ?? 'Untitled agent'}
        </h3>
        {listing.agent && (
          <span style={{ fontSize: '9px', color: 'var(--t1)', fontFamily: 'var(--mono)', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', padding: '1px 5px', borderRadius: '3px' }}>
            LVL {listing.agent.level}
          </span>
        )}
        {listing.agent?.verified && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'var(--green)', fontFamily: 'var(--mono)', background: 'rgba(74,222,128,0.08)', border: '0.5px solid rgba(74,222,128,0.25)', padding: '1px 5px', borderRadius: '3px' }}>
            <i className="ti ti-shield-check" style={{ fontSize: '10px' }} aria-hidden />
            Verified
          </span>
        )}
      </div>

      {listing.description && (
        <p style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.5 }}>{listing.description}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
        <span>by {listing.seller_wallet.slice(0, 8)}…{listing.seller_wallet.slice(-8)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          {listing.agent && listing.agent.wins + listing.agent.losses > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--acc)' }}>
              <i className="ti ti-sword" style={{ fontSize: '10px' }} aria-hidden />
              {Math.round((listing.agent.wins / (listing.agent.wins + listing.agent.losses)) * 100)}% win rate
            </span>
          )}
          {listing.run_count > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--t3)' }}>
              <i className="ti ti-player-play" style={{ fontSize: '10px' }} aria-hidden />
              {listing.run_count} {listing.run_count === 1 ? 'run' : 'runs'}
            </span>
          )}
        </span>
      </div>
      {listing.agent && listing.agent.market_value > 0 && (
        <div style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
          est. value ${listing.agent.market_value} USDC
        </div>
      )}

      <button
        onClick={() => setShowPreview(v => !v)}
        style={{
          fontSize: '11px',
          color: 'var(--t3)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <i className={`ti ${showPreview ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontSize: '11px' }} aria-hidden />
        {showPreview ? 'Hide code preview' : 'Preview code'}
      </button>

      {showPreview && listing.agent && (
        <div style={{ border: '0.5px solid var(--bd)', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 8px',
              background: 'var(--bg2)',
              borderBottom: '0.5px solid var(--bd)',
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>preview snippet</span>
            <button
              onClick={handleCopyPreview}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: previewCopied ? 'var(--green)' : 'var(--t3)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              <i className={`ti ${previewCopied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: '11px' }} aria-hidden />
              {previewCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '10px',
              background: 'var(--bg)',
              color: 'var(--t3)',
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              lineHeight: 1.5,
              maxHeight: '160px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {listing.agent.code_preview}
            {listing.agent.code_truncated ? '\n\n… (full code unlocked after you run/buy it)' : ''}
          </pre>
        </div>
      )}

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '0.5px solid var(--bd)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: listing.price_usd > 0 ? 'var(--acc)' : 'var(--green)' }}>
          {listing.price_usd > 0 ? `$${listing.price_usd} USDC` : 'Free'}
        </span>
        {isOwnListing ? (
          <span style={{ fontSize: '11px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>your listing</span>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={running}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '5px',
              background: running ? 'var(--t4)' : 'var(--acc)',
              color: '#000',
              border: 'none',
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            <i className={`ti ${listing.price_usd > 0 ? 'ti-shopping-cart' : 'ti-player-play'}`} style={{ fontSize: '12px' }} aria-hidden />
            {running ? (stage || 'Running…') : listing.price_usd > 0 ? 'Buy' : 'Run'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: '11px', color: '#ef4444', padding: '8px', borderRadius: '4px', background: '#7f1d1d20', border: '0.5px solid #dc2626' }}>
          {error}
        </div>
      )}

      {forked && (
        <div style={{ fontSize: '11px', color: 'var(--green)', padding: '8px', borderRadius: '4px', background: '#0a1f0f', border: '0.5px solid var(--green2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ti ti-check" style={{ fontSize: '12px' }} aria-hidden />
          Added to{' '}
          <a href="/agents" style={{ color: 'var(--green)', textDecoration: 'underline' }}>My Agents</a>
        </div>
      )}

      {output && (
        <div style={{ border: '0.5px solid var(--bd)', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 8px',
              background: 'var(--bg2)',
              borderBottom: '0.5px solid var(--bd)',
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>output</span>
            <button
              onClick={handleCopyOutput}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: outputCopied ? 'var(--green)' : 'var(--t3)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              <i className={`ti ${outputCopied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: '11px' }} aria-hidden />
              {outputCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre
            style={{
              fontSize: '11px',
              color: 'var(--t2)',
              background: 'var(--bg)',
              padding: '10px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '200px',
              overflow: 'auto',
              fontFamily: 'var(--mono)',
            }}
          >
            {output}
          </pre>
        </div>
      )}

      {proofTx && (
        <a
          href={`https://explorer.solana.com/tx/${proofTx}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'var(--mono)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <i className="ti ti-shield-check" style={{ fontSize: '11px' }} aria-hidden />
          Verified on-chain — view proof
        </a>
      )}

      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '24px', maxWidth: '380px', width: '90%' }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '8px' }}>
              {listing.price_usd > 0 ? 'Confirm purchase' : 'Run this agent?'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6, marginBottom: '16px' }}>
              You're about to run <strong style={{ color: 'var(--t1)' }}>{listing.agent?.name ?? 'this agent'}</strong>
              {listing.description ? ` — ${listing.description}` : ''}.
              {listing.price_usd > 0 ? (
                <> This costs <strong style={{ color: 'var(--acc)' }}>${listing.price_usd} USDC</strong> (x402, Base Sepolia), paid to the creator's EVM wallet. You'll sign with Phantom next.</>
              ) : (
                <> This is free to run.</>
              )}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleConfirm}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'var(--acc)', color: '#000', border: 'none', fontWeight: 500, cursor: 'pointer' }}
              >
                {listing.price_usd > 0 ? 'Confirm & pay' : 'Run it'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
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
