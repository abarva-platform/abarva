/**
 * The charter bridge: one register row per P1 charter answer left standing on
 * an assumption, the stale reading when the charter answer changes, and the
 * P2 carry-forward band treating an answered register row as resolved.
 *
 * What is pinned:
 *   - the row a declaration becomes: origin `charter_carry_forward`,
 *     confidence 1, raised in phase 1, owner role from the basis, pinned to
 *     the basis's value revision, keyed on the charter section;
 *   - idempotence: a section that already has a row is never written again, so
 *     a second load writes nothing; a read-only viewer never causes a write;
 *   - stale: a row whose charter answer changed since it was raised, until it
 *     is answered after the current basis was declared;
 *   - resolution: an answered row (directly or through the row that superseded
 *     it) drops the assumption from the P2 band; a stale answer does not;
 *   - a failed register read is `unavailable`, never "nothing resolved".
 */
jest.mock("server-only", () => ({}));

const mockList = jest.fn();
const mockUpsert = jest.fn();
jest.mock("../assumption-register/store", () => {
  const actual = jest.requireActual("../assumption-register/store");
  return {
    RegisterHistoryWriteError: actual.RegisterHistoryWriteError,
    listAssumptions: (...args: unknown[]) => mockList(...args),
    upsertCharterAssumption: (...args: unknown[]) => mockUpsert(...args),
  };
});
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => {
    throw new Error("the bridge test never reaches the data plane");
  },
}));

import {
  CHARTER_SECTION_AREA,
  bridgeCharterAssumptions,
  charterBridgeMayWrite,
  charterBridgeMount,
  charterOwnerFields,
  charterRegisterInput,
  charterRegisterStanding,
  declaredCharterAssumptions,
} from "../assumption-register/charter-bridge";
import {
  agentContextAssumptions,
  toApprovedAssumption,
  toGovernedObject,
  type AssumptionRecord,
  type NewAssumptionInput,
} from "../assumption-register/model";
import {
  CHARTER_OWNER_ROLE_PLACEHOLDER,
  ownerNeedsRole,
} from "../assumption-register/owner-role";
import { RegisterHistoryWriteError } from "../assumption-register/store";
import { carriedCharterAssumptions } from "../charter-assumptions-carry-forward";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  createP1CharterBasisRecord,
} from "../p1-charter-evidence";
import { computeCaptureRevision } from "../phase-capture-integrity";
import type { TenancyCtx } from "../types.db";

const ctx = {
  clientId: "client-1",
  clientKey: "meridian",
  userId: "viewer-1",
} as unknown as TenancyCtx;
const MOVE_ID = "move-1";
const DECLARED_AT = "2026-10-05T09:00:00.000Z";

const SCOPE = "scope_boundary";
const SPONSOR = "sponsor_commitment";

function charterModule(args: {
  sectionKey: string;
  value: string;
  /** Declare the basis against a different value: the answer was edited after. */
  declaredAgainst?: string;
  kind?: "assumption" | "workspace_assertion";
  owner?: string;
}) {
  return {
    moduleKey: `phase_1_${args.sectionKey}`,
    status: "completed",
    state: {
      value: args.value,
      p1_charter_basis: createP1CharterBasisRecord({
        input:
          args.kind === "workspace_assertion"
            ? { kind: "workspace_assertion" }
            : {
                kind: "assumption",
                owner: args.owner ?? "Head of Shared Services",
                p2ValidationPlan: "Confirm against the Q3 volume extract.",
              },
        sectionKey: args.sectionKey,
        value: args.declaredAgainst ?? args.value,
        userId: "declarer-1",
        email: null,
        recordedAt: DECLARED_AT,
      }),
    },
  };
}

const revisionOf = (sectionKey: string, value: string) =>
  computeCaptureRevision({ [sectionKey]: value });

