/**
 * Jira issue ingest — pure parser + validator.
 *
 * Input: tabular rows from a Jira JQL export (XLSX → sheet) or the equivalent
 * CSV. Each row is one issue. The shape (`JiraIngestInputRow`) is the literal
 * column set we publish in `public/templates/tower/jira/template.xlsx`.
 *
 * Output: `JiraIngestRow[]` ready for upsert into `tower_jira_issues` plus a
 * structured validation report that lists every row that failed and why.
 *
 * No I/O. No DB. This file is import-safe from Node CLI and Edge.
 */

const ISSUE_TYPES = ['Epic', 'Story', 'Bug', 'Task'] as const;
export type JiraIssueType = (typeof ISSUE_TYPES)[number];

const STATUSES = [
  'Backlog',
  'To Do',
  'In Progress',
  'In Review',
  'Blocked',
  'Done',
  'Cancelled',
] as const;
export type JiraStatus = (typeof STATUSES)[number];

export interface JiraIngestInputRow {
  issue_key?: string;
  issue_type?: string;
  epic_key?: string;
  team?: string;
  status?: string;
  story_points?: string | number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  cycle_time_hours?: string | number;
}

export interface JiraIngestRow {
  issue_key: string;
  issue_type: JiraIssueType;
  epic_key: string | null;
  team: string;
  status: JiraStatus;
  story_points: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  cycle_time_hours: number | null;
}

export interface JiraRowError {
  row_index: number;
  issue_key: string | null;
  reason: string;
}

export interface JiraParseResult {
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  rows: JiraIngestRow[];
  errors: JiraRowError[];
}

const ISSUE_TYPE_SET = new Set<string>(ISSUE_TYPES);
const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;

function trimOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function nullableTrim(value: unknown): string | null {
  const s = trimOrEmpty(value);
  return s.length > 0 ? s : null;
}

function normalizeIssueType(value: unknown): JiraIssueType | null {
  const v = trimOrEmpty(value);
  if (!v) return null;
  // Match title-case canonical form.
  const canonical =
    v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  return ISSUE_TYPE_SET.has(canonical) ? (canonical as JiraIssueType) : null;
}

function normalizeStatus(value: unknown): JiraStatus | null {
  const v = trimOrEmpty(value);
  if (!v) return null;
  // Allow common upper/lowercase but match against canonical set.
  const match = (STATUSES as readonly string[]).find(
    (s) => s.toLowerCase() === v.toLowerCase(),
  );
  return (match as JiraStatus) ?? null;
}

