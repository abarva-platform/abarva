#!/usr/bin/env npx tsx
/**
 * Read-only proof for the Home ECL narrative writer seam.
 *
 * This script runs inside the governed ACA operator job after the writer apply. It does not
 * regenerate prose and does not mutate data. It verifies that the Home projection has the model
 * generated chapter summaries and linked chapter-claim rows written by the ECL narrative job.
 */

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "assessment-dense-source-room-20260823";
const DEFAULT_OUT_DIR = "/tmp/home-ecl-narrative-readback";
const PROJECTION_VERSION = 1;

const CHAPTER_IDS = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
] as const;

interface CliOptions {
  tenantKey: string;
  assessmentId: string;
  outDir: string;
}

interface ReadbackRows {
  total_rows: string;
  writer_summary_rows: string;
  writer_summary_pages: string;
  chapter_claim_rows: string;
  chapter_claim_pages: string;
  chapter_claim_entry_drift: string;
  writer_basis_drift: string;
  refusal_payload_drift: string;
  projection_entry_claim_rows: string;
  legacy_basis_rows: string;
}

function cliValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function parseCli(): CliOptions {
  return {
    tenantKey: cliValue("--tenant") ?? process.env.ECL_DENSE_TENANT_KEY ?? DEFAULT_TENANT_KEY,
    assessmentId: cliValue("--assessment") ?? process.env.ECL_DENSE_ASSESSMENT_ID ?? DEFAULT_ASSESSMENT_ID,
    outDir: cliValue("--out-dir") ?? DEFAULT_OUT_DIR,
  };
}

