// Unit tests for the source/artifact + deliverable domain write adapters
// (Slice 3b — source / artifact write routes).
//
// Pins the contract that matters for the Azure parallel-run cutover:
//   - default selection stays Supabase (production write unchanged);
//   - the Azure adapter is selectable explicitly / by env;
//   - each Supabase write issues the exact pre-seam table + row body;
//   - each Azure write issues the mirrored SQL inside a transaction;
//   - the multi-statement writes (approval, deliverable promotion) keep both
//     statements on Azure so they are atomic;
//   - best-effort writes (linkAttachments) never throw.

import type { PostgresCompatClient as SupabaseClient } from "@/lib/supabase-server";
import type { TxSessionRunner } from "../../read-adapters/azureSession";
import {
  createSupabaseSourceWriteAdapter,
  createAzureSourceWriteAdapter,
  selectSourceWriteAdapter,
} from "../sourceWriteAdapter";
import {
  createSupabaseDeliverableWriteAdapter,
  createAzureDeliverableWriteAdapter,
  selectDeliverableWriteAdapter,
} from "../deliverableWriteAdapter";

// --- Supabase client mock ---------------------------------------------------

interface SupabaseCall {
  table: string;
  op: "insert" | "update" | "upsert";
  payload: unknown;
}

/**
 * A chainable Supabase client mock. Records every insert/update/upsert and
 * resolves terminal `.single()` / awaited builders with a scripted row.
 */
function fakeSupabase(row: Record<string, unknown> | null = { id: "row-1" }): {
  client: SupabaseClient;
  calls: SupabaseCall[];
} {
  const calls: SupabaseCall[] = [];
  function builder(table: string, op: SupabaseCall["op"], payload: unknown) {
    calls.push({ table, op, payload });
    const result = { data: row, error: null };
    const chain: Record<string, unknown> = {};
    const passthrough = () => chain;
    chain.eq = passthrough;
    chain.in = passthrough;
    chain.is = passthrough;
    chain.select = passthrough;
    chain.single = () => Promise.resolve(result);
    chain.maybeSingle = () => Promise.resolve(result);
    // Awaiting the builder directly (update with no .select()) resolves too.
    chain.then = (resolve: (v: unknown) => unknown) => resolve(result);
    return chain;
  }
  const client = {
    from(table: string) {
      return {
        insert: (payload: unknown) => builder(table, "insert", payload),
        update: (payload: unknown) => builder(table, "update", payload),
        upsert: (payload: unknown) => builder(table, "upsert", payload),
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

// --- Azure transaction-session mock ----------------------------------------

function fakeTxSession(
  handler: (sql: string, params: readonly unknown[]) => unknown[],
): { session: TxSessionRunner; statements: string[]; paramSets: unknown[][] } {
  const statements: string[] = [];
  const paramSets: unknown[][] = [];
  const session: TxSessionRunner = async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      statements.push(sql);
      paramSets.push(params);
      return handler(sql, params) as R[];
    });
  return { session, statements, paramSets };
}

// --- selection --------------------------------------------------------------

describe("selectSourceWriteAdapter / selectDeliverableWriteAdapter", () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it("returns the Supabase adapters by default", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourceWriteAdapter().name).toBe("supabase");
    expect(selectDeliverableWriteAdapter().name).toBe("supabase");
  });

  it("returns the Azure adapters when ABARVA_DATA_PLANE=azure-postgres", () => {
    process.env.ABARVA_DATA_PLANE = "azure-postgres";
    expect(selectSourceWriteAdapter().name).toBe("azure-postgres");
    expect(selectDeliverableWriteAdapter().name).toBe("azure-postgres");
  });

  it("honors an explicit plane argument over the env var", () => {
    process.env.ABARVA_DATA_PLANE = "azure-postgres";
    expect(selectSourceWriteAdapter("supabase").name).toBe("supabase");
  });

  it("canonicalizes a legacy tenant alias without changing selection", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourceWriteAdapter(undefined, "apexretail").name).toBe(
      "supabase",
    );
  });

  it("forces governed foundation tenants onto Azure when no plane is configured", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourceWriteAdapter(undefined, "airline-demo-new").name).toBe(
      "azure-postgres",
    );
  });

  it("fails closed when a governed foundation tenant is explicitly routed to Supabase", () => {
    expect(() =>
      selectSourceWriteAdapter("supabase", "airline-demo-new"),
    ).toThrow(/cannot use supabase/);
  });
});

