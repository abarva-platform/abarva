import path from "node:path";
import {
  readMovesPricingReferencePackDir,
  selectMovesRateFromReferencePack,
  selectMovesRatesForRoleMixFromReferencePack,
} from "../moves-pricing-reference-pack";

const packDir = path.resolve(__dirname, "../../../../../datasets/reference/pricing-engine-v1");

describe("moves pricing reference pack reader", () => {
  const pack = readMovesPricingReferencePackDir(packDir);

  it("loads the generated reference extension policy and materialized rows", () => {
    expect(pack.rateSelectionPolicies.map((policy) => policy.rateSourceKind)).toEqual([
      "deal_override",
      "tenant_contracted_rate",
      "tenant_internal_rate",
      "industry_overlay",
      "global_reference",
    ]);
    expect(pack.rateSelectionPolicies[0].allowUnapproved).toBe(false);
    expect(pack.rateSelectionPolicies[0].eligibleForCommittedSolutionPrice).toBe(true);
    expect(pack.materializedProviderRates.length).toBeGreaterThan(60000);
    expect(pack.materializedInternalRates.length).toBeGreaterThan(15000);
  });

  it("selects an onshore healthcare partner reference row from the real CSVs", () => {
    const selected = selectMovesRateFromReferencePack(
      {
        roleCode: "ROL-009",
        levelCode: "LVL-02",
        technologyCode: "TECH-EPIC-CLARITY",
        locationCode: "LOC-ATLANTA",
        providerClassCode: "SI-T1",
        commercialModel: "partner_market_bill_rate",
      },
      pack,
    );

    expect(selected.selected).toBe(true);
    if (!selected.selected) return;
    expect(selected.sourceKind).toBe("global_reference");
    expect(selected.baseRateCentsPerHour).toBe(85313);
    expect(selected.towerCode).toBe("TWR-02");
    expect(selected.capabilityCode).toBe("CAP-006");
    expect(selected.technologyCode).toBe("TECH-EPIC-CLARITY");
    expect(selected.planningAssumption).toBe(true);
    expect(selected.eligibleForCommittedSolutionPrice).toBe(false);
  });

  it("selects offshore platform delivery only as a review-required industry overlay", () => {
    const selected = selectMovesRateFromReferencePack(
      {
        roleCode: "ROL-020",
        levelCode: "LVL-08",
        locationCode: "LOC-INDIA-TIER-1",
        providerClassCode: "SI-T1",
        commercialModel: "partner_market_bill_rate",
      },
      pack,
    );

    expect(selected.selected).toBe(true);
    if (!selected.selected) return;
    expect(selected.sourceKind).toBe("industry_overlay");
    expect(selected.requiresManualReview).toBe(true);
    expect(selected.baseRateCentsPerHour).toBe(9900);
  });

  it("returns an honest gap for blocked offshore regulated-domain delivery", () => {
    const selected = selectMovesRateFromReferencePack(
      {
        roleCode: "ROL-009",
        levelCode: "LVL-02",
        technologyCode: "TECH-EPIC-CLARITY",
        locationCode: "LOC-INDIA-TIER-1",
        providerClassCode: "SI-T2",
        commercialModel: "partner_market_bill_rate",
      },
      pack,
    );

    expect(selected.selected).toBe(false);
    if (selected.selected) return;
    expect(selected.gapReason).toMatch(/no eligible Moves pricing rate/);
  });

  it("selects internal scarcity-adjusted cost rows from the real CSVs", () => {
    const selected = selectMovesRateFromReferencePack(
      {
        roleCode: "ROL-009",
        levelCode: "LVL-02",
        technologyCode: "TECH-EPIC-CLARITY",
        locationCode: "LOC-ATLANTA",
        commercialModel: "internal_scarcity_adjusted_cost",
      },
      pack,
    );

    expect(selected.selected).toBe(true);
    if (!selected.selected) return;
    expect(selected.providerClassCode).toBe("INTERNAL");
    expect(selected.commercialModel).toBe("internal_scarcity_adjusted_cost");
    expect(selected.baseRateCentsPerHour).toBe(49291);
  });

  it("can batch-select rates for role mix entries", () => {
    const results = selectMovesRatesForRoleMixFromReferencePack(
      [
        { roleCode: "ROL-009", levelCode: "LVL-02" },
        { roleCode: "ROL-010", levelCode: "LVL-04" },
      ],
      {
        technologyCode: "TECH-EPIC-CLARITY",
        locationCode: "LOC-ATLANTA",
        providerClassCode: "SI-T1",
        commercialModel: "partner_market_bill_rate",
      },
      pack,
    );

    expect(results.size).toBe(2);
    expect(results.get("ROL-009:LVL-02")).toEqual(expect.objectContaining({ selected: true }));
    expect(results.get("ROL-010:LVL-04")).toEqual(expect.objectContaining({ selected: true }));
  });
});
