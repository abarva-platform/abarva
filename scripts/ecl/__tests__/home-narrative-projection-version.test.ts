import assert from "node:assert/strict";
import { test } from "node:test";
import type { Client } from "pg";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import { readHomeProjectionRows } from "../build_home_ecl_narrative_layer";
import {
  assertNarrativePlanVersion,
  assertNarrativeRowVersion,
  narrativeProjectionVersion,
} from "../home-narrative-projection-version";

const [tenantKey, otherTenantKey] = CANONICAL_TENANT_KEYS;
const assessmentId = "assessment-version-binding-test";
const row = { tenant_key: tenantKey, assessment_id: assessmentId, projection_version: 2 };

test("legacy default and explicit supported projection versions remain distinct", () => {
  assert.equal(narrativeProjectionVersion(), 1);
  assert.equal(narrativeProjectionVersion(null), 1);
  assert.equal(narrativeProjectionVersion("1"), 1);
  assert.equal(narrativeProjectionVersion("2"), 2);
  for (const invalid of ["", "0", "3", "1.0", "02", "NaN", " 2", "2 "]) {
    assert.throws(() => narrativeProjectionVersion(invalid), /exactly 1 or 2/);
  }
});

test("an approved plan cannot be replayed against a different projection version", () => {
  assert.doesNotThrow(() => assertNarrativePlanVersion(undefined, 1));
  assert.doesNotThrow(() => assertNarrativePlanVersion(1, 1));
  assert.doesNotThrow(() => assertNarrativePlanVersion(2, 2));
  for (const [planned, expected] of [[undefined, 2], [1, 2], [2, 1], ["2", 2], [null, 2]] as const) {
    assert.throws(() => assertNarrativePlanVersion(planned, expected), /different projection version/);
  }
});

test("returned rows must match the independently selected scope and version", () => {
  assert.doesNotThrow(() => assertNarrativeRowVersion([row], tenantKey, assessmentId, 2));
  for (const drifted of [
    { ...row, tenant_key: otherTenantKey },
    { ...row, assessment_id: "other-assessment" },
    { ...row, projection_version: 1 },
  ]) {
    assert.throws(() => assertNarrativeRowVersion([row, drifted], tenantKey, assessmentId, 2), /exact tenant/);
  }
});

test("the actual projection reader binds its SQL to each selected version", async () => {
  for (const projectionVersion of [1, 2] as const) {
    const expectedRows = [{ ...row, projection_version: projectionVersion }];
    const db = {
      async query(sql: string, parameters: unknown[]) {
        assert.match(sql, /tenant_key = \$1 and assessment_id = \$2 and projection_version = \$3/);
        assert.deepEqual(parameters, [tenantKey, assessmentId, projectionVersion]);
        return { rows: expectedRows };
      },
    } as unknown as Client;
    assert.deepEqual(await readHomeProjectionRows(db, tenantKey, assessmentId, projectionVersion), expectedRows);
  }
});

test("the actual projection reader refuses unexpected rows before packet construction", async () => {
  for (const drifted of [
    { ...row, tenant_key: otherTenantKey },
    { ...row, assessment_id: "other-assessment" },
    { ...row, projection_version: 1 },
  ]) {
    const db = { async query() { return { rows: [row, drifted] }; } } as unknown as Client;
    await assert.rejects(readHomeProjectionRows(db, tenantKey, assessmentId, 2), /exact tenant/);
  }
});
