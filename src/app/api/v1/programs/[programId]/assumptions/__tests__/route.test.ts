/**
 * The Move assumptions register routes:
 *   GET/POST  .../assumptions
 *   PATCH     .../assumptions/:assumptionId
 *   POST      .../assumptions/:assumptionId/decision
 *
 * What is pinned:
 *   - the access ladder, in order: flag → Move (shared cause-blind 404) →
 *     per-Move policy (writes refuse `program_viewer` and a Move outside
 *     `programIdsAllowed`), with nothing read or written past a refusal;
 *   - every transition the decision route offers, and every refusal, with the
 *     sentence the consultant reads;
 *   - a stale revision is a 409 that writes nothing;
 *   - figures are withheld from a viewer without financial visibility;
 *   - the HTTP body cannot set `origin` or `status`;
 *   - a write whose history entry failed is reported as LANDED, and a
 *     supersede whose replacement landed names it.
 *
 * Only the I/O boundaries are mocked (tenancy, flag, Move read, access policy,
 * store). The store stand-in below applies the REAL domain model —
 * `validateNewAssumption`, `planEdit`, `planTransition`,
 * `INITIAL_STATUS_BY_ORIGIN` — to an in-memory register, so a transition case
 * here exercises the real rules end to end through the route.
 */
jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadPolicy = jest.fn();
const mockStore = {
  listAssumptions: jest.fn(),
  createAssumption: jest.fn(),
  editAssumption: jest.fn(),
  transitionAssumption: jest.fn(),
  supersedeAssumption: jest.fn(),
};

