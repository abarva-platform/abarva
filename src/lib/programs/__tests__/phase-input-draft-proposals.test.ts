import {
  buildAvaPhaseInputProposals,
  describeAvaPhaseInputDraftRefusal,
} from "../phase-input-draft-proposals";

describe("phase-input-draft-proposals", () => {
  it("drafts P1 charter inputs from approved P0 capture with evidence refs", () => {
    const proposals = buildAvaPhaseInputProposals({
      phase: 1,
      currentValues: {},
      upstreamValuesByPhase: {
        0: {
          affected_function_process: "Airport turnaround operations",
          scope_out: "Crew scheduling policy changes",
          outcomes_success:
            "Reduce recovery handoff delay with evidenced controls.",
          stakeholder_owner_view:
            "Sponsor: COO. Technology owner: VP Operations Systems.",
          known_evidence: "IROPS workshop notes and recovery queue extract.",
          discovery_questions:
            "Which handoff creates the largest delay and rework?",
          missing_evidence_open_questions:
            "Finance baseline and station-level delay volume are missing.",
        },
      },
    });

    expect(proposals.map((proposal) => proposal.fieldKey)).toEqual([
      "sponsor_commitment",
      "scope_boundary",
      "success_criteria",
      "stakeholder_map",
      "decision_rights",
      "evidence_plan",
    ]);
    expect(
      proposals.every((proposal) => proposal.evidenceRefs.length > 0),
    ).toBe(true);
    expect(
      proposals.find((proposal) => proposal.fieldKey === "scope_boundary")
        ?.proposedValue,
    ).toContain("In scope: Airport turnaround operations");
    expect(
      proposals.find((proposal) => proposal.fieldKey === "evidence_plan")
        ?.sourceClasses,
    ).toContain("evidence_gap");
  });

  it("does not emit proposal rows without cited upstream source text", () => {
    const proposals = buildAvaPhaseInputProposals({
      phase: 1,
      currentValues: {},
      upstreamValuesByPhase: { 0: {} },
    });

    expect(proposals).toEqual([]);
  });

  it("explains that a complete phase has nothing empty to draft", () => {
    const currentValues = {
      sponsor_commitment: "Sponsor commitment is already captured.",
      scope_boundary: "Scope is already captured.",
      success_criteria: "Success criteria are already captured.",
      stakeholder_map: "Stakeholder map is already captured.",
      decision_rights: "Decision rights are already captured.",
      evidence_plan: "Evidence plan is already captured.",
    };

    expect(
      buildAvaPhaseInputProposals({
        phase: 1,
        currentValues,
        upstreamValuesByPhase: { 0: {} },
      }),
    ).toEqual([]);
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 1,
        currentValues,
        upstreamValuesByPhase: { 0: {} },
      }),
    ).toContain("already have current values");
  });

  it("keeps the cited-source refusal when fields are empty but upstream context is absent", () => {
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 1,
        currentValues: {},
        upstreamValuesByPhase: { 0: {} },
      }),
    ).toContain("No cited draft is available");
  });
});
