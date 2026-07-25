import { buildP0PhaseCaptureValues } from "../p0-phase-capture";
import { evaluatePhaseCapture } from "../phase-capture-contract";

describe("P0 origination charter -> phase capture", () => {
  it("maps the ten Start a Move fields into the durable P0 capture contract", () => {
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
          scope_in:
            "Claims status, prior auth, eligibility, benefits, CRM history, knowledge lookup.",
          scope_out: "Clinical decisions and appeals adjudication.",
          evidence_family:
            "Member-service metrics, call transcripts, CRM history, claims/auth/benefits samples, knowledge base, systems inventory.",
          value_hypothesis:
            "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
          outcomes_success:
            "Lower handle time and fewer transfers, validated against a P2 baseline.",
          discovery_questions:
            "Hypothesis: most repeat contacts trace to a handful of intents. Question: which systems do agents use per intent?",
          foundation_readiness:
            "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
        },
      },
    });

    expect(values.business_trigger).toContain("Members experience long calls");
    expect(values.problem_statement).toContain("Members experience long calls");
    expect(values.affected_function_process).toContain("Claims status");
    expect(values.scope_out).toContain("Clinical decisions");
    expect(values.initial_value_hypothesis).toContain("Reduce avoidable handle time");
    expect(values.outcomes_success).toContain("Lower handle time");
    expect(values.discovery_questions).toContain("Hypothesis");
    expect(values.stakeholder_owner_view).toContain("Chief Digital");
    expect(values.known_evidence).toContain("Member-service metrics");
    expect(values.missing_evidence_open_questions).toContain("P1/P2 must validate");
    expect(values.recommendation_to_advance).toContain("Advance to P1 Charter");

    const evaluation = evaluatePhaseCapture(0, values);
    expect(evaluation.complete).toBe(true);
    expect(evaluation.missing).toEqual([]);
  });

  it("still reads the legacy blended scope_boundary field for Moves originated before the scope split", () => {
    const values = buildP0PhaseCaptureValues({
      name: "Legacy Move",
      problemStatement: "Problem statement.",
      charter: {
        scaffold: {
          problem_statement: "Problem statement.",
          scope_boundary: "In: claims status. Out: clinical decisions.",
        },
      },
    });

    expect(values.affected_function_process).toContain("claims status");
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
