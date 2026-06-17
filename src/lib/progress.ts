const KEY = "afs_progress";
const TOKEN_KEY = "authToken";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

function getCompletedLocalStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markCompleteLocalStorage(folder: string): Set<string> {
  const completed = getCompletedLocalStorage();
  completed.add(folder);
  try { localStorage.setItem(KEY, JSON.stringify([...completed])); } catch {}
  return completed;
}

async function getCompletedApi(): Promise<Set<string>> {
  const res = await fetch("/api/progress", { headers: authHeaders() });
  if (!res.ok) return new Set();
  const rows = await res.json();
  if (!Array.isArray(rows)) return new Set();
  return new Set(rows.map((r: { lesson_id: string }) => r.lesson_id));
}

async function markCompleteApi(folder: string): Promise<Set<string>> {
  const res = await fetch(`/api/progress/${folder}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to mark progress");
  return getCompletedApi();
}

/** Logged in (API) when an auth token exists, else localStorage. */
export async function getCompleted(): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set();
  return getToken() ? getCompletedApi() : getCompletedLocalStorage();
}

export async function markComplete(folder: string): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set();
  return getToken() ? markCompleteApi(folder) : markCompleteLocalStorage(folder);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isUnlocked(_folder: string): boolean {
  return true;
}
