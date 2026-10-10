/**
 * The Move assumptions register store, against an in-memory fluent client that
 * applies filters, unique indexes and guarded updates the way Postgres would.
 *
 * What is pinned:
 *   - tenant fence: reads and writes match every key of THIS tenant (app client
 *     key and canonical substrate key) and never another tenant's row, even for
 *     the same Move id; a new row is written only for a Move the client owns,
 *     and carries the caller's own client key;
 *   - revision guard: a stale revision is refused before writing, and a race
 *     between the read and the write is refused by the write itself;
 *   - ID allocation: max+1 per (Move, area), retried on 23505, bounded, and an
 *     ID held by a superseded or rejected row is never handed out again;
 *   - supersede: a NEW row with a NEW ID; a refusal that lands after the
 *     replacement was stored names the replacement;
 *   - history: one event per change; a failed event write says the change DID
 *     land;
 *   - a read error is thrown, never reported as an empty register.
 *
 * Tenant keys are derived from the alias table in code, never hand-typed.
 */
type Row = Record<string, unknown>;

const mockTables: Record<string, Row[]> = {};
const mockCalls: Array<{
  table: string;
  op: string;
  filters: Array<[string, string, unknown]>;
}> = [];
const mockHooks: {
  /** Runs before an insert is applied; may mutate tables to simulate a race. */
  beforeInsert?: (table: string, values: Row) => void;
  /** Runs before an update is applied. */
  beforeUpdate?: (table: string) => void;
  /** Forces an error for the next matching operation. */
  failNext?: {
    table: string;
    op: string;
    error: { message: string; code?: string };
  };
} = {};
let mockIdCounter = 0;

function mockUnique(table: string, row: Row): boolean {
  const rows = mockTables[table] ?? [];
  if (table === "move_assumptions") {
    return !rows.some(
      (other) =>
        other.program_id === row.program_id &&
        ((other.area === row.area && other.seq === row.seq) ||
          other.register_id === row.register_id ||
          // uq_move_assumptions_program_charter_section (partial: non-null only)
          (row.charter_section_key != null &&
            other.charter_section_key === row.charter_section_key)),
    );
  }
  if (table === "move_assumption_events") {
    return !rows.some(
      (other) =>
        other.assumption_id === row.assumption_id &&
        other.revision === row.revision,
    );
  }
  return true;
}

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (table: string) => {
      const filters: Array<[string, string, unknown]> = [];
      let op = "select";
      let payload: Row | null = null;
      const orders: Array<[string, boolean]> = [];
      let limit: number | null = null;
      const matches = (row: Row) =>
        filters.every(([column, kind, value]) =>
          kind === "in"
            ? (value as unknown[]).includes(row[column])
            : row[column] === value,
        );
      const run = (): {
        data: Row[] | null;
        error: { message: string; code?: string } | null;
      } => {
        mockCalls.push({ table, op, filters: [...filters] });
        const failure = mockHooks.failNext;
        if (failure && failure.table === table && failure.op === op) {
          mockHooks.failNext = undefined;
          return { data: null, error: failure.error };
        }
        mockTables[table] ??= [];
        if (op === "insert") {
          mockHooks.beforeInsert?.(table, payload!);
          mockIdCounter += 1;
          const row: Row = {
            id: `id-${mockIdCounter}`,
            created_at: `2026-10-10T00:00:${String(mockIdCounter).padStart(2, "0")}.000Z`,
            updated_at: `2026-10-10T00:00:${String(mockIdCounter).padStart(2, "0")}.000Z`,
            ...payload,
          };
          if (!mockUnique(table, row)) {
            return {
              data: null,
              error: { message: "duplicate key value", code: "23505" },
            };
          }
          mockTables[table].push(row);
          return { data: [{ ...row }], error: null };
        }
        if (op === "update") {
          mockHooks.beforeUpdate?.(table);
          const hit = mockTables[table].filter(matches);
          for (const row of hit) Object.assign(row, payload);
          return { data: hit.map((row) => ({ ...row })), error: null };
        }
        let rows = mockTables[table].filter(matches).map((row) => ({ ...row }));
        for (const [column, ascending] of [...orders].reverse()) {
          rows = [...rows].sort((a, b) => {
            const left = a[column] as number | string;
            const right = b[column] as number | string;
            if (left === right) return 0;
            return (left < right ? -1 : 1) * (ascending ? 1 : -1);
          });
        }
        if (limit !== null) rows = rows.slice(0, limit);
        return { data: rows, error: null };
      };
      const query = {
        select: () => query,
        insert: (values: Row) => {
          op = "insert";
          payload = values;
          return query;
        },
        update: (values: Row) => {
          op = "update";
          payload = values;
          return query;
        },
        eq: (column: string, value: unknown) => {
          filters.push([column, "eq", value]);
          return query;
        },
        in: (column: string, value: unknown[]) => {
          filters.push([column, "in", value]);
          return query;
        },
        order: (column: string, options: { ascending?: boolean } = {}) => {
          orders.push([column, options.ascending !== false]);
          return query;
        },
        limit: (count: number) => {
          limit = count;
          return query;
        },
        single: () => {
          const { data, error } = run();
          return Promise.resolve({ data: data?.[0] ?? null, error });
        },
        maybeSingle: () => {
          const { data, error } = run();
          return Promise.resolve({ data: data?.[0] ?? null, error });
        },
        then: (
          resolve: (result: unknown) => unknown,
          reject?: (error: unknown) => unknown,
        ) => Promise.resolve(run()).then(resolve, reject),
      };
      return query;
    },
  }),
}));

