// Validator tests for parsed GitHub → DORA rows.

import { validateGithubDoraRows } from '../validate';
import type { GithubDoraRawRow } from '../schema';

function rawRow(
  partial: Partial<GithubDoraRawRow> & { rowNumber: number },
): GithubDoraRawRow {
  return {
    rowNumber: partial.rowNumber,
    repo: partial.repo ?? 'northwind-retail/checkout-service',
    team: partial.team ?? 'checkout-platform',
    period_start: partial.period_start ?? '2025-01-01',
    period_end: partial.period_end ?? '2025-01-31',
    deployment_frequency_per_day: partial.deployment_frequency_per_day ?? 1.42,
    lead_time_for_changes_hours: partial.lead_time_for_changes_hours ?? 36,
    change_failure_rate_pct: partial.change_failure_rate_pct ?? 11,
    mttr_hours: partial.mttr_hours ?? 4.5,
    sample_size_deploys: partial.sample_size_deploys ?? 44,
  };
}

describe('validateGithubDoraRows', () => {
  it('accepts a well-formed row', () => {
    const result = validateGithubDoraRows([rawRow({ rowNumber: 3 })]);
    expect(result.errors).toEqual([]);
    expect(result.validRows.length).toBe(1);
  });

  it('rejects a row with a malformed repo and reports the column', () => {
    const result = validateGithubDoraRows([
      rawRow({ rowNumber: 7, repo: 'BAD REPO NAME' }),
    ]);
    expect(result.validRows).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
    const err = result.errors.find((e) => e.column === 'repo');
    expect(err).toBeDefined();
    expect(err!.rowNumber).toBe(7);
    expect(err!.message).toMatch(/owner\/name/);
  });

  it('rejects a row where period_end < period_start', () => {
    const result = validateGithubDoraRows([
      rawRow({
        rowNumber: 9,
        period_start: '2025-03-01',
        period_end: '2025-02-28',
      }),
    ]);
    expect(result.validRows).toEqual([]);
    const err = result.errors.find((e) => e.column === 'period_end');
    expect(err).toBeDefined();
    expect(err!.rowNumber).toBe(9);
  });

  it('rejects a row with change_failure_rate_pct out of range', () => {
    const result = validateGithubDoraRows([
      rawRow({ rowNumber: 11, change_failure_rate_pct: 150 }),
    ]);
    expect(result.validRows).toEqual([]);
    const err = result.errors.find(
      (e) => e.column === 'change_failure_rate_pct',
    );
    expect(err).toBeDefined();
    expect(err!.message).toMatch(/between 0 and 100/);
  });

  it('rejects a non-integer sample_size_deploys', () => {
    const result = validateGithubDoraRows([
      rawRow({ rowNumber: 13, sample_size_deploys: 4.5 }),
    ]);
    expect(result.validRows).toEqual([]);
    const err = result.errors.find((e) => e.column === 'sample_size_deploys');
    expect(err).toBeDefined();
    expect(err!.message).toMatch(/whole number/);
  });

  it('processes every row even when some are invalid', () => {
    const result = validateGithubDoraRows([
      rawRow({ rowNumber: 3 }),
      rawRow({ rowNumber: 4, repo: 'NOPE' }),
      rawRow({ rowNumber: 5 }),
    ]);
    expect(result.validRows.length).toBe(2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.every((e) => e.rowNumber === 4)).toBe(true);
  });
});
