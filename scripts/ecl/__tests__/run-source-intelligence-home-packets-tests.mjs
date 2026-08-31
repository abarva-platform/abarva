#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "source-intelligence-home-packets-test-"));
const input = path.join(tmp, "input");
const inventory = path.join(tmp, "inventory");
const modelPass = path.join(tmp, "model-pass");
const packets = path.join(tmp, "home-packets");
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
  path.join(input, "01b_business_segments.csv"),
  [
    "tenant_key,segment_key,segment_name,revenue_share_pct,revenue_usd,pnl_owner_role",
    "synthetic-demo,hospital_delivery,Hospital Delivery,60,15000000000,COO",
    "synthetic-demo,shared_enterprise,Shared Enterprise,40,10000000000,CFO",
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
fs.writeFileSync(
  path.join(input, "05_data_assets_integrations.csv"),
  [
    "tenant_key,data_asset_name,asset_type,business_function,technology,report_count,etl_job_count,active_user_count",
    "synthetic-demo,Clinical Quality Mart,datamart,Clinical Operations,SQL Server,220,45,800",
    "",
  ].join("\n"),
);

const segmentReport = path.join(tmp, "segment-spine.json");
fs.writeFileSync(
  segmentReport,
  JSON.stringify({
    tenant: "synthetic-demo",
    segments: [
      {
        segmentKey: "hospital_delivery",
        segmentName: "Hospital Delivery",
        revenueSharePct: 60,
        revenueUsd: 15_000_000_000,
        pnlOwnerRole: "COO",
        domains: { applications: { count: 1, money: 1000 } },
      },
    ],
    unattributed: { applications: 0 },
    unresolvedByDomain: {},
    shareVsRevenue: [
      {
        segmentKey: "hospital_delivery",
        revenueSharePct: 60,
        shares: { applications: { sharePct: 50, gapVsRevenue: -10 } },
      },
    ],
  }),
);

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
);

execFileSync(
  "node",
  [
    "scripts/ecl/run_source_intelligence_model_pass.mjs",
    "--inventory-dir",
    inventory,
    "--out-dir",
    modelPass,
    "--mock",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);

const output = JSON.parse(
  execFileSync(
    "node",
    [
      "scripts/ecl/build_source_intelligence_home_packets.mjs",
      "--source-dir",
      modelPass,
      "--inventory-dir",
      inventory,
      "--segment-spine-report",
      segmentReport,
      "--out-dir",
      packets,
      "--max-artifacts-per-page",
      "4",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ),
);

assert.equal(output.accepted, true);
assert.equal(output.page_count, 16);
assert.equal(output.total_source_artifact_count, 4);

const manifest = JSON.parse(fs.readFileSync(path.join(packets, "manifest.json"), "utf8"));
assert.equal(manifest.contract_version, "source-intelligence-home-page-packets/v1");
assert.equal(manifest.pages.length, 16);

const executive = JSON.parse(fs.readFileSync(path.join(packets, "packets", "executive_brief.home-page-packet.json"), "utf8"));
assert.equal(executive.page_key, "executive_brief");
assert.equal(executive.writer_lens, "McKinsey-style business strategy partner");
assert.equal(executive.included_source_families.includes("enterprise_profile"), true);
assert.equal(executive.canvases.includes("boardroom_thesis"), true);
assert.equal(executive.table_candidates.includes("leadership_theme_extracts"), true);
assert.equal(executive.chart_candidates.includes("business_model_mix"), true);
assert.equal(executive.drilldown_candidates.includes("interview excerpts"), true);
assert.equal(executive.available_source_index.length, 4);
assert.equal(executive.source_content_context.length, executive.included_source_count);
assert.equal(executive.source_content_context.some((source) => source.source_content.includes("Integrated provider and health plan")), true);
assert.equal(executive.source_evidence_tables.length, executive.included_source_count);
assert.equal(executive.segment_spine_context.segment_source_file, "01b_business_segments.csv");
assert.equal(executive.segment_spine_context.segments[0].segmentKey, "hospital_delivery");
assert.equal(
  executive.source_evidence_tables
    .find((table) => table.source_file.endsWith("00_enterprise_profile.csv"))
    .row_samples.some((row) => row.business_model === "Integrated provider and health plan"),
  true,
);
assert.match(executive.packet_hash, /^[a-f0-9]{64}$/);
assert.match(executive.prompt_hash, /^[a-f0-9]{64}$/);

const technology = JSON.parse(fs.readFileSync(path.join(packets, "packets", "technology_data.home-page-packet.json"), "utf8"));
assert.equal(technology.writer_lens, "expert technologist and enterprise architect");
assert.equal(technology.included_source_families.includes("applications"), true);
assert.equal(technology.included_source_families.includes("data_assets_integrations"), true);
assert.equal(technology.canvases.includes("data_platform_stack"), true);
assert.equal(technology.table_candidates.includes("AI_tool_usage"), true);
assert.equal(technology.chart_candidates.includes("reporting_and_etl_volume"), true);
assert.equal(
  technology.source_evidence_tables
    .find((table) => table.source_file.endsWith("05_data_assets_integrations.csv"))
    .numeric_summaries.some((summary) => summary.column === "report_count" && summary.sum === 220),
  true,
);
assert.equal(technology.evidence_basis.every((entry) => entry.source_hash && entry.source_file), true);

const loaded = JSON.parse(fs.readFileSync(path.join(packets, "packets", "what_has_been_loaded.home-page-packet.json"), "utf8"));
assert.equal(loaded.included_source_count, 4);
assert.equal(loaded.context_bounds.selection_rule, "include all accepted source-intelligence artifacts");

const prompt = JSON.parse(fs.readFileSync(path.join(packets, "prompts", "current_state_data_flow.prompt.json"), "utf8"));
assert.match(prompt.system, /data architecture, BI, ETL, and AI platform architect/);
assert.equal(prompt.user.packet.page_key, "current_state_data_flow");
assert.equal(Array.isArray(prompt.user.packet.source_intelligence), true);
assert.equal(prompt.user.context_depth.source_content_mode, "full selected source files included");
assert.equal(prompt.user.context_depth.segment_spine_mode, "declared segment spine and cross-domain board included");
assert.equal(prompt.user.expected_output.deterministic_tables_to_use.includes("segment_spine_context when present"), true);
assert.equal(prompt.user.expected_output.canvas_sections.length, 4);
assert.equal(prompt.user.expected_output.drilldowns_to_enable.includes("reporting surface"), true);

console.log(JSON.stringify({ accepted: true, pages: manifest.pages.length, artifacts: output.total_source_artifact_count }, null, 2));
