import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

// GET /api/progress — list user's progress
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('progress')
      .select('*')
      .eq('user_id', auth.userId);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/progress error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
