#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "knowledge", "land-airline-source-corpus.mjs");
const TENANT = "airline-demo-new";
const RELEASE = "airline-demo-new-source-corpus-v1.0.0";
const FREEZE_MANIFEST = path.join(REPO_ROOT, "clients", TENANT, "execution", `${RELEASE}.freeze-manifest.json`);

function run(args, env = {}) {
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

function parseJson(stdout) {
  return JSON.parse(stdout);
}

function testOperationalPlan() {
  const result = parseJson(
    run(["--tenant", TENANT, "--release-id", RELEASE, "--scope", "operational", "--mode", "plan"]),
  );
  assert.equal(result.status, "planned");
  assert.equal(result.tenantKey, TENANT);
  assert.equal(result.releaseId, RELEASE);
  assert.equal(result.scope, "operational");
  assert.equal(result.expectedCount, 48);
  assert.equal(result.evaluatorVisibleCount, 0);
  assert.equal(result.parserVisibleCount, 25);
  assert.equal(result.boundaries.evaluatorTruthInSourceRegistry, false);
  assert.equal(result.boundaries.productRuntimeClaimAllowed, false);
  assert.ok(result.files.every((file) => !file.path.startsWith("04-restricted-evaluator-design/")));
  assert.ok(result.files.every((file) => !file.path.startsWith("05-validation/")));
  assert.ok(result.files.every((file) => !file.path.startsWith("06-review-package/")));
}

function testEvaluatorPlan() {
  const result = parseJson(run(["--tenant", TENANT, "--release-id", RELEASE, "--scope", "evaluator", "--mode", "plan"]));
  assert.equal(result.status, "planned");
  assert.equal(result.scope, "evaluator");
  assert.equal(result.expectedCount, 2);
  assert.equal(result.evaluatorVisibleCount, 2);
  assert.equal(result.parserVisibleCount, 0);
  assert.ok(result.files.every((file) => file.path.startsWith("04-restricted-evaluator-design/")));
}

function testExecuteRequiresAck() {
  const failed = spawnSync(
    process.execPath,
    [SCRIPT, "--tenant", TENANT, "--release-id", RELEASE, "--scope", "operational", "--mode", "execute"],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, ABARVA_SOURCE_LANDING_EXECUTE_ACK: "" },
      encoding: "utf8",
    },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /execute_ack_missing/);
}

function testExecuteRequiresPackageHashAfterAck() {
  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "execute",
      "--package-zip",
      "/tmp/nonexistent-airline-source-package.zip",
      "--freeze-manifest-sha256",
      "0".repeat(64),
    ],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, ABARVA_SOURCE_LANDING_EXECUTE_ACK: "LAND_AIRLINE_SOURCE_CORPUS" },
      encoding: "utf8",
    },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /package_zip_hash_required_for_execute/);
}

function testWrongTenantBlocked() {
  const failed = spawnSync(
    process.execPath,
    [SCRIPT, "--tenant", "all", "--release-id", RELEASE, "--scope", "operational", "--mode", "plan"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /tenant_not_authorized/);
}

function testExplicitFreezeManifestSourcesBlocked() {
  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--freeze-manifest",
      FREEZE_MANIFEST,
      "--freeze-manifest-uri",
      "azblob://account/container/freeze-manifest.json",
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /freeze_manifest_source_ambiguous/);
}

function testExplicitFreezeManifestSourcesBlockedInReverseOrder() {
  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--freeze-manifest-uri",
      "azblob://account/container/freeze-manifest.json",
      "--freeze-manifest",
      FREEZE_MANIFEST,
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /freeze_manifest_source_ambiguous/);
}

function testEnvFreezeManifestPathWithCliUriBlocked() {
  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--freeze-manifest-uri",
      "azblob://account/container/freeze-manifest.json",
    ],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, ABARVA_SOURCE_FREEZE_MANIFEST: FREEZE_MANIFEST },
      encoding: "utf8",
    },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /freeze_manifest_source_ambiguous/);
}

function testEnvFreezeManifestUriWithCliPathBlocked() {
  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--freeze-manifest",
      FREEZE_MANIFEST,
    ],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, ABARVA_SOURCE_FREEZE_MANIFEST_URI: "azblob://account/container/freeze-manifest.json" },
      encoding: "utf8",
    },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /freeze_manifest_source_ambiguous/);
}

function testOutFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-source-landing-"));
  const out = path.join(dir, "plan.json");
  run(["--tenant", TENANT, "--release-id", RELEASE, "--scope", "operational", "--mode", "plan", "--out", out]);
  const result = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.equal(result.expectedCount, 48);
}