jest.mock("@/app/api/v1/programs/_auth", () => {
  class TenancyError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  }
  return {
    TenancyError,
    requireTenancy: () => mockRequireTenancy(),
    // The real responder's shape: answer a TenancyError, re-throw anything else.
    tenancyErrorResponse: (err: unknown) => {
      if (err instanceof TenancyError) {
        return Response.json({ error: err.code }, { status: 401 });
      }
      throw err;
    },
  };
});
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (ctx: unknown, key: string) =>
    mockIsFeatureEnabled(ctx, key),
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
}));
const mockRouteFamilies: string[] = [];
jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: async (family: string) => {
    mockRouteFamilies.push(family);
    return { supabase: {} };
  },
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadPolicy(ctx, opts),
}));
jest.mock("@/lib/programs/assumption-register/store", () => ({
  ...jest.requireActual("@/lib/programs/assumption-register/store"),
  listAssumptions: (...args: unknown[]) => mockStore.listAssumptions(...args),
  createAssumption: (...args: unknown[]) => mockStore.createAssumption(...args),
  editAssumption: (...args: unknown[]) => mockStore.editAssumption(...args),
  transitionAssumption: (...args: unknown[]) =>
    mockStore.transitionAssumption(...args),
  supersedeAssumption: (...args: unknown[]) =>
    mockStore.supersedeAssumption(...args),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { PATCH } from "../[assumptionId]/route";
import { POST as DECIDE } from "../[assumptionId]/decision/route";
import { TenancyError } from "@/app/api/v1/programs/_auth";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import {
  INITIAL_STATUS_BY_ORIGIN,
  formatRegisterId,
  nextRegisterSeq,
  planEdit,
  planTransition,
  validateNewAssumption,
  type AssumptionEdit,
  type AssumptionRecord,
  type NewAssumptionInput,
  type TransitionRequest,
} from "@/lib/programs/assumption-register/model";
import {
  RegisterHistoryWriteError,
  type RegisterActor,
} from "@/lib/programs/assumption-register/store";
import {
  REGISTER_REFUSAL_STATUS,
  describeRegisterRefusal,
  type RegisterRefusal,
  type RegisterRefusalCode,
} from "@/lib/programs/assumption-register/assumption-register-refusal";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOVE = "11111111-1111-4111-8111-111111111111";
const ROW_V1 = "22222222-2222-4222-8222-222222222222";
const ROW_V2 = "33333333-3333-4333-8333-333333333333";
const UNKNOWN_ROW = "99999999-9999-4999-8999-999999999999";
const CTX = {
  clientId: "client-1",
  clientKey: "tenant-a",
  userId: "user-1",
};

function record(overrides: Partial<AssumptionRecord> = {}): AssumptionRecord {
  return {
    id: ROW_V1,
    tenantKey: "tenant-a",
    programId: MOVE,
    area: "value",
    seq: 1,
    registerId: "V1",
    statement: "Manual rework costs $2.4M a year.",
    whyItMatters: "The savings line rests on it.",
    workingFigure: "$2.4M",
    workingValue: 2400000,
    unit: "USD",
    source: "Finance interview notes",
    confidence: 3,
    ownerRole: "Finance Director",
    ownerName: null,
    ownerPersonId: null,
    status: "open",
    origin: "team",
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
    createdByUserId: "user-1",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function policy(
  overrides: Partial<{
    accessLevel: string;
    programIdsAllowed: string[] | null;
    canViewFinancialData: boolean;
  }> = {},
) {
  return {
    accessLevel: "program_member",
    programIdsAllowed: [MOVE],
    canViewFinancialData: true,
    ...overrides,
  };
}

// ── An in-memory register that applies the real domain model ─────────────────

let rows: AssumptionRecord[] = [];
let idCounter = 0;
const NEW_IDS = [
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
];

function fakeCreate(
  _ctx: unknown,
  programId: string,
  input: NewAssumptionInput,
  actor: RegisterActor,
) {
  const valid = validateNewAssumption(input, actor);
  if (!valid.ok) return valid;
  const seq = nextRegisterSeq(rows, input.area);
  const created = record({
    id: NEW_IDS[idCounter++] ?? `row-${idCounter}`,
    programId,
    area: input.area,
    seq,
    registerId: formatRegisterId(input.area, seq),
    statement: input.statement,
    whyItMatters: input.whyItMatters ?? null,
    workingFigure: input.workingFigure ?? null,
    workingValue: input.workingValue ?? null,
    unit: input.unit ?? null,
    source: input.source,
    confidence: input.confidence,
    ownerRole: input.ownerRole,
    status: INITIAL_STATUS_BY_ORIGIN[input.origin],
    origin: input.origin,
    revision: 1,
    createdByUserId: actor.userId,
  });
  rows.push(created);
  return { ok: true as const, record: created };
}

function fakeGuarded(
  id: string,
  expectedRevision: number,
  plan: (
    current: AssumptionRecord,
  ) => ReturnType<typeof planTransition> | ReturnType<typeof planEdit>,
) {
  const current = rows.find((row) => row.id === id);
  if (!current)
    return { ok: false as const, refusal: { code: "unknown_assumption" } };
  if (current.revision !== expectedRevision) {
    return {
      ok: false as const,
      refusal: { code: "stale_revision", currentRevision: current.revision },
    };
  }
  const planned = plan(current);
  if (!planned.ok) return planned;
  const next = { ...current, ...planned.patch, revision: current.revision + 1 };
  rows = rows.map((row) => (row.id === id ? next : row));
  return { ok: true as const, record: next };
}

function fakeTransition(
  _ctx: unknown,
  _programId: string,
  id: string,
  expectedRevision: number,
  request: TransitionRequest,
  actor: RegisterActor,
) {
  return fakeGuarded(id, expectedRevision, (current) => {
    const planned = planTransition(
      current,
      request,
      actor,
      "2026-10-09T00:00:00.000Z",
    );
    if (
      planned.ok &&
      request.action === "supersede" &&
      !rows.some((row) => row.id === request.supersededBy)
    ) {
      return {
        ok: false,
        refusal: { code: "unknown_supersede_target" },
      } as never;
    }
    return planned;
  });
}

function fakeEdit(
  _ctx: unknown,
  _programId: string,
  id: string,
  expectedRevision: number,
  edit: AssumptionEdit,
  actor: RegisterActor,
) {
  return fakeGuarded(id, expectedRevision, (current) =>
    planEdit(current, edit, actor),
  );
}

function fakeSupersede(
  ctx: unknown,
  programId: string,
  id: string,
  expectedRevision: number,
  replacement: Omit<NewAssumptionInput, "area" | "origin">,
  actor: RegisterActor,
) {
  const current = rows.find((row) => row.id === id);
  if (!current) {
    return {
      ok: false,
      refusal: { code: "unknown_assumption" },
      replacement: null,
    };
  }
  const created = fakeCreate(
    ctx,
    programId,
    { ...replacement, area: current.area, origin: "team" },
    actor,
  );
  if (!created.ok)
    return { ok: false, refusal: created.refusal, replacement: null };
  const superseded = fakeTransition(
    ctx,
    programId,
    id,
    expectedRevision,
    { action: "supersede", supersededBy: created.record.id },
    actor,
  );
  if (!superseded.ok) {
    return {
      ok: false,
      refusal: superseded.refusal,
      replacement: created.record,
    };
  }
  return { ok: true, record: superseded.record, replacement: created.record };
}

// ── Request helpers ──────────────────────────────────────────────────────────

function jsonRequest(method: string, body: unknown) {
  return new NextRequest("https://example.test/api", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const moveParams = () => ({ params: Promise.resolve({ programId: MOVE }) });
const rowParams = (assumptionId: string = ROW_V1) => ({
  params: Promise.resolve({ programId: MOVE, assumptionId }),
});

function list() {
  return GET(jsonRequest("GET", undefined as never) as never, moveParams());
}
function create(body: unknown) {
  return POST(jsonRequest("POST", body), moveParams());
}
function edit(body: unknown, id?: string) {
  return PATCH(jsonRequest("PATCH", body), rowParams(id));
}
function decide(body: unknown, id?: string) {
  return DECIDE(jsonRequest("POST", body), rowParams(id));
}

const NEW_ROW_BODY = {
  area: "value",
  statement: "Claims rework takes 30% of analyst time.",
  workingFigure: "30%",
  workingValue: 30,
  unit: "percent",
  source: "Operations time study",
  confidence: 3,
  ownerRole: "Operations Director",
};

function detailOf(refusal: RegisterRefusal): string {
  return describeRegisterRefusal(refusal);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteFamilies.length = 0;
  rows = [record()];
  idCounter = 0;
  mockRequireTenancy.mockResolvedValue(CTX);
  mockIsFeatureEnabled.mockReturnValue(true);
  mockGetProgramById.mockResolvedValue({ id: MOVE });
  mockLoadPolicy.mockResolvedValue(policy());
  mockStore.listAssumptions.mockImplementation(async () => rows);
  mockStore.createAssumption.mockImplementation(async (...args: unknown[]) =>
    fakeCreate(...(args as Parameters<typeof fakeCreate>)),
  );
  mockStore.editAssumption.mockImplementation(async (...args: unknown[]) =>
    fakeEdit(...(args as Parameters<typeof fakeEdit>)),
  );
  mockStore.transitionAssumption.mockImplementation(
    async (...args: unknown[]) =>
      fakeTransition(...(args as Parameters<typeof fakeTransition>)),
  );
  mockStore.supersedeAssumption.mockImplementation(async (...args: unknown[]) =>
    fakeSupersede(...(args as Parameters<typeof fakeSupersede>)),
  );
});

function storeCalls(): number {
  return Object.values(mockStore).reduce(
    (sum, fn) => sum + fn.mock.calls.length,
    0,
  );
}

// ── Access ladder ────────────────────────────────────────────────────────────

const ALL_HANDLERS: Array<[string, () => Promise<Response>]> = [
  ["GET list", () => list()],
  ["POST create", () => create(NEW_ROW_BODY)],
  ["PATCH edit", () => edit({ expectedRevision: 1, statement: "Edited." })],
  [
    "POST decision",
    () =>
      decide({
        action: "answer",
        outcome: "confirmed",
        expectedRevision: 1,
        answerSource: "Ledger",
      }),
  ],
];
const WRITE_HANDLERS = ALL_HANDLERS.slice(1);

describe("assumptions register routes · access ladder", () => {
  it.each(ALL_HANDLERS)(
    "%s refuses with register_not_enabled when the flag is off, before reading the Move",
    async (_name, call) => {
      mockIsFeatureEnabled.mockReturnValue(false);
      const res = await call();
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({
        ok: false,
        error: "register_not_enabled",
        detail:
          "The assumptions register is not turned on for this workspace, so nothing was read or saved.",
      });
      expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
        CTX,
        "moves_assumption_register_v1",
      );
      expect(mockGetProgramById).not.toHaveBeenCalled();
      expect(storeCalls()).toBe(0);
    },
  );

  it.each(ALL_HANDLERS)(
    "%s answers an unreadable Move with the shared cause-blind 404 body",
    async (_name, call) => {
      mockGetProgramById.mockResolvedValue(null);
      const res = await call();
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual(moveUnreadableRefusalBody());
      expect(mockGetProgramById).toHaveBeenCalledWith(CTX, MOVE);
      expect(storeCalls()).toBe(0);
    },
  );

  it.each(WRITE_HANDLERS)(
    "%s refuses a program viewer with 403 forbidden and writes nothing",
    async (_name, call) => {
      mockLoadPolicy.mockResolvedValue(
        policy({ accessLevel: "program_viewer" }),
      );
      const res = await call();
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        ok: false,
        error: "forbidden",
        detail:
          "Your account can view this Move but cannot change its assumptions register. " +
          "Nothing was saved. Ask a member of the Move team to make this change.",
      });
      expect(mockLoadPolicy).toHaveBeenCalledWith(CTX, { programId: MOVE });
      expect(storeCalls()).toBe(0);
    },
  );

  it.each(WRITE_HANDLERS)(
    "%s refuses a member whose grants do not include this Move",
    async (_name, call) => {
      mockLoadPolicy.mockResolvedValue(
        policy({ programIdsAllowed: ["another-move"] }),
      );
      const res = await call();
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("forbidden");
      expect(storeCalls()).toBe(0);
    },
  );

  it.each(WRITE_HANDLERS)(
    "%s lets a client admin (every Move allowed) write",
    async (_name, call) => {
      mockLoadPolicy.mockResolvedValue(
        policy({ accessLevel: "client_admin", programIdsAllowed: null }),
      );
      const res = await call();
      expect(res.status).toBeLessThan(300);
      // Writes read the Move through the mutation route family.
      expect(mockRouteFamilies).toEqual(["mutation"]);
    },
  );

  it("reads the Move through the read route family for a list", async () => {
    await list();
    expect(mockRouteFamilies).toEqual(["program_read"]);
  });

  it("lets a viewer read the register, and tells the screen it cannot edit", async () => {
    mockLoadPolicy.mockResolvedValue(policy({ accessLevel: "program_viewer" }));
    const res = await list();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.canEdit).toBe(false);
    expect(body.assumptions).toHaveLength(1);
  });

  it("answers a tenancy failure with the tenancy response, untouched", async () => {
    mockRequireTenancy.mockRejectedValue(new TenancyError("unauthenticated"));
    for (const [, call] of ALL_HANDLERS) {
      const res = await call();
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "unauthenticated" });
    }
  });
});

