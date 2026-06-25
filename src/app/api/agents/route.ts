import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

// GET /api/agents — list user's agents
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/agents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents — create agent
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, lessonId, code } = await req.json();

    if (!name || !lessonId || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Education-linked bonus: if the owner already earned the skill badge for this
    // lesson, agents built from that pattern start stronger (learning = power).
    const { data: badge } = await supabaseAdmin
      .from('skill_badges')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    const badgeBonus = badge ? { power: 15, intel: 15 } : {};

    const { data, error } = await supabaseAdmin
      .from('agents')
      .insert([{ user_id: auth.userId, name, lesson_id: lessonId, code, ...badgeBonus }])
      .select()
      .single();

    if (error) {
      // Duplicate name for this lesson
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You already have an agent with that name for this lesson. Pick another name.' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ...data, badgeBonusApplied: !!badge }, { status: 201 });
  } catch (error) {
    console.error('POST /api/agents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create agent' },
      { status: 500 }
    );
  }
}
