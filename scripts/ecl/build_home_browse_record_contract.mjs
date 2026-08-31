#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CONTRACT_VERSION = "home-browse-record-contract/v1";
const DEFAULT_TENANT = "meridian-health";
const DEFAULT_ASSESSMENT = "assessment-dense-source-room-20260823";
const DEFAULT_REF = "origin/main";
const DEFAULT_ROOT = "datasets/tenant-inputs/active/meridian-health/current";
const DEFAULT_OUT_DIR = path.join("outputs", "home-browse-record", DEFAULT_TENANT, "current");
const GUIDE_FILE_PATTERN = /^00_GUIDE_/;
const FAMILY_LABELS = new Map([
  ["00_enterprise_profile", "Enterprise Profile"],
  ["01_business_functions", "Business Functions"],
  ["01b_business_segments", "Business Segments"],
  ["02_org_ownership", "Organization & Ownership"],
  ["03_workforce_roles", "Workforce & Roles"],
  ["04_applications_systems", "Applications & Systems"],
  ["05_data_assets_integrations", "Data Assets & Integrations"],
  ["06_infrastructure_platforms", "Infrastructure & Platforms"],
  ["07_vendors_contracts", "Vendors & Contracts"],
  ["08_spend_value", "Spend & Value"],
  ["09_programs_initiatives", "Programs & Initiatives"],
  ["10_ai_automation_use_cases", "AI Use Cases"],
  ["11_risks_controls", "Risks & Controls"],
  ["12_relationships", "Relationships"],
  ["13_evidence_sources", "Evidence Sources"],
  ["14_metrics_outcomes", "Metrics & Outcomes"],
  ["15_industry_context_patterns", "Industry Context"],
  ["16_expert_lenses", "Expert Lenses"],
  ["17_service_scope_managed_services", "Managed Services Scope"],
  ["18_operational_process_evidence", "Operational Process Evidence"],
  ["19_data_analytics_platform_maturity", "Data & Analytics Platform Maturity"],
  ["SA08_AI_Benefits_Realization_Usage_Ledger", "AI Benefits Realization"],
  ["SA09_AI_Tool_Usage_Feed", "AI Tool Usage"],
  ["SA10_AI_Value_Interview_Evidence", "AI Value Interview Evidence"],
  ["SA11_AI_KPI_Operational_Outcome_Feed", "AI KPI Outcomes"],
  ["ms365-copilot-usage-user-detail", "M365 Copilot Usage"],
]);
const PRESET_RULES = [
  {
    key: "executive",
    label: "Executive View",
    patterns: [/name/i, /business/i, /function/i, /owner/i, /vendor/i, /cost|spend|value|budget/i, /risk|status|priority/i],
  },
  {
    key: "technology",
    label: "Technology View",
    patterns: [/system|application|platform|technology|tool/i, /hosting|deployment|cloud|on.?prem/i, /criticality|tier/i, /lifecycle|support|version/i],
  },
  {
    key: "ownership",
    label: "Ownership View",
    patterns: [/owner|leader|role|org|function|decision|accountab/i],
  },
  {
    key: "value",
    label: "Value View",
    patterns: [/cost|spend|budget|value|benefit|roi|saving|revenue|contract/i, /count|volume|users?/i],
  },
  {
    key: "volume",
    label: "Volume View",
    patterns: [/count|volume|users?|rows?|reports?|etl|jobs?|scripts?|tickets?|members?|employees?/i],
  },
  {
    key: "lineage",
    label: "Lineage View",
    patterns: [/source|evidence|citation|row|file|hash|basis|confidence|attestation|review/i],
  },
];

function parseArgs(argv) {
  const args = {
    tenant: DEFAULT_TENANT,
    assessment: DEFAULT_ASSESSMENT,
    ref: DEFAULT_REF,
    root: DEFAULT_ROOT,
    outDir: DEFAULT_OUT_DIR,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--tenant") args.tenant = next();
    else if (arg === "--assessment") args.assessment = next();
    else if (arg === "--ref") args.ref = next();
    else if (arg === "--root") args.root = next();
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--working-tree") args.ref = "";
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/build_home_browse_record_contract.mjs [options]

Builds an Excel-like Home browse contract from source CSV files. The output is a UI contract:
dataset selector, dimensions, column presets, row lineage fields, and canvas guidance.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readFromRef(ref, repoPath) {
  if (!ref) return fs.readFileSync(repoPath, "utf8");
  return execFileSync("git", ["show", `${ref}:${repoPath}`], {
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
}

function listCsvFiles(ref, root) {
  if (!ref) {
    return fs
      .readdirSync(root)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => path.posix.join(root, file))
      .sort();
  }
  return execFileSync("git", ["ls-tree", "-r", "--name-only", ref, root], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  })
    .split(/\r?\n/)
    .filter((line) => line.endsWith(".csv"))
    .sort();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (ch === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (ch === "\"") quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === "\"") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ""));
}

function stem(file) {
  return path.basename(file).replace(/\.csv$/i, "");
}

function labelFor(fileStem) {
  return FAMILY_LABELS.get(fileStem) || fileStem.replace(/_/g, " ");
}

