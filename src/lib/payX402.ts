import { x402Client, x402HTTPClient } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import type { ClientEvmSigner } from '@x402/evm';

/** Phantom's injected EIP-1193 EVM provider (separate from window.solana). */
function getPhantomEvmProvider(): any {
  const phantom = (window as any).phantom;
  if (phantom?.ethereum) return phantom.ethereum;
  // Fallback: some Phantom versions inject only window.ethereum when it's the sole EVM wallet.
  if ((window as any).ethereum?.isPhantom) return (window as any).ethereum;
  throw new Error('Phantom EVM wallet not found. Enable "Ethereum" networks in Phantom settings.');
}

/** Wraps Phantom's EIP-1193 provider as an x402 ClientEvmSigner (EIP-712 signing only, no gas). */
async function buildPhantomEvmSigner(): Promise<ClientEvmSigner> {
  const provider = getPhantomEvmProvider();
  let accounts: string[];
  try {
    accounts = await provider.request({ method: 'eth_requestAccounts' });
  } catch (e) {
    throw new Error(`[connect] ${e instanceof Error ? e.message : String(e)}`);
  }
  const address = accounts[0] as `0x${string}`;
  if (!address) throw new Error('[connect] No EVM account returned by Phantom');

  return {
    address,
    async signTypedData(message) {
      // Phantom's eth_signTypedData_v4 validator requires types.EIP712Domain explicitly;
      // some x402 scheme builders omit it (MetaMask auto-fills it, Phantom does not).
      const domainFields = Object.keys(message.domain ?? {});
      const knownTypes: Record<string, string> = {
        name: 'string',
        version: 'string',
        chainId: 'uint256',
        verifyingContract: 'address',
        salt: 'bytes32',
      };
      const types = { ...message.types } as Record<string, unknown>;
      if (!types.EIP712Domain) {
        types.EIP712Domain = domainFields
          .filter(f => knownTypes[f])
          .map(f => ({ name: f, type: knownTypes[f] }));
      }
      const fixedMessage = { ...message, types };

      const payload = JSON.stringify(fixedMessage, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
      console.log('[x402] signTypedData payload:', fixedMessage);
      try {
        return await provider.request({
          method: 'eth_signTypedData_v4',
          params: [address, payload],
        });
      } catch (e) {
        console.error('[x402] signTypedData failed, payload was:', fixedMessage);
        throw new Error(`[sign] ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  };
}

/**
 * Runs a paid x402 request: POSTs once, and if the server returns 402, signs the
 * USDC payment authorization via Phantom and retries with the payment header attached.
 */
export async function runWithX402Payment(
  url: string,
  body: unknown,
  extraHeaders?: HeadersInit
): Promise<{ output: string; forked?: boolean; proofTx?: string; levelUp?: { agentId: string; agentName: string; newLevel: number } }> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  };

  const firstResponse = await fetch(url, init);
  if (firstResponse.status !== 402) {
    if (!firstResponse.ok) throw new Error((await firstResponse.json()).error || 'Run failed');
    return firstResponse.json();
  }

  const signer = await buildPhantomEvmSigner();
  const client = registerExactEvmScheme(new x402Client(), { signer });
  const httpClient = new x402HTTPClient(client);

  let header;
  try {
    const result = httpClient.parsePaymentResult({
      status: 402,
      getHeader: name => firstResponse.headers.get(name),
      body: await firstResponse.json().catch(() => undefined),
    });
    header = result.header;
  } catch (e) {
    throw new Error(`[parse402] ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!header || !('accepts' in header)) throw new Error('[parse402] Payment required but server sent no payment details');

  let paymentPayload;
  try {
    paymentPayload = await httpClient.createPaymentPayload(header);
  } catch (e) {
    throw new Error(`[createPayload] ${e instanceof Error ? e.message : String(e)}`);
  }
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  const paidResponse = await fetch(url, {
    ...init,
    headers: { ...init.headers, ...paymentHeaders },
  });
  if (!paidResponse.ok) {
    const errBody = await paidResponse.json().catch(() => ({}));
    throw new Error(errBody.error || `Payment failed (${paidResponse.status})`);
  }
  return paidResponse.json();
}
