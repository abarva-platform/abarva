'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import {
  agingSeverity,
  needsAttention,
  portfolioStatusOf,
  stageBandFor,
  valueBandFor,
  STAGE_BANDS,
  type StageBandKey,
  type ValueBandKey,
} from '@/lib/source/portfolio-filtering';
import { leadAgentForStage, type SourceLeadAgent } from '@/lib/source/portfolio-derivations';
import type { SourceRigorLevel, SourcingEventSummary } from '@/lib/source/types';
import { PORTFOLIO } from './portfolio-tokens';

// ── Filter state shape ───────────────────────────────────────────────────────
// Each group is a `Set` of selected option keys. An empty set means "no
// constraint from this group" (match everything). Within a group: OR. Across
// groups: AND.

export type StatusFilterKey = 'active' | 'attention' | 'waiting' | 'completed';

export interface PortfolioFilterState {
  status: Set<StatusFilterKey>;
  band: Set<StageBandKey>;
  agent: Set<SourceLeadAgent>;
  tenant: Set<string>;
  aging: Set<'fresh' | 'stale' | 'bad'>;
  value: Set<ValueBandKey>;
  rigor: Set<SourceRigorLevel>;
  flags: Set<'has_blocker' | 'needs_attention' | 'at_risk'>;
}

export const EMPTY_FILTER_STATE: PortfolioFilterState = {
  status: new Set(),
  band: new Set(),
  agent: new Set(),
  tenant: new Set(),
  aging: new Set(),
  value: new Set(),
  rigor: new Set(),
  flags: new Set(),
};

export function isFilterEmpty(state: PortfolioFilterState): boolean {
  return (
    state.status.size === 0 &&
    state.band.size === 0 &&
    state.agent.size === 0 &&
    state.tenant.size === 0 &&
    state.aging.size === 0 &&
    state.value.size === 0 &&
    state.rigor.size === 0 &&
    state.flags.size === 0
  );
}

export function totalFilterCount(state: PortfolioFilterState): number {
  return (
    state.status.size +
    state.band.size +
    state.agent.size +
    state.tenant.size +
    state.aging.size +
    state.value.size +
    state.rigor.size +
    state.flags.size
  );
}

// Apply the filter state to an event. Used by the page to produce the
// rendered table set.
export function eventMatchesFilters(
  event: SourcingEventSummary,
  state: PortfolioFilterState,
): boolean {
  if (state.status.size > 0) {
    const bucket = portfolioStatusOf(event);
    const matches =
      (bucket === 'active' && state.status.has('active')) ||
      (bucket === 'waiting' && state.status.has('waiting')) ||
      (bucket === 'completed' && state.status.has('completed')) ||
      (state.status.has('attention') && needsAttention(event));
    if (!matches) return false;
  }
  if (state.band.size > 0) {
    if (!state.band.has(stageBandFor(event.currentStageKey, event.status))) return false;
  }
  if (state.agent.size > 0) {
    if (!state.agent.has(leadAgentForStage(event.currentStageKey))) return false;
  }
  if (state.tenant.size > 0) {
    if (!state.tenant.has(event.accountName)) return false;
  }
  if (state.aging.size > 0) {
    const sev = agingSeverity(event.agingDays | 0);
    const bucket: 'fresh' | 'stale' | 'bad' =
      sev === 'normal' ? 'fresh' : sev === 'warn' ? 'stale' : 'bad';
    if (!state.aging.has(bucket)) return false;
  }
  if (state.value.size > 0) {
    if (!state.value.has(valueBandFor(event.valueAtStakeUsd))) return false;
  }
  if (state.rigor.size > 0) {
    if (!state.rigor.has(event.rigor)) return false;
  }
  if (state.flags.size > 0) {
    const matches =
      (state.flags.has('has_blocker') && Boolean(event.blocker)) ||
      (state.flags.has('needs_attention') && needsAttention(event)) ||
      (state.flags.has('at_risk') && event.isAtRisk);
    if (!matches) return false;
  }
  return true;
}

// ── Sidebar component ────────────────────────────────────────────────────────

interface PortfolioFilterSidebarProps {
  events: SourcingEventSummary[];
  state: PortfolioFilterState;
  onChange: (state: PortfolioFilterState) => void;
  showAdvanced?: boolean;
}

