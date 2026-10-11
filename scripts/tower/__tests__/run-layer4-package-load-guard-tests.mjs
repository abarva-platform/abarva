#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const loader = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../load-healthcare-demo-layer4-products.mjs",
);
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tower-load-guard-"));

function runMutation(manifest, mode, projectYear = "", projectAmount = 100) {
  const packageDir = fs.mkdtempSync(path.join(temporaryRoot, "package-"));
  const outDir = path.join(packageDir, "out");
  fs.writeFileSync(
    path.join(packageDir, "package_manifest.json"),
    `${JSON.stringify(manifest)}\n`,
  );
  fs.writeFileSync(
    path.join(packageDir, "20_it_budget_by_domain.csv"),
    "fiscal_year,domain_key,tower_reviewed_project_budget_usd\nFY26,apps,100\n",
  );
  fs.writeFileSync(
    path.join(packageDir, "21_it_project_portfolio.csv"),
    `domain_key,project_budget_fiscal_year,approved_budget_usd\napps,${projectYear},${projectAmount}\n`,
  );
  const result = spawnSync(
    process.execPath,
    [loader, mode, "--package-dir", packageDir, "--out-dir", outDir],
    { encoding: "utf8", env: { ...process.env, DATABASE_URL: "" } },
  );
  return { result, outDir };
}

try {
  for (const mode of ["--write", "--purge-only"]) {
    for (const manifest of [{ no_runtime_load: true }, {}]) {
      const { result, outDir } = runMutation(manifest, mode);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /no_runtime_load=false/);
      assert.equal(fs.existsSync(outDir), false, "refusal must happen before output or SQL is created");
    }
  }

  const missingPeriod = runMutation({ no_runtime_load: false }, "--write");
  assert.match(missingPeriod.result.stderr, /project_budget_fiscal_year/);
  assert.equal(fs.existsSync(missingPeriod.outDir), false);

  const mismatchedAmount = runMutation({ no_runtime_load: false }, "--write", "FY26", 90);
  assert.match(mismatchedAmount.result.stderr, /funding differ in domain\(s\): apps/);
  assert.equal(fs.existsSync(mismatchedAmount.outDir), false);

  const reconciled = runMutation({ no_runtime_load: false }, "--write", "FY26", 100);
  assert.notEqual(reconciled.result.status, 0);
  assert.doesNotMatch(reconciled.result.stderr, /Refusing runtime load/);
  console.log("Layer 4 package load guard: 7 checks passed");
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
