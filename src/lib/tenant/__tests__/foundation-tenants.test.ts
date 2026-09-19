import {
  isFoundationTenantKey,
  resolveFoundationTenantKey,
} from "@/lib/tenant/foundation-tenants";

describe("foundation tenant keys", () => {
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
