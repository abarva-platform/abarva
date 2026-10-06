#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GENERATED_TENANT_ROOT = path.join(ROOT, "datasets/tenant-inputs/generated");
const CONTRACT_PATH = path.join(
  ROOT,
  "docs/architecture/tower/tool-rollout-field-survival-contract.json",
);
const SOURCE_RELATIVE_PATH =
  "layer_1_client_intake/source_system_extracts/23_ai_tool_rollout.csv";

function exists(file) {
  return fs.existsSync(file);
}

function packageDirsWithToolRollouts() {
  if (!exists(GENERATED_TENANT_ROOT)) return [];
  const tenants = fs.readdirSync(GENERATED_TENANT_ROOT, { withFileTypes: true });
  const packages = [];
  for (const tenant of tenants) {
    if (!tenant.isDirectory()) continue;
    const tenantDir = path.join(GENERATED_TENANT_ROOT, tenant.name);
    const entries = fs.readdirSync(tenantDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const packageDir = path.join(tenantDir, entry.name);
      if (exists(path.join(packageDir, SOURCE_RELATIVE_PATH))) {
        packages.push(packageDir);
      }
    }
  }
  return packages.sort((a, b) => a.localeCompare(b));
}

const packages = packageDirsWithToolRollouts();
const failures = [];
for (const packageDir of packages) {
  const result = spawnSync("node", [
    "scripts/tower/validate-tool-rollout-field-survival.mjs",
    "--package-dir",
    packageDir,
    "--contract",
    CONTRACT_PATH,
  ], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failures.push({ packageDir, output: result.stderr || result.stdout });
  }
}

if (failures.length > 0) {
  console.error("Tower tool rollout field survival gate failed.");
  for (const failure of failures) {
    console.error("");
    console.error(`Package: ${path.relative(ROOT, failure.packageDir)}`);
    console.error(failure.output.trim());
  }
  process.exit(1);
}

console.log(
  `Tower tool rollout field survival gate passed for ${packages.length} generated package(s).`,
);
