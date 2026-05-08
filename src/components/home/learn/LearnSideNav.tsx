'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEARN_NAV } from '@/lib/home/learn-nav';

const T = {
  navy:     '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.08)',
  navyLine: 'rgba(27,43,92,0.18)',
  teal:     '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.08)',
  ink:      '#0A0C12',
  body:     '#1F2433',
  muted:    '#6B7280',
  border:   '#E5E7EB',
  surface:  '#FAFAFA',
  fBody:    "'Inter', -apple-system, sans-serif",
  fMono:    "'JetBrains Mono', ui-monospace, monospace",
  fDisp:    "'Fraunces', Georgia, serif",
};

const BADGE_COLORS: Record<string, string> = {
  grey:  '#6B7280',
  navy:  '#1B2B5C',
  teal:  '#0E8A65',
};

export function LearnSideNav() {
  const pathname = usePathname() ?? '';

  function isActive(slug: string): boolean {
    return (
      pathname === `/home/learn/${slug}` ||
      pathname.startsWith(`/home/learn/${slug}/`)
    );
  }

  // Special case: /home/learn itself → highlight welcome
  const onLearnRoot = pathname === '/home/learn';

  return (
    <aside
      style={{
        width: 230,
        minWidth: 230,
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 14px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <Link
          href="/home"
          style={{
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.muted,
            textDecoration: 'none',
          }}
        >
          ← Home
        </Link>
        <div
          style={{
            fontFamily: T.fDisp,
            fontSize: 18,
            fontWeight: 400,
            color: T.ink,
            letterSpacing: '-0.01em',
          }}
        >
          User Guide
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0',
        }}
      >
        {LEARN_NAV.map((group) => (
          <div key={group.group} style={{ marginBottom: 6 }}>
            {/* Group label */}
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: T.muted,
                padding: '10px 20px 4px',
              }}
            >
              {group.group}
            </div>

            {/* Items */}
            {group.items.map((item) => {
              const active = isActive(item.slug) || (onLearnRoot && item.slug === 'welcome');
              const badgeColor = item.phaseColor ? BADGE_COLORS[item.phaseColor] : T.navy;
              return (
                <Link
                  key={item.slug}
                  href={`/home/learn/${item.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 20px',
                    fontFamily: T.fBody,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? T.navy : T.body,
                    background: active ? T.navySoft : 'transparent',
                    borderLeft: `2px solid ${active ? T.navy : 'transparent'}`,
                    textDecoration: 'none',
                    transition: 'background 100ms ease, color 100ms ease',
                  }}
                >
                  {item.phaseBadge && (
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#fff',
                        background: badgeColor,
                        borderRadius: 3,
                        padding: '2px 5px',
                        flexShrink: 0,
                      }}
                    >
                      {item.phaseBadge}
                    </span>
                  )}
                  <span style={{ lineHeight: 1.35 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: `1px solid ${T.border}`,
          fontFamily: T.fMono,
          fontSize: 9,
          color: T.muted,
          letterSpacing: '0.06em',
        }}
      >
        AbarVa v2026.05
      </div>
    </aside>
  );
}
