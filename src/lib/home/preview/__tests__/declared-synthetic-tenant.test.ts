/**
 * Whether Home may say a tenant is synthetic demonstration data.
 *
 * The statement is about one tenant, so it is read from what the tenant input registry declares
 * for that tenant and from nothing else. These cases hold both halves: the reading of a
 * declaration, and that a Home bundle carries the reading from the registry the repository ships.
 */
import {
  isDeclaredSyntheticDemoTenant,
  type TenantInputDeclarations,
} from "@/lib/tenant/declared-synthetic-tenant";

import {
  HOME_PREVIEW_TENANT_KEYS,
  getHomeReviewBundle,
} from "../golden-snapshot";

const declarations: TenantInputDeclarations = {
  activeTenants: [
    {
      tenantKey: "tenant-declared-synthetic",
      packets: [
        { classification: "synthetic-demo" },
        { classification: "synthetic-demo" },
      ],
    },
    {
      // Looks synthetic by every name it has. Nothing declares it so.
      tenantKey: "demo-synthetic-sandbox",
      packets: [{ classification: "client-supplied" }],
    },
    {
      tenantKey: "tenant-with-mixed-packets",
      packets: [
        { classification: "synthetic-demo" },
        { classification: "client-supplied" },
      ],
    },
    { tenantKey: "tenant-with-no-packets", packets: [] },
    { tenantKey: "tenant-with-unclassified-packet", packets: [{}] },
  ],
};

describe("a tenant declared synthetic", () => {
  it("is one whose every registered input packet is classified synthetic demonstration data", () => {
    expect(
      isDeclaredSyntheticDemoTenant("tenant-declared-synthetic", declarations),
    ).toBe(true);
  });

  it("is not one that merely has a name suggesting it", () => {
    expect(
      isDeclaredSyntheticDemoTenant("demo-synthetic-sandbox", declarations),
    ).toBe(false);
  });

  it("is not one with any packet declared otherwise, no packets, or no declaration", () => {
    for (const tenantKey of [
      "tenant-with-mixed-packets",
      "tenant-with-no-packets",
      "tenant-with-unclassified-packet",
      "tenant-the-registry-does-not-list",
    ]) {
      expect(isDeclaredSyntheticDemoTenant(tenantKey, declarations)).toBe(
        false,
      );
    }
    expect(isDeclaredSyntheticDemoTenant("tenant-declared-synthetic", {})).toBe(
      false,
    );
  });
});

describe("the declaration on a Home bundle", () => {
  it("is read from the registry for every tenant Home serves", () => {
    expect(HOME_PREVIEW_TENANT_KEYS.length).toBeGreaterThan(0);
    for (const tenantKey of HOME_PREVIEW_TENANT_KEYS) {
      const bundle = getHomeReviewBundle(tenantKey);
      expect(bundle).not.toBeNull();
      expect(bundle?.declaredSyntheticDemo).toBe(
        isDeclaredSyntheticDemoTenant(tenantKey),
      );
      // Today every tenant Home serves is declared synthetic. If one stops being so, this fails
      // and the page stops calling it a demonstration on the same change.
      expect(bundle?.declaredSyntheticDemo).toBe(true);
    }
  });

  it("is absent for a tenant the shipped registry does not list", () => {
    expect(
      isDeclaredSyntheticDemoTenant("tenant-the-registry-does-not-list"),
    ).toBe(false);
  });
});
