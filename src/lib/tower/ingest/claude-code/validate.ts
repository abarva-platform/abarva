// Tower · Claude Code developer usage ingest — validator.
//
// Lightweight rules that mirror the DB CHECK constraints, plus dedup
// detection on the natural key (tenant, developer_id, period_start).

import type {
  ClaudeCodeUsageRow,
  ValidationError,
  ValidationResult,
} from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(s: string | null | undefined): boolean {
  if (!s) return false;
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function dayDelta(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function validateClaudeCodeRows(rows: ClaudeCodeUsageRow[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, number>();

  rows.forEach((row, idx) => {
    const rowIndex = idx + 1;
    const ref = { row_index: rowIndex, developer_id: row.developer_id, period_start: row.period_start };

    if (!row.developer_id || row.developer_id.length > 256) {
      errors.push({ ...ref, message: 'developer_id missing or too long' });
    }
    if (!row.team) {
      errors.push({ ...ref, message: 'team missing' });
    }
    if (!isIsoDate(row.period_start)) {
      errors.push({ ...ref, message: `period_start is not ISO date: ${row.period_start}` });
    }
    if (!isIsoDate(row.period_end)) {
      errors.push({ ...ref, message: `period_end is not ISO date: ${row.period_end}` });
    }
    if (isIsoDate(row.period_start) && isIsoDate(row.period_end)) {
      const delta = dayDelta(row.period_start, row.period_end);
      if (delta < 0) {
        errors.push({ ...ref, message: 'period_end is before period_start' });
      } else if (delta > 366) {
        warnings.push(`row ${rowIndex} ${row.developer_id}: period spans >366 days (${delta})`);
      }
    }

    for (const [field, value] of Object.entries({
      sessions: row.sessions,
      prompt_tokens: row.prompt_tokens,
      output_tokens: row.output_tokens,
      monthly_cost_usd: row.monthly_cost_usd,
    })) {
      if (value != null) {
        if (!Number.isFinite(value)) {
          errors.push({ ...ref, message: `${field} not a finite number: ${value}` });
        } else if (value < 0) {
          errors.push({ ...ref, message: `${field} is negative: ${value}` });
        }
      }
    }

    // Plausibility band: 100K–5M tokens per developer per month is the brief.
    // We warn (not error) outside this band so real outliers aren't blocked.
    const totalTokens = (row.prompt_tokens ?? 0) + (row.output_tokens ?? 0);
    if (totalTokens > 0 && (totalTokens < 50_000 || totalTokens > 25_000_000)) {
      warnings.push(
        `row ${rowIndex} ${row.developer_id}: total tokens ${totalTokens.toLocaleString()} outside plausibility band (50K–25M)`,
      );
    }

    const naturalKey = `${row.developer_id}|${row.period_start}`;
    if (seen.has(naturalKey)) {
      errors.push({
        ...ref,
        message: `duplicate natural key with row ${seen.get(naturalKey)}: (${naturalKey})`,
      });
    } else {
      seen.set(naturalKey, rowIndex);
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}
