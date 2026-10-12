#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MIGRATION = "20261011173000_tower_value_chain_unknown_amounts.sql";
const MARKER = "__TOWER_UNKNOWN_AMOUNT_SCHEMA_PROOF_TGZ_";

export function plan(mode) {
  if (!["dry-run", "apply", "reconcile"].includes(mode)) throw new Error("--mode must be dry-run, apply, or reconcile");
  const migrationArgs = ["--import", "tsx", "src/scripts/run-migrations.ts"];
  return {
    migration: MIGRATION,
    steps: mode === "reconcile" ? [
      ["current-readback", "node", ["scripts/tower/probe-unknown-amount-schema.mjs", "--out", "current.json"]],
      ["migration-ledger", "postgres-read-only", [MIGRATION]],
    ] : [
      ["baseline", "node", ["scripts/tower/probe-unknown-amount-schema.mjs", "--out", "baseline.json"]],
      ["ledger-precheck", "postgres-read-only", [MIGRATION]],
      ["targeted-dry", "node", [...migrationArgs, "--dry", "--force", MIGRATION]],
      ...(mode === "apply" ? [
        ["targeted-apply", "node", [...migrationArgs, "--ci", "--force", MIGRATION]],
        ["compared-readback", "node", ["scripts/tower/probe-unknown-amount-schema.mjs", "--out", "readback.json", "--compare", "baseline.json"]],
        ["migration-ledger", "postgres-read-only", [MIGRATION]],
      ] : []),
    ],
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function assertDatabaseIdentity(env) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required in the private ACA job");
  for (const name of ["ABARVA_AZURE_DATABASE_URL", "AZURE_DATABASE_URL"]) {
    if (env[name] && env[name] !== env.DATABASE_URL) {
      throw new Error(`Configured ${name} differs from DATABASE_URL; refusing split-database schema proof`);
    }
  }
}

export function migrationChildEnv(env) {
  assertDatabaseIdentity(env);
  return { ...env, ABARVA_AZURE_DATABASE_URL: env.DATABASE_URL, AZURE_DATABASE_URL: env.DATABASE_URL };
}

function runStep(label, args, workDir) {
  const resolvedArgs = args.map((arg) =>
    ["baseline.json", "readback.json", "current.json"].includes(arg) ? path.join(workDir, arg) : arg);
  const result = spawnSync(process.execPath, resolvedArgs, {
    cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 10 * 60 * 1000,
    env: migrationChildEnv(process.env),
  });
  fs.writeFileSync(path.join(workDir, `${label}.stdout.log`), result.stdout || "");
  fs.writeFileSync(path.join(workDir, `${label}.stderr.log`), result.stderr || "");
  console.log(JSON.stringify({ event: "tower_schema_step", step: label, exit_code: result.status }));
  if (result.error || result.status !== 0) {
    const detail = (result.stderr || result.stdout || result.error?.message || "").trim();
    throw new Error(`${label} failed: ${detail.slice(-1200)}`);
  }
}

async function verifyLedger(workDir, expectedSha256) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin read only");
    const { rows } = await client.query("select name, sha256 from schema_migrations where name = $1", [MIGRATION]);
    await client.query("commit");
    if (rows.length !== 1 || rows[0].sha256 !== expectedSha256) {
      throw new Error("Focused migration ledger name/hash does not match the image SQL");
    }
    fs.writeFileSync(path.join(workDir, "migration-ledger.json"), `${JSON.stringify(rows[0], null, 2)}\n`);
  } finally {
    await client.end();
  }
}

async function ledgerPrecheck(workDir, mode) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin read only");
    const table = await client.query("select to_regclass('schema_migrations')::text as relation");
    if (!table.rows[0]?.relation) throw new Error("schema_migrations is absent; targeted dry would create it");
    const { rows } = await client.query("select name, sha256 from schema_migrations where name = $1", [MIGRATION]);
    await client.query("commit");
    fs.writeFileSync(path.join(workDir, "ledger-precheck.json"),
      `${JSON.stringify({ ledger_relation: table.rows[0].relation, focused_migration: rows[0] || null }, null, 2)}\n`);
    if (mode === "apply" && rows.length) {
      throw new Error("Focused migration is already recorded; refusing forced reapply");
    }
  } finally {
    await client.end();
  }
}

