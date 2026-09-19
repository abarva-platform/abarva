import {
  buildEvaluationBafoReadinessView,
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";

describe("evaluation / BAFO readiness decision support", () => {
  it("fails closed when no governed vendor response profiles are loaded", () => {
    const view = buildEvaluationBafoReadinessView({});

    expect(view.state).toBe("no_records");
    expect(view.received).toEqual([]);
    expect(view.comparable).toEqual([]);
    expect(view.blockers).toEqual([
      expect.objectContaining({
        vendorName: "All vendors",
        severity: "blocker",
        nextAction:
          "Load normalized vendor response packages before comparing vendors.",
      }),
    ]);
    expect(view.guardrail).toMatch(/does not select a winner/i);
  });

  it("summarizes received packages, comparability, blockers, and one next action without award claims", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );

    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
    });

    expect(view.state).toBe("blocked");
    expect(view.received).toHaveLength(3);
    expect(view.received.map((row) => row.vendorName).join(" ")).toMatch(
      /Vendor A|Vendor B|Vendor C/,
    );
    expect(view.comparable).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor B"),
          comparability: "blocked",
        }),
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          evidenceBasis: expect.any(Array),
        }),
      ]),
    );
    expect(view.blockers.length).toBeGreaterThan(0);
    expect(view.singleNextAction).toMatch(/baseline|pricing|staffing|coverage|SLA|evidence|score/i);
    expect(view.guardrail).toMatch(/does not select a winner/i);
    expect(JSON.stringify(view)).not.toMatch(
      /award approved|guaranteed savings|industry benchmark/i,
    );
  });

  it("keeps event profile sets separate so archetype language does not bleed across events", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "18439aee-9889-4e97-a444-4d9e43a85bd5",
      code: "LAKE-SHARED-SERVICES-AMS-2026",
      name: "Lakeshore Shared Services AMS",
      accountName: "Lakeshore Holdings",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );

    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
    });
    const text = JSON.stringify(view);

    expect(view.archetypeLine).toContain("Lakeshore Shared Services AMS");
    expect(view.archetypeLine).toContain("lakeshore");
    expect(text).toMatch(/Vendor A|Vendor B|Vendor C/i);
    expect(text).not.toMatch(/Airline Operations Support|IROPS|airport operations/i);
  });
});
