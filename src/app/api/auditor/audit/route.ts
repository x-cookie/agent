import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/serverAuth';
import { auditAgent } from '@/lib/auditor';

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, lessonId } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code required (string)' }, { status: 400 });
    }

    if (!lessonId || typeof lessonId !== 'number') {
      return NextResponse.json({ error: 'LessonId required (number)' }, { status: 400 });
    }

    const output = await auditAgent(code, lessonId);
    return NextResponse.json(output, { status: 200 });
  } catch (error) {
    console.error('POST /api/auditor/audit error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