function toInt(value: string): number {
  return Number.parseInt(value, 10);
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function issuesFor(readback: Record<keyof ReadbackRows, number>): string[] {
  const issues: string[] = [];
  if (readback.total_rows <= 0) issues.push("home_projection_rows_missing");
  if (readback.writer_summary_rows !== CHAPTER_IDS.length) {
    issues.push(`writer_summary_rows_expected_${CHAPTER_IDS.length}_actual_${readback.writer_summary_rows}`);
  }
  if (readback.writer_summary_pages !== CHAPTER_IDS.length) {
    issues.push(`writer_summary_pages_expected_${CHAPTER_IDS.length}_actual_${readback.writer_summary_pages}`);
  }
  if (readback.chapter_claim_rows <= 0) issues.push("chapter_claim_rows_missing");
  if (readback.chapter_claim_pages !== CHAPTER_IDS.length) {
    issues.push(`chapter_claim_pages_expected_${CHAPTER_IDS.length}_actual_${readback.chapter_claim_pages}`);
  }
  if (readback.chapter_claim_entry_drift !== 0) {
    issues.push(`chapter_claim_entry_drift_${readback.chapter_claim_entry_drift}`);
  }
  if (readback.writer_basis_drift !== 0) issues.push(`writer_basis_drift_${readback.writer_basis_drift}`);
  if (readback.refusal_payload_drift !== 0) issues.push(`refusal_payload_drift_${readback.refusal_payload_drift}`);
  if (readback.projection_entry_claim_rows !== readback.chapter_claim_rows) {
    issues.push(`projection_entry_claim_rows_${readback.projection_entry_claim_rows}_home_claim_rows_${readback.chapter_claim_rows}`);
  }
  if (readback.legacy_basis_rows !== 0) issues.push(`legacy_basis_rows_${readback.legacy_basis_rows}`);
  return issues;
}

async function main() {
  const options = parseCli();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for Home ECL narrative readback.");

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const result = await db.query<ReadbackRows>(
      `
        with home_rows as (
          select *
          from ecl_projection.home_enterprise_landscape
          where tenant_key = $1
            and assessment_id = $2
            and projection_version = $3
        ),
        chapter_ids as (
          select unnest($4::text[]) as page_key
        )
        select
          (select count(*) from home_rows)::text as total_rows,
          (
            select count(*)
            from home_rows h
            join chapter_ids c on c.page_key = h.page_key
            where h.row_type = 'summary'
              and h.basis_summary = 'model_generated_from_ecl_projection'
              and h.display_payload_json ? 'writer'
              and h.display_payload_json->'writer'->>'source' = 'ecl_projection.home_enterprise_landscape'
          )::text as writer_summary_rows,
          (
            select count(distinct h.page_key)
            from home_rows h
            join chapter_ids c on c.page_key = h.page_key
            where h.row_type = 'summary'
              and h.basis_summary = 'model_generated_from_ecl_projection'
              and h.display_payload_json ? 'writer'
          )::text as writer_summary_pages,
          (
            select count(*)
            from home_rows h
            join chapter_ids c on c.page_key = h.page_key
            where h.row_type = 'chapter_claim'
              and h.basis_summary = 'model_generated_from_ecl_projection'
              and h.display_payload_json ? 'writer'
              and h.display_payload_json->'writer'->>'source' = 'ecl_projection.home_enterprise_landscape'
          )::text as chapter_claim_rows,
          (
            select count(distinct h.page_key)
            from home_rows h
            join chapter_ids c on c.page_key = h.page_key
            where h.row_type = 'chapter_claim'
              and h.basis_summary = 'model_generated_from_ecl_projection'
              and h.display_payload_json ? 'writer'
          )::text as chapter_claim_pages,
          (
            select count(*)
            from home_rows h
            left join ecl_projection.projection_entry e
              on e.tenant_key = h.tenant_key
             and e.assessment_id = h.assessment_id
             and e.id = h.projection_entry_id
             and e.row_type = 'chapter_claim'
            where h.row_type = 'chapter_claim'
              and e.id is null
          )::text as chapter_claim_entry_drift,
          (
            select count(*)
            from home_rows h
            where (
                h.row_type = 'chapter_claim'
                or (h.row_type = 'summary' and h.page_key in (select page_key from chapter_ids))
              )
              and h.basis_summary <> 'model_generated_from_ecl_projection'
          )::text as writer_basis_drift,
          (
            select count(*)
            from home_rows h
            where (
                h.admission_status = 'refused'
                and (h.admission_gate_key is null or h.admission_result_json = '{}'::jsonb)
              )
              or (
                h.admission_status in ('admitted', 'not_applicable')
                and (h.admission_gate_key is not null or h.admission_result_json <> '{}'::jsonb)
              )
          )::text as refusal_payload_drift,
          (
            select count(*)
            from ecl_projection.projection_entry e
            where e.tenant_key = $1
              and e.assessment_id = $2
              and e.projection_version = $3
              and e.surface_key = 'home_enterprise_landscape'
              and e.row_type = 'chapter_claim'
          )::text as projection_entry_claim_rows,
          (
            select count(*)
            from home_rows h
            where h.row_type in ('summary', 'chapter_claim')
              and h.basis_summary like '%home_knowledge_pack%'
          )::text as legacy_basis_rows
      `,
      [options.tenantKey, options.assessmentId, PROJECTION_VERSION, CHAPTER_IDS],
    );

    const readback = Object.fromEntries(
      Object.entries(result.rows[0]).map(([key, value]) => [key, toInt(value)]),
    ) as Record<keyof ReadbackRows, number>;
    const issues = issuesFor(readback);
    const summary = {
      structured_event: "home_ecl_narrative_readback_summary",
      accepted: issues.length === 0,
      issues,
      tenant_key: options.tenantKey,
      assessment_id: options.assessmentId,
      projection_version: PROJECTION_VERSION,
      expected_chapter_count: CHAPTER_IDS.length,
      readback,
      data_mutation: false,
      proof_boundary: "Read-only VNet readback of Home ECL model-generated summary and chapter-claim rows.",
    };
    const outFile = path.join(options.outDir, "home_ecl_narrative_readback_summary.json");
    writeJson(outFile, summary);
    console.log(JSON.stringify(summary, null, 2));
    if (issues.length) process.exitCode = 2;
  } finally {
    await db.end();
  }
}

if (process.argv[1] && process.argv[1].includes("readback_home_ecl_narrative_layer")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
