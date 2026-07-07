// Source fact write adapter: the Supabase (default) + Azure (opt-in) paths persist
// a typed batch, reject a mixed-tenant batch, and no-op an empty batch — without a
// live backend (client / session injected).

import {
  createSupabaseSourceFactWriteAdapter,
  createAzureSourceFactWriteAdapter,
} from "../sourceFactWriteAdapter";
import type { SourceEventFactInsert } from "@/lib/source/facts/fact-types";
import type { PostgresCompatClient } from "@/lib/data-plane/postgresCompat";
import type {
  SqlRunner,
  TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";

function fact(
  overrides: Partial<SourceEventFactInsert> = {},
): SourceEventFactInsert {
  return {
    source_event_id: "event-1",
    client_key: "lakeshore",
    fact_key: "annual_run_cost",
    entity_kind: "tower",
    entity_ref: "T-1",
    value_numeric: 100,
    value_text: null,
    unit: "usd_per_year",
    source_method: "structured_map",
    source_citation: { doc: "APP_INVENTORY_V1", locator: "column 'x', row 1" },
    confidence: "high",
    ...overrides,
  };
}

describe("Supabase source-fact write adapter", () => {
  it("inserts the batch as a single .insert([...]) call", async () => {
    const captured: { table?: string; rows?: unknown } = {};
    const client = {
      from(table: string) {
        captured.table = table;
        return {
          insert(rows: unknown) {
            captured.rows = rows;
            return Promise.resolve({ error: null });
          },
        };
      },
    } as unknown as PostgresCompatClient;

    const adapter = createSupabaseSourceFactWriteAdapter(() => client);
    const res = await adapter.insertFacts([fact(), fact({ fact_key: "term_years", unit: "months" })]);

    expect(res.ok).toBe(true);
    expect(res.data?.inserted).toBe(2);
    expect(captured.table).toBe("source_event_facts");
    expect(Array.isArray(captured.rows)).toBe(true);
    expect((captured.rows as unknown[]).length).toBe(2);
    // snake_case row shape preserved.
    const first = (captured.rows as Array<Record<string, unknown>>)[0];
    expect(first.fact_key).toBe("annual_run_cost");
    expect(first.source_method).toBe("structured_map");
    expect(first.confidence).toBe("high");
  });

  it("surfaces a DB error as ok:false", async () => {
    const client = {
      from() {
        return { insert: () => Promise.resolve({ error: { message: "boom" } }) };
      },
    } as unknown as PostgresCompatClient;
    const adapter = createSupabaseSourceFactWriteAdapter(() => client);
    const res = await adapter.insertFacts([fact()]);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("boom");
  });

  it("no-ops an empty batch without touching the client", async () => {
    let called = false;
    const client = {
      from() {
        called = true;
        return { insert: () => Promise.resolve({ error: null }) };
      },
    } as unknown as PostgresCompatClient;
    const adapter = createSupabaseSourceFactWriteAdapter(() => client);
    const res = await adapter.insertFacts([]);
    expect(res.ok).toBe(true);
    expect(res.data?.inserted).toBe(0);
    expect(called).toBe(false);
  });

  it("rejects a mixed-tenant batch (defense-in-depth)", async () => {
    let called = false;
    const client = {
      from() {
        called = true;
        return { insert: () => Promise.resolve({ error: null }) };
      },
    } as unknown as PostgresCompatClient;
    const adapter = createSupabaseSourceFactWriteAdapter(() => client);
    const res = await adapter.insertFacts([
      fact({ client_key: "lakeshore" }),
      fact({ client_key: "apexretail" }),
    ]);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/mixed-tenant/);
    expect(called).toBe(false);
  });
});

describe("Azure source-fact write adapter", () => {
  it("inserts each row inside one transaction session", async () => {
    const statements: Array<{ sql: string; params: unknown[] }> = [];
    const session: TxSessionRunner = (fn) =>
      fn((async (sql: string, params: unknown[]) => {
        statements.push({ sql, params });
        return [];
      }) as SqlRunner);

    const adapter = createAzureSourceFactWriteAdapter(session);
    const res = await adapter.insertFacts([fact(), fact({ fact_key: "term_years" })]);

    expect(res.ok).toBe(true);
    expect(res.data?.inserted).toBe(2);
    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toMatch(/INSERT INTO source_event_facts/);
    // client_key is $2 → tenant-scoped write.
    expect(statements[0].params[1]).toBe("lakeshore");
    // source_citation ($10) is JSON-serialized.
    expect(typeof statements[0].params[9]).toBe("string");
  });

  it("rejects a mixed-tenant batch before opening the session", async () => {
    let opened = false;
    const session: TxSessionRunner = (fn) => {
      opened = true;
      return fn((async () => []) as SqlRunner);
    };
    const adapter = createAzureSourceFactWriteAdapter(session);
    const res = await adapter.insertFacts([
      fact({ client_key: "lakeshore" }),
      fact({ client_key: "meridian" }),
    ]);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/mixed-tenant/);
    expect(opened).toBe(false);
  });

  it("surfaces a thrown DB error as ok:false", async () => {
    const session = async () => {
      throw new Error("relation \"source_event_facts\" does not exist");
    };
    const adapter = createAzureSourceFactWriteAdapter(
      session as never,
    );
    const res = await adapter.insertFacts([fact()]);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/does not exist/);
  });
});
