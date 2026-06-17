import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { supabaseAdmin } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, message, signature } = await req.json();

    if (!walletAddress || !message || !signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify signature
    const messageBytes = Buffer.from(message, 'base64');
    const signatureBytes = Buffer.from(signature, 'base64');
    const publicKeyBytes = new PublicKey(walletAddress).toBytes();

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isValid) {
      return NextResponse.json({ error: 'Signature invalid' }, { status: 401 });
    }

    // Message format: "Sign in to Agent Learn: <timestamp>" — reject stale messages (>5 min old).
    const messageText = messageBytes.toString('utf-8');
    const timestampMatch = messageText.match(/:\s*(\d+)$/);
    const messageTimestamp = timestampMatch ? Number(timestampMatch[1]) : NaN;
    if (!Number.isFinite(messageTimestamp) || Math.abs(Date.now() - messageTimestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Sign-in message expired, try again' }, { status: 401 });
    }

    // Reject replay: each signature may only be redeemed once.
    const { error: nonceError } = await supabaseAdmin
      .from('auth_nonces')
      .insert([{ signature, wallet_address: walletAddress }]);
    if (nonceError) {
      if (nonceError.code === '23505') {
        return NextResponse.json({ error: 'Sign-in already used, try again' }, { status: 401 });
      }
      throw nonceError;
    }

    // Get or create user (keyed by wallet address)
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', walletAddress)
      .single();

    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([{ id: walletAddress, email: `${walletAddress}@phantom.local` }])
        .select('id, email')
        .single();

      if (createError) throw createError;
      user = newUser;
    } else if (userError) {
      throw userError;
    }

    // Phase 1.5 token: base64(user_id:wallet_address)
    const token = Buffer.from(`${user!.id}:${walletAddress}`).toString('base64');

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error('Phantom sign-in error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sign-in failed' },
      { status: 500 }
    );
  }
}
