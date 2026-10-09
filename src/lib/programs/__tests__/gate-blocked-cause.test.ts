import {
  GATE_BLOCKED_CAUSE_ORDER,
  resolveGateBlockedCause,
  type GateBlockedCauseInput,
  type GateBlockedCauseKey,
} from "@/lib/programs/gate-blocked-cause";

/**
 * A gate with nothing open. Every case below turns exactly one cause on, so a
 * resolver that reads the wrong field cannot pass by accident.
 */
function clear(): GateBlockedCauseInput {
  return {
    gateClosed: false,
    evidenceReadinessAvailable: true,
    openRequiredEvidenceCount: 0,
    phaseInputsBlocker: null,
    actionableOpenHardCount: 0,
    firstActionableHardLabel: null,
  };
}

/**
 * The single input that turns each cause on, one per key. Derived from a
 * `Record<GateBlockedCauseKey, …>` rather than a hand-typed list: a new cause
 * that is not given a trigger here does not compile, so the sweeps below
 * cannot keep iterating a roster that stopped growing.
 */
const CAUSE_TRIGGER: Record<
  GateBlockedCauseKey,
  (input: GateBlockedCauseInput) => GateBlockedCauseInput
> = {
  readiness_unverified: (input) => ({
    ...input,
    evidenceReadinessAvailable: false,
  }),
  required_evidence_open: (input) => ({
    ...input,
    openRequiredEvidenceCount: 3,
  }),
  phase_inputs_incomplete: (input) => ({
    ...input,
    phaseInputsBlocker: "Complete 7 phase inputs before Approve & Build.",
  }),
  hard_criteria_open: (input) => ({
    ...input,
    actionableOpenHardCount: 2,
    firstActionableHardLabel: "Charter signed off",
  }),
};

