import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
} from "../mve-profile";
import { toContractOptimizationPersistenceRows } from "../persistence";

describe("Source contract optimization MVE", () => {
  it("turns a rich existing-contract evidence pack into a sourcing-critical profile", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    expect(profile.decisionUse).toBe("rebid_or_renegotiate");
    expect(profile.syntheticDemo).toBe(true);
    expect(profile.contractBaseline.evidenceCount).toBeGreaterThanOrEqual(7);
    expect(profile.minimumViableExtractionAreas).toHaveLength(6);
    expect(profile.minimumViableExtractionAreas.every((area) => area.status !== "missing")).toBe(true);
    expect(profile.findings.map((finding) => finding.category)).toEqual(
      expect.arrayContaining([
        "price_leakage",
        "sla_credit_leakage",
        "staffing_coverage_gap",
        "service_performance_risk",
        "renewal_window",
      ]),
    );
    expect(profile.levers.map((lever) => lever.leverType)).toEqual(
      expect.arrayContaining([
        "recover_invoice_leakage",
        "tighten_service_credit_economics",
        "reprice_staffing_coverage",
        "force_productivity_commitment",
        "use_renewal_window",
      ]),
    );
  });

  it("quantifies only evidenced commercial leakage and labels the rest as opportunity to test", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const invoiceLever = profile.levers.find(
      (lever) => lever.leverType === "recover_invoice_leakage",
    );
    const productivityLever = profile.levers.find(
      (lever) => lever.leverType === "force_productivity_commitment",
    );

    expect(invoiceLever?.valueBasis).toBe("evidenced");
    expect(invoiceLever?.annualImpactHighUsd).toBeGreaterThan(0);
    expect(productivityLever?.valueBasis).toBe("opportunity_to_test");
    expect(productivityLever?.annualImpactHighUsd).toBeNull();
  });

  it("keeps the boundary away from generic document browsing", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    expect(profile.extractionBoundary).toMatch(/Minimum viable extraction/i);
    expect(profile.extractionBoundary).toMatch(/not a general-purpose contract Q&A/i);
    expect(profile.findings.every((finding) => finding.recommendedAction.length > 30)).toBe(true);
    expect(profile.findings.every((finding) => finding.evidenceLabels.length > 0)).toBe(true);
  });

  it("maps the profile into structured Source persistence rows", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const rows = toContractOptimizationPersistenceRows(profile);

    expect(rows.profile.tenant_key).toBe("skyharbor-air");
    expect(rows.profile.source_type).toBe("synthetic_demo");
    expect(rows.profile.profile_payload.findings).toHaveLength(profile.findings.length);
    expect(rows.findings).toHaveLength(profile.findings.length);
    expect(rows.levers).toHaveLength(profile.levers.length);
    expect(rows.findings[0]).toHaveProperty("sourcing_implication");
    expect(rows.levers.every((lever) => lever.buyer_ask.length > 20)).toBe(true);
  });
});
