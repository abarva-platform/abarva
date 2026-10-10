import {
  chooseOwner,
  commitAnswer,
  emptyOperatingAdoption,
  markRight,
  ownerGrid,
  type OperatingAdoption,
} from "@/lib/programs/operating-adoption";
import {
  fillFromNotes,
  routeFlagFromNotes,
} from "@/lib/programs/operating-adoption-notes";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";

const P2 = serializeRootCauseRegister({
  kind: "root_cause_register",
  version: 1,
  orderConfirmedAt: "2026-10-02",
  causes: [
    {
      id: "RC-1",
      cause: "No one owns definitions",
      short: "ownership",
      status: "accepted",
      evidence: ["e"],
    },
    {
      id: "RC-3",
      cause: "No lineage",
      short: "lineage",
      status: "accepted",
      evidence: ["e"],
    },
    {
      id: "RC-6",
      cause: "Defects reach reports",
      short: "quality",
      status: "accepted",
      evidence: ["e"],
    },
  ],
});
const TRACE = {
  kind: "design_traceability" as const,
  version: 1 as const,
  links: [
    {
      causeId: "RC-1",
      cause: "No one owns definitions",
      rank: 1,
      status: "accepted" as const,
      element: "Stewardship council with decision rights",
    },
    {
      causeId: "RC-3",
      cause: "No lineage",
      rank: 2,
      status: "accepted" as const,
      element: "Lineage captured at every transform",
    },
    {
      causeId: "RC-6",
      cause: "Defects reach reports",
      rank: 3,
      status: "accepted" as const,
      element: "Quality quarantine zone",
    },
  ],
};
const SHORTS = { "RC-1": "ownership", "RC-3": "lineage", "RC-6": "quality" };
const PEOPLE = ["Rosa Delgado", "Tom Becker", "Kenji Watanabe"];
const NOTES = [
  "Owners: lineage, Tom Becker; quality quarantine zone, Rosa Delgado.",
  "The quality quarantine zone releases held records after review.",
  "Process: steward reviews the queue at 9am, releases or rejects each record, logs the reason.",
  "Workflow change: Analysts take certified measures from the semantic layer.",
].join("\n");

const fill = (
  record: OperatingAdoption,
  profile: "limited" | "full" | "technical" = "full",
  values: Record<string, string> = {},
  notes = NOTES,
) =>
  fillFromNotes(notes, {
    profile,
    record,
    rows: ownerGrid(P2, TRACE, record).rows,
    shorts: SHORTS,
    people: PEOPLE,
    values,
  });
const rowOf = (r: OperatingAdoption, id: string) =>
  ownerGrid(P2, TRACE, r).rows.find((x) => x.rowId === id)!;

