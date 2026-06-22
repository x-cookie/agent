'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { agentStore, SavedAgent } from '@/lib/agentStore';
import { useAuth } from '@/hooks/useAuth';
import { getLessonByFolder } from '@/lib/lessons';
import { AgentJob } from '@/components/agent/AgentJob';

const authHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
  'Content-Type': 'application/json',
});

function MissionSkeleton() {
  const bar = (width: string, height = '10px'): React.CSSProperties => ({
    width,
    height,
    borderRadius: '3px',
    background: 'var(--bg3)',
    animation: 'pulse 1.4s ease-in-out infinite',
  });

  return (
    <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '10px', background: 'var(--bg2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={bar('60%', '14px')} />
        <div style={bar('40px')} />
      </div>
      <div style={bar('100%', '28px')} />
      <div style={bar('100%', '28px')} />
    </div>
  );
}

function MissionCard({ agent }: { agent: SavedAgent }) {
  const lesson = getLessonByFolder(agent.lessonId);
  return (
    <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '10px', background: 'var(--bg2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className={`ti ${lesson?.icon ?? 'ti-robot'}`} style={{ fontSize: '15px', color: 'var(--purple)' }} aria-hidden />
          <Link href={`/agents/${agent.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t1)', textDecoration: 'none' }}>
            {agent.name}
          </Link>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--t1)', fontFamily: 'var(--mono)', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', padding: '2px 6px', borderRadius: '3px' }}>
          LVL {agent.level}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <Link
          href="/battle"
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, padding: '6px 12px', borderRadius: '5px', border: '0.5px solid var(--bd2)', color: 'var(--purple)', textDecoration: 'none' }}
        >
          <i className="ti ti-sword" style={{ fontSize: '12px' }} aria-hidden />
          Combat Arena
        </Link>
      </div>
      <AgentJob agentId={agent.id} authHeaders={authHeaders} />
    </div>
  );
}

export default function MissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    agentStore.list().then(setAgents).catch(() => {}).finally(() => setLoading(false));
  }, [authLoading, user]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: '10px' }}>
            mission hub
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Send your agents to work
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--t2)', marginTop: '8px', lineHeight: 1.65, maxWidth: '480px' }}>
            Combat missions fight head-to-head in the arena. Economic missions run quietly in the background, even while you&apos;re offline.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => <MissionSkeleton key={i} />)}
          </div>
        ) : agents.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>
            No agents yet. <Link href="/learn" style={{ color: 'var(--acc)' }}>Build one in a lesson</Link> first.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {agents.map(agent => (
              <MissionCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
