import { NextRequest, NextResponse } from 'next/server';
import { pollAndProcessOrders } from '@/lib/atelieraiPolling';

/**
 * Cron endpoint to poll Atelierai for orders and process them
 * Triggered by external cron service (e.g., GitHub Actions, cron-job.org)
 *
 * Usage: GET /api/cron/atelierai-polling?secret=CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pollAndProcessOrders();
    return NextResponse.json({ success: true, message: 'Polling completed' }, { status: 200 });
  } catch (err) {
    console.error('Cron polling error:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Internal error',
      },
      { status: 500 }
    );
  }
}
