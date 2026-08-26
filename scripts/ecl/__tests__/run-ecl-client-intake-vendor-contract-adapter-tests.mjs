#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-vendor-contract-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(48432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_vendor_contract_adapter_test";
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
    "scripts/ecl/load_client_intake_vendor_contract_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 230);
  assert.equal(adapterSummary.contract, 230);
  assert.equal(adapterSummary.contract_service_line, 230);
  assert.equal(adapterSummary.unresolved_scope_refs_preserved, 690);

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
      with supplier_contracts as (
        select vendor_object_id, count(*) as contract_count
        from ecl_commercial.contract
        group by vendor_object_id
      )
      select jsonb_build_object(
        'client_source_files', (select count(*) from ecl_source.source_file where origin = 'client_intake'),
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP08_Vendor_Contract'),
        'vendors', (select count(*) from ecl_context.object where object_type = 'vendor'),
        'contract_objects', (select count(*) from ecl_context.object where object_type = 'contract'),
        'supplied_by', (select count(*) from ecl_context.relationship where relationship_type = 'SUPPLIED_BY'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition where metric_key = 'contract_annualized_value_usd'),
        'measures', (select count(*) from ecl_context.measure where metric_key = 'contract_annualized_value_usd'),
        'contracts', (select count(*) from ecl_commercial.contract),
        'contract_service_lines', (select count(*) from ecl_commercial.contract_service_line),
        'contract_scope_rows', (select count(*) from ecl_commercial.contract_scope),
        'top_supplier_contracts', (select max(contract_count) from supplier_contracts),
        'supplier_count', (select count(*) from supplier_contracts),
        'contract_dates_without_valid_end', (
          select count(*)
          from ecl_commercial.contract
          where end_date is null
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 230, "every SP08 row must land as a source_record");
  assert.equal(counts.vendors, adapterSummary.vendor, "vendor objects must match adapter summary");
  assert.equal(counts.contract_objects, 230, "every contract must have a canonical contract object");
  assert.equal(counts.supplied_by, 230, "every contract object must have one SUPPLIED_BY vendor edge");
  assert.equal(counts.metric_definitions, 1, "contract value metric must be declared once");
  assert.equal(counts.measures, 230, "every contract must have an annualized value measure");
  assert.equal(counts.contracts, 230, "commercial contract table must load the SP08 population");
  assert.equal(counts.contract_service_lines, 230, "each contract row maps to a service line");
  assert.equal(counts.contract_scope_rows, 0, "scope refs remain unresolved until application objects are supplied");
  assert.ok(counts.supplier_count >= 100, "supplier diversity must remain dense");
  assert.ok(counts.top_supplier_contracts >= 5, "concentrated suppliers must remain visible");
  assert.equal(
    counts.contract_dates_without_valid_end,
    adapterSummary.invalid_date_values_preserved_in_attributes,
    "invalid dates must be omitted from date columns and preserved in attributes",
  );

  const brokenFk = psql(
    `
      update ecl_commercial.contract
      set vendor_object_id = gen_random_uuid()
      where contract_number = 'CTR-0001';
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "commercial contract vendor FK must reject unresolved vendors");
  assert.match(brokenFk.stderr, /contract_vendor_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