export function PortfolioFilterSidebar({
  events,
  state,
  onChange,
}: PortfolioFilterSidebarProps) {
  const counts = useMemo(() => buildCounts(events, state), [events, state]);
  const tenantOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.accountName))).sort(),
    [events],
  );

  const toggle = <K extends keyof PortfolioFilterState>(
    group: K,
    key: PortfolioFilterState[K] extends Set<infer V> ? V : never,
  ) => {
    const next = new Set<typeof key>(
      state[group] as unknown as Iterable<typeof key>,
    );
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...state, [group]: next });
  };

  const totalActive = totalFilterCount(state);

  return (
    <aside
      data-testid="source-portfolio-filter-sidebar"
      aria-label="Filter sourcing events"
      style={SIDEBAR_STYLE}
    >
      <header style={SIDEBAR_HEAD_STYLE}>
        <span style={HEAD_LABEL_STYLE}>Filters</span>
        {totalActive > 0 ? (
          <button
            type="button"
            onClick={() => onChange(emptyState())}
            data-testid="source-portfolio-filter-reset"
            style={RESET_STYLE}
          >
            Reset · {totalActive}
          </button>
        ) : null}
      </header>

      <FilterGroup label="Status">
        <FilterRow
          label="Active"
          count={counts.status.active}
          checked={state.status.has('active')}
          onChange={() => toggle('status', 'active')}
        />
        <FilterRow
          label="At risk"
          count={counts.status.attention}
          checked={state.status.has('attention')}
          onChange={() => toggle('status', 'attention')}
          accent={PORTFOLIO.BLOCKED}
        />
        <FilterRow
          label="Waiting"
          count={counts.status.waiting}
          checked={state.status.has('waiting')}
          onChange={() => toggle('status', 'waiting')}
        />
        <FilterRow
          label="Completed"
          count={counts.status.completed}
          checked={state.status.has('completed')}
          onChange={() => toggle('status', 'completed')}
        />
      </FilterGroup>

      <FilterGroup label="Stage band">
        {(Object.keys(STAGE_BANDS) as StageBandKey[])
          .filter((k) => k !== 'completed') // already covered by status
          .map((key) => (
            <FilterRow
              key={key}
              label={STAGE_BANDS[key].title}
              count={counts.band[key] ?? 0}
              checked={state.band.has(key)}
              onChange={() => toggle('band', key)}
            />
          ))}
      </FilterGroup>

      {/* Lead-agent filter intentionally omitted — agents stay hidden behind
          workflow surfaces; primary nav + filters are workflow-anchored. */}
      {tenantOptions.length > 1 ? (
        <FilterGroup label="Tenant">
          {tenantOptions.map((tenant) => (
            <FilterRow
              key={tenant}
              label={tenant}
              count={counts.tenant[tenant] ?? 0}
              checked={state.tenant.has(tenant)}
              onChange={() => toggle('tenant', tenant)}
            />
          ))}
        </FilterGroup>
      ) : null}
    </aside>
  );
}

function emptyState(): PortfolioFilterState {
  return {
    status: new Set(),
    band: new Set(),
    agent: new Set(),
    tenant: new Set(),
    aging: new Set(),
    value: new Set(),
    rigor: new Set(),
    flags: new Set(),
  };
}

// ── Group + row presentational pieces ────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={GROUP_STYLE}>
      <div style={GROUP_LABEL_STYLE}>{label}</div>
      <div style={{ display: 'grid', gap: 2 }}>{children}</div>
    </div>
  );
}

interface FilterRowProps {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  accent?: string;
}

