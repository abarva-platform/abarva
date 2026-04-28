/**
 * Per-instance reasoning event timeline.
 *
 * Merges three in-memory reasoning stores into a single time-sorted list of
 * events for a given instance:
 *
 *   - `synthesis-telemetry`        → one event per synthesis call
 *   - `evidence-ingestion-store`   → one event per evidence item ingested
 *   - `contradiction-resolution-state` → one event per contradiction resolved
 *
 * Pure module. No I/O, no side effects on import. Safe to call from server
 * components and tests.
 *
 * The `formatRelativeTime` helper is exported so the presentational component
 * can render "5m ago" without dragging in date-fns.
 */

import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';

export type TimelineEntryKind =
  | 'synthesis'
  | 'evidence-ingested'
  | 'contradiction-resolved';

export interface TimelineEntry {
  /** Stable id for keying the rendered list. */
  id: string;
  /** Discriminator for icon + label styling. */
  kind: TimelineEntryKind;
  /** ISO-8601 timestamp. Newer entries sort first. */
  timestamp: string;
  /** Human-readable single-line summary. */
  label: string;
  /** Event-specific structured details — surfaced as inline chips. */
  meta: Record<string, unknown>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a merged, newest-first event timeline for the given instance id.
 *
 * Pure function: it reads the current snapshot of each store and returns a
 * fresh list. Stable identifiers per source guarantee deterministic keys
 * even when two events share a timestamp.
 */
export function buildInstanceEventTimeline(instanceId: string): TimelineEntry[] {
  if (typeof instanceId !== 'string' || instanceId.length === 0) return [];

  const entries: TimelineEntry[] = [];

  // ── Synthesis events ───────────────────────────────────────────────
  const synth = getRecentSynthesisEvents();
  for (const ev of synth) {
    if (ev.instanceId !== instanceId) continue;
    entries.push({
      id: `synthesis::${ev.id}`,
      kind: 'synthesis',
      timestamp: ev.timestamp,
      label: formatSynthesisLabel(ev.surface, ev.cacheHit, ev.latencyMs),
      meta: {
        surface: ev.surface,
        cacheHit: ev.cacheHit,
        latencyMs: ev.latencyMs,
        citationCount: ev.citationCount,
        contradictionCount: ev.contradictionCount,
        failureModeCount: ev.failureModeCount,
        patternId: ev.patternId,
      },
    });
  }

  // ── Evidence ingestion events ──────────────────────────────────────
  const items = getEvidenceFor(instanceId);
  const ingestTimestamps = getEvidenceTimestampsFor(instanceId);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const ts = ingestTimestamps[i] ?? readItemRecordedAt(item) ?? new Date().toISOString();
    const itemId = readItemId(item) ?? `idx-${i}`;
    entries.push({
      id: `evidence::${itemId}::${i}`,
      kind: 'evidence-ingested',
      timestamp: ts,
      label: formatEvidenceLabel(item),
      meta: {
        field: readString(item, 'field'),
        value: readString(item, 'value'),
        source: readString(item, 'source'),
        kind: readString(item, 'kind'),
      },
    });
  }

  // ── Contradiction resolutions ──────────────────────────────────────
  const resolved = getResolvedEntries();
  const prefix = `${instanceId}::`;
  for (const { id, resolvedAt } of resolved) {
    if (!id.startsWith(prefix)) continue;
    const templateId = id.slice(prefix.length);
    entries.push({
      id: `contradiction-resolved::${id}`,
      kind: 'contradiction-resolved',
      timestamp: resolvedAt,
      label: `Contradiction resolved · ${templateId}`,
      meta: { templateId, fullId: id },
    });
  }

  // Sort newest first. Ties broken by id so the order is deterministic
  // when two entries share a timestamp (e.g. two synthesis events
  // recorded inside the same millisecond in tests).
  entries.sort((a, b) => {
    const cmp = b.timestamp.localeCompare(a.timestamp);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });

  return entries;
}

/**
 * Format an ISO-8601 timestamp as a coarse "time-ago" string.
 *
 *   - < 30s  → "just now"
 *   - < 60m  → "Xm ago"
 *   - < 24h  → "Xh ago"
 *   - < 7d   → "Xd ago"
 *   - else   → ISO date portion ("2026-04-28")
 *
 * `nowMs` is exposed so tests can pin "now" to a deterministic value.
 * Falls back to `Date.now()` when omitted.
 */
export function formatRelativeTime(timestamp: string, nowMs?: number): string {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return timestamp;
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const diffMs = now - t;
  if (diffMs < 0) return 'just now';
  if (diffMs < 30_000) return 'just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return `${days}d ago`;
  return timestamp.slice(0, 10);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function formatSynthesisLabel(
  surface: 'source' | 'programs' | 'tower',
  cacheHit: boolean,
  latencyMs: number,
): string {
  const surfaceLabel =
    surface === 'source' ? 'Sentinel' : surface === 'programs' ? 'Nexus' : 'Atlas';
  const cacheLabel = cacheHit ? 'cache hit' : 'cache miss';
  return `${surfaceLabel} synthesis · ${cacheLabel} · ${Math.round(latencyMs)}ms`;
}

function formatEvidenceLabel(item: IngestedItemReadOnly): string {
  const field = readString(item, 'field');
  const value = readString(item, 'value');
  if (field && value) return `Evidence ingested · ${field} = ${truncate(value, 32)}`;
  if (field) return `Evidence ingested · ${field}`;
  const id = readItemId(item);
  if (id) return `Evidence ingested · ${id}`;
  return 'Evidence ingested';
}

function readString(item: IngestedItemReadOnly, key: string): string | undefined {
  const v = item[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function readItemId(item: IngestedItemReadOnly): string | undefined {
  return readString(item, 'id');
}

function readItemRecordedAt(item: IngestedItemReadOnly): string | undefined {
  const v = readString(item, 'recordedAt');
  if (!v) return undefined;
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? undefined : v;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

type IngestedItemReadOnly = Record<string, unknown>;
