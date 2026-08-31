#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "home-browse-record-contract-test-"));
const input = path.join(tmp, "input");
const out = path.join(tmp, "out");
fs.mkdirSync(input, { recursive: true });

fs.writeFileSync(
  path.join(input, "00_GUIDE_how_to_use.csv"),
  [
    "section,instruction,owner,required,example",
    "Start,Use source exports,Data owner,yes,Attach system export",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(input, "04_applications_systems.csv"),
  [
    "system_name,system_type,business_function,business_owner,it_owner,deployment_model,vendor_name,annual_spend_usd,criticality,lifecycle_status",
    "Epic Hyperspace,EHR,Clinical Operations,CMO,CIO,on_prem,Epic Systems,12000000,tier_1,active",
    "Workday HCM,HCM,Human Resources,CHRO,CIO,SaaS,Workday,2200000,tier_2,active",
    "Infor Lawson,ERP,Finance,CFO,CIO,on_prem,Infor,3100000,tier_2,watch",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(input, "05_data_assets_integrations.csv"),
  [
    "data_asset_name,asset_type,business_function,platform_name,technology,report_count,etl_job_count,active_user_count,governance_state",
    "Clinical Quality Mart,datamart,Clinical Operations,SQL Server,SSIS,220,80,350,partial",
    "Finance Close Mart,datamart,Finance,Netezza,DataStage,180,65,90,ungoverned",
    "",
  ].join("\n"),
);

const output = JSON.parse(
  execFileSync(
    "node",
    [
      "scripts/ecl/build_home_browse_record_contract.mjs",
      "--working-tree",
      "--tenant",
      "synthetic-demo",
      "--assessment",
      "test-assessment",
      "--root",
      input,
      "--out-dir",
      out,
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ),
);

assert.equal(output.accepted, true);
assert.equal(output.dataset_count, 3);
assert.equal(output.browsable_dataset_count, 2);
assert.equal(output.guide_dataset_count, 1);
assert.equal(output.total_rows, 6);

const manifest = JSON.parse(fs.readFileSync(path.join(out, "home-browse-record-contract.json"), "utf8"));
assert.equal(manifest.contract_version, "home-browse-record-contract/v1");
assert.equal(manifest.canvas_contract.interaction_model.includes("refreshes the Browse The Record canvas"), true);
assert.equal(manifest.canvas_contract.primary_regions.includes("row lineage drawer"), true);

const apps = manifest.datasets.find((dataset) => dataset.dataset_key === "04_applications_systems");
assert.ok(apps);
assert.equal(apps.browse_state, "browsable");
assert.equal(apps.label, "Applications & Systems");
assert.equal(apps.dimension_candidates.some((dimension) => dimension.key === "business_function"), true);
assert.equal(apps.dimension_candidates.some((dimension) => dimension.key === "deployment_model"), true);
assert.equal(apps.column_presets.some((preset) => preset.key === "executive" && preset.columns.includes("business_function")), true);
assert.equal(apps.column_presets.some((preset) => preset.key === "technology" && preset.columns.includes("deployment_model")), true);
assert.equal(apps.lineage_drawer.required_fields.includes("raw_value"), true);
assert.match(apps.source_hash, /^[a-f0-9]{64}$/);
assert.match(apps.schema_fingerprint, /^[a-f0-9]{64}$/);

const data = manifest.datasets.find((dataset) => dataset.dataset_key === "05_data_assets_integrations");
assert.ok(data);
assert.equal(data.column_presets.some((preset) => preset.key === "technology" && preset.columns.includes("technology")), true);
assert.equal(data.column_presets.some((preset) => preset.key === "value" && preset.columns.includes("report_count")), true);
assert.equal(data.column_presets.some((preset) => preset.key === "volume" && preset.columns.includes("etl_job_count")), true);

const guide = manifest.datasets.find((dataset) => dataset.dataset_key === "00_GUIDE_how_to_use");
assert.equal(guide.browse_state, "guide");

console.log(JSON.stringify({ accepted: true, datasets: output.dataset_count, browsable: output.browsable_dataset_count }, null, 2));
