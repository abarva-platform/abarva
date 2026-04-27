// ADMIN14 — Data Trust sub-navigation tabs.
//
// Server component. Tab switching is URL-searchParam driven (?tab=<key>).
// No client state, no hydration.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  DataTrustTabKey,
  DataTrustTabMeta,
} from '@/lib/admin/data-trust-page-view';

export interface DataTrustTabsProps {
  tabs: ReadonlyArray<DataTrustTabMeta>;
  activeTab: DataTrustTabKey;
  baseUrl: string;
}

export function DataTrustTabs({ tabs, activeTab, baseUrl }: DataTrustTabsProps) {
  return (
    <nav
      aria-label="Data Trust sections"
      data-data-trust-tabs="true"
      style={{
        display: 'flex',
        gap: SPACING.xs,
        padding: SPACING.xs,
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const href = `${baseUrl}?tab=${tab.key}`;
        return (
          <Link
            key={tab.key}
            href={href}
            data-tab-key={tab.key}
            data-tab-active={isActive ? 'true' : 'false'}
            aria-current={isActive ? 'page' : undefined}
            style={{
              padding: `${SPACING.sm} ${SPACING.md}`,
              borderRadius: RADIUS.sm,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              background: isActive ? COLORS.skyPale : 'transparent',
              color: isActive ? COLORS.navy : `${COLORS.ink}cc`,
              border: isActive ? `1px solid ${COLORS.navy}30` : `1px solid transparent`,
              transition: 'background 120ms ease',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
