#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRows } from "../load-healthcare-demo-layer4-products.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const base = {
  packageDir: path.join(root, "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-10-reconciled-rich"),
  tenantKey: "meridian-health",
  buildVersion: "tower-layer4-products-v2026-08",
  idempotencyKey: "assessment-identity-test",
  outDir: "/tmp/tower-assessment-identity-test",
  builtAt: "2026-10-13T00:00:00.000Z",
};
const current = buildRows({ ...base, assessmentId: "assessment-current" });
const candidate = buildRows({ ...base, assessmentId: "assessment-candidate" });
const candidateAgain = buildRows({ ...base, assessmentId: "assessment-candidate" });

for (const table of ["commandRows", "valueRows", "evidenceRows", "aiRows"]) {
  const currentIds = current[table].map((row) => row.id);
  const candidateIds = candidate[table].map((row) => row.id);
  assert.ok(candidateIds.length > 0, `${table} has rows`);
  assert.equal(new Set(candidateIds).size, candidateIds.length, `${table} IDs are unique within an assessment`);
  assert.deepEqual(candidateIds, candidateAgain[table].map((row) => row.id), `${table} IDs are repeatable`);
  assert.equal(candidateIds.filter((id) => new Set(currentIds).has(id)).length, 0,
    `${table} IDs cannot collide with a retained assessment`);
}

console.log("Layer 4 physical row IDs are unique per assessment and deterministic: 4 tables passed");
