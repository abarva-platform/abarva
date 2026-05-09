import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadDotenv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { CANONICAL_INDUSTRY_AI_PATTERNS_TABLE } from '@/lib/intelligence/canonical/persistence-contract';

import {
  BACKFILL_PREVIEW_JSON,
  type CanonicalBackfillPreviewReport,
  type CanonicalBackfillPreviewRow,
} from './preview-canonical-corpus-backfill';

export const CANONICAL_BACKFILL_EXECUTION_MD =
  'docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_EXECUTION_REPORT_2026-05-09.md';

const BACKFILL_ACTOR = 'canonical_corpus_backfill_2026_05_09';
const WRITE_BATCH_SIZE = 50;

type BackfillMode = 'dry-run' | 'write';

export interface BackfillOptions {
  mode: BackfillMode;
  strict: boolean;
  inputPath: string;
  reportPath: string;
  generatedAt: string;
}

export interface CanonicalBackfillPlanRow {
  canonical_id: string;
  title: string;
  content_hash: string;
  source_keys: string[];
  missing_required_fields: string[];
  missing_provenance: boolean;
  duplicate_risk: string | null;
  payload: Record<string, unknown>;
}

export interface CanonicalBackfillCollision {
  canonical_id: string;
  source_keys: string[];
}

export interface CanonicalBackfillPlan {
  target_table: typeof CANONICAL_INDUSTRY_AI_PATTERNS_TABLE;
  source_preview_rows: number;
  rows_to_consider: CanonicalBackfillPlanRow[];
  collisions: CanonicalBackfillCollision[];
  strict_blocked_rows: CanonicalBackfillPlanRow[];
  skipped_rows: Array<{ canonical_id: string; reason: string }>;
}

export interface ExistingCanonicalRow {
  canonical_id: string;
  content_hash: string | null;
}

export interface BackfillExecutionSummary {
  generated_at: string;
  mode: BackfillMode;
  strict: boolean;
  target_table: typeof CANONICAL_INDUSTRY_AI_PATTERNS_TABLE;
  input_path: string;
  report_path: string;
  source_preview_rows: number;
  rows_considered: number;
  rows_would_insert: number;
  rows_would_update: number;
  rows_unchanged: number;
  rows_written: number;
  rows_skipped: number;
  collision_groups: number;
  strict_blocked_rows: number;
  db_status:
    | 'not_required_dry_run'
    | 'comparison_skipped_missing_credentials'
    | 'comparison_success'
    | 'write_success'
    | 'write_blocked'
    | 'write_failed';
  db_error?: string;
}

function readOptionalEnvFile(): void {
  const explicitPath = process.env.KNOWLEDGE_BACKFILL_ENV_FILE;
  const candidates = [
    explicitPath && explicitPath.trim() ? explicitPath : null,
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      loadDotenv({ path: envPath, quiet: true });
    }
  }
}

function parseArgs(argv: string[]): BackfillOptions {
  const readValue = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  return {
    mode: argv.includes('--apply') || argv.includes('--write') ? 'write' : 'dry-run',
    strict: argv.includes('--strict'),
    inputPath: readValue('--input') ?? BACKFILL_PREVIEW_JSON,
    reportPath: readValue('--report') ?? CANONICAL_BACKFILL_EXECUTION_MD,
    generatedAt: process.env.CANONICAL_BACKFILL_EXECUTION_GENERATED_AT ?? new Date().toISOString(),
  };
}

function sourceKeys(row: CanonicalBackfillPreviewRow): string[] {
  return row.source_systems.map((source, index) => `${source}:${row.source_ids[index] ?? 'unknown'}`);
}

function toPlanRow(row: CanonicalBackfillPreviewRow): CanonicalBackfillPlanRow {
  return {
    canonical_id: row.canonical_id,
    title: row.title,
    content_hash: row.content_hash,
    source_keys: sourceKeys(row),
    missing_required_fields: row.missing_required_fields,
    missing_provenance: row.missing_provenance,
    duplicate_risk: row.duplicate_risk,
    payload: {
      ...row.upsert_payload,
      created_by: BACKFILL_ACTOR,
      updated_by: BACKFILL_ACTOR,
    },
  };
}

