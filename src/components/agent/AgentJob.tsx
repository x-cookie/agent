'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/shared/Toast';

const JOB_ROLES = ['trader', 'warrior', 'researcher'] as const;
type JobRole = typeof JOB_ROLES[number];
type JobLog = { id: string; role: string; output: string; created_at: string };

export const cardGhostBtn: React.CSSProperties = {
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

/** Assign/manage a background "economic mission" role for a saved agent — used in My Agents and the Mission Hub. */
export function AgentJob({ agentId, authHeaders }: { agentId: string; authHeaders: () => HeadersInit }) {
  const [role, setRole] = useState<JobRole | null>(null);
  const [status, setStatus] = useState<'active' | 'paused' | null>(null);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`/api/agents/${agentId}/job`)
      .then(res => (res.ok ? res.json() : null))
      .then(d => { if (d) { setRole(d.role); setStatus(d.status); } })
      .catch(() => {});
  }, [agentId]);

  const loadLogs = () => {
    fetch(`/api/agents/${agentId}/job-logs`)
      .then(res => (res.ok ? res.json() : []))
      .then(d => setLogs(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const assign = async (newRole: JobRole, newStatus: 'active' | 'paused') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/job`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole, status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Job update failed');
      setRole(newRole);
      setStatus(newStatus);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Job update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setShowModal(true); loadLogs(); }}
        style={{ ...cardGhostBtn, width: '100%', color: status === 'active' ? 'var(--green)' : 'var(--t2)' }}
      >
        <i className="ti ti-briefcase" style={{ fontSize: '12px' }} aria-hidden />
        {role ? `Job: ${role} (${status})` : 'Assign background job'}
      </button>

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '24px', maxWidth: '420px', width: '90%' }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '6px' }}>Background job</h3>
            <p style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6, marginBottom: '14px' }}>
              Assign a role and this agent reports in on its own roughly once a day, even while you&apos;re offline.
            </p>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {JOB_ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => assign(r, 'active')}
                  disabled={busy}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '8px',
                    borderRadius: '5px',
                    border: `0.5px solid ${role === r ? 'var(--acc)' : 'var(--bd2)'}`,
                    background: role === r ? 'var(--bg3)' : 'transparent',
                    color: role === r ? 'var(--t1)' : 'var(--t3)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {role && (
              <button
                onClick={() => assign(role, status === 'active' ? 'paused' : 'active')}
                disabled={busy}
                style={{ ...cardGhostBtn, width: '100%', marginBottom: '14px' }}
              >
                {status === 'active' ? 'Pause job' : 'Resume job'}
              </button>
            )}

            <div style={{ fontSize: '10px', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: '8px' }}>
              recent activity
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <span style={{ fontSize: '11px', color: 'var(--t4)' }}>No activity yet. Check back after the next run.</span>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{ background: 'var(--bg)', border: '0.5px solid var(--bd)', borderRadius: '5px', padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--purple)', textTransform: 'capitalize' }}>{log.role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>{log.output}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{ ...cardGhostBtn, width: '100%', marginTop: '14px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