// --- Supabase source write adapter -----------------------------------------

describe("supabase source write adapter", () => {
  it("insertParticipant inserts into source_event_participants", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.insertParticipant({
      clientKey: "apex-retail",
      sourceEventId: "evt-1",
      userId: "user-1",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].table).toBe("source_event_participants");
    expect(calls[0].op).toBe("insert");
    expect(calls[0].payload).toMatchObject({
      client_key: "apex-retail",
      source_event_id: "evt-1",
      source_event_row_id: "evt-1",
      user_id: "user-1",
      role: "source creator",
    });
  });

  it("applyApproval updates the event then inserts the approval record", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.applyApproval({
      eventId: "evt-1",
      clientKey: "apex-retail",
      fromState: "pending",
      toState: "active",
      approvalAction: "admin_review",
      approvedByUserId: "admin-1",
      notes: "looks good",
    });
    expect(result.ok).toBe(true);
    expect(calls.map((c) => c.table)).toEqual([
      "source_events",
      "source_event_approvals",
    ]);
    expect(calls[0].op).toBe("update");
    expect(calls[0].payload).toEqual({ lifecycle_state: "active" });
    expect(calls[1].payload).toMatchObject({
      event_id: "evt-1",
      action: "admin_review",
      from_state: "pending",
      to_state: "active",
      notes: "looks good",
    });
  });

  it("applyApproval fails closed when the approval record cannot be inserted", async () => {
    const calls: SupabaseCall[] = [];
    function builder(
      table: string,
      op: SupabaseCall["op"],
      payload: unknown,
      message: string | null,
    ) {
      calls.push({ table, op, payload });
      const result = {
        data: null,
        error: message ? { message } : null,
      };
      const chain: Record<string, unknown> = {};
      chain.eq = () => chain;
      chain.then = (resolve: (v: unknown) => unknown) => resolve(result);
      return chain;
    }
    const client = {
      from(table: string) {
        return {
          update: (payload: unknown) => builder(table, "update", payload, null),
          insert: (payload: unknown) =>
            builder(
              table,
              "insert",
              payload,
              table === "source_event_approvals"
                ? "permission denied for source_event_approvals"
                : null,
            ),
        };
      },
    } as unknown as SupabaseClient;

    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.applyApproval({
      eventId: "evt-1",
      clientKey: "apex-retail",
      fromState: "pending",
      toState: "active",
      approvalAction: "admin_review",
      approvedByUserId: "admin-1",
      notes: "looks good",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/approval record insert failed/);
    expect(calls.map((c) => c.table)).toEqual([
      "source_events",
      "source_event_approvals",
    ]);
  });

  it("insertCriterionApproval inserts a source_event_approvals row and returns its id", async () => {
    const { client, calls } = fakeSupabase({ id: "approval-1" });
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.insertCriterionApproval({
      eventId: "evt-1",
      fromState: "pending",
      toState: "waived",
      approvalAction: "stage_advance",
      approvedByUserId: "admin-1",
      notes: "ownerRole=sponsor | requirementId=GATE-1 | reason=ok",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "approval-1" });
    expect(calls[0].table).toBe("source_event_approvals");
    expect(calls[0].payload).toMatchObject({
      event_id: "evt-1",
      action: "stage_advance",
      approved_by_user_id: "admin-1",
      from_state: "pending",
      to_state: "waived",
    });
  });

  it("updateStage updates source_events with the new stage + lifecycle", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.updateStage({
      eventId: "evt-1",
      clientKey: "apex-retail",
      stageKey: "value",
      lifecycleState: "completed",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].table).toBe("source_events");
    expect(calls[0].payload).toEqual({
      current_stage_key: "value",
      lifecycle_state: "completed",
      updated_at: "2026-05-15T00:00:00.000Z",
    });
  });

  it("transitionLifecycle updates only source_events lifecycle metadata", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.transitionLifecycle({
      eventId: "evt-1",
      clientKey: "apex-retail",
      lifecycleState: "waiting_on_co_approver",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].table).toBe("source_events");
    expect(calls[0].payload).toEqual({
      lifecycle_state: "waiting_on_co_approver",
      updated_at: "2026-05-15T00:00:00.000Z",
    });
  });

  it("updateGateCriterion returns the updated row", async () => {
    const { client, calls } = fakeSupabase({ id: "crit-1", state: "met" });
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.updateGateCriterion({
      criterionRowId: "crit-1",
      state: "met",
      reviewerUserId: "rev-1",
      reviewedAtIso: "2026-05-15T00:00:00.000Z",
      notes: "reviewed artifacts",
      evidenceArtifactIds: ["art-1"],
      waiverApprovalId: "approval-1",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "crit-1", state: "met" });
    expect(calls[0].table).toBe("source_event_gate_criterion_states");
    expect(calls[0].payload).toMatchObject({
      notes: "reviewed artifacts",
      evidence_artifact_ids: ["art-1"],
      waiver_approval_id: "approval-1",
    });
  });

  it("updateGateCriterion leaves notes and evidence ids untouched when omitted", async () => {
    const { client, calls } = fakeSupabase({ id: "crit-1", state: "met" });
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.updateGateCriterion({
      criterionRowId: "crit-1",
      state: "met",
      reviewerUserId: "rev-1",
      reviewedAtIso: "2026-05-15T00:00:00.000Z",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].payload).not.toHaveProperty("notes");
    expect(calls[0].payload).not.toHaveProperty("evidence_artifact_ids");
  });

  it("updateArtifactBody persists the column body and returns the row", async () => {
    const { client, calls } = fakeSupabase({ id: "art-1", body: "hello" });
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.updateArtifactBody({
      artifactRowId: "art-1",
      columns: { body: "hello", body_format: "markdown" },
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "art-1", body: "hello" });
    expect(calls[0].table).toBe("source_event_artifact_states");
    expect(calls[0].payload).toEqual({
      body: "hello",
      body_format: "markdown",
    });
  });

  it("updateArtifactStatus flips the status and returns the row", async () => {
    const { client, calls } = fakeSupabase({ id: "art-1", status: "approved" });
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.updateArtifactStatus({
      artifactRowId: "art-1",
      status: "approved",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].payload).toEqual({
      status: "approved",
      updated_at: "2026-05-15T00:00:00.000Z",
    });
  });

  it("linkAttachments is a no-op for an empty attachment list", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.linkAttachments({
      attachmentIds: [],
      tenantId: "tenant-1",
      eventId: "evt-1",
    });
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("linkAttachments updates agent_attachment for a non-empty list", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.linkAttachments({
      attachmentIds: ["att-1", "att-2"],
      tenantId: "tenant-1",
      eventId: "evt-1",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].table).toBe("agent_attachment");
    expect(calls[0].payload).toEqual({ linked_event_id: "evt-1" });
  });

  it("insertActivityLog appends a Source activity row", async () => {
    const { client, calls } = fakeSupabase(null);
    const adapter = createSupabaseSourceWriteAdapter(() => client);
    const result = await adapter.insertActivityLog({
      eventId: "evt-1",
      clientKey: "apex-retail",
      actorUserId: "user-1",
      actorDisplayName: "Carlos Rivera",
      actorRole: "client_viewer",
      actionType: "stage_promoted",
      actionLabel: "Promoted Source event from strategy to scope",
      stageKey: "scope",
      reason: "Strategy gates reviewed.",
      metadata: { fromStage: "strategy" },
      occurredAtIso: "2026-06-02T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(calls[0].table).toBe("source_event_activity");
    expect(calls[0].payload).toMatchObject({
      event_id: "evt-1",
      client_key: "apex-retail",
      actor_display_name: "Carlos Rivera",
      action_type: "stage_promoted",
      reason: "Strategy gates reviewed.",
    });
  });
});

