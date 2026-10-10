import {
  acceptOwners,
  addTeamRow,
  CAPTURE_TEXT_ROWS,
  chooseOwner,
  commitAnswer,
  dismissRouteFlag,
  draftAnswer,
  emptyOperatingAdoption,
  isOperatingAdoptionComplete,
  markRight,
  missingOwnerCount,
  nameTeamRow,
  OPERATING_BLOCKED_SENTENCE,
  OPERATING_SKIPPED_SENTENCE,
  openRouteFlag,
  operatingAdoptionGateText,
  operatingAdoptionNextAction,
  operatingAdoptionRows,
  operatingAdoptionText,
  OWNER_LINES_KEY,
  ownerGrid,
  ownerLinesText,
  ownersSettled,
  parseOperatingAdoption,
  raiseRouteFlag,
  removeTeamRow,
  reopenAnswer,
  reopenBaselineOwner,
  reopenOwners,
  saveBaselineOwner,
  serializeOperatingAdoption,
  teamWords,
  textRowState,
  withoutPageSection,
  withPageSection,
  type OperatingAdoption,
  type OperatingAdoptionInputs,
  type StepWriteResult,
  type WorkProfile,
} from "@/lib/programs/operating-adoption";
import {
  captureValueGateText,
  captureValueText,
} from "@/lib/programs/structured-capture-text";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";
import {
  resolvePhaseWorkflow,
  type ChangeProfile,
} from "@/lib/programs/phase-workflow-registry";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

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
      evidence: ["Interviews"],
    },
    {
      id: "RC-3",
      cause: "No lineage",
      short: "lineage",
      status: "accepted",
      evidence: ["Inventory"],
    },
    {
      id: "RC-4",
      cause: "Identity unresolved",
      short: "identity",
      status: "known_gap",
      owner: "MDM lead",
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
      element: "Stewardship council",
    },
    {
      causeId: "RC-3",
      cause: "No lineage",
      rank: 2,
      status: "accepted" as const,
      element: "Lineage capture",
    },
    {
      causeId: "RC-4",
      cause: "Identity unresolved",
      rank: 3,
      status: "handed_off" as const,
      program: "Master-data program",
      owner: "Dana Ruiz",
    },
  ],
};

const ok = (edit: StepWriteResult) => {
  if (!edit.ok) throw new Error(edit.reason);
  return edit;
};
const grid = (record: OperatingAdoption) => ownerGrid(P2, TRACE, record);
const row = (record: OperatingAdoption, id: string) =>
  grid(record).rows.find((r) => r.rowId === id)!;

/** Both Step 1 rows owned, rights marked, as the consultant would. */
function owned(): OperatingAdoption {
  let r = emptyOperatingAdoption();
  r = chooseOwner(r, row(r, "RC-1"), "Rosa Delgado");
  r = markRight(r, row(r, "RC-1"), "certifies", true);
  r = markRight(r, row(r, "RC-1"), "approves_access", true);
  r = chooseOwner(r, row(r, "RC-3"), "Kenji Watanabe");
  return r;
}

const input = (
  profile: ChangeProfile,
  record: OperatingAdoption,
  values: Record<string, string> = {},
  avaDraftKeys: string[] = [],
): OperatingAdoptionInputs => ({
  profile,
  record,
  grid: grid(record),
  values,
  avaDraftKeys,
});