import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";
import type { NewAssumptionInput } from "../assumption-register/model";
import {
  MAX_ID_ALLOCATION_ATTEMPTS,
  RegisterHistoryWriteError,
  createAssumption,
  editAssumption,
  listAssumptions,
  supersedeAssumption,
  transitionAssumption,
  upsertCharterAssumption,
} from "../assumption-register/store";
import type { TenancyCtx } from "../types.db";

/** A tenant whose app client key and canonical substrate key differ. */
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
const OTHER_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;
const OTHER_KEY = appClientKeyForTenant(OTHER_TENANT) ?? OTHER_TENANT;

const CLIENT_ID = "client-1";
const MOVE_ID = "move-1";
const ctx = {
  clientId: CLIENT_ID,
  clientKey: APP_KEY,
  userId: "user-1",
} as unknown as TenancyCtx;
const PERSON = { kind: "person" as const, userId: "user-1" };
const AVA = { kind: "ava" as const, userId: "ava" };

const NEW_VALUE: NewAssumptionInput = {
  area: "value",
  statement: "Handle time falls after the change",
  workingFigure: "12%",
  source: "Team workshop estimate",
  confidence: 3,
  ownerRole: "Finance office",
  origin: "team",
};

function seedRow(overrides: Row): Row {
  mockIdCounter += 1;
  const row: Row = {
    id: `seed-${mockIdCounter}`,
    tenant_key: APP_KEY,
    program_id: MOVE_ID,
    area: "value",
    seq: 1,
    register_id: "V1",
    statement: "Seeded",
    source: "Seed",
    confidence: 1,
    owner_role: "Owner role",
    status: "open",
    origin: "team",
    revision: 1,
    evidence_ids: [],
    created_by_user_id: "user-0",
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
  mockTables.move_assumptions.push(row);
  return row;
}

const events = () => mockTables.move_assumption_events ?? [];
const assumptionWrites = () =>
  mockCalls.filter(
    (call) =>
      (call.table === "move_assumptions" ||
        call.table === "move_assumption_events") &&
      (call.op === "insert" || call.op === "update"),
  );

beforeEach(() => {
  for (const key of Object.keys(mockTables)) delete mockTables[key];
  mockTables.move_assumptions = [];
  mockTables.move_assumption_events = [];
  mockTables.engagements = [
    { id: MOVE_ID, client_id: CLIENT_ID },
    { id: "move-foreign", client_id: "client-2" },
  ];
  mockCalls.length = 0;
  mockHooks.beforeInsert = undefined;
  mockHooks.beforeUpdate = undefined;
  mockHooks.failNext = undefined;
  mockIdCounter = 0;
});

describe("tenant fence", () => {
  it("the fixture tenant really has two keys", () => {
    expect(APP_KEY).not.toBe(CANONICAL_KEY);
    expect(tenantAliasesFor(APP_KEY)).toEqual(
      expect.arrayContaining([APP_KEY, CANONICAL_KEY]),
    );
    expect(tenantAliasesFor(APP_KEY)).not.toContain(OTHER_KEY);
  });

  it("lists rows under either of this tenant's keys and never another tenant's", async () => {
    seedRow({ register_id: "V1", seq: 1 });
    seedRow({ register_id: "V2", seq: 2, tenant_key: CANONICAL_KEY });
    seedRow({ register_id: "V9", seq: 9, tenant_key: OTHER_KEY });
    seedRow({ register_id: "V3", seq: 3, program_id: "move-2" });
    const rows = await listAssumptions(ctx, MOVE_ID);
    expect(rows.map((row) => row.registerId)).toEqual(["V1", "V2"]);
    const read = mockCalls.find((call) => call.table === "move_assumptions")!;
    expect(read.filters).toEqual(
      expect.arrayContaining([
        ["tenant_key", "in", tenantAliasesFor(APP_KEY)],
        ["program_id", "eq", MOVE_ID],
      ]),
    );
  });

  it("no tenant reads nothing and queries nothing", async () => {
    seedRow({});
    await expect(
      listAssumptions({ ...ctx, clientKey: undefined } as TenancyCtx, MOVE_ID),
    ).resolves.toEqual([]);
    expect(mockCalls).toEqual([]);
  });

  it("a failed read is thrown, never reported as an empty register", async () => {
    mockHooks.failNext = {
      table: "move_assumptions",
      op: "select",
      error: { message: "connection reset" },
    };
    await expect(listAssumptions(ctx, MOVE_ID)).rejects.toMatchObject({
      message: "connection reset",
    });
  });

  it("refuses to add a row to a Move the client does not own, writing nothing", async () => {
    const result = await createAssumption(
      ctx,
      "move-foreign",
      NEW_VALUE,
      PERSON,
    );
    expect(result).toEqual({ ok: false, refusal: { code: "unknown_program" } });
    expect(assumptionWrites()).toEqual([]);
    const ownership = mockCalls.find((call) => call.table === "engagements")!;
    expect(ownership.filters).toEqual([
      ["id", "eq", "move-foreign"],
      ["client_id", "eq", CLIENT_ID],
    ]);
  });

  it("writes the caller's own client key, not an alias", async () => {
    const result = await createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON);
    expect(result.ok).toBe(true);
    expect(mockTables.move_assumptions[0].tenant_key).toBe(APP_KEY);
    expect(events()[0].tenant_key).toBe(APP_KEY);
  });

  it("cannot edit, move or supersede another tenant's row with the same Move id", async () => {
    const foreign = seedRow({ tenant_key: OTHER_KEY, status: "open" });
    const before = { ...foreign };
    expect(
      await editAssumption(
        ctx,
        MOVE_ID,
        foreign.id as string,
        1,
        { statement: "x" },
        PERSON,
      ),
    ).toEqual({ ok: false, refusal: { code: "unknown_assumption" } });
    expect(
      await transitionAssumption(
        ctx,
        MOVE_ID,
        foreign.id as string,
        1,
        { action: "confirm", answerSource: "Ledger" },
        PERSON,
      ),
    ).toEqual({ ok: false, refusal: { code: "unknown_assumption" } });
    expect(
      await supersedeAssumption(
        ctx,
        MOVE_ID,
        foreign.id as string,
        1,
        NEW_VALUE,
        PERSON,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "unknown_assumption" },
      replacement: null,
    });
    expect(foreign).toEqual(before);
    expect(assumptionWrites()).toEqual([]);
  });

  it("will not supersede onto another tenant's row", async () => {
    const own = seedRow({});
    const foreign = seedRow({
      tenant_key: OTHER_KEY,
      seq: 2,
      register_id: "V2",
    });
    expect(
      await transitionAssumption(
        ctx,
        MOVE_ID,
        own.id as string,
        1,
        { action: "supersede", supersededBy: foreign.id as string },
        PERSON,
      ),
    ).toEqual({ ok: false, refusal: { code: "unknown_supersede_target" } });
    expect(own.status).toBe("open");
  });
});

