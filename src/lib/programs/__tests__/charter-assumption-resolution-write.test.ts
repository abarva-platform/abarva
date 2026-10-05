import {
  CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY,
  createCharterAssumptionResolutionRecord,
  readCharterAssumptionResolutionRecord,
} from "@/lib/programs/charter-assumption-resolution";
import {
  charterSectionModuleKey,
  planCharterAssumptionResolutionWrite,
} from "@/lib/programs/charter-assumption-resolution-write";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  createP1CharterBasisRecord,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";
import type { P1CharterBasisInput } from "@/lib/programs/p1-charter-evidence";

const ASSUMPTION: P1CharterBasisInput = {
  kind: "assumption",
  owner: "Head of Shared Services",
  p2ValidationPlan: "Confirm against the Q3 volume extract in Discover.",
};

const FINDING = {
  outcome: "corrected" as const,
  note: "The extract shows 4 intake queues, not 2.",
};

function moduleRow(args: {
  sectionKey: string;
  value: string;
  basis?: P1CharterBasisInput;
  /** Record the basis against a DIFFERENT value, i.e. the answer was edited after. */
  basisRecordedAgainst?: string;
  resolved?: boolean;
  /** Resolve against a DIFFERENT value, i.e. the answer was edited after. */
  resolvedAgainst?: string;
  /** Extra state keys that must survive the write untouched. */
  extra?: Record<string, unknown>;
}) {
  const state: Record<string, unknown> = { value: args.value, ...args.extra };
  if (args.basis) {
    state.p1_charter_basis = createP1CharterBasisRecord({
      input: args.basis,
      sectionKey: args.sectionKey,
      value: args.basisRecordedAgainst ?? args.value,
      userId: "user_1",
      email: "capture@example.test",
      recordedAt: "2026-10-05T09:00:00.000Z",
    });
  }
  if (args.resolved || args.resolvedAgainst) {
    state[CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY] =
      createCharterAssumptionResolutionRecord({
        input: { outcome: "confirmed", note: "Confirmed in the Q3 extract." },
        sectionKey: args.sectionKey,
        value: args.resolvedAgainst ?? args.value,
        userId: "user_2",
        email: "discover@example.test",
        resolvedAt: "2026-10-05T11:00:00.000Z",
      });
  }
  return { moduleKey: charterSectionModuleKey(args.sectionKey), status: "completed", state };
}

const SECTION = P1_CHARTER_EVIDENCE_FAMILIES[1].sectionKey;
const ANSWER = "Intake only; downstream adjudication is out of scope.";

function plan(overrides: Partial<Parameters<typeof planCharterAssumptionResolutionWrite>[0]> = {}) {
  return planCharterAssumptionResolutionWrite({
    flagEnabled: true,
    phaseNumber: 2,
    sectionKey: SECTION,
    rawInput: FINDING,
    modules: [moduleRow({ sectionKey: SECTION, value: ANSWER, basis: ASSUMPTION })],
    userId: "user_2",
    email: "discover@example.test",
    resolvedAt: "2026-10-05T12:00:00.000Z",
    ...overrides,
  });
}

describe("planCharterAssumptionResolutionWrite — the write it allows", () => {
  it("names the one charter capture row to persist onto", () => {
    const result = plan();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.moduleKey).toBe(`phase_1_${SECTION}`);
    expect(result.sectionKey).toBe(SECTION);
  });

  it("stamps the finding, the resolver and the time the caller supplied", () => {
    const result = plan();
    if (!result.ok) throw new Error("expected a write plan");
    expect(result.record.outcome).toBe("corrected");
    expect(result.record.note).toBe(FINDING.note);
    expect(result.record.resolvedByUserId).toBe("user_2");
    expect(result.record.resolvedByEmail).toBe("discover@example.test");
    expect(result.record.resolvedAt).toBe("2026-10-05T12:00:00.000Z");
  });

  it("pins the resolution to the answer's wording, so the read accepts it back", () => {
    const result = plan();
    if (!result.ok) throw new Error("expected a write plan");
    expect(
      readCharterAssumptionResolutionRecord(result.nextState, SECTION, ANSWER),
    ).toEqual(result.record);
  });

  it("pins it tightly enough that the read drops it once the answer is edited", () => {
    const result = plan();
    if (!result.ok) throw new Error("expected a write plan");
    expect(
      readCharterAssumptionResolutionRecord(
        result.nextState,
        SECTION,
        `${ANSWER} Also claims intake.`,
      ),
    ).toBeNull();
  });

  it("leaves the basis byte-identical — a finding does not re-declare how P1 knew", () => {
    const row = moduleRow({ sectionKey: SECTION, value: ANSWER, basis: ASSUMPTION });
    const result = plan({ modules: [row] });
    if (!result.ok) throw new Error("expected a write plan");
    expect(result.nextState.p1_charter_basis).toEqual(row.state.p1_charter_basis);
    expect(readP1CharterBasisRecord(result.nextState, SECTION, ANSWER)).toEqual(
      readP1CharterBasisRecord(row.state, SECTION, ANSWER),
    );
  });

  it("carries every other key on the row through untouched", () => {
    const extra = { value_source: "workspace", attachments: ["a1"] };
    const result = plan({
      modules: [moduleRow({ sectionKey: SECTION, value: ANSWER, basis: ASSUMPTION, extra })],
    });
    if (!result.ok) throw new Error("expected a write plan");
    expect(result.nextState.value).toBe(ANSWER);
    expect(result.nextState.value_source).toBe("workspace");
    expect(result.nextState.attachments).toEqual(["a1"]);
  });

  it("does not mutate the row it was given", () => {
    const row = moduleRow({ sectionKey: SECTION, value: ANSWER, basis: ASSUMPTION });
    const before = JSON.stringify(row.state);
    plan({ modules: [row] });
    expect(JSON.stringify(row.state)).toBe(before);
  });

  it("accepts every outcome the model defines", () => {
    for (const outcome of ["confirmed", "corrected", "superseded"] as const) {
      const result = plan({ rawInput: { outcome, note: "What Discover found." } });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.outcome).toBe(outcome);
    }
  });

  it("writes against any canonical charter field, not just one", () => {
    for (const family of P1_CHARTER_EVIDENCE_FAMILIES) {
      const result = plan({
        sectionKey: family.sectionKey,
        modules: [
          moduleRow({ sectionKey: family.sectionKey, value: ANSWER, basis: ASSUMPTION }),
        ],
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.moduleKey).toBe(`phase_1_${family.sectionKey}`);
    }
  });
});

