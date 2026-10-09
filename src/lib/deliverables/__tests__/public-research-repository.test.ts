/**
 * The public-research store is fenced to ONE tenant and ONE Move, everywhere.
 *
 * A public source is research about the world, stored for the Move whose build
 * found it. If a read, a dedupe check or a decision matched another tenant's
 * row for the same Move id, one tenant's reviewed research would surface in
 * another's deliverable. These cases run the real repository against an
 * in-memory store that applies the repository's OWN filters (and projects only
 * the columns it selects), so a dropped fence or a dropped column changes what
 * comes back rather than being papered over by the fake.
 *
 * Tenant keys come from the alias table in code, never hand-typed, and the
 * first case proves the two tenants' alias sets are disjoint so no case can
 * pass by comparing a key against itself.
 */
import { createHash } from "node:crypto";

type Row = Record<string, unknown>;
type MockFilter = { op: "eq" | "in" | "gte"; column: string; value: unknown };
type MockCall = {
  table: string;
  op: "select" | "insert" | "upsert" | "update";
  filters: MockFilter[];
  columns?: string;
  payload?: unknown;
  options?: unknown;
  order?: { column: string; ascending: boolean };
  limit?: number;
};

const mockStore: Record<string, Row[]> = {
  move_public_research_runs: [],
  move_public_sources: [],
};
const mockCalls: MockCall[] = [];
const mockState: {
  failOn: { table: string; op: MockCall["op"] } | null;
  beforeWrite: ((table: string, op: MockCall["op"]) => void) | null;
  seq: number;
} = { failOn: null, beforeWrite: null, seq: 0 };

function mockId(): string {
  mockState.seq += 1;
  return `00000000-0000-4000-8000-${String(mockState.seq).padStart(12, "0")}`;
}

function mockMd5(value: unknown): string {
  return createHash("md5").update(String(value)).digest("hex");
}

function mockWithDefaults(table: string, payload: Row): Row {
  if (table === "move_public_sources") {
    return {
      id: mockId(),
      kind: "public_source",
      decision: "pending",
      reviewed_by_user_id: null,
      reviewed_at: null,
      created_at: "2026-10-10T00:00:00.000Z",
      ...payload,
      excerpt_md5: mockMd5(payload.excerpt),
    };
  }
  return {
    id: mockId(),
    created_at: "2026-10-10T00:00:00.000Z",
    ...payload,
  };
}

function mockProject(row: Row, columns: string | undefined): Row {
  if (!columns || columns.trim() === "*") return { ...row };
  const out: Row = {};
  for (const column of columns.split(",").map((c) => c.trim())) {
    out[column] = row[column];
  }
  return out;
}

function mockBuilder(table: string) {
  const call: MockCall = { table, op: "select", filters: [] };
  mockCalls.push(call);
  let single = false;
  const matches = (row: Row) =>
    call.filters.every((filter) =>
      filter.op === "in"
        ? (filter.value as unknown[]).includes(row[filter.column])
        : filter.op === "gte"
          ? String(row[filter.column] ?? "") >= String(filter.value)
          : row[filter.column] === filter.value,
    );
  const run = () => {
    const failOn = mockState.failOn;
    if (failOn && failOn.table === table && failOn.op === call.op) {
      return {
        data: null,
        error: { message: `${call.op} on ${table} failed` },
      };
    }
    const rows = mockStore[table]!;
    if (call.op === "select") {
      let hits = rows.filter(matches);
      const order = call.order;
      if (order) {
        hits = [...hits].sort((a, b) => {
          const cmp = String(a[order.column] ?? "").localeCompare(
            String(b[order.column] ?? ""),
          );
          return order.ascending ? cmp : -cmp;
        });
      }
      if (call.limit !== undefined) hits = hits.slice(0, call.limit);
      const out = hits.map((r) => mockProject(r, call.columns));
      return single
        ? { data: out[0] ?? null, error: null }
        : { data: out, error: null };
    }
    mockState.beforeWrite?.(table, call.op);
    const payloads = (
      Array.isArray(call.payload) ? call.payload : [call.payload]
    ) as Row[];
    if (call.op === "insert") {
      const inserted = payloads.map((p) => mockWithDefaults(table, p));
      rows.push(...inserted);
      return {
        data: inserted.map((r) => mockProject(r, call.columns)),
        error: null,
      };
    }
    if (call.op === "upsert") {
      const conflict = String(
        (call.options as { onConflict?: string })?.onConflict ?? "id",
      )
        .split(",")
        .map((c) => c.trim());
      const inserted: Row[] = [];
      for (const payload of payloads) {
        const row = mockWithDefaults(table, payload);
        const clash = rows.some((existing) =>
          conflict.every((column) => existing[column] === row[column]),
        );
        if (clash) continue;
        rows.push(row);
        inserted.push(row);
      }
      return {
        data: inserted.map((r) => mockProject(r, call.columns)),
        error: null,
      };
    }
    const hit = rows.filter(matches);
    for (const row of hit) Object.assign(row, call.payload as Row);
    return { data: hit.map((r) => mockProject(r, call.columns)), error: null };
  };
  const builder = {
    select(columns: string) {
      call.columns = columns;
      return builder;
    },
    insert(payload: unknown) {
      call.op = "insert";
      call.payload = payload;
      return builder;
    },
    upsert(payload: unknown, options: unknown) {
      call.op = "upsert";
      call.payload = payload;
      call.options = options;
      return builder;
    },
    update(payload: unknown) {
      call.op = "update";
      call.payload = payload;
      return builder;
    },
    eq(column: string, value: unknown) {
      call.filters.push({ op: "eq", column, value });
      return builder;
    },
    in(column: string, value: unknown[]) {
      call.filters.push({ op: "in", column, value });
      return builder;
    },
    gte(column: string, value: unknown) {
      call.filters.push({ op: "gte", column, value });
      return builder;
    },
    order(column: string, options?: { ascending?: boolean }) {
      call.order = { column, ascending: options?.ascending !== false };
      return builder;
    },
    limit(count: number) {
      call.limit = count;
      return builder;
    },
    maybeSingle() {
      single = true;
      return Promise.resolve(run());
    },
    then<A, B>(
      onfulfilled: (value: ReturnType<typeof run>) => A,
      onrejected?: (reason: unknown) => B,
    ) {
      return Promise.resolve(run()).then(onfulfilled, onrejected);
    },
  };
  return builder;
}

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (table: string) => mockBuilder(table),
  }),
}));

