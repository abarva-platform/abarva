// Unit tests for the programs portfolio read adapter (Slice 2).
//
// Pins the contract for the Azure parallel-run cutover:
//   - default plane stays Supabase (production unchanged);
//   - the Azure Postgres adapter is selectable explicitly / by env;
//   - the RBAC allowlist short-circuit ([] -> [], no query) holds on both;
//   - the engagement row shape is stable across planes;
//   - a missing/empty result yields [] rather than a throw.

import type { PostgresCompatClient as SupabaseClient } from "@/lib/supabase-server";
import type { SessionRunner } from "../azureSession";
import {
  createAzureProgramsReadAdapter,
  createSupabaseProgramsReadAdapter,
  selectProgramsReadAdapter,
  type EngagementPortfolioRow,
} from "../programsReadAdapter";

/** A representative engagement row — all columns the projection selects. */
function sampleRow(
  overrides: Partial<EngagementPortfolioRow> = {},
): EngagementPortfolioRow {
  return {
    id: "eng-1",
    client_id: "client-1",
    name: "Contact Center AI",
    sponsor_person_id: null,
    problem_statement: null,
    target_outcome: null,
    timeline_horizon: null,
    value_projected_low_usd: null,
    value_projected_high_usd: null,
    value_verified_usd: null,
    value_verified_status: null,
    value_currency: null,
    value_assumptions_jsonb: null,
    baseline_metrics: null,
    program_archetype: null,
    origin_source: null,
    origin_source_ref: null,
    status: null,
    lifecycle_state: null,
    current_phase: null,
    current_module_key: null,
    maestro_oversight_level: null,
    founder_approval_required: null,
    phase_locked_at: null,
    phase_locked_by_user_id: null,
    data_residency_region: null,
    retention_policy_years: null,
    archived_at: null,
    archived_by: null,
    archive_reason: null,
    archive_explanation: null,
    archived_from_state: null,
    deleted_at: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: null,
    charter: null,
    function_pack_key: null,
    function_pack_confidence: null,
    gates_passed: null,
    ...overrides,
  };
}

/** Builds an injectable Azure session whose runner is driven by `handler`. */
function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(
      async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[],
    );
}

/**
 * A Supabase query-builder mock. `rows` is what the terminal `.limit()`
 * resolves to. Records the chained calls for assertions.
 */
function fakeSupabase(rows: EngagementPortfolioRow[]): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "order", "in"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.limit = (...args: unknown[]) => {
    calls.push({ method: "limit", args });
    return Promise.resolve({ data: rows, error: null });
  };
  const client = { from: () => builder } as unknown as SupabaseClient;
  return { client, calls };
}

describe("selectProgramsReadAdapter", () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it("returns the Supabase adapter by default (no env set)", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectProgramsReadAdapter().name).toBe("supabase");
  });

  it("returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres", () => {
    process.env.ABARVA_DATA_PLANE = "azure-postgres";
    expect(selectProgramsReadAdapter().name).toBe("azure-postgres");
  });

  it("honors an explicit plane argument over the env var", () => {
    process.env.ABARVA_DATA_PLANE = "azure-postgres";
    expect(selectProgramsReadAdapter("supabase").name).toBe("supabase");
  });

  it("routes governed foundation tenants to Azure when the env is unset", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectProgramsReadAdapter(undefined, "airline-demo-new").name).toBe(
      "azure-postgres",
    );
    expect(selectProgramsReadAdapter(undefined, "meridian").name).toBe(
      "azure-postgres",
    );
    expect(selectProgramsReadAdapter(undefined, "meridian-health").name).toBe(
      "azure-postgres",
    );
  });

  it("fails closed when a governed foundation tenant is forced to Supabase", () => {
    expect(() =>
      selectProgramsReadAdapter("supabase", "airline-demo-new"),
    ).toThrow(/airline-demo-new.*Azure PostgreSQL/i);
    expect(() =>
      selectProgramsReadAdapter("supabase", "meridian"),
    ).toThrow(/meridian-health.*Azure PostgreSQL/i);
  });
});

