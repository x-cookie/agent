import { mockLLM } from './mockLLM';

/** Run an agent against a real LLM via /api/agent-run; falls back to the mock if the call fails. */
export async function runAgent(lessonId: string, code: string, prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/agent-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, code, prompt }),
    });
    if (!res.ok) throw new Error('agent-run failed');
    const { output } = await res.json();
    return output;
  } catch {
    return mockLLM(lessonId, prompt);
  }
}
