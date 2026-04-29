/**
 * InstanceEventTimelineFilterBar — server-renderable filter strip.
 *
 * Sits directly above the `InstanceEventTimeline`. Renders a `<form
 * method="get">` so navigating filters is just a regular HTTP GET on the
 * current page — no client JS required for the filter to take effect.
 *
 * The form preserves any unrelated query params on the page (e.g. Programs
 * detail's `?phase=N`) by re-emitting them as hidden inputs.
 *
 * Filter dimensions, mirroring `TimelineFilters`:
 *
 *   - Three checkbox-style buttons for `kinds` (all on by default)
 *   - A 3-radio group for `since` (`d1` / `d7` / `all`)
 *   - A small free-text `search` input
 *
 * Palette: AbarVa SHELL tokens only.
 */

import {
  ALL_TIMELINE_KINDS,
  ALL_TIMELINE_SINCE_BUCKETS,
  TL_KIND_PARAM,
  TL_SEARCH_PARAM,
  TL_SINCE_PARAM,
  type TimelineFilters,
  type TimelineSinceBucket,
} from '@/lib/reasoning/instance-event-timeline-filters';
import type { TimelineEntryKind } from '@/lib/reasoning/instance-event-timeline';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface InstanceEventTimelineFilterBarProps {
  /** Currently-applied filters (decoded from URL search params). */
  filters: TimelineFilters;
  /**
   * Form action — usually the current pathname. Defaults to `''` so the form
   * posts back to the same URL.
   */
  action?: string;
  /**
   * Any unrelated search params already on the page that should be preserved
   * across filter submissions (e.g. `phase=3`). Each key/value emits a hidden
   * `<input>` so they survive the GET round-trip.
   */
  preserveParams?: Readonly<Record<string, string | undefined>>;
}

const KIND_LABEL: Record<TimelineEntryKind, string> = {
  synthesis: 'Synthesis',
  'evidence-ingested': 'Evidence',
  'contradiction-resolved': 'Contradictions',
};

const SINCE_LABEL: Record<TimelineSinceBucket, string> = {
  d1: 'Last 24h',
  d7: 'Last 7d',
  all: 'All time',
};

export function InstanceEventTimelineFilterBar({
  filters,
  action = '',
  preserveParams,
}: InstanceEventTimelineFilterBarProps) {
  // When `kinds` is undefined or covers all kinds, treat every checkbox as
  // checked. This matches the spec ("all on by default") and gives the user
  // a way to deselect via the checkboxes.
  const kindOn = (k: TimelineEntryKind): boolean => {
    if (!filters.kinds || filters.kinds.length === 0) return true;
    return filters.kinds.includes(k);
  };

  const since: TimelineSinceBucket = filters.since ?? 'all';
  const search = typeof filters.search === 'string' ? filters.search : '';

  return (
    <form
      data-testid="instance-event-timeline-filter-bar"
      method="get"
      action={action}
      style={formStyle}
    >
      {preserveParams &&
        Object.entries(preserveParams).map(([k, v]) =>
          typeof v === 'string' && v.length > 0 ? (
            <input key={`hp-${k}`} type="hidden" name={k} value={v} />
          ) : null,
        )}

      {/* Kinds — three checkboxes labelled like buttons */}
      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Kinds</legend>
        {ALL_TIMELINE_KINDS.map((k) => {
          const checked = kindOn(k);
          return (
            <label key={k} style={checked ? chipOnStyle : chipOffStyle}>
              <input
                type="checkbox"
                name={TL_KIND_PARAM}
                value={k}
                defaultChecked={checked}
                style={visuallyHiddenStyle}
              />
              {KIND_LABEL[k]}
            </label>
          );
        })}
      </fieldset>

      {/* Since — single radio group */}
      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Since</legend>
        {ALL_TIMELINE_SINCE_BUCKETS.map((b) => {
          const checked = since === b;
          return (
            <label key={b} style={checked ? chipOnStyle : chipOffStyle}>
              <input
                type="radio"
                name={TL_SINCE_PARAM}
                value={b}
                defaultChecked={checked}
                style={visuallyHiddenStyle}
              />
              {SINCE_LABEL[b]}
            </label>
          );
        })}
      </fieldset>

      {/* Search */}
      <label style={searchWrapStyle}>
        <span style={legendStyle}>Search</span>
        <input
          type="search"
          name={TL_SEARCH_PARAM}
          defaultValue={search}
          placeholder="filter by label…"
          style={searchInputStyle}
          aria-label="Filter timeline by label"
        />
      </label>

      <button type="submit" style={submitStyle}>
        Apply
      </button>
    </form>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  padding: '8px 10px',
  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
};

const fieldsetStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: 'none',
  padding: 0,
  margin: 0,
};

const legendStyle: React.CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  padding: 0,
  marginRight: 4,
};

const chipBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: SHELL.SANS,
  fontSize: 11,
  borderRadius: 999,
  padding: '3px 9px',
  cursor: 'pointer',
  border: `1px solid ${SHELL.CARD_LINE}`,
  userSelect: 'none',
};

const chipOnStyle: React.CSSProperties = {
  ...chipBase,
  background: SHELL.INK,
  color: SHELL.PAPER,
  borderColor: SHELL.INK,
};

const chipOffStyle: React.CSSProperties = {
  ...chipBase,
  background: SHELL.GRAY_BG,
  color: SHELL.INK_SOFT,
};

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  clip: 'rect(0 0 0 0)',
  overflow: 'hidden',
};

const searchWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const searchInputStyle: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  padding: '4px 8px',
  borderRadius: 6,
  border: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.CARD_WHITE,
  color: SHELL.INK,
  minWidth: 140,
};

const submitStyle: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  padding: '4px 12px',
  borderRadius: 6,
  border: `1px solid ${SHELL.INK}`,
  background: SHELL.INK,
  color: SHELL.PAPER,
  cursor: 'pointer',
};