// ── GET ──────────────────────────────────────────────────────────────────────

describe("GET .../assumptions", () => {
  it("lists the register without the tenant fence key", async () => {
    const res = await list();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.canEdit).toBe(true);
    expect(body.figuresRedacted).toBe(false);
    expect(body.assumptions[0]).toMatchObject({
      registerId: "V1",
      workingFigure: "$2.4M",
      workingValue: 2400000,
      statement: "Manual rework costs $2.4M a year.",
      figuresRedacted: false,
    });
    expect(body.assumptions[0]).not.toHaveProperty("tenantKey");
    expect(mockStore.listAssumptions).toHaveBeenCalledWith(CTX, MOVE);
  });

  it("withholds every figure from a read-only viewer without financial visibility", async () => {
    rows = [
      record({
        whyItMatters: "The $2.4M savings line rests on it.",
        source: "fin_model:ops-2026 tab 3",
        status: "corrected",
        answer: "It is $3.1M once overtime is counted.",
        answerFigure: "$3.1M",
        answerValue: 3100000,
        answerSource: "budget_line:ops-2026",
        answeredAt: "2026-10-02T00:00:00.000Z",
      }),
    ];
    mockLoadPolicy.mockResolvedValue(
      policy({ accessLevel: "program_viewer", canViewFinancialData: false }),
    );
    const body = await (await list()).json();
    expect(body.figuresRedacted).toBe(true);
    const row = body.assumptions[0];
    expect(row).toMatchObject({
      workingFigure: null,
      workingValue: null,
      answerFigure: null,
      answerValue: null,
      figuresRedacted: true,
    });
    expect(row.statement).toBe(
      "Manual rework costs [restricted financial value] a year.",
    );
    expect(row.answer).toBe(
      "It is [restricted financial value] once overtime is counted.",
    );
    expect(row.answerSource).toBe("[restricted source]");
    expect(row.whyItMatters).toBe(
      "The [restricted financial value] savings line rests on it.",
    );
    expect(row.source).toBe("[restricted source] tab 3");
    expect(JSON.stringify(body)).not.toMatch(/2\.4|3\.1|2400000|3100000/);
  });

  it("names a failed read instead of an empty register", async () => {
    mockStore.listAssumptions.mockRejectedValue(new Error("connection reset"));
    const res = await list();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: "register_read_failed",
      detail:
        "The assumptions register could not be read just now. Nothing was changed. Reload to try again.",
    });
  });
});

// ── POST create ──────────────────────────────────────────────────────────────

