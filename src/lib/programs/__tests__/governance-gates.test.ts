import { findGateRule } from "@/lib/programs/governance";

describe("program governance gate map (6-phase doctrine)", () => {
  it("defines six gate transitions: P0→P1 through P5→Tower", () => {
    expect(findGateRule(0, 1)).toBeTruthy();
    expect(findGateRule(1, 2)).toBeTruthy();
    expect(findGateRule(2, 3)).toBeTruthy();
    expect(findGateRule(3, 4)).toBeTruthy();
    expect(findGateRule(4, 5)).toBeTruthy();
    expect(findGateRule(5, 6)).toBeTruthy();
  });

  it("treats P5 → Tower as the terminal mobilization handoff gate", () => {
    const rule = findGateRule(5, 6);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe("sponsor");
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        "handoff_package_signed_off",
        "value_measurement_contract_signed_off",
        "launch_readiness_attested",
        "tower_cadence_defined",
        "p5_open_risks_recorded",
      ]),
    );
  });

  it("treats P0 → P1 (Originate → Charter) as the chartering gate", () => {
    const rule = findGateRule(0, 1);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe("sponsor");
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        "program_seed_recorded",
        "value_hypothesis_seed",
        "sponsor_assigned",
        "discovery_funding_envelope",
        "initial_scope_boundary",
        "evidence_family_selected",
      ]),
    );
  });

  it("treats P1 → P2 (Charter → Discover & Diagnose) as a sponsor-signed charter gate", () => {
    const rule = findGateRule(1, 2);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe("sponsor");
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining(["charter_signed_off", "sponsor_assigned"]),
    );
  });

  it("treats P2 → P3 (Diagnose → Design) as a discovery synthesis gate", () => {
    const rule = findGateRule(2, 3);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe("sponsor");
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        "discovery_report_signed_off",
        "discovery_notes_ingested",
        "discovery_baseline_attested",
        "discovery_stakeholders_named",
        "p2_readiness_cleared",
      ]),
    );
  });

  it("treats P3 → P4 (Design → Roadmap) as a signed-design to business-case gate", () => {
    const rule = findGateRule(3, 4);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe("sponsor");
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        "design_approved",
        "requirements_design_outcome_trace",
        "phase_3_findings_written",
        "cxo_interview_complete",
      ]),
    );
  });

  it("treats P4 → P5 (Roadmap → Mobilize) as the funding + mobilization gate", () => {
    const rule = findGateRule(4, 5);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe("sponsor");
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        "execution_roadmap_drafted",
        "business_case_approved",
        "execution_milestones_defined",
        "execution_success_criteria_defined",
        "readiness_and_change_plan_signed_off",
        "funding_approval_recorded",
        "sponsor_alignment_confirmed",
      ]),
    );
  });

  describe("classify fast lane (moves_classify_fast_lane_v1)", () => {
    it("returns null for (1, 5) exactly as before this feature existed when fastLaneEligible is omitted", () => {
      expect(findGateRule(1, 5)).toBeNull();
    });

    it("returns null for (1, 5) when fastLaneEligible is explicitly false", () => {
      expect(findGateRule(1, 5, { fastLaneEligible: false })).toBeNull();
    });

    it("returns the fast-lane rule for (1, 5) only when fastLaneEligible is true", () => {
      const rule = findGateRule(1, 5, { fastLaneEligible: true });
      expect(rule).toBeTruthy();
      expect(rule?.hard).toBe(true);
      expect(rule?.approverRole).toBe("sponsor");
      expect(rule?.checks.map((c) => c.key)).toEqual([
        "fast_lane_decision_recorded",
      ]);
    });

    it("never applies fastLaneEligible to any other pair, even adjacent ones", () => {
      expect(findGateRule(0, 1, { fastLaneEligible: true })).toEqual(
        findGateRule(0, 1),
      );
      expect(findGateRule(1, 2, { fastLaneEligible: true })).toEqual(
        findGateRule(1, 2),
      );
      expect(findGateRule(4, 5, { fastLaneEligible: true })).toEqual(
        findGateRule(4, 5),
      );
      expect(findGateRule(2, 5, { fastLaneEligible: true })).toBeNull();
      expect(findGateRule(1, 4, { fastLaneEligible: true })).toBeNull();
    });

    it("leaves the standard P1 -> P2 rule completely untouched (still returned normally) regardless of fastLaneEligible", () => {
      const standard = findGateRule(1, 2);
      const withFastLaneFlag = findGateRule(1, 2, { fastLaneEligible: true });
      expect(withFastLaneFlag).toEqual(standard);
      expect(withFastLaneFlag?.checks.map((c) => c.key)).toEqual(
        expect.arrayContaining(["charter_signed_off", "sponsor_assigned"]),
      );
    });
  });
});