import {
  decidePublicSource,
  findReusableResearchRun,
  insertPublicSources,
  insertResearchRun,
  listApprovedPublicSources,
  listPublicSources,
  REVIEW_LIST_LIMIT,
  REVIEW_SOURCE_COLUMNS,
  SOURCE_COLUMNS,
  SOURCE_DEDUPE_CONFLICT,
} from "../public-research/repository";
import { PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS } from "../public-research/review-contract";
import {
  normalizeReviewNote,
  PUBLIC_SOURCE_EXCERPT_MAX_CHARS,
  PUBLIC_SOURCES_PER_RUN_MAX,
  type NewPublicSource,
} from "../public-research/types";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";

const THIS_TENANT = "meridian";
const OTHER_TENANT = "apexretail";
const THIS_CANONICAL = canonicalTenantKey(THIS_TENANT);
const OTHER_CANONICAL = canonicalTenantKey(OTHER_TENANT);
const MOVE = "11111111-1111-4111-8111-111111111111";
const OTHER_MOVE = "22222222-2222-4222-8222-222222222222";
const scope = { tenantKey: THIS_TENANT, programId: MOVE };

function seedRun(tenantKey: string, programId: string): string {
  const id = mockId();
  mockStore.move_public_research_runs!.push({
    id,
    tenant_key: tenantKey,
    program_id: programId,
    phase: 2,
    brief_hash: "brief-1",
    status: "ok",
    source_count: 0,
    started_at: "2026-10-10T00:00:00.000Z",
    created_at: "2026-10-10T00:00:00.000Z",
  });
  return id;
}

function seedSource(over: Row): Row {
  const row = mockWithDefaults("move_public_sources", {
    tenant_key: THIS_TENANT,
    program_id: MOVE,
    run_id: "00000000-0000-4000-8000-999999999999",
    url: "https://example.org/rule",
    title: "A published rule",
    publisher: "Example Agency",
    published_at: "2026-01-15",
    retrieved_at: "2026-10-10T00:00:00.000Z",
    excerpt: "The rule applies to every eligible program.",
    claim: null,
    confidence: "medium",
    ...over,
  });
  mockStore.move_public_sources!.push(row);
  return row;
}

function source(over: Partial<NewPublicSource> = {}): NewPublicSource {
  return {
    url: "https://example.org/a",
    title: "Source A",
    publisher: "Example Agency",
    publishedAt: "2026-01-15",
    retrievedAt: "2026-10-10T00:00:00.000Z",
    excerpt: "Excerpt A.",
    confidence: "high",
    ...over,
  };
}

function writesTo(table: string) {
  return mockCalls.filter((c) => c.table === table && c.op !== "select");
}

function tenantFilterOf(call: MockCall): unknown[] {
  const filter = call.filters.find((f) => f.column === "tenant_key");
  expect(filter?.op).toBe("in");
  return filter!.value as unknown[];
}

