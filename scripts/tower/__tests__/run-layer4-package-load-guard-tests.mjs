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

function runMutation(manifest, mode) {
  const packageDir = fs.mkdtempSync(path.join(temporaryRoot, "package-"));
  const outDir = path.join(packageDir, "out");
  fs.writeFileSync(
    path.join(packageDir, "package_manifest.json"),
    `${JSON.stringify(manifest)}\n`,
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

  const { result } = runMutation({ no_runtime_load: false }, "--write");
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /no_runtime_load=false/);
  console.log("Layer 4 package load guard: 5 checks passed");
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
