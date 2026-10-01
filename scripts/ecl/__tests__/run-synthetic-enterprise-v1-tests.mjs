import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const generator = path.join(root, "scripts/ecl/generate_synthetic_enterprise_v1.py");
const validator = path.join(root, "scripts/ecl/validate_synthetic_enterprise_v1.py");

function run(script, directory) {
  return spawnSync("python3", [script, "--out-dir", directory], {
    cwd: root,
    encoding: "utf8",
  });
}

test("one definition reproducibly emits a coherent, imperfect enterprise source set", (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "synthetic-enterprise-v1-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const first = path.join(tmp, "first");
  const second = path.join(tmp, "second");
  const generated = run(generator, first);
  assert.equal(generated.status, 0, generated.stderr);
  const repeated = run(generator, second);
  assert.equal(repeated.status, 0, repeated.stderr);
  const a = JSON.parse(generated.stdout);
  const b = JSON.parse(repeated.stdout);
  assert.equal(a.source_set_hash, b.source_set_hash);
  assert.equal(a.files, 22);
  assert.equal(a.object_counts.application, 750);
  assert.equal(a.object_counts.contract, 230);
  assert.equal(a.object_counts.business_segment, 3);
  assert.equal(a.imperfection_checks.unresolved_program_owners, 1);
  assert.equal(a.kpi_period_counts["2026-Q2"], 36);
  assert.equal(run(validator, first).status, 0);
  assert.notEqual(run(generator, first).status, 0, "a versioned pack must not be overwritten");

  const manifest = JSON.parse(fs.readFileSync(path.join(first, "enterprise_manifest.json"), "utf8"));
  const edge = manifest.relationships.find((item) => item.resolution_state === "unresolved");
  assert.equal(edge.to_object_id, "UNKNOWN-DEPENDENCY-0001");
  assert.equal(manifest.client_attestation_state, "not_client_attested");
  assert.equal(manifest.review_state, "candidate_not_loaded");
});

test("independent validator rejects a changed source file and an undeclared edge", (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "synthetic-enterprise-v1-mutation-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const directory = path.join(tmp, "pack");
  assert.equal(run(generator, directory).status, 0);
  const manifestPath = path.join(directory, "enterprise_manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const firstFile = path.join(directory, manifest.files[0].file_path);
  fs.appendFileSync(firstFile, "\nchanged\n");
  const badFile = run(validator, directory);
  assert.notEqual(badFile.status, 0);
  assert.match(badFile.stderr, /Source hash mismatch/);

  const clean = path.join(tmp, "clean");
  assert.equal(run(generator, clean).status, 0);
  const cleanManifestPath = path.join(clean, "enterprise_manifest.json");
  const cleanManifest = JSON.parse(fs.readFileSync(cleanManifestPath, "utf8"));
  cleanManifest.relationships[0].to_object_id = "UNKNOWN-UNDECLARED";
  fs.writeFileSync(cleanManifestPath, JSON.stringify(cleanManifest));
  const badEdge = run(validator, clean);
  assert.notEqual(badEdge.status, 0);
  assert.match(badEdge.stderr, /Undeclared dangling relationship/);
});
