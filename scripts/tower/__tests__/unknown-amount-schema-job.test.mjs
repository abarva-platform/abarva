import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { assertDatabaseIdentity, migrationChildEnv, plan } from "../run-unknown-amount-schema-job.mjs";
import { extractProofBundle, migrationNamesFromScript, operatorSummaryOk, verifyTowerSchemaProof, writeMigrationSeal } from
  "../../ops/submit-aca-operator-job.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MIGRATION = "20261011173000_tower_value_chain_unknown_amounts.sql";

test("schema job targets only the reviewed migration and compares within one execution", () => {
  const dry = plan("dry-run");
  const apply = plan("apply");
  const reconcile = plan("reconcile");
  assert.deepEqual(dry.steps.map(([label]) => label), ["baseline", "ledger-precheck", "targeted-dry"]);
  assert.deepEqual(apply.steps.map(([label]) => label),
    ["baseline", "ledger-precheck", "targeted-dry", "targeted-apply", "compared-readback", "migration-ledger"]);
  assert.deepEqual(apply.steps.find(([label]) => label === "targeted-apply")[2].slice(-2), ["--force", MIGRATION]);
  assert.deepEqual(apply.steps.find(([label]) => label === "compared-readback")[2].slice(-2),
    ["--compare", "baseline.json"]);
  assert.equal(apply.steps.some(([, , args]) => args.includes("db:migrate:ci")), false);
  assert.deepEqual(reconcile.steps.map(([label]) => label), ["current-readback", "migration-ledger"]);
  assert.deepEqual(migrationNamesFromScript("tower:migrate:unknown-amounts:apply-job",
    "node scripts/tower/run-unknown-amount-schema-job.mjs --mode apply"), [MIGRATION]);
  assert.deepEqual(migrationNamesFromScript("tower:migrate:unknown-amounts:reconcile-job",
    "node scripts/tower/run-unknown-amount-schema-job.mjs --mode reconcile"), [MIGRATION]);
});

