import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getConnection } from './solana';

/** Builds and sends a SOL transfer via Phantom, returns the confirmed tx signature. */
export async function payViaPhantom(sellerWallet: string, lamports: number): Promise<string> {
  const phantom = (window as any).solana;
  if (!phantom) throw new Error('Phantom wallet not installed');

  const resp = await phantom.connect();
  const buyerPubkey: PublicKey = resp.publicKey;

  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: buyerPubkey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: buyerPubkey,
      toPubkey: new PublicKey(sellerWallet),
      lamports,
    })
  );

  const { signature } = await phantom.signAndSendTransaction(tx);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return signature;
}
