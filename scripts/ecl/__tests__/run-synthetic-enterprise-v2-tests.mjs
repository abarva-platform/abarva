import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const definition = path.join(root, "datasets/synthetic/enterprise-v2/definition.json");
const generator = path.join(root, "scripts/ecl/generate_synthetic_enterprise_v1.py");
const validator = path.join(root, "scripts/ecl/validate_synthetic_enterprise_v1.py");
const adapter = path.join(root, "scripts/ecl/normalize_synthetic_enterprise_v1.py");
const expectedHash = "deb504f6d34d3381dd2f09d323f352302d106076c96fa182b5d485084fd93829";

function run(script, ...args) {
  return spawnSync("python3", [script, ...args, "--definition", definition], {
    cwd: root,
    encoding: "utf8",
  });
}

test("v2 emits independently counted logical applications with source lineage", (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "synthetic-enterprise-v2-"));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const pack = path.join(temp, "pack");
  const normalizedDir = path.join(temp, "normalized");
  const generated = run(generator, "--out-dir", pack);
  assert.equal(generated.status, 0, generated.stderr);
  assert.equal(run(validator, "--out-dir", pack).status, 0);
  const adapted = run(adapter, "--pack", pack, "--out-dir", normalizedDir);
  assert.equal(adapted.status, 0, adapted.stderr);

  const manifest = JSON.parse(fs.readFileSync(path.join(pack, "enterprise_manifest.json"), "utf8"));
  const normalized = JSON.parse(fs.readFileSync(path.join(normalizedDir, "normalized_enterprise.json"), "utf8"));
  assert.equal(manifest.source_set_hash, expectedHash);
  assert.equal(normalized.source_set_hash, expectedHash);
  assert.equal(manifest.assessment_id, "assessment-meridian-synthetic-enterprise-v2");
  assert.equal(normalized.adapter_contract_version, "synthetic-enterprise-v2/layer2/v1");
  assert.equal(manifest.client_attestation_state, "not_client_attested");
  assert.equal(manifest.service_capability_count, 80);
  assert.equal(normalized.objects.filter((object) => object.type === "application").length, 344);
  assert.equal(normalized.objects.filter((object) => object.type === "application_module").length, 726);
  const services = normalized.objects.filter((object) => object.attributes.application_grain === "logical_service");
  assert.equal(services.length, 320);
  assert.equal(new Set(services.map((object) => object.name)).size, 320);
  assert.equal(new Set(services.map((object) => object.attributes.business_function_id)).size, 14);
  const byFunction = Object.values(Object.groupBy(services, (object) => object.attributes.business_function_id)).map((items) => items.length);
  assert.ok(new Set(byFunction).size >= 3, "application distribution should not be uniform");
  assert.ok(services.every((object) => !object.attributes.parent_application_id && object.source.source_file_sha256));
  assert.equal(normalized.relationships.filter((edge) => edge.type === "MODULE_OF").length, 726);
  assert.equal(normalized.unresolved_relationships.length, 1);
});
