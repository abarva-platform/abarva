#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const outDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "ecl-dense-source-integrity-"),
);

function run(script) {
  return spawnSync("python3", [script, "--out-dir", outDir], {
    cwd: repo,
    encoding: "utf8",
  });
}

try {
  const generate = run("scripts/ecl/generate_dense_source_room_extracts.py");
  assert.equal(generate.status, 0, generate.stderr);
  const validate = () =>
    run("scripts/ecl/validate_dense_source_room_extracts.py");
  assert.equal(validate().status, 0, "untouched source set must validate");

  const sourcePath = path.join(
    outDir,
    "__synthetic_sources__",
    "SP01_Documents_Interviews",
    "Leadership_Interview_Notes_SYNTHETIC.csv",
  );
  const originalSource = fs.readFileSync(sourcePath, "utf8");
  fs.writeFileSync(
    sourcePath,
    originalSource.replace(
      "deterministic_depth_simulation",
      "changed_simulation_basis",
    ),
  );
  const tampered = validate();
  assert.notEqual(tampered.status, 0);
  assert.match(
    tampered.stderr,
    /source file sha256 does not match the manifest/,
  );
  fs.writeFileSync(sourcePath, originalSource);

  const manifestPath = path.join(outDir, "dense_source_room_manifest.csv");
  const originalManifest = fs.readFileSync(manifestPath, "utf8");
  fs.writeFileSync(
    manifestPath,
    originalManifest.replace(
      "__synthetic_sources__/SP01_Documents_Interviews/Leadership_Interview_Notes_SYNTHETIC.csv",
      "../outside.csv",
    ),
  );
  const escaped = validate();
  assert.notEqual(escaped.status, 0);
  assert.match(
    escaped.stderr,
    /source path is missing or outside its declared family/,
  );
  assert.doesNotMatch(escaped.stderr, /Traceback/);
  fs.writeFileSync(manifestPath, originalManifest);

  const manifestLines = originalManifest.trimEnd().split("\n");
  fs.writeFileSync(
    manifestPath,
    `${manifestLines.concat(manifestLines[1]).join("\n")}\n`,
  );
  const duplicated = validate();
  assert.notEqual(duplicated.status, 0);
  assert.match(duplicated.stderr, /duplicate source family/);
  assert.match(duplicated.stderr, /duplicate source path/);

  console.log(
    "Dense source manifest integrity: intact pass; tamper, escaped path and duplicate refused.",
  );
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
