import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

let client: SupabaseClient | undefined;

/** Service-role Supabase client (server-only, bypasses RLS). Lazily created so a build without env vars (e.g. CI collecting page data) doesn't crash — only fails if actually invoked at runtime without config. */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return client[prop as keyof SupabaseClient];
  },
});

/**
 * Decode the phase 1.5 custom token from the Authorization header.
 * Token = base64(user_id:wallet_address). Returns null if missing/invalid.
 */
export function getUserFromRequest(req: NextRequest): { userId: string; wallet: string } | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, wallet] = decoded.split(':');
    if (!userId || !wallet) return null;
    return { userId, wallet };
  } catch {
    return null;
  }
}
