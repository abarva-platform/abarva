import {
  buildAvaPhaseInputProposals,
  describeAvaPhaseInputDraftRefusal,
} from "../phase-input-draft-proposals";
import { getPhaseCaptureSections } from "../phase-capture-contract";

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

  it.each([2, 3, 4, 5])(
    "does not copy P%d prior-phase values into phase-specific draft fields",
    (phase) => {
      const priorPhase = phase - 1;
      const sentinel = `UPSTREAM_ONLY_P${priorPhase}_MUST_NOT_BE_COPIED`;
      const proposals = buildAvaPhaseInputProposals({
        phase,
        currentValues: {},
        upstreamValuesByPhase: {
          [priorPhase]: {
            [getPhaseCaptureSections(priorPhase)[0].key]: sentinel,
          },
        },
      });

      expect(proposals).toEqual([]);
      expect(JSON.stringify(proposals)).not.toContain(sentinel);
      expect(
        describeAvaPhaseInputDraftRefusal({
          phase,
          currentValues: {},
          approvedEvidenceCount: 8,
          upstreamValuesByPhase: {
            [priorPhase]: {
              [getPhaseCaptureSections(priorPhase)[0].key]: sentinel,
            },
          },
        }),
      ).toContain("field-level evidence mapping");
    },
  );

  it("explains that a complete phase has nothing empty to draft", () => {
    const currentValues = {
      sponsor_commitment: "Sponsor commitment is already captured.",
      scope_boundary: "Scope is already captured.",
      success_criteria: "Success criteria are already captured.",
      stakeholder_map: "Stakeholder map is already captured.",
      decision_rights: "Decision rights are already captured.",
      evidence_plan: "Evidence plan is already captured.",
      business_change_assessment: "Business change owner is captured.",
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

  it("distinguishes present approved evidence from evidence mapped to a field", () => {
    expect(
      describeAvaPhaseInputDraftRefusal({
        phase: 2,
        currentValues: {},
        upstreamValuesByPhase: { 1: {} },
        approvedEvidenceCount: 8,
      }),
    ).toContain("8 approved P2 evidence items are available");
  });

  it("fails closed when the approved current-phase evidence read is unavailable", () => {
    const refusal = describeAvaPhaseInputDraftRefusal({
      phase: 2,
      currentValues: {},
      upstreamValuesByPhase: { 1: { sponsor_commitment: "prior context" } },
      approvedEvidenceUnavailable: true,
    });

    expect(refusal).toContain("could not be verified");
    expect(refusal).toContain("Prior-phase captures are context");
    expect(refusal).not.toContain("No approved P2 evidence is available");
  });
});
