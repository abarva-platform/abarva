// Domain validator for parsed GitHub → DORA rows.
//
// Takes the raw-row output of `parseGithubDoraWorkbook` and returns
// either a clean typed `GithubDoraRow` or a list of per-cell errors
// that carry both the row number and the column the error came from.

import {
  GITHUB_DORA_COLUMNS,
  GithubDoraRowSchema,
  type GithubDoraColumn,
  type GithubDoraRawRow,
  type GithubDoraRow,
  type GithubDoraRowError,
} from './schema';

export interface GithubDoraValidationResult {
  readonly validRows: readonly GithubDoraRow[];
  readonly errors: readonly GithubDoraRowError[];
}

const COLUMN_SET: ReadonlySet<string> = new Set(GITHUB_DORA_COLUMNS);

function asColumn(path: PropertyKey): GithubDoraColumn | '__row__' {
  if (typeof path === 'string' && COLUMN_SET.has(path)) {
    return path as GithubDoraColumn;
  }
  return '__row__';
}

/**
 * Validate a list of raw rows. The validator does NOT short-circuit on
 * the first failure — every row is checked so the operator can fix
 * multiple errors in one pass.
 */
export function validateGithubDoraRows(
  rawRows: readonly GithubDoraRawRow[],
): GithubDoraValidationResult {
  const validRows: GithubDoraRow[] = [];
  const errors: GithubDoraRowError[] = [];

  for (const raw of rawRows) {
    const payload = {
      repo: raw.repo,
      team: raw.team,
      period_start: raw.period_start,
      period_end: raw.period_end,
      deployment_frequency_per_day: raw.deployment_frequency_per_day,
      lead_time_for_changes_hours: raw.lead_time_for_changes_hours,
      change_failure_rate_pct: raw.change_failure_rate_pct,
      mttr_hours: raw.mttr_hours,
      sample_size_deploys: raw.sample_size_deploys,
    };

    const parsed = GithubDoraRowSchema.safeParse(payload);
    if (parsed.success) {
      validRows.push(parsed.data);
    } else {
      for (const issue of parsed.error.issues) {
        errors.push({
          rowNumber: raw.rowNumber,
          column: asColumn(issue.path[0] ?? '__row__'),
          message: issue.message,
        });
      }
    }
  }

  return { validRows, errors };
}
