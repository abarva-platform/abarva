#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-documents-interviews-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(55432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_documents_interviews_adapter_test";
const sourceRoomDir = path.join(tmpRoot, "source-room");
const outDir = path.join(tmpRoot, "adapter-output");
const postgresLog = path.join(tmpRoot, "postgres.log");
const env = {
  ...process.env,
  LC_ALL: "C",
  LANG: "C",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (options.allowFailure) return result;
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result;
}

function startPostgres() {
  const result = run(
    "pg_ctl",
    ["-D", dataDir, "-l", postgresLog, "-o", `-p ${port} -k ${socketDir}`, "-w", "-t", "30", "start"],
    { allowFailure: true },
  );
  if (result.status !== 0) {
    const logText = fs.existsSync(postgresLog) ? fs.readFileSync(postgresLog, "utf8") : "(postgres log not written)";
    assert.equal(
      result.status,
      0,
      `pg_ctl start failed on port ${port}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\nPOSTGRES LOG:\n${logText}`,
    );
  }
}

function psql(sql, options = {}) {
  return run(
    "psql",
    ["-h", socketDir, "-p", port, "-d", dbName, "-v", "ON_ERROR_STOP=1", "-A", "-t", "-c", sql],
    options,
  );
}

let started = false;
try {
  run("python3", ["scripts/ecl/generate_dense_source_room_extracts.py", "--out-dir", sourceRoomDir]);
  run("python3", ["scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", sourceRoomDir]);

  run("initdb", ["-D", dataDir, "--encoding=UTF8", "--locale=C.UTF-8"]);
  startPostgres();
  started = true;
  run("createdb", ["-h", socketDir, "-p", port, dbName]);
  run("psql", [
    "-h",
    socketDir,
    "-p",
    port,
    "-d",
    dbName,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    path.join(repo, "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"),
  ]);

  const adapter = run("python3", [
    "scripts/ecl/load_client_intake_documents_interviews_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 220);
  assert.equal(adapterSummary.document, 220);
  assert.equal(adapterSummary.document_extraction, 220);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.interview_role, 10);
  assert.equal(adapterSummary.interview_theme, 8);
  assert.equal(adapterSummary.object, 30);
  assert.equal(adapterSummary.relationship, 165);
  assert.equal(adapterSummary.metric_definition, 4);
  assert.equal(adapterSummary.measure, 48);
  assert.equal(adapterSummary.partial_source_record, 41);
  assert.equal(adapterSummary.known_gap_rows, 11);
  assert.equal(adapterSummary.owner_estimated_rows, 19);
  assert.equal(adapterSummary.needs_follow_up_rows, 31);
  assert.equal(adapterSummary.distinct_extraction_spans, 220);

  run("psql", [
    "-h",
    socketDir,
    "-p",
    port,
    "-d",
    dbName,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    adapterSummary.load_sql,
  ]);

  const counts = JSON.parse(
    psql(`
      select jsonb_build_object(
        'client_source_files', (select count(*) from ecl_source.source_file where origin = 'client_intake'),
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP01_Documents_Interviews'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'known_gap_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'known_gap_requires_review'
        ),
        'documents', (select count(*) from ecl_source.document),
        'interview_documents', (select count(*) from ecl_source.document where document_type = 'interview_notes'),
        'document_extractions', (select count(*) from ecl_source.document_extraction),
        'distinct_extraction_spans', (select count(distinct span_reference) from ecl_source.document_extraction),
        'unverified_extractions', (
          select count(*)
          from ecl_source.document_extraction
          where human_verification_state = 'unverified'
        ),
        'objects', (select count(*) from ecl_context.object),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'personas', (select count(*) from ecl_context.object where object_type = 'persona'),
        'themes', (
          select count(*)
          from ecl_context.object
          where object_type = 'process'
            and attributes_json->>'context_grain' = 'interview_theme'
        ),
        'relationships', (select count(*) from ecl_context.relationship),
        'role_function_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'USED_BY'
            and attributes_json->>'relationship_basis' = 'interview_role_function'
        ),
        'theme_function_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'SUPPORTED_BY'
            and attributes_json->>'relationship_basis' = 'interview_theme_function'
        ),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'excerpt_count_sum', (
          select coalesce(sum(value_number), 0)
          from ecl_context.measure
          where metric_key = 'interview_excerpt_count'
        ),
        'high_priority_sum', (
          select coalesce(sum(value_number), 0)
          from ecl_context.measure
          where metric_key = 'interview_high_priority_signal_count'
        ),
        'follow_up_sum', (
          select coalesce(sum(value_number), 0)
          from ecl_context.measure
          where metric_key = 'interview_follow_up_count'
        ),
        'known_gap_sum', (
          select coalesce(sum(value_number), 0)
          from ecl_context.measure
          where metric_key = 'interview_known_gap_count'
        ),
        'function_measure_subjects', (
          select count(distinct subject_object_id)
          from ecl_context.measure
        ),
        'raw_transcript_records', (
          select count(*)
          from ecl_source.source_record
          where payload_json ? 'full_transcript_text'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 220, "every SP01 row must land as a source_record");
  assert.equal(counts.partial_source_records, 41, "known gaps and follow-up rows must remain partial");
  assert.equal(counts.known_gap_records, 11);
  assert.equal(counts.documents, 220);
  assert.equal(counts.interview_documents, 220);
  assert.equal(counts.document_extractions, 220);
  assert.equal(counts.distinct_extraction_spans, 220, "interview extraction spans must not be stamped constants");
  assert.equal(counts.unverified_extractions, 220, "synthetic interview excerpts must not imply client attestation");
  assert.equal(counts.objects, 30);
  assert.equal(counts.business_functions, 12);
  assert.equal(counts.personas, 10);
  assert.equal(counts.themes, 8);
  assert.equal(counts.relationships, 165);
  assert.equal(counts.role_function_links, 89);
  assert.equal(counts.theme_function_links, 76);
  assert.equal(counts.metric_definitions, 4);
  assert.equal(counts.measures, 48);
  assert.equal(Number(counts.excerpt_count_sum), 220);
  assert.equal(Number(counts.high_priority_sum), 73);
  assert.equal(Number(counts.follow_up_sum), 31);
  assert.equal(Number(counts.known_gap_sum), 11);
  assert.equal(counts.function_measure_subjects, 12);
  assert.equal(counts.raw_transcript_records, 0, "SP01 must not pretend to hold raw transcript bodies");

  const brokenFk = psql(
    `
      update ecl_source.document_extraction
      set document_id = gen_random_uuid()
      where id = (select id from ecl_source.document_extraction limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "broken document_extraction.document_id should be rejected by FK");
  assert.match(brokenFk.stderr, /violates foreign key constraint "document_extraction_document_fk"/);

  console.log(
    JSON.stringify(
      {
        accepted: true,
        adapterSummary,
        counts,
      },
      null,
      2,
    ),
  );
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "-m", "fast", "-w", "stop"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
