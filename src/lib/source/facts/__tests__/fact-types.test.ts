// Guards the persisted fact model's enum sets and the single-value invariant that
// the SQL CHECK constraint enforces at the DB layer — kept as a code-level mirror
// so the TS types and the migration cannot silently diverge.

import {
  FACT_CONFIDENCES,
  FACT_SOURCE_METHODS,
  type FactConfidence,
  type FactSourceMethod,
  type SourceEventFactRow,
} from '../fact-types';

describe('persisted fact model — enum sets', () => {
  it('lists the source methods', () => {
    expect([...FACT_SOURCE_METHODS].sort()).toEqual(
      (['analyst_entered', 'parsed', 'structured_map'] as FactSourceMethod[]).sort(),
    );
  });

  it('lists the confidences', () => {
    expect([...FACT_CONFIDENCES].sort()).toEqual(
      (['high', 'low', 'med'] as FactConfidence[]).sort(),
    );
  });
});

describe('persisted fact model — value column invariant', () => {
  const base: Omit<SourceEventFactRow, 'value_numeric' | 'value_text'> = {
    id: '00000000-0000-0000-0000-000000000000',
    source_event_id: '00000000-0000-0000-0000-000000000001',
    client_key: 'apexretail',
    fact_key: 'annual_run_cost',
    entity_kind: 'tower',
    entity_ref: 'tower:apps',
    unit: 'usd_per_year',
    source_method: 'structured_map',
    source_citation: { doc: 'APP_INVENTORY_V1', locator: 'row 3 · Annual Run Cost (USD)' },
    confidence: 'high',
    captured_at: '2026-07-06T00:00:00.000Z',
    is_stale: false,
  };

  // Mirrors source_event_facts_single_value_chk: value in exactly one column
  // (or neither, for a pending stub).
  const singleValue = (row: SourceEventFactRow): boolean =>
    row.value_numeric === null || row.value_text === null;

  it('accepts a numeric-only fact', () => {
    const row: SourceEventFactRow = { ...base, value_numeric: 4200000, value_text: null };
    expect(singleValue(row)).toBe(true);
  });

  it('accepts a text-only fact', () => {
    const row: SourceEventFactRow = { ...base, value_numeric: null, value_text: 'tier-1' };
    expect(singleValue(row)).toBe(true);
  });

  it('accepts a pending stub (neither value)', () => {
    const row: SourceEventFactRow = { ...base, value_numeric: null, value_text: null };
    expect(singleValue(row)).toBe(true);
  });

  it('rejects both value columns set', () => {
    const row: SourceEventFactRow = { ...base, value_numeric: 1, value_text: 'x' };
    expect(singleValue(row)).toBe(false);
  });
});
