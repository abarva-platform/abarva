import {
  DONE_SENTENCE,
  SKIPPED_SENTENCE,
  buildNextActionSentence,
  groupStepRows,
  resolveStepNextAction,
  type StepPageInput,
  type StepRow,
} from "@/lib/programs/step-page-model";

const row = (
  overrides: Partial<StepRow> & Pick<StepRow, "id" | "rank">,
): StepRow => ({
  subject: `subject ${overrides.id}`,
  state: "settled",
  ...overrides,
});

const base = (
  rows: StepRow[],
  extra: Partial<StepPageInput> = {},
): StepPageInput => ({
  depth: "full",
  rows,
  readySentence:
    "Every root cause has a design element. Continue to Architecture options",
  emptySentence: "Add the design session output",
  ...extra,
});

describe("groupStepRows", () => {
  it("keeps the fixed group order and upstream rank within each group", () => {
    const groups = groupStepRows([
      row({ id: "RC-3", rank: 3, state: "draft" }),
      row({ id: "RC-4", rank: 4, state: "decision" }),
      row({ id: "RC-1", rank: 1, state: "settled" }),
      row({ id: "RC-2", rank: 2, state: "decision" }),
      row({ id: "RC-5", rank: 5, state: "draft" }),
    ]);
    expect(groups.decision.map((r) => r.id)).toEqual(["RC-2", "RC-4"]);
    expect(groups.draft.map((r) => r.id)).toEqual(["RC-3", "RC-5"]);
    expect(groups.settled.map((r) => r.id)).toEqual(["RC-1"]);
  });

  it("places ranked and set-aside rows in their own groups", () => {
    const groups = groupStepRows([
      row({ id: "S-1", rank: 9, state: "set_aside" }),
      row({ id: "RC-2", rank: 2, state: "ranked" }),
      row({ id: "RC-1", rank: 1, state: "ranked" }),
    ]);
    expect(groups.ranked.map((r) => r.id)).toEqual(["RC-1", "RC-2"]);
    expect(groups.setAside.map((r) => r.id)).toEqual(["S-1"]);
  });
});

describe("buildNextActionSentence", () => {
  it("returns null when nothing is open", () => {
    expect(buildNextActionSentence([row({ id: "A", rank: 1 })])).toBeNull();
  });

  it("uses a single decision's own clause as the sentence", () => {
    expect(
      buildNextActionSentence([
        row({
          id: "RC-4",
          rank: 4,
          state: "decision",
          clause: "decide who designs identity resolution",
        }),
      ]),
    ).toBe("Decide who designs identity resolution.");
  });

  it("joins two clauses with and, decisions before drafts", () => {
    expect(
      buildNextActionSentence([
        row({ id: "RC-1", rank: 1, state: "draft" }),
        row({ id: "RC-2", rank: 2, state: "draft" }),
        row({
          id: "RC-4",
          rank: 4,
          state: "decision",
          clause: "settle the quality-handling conflict",
        }),
      ]),
    ).toBe("Settle the quality-handling conflict and review 2 drafts.");
  });

  it("joins three or more clauses with commas and a final ', and'", () => {
    expect(
      buildNextActionSentence([
        row({
          id: "RC-5",
          rank: 5,
          state: "decision",
          clause: "settle the quality-handling conflict",
        }),
        row({
          id: "RC-4",
          rank: 4,
          state: "decision",
          clause: "decide who designs identity resolution",
        }),
        row({
          id: "RC-2",
          rank: 2,
          state: "draft",
          draftName: "the PHI access draft",
        }),
      ]),
    ).toBe(
      "Decide who designs identity resolution, settle the quality-handling conflict, and review the PHI access draft.",
    );
  });

  it("keeps at most three clauses, pointing to the rest below", () => {
    expect(
      buildNextActionSentence([
        row({ id: "A", rank: 1, state: "decision", clause: "decide a" }),
        row({ id: "B", rank: 2, state: "decision", clause: "decide b" }),
        row({ id: "C", rank: 3, state: "decision", clause: "decide c" }),
        row({ id: "D", rank: 4, state: "draft" }),
      ]),
    ).toBe("Decide a, decide b, and 2 more below.");
  });

  it("states exactly three clauses in full", () => {
    expect(
      buildNextActionSentence([
        row({ id: "A", rank: 1, state: "decision", clause: "decide a" }),
        row({ id: "B", rank: 2, state: "decision", clause: "decide b" }),
        row({ id: "D", rank: 4, state: "draft" }),
      ]),
    ).toBe("Decide a, decide b, and review 1 draft.");
  });

  it("puts the ranking's one clause between decisions and reviews", () => {
    expect(
      buildNextActionSentence(
        [
          row({ id: "D", rank: 9, state: "draft" }),
          row({ id: "RC-1", rank: 1, state: "ranked" }),
          row({ id: "RC-2", rank: 2, state: "ranked" }),
          row({
            id: "G",
            rank: 5,
            state: "decision",
            clause: "find evidence for identity or name its owner",
          }),
        ],
        { rankingClause: "confirm the order of the root causes" },
      ),
    ).toBe(
      "Find evidence for identity or name its owner, confirm the order of the root causes, and review 1 draft.",
    );
  });

  it("does not treat set-aside rows as open", () => {
    expect(
      buildNextActionSentence([row({ id: "S", rank: 1, state: "set_aside" })]),
    ).toBeNull();
  });

  it("names a lone draft when it has a name and counts it when it does not", () => {
    expect(
      buildNextActionSentence([
        row({
          id: "A",
          rank: 1,
          state: "draft",
          draftName: "the PHI access draft",
        }),
      ]),
    ).toBe("Review the PHI access draft.");
    expect(
      buildNextActionSentence([row({ id: "A", rank: 1, state: "draft" })]),
    ).toBe("Review 1 draft.");
  });

  it("counts drafts when there are several, even if each has a name", () => {
    expect(
      buildNextActionSentence([
        row({ id: "A", rank: 1, state: "draft", draftName: "the A draft" }),
        row({ id: "B", rank: 2, state: "draft", draftName: "the B draft" }),
      ]),
    ).toBe("Review 2 drafts.");
  });

  it("falls back to the subject when a decision row brings no clause", () => {
    expect(
      buildNextActionSentence([
        row({
          id: "RC-6",
          rank: 6,
          state: "decision",
          subject: "how unmatched records are handled",
        }),
      ]),
    ).toBe("Decide how unmatched records are handled.");
  });
});

