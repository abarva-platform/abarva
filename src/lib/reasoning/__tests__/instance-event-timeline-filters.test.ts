/**
 * Tests for the per-instance reasoning timeline filter helper.
 *
 * Deterministic — every test pins `nowMs` and constructs `TimelineEntry`
 * fixtures inline so no global state from other reasoning stores leaks in.
 */

import {
  filterTimeline,
  parseTimelineFiltersFromSearchParams,
  serializeTimelineFilters,
  TL_KIND_PARAM,
  TL_SEARCH_PARAM,
  TL_SINCE_PARAM,
} from '@/lib/reasoning/instance-event-timeline-filters';
import type { TimelineEntry } from '@/lib/reasoning/instance-event-timeline';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const NOW_MS = Date.parse('2026-04-28T12:00:00.000Z');

function entry(
  partial: Partial<TimelineEntry> & Pick<TimelineEntry, 'id' | 'kind' | 'timestamp' | 'label'>,
): TimelineEntry {
  return { meta: {}, ...partial };
}

const ENTRIES: TimelineEntry[] = [
  // 2 hours ago — synthesis
  entry({
    id: 'synthesis::a',
    kind: 'synthesis',
    timestamp: '2026-04-28T10:00:00.000Z',
    label: 'Sentinel synthesis · cache hit · 240ms',
  }),
  // 26 hours ago — evidence
  entry({
    id: 'evidence::b',
    kind: 'evidence-ingested',
    timestamp: '2026-04-27T10:00:00.000Z',
    label: 'Evidence ingested · BAFO submission = Vendor A',
  }),
  // 5 days ago — contradiction
  entry({
    id: 'contradiction-resolved::c',
    kind: 'contradiction-resolved',
    timestamp: '2026-04-23T12:00:00.000Z',
    label: 'Contradiction resolved · pricing-mismatch',
  }),
  // 14 days ago — synthesis
  entry({
    id: 'synthesis::d',
    kind: 'synthesis',
    timestamp: '2026-04-14T12:00:00.000Z',
    label: 'Atlas synthesis · cache miss · 540ms',
  }),
];

// ─── filterTimeline · base behavior ──────────────────────────────────────────

describe('filterTimeline · base behavior', () => {
  it('returns an empty array when given an empty input', () => {
    expect(filterTimeline([], { nowMs: NOW_MS })).toEqual([]);
  });

  it('returns the original entries (preserving order) when no filters set', () => {
    const out = filterTimeline(ENTRIES, { nowMs: NOW_MS });
    expect(out).toHaveLength(ENTRIES.length);
    expect(out.map((e) => e.id)).toEqual(ENTRIES.map((e) => e.id));
  });

  it('does not mutate the input array', () => {
    const snapshot = ENTRIES.map((e) => e.id);
    filterTimeline(ENTRIES, { kinds: ['synthesis'], nowMs: NOW_MS });
    expect(ENTRIES.map((e) => e.id)).toEqual(snapshot);
  });
});

// ─── filterTimeline · kinds ──────────────────────────────────────────────────

describe('filterTimeline · kinds', () => {
  it('keeps only synthesis entries when kinds=["synthesis"]', () => {
    const out = filterTimeline(ENTRIES, { kinds: ['synthesis'], nowMs: NOW_MS });
    expect(out.map((e) => e.id)).toEqual(['synthesis::a', 'synthesis::d']);
  });

  it('combines kinds — keeps evidence + contradiction-resolved', () => {
    const out = filterTimeline(ENTRIES, {
      kinds: ['evidence-ingested', 'contradiction-resolved'],
      nowMs: NOW_MS,
    });
    expect(out.map((e) => e.kind)).toEqual([
      'evidence-ingested',
      'contradiction-resolved',
    ]);
  });

  it('treats an empty kinds array as "no kind filter"', () => {
    const out = filterTimeline(ENTRIES, { kinds: [], nowMs: NOW_MS });
    expect(out).toHaveLength(ENTRIES.length);
  });
});

// ─── filterTimeline · since ──────────────────────────────────────────────────

describe('filterTimeline · since', () => {
  it('since=d1 keeps only the synthesis entry within the last 24h', () => {
    const out = filterTimeline(ENTRIES, { since: 'd1', nowMs: NOW_MS });
    expect(out.map((e) => e.id)).toEqual(['synthesis::a']);
  });

  it('since=d7 keeps entries within the last 7 days (excludes the 14d-old one)', () => {
    const out = filterTimeline(ENTRIES, { since: 'd7', nowMs: NOW_MS });
    expect(out.map((e) => e.id)).toEqual([
      'synthesis::a',
      'evidence::b',
      'contradiction-resolved::c',
    ]);
  });

  it('since=all keeps every entry', () => {
    const out = filterTimeline(ENTRIES, { since: 'all', nowMs: NOW_MS });
    expect(out).toHaveLength(ENTRIES.length);
  });

  it('drops entries with un-parseable timestamps when a date filter is active', () => {
    const withBad = [
      ...ENTRIES,
      entry({
        id: 'synthesis::bad-ts',
        kind: 'synthesis',
        timestamp: 'not-a-date',
        label: 'Bad timestamp event',
      }),
    ];
    const out = filterTimeline(withBad, { since: 'd1', nowMs: NOW_MS });
    expect(out.map((e) => e.id)).toEqual(['synthesis::a']);
  });
});

