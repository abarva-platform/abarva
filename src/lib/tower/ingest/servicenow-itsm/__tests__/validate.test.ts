// Validator tests — slice S6 · ServiceNow ITSM ingest.

import { validateItsmRecords } from '../validate';
import { buildNorthwindSampleRecords } from '../sample';
import type { ItsmRecord } from '../types';

function makeRecord(overrides: Partial<ItsmRecord> = {}): ItsmRecord {
  return {
    record_number: 'INC0001000',
    record_type: 'incident',
    priority: 'P3',
    service: 'POS Checkout',
    assignment_group: 'NWR-Retail-Apps',
    opened_at: '2026-04-18T10:00:00.000Z',
    closed_at: '2026-04-18T11:00:00.000Z',
    mttr_minutes: 60,
    change_success: null,
    ...overrides,
  };
}

describe('validateItsmRecords', () => {
  it('passes a well-formed record through unchanged', () => {
    const r = makeRecord();
    const out = validateItsmRecords([r]);
    expect(out.errors).toHaveLength(0);
    expect(out.valid).toEqual([r]);
  });

  it('rejects record when closed_at precedes opened_at', () => {
    const r = makeRecord({
      opened_at: '2026-04-18T11:00:00.000Z',
      closed_at: '2026-04-18T10:00:00.000Z',
    });
    const out = validateItsmRecords([r]);
    expect(out.valid).toHaveLength(0);
    expect(out.errors.some((e) => e.field === 'closed_at')).toBe(true);
  });

  it('coerces change_success to null when record_type is not change', () => {
    const r = makeRecord({ record_type: 'incident', change_success: true });
    const out = validateItsmRecords([r]);
    expect(out.valid[0].change_success).toBeNull();
  });

  it('recomputes mttr_minutes when stored value disagrees with timestamps', () => {
    const r = makeRecord({
      opened_at: '2026-04-18T10:00:00.000Z',
      closed_at: '2026-04-18T12:00:00.000Z',
      mttr_minutes: 999, // wrong
    });
    const out = validateItsmRecords([r]);
    expect(out.valid[0].mttr_minutes).toBe(120);
  });

  it('flags negative mttr_minutes', () => {
    const r = makeRecord({ closed_at: null, mttr_minutes: -5 });
    const out = validateItsmRecords([r]);
    expect(out.valid).toHaveLength(0);
    expect(out.errors.some((e) => e.field === 'mttr_minutes')).toBe(true);
  });

  it('passes the full synthetic Northwind sample', () => {
    const records = buildNorthwindSampleRecords();
    const out = validateItsmRecords(records);
    expect(out.errors).toHaveLength(0);
    expect(out.valid).toHaveLength(records.length);
  });
});
