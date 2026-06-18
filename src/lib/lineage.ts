import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { getConnection } from './solana';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/** Simple SHA-256-ish digest of agent code, just to fingerprint content without storing it on-chain. */
async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Writes a memo transaction recording {agentId, creator, codeHash} on-chain via Phantom.
 * This is the agent's "birth certificate" — proof of who made it and when, independent of our DB.
 */
export async function registerLineageOnChain(agentId: string, code: string): Promise<string> {
  const phantom = (window as any).solana;
  if (!phantom) throw new Error('Phantom wallet not installed');

  const resp = await phantom.connect();
  const creator: PublicKey = resp.publicKey;
  const codeHash = await hashCode(code);

  const memo = JSON.stringify({ agentId, creator: creator.toBase58(), codeHash, t: Date.now() });

  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction({ feePayer: creator, blockhash, lastValidBlockHeight }).add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    })
  );

  const { signature } = await phantom.signAndSendTransaction(tx);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return signature;
}
