#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "source-intelligence-inventory-test-"));
const input = path.join(tmp, "input");
const out = path.join(tmp, "out");
fs.mkdirSync(input, { recursive: true });

fs.writeFileSync(
  path.join(input, "00_enterprise_profile.csv"),
  [
    "tenant_key,entity_name,revenue_usd,employee_count,business_model",
    "meridian-health,Meridian Health,25000000000,68000,Integrated provider and health plan",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(input, "19_data_analytics_platform_maturity.csv"),
  [
    "tenant_key,platform_name,current_state,etl_job_count,report_count",
    "meridian-health,SQL Server Datamart Estate,on_prem_shadow,280,640",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(input, "04_applications_systems.csv"),
  [
    "tenant_key,system_name,system_type,business_function,deployment_model",
    "meridian-health,Epic Hyperspace,EHR,Clinical Operations,on_prem",
    "meridian-health,Workday HCM,HCM,Human Resources,SaaS",
    "",
  ].join("\n"),
);

const output = execFileSync(
  "node",
  [
    "scripts/ecl/build_source_intelligence_inventory.mjs",
    "--working-tree",
    "--tenant",
    "meridian-health",
    "--assessment",
    "test-assessment",
    "--root",
    input,
    "--out-dir",
    out,
  ],
  { cwd: repoRoot, encoding: "utf8" },
);
const event = JSON.parse(output);
assert.equal(event.accepted, true);
assert.equal(event.file_count, 3);
assert.equal(event.total_rows, 4);

const manifest = JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8"));
assert.equal(manifest.contract_version, "source-derived-intelligence-inventory/v1");
assert.equal(manifest.entries.length, 3);
assert.equal(manifest.entries[0].source_family, "enterprise_profile");
assert.equal(manifest.entries[1].source_family, "applications");
assert.equal(manifest.entries[1].row_count, 2);
assert.equal(manifest.entries[1].column_count, 5);
assert.equal(manifest.entries[1].fill_rate, 1);
assert.match(manifest.entries[1].sha256, /^[a-f0-9]{64}$/);
assert.match(manifest.entries[1].schema_fingerprint, /^[a-f0-9]{64}$/);
assert.equal(manifest.entries[2].source_family, "data_analytics_platform_maturity");

const prompt = JSON.parse(fs.readFileSync(path.join(out, "prompts", "04_applications_systems.prompt.json"), "utf8"));
assert.equal(prompt.prompt_version, "source-intelligence-file-analyst/v1");
assert.match(prompt.system, /enterprise application portfolio architect/);
assert.equal(prompt.user.source_content_omitted_reason.includes("--include-source-content"), true);

const scaffold = JSON.parse(
  fs.readFileSync(path.join(out, "scaffolds", "04_applications_systems.source-intelligence.scaffold.json"), "utf8"),
);
assert.equal(scaffold.contract_version, "source-derived-intelligence/v1");
assert.equal(scaffold.model_input.source_content_hash, manifest.entries[1].sha256);
assert.equal(scaffold.verification.state, "pending_model_run");

console.log(JSON.stringify({ accepted: true, file_count: event.file_count, total_rows: event.total_rows }, null, 2));