describe("the step's keys are the registry's", () => {
  const routeFor: Record<ChangeProfile, ConfirmedSolutionRoute | null> = {
    technical: {
      route: "technical_product",
      workflowChange: "none",
      roleAccountabilityChange: "none",
    } as ConfirmedSolutionRoute,
    limited: {
      route: "process_change",
      workflowChange: "limited",
      roleAccountabilityChange: "limited",
    } as ConfirmedSolutionRoute,
    full: null,
  };
  it.each(["limited", "full"] as WorkProfile[])(
    "%s: the two capture-text rows are P3.3's section keys, and the owner lines go to one of them",
    (profile) => {
      const step = resolvePhaseWorkflow(3, routeFor[profile]).find(
        (s) => s.id === "P3.3",
      )!;
      expect(CAPTURE_TEXT_ROWS[profile].map((r) => r.key)).toEqual(
        step.sectionKeys,
      );
      expect(step.sectionKeys).toContain(OWNER_LINES_KEY[profile]);
      expect(step.recordKeys).toEqual(["operating_adoption"]);
    },
  );
  it("owner lines: the adoption boundary on limited, the operating model on full", () => {
    expect(OWNER_LINES_KEY).toEqual({
      limited: "process_adoption_boundary",
      full: "operating_model",
    });
  });
});

describe("parse and serialize", () => {
  it("round-trips a full record", () => {
    let r = owned();
    r = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: {},
        by: "me",
        at: "2026-10-14",
      }),
    ).record;
    r = ok(
      commitAnswer({
        record: r,
        key: "workflow_delta",
        text: "Stewards certify.",
        writtenBy: "notes",
        citation: "From your notes, line 2",
        action: "accepted",
        by: "me",
        at: "2026-10-14",
      }),
    ).record;
    r = draftAnswer(r, "process_adoption_boundary", {
      text: "Front line sees no change.",
      writtenBy: "ava",
    });
    r = ok({
      ok: true,
      record: (
        saveBaselineOwner(r, "Amara Osei", "me", "2026-10-14") as {
          value: OperatingAdoption;
        }
      ).value,
      answers: {},
    }).record;
    r = raiseRouteFlag(r, {
      profile: "limited",
      quote: "New steward roles with approval rights.",
      line: 4,
    });
    expect(parseOperatingAdoption(serializeOperatingAdoption(r))).toEqual(r);
  });

  it("refuses what is not this record", () => {
    expect(parseOperatingAdoption("")).toBeNull();
    expect(parseOperatingAdoption("Owners: Rosa")).toBeNull();
    expect(parseOperatingAdoption("{bad json")).toBeNull();
    expect(
      parseOperatingAdoption(
        JSON.stringify({ kind: "design_traceability", version: 1 }),
      ),
    ).toBeNull();
    expect(
      parseOperatingAdoption(
        JSON.stringify({ kind: "operating_adoption", version: 2 }),
      ),
    ).toBeNull();
  });

  it("drops malformed rows, rights, answers and flags instead of guessing", () => {
    const parsed = parseOperatingAdoption(
      JSON.stringify({
        kind: "operating_adoption",
        version: 1,
        rows: [
          {
            rowId: "RC-1",
            source: "step1",
            name: "Stewardship council",
            owner: { name: "Rosa", writtenBy: "aVa" },
            rights: {
              certifies: { value: true, writtenBy: "you" },
              invented: { value: true, writtenBy: "you" },
              releases: { value: "yes", writtenBy: "you" },
            },
          },
          { rowId: "RC-1", source: "step1", name: "dup" },
          { rowId: "X", source: "elsewhere", name: "n" },
        ],
        answers: [
          {
            key: "workflow_delta",
            accepted: { text: "words", writtenBy: "you", by: "me" },
          },
          { nokey: true },
        ],
        routeFlag: { profile: "sideways", quote: "q", line: 1 },
        baseline: { name: "Amara" },
        ownersAcceptedBy: "me",
      }),
    )!;
    expect(parsed.rows).toEqual([
      {
        rowId: "RC-1",
        source: "step1",
        name: "Stewardship council",
        rights: { certifies: { value: true, writtenBy: "you" } },
      },
    ]);
    expect(parsed.answers).toEqual([{ key: "workflow_delta" }]);
    expect(parsed.routeFlag).toBeUndefined();
    expect(parsed.baseline).toBeUndefined();
    expect(parsed.ownersAcceptedAt).toBeUndefined();
  });
});