let idCounter = 0;
function record(overrides: Partial<AssumptionRecord>): AssumptionRecord {
  idCounter += 1;
  return {
    id: `row-${idCounter}`,
    tenantKey: "meridian",
    programId: MOVE_ID,
    area: "delivery",
    seq: idCounter,
    registerId: `DL${idCounter}`,
    statement: "Seeded",
    whyItMatters: null,
    workingFigure: null,
    workingValue: null,
    unit: null,
    source: "P1 charter",
    confidence: 1,
    ownerRole: "Head of Shared Services",
    ownerName: null,
    ownerPersonId: null,
    status: "open",
    origin: "charter_carry_forward",
    answer: null,
    answerFigure: null,
    answerValue: null,
    answerSource: null,
    answeredByUserId: null,
    answeredAt: null,
    acceptedByUserId: null,
    acceptedAt: null,
    supersededBy: null,
    raisedPhase: 1,
    raisedStepId: null,
    evidenceIds: [],
    charterSectionKey: null,
    charterValueRevision: null,
    revision: 1,
    createdByUserId: "declarer-1",
    createdAt: DECLARED_AT,
    updatedAt: DECLARED_AT,
    ...overrides,
  };
}

const scopeRow = (overrides: Partial<AssumptionRecord> = {}) =>
  record({
    charterSectionKey: SCOPE,
    charterValueRevision: revisionOf(SCOPE, "Claims intake only."),
    ...overrides,
  });

beforeEach(() => {
  mockList.mockReset();
  mockUpsert.mockReset();
  idCounter = 0;
});

describe("the row a charter assumption becomes", () => {
  it("every canonical charter section has a register area", () => {
    for (const family of P1_CHARTER_EVIDENCE_FAMILIES) {
      expect(CHARTER_SECTION_AREA[family.sectionKey]).toBeDefined();
    }
  });

  it("is a charter carry-forward at confidence 1, raised in phase 1, owned by the basis owner, pinned to the basis revision", () => {
    const [declared] = declaredCharterAssumptions([
      charterModule({
        sectionKey: SCOPE,
        value: "Claims intake only.",
        owner: "Claims operations lead",
      }),
    ]);
    expect(charterRegisterInput(declared)).toEqual({
      area: "delivery",
      statement: "Scope boundary: Claims intake only.",
      whyItMatters:
        "Validation plan from the charter: Confirm against the Q3 volume extract.",
      source: "P1 charter, Scope boundary, declared as an assumption",
      confidence: 1,
      ownerRole: "Claims operations lead",
      ownerName: null,
      origin: "charter_carry_forward",
      raisedPhase: 1,
      charterSectionKey: SCOPE,
      charterValueRevision: revisionOf(SCOPE, "Claims intake only."),
    });
  });

  it("success criteria land in the value area", () => {
    const [declared] = declaredCharterAssumptions([
      charterModule({
        sectionKey: "success_criteria",
        value: "Handle time -10%",
      }),
    ]);
    expect(charterRegisterInput(declared).area).toBe("value");
  });

  it("only an assumption basis against the CURRENT wording is declared", () => {
    expect(
      declaredCharterAssumptions([
        charterModule({
          sectionKey: SCOPE,
          value: "Edited answer",
          declaredAgainst: "Old answer",
        }),
        charterModule({
          sectionKey: SPONSOR,
          value: "Sponsor ok",
          kind: "workspace_assertion",
        }),
      ]),
    ).toEqual([]);
  });
});

