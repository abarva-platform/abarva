// Unit tests for the Slice 3c attachments write adapter.
//
// Pins the contract that matters for the Azure parallel-run cutover:
//   - default plane selection stays Supabase (production write unchanged);
//   - the Azure plane is selectable explicitly / by env;
//   - program/agent attachment rows are byte-faithful to the pre-seam
//     `.insert()` bodies, including the conditional scan_status spread;
//   - the agent-attachment soft-delete preserves tenant scoping + the
//     already-deleted guard and returns null when no row is affected.

import type { PostgresCompatClient as SupabaseClient } from "@/lib/supabase-server";
import type { TxSessionRunner } from "../../read-adapters/azureSession";
import {
  createAzureAttachmentsWriteAdapter,
  createSupabaseAttachmentsWriteAdapter,
  selectAttachmentsWriteAdapter,
} from "../attachmentsWriteAdapter";

// --- selection --------------------------------------------------------------

describe("selectAttachmentsWriteAdapter", () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it("returns the Supabase adapter by default (no env set)", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectAttachmentsWriteAdapter().plane).toBe("supabase");
  });

  it("returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres", () => {
    process.env.ABARVA_DATA_PLANE = "azure-postgres";
    expect(selectAttachmentsWriteAdapter().plane).toBe("azure-postgres");
  });

  it("honors an explicit plane argument over the env var", () => {
    process.env.ABARVA_DATA_PLANE = "azure-postgres";
    expect(selectAttachmentsWriteAdapter("supabase").plane).toBe("supabase");
  });
});

// --- Supabase adapter (DEFAULT) --------------------------------------------

interface FakeOpts {
  insertSelectResult?: { data?: unknown; error?: { message: string } | null };
  agentInsertError?: { message: string } | null;
  updateResult?: { data?: unknown; error?: { message: string } | null };
}

function fakeSupabase(opts: FakeOpts): {
  client: SupabaseClient;
  programInserts: Record<string, unknown>[];
  agentInserts: Record<string, unknown>[];
  updateFilters: Record<string, unknown>;
} {
  const programInserts: Record<string, unknown>[] = [];
  const agentInserts: Record<string, unknown>[] = [];
  const updateFilters: Record<string, unknown> = {};
  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          if (table === "program_attachments") {
            programInserts.push(row);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve(
                    opts.insertSelectResult ?? { data: row, error: null },
                  ),
              }),
            };
          }
          agentInserts.push(row);
          return Promise.resolve({ error: opts.agentInsertError ?? null });
        },
        update(patch: Record<string, unknown>) {
          updateFilters.patch = patch;
          const chain = {
            eq(col: string, val: unknown) {
              updateFilters[col] = val;
              return chain;
            },
            is(col: string, val: unknown) {
              updateFilters[col] = val;
              return chain;
            },
            select() {
              return {
                maybeSingle: () =>
                  Promise.resolve(
                    opts.updateResult ?? { data: { id: "att-1" }, error: null },
                  ),
              };
            },
          };
          return chain;
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, programInserts, agentInserts, updateFilters };
}

describe("supabase attachments write adapter", () => {
  it("insertProgramAttachment writes a verbatim row and omits scan_status when unset", async () => {
    const { client, programInserts } = fakeSupabase({});
    const adapter = createSupabaseAttachmentsWriteAdapter(() => client);
    await adapter.insertProgramAttachment(
      {
        tenant_key: "apex-retail",
        program_id: "prog-1",
        phase: 2,
        step_id: null,
        deliverable_id: null,
        original_name: "plan.pdf",
        storage_path: "apex-retail/prog-1/att/plan.pdf",
        uploader_user_id: "user-1",
        mime_type: "application/pdf",
        size_bytes: 100,
        sha256: "abc",
      },
      "id",
    );
    expect(programInserts[0]).not.toHaveProperty("scan_status");
    expect(programInserts[0]).toMatchObject({
      tenant_key: "apex-retail",
      program_id: "prog-1",
      original_name: "plan.pdf",
    });
  });

  it("insertProgramAttachment includes scan_status + scan_findings when supplied", async () => {
    const { client, programInserts } = fakeSupabase({});
    const adapter = createSupabaseAttachmentsWriteAdapter(() => client);
    await adapter.insertProgramAttachment(
      {
        tenant_key: "apex-retail",
        program_id: "prog-1",
        phase: null,
        step_id: null,
        deliverable_id: null,
        original_name: "f",
        storage_path: "s",
        uploader_user_id: "u",
        mime_type: "application/pdf",
        size_bytes: 1,
        sha256: "x",
        scan_status: "skipped",
        scan_findings: { reason: "sync" },
      },
      "id",
    );
    expect(programInserts[0]).toMatchObject({
      scan_status: "skipped",
      scan_findings: { reason: "sync" },
    });
  });

  it("insertAgentAttachment writes a verbatim agent_attachment row", async () => {
    const { client, agentInserts } = fakeSupabase({});
    const adapter = createSupabaseAttachmentsWriteAdapter(() => client);
    await adapter.insertAgentAttachment({
      id: "att-1",
      tenant_id: "tenant-1",
      surface: "moves",
      agent: "sentinel",
      user_id: "user-1",
      file_name: "doc.pdf",
      mime: "application/pdf",
      bytes: 10,
      storage_path: "tenant-1/user-1/att-1-doc.pdf",
      extracted_text: null,
      linked_move_id: null,
      parse_metadata: {
        document_key: "sha256:abc",
        parse_cost_usd: 0.01,
      },
    });
    expect(agentInserts[0]).toMatchObject({
      id: "att-1",
      surface: "moves",
      parse_metadata: {
        document_key: "sha256:abc",
        parse_cost_usd: 0.01,
      },
    });
  });

  it("insertAgentAttachment throws when Supabase returns an error", async () => {
    const { client } = fakeSupabase({ agentInsertError: { message: "dup" } });
    const adapter = createSupabaseAttachmentsWriteAdapter(() => client);
    await expect(
      adapter.insertAgentAttachment({
        id: "a",
        tenant_id: "t",
        surface: "s",
        agent: "g",
        user_id: "u",
        file_name: "f",
        mime: "m",
        bytes: 1,
        storage_path: "p",
        extracted_text: null,
        linked_move_id: null,
        parse_metadata: null,
      }),
    ).rejects.toMatchObject({ message: "dup" });
  });

  it("softDeleteAgentAttachment scopes by tenant + deleted_at and returns the id", async () => {
    const { client, updateFilters } = fakeSupabase({});
    const adapter = createSupabaseAttachmentsWriteAdapter(() => client);
    const result = await adapter.softDeleteAgentAttachment("att-1", "tenant-1");
    expect(result).toEqual({ id: "att-1" });
    expect(updateFilters.id).toBe("att-1");
    expect(updateFilters.tenant_id).toBe("tenant-1");
    expect(updateFilters.deleted_at).toBeNull();
  });

  it("softDeleteAgentAttachment returns null when no row is affected", async () => {
    const { client } = fakeSupabase({
      updateResult: { data: null, error: null },
    });
    const adapter = createSupabaseAttachmentsWriteAdapter(() => client);
    expect(
      await adapter.softDeleteAgentAttachment("missing", "tenant-1"),
    ).toBeNull();
  });
});