describe("the owners grid", () => {
  it("lists Step 1's accepted elements in rank, the hand-off apart, then team rows", () => {
    let r = addTeamRow(emptyOperatingAdoption());
    r = (
      nameTeamRow(r, "T-1", "Access review board") as {
        value: OperatingAdoption;
      }
    ).value;
    const g = grid(r);
    expect(g.rows.map((x) => [x.rowId, x.source, x.name])).toEqual([
      ["RC-1", "step1", "Stewardship council"],
      ["RC-3", "step1", "Lineage capture"],
      ["T-1", "team", "Access review board"],
    ]);
    expect(g.handedOff).toEqual([
      {
        causeId: "RC-4",
        cause: "Identity unresolved",
        program: "Master-data program",
        owner: "Dana Ruiz",
      },
    ]);
    expect(missingOwnerCount(g)).toBe(3);
  });

  it("asks again for an owner when Step 1 rewrites the element", () => {
    const r = owned();
    const rewritten = {
      ...TRACE,
      links: TRACE.links.map((l) =>
        l.causeId === "RC-1" ? { ...l, element: "Data council" } : l,
      ),
    };
    const g = ownerGrid(P2, rewritten, r);
    expect(g.rows.find((x) => x.rowId === "RC-1")).toEqual({
      rowId: "RC-1",
      source: "step1",
      rank: 1,
      name: "Data council",
      rights: {},
    });
    expect(g.rows.find((x) => x.rowId === "RC-3")?.owner?.name).toBe(
      "Kenji Watanabe",
    );
  });

  it("a chosen owner is the consultant's; clearing it empties the cell", () => {
    let r = emptyOperatingAdoption();
    r = chooseOwner(r, row(r, "RC-1"), "Rosa Delgado");
    expect(row(r, "RC-1").owner).toEqual({
      name: "Rosa Delgado",
      writtenBy: "you",
    });
    r = chooseOwner(r, row(r, "RC-1"), "");
    expect(row(r, "RC-1").owner).toBeUndefined();
  });

  it("only team rows can be renamed or removed; ids are never reused", () => {
    let r = addTeamRow(addTeamRow(emptyOperatingAdoption()));
    expect(r.rows.map((x) => x.rowId)).toEqual(["T-1", "T-2"]);
    r = (removeTeamRow(r, "T-1") as { value: OperatingAdoption }).value;
    r = addTeamRow(r);
    expect(r.rows.map((x) => x.rowId)).toEqual(["T-2", "T-3"]);
    expect(nameTeamRow(r, "RC-1", "x").ok).toBe(false);
    expect(removeTeamRow(r, "RC-1").ok).toBe(false);
  });

  it("acceptance needs every owner and every team row named; an edit reopens it", () => {
    let r = emptyOperatingAdoption();
    expect(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: {},
        by: "me",
        at: "d",
      }),
    ).toEqual({
      ok: false,
      reason: "2 design elements still need an owner.",
    });
    r = owned();
    r = addTeamRow(r);
    r = chooseOwner(r, row(r, "T-1"), "Tom Becker");
    expect(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: {},
        by: "me",
        at: "d",
      }),
    ).toEqual({
      ok: false,
      reason: "Name every row you added before accepting.",
    });
    r = (removeTeamRow(r, "T-1") as { value: OperatingAdoption }).value;
    r = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: {},
        by: "me",
        at: "d",
      }),
    ).record;
    expect(ownersSettled(r, grid(r))).toBe(true);
    expect(
      ownersSettled(markRight(r, row(r, "RC-3"), "releases", true), grid(r)),
    ).toBe(false);
  });
});

