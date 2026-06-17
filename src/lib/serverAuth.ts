import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/** Service-role Supabase client (server-only, bypasses RLS). */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
