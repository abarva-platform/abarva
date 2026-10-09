import {
  GATE_CRITERIA_UNEVALUATED_COUNT_LABEL,
  GATE_CRITERIA_UNEVALUATED_MARK_LABEL,
  GATE_CRITERIA_UNEVALUATED_NOTICE,
  GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL,
  gateCriteriaVerification,
} from "@/lib/programs/gate-criteria-verification";

describe("gateCriteriaVerification", () => {
  it("an evaluated list carries no notice", () => {
    expect(
      gateCriteriaVerification([{ verified: true }, { verified: true }]),
    ).toEqual({ evaluated: true });
  });

  it("an EMPTY list is evaluated — the terminal phase has no outgoing gate", () => {
    expect(gateCriteriaVerification([])).toEqual({ evaluated: true });
  });

  it("a single unverified entry is enough to stop the tally", () => {
    const state = gateCriteriaVerification([
      { verified: true },
      { verified: false },
    ]);
    expect(state.evaluated).toBe(false);
  });

  it("an entirely unverified list carries every label", () => {
    const state = gateCriteriaVerification([{ verified: false }]);
    expect(state).toEqual({
      evaluated: false,
      countLabel: GATE_CRITERIA_UNEVALUATED_COUNT_LABEL,
      markLabel: GATE_CRITERIA_UNEVALUATED_MARK_LABEL,
      notice: GATE_CRITERIA_UNEVALUATED_NOTICE,
      summaryLabel: GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL,
    });
  });
});

describe("the unevaluated vocabulary", () => {
  // Four slots render these on one screen (the ledger's tally, each ledger
  // row's mark, the ledger notice and the one-line gate summary). If two of
  // them carried the same string, a
  // `within(section).getByText(...)` assertion for either would match the other
  // and a revert to the met/unmet wording would survive.
  // [[feedback_a_badge_that_repeats_its_section_pill_lets_either_test_pass_on_the_other]]
  const labels = [
    GATE_CRITERIA_UNEVALUATED_COUNT_LABEL,
    GATE_CRITERIA_UNEVALUATED_MARK_LABEL,
    GATE_CRITERIA_UNEVALUATED_NOTICE,
    GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL,
  ];

  it("gives each slot its own wording", () => {
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("never reuses the met/unmet vocabulary the ledger already renders", () => {
    for (const label of labels) {
      expect(label).not.toContain("✓");
      expect(label).not.toContain("○");
      expect(label).not.toMatch(/\bhard met\b/);
      expect(label).not.toMatch(/^\d+ of \d+$/);
    }
  });

  it("the notice says an unchecked criterion is not a failed one", () => {
    expect(GATE_CRITERIA_UNEVALUATED_NOTICE).toMatch(
      /not a failed one|is not a failed/i,
    );
    expect(GATE_CRITERIA_UNEVALUATED_NOTICE).toMatch(
      /nothing here says a deliverable is missing or unsigned/i,
    );
  });

  it("the summary line names no criterion and states no count", () => {
    expect(GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL).not.toMatch(/Blocked by:/);
    expect(GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL).not.toMatch(/\d/);
    expect(GATE_CRITERIA_UNEVALUATED_SUMMARY_LABEL).toMatch(
      /could not be read/i,
    );
  });

  it("the notice prescribes a refresh and a retry, not a rebuild", () => {
    expect(GATE_CRITERIA_UNEVALUATED_NOTICE).toMatch(/Refresh this phase/);
    expect(GATE_CRITERIA_UNEVALUATED_NOTICE).toMatch(/retry Approve & Build/i);
    expect(GATE_CRITERIA_UNEVALUATED_NOTICE).not.toMatch(
      /regenerat|re-upload/i,
    );
  });
});
