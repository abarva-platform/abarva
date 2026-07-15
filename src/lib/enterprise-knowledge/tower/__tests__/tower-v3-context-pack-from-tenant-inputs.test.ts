import path from "node:path";

import { buildTowerV3ContextPackFromTenantInputs } from "../tower-v3-context-pack-from-tenant-inputs";

const activeInputRoot = path.join(
  process.cwd(),
  "datasets/tenant-inputs/active/meridian-health/current",
);

describe("Tower v3 ContextPack from active tenant inputs", () => {
  it("builds a live Meridian TowerContextPack from dimensions 08/09/11/14/17/18", () => {
    const proof = buildTowerV3ContextPackFromTenantInputs({
      tenantKey: "meridian-health",
      tenantName: "Meridian Health",
      activeInputRoot,
    });

    expect(proof.contextPack.contextPackId).toBe("meridian-health-tower-v3-live-context-pack");
    expect(proof.contextPack.mode).toBe("active");
    expect(proof.contextPack.truthStatus).toBe("active");
    expect(proof.contextPack.sourceOfTruthPath).toBe("v3_enterprise_context_layer");
    expect(proof.contextPack.projectionPath).toBe("path_a_derived_projection");
    expect(proof.summary.acceptance.allSixDimensionsPresent).toBe(true);
    expect(proof.summary.sourceDimensions).toHaveLength(6);
    expect(proof.summary.sourceDimensions.every((dimension) => dimension.rowCount > 0)).toBe(true);
  });

  it("keeps Tower measurement/readiness safe and blocks realized-value language", () => {
    const proof = buildTowerV3ContextPackFromTenantInputs({
      tenantKey: "meridian-health",
      tenantName: "Meridian Health",
      activeInputRoot,
    });

    expect(proof.summary.cioTowerProjectionStatus).toEqual({
      projectionRole: "derived_read_model",
      sourceOfTruthStatus: "bridge_only",
      v3ReconciliationStatus: "not_v3_reconciled",
    });
    expect(proof.summary.realizedValueLanguageAllowed).toBe(false);
    expect(proof.summary.acceptance.realizedValueLanguageBlocked).toBe(true);
    expect(proof.contextPack.towerTruthCaveats.join(" ")).toMatch(/cio_tower remains a read model/i);
    expect(proof.contextPack.caveats.join(" ")).toMatch(/not a Tower value ledger/i);
  });

  it("attaches evidence and gates to every Tower record and value claim", () => {
    const proof = buildTowerV3ContextPackFromTenantInputs({
      tenantKey: "meridian-health",
      tenantName: "Meridian Health",
      activeInputRoot,
    });

    const records = [
      ...proof.contextPack.towerMetricRecords,
      ...proof.contextPack.towerValueRecords,
    ];
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => record.evidenceIds.length > 0)).toBe(true);
    expect(proof.contextPack.towerValueClaims.length).toBeGreaterThan(0);
    expect(proof.contextPack.towerValueClaims.every((claim) => Boolean(claim.gateStatus))).toBe(true);
    expect(proof.contextPack.towerValueClaims.every((claim) => claim.realizedValueLanguageAllowed === false)).toBe(
      true,
    );
  });
});
