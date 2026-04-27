// ADMIN12 — Agent Readiness sub-navigation tabs.
//
// Server component. Tab switching is URL-searchParam driven (?agent=<key>).
// No client state, no hydration.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  AgentReadinessTabKey,
  AgentReadinessTabMeta,
} from '@/lib/admin/agent-readiness-page-view';

export interface AgentReadinessTabsProps {
  tabs: ReadonlyArray<AgentReadinessTabMeta>;
  activeTab: AgentReadinessTabKey;
  baseUrl: string;
}

export function AgentReadinessTabs({ tabs, activeTab, baseUrl }: AgentReadinessTabsProps) {
  return (
    <nav
      aria-label="Agent Readiness sections"
      data-agent-readiness-tabs="true"
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
        const href = `${baseUrl}?agent=${tab.key}`;
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