describe("resolveGateBlockedCause", () => {
  it("reports no cause when nothing is open", () => {
    expect(resolveGateBlockedCause(clear())).toBeNull();
  });

  it("reports no cause once the gate is closed, whatever is open", () => {
    // A historical phase, or an approved gate. Every cause is turned on at
    // once so no single field can be the one the guard happens to read.
    const everything = Object.values(CAUSE_TRIGGER).reduce(
      (input, trigger) => trigger(input),
      clear(),
    );
    expect(resolveGateBlockedCause(everything)).not.toBeNull();
    expect(
      resolveGateBlockedCause({ ...everything, gateClosed: true }),
    ).toBeNull();
  });

  it("every declared cause is reachable, and reports itself", () => {
    for (const key of GATE_BLOCKED_CAUSE_ORDER) {
      const cause = resolveGateBlockedCause(CAUSE_TRIGGER[key](clear()));
      expect(cause?.key).toBe(key);
    }
  });

  it("every cause answers with all three of its slots filled", () => {
    for (const key of GATE_BLOCKED_CAUSE_ORDER) {
      const cause = resolveGateBlockedCause(CAUSE_TRIGGER[key](clear()));
      expect(cause?.decisionText.length).toBeGreaterThan(0);
      expect(cause?.summaryLine.length).toBeGreaterThan(0);
      expect(cause?.nextActionLabel.length).toBeGreaterThan(0);
    }
  });

  it("gives each cause its own next-action label", () => {
    // Two causes sharing a label would let a reader act on the wrong one, and
    // would let a case for either pass on the other.
    const labels = GATE_BLOCKED_CAUSE_ORDER.map(
      (key) =>
        resolveGateBlockedCause(CAUSE_TRIGGER[key](clear()))?.nextActionLabel,
    );
    expect(new Set(labels).size).toBe(GATE_BLOCKED_CAUSE_ORDER.length);
  });

  it("resolves the declared order when several causes are open at once", () => {
    // Walk the roster forwards: with causes 1..n all open, the FIRST declared
    // one must win. Derived from the exported order, so re-ordering the module
    // without re-ordering the ladder fails here.
    let input = clear();
    for (const key of GATE_BLOCKED_CAUSE_ORDER) {
      input = CAUSE_TRIGGER[key](input);
      expect(resolveGateBlockedCause(input)?.key).toBe(
        GATE_BLOCKED_CAUSE_ORDER[0],
      );
    }
    // And backwards: dropping the earlier causes hands the block to the next
    // one down rather than to "not blocked".
    const all = GATE_BLOCKED_CAUSE_ORDER.reduce(
      (acc, key) => CAUSE_TRIGGER[key](acc),
      clear(),
    );
    const dropped: Record<
      GateBlockedCauseKey,
      Partial<GateBlockedCauseInput>
    > = {
      readiness_unverified: { evidenceReadinessAvailable: true },
      required_evidence_open: { openRequiredEvidenceCount: 0 },
      phase_inputs_incomplete: { phaseInputsBlocker: null },
      hard_criteria_open: {
        actionableOpenHardCount: 0,
        firstActionableHardLabel: null,
      },
    };
    let remaining = all;
    GATE_BLOCKED_CAUSE_ORDER.forEach((key, index) => {
      expect(resolveGateBlockedCause(remaining)?.key).toBe(key);
      remaining = { ...remaining, ...dropped[key] };
      const next = GATE_BLOCKED_CAUSE_ORDER[index + 1] ?? null;
      expect(resolveGateBlockedCause(remaining)?.key ?? null).toBe(next);
    });
  });

  it("an unverifiable readiness read wins over any count below it", () => {
    // The counts are not trustworthy when the check did not run, so a zero
    // there must not be reported as "nothing open".
    const cause = resolveGateBlockedCause({
      ...clear(),
      evidenceReadinessAvailable: false,
    });
    expect(cause?.key).toBe("readiness_unverified");
    expect(cause?.nextActionLabel).toBe("Refresh evidence status");
    expect(cause?.summaryLine).toContain("could not be verified");
  });

  it("names the open phase inputs rather than a hard gate", () => {
    // The defect: this state used to answer "Clear hard blockers" and
    // "Blocked by an open hard gate." with ZERO hard criteria open.
    const blocker = "Complete 7 phase inputs before Approve & Build.";
    const cause = resolveGateBlockedCause({
      ...clear(),
      phaseInputsBlocker: blocker,
    });
    expect(cause?.key).toBe("phase_inputs_incomplete");
    expect(cause?.nextActionLabel).toBe("Complete phase inputs");
    expect(cause?.summaryLine).toBe(blocker);
    expect(cause?.decisionText).toBe(blocker);
    expect(cause?.summaryLine).not.toContain("hard gate");
    expect(cause?.nextActionLabel).not.toContain("hard");
  });

  it("the decision text and the primary line name one cause, not two", () => {
    // Both slots are rendered on the same panel. Different causes in each is
    // the defect this module exists to make unrepresentable, so assert the
    // prescription matches across them for every cause.
    for (const key of GATE_BLOCKED_CAUSE_ORDER) {
      const cause = resolveGateBlockedCause(CAUSE_TRIGGER[key](clear()));
      if (key === "hard_criteria_open") {
        // The one cause whose two slots legitimately differ: the primary line
        // NAMES the criterion, the decision text COUNTS them.
        expect(cause?.summaryLine).toBe("Blocked by: Charter signed off.");
        expect(cause?.decisionText).toContain("2 hard gate blockers");
        continue;
      }
      expect(cause?.summaryLine).toBe(cause?.decisionText);
    }
  });

  it("falls back to an unnamed hard gate without naming a criterion", () => {
    const cause = resolveGateBlockedCause({
      ...clear(),
      actionableOpenHardCount: 1,
      firstActionableHardLabel: null,
    });
    expect(cause?.summaryLine).toBe("Blocked by an open hard gate.");
    expect(cause?.decisionText).toContain("1 hard gate blocker");
    expect(cause?.decisionText).not.toContain("blockers");
  });

  it("counts required evidence items with a matching verb", () => {
    expect(
      resolveGateBlockedCause({ ...clear(), openRequiredEvidenceCount: 1 })
        ?.decisionText,
    ).toBe(
      "1 required evidence item still needs upload and human review before this phase can advance.",
    );
    expect(
      resolveGateBlockedCause({ ...clear(), openRequiredEvidenceCount: 4 })
        ?.decisionText,
    ).toBe(
      "4 required evidence items still need upload and human review before this phase can advance.",
    );
  });
});
