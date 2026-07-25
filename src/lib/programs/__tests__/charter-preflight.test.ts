import { computeCharterPreflight } from "../charter-preflight";

describe("computeCharterPreflight", () => {
  it("is ready when every Charter section has real P0 capture backing", () => {
    const result = computeCharterPreflight({
      business_trigger: "New leadership mandate and a spike in escalations.",
      problem_statement: "Agents navigate too many systems per call.",
      affected_function_process: "Member-services contact center.",
      scope_out: "Clinical decisions and appeals.",
      initial_value_hypothesis: "Reduce handle time and repeat contact.",
      outcomes_success: "Lower handle time, validated against baseline.",
      discovery_questions: "Hypothesis: repeat contacts trace to a few intents.",
      stakeholder_owner_view: "COO as sponsor.",
      known_evidence: "Call metrics.",
      missing_evidence_open_questions: "Depends on the CRM migration.",
      recommendation_to_advance: "Advance to P1 Charter.",
    });

    expect(result.ready).toBe(true);
    expect(result.missingRequiredInputs).toEqual([]);
    expect(result.sourceCoverageBySection.charter_decision.status).toBe(
      "complete",
    );
    expect(result.sourceCoverageBySection.charter_decision.sourceRefs).toEqual(
      ["p0_capture:problem_statement", "p0_capture:initial_value_hypothesis"],
    );
    expect(result.sourceCoverageBySection.discovery_preparation.status).toBe(
      "complete",
    );
  });

  it("marks a section missing when none of its backing P0 keys have content", () => {
    const result = computeCharterPreflight({
      problem_statement: "Agents navigate too many systems per call.",
    });

    expect(result.ready).toBe(false);
    expect(result.missingRequiredInputs).toContain("sponsorship_governance");
    expect(result.missingRequiredInputs).toContain("scope");
    expect(result.sourceCoverageBySection.sponsorship_governance.status).toBe(
      "missing",
    );
    expect(
      result.sourceCoverageBySection.sponsorship_governance.sourceRefs,
    ).toEqual([]);
  });

  it("marks a section partial when only some of its backing P0 keys have content", () => {
    const result = computeCharterPreflight({
      problem_statement: "Agents navigate too many systems per call.",
      // initial_value_hypothesis intentionally absent
    });

    expect(result.sourceCoverageBySection.charter_decision.status).toBe(
      "partial",
    );
    // A partial section is not "missing" — it does not block readiness.
    expect(result.missingRequiredInputs).not.toContain("charter_decision");
  });

  it("covers exactly the Charter's 9 sections (redesigned 2026-07-25)", () => {
    const result = computeCharterPreflight({});
    expect(Object.keys(result.sourceCoverageBySection)).toEqual([
      "charter_decision",
      "opportunity_context",
      "intended_outcomes",
      "scope",
      "success_measures",
      "sponsorship_governance",
      "known_constraints_dependencies",
      "discovery_preparation",
      "authorization_next_steps",
    ]);
  });
});