describe("bridgeCharterAssumptions", () => {
  const modules = [
    charterModule({ sectionKey: SCOPE, value: "Claims intake only." }),
    charterModule({ sectionKey: SPONSOR, value: "Two days a month." }),
  ];

  it("adds one row per declared section, attributed to the person who declared it", async () => {
    mockList.mockResolvedValue([]);
    mockUpsert.mockImplementation(async (_ctx, _program, input) => ({
      ok: true,
      created: true,
      record: record({
        charterSectionKey: input.charterSectionKey,
        charterValueRevision: input.charterValueRevision,
      }),
    }));
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(
      mockUpsert.mock.calls.map((call) => call[2].charterSectionKey),
    ).toEqual([SPONSOR, SCOPE]);
    for (const call of mockUpsert.mock.calls) {
      expect(call[0]).toBe(ctx);
      expect(call[1]).toBe(MOVE_ID);
      expect(call[3]).toEqual({ kind: "person", userId: "declarer-1" });
    }
    expect(outcome).toEqual({
      status: "ok",
      created: 2,
      unbridgedSectionKeys: [],
      staleAssumptionIds: [],
      resolvedSectionKeys: [],
    });
  });

  it("is idempotent: a section that already has a row is never written again", async () => {
    mockList.mockResolvedValue([
      scopeRow(),
      record({
        charterSectionKey: SPONSOR,
        charterValueRevision: revisionOf(SPONSOR, "Two days a month."),
      }),
    ]);
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ status: "ok", created: 0 });
  });

  it("writes only the missing section", async () => {
    mockList.mockResolvedValue([scopeRow()]);
    mockUpsert.mockResolvedValue({
      ok: true,
      created: true,
      record: record({ charterSectionKey: SPONSOR }),
    });
    await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][2].charterSectionKey).toBe(SPONSOR);
  });

  it("a row another load stored first is not counted as created", async () => {
    mockList.mockResolvedValue([scopeRow()]);
    mockUpsert.mockResolvedValue({
      ok: true,
      created: false,
      record: record({ charterSectionKey: SPONSOR }),
    });
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(outcome).toMatchObject({
      status: "ok",
      created: 0,
      unbridgedSectionKeys: [],
    });
  });

  it("with write off, reads only and reports the missing sections as unbridged", async () => {
    mockList.mockResolvedValue([scopeRow()]);
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: false,
    });
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "ok",
      created: 0,
      unbridgedSectionKeys: [SPONSOR],
    });
  });

  it("a refused or failed write leaves that section unbridged and carries on", async () => {
    mockList.mockResolvedValue([]);
    mockUpsert
      .mockResolvedValueOnce({
        ok: false,
        refusal: { code: "unknown_program" },
      })
      .mockRejectedValueOnce(new Error("connection reset"));
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(outcome).toMatchObject({
      status: "ok",
      created: 0,
      unbridgedSectionKeys: [SPONSOR, SCOPE],
    });
  });

  it("a row whose history event failed DID land, and counts as created", async () => {
    mockList.mockResolvedValue([scopeRow()]);
    mockUpsert.mockRejectedValue(
      new RegisterHistoryWriteError(
        record({ charterSectionKey: SPONSOR }),
        new Error("events down"),
      ),
    );
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(outcome).toMatchObject({
      status: "ok",
      created: 1,
      unbridgedSectionKeys: [],
    });
  });

  it("a failed register read is unavailable, and writes nothing", async () => {
    mockList.mockRejectedValue(new Error("register down"));
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules,
      write: true,
    });
    expect(outcome).toEqual({ status: "unavailable" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("reports the standing AFTER its own writes", async () => {
    const edited = [
      charterModule({ sectionKey: SCOPE, value: "Claims intake and triage." }),
      charterModule({ sectionKey: SPONSOR, value: "Two days a month." }),
    ];
    // The scope row was raised against the previous wording.
    const stale = scopeRow();
    mockList.mockResolvedValue([stale]);
    mockUpsert.mockResolvedValue({
      ok: true,
      created: true,
      record: record({
        charterSectionKey: SPONSOR,
        charterValueRevision: revisionOf(SPONSOR, "Two days a month."),
        status: "confirmed",
        answeredAt: "2026-10-06T00:00:00.000Z",
        answerSource: "Sponsor email",
      }),
    });
    const outcome = await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules: edited,
      write: true,
    });
    expect(outcome).toMatchObject({
      staleAssumptionIds: [stale.id],
      resolvedSectionKeys: [SPONSOR],
    });
  });
});

