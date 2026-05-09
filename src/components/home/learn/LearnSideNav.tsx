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
  amber:    '#B7791F',
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
  amber: '#B7791F',
};

export function LearnSideNav() {
  const pathname = usePathname() ?? '';

  function isActive(slug: string): boolean {
    return (
      pathname === `/home/learn/${slug}` ||
      pathname.startsWith(`/home/learn/${slug}/`)
    );
  }

  // only /home/learn (not bare /home) highlights the welcome item
  const onRoot = pathname === '/home/learn';

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
          padding: '16px 20px 14px',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            fontFamily: T.fDisp,
            fontSize: 18,
            fontWeight: 400,
            color: T.ink,
            letterSpacing: '-0.01em',
          }}
        >
          AbarVa
        </div>
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.muted,
            marginTop: 3,
          }}
        >
          Guide & Reference
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
              const active = isActive(item.slug) || (onRoot && item.slug === 'welcome');
              const badgeColorKey = item.phaseColor ?? item.stageColor;
              const badgeColor = badgeColorKey ? BADGE_COLORS[badgeColorKey] : T.navy;
              const badge = item.phaseBadge ?? item.stageBadge;
              // Indent chapters under a case-study anchor. We use a thin
              // connecting line on the left to make the hierarchy visible
              // without re-doing the side-nav layout.
              const indent = item.indent === true;
              const leftPad = indent ? 32 : 20;
              return (
                <Link
                  key={item.slug}
                  href={`/home/learn/${item.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: `7px 20px 7px ${leftPad}px`,
                    fontFamily: T.fBody,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? T.navy : T.body,
                    background: active ? T.navySoft : 'transparent',
                    borderLeft: `2px solid ${active ? T.navy : 'transparent'}`,
                    // Subtle vertical line under the case-study chapters.
                    boxShadow: indent
                      ? `inset 12px 0 0 0 ${T.surface}, inset 13px 0 0 0 ${T.border}`
                      : undefined,
                    textDecoration: 'none',
                    transition: 'background 100ms ease, color 100ms ease',
                  }}
                >
                  {badge && (
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
                      {badge}
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
