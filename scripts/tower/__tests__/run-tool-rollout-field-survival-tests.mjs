#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateToolRolloutFieldSurvival } from "../validate-tool-rollout-field-survival.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);

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
  const headers = rows.shift() ?? [];
  return {
    headers,
    rows: rows
      .filter((values) => values.some((value) => value.trim()))
      .map((values) =>
        Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
      ),
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function rewriteCsv(file, transform) {
  const csv = parseCsv(await fs.readFile(file, "utf8"));
  const next = transform(csv);
  const headers = next.headers ?? csv.headers;
  const rows = next.rows ?? csv.rows;
  const text = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  await fs.writeFile(file, `${text}\n`, "utf8");
}

async function withPackageCopy(name, fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `tool-rollout-survival-${name}-`));
  await fs.cp(PACKAGE_DIR, dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function expectFailure(name, mutate, expectedPattern) {
  await withPackageCopy(name, async (dir) => {
    await mutate(dir);
    const result = await validateToolRolloutFieldSurvival({ packageDir: dir });
    assert.equal(result.status, "FAIL");
    assert.match(result.issues.join("\n"), expectedPattern);
  });
}

async function assertLayer3UsesSupportedMeasureScenarioVocabulary() {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "tool-rollout-layer3-scenarios-"));
  try {
    const result = spawnSync(
      process.execPath,
      [path.join(ROOT, "scripts/tower/load-healthcare-demo-layer3-canonical.mjs"), "--out-dir", outDir],
      { cwd: ROOT, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const sql = await fs.readFile(path.join(outDir, "tower_layer3_ecl_context_load.sql"), "utf8");
    assert.match(sql, /'enabled_users'/);
    assert.doesNotMatch(sql, /'enabled'\s*,\s*'source_recorded'/);
  } finally {
    await fs.rm(outDir, { recursive: true, force: true });
  }
}

const passing = await validateToolRolloutFieldSurvival();
assert.equal(passing.status, "PASS");
assert.equal(passing.source_rows, 13);
assert.equal(passing.issues.length, 0);
await assertLayer3UsesSupportedMeasureScenarioVocabulary();

await expectFailure(
  "missing-layer4-column",
  async (dir) => {
    await rewriteCsv(path.join(dir, "layer_4_read_models/tower_tools_table.csv"), (csv) => ({
      headers: csv.headers.filter((header) => header !== "enabled_users"),
      rows: csv.rows,
    }));
  },
  /layer_4_read_model_columns: missing enabled_users/,
);

await expectFailure(
  "cube-value-drift",
  async (dir) => {
    await rewriteCsv(path.join(dir, "cube/tower_ai_tool_rollout_cube.csv"), (csv) => {
      const rows = csv.rows.map((row, index) =>
        index === 0 ? { ...row, monthly_active_users: "999999" } : row,
      );
      return { rows };
    });
  },
  /tool_rollout_cube_monthly_active_users_values: mismatch/,
);

await expectFailure(
  "relationship-count-drift",
  async (dir) => {
    await rewriteCsv(path.join(dir, "layer_3_canonical/canonical_relationships.csv"), (csv) => {
      const rows = csv.rows.filter(
        (row, index) =>
          index !==
          csv.rows.findIndex(
            (candidate) =>
              candidate.from_object_type === "Tool" &&
              candidate.relationship_type === "supports" &&
              candidate.to_object_type === "AIUseCase",
          ),
      );
      return { rows };
    });
  },
  /layer_3_tool_relationship_counts: .*expected \d+, got \d+/,
);

console.log("tool rollout field survival tests passed");
