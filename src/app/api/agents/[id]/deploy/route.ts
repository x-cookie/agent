import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

function randomSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}

// GET /api/agents/[id]/deploy — check current deployment status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data } = await supabaseAdmin
      .from('deployments')
      .select('*')
      .eq('agent_id', id)
      .single();

    return NextResponse.json(data ?? null);
  } catch (error) {
    console.error('GET /api/agents/[id]/deploy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deployment' },
      { status: 500 }
    );
  }
}

// POST /api/agents/[id]/deploy — make agent publicly runnable
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: existing } = await supabaseAdmin
      .from('deployments')
      .select('*')
      .eq('agent_id', id)
      .single();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('deployments')
        .update({ is_public: true })
        .eq('agent_id', id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('deployments')
      .insert([{ agent_id: id, public_url: randomSlug() }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/agents/[id]/deploy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deploy agent' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/[id]/deploy — set the USDC price (x402) for a deployed agent
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { priceUsd } = await req.json();
    const price = Number(priceUsd);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('deployments')
      .update({ price_usd: price })
      .eq('agent_id', id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/agents/[id]/deploy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update price' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id]/deploy — unpublish agent
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { error } = await supabaseAdmin
      .from('deployments')
      .update({ is_public: false })
      .eq('agent_id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/agents/[id]/deploy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unpublish agent' },
      { status: 500 }
    );
  }
}
