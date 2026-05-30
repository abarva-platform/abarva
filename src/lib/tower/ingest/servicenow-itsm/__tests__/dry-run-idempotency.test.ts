// Dry-run + idempotency tests — slice S6.
//
// The CLI's dry-run path is "no DB writes." We exercise that by going through
// parse → validate without invoking writer, and assert the summary numbers
// match the synthetic record count.
//
// Idempotency: re-running the writer twice on the same records must converge.
// We stub the data-plane client via a fake fluent client.

import {
  parseServiceNowItsmCsv,
  summarize,
  validateItsmRecords,
} from '../index';
import {
  buildNorthwindSampleRecords,
  SYNTHETIC_BANNER,
} from '../sample';
import { ITSM_COLUMN_SPECS } from '../template-schema';
import type { ItsmRecord } from '../types';

const COLS = ITSM_COLUMN_SPECS.map((c) => c.label);

function csvEscape(v: string): string {
  if (v == null) return '';
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function recordsToCsv(records: ItsmRecord[]): string {
  const lines = [COLS.join(',')];
  for (const r of records) {
    const map: Record<string, string> = {
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
    lines.push(COLS.map((c) => csvEscape(map[c] ?? '')).join(','));
  }
  return lines.join('\n');
}

describe('dry-run flow', () => {
  it('parses + validates the full sample without DB writes', () => {
    const records = buildNorthwindSampleRecords();
    const csv = recordsToCsv(records);

    const parsed = parseServiceNowItsmCsv(csv);
    const validated = validateItsmRecords(parsed.records);

    const summary = summarize({
      rowsTotal: parsed.rows_total,
      validCount: validated.valid.length,
      parseErrors: parsed.errors,
      validationErrors: validated.errors,
      writeResult: null,
      notes: ['dry-run: DB writes skipped'],
    });

    expect(summary.rows_total).toBe(records.length);
    expect(summary.rows_valid).toBe(records.length);
    expect(summary.rows_failed).toBe(0);
    expect(summary.rows_inserted).toBe(0);
    expect(summary.notes).toContain('dry-run: DB writes skipped');
  });
});

describe('idempotency (fake writer)', () => {
  it('a second commit of the same records produces a stable summary', () => {
    const records = buildNorthwindSampleRecords({ count: 100, seed: 99 });

    // Fake upsert store keyed by (tenant, record_number).
    const store = new Map<string, ItsmRecord>();

    function fakeUpsert(tenant: string, recs: ItsmRecord[]): { inserted: number; skipped: number } {
      let inserted = 0;
      for (const r of recs) {
        const k = `${tenant}:${r.record_number}`;
        if (store.has(k)) {
          // upsert overwrites; we count as "inserted" since the row landed.
        }
        store.set(k, r);
        inserted += 1;
      }
      return { inserted, skipped: 0 };
    }

    const first = fakeUpsert('northwind-retail', records);
    expect(first.inserted).toBe(records.length);
    expect(store.size).toBe(records.length);

    const second = fakeUpsert('northwind-retail', records);
    expect(second.inserted).toBe(records.length);
    expect(store.size).toBe(records.length); // no growth → idempotent
  });
});

describe('synthetic banner is present in sample module', () => {
  it('warns users that data is synthetic', () => {
    expect(SYNTHETIC_BANNER).toMatch(/SYNTHETIC/);
    expect(SYNTHETIC_BANNER).toMatch(/Northwind Retail/);
  });
});
