// The Documents tab's sign-off column stood for two different facts under one
// shape, because the projection read fail-opened to an empty map. This suite
// pins the distinction the panel now renders from, and — more importantly —
// that the two states do not say the same thing. A pair of sentences that
// collapse to one string would make either case's assertion satisfiable by the
// other, and the defect being fixed IS a collapse.

import {
  describeDeliverableProjectionReadback,
  type DeliverableProjectionReadbackState,
} from "@/lib/programs/deliverable-projection-readback";

// Derived, not hand-typed: a state added to the union without a case here
// would otherwise be silently unchecked.
const STATES: Record<DeliverableProjectionReadbackState, true> = {
  available: true,
  unavailable: true,
};
const ALL_STATES = Object.keys(STATES) as DeliverableProjectionReadbackState[];

describe("the Documents tab says which of two facts its sign-off column is", () => {
  it("permits the sign-off badges only when the projection was read", () => {
    expect(
      describeDeliverableProjectionReadback("available").canStateSignOff,
    ).toBe(true);
    expect(
      describeDeliverableProjectionReadback("unavailable").canStateSignOff,
    ).toBe(false);
  });

  it("warns on the unread projection and only on it", () => {
    expect(
      describeDeliverableProjectionReadback("available").warning,
    ).toBeNull();
    const warning =
      describeDeliverableProjectionReadback("unavailable").warning;
    expect(warning).toBeTruthy();
    // The warning's job is to say the state is UNKNOWN rather than absent, and
    // that the badges were withheld for that reason. A warning that only said
    // "could not be read" would leave the reader to infer which.
    expect(warning).toMatch(/unknown for every document/i);
    expect(warning).toMatch(/withheld/i);
  });

  it("names a cause the reader can act on in each state, and never the same one twice", () => {
    const notes = ALL_STATES.map(
      (state) =>
        describeDeliverableProjectionReadback(state).noApprovableDocumentNote,
    );
    // Every state answers.
    expect(notes.every((note) => note.trim().length > 0)).toBe(true);
    // And answers DIFFERENTLY. Set size, not a pairwise !==, so a third state
    // that reuses an existing sentence fails here too.
    expect(new Set(notes).size).toBe(ALL_STATES.length);
  });

  it("steers the read-succeeded case away from rebuilding, which cannot create the missing record", () => {
    const note =
      describeDeliverableProjectionReadback(
        "available",
      ).noApprovableDocumentNote;
    // Every other refusal on this surface names something the reader controls,
    // so this one has to say explicitly that the obvious control is not it:
    // the orchestrator writes an artifact and a run record, never a
    // deliverables_v2 row, so another build produces another file and the same
    // gap.
    expect(note).toMatch(/building again/i);
    expect(note).toMatch(/not the missing record/i);
    // And it names the consequence, so the row is not read as merely cosmetic.
    expect(note).toMatch(/gate will still ask/i);
  });

  it("tells the unread case to reload, and does not call the state missing", () => {
    const note =
      describeDeliverableProjectionReadback(
        "unavailable",
      ).noApprovableDocumentNote;
    expect(note).toMatch(/reload/i);
    expect(note).toMatch(/unknown, not missing/i);
    // The wrong remedy here is the other state's: nothing about this row says
    // a record is absent, so it must not send the reader to rebuild.
    expect(note).not.toMatch(/building again/i);
  });

  it("gives the row note and the panel warning different vocabulary", () => {
    const readback = describeDeliverableProjectionReadback("unavailable");
    // Both render on the same screen. A row note that repeated the panel's own
    // warning would say nothing about the document it sits on, and a test
    // reading either would be satisfied by the other.
    expect(readback.noApprovableDocumentNote).not.toBe(readback.warning);
  });

  it("carries its own state back, so a caller can report which fact it rendered", () => {
    for (const state of ALL_STATES) {
      expect(describeDeliverableProjectionReadback(state).state).toBe(state);
    }
  });
});
