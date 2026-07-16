import { buildP0PhaseCaptureValues } from "../p0-phase-capture";
import { evaluatePhaseCapture } from "../phase-capture-contract";

describe("P0 origination charter -> phase capture", () => {
  it("maps the seven Start a Move fields into the durable P0 capture contract", () => {
    const values = buildP0PhaseCaptureValues({
      name: "Member Service Agent Assist",
      problemStatement:
        "Members experience long calls because agents navigate multiple systems.",
      targetOutcome:
        "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
      timelineHorizon:
        "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
      charter: {
        scaffold: {
          problem_statement:
            "Members experience long calls because agents navigate multiple systems.",
          archetype: "Contact Center Agent Assist",
          sponsor_candidate:
            "Chief Digital and Information Officer with VP Operations.",
          scope_boundary:
            "In: claims status, prior auth, eligibility, benefits, CRM history, knowledge lookup. Out: clinical decisions.",
          evidence_family:
            "Member-service metrics, call transcripts, CRM history, claims/auth/benefits samples, knowledge base, systems inventory.",
          value_hypothesis:
            "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
          foundation_readiness:
            "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
        },
      },
    });

    expect(values.business_trigger).toContain("Members experience long calls");
    expect(values.problem_statement).toContain("Members experience long calls");
    expect(values.affected_function_process).toContain("claims status");
    expect(values.initial_value_hypothesis).toContain("Reduce avoidable handle time");
    expect(values.stakeholder_owner_view).toContain("Chief Digital");
    expect(values.known_evidence).toContain("Member-service metrics");
    expect(values.missing_evidence_open_questions).toContain("P1/P2 must validate");
    expect(values.recommendation_to_advance).toContain("Advance to P1 Charter");

    const evaluation = evaluatePhaseCapture(0, values);
    expect(evaluation.complete).toBe(true);
    expect(evaluation.missing).toEqual([]);
  });

  it("stays incomplete when the saved charter is missing required P0 inputs", () => {
    const values = buildP0PhaseCaptureValues({
      name: "Thin Move",
      problemStatement: "Problem only.",
      charter: { scaffold: { problem_statement: "Problem only." } },
    });

    const evaluation = evaluatePhaseCapture(0, values);
    expect(evaluation.complete).toBe(false);
    expect(evaluation.missing).toContain("Initial value hypothesis");
    expect(evaluation.missing).toContain("Stakeholder / owner view");
    expect(evaluation.missing).toContain("Known evidence");
  });
});
