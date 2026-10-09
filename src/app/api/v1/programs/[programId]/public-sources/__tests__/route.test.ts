/**
 * The outside-source review queue: GET .../public-sources and
 * POST .../public-sources/:sourceId/review.
 *
 * Both routes run the REAL repository against an in-memory store that applies
 * the repository's own filters, so tenant and Move fencing is proven by what
 * comes back, not by asserting call arguments. Tenancy, the Move read, the
 * access policy and the flag are mocked at their module boundaries, the same
 * way the evidence approval route's suite mocks them.
 *
 * Every refusal is asserted with its sentence, and every refusal before the
 * one write is asserted to leave the store untouched.
 */
import type { NextRequest } from "next/server";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { describePublicSourceReviewRefusal } from "@/lib/deliverables/public-research/review-contract";
import { MOVE_UNREADABLE_REFUSAL_DETAIL } from "@/lib/programs/move-unreadable-refusal";

type Row = Record<string, unknown>;
type Filter = { op: "eq" | "in"; column: string; value: unknown };

const mockStore: { move_public_sources: Row[] } = { move_public_sources: [] };
const mockState: {
  failOn: "select" | "update" | null;
  beforeUpdate: (() => void) | null;
  writes: number;
} = { failOn: null, beforeUpdate: null, writes: 0 };

function mockBuilder(table: string) {
  const filters: Filter[] = [];
  let op: "select" | "update" = "select";
  let payload: Row = {};
  let columns: string | undefined;
  let order: { column: string; ascending: boolean } | null = null;
  let limit: number | undefined;
  const matches = (row: Row) =>
    filters.every((f) =>
      f.op === "in"
        ? (f.value as unknown[]).includes(row[f.column])
        : row[f.column] === f.value,
    );
  const project = (row: Row) => {
    if (!columns) return { ...row };
    const out: Row = {};
    for (const c of columns.split(",").map((x) => x.trim())) out[c] = row[c];
    return out;
  };
  const run = (single: boolean) => {
    if (mockState.failOn === op) {
      return { data: null, error: { message: `${op} on ${table} failed` } };
    }
    if (op === "update") mockState.beforeUpdate?.();
    const rows = (mockStore as Record<string, Row[]>)[table]!;
    let hits = rows.filter(matches);
    if (op === "update") {
      mockState.writes += 1;
      for (const row of hits) Object.assign(row, payload);
    } else {
      if (order) {
        const o = order;
        hits = [...hits].sort((a, b) => {
          const cmp = String(a[o.column] ?? "").localeCompare(
            String(b[o.column] ?? ""),
          );
          return o.ascending ? cmp : -cmp;
        });
      }
      if (limit !== undefined) hits = hits.slice(0, limit);
    }
    const out = hits.map(project);
    return single
      ? { data: out[0] ?? null, error: null }
      : { data: out, error: null };
  };
  const builder = {
    select(cols: string) {
      columns = cols;
      return builder;
    },
    update(p: Row) {
      op = "update";
      payload = p;
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push({ op: "eq", column, value });
      return builder;
    },
    in(column: string, value: unknown[]) {
      filters.push({ op: "in", column, value });
      return builder;
    },
    order(column: string, o?: { ascending?: boolean }) {
      order = { column, ascending: o?.ascending !== false };
      return builder;
    },
    limit(n: number) {
      limit = n;
      return builder;
    },
    maybeSingle() {
      return Promise.resolve().then(() => run(true));
    },
    then<A, B>(
      onfulfilled: (value: ReturnType<typeof run>) => A,
      onrejected?: (reason: unknown) => B,
    ) {
      return Promise.resolve()
        .then(() => run(false))
        .then(onfulfilled, onrejected);
    },
  };
  return builder;
}

const requireTenancy = jest.fn();
const getProgramById = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const isFeatureEnabled = jest.fn();

