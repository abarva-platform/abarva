import { validateCursorRows } from '../validate';
import type { CursorRawRow } from '../parse';

function r(over: Partial<CursorRawRow>): CursorRawRow {
  return {
    team: 'Platform',
    period_start: '2025-10-01',
    period_end: '2025-10-31',
    seats_assigned: 10,
    active_users: 8,
    completions_shown: 1000,
    completions_accepted: 300,
    monthly_cost_usd: 400,
    _row_index: 3,
    ...over,
  };
}

describe('validateCursorRows', () => {
  test('accepts a clean row', () => {
    const out = validateCursorRows([r({})]);
    expect(out.valid).toHaveLength(1);
    expect(out.issues).toHaveLength(0);
    expect(out.valid[0].acceptance_rate).toBeCloseTo(0.3);
  });

  test('rejects active_users > seats_assigned', () => {
    const out = validateCursorRows([r({ active_users: 12, seats_assigned: 10 })]);
    expect(out.valid).toHaveLength(0);
    expect(out.issues[0].severity).toBe('error');
    expect(out.issues[0].field).toBe('active_users');
  });

  test('rejects completions_accepted > completions_shown', () => {
    const out = validateCursorRows([
      r({ completions_shown: 100, completions_accepted: 500 }),
    ]);
    expect(out.valid).toHaveLength(0);
    expect(out.issues.some((i) => i.field === 'completions_accepted')).toBe(true);
  });

  test('rejects period_end before period_start', () => {
    const out = validateCursorRows([
      r({ period_start: '2025-10-15', period_end: '2025-10-01' }),
    ]);
    expect(out.valid).toHaveLength(0);
    expect(out.issues.some((i) => i.field === 'period_end')).toBe(true);
  });

  test('rejects duplicate natural key inside one batch', () => {
    const out = validateCursorRows([
      r({ team: 'X', period_start: '2025-10-01' }),
      r({ team: 'X', period_start: '2025-10-01' }),
    ]);
    expect(out.natural_key_collisions).toContain('X__2025-10-01');
    expect(out.valid).toHaveLength(1); // first row kept, second rejected
  });

  test('rejects negative numbers', () => {
    const out = validateCursorRows([r({ monthly_cost_usd: -10 })]);
    expect(out.valid).toHaveLength(0);
    expect(out.issues.some((i) => i.field === 'monthly_cost_usd')).toBe(true);
  });

  test('rejects non-integer seat counts', () => {
    const out = validateCursorRows([r({ seats_assigned: 10.5, active_users: 10 })]);
    expect(out.valid).toHaveLength(0);
    expect(out.issues.some((i) => i.field === 'seats_assigned')).toBe(true);
  });

  test('emits a warning (not error) for non-first-of-month period_start', () => {
    const out = validateCursorRows([r({ period_start: '2025-10-15' })]);
    expect(out.valid).toHaveLength(1);
    expect(out.issues.some((i) => i.field === 'period_start' && i.severity === 'warning')).toBe(true);
  });

  test('zero-completion months still produce a row with acceptance_rate=0', () => {
    const out = validateCursorRows([
      r({ completions_shown: 0, completions_accepted: 0 }),
    ]);
    expect(out.valid).toHaveLength(1);
    expect(out.valid[0].acceptance_rate).toBe(0);
  });
});
