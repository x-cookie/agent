'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ToastKind = 'success' | 'error';
type ToastItem = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<{ showToast: (message: string, kind?: ToastKind) => void } | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {toasts.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: t.kind === 'success' ? 'var(--green)' : '#ef4444',
                  background: t.kind === 'success' ? '#0a1f0f' : '#7f1d1d20',
                  border: `0.5px solid ${t.kind === 'success' ? 'var(--green2)' : '#dc2626'}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  minWidth: '220px',
                }}
              >
                <i className={`ti ${t.kind === 'success' ? 'ti-check' : 'ti-alert-circle'}`} style={{ fontSize: '14px' }} aria-hidden />
                {t.message}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
