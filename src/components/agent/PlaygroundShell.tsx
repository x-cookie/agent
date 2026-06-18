'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { agentStore } from '@/lib/agentStore';
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
      setSaveStatus(asNew || !loadAgentId ? `✓ Agent saved: ${saved.name}` : `✓ Updated: ${saved.name}`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus('');
        if (asNew) setAgentName(`${lesson.title} v1`);
      }, 1500);
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
          </div>
        </div>
      )}
    </div>
  );
}
