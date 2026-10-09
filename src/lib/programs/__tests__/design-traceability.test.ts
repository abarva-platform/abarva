import {
  acceptDesignElement,
  designHere,
  designTraceabilityGateText,
  designTraceabilityText,
  draftDesignElement,
  emptyDesignTraceability,
  handOffDesign,
  isDesignTraceabilityComplete,
  parseDesignTraceability,
  reopenDesign,
  serializeDesignTraceability,
  traceRows,
  type DesignTraceability,
  type TraceEdit,
} from "@/lib/programs/design-traceability";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";

const P2 = serializeRootCauseRegister({
  kind: "root_cause_register",
  version: 1,
  orderConfirmedAt: "2026-10-02",
  causes: [
    {
      id: "RC-2",
      cause: "Definitions conflict",
      short: "definitions",
      status: "accepted",
      evidence: ["Profile"],
      drives: "Measures certified",
    },
    {
      id: "RC-1",
      cause: "No ownership",
      status: "accepted",
      evidence: ["Interviews"],
    },
    {
      id: "RC-4",
      cause: "Identity unresolved",
      status: "known_gap",
      owner: "MDM lead",
    },
    { id: "RC-5", cause: "Not yet settled", status: "draft", evidence: ["X"] },
    { id: "S-1", cause: "Reports disagree", status: "symptom" },
  ],
});

const done = (edit: TraceEdit): DesignTraceability => {
  if (!edit.ok) throw new Error(edit.reason);
  return edit.value;
};
const row = (id: string) =>
  traceRows(P2, emptyDesignTraceability()).find((r) => r.causeId === id)!;

describe("traceRows", () => {
  it("are P2's settled causes, in the consultant's rank", () => {
    expect(
      traceRows(P2, emptyDesignTraceability()).map((r) => [r.rank, r.causeId]),
    ).toEqual([
      [1, "RC-2"],
      [2, "RC-1"],
      [3, "RC-4"],
    ]);
  });

  it("are empty when P2 holds no register", () => {
    expect(traceRows("Free text causes.", emptyDesignTraceability())).toEqual(
      [],
    );
  });
});

describe("editing and completeness", () => {
  it("is complete only when every settled cause has an element or an owned hand-off", () => {
    let value = done(
      designHere(
        emptyDesignTraceability(),
        row("RC-2"),
        "Certified semantic layer",
        "me",
        "2026-10-09",
      ),
    );
    value = done(
      designHere(value, row("RC-1"), "Stewardship council", "me", "2026-10-09"),
    );
    expect(isDesignTraceabilityComplete(P2, value)).toBe(false);
    value = done(
      handOffDesign(
        value,
        row("RC-4"),
        "Master-data program",
        "Dana Ruiz",
        "me",
        "2026-10-09",
      ),
    );
    expect(isDesignTraceabilityComplete(P2, value)).toBe(true);
    // Links stay in rank order whatever order they were written in.
    expect(value.links.map((l) => l.causeId)).toEqual(["RC-2", "RC-1", "RC-4"]);
  });

  it("refuses a hand-off without a program or an owner", () => {
    expect(
      handOffDesign(
        emptyDesignTraceability(),
        row("RC-4"),
        "Program",
        " ",
        "me",
        "d",
      ).ok,
    ).toBe(false);
    expect(
      handOffDesign(
        emptyDesignTraceability(),
        row("RC-4"),
        " ",
        "Owner",
        "me",
        "d",
      ).ok,
    ).toBe(false);
  });

  it("a draft settles only when accepted, and never overwrites a settled element", () => {
    const drafted = done(
      draftDesignElement(
        emptyDesignTraceability(),
        row("RC-1"),
        "Draft council",
        "team",
      ),
    );
    expect(isDesignTraceabilityComplete(P2, drafted)).toBe(false);
    const accepted = done(acceptDesignElement(drafted, "RC-1", "me", "d"));
    expect(accepted.links[0]).toMatchObject({
      status: "accepted",
      element: "Draft council",
      decidedBy: "me",
    });
    expect(draftDesignElement(accepted, row("RC-1"), "Other", "ava").ok).toBe(
      false,
    );
  });

  it("reopening returns an element as a draft and withdraws a hand-off", () => {
    const withElement = done(
      designHere(emptyDesignTraceability(), row("RC-1"), "Council", "me", "d"),
    );
    expect(done(reopenDesign(withElement, "RC-1")).links[0]).toMatchObject({
      status: "draft",
      element: "Council",
    });
    const handed = done(
      handOffDesign(
        emptyDesignTraceability(),
        row("RC-4"),
        "MDM",
        "Owner",
        "me",
        "d",
      ),
    );
    expect(done(reopenDesign(handed, "RC-4")).links).toEqual([]);
  });
});

describe("persistence and text", () => {
  const value = done(
    handOffDesign(
      done(
        designHere(
          emptyDesignTraceability(),
          row("RC-2"),
          "Certified semantic layer",
          "me",
          "d",
        ),
      ),
      row("RC-4"),
      "Master-data program",
      "Dana Ruiz",
      "me",
      "d",
    ),
  );

  it("round-trips and rejects anything that is not a traceability record", () => {
    expect(parseDesignTraceability(serializeDesignTraceability(value))).toEqual(
      value,
    );
    expect(parseDesignTraceability("free text")).toBeNull();
    expect(
      parseDesignTraceability(
        '{"kind":"root_cause_register","version":1,"causes":[]}',
      ),
    ).toBeNull();
  });

  it("reads on its own, in rank order, for the build and generation", () => {
    expect(designTraceabilityText(value)).toBe(
      [
        "Each P2 root cause, in the consultant's order, and the design element that answers it:",
        "1. RC-2 Definitions conflict → Certified semantic layer",
        "3. RC-4 Identity unresolved → handed to Master-data program (owner: Dana Ruiz)",
      ].join("\n"),
    );
  });

  it("gives the gate only the team's words", () => {
    expect(designTraceabilityGateText(value)).toBe(
      "Certified semantic layer\nMaster-data program\nDana Ruiz",
    );
  });
});
