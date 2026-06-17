'use client';

import { useState } from 'react';
import { agentStore } from '@/lib/agentStore';
import { mockLLM } from '@/lib/mockLLM';
import type { Lesson } from '@/lib/lessons';

interface PlaygroundShellProps {
  lesson: Lesson;
  baseCode: string;
  onSave?: (code: string) => void;
}

export function PlaygroundShell({ lesson, baseCode, onSave }: PlaygroundShellProps) {
  const [code, setCode] = useState(baseCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [agentName, setAgentName] = useState(`${lesson.title} v1`);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Executing code...\n');
    try {
      // Extract LLM prompt from user code (naive: look for common patterns)
      const promptMatch = code.match(/['"`](.*?)['"`]/); // Simple extraction
      const prompt = promptMatch ? promptMatch[1] : 'What should I do?';

      // Call mockLLM
      const result = await mockLLM(lesson.id, prompt);
      setOutput(result);
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!agentName.trim()) {
      setSaveStatus('Agent name required');
      return;
    }
    try {
      const saved = await agentStore.save({
        name: agentName.trim(),
        lessonId: lesson.id,
        code,
      });
      setSaveStatus(`✓ Agent saved: ${saved.name}`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus('');
        setAgentName(`${lesson.title} v1`);
      }, 1500);
    } catch (e) {
      setSaveStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '0 26px' }}>
        <button
          onClick={handleRun}
          disabled={isRunning}
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
            value={code}
            onChange={e => setCode(e.target.value)}
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
              <button
                onClick={handleSaveAgent}
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
                Save
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
