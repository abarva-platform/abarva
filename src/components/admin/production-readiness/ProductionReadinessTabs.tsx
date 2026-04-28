// ADMIN16 — Production Readiness sub-navigation tabs.
//
// Server component. Tab switching is URL-searchParam driven (?tab=<key>).
// No client state, no hydration.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  ProductionReadinessTabKey,
  ProductionReadinessTabMeta,
} from '@/lib/admin/production-readiness-page-view';

export interface ProductionReadinessTabsProps {
  tabs: ReadonlyArray<ProductionReadinessTabMeta>;
  activeTab: ProductionReadinessTabKey;
  baseUrl: string;
}

export function ProductionReadinessTabs({
  tabs,
  activeTab,
  baseUrl,
}: ProductionReadinessTabsProps) {
  return (
    <nav
      aria-label="Production readiness sections"
      data-production-readiness-tabs="true"
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