beforeEach(() => {
  mockStore.move_public_research_runs = [];
  mockStore.move_public_sources = [];
  mockCalls.length = 0;
  mockState.failOn = null;
  mockState.beforeWrite = null;
});

describe("tenant fixtures", () => {
  it("uses two tenants whose alias sets are disjoint and whose app and canonical keys differ", () => {
    const mine = tenantAliasesFor(THIS_TENANT);
    const theirs = tenantAliasesFor(OTHER_TENANT);
    expect(mine).toContain(THIS_CANONICAL);
    expect(THIS_CANONICAL).not.toBe(THIS_TENANT);
    expect(mine.some((key) => theirs.includes(key))).toBe(false);
    expect(theirs).toContain(OTHER_CANONICAL);
  });
});

describe("listApprovedPublicSources", () => {
  it("returns this tenant's approved sources for this Move under any alias, and nothing else", async () => {
    const appKey = seedSource({
      excerpt: "app key",
      decision: "approved",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T01:00:00.000Z",
    });
    const canonical = seedSource({
      tenant_key: THIS_CANONICAL,
      excerpt: "canonical key",
      decision: "approved",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T02:00:00.000Z",
    });
    seedSource({
      tenant_key: OTHER_TENANT,
      excerpt: "other tenant, same Move id",
      decision: "approved",
      reviewed_by_user_id: "user-2",
      reviewed_at: "2026-10-10T01:00:00.000Z",
    });
    seedSource({
      program_id: OTHER_MOVE,
      excerpt: "other Move",
      decision: "approved",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T01:00:00.000Z",
    });
    seedSource({ excerpt: "pending" });
    seedSource({
      excerpt: "rejected",
      decision: "rejected",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T01:00:00.000Z",
    });

    const result = await listApprovedPublicSources(scope);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sources.map((s) => s.id).sort()).toEqual(
      [appKey.id, canonical.id].sort(),
    );
    for (const s of result.sources) {
      expect(s.sourceClass).toBe("public_source");
      expect(s.kind).toBe("public_source");
      expect(s.decision).toBe("approved");
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.retrievedAt).toBeTruthy();
      expect(s.publisher).toBe("Example Agency");
      expect(s.publishedAt).toBe("2026-01-15");
      expect(s.reviewedByUserId).toBe("user-1");
    }
    const read = mockCalls.find((c) => c.table === "move_public_sources")!;
    expect(tenantFilterOf(read).sort()).toEqual(
      tenantAliasesFor(THIS_TENANT).sort(),
    );
    expect(read.filters).toContainEqual({
      op: "eq",
      column: "program_id",
      value: MOVE,
    });
    expect(read.columns).toBe(SOURCE_COLUMNS);
    expect(read.filters).toEqual(
      expect.arrayContaining([
        { op: "eq", column: "decision", value: "approved" },
        { op: "eq", column: "kind", value: "public_source" },
      ]),
    );
  });

  it("reports a failed read as a failure, never as no sources", async () => {
    mockState.failOn = { table: "move_public_sources", op: "select" };
    const result = await listApprovedPublicSources(scope);
    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "read_failed" }),
    );
  });

  it("refuses a scope without a tenant or with a non-UUID Move before touching the store", async () => {
    expect(
      await listApprovedPublicSources({ tenantKey: " ", programId: MOVE }),
    ).toEqual(expect.objectContaining({ ok: false, reason: "invalid_scope" }));
    expect(
      await listApprovedPublicSources({
        tenantKey: THIS_TENANT,
        programId: "move-1",
      }),
    ).toEqual(expect.objectContaining({ ok: false, reason: "invalid_scope" }));
    expect(mockCalls).toHaveLength(0);
  });
});

describe("insertResearchRun", () => {
  it("stores the run under the caller's tenant and Move", async () => {
    const result = await insertResearchRun(scope, {
      phase: 2,
      briefHash: "abc123",
      status: "timeout",
      sourceCount: 0,
      startedAt: "2026-10-10T00:00:00.000Z",
      error: "research timed out after 90s",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.run.tenantKey).toBe(THIS_TENANT);
    expect(result.run.programId).toBe(MOVE);
    expect(result.run.status).toBe("timeout");
    expect(result.run.error).toBe("research timed out after 90s");
    expect(mockStore.move_public_research_runs).toHaveLength(1);
  });

  it("refuses an unknown status or a negative count without writing", async () => {
    const bad = await insertResearchRun(scope, {
      phase: 2,
      briefHash: "abc123",
      status: "cancelled" as never,
      sourceCount: -1,
      startedAt: "2026-10-10T00:00:00.000Z",
    });
    expect(bad).toEqual(
      expect.objectContaining({ ok: false, reason: "invalid_input" }),
    );
    expect(mockCalls).toHaveLength(0);
  });

  it("reports a failed write", async () => {
    mockState.failOn = { table: "move_public_research_runs", op: "insert" };
    const result = await insertResearchRun(scope, {
      phase: null,
      briefHash: "abc123",
      status: "ok",
      sourceCount: 3,
      startedAt: "2026-10-10T00:00:00.000Z",
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "write_failed" }),
    );
  });
});

