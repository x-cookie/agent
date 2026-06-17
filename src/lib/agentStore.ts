export type SavedAgent = {
  id: string;
  name: string;
  lessonId: string;
  code: string;
  createdAt: number;
  updatedAt: number;
};

export type AgentStoreBackend = 'localStorage' | 'api';

const STORAGE_KEY = 'agentlearn:agents';
const TOKEN_KEY = 'authToken';

/** Map API row (snake_case) to SavedAgent (camelCase). */
function fromApiRow(row: {
  id: string;
  name: string;
  lesson_id: string;
  code: string;
  created_at: string;
  updated_at: string;
}): SavedAgent {
  return {
    id: row.id,
    name: row.name,
    lessonId: row.lesson_id,
    code: row.code,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export class AgentStore {
  /** Logged in (API) when an auth token exists, else localStorage. */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private get backend(): AgentStoreBackend {
    return this.getToken() ? 'api' : 'localStorage';
  }

  async list(): Promise<SavedAgent[]> {
    if (typeof window === 'undefined') return [];
    if (this.backend === 'api') return this.listApi();
    return this.listLocalStorage();
  }

  async save(agent: Omit<SavedAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedAgent> {
    if (typeof window === 'undefined') throw new Error('save() requires browser');
    if (this.backend === 'api') return this.saveApi(agent);
    return this.saveLocalStorage(agent);
  }

  async load(id: string): Promise<SavedAgent> {
    if (typeof window === 'undefined') throw new Error('load() requires browser');
    if (this.backend === 'api') return this.loadApi(id);
    return this.loadLocalStorage(id);
  }

  async delete(id: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('delete() requires browser');
    if (this.backend === 'api') return this.deleteApi(id);
    return this.deleteLocalStorage(id);
  }

  async rename(id: string, newName: string): Promise<SavedAgent> {
    if (typeof window === 'undefined') throw new Error('rename() requires browser');
    if (this.backend === 'api') return this.renameApi(id, newName);
    return this.renameLocalStorage(id, newName);
  }

  // API backend (phase 1.5: logged in via Phantom)
  private authHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    };
  }

  private async listApi(): Promise<SavedAgent[]> {
    const res = await fetch('/api/agents', { headers: this.authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch agents');
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(fromApiRow) : [];
  }

  private async saveApi(agent: Omit<SavedAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedAgent> {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ name: agent.name, lessonId: agent.lessonId, code: agent.code }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Failed to save agent');
    }
    return fromApiRow(await res.json());
  }

  private async loadApi(id: string): Promise<SavedAgent> {
    const res = await fetch(`/api/agents/${id}`, { headers: this.authHeaders() });
    if (!res.ok) throw new Error('Failed to load agent');
    return fromApiRow(await res.json());
  }

  private async deleteApi(id: string): Promise<void> {
    const res = await fetch(`/api/agents/${id}`, { method: 'DELETE', headers: this.authHeaders() });
    if (!res.ok) throw new Error('Failed to delete agent');
  }

  private async renameApi(id: string, newName: string): Promise<SavedAgent> {
    const res = await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: this.authHeaders(),
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) throw new Error('Failed to rename agent');
    return fromApiRow(await res.json());
  }

  // localStorage backend
  private listLocalStorage(): SavedAgent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalStorage(agent: Omit<SavedAgent, 'id' | 'createdAt' | 'updatedAt'>): SavedAgent {
    const agents = this.listLocalStorage();
    const newAgent: SavedAgent = {
      ...agent,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    agents.push(newAgent);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch {}
    return newAgent;
  }

  private loadLocalStorage(id: string): SavedAgent {
    const agents = this.listLocalStorage();
    const agent = agents.find(a => a.id === id);
    if (!agent) throw new Error(`Agent ${id} not found`);
    return agent;
  }

  private deleteLocalStorage(id: string): void {
    const agents = this.listLocalStorage();
    const filtered = agents.filter(a => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
  }

  private renameLocalStorage(id: string, newName: string): SavedAgent {
    const agents = this.listLocalStorage();
    const agent = agents.find(a => a.id === id);
    if (!agent) throw new Error(`Agent ${id} not found`);
    agent.name = newName;
    agent.updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch {}
    return agent;
  }
}

// Singleton instance
export const agentStore = new AgentStore();