function FilterRow({ label, count, checked, onChange, accent }: FilterRowProps) {
  return (
    <label
      style={{
        ...ROW_LABEL_STYLE,
        color: count === 0 && !checked ? PORTFOLIO.INK_MUTED : PORTFOLIO.INK,
        cursor: count === 0 && !checked ? 'default' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={count === 0 && !checked}
        style={CHECKBOX_STYLE}
      />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        {accent ? (
          <span aria-hidden style={{ ...ACCENT_DOT_STYLE, background: accent }} />
        ) : null}
        <span style={ROW_LABEL_TEXT_STYLE}>{label}</span>
      </span>
      <span style={ROW_COUNT_STYLE}>{count}</span>
    </label>
  );
}

// ── Counts ───────────────────────────────────────────────────────────────────

interface CountsBundle {
  status: Record<StatusFilterKey, number>;
  band: Record<StageBandKey, number>;
  agent: Record<SourceLeadAgent, number>;
  tenant: Record<string, number>;
  aging: Record<'fresh' | 'stale' | 'bad', number>;
  value: Record<ValueBandKey, number>;
  rigor: Record<SourceRigorLevel, number>;
  flags: Record<'has_blocker' | 'needs_attention' | 'at_risk', number>;
}

/**
 * For each filter option, count the events that *would* match if that option
 * were toggled on (with all other groups still applied). This is the standard
 * faceted-search count behavior — keeps option counts honest as the user
 * narrows down. Within-group OR / across-group AND.
 */
function buildCounts(
  events: SourcingEventSummary[],
  state: PortfolioFilterState,
): CountsBundle {
  const counts: CountsBundle = {
    status: { active: 0, attention: 0, waiting: 0, completed: 0 },
    band: { discovery: 0, evaluation: 0, decision: 0, transition: 0, completed: 0 },
    agent: { Nexus: 0, Sentinel: 0, Steward: 0, Atlas: 0 },
    tenant: {},
    aging: { fresh: 0, stale: 0, bad: 0 },
    value: { under_5m: 0, '5_to_10m': 0, '10_to_25m': 0, over_25m: 0 },
    rigor: { standard: 0, enhanced: 0, strategic: 0 },
    flags: { has_blocker: 0, needs_attention: 0, at_risk: 0 },
  };

  for (const event of events) {
    // For each group, compute the match if we IGNORE this group's selections.
    const matchIgnoringStatus = matchesExcept(event, state, 'status');
    if (matchIgnoringStatus) {
      const bucket = portfolioStatusOf(event);
      if (bucket === 'active') counts.status.active += 1;
      else if (bucket === 'waiting') counts.status.waiting += 1;
      else if (bucket === 'completed') counts.status.completed += 1;
      if (needsAttention(event)) counts.status.attention += 1;
    }

    if (matchesExcept(event, state, 'band')) {
      const band = stageBandFor(event.currentStageKey, event.status);
      counts.band[band] = (counts.band[band] ?? 0) + 1;
    }
    if (matchesExcept(event, state, 'agent')) {
      const a = leadAgentForStage(event.currentStageKey);
      counts.agent[a] = (counts.agent[a] ?? 0) + 1;
    }
    if (matchesExcept(event, state, 'tenant')) {
      counts.tenant[event.accountName] = (counts.tenant[event.accountName] ?? 0) + 1;
    }
    if (matchesExcept(event, state, 'aging')) {
      const sev = agingSeverity(event.agingDays | 0);
      const bucket: 'fresh' | 'stale' | 'bad' =
        sev === 'normal' ? 'fresh' : sev === 'warn' ? 'stale' : 'bad';
      counts.aging[bucket] += 1;
    }
    if (matchesExcept(event, state, 'value')) {
      counts.value[valueBandFor(event.valueAtStakeUsd)] += 1;
    }
    if (matchesExcept(event, state, 'rigor')) {
      counts.rigor[event.rigor] += 1;
    }
    if (matchesExcept(event, state, 'flags')) {
      if (event.blocker) counts.flags.has_blocker += 1;
      if (needsAttention(event)) counts.flags.needs_attention += 1;
      if (event.isAtRisk) counts.flags.at_risk += 1;
    }
  }

  return counts;
}

/** Test event against state with one group's selections cleared. */
function matchesExcept(
  event: SourcingEventSummary,
  state: PortfolioFilterState,
  ignored: keyof PortfolioFilterState,
): boolean {
  const cleared = { ...state, [ignored]: new Set() } as PortfolioFilterState;
  return eventMatchesFilters(event, cleared);
}

// ── Styles ───────────────────────────────────────────────────────────────────

const SIDEBAR_STYLE: CSSProperties = {
  width: 232,
  flexShrink: 0,
  display: 'grid',
  gap: PORTFOLIO.S_BLOCK,
  alignContent: 'start',
  padding: '4px 0 24px',
};

const SIDEBAR_HEAD_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 12,
  borderBottom: `1px solid ${PORTFOLIO.HAIRLINE}`,
};

const HEAD_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK,
  fontWeight: 600,
};

const RESET_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_SOFT,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
};

const GROUP_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const GROUP_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
  fontWeight: 500,
};

const ROW_LABEL_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 8,
  padding: '4px 4px 4px 0',
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  borderRadius: 4,
};

const CHECKBOX_STYLE: CSSProperties = {
  width: 13,
  height: 13,
  margin: 0,
  cursor: 'inherit',
  accentColor: PORTFOLIO.INK,
};

const ROW_LABEL_TEXT_STYLE: CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const ROW_COUNT_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.04em',
  color: PORTFOLIO.INK_MUTED,
  fontVariantNumeric: 'tabular-nums',
};

const ACCENT_DOT_STYLE: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  display: 'inline-block',
};
