'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  buildCommercialMissionsViewModel,
  type SourceMissionDisplayItem,
} from '@/lib/source/source-commercial-missions-view';

// ─── AbarVa design tokens ────────────────────────────────────────────────────
const C = {
  bg:       '#FAFAF9',
  ink:      '#0F0E0D',
  body:     '#3D3B38',
  muted:    '#706D66',
  border:   '#E8E6E3',
  accent:   '#1E3A5F',
} as const;

// Priority chip palette (bg / text)
const PRIORITY_CHIP: Record<'high' | 'medium' | 'low', { bg: string; color: string }> = {
  high:   { bg: '#FEE2E2', color: '#991B1B' },
  medium: { bg: '#FEF9C3', color: '#92400E' },
  low:    { bg: '#DCFCE7', color: '#166534' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function PriorityChip({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const { bg, color } = PRIORITY_CHIP[priority];
  const style: CSSProperties = {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.03em',
    background: bg,
    color,
    whiteSpace: 'nowrap',
  };
  return <span style={style}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

function AgentChip({ owner }: { owner: string }) {
  const style: CSSProperties = {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    background: `${C.accent}14`,
    color: C.accent,
    border: `1px solid ${C.accent}30`,
    whiteSpace: 'nowrap',
  };
  return <span style={style}>{owner}</span>;
}

function MissionRow({ item }: { item: SourceMissionDisplayItem }) {
  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    gap: 8,
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: `1px solid ${C.border}`,
    background: C.bg,
  };
  const labelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: C.body,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const statusStyle: CSSProperties = {
    fontSize: 11,
    color: C.muted,
    whiteSpace: 'nowrap',
  };
  return (
    <div style={rowStyle}>
      <AgentChip owner={item.agentOwner} />
      <span style={labelStyle}>{item.label}</span>
      <PriorityChip priority={item.priority} />
      <span style={statusStyle}>{item.statusLabel}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SourceCommercialMissionsPanel({
  rfpId,
  vendorList,
}: {
  rfpId: string;
  vendorList: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  const vm = buildCommercialMissionsViewModel(rfpId, vendorList, 5);

  // When expanded we show all missions (re-run with a large cap)
  const expandedVm = expanded
    ? buildCommercialMissionsViewModel(rfpId, vendorList, 999)
    : null;

  const visibleMissions = expanded ? (expandedVm?.missions ?? vm.missions) : vm.missions;

  const panelStyle: CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  };

  // Header
  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${C.border}`,
    background: C.bg,
  };
  const headingStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: C.accent,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };
  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    padding: '0 6px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
    background: '#FEE2E2',
    color: '#991B1B',
  };

  // Agent summary row
  const agentRowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '8px 16px',
    borderBottom: `1px solid ${C.border}`,
    background: C.bg,
  };

  // Show more / less
  const toggleStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    borderTop: `1px solid ${C.border}`,
    fontSize: 12,
    fontWeight: 600,
    color: C.accent,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  };

  // Caveat
  const caveatStyle: CSSProperties = {
    padding: '8px 16px',
    fontSize: 11,
    color: C.muted,
    borderTop: `1px solid ${C.border}`,
    lineHeight: 1.5,
  };

  return (
    <section style={panelStyle} aria-label="Commercial Missions">
      {/* Header */}
      <div style={headerStyle}>
        <span style={headingStyle}>Commercial Missions</span>
        {vm.highPriorityCount > 0 && (
          <span style={badgeStyle} title="High-priority missions">
            {vm.highPriorityCount}
          </span>
        )}
      </div>

      {/* Agent summary pills */}
      <div style={agentRowStyle}>
        {Object.entries(vm.agentSummary).map(([agent, count]) => (
          <span
            key={agent}
            style={{
              display: 'inline-flex',
              gap: 4,
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: `${C.accent}0D`,
              color: C.accent,
              border: `1px solid ${C.border}`,
            }}
          >
            {agent}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 16,
                height: 16,
                borderRadius: 99,
                background: C.accent,
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {count}
            </span>
          </span>
        ))}
      </div>

      {/* Mission list */}
      <div>
        {visibleMissions.length === 0 ? (
          <div style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>
            No missions in queue.
          </div>
        ) : (
          visibleMissions.map((item) => (
            <MissionRow key={item.missionId} item={item} />
          ))
        )}
      </div>

      {/* Show more / less toggle */}
      {vm.hasMore && (
        <button
          style={toggleStyle}
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded
            ? `Show fewer missions`
            : `Show all ${vm.totalMissionCount} missions`}
        </button>
      )}

      {/* Caveat footer */}
      <div style={caveatStyle}>{vm.caveat}</div>
    </section>
  );
}
