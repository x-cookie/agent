import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

// POST /api/progress/[lessonId] — mark lesson complete
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('progress')
      .upsert(
        {
          user_id: auth.userId,
          lesson_id: lessonId,
          completed: true,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/progress/[lessonId] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark progress' },
      { status: 500 }
    );
  }
}