function emitProof(workDir) {
  const archive = path.join(os.tmpdir(), `tower-schema-proof-${process.pid}.tgz`);
  const result = spawnSync("tar", ["-czf", archive, "-C", workDir, "."], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not archive Tower schema proof: ${result.stderr}`);
  console.log(`${MARKER}BEGIN__`);
  console.log(fs.readFileSync(archive).toString("base64"));
  console.log(`${MARKER}END__`);
  fs.rmSync(archive, { force: true });
}

async function main() {
  const modeIndex = process.argv.indexOf("--mode");
  const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : null;
  const intended = plan(mode);
  if (process.argv.includes("--plan-only")) {
    console.log(JSON.stringify({ ...intended, mode, writes_database: mode === "apply" }, null, 2));
    return;
  }
  assertDatabaseIdentity(process.env);
  if (mode === "apply" && process.env.TOWER_UNKNOWN_AMOUNTS_APPLY_CONFIRM !== "APPLY") {
    throw new Error("TOWER_UNKNOWN_AMOUNTS_APPLY_CONFIRM=APPLY is required for schema apply");
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-unknown-amount-schema-"));
  const migrationSha256 = sha256(fs.readFileSync(path.join(ROOT, "supabase/migrations", MIGRATION)));
  const receipt = {
    contract_version: "tower-unknown-amount-schema-job/v1", mode, migration_name: MIGRATION,
    migration_sha256: migrationSha256,
    operator_image_digest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST || null,
    branch_commit: process.env.ABARVA_OPERATOR_BRANCH_COMMIT || null,
    status: "failed", comparison_status: null, baseline_sha256: null, readback_sha256: null,
    current_sha256: null,
  };
  try {
    if (mode === "reconcile") {
      runStep("current-readback", intended.steps[0][2], workDir);
      const currentBytes = fs.readFileSync(path.join(workDir, "current.json"));
      const current = JSON.parse(currentBytes.toString("utf8"));
      if (current.columns?.length !== 3 || current.columns.some((row) =>
        row.is_nullable !== "YES" || row.column_default !== null) ||
        current.unknown_amount_constraint?.length !== 1) {
        throw new Error("Current unknown-amount schema does not satisfy the migration contract");
      }
      await verifyLedger(workDir, migrationSha256);
      receipt.current_sha256 = sha256(currentBytes);
      receipt.comparison_status = "original_baseline_required";
      receipt.status = "manual_review_required";
      return;
    }
    runStep("baseline", intended.steps[0][2], workDir);
    const baselineBytes = fs.readFileSync(path.join(workDir, "baseline.json"));
    const baseline = JSON.parse(baselineBytes.toString("utf8"));
    receipt.baseline_sha256 = sha256(baselineBytes);
    if (mode === "apply" && baseline.unknown_amount_constraint?.length) {
      throw new Error("Unknown-amount constraint already exists; refusing to force reapply");
    }
    await ledgerPrecheck(workDir, mode);
    runStep("targeted-dry", intended.steps.find(([label]) => label === "targeted-dry")[2], workDir);
    if (mode === "apply") {
      runStep("targeted-apply", intended.steps.find(([label]) => label === "targeted-apply")[2], workDir);
      runStep("compared-readback", intended.steps.find(([label]) => label === "compared-readback")[2], workDir);
      const readbackBytes = fs.readFileSync(path.join(workDir, "readback.json"));
      const readback = JSON.parse(readbackBytes.toString("utf8"));
      if (readback.comparison_status !== "pass") throw new Error("Schema readback comparison did not pass");
      receipt.readback_sha256 = sha256(readbackBytes);
      receipt.comparison_status = "pass";
      await verifyLedger(workDir, migrationSha256);
    } else {
      receipt.comparison_status = "baseline_only";
    }
    receipt.status = "pass";
  } catch (error) {
    receipt.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(workDir, "schema-job-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
    emitProof(workDir);
    console.log(JSON.stringify({ event: "tower_unknown_amount_schema_job", mode, status: receipt.status,
      migration_sha256: migrationSha256, comparison_status: receipt.comparison_status }));
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
