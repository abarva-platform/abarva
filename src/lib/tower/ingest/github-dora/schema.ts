// Canonical schema for the GitHub → DORA metrics ingest (S1).
//
// Single source of truth for column order, types, and validation. The
// template builder, parser, validator, ingest CLI, and tests all import
// from here so the workbook header row, the README field mapping, and
// the database table cannot drift apart.

import { z } from 'zod';

// ---------------------------------------------------------------------
// Column contract
// ---------------------------------------------------------------------

/**
 * Ordered tuple of Data-sheet column keys. The template, sample-filled
 * workbook, parser, and DB row all agree on this exact order.
 */
export const GITHUB_DORA_COLUMNS = [
  'repo',
  'team',
  'period_start',
  'period_end',
  'deployment_frequency_per_day',
  'lead_time_for_changes_hours',
  'change_failure_rate_pct',
  'mttr_hours',
  'sample_size_deploys',
] as const;

export type GithubDoraColumn = (typeof GITHUB_DORA_COLUMNS)[number];

/**
 * Per-column metadata used by the template builder ("How to fill" /
 * "Schema" sheets) and by the README field-mapping table.
 *
 * `excelType` mirrors exceljs cell types so column validators can be
 * generated mechanically.
 */
export interface GithubDoraColumnSpec {
  readonly key: GithubDoraColumn;
  readonly header: string;
  readonly excelType: 'string' | 'date' | 'number' | 'integer';
  readonly unit?: string;
  readonly required: boolean;
  readonly description: string;
  readonly githubField: string;
  readonly example: string;
}

export const GITHUB_DORA_COLUMN_SPECS: readonly GithubDoraColumnSpec[] = [
  {
    key: 'repo',
    header: 'repo',
    excelType: 'string',
    required: true,
    description:
      'GitHub repository in `owner/name` form. One row per (repo, period).',
    githubField: 'repository.full_name',
    example: 'northwind-retail/checkout-service',
  },
  {
    key: 'team',
    header: 'team',
    excelType: 'string',
    required: true,
    description:
      'Owning team slug. Should match an `org_topology.team_id` if the tenant has one loaded.',
    githubField: 'CODEOWNERS top-level team slug',
    example: 'checkout-platform',
  },
  {
    key: 'period_start',
    header: 'period_start',
    excelType: 'date',
    required: true,
    description:
      'Inclusive start of the reporting window. Monthly cadence — first day of the month, UTC.',
    githubField: 'aggregation window start (ISO 8601 date)',
    example: '2025-01-01',
  },
  {
    key: 'period_end',
    header: 'period_end',
    excelType: 'date',
    required: true,
    description:
      'Inclusive end of the reporting window. Must be >= period_start. Monthly cadence — last day of the month, UTC.',
    githubField: 'aggregation window end (ISO 8601 date)',
    example: '2025-01-31',
  },
  {
    key: 'deployment_frequency_per_day',
    header: 'deployment_frequency_per_day',
    excelType: 'number',
    unit: 'deploys/day',
    required: true,
    description:
      'Successful production deployments per calendar day across the window. Derived from GitHub Actions deployment events with `environment="production"` and `status="success"`.',
    githubField: 'GET /repos/{owner}/{repo}/deployments + statuses',
    example: '1.42',
  },
  {
    key: 'lead_time_for_changes_hours',
    header: 'lead_time_for_changes_hours',
    excelType: 'number',
    unit: 'hours',
    required: true,
    description:
      'Median hours from first commit to production deploy for changes merged in the window.',
    githubField:
      'PR merge_commit_sha → first commit timestamp; production deploy timestamp',
    example: '36.5',
  },
  {
    key: 'change_failure_rate_pct',
    header: 'change_failure_rate_pct',
    excelType: 'number',
    unit: 'percent (0–100)',
    required: true,
    description:
      'Share of production deployments in the window that required a hotfix, rollback, or triggered an `incident:*` issue within 24h.',
    githubField:
      'production deploy events ↔ issues labelled `incident:*` (24h window)',
    example: '11.5',
  },
  {
    key: 'mttr_hours',
    header: 'mttr_hours',
    excelType: 'number',
    unit: 'hours',
    required: true,
    description:
      'Mean hours from `incident:*` issue open to close for incidents linked to this repo in the window. 0 if no incidents occurred.',
    githubField: 'issues with label `incident:*`, created_at → closed_at',
    example: '4.25',
  },
  {
    key: 'sample_size_deploys',
    header: 'sample_size_deploys',
    excelType: 'integer',
    required: true,
    description:
      'Total number of successful production deployments in the window. Acts as the denominator for change_failure_rate_pct.',
    githubField:
      'count of GET /repos/{owner}/{repo}/deployments with status success in window',
    example: '44',
  },
];