function parseIntStrict(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const s = String(value).trim();
  if (s === '') return null;
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseNumberLoose(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function isIsoDate(value: string): boolean {
  // Accept YYYY-MM-DD or full ISO-8601 timestamp.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(value))
    return true;
  return false;
}

function normalizeIsoDate(value: string): string | null {
  if (!isIsoDate(value)) return null;
  // Normalize bare YYYY-MM-DD to start-of-day UTC for DB consistency.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
  return value;
}

/**
 * Validate + normalize a Jira ingest input row.
 *
 * Rules:
 *   - issue_key required, matches /^[A-Z][A-Z0-9]+-\d+$/.
 *   - issue_type required, one of Epic|Story|Bug|Task.
 *   - status required, one of the canonical statuses.
 *   - team required, non-empty.
 *   - created_at required, ISO-8601 date.
 *   - story_points optional integer >= 0.
 *   - cycle_time_hours optional non-negative number.
 *   - started_at / completed_at optional ISO-8601 dates.
 *   - For Stories: epic_key is REQUIRED (caller resolves Epic presence
 *     in the full batch — see {@link parseJiraRows}).
 */
function validateAndNormalizeRow(
  raw: JiraIngestInputRow,
  rowIndex: number,
): { ok: true; row: JiraIngestRow } | { ok: false; error: JiraRowError } {
  const issueKey = trimOrEmpty(raw.issue_key);
  if (!issueKey) {
    return {
      ok: false,
      error: { row_index: rowIndex, issue_key: null, reason: 'issue_key required' },
    };
  }
  if (!ISSUE_KEY_PATTERN.test(issueKey)) {
    return {
      ok: false,
      error: {
        row_index: rowIndex,
        issue_key: issueKey,
        reason: `issue_key "${issueKey}" must match ABC-123 format`,
      },
    };
  }

  const issueType = normalizeIssueType(raw.issue_type);
  if (!issueType) {
    return {
      ok: false,
      error: {
        row_index: rowIndex,
        issue_key: issueKey,
        reason: `issue_type must be one of ${ISSUE_TYPES.join('|')} (got "${raw.issue_type ?? ''}")`,
      },
    };
  }

  const status = normalizeStatus(raw.status);
  if (!status) {
    return {
      ok: false,
      error: {
        row_index: rowIndex,
        issue_key: issueKey,
        reason: `status must be one of ${STATUSES.join('|')} (got "${raw.status ?? ''}")`,
      },
    };
  }

  const team = trimOrEmpty(raw.team);
  if (!team) {
    return {
      ok: false,
      error: { row_index: rowIndex, issue_key: issueKey, reason: 'team required' },
    };
  }

  const createdAtRaw = trimOrEmpty(raw.created_at);
  if (!createdAtRaw) {
    return {
      ok: false,
      error: { row_index: rowIndex, issue_key: issueKey, reason: 'created_at required' },
    };
  }
  const createdAt = normalizeIsoDate(createdAtRaw);
  if (!createdAt) {
    return {
      ok: false,
      error: {
        row_index: rowIndex,
        issue_key: issueKey,
        reason: `created_at "${createdAtRaw}" must be ISO-8601 (YYYY-MM-DD or full timestamp)`,
      },
    };
  }

  let startedAt: string | null = null;
  const startedAtRaw = nullableTrim(raw.started_at);
  if (startedAtRaw !== null) {
    const normalized = normalizeIsoDate(startedAtRaw);
    if (!normalized) {
      return {
        ok: false,
        error: {
          row_index: rowIndex,
          issue_key: issueKey,
          reason: `started_at "${startedAtRaw}" must be ISO-8601`,
        },
      };
    }
    startedAt = normalized;
  }

  let completedAt: string | null = null;
  const completedAtRaw = nullableTrim(raw.completed_at);
  if (completedAtRaw !== null) {
    const normalized = normalizeIsoDate(completedAtRaw);
    if (!normalized) {
      return {
        ok: false,
        error: {
          row_index: rowIndex,
          issue_key: issueKey,
          reason: `completed_at "${completedAtRaw}" must be ISO-8601`,
        },
      };
    }
    completedAt = normalized;
  }

  let storyPoints: number | null = null;
  if (raw.story_points !== undefined && raw.story_points !== null && raw.story_points !== '') {
    const sp = parseIntStrict(raw.story_points);
    if (sp === null) {
      return {
        ok: false,
        error: {
          row_index: rowIndex,
          issue_key: issueKey,
          reason: `story_points "${raw.story_points}" must be a non-negative integer`,
        },
      };
    }
    if (sp < 0) {
      return {
        ok: false,
        error: {
          row_index: rowIndex,
          issue_key: issueKey,
          reason: `story_points must be >= 0`,
        },
      };
    }
    storyPoints = sp;
  }

  let cycleTimeHours: number | null = null;
  if (
    raw.cycle_time_hours !== undefined &&
    raw.cycle_time_hours !== null &&
    raw.cycle_time_hours !== ''
  ) {
    const n = parseNumberLoose(raw.cycle_time_hours);
    if (n === null) {
      return {
        ok: false,
        error: {
          row_index: rowIndex,
          issue_key: issueKey,
          reason: `cycle_time_hours "${raw.cycle_time_hours}" must be a number`,
        },
      };
    }
    if (n < 0) {
      return {
        ok: false,
        error: {
          row_index: rowIndex,
          issue_key: issueKey,
          reason: 'cycle_time_hours must be >= 0',
        },
      };
    }
    cycleTimeHours = n;
  }

  const epicKey = nullableTrim(raw.epic_key);
  if (epicKey && !ISSUE_KEY_PATTERN.test(epicKey)) {
    return {
      ok: false,
      error: {
        row_index: rowIndex,
        issue_key: issueKey,
        reason: `epic_key "${epicKey}" must match ABC-123 format`,
      },
    };
  }

  return {
    ok: true,
    row: {
      issue_key: issueKey,
      issue_type: issueType,
      epic_key: epicKey,
      team,
      status,
      story_points: storyPoints,
      created_at: createdAt,
      started_at: startedAt,
      completed_at: completedAt,
      cycle_time_hours: cycleTimeHours,
    },
  };
}

/**
 * Parse + validate a batch of Jira input rows.
 *
 * Two-pass:
 *   1. Per-row syntactic validation (above).
 *   2. Cross-row referential check: every Story must reference an Epic
 *      whose key appears in the same batch (or is null and is therefore
 *      a Story-without-epic, which is flagged).
 *
 * Rows that fail validation are reported in `errors` and excluded from
 * `rows`. The caller decides whether to abort on any errors or continue
 * with the valid subset (the CLI defaults to continue + report).
 */
export function parseJiraRows(input: JiraIngestInputRow[]): JiraParseResult {
  const errors: JiraRowError[] = [];
  const valid: JiraIngestRow[] = [];

  // Pass 1: per-row.
  for (let i = 0; i < input.length; i += 1) {
    const result = validateAndNormalizeRow(input[i], i);
    if (result.ok) valid.push(result.row);
    else errors.push(result.error);
  }

  // Pass 2: cross-row epic-parent check.
  const epicKeysInBatch = new Set(
    valid.filter((r) => r.issue_type === 'Epic').map((r) => r.issue_key),
  );

  const referencedValid: JiraIngestRow[] = [];
  for (const row of valid) {
    if (row.issue_type === 'Story') {
      if (!row.epic_key) {
        errors.push({
          row_index: -1,
          issue_key: row.issue_key,
          reason: 'Story rows must reference an epic_key',
        });
        continue;
      }
      if (!epicKeysInBatch.has(row.epic_key)) {
        errors.push({
          row_index: -1,
          issue_key: row.issue_key,
          reason: `Story "${row.issue_key}" references epic "${row.epic_key}" which is not present in the batch as an Epic row`,
        });
        continue;
      }
    }
    referencedValid.push(row);
  }

  return {
    rows_total: input.length,
    rows_valid: referencedValid.length,
    rows_invalid: errors.length,
    rows: referencedValid,
    errors,
  };
}

export const JIRA_ISSUE_TYPES = ISSUE_TYPES;
export const JIRA_STATUSES = STATUSES;
export const JIRA_TEMPLATE_COLUMNS: readonly string[] = [
  'issue_key',
  'issue_type',
  'epic_key',
  'team',
  'status',
  'story_points',
  'created_at',
  'started_at',
  'completed_at',
  'cycle_time_hours',
] as const;