describe("owner lines in the capture answer (product decision)", () => {
  it("are plain words: element, owner and rights, with no label, id or badge", () => {
    expect(ownerLinesText(grid(owned()))).toBe(
      "Stewardship council: owner Rosa Delgado; certifies its output, approves access\nLineage capture: owner Kenji Watanabe",
    );
  });

  it("limited: accepting appends them to the adoption boundary, after the team's words", () => {
    const r = owned();
    const out = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: {
          process_adoption_boundary: "Front-line staff see no change.",
          workflow_delta: "untouched",
        },
        by: "me",
        at: "2026-10-14",
      }),
    );
    expect(out.answers).toEqual({
      process_adoption_boundary:
        "Front-line staff see no change.\n\nStewardship council: owner Rosa Delgado; certifies its output, approves access\nLineage capture: owner Kenji Watanabe",
    });
    expect(out.record.ownerLines).toEqual({
      key: "process_adoption_boundary",
      text: ownerLinesText(grid(r)),
    });
    expect(out.answers.process_adoption_boundary).not.toMatch(
      /RC-|review|Session notes|\[A:/,
    );
  });

  it("full: they go to the operating model", () => {
    const r = owned();
    const out = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "full",
        values: {},
        by: "me",
        at: "d",
      }),
    );
    expect(Object.keys(out.answers)).toEqual(["operating_model"]);
    expect(out.answers.operating_model).toBe(ownerLinesText(grid(r)));
  });

  it("re-accepting replaces only the section it wrote; the team's words never move", () => {
    let r = owned();
    const team =
      "Line one of the team.\n\n\nLine two, spaced as they typed it.  ";
    let first = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: { process_adoption_boundary: team },
        by: "me",
        at: "d",
      }),
    );
    r = reopenOwners({ record: first.record, values: first.answers }).record;
    r = markRight(r, row(r, "RC-3"), "releases", true);
    // The team typed more after the page's section in the meantime.
    const meanwhile = `${first.answers.process_adoption_boundary}\n\nAdded later by the team.`;
    first = ok(
      acceptOwners({
        record: { ...r, ownerLines: first.record.ownerLines },
        grid: grid(r),
        profile: "limited",
        values: { process_adoption_boundary: meanwhile },
        by: "me",
        at: "d",
      }),
    );
    expect(first.answers.process_adoption_boundary).toBe(
      "Line one of the team.\n\n\nLine two, spaced as they typed it.\n\nAdded later by the team.\n\nStewardship council: owner Rosa Delgado; certifies its output, approves access\nLineage capture: owner Kenji Watanabe; releases changes",
    );
  });

  it("lines the team edited become the team's words and are never removed", () => {
    const r = owned();
    const out = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: { process_adoption_boundary: "Team." },
        by: "me",
        at: "d",
      }),
    );
    const edited = out.answers.process_adoption_boundary.replace(
      "owner Kenji Watanabe",
      "owner Kenji W. (interim)",
    );
    const back = reopenOwners({
      record: out.record,
      values: { process_adoption_boundary: edited },
    });
    expect(back.answers.process_adoption_boundary).toBe(edited);
    expect(teamWords(out.record, "process_adoption_boundary", edited)).toBe(
      edited,
    );
  });

  it("reopening takes back exactly the section the page wrote", () => {
    const r = owned();
    const out = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: { process_adoption_boundary: "Team words." },
        by: "me",
        at: "d",
      }),
    );
    const back = reopenOwners({ record: out.record, values: out.answers });
    expect(back.answers).toEqual({ process_adoption_boundary: "Team words." });
    expect(back.record.ownerLines).toBeUndefined();
    expect(back.record.ownersAcceptedAt).toBeUndefined();
    expect(reopenOwners({ record: r, values: {} }).answers).toEqual({});
  });

  it("withoutPageSection / withPageSection never touch words they did not write", () => {
    expect(withoutPageSection("a\n\nb", "c")).toBe("a\n\nb");
    expect(withoutPageSection("a\n\nc\n\nb", "c")).toBe("a\n\nb");
    expect(withoutPageSection("c", "c")).toBe("");
    expect(withoutPageSection("abc", undefined)).toBe("abc");
    expect(withPageSection("", "lines")).toBe("lines");
    expect(withPageSection("team  \n", "")).toBe("team");
    expect(withPageSection("team", "lines")).toBe("team\n\nlines");
  });

  it("saving the team's text on the owner-lines answer keeps the page's section after it", () => {
    const r = owned();
    const out = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "limited",
        values: {},
        by: "me",
        at: "d",
      }),
    );
    const saved = ok(
      commitAnswer({
        record: out.record,
        key: "process_adoption_boundary",
        text: " Front line sees no change. ",
        writtenBy: "you",
        action: "saved",
        by: "me",
        at: "d",
      }),
    );
    expect(saved.answers.process_adoption_boundary).toBe(
      `Front line sees no change.\n\n${ownerLinesText(grid(r))}`,
    );
    expect(
      textRowState(
        saved.record,
        "process_adoption_boundary",
        saved.answers.process_adoption_boundary,
        false,
      ),
    ).toMatchObject({
      state: "settled",
      text: "Front line sees no change.",
    });
    // On the other key nothing is appended.
    const other = ok(
      commitAnswer({
        record: out.record,
        key: "workflow_delta",
        text: "Stewards certify.",
        writtenBy: "you",
        action: "saved",
        by: "me",
        at: "d",
      }),
    );
    expect(other.answers).toEqual({ workflow_delta: "Stewards certify." });
  });
});