describe("creating rows", () => {
  it("a team row is open with ID V1, revision 1, and one created event", async () => {
    const result = await createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON);
    expect(result).toMatchObject({
      ok: true,
      record: {
        registerId: "V1",
        seq: 1,
        status: "open",
        origin: "team",
        revision: 1,
      },
    });
    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({
      event_type: "created",
      from_status: null,
      to_status: "open",
      revision: 1,
      before: null,
      actor_kind: "person",
      actor_user_id: "user-1",
    });
    expect(events()[0].after).not.toHaveProperty("tenantKey");
  });

  it("an aVa proposal is proposed and its event is aVa's", async () => {
    const result = await createAssumption(
      ctx,
      MOVE_ID,
      { ...NEW_VALUE, origin: "ava_proposal" },
      AVA,
    );
    expect(result).toMatchObject({ ok: true, record: { status: "proposed" } });
    expect(events()[0]).toMatchObject({
      actor_kind: "ava",
      to_status: "proposed",
    });
  });

  it("the caller cannot choose the status, and a refused input writes nothing", async () => {
    await createAssumption(
      ctx,
      MOVE_ID,
      { ...NEW_VALUE, status: "confirmed" } as unknown as NewAssumptionInput,
      PERSON,
    );
    expect(mockTables.move_assumptions[0].status).toBe("open");
    mockCalls.length = 0;
    expect(
      await createAssumption(
        ctx,
        MOVE_ID,
        { ...NEW_VALUE, source: " " },
        PERSON,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "source" },
    });
    expect(mockCalls).toEqual([]);
  });

  it("numbers each area on its own: V1, V2, D1, DL1, A1", async () => {
    const ids: string[] = [];
    for (const area of [
      "value",
      "value",
      "data",
      "delivery",
      "adoption",
    ] as const) {
      const result = await createAssumption(
        ctx,
        MOVE_ID,
        { ...NEW_VALUE, area },
        PERSON,
      );
      if (result.ok) ids.push(result.record.registerId);
    }
    expect(ids).toEqual(["V1", "V2", "D1", "DL1", "A1"]);
  });

  it("never reuses an ID held by a superseded or rejected row", async () => {
    seedRow({
      seq: 1,
      register_id: "V1",
      status: "superseded",
      superseded_by: "x",
    });
    seedRow({
      seq: 2,
      register_id: "V2",
      status: "rejected",
      origin: "ava_proposal",
    });
    const result = await createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON);
    expect(result).toMatchObject({ ok: true, record: { registerId: "V3" } });
  });

  it("counts rows stored under the tenant's other key when allocating", async () => {
    seedRow({ seq: 4, register_id: "V4", tenant_key: CANONICAL_KEY });
    const result = await createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON);
    expect(result).toMatchObject({ ok: true, record: { registerId: "V5" } });
  });

  it("retries on a unique violation and takes the next free ID", async () => {
    let raced = false;
    mockHooks.beforeInsert = (table, values) => {
      if (table !== "move_assumptions" || raced) return;
      raced = true;
      // Another writer takes the same number between our read and our insert.
      seedRow({
        seq: values.seq,
        register_id: values.register_id,
        statement: "Theirs",
      });
    };
    const result = await createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON);
    expect(result).toMatchObject({
      ok: true,
      record: { registerId: "V2", seq: 2 },
    });
    expect(
      mockTables.move_assumptions.map((row) => [
        row.register_id,
        row.statement,
      ]),
    ).toEqual([
      ["V1", "Theirs"],
      ["V2", NEW_VALUE.statement],
    ]);
  });

  it("gives up after a bounded number of lost races, naming why", async () => {
    mockHooks.beforeInsert = (table, values) => {
      if (table === "move_assumptions") {
        seedRow({ seq: values.seq, register_id: values.register_id });
      }
    };
    expect(await createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON)).toEqual({
      ok: false,
      refusal: { code: "id_allocation_conflict" },
    });
    expect(
      mockCalls.filter(
        (call) => call.table === "move_assumptions" && call.op === "insert",
      ),
    ).toHaveLength(MAX_ID_ALLOCATION_ATTEMPTS);
    expect(events()).toEqual([]);
  });

  it("an insert error that is not a unique violation is thrown, not retried", async () => {
    mockHooks.failNext = {
      table: "move_assumptions",
      op: "insert",
      error: { message: "check violation", code: "23514" },
    };
    await expect(
      createAssumption(ctx, MOVE_ID, NEW_VALUE, PERSON),
    ).rejects.toMatchObject({
      code: "23514",
    });
    expect(
      mockCalls.filter(
        (call) => call.table === "move_assumptions" && call.op === "insert",
      ),
    ).toHaveLength(1);
  });
});