describe("insertPublicSources", () => {
  it("refuses a run that belongs to another tenant or another Move, and writes nothing", async () => {
    const theirRun = seedRun(OTHER_TENANT, MOVE);
    const otherMoveRun = seedRun(THIS_TENANT, OTHER_MOVE);
    for (const runId of [theirRun, otherMoveRun]) {
      const result = await insertPublicSources(scope, runId, [source()]);
      expect(result).toEqual(
        expect.objectContaining({ ok: false, reason: "run_not_found" }),
      );
    }
    expect(mockStore.move_public_sources).toHaveLength(0);
    expect(writesTo("move_public_sources")).toHaveLength(0);
  });

  it("accepts a run stored under the tenant's canonical key", async () => {
    const runId = seedRun(THIS_CANONICAL, MOVE);
    const result = await insertPublicSources(scope, runId, [source()]);
    expect(result).toEqual(expect.objectContaining({ ok: true }));
  });

  it("stores new sources pending, as public_source, under this tenant, Move and run", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    const result = await insertPublicSources(scope, runId, [source()]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inserted).toHaveLength(1);
    const [stored] = mockStore.move_public_sources!;
    expect(stored).toEqual(
      expect.objectContaining({
        tenant_key: THIS_TENANT,
        program_id: MOVE,
        run_id: runId,
        kind: "public_source",
        decision: "pending",
        url: "https://example.org/a",
        excerpt: "Excerpt A.",
      }),
    );
    const write = writesTo("move_public_sources")[0]!;
    expect(write.op).toBe("upsert");
    expect(write.options).toEqual({
      onConflict: SOURCE_DEDUPE_CONFLICT,
      ignoreDuplicates: true,
    });
    expect(SOURCE_DEDUPE_CONFLICT).toBe(
      "tenant_key,program_id,url,excerpt_md5",
    );
  });

  it("dedupes against this Move's stored sources under any alias and within the batch", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    seedSource({
      tenant_key: THIS_CANONICAL,
      url: "https://example.org/a",
      excerpt: "Excerpt A.",
    });
    const result = await insertPublicSources(scope, runId, [
      source(), // already stored (under the canonical key)
      source({ url: "https://example.org/b", excerpt: "Excerpt B." }),
      source({ url: "https://example.org/b", excerpt: "Excerpt B." }), // repeated
      source({ url: "https://example.org/b", excerpt: "Another quote." }), // same page, new quote
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicates).toBe(2);
    expect(result.inserted.map((s) => s.excerpt).sort()).toEqual(
      ["Another quote.", "Excerpt B."].sort(),
    );
    expect(mockStore.move_public_sources).toHaveLength(3);
    // The duplicates were dropped BEFORE the write, not left to the unique key.
    const write = writesTo("move_public_sources")[0]!;
    expect((write.payload as Row[]).map((r) => r.excerpt).sort()).toEqual(
      ["Another quote.", "Excerpt B."].sort(),
    );
    const dedupeRead = mockCalls.find(
      (c) => c.table === "move_public_sources" && c.op === "select",
    )!;
    expect(tenantFilterOf(dedupeRead).sort()).toEqual(
      tenantAliasesFor(THIS_TENANT).sort(),
    );
    expect(dedupeRead.filters).toContainEqual({
      op: "eq",
      column: "program_id",
      value: MOVE,
    });
  });

  it("does not treat another tenant's identical source for the same Move id as a duplicate", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    seedSource({
      tenant_key: OTHER_TENANT,
      url: "https://example.org/a",
      excerpt: "Excerpt A.",
    });
    seedSource({
      program_id: OTHER_MOVE,
      url: "https://example.org/a",
      excerpt: "Excerpt A.",
    });
    const result = await insertPublicSources(scope, runId, [source()]);
    expect(result).toEqual(
      expect.objectContaining({ ok: true, duplicates: 0 }),
    );
    if (!result.ok) return;
    expect(result.inserted).toHaveLength(1);
  });

  it("counts a row a concurrent writer stored between the check and the write as a duplicate", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    mockState.beforeWrite = (table, op) => {
      if (table === "move_public_sources" && op === "upsert") {
        seedSource({ url: "https://example.org/a", excerpt: "Excerpt A." });
      }
    };
    const result = await insertPublicSources(scope, runId, [source()]);
    expect(result).toEqual(
      expect.objectContaining({ ok: true, inserted: [], duplicates: 1 }),
    );
    expect(mockStore.move_public_sources).toHaveLength(1);
  });

  it("refuses an over-long excerpt, a non-https URL and a foreign kind, and stores the rest", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    const atLimit = "x".repeat(PUBLIC_SOURCE_EXCERPT_MAX_CHARS);
    const result = await insertPublicSources(scope, runId, [
      source({ excerpt: `${atLimit}y` }),
      source({ url: "http://example.org/plain" }),
      source({ url: "javascript:alert(1)" }),
      source({ kind: "client_private" }),
      source({ url: "https://example.org/limit", excerpt: atLimit }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rejected.map((r) => r.index)).toEqual([0, 1, 2, 3]);
    expect(result.rejected[0]!.reasons.join(" ")).toMatch(
      /301 characters; the limit is 300/,
    );
    expect(result.rejected[1]!.reasons.join(" ")).toMatch(/https/);
    expect(result.rejected[3]!.reasons.join(" ")).toMatch(
      /kind must be public_source/,
    );
    expect(result.inserted.map((s) => s.url)).toEqual([
      "https://example.org/limit",
    ]);
    expect(mockStore.move_public_sources).toHaveLength(1);
  });

  it(`stores at most ${PUBLIC_SOURCES_PER_RUN_MAX} sources from one run`, async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    const many = Array.from(
      { length: PUBLIC_SOURCES_PER_RUN_MAX + 2 },
      (_, i) =>
        source({ url: `https://example.org/${i}`, excerpt: `Quote ${i}.` }),
    );
    const result = await insertPublicSources(scope, runId, many);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inserted).toHaveLength(PUBLIC_SOURCES_PER_RUN_MAX);
    expect(result.rejected.map((r) => r.index)).toEqual([
      PUBLIC_SOURCES_PER_RUN_MAX,
      PUBLIC_SOURCES_PER_RUN_MAX + 1,
    ]);
    expect(mockStore.move_public_sources).toHaveLength(
      PUBLIC_SOURCES_PER_RUN_MAX,
    );
  });

  it("does not let a repeated source use up a slot under the per-run limit", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    const unique = Array.from({ length: PUBLIC_SOURCES_PER_RUN_MAX }, (_, i) =>
      source({ url: `https://example.org/${i}`, excerpt: `Quote ${i}.` }),
    );
    const result = await insertPublicSources(scope, runId, [
      unique[0]!,
      unique[0]!,
      ...unique.slice(1),
    ]);
    expect(result).toEqual(
      expect.objectContaining({ ok: true, duplicates: 1, rejected: [] }),
    );
    expect(mockStore.move_public_sources).toHaveLength(
      PUBLIC_SOURCES_PER_RUN_MAX,
    );
  });

  it("writes nothing when the dedupe read fails, and says the write failed when it does", async () => {
    const runId = seedRun(THIS_TENANT, MOVE);
    mockState.failOn = { table: "move_public_sources", op: "select" };
    expect(await insertPublicSources(scope, runId, [source()])).toEqual(
      expect.objectContaining({ ok: false, reason: "read_failed" }),
    );
    expect(writesTo("move_public_sources")).toHaveLength(0);

    mockState.failOn = { table: "move_public_sources", op: "upsert" };
    expect(await insertPublicSources(scope, runId, [source()])).toEqual(
      expect.objectContaining({ ok: false, reason: "write_failed" }),
    );
    expect(mockStore.move_public_sources).toHaveLength(0);
  });
});

