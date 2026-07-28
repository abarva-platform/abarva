/**
 * Activation guard: the fixture provider must never be selectable for a real /
 * canonical tenant. This is the "no fixture provider in an activated tenant"
 * safety rule, enforced at the runtime-factory boundary.
 */

import { createFixtureRuntime } from "..";
import { assertFixtureNamespace, FIXTURE_TENANT_KEYS } from "../../fixtures";

const CANONICAL_TENANTS = [
  "airline-demo-new",
  "skyharbor-air",
  "meridian-health",
  "apex-retail",
  "first-capital",
  "lakeshore-holdings",
  "northstar-clinical",
];

describe("fixture activation guard", () => {
  it("rejects every canonical tenant key", () => {
    for (const key of CANONICAL_TENANTS) {
      expect(() => assertFixtureNamespace(key)).toThrow(/non-fixture tenant/);
      expect(() => createFixtureRuntime(key, "normal")).toThrow();
    }
  });

  it("rejects a fixture-prefixed but unregistered key", () => {
    expect(() => assertFixtureNamespace("fixture-not-real")).toThrow(/Unknown fixture tenant/);
  });

  it("allows the registered synthetic fixture tenants", () => {
    for (const key of FIXTURE_TENANT_KEYS) {
      expect(() => assertFixtureNamespace(key)).not.toThrow();
      expect(createFixtureRuntime(key, "normal").binding.kind).toBe("contract_fixture");
    }
  });
});
