import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "../phase-capture-contract";

describe("phase-capture-contract", () => {
  it("defines a complete P0 capture binder for real Move origination", () => {
    const sections = getPhaseCaptureSections(0);
    expect(sections.map((section) => section.key)).toEqual([
      "business_trigger",
      "problem_statement",
      "affected_function_process",
      "initial_value_hypothesis",
      "stakeholder_owner_view",
      "known_evidence",
      "missing_evidence_open_questions",
      "recommendation_to_advance",
    ]);
    expect(sections.every((section) => section.required)).toBe(true);
  });

  it("blocks completion when a required section is missing", () => {
    const result = evaluatePhaseCapture(0, {
      business_trigger: "Invoice exceptions are delaying AP close.",
      problem_statement: "Exception handling is fragmented.",
    });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("Affected function/process");
    expect(result.missing).toContain("Recommendation to advance");
  });

  it("marks capture complete only when every required section has content", () => {
    const values = Object.fromEntries(
      getPhaseCaptureSections(0).map((section) => [
        section.key,
        `${section.label} captured`,
      ]),
    );
    const result = evaluatePhaseCapture(0, values);
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.sections.every((section) => section.complete)).toBe(true);
  });

  it("uses stable module keys that the generation guard can read", () => {
    expect(phaseCaptureModuleKey(0, "business_trigger")).toBe(
      "phase_0_business_trigger",
    );
    expect(phaseCaptureModuleKey(2, "current_state_findings")).toBe(
      "phase_2_current_state_findings",
    );
  });
});
