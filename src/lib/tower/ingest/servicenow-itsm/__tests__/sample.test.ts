// Sample-data generator tests — slice S6.

import {
  NORTHWIND_SERVICES,
  buildNorthwindSampleRecords,
} from '../sample';

describe('buildNorthwindSampleRecords', () => {
  it('generates ~500 records by default', () => {
    const records = buildNorthwindSampleRecords();
    expect(records).toHaveLength(500);
  });

  it('is deterministic across runs (seeded)', () => {
    const a = buildNorthwindSampleRecords({ seed: 13, count: 100 });
    const b = buildNorthwindSampleRecords({ seed: 13, count: 100 });
    expect(a).toEqual(b);
  });

  it('spans the configured 90-day window', () => {
    const asOf = new Date('2026-05-30T00:00:00Z');
    const records = buildNorthwindSampleRecords({ asOf, windowDays: 90 });
    const windowMs = 90 * 24 * 60 * 60 * 1000;
    for (const r of records) {
      const openedMs = Date.parse(r.opened_at);
      expect(openedMs).toBeLessThanOrEqual(asOf.getTime());
      expect(openedMs).toBeGreaterThanOrEqual(asOf.getTime() - windowMs);
    }
  });

  it('covers all priorities, record types, and at least 10 of 12 services', () => {
    const records = buildNorthwindSampleRecords();
    const priorities = new Set(records.map((r) => r.priority));
    const recordTypes = new Set(records.map((r) => r.record_type));
    const services = new Set(records.map((r) => r.service));
    expect(priorities).toEqual(new Set(['P1', 'P2', 'P3', 'P4']));
    expect(recordTypes).toEqual(new Set(['incident', 'problem', 'change']));
    expect(services.size).toBeGreaterThanOrEqual(10);
    // Every service in the constant must appear in the catalog.
    for (const s of services) {
      expect((NORTHWIND_SERVICES as readonly string[]).includes(s)).toBe(true);
    }
  });

  it('produces priority-appropriate MTTR distributions', () => {
    const records = buildNorthwindSampleRecords();
    const byPriority: Record<string, number[]> = { P1: [], P2: [], P3: [], P4: [] };
    for (const r of records) {
      if (r.mttr_minutes != null) byPriority[r.priority].push(r.mttr_minutes);
    }
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)] ?? 0;
    };
    // P1 medians in minutes, P3 medians in days — ordering must hold.
    expect(median(byPriority.P1)).toBeLessThan(median(byPriority.P2));
    expect(median(byPriority.P2)).toBeLessThan(median(byPriority.P3));
    expect(median(byPriority.P3)).toBeLessThan(median(byPriority.P4));
    // P1 median lives in single-digit hours.
    expect(median(byPriority.P1)).toBeLessThan(4 * 60);
  });

  it('only marks change records with change_success', () => {
    const records = buildNorthwindSampleRecords();
    for (const r of records) {
      if (r.change_success != null) expect(r.record_type).toBe('change');
    }
  });

  it('leaves ~8% of records open (closed_at null)', () => {
    const records = buildNorthwindSampleRecords();
    const open = records.filter((r) => r.closed_at == null).length;
    const ratio = open / records.length;
    expect(ratio).toBeGreaterThan(0.02);
    expect(ratio).toBeLessThan(0.18);
  });
});