describe("resolveStepNextAction", () => {
  const open = [
    row({ id: "RC-1", rank: 1 }),
    row({
      id: "RC-2",
      rank: 2,
      state: "decision",
      clause: "decide who owns matching",
    }),
  ];
  const allSettled = [
    row({ id: "RC-1", rank: 1 }),
    row({ id: "RC-2", rank: 2 }),
  ];

  it("in progress: the generated sentence, the count, Continue disabled", () => {
    expect(resolveStepNextAction(base(open))).toEqual({
      state: "in_progress",
      eyebrow: "Next",
      sentence: "Decide who owns matching.",
      settled: 1,
      total: 2,
      continueEnabled: false,
    });
  });

  it("ready: every row settled enables Continue with the step's own sentence", () => {
    const action = resolveStepNextAction(base(allSettled));
    expect(action.state).toBe("ready");
    expect(action.eyebrow).toBe("✓ Ready");
    expect(action.sentence).toBe(
      "Every root cause has a design element. Continue to Architecture options.",
    );
    expect(action.continueEnabled).toBe(true);
  });

  it("blocked: an outside cause wins over settled rows and keeps Continue disabled", () => {
    const action = resolveStepNextAction(
      base(allSettled, { blockedBy: "P2 has no accepted root causes" }),
    );
    expect(action).toMatchObject({
      state: "blocked",
      eyebrow: "Blocked",
      sentence: "P2 has no accepted root causes.",
      settled: 2,
      continueEnabled: false,
    });
  });

  it("skipped: the depth wins over open rows and blocks, by attestation", () => {
    const action = resolveStepNextAction(
      base(open, { depth: "skip", blockedBy: "anything" }),
    );
    expect(action).toMatchObject({
      state: "skipped",
      sentence: SKIPPED_SENTENCE,
      continueEnabled: true,
    });
  });

  it("done: recorded done with every row settled shows the date", () => {
    const action = resolveStepNextAction(
      base(allSettled, { doneAt: "2026-10-09T15:00:00Z" }),
    );
    expect(action).toMatchObject({
      state: "done",
      eyebrow: "✓ Done · Oct 9",
      sentence: DONE_SENTENCE,
      continueEnabled: true,
    });
  });

  it("a reopened row overrides a stale done record", () => {
    const action = resolveStepNextAction(
      base(open, { doneAt: "2026-10-09T15:00:00Z" }),
    );
    expect(action.state).toBe("in_progress");
    expect(action.continueEnabled).toBe(false);
  });

  it("an unreadable done date reads as ready, not done", () => {
    expect(
      resolveStepNextAction(base(allSettled, { doneAt: "not a date" })).state,
    ).toBe("ready");
  });

  it("a step with no rows is not ready: it asks for its first input", () => {
    const action = resolveStepNextAction(base([]));
    expect(action).toMatchObject({
      state: "in_progress",
      sentence: "Add the design session output.",
      settled: 0,
      total: 0,
      continueEnabled: false,
    });
  });

  it("a light step runs the same rules as a full one", () => {
    expect(resolveStepNextAction(base(open, { depth: "light" })).state).toBe(
      "in_progress",
    );
    expect(
      resolveStepNextAction(base(allSettled, { depth: "light" })).state,
    ).toBe("ready");
  });

  it("leaves set-aside rows out of the count and out of readiness", () => {
    const action = resolveStepNextAction(
      base([
        row({ id: "A", rank: 1 }),
        row({ id: "S", rank: 2, state: "set_aside" }),
      ]),
    );
    expect(action).toMatchObject({ state: "ready", settled: 1, total: 1 });
  });

  it("an unconfirmed ranking keeps the step open", () => {
    const action = resolveStepNextAction(
      base([row({ id: "A", rank: 1, state: "ranked" })], {
        rankingClause: "confirm the order",
      }),
    );
    expect(action).toMatchObject({
      state: "in_progress",
      sentence: "Confirm the order.",
      continueEnabled: false,
    });
  });

  it("a blank block reason is not a block", () => {
    expect(
      resolveStepNextAction(base(allSettled, { blockedBy: "   " })).state,
    ).toBe("ready");
  });
});