// --- Azure source write adapter --------------------------------------------

describe("azure source write adapter", () => {
  it("exposes the data-plane name as azure-postgres", () => {
    expect(createAzureSourceWriteAdapter().name).toBe("azure-postgres");
  });

  it("insertParticipant casts the shared event id for text and uuid columns", async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.insertParticipant({
      clientKey: "skyharbor",
      sourceEventId: "75016006-1177-485f-99e3-bb7fec9efc11",
      userId: "user_123",
    });

    expect(result.ok).toBe(true);
    expect(statements[0]).toContain("INSERT INTO source_event_participants");
    expect(statements[0]).toContain("$2::text,$2::uuid");
  });

  it("applyApproval issues the event UPDATE and the approval INSERT in one tx", async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.applyApproval({
      eventId: "evt-1",
      clientKey: "apex-retail",
      fromState: "pending",
      toState: "active",
      approvalAction: "admin_review",
      approvedByUserId: "admin-1",
      notes: null,
    });
    expect(result.ok).toBe(true);
    expect(statements[0]).toContain("UPDATE source_events");
    expect(statements[1]).toContain("INSERT INTO source_event_approvals");
  });

  it("insertCriterionApproval returns the Azure approval id", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.includes("RETURNING id") ? [{ id: "approval-1" }] : [],
    );
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.insertCriterionApproval({
      eventId: "evt-1",
      fromState: "pending",
      toState: "met",
      approvalAction: "stage_advance",
      approvedByUserId: "admin-1",
      notes: "ownerRole=sponsor | requirementId=GATE-1 | reason=ok",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "approval-1" });
    expect(statements[0]).toContain("INSERT INTO source_event_approvals");
    expect(statements[0]).toContain("RETURNING id");
  });

  it("transitionLifecycle updates lifecycle state inside the Azure session", async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.transitionLifecycle({
      eventId: "evt-1",
      clientKey: "apex-retail",
      lifecycleState: "draft_revision",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(statements[0]).toContain("UPDATE source_events");
    expect(statements[0]).toContain("SET lifecycle_state = $1");
  });

  it("updateGateCriterion issues an UPDATE ... RETURNING * and returns the row", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.includes("RETURNING") ? [{ id: "crit-1", state: "met" }] : [],
    );
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.updateGateCriterion({
      criterionRowId: "crit-1",
      state: "met",
      reviewerUserId: "rev-1",
      reviewedAtIso: null,
      notes: "reviewed artifacts",
      evidenceArtifactIds: ["art-1", "art-2"],
      waiverApprovalId: "approval-1",
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "crit-1", state: "met" });
    expect(statements[0]).toContain("source_event_gate_criterion_states");
    expect(statements[0]).toContain("RETURNING *");
    expect(statements[0]).toContain("notes = $");
    expect(statements[0]).toContain("evidence_artifact_ids = $");
    expect(statements[0]).toContain("waiver_approval_id = $");
  });

  it("updateGateCriterion omits optional provenance columns on Azure when not provided", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.includes("RETURNING") ? [{ id: "crit-1", state: "met" }] : [],
    );
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.updateGateCriterion({
      criterionRowId: "crit-1",
      state: "met",
      reviewerUserId: "rev-1",
      reviewedAtIso: null,
      updatedAtIso: "2026-05-15T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(statements[0]).not.toContain("notes =");
    expect(statements[0]).not.toContain("evidence_artifact_ids =");
    expect(statements[0]).not.toContain("waiver_approval_id =");
  });

  it("insertActivityLog inserts a source_event_activity row", async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.insertActivityLog({
      eventId: "evt-1",
      clientKey: "apex-retail",
      actorUserId: "user-1",
      actorDisplayName: "Carlos Rivera",
      actorRole: "client_viewer",
      actionType: "artifact_generated",
      actionLabel: "Generated AI draft for d01_strategy_memo",
      artifactCode: "d01_strategy_memo",
      metadata: { model: "claude" },
      occurredAtIso: "2026-06-02T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(statements[0]).toContain("INSERT INTO source_event_activity");
  });

  it("updateArtifactBody builds a dynamic assignment list from the columns", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.includes("RETURNING") ? [{ id: "art-1" }] : [],
    );
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.updateArtifactBody({
      artifactRowId: "art-1",
      columns: { body: "x", body_format: "markdown" },
    });
    expect(result.ok).toBe(true);
    expect(statements[0]).toContain("body = $1");
    expect(statements[0]).toContain("body_format = $2");
    expect(statements[0]).toContain("WHERE id = $3");
  });

  it("updateArtifactBody serializes JSONB body-generation metadata", async () => {
    const { session, statements, paramSets } = fakeTxSession((sql) =>
      sql.includes("RETURNING") ? [{ id: "art-1" }] : [],
    );
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.updateArtifactBody({
      artifactRowId: "art-1",
      columns: {
        status: "approved",
        body_generation_metadata: {
          clientFinal: { artifactId: "final-1" },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(statements[0]).toContain("status = $1");
    expect(statements[0]).toContain("body_generation_metadata = $2::jsonb");
    expect(paramSets[0][1]).toBe('{"clientFinal":{"artifactId":"final-1"}}');
  });

  it("insertParticipant treats a unique-violation as a benign no-op", async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.startsWith("INSERT")) {
        throw Object.assign(new Error("duplicate key value"), {
          code: "23505",
        });
      }
      return [];
    });
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.insertParticipant({
      clientKey: "apex-retail",
      sourceEventId: "evt-1",
      userId: "user-1",
    });
    expect(result.ok).toBe(true);
  });

  it("linkAttachments surfaces a backend fault without throwing", async () => {
    const { session } = fakeTxSession(() => {
      throw new Error("connection reset");
    });
    const adapter = createAzureSourceWriteAdapter(session);
    const result = await adapter.linkAttachments({
      attachmentIds: ["att-1"],
      tenantId: "tenant-1",
      eventId: "evt-1",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("connection reset");
  });
});

