'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PhantomAuthModal } from './PhantomAuthModal';

/** Navbar wallet control: connect button when logged out, address + disconnect when logged in. */
export function WalletButton() {
  const { user, loading, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <span style={{ fontSize: '12px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>…</span>
    );
  }

  if (user) {
    const short = `${user.wallet.slice(0, 4)}…${user.wallet.slice(-4)}`;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          title={user.wallet}
          style={{
            fontSize: '12px',
            fontFamily: 'var(--mono)',
            color: 'var(--t2)',
            background: 'var(--bg2)',
            border: '0.5px solid var(--bd2)',
            borderRadius: '5px',
            padding: '6px 10px',
          }}
        >
          {short}
        </span>
        <button
          onClick={signOut}
          title="Disconnect"
          style={{
            fontSize: '12px',
            color: 'var(--t3)',
            background: 'transparent',
            border: '0.5px solid var(--bd2)',
            borderRadius: '5px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: '13px' }} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          padding: '7px 16px',
          borderRadius: '5px',
          background: 'var(--acc)',
          color: '#000',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <i className="ti ti-wallet" style={{ fontSize: '14px' }} aria-hidden />
        Connect
      </button>
      <PhantomAuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
