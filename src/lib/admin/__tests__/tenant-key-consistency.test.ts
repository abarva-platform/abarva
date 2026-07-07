/**
 * Tenant-key consistency contract test · browser walk 2026-05-30 P0 #1
 *
 * The admin landing (`/admin`) reads substrate via two paths:
 *   1. `getSetupInventorySnapshot(brokerTenantKey)` — feeds the
 *      masthead pills and Section 02.
 *   2. `getTrustSpine(brokerTenantKey)` — feeds the Trust strip and
 *      posture grid; ALSO internally calls
 *      `getSetupInventorySnapshot(brokerTenantKey)`.
 *
 * Both paths receive the same key, produced by
 * `clientKeyToInventorySubstrateKey(clientKey)`. That key MUST match
 * the `tenant_key` column value persisted in `data_inventory_segments`,
 * which is canonicalized by migration
 * `20260515120000_tenant_key_canonicalization.sql` to the long-form
 * canonical key (`apex-retail`, `meridian-health`, `first-capital`).
 * The two newer tenants (Northstar, SkyHarbor) were seeded directly
 * with their long-form keys (`northstar-clinical`, `skyharbor-air`)
 * and never had a short-form alias.
 *
 * If `clientKeyToInventorySubstrateKey` ever drifts away from the
 * canonical key (e.g. someone "fixes" it to return the in-memory
 * EnterpriseDataRoom broker key, which differs for Meridian
 * (`meridian` vs `meridian-health`) and Northstar (`northstar` vs
 * `northstar-clinical`)), the substrate query returns zero rows for
 * every non-Apex tenant and the page renders an empty-state UI for a
 * tenant that has real data loaded.
 *
 * This test is the regression guard for that drift.
 */

import { describe, it, expect } from "@jest/globals";
import {
  clientKeyToInventorySubstrateKey,
  clientKeyToBrokerTenantKey,
} from "@/lib/agent/tools/intelligence/_shared";

describe("clientKeyToInventorySubstrateKey · data_inventory_* substrate contract", () => {
  // Single source of truth for the expected substrate `tenant_key`
  // value for each canonical tenant. Verified against migration
  // `20260515120000_tenant_key_canonicalization.sql` (Apex /
  // Meridian / First Capital alias map) and the seed scripts for
  // Northstar / SkyHarbor.
  const SUBSTRATE_TENANT_KEY_BY_APP_CLIENT_KEY: Record<string, string> = {
    apexretail: "apex-retail",
    meridian: "meridian-health",
    arcturus: "first-capital",
    northstar: "northstar-clinical",
    skyharbor: "skyharbor-air",
    lakeshore: "lakeshore-holdings",
  };

  it.each(Object.entries(SUBSTRATE_TENANT_KEY_BY_APP_CLIENT_KEY))(
    "app ClientKey %s → substrate tenant_key %s",
    (appClientKey, expectedSubstrateKey) => {
      expect(clientKeyToInventorySubstrateKey(appClientKey)).toBe(
        expectedSubstrateKey,
      );
    },
  );

  it("returns the same key for legacy aliases of the same tenant", () => {
    // The page receives whatever the active-client row holds; legacy
    // alias rows (`firstcapital`, `first-capital`) must resolve to
    // the same substrate key as the canonical app key (`arcturus`).
    expect(clientKeyToInventorySubstrateKey("firstcapital")).toBe(
      "first-capital",
    );
    expect(clientKeyToInventorySubstrateKey("first-capital")).toBe(
      "first-capital",
    );
    expect(clientKeyToInventorySubstrateKey("northstar-clinical")).toBe(
      "northstar-clinical",
    );
    expect(clientKeyToInventorySubstrateKey("skyharbor-air")).toBe(
      "skyharbor-air",
    );
  });
});

describe("clientKeyToBrokerTenantKey · EnterpriseDataRoom (Sentinel) contract", () => {
  // The Sentinel-side broker uses a DIFFERENT key for Meridian +
  // Northstar than the substrate side. Both keys must remain
  // distinct so the two contracts can evolve independently — the
  // substrate side was canonicalized in 2026-05, the EnterpriseDataRoom
  // key was left alone.
  it("returns the broker-side tenant key (not the canonical substrate key)", () => {
    expect(clientKeyToBrokerTenantKey("apexretail")).toBe("apex-retail");
    expect(clientKeyToBrokerTenantKey("meridian")).toBe("meridian");
    expect(clientKeyToBrokerTenantKey("arcturus")).toBe("first-capital");
    expect(clientKeyToBrokerTenantKey("northstar")).toBe("northstar-clinical");
    expect(clientKeyToBrokerTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(clientKeyToBrokerTenantKey("lakeshore")).toBe("lakeshore-holdings");
  });

  it("substrate and broker keys differ ONLY for Meridian (the two contracts share for the others)", () => {
    // This is the one tenant where the two contracts pick different
    // strings, so any code touching both contracts has to make a
    // conscious choice rather than assuming they're equal.
    expect(clientKeyToInventorySubstrateKey("meridian")).not.toBe(
      clientKeyToBrokerTenantKey("meridian"),
    );
    for (const k of [
      "apexretail",
      "arcturus",
      "northstar",
      "skyharbor",
      "lakeshore",
    ]) {
      expect(clientKeyToInventorySubstrateKey(k)).toBe(
        clientKeyToBrokerTenantKey(k),
      );
    }
  });
});
