'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { runAgent } from '@/lib/runAgent';

type PublicAgent = {
  id: string;
  name: string;
  lesson_id: string;
  code: string;
};

export default function PublicAgentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Agent not found');
        }
        return res.json();
      })
      .then(setAgent)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load agent'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRun = async () => {
    if (!agent) return;
    setIsRunning(true);
    setOutput('Executing code...\n');
    try {
      const promptMatch = agent.code.match(/['"`](.*?)['"`]/);
      const prompt = promptMatch ? promptMatch[1] : 'What should I do?';
      const result = await runAgent(agent.lesson_id, agent.code, prompt);
      setOutput(result);
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: '60px',
          borderBottom: '0.5px solid var(--bd)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <Image src="/logo-agent.png" alt="logo" width={28} height={28} style={{ borderRadius: '4px' }} />
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.02em' }}>agent</span>
        </Link>
        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '3px', color: 'var(--green)', background: '#0a1f0f', border: '0.5px solid #166534', fontFamily: 'var(--mono)' }}>
          ● public agent
        </span>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        {loading && <p style={{ fontSize: '13px', color: 'var(--t3)' }}>Loading agent…</p>}

        {error && !loading && (
          <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '10px', background: 'var(--bg2)', padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {agent && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: '8px' }}>
                {agent.lesson_id}
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.03em' }}>{agent.name}</h1>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={handleRun}
                disabled={isRunning}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  background: isRunning ? 'var(--t4)' : 'var(--acc)',
                  color: '#000',
                  border: 'none',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                <i className="ti ti-player-play" style={{ fontSize: '13px' }} aria-hidden />
                {isRunning ? 'Running...' : 'Run agent'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', color: 'var(--t3)', padding: '6px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)' }}>
                  Code (read-only)
                </div>
                <pre style={{ margin: 0, padding: '12px', background: 'var(--bg)', color: 'var(--t2)', fontFamily: 'var(--mono)', fontSize: '11px', overflow: 'auto', maxHeight: '420px', whiteSpace: 'pre-wrap' }}>
                  {agent.code}
                </pre>
              </div>
              <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', color: 'var(--t3)', padding: '6px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)' }}>
                  Console Output
                </div>
                <pre style={{ margin: 0, padding: '12px', background: 'var(--bg)', color: 'var(--t2)', fontFamily: 'var(--mono)', fontSize: '11px', overflow: 'auto', maxHeight: '420px', whiteSpace: 'pre-wrap' }}>
                  {output}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