describe("decidePublicSource", () => {
  it("moves a pending source to approved with the reviewer and the time", async () => {
    const row = seedSource({ tenant_key: THIS_CANONICAL });
    const result = await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "approved",
      reviewerUserId: "reviewer-1",
      decidedAt: "2026-10-10T05:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source.decision).toBe("approved");
    expect(result.source.reviewedByUserId).toBe("reviewer-1");
    expect(result.source.reviewedAt).toBe("2026-10-10T05:00:00.000Z");
    expect(row.decision).toBe("approved");

    const update = writesTo("move_public_sources")[0]!;
    expect(update.op).toBe("update");
    expect(update.payload).toEqual({
      decision: "approved",
      reviewed_by_user_id: "reviewer-1",
      reviewed_at: "2026-10-10T05:00:00.000Z",
      review_note: null,
    });
    expect(update.columns).toBe(REVIEW_SOURCE_COLUMNS);
    expect(result.source.reviewNote).toBeNull();
    expect(tenantFilterOf(update).sort()).toEqual(
      tenantAliasesFor(THIS_TENANT).sort(),
    );
    expect(update.filters).toEqual(
      expect.arrayContaining([
        { op: "eq", column: "id", value: row.id },
        { op: "eq", column: "program_id", value: MOVE },
        { op: "eq", column: "decision", value: "pending" },
      ]),
    );
  });

  it("moves a pending source to rejected", async () => {
    const row = seedSource({});
    const result = await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "rejected",
      reviewerUserId: "reviewer-1",
    });
    expect(result).toEqual(expect.objectContaining({ ok: true }));
    expect(row.decision).toBe("rejected");
    expect(row.reviewed_by_user_id).toBe("reviewer-1");
    expect(typeof row.reviewed_at).toBe("string");
  });

  it("never re-decides a decided source", async () => {
    const row = seedSource({
      decision: "approved",
      reviewed_by_user_id: "reviewer-1",
      reviewed_at: "2026-10-10T05:00:00.000Z",
    });
    const result = await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "rejected",
      reviewerUserId: "reviewer-2",
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: "already_decided",
        currentDecision: "approved",
      }),
    );
    expect(row.decision).toBe("approved");
    expect(row.reviewed_by_user_id).toBe("reviewer-1");
    expect(writesTo("move_public_sources")).toHaveLength(0);
  });

  it("cannot decide another tenant's source, or this tenant's source on another Move", async () => {
    const theirs = seedSource({ tenant_key: OTHER_TENANT });
    const otherMove = seedSource({ program_id: OTHER_MOVE });
    for (const row of [theirs, otherMove]) {
      const result = await decidePublicSource(scope, {
        sourceId: String(row.id),
        decision: "approved",
        reviewerUserId: "reviewer-1",
      });
      expect(result).toEqual(
        expect.objectContaining({ ok: false, reason: "not_found" }),
      );
      expect(row.decision).toBe("pending");
    }
    expect(writesTo("move_public_sources")).toHaveLength(0);
  });

  it("reports a conflict when another reviewer decided first, and keeps their decision", async () => {
    const row = seedSource({});
    mockState.beforeWrite = (table, op) => {
      if (table === "move_public_sources" && op === "update") {
        Object.assign(row, {
          decision: "rejected",
          reviewed_by_user_id: "reviewer-2",
          reviewed_at: "2026-10-10T04:00:00.000Z",
        });
      }
    };
    const result = await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "approved",
      reviewerUserId: "reviewer-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "conflict" }),
    );
    expect(row.decision).toBe("rejected");
    expect(row.reviewed_by_user_id).toBe("reviewer-2");
  });

  it("refuses `pending` as a decision and a blank reviewer, without touching the store", async () => {
    const row = seedSource({});
    expect(
      await decidePublicSource(scope, {
        sourceId: String(row.id),
        decision: "pending" as never,
        reviewerUserId: "reviewer-1",
      }),
    ).toEqual(expect.objectContaining({ ok: false, reason: "invalid_input" }));
    expect(
      await decidePublicSource(scope, {
        sourceId: String(row.id),
        decision: "approved",
        reviewerUserId: "  ",
      }),
    ).toEqual(expect.objectContaining({ ok: false, reason: "invalid_input" }));
    expect(mockCalls).toHaveLength(0);
  });
});