describe("capture-text rows", () => {
  it("empty, a record draft, the capture's words, aVa's words, then settled", () => {
    let r = emptyOperatingAdoption();
    expect(textRowState(r, "workflow_delta", "", false)).toEqual({
      state: "empty",
    });
    r = draftAnswer(r, "workflow_delta", {
      text: "Stewards certify.",
      writtenBy: "notes",
      citation: "From your notes, line 3",
    });
    expect(textRowState(r, "workflow_delta", "", false)).toEqual({
      state: "record_draft",
      text: "Stewards certify.",
      writtenBy: "notes",
      citation: "From your notes, line 3",
    });
    expect(
      textRowState(r, "workflow_delta", "Typed in the capture.", false),
    ).toEqual({
      state: "draft",
      text: "Typed in the capture.",
      writtenBy: "capture",
    });
    expect(
      textRowState(r, "workflow_delta", "aVa wrote this.", true),
    ).toMatchObject({ writtenBy: "ava" });
    const done = ok(
      commitAnswer({
        record: r,
        key: "workflow_delta",
        text: "Stewards certify.",
        writtenBy: "notes",
        citation: "From your notes, line 3",
        action: "accepted",
        by: "me",
        at: "d",
      }),
    );
    expect(done.answers).toEqual({ workflow_delta: "Stewards certify." });
    expect(done.record.answers).toEqual([
      {
        key: "workflow_delta",
        accepted: {
          text: "Stewards certify.",
          writtenBy: "notes",
          citation: "From your notes, line 3",
          action: "accepted",
          by: "me",
          at: "d",
        },
      },
    ]);
    expect(
      textRowState(done.record, "workflow_delta", "Stewards certify.", false)
        .state,
    ).toBe("settled");
    // Edited elsewhere: asked again.
    expect(
      textRowState(
        done.record,
        "workflow_delta",
        "Stewards certify weekly.",
        false,
      ).state,
    ).toBe("draft");
    // Reopened: unconfirmed, still in the answer.
    expect(
      textRowState(
        reopenAnswer(done.record, "workflow_delta"),
        "workflow_delta",
        "Stewards certify.",
        false,
      ).state,
    ).toBe("draft");
  });

  it("an empty answer is refused, not saved", () => {
    expect(
      commitAnswer({
        record: emptyOperatingAdoption(),
        key: "workflow_delta",
        text: "  ",
        writtenBy: "you",
        action: "saved",
        by: "me",
        at: "d",
      }),
    ).toEqual({
      ok: false,
      reason: "Write the answer before saving it.",
    });
  });
});