describe("charterRegisterStanding: stale", () => {
  const current = [
    charterModule({ sectionKey: SCOPE, value: "Claims intake and triage." }),
  ];

  it("a row pinned to the current wording is not stale", () => {
    const row = scopeRow({
      charterValueRevision: revisionOf(SCOPE, "Claims intake and triage."),
    });
    expect(charterRegisterStanding(current, [row]).staleAssumptionIds).toEqual(
      [],
    );
  });

  it("a row pinned to an earlier wording is stale", () => {
    const row = scopeRow();
    expect(charterRegisterStanding(current, [row]).staleAssumptionIds).toEqual([
      row.id,
    ]);
  });

  it("a row answered BEFORE the current basis was declared is still stale", () => {
    const row = scopeRow({
      status: "confirmed",
      answerSource: "Volume extract",
      answeredAt: "2026-10-05T08:59:59.000Z",
    });
    expect(charterRegisterStanding(current, [row]).staleAssumptionIds).toEqual([
      row.id,
    ]);
  });

  it("a row answered at or after the current basis was declared is no longer stale", () => {
    const row = scopeRow({
      status: "corrected",
      answer: "Triage is in scope.",
      answerSource: "Volume extract",
      answeredAt: DECLARED_AT,
    });
    expect(charterRegisterStanding(current, [row]).staleAssumptionIds).toEqual(
      [],
    );
  });

  it("a row whose charter answer no longer stands on an assumption is stale once the wording moved", () => {
    const evidence = [
      charterModule({
        sectionKey: SCOPE,
        value: "Claims intake and triage.",
        kind: "workspace_assertion",
      }),
    ];
    const row = scopeRow({
      status: "confirmed",
      answerSource: "x",
      answeredAt: "2027-01-01T00:00:00.000Z",
    });
    expect(charterRegisterStanding(evidence, [row]).staleAssumptionIds).toEqual(
      [row.id],
    );
  });

  it("a superseded row is never flagged — it is done", () => {
    const replacement = record({ origin: "team" });
    const row = scopeRow({
      status: "superseded",
      supersededBy: replacement.id,
    });
    expect(
      charterRegisterStanding(current, [row, replacement]).staleAssumptionIds,
    ).toEqual([]);
  });
});

describe("the P2 carry-forward band reads the register's resolution", () => {
  const modules = [
    charterModule({ sectionKey: SCOPE, value: "Claims intake only." }),
    charterModule({ sectionKey: SPONSOR, value: "Two days a month." }),
  ];
  const band = (records: AssumptionRecord[] | null) =>
    carriedCharterAssumptions({
      active: true,
      modules,
      registerResolvedSectionKeys: records
        ? charterRegisterStanding(modules, records).resolvedSectionKeys
        : null,
    })!.map((row) => row.sectionKey);

  it("without the register (flag off or unreadable) every declared assumption is open", () => {
    expect(band(null)).toEqual([SPONSOR, SCOPE]);
  });

  it("an open register row resolves nothing", () => {
    expect(band([scopeRow()])).toEqual([SPONSOR, SCOPE]);
  });

  it.each(["confirmed", "corrected"] as const)(
    "a %s register row resolves its charter assumption",
    (status) => {
      expect(
        band([
          scopeRow({
            status,
            answer: "Stands.",
            answerSource: "Volume extract",
            answeredAt: "2026-10-06T00:00:00.000Z",
          }),
        ]),
      ).toEqual([SPONSOR]);
    },
  );

  it("a row superseded by an ANSWERED row resolves it", () => {
    const replacement = record({
      origin: "team",
      status: "confirmed",
      answerSource: "Volume extract",
      answeredAt: "2026-10-06T00:00:00.000Z",
    });
    expect(
      band([
        scopeRow({ status: "superseded", supersededBy: replacement.id }),
        replacement,
      ]),
    ).toEqual([SPONSOR]);
  });

  it("a row superseded by an OPEN row resolves nothing", () => {
    const replacement = record({ origin: "team" });
    expect(
      band([
        scopeRow({ status: "superseded", supersededBy: replacement.id }),
        replacement,
      ]),
    ).toEqual([SPONSOR, SCOPE]);
  });

  it("a supersede chain that loops resolves nothing", () => {
    const a = record({
      id: "loop-a",
      status: "superseded",
      supersededBy: "loop-b",
    });
    const b = record({
      id: "loop-b",
      status: "superseded",
      supersededBy: "loop-a",
    });
    expect(
      band([scopeRow({ status: "superseded", supersededBy: a.id }), a, b]),
    ).toEqual([SPONSOR, SCOPE]);
  });

  it("an answer about the PREVIOUS wording does not resolve the current one", () => {
    const edited = [
      charterModule({ sectionKey: SCOPE, value: "Claims intake and triage." }),
    ];
    const row = scopeRow({
      status: "confirmed",
      answerSource: "Volume extract",
      answeredAt: "2026-10-04T00:00:00.000Z",
    });
    expect(charterRegisterStanding(edited, [row]).resolvedSectionKeys).toEqual(
      [],
    );
  });

  it("an answer given after the re-declaration resolves the current wording", () => {
    const edited = [
      charterModule({ sectionKey: SCOPE, value: "Claims intake and triage." }),
    ];
    const row = scopeRow({
      status: "confirmed",
      answerSource: "Volume extract",
      answeredAt: "2026-10-06T00:00:00.000Z",
    });
    expect(charterRegisterStanding(edited, [row]).resolvedSectionKeys).toEqual([
      SCOPE,
    ]);
  });
});

