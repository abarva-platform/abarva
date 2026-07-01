import {
  buildIndustrialCioBackofficePacket,
  composeIndustrialCioBackofficeAnswer,
  parseDecisionBranch,
  type ClaimMaturity,
} from "../industrial-cio-backoffice-readiness";

const REQUIRED_MATURITIES: ClaimMaturity[] = [
  "loaded_fact",
  "relationship_inferred",
  "abarva_assessment",
  "industry_context",
  "client_signoff_required",
  "missing_evidence",
];

describe("Industrial CIO back-office readiness packet", () => {
  it("builds the Shared Services value-office packet from existing Industrial V6 rows", () => {
    const packet = buildIndustrialCioBackofficePacket();

    expect(packet.functions.length).toBeGreaterThanOrEqual(10);
    expect(packet.ownership.length).toBeGreaterThanOrEqual(8);
    expect(packet.systems.length).toBeGreaterThanOrEqual(10);
    expect(packet.dataAssets.length).toBeGreaterThanOrEqual(10);
    expect(packet.programs.length).toBeGreaterThanOrEqual(8);
    expect(packet.aiInitiatives.length).toBeGreaterThanOrEqual(8);
    expect(packet.risksControls.length).toBeGreaterThanOrEqual(8);
    expect(packet.metrics.length).toBeGreaterThanOrEqual(8);
    expect(
      packet.lighthouseUseCases.map((item) => item.name).join("\n"),
    ).toMatch(/Kyriba|Finance close|ServiceNow|HR and Legal/i);
    expect(packet.sourceFiles).toEqual(
      expect.arrayContaining([
        "V6_02_business_functions.csv",
        "V6_05_applications_systems.csv",
        "V6_10_ai_initiatives.csv",
        "V6_11_operations_risk_controls.csv",
        "V6_14_metric_definitions.csv",
      ]),
    );
  });

  it("classifies claim maturity and keeps HR/legal and value claims behind evidence boundaries", () => {
    const packet = buildIndustrialCioBackofficePacket();
    const maturities = packet.claimMaturity.map((claim) => claim.maturity);

    for (const maturity of REQUIRED_MATURITIES) {
      expect(maturities).toContain(maturity);
    }
    expect(
      packet.claimMaturity.find(
        (claim) => claim.maturity === "client_signoff_required",
      )?.statement,
    ).toMatch(/Finance attestation/i);
    expect(packet.missingEvidenceChecklist.join("\n")).toMatch(
      /HR and Legal source-system|Finance-attested baseline/i,
    );
    expect(
      packet.claimMaturity.map((claim) => claim.statement).join("\n"),
    ).not.toMatch(
      /exact ROI is proven|HR is ready to scale|Legal is ready to scale/i,
    );
  });

  it("generates CIO branch choices instead of fabricating missing values", () => {
    const packet = buildIndustrialCioBackofficePacket();

    expect(packet.branch.choices.map((choice) => choice.id)).toEqual([
      "use_planning_assumptions",
      "enter_current_values",
      "start_treasury_finance",
      "expand_hr_legal_discovery",
      "create_value_office_blueprint",
    ]);
    expect(packet.branch.customAllowed).toBe(true);
    expect(packet.branch.rawBlock).toContain("Use planning assumptions");
    expect(packet.branch.rawBlock).toContain("Enter current values");
  });

  it("preserves Claude-owned branch wording while exposing renderable buttons", () => {
    const answer = composeIndustrialCioBackofficeAnswer(
      "How should Morgan Street stand up the Value Office?",
    );
    const parsed = parseDecisionBranch(answer);

    expect(parsed.visibleText).toContain("My point of view");
    expect(parsed.visibleText).toContain("What this means");
    expect(parsed.visibleText).toContain(
      "What is missing before board-grade claims",
    );
    expect(parsed.branch?.choices[0]?.label).toBe("Use planning assumptions");
    expect(parsed.branch?.choices[3]?.label).toBe("Add HR/Legal discovery");
    expect(parsed.visibleText).not.toContain("[DECISION_BRANCH]");
  });

  it("answers hard CIO questions with a point of view and no invented precision", () => {
    const answer = composeIndustrialCioBackofficeAnswer(
      "Should we include HR and Legal in phase one?",
    );

    expect(answer).toContain("HR and Legal are credible next waves");
    expect(answer).toContain(
      "does not yet justify treating them as Phase 1 scale bets",
    );
    expect(answer).toContain("client-signoff");
    expect(answer).not.toMatch(
      /headcount reduction|exact ROI is proven|legal is ready to scale|HR is ready to scale/i,
    );
    expect(answer).toContain("[DECISION_BRANCH]");
  });
});