describe("revision guard", () => {
  it("an edit at the current revision lands, bumps the revision, and records before/after", async () => {
    const row = seedRow({ revision: 2 });
    const result = await editAssumption(
      ctx,
      MOVE_ID,
      row.id as string,
      2,
      { workingFigure: "15%" },
      PERSON,
    );
    expect(result).toMatchObject({
      ok: true,
      record: { workingFigure: "15%", revision: 3 },
    });
    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({
      event_type: "edited",
      from_status: "open",
      to_status: "open",
      revision: 3,
      before: expect.objectContaining({ revision: 2, workingFigure: null }),
      after: expect.objectContaining({ revision: 3, workingFigure: "15%" }),
    });
    const update = mockCalls.find((call) => call.op === "update")!;
    expect(update.filters).toEqual(
      expect.arrayContaining([
        ["tenant_key", "in", tenantAliasesFor(APP_KEY)],
        ["program_id", "eq", MOVE_ID],
        ["id", "eq", row.id],
        ["revision", "eq", 2],
      ]),
    );
  });

  it("a stale revision is refused before anything is written", async () => {
    const row = seedRow({ revision: 4 });
    expect(
      await editAssumption(
        ctx,
        MOVE_ID,
        row.id as string,
        3,
        { statement: "x" },
        PERSON,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "stale_revision", currentRevision: 4 },
    });
    expect(row.statement).toBe("Seeded");
    expect(assumptionWrites()).toEqual([]);
  });

  it("a change landing between the read and the write is refused by the write", async () => {
    const row = seedRow({ revision: 1 });
    mockHooks.beforeUpdate = () => {
      row.revision = 2;
      row.statement = "Someone else's edit";
    };
    expect(
      await editAssumption(
        ctx,
        MOVE_ID,
        row.id as string,
        1,
        { statement: "Mine" },
        PERSON,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "stale_revision", currentRevision: 2 },
    });
    expect(row.statement).toBe("Someone else's edit");
    expect(events()).toEqual([]);
  });

  it("an unknown row is refused as unknown", async () => {
    expect(
      await transitionAssumption(
        ctx,
        MOVE_ID,
        "missing",
        1,
        { action: "accept" },
        PERSON,
      ),
    ).toEqual({ ok: false, refusal: { code: "unknown_assumption" } });
  });

  it("a refused edit or transition writes nothing", async () => {
    const row = seedRow({
      status: "confirmed",
      answer_source: "Ledger",
      answered_at: "t",
    });
    expect(
      await editAssumption(
        ctx,
        MOVE_ID,
        row.id as string,
        1,
        { statement: "x" },
        PERSON,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "edit_not_allowed", status: "confirmed" },
    });
    expect(
      await transitionAssumption(
        ctx,
        MOVE_ID,
        row.id as string,
        1,
        { action: "accept" },
        PERSON,
      ),
    ).toEqual({
      ok: false,
      refusal: {
        code: "invalid_transition",
        from: "confirmed",
        action: "accept",
      },
    });
    expect(
      await transitionAssumption(
        ctx,
        MOVE_ID,
        row.id as string,
        1,
        { action: "reject" },
        AVA,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "actor_not_permitted", action: "reject" },
    });
    expect(assumptionWrites()).toEqual([]);
  });
});

