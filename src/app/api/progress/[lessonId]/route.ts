import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';
import { recordBadgeProof } from '@/lib/serverWallet';

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

    // Mint a skill badge the first time this lesson is completed (idempotent via unique constraint).
    // Best-effort: a missing/unfunded signer must not block marking progress.
    const { data: existingBadge } = await supabaseAdmin
      .from('skill_badges')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    let badgeAwarded = false;
    if (!existingBadge) {
      let badgeTx: string | null = null;
      try {
        const proof = await recordBadgeProof({ userWallet: auth.wallet, lessonId });
        badgeTx = proof.proofTx;
      } catch (proofError) {
        console.error('Failed to anchor skill badge on-chain:', proofError);
      }
      const { error: badgeError } = await supabaseAdmin
        .from('skill_badges')
        .insert([{ user_id: auth.userId, lesson_id: lessonId, badge_tx: badgeTx }]);
      badgeAwarded = !badgeError;
    }

    return NextResponse.json({ ...data, badgeAwarded }, { status: 201 });
  } catch (error) {
    console.error('POST /api/progress/[lessonId] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark progress' },
      { status: 500 }
    );
  }
}
