import { proposeDesignFromNotes } from "@/lib/programs/design-traceability-notes";
import type { TraceRow } from "@/lib/programs/design-traceability";

const rows: TraceRow[] = [
  {
    rank: 1,
    causeId: "RC-1",
    cause: "No accountable ownership or decision rights",
    link: {
      causeId: "RC-1",
      cause: "x",
      rank: 1,
      status: "accepted",
      element: "Stewardship council",
    },
  },
  {
    rank: 3,
    causeId: "RC-3",
    cause: "Lineage not captured at load or transform",
  },
  {
    rank: 4,
    causeId: "RC-4",
    cause: "Identity not resolved across EHR and claims",
  },
];

const NOTES =
  "Design session 2.\n" +
  "Lineage: capture lineage at load and at every transform, with run and version IDs.\n" +
  "Identity matching would be owned by Dana Ruiz (master-data program).";

describe("proposeDesignFromNotes", () => {
  it("drafts an element and a hand-off for open causes only, with verbatim sentences", () => {
    expect(proposeDesignFromNotes(NOTES, rows)).toEqual([
      {
        kind: "element",
        causeId: "RC-3",
        value:
          "capture lineage at load and at every transform, with run and version IDs",
        excerpt:
          "Lineage: capture lineage at load and at every transform, with run and version IDs.",
        sourceLine: 2,
      },
      {
        kind: "handoff",
        causeId: "RC-4",
        value: "Dana Ruiz",
        program: "master-data program",
        excerpt:
          "Identity matching would be owned by Dana Ruiz (master-data program).",
        sourceLine: 3,
      },
    ]);
  });

  it("never proposes for a cause that already has an element", () => {
    const proposals = proposeDesignFromNotes(
      "Ownership: a stewardship council with decision rights over definitions.",
      rows,
    );
    expect(proposals.some((p) => p.causeId === "RC-1")).toBe(false);
  });

  it("proposes nothing when every cause is answered", () => {
    expect(proposeDesignFromNotes(NOTES, [rows[0]])).toEqual([]);
  });
});