describe("transitions", () => {
  it("accepting an aVa proposal opens it and records who accepted", async () => {
    const row = seedRow({ status: "proposed", origin: "ava_proposal" });
    const result = await transitionAssumption(
      ctx,
      MOVE_ID,
      row.id as string,
      1,
      { action: "accept" },
      PERSON,
    );
    expect(result).toMatchObject({
      ok: true,
      record: { status: "open", acceptedByUserId: "user-1", revision: 2 },
    });
    expect(events()[0]).toMatchObject({
      event_type: "accepted",
      from_status: "proposed",
      to_status: "open",
    });
  });

  it.each([
    [{ action: "reject" } as const, "proposed", "rejected"],
    [
      { action: "confirm", answerSource: "Ledger" } as const,
      "open",
      "confirmed",
    ],
    [
      { action: "correct", answerSource: "Ledger", answer: "9%" } as const,
      "open",
      "corrected",
    ],
  ])("%o records a %s→%s event", async (request, from, to) => {
    const row = seedRow({ status: from });
    const result = await transitionAssumption(
      ctx,
      MOVE_ID,
      row.id as string,
      1,
      request,
      PERSON,
    );
    expect(result).toMatchObject({ ok: true, record: { status: to } });
    expect(events()[0]).toMatchObject({
      event_type: to,
      from_status: from,
      to_status: to,
    });
  });

  it("supersede onto an existing row of the same Move records the pointer", async () => {
    const old = seedRow({});
    const target = seedRow({ seq: 2, register_id: "V2" });
    const result = await transitionAssumption(
      ctx,
      MOVE_ID,
      old.id as string,
      1,
      { action: "supersede", supersededBy: target.id as string },
      PERSON,
    );
    expect(result).toMatchObject({
      ok: true,
      record: { status: "superseded", supersededBy: target.id },
    });
    expect(events()[0]).toMatchObject({ event_type: "superseded" });
  });
});