// --- Azure adapter (opt-in) ------------------------------------------------

function fakeTxSession(
  handler: (sql: string, params: readonly unknown[]) => unknown[],
): {
  session: TxSessionRunner;
  statements: { sql: string; params: unknown[] }[];
} {
  const statements: { sql: string; params: unknown[] }[] = [];
  const session: TxSessionRunner = async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      statements.push({ sql, params });
      return handler(sql, params) as R[];
    });
  return { session, statements };
}

describe("azure attachments write adapter", () => {
  it("insertProgramAttachment issues an INSERT ... RETURNING", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.startsWith("INSERT") ? [{ id: "azure-att" }] : [],
    );
    const adapter = createAzureAttachmentsWriteAdapter(session);
    const row = await adapter.insertProgramAttachment(
      {
        tenant_key: "apex-retail",
        program_id: "prog-1",
        phase: null,
        step_id: null,
        deliverable_id: null,
        original_name: "f",
        storage_path: "s",
        uploader_user_id: "u",
        mime_type: "application/pdf",
        size_bytes: 1,
        sha256: "x",
      },
      "id",
    );
    expect(row).toEqual({ id: "azure-att" });
    expect(statements[0].sql).toContain("INSERT INTO program_attachments");
    expect(statements[0].sql).toContain("RETURNING id");
  });

  it("insertAgentAttachment includes parse_metadata in the INSERT row", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.startsWith("INSERT") ? [{ id: "att-1" }] : [],
    );
    const adapter = createAzureAttachmentsWriteAdapter(session);
    await adapter.insertAgentAttachment({
      id: "att-1",
      tenant_id: "tenant-1",
      surface: "moves",
      agent: "sentinel",
      user_id: "user-1",
      file_name: "doc.pdf",
      mime: "application/pdf",
      bytes: 10,
      storage_path: "tenant-1/user-1/att-1-doc.pdf",
      extracted_text: null,
      linked_move_id: null,
      parse_metadata: {
        document_key: "sha256:abc",
        parse_cost_usd: 0.01,
      },
    });
    expect(statements[0].sql).toContain("INSERT INTO agent_attachment");
    expect(statements[0].sql).toContain("parse_metadata");
    expect(statements[0].params).toContainEqual({
      document_key: "sha256:abc",
      parse_cost_usd: 0.01,
    });
  });

  it("softDeleteAgentAttachment issues a tenant-scoped UPDATE ... RETURNING id", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.startsWith("UPDATE") ? [{ id: "att-1" }] : [],
    );
    const adapter = createAzureAttachmentsWriteAdapter(session);
    const result = await adapter.softDeleteAgentAttachment("att-1", "tenant-1");
    expect(result).toEqual({ id: "att-1" });
    expect(statements[0].sql).toContain(
      "UPDATE agent_attachment SET deleted_at",
    );
    expect(statements[0].sql).toContain("tenant_id = $3");
    expect(statements[0].sql).toContain("deleted_at IS NULL");
    expect(statements[0].params).toEqual([
      expect.any(String),
      "att-1",
      "tenant-1",
    ]);
  });

  it("softDeleteAgentAttachment returns null when the UPDATE affects no row", async () => {
    const { session } = fakeTxSession(() => []);
    const adapter = createAzureAttachmentsWriteAdapter(session);
    expect(
      await adapter.softDeleteAgentAttachment("missing", "tenant-1"),
    ).toBeNull();
  });
});
