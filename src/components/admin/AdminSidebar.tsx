'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ADMIN_SUB_SECTIONS, LIVE_CAVEAT_TEXT } from '@/lib/admin/admin-shell-config';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '280px',
        background: COLORS.cream,
        borderRight: `1px solid ${COLORS.ink}10`,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header style={{ marginBottom: SPACING.md }}>
        <h2 style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 24, color: COLORS.ink, margin: 0 }}>
          Setup / Admin
        </h2>
        <p style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99`, marginTop: 8, lineHeight: 1.5 }}>
          Steward-led control plane for tenant setup, data trust, access, readiness and architecture.
        </p>
      </header>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ADMIN_SUB_SECTIONS.map((section) => {
          const isActive = pathname === section.href;
          return (
            <Link
              key={section.id}
              href={section.href}
              style={{
                display: 'block',
                padding: `${SPACING.sm} ${SPACING.md}`,
                borderRadius: RADIUS.md,
                background: isActive ? COLORS.skyPale : 'transparent',
                color: COLORS.ink,
                textDecoration: 'none',
                fontFamily: TYPOGRAPHY.sans,
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <div style={{ fontWeight: isActive ? 600 : 500, fontSize: 14 }}>{section.label}</div>
              <div style={{ fontSize: 11, color: `${COLORS.ink}70`, marginTop: 2 }}>{section.subtitle}</div>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div
          style={{
            padding: SPACING.md,
            background: COLORS.amberSoft,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.amberInk,
          }}
        >
          <strong>Live caveat</strong>
          <p style={{ margin: '4px 0 0', lineHeight: 1.4 }}>{LIVE_CAVEAT_TEXT}</p>
        </div>
      </div>
    </aside>
  );
}
