import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

// GET /api/badges — skill badges the authenticated user has earned from completing lessons.
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('skill_badges')
    .select('lesson_id, badge_tx, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
