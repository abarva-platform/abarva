'use client';

import { useUser } from '@clerk/nextjs';

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const FONT_SERIF = 'Georgia, serif';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function TopBar() {
  const { user, isLoaded } = useUser();
  const displayName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? '';
  const avatar = displayName ? initials(displayName) : '';

  return (
    <div
      style={{
        height: 56,
        background: BG,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontFamily: FONT_BODY,
      }}
    >
      <a
        href="/dashboard"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}
      >
        <span style={{ fontFamily: FONT_SERIF, color: INK, fontSize: 17, fontWeight: 800 }}>Abar</span>
        <span style={{ fontFamily: FONT_SERIF, color: TEAL, fontSize: 23, fontWeight: 900 }}>Va</span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isLoaded && displayName && (
          <>
            <div style={{ fontSize: 13, color: MUTE }}>{displayName}</div>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(45,212,200,0.12)',
                border: '0.5px solid rgba(45,212,200,0.3)',
                color: TEAL,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '0.02em',
              }}
            >
              {avatar}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