describe("decidePublicSource · the reviewer's note", () => {
  it("stores a trimmed note with the decision and reads it back", async () => {
    const row = seedSource({});
    const result = await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "rejected",
      reviewerUserId: "reviewer-1",
      note: "  Applies to a different program year.  ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(row.review_note).toBe("Applies to a different program year.");
    expect(result.source.reviewNote).toBe(
      "Applies to a different program year.",
    );
    const read = mockCalls.find(
      (c) => c.table === "move_public_sources" && c.op === "select",
    )!;
    expect(read.columns).toBe(REVIEW_SOURCE_COLUMNS);
  });

  it("stores a blank note as no note", async () => {
    const row = seedSource({});
    await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "approved",
      reviewerUserId: "reviewer-1",
      note: "   ",
    });
    expect(row.review_note).toBeNull();
  });

  it(`refuses a note over ${PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS} characters without touching the store`, async () => {
    const row = seedSource({});
    const atLimit = "n".repeat(PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS);
    expect(normalizeReviewNote(atLimit)).toEqual({ ok: true, value: atLimit });
    const result = await decidePublicSource(scope, {
      sourceId: String(row.id),
      decision: "approved",
      reviewerUserId: "reviewer-1",
      note: `${atLimit}n`,
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "invalid_input" }),
    );
    expect(mockCalls).toHaveLength(0);
    expect(row.decision).toBe("pending");
  });

  it("counts a note's length in characters, not UTF-16 units, and refuses a non-text note", () => {
    const astral = "\u{1F600}".repeat(PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS);
    expect(normalizeReviewNote(astral).ok).toBe(true);
    expect(normalizeReviewNote(42)).toEqual(
      expect.objectContaining({ ok: false }),
    );
    expect(normalizeReviewNote(undefined)).toEqual({ ok: true, value: null });
    expect(normalizeReviewNote(null)).toEqual({ ok: true, value: null });
  });
});

