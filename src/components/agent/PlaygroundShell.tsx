'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { agentStore, SavedAgent } from '@/lib/agentStore';
import { runAgent } from '@/lib/runAgent';
import type { Lesson } from '@/lib/lessons';

interface PlaygroundShellProps {
  lesson: Lesson;
  baseCode: string;
  onSave?: (code: string) => void;
}

export function PlaygroundShell({ lesson, baseCode, onSave }: PlaygroundShellProps) {
  const searchParams = useSearchParams();
  const loadAgentId = searchParams.get('loadAgent');

  const [code, setCode] = useState(baseCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [agentName, setAgentName] = useState(`${lesson.title} v1`);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [savedResult, setSavedResult] = useState<{ agent: SavedAgent; isNew: boolean } | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(!!loadAgentId);
  const [loadedAgentName, setLoadedAgentName] = useState<string | null>(null);

  useEffect(() => {
    if (!loadAgentId) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await agentStore.load(loadAgentId);
        if (cancelled) return;
        setCode(saved.code);
        setAgentName(saved.name);
        setLoadedAgentName(saved.name);
      } catch (e) {
        console.error('Failed to load saved agent:', e);
      } finally {
        if (!cancelled) setLoadingAgent(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadAgentId]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Executing code...\n');
    try {
      // Extract LLM prompt from user code (naive: look for common patterns)
      const promptMatch = code.match(/['"`](.*?)['"`]/); // Simple extraction
      const prompt = promptMatch ? promptMatch[1] : 'What should I do?';

      const result = await runAgent(lesson.id, code, prompt);
      setOutput(result);
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveAgent = async (asNew: boolean) => {
    if (!agentName.trim()) {
      setSaveStatus('Agent name required');
      return;
    }
    try {
      const saved = !asNew && loadAgentId
        ? await agentStore.update(loadAgentId, { name: agentName.trim(), code })
        : await agentStore.save({ name: agentName.trim(), lessonId: lesson.id, code });
      setSaveStatus('');
      setSavedResult({ agent: saved, isNew: asNew || !loadAgentId });
      setTimeout(() => {
        setShowSaveModal(false);
        setSavedResult(null);
        if (asNew) setAgentName(`${lesson.title} v1`);
      }, saved.badgeBonusApplied ? 3400 : 2200);
    } catch (e) {
      setSaveStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 26px' }}>
        {loadedAgentName && (
          <span style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
            <i className="ti ti-folder-open" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }} aria-hidden />
            {loadedAgentName}
          </span>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleRun}
          disabled={isRunning || loadingAgent}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '6px 14px',
            borderRadius: '5px',
            background: isRunning ? 'var(--t4)' : 'var(--acc)',
            color: '#000',
            border: 'none',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          <i className="ti ti-player-play" style={{ fontSize: '13px' }} aria-hidden />
          {isRunning ? 'Running...' : 'Run'}
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '6px 14px',
            borderRadius: '5px',
            background: 'transparent',
            color: 'var(--t2)',
            border: '0.5px solid var(--bd2)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <i className="ti ti-device-floppy" style={{ fontSize: '13px' }} aria-hidden />
          Save Agent
        </button>
        </div>
      </div>

      {/* Editor + Console split */}
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px', flex: 1, overflow: 'hidden', padding: '0 26px' }}>
        {/* Editor */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '0.5px solid var(--bd2)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--t3)', padding: '6px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)' }}>
            Code Editor
          </div>
          <textarea
            value={loadingAgent ? 'Loading saved agent…' : code}
            onChange={e => setCode(e.target.value)}
            disabled={loadingAgent}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--bg)',
              color: 'var(--t1)',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              lineHeight: '1.5',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Console */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '0.5px solid var(--bd2)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--t3)', padding: '6px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)' }}>
            Console Output
          </div>
          <pre
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--bg)',
              color: 'var(--t2)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              margin: 0,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {output}
          </pre>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg2)',
              border: '0.5px solid var(--bd2)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            {savedResult ? (
              <SaveSuccessPanel agent={savedResult.agent} isNew={savedResult.isNew} />
            ) : (
            <>
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px' }}>
              Save Agent
            </h3>
            <input
              type="text"
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '4px',
                border: '0.5px solid var(--bd2)',
                background: 'var(--bg)',
                color: 'var(--t1)',
                fontSize: '13px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
              placeholder="Agent name"
            />
            {saveStatus && (
              <div
                style={{
                  fontSize: '12px',
                  color: saveStatus.startsWith('✓') ? 'var(--green)' : '#ef4444',
                  marginBottom: '12px',
                }}
              >
                {saveStatus}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              {loadAgentId && (
                <button
                  onClick={() => handleSaveAgent(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    background: 'var(--acc)',
                    color: '#000',
                    border: 'none',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Update
                </button>
              )}
              <button
                onClick={() => handleSaveAgent(true)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: loadAgentId ? 'transparent' : 'var(--acc)',
                  color: loadAgentId ? 'var(--t2)' : '#000',
                  border: loadAgentId ? '0.5px solid var(--bd2)' : 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {loadAgentId ? 'Save as new' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: '0.5px solid var(--bd2)',
                  color: 'var(--t2)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Animated post-save panel: drawn checkmark + stats revealing in, replaces the flat green text. */
function SaveSuccessPanel({ agent, isNew }: { agent: SavedAgent; isNew: boolean }) {
  const stats = [
    { label: 'LVL', value: agent.level, color: 'var(--t1)' },
    { label: 'PWR', value: agent.power, color: 'var(--purple)' },
    { label: 'INT', value: agent.intel, color: 'var(--green)' },
  ];
  return (
    <div style={{ textAlign: 'center', padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <motion.circle cx="26" cy="26" r="23" stroke="var(--green)" strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeInOut' }} />
          <motion.path d="M17 27 L23 33 L36 19" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.3, ease: 'easeOut' }} />
        </svg>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}
        style={{ fontSize: '15px', fontWeight: 600, color: 'var(--t1)', margin: '0 0 4px' }}>
        {isNew ? 'Agent saved' : 'Agent updated'}
      </motion.h3>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28, duration: 0.3 }}
        style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)', marginBottom: '16px' }}>
        {agent.name}
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: agent.badgeBonusApplied ? '14px' : '4px' }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, maxWidth: '92px', background: 'var(--bg)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '10px 6px' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '8.5px', color: 'var(--t4)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginTop: '4px' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {agent.badgeBonusApplied && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.3 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--mono)', background: 'rgba(74,222,128,0.08)', border: '0.5px solid rgba(74,222,128,0.25)', padding: '5px 12px', borderRadius: '6px' }}>
          <i className="ti ti-bolt" style={{ fontSize: '13px' }} aria-hidden />
          +15 PWR / +15 INT from your skill badge
        </motion.div>
      )}
    </div>
  );
}
