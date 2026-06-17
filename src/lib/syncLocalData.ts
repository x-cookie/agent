const AGENTS_KEY = 'agentlearn:agents';
const PROGRESS_KEY = 'afs_progress';

type LocalAgent = {
  id: string;
  name: string;
  lessonId: string;
  code: string;
};

/** Push any locally-saved agents/progress (from before wallet login) into the DB, then clear them. Best-effort: skips items that fail (e.g. already synced) instead of blocking login. */
export async function syncLocalDataToServer(token: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const rawAgents = localStorage.getItem(AGENTS_KEY);
    const agents: LocalAgent[] = rawAgents ? JSON.parse(rawAgents) : [];
    for (const agent of agents) {
      try {
        await fetch('/api/agents', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: agent.name, lessonId: agent.lessonId, code: agent.code }),
        });
      } catch {}
    }
    localStorage.removeItem(AGENTS_KEY);
  } catch {}

  try {
    const rawProgress = localStorage.getItem(PROGRESS_KEY);
    const folders: string[] = rawProgress ? JSON.parse(rawProgress) : [];
    for (const folder of folders) {
      try {
        await fetch(`/api/progress/${folder}`, { method: 'POST', headers });
      } catch {}
    }
    localStorage.removeItem(PROGRESS_KEY);
  } catch {}
}
