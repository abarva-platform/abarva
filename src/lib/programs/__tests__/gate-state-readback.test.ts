/**
 * The gate's state reads, and what a refusal is allowed to say.
 *
 * The classification deliberately reads `error` and NOT `data`: a null/empty
 * `data` with no error is a legitimate empty read and must keep its meaning,
 * because every existing fixture supplies exactly that shape.
 */

import {
  GATE_STATE_READS,
  GATE_STATE_UNREADABLE_CHECK,
  classifyGateStateReads,
  describeUnreadableGateState,
  type GateStateRead,
} from "@/lib/programs/gate-state-readback";

/**
 * DERIVED, not hand-typed. A literal list here is what let `program_evidence`
 * ship unclassified: the per-read cases below iterated eight names while the
 * evaluator issued nine. The literal pin that follows is the one place the set
 * is asserted, so dropping a read fails loudly instead of silently shrinking
 * the matrix.
 */
const ALL_READS: readonly GateStateRead[] = GATE_STATE_READS;

describe("GATE_STATE_READS", () => {
  it("is every read the evaluator issues, in refusal order", () => {
    expect(GATE_STATE_READS).toEqual([
      "deliverables",
      "program_modules",
      "engagement_participants",
      "approval_requests",
      "milestones",
      "origination_brief_version",
      "discovery_report_version",
      "linked_artifacts",
      "program_evidence",
    ]);
  });

  it("names each read once", () => {
    expect(new Set(GATE_STATE_READS).size).toBe(GATE_STATE_READS.length);
  });

  it("gives every read a distinct human-facing label", () => {
    const labels = GATE_STATE_READS.map((key) =>
      describeUnreadableGateState([key]),
    );
    expect(new Set(labels).size).toBe(GATE_STATE_READS.length);
  });
});

describe("classifyGateStateReads", () => {
  it("reads every read landing as readable", () => {
    const reads = Object.fromEntries(
      ALL_READS.map((key) => [key, { error: null }]),
    );
    expect(classifyGateStateReads(reads)).toEqual({
      readable: true,
      unreadable: [],
    });
  });

  it("treats a read that was never issued as readable, not failed", () => {
    // Both version reads are conditional on their deliverable row existing.
    expect(
      classifyGateStateReads({
        deliverables: { error: null },
        origination_brief_version: null,
        discovery_report_version: undefined,
      }),
    ).toEqual({ readable: true, unreadable: [] });
  });

  it("an empty call is readable", () => {
    expect(classifyGateStateReads({})).toEqual({
      readable: true,
      unreadable: [],
    });
  });

  it.each([...ALL_READS])("names %s when that read reports an error", (key) => {
    const result = classifyGateStateReads({
      [key]: { error: { message: "x" } },
    });
    expect(result.readable).toBe(false);
    expect(result.unreadable).toEqual([key]);
  });

  it("names every failed read, in declaration order", () => {
    const result = classifyGateStateReads({
      program_evidence: { error: { message: "e" } },
      discovery_report_version: { error: { message: "d" } },
      deliverables: { error: { message: "a" } },
      milestones: { error: { message: "m" } },
    });
    expect(result.unreadable).toEqual([
      "deliverables",
      "milestones",
      "discovery_report_version",
      "program_evidence",
    ]);
  });

  it("does NOT treat a null-but-errorless read as unreadable", () => {
    // The shape every existing gate fixture supplies. Classifying it as a
    // failure would refuse every gate in the suite, and every real Move that
    // has legitimately produced nothing yet.
    expect(
      classifyGateStateReads({
        deliverables: {},
        program_modules: { error: undefined },
      }),
    ).toEqual({ readable: true, unreadable: [] });
  });

  it("an error with no message still counts as a failed read", () => {
    const result = classifyGateStateReads({ deliverables: { error: {} } });
    expect(result.readable).toBe(false);
    expect(result.unreadable).toEqual(["deliverables"]);
  });
});

describe("describeUnreadableGateState", () => {
  const sentence = describeUnreadableGateState([
    "deliverables",
    "program_modules",
  ]);

  it("names each read that failed", () => {
    expect(sentence).toContain("the Move's deliverable records");
    expect(sentence).toContain("the phase capture modules");
  });

  it("does not name a read that landed", () => {
    expect(sentence).not.toContain("milestones");
    expect(sentence).not.toContain("Discovery Report");
    expect(sentence).not.toContain("artifacts those deliverables point at");
    expect(sentence).not.toContain("ingested discovery evidence");
  });

  it("names the ingested-evidence read without claiming notes are absent", () => {
    // The arm this read backs is `discovery_notes_ingested`, whose own
    // `describe` tells a reviewer to ingest notes. That sentence is the one a
    // failed read must not produce.
    const evidence = describeUnreadableGateState(["program_evidence"]);
    expect(evidence).toContain("the Move's ingested discovery evidence");
    expect(evidence).not.toMatch(/Discovery notes or workshop logs ingested/);
    expect(evidence).toMatch(/Do not regenerate or re-upload/);
    expect(evidence).toMatch(/NOT a finding that a document is missing/);
  });

  it("says the gate could not be evaluated, not that a check failed", () => {
    expect(sentence).toMatch(/could not be evaluated/i);
  });

  it("refuses to assert that any document is missing, unsigned or empty", () => {
    // This is the whole point: the collapsed version reported seven absences
    // nobody observed.
    expect(sentence).toMatch(/NOT a finding that a document is missing/);
    expect(sentence).toMatch(/Nothing was concluded/i);
  });

  it("prescribes a retry", () => {
    expect(sentence).toMatch(/retry/i);
  });

  it("rules out regenerating, which would un-sign accepted work", () => {
    expect(sentence).toMatch(/Do not regenerate or re-upload/);
    expect(sentence).toMatch(/resets a signed-off document to draft/);
  });

  it("stays stable regardless of the order the failures arrive in", () => {
    expect(
      describeUnreadableGateState(["program_modules", "deliverables"]),
    ).toBe(sentence);
  });

  it("still says something when handed no names", () => {
    const empty = describeUnreadableGateState([]);
    expect(empty).toContain("the Move's gate state");
    expect(empty).toMatch(/could not be evaluated/i);
  });
});

describe("GATE_STATE_UNREADABLE_CHECK", () => {
  it("is a distinct check id, not one of the evaluator's criterion keys", () => {
    expect(GATE_STATE_UNREADABLE_CHECK).toBe("gate_state_unreadable");
  });
});
