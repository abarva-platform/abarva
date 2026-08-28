#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const DEFAULT_SUMMARY = "/tmp/tower-layer2-local-proof-v3/tower_layer2_ecl_source_load_summary.json";
const DEFAULT_READBACK = "/tmp/tower-layer2-local-proof-v3/postgres_readback.json";

function argValue(argv, name, fallback) {
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift()?.map((value) => value.trim()) ?? [];
  return rows
    .filter((cells) => cells.some((cell) => String(cell).trim()))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function gate(gates, id, pass, detail) {
  gates.push({ id, status: pass ? "PASS" : "FAIL", detail });
}

function readJsonIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const argv = process.argv.slice(2);
  const packageDir = path.resolve(argValue(argv, "--package-dir", process.env.TOWER_LAYER2_PACKAGE_DIR ?? DEFAULT_PACKAGE_DIR));
  const summaryPath = argValue(argv, "--summary", process.env.TOWER_LAYER2_SUMMARY ?? DEFAULT_SUMMARY);
  const readbackPath = argValue(argv, "--readback", process.env.TOWER_LAYER2_READBACK ?? DEFAULT_READBACK);
  const localOnly = argv.includes("--local-only");

  const adapterRuns = readCsv(path.join(packageDir, "layer_2_source_adapters/adapter_runs.csv"));
  const emissions = readCsv(path.join(packageDir, "layer_2_source_adapters/adapter_emitted_objects.csv"));
  const sourceFiles = readCsv(path.join(packageDir, "layer_1_client_intake/source_file_manifest.csv"));
  const sourceExtractRows = sourceFiles.reduce((total, row) => {
    const filePath = path.join(packageDir, "layer_1_client_intake/source_system_extracts", row.source_file);
    return total + readCsv(filePath).length;
  }, 0);
  const summary = readJsonIfPresent(summaryPath);
  const readback = readJsonIfPresent(readbackPath);
  const gates = [];

  gate(gates, "adapter_run_count", adapterRuns.length === 7, `${adapterRuns.length} adapter runs`);
  gate(gates, "adapter_runs_preserve_lineage", adapterRuns.every((row) => row.lineage_status === "preserved"), "all adapter runs preserve lineage");
  gate(gates, "adapter_emission_count", emissions.length === sourceExtractRows, `${emissions.length} emissions for ${sourceExtractRows} source rows`);
  gate(gates, "adapter_emissions_preserve_lineage", emissions.every((row) => row.lineage_status === "preserved"), "all adapter emissions preserve source file and row");
  gate(gates, "adapter_emission_unique_ids", new Set(emissions.map((row) => row.canonical_object_id)).size === emissions.length, "canonical_object_id is unique for every emission");
  gate(gates, "adapter_emission_source_rows_present", emissions.every((row) => row.source_file && Number(row.source_row) >= 2), "every emission names source file and CSV row");

  if (summary) {
    gate(gates, "dry_run_expected_counts", summary.expected_counts?.source_record === 1981, `${summary.expected_counts?.source_record ?? "missing"} expected source records`);
    gate(gates, "dry_run_boundary", summary.boundary?.canonical_layer_written === false && summary.boundary?.product_projection_written === false, "dry-run writes no canonical or product projection rows");
  } else {
    gate(gates, "dry_run_summary_present", false, `missing ${summaryPath}`);
  }

  if (readback) {
    gate(gates, "readback_source_file_count", Number(readback.source_file) === 9, `${readback.source_file} source files`);
    gate(gates, "readback_source_record_count", Number(readback.source_record) === 1981, `${readback.source_record} source records`);
    gate(gates, "readback_adapter_run_count", Number(readback.adapter_run_records) === 7, `${readback.adapter_run_records} adapter run records`);
    gate(gates, "readback_adapter_emission_count", Number(readback.adapter_emission_records) === 987, `${readback.adapter_emission_records} adapter emission records`);
    gate(gates, "readback_tenant_drift", Number(readback.tenant_payload_drift) === 0, `${readback.tenant_payload_drift} tenant payload drift rows`);
    gate(gates, "readback_lineage_drift", Number(readback.adapter_lineage_drift) === 0, `${readback.adapter_lineage_drift} adapter lineage drift rows`);
  } else if (localOnly) {
    gate(gates, "azure_readback_deferred", true, "local-only validation; Azure readback requires governed ACA job execution");
  } else {
    gate(gates, "readback_present", false, `missing ${readbackPath}`);
  }

  const result = {
    status: gates.every((item) => item.status === "PASS") ? "PASS" : "FAIL",
    mode: localOnly ? "local_only" : "azure_readback_required",
    packageDir,
    summaryPath,
    readbackPath,
    gates,
  };
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "PASS") process.exitCode = 1;
}

main();
