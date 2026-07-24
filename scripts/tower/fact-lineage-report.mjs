#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";
const OUT_DIR = "reports/tower-data-fix/fact-lineage";

const COMMAND_METRICS = [
  "total_it_budget_fy26",
  "run_budget_fy26",
  "change_budget_fy26",
  "approved_program_budget_fy26",
  "ai_tagged_spend_fy26_non_additive",
  "promised_value_fy26",
  "partial_finance_validated_value_ytd",
  "realized_value_ytd_allowed",
  "candidate_ai_opportunities",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), "utf8"));
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(filePath, rows) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const body = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(ROOT, filePath), `${body}\n`);
}

function runProjection(tenantKey, outDir) {
  const result = spawnSync(
    "npx",
    [
      "tsx",
      "src/scripts/tower/project-tower-mart.ts",
      "--dry-run",
      "--no-db",
      "--tenant",
      tenantKey,
      "--out-dir",
      outDir,
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `Projection failed for ${tenantKey}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    );
  }
}

function metricStatus(metric, value, gaps, sourceFiles) {
  const blockingGap = gaps.find(
    (gap) => gap.field === metric && gap.severity === "blocking",
  );
  if (blockingGap) return "BLOCKING_GAP";
  if (value === null || value === undefined || value === "") return "MISSING";
  if (Number(value) === 0 && metric !== "realized_value_ytd_allowed") {
    const relatedGap = gaps.find((gap) => gap.field === metric);
    return relatedGap ? "GAP_ZERO" : "ZERO";
  }
  return sourceFiles.length === 1 ? "ONE_SOURCE" : "MULTI_SOURCE";
}

function main() {
  const registry = readJson(REGISTRY_PATH);
  const tenants = (registry.activeTenants ?? [])
    .map((tenant) => tenant.tenantKey)
    .filter(Boolean)
    .sort();

  fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });

  const metricRows = [];
  const gapRows = [];
  const summaryRows = [];

  for (const tenantKey of tenants) {
    const tenantOutDir = path.join(OUT_DIR, tenantKey);
    runProjection(tenantKey, tenantOutDir);
    const summary = readJson(path.join(tenantOutDir, "projection-summary.json"));
    const command = summary.command_center ?? {};
    const gaps = summary.gaps ?? [];
    const sourceFiles = command.source_files ?? [];

    summaryRows.push({
      tenant_key: tenantKey,
      source_standard: command.source_standard ?? "",
      v3_facts: summary.v3_facts ?? 0,
      tower_facts: summary.tower_facts ?? 0,
      merged_facts: summary.merged_facts ?? 0,
      source_file_count: sourceFiles.length,
      gap_count: gaps.length,
      blocking_gap_count: gaps.filter((gap) => gap.severity === "blocking").length,
      mart_command_center_rows: summary.mart_counts?.command_center ?? 0,
      mart_program_decision_lane_rows:
        summary.mart_counts?.program_decision_lanes ?? 0,
      mart_ai_portfolio_rows: summary.mart_counts?.ai_portfolio ?? 0,
    });

    for (const metric of COMMAND_METRICS) {
      const value = command[metric] ?? null;
      metricRows.push({
        tenant_key: tenantKey,
        metric,
        value,
        status: metricStatus(metric, value, gaps, sourceFiles),
        source_standard: command.source_standard ?? "",
        source_files: sourceFiles.join(";"),
        source_fact_count: Array.isArray(command.source_fact_keys)
          ? command.source_fact_keys.length
          : 0,
      });
    }

    for (const gap of gaps) {
      gapRows.push({
        tenant_key: tenantKey,
        field: gap.field,
        severity: gap.severity,
        remediation: gap.remediation,
      });
    }
  }

  writeCsv(path.join(OUT_DIR, "tower-command-metric-lineage.csv"), metricRows);
  writeCsv(path.join(OUT_DIR, "tower-gap-lineage.csv"), gapRows);
  writeCsv(path.join(OUT_DIR, "tower-lineage-summary.csv"), summaryRows);
  fs.writeFileSync(
    path.join(ROOT, OUT_DIR, "tower-command-metric-lineage.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), tenants, metricRows, gapRows, summaryRows }, null, 2),
  );

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        tenants: tenants.length,
        metric_rows: metricRows.length,
        gap_rows: gapRows.length,
        outputs: [
          path.join(OUT_DIR, "tower-lineage-summary.csv"),
          path.join(OUT_DIR, "tower-command-metric-lineage.csv"),
          path.join(OUT_DIR, "tower-gap-lineage.csv"),
          path.join(OUT_DIR, "tower-command-metric-lineage.json"),
        ],
      },
      null,
      2,
    ),
  );
}

main();
