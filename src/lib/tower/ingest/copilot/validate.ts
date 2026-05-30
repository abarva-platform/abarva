// Tower ingest · GitHub Copilot usage + cost · validator.
//
// Repository convention is plain TS validators (zod is not a direct dep).
// This file enforces business invariants that the DB CHECK constraints
// also enforce, but surfaces them with row-level error messages well before
// we touch the database.

import type { CopilotUsageRow } from './schema';

export interface CopilotValidationIssue {
  rowIndex: number; // 0-based position in the input array
  team: string;
  period: string;
  field: keyof CopilotUsageRow | 'period_range' | 'cross_field';
  severity: 'error' | 'warn';
  message: string;
}

export interface CopilotValidationResult {
  valid: CopilotUsageRow[];
  invalid: Array<{ row: CopilotUsageRow; issues: CopilotValidationIssue[] }>;
  warnings: CopilotValidationIssue[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateOne(
  row: CopilotUsageRow,
  rowIndex: number,
): { errors: CopilotValidationIssue[]; warnings: CopilotValidationIssue[] } {
  const errors: CopilotValidationIssue[] = [];
  const warnings: CopilotValidationIssue[] = [];
  const period = `${row.period_start}..${row.period_end}`;
  const base = { rowIndex, team: row.team, period } as const;

  if (!row.team || row.team.length === 0) {
    errors.push({ ...base, field: 'team', severity: 'error', message: 'Team is required.' });
  }
  if (!ISO_DATE.test(row.period_start)) {
    errors.push({ ...base, field: 'period_start', severity: 'error', message: 'Period Start must be ISO YYYY-MM-DD.' });
  }
  if (!ISO_DATE.test(row.period_end)) {
    errors.push({ ...base, field: 'period_end', severity: 'error', message: 'Period End must be ISO YYYY-MM-DD.' });
  }
  if (ISO_DATE.test(row.period_start) && ISO_DATE.test(row.period_end) && row.period_end < row.period_start) {
    errors.push({ ...base, field: 'period_range', severity: 'error', message: 'Period End must be on or after Period Start.' });
  }

  // Non-negative numeric guards.
  const nonNeg: Array<[keyof CopilotUsageRow, number]> = [
    ['active_users', row.active_users],
    ['total_suggestions', row.total_suggestions],
    ['accepted_suggestions', row.accepted_suggestions],
    ['monthly_cost_usd', row.monthly_cost_usd],
    ['seats_assigned', row.seats_assigned],
    ['seats_used', row.seats_used],
  ];
  for (const [field, value] of nonNeg) {
    if (!Number.isFinite(value) || value < 0) {
      errors.push({ ...base, field, severity: 'error', message: `${field} must be a non-negative number.` });
    }
  }

  if (row.accepted_suggestions > row.total_suggestions) {
    errors.push({
      ...base,
      field: 'cross_field',
      severity: 'error',
      message: 'Accepted Suggestions cannot exceed Total Suggestions.',
    });
  }

  if (row.seats_used > row.seats_assigned) {
    errors.push({
      ...base,
      field: 'cross_field',
      severity: 'error',
      message: 'Seats Used cannot exceed Seats Assigned.',
    });
  }

  if (row.acceptance_rate_pct !== null) {
    if (row.acceptance_rate_pct < 0 || row.acceptance_rate_pct > 100) {
      errors.push({
        ...base,
        field: 'acceptance_rate_pct',
        severity: 'error',
        message: 'Acceptance Rate % must be between 0 and 100.',
      });
    } else if (row.total_suggestions > 0) {
      const derived = (row.accepted_suggestions / row.total_suggestions) * 100;
      if (Math.abs(derived - row.acceptance_rate_pct) > 1) {
        warnings.push({
          ...base,
          field: 'acceptance_rate_pct',
          severity: 'warn',
          message: `Acceptance Rate % (${row.acceptance_rate_pct.toFixed(1)}) disagrees with Accepted/Total (${derived.toFixed(1)}) by more than 1pp.`,
        });
      }
    }
  }

  if (row.active_users > row.seats_assigned && row.seats_assigned > 0) {
    warnings.push({
      ...base,
      field: 'active_users',
      severity: 'warn',
      message: 'Active Users exceeds Seats Assigned — confirm the team roster export is current.',
    });
  }

  return { errors, warnings };
}

export function validateCopilotRows(rows: CopilotUsageRow[]): CopilotValidationResult {
  const valid: CopilotUsageRow[] = [];
  const invalid: CopilotValidationResult['invalid'] = [];
  const allWarnings: CopilotValidationIssue[] = [];

  rows.forEach((row, idx) => {
    const { errors, warnings } = validateOne(row, idx);
    if (errors.length > 0) {
      invalid.push({ row, issues: errors });
    } else {
      valid.push(row);
    }
    allWarnings.push(...warnings);
  });

  return { valid, invalid, warnings: allWarnings };
}
