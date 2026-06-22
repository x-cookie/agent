import { x402ResourceServer, HTTPFacilitatorClient, type HTTPRequestContext } from '@x402/core/server';
import type { Network } from '@x402/core/types';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { supabaseAdmin } from './serverAuth';

export const X402_NETWORK = (process.env.NEXT_PUBLIC_X402_NETWORK || 'eip155:84532') as Network; // Base Sepolia testnet
const FACILITATOR_URL = process.env.NEXT_PUBLIC_X402_FACILITATOR || 'https://x402.org/facilitator';
const RECIPIENT_ADDRESS = process.env.PAYMENT_RECIPIENT_ADDRESS || '';

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

export const x402Server = new x402ResourceServer(facilitatorClient).register(X402_NETWORK, new ExactEvmScheme());

/** Extracts the deployment slug from a request path like /api/public/<slug>/run */
function slugFromPath(path: string): string | null {
  const match = path.match(/\/api\/public\/([^/]+)\/run/);
  return match ? match[1] : null;
}

/** Dynamic price: looks up the deployment's price_usd by slug from the request path. */
export async function priceForRequest(context: HTTPRequestContext): Promise<string> {
  const slug = slugFromPath(context.path);
  if (!slug) return '0';

  const { data } = await supabaseAdmin
    .from('deployments')
    .select('price_usd')
    .eq('public_url', slug)
    .eq('is_public', true)
    .single();

  return `$${data ? data.price_usd : '0'}`;
}

/** Reads a deployment's price_usd directly (used by the route handler to decide whether to gate payment at all). */
export async function deploymentPrice(slug: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('deployments')
    .select('price_usd')
    .eq('public_url', slug)
    .eq('is_public', true)
    .single();
  return data ? Number(data.price_usd) : null;
}

export function payToAddress(): string {
  return RECIPIENT_ADDRESS;
}

/** Extracts the listing id from a request path like /api/marketplace/<id>/run */
function listingIdFromPath(path: string): string | null {
  const match = path.match(/\/api\/marketplace\/([^/]+)\/run/);
  return match ? match[1] : null;
}

/** Dynamic price: looks up the marketplace listing's price_usd by id from the request path. */
export async function priceForListingRequest(context: HTTPRequestContext): Promise<string> {
  const id = listingIdFromPath(context.path);
  if (!id) return '0';

  const { data } = await supabaseAdmin
    .from('marketplace_listings')
    .select('price_usd')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  return `$${data ? data.price_usd : '0'}`;
}

/** Dynamic payTo: pays the listing seller's own EVM (Base) wallet, not the platform's. */
export async function payToListingSeller(context: HTTPRequestContext): Promise<string> {
  const id = listingIdFromPath(context.path);
  if (!id) return RECIPIENT_ADDRESS;

  const { data } = await supabaseAdmin
    .from('marketplace_listings')
    .select('payout_evm_address')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  return data?.payout_evm_address || RECIPIENT_ADDRESS;
}

/** Reads a listing's price_usd directly (used by the route handler to decide whether to gate payment at all). */
export async function listingPrice(id: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('marketplace_listings')
    .select('price_usd')
    .eq('id', id)
    .eq('is_active', true)
    .single();
  return data ? Number(data.price_usd) : null;
}
