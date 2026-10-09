import {
  acceptRootCause,
  addRootCause,
  confirmRootCauseOrder,
  editRootCause,
  emptyRootCauseRegister,
  moveRootCause,
  promoteSymptom,
  registerFromEarlierAnswer,
  reopenRootCause,
  resolveRootCauseStep,
  resolveRootCauseWithOwner,
  setAsideAsSymptom,
  type RootCauseEdit,
} from "@/lib/programs/root-cause-step";
import {
  serializeRootCauseRegister,
  type RootCauseEntry,
  type RootCauseRegister,
} from "@/lib/programs/root-cause-register";

const BY = "consultant@example.test";
const AT = "2026-10-02";

const reg = (
  causes: RootCauseEntry[],
  confirmed = false,
): RootCauseRegister => ({
  kind: "root_cause_register",
  version: 1,
  causes,
  ...(confirmed ? { orderConfirmedAt: AT, orderConfirmedBy: BY } : {}),
});
const c = (id: string, o: Partial<RootCauseEntry> = {}): RootCauseEntry => ({
  id,
  cause: `Cause ${id}`,
  status: "accepted",
  evidence: ["Profile"],
  ...o,
});
const done = (edit: RootCauseEdit): RootCauseRegister => {
  if (!edit.ok) throw new Error(edit.reason);
  return edit.register;
};
const ids = (r: RootCauseRegister) => r.causes.map((x) => x.id);

describe("ordering", () => {
  it("moves a ranked cause past symptoms, keeping symptoms in place, and clears the confirmation", () => {
    const start = reg(
      [c("RC-1"), c("S-1", { status: "symptom" }), c("RC-2")],
      true,
    );
    const moved = done(moveRootCause(start, "RC-2", "up"));
    expect(ids(moved)).toEqual(["RC-2", "S-1", "RC-1"]);
    expect(moved.orderConfirmedAt).toBeUndefined();
  });

  it("refuses a move off either end, and a move of a symptom", () => {
    const start = reg([c("RC-1"), c("RC-2"), c("S-1", { status: "symptom" })]);
    expect(moveRootCause(start, "RC-1", "up").ok).toBe(false);
    expect(moveRootCause(start, "RC-2", "down").ok).toBe(false);
    expect(moveRootCause(start, "S-1", "up").ok).toBe(false);
  });

  it("confirms the order only when something is ranked", () => {
    expect(confirmRootCauseOrder(emptyRootCauseRegister(), BY, AT).ok).toBe(
      false,
    );
    expect(
      done(confirmRootCauseOrder(reg([c("RC-1")]), BY, AT)).orderConfirmedAt,
    ).toBe(AT);
  });
});

describe("settling a cause", () => {
  it("accepts only on approved evidence", () => {
    const start = reg([c("RC-1", { status: "draft", evidence: undefined })]);
    const refused = acceptRootCause(start, "RC-1", BY, AT);
    expect(refused).toMatchObject({ ok: false });
    const accepted = done(
      acceptRootCause(reg([c("RC-1", { status: "draft" })]), "RC-1", BY, AT),
    );
    expect(accepted.causes[0]).toMatchObject({
      status: "accepted",
      decidedBy: BY,
      decidedAt: AT,
    });
  });

  it("resolves without evidence only with a named owner", () => {
    const start = reg([
      c("RC-1", { status: "no_evidence", evidence: undefined }),
    ]);
    expect(
      resolveRootCauseWithOwner(start, "RC-1", "known_gap", "  ", BY, AT).ok,
    ).toBe(false);
    const gap = done(
      resolveRootCauseWithOwner(
        start,
        "RC-1",
        "known_gap",
        "Master-data lead",
        BY,
        AT,
      ),
    );
    expect(gap.causes[0]).toMatchObject({
      status: "known_gap",
      owner: "Master-data lead",
    });
  });

  it("reopens to a draft when evidence remains, otherwise to no evidence, dropping the owner", () => {
    const withEvidence = done(reopenRootCause(reg([c("RC-1")], true), "RC-1"));
    expect(withEvidence.causes[0].status).toBe("draft");
    expect(withEvidence.orderConfirmedAt).toBeUndefined();
    const gap = reg([
      c("RC-1", { status: "known_gap", owner: "Owner", evidence: undefined }),
    ]);
    const reopened = done(reopenRootCause(gap, "RC-1")).causes[0];
    expect(reopened.status).toBe("no_evidence");
    expect(reopened.owner).toBeUndefined();
  });

  it("an accepted cause that loses its evidence on edit reopens", () => {
    const edited = done(
      editRootCause(reg([c("RC-1")]), "RC-1", {
        cause: "Reworded",
        evidence: [],
      }),
    );
    expect(edited.causes[0]).toMatchObject({
      cause: "Reworded",
      status: "no_evidence",
    });
  });
});

