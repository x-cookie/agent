import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/serverAuth';

// GET /api/battles/leaderboard — top agents by battle wins (public, no auth)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('id, name, wins, losses, user_id')
      .gt('wins', 0)
      .order('wins', { ascending: false })
      .limit(20);
    if (error) throw error;

    const leaderboard = (data ?? []).map(row => ({
      id: row.id,
      name: row.name,
      wins: row.wins,
      losses: row.losses,
      ownerWallet: row.user_id,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('GET /api/battles/leaderboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