class MockTenancyError extends Error {
  constructor(public readonly code: "unauthenticated" | "no_client") {
    super(code);
  }
}

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (table: string) => mockBuilder(table),
  }),
}));
jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy,
  TenancyError: MockTenancyError,
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof MockTenancyError) {
      return Response.json(
        { error: err.code },
        { status: err.code === "unauthenticated" ? 401 : 403 },
      );
    }
    throw err;
  },
}));
jest.mock("@/lib/programs/queries", () => ({ getProgramById }));
jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase,
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy,
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled }));

const THIS_TENANT = "meridian";
const OTHER_TENANT = "apexretail";
const MOVE = "11111111-1111-4111-8111-111111111111";
const OTHER_MOVE = "22222222-2222-4222-8222-222222222222";
const RUN = "33333333-3333-4333-8333-333333333333";
const CTX = {
  clientId: "client-1",
  clientKey: THIS_TENANT,
  userId: "reviewer-1",
  role: "client_admin",
};
const SUPABASE = { mocked: true };

let seq = 0;
function seed(over: Row = {}): Row {
  seq += 1;
  const row: Row = {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    tenant_key: THIS_TENANT,
    program_id: MOVE,
    run_id: RUN,
    kind: "public_source",
    url: `https://example.org/rule-${seq}`,
    title: `Published rule ${seq}`,
    publisher: "Example Agency",
    published_at: "2026-01-15",
    retrieved_at: "2026-10-10T00:00:00.000Z",
    excerpt: `The rule applies to every eligible program (${seq}).`,
    claim: "Eligible programs follow the rule.",
    confidence: "medium",
    decision: "pending",
    reviewed_by_user_id: null,
    reviewed_at: null,
    review_note: null,
    created_at: `2026-10-10T0${seq % 10}:00:00.000Z`,
    ...over,
  };
  mockStore.move_public_sources.push(row);
  return row;
}

function getRequest(query = ""): NextRequest {
  return new Request(
    `http://localhost/api/v1/programs/${MOVE}/public-sources${query}`,
  ) as unknown as NextRequest;
}

