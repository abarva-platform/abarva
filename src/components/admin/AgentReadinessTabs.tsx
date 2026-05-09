'use client';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export type AgentReadinessTab = 'overview' | 'context' | 'capabilities' | 'history';

export interface AgentReadinessTabsProps {
  activeTab: AgentReadinessTab;
  onTabChange: (tab: AgentReadinessTab) => void;
}

const TABS: Array<{ id: AgentReadinessTab; label: string; subtitle: string }> = [
  { id: 'overview', label: 'Overview', subtitle: 'Readiness score' },
  { id: 'context', label: 'Context', subtitle: 'Coverage matrix' },
  { id: 'capabilities', label: 'Capabilities', subtitle: 'Per-agent detail' },
  { id: 'history', label: 'History', subtitle: 'Readiness drift' },
];

export function AgentReadinessTabs({ activeTab, onTabChange }: AgentReadinessTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Agent readiness sections"
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: `1px solid ${COLORS.ink}14`,
        background: COLORS.white,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              padding: `${SPACING.md} ${SPACING.lg}`,
              border: 'none',
              borderBottom: isActive ? `2px solid ${COLORS.navy}` : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? COLORS.navy : COLORS.ink,
              }}
            >
              {tab.label}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                letterSpacing: '0.06em',
                color: `${COLORS.ink}80`,
              }}
            >
              {tab.subtitle}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
