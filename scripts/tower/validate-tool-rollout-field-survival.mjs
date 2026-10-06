#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const DEFAULT_CONTRACT = path.join(
  ROOT,
  "docs/architecture/tower/tool-rollout-field-survival-contract.json",
);

function argValue(argv, name) {
  const inline = argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
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
  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return {
    headers,
    rows: rows
      .filter((values) => values.some((value) => value.trim()))
      .map((values) =>
        Object.fromEntries(
          headers.map((header, index) => [header, values[index] ?? ""]),
        ),
      ),
  };
}

async function readCsv(packageDir, relativePath) {
  return parseCsv(await fs.readFile(path.join(packageDir, relativePath), "utf8"));
}

function normalize(value) {
  return String(value ?? "").trim();
}

function indexRows(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const id = normalize(row[key]);
    if (!id) continue;
    assert.ok(!result.has(id), `duplicate ${key}: ${id}`);
    result.set(id, row);
  }
  return result;
}

function toolObjectId(row) {
  return `TOOL:${row.tool_rollout_id}`;
}

export async function validateToolRolloutFieldSurvival({
  packageDir = DEFAULT_PACKAGE_DIR,
  contractPath = DEFAULT_CONTRACT,
} = {}) {
  const contract = JSON.parse(await fs.readFile(contractPath, "utf8"));
  const layer1 = await readCsv(packageDir, contract.layers.layer_1_source);
  const layer2 = await readCsv(packageDir, contract.layers.layer_2_lineage);
  const layer3 = await readCsv(packageDir, contract.layers.layer_3_canonical);
  const layer4 = await readCsv(packageDir, contract.layers.layer_4_read_model);
  const cube = await readCsv(packageDir, contract.layers.tool_rollout_cube);

  const issues = [];
  const gates = [];
  const record = (id, pass, detail) => {
    gates.push({ id, status: pass ? "PASS" : "FAIL", detail });
    if (!pass) issues.push(`${id}: ${detail}`);
  };

  const layerByName = {
    layer_1_source: layer1,
    layer_2_lineage: layer2,
    layer_3_canonical: layer3,
    layer_4_read_model: layer4,
    tool_rollout_cube: cube,
  };
  const sourceById = indexRows(layer1.rows, contract.row_key);
  const layer3ById = indexRows(layer3.rows, contract.row_key);
  const layer4ById = indexRows(layer4.rows, contract.row_key);
  const cubeById = indexRows(cube.rows, contract.row_key);
  const comparableLayers = {
    layer_3_canonical: layer3ById,
    layer_4_read_model: layer4ById,
    tool_rollout_cube: cubeById,
  };

  record(
    "source_rows_present",
    sourceById.size > 0,
    `${sourceById.size} ${contract.object_type} source rows`,
  );

  for (const [layerName, file] of Object.entries(layerByName)) {
    const requiredColumns =
      layerName === "layer_2_lineage"
        ? contract.layer_2_checks.required_columns
        : [
            contract.row_key,
            ...contract.required_fields
              .filter((field) => field.survives_to.includes(layerName))
              .map((field) => field.field),
          ];
    const missing = [...new Set(requiredColumns)].filter(
      (column) => !file.headers.includes(column),
    );
    record(
      `${layerName}_columns`,
      missing.length === 0,
      missing.length ? `missing ${missing.join(", ")}` : "all required columns present",
    );
  }

  for (const [layerName, rowsById] of Object.entries(comparableLayers)) {
    const missingRows = [...sourceById.keys()].filter((id) => !rowsById.has(id));
    record(
      `${layerName}_row_survival`,
      missingRows.length === 0,
      missingRows.length
        ? `missing rows ${missingRows.join(", ")}`
        : `${rowsById.size} rows survived`,
    );

    for (const field of contract.required_fields) {
      if (!field.survives_to.includes(layerName)) continue;
      const mismatches = [];
      for (const [id, source] of sourceById.entries()) {
        const target = rowsById.get(id);
        if (!target) continue;
        if (normalize(source[field.field]) !== normalize(target[field.field])) {
          mismatches.push(id);
        }
      }
      record(
        `${layerName}_${field.field}_values`,
        mismatches.length === 0,
        mismatches.length
          ? `mismatch on ${mismatches.join(", ")}`
          : `${field.field} preserved`,
      );
    }
  }

  const lineageRows = layer2.rows.filter(
    (row) =>
      row.source_file === contract.source_file &&
      row.canonical_object_type === contract.layer_2_checks.canonical_object_type,
  );
  const lineageBySourceRecord = indexRows(lineageRows, "source_record_id");
  const missingLineage = [...sourceById.keys()].filter(
    (id) => !lineageBySourceRecord.has(id),
  );
  const badLineage = lineageRows.filter(
    (row) =>
      row.lineage_status !== contract.layer_2_checks.lineage_status ||
      row.canonical_object_id !== toolObjectId({ tool_rollout_id: row.source_record_id }),
  );
  record(
    "layer_2_row_lineage",
    missingLineage.length === 0 && badLineage.length === 0,
    missingLineage.length || badLineage.length
      ? `missing ${missingLineage.join(", ") || "none"}; invalid ${badLineage.length}`
      : `${lineageRows.length} source rows emitted as canonical tools`,
  );

  for (const check of contract.relationship_checks) {
    const rel = await readCsv(packageDir, check.file);
    const counts = new Map();
    for (const row of rel.rows) {
      if (
        row.from_object_type === check.from_object_type &&
        row.relationship_type === check.relationship_type &&
        row.to_object_type === check.to_object_type
      ) {
        counts.set(row.from_object_id, (counts.get(row.from_object_id) ?? 0) + 1);
      }
    }
    const mismatches = [];
    for (const row of layer3.rows) {
      const expected = Number(row[check.count_field] || 0);
      const actual = counts.get(row.canonical_tool_id) ?? 0;
      if (expected !== actual) {
        mismatches.push(`${row[contract.row_key]} expected ${expected}, got ${actual}`);
      }
    }
    record(
      "layer_3_tool_relationship_counts",
      mismatches.length === 0,
      mismatches.length ? mismatches.join("; ") : "linked case counts match relationships",
    );
  }

  return {
    status: issues.length === 0 ? "PASS" : "FAIL",
    contract_id: contract.contract_id,
    package_dir: packageDir,
    source_rows: sourceById.size,
    gates,
    issues,
  };
}

async function main() {
  const packageDir = path.resolve(
    argValue(process.argv.slice(2), "--package-dir") ?? DEFAULT_PACKAGE_DIR,
  );
  const contractPath = path.resolve(
    argValue(process.argv.slice(2), "--contract") ?? DEFAULT_CONTRACT,
  );
  const result = await validateToolRolloutFieldSurvival({
    packageDir,
    contractPath,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "PASS") process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
