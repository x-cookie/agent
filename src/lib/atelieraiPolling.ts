import { supabaseAdmin } from './serverAuth';
import { auditAgent } from './auditor';
import {
  pollPendingOrders,
  quoteOrder,
  deliverAuditResult,
} from './atelieraiClient';

interface OrderPayload {
  id: string;
  status: string;
  agentCode?: string;
  lessonId?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Process a single order: quote → wait for acceptance → audit → deliver
 */
async function processOrder(order: OrderPayload): Promise<void> {
  try {
    console.log(`[Auditor] Processing order ${order.id}, status: ${order.status}`);

    // Step 1: Send quote if in pending_quote state
    if (order.status === 'pending_quote') {
      const quoted = await quoteOrder(order.id, 1000);
      if (!quoted) {
        console.error(`[Auditor] Failed to quote order ${order.id}`);
        return;
      }
      console.log(`[Auditor] Quoted order ${order.id}`);
      // Order will transition via Atelierai side after user accepts
      return;
    }

    // Step 2: If order accepted/paid, run audit
    if (order.status === 'accepted' || order.status === 'paid') {
      if (!order.agentCode || !order.lessonId) {
        console.error(`[Auditor] Order ${order.id} missing agentCode or lessonId`);
        return;
      }

      // Run audit
      const report = await auditAgent(order.agentCode, order.lessonId);

      // Store in audit_reports table
      if (order.userId) {
        await supabaseAdmin
          .from('audit_reports')
          .insert({
            agent_id: null, // We don't have agent_id from Atelierai order, can be set later
            user_id: order.userId,
            grade: report.json.grade,
            score: report.json.score,
            findings: report.json.fixes,
            lesson_id: report.json.lessonId,
            created_at: report.json.timestamp,
          });
      }

      // Deliver result
      const findings = report.json.fixes.map(f => ({
        category: f.issue,
        severity: f.severity,
        detail: f.fix,
      }));
      const delivered = await deliverAuditResult(order.id, {
        grade: report.json.grade,
        score: report.json.score,
        findings,
        timestamp: report.json.timestamp,
        lessonId: report.json.lessonId,
      });
      if (!delivered) {
        console.error(`[Auditor] Failed to deliver audit for order ${order.id}`);
        return;
      }

      console.log(`[Auditor] Delivered audit for order ${order.id}, grade: ${report.json.grade}`);
    }
  } catch (err) {
    console.error(`[Auditor] Error processing order ${order.id}:`, err);
  }
}

/**
 * Poll Atelierai for pending orders and process them
 */
export async function pollAndProcessOrders(): Promise<void> {
  try {
    const orders = await pollPendingOrders();
    if (orders.length === 0) {
      console.log('[Auditor] No pending orders');
      return;
    }

    console.log(`[Auditor] Found ${orders.length} pending order(s)`);

    // Process each order (sequential to avoid rate limiting)
    for (const order of orders) {
      await processOrder(order);
      // Small delay between orders to respect rate limits
      await new Promise(r => setTimeout(r, 100));
    }
  } catch (err) {
    console.error('[Auditor] Poll error:', err);
  }
}

/**
 * Start polling (meant to be called from a cron endpoint or background job)
 */
export async function startAuditorPolling(intervalMs: number = 30000): Promise<void> {
  console.log('[Auditor] Polling started, checking every', intervalMs / 1000, 'seconds');
  setInterval(pollAndProcessOrders, intervalMs);
}
