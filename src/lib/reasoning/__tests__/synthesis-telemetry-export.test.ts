/**
 * Synthesis telemetry export tests.
 *
 * Pure converters — deterministic inputs, deterministic outputs.
 */

import {
  eventsToCsv,
  eventsToJson,
  TELEMETRY_CSV_COLUMNS,
} from '@/lib/reasoning/synthesis-telemetry-export';
import type {
  SynthesisFeedback,
  SynthesisSurface,
  SynthesisTelemetryEvent,
} from '@/lib/reasoning/synthesis-telemetry';

interface PartialEvent {
  surface?: SynthesisSurface;
  instanceId?: string;
  patternId?: string | null;
  cacheHit?: boolean;
  latencyMs?: number;
  citationCount?: number;
  contradictionCount?: number;
  failureModeCount?: number;
  gateCount?: number;
  feedback?: SynthesisFeedback;
  feedbackTimestamp?: string;
  id?: string;
  timestamp?: string;
}

let counter = 0;
function ev(p: PartialEvent = {}): SynthesisTelemetryEvent {
  counter += 1;
  return {
    id: p.id ?? `tlm_test_${counter}`,
    timestamp: p.timestamp ?? `2026-04-28T00:00:${String(counter).padStart(2, '0')}.000Z`,
    surface: p.surface ?? 'source',
    tenantId: 'apex-retail',
    instanceId: p.instanceId ?? 'instance-1',
    patternId: p.patternId === undefined ? 'PAT-001' : p.patternId,
    cacheHit: p.cacheHit ?? false,
    latencyMs: p.latencyMs ?? 100,
    citationCount: p.citationCount ?? 0,
    contradictionCount: p.contradictionCount ?? 0,
    failureModeCount: p.failureModeCount ?? 0,
    gateCount: p.gateCount ?? 0,
    feedback: p.feedback,
    feedbackTimestamp: p.feedbackTimestamp,
  };
}

beforeEach(() => {
  counter = 0;
});

describe('eventsToCsv', () => {
  it('returns just the header row for empty input', () => {
    const csv = eventsToCsv([]);
    expect(csv).toBe(`${TELEMETRY_CSV_COLUMNS.join(',')}\n`);
  });

  it('emits header columns in the documented stable order', () => {
    const csv = eventsToCsv([]);
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe(
      'timestamp,surface,instanceId,patternId,cacheHit,latencyMs,' +
        'citationCount,contradictionCount,failureModeCount,gateCount,' +
        'feedback,feedbackTimestamp',
    );
  });

  it('serializes a simple event with ISO timestamp and unquoted plain fields', () => {
    const csv = eventsToCsv([
      ev({
        timestamp: '2026-04-28T12:34:56.000Z',
        surface: 'programs',
        instanceId: 'meridian-cdp',
        patternId: 'PAT-101',
        cacheHit: true,
        latencyMs: 420,
        citationCount: 3,
        contradictionCount: 1,
        failureModeCount: 0,
        gateCount: 4,
      }),
    ]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe(
      '2026-04-28T12:34:56.000Z,programs,meridian-cdp,PAT-101,true,420,3,1,0,4,,',
    );
    // Trailing newline.
    expect(lines[lines.length - 1]).toBe('');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const csv = eventsToCsv([
      ev({
        instanceId: 'has,comma',
        patternId: 'with"quote',
      }),
      ev({
        instanceId: 'with\nnewline',
        patternId: 'with\rcarriage',
      }),
    ]);
    expect(csv).toContain('"has,comma"');
    expect(csv).toContain('"with""quote"');
    expect(csv).toContain('"with\nnewline"');
    expect(csv).toContain('"with\rcarriage"');
  });

  it('renders a null patternId as an empty field', () => {
    const csv = eventsToCsv([ev({ patternId: null })]);
    const dataRow = csv.split('\n')[1];
    // patternId is the 4th column.
    const cells = dataRow.split(',');
    expect(cells[3]).toBe('');
  });

  it('renders feedback fields when present, empty when absent', () => {
    const csv = eventsToCsv([
      ev({ feedback: 'up', feedbackTimestamp: '2026-04-28T13:00:00.000Z' }),
      ev({}),
    ]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain(',up,2026-04-28T13:00:00.000Z');
    // Second event has no feedback — last two columns blank.
    expect(lines[2].endsWith(',,')).toBe(true);
  });

  it('is idempotent — same input yields byte-identical output', () => {
    const events = [
      ev({ surface: 'source', latencyMs: 50 }),
      ev({ surface: 'tower', cacheHit: true, instanceId: 'tower' }),
    ];
    const a = eventsToCsv(events);
    const b = eventsToCsv(events);
    expect(a).toBe(b);
  });
});

describe('eventsToJson', () => {
  it('returns valid JSON parseable round-trip', () => {
    const events = [ev({ surface: 'source' }), ev({ surface: 'programs' })];
    const json = eventsToJson(events);
    const parsed = JSON.parse(json) as { events: SynthesisTelemetryEvent[] };
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0].surface).toBe('source');
    expect(parsed.events[1].surface).toBe('programs');
  });

  it('returns an empty events array for empty input', () => {
    const json = eventsToJson([]);
    expect(json).toBe('{"events":[]}');
  });

  it('produces compact output by default and indented output in pretty mode', () => {
    const events = [ev({ surface: 'source' })];
    const compact = eventsToJson(events);
    const pretty = eventsToJson(events, { pretty: true });
    expect(compact).not.toContain('\n');
    expect(pretty).toContain('\n');
    expect(pretty).toContain('  "events"');
    // Both still parse to the same data.
    expect(JSON.parse(compact)).toEqual(JSON.parse(pretty));
  });

  it('is idempotent — same input yields byte-identical output', () => {
    const events = [ev({}), ev({ feedback: 'down' })];
    expect(eventsToJson(events)).toBe(eventsToJson(events));
    expect(eventsToJson(events, { pretty: true })).toBe(
      eventsToJson(events, { pretty: true }),
    );
  });
});
