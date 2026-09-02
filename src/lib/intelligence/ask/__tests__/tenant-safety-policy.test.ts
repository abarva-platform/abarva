import {
  CANONICAL_TENANT_KEYS,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";

import { scanRetiredFacts } from "../retired-fact-gate";
import { INTELLIGENCE_TENANT_SAFETY_POLICIES } from "../tenant-safety-policy";

describe("tenant safety policy coverage", () => {
  it("keeps every canonical tenant represented by an Intelligence safety policy", () => {
    const policyKeys = new Set(
      INTELLIGENCE_TENANT_SAFETY_POLICIES.map((policy) => policy.tenantKey),
    );

    expect(policyKeys).toEqual(new Set(CANONICAL_TENANT_KEYS));
  });

  it("keeps every canonical tenant pair covered by cross-tenant terms", () => {
    const missingPairs: string[] = [];

    for (const activeTenantKey of CANONICAL_TENANT_KEYS) {
      for (const foreignTenantKey of CANONICAL_TENANT_KEYS) {
        if (activeTenantKey === foreignTenantKey) continue;

        const isCovered = tenantAliasesFor(foreignTenantKey).some((alias) =>
          scanRetiredFacts({
            tenantKey: activeTenantKey,
            textBlocks: [{ location: "coverage", text: alias }],
          }).some((finding) => finding.factId.startsWith("cross_tenant_")),
        );

        if (!isCovered) {
          missingPairs.push(`${activeTenantKey}->${foreignTenantKey}`);
        }
      }
    }

    expect(missingPairs).toEqual([]);
  });
});