function columnStats(header, rows) {
  return header.map((column, index) => {
    let filled = 0;
    const values = new Set();
    for (const row of rows) {
      const value = (row[index] ?? "").trim();
      if (value) {
        filled += 1;
        values.add(value);
      }
    }
    const fillRate = rows.length === 0 ? 0 : filled / rows.length;
    return {
      column,
      fill_rate: Number(fillRate.toFixed(4)),
      distinct_count: values.size,
      sample_values: [...values].slice(0, 5),
    };
  });
}

function pickDimensions(stats, rowCount) {
  return stats
    .filter((stat) => {
      if (stat.fill_rate < 0.25) return false;
      if (stat.distinct_count < 2) return false;
      if (rowCount > 20 && stat.distinct_count > Math.max(50, rowCount * 0.55)) return false;
      return true;
    })
    .sort((a, b) => b.fill_rate - a.fill_rate || b.distinct_count - a.distinct_count)
    .slice(0, 10)
    .map((stat) => ({
      key: stat.column,
      label: stat.column.replace(/_/g, " "),
      distinct_count: stat.distinct_count,
      fill_rate: stat.fill_rate,
      sample_values: stat.sample_values,
    }));
}

function presetColumns(header, patterns) {
  const picked = [];
  for (const pattern of patterns) {
    for (const column of header) {
      if (pattern.test(column) && !picked.includes(column)) picked.push(column);
    }
  }
  return picked.slice(0, 14);
}

function buildPresets(header) {
  const presets = PRESET_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    columns: presetColumns(header, rule.patterns),
  })).filter((preset) => preset.columns.length > 0);
  const defaultColumns = [...new Set(presets.flatMap((preset) => preset.columns))].slice(0, 12);
  return {
    default_columns: defaultColumns.length > 0 ? defaultColumns : header.slice(0, 12),
    presets,
  };
}

function buildDatasetContract(file, text) {
  const fileStem = stem(file);
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const stats = columnStats(header, dataRows);
  const presets = buildPresets(header);
  const guide = GUIDE_FILE_PATTERN.test(path.basename(file));
  return {
    dataset_key: fileStem,
    label: labelFor(fileStem),
    source_file: file,
    source_hash: sha256(text),
    schema_fingerprint: sha256(JSON.stringify(header)),
    browse_state: guide ? "guide" : "browsable",
    row_count: dataRows.length,
    column_count: header.length,
    fill_rate:
      dataRows.length === 0 || header.length === 0
        ? 0
        : Number(
            (
              stats.reduce((sum, stat) => sum + stat.fill_rate, 0) /
              Math.max(1, stats.length)
            ).toFixed(4),
          ),
    grain_hint: guide ? "guide row" : "source row",
    dimension_candidates: pickDimensions(stats, dataRows.length),
    default_columns: presets.default_columns,
    column_presets: presets.presets,
    lineage_drawer: {
      required_fields: ["source_file", "source_hash", "schema_fingerprint", "source_row_number", "column_name", "raw_value"],
      row_identity: "source_file + source_row_number",
      value_boundary: "show raw source value separately from any normalized ECL value",
    },
    column_stats: stats,
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = listCsvFiles(options.ref, options.root);
  const datasets = files.map((file) => buildDatasetContract(file, readFromRef(options.ref, file)));
  const browsable = datasets.filter((dataset) => dataset.browse_state === "browsable");
  const guide = datasets.filter((dataset) => dataset.browse_state === "guide");
  const manifest = {
    contract_version: CONTRACT_VERSION,
    tenant_key: options.tenant,
    assessment_id: options.assessment,
    source_ref: options.ref || "working-tree",
    source_root: options.root,
    dataset_count: datasets.length,
    browsable_dataset_count: browsable.length,
    guide_dataset_count: guide.length,
    total_rows: datasets.reduce((sum, dataset) => sum + dataset.row_count, 0),
    total_columns: datasets.reduce((sum, dataset) => sum + dataset.column_count, 0),
    canvas_contract: {
      interaction_model: "Every dataset click refreshes the Browse The Record canvas; no single long HTML dump.",
      primary_regions: [
        "dataset selector",
        "dimension filter bar",
        "column preset selector",
        "slice summary cards",
        "compact table",
        "row lineage drawer",
      ],
      counting_rule: "Counts are source-row counts for this browser; canonical object counts must use typed ECL views.",
      default_behavior: "show preset columns first; user may expand all columns explicitly",
    },
    datasets,
    generated_at: new Date().toISOString(),
  };
  writeJson(path.join(options.outDir, "home-browse-record-contract.json"), manifest);
  console.log(JSON.stringify({
    accepted: true,
    contract_version: CONTRACT_VERSION,
    tenant_key: manifest.tenant_key,
    assessment_id: manifest.assessment_id,
    dataset_count: manifest.dataset_count,
    browsable_dataset_count: manifest.browsable_dataset_count,
    guide_dataset_count: manifest.guide_dataset_count,
    total_rows: manifest.total_rows,
    out_dir: options.outDir,
  }, null, 2));
}

main();
