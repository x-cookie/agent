'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { badgeImageForLesson } from '@/lib/badgeAssets';

/**
 * Achievement-style modal shown once when a user earns a skill badge for completing
 * a lesson. Vercel-dark, restrained: the badge artwork pops/settles in with a soft
 * glow, no emoji. Auto-dismissable via backdrop / Escape / button.
 */
export function BadgeUnlockModal({
  lessonNum,
  lessonTitle,
  lessonTag,
  onClose,
}: {
  lessonNum: number;
  lessonTitle: string;
  lessonTag?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '340px', maxWidth: '90%',
          background: 'var(--bg2)', border: '0.5px solid var(--bd2)',
          borderRadius: '14px', padding: '32px 28px 24px', textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* soft glow behind badge */}
        <div aria-hidden style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,113,232,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* eyebrow */}
        <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--mono)', marginBottom: '16px', position: 'relative' }}>
          Skill badge unlocked
        </div>

        {/* badge artwork — settles in with a slight overshoot + rotation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', position: 'relative' }}
        >
          <Image src={badgeImageForLesson(lessonNum)} alt="Skill badge" width={108} height={108} priority />
        </motion.div>

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.02em', margin: '0 0 6px', position: 'relative' }}>
          {lessonTitle}
        </h3>
        {lessonTag && (
          <div style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)', marginBottom: '14px', position: 'relative' }}>
            {lessonTag}
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6, margin: '0 0 8px', position: 'relative' }}>
          Pattern mastered — anchored on-chain.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--mono)',
            background: 'rgba(74,222,128,0.08)', border: '0.5px solid rgba(74,222,128,0.25)',
            padding: '5px 12px', borderRadius: '6px', margin: '6px 0 22px', position: 'relative',
          }}
        >
          <i className="ti ti-bolt" style={{ fontSize: '13px' }} aria-hidden />
          Agents you build from this lesson start stronger
        </motion.div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
            background: 'var(--acc)', color: '#000', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', position: 'relative',
          }}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}
