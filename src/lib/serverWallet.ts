import { Keypair, Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { getConnection } from './solana';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

let keypair: Keypair | undefined;

function getServerKeypair(): Keypair {
  if (!keypair) {
    const secret = process.env.SOLANA_PROOF_SIGNER_SECRET;
    if (!secret) throw new Error('SOLANA_PROOF_SIGNER_SECRET not configured');
    keypair = Keypair.fromSecretKey(bs58.decode(secret));
  }
  return keypair;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Writes a memo on-chain recording a hash of the agent's output, signed by our
 * own server wallet (no buyer interaction needed). Returns { proofTx, outputHash }.
 * This is a receipt anyone can verify independently — it doesn't prove the output
 * is "correct", only that this exact output existed at this exact time and wasn't
 * altered afterward.
 */
export async function recordExecutionProof(params: {
  agentId: string;
  buyerWallet: string;
  output: string;
}): Promise<{ proofTx: string; outputHash: string }> {
  const outputHash = await sha256Hex(params.output);
  const memo = JSON.stringify({
    agentId: params.agentId,
    buyer: params.buyerWallet,
    outputHash,
    t: Date.now(),
  });

  const signer = getServerKeypair();
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction({ feePayer: signer.publicKey, blockhash, lastValidBlockHeight }).add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    })
  );
  tx.sign(signer);

  const proofTx = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({ signature: proofTx, blockhash, lastValidBlockHeight }, 'confirmed');

  return { proofTx, outputHash };
}

/**
 * Writes a memo on-chain recording the outcome of a battle (hashes of both
 * outputs + winner), signed by our own server wallet. Same trust model as
 * recordExecutionProof: a receipt anyone can verify, not a correctness proof.
 */
export async function recordBattleProof(params: {
  battleId: string;
  winner: 'a' | 'b' | 'tie';
  outputA: string;
  outputB: string;
}): Promise<{ proofTx: string }> {
  const hashA = await sha256Hex(params.outputA);
  const hashB = await sha256Hex(params.outputB);
  const memo = JSON.stringify({
    battleId: params.battleId,
    winner: params.winner,
    hashA,
    hashB,
    t: Date.now(),
  });

  const signer = getServerKeypair();
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction({ feePayer: signer.publicKey, blockhash, lastValidBlockHeight }).add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    })
  );
  tx.sign(signer);

  const proofTx = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({ signature: proofTx, blockhash, lastValidBlockHeight }, 'confirmed');

  return { proofTx };
}
