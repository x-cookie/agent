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

export type MarkCompleteResult = { completed: Set<string>; badgeAwarded: boolean };

async function markCompleteApi(folder: string): Promise<MarkCompleteResult> {
  const res = await fetch(`/api/progress/${folder}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to mark progress");
  const body = await res.json().catch(() => ({}));
  const completed = await getCompletedApi();
  return { completed, badgeAwarded: !!body?.badgeAwarded };
}

/** Logged in (API) when an auth token exists, else localStorage. */
export async function getCompleted(): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set();
  return getToken() ? getCompletedApi() : getCompletedLocalStorage();
}

export async function markComplete(folder: string): Promise<MarkCompleteResult> {
  if (typeof window === "undefined") return { completed: new Set(), badgeAwarded: false };
  if (getToken()) return markCompleteApi(folder);
  return { completed: markCompleteLocalStorage(folder), badgeAwarded: false };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isUnlocked(_folder: string): boolean {
  return true;
}