// --- deliverable write adapter ---------------------------------------------

describe("supabase deliverable write adapter", () => {
  it("promoteToDeliverable upserts the type, inserts the deliverable + version", async () => {
    const { client, calls } = fakeSupabase({ id: "deliv-1" });
    const adapter = createSupabaseDeliverableWriteAdapter(() => client);
    const result = await adapter.promoteToDeliverable({
      typeKey: "artifact_brief",
      artifactKind: "brief",
      engagementId: "prog-1",
      title: "Q4 Brief",
      htmlContent: "<p>hi</p>",
      artifactId: "art-1",
      attachmentMetadata: { source: "thread" },
      createdByUserId: "user-1",
    });
    expect(result.ok).toBe(true);
    expect(result.deliverableId).toBe("deliv-1");
    expect(calls.map((c) => `${c.table}:${c.op}`)).toEqual([
      "deliverable_types:upsert",
      "deliverables_v2:insert",
      "deliverable_versions:insert",
    ]);
    expect(calls[1].payload).toMatchObject({
      engagement_id: "prog-1",
      deliverable_type_key: "artifact_brief",
      title: "Q4 Brief",
      created_by: "user-1",
    });
    expect(calls[2].payload).toMatchObject({
      deliverable_id: "deliv-1",
      version: 1,
      content: "<p>hi</p>",
    });
  });
});

