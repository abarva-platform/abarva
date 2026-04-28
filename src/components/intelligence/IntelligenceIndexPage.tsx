'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { INTELLIGENCE_INDEX_VIEW, type PatternItem } from '@/lib/intelligence/shell-intelligence-fixture';

const TIER_LABELS: Record<'M' | 'T1' | 'T3', string> = {
  M: 'M · Meta · Foundational Frameworks',
  T1: 'T1 · Craft · How-to',
  T3: 'T3 · Use-case · Applied Templates',
};

const STATUS_STYLES: Record<
  PatternItem['status'],
  { bg: string; text: string; label: string }
> = {
  validated: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Validated' },
  'in-review': { bg: SHELL.BLUE_BG, text: SHELL.INK_MID, label: 'In Review' },
  candidate: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Candidate' },
  deprecated: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'Deprecated' },
};

const TIER_PILL_STYLES: Record<'M' | 'T1' | 'T3', { bg: string; text: string }> = {
  M: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  T1: { bg: SHELL.BLUE_BG, text: SHELL.INK_MID },
  T3: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
};

const ALL_PILLS = [
  { key: 'all', label: 'All', count: 17 },
  { key: 'm', label: 'M · Meta', count: 4 },
  { key: 't1', label: 'T1 · Craft', count: 5 },
  { key: 't3', label: 'T3 · Use-case', count: 8 },
  { key: 'inreview', label: 'In review', count: 4 },
];

function PatternRow({ pattern }: { pattern: PatternItem }) {
  const [hovered, setHovered] = useState(false);
  const statusStyle = STATUS_STYLES[pattern.status];
  const tierStyle = TIER_PILL_STYLES[pattern.tier];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        padding: '0 12px',
        gap: 12,
        background: pattern.featured
          ? SHELL.MINT_BG
          : hovered
          ? SHELL.PAPER_SOFT
          : 'transparent',
        borderRadius: 6,
        transition: 'background 0.12s',
        cursor: 'default',
      }}
    >
      {/* Featured star indicator */}
      <div style={{ width: 14, flexShrink: 0, textAlign: 'center' }}>
        {pattern.featured && (
          <span
            style={{
              fontSize: 11,
              color: SHELL.AMBER_DOT,
              lineHeight: 1,
            }}
          >
            ★
          </span>
        )}
      </div>

      {/* Pattern ID */}
      <div
        style={{
          width: 60,
          flexShrink: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        {pattern.id}
      </div>

      {/* Pattern name */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 14,
          fontWeight: 700,
          color: SHELL.INK,
          lineHeight: 1.3,
        }}
      >
        {pattern.name}
      </div>

      {/* Sentinel note */}
      <div
        style={{
          flex: 1,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.4,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {pattern.sentinelNote}
      </div>

      {/* Tier pill */}
      <div
        style={{
          flexShrink: 0,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '3px 7px',
          borderRadius: 10,
          background: tierStyle.bg,
          color: tierStyle.text,
          lineHeight: 1,
          fontWeight: 600,
        }}
      >
        {pattern.tier}
      </div>

      {/* Status pill */}
      <div
        style={{
          flexShrink: 0,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '3px 8px',
          borderRadius: 10,
          background: statusStyle.bg,
          color: statusStyle.text,
          lineHeight: 1,
          fontWeight: 500,
          minWidth: 68,
          textAlign: 'center',
        }}
      >
        {statusStyle.label}
      </div>

      {/* Last reviewed */}
      <div
        style={{
          width: 80,
          flexShrink: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.02em',
          textAlign: 'right',
          lineHeight: 1,
        }}
      >
        {pattern.lastReviewed}
      </div>

      {/* View button */}
      <div
        role="button"
        tabIndex={0}
        style={{
          flexShrink: 0,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: 11,
          border: `1px solid ${SHELL.CARD_LINE}`,
          background: 'transparent',
          color: SHELL.INK_SOFT,
          lineHeight: 1,
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'border-color 0.12s, color 0.12s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = SHELL.INK;
          el.style.color = SHELL.INK;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = SHELL.CARD_LINE;
          el.style.color = SHELL.INK_SOFT;
        }}
      >
        View
      </div>
    </div>
  );
}

function TierSection({
  tier,
  patterns,
}: {
  tier: 'M' | 'T1' | 'T3';
  patterns: PatternItem[];
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 600,
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        }}
      >
        {TIER_LABELS[tier]}
      </div>

      {/* Pattern rows */}
      <div>
        {patterns.map((pattern) => (
          <PatternRow key={pattern.id} pattern={pattern} />
        ))}
      </div>
    </div>
  );
}

export function IntelligenceIndexPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const { tiers, agentQuote, agentContext, actions } = INTELLIGENCE_INDEX_VIEW;

  const pills = ALL_PILLS.map((p) => ({
    ...p,
    active: p.key === activeFilter,
    onClick: () => setActiveFilter(p.key),
  }));

  // Filter patterns based on active pill
  const filteredTiers = {
    M: activeFilter === 'all' || activeFilter === 'm' || activeFilter === 'inreview'
      ? tiers.M.filter((p) => {
          if (activeFilter === 'inreview') return p.status === 'in-review';
          if (activeFilter === 'm') return true;
          return true;
        })
      : [],
    T1: activeFilter === 'all' || activeFilter === 't1' || activeFilter === 'inreview'
      ? tiers.T1.filter((p) => {
          if (activeFilter === 'inreview') return p.status === 'in-review';
          if (activeFilter === 't1') return true;
          return true;
        })
      : [],
    T3: activeFilter === 'all' || activeFilter === 't3' || activeFilter === 'inreview'
      ? tiers.T3.filter((p) => {
          if (activeFilter === 'inreview') return p.status === 'in-review';
          if (activeFilter === 't3') return true;
          return true;
        })
      : [],
  };

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Pattern Library · 17 patterns',
      }}
      middleStrip={<FilterPillStrip pills={pills} />}
    >
      {/* Agent column */}
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={agentQuote}
        agentContext={agentContext}
        actions={actions}
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {filteredTiers.M.length > 0 && (
          <TierSection tier="M" patterns={filteredTiers.M} />
        )}
        {filteredTiers.T1.length > 0 && (
          <TierSection tier="T1" patterns={filteredTiers.T1} />
        )}
        {filteredTiers.T3.length > 0 && (
          <TierSection tier="T3" patterns={filteredTiers.T3} />
        )}
      </div>
    </AppShell>
  );
}