// ─── filterTimeline · search ─────────────────────────────────────────────────

describe('filterTimeline · search', () => {
  it('matches case-insensitively on label substring', () => {
    const out = filterTimeline(ENTRIES, { search: 'BAFO', nowMs: NOW_MS });
    expect(out.map((e) => e.id)).toEqual(['evidence::b']);
  });

  it('matches lowercase substring against the same label', () => {
    const out = filterTimeline(ENTRIES, { search: 'bafo', nowMs: NOW_MS });
    expect(out.map((e) => e.id)).toEqual(['evidence::b']);
  });

  it('empty / whitespace-only search behaves as no filter', () => {
    expect(filterTimeline(ENTRIES, { search: '', nowMs: NOW_MS })).toHaveLength(
      ENTRIES.length,
    );
    expect(filterTimeline(ENTRIES, { search: '   ', nowMs: NOW_MS })).toHaveLength(
      ENTRIES.length,
    );
  });

  it('returns an empty array when no label matches', () => {
    expect(
      filterTimeline(ENTRIES, { search: 'no-such-text', nowMs: NOW_MS }),
    ).toEqual([]);
  });
});

// ─── filterTimeline · combined filters ───────────────────────────────────────

describe('filterTimeline · combined filters', () => {
  it('combines kinds + since + search (logical AND)', () => {
    const out = filterTimeline(ENTRIES, {
      kinds: ['synthesis', 'evidence-ingested'],
      since: 'd7',
      search: 'synthesis',
      nowMs: NOW_MS,
    });
    expect(out.map((e) => e.id)).toEqual(['synthesis::a']);
  });

  it('returns an empty array when filters intersect to nothing', () => {
    const out = filterTimeline(ENTRIES, {
      kinds: ['contradiction-resolved'],
      since: 'd1',
      nowMs: NOW_MS,
    });
    expect(out).toEqual([]);
  });
});

// ─── parseTimelineFiltersFromSearchParams ────────────────────────────────────

describe('parseTimelineFiltersFromSearchParams', () => {
  it('returns {} for null / undefined', () => {
    expect(parseTimelineFiltersFromSearchParams(null)).toEqual({});
    expect(parseTimelineFiltersFromSearchParams(undefined)).toEqual({});
  });

  it('decodes a URLSearchParams instance', () => {
    const sp = new URLSearchParams();
    sp.set(TL_KIND_PARAM, 'synthesis,evidence-ingested');
    sp.set(TL_SINCE_PARAM, 'd7');
    sp.set(TL_SEARCH_PARAM, 'BAFO');
    const filters = parseTimelineFiltersFromSearchParams(sp);
    expect(filters.kinds).toEqual(['synthesis', 'evidence-ingested']);
    expect(filters.since).toBe('d7');
    expect(filters.search).toBe('BAFO');
  });

  it('decodes a Next.js plain-record search-params shape', () => {
    const filters = parseTimelineFiltersFromSearchParams({
      [TL_KIND_PARAM]: 'synthesis',
      [TL_SINCE_PARAM]: 'd1',
      [TL_SEARCH_PARAM]: 'cache',
    });
    expect(filters.kinds).toEqual(['synthesis']);
    expect(filters.since).toBe('d1');
    expect(filters.search).toBe('cache');
  });

  it('drops unknown kind tokens but keeps valid ones', () => {
    const filters = parseTimelineFiltersFromSearchParams({
      [TL_KIND_PARAM]: 'synthesis,bogus,contradiction-resolved',
    });
    expect(filters.kinds).toEqual(['synthesis', 'contradiction-resolved']);
  });

  it('omits since when the value is not in the allowed bucket set', () => {
    const filters = parseTimelineFiltersFromSearchParams({
      [TL_SINCE_PARAM]: 'd99',
    });
    expect(filters.since).toBeUndefined();
  });
});

// ─── serializeTimelineFilters ────────────────────────────────────────────────

describe('serializeTimelineFilters', () => {
  it('returns "" for an empty filter set', () => {
    expect(serializeTimelineFilters({})).toBe('');
  });

  it('omits kinds when every kind is selected', () => {
    expect(
      serializeTimelineFilters({
        kinds: ['synthesis', 'evidence-ingested', 'contradiction-resolved'],
      }),
    ).toBe('');
  });

  it('serializes kinds, since, and search round-trip', () => {
    const s = serializeTimelineFilters({
      kinds: ['synthesis'],
      since: 'd7',
      search: 'BAFO',
    });
    const sp = new URLSearchParams(s.startsWith('?') ? s.slice(1) : s);
    expect(sp.get(TL_KIND_PARAM)).toBe('synthesis');
    expect(sp.get(TL_SINCE_PARAM)).toBe('d7');
    expect(sp.get(TL_SEARCH_PARAM)).toBe('BAFO');
  });

  it('omits since when since=all', () => {
    expect(serializeTimelineFilters({ since: 'all' })).toBe('');
  });
});
