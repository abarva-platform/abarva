#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "source-intelligence-model-pass-test-"));
const input = path.join(tmp, "input");
const inventory = path.join(tmp, "inventory");
const passOut = path.join(tmp, "model-pass");
const thinOut = path.join(tmp, "thin-model-pass");
const plantedOut = path.join(tmp, "planted-model-pass");
fs.mkdirSync(input, { recursive: true });

fs.writeFileSync(
  path.join(input, "00_enterprise_profile.csv"),
  [
    "tenant_key,entity_name,revenue_usd,employee_count,business_model",
    "synthetic-demo,Synthetic Integrated Health,25000000000,68000,Integrated provider and health plan",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(input, "04_applications_systems.csv"),
  [
    "tenant_key,system_name,system_type,business_function,deployment_model",
    "synthetic-demo,Epic Hyperspace,EHR,Clinical Operations,on_prem",
    "synthetic-demo,Workday HCM,HCM,Human Resources,SaaS",
    "",
  ].join("\n"),
);

const inventoryEvent = JSON.parse(
  execFileSync(
    "node",
    [
      "scripts/ecl/build_source_intelligence_inventory.mjs",
      "--working-tree",
      "--tenant",
      "synthetic-demo",
      "--assessment",
      "test-assessment",
      "--root",
      input,
      "--out-dir",
      inventory,
      "--include-source-content",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ),
);
assert.equal(inventoryEvent.accepted, true);
assert.equal(inventoryEvent.file_count, 2);

const modelPass = JSON.parse(
  execFileSync(
    "node",
    [
      "scripts/ecl/run_source_intelligence_model_pass.mjs",
      "--inventory-dir",
      inventory,
      "--out-dir",
      passOut,
      "--mock",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ),
);
assert.equal(modelPass.prompt_count, 2);
assert.equal(modelPass.accepted_count, 2);
assert.equal(modelPass.rejected_count, 0);
assert.equal(modelPass.all_source_content_included, true);

const runManifest = JSON.parse(fs.readFileSync(path.join(passOut, "run-manifest.json"), "utf8"));
assert.equal(runManifest.contract_version, "source-derived-intelligence-model-pass/v1");
assert.equal(runManifest.mode, "mock");

const accepted = JSON.parse(
  fs.readFileSync(path.join(passOut, "accepted", "04_applications_systems.source-intelligence.json"), "utf8"),
);
assert.equal(accepted.contract_version, "source-derived-intelligence/v1");
assert.equal(accepted.tenant_key, "synthetic-demo");
assert.equal(accepted.model_input.source_content_state, "included");
assert.match(accepted.model_input.prompt_hash, /^[a-f0-9]{64}$/);
assert.match(accepted.model_input.raw_response_hash, /^[a-f0-9]{64}$/);
assert.equal(accepted.source_file.rows_read, accepted.source_file.row_count);
assert.equal(accepted.deterministic_inventory.read.rows_read, accepted.deterministic_inventory.read.source_rows);
assert.equal(Array.isArray(accepted.facts), true);
assert.equal(Array.isArray(accepted.reading), true);
assert.equal(accepted.facts.length > 0, true);
assert.equal(accepted.page_mapping.includes("applications_systems"), true);
assert.equal(Array.isArray(accepted.home_relevance.executive_brief), true);
assert.equal(accepted.classification.observed_facts.length > 0, true);
assert.equal(accepted.classification.calculated_observations.length > 0, true);

const raw = JSON.parse(
  fs.readFileSync(path.join(passOut, "raw-responses", "04_applications_systems.raw-response.json"), "utf8"),
);
assert.equal(raw.mode, "mock");
assert.match(raw.raw_response_hash, /^[a-f0-9]{64}$/);

const ledger = JSON.parse(
  fs.readFileSync(path.join(passOut, "verification", "04_applications_systems.verification-ledger.json"), "utf8"),
);
assert.equal(ledger.accepted, true);
assert.equal(ledger.verification_state, "accepted");
assert.deepEqual(ledger.issues, []);

const thinInventory = path.join(tmp, "thin-inventory");
execFileSync(
  "node",
  [
    "scripts/ecl/build_source_intelligence_inventory.mjs",
    "--working-tree",
    "--tenant",
    "synthetic-demo",
    "--assessment",
    "test-assessment",
    "--root",
    input,
    "--out-dir",
    thinInventory,
  ],
  { cwd: repoRoot, encoding: "utf8" },
);

const thinResult = spawnSync(
  "node",
  [
    "scripts/ecl/run_source_intelligence_model_pass.mjs",
    "--inventory-dir",
    thinInventory,
    "--out-dir",
    thinOut,
    "--mock",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);
assert.notEqual(thinResult.status, 0);
const thinManifest = JSON.parse(fs.readFileSync(path.join(thinOut, "run-manifest.json"), "utf8"));
assert.equal(thinManifest.accepted_count, 0);
assert.equal(thinManifest.rejected_count, 2);
assert.equal(thinManifest.all_source_content_included, false);
assert.equal(thinManifest.issues.every((issue) => issue.issues.includes("source_content_missing")), true);

const plantedResult = spawnSync(
  "node",
  [
    "scripts/ecl/run_source_intelligence_model_pass.mjs",
    "--inventory-dir",
    inventory,
    "--out-dir",
    plantedOut,
    "--mock",
    "--plant-unsupported-fact",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);
assert.notEqual(plantedResult.status, 0);
const plantedManifest = JSON.parse(fs.readFileSync(path.join(plantedOut, "run-manifest.json"), "utf8"));
assert.equal(plantedManifest.accepted_count, 0);
assert.equal(plantedManifest.rejected_count, 2);
assert.equal(
  plantedManifest.issues.every((issue) =>
    issue.issues.some((inner) => inner.startsWith("fact_number_not_supported:987654321")),
  ),
  true,
);

console.log(
  JSON.stringify(
    {
      accepted: true,
      prompts: modelPass.prompt_count,
      thin_refused: thinManifest.rejected_count,
      planted_refused: plantedManifest.rejected_count,
    },
    null,
    2,
  ),
);
