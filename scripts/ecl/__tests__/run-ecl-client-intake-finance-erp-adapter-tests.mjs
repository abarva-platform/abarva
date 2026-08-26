#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-finance-erp-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(49432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_finance_erp_adapter_test";
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
    "scripts/ecl/load_client_intake_finance_erp_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 480);
  assert.equal(adapterSummary.business_function, 12);
  assert.ok(adapterSummary.cost_center >= 150, "finance extract should carry a realistic cost-center spread");
  assert.ok(adapterSummary.vendor >= 90, "finance extract should carry a realistic supplier spread");
  assert.ok(adapterSummary.relationship > 480, "finance extract should map ownership and supplier relationships");
  assert.equal(adapterSummary.metric_definition, 3);
  assert.equal(adapterSummary.measure, 1440);
  assert.equal(adapterSummary.invoice_line, 480);
  assert.deepEqual(adapterSummary.account_categories, [
    "bpo",
    "cloud",
    "hardware",
    "labor",
    "maintenance",
    "services",
    "software",
    "telecom",
  ]);
  assert.deepEqual(adapterSummary.allocation_bases, [
    "allocated",
    "direct",
    "estimated",
    "unknown",
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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP06_Finance_ERP'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'cost_centers', (select count(*) from ecl_context.object where object_type = 'organization'),
        'vendors', (select count(*) from ecl_context.object where object_type = 'vendor'),
        'owned_by', (select count(*) from ecl_context.relationship where relationship_type = 'OWNED_BY'),
        'supplied_by', (select count(*) from ecl_context.relationship where relationship_type = 'SUPPLIED_BY'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'budget_measures', (select count(*) from ecl_context.measure where metric_key = 'budget_usd'),
        'actual_measures', (select count(*) from ecl_context.measure where metric_key = 'actual_usd'),
        'variance_measures', (select count(*) from ecl_context.measure where metric_key = 'spend_variance_usd'),
        'estimated_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'estimated'),
        'invoice_lines', (select count(*) from ecl_commercial.invoice_line),
        'invoice_lines_with_cost_center', (select count(*) from ecl_commercial.invoice_line where cost_center_object_id is not null),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'unknown_allocation_source_records', (
          select count(*)
          from ecl_source.source_record
          where payload_json->>'allocation_basis' = 'unknown'
        ),
        'allocation_refs_preserved', (
          select count(*)
          from ecl_context.measure
          where attributes_json ? 'application_or_platform_ref'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 480, "every SP06 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "function segments must become canonical business_function objects");
  assert.ok(counts.cost_centers >= 150, "cost centers must preserve finance allocation grain");
  assert.ok(counts.vendors >= 90, "vendors must preserve supplier spend grain");
  assert.ok(counts.owned_by >= counts.cost_centers, "cost centers must map to business functions");
  assert.ok(counts.supplied_by > counts.cost_centers, "supplier spend relationships must survive mapping");
  assert.equal(counts.metric_definitions, 3, "finance metrics must be declared once each");
  assert.equal(counts.measures, 1440, "budget, actual, and variance measures must exist for every source row");
  assert.equal(counts.budget_measures, 480);
  assert.equal(counts.actual_measures, 480);
  assert.equal(counts.variance_measures, 480);
  assert.ok(counts.estimated_quality_measures > 0, "estimated/unknown allocations must remain visibly estimated");
  assert.equal(counts.invoice_lines, 480, "every finance row must produce an invoice/GL line");
  assert.equal(counts.invoice_lines_with_cost_center, 480, "invoice lines must retain cost center object linkage");
  assert.ok(counts.partial_source_records > 0, "needs_follow_up rows must remain visible as partial intake");
  assert.ok(counts.in_review_measures > 0, "needs_follow_up rows must map to in_review canonical review state");
  assert.equal(counts.unknown_allocation_source_records, 58, "unknown allocations must remain explicit");
  assert.equal(counts.allocation_refs_preserved, 1440, "raw allocation refs must be preserved in measure attributes");

  const brokenFk = psql(
    `
      update ecl_commercial.invoice_line
      set vendor_object_id = gen_random_uuid()
      where id = (select id from ecl_commercial.invoice_line limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "invoice line vendor FK must reject unresolved suppliers");
  assert.match(brokenFk.stderr, /invoice_line_vendor_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
