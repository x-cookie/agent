'use client';

export type RobotVariant = 'idle' | 'fighting' | 'winner' | 'loser';

const STYLES = `
  @keyframes robot-bob {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-5px); }
  }
  @keyframes robot-fight {
    0%   { transform: translateX(0) rotate(0deg); }
    20%  { transform: translateX(4px) rotate(-3deg); }
    40%  { transform: translateX(-3px) rotate(2deg); }
    60%  { transform: translateX(5px) rotate(-2deg); }
    80%  { transform: translateX(-2px) rotate(1deg); }
    100% { transform: translateX(0) rotate(0deg); }
  }
  @keyframes robot-win {
    0%,100% { transform: translateY(0) scale(1); }
    30%     { transform: translateY(-12px) scale(1.05); }
    60%     { transform: translateY(-6px) scale(1.02); }
  }
  @keyframes robot-lose {
    0%,100% { transform: rotate(0deg); }
    50%     { transform: rotate(-8deg) translateY(2px); }
  }
  @keyframes eye-pulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }
  @keyframes eye-fight {
    0%,100% { opacity: 1; transform: scaleX(1); }
    50%      { opacity: 0.9; transform: scaleX(0.85); }
  }
  @keyframes eye-win {
    0%,60%,100% { transform: scaleY(1); }
    30%         { transform: scaleY(0.15); }
  }
  @keyframes chest-breathe {
    0%,100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }
  @keyframes chest-fight {
    0%,100% { opacity: 0.7; r: 6; }
    50%      { opacity: 1; r: 8; }
  }
  @keyframes chest-win {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }
  @keyframes platform-pulse {
    0%,100% { opacity: 0.4; transform: scaleX(1); }
    50%      { opacity: 0.15; transform: scaleX(1.12); }
  }
  @keyframes platform-win {
    0%,100% { opacity: 0.8; transform: scaleX(1.1); }
    50%      { opacity: 0.3; transform: scaleX(0.9); }
  }
  @keyframes win-burst {
    0%   { opacity: 0; transform: scale(0.5); }
    40%  { opacity: 1; transform: scale(1.3); }
    100% { opacity: 0; transform: scale(2); }
  }
  @keyframes spark-a {
    0%   { transform: translate(0,0) scale(1); opacity:1; }
    100% { transform: translate(-12px,-16px) scale(0); opacity:0; }
  }
  @keyframes spark-b {
    0%   { transform: translate(0,0) scale(1); opacity:1; }
    100% { transform: translate(10px,-14px) scale(0); opacity:0; }
  }
  @keyframes spark-c {
    0%   { transform: translate(0,0) scale(1); opacity:1; }
    100% { transform: translate(14px,-8px) scale(0); opacity:0; }
  }
`;

