'use client';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export type DataTrustTab = 'datasets' | 'governance' | 'quality' | 'lineage';

export interface DataTrustTabsProps {
  activeTab: DataTrustTab;
  onTabChange: (tab: DataTrustTab) => void;
}

const TABS: Array<{ id: DataTrustTab; label: string; subtitle: string }> = [
  { id: 'datasets', label: 'Datasets', subtitle: 'Rung inventory' },
  { id: 'governance', label: 'Governance', subtitle: 'Access & policy' },
  { id: 'quality', label: 'Quality', subtitle: 'Freshness & scores' },
  { id: 'lineage', label: 'Lineage', subtitle: 'Source tracing' },
];

export function DataTrustTabs({ activeTab, onTabChange }: DataTrustTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Data trust sections"
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