describe("supersede with a new row", () => {
  it("creates a NEW row with a NEW ID in the same area and points the old one at it", async () => {
    const old = seedRow({
      area: "data",
      seq: 1,
      register_id: "D1",
      status: "confirmed",
      answer_source: "L",
      answered_at: "t",
    });
    const result = await supersedeAssumption(
      ctx,
      MOVE_ID,
      old.id as string,
      1,
      { ...NEW_VALUE, statement: "Replacement" },
      PERSON,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.replacement).toMatchObject({
      registerId: "D2",
      area: "data",
      status: "open",
      origin: "team",
    });
    expect(result.replacement.id).not.toBe(old.id);
    expect(result.record).toMatchObject({
      registerId: "D1",
      status: "superseded",
      supersededBy: result.replacement.id,
    });
    expect(events().map((event) => event.event_type)).toEqual([
      "created",
      "superseded",
    ]);
  });

  it.each([
    [
      "a proposed row",
      { status: "proposed", origin: "ava_proposal" },
      1,
      PERSON,
    ],
    ["a stale revision", { revision: 3 }, 2, PERSON],
    ["aVa", {}, 1, AVA],
  ] as const)(
    "refused for %s, writing nothing",
    async (_label, overrides, expected, actor) => {
      const old = seedRow(overrides);
      const result = await supersedeAssumption(
        ctx,
        MOVE_ID,
        old.id as string,
        expected,
        NEW_VALUE,
        actor,
      );
      expect(result.ok).toBe(false);
      expect(result).toMatchObject({ replacement: null });
      expect(assumptionWrites()).toEqual([]);
    },
  );

  it("if the old row moves after the replacement is stored, the refusal names the replacement", async () => {
    const old = seedRow({});
    mockHooks.beforeUpdate = () => {
      old.revision = 2;
    };
    const result = await supersedeAssumption(
      ctx,
      MOVE_ID,
      old.id as string,
      1,
      NEW_VALUE,
      PERSON,
    );
    expect(result).toMatchObject({
      ok: false,
      refusal: { code: "stale_revision", currentRevision: 2 },
      replacement: { registerId: "V2", status: "open" },
    });
    expect(old.status).toBe("open");
  });
});

describe("history", () => {
  it("a failed event write says the change landed and carries the stored row", async () => {
    const row = seedRow({ status: "proposed", origin: "ava_proposal" });
    mockHooks.failNext = {
      table: "move_assumption_events",
      op: "insert",
      error: { message: "events unavailable" },
    };
    const outcome = transitionAssumption(
      ctx,
      MOVE_ID,
      row.id as string,
      1,
      { action: "reject" },
      PERSON,
    );
    await expect(outcome).rejects.toBeInstanceOf(RegisterHistoryWriteError);
    await outcome.catch((error: RegisterHistoryWriteError) => {
      expect(error.landed).toMatchObject({ status: "rejected", revision: 2 });
      expect(error.message).toContain("was saved");
    });
    expect(row.status).toBe("rejected");
  });
});