describe("listPublicSources", () => {
  function seedAllDecisions() {
    const pending = seedSource({
      excerpt: "pending",
      created_at: "2026-10-10T03:00:00.000Z",
    });
    const pendingCanonical = seedSource({
      tenant_key: THIS_CANONICAL,
      excerpt: "pending under the canonical key",
      created_at: "2026-10-10T01:00:00.000Z",
    });
    const approved = seedSource({
      excerpt: "approved",
      decision: "approved",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T04:00:00.000Z",
      review_note: "Current rule.",
      created_at: "2026-10-10T02:00:00.000Z",
    });
    const rejected = seedSource({
      excerpt: "rejected",
      decision: "rejected",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T04:00:00.000Z",
      created_at: "2026-10-10T00:30:00.000Z",
    });
    const theirs = seedSource({
      tenant_key: OTHER_TENANT,
      excerpt: "other tenant, same Move id",
    });
    const otherMove = seedSource({
      program_id: OTHER_MOVE,
      excerpt: "this tenant, other Move",
    });
    return { pending, pendingCanonical, approved, rejected, theirs, otherMove };
  }

  it("lists every decision for this tenant and Move, newest first, and nothing else", async () => {
    const rows = seedAllDecisions();
    const result = await listPublicSources(scope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sources.map((s) => s.id)).toEqual([
      rows.pending.id,
      rows.approved.id,
      rows.pendingCanonical.id,
      rows.rejected.id,
    ]);
    expect(
      result.sources.find((s) => s.id === rows.approved.id)!.reviewNote,
    ).toBe("Current rule.");
    const read = mockCalls.find((c) => c.table === "move_public_sources")!;
    expect(read.columns).toBe(REVIEW_SOURCE_COLUMNS);
    expect(tenantFilterOf(read).sort()).toEqual(
      tenantAliasesFor(THIS_TENANT).sort(),
    );
    expect(read.filters).toEqual(
      expect.arrayContaining([
        { op: "eq", column: "program_id", value: MOVE },
        { op: "eq", column: "kind", value: "public_source" },
      ]),
    );
    expect(read.filters.some((f) => f.column === "decision")).toBe(false);
    expect(read.order).toEqual({ column: "created_at", ascending: false });
    expect(read.limit).toBe(REVIEW_LIST_LIMIT);
  });

  it.each(["pending", "approved", "rejected"] as const)(
    "filters to %s sources only",
    async (decision) => {
      seedAllDecisions();
      const result = await listPublicSources(scope, { decision });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources.every((s) => s.decision === decision)).toBe(true);
      const read = mockCalls.find((c) => c.table === "move_public_sources")!;
      expect(read.filters).toContainEqual({
        op: "eq",
        column: "decision",
        value: decision,
      });
    },
  );

  it("refuses an unknown decision filter without reading", async () => {
    const result = await listPublicSources(scope, {
      decision: "maybe" as never,
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "invalid_input" }),
    );
    expect(mockCalls).toHaveLength(0);
  });

  it("reports a failed read as a failure, never as no sources", async () => {
    seedAllDecisions();
    mockState.failOn = { table: "move_public_sources", op: "select" };
    expect(await listPublicSources(scope)).toEqual(
      expect.objectContaining({ ok: false, reason: "read_failed" }),
    );
  });

  it("refuses a bad scope before touching the store", async () => {
    expect(await listPublicSources({ tenantKey: "", programId: MOVE })).toEqual(
      expect.objectContaining({ ok: false, reason: "invalid_scope" }),
    );
    expect(
      await listPublicSources({ tenantKey: THIS_TENANT, programId: "move-1" }),
    ).toEqual(expect.objectContaining({ ok: false, reason: "invalid_scope" }));
    expect(mockCalls).toHaveLength(0);
  });
});

