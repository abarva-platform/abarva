// Validator unit tests.

import { validateCopilotRows } from '../validate';
import { generateNorthwindCopilotRows } from '../synthetic';
import type { CopilotUsageRow } from '../schema';

function baseRow(overrides: Partial<CopilotUsageRow> = {}): CopilotUsageRow {
  return {
    team: 'Storefront Web',
    period_start: '2026-04-01',
    period_end: '2026-04-30',
    active_users: 10,
    total_suggestions: 1000,
    accepted_suggestions: 350,
    acceptance_rate_pct: 35.0,
    monthly_cost_usd: 380,
    seats_assigned: 12,
    seats_used: 11,
    ...overrides,
  };
}

describe('validateCopilotRows', () => {
  it('accepts the full synthetic Northwind dataset', () => {
    const rows = generateNorthwindCopilotRows();
    const result = validateCopilotRows(rows);
    expect(result.invalid).toHaveLength(0);
    expect(result.valid.length).toBe(rows.length);
  });

  it('rejects accepted > total', () => {
    const result = validateCopilotRows([baseRow({ accepted_suggestions: 1500 })]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].issues.some((i) => i.field === 'cross_field' && i.message.includes('Accepted'))).toBe(true);
  });

  it('rejects seats_used > seats_assigned', () => {
    const result = validateCopilotRows([baseRow({ seats_used: 20 })]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0].issues.some((i) => i.message.includes('Seats Used'))).toBe(true);
  });

  it('rejects period_end before period_start', () => {
    const result = validateCopilotRows([
      baseRow({ period_start: '2026-04-30', period_end: '2026-04-01' }),
    ]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0].issues.some((i) => i.field === 'period_range')).toBe(true);
  });

  it('rejects negative numeric fields', () => {
    const result = validateCopilotRows([baseRow({ monthly_cost_usd: -5 })]);
    expect(result.valid).toHaveLength(0);
  });

  it('rejects acceptance_rate_pct outside 0-100', () => {
    const result = validateCopilotRows([baseRow({ acceptance_rate_pct: 150 })]);
    expect(result.valid).toHaveLength(0);
  });

  it('emits a warn when manual acceptance_rate_pct disagrees with derived by > 1pp', () => {
    const result = validateCopilotRows([
      baseRow({ accepted_suggestions: 350, total_suggestions: 1000, acceptance_rate_pct: 60 }),
    ]);
    expect(result.valid).toHaveLength(1); // still valid; warn only
    expect(result.warnings.some((w) => w.field === 'acceptance_rate_pct')).toBe(true);
  });

  it('emits a warn when active_users exceeds seats_assigned', () => {
    const result = validateCopilotRows([
      baseRow({ active_users: 20, seats_assigned: 10, seats_used: 10 }),
    ]);
    expect(result.warnings.some((w) => w.field === 'active_users')).toBe(true);
  });
});
