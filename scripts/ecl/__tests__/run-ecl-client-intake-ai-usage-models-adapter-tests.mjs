#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-ai-usage-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(53432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_ai_usage_adapter_test";
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
    "scripts/ecl/load_client_intake_ai_usage_models_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 360);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.ai_tool, 26);
  assert.equal(adapterSummary.ai_use_case, 30);
  assert.equal(adapterSummary.persona, 6);
  assert.equal(adapterSummary.vendor_reference, 3);
  assert.equal(adapterSummary.placeholder_vendor_rows, 264);
  assert.equal(adapterSummary.relationship, 631);
  assert.equal(adapterSummary.metric_definition, 4);
  assert.equal(adapterSummary.measure, 1440);
  assert.equal(adapterSummary.periods.length, 12);
  assert.deepEqual(adapterSummary.use_case_categories, [
    "analytics",
    "clinical_documentation",
    "coding",
    "knowledge_search",
    "service_desk",
    "summarization",
  ]);

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP11_AI_Usage_Models'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'ai_tools', (select count(*) from ecl_context.object where object_type = 'ai_tool'),
        'ai_use_cases', (select count(*) from ecl_context.object where object_type = 'ai_use_case'),
        'personas', (select count(*) from ecl_context.object where object_type = 'persona'),
        'vendors', (select count(*) from ecl_context.object where object_type = 'vendor'),
        'unknown_vendor_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'vendor'
            and value_state = 'unknown'
            and attributes_json->>'placeholder_vendor' = 'true'
        ),
        'function_use_case_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'SUPPORTED_BY'
            and attributes_json->>'relationship_basis' = 'function_ai_use_case'
        ),
        'use_case_tool_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'SUPPORTED_BY'
            and attributes_json->>'relationship_basis' = 'use_case_ai_tool'
        ),
        'use_case_persona_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'USED_BY'
            and attributes_json->>'relationship_basis' = 'use_case_persona'
        ),
        'tool_vendor_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'SUPPLIED_BY'
            and attributes_json->>'relationship_basis' = 'tool_vendor'
        ),
        'unknown_tool_vendor_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'SUPPLIED_BY'
            and value_state = 'unknown'
        ),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'licensed_user_measures', (select count(*) from ecl_context.measure where metric_key = 'ai_licensed_users'),
        'active_user_measures', (select count(*) from ecl_context.measure where metric_key = 'ai_active_users'),
        'usage_event_measures', (select count(*) from ecl_context.measure where metric_key = 'ai_usage_events'),
        'monthly_cost_measures', (select count(*) from ecl_context.measure where metric_key = 'ai_monthly_cost_usd'),
        'monthly_measures', (select count(*) from ecl_context.measure where period_start is not null and period_end is not null),
        'estimated_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'estimated'),
        'insufficient_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'insufficient'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'known_gap_measures', (select count(*) from ecl_context.measure where basis = 'unknown' and value_state = 'unknown'),
        'placeholder_vendor_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'placeholder_vendor_requires_review'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 360, "every SP11 row must land as a source_record");
  assert.equal(counts.business_functions, 12);
  assert.equal(counts.ai_tools, 26);
  assert.equal(counts.ai_use_cases, 30);
  assert.equal(counts.personas, 6);
  assert.equal(counts.vendors, 3);
  assert.equal(counts.unknown_vendor_refs, 1, "placeholder vendor must remain unknown, not become a supplier");
  assert.equal(counts.function_use_case_links, 215);
  assert.equal(counts.use_case_tool_links, 360);
  assert.equal(counts.use_case_persona_links, 30);
  assert.equal(counts.tool_vendor_links, 26);
  assert.equal(counts.unknown_tool_vendor_links, 19, "tools with placeholder vendor mapping must be visibly unresolved");
  assert.equal(counts.metric_definitions, 4);
  assert.equal(counts.measures, 1440);
  assert.equal(counts.licensed_user_measures, 360);
  assert.equal(counts.active_user_measures, 360);
  assert.equal(counts.usage_event_measures, 360);
  assert.equal(counts.monthly_cost_measures, 360);
  assert.equal(counts.monthly_measures, 1440);
  assert.equal(counts.estimated_quality_measures, 1032);
  assert.equal(counts.insufficient_quality_measures, 72);
  assert.equal(counts.partial_source_records, 282, "known-gap, follow-up, and placeholder-vendor rows must remain partial");
  assert.equal(counts.in_review_measures, 1108, "placeholder vendor and follow-up rows must remain in review");
  assert.equal(counts.known_gap_measures, 72, "known-gap rows must remain unknown, not zero");
  assert.equal(counts.placeholder_vendor_records, 264);

  const brokenFk = psql(
    `
      update ecl_context.relationship
      set to_object_id = gen_random_uuid()
      where relationship_type = 'SUPPORTED_BY'
      and id = (select id from ecl_context.relationship where relationship_type = 'SUPPORTED_BY' limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "AI usage relationship FK must reject unresolved object refs");
  assert.match(brokenFk.stderr, /relationship_to_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