test("read-only reconciliation proof requires later manual comparison with original baseline", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-schema-reconcile-test-"));
  try {
    const payload = path.join(dir, "payload");
    const output = path.join(dir, "output");
    fs.mkdirSync(payload);
    fs.mkdirSync(output);
    const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
    const current = JSON.stringify({ columns: [1, 2, 3].map(() => ({ is_nullable: "YES", column_default: null })),
      unknown_amount_constraint: [{}], unchanged_numeric_basis: { value_chain: { rows: 2, numeric_hash: "same" } } });
    const sql = fs.readFileSync(path.join(ROOT, "supabase/migrations", MIGRATION));
    const receipt = { contract_version: "tower-unknown-amount-schema-job/v1", mode: "reconcile",
      status: "manual_review_required", comparison_status: "original_baseline_required",
      migration_name: MIGRATION, migration_sha256: hash(sql), current_sha256: hash(current) };
    fs.writeFileSync(path.join(payload, "current.json"), current);
    fs.writeFileSync(path.join(payload, "migration-ledger.json"),
      JSON.stringify({ name: MIGRATION, sha256: hash(sql) }));
    fs.writeFileSync(path.join(payload, "schema-job-receipt.json"), JSON.stringify(receipt));
    const archive = path.join(dir, "proof.tgz");
    assert.equal(spawnSync("tar", ["-czf", archive, "-C", payload, "."]).status, 0);
    const proof = extractProofBundle(["__TOWER_UNKNOWN_AMOUNT_SCHEMA_PROOF_TGZ_BEGIN__",
      fs.readFileSync(archive).toString("base64"),
      "__TOWER_UNKNOWN_AMOUNT_SCHEMA_PROOF_TGZ_END__"].join("\n"), output);
    assert.deepEqual(verifyTowerSchemaProof("tower:migrate:unknown-amounts:reconcile-job", proof, output),
      { fullProofVerified: false, manualReviewRequired: true });
    assert.equal(operatorSummaryOk({ failed: null, wait: true, status: "Succeeded", manualReviewRequired: true }), false);
    receipt.status = "pass";
    fs.writeFileSync(path.join(output, "proof/schema-job-receipt.json"), JSON.stringify(receipt));
    assert.throws(() => verifyTowerSchemaProof("tower:migrate:unknown-amounts:reconcile-job", proof, output),
      /incomplete/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("split database configuration and absent apply confirmation fail before database access", () => {
  assert.throws(() => assertDatabaseIdentity({ DATABASE_URL: "db-a", AZURE_DATABASE_URL: "db-b" }),
    /split-database schema proof/);
  assert.throws(() => assertDatabaseIdentity({ DATABASE_URL: "db-a", ABARVA_AZURE_DATABASE_URL: "db-b" }),
    /split-database schema proof/);
  assert.doesNotThrow(() => assertDatabaseIdentity({ DATABASE_URL: "db-a", AZURE_DATABASE_URL: "db-a" }));
  assert.deepEqual([migrationChildEnv({ DATABASE_URL: "db-a" }).ABARVA_AZURE_DATABASE_URL,
    migrationChildEnv({ DATABASE_URL: "db-a" }).AZURE_DATABASE_URL], ["db-a", "db-a"]);
  const result = spawnSync(process.execPath,
    [path.join(ROOT, "scripts/tower/run-unknown-amount-schema-job.mjs"), "--mode", "apply"],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://no-connect",
      ABARVA_AZURE_DATABASE_URL: "", AZURE_DATABASE_URL: "", TOWER_UNKNOWN_AMOUNTS_APPLY_CONFIRM: "" } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TOWER_UNKNOWN_AMOUNTS_APPLY_CONFIRM=APPLY is required/);
});

test("ACA wrapper extracts and validates the durable schema receipt", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-schema-proof-test-"));
  try {
    const payload = path.join(dir, "payload");
    const output = path.join(dir, "output");
    fs.mkdirSync(payload);
    fs.mkdirSync(output);
    const sql = fs.readFileSync(path.join(ROOT, "supabase/migrations", MIGRATION));
    const baseline = JSON.stringify({ unchanged_numeric_basis: { value_chain: { rows: 2, numeric_hash: "same" } } });
    const readback = JSON.stringify({ comparison_status: "pass",
      unchanged_numeric_basis: { value_chain: { rows: 2, numeric_hash: "same" } } });
    const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
    fs.writeFileSync(path.join(payload, "baseline.json"), baseline);
    fs.writeFileSync(path.join(payload, "readback.json"), readback);
    fs.writeFileSync(path.join(payload, "targeted-dry.stdout.log"), "Focused dry run passed\n");
    fs.writeFileSync(path.join(payload, "ledger-precheck.json"),
      JSON.stringify({ ledger_relation: "schema_migrations", focused_migration: null }));
    fs.writeFileSync(path.join(payload, "migration-ledger.json"), JSON.stringify({ name: MIGRATION, sha256: hash(sql) }));
    const receipt = {
      contract_version: "tower-unknown-amount-schema-job/v1", mode: "apply", status: "pass",
      migration_name: MIGRATION, migration_sha256: hash(sql),
      baseline_sha256: hash(baseline), readback_sha256: hash(readback), comparison_status: "pass",
    };
    fs.writeFileSync(path.join(payload, "schema-job-receipt.json"), JSON.stringify(receipt));
    const archive = path.join(dir, "proof.tgz");
    const tar = spawnSync("tar", ["-czf", archive, "-C", payload, "."], { encoding: "utf8" });
    assert.equal(tar.status, 0, tar.stderr);
    const encoded = fs.readFileSync(archive).toString("base64");
    const logs = ["__TOWER_UNKNOWN_AMOUNT_SCHEMA_PROOF_TGZ_BEGIN__", encoded,
      "__TOWER_UNKNOWN_AMOUNT_SCHEMA_PROOF_TGZ_END__"].join("\n");
    const extracted = extractProofBundle(logs, output);
    assert.equal(extracted.marker, "tower_unknown_amount_schema");
    assert.doesNotThrow(() => verifyTowerSchemaProof("tower:migrate:unknown-amounts:apply-job", extracted, output));
    receipt.status = "failed";
    fs.writeFileSync(path.join(output, "proof/schema-job-receipt.json"), JSON.stringify(receipt));
    assert.throws(() => verifyTowerSchemaProof("tower:migrate:unknown-amounts:apply-job", extracted, output),
      /did not pass/);
    assert.throws(() => verifyTowerSchemaProof("tower:migrate:unknown-amounts:apply-job", { extracted: false }, output),
      /not captured/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("migration seal leaves apply time unverified when ACA success lacks a passing receipt", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-schema-seal-test-"));
  try {
    const options = { script: "tower:migrate:unknown-amounts:apply-job", secretEnv: [],
      image: `example.azurecr.io/web@sha256:${"a".repeat(64)}` };
    const args = [options, [], "job-execution", "Succeeded", "logs", "2026-10-11T00:00:00Z", dir];
    writeMigrationSeal(...args, false);
    const sealPath = path.join(dir, "06-migration-seal.json");
    const unverified = JSON.parse(fs.readFileSync(sealPath, "utf8"));
    assert.equal(unverified.tower_schema_proof_verified, false);
    assert.equal(unverified.migrations[0].applied_at, null);
    writeMigrationSeal(...args, true);
    const verified = JSON.parse(fs.readFileSync(sealPath, "utf8"));
    assert.equal(verified.tower_schema_proof_verified, true);
    assert.equal(verified.migrations[0].applied_at, "2026-10-11T00:00:00Z");
    writeMigrationSeal({ ...options, script: "tower:migrate:unknown-amounts:reconcile-job" },
      [], "reconcile-execution", "Succeeded", "logs", "2026-10-11T00:00:00Z", dir, false, true);
    const reconciled = JSON.parse(fs.readFileSync(sealPath, "utf8"));
    assert.equal(reconciled.mode, "reconcile-read-only");
    assert.equal(reconciled.tower_schema_proof_verified, false);
    assert.equal(reconciled.tower_schema_manual_review_required, true);
    assert.equal(reconciled.migrations[0].applied_at, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