function postRequest(body: unknown, raw?: string): NextRequest {
  return new Request("http://localhost/api/v1/programs/x/public-sources/y", {
    method: "POST",
    body: raw ?? JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function list(query = "", programId = MOVE) {
  const { GET } = await import("../route");
  return GET(getRequest(query), {
    params: Promise.resolve({ programId }),
  });
}

async function review(
  sourceId: string,
  body: unknown,
  opts: { programId?: string; raw?: string } = {},
) {
  const { POST } = await import("../[sourceId]/review/route");
  return POST(postRequest(body, opts.raw), {
    params: Promise.resolve({ programId: opts.programId ?? MOVE, sourceId }),
  });
}

function refusalBody(
  code: Parameters<typeof describePublicSourceReviewRefusal>[0],
  extra: Row = {},
) {
  return {
    ok: false,
    error: code,
    detail: describePublicSourceReviewRefusal(code),
    ...extra,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.move_public_sources = [];
  mockState.failOn = null;
  mockState.beforeUpdate = null;
  mockState.writes = 0;
  seq = 0;
  requireTenancy.mockResolvedValue(CTX);
  isFeatureEnabled.mockReturnValue(true);
  getProgramsRouteSupabase.mockResolvedValue({
    mode: "service_role",
    supabase: SUPABASE,
  });
  getProgramById.mockImplementation((_ctx, programId) =>
    Promise.resolve(programId === MOVE ? { id: MOVE } : null),
  );
  loadUserProgramAccessPolicy.mockResolvedValue({
    canApproveGates: true,
    programIdsAllowed: null,
  });
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe("GET public-sources", () => {
  it("lists this Move's sources with the fields a reviewer needs, and no tenant, Move, run or reviewer ids", async () => {
    const row = seed({ review_note: null });
    const res = await list();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.decision).toBeNull();
    expect(body.sources).toEqual([
      {
        id: row.id,
        decision: "pending",
        url: row.url,
        title: row.title,
        publisher: "Example Agency",
        publishedAt: "2026-01-15",
        retrievedAt: "2026-10-10T00:00:00.000Z",
        excerpt: row.excerpt,
        claim: "Eligible programs follow the rule.",
        confidence: "medium",
        reviewedAt: null,
        reviewNote: null,
      },
    ]);
    expect(isFeatureEnabled).toHaveBeenCalledWith(
      { clientKey: THIS_TENANT, clientId: "client-1" },
      "moves_public_source_research",
    );
  });

  it.each(["pending", "approved", "rejected"] as const)(
    "filters by decision=%s",
    async (decision) => {
      seed();
      seed({
        decision: "approved",
        reviewed_by_user_id: "r",
        reviewed_at: "2026-10-10T05:00:00.000Z",
      });
      seed({
        decision: "rejected",
        reviewed_by_user_id: "r",
        reviewed_at: "2026-10-10T05:00:00.000Z",
      });
      const res = await list(`?decision=${decision}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.decision).toBe(decision);
      expect(body.sources).toHaveLength(1);
      expect(body.sources[0].decision).toBe(decision);
    },
  );

  it("lists every decision when the filter is absent", async () => {
    seed();
    seed({
      decision: "approved",
      reviewed_by_user_id: "r",
      reviewed_at: "2026-10-10T05:00:00.000Z",
    });
    const body = await (await list()).json();
    expect(
      body.sources.map((s: { decision: string }) => s.decision).sort(),
    ).toEqual(["approved", "pending"]);
  });

  it("refuses an unknown filter with a sentence and reads nothing", async () => {
    seed();
    const res = await list("?decision=maybe");
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(refusalBody("invalid_filter"));
  });

  it("is fenced to the session's tenant and this Move, whatever the query says", async () => {
    const mine = seed();
    const mineCanonical = seed({ tenant_key: canonicalTenantKey(THIS_TENANT) });
    seed({ tenant_key: OTHER_TENANT });
    seed({ tenant_key: canonicalTenantKey(OTHER_TENANT) });
    seed({ program_id: OTHER_MOVE });
    const res = await list(`?tenant=${OTHER_TENANT}&tenantKey=${OTHER_TENANT}`);
    const body = await res.json();
    expect(body.sources.map((s: { id: string }) => s.id).sort()).toEqual(
      [mine.id, mineCanonical.id].sort(),
    );
  });

  it("refuses with a sentence when the flag is off, before reading the Move", async () => {
    isFeatureEnabled.mockReturnValue(false);
    seed();
    const res = await list();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(refusalBody("not_enabled"));
    expect(getProgramById).not.toHaveBeenCalled();
  });

  it("answers an unreadable Move with the cause-blind 404 sentence", async () => {
    const res = await list("", OTHER_MOVE);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "not_found",
      detail: MOVE_UNREADABLE_REFUSAL_DETAIL,
    });
  });

  it("reports a failed read as unknown, never as an empty list", async () => {
    seed();
    mockState.failOn = "select";
    const res = await list();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual(refusalBody("sources_unreadable"));
    expect(body.sources).toBeUndefined();
  });

  it("refuses a session with no tenant key instead of reading unfenced", async () => {
    requireTenancy.mockResolvedValue({ ...CTX, clientKey: undefined });
    seed();
    const res = await list();
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(refusalBody("invalid_scope"));
  });

  it("passes a tenancy refusal through unchanged", async () => {
    requireTenancy.mockRejectedValue(new MockTenancyError("unauthenticated"));
    const res = await list();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
  });

  it("names an unexpected failure instead of an unbodied 500", async () => {
    getProgramById.mockRejectedValue(new Error("boom"));
    const res = await list();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      refusalBody("sources_unreadable"),
    );
  });
});

describe("POST public-sources/:sourceId/review", () => {
  it("approves a pending source, stamping the reviewer, the time and the note", async () => {
    const row = seed();
    const res = await review(String(row.id), {
      decision: "approved",
      note: "  Current rule for this program year. ",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.source).toEqual(
      expect.objectContaining({
        id: row.id,
        decision: "approved",
        reviewNote: "Current rule for this program year.",
      }),
    );
    expect(row.decision).toBe("approved");
    expect(row.reviewed_by_user_id).toBe("reviewer-1");
    expect(Number.isNaN(Date.parse(String(row.reviewed_at)))).toBe(false);
    expect(row.review_note).toBe("Current rule for this program year.");
    expect(getProgramById).toHaveBeenCalledWith(CTX, MOVE, {
      supabase: SUPABASE,
    });
    expect(loadUserProgramAccessPolicy).toHaveBeenCalledWith(CTX, {
      programId: MOVE,
    });
  });

  it("rejects a pending source, with no note", async () => {
    const row = seed();
    const res = await review(String(row.id), { decision: "rejected" });
    expect(res.status).toBe(200);
    expect(row.decision).toBe("rejected");
    expect(row.reviewed_by_user_id).toBe("reviewer-1");
    expect(row.review_note).toBeNull();
  });

  it("refuses a second decision on a decided source and keeps the first", async () => {
    const row = seed({
      decision: "approved",
      reviewed_by_user_id: "reviewer-0",
      reviewed_at: "2026-10-10T05:00:00.000Z",
    });
    const res = await review(String(row.id), { decision: "rejected" });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "already_decided",
      detail: describePublicSourceReviewRefusal("already_decided", {
        currentDecision: "approved",
      }),
      sourceId: row.id,
      currentDecision: "approved",
    });
    expect(
      describePublicSourceReviewRefusal("already_decided", {
        currentDecision: "approved",
      }),
    ).toContain("already approved");
    expect(row.decision).toBe("approved");
    expect(row.reviewed_by_user_id).toBe("reviewer-0");
    expect(mockState.writes).toBe(0);
  });

  it("says another reviewer won when the row was decided between the read and the write", async () => {
    const row = seed();
    // The read sees pending; another reviewer decides before the guarded
    // write, which then matches nothing.
    mockState.beforeUpdate = () =>
      Object.assign(row, {
        decision: "rejected",
        reviewed_by_user_id: "reviewer-2",
        reviewed_at: "2026-10-10T04:00:00.000Z",
      });
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual(
      refusalBody("decided_by_another_reviewer", { sourceId: row.id }),
    );
    expect(row.decision).toBe("rejected");
    expect(row.reviewed_by_user_id).toBe("reviewer-2");
  });

  it("cannot decide another tenant's source on the same Move id, or a source on another Move", async () => {
    const theirs = seed({ tenant_key: OTHER_TENANT });
    const theirsCanonical = seed({
      tenant_key: canonicalTenantKey(OTHER_TENANT),
    });
    const otherMove = seed({ program_id: OTHER_MOVE });
    for (const row of [theirs, theirsCanonical, otherMove]) {
      const res = await review(String(row.id), { decision: "approved" });
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual(
        refusalBody("source_not_found", { sourceId: row.id }),
      );
      expect(row.decision).toBe("pending");
    }
    expect(mockState.writes).toBe(0);
  });

  it("decides a source stored under the tenant's canonical key", async () => {
    const row = seed({ tenant_key: canonicalTenantKey(THIS_TENANT) });
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(200);
    expect(row.decision).toBe("approved");
  });

  it("answers a source id that is not a UUID as not on this Move", async () => {
    const res = await review("not-a-uuid", { decision: "approved" });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      refusalBody("source_not_found", { sourceId: "not-a-uuid" }),
    );
  });

  it.each([
    ["missing", {}],
    ["pending", { decision: "pending" }],
    ["unknown", { decision: "approve" }],
  ])(
    "refuses a %s decision and never reads it as an approval",
    async (_label, body) => {
      const row = seed();
      const res = await review(String(row.id), body);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual(
        refusalBody("invalid_decision"),
      );
      expect(row.decision).toBe("pending");
      expect(mockState.writes).toBe(0);
    },
  );

  it("refuses an unreadable body as no decision", async () => {
    const row = seed();
    const res = await review(String(row.id), null, { raw: "{not json" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(refusalBody("invalid_decision"));
    expect(row.decision).toBe("pending");
  });

  it("refuses an over-long or non-text note without recording the decision", async () => {
    const row = seed();
    for (const note of ["n".repeat(501), 42]) {
      const res = await review(String(row.id), { decision: "approved", note });
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual(refusalBody("invalid_note"));
    }
    expect(row.decision).toBe("pending");
    expect(mockState.writes).toBe(0);
  });

  it("refuses with a sentence when the flag is off, before reading the Move", async () => {
    isFeatureEnabled.mockReturnValue(false);
    const row = seed();
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(refusalBody("not_enabled"));
    expect(getProgramById).not.toHaveBeenCalled();
    expect(row.decision).toBe("pending");
  });

  it("answers an unreadable Move with the cause-blind 404 sentence and checks no authority", async () => {
    const row = seed({ program_id: OTHER_MOVE });
    const res = await review(
      String(row.id),
      { decision: "approved" },
      {
        programId: OTHER_MOVE,
      },
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "not_found",
      detail: MOVE_UNREADABLE_REFUSAL_DETAIL,
    });
    expect(loadUserProgramAccessPolicy).not.toHaveBeenCalled();
    expect(row.decision).toBe("pending");
  });

  it("refuses a user without gate-approval authority", async () => {
    loadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: false });
    const row = seed();
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual(refusalBody("forbidden"));
    expect(row.decision).toBe("pending");
  });

  it("refuses an approver whose program grants exclude this Move", async () => {
    loadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: true,
      programIdsAllowed: [OTHER_MOVE],
    });
    const row = seed();
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual(refusalBody("forbidden"));
    expect(row.decision).toBe("pending");
  });

  it("allows an approver whose program grants include this Move", async () => {
    loadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: true,
      programIdsAllowed: [MOVE],
    });
    const row = seed();
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(200);
  });

  it("says no decision was recorded when the source cannot be read", async () => {
    const row = seed();
    mockState.failOn = "select";
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual(
      refusalBody("review_read_failed", { sourceId: row.id }),
    );
    expect(row.decision).toBe("pending");
  });

  it("claims neither direction when the write fails", async () => {
    const row = seed();
    mockState.failOn = "update";
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      refusalBody("review_decision_unconfirmed", { sourceId: row.id }),
    );
  });

  it("names an unexpected failure instead of an unbodied 500", async () => {
    loadUserProgramAccessPolicy.mockRejectedValue(new Error("boom"));
    const row = seed();
    const res = await review(String(row.id), { decision: "approved" });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      refusalBody("review_decision_unconfirmed"),
    );
  });

  it("passes a tenancy refusal through unchanged", async () => {
    requireTenancy.mockRejectedValue(new MockTenancyError("no_client"));
    const res = await review("x", { decision: "approved" });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "no_client" });
  });
});

describe("refusal sentences", () => {
  it("say, before the write, that no decision was recorded", () => {
    for (const code of [
      "forbidden",
      "invalid_decision",
      "invalid_note",
      "invalid_scope",
      "source_not_found",
      "review_read_failed",
    ] as const) {
      expect(describePublicSourceReviewRefusal(code)).toMatch(
        /no decision was recorded/i,
      );
    }
    expect(describePublicSourceReviewRefusal("not_enabled")).toMatch(
      /no decision was recorded/i,
    );
  });

  it("claim neither direction where the write may or may not have landed", () => {
    const text = describePublicSourceReviewRefusal(
      "review_decision_unconfirmed",
    );
    expect(text).toMatch(/may or may not have been recorded/);
    expect(text).not.toMatch(/no decision was recorded/i);
  });

  it("say an unreadable list is not an empty one", () => {
    expect(describePublicSourceReviewRefusal("sources_unreadable")).toMatch(
      /not the same as having none/,
    );
  });
});