describe("planCharterAssumptionResolutionWrite — what it refuses", () => {
  function refusalOf(overrides: Parameters<typeof plan>[0]) {
    const result = plan(overrides);
    if (result.ok) throw new Error("expected a refusal, got a write plan");
    return result.refusal;
  }

  it("refuses with the flag off for the tenant", () => {
    expect(refusalOf({ flagEnabled: false })).toBe("inactive");
  });

  it("refuses off P2 — the phase that does the validating the plan names", () => {
    for (const phaseNumber of [0, 1, 3, 4, 5]) {
      expect(refusalOf({ phaseNumber })).toBe("inactive");
    }
  });

  it("names the flag first, even when the payload is also unusable", () => {
    expect(refusalOf({ flagEnabled: false, rawInput: null })).toBe("inactive");
  });

  it("refuses an outcome it does not define", () => {
    expect(refusalOf({ rawInput: { outcome: "closed", note: "Looks fine." } })).toBe(
      "invalid_input",
    );
  });

  it("refuses an outcome with no finding behind it", () => {
    expect(refusalOf({ rawInput: { outcome: "confirmed", note: "   " } })).toBe(
      "invalid_input",
    );
    expect(refusalOf({ rawInput: { outcome: "confirmed" } })).toBe("invalid_input");
    expect(refusalOf({ rawInput: null })).toBe("invalid_input");
  });

  it("refuses a section that is not a canonical charter field", () => {
    expect(
      refusalOf({
        sectionKey: "problem_statement",
        modules: [
          moduleRow({ sectionKey: "problem_statement", value: ANSWER, basis: ASSUMPTION }),
        ],
      }),
    ).toBe("unknown_section");
  });

  it("refuses when the charter field has no capture row", () => {
    expect(refusalOf({ modules: [] })).toBe("module_missing");
    expect(
      refusalOf({
        modules: [
          moduleRow({
            sectionKey: P1_CHARTER_EVIDENCE_FAMILIES[0].sectionKey,
            value: ANSWER,
            basis: ASSUMPTION,
          }),
        ],
      }),
    ).toBe("module_missing");
  });

  it("refuses a field with no basis declared at all", () => {
    expect(
      refusalOf({ modules: [moduleRow({ sectionKey: SECTION, value: ANSWER })] }),
    ).toBe("not_an_assumption");
  });

  it("refuses a field answered from approved evidence or a plain assertion", () => {
    for (const basis of [
      { kind: "approved_evidence", evidenceId: "ev_1" },
      { kind: "workspace_assertion" },
    ] as P1CharterBasisInput[]) {
      expect(
        refusalOf({ modules: [moduleRow({ sectionKey: SECTION, value: ANSWER, basis })] }),
      ).toBe("not_an_assumption");
    }
  });

  it("refuses when the answer was edited after the assumption was declared", () => {
    expect(
      refusalOf({
        modules: [
          moduleRow({
            sectionKey: SECTION,
            value: ANSWER,
            basis: ASSUMPTION,
            basisRecordedAgainst: "Intake and adjudication both in scope.",
          }),
        ],
      }),
    ).toBe("not_an_assumption");
  });

  it("refuses to overwrite a resolution that already stands", () => {
    expect(
      refusalOf({
        modules: [
          moduleRow({
            sectionKey: SECTION,
            value: ANSWER,
            basis: ASSUMPTION,
            resolved: true,
          }),
        ],
      }),
    ).toBe("already_resolved");
  });

  it("allows a write when the standing resolution is stale against the answer", () => {
    const result = plan({
      modules: [
        moduleRow({
          sectionKey: SECTION,
          value: ANSWER,
          basis: ASSUMPTION,
          resolvedAgainst: "Intake and adjudication both in scope.",
        }),
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("refuses rather than writing a resolution the read would then hide", () => {
    const row = moduleRow({
      sectionKey: SECTION,
      value: ANSWER,
      basis: ASSUMPTION,
      basisRecordedAgainst: "Intake and adjudication both in scope.",
    });
    const result = plan({ modules: [row] });
    expect(result.ok).toBe(false);
    expect(row.state[CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]).toBeUndefined();
  });
});
