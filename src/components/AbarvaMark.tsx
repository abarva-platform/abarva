'use client'

export default function AbarvaMark({ size = 26, hub = '#2DD4C8', nodes = '#60A5FA' }: {
  size?: number
  hub?: string
  nodes?: string
}) {
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{ flexShrink: 0, display: 'block' }}
        aria-hidden="true"
      >
        <line x1="16" y1="16" x2="8"  y2="9"  stroke={nodes} strokeWidth="1.1" opacity="0.55" />
        <line x1="16" y1="16" x2="24" y2="9"  stroke={nodes} strokeWidth="1.1" opacity="0.55" />
        <line x1="16" y1="16" x2="8"  y2="23" stroke={nodes} strokeWidth="1.1" opacity="0.55" />
        <line x1="16" y1="16" x2="24" y2="23" stroke={nodes} strokeWidth="1.1" opacity="0.55" />
        <circle cx="8"  cy="9"  r="2.6" fill={nodes} />
        <circle cx="24" cy="9"  r="2.6" fill={nodes} />
        <circle cx="8"  cy="23" r="2.6" fill={nodes} />
        <circle cx="24" cy="23" r="2.6" fill={nodes} />
        <circle cx="16" cy="16" r="4.5" fill={hub} style={{ animation: 'abarvaMarkPulse 2.4s ease-in-out infinite' }} />
      </svg>
      <style>{`
        @keyframes abarvaMarkPulse {
          0%, 100% { opacity: 1;    transform-origin: 16px 16px; transform: scale(1);    }
          50%      { opacity: 0.72; transform-origin: 16px 16px; transform: scale(0.88); }
        }
      `}</style>
    </>
  )
}
