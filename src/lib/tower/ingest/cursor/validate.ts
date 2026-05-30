// S4 — Cursor usage + cost ingest
// Field/range/cross-field validation for Cursor parsed rows.
// Pure: no DB, no fs. Returns an envelope with valid rows + per-row issues
// so the CLI / route layer can decide whether to fail fast or write partial.

import type { CursorRawRow } from './parse';

export type CursorIssueSeverity = 'error' | 'warning';

export interface CursorRowIssue {
  row_index: number;
  team: string;
  period_start: string;
  field: string;
  severity: CursorIssueSeverity;
  message: string;
}

export interface CursorValidatedRow extends CursorRawRow {
  acceptance_rate: number; // 0..1, derived
}

export interface CursorValidationResult {
  valid: CursorValidatedRow[];
  issues: CursorRowIssue[];
  natural_key_collisions: string[];
}

const MAX_REASONABLE_SEATS = 100_000;
const MAX_REASONABLE_COMPLETIONS = 100_000_000;
const MAX_REASONABLE_COST_USD = 10_000_000;

export function validateCursorRows(rows: CursorRawRow[]): CursorValidationResult {
  const issues: CursorRowIssue[] = [];
  const valid: CursorValidatedRow[] = [];
  const seenKeys = new Set<string>();
  const collisions = new Set<string>();

  for (const row of rows) {
    const rowIssues: CursorRowIssue[] = [];
    const pushIssue = (
      field: string,
      severity: CursorIssueSeverity,
      message: string,
    ) => {
      rowIssues.push({
        row_index: row._row_index,
        team: row.team,
        period_start: row.period_start,
        field,
        severity,
        message,
      });
    };

    if (!row.team || row.team.length > 200) {
      pushIssue('team', 'error', 'team name missing or > 200 chars');
    }

    if (row.period_start > row.period_end) {
      pushIssue('period_end', 'error', 'period_end before period_start');
    }

    if (!isFirstOfMonth(row.period_start)) {
      pushIssue('period_start', 'warning', 'expected first-of-month YYYY-MM-01');
    }

    if (!Number.isInteger(row.seats_assigned)) {
      pushIssue('seats_assigned', 'error', 'must be an integer');
    } else if (row.seats_assigned < 0 || row.seats_assigned > MAX_REASONABLE_SEATS) {
      pushIssue('seats_assigned', 'error', `out of plausible range [0, ${MAX_REASONABLE_SEATS}]`);
    }

    if (!Number.isInteger(row.active_users)) {
      pushIssue('active_users', 'error', 'must be an integer');
    } else if (row.active_users < 0) {
      pushIssue('active_users', 'error', 'must be non-negative');
    } else if (row.active_users > row.seats_assigned) {
      pushIssue(
        'active_users',
        'error',
        `active_users (${row.active_users}) exceeds seats_assigned (${row.seats_assigned})`,
      );
    }

    if (!Number.isInteger(row.completions_shown) || row.completions_shown < 0) {
      pushIssue('completions_shown', 'error', 'must be a non-negative integer');
    } else if (row.completions_shown > MAX_REASONABLE_COMPLETIONS) {
      pushIssue('completions_shown', 'warning', 'exceeds plausibility ceiling — verify export');
    }

    if (!Number.isInteger(row.completions_accepted) || row.completions_accepted < 0) {
      pushIssue('completions_accepted', 'error', 'must be a non-negative integer');
    } else if (row.completions_accepted > row.completions_shown) {
      pushIssue(
        'completions_accepted',
        'error',
        `completions_accepted (${row.completions_accepted}) exceeds completions_shown (${row.completions_shown})`,
      );
    }

    if (!Number.isFinite(row.monthly_cost_usd) || row.monthly_cost_usd < 0) {
      pushIssue('monthly_cost_usd', 'error', 'must be a non-negative number');
    } else if (row.monthly_cost_usd > MAX_REASONABLE_COST_USD) {
      pushIssue('monthly_cost_usd', 'warning', 'exceeds plausibility ceiling — verify billing export');
    }

    const naturalKey = `${row.team}__${row.period_start}`;
    if (seenKeys.has(naturalKey)) {
      collisions.add(naturalKey);
      pushIssue(
        'team+period_start',
        'error',
        `duplicate natural key within file (team="${row.team}", period_start=${row.period_start})`,
      );
    } else {
      seenKeys.add(naturalKey);
    }

    issues.push(...rowIssues);

    const hasError = rowIssues.some((i) => i.severity === 'error');
    if (!hasError) {
      const acceptance_rate =
        row.completions_shown > 0 ? row.completions_accepted / row.completions_shown : 0;
      valid.push({ ...row, acceptance_rate });
    }
  }

  return {
    valid,
    issues,
    natural_key_collisions: Array.from(collisions),
  };
}

function isFirstOfMonth(yyyymmdd: string): boolean {
  return /^\d{4}-\d{2}-01$/.test(yyyymmdd);
}