describe("baseline owner and route flag", () => {
  it("the baseline owner is a named person, saved and reopened", () => {
    expect(saveBaselineOwner(emptyOperatingAdoption(), " ", "me", "d").ok).toBe(
      false,
    );
    const saved = (
      saveBaselineOwner(emptyOperatingAdoption(), "Amara Osei", "me", "d") as {
        value: OperatingAdoption;
      }
    ).value;
    expect(saved.baseline).toEqual({
      name: "Amara Osei",
      savedBy: "me",
      savedAt: "d",
    });
    expect(reopenBaselineOwner(saved).baseline).toBeUndefined();
  });

  it("a flag is open only for its own route, never on full, until dismissed", () => {
    let r = raiseRouteFlag(emptyOperatingAdoption(), {
      profile: "limited",
      quote: "New roles.",
      line: 2,
    });
    expect(openRouteFlag(r, "limited")?.quote).toBe("New roles.");
    expect(openRouteFlag(r, "technical")).toBeNull();
    expect(
      openRouteFlag(
        raiseRouteFlag(r, { profile: "full", quote: "x", line: 1 }),
        "full",
      ),
    ).toBeNull();
    r = dismissRouteFlag(r, "me", "d");
    expect(openRouteFlag(r, "limited")).toBeNull();
    // The same words stay dismissed; new words raise it again.
    expect(
      raiseRouteFlag(r, { profile: "limited", quote: "New roles.", line: 9 }),
    ).toBe(r);
    expect(
      openRouteFlag(
        raiseRouteFlag(r, { profile: "limited", quote: "Other.", line: 9 }),
        "limited",
      )?.quote,
    ).toBe("Other.");
    expect(dismissRouteFlag(emptyOperatingAdoption(), "me", "d")).toEqual(
      emptyOperatingAdoption(),
    );
  });
});

