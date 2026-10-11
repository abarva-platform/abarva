#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const towerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tower-upstream-load-guard-"));
const loaders = [
  ["layer2", "load-healthcare-demo-layer2-source-adapters.mjs"],
  ["layer3", "load-healthcare-demo-layer3-canonical.mjs"],
];

function run(loader, manifest, mode, env = {}) {
  const packageDir = fs.mkdtempSync(path.join(temporaryRoot, "package-"));
  const outDir = path.join(packageDir, "out");
  fs.writeFileSync(path.join(packageDir, "package_manifest.json"), `${JSON.stringify(manifest)}\n`);
  const result = spawnSync(
    process.execPath,
    [path.join(towerDir, loader), mode, "--package-dir", packageDir, "--out-dir", outDir],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "",
        TOWER_LAYER2_WRITE: "false",
        TOWER_LAYER3_WRITE: "false",
        ...env,
      },
    },
  );
  return { result, outDir };
}

try {
  for (const [layer, loader] of loaders) {
    for (const manifest of [{ no_runtime_load: true }, {}]) {
      const { result, outDir } = run(loader, manifest, "--write");
      assert.notEqual(result.status, 0, `${layer} must reject a restricted package`);
      assert.match(result.stderr, /no_runtime_load=false/);
      assert.equal(fs.existsSync(outDir), false, `${layer} must refuse before creating output`);
    }

    const envFlag = layer === "layer2" ? "TOWER_LAYER2_WRITE" : "TOWER_LAYER3_WRITE";
    const flagged = run(loader, { no_runtime_load: true }, "--readback-only", { [envFlag]: "true" });
    assert.match(flagged.result.stderr, /no_runtime_load=false/);
    assert.equal(fs.existsSync(flagged.outDir), false);

    const readback = run(loader, { no_runtime_load: true }, "--readback-only");
    assert.doesNotMatch(readback.result.stderr, /no_runtime_load=false/);
    assert.equal(fs.existsSync(readback.outDir), true, `${layer} readback path remains available`);

    const eligible = run(loader, { no_runtime_load: false }, "--write");
    assert.doesNotMatch(eligible.result.stderr, /no_runtime_load=false/);
    assert.equal(fs.existsSync(eligible.outDir), true, `${layer} continues to its ordinary input checks`);
  }
  console.log("Layer 2 and Layer 3 package load guards: pass");
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