describe("where the bridge may write", () => {
  const member = { accessLevel: "program_member", programIdsAllowed: null };

  it("writes once the Move is past the charter, for a person who can change the register", () => {
    expect(
      charterBridgeMayWrite({
        currentPhase: 2,
        policy: member,
        programId: MOVE_ID,
      }),
    ).toBe(true);
    expect(
      charterBridgeMayWrite({
        currentPhase: 5,
        policy: member,
        programId: MOVE_ID,
      }),
    ).toBe(true);
  });

  it.each([0, 1])(
    "never while the charter is open (current phase %s)",
    (currentPhase) => {
      expect(
        charterBridgeMayWrite({
          currentPhase,
          policy: member,
          programId: MOVE_ID,
        }),
      ).toBe(false);
    },
  );

  it("never for a read-only viewer, a Move outside the grants, or an unread policy", () => {
    expect(
      charterBridgeMayWrite({
        currentPhase: 2,
        policy: { accessLevel: "program_viewer", programIdsAllowed: null },
        programId: MOVE_ID,
      }),
    ).toBe(false);
    expect(
      charterBridgeMayWrite({
        currentPhase: 2,
        policy: {
          accessLevel: "program_member",
          programIdsAllowed: ["move-2"],
        },
        programId: MOVE_ID,
      }),
    ).toBe(false);
    expect(
      charterBridgeMayWrite({
        currentPhase: 2,
        policy: null,
        programId: MOVE_ID,
      }),
    ).toBe(false);
  });
});

describe("what the panel is handed", () => {
  const ok = {
    status: "ok" as const,
    created: 0,
    unbridgedSectionKeys: [SCOPE, SPONSOR],
    staleAssumptionIds: ["row-9"],
    resolvedSectionKeys: [],
  };

  it("carries the stale rows and, when a write was attempted, the sections it could not add", () => {
    expect(charterBridgeMount(MOVE_ID, ok, true)).toEqual({
      programId: MOVE_ID,
      staleAssumptionIds: ["row-9"],
      charterUnavailable: false,
      unbridgedCharterCount: 2,
    });
  });

  it("a section left unwritten on purpose is not reported as a failure", () => {
    expect(charterBridgeMount(MOVE_ID, ok, false).unbridgedCharterCount).toBe(
      0,
    );
  });

  it("an unreadable register says so and flags nothing", () => {
    expect(
      charterBridgeMount(MOVE_ID, { status: "unavailable" }, true),
    ).toEqual({
      programId: MOVE_ID,
      staleAssumptionIds: [],
      charterUnavailable: true,
      unbridgedCharterCount: 0,
    });
  });
});

