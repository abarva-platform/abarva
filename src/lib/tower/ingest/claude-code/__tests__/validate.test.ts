// Tower · Claude Code validator tests.

import { validateClaudeCodeRows } from '../validate';
import type { ClaudeCodeUsageRow } from '../types';

function row(overrides: Partial<ClaudeCodeUsageRow> = {}): ClaudeCodeUsageRow {
  return {
    team: 'platform',
    developer_id: 'dev_a',
    period_start: '2025-06-01',
    period_end: '2025-06-30',
    sessions: 100,
    prompt_tokens: 500_000,
    output_tokens: 200_000,
    monthly_cost_usd: 5.5,
    primary_use_case: 'feature_development',
    ...overrides,
  };
}

describe('validateClaudeCodeRows', () => {
  it('passes a well-formed batch', () => {
    const result = validateClaudeCodeRows([row(), row({ developer_id: 'dev_b' })]);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags period_end before period_start', () => {
    const result = validateClaudeCodeRows([
      row({ period_start: '2025-06-30', period_end: '2025-06-01' }),
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toMatch(/period_end is before period_start/);
  });

  it('flags malformed dates', () => {
    const result = validateClaudeCodeRows([row({ period_start: 'June 1' })]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /period_start/.test(e.message))).toBe(true);
  });

  it('flags negative numerics', () => {
    const result = validateClaudeCodeRows([row({ prompt_tokens: -10 })]);
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toMatch(/prompt_tokens is negative/);
  });

  it('flags duplicate natural keys within the batch', () => {
    const result = validateClaudeCodeRows([row(), row()]);
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toMatch(/duplicate natural key/);
  });

  it('warns (does not fail) on implausible token totals', () => {
    const result = validateClaudeCodeRows([
      row({ prompt_tokens: 100, output_tokens: 50 }),
    ]);
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => /plausibility band/.test(w))).toBe(true);
  });
});