describe("findReusableResearchRun", () => {
  const SINCE = "2026-09-26T00:00:00.000Z";

  function seedRunRow(over: Row): string {
    const id = mockId();
    mockStore.move_public_research_runs!.push({
      id,
      tenant_key: THIS_TENANT,
      program_id: MOVE,
      phase: 2,
      brief_hash: "brief-1",
      status: "ok",
      source_count: 0,
      audit_id: "audit-1",
      started_at: "2026-10-01T00:00:00.000Z",
      created_at: "2026-10-01T00:00:00.000Z",
      ...over,
    });
    return id;
  }

  it("returns the newest ok run for this brief since the cutoff, for this tenant and Move only", async () => {
    seedRunRow({
      tenant_key: OTHER_TENANT,
      created_at: "2026-10-09T00:00:00.000Z",
    });
    seedRunRow({
      program_id: OTHER_MOVE,
      created_at: "2026-10-09T00:00:00.000Z",
    });
    seedRunRow({ status: "timeout", created_at: "2026-10-09T00:00:00.000Z" });
    seedRunRow({
      brief_hash: "brief-2",
      created_at: "2026-10-09T00:00:00.000Z",
    });
    seedRunRow({ created_at: "2026-09-25T23:59:59.000Z" });
    const older = seedRunRow({ created_at: "2026-10-02T00:00:00.000Z" });
    const newest = seedRunRow({
      tenant_key: THIS_CANONICAL,
      created_at: "2026-10-05T00:00:00.000Z",
    });
    const out = await findReusableResearchRun(scope, " brief-1 ", SINCE);
    expect(out).toMatchObject({ ok: true, run: { id: newest } });
    expect(older).not.toBe(newest);
    const read = mockCalls.find(
      (c) => c.table === "move_public_research_runs",
    )!;
    expect(tenantFilterOf(read)).toEqual(tenantAliasesFor(THIS_TENANT));
    expect(read.filters).toEqual(
      expect.arrayContaining([
        { op: "eq", column: "program_id", value: MOVE },
        { op: "eq", column: "brief_hash", value: "brief-1" },
        { op: "eq", column: "status", value: "ok" },
        { op: "gte", column: "created_at", value: SINCE },
      ]),
    );
    expect(read.limit).toBe(1);
  });

  it("returns no run when nothing matches", async () => {
    seedRunRow({ status: "failed" });
    expect(await findReusableResearchRun(scope, "brief-1", SINCE)).toEqual({
      ok: true,
      run: null,
      pendingSourceCount: 0,
    });
  });

  it("counts only this run's pending sources for this tenant and Move", async () => {
    const id = seedRunRow({ source_count: 3 });
    seedSource({ run_id: id, excerpt: "one" });
    seedSource({ run_id: id, tenant_key: THIS_CANONICAL, excerpt: "two" });
    seedSource({
      run_id: id,
      excerpt: "approved",
      decision: "approved",
      reviewed_by_user_id: "user-1",
      reviewed_at: "2026-10-10T01:00:00.000Z",
    });
    seedSource({
      run_id: id,
      tenant_key: OTHER_TENANT,
      excerpt: "other tenant",
    });
    seedSource({ run_id: id, program_id: OTHER_MOVE, excerpt: "other Move" });
    seedSource({ excerpt: "other run" });
    const out = await findReusableResearchRun(scope, "brief-1", SINCE);
    expect(out).toMatchObject({ ok: true, run: { id }, pendingSourceCount: 2 });
  });

  it("does not reuse a run that reported sources but has none stored", async () => {
    const id = seedRunRow({ source_count: 2 });
    seedSource({ run_id: id, tenant_key: OTHER_TENANT, excerpt: "not ours" });
    expect(await findReusableResearchRun(scope, "brief-1", SINCE)).toEqual({
      ok: true,
      run: null,
      pendingSourceCount: 0,
    });
  });

  it("reuses a run that found nothing", async () => {
    const id = seedRunRow({ source_count: 0 });
    expect(
      await findReusableResearchRun(scope, "brief-1", SINCE),
    ).toMatchObject({
      ok: true,
      run: { id },
      pendingSourceCount: 0,
    });
  });

  it("reports a failed read as a failure, never as no run", async () => {
    seedRunRow({});
    mockState.failOn = { table: "move_public_research_runs", op: "select" };
    expect(
      await findReusableResearchRun(scope, "brief-1", SINCE),
    ).toMatchObject({
      ok: false,
      reason: "read_failed",
    });
    mockState.failOn = { table: "move_public_sources", op: "select" };
    expect(
      await findReusableResearchRun(scope, "brief-1", SINCE),
    ).toMatchObject({
      ok: false,
      reason: "read_failed",
    });
  });

  it("refuses a bad scope, an empty hash and a bad cutoff without reading", async () => {
    expect(
      await findReusableResearchRun(
        { tenantKey: THIS_TENANT, programId: "x" },
        "brief-1",
        SINCE,
      ),
    ).toMatchObject({ ok: false, reason: "invalid_scope" });
    expect(await findReusableResearchRun(scope, "  ", SINCE)).toMatchObject({
      ok: false,
      reason: "invalid_input",
    });
    expect(
      await findReusableResearchRun(scope, "brief-1", "not a time"),
    ).toMatchObject({
      ok: false,
      reason: "invalid_input",
    });
    expect(mockCalls).toHaveLength(0);
  });
});
