'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { getLessonByFolder } from '@/lib/lessons';
import { badgeImageForLesson } from '@/lib/badgeAssets';

type AgentProfile = {
  id: string;
  name: string;
  lesson_id: string;
  wins: number;
  losses: number;
  power: number;
  intel: number;
  reputation: number;
  xp: number;
  level: number;
  lineage_tx: string | null;
  created_at: string;
};

type JobLog = { id: string; role: string; output: string; created_at: string };
type Badge = { lesson_id: string; badge_tx: string | null; created_at: string };

const authHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
  'Content-Type': 'application/json',
});

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--t3)', marginBottom: '4px' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--t2)' }}>{value}/100</span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: 'var(--bd2)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
    </div>
  );
}

export default function AgentProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/agents/${id}`, { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : null))
      .then(setAgent)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch(`/api/agents/${id}/job-logs`)
      .then(res => (res.ok ? res.json() : []))
      .then(d => setLogs(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch('/api/badges', { headers: authHeaders() })
      .then(res => (res.ok ? res.json() : []))
      .then(d => setBadges(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [id]);

  const lesson = agent ? getLessonByFolder(agent.lesson_id) : undefined;
  const xpForNextLevel = agent ? agent.level * 100 : 0;
  const xpProgress = agent ? Math.min(100, Math.round((agent.xp / xpForNextLevel) * 100)) : 0;
  const winRate = agent && agent.wins + agent.losses > 0 ? Math.round((agent.wins / (agent.wins + agent.losses)) * 100) : null;
  const marketValue = agent ? Math.round((agent.level * 0.01 + agent.wins * 0.005 + agent.reputation * 0.002 + (agent.lineage_tx ? 0.01 : 0)) * 10000) / 10000 : 0;
  const verified = agent ? !!agent.lineage_tx && agent.wins + agent.losses >= 3 : false;
  const hasMatchingBadge = agent ? badges.some(b => b.lesson_id === agent.lesson_id) : false;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 32px' }}>
        <Link href="/agents" style={{ fontSize: '11px', color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '11px' }} aria-hidden />
          Back to My Agents
        </Link>

        {loading ? (
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>Loading…</div>
        ) : !agent ? (
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>Agent not found, or it&apos;s not yours.</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className={`ti ${lesson?.icon ?? 'ti-robot'}`} style={{ fontSize: '20px', color: 'var(--purple)' }} aria-hidden />
                  <h1 style={{ fontSize: '26px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.03em' }}>{agent.name}</h1>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                  {lesson ? `Lesson ${String(lesson.num).padStart(2, '0')} · ${lesson.title}` : agent.lesson_id}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--t1)', fontFamily: 'var(--mono)', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', padding: '4px 10px', borderRadius: '5px' }}>
                  LEVEL {agent.level}
                </span>
                {verified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                    <i className="ti ti-shield-check" style={{ fontSize: '12px' }} aria-hidden />
                    Verified performance
                  </span>
                )}
              </div>
            </div>

            {/* Lineage */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '8px' }}>lineage</div>
              {agent.lineage_tx ? (
                <a href={`https://explorer.solana.com/tx/${agent.lineage_tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--green)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <i className="ti ti-link" style={{ fontSize: '13px' }} aria-hidden />
                  Registered on-chain — view proof
                </a>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--t4)' }}>Not yet registered on-chain.</span>
              )}
              <div style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)', marginTop: '6px' }}>
                created {new Date(agent.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Mastered pattern */}
            {lesson && (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '8px' }}>pattern mastered</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={`ti ${lesson.icon}`} style={{ fontSize: '16px', color: 'var(--purple)' }} aria-hidden />
                  <span style={{ fontSize: '13px', color: 'var(--t1)', fontWeight: 500 }}>{lesson.title}</span>
                  <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>{lesson.tag}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6, marginTop: '8px' }}>{lesson.desc}</p>
                {hasMatchingBadge && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '10px', color: 'var(--green)', fontFamily: 'var(--mono)', background: 'rgba(74,222,128,0.08)', border: '0.5px solid rgba(74,222,128,0.25)', padding: '3px 8px', borderRadius: '4px' }}>
                    <Image src={badgeImageForLesson(lesson.num)} alt="" width={14} height={14} />
                    Skill badge earned — +15 power / +15 intel applied
                  </div>
                )}
              </div>
            )}

            {/* Skill badges earned */}
            {badges.length > 0 && (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '10px' }}>owner skill badges</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {badges.map(b => {
                    const bl = getLessonByFolder(b.lesson_id);
                    const badge = (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--t2)', fontFamily: 'var(--mono)', background: 'var(--bg)', border: '0.5px solid var(--bd2)', padding: '4px 8px', borderRadius: '4px' }}>
                        <Image src={badgeImageForLesson(bl?.num ?? 1)} alt="" width={14} height={14} />
                        {bl?.title ?? b.lesson_id}
                      </span>
                    );
                    return b.badge_tx ? (
                      <a key={b.lesson_id} href={`https://explorer.solana.com/tx/${b.badge_tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{badge}</a>
                    ) : (
                      <span key={b.lesson_id}>{badge}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>evolution</div>
              <StatBar label="Power"      value={agent.power}      color="var(--purple)" />
              <StatBar label="Intel"      value={agent.intel}      color="var(--green)" />
              <StatBar label="Reputation" value={agent.reputation} color="#f59e0b" />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--t3)', marginBottom: '4px' }}>
                  <span>XP to level {agent.level + 1}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--t2)' }}>{agent.xp}/{xpForNextLevel}</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--bd2)', overflow: 'hidden' }}>
                  <div style={{ width: `${xpProgress}%`, height: '100%', background: 'var(--acc)', borderRadius: '3px' }} />
                </div>
              </div>
            </div>

            {/* Performance + value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '8px' }}>performance</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--t1)' }}>{agent.wins}W – {agent.losses}L</div>
                <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '4px' }}>{winRate !== null ? `${winRate}% win rate` : 'No battles yet'}</div>
              </div>
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '8px' }}>est. market value</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--green)', fontFamily: 'var(--mono)' }}>${marketValue}</div>
                <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: '4px' }}>illustrative, derived from level + wins + reputation</div>
              </div>
            </div>

            {/* Recent activity */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '10px' }}>recent activity</div>
              {logs.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--t4)' }}>No background job activity yet.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ background: 'var(--bg)', border: '0.5px solid var(--bd)', borderRadius: '5px', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--purple)', textTransform: 'capitalize' }}>{log.role}</span>
                        <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>{log.output}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