function testOperationalPlanDoesNotRequireEvaluatorFiles() {
  const sourceRoot = path.join(REPO_ROOT, "clients", "airline-demo-new", "19-template-instantiation-source-corpus");
  const subsetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-operational-subset-"));
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "PACKAGE_MANIFEST.json"), "utf8"));
  fs.writeFileSync(path.join(subsetRoot, "PACKAGE_MANIFEST.json"), JSON.stringify(manifest, null, 2));

  for (const file of manifest.files) {
    const p = file.path;
    const evaluator = p.startsWith("04-restricted-evaluator-design/");
    const excluded = p.startsWith("05-validation/") || p.startsWith("06-review-package/");
    if (evaluator || excluded) continue;
    const from = path.join(sourceRoot, p);
    const to = path.join(subsetRoot, p);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }

  const result = parseJson(
    run([
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--package-root",
      subsetRoot,
    ]),
  );
  assert.equal(result.expectedCount, 48);
  assert.equal(result.evaluatorVisibleCount, 0);
}

async function testOperationalPlanFromPackageZip() {
  const JSZip = require("jszip");
  const sourceRoot = path.join(REPO_ROOT, "clients", "airline-demo-new", "19-template-instantiation-source-corpus");
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "PACKAGE_MANIFEST.json"), "utf8"));
  const zip = new JSZip();
  zip.file("clients/airline-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json", JSON.stringify(manifest, null, 2));
  for (const file of manifest.files) {
    const from = path.join(sourceRoot, file.path);
    zip.file(`clients/airline-demo-new/19-template-instantiation-source-corpus/${file.path}`, fs.readFileSync(from));
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-source-package-zip-"));
  const zipPath = path.join(dir, "airline-source-package.zip");
  fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));

  const result = parseJson(
    run([
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--package-zip",
      zipPath,
      "--freeze-manifest",
      FREEZE_MANIFEST,
    ]),
  );
  assert.equal(result.expectedCount, 48);
  assert.equal(result.parserVisibleCount, 25);
  assert.equal(result.evaluatorVisibleCount, 0);
  assert.ok(result.files.every((file) => !file.path.startsWith("04-restricted-evaluator-design/")));
}

async function testPackageZipHashMismatch() {
  const JSZip = require("jszip");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-source-bad-hash-"));
  const zipPath = path.join(dir, "airline-source-package.zip");
  const zip = new JSZip();
  zip.file("clients/airline-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json", JSON.stringify({ files: [] }));
  fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--package-zip",
      zipPath,
      "--package-zip-sha256",
      "0".repeat(64),
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /package_zip_hash_mismatch/);
}

async function testPackageZipMultipleManifestsBlocked() {
  const JSZip = require("jszip");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-source-multiple-manifests-"));
  const zipPath = path.join(dir, "airline-source-package.zip");
  const zip = new JSZip();
  zip.file("a/PACKAGE_MANIFEST.json", JSON.stringify({ files: [] }));
  zip.file("b/PACKAGE_MANIFEST.json", JSON.stringify({ files: [] }));
  fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

  const failed = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--package-zip",
      zipPath,
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /package_zip_manifest_resolution_failed/);
}

async function testPackageZipTraversalStaysConfined() {
  const JSZip = require("jszip");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-source-traversal-"));
  const zipPath = path.join(dir, "airline-source-package.zip");
  const outside = path.join(dir, "outside.txt");
  const zip = new JSZip();
  zip.file("../outside.txt", "nope");
  zip.file("clients/airline-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json", JSON.stringify({ files: [] }));
  fs.writeFileSync(zipPath, await zip.generateAsync({ type: "nodebuffer" }));

  spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--package-zip",
      zipPath,
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.equal(fs.existsSync(outside), false);
}

const tests = [
  testOperationalPlan,
  testEvaluatorPlan,
  testExecuteRequiresAck,
  testExecuteRequiresPackageHashAfterAck,
  testWrongTenantBlocked,
  testExplicitFreezeManifestSourcesBlocked,
  testExplicitFreezeManifestSourcesBlockedInReverseOrder,
  testEnvFreezeManifestPathWithCliUriBlocked,
  testEnvFreezeManifestUriWithCliPathBlocked,
  testOutFile,
  testOperationalPlanDoesNotRequireEvaluatorFiles,
  testOperationalPlanFromPackageZip,
  testPackageZipHashMismatch,
  testPackageZipMultipleManifestsBlocked,
  testPackageZipTraversalStaysConfined,
];

for (const test of tests) {
  await test();
  console.log(`PASS ${test.name}`);
}
