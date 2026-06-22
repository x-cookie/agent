import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/serverAuth';

// GET /api/agents/[id]/job-logs — recent background job activity for this agent.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('job_logs')
    .select('id, role, output, created_at')
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
