import {
  CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY,
  charterAssumptionResolutionActive,
  createCharterAssumptionResolutionRecord,
  parseCharterAssumptionResolutionInput,
  readCharterAssumptionResolutionRecord,
} from "@/lib/programs/charter-assumption-resolution";
import {
  createP1CharterBasisRecord,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";

const ANSWER = "Two FTE in shared services handle intake today.";

function storedResolution(args: {
  outcome?: unknown;
  note?: unknown;
  /** Record against a DIFFERENT answer, i.e. the answer was edited after. */
  recordedAgainst?: string;
  userId?: string;
  resolvedAt?: string;
  email?: string | null;
}) {
  const record = createCharterAssumptionResolutionRecord({
    input: { outcome: "confirmed", note: "Q3 extract shows two FTE." },
    sectionKey: "scope_boundary",
    value: args.recordedAgainst ?? ANSWER,
    userId: args.userId ?? "user_1",
    email: args.email === undefined ? "discover@example.test" : args.email,
    resolvedAt: args.resolvedAt ?? "2026-10-05T11:00:00.000Z",
  });
  return {
    ...record,
    ...(args.outcome === undefined ? {} : { outcome: args.outcome }),
    ...(args.note === undefined ? {} : { note: args.note }),
  };
}

describe("charterAssumptionResolutionActive", () => {
  it("is active on P2 with the flag on", () => {
    expect(
      charterAssumptionResolutionActive({ flagEnabled: true, phaseNumber: 2 }),
    ).toBe(true);
  });

  it("is off when the flag is off, with the phase otherwise satisfied", () => {
    expect(
      charterAssumptionResolutionActive({ flagEnabled: false, phaseNumber: 2 }),
    ).toBe(false);
  });

  it.each([0, 1, 3, 4, 5])(
    "is off on P%i, with the flag otherwise satisfied",
    (phaseNumber) => {
      expect(
        charterAssumptionResolutionActive({ flagEnabled: true, phaseNumber }),
      ).toBe(false);
    },
  );
});

describe("parseCharterAssumptionResolutionInput", () => {
  it.each(["confirmed", "corrected", "superseded"] as const)(
    "accepts the %s outcome",
    (outcome) => {
      expect(
        parseCharterAssumptionResolutionInput({ outcome, note: "What we found." }),
      ).toEqual({ outcome, note: "What we found." });
    },
  );

  it("rejects an outcome outside the three, with a usable note", () => {
    expect(
      parseCharterAssumptionResolutionInput({
        outcome: "validated",
        note: "What we found.",
      }),
    ).toBeNull();
  });

  it("rejects a blank note, with a usable outcome", () => {
    expect(
      parseCharterAssumptionResolutionInput({ outcome: "confirmed", note: "" }),
    ).toBeNull();
  });

  it("rejects a whitespace-only note, so an outcome never stands on nothing", () => {
    expect(
      parseCharterAssumptionResolutionInput({
        outcome: "corrected",
        note: "   \n ",
      }),
    ).toBeNull();
  });

  it("trims the note it accepts", () => {
    expect(
      parseCharterAssumptionResolutionInput({
        outcome: "confirmed",
        note: "  Checked against the extract.  ",
      }),
    ).toEqual({ outcome: "confirmed", note: "Checked against the extract." });
  });

  it.each([null, undefined, "confirmed", 7, [{ outcome: "confirmed" }]])(
    "rejects %p, which is not a resolution object",
    (raw) => {
      expect(parseCharterAssumptionResolutionInput(raw)).toBeNull();
    },
  );
});

describe("readCharterAssumptionResolutionRecord", () => {
  it("reads back a resolution recorded against the current answer", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({}),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toMatchObject({
      outcome: "confirmed",
      note: "Q3 extract shows two FTE.",
      resolvedByUserId: "user_1",
      resolvedByEmail: "discover@example.test",
      resolvedAt: "2026-10-05T11:00:00.000Z",
    });
  });

  it("returns null when the answer was edited after the resolution", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({
        recordedAgainst: "One FTE in shared services handles intake today.",
      }),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toBeNull();
  });

  it("returns null for a different section's answer, so a resolution cannot travel", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({}),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "success_criteria", ANSWER),
    ).toBeNull();
  });

  it("returns null when nothing is stored", () => {
    expect(
      readCharterAssumptionResolutionRecord(
        { value: ANSWER },
        "scope_boundary",
        ANSWER,
      ),
    ).toBeNull();
  });

  it.each([null, undefined])("returns null for %p state", (state) => {
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toBeNull();
  });

  it("returns null when the resolver is blank, with the revision and timestamp valid", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({
        userId: "   ",
      }),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toBeNull();
  });

  it("returns null when the timestamp is blank, with the revision and resolver valid", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({
        resolvedAt: "",
      }),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toBeNull();
  });

  it("returns null when the outcome is unrecognised, with everything else valid", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({
        outcome: "validated",
      }),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toBeNull();
  });

  it("returns null when the note is blank, with everything else valid", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({ note: " " }),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).toBeNull();
  });

  it("records a null resolver email rather than inventing one", () => {
    const state = {
      value: ANSWER,
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({
        email: null,
      }),
    };
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER)
        ?.resolvedByEmail,
    ).toBeNull();
  });
});

describe("the sibling-key decision", () => {
  /**
   * The resolution lives beside `p1_charter_basis`, not inside it, because the
   * basis writer assigns that key wholesale. These two pin the consequence in
   * both directions: the basis read is unchanged by a resolution sitting next
   * to it, and a re-declared basis cannot carry a resolution away with it.
   */
  const basisState = () => ({
    value: ANSWER,
    p1_charter_basis: createP1CharterBasisRecord({
      input: {
        kind: "assumption",
        owner: "Head of Shared Services",
        p2ValidationPlan: "Confirm against the Q3 volume extract.",
      },
      sectionKey: "scope_boundary",
      value: ANSWER,
      userId: "user_1",
      email: "capture@example.test",
      recordedAt: "2026-10-05T09:00:00.000Z",
    }),
    [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: storedResolution({}),
  });

  it("leaves the recorded basis readable and unchanged", () => {
    expect(
      readP1CharterBasisRecord(basisState(), "scope_boundary", ANSWER),
    ).toMatchObject({
      kind: "assumption",
      owner: "Head of Shared Services",
      recordedAt: "2026-10-05T09:00:00.000Z",
    });
  });

  it("keeps the resolution out of the basis record the reader returns", () => {
    const basis = readP1CharterBasisRecord(
      basisState(),
      "scope_boundary",
      ANSWER,
    ) as Record<string, unknown> | null;
    expect(basis).not.toBeNull();
    expect(basis).not.toHaveProperty("outcome");
    expect(basis).not.toHaveProperty(
      CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY,
    );
  });

  it("survives a wholesale rewrite of the basis key", () => {
    const state: Record<string, unknown> = basisState();
    state.p1_charter_basis = createP1CharterBasisRecord({
      input: {
        kind: "assumption",
        owner: "Director of Operations",
        p2ValidationPlan: "Confirm against the Q3 volume extract.",
      },
      sectionKey: "scope_boundary",
      value: ANSWER,
      userId: "user_2",
      email: "capture2@example.test",
      recordedAt: "2026-10-05T10:00:00.000Z",
    });
    expect(
      readCharterAssumptionResolutionRecord(state, "scope_boundary", ANSWER),
    ).not.toBeNull();
  });
});