describe("POST .../assumptions", () => {
  it("creates an OPEN team row as the signed-in person", async () => {
    const res = await create(NEW_ROW_BODY);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      historyRecorded: true,
      assumption: {
        registerId: "V2",
        status: "open",
        origin: "team",
        workingFigure: "30%",
      },
    });
    const [ctx, programId, input, actor] =
      mockStore.createAssumption.mock.calls[0];
    expect(ctx).toBe(CTX);
    expect(programId).toBe(MOVE);
    expect(input.origin).toBe("team");
    expect(actor).toEqual({ kind: "person", userId: "user-1" });
  });

  it("cannot be told the origin or the status: both come from the server", async () => {
    const res = await create({
      ...NEW_ROW_BODY,
      origin: "ava_proposal",
      status: "confirmed",
      answerSource: "spoofed",
    });
    expect(res.status).toBe(201);
    const input = mockStore.createAssumption.mock.calls[0][2];
    expect(input.origin).toBe("team");
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("answerSource");
    expect((await res.json()).assumption).toMatchObject({
      origin: "team",
      status: "open",
    });
  });

  it("refuses an unreadable body by name, before the store", async () => {
    const res = await create("{not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "bad_request",
      detail: "The request could not be read. Nothing was saved.",
    });
    expect(mockStore.createAssumption).not.toHaveBeenCalled();
  });

  it("refuses a non-numeric working value", async () => {
    const res = await create({ ...NEW_ROW_BODY, workingValue: "thirty" });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "The working value must be a number. Nothing was saved.",
    );
    expect(mockStore.createAssumption).not.toHaveBeenCalled();
  });

  it.each([
    [
      "confidence",
      { confidence: 2 },
      "Confidence must be 1, 3 or 5. Nothing was saved.",
    ],
    [
      "source",
      { source: "  " },
      "The assumption needs a source: where the figure came from. Nothing was saved.",
    ],
    [
      "ownerRole",
      { ownerRole: "" },
      "The assumption needs an owner role, such as Finance Director (a role, not a person's name). Nothing was saved.",
    ],
    [
      "statement",
      { statement: 42 },
      "The assumption needs a statement. Nothing was saved.",
    ],
    [
      "area",
      { area: "cost" },
      "The area must be value, data, delivery or adoption. Nothing was saved.",
    ],
    [
      "raisedPhase",
      { raisedPhase: 9 },
      "The phase it was raised in must be a phase from 0 to 5. Nothing was saved.",
    ],
  ])(
    "refuses a row whose %s the register rejects, with its sentence",
    async (_field, patch, detail) => {
      const res = await create({ ...NEW_ROW_BODY, ...patch });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        ok: false,
        error: "bad_request",
        detail,
      });
      expect(rows).toHaveLength(1);
    },
  );

  it("answers an ID-allocation race as 409 with nothing saved", async () => {
    mockStore.createAssumption.mockResolvedValue({
      ok: false,
      refusal: { code: "id_allocation_conflict" },
    });
    const res = await create(NEW_ROW_BODY);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      ok: false,
      error: "id_allocation_conflict",
      detail: detailOf({ code: "id_allocation_conflict" }),
    });
  });

  it("answers the store's not-this-client's-Move with the shared 404 body", async () => {
    mockStore.createAssumption.mockResolvedValue({
      ok: false,
      refusal: { code: "unknown_program" },
    });
    const res = await create(NEW_ROW_BODY);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(moveUnreadableRefusalBody());
  });

  it("reports a row whose history entry failed as SAVED, so it is not added twice", async () => {
    const landed = record({ id: ROW_V2, registerId: "V2", seq: 2 });
    mockStore.createAssumption.mockRejectedValue(
      new RegisterHistoryWriteError(landed, new Error("events insert failed")),
    );
    const res = await create(NEW_ROW_BODY);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      historyRecorded: false,
      assumption: { registerId: "V2" },
    });
    expect(body.detail).toBe(
      "The change to V2 was saved (revision 1), but its history entry was not recorded. " +
        "Do not repeat the change. Tell your workspace administrator so the history can be repaired.",
    );
  });

  it("names an unconfirmed write instead of an unbodied 500", async () => {
    mockStore.createAssumption.mockRejectedValue(new Error("socket hang up"));
    const res = await create(NEW_ROW_BODY);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: "register_write_unconfirmed",
      detail:
        "The change could not be confirmed: it may or may not have been saved. " +
        "Reload the register to see the assumption's current state before trying again.",
    });
  });

  it("shows the created row's figures to the person working the Move, even without financial visibility", async () => {
    // The register is the team's working tool (see seesRegisterFigures).
    mockLoadPolicy.mockResolvedValue(policy({ canViewFinancialData: false }));
    const body = await (await create(NEW_ROW_BODY)).json();
    expect(body.assumption.figuresRedacted).toBe(false);
    expect(body.assumption.workingFigure).not.toBeNull();
  });

  it("lists figures for a member without financial visibility, and withholds them from a viewer on another Move's allow-list", async () => {
    mockLoadPolicy.mockResolvedValue(policy({ canViewFinancialData: false }));
    expect((await (await list()).json()).figuresRedacted).toBe(false);
    mockLoadPolicy.mockResolvedValue(
      policy({
        canViewFinancialData: false,
        programIdsAllowed: ["another-move"],
      }),
    );
    expect((await (await list()).json()).figuresRedacted).toBe(true);
  });
});

// ── PATCH edit ───────────────────────────────────────────────────────────────