describe("fill from notes", () => {
  it("fills empty owner cells verbatim from a clause naming the row and one person, badged as notes", () => {
    const out = fill(emptyOperatingAdoption());
    expect(rowOf(out.record, "RC-3").owner).toEqual({
      name: "Tom Becker",
      writtenBy: "notes",
      citation: "From your notes, line 1",
    });
    expect(rowOf(out.record, "RC-6").owner).toEqual({
      name: "Rosa Delgado",
      writtenBy: "notes",
      citation: "From your notes, line 1",
    });
    expect(rowOf(out.record, "RC-1").owner).toBeUndefined();
    expect(out.filled).toEqual([
      "RC-3 (Tom Becker)",
      "RC-6 (Rosa Delgado)",
      "the process design, word for word",
    ]);
  });

  it("never overwrites a chosen owner, and says which it left alone", () => {
    let r = emptyOperatingAdoption();
    r = chooseOwner(r, rowOf(r, "RC-3"), "Kenji Watanabe");
    const out = fill(r);
    expect(rowOf(out.record, "RC-3").owner).toEqual({
      name: "Kenji Watanabe",
      writtenBy: "you",
    });
    expect(out.left).toEqual(["RC-3"]);
    expect(out.filled).not.toContain("RC-3 (Tom Becker)");
  });

  it("an owner the notes filled before is not replaced by later notes", () => {
    const once = fill(emptyOperatingAdoption()).record;
    const again = fill(once, "full", {}, "Owners: lineage, Kenji Watanabe.");
    expect(rowOf(again.record, "RC-3").owner?.name).toBe("Tom Becker");
    expect(again.left).toEqual([]);
  });

  it("marks a right the notes name only where no one has marked it", () => {
    const out = fill(emptyOperatingAdoption());
    expect(rowOf(out.record, "RC-6").rights.releases).toEqual({
      value: true,
      writtenBy: "notes",
      citation: "From your notes, line 2",
    });
    let r = emptyOperatingAdoption();
    r = markRight(r, rowOf(r, "RC-6"), "releases", false);
    expect(rowOf(fill(r).record, "RC-6").rights.releases).toEqual({
      value: false,
      writtenBy: "you",
    });
  });

  it("drafts an empty capture-text row from its labelled line, word for word, never accepted", () => {
    const out = fill(emptyOperatingAdoption(), "full");
    expect(out.record.answers).toEqual([
      {
        key: "process_design",
        draft: {
          text: "steward reviews the queue at 9am, releases or rejects each record, logs the reason.",
          writtenBy: "notes",
          citation: "From your notes, line 3",
        },
      },
    ]);
    const limited = fill(emptyOperatingAdoption(), "limited");
    expect(limited.record.answers.map((a) => [a.key, a.draft?.text])).toEqual([
      [
        "workflow_delta",
        "Analysts take certified measures from the semantic layer.",
      ],
    ]);
  });

  it("never drafts over a capture answer that has words or was accepted", () => {
    expect(
      fill(emptyOperatingAdoption(), "full", {
        process_design: "The team's own.",
      }).record.answers,
    ).toEqual([]);
    const accepted = commitAnswer({
      record: emptyOperatingAdoption(),
      key: "process_design",
      text: "Ours.",
      writtenBy: "you",
      action: "saved",
      by: "me",
      at: "d",
    });
    if (!accepted.ok) throw new Error();
    expect(
      fill(accepted.record, "full", accepted.answers).record.answers,
    ).toEqual(accepted.record.answers);
  });

  it("a clause naming two of the Move's people names no owner", () => {
    const out = fill(
      emptyOperatingAdoption(),
      "full",
      {},
      "Lineage could go to Tom Becker or Rosa Delgado.",
    );
    expect(rowOf(out.record, "RC-3").owner).toBeUndefined();
    expect(out.filled).toEqual([]);
  });

  it("notes with nothing to fill change nothing", () => {
    const r = emptyOperatingAdoption();
    const out = fill(
      r,
      "full",
      {},
      "We met and talked about the weather today.",
    );
    expect(out.record).toBe(r);
    expect(out.filled).toEqual([]);
  });

  it("on a technical route notes only raise a flag; nothing is filled", () => {
    const out = fill(emptyOperatingAdoption(), "technical");
    expect(out.flagged).toBe(true);
    expect(out.record.routeFlag).toEqual({
      profile: "technical",
      quote:
        "Process: steward reviews the queue at 9am, releases or rejects each record, logs the reason.",
      line: 3,
    });
    expect(out.record.rows).toEqual([]);
    expect(out.record.answers).toEqual([]);
    expect(out.filled).toEqual([]);
  });
});

describe("route flag from notes", () => {
  it("technical: any change to how people work, verbatim with its line", () => {
    expect(
      routeFlagFromNotes(
        "Dashboards refresh nightly.\nStewards review the exception queue every morning.",
        "technical",
      ),
    ).toEqual({
      quote: "Stewards review the exception queue every morning.",
      line: 2,
    });
    expect(
      routeFlagFromNotes("Dashboards refresh nightly.", "technical"),
    ).toBeNull();
  });

  it("limited: only a change to roles or accountability", () => {
    expect(
      routeFlagFromNotes("Stewards review the queue daily.", "limited"),
    ).toBeNull();
    expect(
      routeFlagFromNotes("Stewards answer questions from analysts.", "limited"),
    ).toBeNull();
    expect(
      routeFlagFromNotes(
        "Stewards get approval rights over access.",
        "limited",
      ),
    ).toEqual({
      quote: "Stewards get approval rights over access.",
      line: 1,
    });
    expect(
      routeFlagFromNotes("Two new roles report to the council.", "limited")
        ?.line,
    ).toBe(1);
  });

  it("full: nothing is heavier", () => {
    expect(
      routeFlagFromNotes("A new operating model with new roles.", "full"),
    ).toBeNull();
  });

  it("a fill raises the flag beside the drafts on a limited route", () => {
    const out = fill(
      emptyOperatingAdoption(),
      "limited",
      {},
      `${NOTES}\nThe council gets decision rights over every measure.`,
    );
    expect(out.flagged).toBe(true);
    expect(out.record.routeFlag).toMatchObject({ profile: "limited", line: 5 });
  });
});
