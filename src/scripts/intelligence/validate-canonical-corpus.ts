import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  CANONICAL_STRATEGIC_MOVE_PHASES,
  type CanonicalStrategicMovePhase,
} from '@/lib/intelligence/canonical/industry-ai-pattern';

export const CANONICAL_CORPUS_VALIDATION_INPUT =
  'docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json';
export const CANONICAL_CORPUS_VALIDATION_REPORT =
  'docs/knowledge-corpus/CANONICAL_CORPUS_VALIDATION_REPORT_2026-05-09.md';

const REQUIRED_IDENTITY_FIELDS = [
  'canonical_id',
  'title',
  'industry',
  'enterprise_area',
  'function',
  'process_area',
  'use_case_category',
  'strategic_move_phases',
  'source_basis',
] as const;

const REQUIRED_ARRAY_FIELDS = [
  'industry',
  'strategic_move_phases',
] as const;

const KPI_MINIMUM = 3;
const DATA_DOMAIN_MINIMUM = 3;

export type ValidationSeverity = 'error' | 'warning';

export interface CanonicalCorpusPreviewRow {
  canonical_id: string;
  title: string;
  source_systems: string[];
  source_ids: string[];
  missing_required_fields: string[];
  missing_provenance: boolean;
  unsupported_claim_count: number;
  upsert_payload: Record<string, unknown>;
}

export interface CanonicalCorpusPreviewReport {
  generated_at?: string;
  preview_rows?: CanonicalCorpusPreviewRow[];
  summary?: {
    total_preview_rows?: number;
  };
  db_status?: {
    pattern_packs?: string;
    genome_patterns?: string;
    note?: string;
  };
}

export interface CanonicalCorpusValidationIssue {
  severity: ValidationSeverity;
  canonical_id: string;
  title: string;
  rule: string;
  message: string;
}

export interface CanonicalCorpusValidationSummary {
  total_patterns: number;
  error_count: number;
  warning_count: number;
  patterns_with_errors: number;
  patterns_with_warnings: number;
  phase_coverage: Record<CanonicalStrategicMovePhase, number>;
  source_system_counts: Record<string, number>;
  db_status_note: string;
}

export interface CanonicalCorpusValidationResult {
  generated_at: string;
  input_path: string;
  strict: boolean;
  summary: CanonicalCorpusValidationSummary;
  issues: CanonicalCorpusValidationIssue[];
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}

function issue(
  severity: ValidationSeverity,
  row: CanonicalCorpusPreviewRow,
  rule: string,
  message: string,
): CanonicalCorpusValidationIssue {
  return {
    severity,
    canonical_id: row.canonical_id,
    title: row.title,
    rule,
    message,
  };
}