describe("PATCH .../assumptions/:assumptionId", () => {
  it("edits only the fields sent, guarded by the revision the person saw", async () => {
    const res = await edit({
      expectedRevision: 1,
      statement: "Manual rework costs $2.6M a year.",
      workingFigure: "$2.6M",
      confidence: 5,
      evidenceIds: ["ev-1", 7, " "],
      unit: 12,
      area: "data",
      origin: "ava_proposal",
      status: "confirmed",
    });
    expect(res.status).toBe(200);
    const [ctx, programId, id, expectedRevision, sent, actor] =
      mockStore.editAssumption.mock.calls[0];
    expect([ctx, programId, id, expectedRevision]).toEqual([
      CTX,
      MOVE,
      ROW_V1,
      1,
    ]);
    expect(sent).toEqual({
      statement: "Manual rework costs $2.6M a year.",
      workingFigure: "$2.6M",
      confidence: 5,
      evidenceIds: ["ev-1"],
      // A non-string clears a text field rather than storing a non-string.
      unit: null,
    });
    expect(actor).toEqual({ kind: "person", userId: "user-1" });
    expect((await res.json()).assumption).toMatchObject({
      area: "value",
      status: "open",
      origin: "team",
      workingFigure: "$2.6M",
      revision: 2,
    });
  });

  it.each([undefined, 0, 1.5, "1"])(
    "refuses an edit whose revision is %p",
    async (expectedRevision) => {
      const res = await edit({ expectedRevision, statement: "Edited." });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("bad_request");
      expect(mockStore.editAssumption).not.toHaveBeenCalled();
    },
  );

  it("refuses an edit that does not say which revision it was made against", async () => {
    const res = await edit({ statement: "Edited." });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "The request must say which revision of the assumption you were looking at. Nothing was saved.",
    );
    expect(mockStore.editAssumption).not.toHaveBeenCalled();
  });

  it("refuses a stale revision with 409 and writes nothing", async () => {
    rows = [record({ revision: 4 })];
    const res = await edit({ expectedRevision: 3, statement: "Edited." });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      ok: false,
      error: "stale_revision",
      currentRevision: 4,
      detail:
        "Someone changed this assumption after you opened it; it is now at revision 4. " +
        "Nothing was saved. Reload the register, check the current version, and make your change again.",
    });
    expect(rows[0].statement).toBe("Manual rework costs $2.4M a year.");
  });

  it("refuses an edit to an answered row and says what can still be done", async () => {
    rows = [
      record({
        status: "confirmed",
        answerSource: "Ledger",
        answeredAt: "2026-10-02T00:00:00.000Z",
      }),
    ];
    const res = await edit({ expectedRevision: 1, statement: "Edited." });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      ok: false,
      error: "invalid_transition",
      detail:
        "This assumption is confirmed, so it can no longer be edited: only proposed or open assumptions can be edited. " +
        "Nothing was changed. A confirmed assumption can only be corrected or superseded.",
    });
  });

  it("passes the revision the person saw, not an assumed one", async () => {
    rows = [record({ revision: 2 })];
    const res = await edit({ expectedRevision: 2, statement: "Edited." });
    expect(res.status).toBe(200);
    expect(mockStore.editAssumption.mock.calls[0][3]).toBe(2);
    expect((await res.json()).assumption.revision).toBe(3);
  });

  it("refuses an edit that changes nothing editable", async () => {
    const res = await edit({ expectedRevision: 1, area: "data" });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "The edit changed nothing that can be edited. Nothing was saved.",
    );
  });

  it("answers an unknown row with unknown_assumption", async () => {
    const res = await edit(
      { expectedRevision: 1, statement: "x" },
      UNKNOWN_ROW,
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      ok: false,
      error: "unknown_assumption",
      detail:
        "This assumption is not on this Move's register. Nothing was changed. " +
        "Reload the register to see its current rows.",
    });
  });

  it("answers an id that cannot name a row without asking the store", async () => {
    const res = await edit({ expectedRevision: 1, statement: "x" }, "V1");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("unknown_assumption");
    expect(mockStore.editAssumption).not.toHaveBeenCalled();
  });

  it("reports an edit whose history entry failed as SAVED", async () => {
    mockStore.editAssumption.mockRejectedValue(
      new RegisterHistoryWriteError(record({ revision: 2 }), new Error("x")),
    );
    const res = await edit({ expectedRevision: 1, statement: "Edited." });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.historyRecorded).toBe(false);
    expect(body.detail).toMatch(/^The change to V1 was saved \(revision 2\)/);
  });

  it("names an unconfirmed edit instead of an unbodied 500", async () => {
    mockStore.editAssumption.mockRejectedValue(new Error("timeout"));
    const res = await edit({ expectedRevision: 1, statement: "Edited." });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("register_write_unconfirmed");
  });
});

// ── POST decision ────────────────────────────────────────────────────────────

