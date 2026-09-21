import {
  FOUNDATION_TENANT_KEYS,
  isFoundationTenantKey,
  resolveFoundationTenantKey,
} from "@/lib/tenant/foundation-tenants";
import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";

describe("foundation tenant keys", () => {
  it.each(CANONICAL_TENANT_KEYS)(
    "classifies canonical tenant key %s against the foundation registry",
    (tenantKey) => {
      const isFoundation = FOUNDATION_TENANT_KEYS.some(
        (foundationKey) => foundationKey === tenantKey,
      );

      expect(isFoundationTenantKey(tenantKey)).toBe(isFoundation);
      expect(resolveFoundationTenantKey(tenantKey)).toBe(
        isFoundation ? tenantKey : null,
      );
    },
  );

  it("returns a canonical foundation key for a registered alias", () => {
    expect(resolveFoundationTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(isFoundationTenantKey("skyharbor")).toBe(true);
  });

  it("rejects non-canonical values that are not registered aliases", () => {
    expect(resolveFoundationTenantKey("skyharbor-air-shadow")).toBeNull();
    expect(isFoundationTenantKey("skyharbor-air-shadow")).toBe(false);
    expect(resolveFoundationTenantKey("foundation-tenant-unknown")).toBeNull();
    expect(isFoundationTenantKey("foundation-tenant-unknown")).toBe(false);
  });
});