function validateRow(row: CanonicalCorpusPreviewRow): CanonicalCorpusValidationIssue[] {
  const payload = row.upsert_payload ?? {};
  const issues: CanonicalCorpusValidationIssue[] = [];

  for (const field of REQUIRED_IDENTITY_FIELDS) {
    if (!hasValue(payload[field])) {
      issues.push(issue('error', row, 'required_identity', `Missing canonical field: ${field}.`));
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (asStringArray(payload[field]).length === 0) {
      issues.push(issue('error', row, 'required_array', `${field} must contain at least one value.`));
    }
  }

  const kpis = new Set([
    ...asStringArray(payload.primary_kpis),
    ...asStringArray(payload.secondary_kpis),
  ]);
  if (kpis.size < KPI_MINIMUM) {
    issues.push(issue('error', row, 'minimum_kpis', `Requires at least ${KPI_MINIMUM} KPIs; found ${kpis.size}.`));
  }

  const dataDomains = asStringArray(payload.required_data_domains);
  if (dataDomains.length < DATA_DOMAIN_MINIMUM) {
    issues.push(issue(
      'error',
      row,
      'minimum_data_requirements',
      `Requires at least ${DATA_DOMAIN_MINIMUM} required_data_domains; found ${dataDomains.length}.`,
    ));
  }

  if (asStringArray(payload.common_failure_modes).length === 0) {
    issues.push(issue('error', row, 'failure_modes_required', 'Requires at least one common_failure_modes entry.'));
  }

  if (asStringArray(payload.failure_mode_mitigations).length === 0) {
    issues.push(issue('error', row, 'failure_mitigations_required', 'Requires at least one failure_mode_mitigations entry.'));
  }

  if (asStringArray(payload.recommended_artifacts).length === 0) {
    issues.push(issue('error', row, 'recommended_artifacts_required', 'Requires at least one recommended_artifacts entry.'));
  }

  if (asStringArray(payload.recommended_workshops).length === 0) {
    issues.push(issue('error', row, 'recommended_workshops_required', 'Requires at least one recommended_workshops entry.'));
  }

  if (row.missing_provenance || !hasValue(payload.source_basis) || !hasValue(payload.confidence_rationale)) {
    issues.push(issue('error', row, 'provenance_required', 'Requires source_basis and confidence_rationale.'));
  }

  const quantitativeClaims = asArray(payload.quantitative_claims) as Array<Record<string, unknown>>;
  const unsupportedFlags = asArray(payload.unsupported_claim_flags);
  for (const claim of quantitativeClaims) {
    const confidence = asString(claim.confidence_level);
    const hasSource = asStringArray(claim.source_reference_ids).length > 0;
    const hasCaveat = hasValue(claim.caveat);
    if (!confidence) {
      issues.push(issue('error', row, 'quantitative_claim_confidence', 'Quantitative claim lacks confidence_level.'));
    }
    if (hasValue(claim.value) && !hasSource && !hasCaveat && unsupportedFlags.length === 0) {
      issues.push(issue(
        'warning',
        row,
        'unsupported_quantitative_claim',
        'Quantitative value lacks source reference, caveat, or unsupported_claim_flag.',
      ));
    }
  }

  if (row.unsupported_claim_count > 0 || unsupportedFlags.length > 0) {
    issues.push(issue('warning', row, 'unsupported_claim_flags_present', 'Pattern includes unsupported quantitative claim flags.'));
  }

  return issues;
}

function phaseCoverage(rows: CanonicalCorpusPreviewRow[]): Record<CanonicalStrategicMovePhase, number> {
  const coverage = Object.fromEntries(
    CANONICAL_STRATEGIC_MOVE_PHASES.map((phase) => [phase, 0]),
  ) as Record<CanonicalStrategicMovePhase, number>;

  for (const row of rows) {
    for (const phase of asStringArray(row.upsert_payload.strategic_move_phases)) {
      if (phase in coverage) {
        coverage[phase as CanonicalStrategicMovePhase] += 1;
      }
    }
  }

  return coverage;
}

function sourceSystemCounts(rows: CanonicalCorpusPreviewRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const sourceSystem of row.source_systems) {
      counts[sourceSystem] = (counts[sourceSystem] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function validateCanonicalCorpusPreview(
  preview: CanonicalCorpusPreviewReport,
  options: { inputPath?: string; strict?: boolean } = {},
): CanonicalCorpusValidationResult {
  const rows = preview.preview_rows ?? [];
  const issues = rows.flatMap(validateRow);
  const errorIds = new Set(issues.filter((item) => item.severity === 'error').map((item) => item.canonical_id));
  const warningIds = new Set(issues.filter((item) => item.severity === 'warning').map((item) => item.canonical_id));

  return {
    generated_at: new Date().toISOString(),
    input_path: options.inputPath ?? CANONICAL_CORPUS_VALIDATION_INPUT,
    strict: options.strict ?? false,
    summary: {
      total_patterns: rows.length,
      error_count: issues.filter((item) => item.severity === 'error').length,
      warning_count: issues.filter((item) => item.severity === 'warning').length,
      patterns_with_errors: errorIds.size,
      patterns_with_warnings: warningIds.size,
      phase_coverage: phaseCoverage(rows),
      source_system_counts: sourceSystemCounts(rows),
      db_status_note: preview.db_status?.note ?? 'DB status not provided in preview report.',
    },
    issues,
  };
}

function markdownTable(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map((cell) => cell.replace(/\n/g, '<br>')).join(' | ')} |`),
  ].join('\n');
}

function groupIssues(issues: CanonicalCorpusValidationIssue[]): Array<{ rule: string; severity: ValidationSeverity; count: number }> {
  const groups = new Map<string, { rule: string; severity: ValidationSeverity; count: number }>();
  for (const issueItem of issues) {
    const key = `${issueItem.severity}:${issueItem.rule}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { rule: issueItem.rule, severity: issueItem.severity, count: 1 });
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
}

export function formatCanonicalCorpusValidationMarkdown(result: CanonicalCorpusValidationResult): string {
  const phaseRows = CANONICAL_STRATEGIC_MOVE_PHASES.map((phase) => [
    phase,
    String(result.summary.phase_coverage[phase]),
  ]);
  const sourceRows = Object.entries(result.summary.source_system_counts).map(([source, count]) => [source, String(count)]);
  const issueRows = groupIssues(result.issues).map((item) => [item.severity, item.rule, String(item.count)]);
  const sampleRows = result.issues.slice(0, 50).map((item) => [
    item.severity,
    item.rule,
    item.canonical_id,
    item.message,
  ]);

  return `# Canonical Corpus Validation Report - 2026-05-09

Generated at: \`${result.generated_at}\`

Input: \`${result.input_path}\`

Mode: ${result.strict ? 'strict' : 'report-only'}

## Summary

- Patterns validated: ${result.summary.total_patterns}
- Error issues: ${result.summary.error_count}
- Warning issues: ${result.summary.warning_count}
- Patterns with errors: ${result.summary.patterns_with_errors}
- Patterns with warnings: ${result.summary.patterns_with_warnings}
- DB/backfill status: ${result.summary.db_status_note}

## Phase Coverage

${markdownTable(['Strategic Move phase', 'Pattern count'], phaseRows)}

## Source System Counts

${sourceRows.length > 0 ? markdownTable(['Source system', 'Pattern count'], sourceRows) : 'No source system counts available.'}

## Issue Summary

${issueRows.length > 0 ? markdownTable(['Severity', 'Rule', 'Count'], issueRows) : 'No validation issues detected.'}

## Sample Issues

${sampleRows.length > 0 ? markdownTable(['Severity', 'Rule', 'Canonical id', 'Message'], sampleRows) : 'No sample issues.'}

## Gate Notes

- The validator is intentionally report-only by default while the current corpus still contains known Wave 1 and Wave 2 gaps.
- Use \`--strict\` to make any error fail the command once Wave 3 content remediation is expected to satisfy the quality gates.
- This script does not insert, update, delete, or mutate database content.
`;
}

function parseArgs(argv: string[]): { inputPath: string; outputPath: string; strict: boolean } {
  const inputIndex = argv.indexOf('--input');
  const outputIndex = argv.indexOf('--output');
  return {
    inputPath: inputIndex >= 0 ? argv[inputIndex + 1] : CANONICAL_CORPUS_VALIDATION_INPUT,
    outputPath: outputIndex >= 0 ? argv[outputIndex + 1] : CANONICAL_CORPUS_VALIDATION_REPORT,
    strict: argv.includes('--strict'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.inputPath);
  const outputPath = path.resolve(process.cwd(), args.outputPath);
  const preview = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as CanonicalCorpusPreviewReport;
  const result = validateCanonicalCorpusPreview(preview, {
    inputPath: args.inputPath,
    strict: args.strict,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, formatCanonicalCorpusValidationMarkdown(result));
  process.stdout.write(`${args.outputPath}\n`);
  process.stdout.write(`patterns=${result.summary.total_patterns} errors=${result.summary.error_count} warnings=${result.summary.warning_count}\n`);

  if (args.strict && result.summary.error_count > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
