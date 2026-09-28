import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
} from "../phase-capture-contract";

// Regression guard for the P1–P5 phase-workspace capture Save.
//
// The standalone Moves workspace renders one editable capture card per
// section and, on Save, POSTs { [sectionId]: value } to the phase-capture route,
// which only counts fields whose key matches a canonical contract section key
// (evaluatePhaseCapture). The workspace card ids MUST therefore equal the
// contract keys.
//
// They once drifted (cards used ids like "sponsor"/"success-metrics" while the
// contract required "sponsor_commitment"/"success_criteria"), so every Save
// persisted 0 fields, Approve never enabled, and no Move could advance past its
// gate. The workspace now DERIVES its cards from getPhaseCaptureSections, and
// these tests lock the invariant so the drift cannot silently return.

describe("phase-capture workspace ↔ contract key alignment", () => {
  const WORKFLOW_PHASES = [0, 1, 2, 3, 4, 5];
  const businessChangeAssessment = JSON.stringify({
    expectedWorkflowChange: "none",
    expectedRoleAccountabilityChange: "none",
    adoptionOwner: "Business analytics lead",
    adoptionResponsibility: "business",
    evidenceReference: "P1 operating-owner interview",
    validatedBy: "Business sponsor",
  });

  function validCapture(phase: number) {
    const items = Object.fromEntries(
      getPhaseCaptureSections(phase).map((section) => [
        section.key,
        `${section.label} captured`,
      ]),
    );
    if (phase === 1)
      items.business_change_assessment = businessChangeAssessment;
    if (phase === 2) {
      items.solution_route_validation = JSON.stringify({
        businessChangeAssessmentSnapshot: JSON.parse(businessChangeAssessment),
        solutionOutput: "reports_dashboards",
        workflowChange: "none",
        roleAccountabilityChange: "none",
        evidenceReference: "evidence-p2-1",
        decision: "confirm",
        selectedRoute: "technical_product",
        correctionRationale: "",
        validatedBy: "Business sponsor",
      });
    }
    if (phase === 4) {
      const shared = {
        pairId: "pair-1",
        workPackage: "Reporting foundation",
        role: "Data engineer",
        lowHours: 10,
        baseHours: 20,
        highHours: 30,
        rateSource: "Planning rate card",
        inputBasis: "assumption",
        evidenceReference: "",
        assumption: "Bounded first release",
        confidence: "medium",
        aiEligiblePct: 0,
        aiToolAssumption: "",
        humanReviewHours: 0,
      };
      items.estimates_capacity = JSON.stringify({
        currency: "USD",
        reviewer: "Finance reviewer",
        reviewConfirmed: true,
        sourceNotes: "",
        rows: [
          { ...shared, deliveryModel: "internal", ratePerHour: 100 },
          { ...shared, deliveryModel: "vendor", ratePerHour: 150 },
        ],
      });
    }
    return items;
  }

  it.each(WORKFLOW_PHASES)(
    "phase %s exposes canonical capture keys that fully satisfy the route",
    (phase) => {
      const sections = getPhaseCaptureSections(phase);
      expect(sections.length).toBeGreaterThan(0);

      // A payload keyed by the contract keys (exactly what the derived cards
      // send) must be accepted as complete.
      const items = validCapture(phase);
      const result = evaluatePhaseCapture(
        phase,
        items,
        phase === 2
          ? {
              businessChangeAssessment,
              approvedEvidenceReferences: ["evidence-p2-1"],
            }
          : {},
      );
      expect(result.complete).toBe(true);
      expect(result.missing).toEqual([]);
    },
  );

  it("rejects the historical drifted P1 workspace ids (the bug this fix closes)", () => {
    // The exact card ids the P1 workspace used to send. None match the P1
    // contract keys, so the route must persist nothing.
    const driftedItems = {
      sponsor: "VP / Chief AI Officer committed.",
      stakeholders: "GC, VP Vendor Mgmt, Legal Ops.",
      success_metrics: "Cycle-time reduction 30-40%.",
      value_range: "Mid-seven-figure avoided leakage.",
      scope: "Priority supplier and technology contracts.",
    };
    const result = evaluatePhaseCapture(1, driftedItems);
    expect(result.complete).toBe(false);
    // Every required P1 section is still missing under the drifted keys.
    expect(result.missing).toEqual(
      getPhaseCaptureSections(1).map((s) => s.label),
    );
  });

  it("rejects the historical drifted P0 workspace ids", () => {
    const driftedItems = {
      seed: "Contract obligation leakage is slowing intake.",
      sponsor_candidate: "VP Legal Ops and VP Vendor Management.",
      value_hypothesis: "Reduce missed obligations and cycle time.",
      scope_boundary: "Priority supplier and technology contracts.",
      evidence_family: "Contract samples, intake logs, obligation registers.",
    };
    const result = evaluatePhaseCapture(0, driftedItems);
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(
      getPhaseCaptureSections(0).map((s) => s.label),
    );
  });

  it("P3–P5 each have a phase-specific capture contract (not the generic binder)", () => {
    const p3 = getPhaseCaptureSections(3).map((s) => s.key);
    const p4 = getPhaseCaptureSections(4).map((s) => s.key);
    const p5 = getPhaseCaptureSections(5).map((s) => s.key);
    // Phase-specific first sections
    expect(p3[0]).toBe("solution_approach");
    expect(p4[0]).toBe("roadmap_sequencing");
    expect(p5[0]).toBe("mobilization_plan");
    // Depth matches P2 (7 sections), and each closes with a recommendation.
    for (const keys of [p3, p4, p5]) {
      expect(keys).toHaveLength(7);
      expect(keys[keys.length - 1]).toBe("recommendation");
    }
    // No longer the generic binder.
    expect(p3).not.toContain("phase_decisions");
  });

  it("phase 6+ still falls back to the generic capture binder", () => {
    expect(getPhaseCaptureSections(6).map((s) => s.key)).toEqual([
      "phase_decisions",
      "evidence_used",
      "open_questions",
      "approval_rationale",
    ]);
  });
});
