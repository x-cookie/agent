'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncLocalDataToServer } from '@/lib/syncLocalData';

interface User {
  id: string;
  email: string;
  wallet: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPhantom: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Decode token to get user ID (phase 1.5: token = base64(user_id:wallet))
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [userId, wallet] = decoded.split(':');
          // In real phase 2, fetch full user data from API
          setUser({
            id: userId,
            email: `${wallet}@phantom.local`,
            wallet,
          });
        }
      } catch (e) {
        console.error('Auth check failed:', e);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signInWithPhantom = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Check if Phantom is installed
      const phantom = (window as any).solana;
      if (!phantom) {
        throw new Error('Phantom wallet not installed');
      }

      // Request connection
      const response = await phantom.connect();
      const walletAddress = response.publicKey.toString();

      // Sign message (proof of ownership)
      const message = new TextEncoder().encode(`Sign in to Agent Learn: ${Date.now()}`);
      const signResult = await phantom.signMessage(message, 'utf8');
      const signature = Buffer.from(signResult.signature).toString('base64');

      // Send to backend for verification and auth
      const res = await fetch('/api/auth/phantom-sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          message: Buffer.from(message).toString('base64'),
          signature,
        }),
      });

      if (!res.ok) throw new Error('Sign in failed');

      const { token, user: userData } = await res.json();

      // Store token in localStorage (phase 1.5 MVP auth)
      if (token) {
        await syncLocalDataToServer(token);
        localStorage.setItem('authToken', token);
        setUser({
          id: userData.id,
          email: userData.email,
          wallet: walletAddress,
        });
      }
    } catch (e) {
      console.error('Phantom sign-in failed:', e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithPhantom, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
