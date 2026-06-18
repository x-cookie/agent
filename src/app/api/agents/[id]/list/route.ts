import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/serverAuth';

// GET /api/agents/[id]/list — check current marketplace listing (owner only)
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
      .from('marketplace_listings')
      .select('*')
      .eq('agent_id', id)
      .single();

    return NextResponse.json(data ?? null);
  } catch (error) {
    console.error('GET /api/agents/[id]/list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// POST /api/agents/[id]/list — publish/update marketplace listing
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
      .select('id, lineage_tx')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();
    if (agentError || !agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { priceLamports, description, lineageTx } = await req.json();
    const price = Number.isFinite(priceLamports) ? Math.max(0, Math.floor(priceLamports)) : 0;

    if (!agent.lineage_tx && lineageTx) {
      await supabaseAdmin.from('agents').update({ lineage_tx: lineageTx }).eq('id', id);
    }

    const { data: existing } = await supabaseAdmin
      .from('marketplace_listings')
      .select('id')
      .eq('agent_id', id)
      .single();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('marketplace_listings')
        .update({ price_lamports: price, description, is_active: true, seller_wallet: auth.wallet })
        .eq('agent_id', id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('marketplace_listings')
      .insert([{ agent_id: id, seller_wallet: auth.wallet, price_lamports: price, description }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/agents/[id]/list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id]/list — unlist from marketplace
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
      .from('marketplace_listings')
      .update({ is_active: false })
      .eq('agent_id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/agents/[id]/list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unlist agent' },
      { status: 500 }
    );
  }
}
