import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
} from "../mve-profile";
import { buildContractOptimizationBriefMarkdown } from "../brief";
import { computeContractOptimizationExposureRollup } from "../exposure";
import { toContractOptimizationPersistenceRows } from "../persistence";
import {
  buildContractOptimizationStoryPack,
  contractOptimizationStoryPromptPacket,
} from "../story-pack";
import {
  buildContractOptimizationCxoNarrativeReport,
  contractOptimizationDealPackFilename,
  renderContractOptimizationDealPackHtml,
} from "../cxo-exports";

describe("Source contract optimization MVE", () => {
  it("turns a rich existing-contract evidence pack into a sourcing-critical profile", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    expect(profile.decisionUse).toBe("rebid_or_renegotiate");
    expect(profile.syntheticDemo).toBe(true);
    expect(profile.contractBaseline.evidenceCount).toBeGreaterThanOrEqual(9);
    expect(profile.minimumViableExtractionAreas).toHaveLength(7);
    expect(
      profile.minimumViableExtractionAreas.every(
        (area) => area.status !== "missing",
      ),
    ).toBe(true);
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

  it("rolls up identified exposure as a CXO-readable annualized range", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const exposure = computeContractOptimizationExposureRollup(profile);

    expect(exposure.label).toBe(
      "approximately $3.6M-$4.8M annualized, subject to vendor cure review",
    );
    expect(exposure.lowUsd).toBeGreaterThan(3_500_000);
    expect(exposure.highUsd).toBeGreaterThan(4_700_000);
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
    expect(changeOrderFinding?.evidenceLabels.join(" ")).toMatch(
      /Change-order and amendment ledger/i,
    );
  });

  it("keeps the boundary away from generic document browsing", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    expect(profile.extractionBoundary).toMatch(/Minimum viable extraction/i);
    expect(profile.extractionBoundary).toMatch(
      /not a general-purpose contract Q&A/i,
    );
    expect(
      profile.findings.every(
        (finding) => finding.recommendedAction.length > 30,
      ),
    ).toBe(true);
    expect(
      profile.findings.every((finding) => finding.evidenceLabels.length > 0),
    ).toBe(true);
  });

  it("maps the profile into structured Source persistence rows", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const rows = toContractOptimizationPersistenceRows(profile);

    expect(rows.profile.tenant_key).toBe("skyharbor-air");
    expect(rows.profile.source_type).toBe("synthetic_demo");
    expect(rows.profile.profile_payload.findings).toHaveLength(
      profile.findings.length,
    );
    expect(rows.findings).toHaveLength(profile.findings.length);
    expect(rows.levers).toHaveLength(profile.levers.length);
    expect(rows.findings[0]).toHaveProperty("sourcing_implication");
    expect(rows.levers.every((lever) => lever.buyer_ask.length > 20)).toBe(
      true,
    );
  });

  it("creates deterministic visual insights for executive storytelling", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    expect(
      profile.visualInsights.exposureByDriver.length,
    ).toBeGreaterThanOrEqual(5);
    expect(profile.visualInsights.invoiceVarianceTrend).toHaveLength(6);
    expect(profile.visualInsights.invoiceVarianceTrend[0]).toMatchObject({
      month: "2026-01",
      varianceUsd: 65_000,
    });
    expect(
      profile.visualInsights.operationalPressure.map((metric) => metric.metric),
    ).toEqual(
      expect.arrayContaining([
        "Monthly AMS tickets",
        "Reopened incidents",
        "Emergency changes",
      ]),
    );
    expect(profile.visualInsights.staffingCoverage[0]).toMatchObject({
      tower: "Airline operations apps",
      gapFte: 6,
    });
  });

  it("renders a CXO-readable optimization brief without unit or priority leaks", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const brief = buildContractOptimizationBriefMarkdown(profile);

    expect(brief).toContain("8,610 tickets");
    expect(brief).toContain("44 per month");
    expect(brief).toContain("# AMS Contract Optimization Brief");
    expect(brief).toContain(
      "**Contract in scope:** SkyHarbor Air Application Managed Services Agreement.",
    );
    expect(brief).toContain("## Page 1: Executive Message");
    expect(brief).toContain("## Page 2: Where Value Is Leaking");
    expect(brief).toContain("## Page 3: Why It Is Happening");
    expect(brief).toContain("## Page 4: What Should Happen");
    expect(brief).toContain("### Decision Timeline");
    expect(brief).toContain("## Page 5: Commercial Negotiation Strategy");
    expect(brief).toContain(
      "SkyHarbor Air Application Managed Services Agreement should not be renewed under its current commercial baseline.",
    );
    expect(brief).toContain(
      "The contract commercial model no longer reflects today’s operating reality",
    );
    expect(brief).toContain(
      "| Sequence | Leakage driver | Executive readout |",
    );
    expect(brief).toContain(
      "| 1 | Invoice variance | Recover cash by reconciling unsupported variance before renewal pricing is accepted. |",
    );
    expect(brief).toContain(
      "| 5 | Productivity not priced back | Convert productivity claims into measurable, priced commitments. |",
    );
    expect(brief).toContain("### Commercial Opportunity Map");
    expect(brief).toContain(
      "| Recover cash | Recover unsupported invoice variance",
    );
    expect(brief).toContain("### Root-Cause Map");
    expect(brief).toContain("### Do-Nothing vs Renegotiate Scenario");
    expect(brief).toContain("### Business Impact Scorecard");
    expect(brief).toContain(
      "Cost | Recoverable leakage and normalized baseline economics",
    );
    expect(brief).toContain("business-critical service towers");
    expect(brief).toContain("## Strategy Consulting Exhibits");
    expect(brief).toContain("### Exhibit 1: Exposure Bridge and Buyer Action");
    expect(brief).toContain("### Exhibit 2: Invoice Variance Trend");
    expect(brief).toContain(
      "### Exhibit 3: Operational Pressure Versus Baseline",
    );
    expect(brief).toContain("### Exhibit 4: Staffing Coverage Reconciliation");
    expect(brief).toContain(
      "| Month | Contracted | Invoiced | Variance | Variance % | Trend |",
    );
    expect(brief).toContain("| 2026-06 | $3.2M | $3.4M | $166K | +5.2% |");
    expect(brief).toContain(
      "| Monthly AMS tickets | 7,420 tickets | 8,610 tickets | +16.0% |",
    );
    expect(brief).toContain(
      "should not be renewed under its current commercial baseline",
    );
    expect(brief).toContain("**Top findings:**");
    expect(brief).toContain("**Cure notice asks:**");
    expect(brief).toContain(
      "**Renewal deadline:** non-renewal notice date is 2026-09-30",
    );
    expect(brief).toContain(
      "**Identified exposure:** approximately $3.6M-$4.8M annualized, subject to vendor cure review",
    );
    expect(brief).toContain("## Procurement Appendix: Decision Snapshot");
    expect(brief).toContain("- Renewal posture: do not renew as-is.");
    expect(brief).toContain("### Finding 1:");
    expect(brief).toContain("### Lever 1:");
    expect(brief).toContain("Timing: Immediate");
    expect(brief).toContain("Timing: Before renewal notice");
    expect(brief).toContain("Observed issue:");
    expect(brief).not.toContain("8610tickets");
    expect(brief).not.toContain("44per month");
    expect(brief).not.toContain("Value to test to Value to test");
    expect(brief).not.toContain("↓");
    expect(brief).not.toMatch(/Priority: P[0-2]/);
    expect(brief).not.toContain("Current state:");
    expect(brief).not.toContain("SkyHarbor Air AMS Outsourcing RFP");
    expect(brief).not.toContain("SKYH-AMS-RFP-2026");
    expect(brief).not.toContain("Airline Demo");
    expect(brief).not.toContain("airline-critical");
  });

  it("builds a validated CXO story pack and prompt packet for the contract optimizer", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const storyPack = buildContractOptimizationStoryPack(profile);
    const promptPacket = contractOptimizationStoryPromptPacket(profile);

    expect(storyPack.validation.ok).toBe(true);
    expect(storyPack.executiveMessage).toHaveLength(3);
    expect(storyPack.valueLeakageTree).toEqual([
      "Invoice variance",
      "Recurring change orders",
      "Weak SLA credits",
      "Underfilled staffing",
      "Productivity not priced back",
    ]);
    expect(storyPack.opportunityMap.map((row) => row.quadrant)).toEqual([
      "Recover cash",
      "Reduce future spend",
      "Reduce operational risk",
      "Increase vendor accountability",
    ]);
    expect(
      storyPack.businessImpactScorecard.map((row) => row.category),
    ).toEqual(
      expect.arrayContaining([
        "cost",
        "risk",
        "speed",
        "customer",
        "compliance",
      ]),
    );
    expect(storyPack.scenarios.map((scenario) => scenario.title)).toEqual([
      "If the buyer renews as-is",
      "If the buyer cures and renegotiates",
    ]);
    expect(JSON.stringify(storyPack)).not.toContain("If SkyHarbor");
    expect(JSON.stringify(storyPack)).not.toContain("airline-critical");
    expect(promptPacket).toHaveProperty("executiveMessage");
    expect(promptPacket).toHaveProperty("decisionAsk");
    expect(promptPacket).toHaveProperty("storySpine");
    expect(promptPacket).toHaveProperty("visualExhibits");
    expect(promptPacket).toHaveProperty("businessImpact");
    expect(promptPacket).toHaveProperty("evidenceBasis");
    expect(promptPacket).toHaveProperty("knownGaps");
    expect(promptPacket).toHaveProperty("forbiddenClaims");
  });

  it("keeps generic advisory language free of the synthetic fixture buyer", () => {
    const profile = buildContractOptimizationMveProfile({
      ...buildSkyHarborAmsExistingContractInput({
        tenantKey: "healthcare-client",
        sourceEventId: "healthcare-contract-optimization-2026",
      }),
      contractName: "Claims Platform Services Agreement",
      incumbentVendorName: "Incumbent services vendor",
    });
    const storyPack = buildContractOptimizationStoryPack(profile);
    const storyText = JSON.stringify(storyPack);
    const brief = buildContractOptimizationBriefMarkdown(profile);

    expect(storyText).toContain("Claims Platform Services Agreement");
    expect(storyText).toContain("If the buyer renews as-is");
    expect(storyText).not.toContain("If SkyHarbor");
    expect(storyText).not.toContain("SkyHarbor Air");
    expect(storyText).not.toContain("airline-critical");
    expect(brief).toContain(
      "Claims Platform Services Agreement should not be renewed",
    );
    expect(brief).toContain("business-critical service towers");
    expect(brief).not.toContain("If SkyHarbor");
    expect(brief).not.toContain("SkyHarbor Air");
    expect(brief).not.toContain("airline-critical");
  });

  it("renders a contract-optimization-specific CXO report without RFP or BAFO lifecycle drift", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const report = buildContractOptimizationCxoNarrativeReport({
      tenantName: "SkyHarbor Air",
      eventCode: "SKYH-AMS-CONTRACT-OPT-2026",
      eventName: "SkyHarbor Air AMS Contract Optimization",
      generatedAt: "2026-07-02T18:30:00.000Z",
      profile,
    });
    const text = JSON.stringify(report);

    expect(report.verdict).toBe("Do not renew as-is");
    expect(text.toLowerCase()).toContain("issue cure notice");
    expect(text).toContain("preserve RFP fallback");
    expect(text).toContain("$3.6M-$4.8M annualized");
    expect(text).toContain("2026-09-30");
    for (const forbidden of [
      "targeted BAFO",
      "Do not award yet",
      "Award / proceed",
      "Stage 4",
      "scored evaluation",
      "pricing is incomplete",
      "pricing is not complete",
      "vendor pricing is not comparable",
      "Sentinel",
      "seed gap",
      "no vendor contracts",
    ]) {
      expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("renders the contract optimization deal pack as an appendix, not a generic sourcing lifecycle pack", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );
    const html = renderContractOptimizationDealPackHtml({
      tenantName: "SkyHarbor Air",
      eventCode: "SKYH-AMS-CONTRACT-OPT-2026",
      eventName: "SkyHarbor Air AMS Contract Optimization",
      generatedAt: "2026-07-02T18:30:00.000Z",
      profile,
    });

    expect(html).toContain("Contract Optimization Appendix");
    expect(html).toContain("Do not renew as-is");
    expect(html).toContain("cure notice");
    expect(html).toContain("Contract Baseline");
    expect(html).toContain("Optimization Findings");
    expect(html).toContain("Negotiation Levers");
    expect(html).toContain("Evidence Inventory and Caveats");
    expect(html).toContain("SKYH-AMS-CONTRACT-OPT-2026");
    expect(html).not.toMatch(
      /Sentinel|Stage 0|Demand Challenge|targeted BAFO|Vendor pricing is not complete|seed gap|no vendor contracts/i,
    );
    expect(
      contractOptimizationDealPackFilename({
        eventCode: "SKYH-AMS-CONTRACT-OPT-2026",
        generatedAt: "2026-07-02T18:30:00.000Z",
      }),
    ).toBe(
      "abarva-source-contract-optimization-appendix-skyh-ams-contract-opt-2026-2026-07-02.html",
    );
  });
});