describe("POST .../assumptions/:assumptionId/decision", () => {
  function proposed() {
    rows = [record({ status: "proposed", origin: "ava_proposal" })];
  }

  it("accept: a proposed row joins the working register, accepted by the person", async () => {
    proposed();
    const res = await decide({ action: "accept", expectedRevision: 1 });
    expect(res.status).toBe(200);
    expect((await res.json()).assumption).toMatchObject({
      status: "open",
      acceptedByUserId: "user-1",
      revision: 2,
    });
    const [, , id, rev, request, actor] =
      mockStore.transitionAssumption.mock.calls[0];
    expect([id, rev, request, actor]).toEqual([
      ROW_V1,
      1,
      { action: "accept" },
      { kind: "person", userId: "user-1" },
    ]);
  });

  it("reject: a proposed row is set aside", async () => {
    proposed();
    const res = await decide({ action: "reject", expectedRevision: 1 });
    expect(res.status).toBe(200);
    expect((await res.json()).assumption.status).toBe("rejected");
    expect(mockStore.transitionAssumption.mock.calls[0][4]).toEqual({
      action: "reject",
    });
  });

  it("answer (confirmed): records the answer and its source", async () => {
    const res = await decide({
      action: "answer",
      outcome: "confirmed",
      expectedRevision: 1,
      answerSource: "General ledger extract",
      answerFigure: "$2.4M",
    });
    expect(res.status).toBe(200);
    expect((await res.json()).assumption).toMatchObject({
      status: "confirmed",
      answerSource: "General ledger extract",
      answerFigure: "$2.4M",
      answeredByUserId: "user-1",
    });
    expect(mockStore.transitionAssumption.mock.calls[0][4]).toEqual({
      action: "confirm",
      answerSource: "General ledger extract",
      answer: null,
      answerFigure: "$2.4M",
      answerValue: null,
    });
  });

  it("answer (corrected): records the corrected answer", async () => {
    const res = await decide({
      action: "answer",
      outcome: "corrected",
      expectedRevision: 1,
      answerSource: "General ledger extract",
      answer: "Overtime adds a further $0.7M.",
      answerFigure: "$3.1M",
      answerValue: 3100000,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).assumption).toMatchObject({
      status: "corrected",
      answer: "Overtime adds a further $0.7M.",
      answerFigure: "$3.1M",
      answerValue: 3100000,
    });
  });

  it("answer: refuses an answer with no source, and saves nothing", async () => {
    const res = await decide({
      action: "answer",
      outcome: "confirmed",
      expectedRevision: 1,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "answer_source_required",
      detail:
        "An answer must name its source: the document, system or role the answer came from. " +
        "Nothing was saved. Add the source and answer again.",
    });
    expect(rows[0].status).toBe("open");
  });

  it("answer: a correction must state its answer", async () => {
    const res = await decide({
      action: "answer",
      outcome: "corrected",
      expectedRevision: 1,
      answerSource: "Ledger",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "A correction must state the corrected answer. Nothing was saved.",
    );
  });

  it("answer: refuses an answer that does not say confirmed or corrected", async () => {
    const res = await decide({
      action: "answer",
      expectedRevision: 1,
      answerSource: "Ledger",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "An answer must say whether it confirms or corrects the figure. Nothing was saved.",
    );
    expect(mockStore.transitionAssumption).not.toHaveBeenCalled();
  });

  it("answer: refuses an outcome that is neither confirmed nor corrected", async () => {
    const res = await decide({
      action: "answer",
      outcome: "approved",
      expectedRevision: 1,
      answerSource: "Ledger",
      answer: "Fine.",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "An answer must say whether it confirms or corrects the figure. Nothing was saved.",
    );
    expect(mockStore.transitionAssumption).not.toHaveBeenCalled();
  });

  it("answer: refuses a non-numeric answer value", async () => {
    const res = await decide({
      action: "answer",
      outcome: "confirmed",
      expectedRevision: 1,
      answerSource: "Ledger",
      answerValue: "lots",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "The answer value must be a number. Nothing was saved.",
    );
  });

  it("supersede (existing row): points this row at a row already on the register", async () => {
    rows = [record(), record({ id: ROW_V2, seq: 2, registerId: "V2" })];
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      supersededBy: ROW_V2,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).assumption).toMatchObject({
      status: "superseded",
      supersededBy: ROW_V2,
    });
    expect(mockStore.supersedeAssumption).not.toHaveBeenCalled();
  });

  it("supersede (existing row): a replacement not on the register supersedes nothing", async () => {
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      supersededBy: UNKNOWN_ROW,
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      ok: false,
      error: "unknown_assumption",
      detail:
        "The row named as the replacement is not on this Move's register, so nothing was superseded. " +
        "Reload the register and choose a replacement from its rows, or supersede with a new replacement row.",
    });
    expect(rows[0].status).toBe("open");
  });

  it("supersede (existing row): a row cannot be superseded by itself", async () => {
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      supersededBy: ROW_V1,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "bad_request",
      detail: detailOf({ code: "bad_request", field: "replacement" }),
    });
    expect(rows[0].status).toBe("open");
  });

  it("supersede (existing row): an id that cannot name a row is refused before the store", async () => {
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      supersededBy: "V2",
    });
    expect(res.status).toBe(404);
    expect((await res.json()).detail).toBe(
      detailOf({ code: "unknown_assumption", which: "supersede_target" }),
    );
    expect(mockStore.transitionAssumption).not.toHaveBeenCalled();
  });

  it("supersede (new row): adds a replacement with a NEW id in the same area", async () => {
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      replacement: {
        ...NEW_ROW_BODY,
        area: "data",
        origin: "ava_proposal",
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assumption).toMatchObject({
      registerId: "V1",
      status: "superseded",
      supersededBy: NEW_IDS[0],
    });
    expect(body.replacement).toMatchObject({
      id: NEW_IDS[0],
      registerId: "V2",
      area: "value",
      origin: "team",
      status: "open",
    });
    const sent = mockStore.supersedeAssumption.mock.calls[0][4];
    expect(sent).not.toHaveProperty("area");
    expect(sent).not.toHaveProperty("origin");
  });

  it("supersede (new row): refuses a supersede that names no replacement", async () => {
    const res = await decide({ action: "supersede", expectedRevision: 1 });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "A supersede must name the replacement: an existing row on this register, or a new replacement row " +
        "with a statement, source, owner role and confidence. Nothing was saved.",
    );
  });

  it("supersede (new row): a refusal after the replacement landed names the replacement", async () => {
    // The row moves on between the read and the final write.
    mockStore.supersedeAssumption.mockImplementation(async () => {
      const replacement = record({
        id: NEW_IDS[0],
        seq: 2,
        registerId: "V2",
      });
      return {
        ok: false,
        refusal: { code: "stale_revision", currentRevision: 2 },
        replacement,
      };
    });
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      replacement: NEW_ROW_BODY,
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("stale_revision");
    expect(body.replacement).toMatchObject({
      id: NEW_IDS[0],
      registerId: "V2",
    });
    expect(body.detail).toBe(
      detailOf({ code: "stale_revision", currentRevision: 2 }) +
        " The replacement assumption V2 WAS saved as an open row. " +
        "To finish, supersede this assumption with V2 as the replacement rather than adding another.",
    );
  });

  it("supersede (new row): a refusal before anything landed says nothing landed", async () => {
    mockStore.supersedeAssumption.mockResolvedValue({
      ok: false,
      refusal: { code: "stale_revision", currentRevision: 5 },
      replacement: null,
    });
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      replacement: NEW_ROW_BODY,
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).not.toHaveProperty("replacement");
    expect(body.detail).toBe(
      detailOf({ code: "stale_revision", currentRevision: 5 }),
    );
  });

  it("supersede (new row): the replacement landed but its history did not — the old row was NOT superseded", async () => {
    const replacement = record({ id: NEW_IDS[0], seq: 2, registerId: "V2" });
    mockStore.supersedeAssumption.mockRejectedValue(
      new RegisterHistoryWriteError(replacement, new Error("x")),
    );
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      replacement: NEW_ROW_BODY,
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("supersede_incomplete");
    expect(body.replacement).toMatchObject({ registerId: "V2" });
    expect(body.detail).toBe(
      "The replacement assumption V2 WAS saved as an open row, but its history entry was not recorded " +
        "and this assumption was NOT superseded. To finish, supersede this assumption with V2 as the replacement " +
        "rather than adding another, and tell your workspace administrator so the history can be repaired.",
    );
  });

  it("supersede (new row): the supersede landed but its history did not — reported as SAVED", async () => {
    mockStore.supersedeAssumption.mockRejectedValue(
      new RegisterHistoryWriteError(
        record({ status: "superseded", supersededBy: NEW_IDS[0], revision: 2 }),
        new Error("x"),
      ),
    );
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      replacement: NEW_ROW_BODY,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      historyRecorded: false,
      assumption: { status: "superseded" },
    });
  });

  it.each([
    [
      "accept",
      "open",
      "accepted",
      "An open assumption can only be confirmed, corrected or superseded.",
    ],
    [
      "reject",
      "open",
      "rejected",
      "An open assumption can only be confirmed, corrected or superseded.",
    ],
    [
      "accept",
      "rejected",
      "accepted",
      "A rejected assumption is final; nothing more can be done to it.",
    ],
    [
      "accept",
      "superseded",
      "accepted",
      "A superseded assumption is final; nothing more can be done to it.",
    ],
    [
      "reject",
      "confirmed",
      "rejected",
      "A confirmed assumption can only be corrected or superseded.",
    ],
  ] as const)(
    "refuses %s on a %s row as invalid_transition, saying what can still be done",
    async (action, status, attempted, nextSteps) => {
      rows = [
        record({
          status,
          ...(status === "confirmed"
            ? { answerSource: "Ledger", answeredAt: "2026-10-02T00:00:00.000Z" }
            : {}),
        }),
      ];
      const res = await decide({ action, expectedRevision: 1 });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        ok: false,
        error: "invalid_transition",
        detail: `This assumption is ${status}, so it cannot be ${attempted}. Nothing was changed. ${nextSteps}`,
      });
      expect(rows[0].revision).toBe(1);
    },
  );

  it("refuses a correction on a proposed row: it must be accepted first", async () => {
    proposed();
    const res = await decide({
      action: "answer",
      outcome: "corrected",
      expectedRevision: 1,
      answerSource: "Ledger",
      answer: "Different.",
    });
    expect(res.status).toBe(409);
    expect((await res.json()).detail).toBe(
      "This assumption is proposed, so it cannot be answered with a correction. Nothing was changed. " +
        "A proposed assumption can only be accepted or rejected.",
    );
  });

  it("refuses answering as confirmed a row already confirmed", async () => {
    rows = [record({ status: "confirmed", answerSource: "Ledger" })];
    const res = await decide({
      action: "answer",
      outcome: "confirmed",
      expectedRevision: 1,
      answerSource: "Ledger",
    });
    expect(res.status).toBe(409);
    expect((await res.json()).detail).toBe(
      "This assumption is confirmed, so it cannot be answered as confirmed. Nothing was changed. " +
        "A confirmed assumption can only be corrected or superseded.",
    );
  });

  it("refuses a stale decision with 409 and changes nothing", async () => {
    proposed();
    rows[0] = { ...rows[0], revision: 2 };
    const res = await decide({ action: "accept", expectedRevision: 1 });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: "stale_revision",
      currentRevision: 2,
    });
    expect(rows[0].status).toBe("proposed");
  });

  it("refuses an unknown decision by name", async () => {
    const res = await decide({ action: "confirm", expectedRevision: 1 });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "The decision must be accept, reject, answer or supersede. Nothing was saved.",
    );
    expect(mockStore.transitionAssumption).not.toHaveBeenCalled();
  });

  it("refuses a decision without a revision", async () => {
    const res = await decide({ action: "accept" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("bad_request");
  });

  it("answers an unknown row with unknown_assumption", async () => {
    const res = await decide(
      { action: "accept", expectedRevision: 1 },
      UNKNOWN_ROW,
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("unknown_assumption");
  });

  it("answers an id that cannot name a row without asking the store", async () => {
    const res = await decide({ action: "accept", expectedRevision: 1 }, "V1");
    expect(res.status).toBe(404);
    expect(mockStore.transitionAssumption).not.toHaveBeenCalled();
  });

  it("reports a decision whose history entry failed as SAVED", async () => {
    mockStore.transitionAssumption.mockRejectedValue(
      new RegisterHistoryWriteError(
        record({ status: "rejected", revision: 2 }),
        new Error("x"),
      ),
    );
    const res = await decide({ action: "reject", expectedRevision: 1 });
    expect(res.status).toBe(200);
    expect((await res.json()).historyRecorded).toBe(false);
  });

  it("names an unconfirmed decision instead of an unbodied 500", async () => {
    mockStore.transitionAssumption.mockRejectedValue(new Error("timeout"));
    const res = await decide({ action: "reject", expectedRevision: 1 });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("register_write_unconfirmed");
  });

  it("shows a decision's figures to the person who made it, even without financial visibility", async () => {
    mockLoadPolicy.mockResolvedValue(policy({ canViewFinancialData: false }));
    const body = await (
      await decide({
        action: "answer",
        outcome: "confirmed",
        expectedRevision: 1,
        answerSource: "Ledger",
        answerFigure: "$2.4M",
      })
    ).json();
    expect(body.assumption).toMatchObject({
      status: "confirmed",
      answerFigure: "$2.4M",
      figuresRedacted: false,
    });
  });
});

// ── The refusal vocabulary ───────────────────────────────────────────────────

describe("assumptions register refusals", () => {
  // A `Record` over the code union: a code without a sample is a compile error.
  const SAMPLES: Record<RegisterRefusalCode, RegisterRefusal> = {
    forbidden: { code: "forbidden" },
    stale_revision: { code: "stale_revision", currentRevision: null },
    invalid_transition: {
      code: "invalid_transition",
      from: "open",
      attempted: "accept",
    },
    answer_source_required: { code: "answer_source_required" },
    unknown_assumption: { code: "unknown_assumption", which: "row" },
    register_not_enabled: { code: "register_not_enabled" },
    bad_request: { code: "bad_request", field: "body" },
    id_allocation_conflict: { code: "id_allocation_conflict" },
    register_read_failed: { code: "register_read_failed" },
    register_write_unconfirmed: { code: "register_write_unconfirmed" },
    supersede_incomplete: {
      code: "supersede_incomplete",
      replacement: { registerId: "V2", revision: 1 },
    },
    owner_role_is_a_person: { code: "owner_role_is_a_person" },
  };

  it.each(Object.keys(REGISTER_REFUSAL_STATUS) as RegisterRefusalCode[])(
    "%s states what did or did not land",
    (code) => {
      expect(describeRegisterRefusal(SAMPLES[code])).toMatch(
        /nothing was|nothing more|was saved|WAS saved|may or may not have been saved/i,
      );
    },
  );

  it("states a stale revision without a revision number when none is known", () => {
    expect(
      describeRegisterRefusal({
        code: "stale_revision",
        currentRevision: null,
      }),
    ).toBe(
      "Someone changed this assumption after you opened it. Nothing was saved. " +
        "Reload the register, check the current version, and make your change again.",
    );
  });
});

// ── Owner role: a role, never a person ───────────────────────────────────────
// Documents and aVa read `owner_role`. The shared heuristic
// (`looksLikePersonalName`, assumption-register/owner-role.ts) refuses a value
// that reads like a person; `owner_name` may still carry one.

describe("assumptions register routes · the owner role is never a person", () => {
  const PERSON_DETAIL =
    "The owner role reads like a person's name or an email address. Nothing was saved. " +
    "The owner field takes a role, such as CFO office or Finance Director, because documents and aVa read the owner role and must never carry a person's name. " +
    "Enter the role, and put the person's name in the owner name field if you need it.";
  // Synthetic: built to read as a name to the heuristic.
  const PEOPLE = ["Avery Quill", "avery.quill@example.test", "Dr. Quill"];

  it("the refusal's sentence is the one the screen shows", () => {
    expect(detailOf({ code: "owner_role_is_a_person" })).toBe(PERSON_DETAIL);
  });

  it.each(PEOPLE)(
    "create refuses %p as the owner role, saving nothing",
    async (owner) => {
      const res = await create({ ...NEW_ROW_BODY, ownerRole: owner });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        ok: false,
        error: "owner_role_is_a_person",
        detail: PERSON_DETAIL,
      });
      expect(storeCalls()).toBe(0);
    },
  );

  it.each(PEOPLE)(
    "edit refuses %p as the owner role, saving nothing",
    async (owner) => {
      const res = await edit({ expectedRevision: 1, ownerRole: owner });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        ok: false,
        error: "owner_role_is_a_person",
        detail: PERSON_DETAIL,
      });
      expect(storeCalls()).toBe(0);
    },
  );

  it("a supersede's new replacement row is held to the same rule", async () => {
    const res = await decide({
      action: "supersede",
      expectedRevision: 1,
      replacement: { ...NEW_ROW_BODY, ownerRole: "Avery Quill" },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("owner_role_is_a_person");
    expect(storeCalls()).toBe(0);
  });

  it.each([
    "CFO office",
    "Finance Director",
    "Head of Shared Services",
    "Treasury",
  ])("a role (%p) is accepted on create and on edit", async (role) => {
    expect((await create({ ...NEW_ROW_BODY, ownerRole: role })).status).toBe(
      201,
    );
    expect(mockStore.createAssumption.mock.calls[0][2].ownerRole).toBe(role);
    expect((await edit({ expectedRevision: 1, ownerRole: role })).status).toBe(
      200,
    );
    expect(mockStore.editAssumption.mock.calls[0][4]).toEqual({
      ownerRole: role,
    });
  });

  it("a person's name is still accepted in owner_name, beside a role", async () => {
    const res = await create({
      ...NEW_ROW_BODY,
      ownerRole: "CFO office",
      ownerName: "Avery Quill",
    });
    expect(res.status).toBe(201);
    expect(mockStore.createAssumption.mock.calls[0][2]).toMatchObject({
      ownerRole: "CFO office",
      ownerName: "Avery Quill",
    });
    const edited = await edit({
      expectedRevision: 1,
      ownerName: "Avery Quill",
    });
    expect(edited.status).toBe(200);
    expect(mockStore.editAssumption.mock.calls[0][4]).toEqual({
      ownerName: "Avery Quill",
    });
  });

  it("an edit that does not touch the owner role is not checked against it", async () => {
    rows = [record({ ownerRole: "Avery Quill" })];
    // Only `ownerRole` is held to the rule: a statement may name anyone.
    const res = await edit({
      expectedRevision: 1,
      statement: "Avery Quill",
      ownerName: "Avery Quill",
    });
    expect(res.status).toBe(200);
  });
});