describe("adding and setting aside", () => {
  it("a cause the consultant writes settles only with a baseline link and evidence, and is ranked last", () => {
    const settled = done(
      addRootCause(
        reg([c("RC-3")], true),
        { cause: "New", drives: "Measures certified", evidence: ["Notes"] },
        BY,
        AT,
      ),
    );
    expect(settled.causes[1]).toMatchObject({
      id: "RC-4",
      status: "accepted",
      source: "team",
      decidedBy: BY,
    });
    expect(settled.orderConfirmedAt).toBeUndefined();
    const draft = done(
      addRootCause(
        reg([]),
        { cause: "Evidence only", evidence: ["Notes"] },
        BY,
        AT,
      ),
    );
    expect(draft.causes[0]).toMatchObject({ status: "draft", source: "team" });
    expect(draft.causes[0].decidedBy).toBeUndefined();
    const without = done(addRootCause(reg([]), { cause: "Unproven" }, BY, AT));
    expect(without.causes[0]).toMatchObject({
      id: "RC-1",
      status: "no_evidence",
    });
    expect(addRootCause(reg([]), { cause: "  " }, BY, AT).ok).toBe(false);
  });

  it("sets a cause aside as a symptom and promotes it back as the last-ranked draft", () => {
    const aside = done(
      setAsideAsSymptom(reg([c("RC-1"), c("RC-2")]), "RC-1", "RC-2"),
    );
    expect(aside.causes[0]).toMatchObject({
      status: "symptom",
      symptomOf: "RC-2",
    });
    const promoted = done(promoteSymptom(aside, "RC-1"));
    expect(ids(promoted)).toEqual(["RC-2", "RC-3"]);
    expect(promoted.causes[1]).toMatchObject({
      status: "draft",
      cause: "Cause RC-1",
    });
  });

  it("turns an earlier free-text answer into draft causes, one per line, losing nothing", () => {
    const register = registerFromEarlierAnswer(
      "- No ownership\n\n2. Definitions conflict\n• Lineage gaps",
    );
    expect(
      register.causes.map((x) => [x.id, x.cause, x.status, x.source]),
    ).toEqual([
      ["RC-1", "No ownership", "no_evidence", "legacy"],
      ["RC-2", "Definitions conflict", "no_evidence", "legacy"],
      ["RC-3", "Lineage gaps", "no_evidence", "legacy"],
    ]);
  });
});

describe("resolveRootCauseStep", () => {
  const value = (r: RootCauseRegister) => serializeRootCauseRegister(r);

  it("asks for the first cause when nothing is captured", () => {
    expect(resolveRootCauseStep("").nextAction).toMatchObject({
      state: "in_progress",
      sentence: "Add the first root cause.",
      continueEnabled: false,
    });
  });

  it("asks to turn an earlier free-text answer into causes", () => {
    expect(
      resolveRootCauseStep("Ownership is unclear.").nextAction.sentence,
    ).toBe("Turn your earlier answer into ranked causes.");
  });

  it("orders clauses: unevidenced causes, then drafts, then the order", () => {
    const model = resolveRootCauseStep(
      value(
        reg([
          c("RC-1"),
          c("RC-4", { status: "no_evidence", evidence: undefined }),
          c("RC-3", { status: "draft" }),
          c("RC-5", { status: "draft" }),
        ]),
      ),
    );
    expect(model.nextAction.sentence).toBe(
      "Find evidence for cause RC-4 (RC-4) or name its owner, review 2 drafts, and confirm the order.",
    );
    expect(model.countLabel).toBe("1 of 4 causes settled");
    expect(model.checks[0]).toMatchObject({ met: false, targetRowId: "RC-4" });
  });

  it("ready when every ranked cause is settled and the order confirmed", () => {
    const model = resolveRootCauseStep(
      value(
        reg(
          [
            c("RC-1"),
            c("RC-2", {
              status: "known_gap",
              owner: "Owner",
              evidence: undefined,
            }),
            c("S-1", { status: "symptom" }),
          ],
          true,
        ),
      ),
    );
    expect(model.nextAction).toMatchObject({
      state: "ready",
      continueEnabled: true,
    });
    expect(model.checks.every((check) => check.met)).toBe(true);
  });

  it("an unconfirmed order keeps a settled list open", () => {
    const model = resolveRootCauseStep(value(reg([c("RC-1")])));
    expect(model.nextAction).toMatchObject({
      state: "in_progress",
      sentence: "Confirm the order.",
    });
  });

  it("an extraction awaiting review leads the sentence and holds a complete step", () => {
    const model = resolveRootCauseStep(value(reg([c("RC-1")], true)), {
      leadingClauses: ["review the Duplicate-match report extraction"],
    });
    expect(model.nextAction).toMatchObject({
      state: "in_progress",
      sentence: "Review the Duplicate-match report extraction.",
      continueEnabled: false,
    });
  });

  it("blocked by an outside cause, Continue held", () => {
    const model = resolveRootCauseStep(value(reg([c("RC-1")], true)), {
      blockedBy: "Waiting on Step 2: the baseline was reopened",
    });
    expect(model.nextAction).toMatchObject({
      state: "blocked",
      continueEnabled: false,
    });
  });
});