describe("upsert by charter section", () => {
  const CHARTER: NewAssumptionInput = {
    area: "delivery",
    statement: "Scope boundary: Claims intake only.",
    source: "P1 charter, Scope boundary, declared as an assumption",
    confidence: 1,
    ownerRole: "Head of Shared Services",
    origin: "charter_carry_forward",
    raisedPhase: 1,
    charterSectionKey: "scope_boundary",
    charterValueRevision: "rev-1",
  };

  it("creates the row once, open, and returns it as created", async () => {
    const result = await upsertCharterAssumption(ctx, MOVE_ID, CHARTER, PERSON);
    expect(result).toMatchObject({
      ok: true,
      created: true,
      record: {
        status: "open",
        origin: "charter_carry_forward",
        charterSectionKey: "scope_boundary",
        charterValueRevision: "rev-1",
        confidence: 1,
        raisedPhase: 1,
      },
    });
    expect(mockTables.move_assumptions).toHaveLength(1);
    expect(events()).toHaveLength(1);
  });

  it("a second call returns the existing row and writes nothing", async () => {
    const first = await upsertCharterAssumption(ctx, MOVE_ID, CHARTER, PERSON);
    mockCalls.length = 0;
    const second = await upsertCharterAssumption(
      ctx,
      MOVE_ID,
      { ...CHARTER, charterValueRevision: "rev-2", statement: "Changed" },
      PERSON,
    );
    expect(second).toEqual({
      ok: true,
      created: false,
      record: first.ok ? first.record : null,
    });
    expect(assumptionWrites()).toEqual([]);
    // The stored row keeps the pin it was raised with; staleness is read, not written.
    expect(mockTables.move_assumptions[0].charter_value_revision).toBe("rev-1");
  });

  it("finds the existing row under the tenant's other key, reading inside the tenant fence", async () => {
    seedRow({
      tenant_key: CANONICAL_KEY,
      charter_section_key: "scope_boundary",
    });
    const mine = await upsertCharterAssumption(ctx, MOVE_ID, CHARTER, PERSON);
    expect(mine).toMatchObject({ ok: true, created: false });
    const read = mockCalls.find(
      (call) =>
        call.table === "move_assumptions" &&
        call.filters.some(([column]) => column === "charter_section_key"),
    )!;
    expect(read.filters).toEqual(
      expect.arrayContaining([
        ["tenant_key", "in", tenantAliasesFor(APP_KEY)],
        ["program_id", "eq", MOVE_ID],
        ["charter_section_key", "eq", "scope_boundary"],
      ]),
    );
  });

  it("losing a race to another load returns the winner's row, not a refusal", async () => {
    let raced = false;
    mockHooks.beforeInsert = (table) => {
      if (table !== "move_assumptions" || raced) return;
      raced = true;
      seedRow({
        area: "delivery",
        seq: 9,
        register_id: "DL9",
        charter_section_key: "scope_boundary",
      });
    };
    const result = await upsertCharterAssumption(ctx, MOVE_ID, CHARTER, PERSON);
    expect(result).toMatchObject({
      ok: true,
      created: false,
      record: { registerId: "DL9" },
    });
    expect(mockTables.move_assumptions).toHaveLength(1);
  });

  it("refuses anything that is not a charter carry-forward with a section key, writing nothing", async () => {
    await expect(
      upsertCharterAssumption(
        ctx,
        MOVE_ID,
        { ...CHARTER, origin: "team" },
        PERSON,
      ),
    ).resolves.toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "origin" },
    });
    await expect(
      upsertCharterAssumption(
        ctx,
        MOVE_ID,
        { ...CHARTER, charterSectionKey: "  " },
        PERSON,
      ),
    ).resolves.toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "charterSectionKey" },
    });
    expect(mockCalls).toEqual([]);
  });

  it("a Move the client does not own is refused and nothing is written", async () => {
    const result = await upsertCharterAssumption(
      ctx,
      "move-foreign",
      CHARTER,
      PERSON,
    );
    expect(result).toEqual({ ok: false, refusal: { code: "unknown_program" } });
    expect(assumptionWrites()).toEqual([]);
  });
});
