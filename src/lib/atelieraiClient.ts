interface AtelierResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const BASE_URL = 'https://api.useatelier.ai';

function getAuthHeader(): string {
  const apiKey = process.env.ATELIERAI_API_KEY;
  if (!apiKey) {
    throw new Error('ATELIERAI_API_KEY not configured');
  }
  return `Bearer ${apiKey}`;
}

async function apiCall<T>(
  method: 'GET' | 'POST' | 'PATCH',
  endpoint: string,
  body?: unknown
): Promise<AtelierResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Atelier API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Register Agent Auditor service on Atelierai marketplace
 */
export async function registerAuditorService(
  agentId: string,
  description: string = 'AI agent code auditor — reviews code quality against curriculum patterns',
  priceInCredits: number = 1000
): Promise<{ serviceId?: string; success: boolean }> {
  try {
    const result = await apiCall<{ id: string }>(
      'POST',
      `/api/agents/${agentId}/services`,
      {
        name: 'Agent Auditor',
        description,
        type: 'audit',
        pricingModel: 'fixed',
        price: priceInCredits,
        currency: 'credits',
      }
    );
    return {
      serviceId: result.data?.id,
      success: result.success,
    };
  } catch (err) {
    console.error('registerAuditorService error:', err);
    throw err;
  }
}

/**
 * Poll for pending orders (orders in pending_quote status)
 */
export async function pollPendingOrders(): Promise<
  Array<{
    id: string;
    status: string;
    agentCode?: string;
    lessonId?: number;
    userId?: string;
    metadata?: Record<string, unknown>;
  }>
> {
  try {
    const result = await apiCall<
      Array<{
        id: string;
        status: string;
        agentCode?: string;
        lessonId?: number;
        userId?: string;
        metadata?: Record<string, unknown>;
      }>
    >('GET', '/api/agents/ext_1783002313225_enxpv3ru1/orders');

    return result.data || [];
  } catch (err) {
    console.error('pollPendingOrders error:', err);
    return [];
  }
}

/**
 * Send quote for an order
 */
export async function quoteOrder(
  orderId: string,
  priceInCredits: number = 1000
): Promise<boolean> {
  try {
    const result = await apiCall(
      'POST',
      `/api/orders/${orderId}/quote`,
      {
        price: priceInCredits,
        currency: 'credits',
      }
    );
    return result.success;
  } catch (err) {
    console.error('quoteOrder error:', err);
    throw err;
  }
}

/**
 * Deliver audit report for an order
 */
export async function deliverAuditResult(
  orderId: string,
  report: {
    grade: string;
    score: number;
    findings: Array<{ category: string; severity: string; detail: string }>;
    timestamp: string;
    lessonId: number;
  }
): Promise<boolean> {
  try {
    const result = await apiCall(
      'POST',
      `/api/orders/${orderId}/deliver`,
      {
        report,
        timestamp: new Date().toISOString(),
      }
    );
    return result.success;
  } catch (err) {
    console.error('deliverAuditResult error:', err);
    throw err;
  }
}