function isStrictBlocked(row: CanonicalBackfillPlanRow): boolean {
  return row.missing_required_fields.length > 0 || row.missing_provenance;
}

export function buildBackfillPlan(
  preview: CanonicalBackfillPreviewReport,
  options: Pick<BackfillOptions, 'strict'>,
): CanonicalBackfillPlan {
  if (!preview.dry_run || preview.target_table !== CANONICAL_INDUSTRY_AI_PATTERNS_TABLE) {
    throw new Error(`Preview must be a dry-run for ${CANONICAL_INDUSTRY_AI_PATTERNS_TABLE}.`);
  }

  const rowsByCanonicalId = new Map<string, CanonicalBackfillPreviewRow[]>();
  const skippedRows: CanonicalBackfillPlan['skipped_rows'] = [];
  for (const row of preview.preview_rows) {
    if (!row.canonical_id || !row.upsert_payload) {
      skippedRows.push({ canonical_id: row.canonical_id || 'unknown', reason: 'missing canonical_id or payload' });
      continue;
    }

    rowsByCanonicalId.set(row.canonical_id, [...(rowsByCanonicalId.get(row.canonical_id) ?? []), row]);
  }

  const collisions = [...rowsByCanonicalId.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([canonical_id, rows]) => ({
      canonical_id,
      source_keys: rows.flatMap(sourceKeys).sort(),
    }))
    .sort((left, right) => left.canonical_id.localeCompare(right.canonical_id));
  const collisionIds = new Set(collisions.map((collision) => collision.canonical_id));
  const rowsToConsider = [...rowsByCanonicalId.entries()]
    .filter(([canonicalId]) => !collisionIds.has(canonicalId))
    .map(([, rows]) => toPlanRow(rows[0]))
    .sort((left, right) => left.canonical_id.localeCompare(right.canonical_id));
  const strictBlockedRows = options.strict ? rowsToConsider.filter(isStrictBlocked) : [];

  return {
    target_table: CANONICAL_INDUSTRY_AI_PATTERNS_TABLE,
    source_preview_rows: preview.preview_rows.length,
    rows_to_consider: rowsToConsider,
    collisions,
    strict_blocked_rows: strictBlockedRows,
    skipped_rows: skippedRows,
  };
}

