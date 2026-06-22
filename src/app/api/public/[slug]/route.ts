import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/serverAuth';

// GET /api/public/[slug] — fetch a publicly deployed agent (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const { data: deployment, error: deployError } = await supabaseAdmin
      .from('deployments')
      .select('agent_id, is_public, price_usd')
      .eq('public_url', slug)
      .eq('is_public', true)
      .single();

    if (deployError || !deployment) {
      return NextResponse.json({ error: 'Agent not found or not public' }, { status: 404 });
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, name, lesson_id, code')
      .eq('id', deployment.agent_id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ ...agent, price_usd: deployment.price_usd });
  } catch (error) {
    console.error('GET /api/public/[slug] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
