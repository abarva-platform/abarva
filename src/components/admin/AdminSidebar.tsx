'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COLORS, TYPOGRAPHY } from '@/lib/design/design-tokens';
import {
  ADMIN_SUB_SECTIONS,
  LIVE_CAVEAT_TEXT,
} from '@/lib/admin/admin-shell-config';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        background: COLORS.white,
        borderRight: `1px solid ${COLORS.ink}14`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        minHeight: 0,
        width: '280px',
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: `1px solid ${COLORS.ink}14`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          Setup · Admin
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            fontWeight: 400,
            color: COLORS.ink,
            lineHeight: 1.2,
          }}
        >
          Steward
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}80`,
            marginTop: 3,
            lineHeight: 1.4,
          }}
        >
          Control plane · tenant setup &amp; readiness
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '12px 0',
        }}
      >
        {ADMIN_SUB_SECTIONS.map((section) => {
          const isActive =
            section.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(section.href);

          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: '9px 20px 9px 17px',
                borderLeft: isActive
                  ? `3px solid ${COLORS.navy}`
                  : '3px solid transparent',
                background: isActive ? `${COLORS.navy}0a` : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.1s',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? COLORS.navy : COLORS.ink,
                  lineHeight: 1.3,
                }}
              >
                {section.label}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: `${COLORS.ink}80`,
                  lineHeight: 1.3,
                }}
              >
                {section.subtitle}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — Live caveat pill */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: `1px solid ${COLORS.ink}14`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
            lineHeight: 1.5,
          }}
        >
          {/* Live caveat: Repository manifest + deterministic read models */}
          {LIVE_CAVEAT_TEXT}
        </div>
      </div>
    </aside>
  );
}