// ---------------------------------------------------------------------
// Runtime validation (zod)
// ---------------------------------------------------------------------

const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Trim and reject blank strings. Used for required string columns.
 */
const nonEmptyString = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: 'must not be empty' });

/**
 * Repo identifier: `owner/name`, lowercase letters/digits/dashes only.
 * Mirrors GitHub repo name rules without trying to be GitHub itself.
 */
const repoSlug = nonEmptyString.refine(
  (s) => /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/.test(s),
  { message: 'must match `owner/name`, lowercase letters/digits/._-' },
);

const teamSlug = nonEmptyString.refine(
  (s) => /^[a-z0-9][a-z0-9_-]*$/.test(s),
  { message: 'must be a lowercase slug (letters/digits/_-)' },
);

const isoDate = nonEmptyString.refine(
  (s) => DATE_ISO_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)),
  { message: 'must be ISO 8601 date YYYY-MM-DD' },
);

const nonNegativeNumber = z
  .number()
  .finite()
  .refine((v) => v >= 0, { message: 'must be >= 0' });

const percentNumber = z
  .number()
  .finite()
  .refine((v) => v >= 0 && v <= 100, { message: 'must be between 0 and 100' });

const nonNegativeInt = z
  .number()
  .int({ message: 'must be a whole number' })
  .refine((v) => v >= 0, { message: 'must be >= 0' });

export const GithubDoraRowSchema = z
  .object({
    repo: repoSlug,
    team: teamSlug,
    period_start: isoDate,
    period_end: isoDate,
    deployment_frequency_per_day: nonNegativeNumber,
    lead_time_for_changes_hours: nonNegativeNumber,
    change_failure_rate_pct: percentNumber,
    mttr_hours: nonNegativeNumber,
    sample_size_deploys: nonNegativeInt,
  })
  .superRefine((row, ctx) => {
    if (row.period_end < row.period_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['period_end'],
        message: 'period_end must be on or after period_start',
      });
    }
  });

export type GithubDoraRow = z.infer<typeof GithubDoraRowSchema>;

// ---------------------------------------------------------------------
// Pre-validation raw shape (post-parse, pre-validate)
// ---------------------------------------------------------------------

/**
 * Row shape emitted by the parser. Values are already normalized to
 * strings (dates as `YYYY-MM-DD`) and numbers, but have NOT been
 * domain-validated yet. The validator turns these into `GithubDoraRow`.
 */
export interface GithubDoraRawRow {
  readonly rowNumber: number;
  readonly repo: unknown;
  readonly team: unknown;
  readonly period_start: unknown;
  readonly period_end: unknown;
  readonly deployment_frequency_per_day: unknown;
  readonly lead_time_for_changes_hours: unknown;
  readonly change_failure_rate_pct: unknown;
  readonly mttr_hours: unknown;
  readonly sample_size_deploys: unknown;
}

export interface GithubDoraRowError {
  readonly rowNumber: number;
  readonly column: GithubDoraColumn | '__row__';
  readonly message: string;
}
