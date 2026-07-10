#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const requireFromApp = createRequire(fs.existsSync("/app/package.json") ? "/app/package.json" : new URL("../../package.json", import.meta.url));
const { Client } = requireFromApp("pg");

const TENANT_KEYS = ["skyharbor-air", "skyharbor"];
const TARGET_TENANT = "skyharbor-air";
const TARGET_CONTRACT = "v7.1.0-skyharbor-upgrade-candidate-20260710";
const PAYLOAD_FILE = "datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/azure/v7-tenant-load-payload.json";

function parseArgs(argv) {
  const parsed = { mode: "snapshot", outDir: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = next();
    else if (arg === "--help" || arg === "-h") parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!parsed.outDir) {
    parsed.outDir = path.join(os.tmpdir(), `skyharbor-v7-upgrade-proof-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  }
  return parsed;
}

function usage() {
  return `Usage: node scripts/qa/skyharbor-v7-upgrade-proof-job.mjs --mode snapshot|candidate-load|promote [--out-dir <dir>]`;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function tableExists(client, tableRef) {
  const result = await q(client, "select to_regclass($1) is not null as exists", [tableRef]);
  return Boolean(result.rows[0]?.exists);
}

async function optionalRows(client, tableRef, sql, params = []) {
  if (!(await tableExists(client, tableRef))) return { table: tableRef, exists: false, rows: [] };
  const result = await q(client, sql, params);
  return { table: tableRef, exists: true, rows: result.rows };
}

async function snapshot(client, label) {
  const capturedAt = new Date().toISOString();
  const active = await optionalRows(client, "intelligence_v7.active_tenant_contract_versions", `
    select tenant_key, active_contract_version, candidate_contract_version, rollback_contract_version,
           promotion_status, promoted_by, promoted_at, proof_bundle_uri, promotion_notes, metadata, updated_at
    from intelligence_v7.active_tenant_contract_versions
    where tenant_key = any($1::text[])
    order by tenant_key
  `, [TENANT_KEYS]);
  const contractVersions = await optionalRows(client, "intelligence_v7.contract_versions", `
    select contract_version, contract_name, status, generated_from, loaded_at, updated_at, metadata
    from intelligence_v7.contract_versions
    where contract_version = $1
       or contract_version in (
         select active_contract_version from intelligence_v7.active_tenant_contract_versions where tenant_key = any($2::text[])
         union
         select candidate_contract_version from intelligence_v7.active_tenant_contract_versions where tenant_key = any($2::text[]) and candidate_contract_version is not null
       )
    order by loaded_at desc nulls last, contract_version
  `, [TARGET_CONTRACT, TENANT_KEYS]);
  const runs = await optionalRows(client, "intelligence_v7.tenant_pack_runs", `
    select tenant_key, contract_version, run_key, source_dataset, load_status, file_count, row_count,
           field_count, graph_node_count, relationship_edge_count, chunk_count, loaded_at, superseded_at
    from intelligence_v7.tenant_pack_runs
    where tenant_key = any($1::text[])
    order by loaded_at desc
  `, [TENANT_KEYS]);
  const sourceFiles = await optionalRows(client, "intelligence_v7.source_files", `
    select tenant_key, contract_version, source_file, dimension_key, row_count, checksum_sha256, loaded_at
    from intelligence_v7.source_files
    where tenant_key = any($1::text[])
    order by contract_version, source_file
  `, [TENANT_KEYS]);
  const v7Counts = await optionalRows(client, "intelligence_v7.business_records", `
    select tenant_key, contract_version, dimension_key, count(*)::int as record_count
    from intelligence_v7.business_records
    where tenant_key = any($1::text[])
    group by tenant_key, contract_version, dimension_key
    order by tenant_key, contract_version, dimension_key
  `, [TENANT_KEYS]);
  const currentCounts = await optionalRows(client, "intelligence_v7.current_business_records", `
    select tenant_key, contract_version, dimension_key, count(*)::int as record_count
    from intelligence_v7.current_business_records
    where tenant_key = any($1::text[])
    group by tenant_key, contract_version, dimension_key
    order by tenant_key, contract_version, dimension_key
  `, [TENANT_KEYS]);
  const readiness = await optionalRows(client, "intelligence_v7.module_readiness_scores", `
    select tenant_key, contract_version, module_key, readiness_status, readiness_score,
           unsupported_claim_risk, blockers, proof_refs, updated_at
    from intelligence_v7.module_readiness_scores
    where tenant_key = any($1::text[])
    order by tenant_key, contract_version, module_key
  `, [TENANT_KEYS]);
  const quality = await optionalRows(client, "intelligence_v7.derived_intelligence_quality_reports", `
    select tenant_key, contract_version, derived_ref, module_key, gate_status, confidence,
           evidence_gaps, not_allowed_claims, blocked_reasons, created_at
    from intelligence_v7.derived_intelligence_quality_reports
    where tenant_key = any($1::text[])
    order by tenant_key, contract_version, derived_ref
  `, [TENANT_KEYS]);
  const v6Counts = await optionalRows(client, "intelligence_v6.business_records", `
    select tenant_key, count(*)::int as record_count
    from intelligence_v6.business_records
    where tenant_key = any($1::text[])
    group by tenant_key
    order by tenant_key
  `, [TENANT_KEYS]);
  const promotionEvents = await optionalRows(client, "intelligence_v7.tenant_contract_promotion_events", `
    select tenant_key, from_contract_version, to_contract_version, event_type, promotion_status,
           actor, reason, validation_summary, proof_bundle_uri, created_at
    from intelligence_v7.tenant_contract_promotion_events
    where tenant_key = any($1::text[])
    order by created_at desc
    limit 20
  `, [TENANT_KEYS]);
  return {
    label,
    capturedAt,
    targetTenant: TARGET_TENANT,
    targetContract: TARGET_CONTRACT,
    active,
    contractVersions,
    tenantPackRuns: runs,
    sourceFiles,
    businessRecordDimensionCounts: v7Counts,
    currentBusinessRecordDimensionCounts: currentCounts,
    moduleReadiness: readiness,
    qualityReports: quality,
    v6BusinessRecordCounts: v6Counts,
    promotionEvents,
  };
}

function runLoader(mode, outDir) {
  const loadProofDir = path.join(outDir, "loader");
  fs.mkdirSync(loadProofDir, { recursive: true });
  const result = spawnSync("node", ["scripts/v7/load-tenant-v7-azure.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      V7_LOAD_MODE: mode,
      V7_PAYLOAD_FILE: PAYLOAD_FILE,
      V7_LOAD_PROOF_DIR: loadProofDir,
    },
  });
  const output = {
    command: `V7_LOAD_MODE=${mode} V7_PAYLOAD_FILE=${PAYLOAD_FILE} node scripts/v7/load-tenant-v7-azure.mjs`,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
  writeJson(path.join(outDir, `loader-${mode}.json`), output);
  if (result.status !== 0) {
    throw new Error(`V7 loader failed for mode ${mode}; see loader-${mode}.json`);
  }
  return output;
}

function emitProofBundle(outDir) {
  const tarPath = `${outDir}.tgz`;
  const result = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`tar failed: ${result.stderr || result.stdout}`);
  }
  const encoded = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let i = 0; i < encoded.length; i += 76) console.log(encoded.slice(i, i + 76));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage());
  process.exit(0);
}
if (!["snapshot", "candidate-load", "promote"].includes(args.mode)) {
  throw new Error(`Unsupported mode ${args.mode}. ${usage()}`);
}

fs.mkdirSync(args.outDir, { recursive: true });
const connectionString = process.env.DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL || process.env.AZURE_DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, application_name: "skyharbor-v7-upgrade-proof" });
await client.connect();
try {
  const before = await snapshot(client, "before");
  writeJson(path.join(args.outDir, "snapshot-before.json"), before);

  let loader = null;
  if (args.mode === "candidate-load") {
    loader = runLoader("candidate", args.outDir);
  } else if (args.mode === "promote") {
    loader = runLoader("active", args.outDir);
  }

  const after = args.mode === "snapshot" ? before : await snapshot(client, "after");
  if (args.mode !== "snapshot") writeJson(path.join(args.outDir, "snapshot-after.json"), after);

  const summary = {
    ok: true,
    mode: args.mode,
    generatedAt: new Date().toISOString(),
    targetTenant: TARGET_TENANT,
    targetContract: TARGET_CONTRACT,
    proofDir: args.outDir,
    loaderStatus: loader ? loader.status : null,
    activeBefore: before.active.rows,
    activeAfter: after.active.rows,
    beforeHash: sha256(JSON.stringify(before)),
    afterHash: sha256(JSON.stringify(after)),
  };
  writeJson(path.join(args.outDir, "summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  emitProofBundle(args.outDir);
} catch (error) {
  const failure = {
    ok: false,
    mode: args.mode,
    error: error instanceof Error ? error.message : String(error),
    stack: error?.stack,
  };
  writeJson(path.join(args.outDir, "failure.json"), failure);
  console.error(JSON.stringify(failure, null, 2));
  emitProofBundle(args.outDir);
  process.exitCode = 1;
} finally {
  await client.end();
}
