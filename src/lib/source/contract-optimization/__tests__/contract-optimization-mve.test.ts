import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
} from "../mve-profile";
import { buildContractOptimizationBriefMarkdown } from "../brief";
import { toContractOptimizationPersistenceRows } from "../persistence";

describe("Source contract optimization MVE", () => {
  it("turns a rich existing-contract evidence pack into a sourcing-critical profile", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    expect(profile.decisionUse).toBe("rebid_or_renegotiate");
    expect(profile.syntheticDemo).toBe(true);
    expect(profile.contractBaseline.evidenceCount).toBeGreaterThanOrEqual(9);
    expect(profile.minimumViableExtractionAreas).toHaveLength(7);
    expect(profile.minimumViableExtractionAreas.every((area) => area.status !== "missing")).toBe(true);
    expect(profile.findings.map((finding) => finding.category)).toEqual(
      expect.arrayContaining([
        "price_leakage",
        "sla_credit_leakage",
        "staffing_coverage_gap",
        "scope_change_order_exposure",
        "service_performance_risk",
        "renewal_window",
      ]),
    );
    expect(profile.levers.map((lever) => lever.leverType)).toEqual(
      expect.arrayContaining([
        "recover_invoice_leakage",
        "tighten_service_credit_economics",
        "reprice_staffing_coverage",
        "convert_change_orders_to_catalog",
        "force_productivity_commitment",
        "use_renewal_window",
      ]),
    );
    expect(profile.recommendedPath.immediateAction).toMatch(/cure notice/i);
    expect(profile.recommendedPath.primaryPath).toMatch(/Renegotiate/i);
    expect(profile.recommendedPath.fallbackPath).toMatch(/competitive RFP/i);
    expect(profile.recommendedPath.doNotDo).toMatch(/Do not renew as-is/i);
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

  it("keeps staffing and change-order findings defensible with denominators and evidence", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const staffingFinding = profile.findings.find(
      (finding) => finding.category === "staffing_coverage_gap",
    );
    const changeOrderFinding = profile.findings.find(
      (finding) => finding.category === "scope_change_order_exposure",
    );

    expect(staffingFinding?.currentState).toMatch(/of 114\.0 committed FTE/i);
    expect(staffingFinding?.currentState).toMatch(/10\.5% variance/i);
    expect(staffingFinding?.currentState).toMatch(/affected towers/i);
    expect(changeOrderFinding?.currentState).toMatch(/change-order exposure/i);
    expect(changeOrderFinding?.evidenceLabels.join(" ")).toMatch(/Change-order and amendment ledger/i);
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

  it("renders a CXO-readable optimization brief without unit or priority leaks", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const brief = buildContractOptimizationBriefMarkdown(profile);

    expect(brief).toContain("8,610 tickets");
    expect(brief).toContain("44 per month");
    expect(brief).toContain("Timing: Immediate");
    expect(brief).toContain("Timing: Before renewal notice");
    expect(brief).toContain("Observed issue:");
    expect(brief).not.toContain("8610tickets");
    expect(brief).not.toContain("44per month");
    expect(brief).not.toContain("Value to test to Value to test");
    expect(brief).not.toMatch(/Priority: P[0-2]/);
    expect(brief).not.toContain("Current state:");
  });
});
