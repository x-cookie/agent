'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';

interface PhantomAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function PhantomAuthModal({ open, onClose }: PhantomAuthModalProps) {
  const { signInWithPhantom } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPhantom();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '0.5px solid var(--bd2)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px' }}>
          Sign in with Phantom
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.6, marginBottom: '24px' }}>
          Connect your Phantom wallet to save agents and sync progress across devices.
        </p>

        {error && (
          <div
            style={{
              fontSize: '12px',
              color: '#ef4444',
              background: '#7f1d1d',
              border: '0.5px solid #dc2626',
              borderRadius: '4px',
              padding: '8px 10px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            background: loading ? 'var(--t4)' : 'var(--acc)',
            color: '#000',
            border: 'none',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? 'Connecting...' : 'Connect Phantom'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--t2)',
            border: '0.5px solid var(--bd2)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        <p style={{ fontSize: '11px', color: 'var(--t4)', marginTop: '16px', lineHeight: 1.5 }}>
          Don't have Phantom?{' '}
          <a
            href="https://phantom.app/download"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--acc)', textDecoration: 'none' }}
          >
            Install now →
          </a>
        </p>
      </div>
    </div>,
    document.body
  );
}