describe("next action, clauses, count, done and blocked", () => {
  const flagged = (r: OperatingAdoption, profile: ChangeProfile) =>
    raiseRouteFlag(r, { profile, quote: "q", line: 1 });

  it("limited: four clauses in row order, the flag last, '3 more below'", () => {
    let r = emptyOperatingAdoption();
    r = draftAnswer(r, "workflow_delta", {
      text: "Stewards certify.",
      writtenBy: "notes",
    });
    r = draftAnswer(r, "process_adoption_boundary", {
      text: "No front-line change.",
      writtenBy: "ava",
    });
    r = flagged(r, "limited");
    const next = operatingAdoptionNextAction({
      input: input("limited", r),
      step2Done: true,
    });
    expect(next).toMatchObject({
      state: "in_progress",
      eyebrow: "Next",
      sentence:
        "Name 2 owners and accept the decision rights; confirm the workflow change; 3 more below.",
      settled: 0,
      total: 4,
      continueEnabled: false,
    });
  });

  it("full: write the empty process design; no flag on full", () => {
    let r = draftAnswer(emptyOperatingAdoption(), "operating_model", {
      text: "Council owns definitions.",
      writtenBy: "notes",
    });
    r = flagged(r, "full");
    const rows = operatingAdoptionRows(input("full", r));
    expect(rows.map((x) => [x.id, x.state])).toEqual([
      ["OWN", "decision"],
      ["operating_model", "draft"],
      ["process_design", "decision"],
      ["MEAS", "decision"],
    ]);
    expect(
      operatingAdoptionNextAction({ input: input("full", r), step2Done: true })
        .sentence,
    ).toBe(
      "Name 2 owners and accept the decision rights; confirm the operating model; 2 more below.",
    );
  });

  it("clauses name the remaining work exactly", () => {
    let r = owned();
    r = chooseOwner(r, row(r, "RC-3"), "");
    const clauses = (rows: ReturnType<typeof operatingAdoptionRows>) =>
      rows
        .filter((x) => x.state !== "settled")
        .map((x) => (x.state === "draft" ? x.draftClause : x.clause));
    expect(clauses(operatingAdoptionRows(input("limited", r)))).toEqual([
      "name 1 owner and accept the decision rights",
      "write the workflow change",
      "write the adoption boundary",
      "name who receives the baseline",
    ]);
    r = chooseOwner(r, row(r, "RC-3"), "Tom Becker");
    expect(clauses(operatingAdoptionRows(input("limited", r)))[0]).toBe(
      "accept the owners and decision rights",
    );
    expect(
      operatingAdoptionNextAction({
        input: input("limited", flagged(r, "limited")),
        step2Done: true,
      }).sentence,
    ).toBe(
      "Accept the owners and decision rights; write the workflow change; 3 more below.",
    );
  });

  /** Everything settled for a profile. */
  function settledFor(profile: WorkProfile) {
    let r = owned();
    const a = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile,
        values: {},
        by: "me",
        at: "2026-10-14",
      }),
    );
    r = a.record;
    const values: Record<string, string> = { ...a.answers };
    for (const t of CAPTURE_TEXT_ROWS[profile]) {
      const c = ok(
        commitAnswer({
          record: r,
          key: t.key,
          text: `${t.short} words`,
          writtenBy: "you",
          action: "saved",
          by: "me",
          at: "d",
        }),
      );
      r = c.record;
      Object.assign(values, c.answers);
    }
    r = (
      saveBaselineOwner(r, "Amara Osei", "me", "d") as {
        value: OperatingAdoption;
      }
    ).value;
    return { r, values };
  }

  it.each(["limited", "full"] as WorkProfile[])(
    "%s: ready when all four settle, whatever the flag",
    (profile) => {
      const { r, values } = settledFor(profile);
      const next = operatingAdoptionNextAction({
        input: input(profile, flagged(r, profile), values),
        step2Done: true,
      });
      expect(next).toMatchObject({
        state: "ready",
        sentence:
          "Owners are named, the change is written in the team’s words, and the baseline owner is named; continue to Delivery & estimate.",
        settled: 4,
        total: 4,
        continueEnabled: true,
      });
      expect(
        isOperatingAdoptionComplete(
          input(profile, flagged(r, profile), values),
        ),
      ).toBe(true);
    },
  );

  it.each(["limited", "full"] as WorkProfile[])(
    "%s: not done while any one row is open",
    (profile) => {
      const { r, values } = settledFor(profile);
      expect(
        isOperatingAdoptionComplete(
          input(profile, reopenBaselineOwner(r), values),
        ),
      ).toBe(false);
      expect(
        isOperatingAdoptionComplete(
          input(profile, reopenOwners({ record: r, values }).record, values),
        ),
      ).toBe(false);
      const key = CAPTURE_TEXT_ROWS[profile][1].key;
      expect(
        isOperatingAdoptionComplete(
          input(profile, r, { ...values, [key]: "changed elsewhere" }),
        ),
      ).toBe(false);
    },
  );

  it.each(["limited", "full"] as WorkProfile[])(
    "%s: blocked until Step 2 is settled",
    (profile) => {
      expect(
        operatingAdoptionNextAction({
          input: input(profile, emptyOperatingAdoption()),
          step2Done: false,
        }),
      ).toMatchObject({
        state: "blocked",
        sentence: `${OPERATING_BLOCKED_SENTENCE}.`,
        continueEnabled: false,
      });
    },
  );

  it("technical: skipped with its own sentence, Continue enabled, done, even before Step 2", () => {
    for (const step2Done of [true, false]) {
      const next = operatingAdoptionNextAction({
        input: input(
          "technical",
          flagged(emptyOperatingAdoption(), "technical"),
        ),
        step2Done,
      });
      expect(next).toMatchObject({
        state: "skipped",
        eyebrow: "Skipped",
        sentence: OPERATING_SKIPPED_SENTENCE,
        settled: 0,
        total: 0,
        continueEnabled: true,
      });
    }
    expect(
      isOperatingAdoptionComplete(input("technical", emptyOperatingAdoption())),
    ).toBe(true);
    expect(
      operatingAdoptionRows(
        input("technical", flagged(emptyOperatingAdoption(), "technical")),
      ),
    ).toEqual([expect.objectContaining({ id: "FLAG", state: "advisory" })]);
    expect(
      operatingAdoptionRows(input("technical", emptyOperatingAdoption())),
    ).toEqual([]);
  });

  it("the page's own rows (evidence to review) come first and are counted", () => {
    const next = operatingAdoptionNextAction({
      input: input("limited", emptyOperatingAdoption()),
      step2Done: true,
      extraRows: [
        {
          id: "EV-1",
          rank: -10,
          subject: "notes.docx",
          state: "decision",
          clause: "review the extraction of notes.docx",
        },
      ],
    });
    expect(next.sentence).toBe(
      "Review the extraction of notes.docx; name 2 owners and accept the decision rights; 3 more below.",
    );
    expect(next.total).toBe(5);
  });
});

