// Idempotency contract test — no DB.
//
// The CLI upserts on (client_id, tool, team, period_start). This test
// verifies that running the full pipeline TWICE against the same input
// produces the same set of natural keys, with identical computed values,
// so a real DB upsert would be a logical no-op on the second pass.
//
// The actual database-backed idempotency check belongs in an integration
// test against a real Postgres; this is the deterministic guard that
// the parse + validate + projection layers are pure.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCursorWorkbook } from '../parse';
import { validateCursorRows, type CursorValidatedRow } from '../validate';

const SAMPLE = resolve(
  process.cwd(),
  'public/templates/tower/cursor/sample-filled.xlsx',
);

function naturalKey(r: CursorValidatedRow): string {
  return `cursor::${r.team}::${r.period_start}`;
}

function projection(r: CursorValidatedRow) {
  return {
    period_end: r.period_end,
    seats_assigned: r.seats_assigned,
    active_users: r.active_users,
    completions_shown: r.completions_shown,
    completions_accepted: r.completions_accepted,
    monthly_cost_usd: r.monthly_cost_usd,
  };
}

describe('cursor ingest pipeline is deterministic + idempotent in projection', () => {
  test('two passes of parse+validate produce identical natural keys and values', async () => {
    const buf = readFileSync(SAMPLE);

    const passA = validateCursorRows((await parseCursorWorkbook(buf)).rows);
    const passB = validateCursorRows((await parseCursorWorkbook(buf)).rows);

    expect(passA.valid).toHaveLength(passB.valid.length);

    const aKeys = passA.valid.map(naturalKey);
    const bKeys = passB.valid.map(naturalKey);
    expect(new Set(aKeys).size).toBe(aKeys.length); // unique within file
    expect(aKeys).toEqual(bKeys);

    const aByKey = new Map(passA.valid.map((r) => [naturalKey(r), projection(r)]));
    const bByKey = new Map(passB.valid.map((r) => [naturalKey(r), projection(r)]));
    for (const [k, va] of aByKey) {
      expect(bByKey.get(k)).toEqual(va);
    }
  });

  test('natural key is unique across the canonical sample (120 rows)', async () => {
    const buf = readFileSync(SAMPLE);
    const { valid } = validateCursorRows((await parseCursorWorkbook(buf)).rows);
    const keys = valid.map(naturalKey);
    expect(new Set(keys).size).toBe(120);
  });

  test('dry-run summary surface: no DB call required to compute totals', async () => {
    const buf = readFileSync(SAMPLE);
    const { rows, warnings } = await parseCursorWorkbook(buf);
    const { valid, issues } = validateCursorRows(rows);
    const errors = issues.filter((i) => i.severity === 'error').length;
    const warns = issues.filter((i) => i.severity === 'warning').length + warnings.length;

    // What the CLI would print as a dry-run summary:
    const summary = {
      parsed_rows: rows.length,
      valid_rows: valid.length,
      error_count: errors,
      warning_count: warns,
      dry_run: true,
    };

    expect(summary).toEqual({
      parsed_rows: 120,
      valid_rows: 120,
      error_count: 0,
      warning_count: 0,
      dry_run: true,
    });
  });
});
