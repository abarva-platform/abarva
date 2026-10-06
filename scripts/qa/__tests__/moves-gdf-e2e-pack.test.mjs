import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validatePackage, REQUIRED_FAMILIES } from "../validate-moves-gdf-e2e-pack.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FIXTURE = path.join(ROOT, "tests/fixtures/moves-governed-data-foundation-e2e");
const GOVERNANCE = path.join(ROOT, "docs/governance/dataset-manifests/nexus-moves-governed-data-foundation-e2e-synthetic-20261006.json");

function withCopy(run) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "moves-gdf-pack-"));
  const root = path.join(temp, "package");
  const governance = path.join(temp, "manifest.json");
  fs.cpSync(FIXTURE, root, { recursive: true });
  fs.copyFileSync(GOVERNANCE, governance);
  try {
    run(root, governance);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("GDF pack covers all required families and defers the reviewer redline", () => {
  assert.deepEqual(validatePackage(FIXTURE, GOVERNANCE), []);
  assert.equal(REQUIRED_FAMILIES.length, 11);
});

test("rejects a missing required family", () => {
  withCopy((root, governance) => {
    const file = path.join(root, "00_demo/upload_manifest.json");
    const manifest = json(file);
    manifest.initial_uploads = manifest.initial_uploads.filter((item) => item.family_key !== "finance_baseline_value_plan");
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
    assert.match(validatePackage(root, governance).join("\n"), /13 initial P2 files|each required GDF family/);
  });
});

test("rejects a package that pre-approves evidence or claims agent readiness", () => {
  withCopy((root, governance) => {
    const file = path.join(root, "00_demo/upload_manifest.json");
    const manifest = json(file);
    manifest.default_review_state = "approved";
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
    assert.match(validatePackage(root, governance).join("\n"), /pending human review/);

    const packageFile = path.join(root, "package_manifest.json");
    const packageManifest = json(packageFile);
    packageManifest.agent_ready = true;
    fs.writeFileSync(packageFile, JSON.stringify(packageManifest, null, 2));
    assert.match(validatePackage(root, governance).join("\n"), /must not claim loaded, indexed, active, or agent-ready/);
  });
});

test("rejects an early P3 redline upload and a tenant-pinned manifest", () => {
  withCopy((root, governance) => {
    const uploadFile = path.join(root, "00_demo/upload_manifest.json");
    const manifest = json(uploadFile);
    manifest.initial_uploads.push(manifest.deferred_uploads.pop());
    fs.writeFileSync(uploadFile, JSON.stringify(manifest, null, 2));
    const errors = validatePackage(root, governance).join("\n");
    assert.match(errors, /deferred P3 redline|redline before a P3 draft/);

    const gov = json(governance);
    gov.client_key = "meridian-health";
    fs.writeFileSync(governance, JSON.stringify(gov, null, 2));
    assert.match(validatePackage(root, governance).join("\n"), /without a tenant key/);
  });
});
