'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SocialIcons } from '@/components/shared/SocialIcons';
import { WalletButton } from '@/components/auth/WalletButton';

const NAV = [
  { href: '/learn', label: 'Learn' },
  { href: '/agents', label: 'My Agents' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/battle', label: 'Battle' },
  { href: '/docs', label: 'Docs' },
];

/** Shared top navigation — matches landing/lesson nav. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 32px',
        height: '60px',
        borderBottom: '0.5px solid var(--bd)',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
        <Image src="/logo-agent.png" alt="logo" width={28} height={28} style={{ borderRadius: '4px' }} />
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t1)', letterSpacing: '-0.02em' }}>agent</span>
      </Link>

      {/* Center: nav links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {NAV.map(l => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/');
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: active ? 'var(--t1)' : 'var(--t2)',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '5px',
                background: active ? 'var(--bg2)' : 'transparent',
                border: '0.5px solid transparent',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Right: socials + wallet */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
        <SocialIcons />
        <WalletButton />
      </div>
    </nav>
  );
}
