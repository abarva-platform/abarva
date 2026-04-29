/**
 * Per-instance reasoning event timeline — filter layer.
 *
 * Pure helper that narrows a `TimelineEntry[]` according to a `TimelineFilters`
 * descriptor. Decoupled from the timeline builder so the same filter rules
 * can run server-side (URL → filtered list → SSR) and inside any future
 * client-side refresh path.
 *
 * Filter dimensions:
 *
 *   - `kinds`   — keep only entries whose `kind` is in the set.
 *                 `undefined` / empty array → no kind filter applied.
 *   - `since`   — date range bucket: `'d1'` (last 24h), `'d7'` (last 7d),
 *                 `'all'` (no filter). `nowMs` is exposed so deterministic
 *                 tests can pin "now" without mocking `Date`.
 *   - `search`  — case-insensitive substring match on `entry.label`.
 *                 Empty / whitespace-only string is treated as "no filter".
 *
 * URL helpers (`parseTimelineFiltersFromSearchParams`,
 * `serializeTimelineFilters`) live alongside the pure filter so the same
 * grammar drives both the server render and the form-bar links.
 */

import type {
  TimelineEntry,
  TimelineEntryKind,
} from '@/lib/reasoning/instance-event-timeline';

// ─── Public types ────────────────────────────────────────────────────────────

export type TimelineSinceBucket = 'd1' | 'd7' | 'all';

export interface TimelineFilters {
  /** When omitted or empty, all kinds pass. */
  kinds?: readonly TimelineEntryKind[];
  /** Defaults to `'all'` when omitted. */
  since?: TimelineSinceBucket;
  /** Pinpoint "now" for deterministic tests. */
  nowMs?: number;
  /** Case-insensitive substring on `entry.label`. */
  search?: string;
}

const KIND_VALUES: readonly TimelineEntryKind[] = [
  'synthesis',
  'evidence-ingested',
  'contradiction-resolved',
];

const SINCE_VALUES: readonly TimelineSinceBucket[] = ['d1', 'd7', 'all'];

// ─── URL search param keys ──────────────────────────────────────────────────

export const TL_KIND_PARAM = 'tlKind';
export const TL_SINCE_PARAM = 'tlSince';
export const TL_SEARCH_PARAM = 'tlSearch';

// ─── Pure filter ────────────────────────────────────────────────────────────

/**
 * Filter a newest-first `TimelineEntry[]` by kind / date range / label search.
 *
 * Pure function — does not mutate either argument and returns a fresh array.
 * Order is preserved.
 */
export function filterTimeline(
  entries: TimelineEntry[],
  filters: TimelineFilters,
): TimelineEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const kindSet =
    filters.kinds && filters.kinds.length > 0
      ? new Set(filters.kinds)
      : null;

  const since = filters.since ?? 'all';
  const cutoffMs = computeCutoffMs(since, filters.nowMs);

  const search =
    typeof filters.search === 'string' && filters.search.trim().length > 0
      ? filters.search.trim().toLowerCase()
      : null;

  const out: TimelineEntry[] = [];
  for (const entry of entries) {
    if (kindSet && !kindSet.has(entry.kind)) continue;

    if (cutoffMs !== null) {
      const t = Date.parse(entry.timestamp);
      if (Number.isNaN(t)) continue;
      if (t < cutoffMs) continue;
    }

    if (search) {
      const label = typeof entry.label === 'string' ? entry.label.toLowerCase() : '';
      if (!label.includes(search)) continue;
    }

    out.push(entry);
  }
  return out;
}

// ─── URL helpers ────────────────────────────────────────────────────────────

/**
 * Decode `TimelineFilters` from a URL search param bag. Accepts both the
 * `URLSearchParams` instance and a plain `Record<string, string | string[] |
 * undefined>` (Next.js 16 search-param shape).
 */
export function parseTimelineFiltersFromSearchParams(
  source:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | undefined
    | null,
): TimelineFilters {
  if (!source) return {};

  const rawKind = readParam(source, TL_KIND_PARAM);
  const rawSince = readParam(source, TL_SINCE_PARAM);
  const rawSearch = readParam(source, TL_SEARCH_PARAM);

  const filters: TimelineFilters = {};

  if (rawKind && rawKind.length > 0) {
    const tokens = rawKind
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const valid = tokens.filter((t): t is TimelineEntryKind =>
      (KIND_VALUES as readonly string[]).includes(t),
    );
    if (valid.length > 0) filters.kinds = valid;
  }

  if (rawSince && (SINCE_VALUES as readonly string[]).includes(rawSince)) {
    filters.since = rawSince as TimelineSinceBucket;
  }

  if (rawSearch && rawSearch.trim().length > 0) {
    filters.search = rawSearch;
  }

  return filters;
}

/**
 * Encode `TimelineFilters` back into a URL-search-param string. Omits keys
 * for any dimension whose filter is "all" so the URL stays short.
 *
 * Always returns a leading `?` when non-empty, or `''` when no params apply.
 * Useful for building filter-bar links.
 */
export function serializeTimelineFilters(filters: TimelineFilters): string {
  const params = new URLSearchParams();

  if (filters.kinds && filters.kinds.length > 0 && filters.kinds.length < KIND_VALUES.length) {
    params.set(TL_KIND_PARAM, filters.kinds.join(','));
  }

  if (filters.since && filters.since !== 'all') {
    params.set(TL_SINCE_PARAM, filters.since);
  }

  if (typeof filters.search === 'string' && filters.search.trim().length > 0) {
    params.set(TL_SEARCH_PARAM, filters.search.trim());
  }

  const s = params.toString();
  return s.length > 0 ? `?${s}` : '';
}

/** Convenience: list of every selectable kind. */
export const ALL_TIMELINE_KINDS = KIND_VALUES;

/** Convenience: list of every selectable date-range bucket. */
export const ALL_TIMELINE_SINCE_BUCKETS = SINCE_VALUES;

// ─── Internals ──────────────────────────────────────────────────────────────

const ONE_DAY_MS = 86_400_000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

function computeCutoffMs(
  since: TimelineSinceBucket,
  nowMs: number | undefined,
): number | null {
  if (since === 'all') return null;
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  if (since === 'd1') return now - ONE_DAY_MS;
  if (since === 'd7') return now - SEVEN_DAYS_MS;
  return null;
}

function readParam(
  source:
    | URLSearchParams
    | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) {
    const v = source.get(key);
    return v ?? undefined;
  }
  const raw = source[key];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0) return raw[0];
  return undefined;
}