export function readPreviewReport(inputPath: string): CanonicalBackfillPreviewReport {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as CanonicalBackfillPreviewReport;
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchExistingHashes(
  supabase: SupabaseClient,
  canonicalIds: string[],
): Promise<Map<string, string | null>> {
  const existing = new Map<string, string | null>();
  for (let index = 0; index < canonicalIds.length; index += WRITE_BATCH_SIZE) {
    const batch = canonicalIds.slice(index, index + WRITE_BATCH_SIZE);
    const { data, error } = await supabase
      .from(CANONICAL_INDUSTRY_AI_PATTERNS_TABLE)
      .select('canonical_id,content_hash')
      .in('canonical_id', batch);

    if (error) throw new Error(`existing row lookup failed: ${error.message}`);

    for (const row of (data ?? []) as ExistingCanonicalRow[]) {
      existing.set(row.canonical_id, row.content_hash ?? null);
    }
  }

  return existing;
}

async function writeRows(supabase: SupabaseClient, rows: CanonicalBackfillPlanRow[]): Promise<void> {
  for (let index = 0; index < rows.length; index += WRITE_BATCH_SIZE) {
    const batch = rows.slice(index, index + WRITE_BATCH_SIZE).map((row) => row.payload);
    const { error } = await supabase
      .from(CANONICAL_INDUSTRY_AI_PATTERNS_TABLE)
      .upsert(batch, { onConflict: 'canonical_id' });

    if (error) throw new Error(`canonical corpus upsert failed: ${error.message}`);
  }
}

function classifyRows(
  rows: CanonicalBackfillPlanRow[],
  existingHashes: Map<string, string | null>,
): Pick<BackfillExecutionSummary, 'rows_would_insert' | 'rows_would_update' | 'rows_unchanged'> {
  let rowsWouldInsert = 0;
  let rowsWouldUpdate = 0;
  let rowsUnchanged = 0;

  for (const row of rows) {
    if (!existingHashes.has(row.canonical_id)) {
      rowsWouldInsert += 1;
    } else if (existingHashes.get(row.canonical_id) !== row.content_hash) {
      rowsWouldUpdate += 1;
    } else {
      rowsUnchanged += 1;
    }
  }

  return {
    rows_would_insert: rowsWouldInsert,
    rows_would_update: rowsWouldUpdate,
    rows_unchanged: rowsUnchanged,
  };
}

function markdownTable(headers: string[], rows: string[][]): string {
  const escape = (value: string) => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

export function renderExecutionReport(
  summary: BackfillExecutionSummary,
  plan: CanonicalBackfillPlan,
): string {
  const collisionRows = plan.collisions.map((collision) => [
    collision.canonical_id,
    collision.source_keys.join(', '),
  ]);
  const plannedRows = plan.rows_to_consider.slice(0, 80).map((row) => [
    row.canonical_id,
    row.title,
    row.duplicate_risk ?? '',
    String(row.missing_required_fields.length),
    row.missing_provenance ? 'yes' : 'no',
    row.content_hash,
  ]);
  const strictRows = plan.strict_blocked_rows.slice(0, 80).map((row) => [
    row.canonical_id,
    row.title,
    row.missing_required_fields.join(', '),
    row.missing_provenance ? 'yes' : 'no',
  ]);

  return `# Canonical Corpus Backfill Execution Report

Date: 2026-05-09

Generated by: \`src/scripts/intelligence/backfill-canonical-corpus.ts\`

Mode: \`${summary.mode}\`

Strict mode: \`${summary.strict}\`

Target table: \`${summary.target_table}\`

Input preview: \`${summary.input_path}\`

DB status: \`${summary.db_status}\`

${summary.db_error ? `DB error: \`${summary.db_error}\`\n` : ''}

## Summary

- Source preview rows: ${summary.source_preview_rows}
- Rows considered after collision blocklist: ${summary.rows_considered}
- Rows that would insert: ${summary.rows_would_insert}
- Rows that would update: ${summary.rows_would_update}
- Rows unchanged: ${summary.rows_unchanged}
- Rows written: ${summary.rows_written}
- Rows skipped: ${summary.rows_skipped}
- Canonical-id collision groups: ${summary.collision_groups}
- Strict-blocked rows: ${summary.strict_blocked_rows}

## Write Gate

Write mode refuses to run when canonical-id collisions exist. This prevents last-write-wins behavior and requires a reviewed merge, rename, or deprecation decision before persistence.

${summary.mode === 'write' && summary.db_status === 'write_success'
  ? 'Write mode completed successfully.'
  : 'No database mutation was performed unless DB status is `write_success`.'}

## Canonical-Id Collisions

${collisionRows.length > 0 ? markdownTable(['Canonical id', 'Source keys'], collisionRows) : 'No canonical-id collisions detected.'}

## Strict-Blocked Rows

${strictRows.length > 0 ? markdownTable(['Canonical id', 'Title', 'Missing fields', 'Missing provenance'], strictRows) : 'No strict-blocked rows detected for the selected mode.'}

## Planned Rows

First 80 non-colliding rows are shown here.

${plannedRows.length > 0 ? markdownTable(['Canonical id', 'Title', 'Duplicate risk', 'Missing fields', 'Missing provenance', 'Content hash'], plannedRows) : 'No rows planned.'}

## Commands

Dry-run mode is the default:

\`\`\`bash
npm run intel:canonical-corpus:backfill:dry
\`\`\`

Write mode requires \`NEXT_PUBLIC_SUPABASE_URL\` and \`SUPABASE_SERVICE_ROLE_KEY\`, and is blocked until canonical-id collisions are resolved:

\`\`\`bash
npm run intel:canonical-corpus:backfill:write
\`\`\`
`;
}

export async function runBackfill(
  options: BackfillOptions,
  injectedSupabase?: SupabaseClient | null,
): Promise<BackfillExecutionSummary> {
  readOptionalEnvFile();

  const preview = readPreviewReport(options.inputPath);
  const plan = buildBackfillPlan(preview, options);
  const rowsEligibleForWrite = options.strict
    ? plan.rows_to_consider.filter((row) => !isStrictBlocked(row))
    : plan.rows_to_consider;
  const summary: BackfillExecutionSummary = {
    generated_at: options.generatedAt,
    mode: options.mode,
    strict: options.strict,
    target_table: CANONICAL_INDUSTRY_AI_PATTERNS_TABLE,
    input_path: options.inputPath,
    report_path: options.reportPath,
    source_preview_rows: plan.source_preview_rows,
    rows_considered: plan.rows_to_consider.length,
    rows_would_insert: rowsEligibleForWrite.length,
    rows_would_update: 0,
    rows_unchanged: 0,
    rows_written: 0,
    rows_skipped: plan.skipped_rows.length,
    collision_groups: plan.collisions.length,
    strict_blocked_rows: plan.strict_blocked_rows.length,
    db_status: options.mode === 'dry-run' ? 'not_required_dry_run' : 'write_success',
  };

  if (options.mode === 'write' && plan.collisions.length > 0) {
    summary.db_status = 'write_blocked';
    summary.db_error = `Canonical-id collisions must be resolved before write mode (${plan.collisions.length} groups).`;
    fs.writeFileSync(options.reportPath, renderExecutionReport(summary, plan));
    return summary;
  }

  if (options.mode === 'write' && options.strict && plan.strict_blocked_rows.length > 0) {
    summary.db_status = 'write_blocked';
    summary.db_error = `Strict mode blocked ${plan.strict_blocked_rows.length} rows.`;
    fs.writeFileSync(options.reportPath, renderExecutionReport(summary, plan));
    return summary;
  }

  const supabase = injectedSupabase ?? getSupabaseClient();
  if (supabase) {
    try {
      const existingHashes = await fetchExistingHashes(
        supabase,
        rowsEligibleForWrite.map((row) => row.canonical_id),
      );
      Object.assign(summary, classifyRows(rowsEligibleForWrite, existingHashes));
      if (options.mode === 'dry-run') {
        summary.db_status = 'comparison_success';
      }
    } catch (error) {
      summary.db_status = options.mode === 'dry-run' ? 'comparison_skipped_missing_credentials' : 'write_failed';
      summary.db_error = (error as Error).message;
    }
  } else if (options.mode === 'dry-run') {
    summary.db_status = 'comparison_skipped_missing_credentials';
  } else {
    summary.db_status = 'write_failed';
    summary.db_error = 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for write mode.';
  }

  if (options.mode === 'write' && summary.db_status !== 'write_failed') {
    if (supabase) {
      try {
        await writeRows(supabase, rowsEligibleForWrite);
        summary.rows_written = rowsEligibleForWrite.length;
        summary.db_status = 'write_success';
      } catch (error) {
        summary.db_status = 'write_failed';
        summary.db_error = (error as Error).message;
      }
    }
  }

  fs.writeFileSync(options.reportPath, renderExecutionReport(summary, plan));
  return summary;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const summary = await runBackfill(options);

  console.log(`Wrote ${summary.report_path}`);
  console.log(`Mode: ${summary.mode}`);
  console.log(`Source preview rows: ${summary.source_preview_rows}`);
  console.log(`Rows considered: ${summary.rows_considered}`);
  console.log(`Rows would insert: ${summary.rows_would_insert}`);
  console.log(`Rows would update: ${summary.rows_would_update}`);
  console.log(`Rows unchanged: ${summary.rows_unchanged}`);
  console.log(`Rows written: ${summary.rows_written}`);
  console.log(`Collision groups: ${summary.collision_groups}`);
  console.log(`DB status: ${summary.db_status}`);
  if (summary.db_error) {
    console.log(`DB error: ${summary.db_error}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