describe("the owner: a role, never a person, in owner_role", () => {
  // Synthetic names, built so they read as names to the shared heuristic.
  const PERSON = "Avery Quill";
  const EMAIL = "avery.quill@example.test";

  const bridged = async (owner: string) => {
    mockList.mockResolvedValue([]);
    mockUpsert.mockImplementation(
      async (_ctx, _program, input: NewAssumptionInput) => ({
        ok: true,
        created: true,
        // The row as the store persists it: every input column carried over.
        record: record({
          area: input.area,
          statement: input.statement,
          whyItMatters: input.whyItMatters ?? null,
          source: input.source,
          confidence: input.confidence,
          ownerRole: input.ownerRole,
          ownerName: input.ownerName ?? null,
          origin: input.origin,
          raisedPhase: input.raisedPhase ?? null,
          charterSectionKey: input.charterSectionKey ?? null,
          charterValueRevision: input.charterValueRevision ?? null,
        }),
      }),
    );
    await bridgeCharterAssumptions({
      ctx,
      programId: MOVE_ID,
      modules: [
        charterModule({
          sectionKey: SCOPE,
          value: "Claims intake only.",
          owner,
        }),
      ],
      write: true,
    });
    const input = mockUpsert.mock.calls[0][2] as NewAssumptionInput;
    const stored = (await mockUpsert.mock.results[0].value)
      .record as AssumptionRecord;
    return { input, stored };
  };

  it.each([
    ["a person's name", PERSON],
    ["an email address", EMAIL],
    ["an honorific", "Dr. Quill"],
  ])(
    "%s goes to owner_name, and owner_role is the generic role",
    async (_label, owner) => {
      const { input, stored } = await bridged(owner);
      expect(input.ownerRole).toBe(CHARTER_OWNER_ROLE_PLACEHOLDER);
      expect(input.ownerName).toBe(owner);
      expect(ownerNeedsRole(stored)).toBe(true);
      expect(charterOwnerFields(owner)).toEqual({
        ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
        ownerName: owner,
        ownerNeedsRole: true,
      });
    },
  );

  it.each([
    "Head of Shared Services",
    "Finance Director",
    "CFO office",
    "Procurement",
  ])("a role (%s) passes through as owner_role", async (owner) => {
    const { input, stored } = await bridged(owner);
    expect(input.ownerRole).toBe(owner);
    expect(input.ownerName).toBeNull();
    expect(ownerNeedsRole(stored)).toBe(false);
  });

  it("a blank owner never becomes a blank role", () => {
    expect(charterOwnerFields("   ")).toEqual({
      ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
      ownerName: null,
      ownerNeedsRole: true,
    });
  });

  it.each([PERSON, EMAIL])(
    "the generation feed and the governed object of a bridged row never carry the name (%s)",
    async (owner) => {
      const { stored } = await bridged(owner);
      // Answered, so the row is in every counted projection.
      const answered = {
        ...stored,
        status: "confirmed" as const,
        answerSource: "Volume extract",
        answeredAt: "2026-10-06T00:00:00.000Z",
      };
      for (const row of [stored, answered]) {
        const feed = toApprovedAssumption(row);
        expect(feed).not.toBeNull();
        expect(feed!.ownerRole).toBe(CHARTER_OWNER_ROLE_PLACEHOLDER);
        expect(JSON.stringify(feed)).not.toContain(owner);
        const governed = toGovernedObject(row, { tenantId: "client-1" });
        expect(governed.owner).toBe(CHARTER_OWNER_ROLE_PLACEHOLDER);
        expect(JSON.stringify(governed)).not.toContain(owner);
      }
      expect(
        agentContextAssumptions([answered], { tenantId: "client-1" })
          .map(toApprovedAssumption)
          .map((feed) => JSON.stringify(feed))
          .join(""),
      ).not.toContain(owner);
    },
  );

  it("only a charter row still carrying the placeholder needs a role", () => {
    expect(
      ownerNeedsRole({
        origin: "charter_carry_forward",
        ownerRole: "Finance Director",
      }),
    ).toBe(false);
    expect(
      ownerNeedsRole({
        origin: "team",
        ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
      }),
    ).toBe(false);
  });
});