describe("azure deliverable write adapter", () => {
  it("runs the type upsert, deliverable insert and version insert in one tx", async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.includes("RETURNING id") ? [{ id: "deliv-1" }] : [],
    );
    const adapter = createAzureDeliverableWriteAdapter(session);
    const result = await adapter.promoteToDeliverable({
      typeKey: "artifact_brief",
      artifactKind: "brief",
      engagementId: "prog-1",
      title: "Q4 Brief",
      htmlContent: "<p>hi</p>",
      artifactId: "art-1",
      attachmentMetadata: {},
      createdByUserId: "user-1",
    });
    expect(result.ok).toBe(true);
    expect(result.deliverableId).toBe("deliv-1");
    expect(statements[0]).toContain("INSERT INTO deliverable_types");
    expect(statements[1]).toContain("INSERT INTO deliverables_v2");
    expect(statements[2]).toContain("INSERT INTO deliverable_versions");
  });

  it("surfaces a backend fault as a non-ok outcome (no throw)", async () => {
    const { session } = fakeTxSession(() => {
      throw new Error("connection reset");
    });
    const adapter = createAzureDeliverableWriteAdapter(session);
    const result = await adapter.promoteToDeliverable({
      typeKey: "artifact_brief",
      artifactKind: "brief",
      engagementId: "prog-1",
      title: "Q4 Brief",
      htmlContent: "<p>hi</p>",
      artifactId: "art-1",
      attachmentMetadata: {},
      createdByUserId: "user-1",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("connection reset");
  });
});
