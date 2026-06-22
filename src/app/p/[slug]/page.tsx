'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { runWithX402Payment } from '@/lib/payX402';

type PublicAgent = {
  id: string;
  name: string;
  lesson_id: string;
  code: string;
  price_usd: number;
};

export default function PublicAgentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const copyText = (text: string, mark: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    mark(true);
    setTimeout(() => mark(false), 1500);
  };

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
    setOutput(agent.price_usd > 0 ? `Requesting payment (~$${agent.price_usd} USDC via Phantom)...\n` : 'Executing code...\n');
    try {
      const promptMatch = agent.code.match(/['"`](.*?)['"`]/);
      const prompt = promptMatch ? promptMatch[1] : 'What should I do?';
      const { output } = await runWithX402Payment(`/api/public/${slug}/run`, { prompt });
      setOutput(output);
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
                {isRunning ? 'Running...' : agent.price_usd > 0 ? `Run agent — $${agent.price_usd} USDC` : 'Run agent'}
              </button>
              {agent.price_usd > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--t3)', alignSelf: 'center', fontFamily: 'var(--mono)' }}>
                  Pay with Phantom (Base Sepolia)
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t3)', padding: '6px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)' }}>
                  Code (read-only)
                  <button
                    onClick={() => copyText(agent.code, setCopiedCode)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: copiedCode ? 'var(--green)' : 'var(--t3)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)' }}
                  >
                    <i className="ti ti-copy" style={{ fontSize: '12px' }} aria-hidden />
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre style={{ margin: 0, padding: '12px', background: 'var(--bg)', color: 'var(--t2)', fontFamily: 'var(--mono)', fontSize: '11px', overflow: 'auto', maxHeight: '420px', whiteSpace: 'pre-wrap' }}>
                  {agent.code}
                </pre>
              </div>
              <div style={{ border: '0.5px solid var(--bd2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t3)', padding: '6px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)' }}>
                  Console Output
                  <button
                    onClick={() => copyText(output, setCopiedOutput)}
                    disabled={!output}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: copiedOutput ? 'var(--green)' : 'var(--t3)', background: 'transparent', border: 'none', cursor: output ? 'pointer' : 'not-allowed', fontFamily: 'var(--mono)' }}
                  >
                    <i className="ti ti-copy" style={{ fontSize: '12px' }} aria-hidden />
                    {copiedOutput ? 'Copied!' : 'Copy'}
                  </button>
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