describe("supabaseProgramsReadAdapter", () => {
  it("returns rows for the client, scoped + ordered as before the seam", async () => {
    const { client, calls } = fakeSupabase([sampleRow()]);
    const adapter = createSupabaseProgramsReadAdapter(() => client);
    const rows = await adapter.getProgramPortfolioRows({
      clientId: "client-1",
      allowedProgramIds: null,
      limit: 100,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("eng-1");
    // Tenancy + soft-delete exclusion + ordering preserved.
    expect(
      calls.some((c) => c.method === "eq" && c.args[0] === "client_id"),
    ).toBe(true);
    expect(calls.filter((c) => c.method === "is")).toHaveLength(2);
    expect(calls.some((c) => c.method === "order")).toBe(true);
    expect(calls.some((c) => c.method === "limit" && c.args[0] === 100)).toBe(
      true,
    );
    // No RBAC restriction -> no `.in()` filter.
    expect(calls.some((c) => c.method === "in")).toBe(false);
  });

  it("applies the RBAC allowlist as an `in` filter when provided", async () => {
    const { client, calls } = fakeSupabase([sampleRow()]);
    const adapter = createSupabaseProgramsReadAdapter(() => client);
    await adapter.getProgramPortfolioRows({
      clientId: "client-1",
      allowedProgramIds: ["eng-1", "eng-2"],
      limit: 50,
    });
    expect(calls.some((c) => c.method === "in" && c.args[0] === "id")).toBe(
      true,
    );
  });

  it("short-circuits to [] (no query) for an empty RBAC allowlist", async () => {
    const factory = jest.fn(() => fakeSupabase([]).client);
    const adapter = createSupabaseProgramsReadAdapter(factory);
    const rows = await adapter.getProgramPortfolioRows({
      clientId: "client-1",
      allowedProgramIds: [],
      limit: 100,
    });
    expect(rows).toEqual([]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("throws on a genuine query error (route handles the 500)", async () => {
    const builder: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "order", "in"])
      builder[m] = () => builder;
    builder.limit = () =>
      Promise.resolve({ data: null, error: { message: "boom" } });
    const client = { from: () => builder } as unknown as SupabaseClient;
    const adapter = createSupabaseProgramsReadAdapter(() => client);
    await expect(
      adapter.getProgramPortfolioRows({
        clientId: "c",
        allowedProgramIds: null,
        limit: 10,
      }),
    ).rejects.toEqual({ message: "boom" });
  });
});

describe("azureProgramsReadAdapter", () => {
  it("returns rows scoped by client with tenancy + soft-delete predicates", async () => {
    let seenSql = "";
    let seenParams: unknown[] = [];
    const session = fakeSession((sql, params) => {
      seenSql = sql;
      seenParams = params;
      return [sampleRow()];
    });
    const adapter = createAzureProgramsReadAdapter(session);
    const rows = await adapter.getProgramPortfolioRows({
      clientId: "client-1",
      allowedProgramIds: null,
      limit: 100,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("eng-1");
    expect(seenSql).toContain("client_id = $1");
    expect(seenSql).toContain("archived_at IS NULL");
    expect(seenSql).toContain("deleted_at IS NULL");
    expect(seenSql).toContain("ORDER BY created_at DESC");
    expect(seenParams).toEqual(["client-1", 100]);
  });

  it("adds an ANY() filter for the RBAC allowlist", async () => {
    let seenSql = "";
    let seenParams: unknown[] = [];
    const session = fakeSession((sql, params) => {
      seenSql = sql;
      seenParams = params;
      return [];
    });
    const adapter = createAzureProgramsReadAdapter(session);
    await adapter.getProgramPortfolioRows({
      clientId: "client-1",
      allowedProgramIds: ["eng-1", "eng-2"],
      limit: 25,
    });
    expect(seenSql).toContain("id = ANY($2::text[])");
    expect(seenParams).toEqual(["client-1", ["eng-1", "eng-2"], 25]);
  });

  it("short-circuits to [] (no session) for an empty RBAC allowlist", async () => {
    const session = jest.fn() as unknown as SessionRunner;
    const adapter = createAzureProgramsReadAdapter(session);
    const rows = await adapter.getProgramPortfolioRows({
      clientId: "client-1",
      allowedProgramIds: [],
      limit: 100,
    });
    expect(rows).toEqual([]);
    expect(session).not.toHaveBeenCalled();
  });

  it("returns [] when the tenant has no matching engagements", async () => {
    const adapter = createAzureProgramsReadAdapter(fakeSession(() => []));
    const rows = await adapter.getProgramPortfolioRows({
      clientId: "ghost",
      allowedProgramIds: null,
      limit: 100,
    });
    expect(rows).toEqual([]);
  });
});

/**
 * A Supabase mock whose `.from('engagements')` chain ends in `.maybeSingle()`,
 * resolving to the configured `{ data, error }`. Used for `getProgramByIdRow`.
 */
function fakeSupabaseSingle(result: { data: unknown; error: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.maybeSingle = (...args: unknown[]) => {
    calls.push({ method: "maybeSingle", args });
    return Promise.resolve(result);
  };
  const client = { from: () => builder } as unknown as SupabaseClient;
  return { client, calls };
}

describe("supabaseProgramsReadAdapter.getProgramByIdRow", () => {
  it("returns the single row scoped by id + client", async () => {
    const { client, calls } = fakeSupabaseSingle({
      data: sampleRow(),
      error: null,
    });
    const adapter = createSupabaseProgramsReadAdapter(() => client);
    const row = await adapter.getProgramByIdRow("eng-1", "client-1");
    expect(row?.id).toBe("eng-1");
    expect(calls.some((c) => c.method === "eq" && c.args[0] === "id")).toBe(
      true,
    );
    expect(
      calls.some((c) => c.method === "eq" && c.args[0] === "client_id"),
    ).toBe(true);
    expect(calls.some((c) => c.method === "maybeSingle")).toBe(true);
  });

  it("returns null when no engagement matches", async () => {
    const { client } = fakeSupabaseSingle({ data: null, error: null });
    const adapter = createSupabaseProgramsReadAdapter(() => client);
    expect(await adapter.getProgramByIdRow("ghost", "client-1")).toBeNull();
  });

  it("throws on a genuine query error", async () => {
    const { client } = fakeSupabaseSingle({
      data: null,
      error: { message: "boom" },
    });
    const adapter = createSupabaseProgramsReadAdapter(() => client);
    await expect(adapter.getProgramByIdRow("eng-1", "c")).rejects.toEqual({
      message: "boom",
    });
  });
});

describe("azureProgramsReadAdapter.getProgramByIdRow", () => {
  it("reads the row with id + client_id predicates", async () => {
    let seenSql = "";
    let seenParams: unknown[] = [];
    const session = fakeSession((sql, params) => {
      seenSql = sql;
      seenParams = params;
      return [sampleRow()];
    });
    const adapter = createAzureProgramsReadAdapter(session);
    const row = await adapter.getProgramByIdRow("eng-1", "client-1");
    expect(row?.id).toBe("eng-1");
    expect(seenSql).toContain("id = $1");
    expect(seenSql).toContain("client_id = $2");
    expect(seenSql).toContain("LIMIT 1");
    expect(seenParams).toEqual(["eng-1", "client-1"]);
  });

  it("returns null when the query yields no rows", async () => {
    const adapter = createAzureProgramsReadAdapter(fakeSession(() => []));
    expect(await adapter.getProgramByIdRow("ghost", "client-1")).toBeNull();
  });
});