function RobotSVG({
  variant,
  size,
  flip = false,
  compact = false,
}: {
  variant: RobotVariant;
  size: number;
  flip?: boolean;
  compact?: boolean;
}) {
  const u = (n: number) => (n / 120) * size;

  const bodyAnim =
    variant === 'fighting' ? 'robot-fight 0.6s ease-in-out infinite' :
    variant === 'winner'   ? 'robot-win 0.8s ease-in-out infinite' :
    variant === 'loser'    ? 'robot-lose 2s ease-in-out infinite' :
    'robot-bob 2.4s ease-in-out infinite';

  const eyeAnim =
    variant === 'fighting' ? 'eye-fight 0.6s ease-in-out infinite' :
    variant === 'winner'   ? 'eye-win 1.2s ease-in-out infinite' :
    'eye-pulse 2.4s ease-in-out infinite';

  const eyeColor =
    variant === 'loser' ? '#ef4444' :
    variant === 'winner' ? '#4ade80' :
    '#4ade80';

  const platformAnim =
    variant === 'winner' ? 'platform-win 0.6s ease-in-out infinite' : 'platform-pulse 2.4s ease-in-out infinite';

  const opacity = variant === 'loser' ? 0.85 : 1;
  const filter = undefined;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: compact ? size : size * 1.25,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      overflow: compact ? 'hidden' : undefined,
      opacity,
      filter,
      transform: flip ? 'scaleX(-1)' : undefined,
    }}>
      {/* Winner burst ring */}
      {variant === 'winner' && !compact && (
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: u(80),
          height: u(80),
          borderRadius: '50%',
          border: `${u(2)}px solid #4ade80`,
          animation: 'win-burst 1s ease-out infinite',
          pointerEvents: 'none',
        }}/>
      )}

      {/* Fighting sparks */}
      {variant === 'fighting' && !compact && (
        <>
          <div style={{ position:'absolute', top: u(20), left: u(50), width: u(5), height: u(5), borderRadius:'50%', background:'#4ade80', animation:'spark-a 0.7s ease-out infinite' }}/>
          <div style={{ position:'absolute', top: u(28), left: u(55), width: u(4), height: u(4), borderRadius:'50%', background:'#86efac', animation:'spark-b 0.7s ease-out infinite 0.2s' }}/>
          <div style={{ position:'absolute', top: u(18), left: u(62), width: u(3), height: u(3), borderRadius:'50%', background:'#4ade80', animation:'spark-c 0.7s ease-out infinite 0.4s' }}/>
        </>
      )}

      {/* Body group */}
      <div style={{ animation: bodyAnim, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(2), marginBottom: u(6) }}>

        {/* Head */}
        <svg width={u(68)} height={u(58)} viewBox="0 0 68 58" fill="none">
          <rect x="4" y="10" width="60" height="44" rx="18" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5"/>
          <rect x="10" y="20" width="48" height="22" rx="8" fill="#111" stroke="#222" strokeWidth="1"/>
          {/* Eyes — loser shows single bar */}
          {variant === 'loser' ? (
            <rect x="18" y="28" width="32" height="5" rx="2.5" fill="#ef4444"/>
          ) : (
            <>
              <rect x="16" y="25" width="14" height="10" rx="2" fill={eyeColor} style={{ animation: eyeAnim }}/>
              <rect x="38" y="25" width="14" height="10" rx="2" fill={eyeColor} style={{ animation: `${eyeAnim.split(' ')[0]} ${eyeAnim.split(' ').slice(1).join(' ')} 0.2s` }}/>
            </>
          )}
          <rect x="31" y="1" width="6" height="12" rx="3" fill="#2a2a2a"/>
          <circle cx="34" cy="2" r="3" fill={variant === 'loser' ? '#ef4444' : '#4ade80'} style={{ animation: variant === 'loser' ? undefined : eyeAnim }}/>
          <rect x="0" y="22" width="6" height="14" rx="3" fill="#222"/>
          <rect x="62" y="22" width="6" height="14" rx="3" fill="#222"/>
        </svg>

        {/* Body */}
        <div style={{ position: 'relative' }}>
          <svg width={u(64)} height={u(54)} viewBox="0 0 64 54" fill="none">
            <rect x="4" y="2" width="56" height="48" rx="10" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5"/>
            <rect x="14" y="10" width="36" height="28" rx="6" fill="#111" stroke="#1f1f1f" strokeWidth="1"/>
            <circle cx="32" cy="24" r="10" fill="#0a0a0a" stroke="#222" strokeWidth="1"/>
            <circle cx="32" cy="24" r="6" fill={variant === 'loser' ? '#ef4444' : '#4ade80'}
              style={{ animation: variant === 'loser' ? undefined : variant === 'winner' ? 'chest-win 0.4s ease-in-out infinite' : variant === 'fighting' ? 'chest-breathe 0.6s ease-in-out infinite' : 'chest-breathe 2.4s ease-in-out infinite' }}/>
            <line x1="32" y1="16" x2="32" y2="32" stroke="#0a0a0a" strokeWidth="1.5"/>
            <line x1="24" y1="24" x2="40" y2="24" stroke="#0a0a0a" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="3" fill="#222"/>
            <circle cx="56" cy="8" r="3" fill="#222"/>
          </svg>

          {/* Arms — fighting raises left arm */}
          <svg style={{ position: 'absolute', left: -u(14), top: variant === 'fighting' ? -u(4) : u(6), transition: 'top 0.3s' }} width={u(14)} height={u(38)} viewBox="0 0 14 38" fill="none">
            <rect x="2" y="0" width="10" height="30" rx="5" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.2"/>
            <rect x="0" y="28" width="14" height="10" rx="4" fill="#222"/>
          </svg>
          <svg style={{ position: 'absolute', right: -u(14), top: u(6) }} width={u(14)} height={u(38)} viewBox="0 0 14 38" fill="none">
            <rect x="2" y="0" width="10" height="30" rx="5" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.2"/>
            <rect x="0" y="28" width="14" height="10" rx="4" fill="#222"/>
          </svg>
        </div>

        {/* Legs — loser slightly spread */}
        <div style={{ display: 'flex', gap: variant === 'loser' ? u(14) : u(10) }}>
          {[0,1].map(i => (
            <svg key={i} width={u(18)} height={u(24)} viewBox="0 0 18 24" fill="none"
              style={{ transform: variant === 'loser' ? (i === 0 ? 'rotate(-8deg)' : 'rotate(8deg)') : undefined }}>
              <rect x="2" y="0" width="14" height="18" rx="5" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.2"/>
              <rect x="0" y="16" width="18" height="8" rx="4" fill="#222"/>
            </svg>
          ))}
        </div>
      </div>

      {/* Platform */}
      {!compact && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: u(90), height: u(16) }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `${u(1.5)}px solid ${variant === 'loser' ? '#ef4444' : '#4ade80'}`,
          animation: variant === 'loser' ? undefined : platformAnim,
          opacity: variant === 'loser' ? 0.3 : undefined,
        }}/>
        <div style={{
          position: 'absolute', inset: u(4), borderRadius: '50%',
          border: `${u(1)}px solid ${variant === 'loser' ? '#dc2626' : '#4ade80'}`,
          animation: variant === 'loser' ? undefined : `${platformAnim.split(' ')[0]} ${platformAnim.split(' ').slice(1).join(' ')} 0.4s`,
          opacity: variant === 'loser' ? 0.2 : undefined,
        }}/>
      </div>}
    </div>
  );
}

export function RobotMascot({ variant = 'idle', size = 120, flip = false, compact = false }: { variant?: RobotVariant; size?: number; flip?: boolean; compact?: boolean }) {
  return (
    <>
      <style>{STYLES}</style>
      <RobotSVG variant={variant} size={size} flip={flip} compact={compact} />
    </>
  );
}

/** Two robots facing each other for the fighting state */
export function RobotBattleScene({ nameA, nameB }: { nameA: string; nameB: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '32px', padding: '24px 0 8px', position: 'relative' }}>
      <style>{STYLES}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <RobotSVG variant="fighting" size={90} />
        <span style={{ fontSize: '11px', color: 'var(--t2)', fontFamily: 'var(--mono)', maxWidth: '100px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameA}</span>
      </div>

      {/* VS badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '32px' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--acc)', fontFamily: 'var(--mono)', letterSpacing: '0.04em', textShadow: '0 0 12px var(--acc)' }}>VS</span>
        <span style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)', animation: 'eye-pulse 1s ease-in-out infinite' }}>battling…</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <RobotSVG variant="fighting" size={90} flip />
        <span style={{ fontSize: '11px', color: 'var(--t2)', fontFamily: 'var(--mono)', maxWidth: '100px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameB}</span>
      </div>
    </div>
  );
}