describe("text readers", () => {
  it("the readable text names owners, rights and the baseline owner", () => {
    let r = owned();
    expect(operatingAdoptionText(emptyOperatingAdoption())).toBe(
      "No owners named yet.",
    );
    expect(operatingAdoptionText(r)).toBe(
      "Owners and decision rights (not yet accepted):\n- Stewardship council: owner Rosa Delgado; certifies output, approves access\n- Lineage capture: owner Kenji Watanabe",
    );
    r = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "full",
        values: {},
        by: "me",
        at: "2026-10-14",
      }),
    ).record;
    r = (
      saveBaselineOwner(r, "Amara Osei", "me", "2026-10-14") as {
        value: OperatingAdoption;
      }
    ).value;
    expect(operatingAdoptionText(r)).toBe(
      "Owners and decision rights, accepted by me on 2026-10-14:\n- Stewardship council: owner Rosa Delgado; certifies output, approves access\n- Lineage capture: owner Kenji Watanabe\nReceives the baseline: Amara Osei, named by me on 2026-10-14.",
    );
  });

  it("the gate text carries the team's words only, and only once accepted", () => {
    let r = owned();
    r = (
      saveBaselineOwner(r, "Amara Osei", "me", "d") as {
        value: OperatingAdoption;
      }
    ).value;
    expect(operatingAdoptionGateText(r)).toBe("Amara Osei");
    r = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "full",
        values: {},
        by: "me",
        at: "d",
      }),
    ).record;
    expect(operatingAdoptionGateText(r)).toBe(
      "Stewardship council\nRosa Delgado\nLineage capture\nKenji Watanabe\nAmara Osei",
    );
    expect(operatingAdoptionGateText(r)).not.toMatch(
      /certif|approves|RC-|owner/i,
    );
  });

  it("both dispatcher readers route the record, and leave plain text alone", () => {
    let r = owned();
    r = ok(
      acceptOwners({
        record: r,
        grid: grid(r),
        profile: "full",
        values: {},
        by: "me",
        at: "d",
      }),
    ).record;
    const raw = serializeOperatingAdoption(r);
    expect(captureValueText("operating_adoption", raw)).toBe(
      operatingAdoptionText(r),
    );
    expect(captureValueGateText("operating_adoption", raw)).toBe(
      operatingAdoptionGateText(r),
    );
    expect(captureValueText("operating_adoption", "Owners: Rosa")).toBe(
      "Owners: Rosa",
    );
    expect(captureValueGateText("operating_adoption", "Owners: Rosa")).toBe(
      "Owners: Rosa",
    );
  });
});
