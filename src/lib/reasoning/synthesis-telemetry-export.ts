/**
 * Synthesis telemetry — export helpers.
 *
 * Pure converters from {@link SynthesisTelemetryEvent} arrays to CSV or
 * JSON strings for offline analysis (spreadsheets, ad-hoc scripts, etc.).
 *
 * Both helpers are deterministic: same input array produces byte-identical
 * output. No I/O, no time references, no randomness — safe to call from
 * tests and from server route handlers.
 */

import type { SynthesisTelemetryEvent } from '@/lib/reasoning/synthesis-telemetry';

/**
 * Column order for CSV export. Stable across releases — downstream tooling
 * (spreadsheet templates, BI imports) can rely on the order. Add new
 * columns at the end so existing imports keep working.
 *
 * Internal-only fields like the synthetic `id` are intentionally omitted —
 * they are useful for cache lookups but noise in offline analysis.
 */
export const TELEMETRY_CSV_COLUMNS = [
  'timestamp',
  'surface',
  'instanceId',
  'patternId',
  'cacheHit',
  'latencyMs',
  'citationCount',
  'contradictionCount',
  'failureModeCount',
  'gateCount',
  'feedback',
  'feedbackTimestamp',
] as const;

type CsvColumn = (typeof TELEMETRY_CSV_COLUMNS)[number];

/**
 * RFC-4180-style CSV escape: wrap in double quotes and double any existing
 * quotes when the field contains a quote, comma, or newline (CR or LF).
 * Plain numeric/text fields pass through unquoted.
 */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fieldFor(event: SynthesisTelemetryEvent, column: CsvColumn): string {
  switch (column) {
    case 'timestamp':
      return event.timestamp;
    case 'surface':
      return event.surface;
    case 'instanceId':
      return event.instanceId;
    case 'patternId':
      return event.patternId ?? '';
    case 'cacheHit':
      return event.cacheHit ? 'true' : 'false';
    case 'latencyMs':
      return String(event.latencyMs);
    case 'citationCount':
      return String(event.citationCount);
    case 'contradictionCount':
      return String(event.contradictionCount);
    case 'failureModeCount':
      return String(event.failureModeCount);
    case 'gateCount':
      return String(event.gateCount);
    case 'feedback':
      return event.feedback ?? '';
    case 'feedbackTimestamp':
      return event.feedbackTimestamp ?? '';
  }
}

/**
 * Convert an array of telemetry events to a CSV string.
 *
 * The first row is the header, listing columns in {@link TELEMETRY_CSV_COLUMNS}
 * order. Subsequent rows are one event each. Fields containing a comma,
 * double-quote, or newline are quoted per RFC 4180.
 *
 * Empty input still produces a header row so the output is always parseable
 * by CSV readers.
 */
export function eventsToCsv(events: ReadonlyArray<SynthesisTelemetryEvent>): string {
  const header = TELEMETRY_CSV_COLUMNS.join(',');
  if (events.length === 0) {
    return `${header}\n`;
  }

  const rows: string[] = [header];
  for (const event of events) {
    const cells = TELEMETRY_CSV_COLUMNS.map((column) => escapeCsvField(fieldFor(event, column)));
    rows.push(cells.join(','));
  }
  // Trailing newline so common tools (Excel, `wc -l`) report the expected
  // line count and so concatenation is well-behaved.
  return `${rows.join('\n')}\n`;
}

export interface EventsToJsonOptions {
  /** When true, indent with 2 spaces. Default false (compact). */
  pretty?: boolean;
}

/**
 * Convert an array of telemetry events to a JSON string.
 *
 * Output shape: `{ events: [...] }` so downstream readers can extend the
 * envelope (e.g. to add a `summary` field) without breaking parsers.
 */
export function eventsToJson(
  events: ReadonlyArray<SynthesisTelemetryEvent>,
  options: EventsToJsonOptions = {},
): string {
  const indent = options.pretty ? 2 : 0;
  return JSON.stringify({ events }, null, indent);
}
