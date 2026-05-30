// Parser tests — slice S6 · ServiceNow ITSM ingest.

import {
  ITSM_COLUMNS,
  parseIsoDate,
  parseServiceNowItsmCsv,
} from '../parse';
import { buildNorthwindSampleRecords } from '../sample';
import type { ItsmRecord } from '../types';

const HEADER = ITSM_COLUMNS.join(',');

function toCsv(rows: Array<Record<string, string>>): string {
  const lines = [HEADER];
  for (const row of rows) {
    lines.push(ITSM_COLUMNS.map((c) => row[c] ?? '').join(','));
  }
  return lines.join('\n');
}

function recordToCsvRow(r: ItsmRecord): Record<string, string> {
  return {
    record_number: r.record_number,
    record_type: r.record_type,
    priority: r.priority,
    service: r.service,
    assignment_group: r.assignment_group ?? '',
    opened_at: r.opened_at,
    closed_at: r.closed_at ?? '',
    mttr_minutes: r.mttr_minutes == null ? '' : String(r.mttr_minutes),
    change_success: r.change_success == null ? '' : String(r.change_success),
  };
}

describe('parseServiceNowItsmCsv', () => {
  it('parses a happy-path row with canonical headers', () => {
    const csv = toCsv([
      {
        record_number: 'INC0001001',
        record_type: 'incident',
        priority: 'P2',
        service: 'POS Checkout',
        assignment_group: 'NWR-Retail-Apps',
        opened_at: '2026-04-18T14:22:00Z',
        closed_at: '2026-04-18T15:11:00Z',
        mttr_minutes: '49',
        change_success: '',
      },
    ]);
    const out = parseServiceNowItsmCsv(csv);
    expect(out.errors).toHaveLength(0);
    expect(out.records).toHaveLength(1);
    const r = out.records[0];
    expect(r.record_number).toBe('INC0001001');
    expect(r.priority).toBe('P2');
    expect(r.record_type).toBe('incident');
    expect(r.opened_at).toBe('2026-04-18T14:22:00.000Z');
    expect(r.closed_at).toBe('2026-04-18T15:11:00.000Z');
    expect(r.mttr_minutes).toBe(49);
    expect(r.change_success).toBeNull();
  });

  it('accepts ServiceNow-style header casing and numeric priority', () => {
    const csv =
      'Number,Sys_Class_Name,Priority,Business_Service,Assignment_Group,Sys_Created_On,Closed_At,Calendar_Duration,Close_Code\n' +
      'INC0009999,Incident,2,Payments Gateway,NWR-Payments-Eng,2026-04-01 10:00:00,2026-04-01 13:00:00,,';
    const out = parseServiceNowItsmCsv(csv);
    expect(out.errors).toHaveLength(0);
    expect(out.records).toHaveLength(1);
    expect(out.records[0].priority).toBe('P2');
    expect(out.records[0].record_type).toBe('incident');
    // mttr_minutes computed from timestamps when blank.
    expect(out.records[0].mttr_minutes).toBe(180);
  });

  it('rejects rows missing required fields with field-scoped errors', () => {
    const csv =
      HEADER +
      '\n' +
      ',incident,P1,POS Checkout,,2026-04-18T14:00:00Z,,,\n' +
      'INC1,incident,P9,POS Checkout,,2026-04-18T14:00:00Z,,,';
    const out = parseServiceNowItsmCsv(csv);
    expect(out.records).toHaveLength(0);
    expect(out.errors.some((e) => e.field === 'record_number')).toBe(true);
    expect(out.errors.some((e) => e.field === 'priority')).toBe(true);
  });

  it('computes mttr_minutes when omitted', () => {
    const csv = toCsv([
      {
        record_number: 'INC2',
        record_type: 'incident',
        priority: 'P3',
        service: 'Order Management',
        assignment_group: 'NWR-Retail-Apps',
        opened_at: '2026-04-18T10:00:00Z',
        closed_at: '2026-04-19T10:00:00Z',
        mttr_minutes: '',
        change_success: '',
      },
    ]);
    const out = parseServiceNowItsmCsv(csv);
    expect(out.records[0].mttr_minutes).toBe(24 * 60);
  });

  it('treats change records as the only carriers of change_success', () => {
    const csv = toCsv([
      {
        record_number: 'CHG1',
        record_type: 'change',
        priority: 'P3',
        service: 'POS Checkout',
        assignment_group: 'NWR-Retail-Apps',
        opened_at: '2026-04-18T10:00:00Z',
        closed_at: '2026-04-18T11:00:00Z',
        mttr_minutes: '',
        change_success: 'successful',
      },
      {
        record_number: 'INC9',
        record_type: 'incident',
        priority: 'P3',
        service: 'POS Checkout',
        assignment_group: 'NWR-Retail-Apps',
        opened_at: '2026-04-18T10:00:00Z',
        closed_at: '2026-04-18T11:00:00Z',
        mttr_minutes: '',
        change_success: 'true',
      },
    ]);
    const out = parseServiceNowItsmCsv(csv);
    expect(out.records[0].change_success).toBe(true);
    expect(out.records[1].change_success).toBeNull();
  });

  it('round-trips synthetic Northwind sample with no errors', () => {
    const records = buildNorthwindSampleRecords({ count: 50, seed: 7 });
    const csv = toCsv(records.map(recordToCsvRow));
    const out = parseServiceNowItsmCsv(csv);
    expect(out.errors).toHaveLength(0);
    expect(out.records).toHaveLength(records.length);
  });
});

describe('parseIsoDate', () => {
  it('parses ServiceNow space-separated timestamps as UTC', () => {
    expect(parseIsoDate('2026-04-18 14:22:00')).toBe('2026-04-18T14:22:00.000Z');
  });
  it('parses ISO with Z suffix', () => {
    expect(parseIsoDate('2026-04-18T14:22:00Z')).toBe('2026-04-18T14:22:00.000Z');
  });
  it('returns null on garbage', () => {
    expect(parseIsoDate('not a date')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate('n/a')).toBeNull();
  });
});
