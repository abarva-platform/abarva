import type { TenancyCtx } from "../types.db";
import {
  p1ParticipantBindingsReady,
  type P1ParticipantBindingCommand,
} from "../p1-participant-binding";

const mockPolicy = jest.fn();
let mockDeclared = true;
let mockFlag = true;
let mockDisabledFlag = "";
let mockConnection: string | undefined = "memory-only";
type MemoryConnection = Pick<import("pg").PoolClient, "query" | "release">;
let mockConnect: () => Promise<MemoryConnection>;
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) => mockPolicy(...args),
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (_ctx: unknown, flag: string) =>
    mockFlag && flag !== mockDisabledFlag,
}));
jest.mock("@/lib/tenant/synthetic-tenant-declaration", () => ({
  isDeclaredSyntheticDemoTenant: () => mockDeclared,
}));
jest.mock(
  "@/lib/data-plane/write-adapters/p0ReviewedCaptureCorrectionAdapter",
  () => ({ resolveP0ReviewedCaptureConnection: () => mockConnection }),
);
jest.mock("@/lib/data-plane/postgresCompat", () => {
  const actual = jest.requireActual<
    typeof import("@/lib/data-plane/postgresCompat")
  >("@/lib/data-plane/postgresCompat");
  return {
    ...actual,
    withAzureWriteTransaction: (
      url: string,
      work: Parameters<typeof actual.withAzureWriteTransaction>[1],
      options: object,
    ) =>
      actual.withAzureWriteTransaction(url, work, {
        ...options,
        connect: () => mockConnect(),
      }),
  };
});
import {
  confirmP1ParticipantBinding,
  readP1ParticipantBinding,
} from "@/lib/data-plane/write-adapters/p1ParticipantBindingAdapter";

type Row = Record<string, unknown>;
const moveId = "11111111-1111-4111-8111-111111111111";
const actorId = "22222222-2222-4222-8222-222222222222";
const placeholderId = "33333333-3333-4333-8333-333333333333";
const otherId = "44444444-4444-4444-8444-444444444444";
const requestId = "55555555-5555-4555-8555-555555555555";
const ctx: TenancyCtx = {
  clientId: "client-1",
  clientKey: "meridian",
  userId: actorId,
  clerkUserId: "user-bound",
  syntheticE2eOperator: true,
};
let db: Record<string, Row[]>;
let statements: Array<{ sql: string; params: unknown[] }>;
let failure:
  | "audit"
  | "readback"
  | "commit"
  | "begin"
  | "rights"
  | "source"
  | null;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
beforeEach(() => {
  mockDeclared = true;
  mockFlag = true;
  mockDisabledFlag = "";
  mockConnection = "memory-only";
  failure = null;
  statements = [];
  db = {
    engagements: [
      {
        id: moveId,
        client_id: ctx.clientId,
        current_phase: 1,
        sponsor_person_id: placeholderId,
        maestro_person_id: placeholderId,
        charter: {
          scaffold: { sponsor_candidate: "Historical role" },
          capture: { business_trigger: "Retained" },
        },
        lifecycle_state: "submitted_for_approval",
      },
    ],
    engagement_participants: [
      {
        id: "participant-actor",
        engagement_id: moveId,
        user_id: actorId,
        role: "Automated operator",
        approval_authority: "approver",
        can_approve_phase_gates: true,
      },
      {
        id: "participant-role",
        engagement_id: moveId,
        user_id: placeholderId,
        role: "Sponsor",
        approval_authority: "contributor",
        can_approve_phase_gates: false,
      },
    ],
    persons: [
      {
        id: actorId,
        name: "Declared operator",
        graph_node_id: "clerk:user-bound",
        personal_threads: [],
        role: "viewer",
      },
      {
        id: placeholderId,
        name: "Proposed sponsor",
        graph_node_id: null,
        personal_threads: ["origination_placeholder"],
      },
    ],
    person_client_memberships: [
      { person_id: actorId, client_id: ctx.clientId, can_approve_gates: false },
    ],
    phase_snapshots: [
      {
        id: "snapshot",
        engagement_id: moveId,
        phase_number: 0,
        approval_status: "approved",
        snapshot_jsonb: { approved: true },
      },
    ],
    deliverables_v2: [
      {
        id: "signed-brief",
        engagement_id: moveId,
        deliverable_type_key: "origination_brief",
        status: "signed_off",
        current_version: 1,
        signed_off_version: 1,
        requires_revalidation: false,
      },
    ],
    deliverable_versions: [
      {
        id: "v1",
        deliverable_id: "signed-brief",
        version: 1,
        content: "Original signed text",
      },
    ],
    program_approval_requests: [
      { id: "request", program_id: moveId, request_status: "pending" },
    ],
    program_modules: Array.from({ length: 24 }, (_, index) => ({
      id: `module-${index}`,
      engagement_id: moveId,
      phase_number: index < 13 ? 0 : 1,
      status: "in_progress",
      completed: false,
      state_jsonb: { value: `Retained ${index}` },
    })),
    program_evidence_items: Array.from({ length: 8 }, (_, index) => ({
      id: `source-${index}`,
      program_id: moveId,
      tenant_key: ctx.clientKey,
      content: `Source ${index}`,
    })),
    program_evidence_reviews: [
      {
        id: "review",
        program_id: moveId,
        tenant_key: ctx.clientKey,
        decision: "approved",
      },
    ],
    move_artifacts: [
      {
        artifact_id: "artifact",
        tenant_id: ctx.clientId,
        move_id: moveId,
        blob_sha256: "original-hash",
      },
    ],
    program_audit_log: [],
  };
  mockPolicy.mockImplementation(async () => ({
    clientId: ctx.clientId,
    userId: ctx.userId,
    canApproveGates: true,
    programIdsAllowed: [moveId],
  }));
  let pending = Promise.resolve();
  mockConnect = async () => {
    const before = pending;
    let release!: () => void;
    pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await before;
    let snapshot: typeof db;
    return {
      release,
      query: async (sql: string, params: unknown[] = []) => {
        statements.push({ sql, params: clone(params) });
        if (sql.startsWith("BEGIN")) {
          if (failure === "begin") throw new Error("begin refused");
          snapshot = clone(db);
        }
        if (sql === "ROLLBACK") db = snapshot;
        if (sql === "COMMIT" && failure === "commit")
          throw new Error("commit unknown");
        if (sql.startsWith("UPDATE engagements")) {
          db.engagements[0].sponsor_person_id = params[0];
          db.engagements[0].maestro_person_id = params[1];
          db.engagements[0].updated_at = "trigger-generated-after";
          if (failure === "rights")
            db.engagement_participants[0].can_approve_phase_gates = false;
          if (failure === "source")
            db.program_modules[23].state_jsonb = { value: "Changed" };
          return {
            rows: failure === "readback" ? [] : clone(db.engagements),
            rowCount: 1,
            command: "UPDATE",
          };
        }
        if (sql.startsWith("INSERT INTO program_audit_log")) {
          if (failure === "audit")
            return { rows: [], rowCount: 0, command: "INSERT" };
          const [
            tenant_key,
            program_id,
            engagement_id,
            actor_id,
            actor_role,
            action,
            from_state,
            to_state,
            rationale,
            evidence_refs,
          ] = params;
          const row = {
            id: "audit-1",
            tenant_key,
            program_id,
            engagement_id,
            actor_id,
            actor_role,
            action,
            from_state,
            to_state,
            rationale,
            evidence_refs,
          };
          db.program_audit_log.unshift(row);
          return { rows: [clone(row)], rowCount: 1, command: "INSERT" };
        }
        if (sql.startsWith("SELECT")) {
          const table = sql.match(/FROM ([a-z_0-9]+)/)?.[1] ?? "";
          const rows = db[table];
          if (!rows) throw new Error(`unmodelled query ${sql}`);
          return {
            rows: clone(rows),
            rowCount: rows.length,
            command: "SELECT",
          };
        }
        return {
          rows: [],
          rowCount: 0,
          command: sql === "COMMIT" ? "COMMIT" : "SET",
        };
      },
    } as MemoryConnection;
  };
});
async function command(): Promise<P1ParticipantBindingCommand> {
  return {
    sponsorPersonId: actorId,
    leadPersonId: actorId,
    requestId,
    rationale: "Explicit delegated synthetic progress contact and lead",
    expectedRevision: (await readP1ParticipantBinding(ctx, moveId)).revision,
  };
}
const writes = () =>
  statements.filter(({ sql }) => /^(UPDATE|INSERT)/.test(sql));

it("refuses an actual later-phase preview even when the request uses its fresh revision", async () => {
  db.engagements[0].current_phase = 2;
  const preview = await readP1ParticipantBinding(ctx, moveId);
  expect(preview.status).toBe("unavailable");
  expect(preview.canConfirm).toBe(false);
  await expect(
    confirmP1ParticipantBinding(ctx, moveId, await command()),
  ).rejects.toMatchObject({ code: "participant_binding_permission_refused" });
  expect(writes()).toHaveLength(0);
});
it("requires current permission independently of the stale-revision fence", async () => {
  mockPolicy.mockResolvedValue({
    clientId: ctx.clientId,
    userId: ctx.userId,
    canApproveGates: false,
    programIdsAllowed: [moveId],
  });
  const preview = await readP1ParticipantBinding(ctx, moveId);
  expect(preview.canConfirm).toBe(false);
  await expect(
    confirmP1ParticipantBinding(ctx, moveId, await command()),
  ).rejects.toMatchObject({ code: "participant_binding_permission_refused" });
  expect(writes()).toHaveLength(0);
});

it("offers the exact declared automated participant, leaves the placeholder unconfirmed and performs a READ ONLY preview", async () => {
  const before = clone(db);
  const preview = await readP1ParticipantBinding(ctx, moveId);
  expect(preview.choices).toEqual([
    {
      personId: actorId,
      name: "Declared operator",
      role: "Automated operator",
      attribution: "delegated_automated",
    },
  ]);
  expect(preview.current).toEqual({
    sponsorPersonId: placeholderId,
    leadPersonId: placeholderId,
  });
  expect(p1ParticipantBindingsReady(preview)).toBe(false);
  expect(
    statements.some(({ sql }) => sql === "SET TRANSACTION READ ONLY"),
  ).toBe(true);
  expect(writes()).toEqual([]);
  expect(db).toEqual(before);
});
it("writes only two pointers and one required audit, preserving all 24 modules, eight sources, signed history and rights", async () => {
  const input = await command();
  const before = clone(db);
  const result = await confirmP1ParticipantBinding(ctx, moveId, input);
  expect(result.persisted).toBe(true);
  expect(result.preservedBindings).toBe(true);
  expect(p1ParticipantBindingsReady(result.p1ParticipantBinding)).toBe(true);
  expect(db).toEqual({
    ...before,
    engagements: [
      {
        ...before.engagements[0],
        sponsor_person_id: actorId,
        maestro_person_id: actorId,
        updated_at: "trigger-generated-after",
      },
    ],
    program_audit_log: db.program_audit_log,
  });
  expect(
    writes().map(({ sql }) => sql.split(" ").slice(0, 3).join(" ")),
  ).toEqual(["UPDATE engagements SET", "INSERT INTO program_audit_log"]);
  const audit = writes()[1];
  expect(audit.sql).toContain("VALUES ($1,$2,$3,$4");
  expect(audit.params[1]).toBe(moveId);
  expect(audit.params[2]).toBe(moveId);
  expect(db.program_audit_log).toHaveLength(1);
});
it("is idempotent only for the exact consumed request and refuses changed content or later protected state", async () => {
  const input = await command();
  await confirmP1ParticipantBinding(ctx, moveId, input);
  const result = await confirmP1ParticipantBinding(ctx, moveId, input);
  expect(result.auditId).toBe("audit-1");
  expect(writes()).toHaveLength(2);
  await expect(
    confirmP1ParticipantBinding(ctx, moveId, {
      ...input,
      rationale: "Changed",
    }),
  ).rejects.toMatchObject({ code: "participant_binding_request_conflict" });
  db.program_modules[0].status = "completed";
  await expect(
    confirmP1ParticipantBinding(ctx, moveId, input),
  ).rejects.toMatchObject({ code: "participant_binding_request_conflict" });
});
it("serializes two reviewed requests against one base so only one can appoint contacts", async () => {
  const input = await command();
  const results = await Promise.allSettled([
    confirmP1ParticipantBinding(ctx, moveId, input),
    confirmP1ParticipantBinding(ctx, moveId, { ...input, requestId: otherId }),
  ]);
  expect(results.map((result) => result.status)).toEqual([
    "fulfilled",
    "rejected",
  ]);
  expect(db.program_audit_log).toHaveLength(1);
});
it.each(["audit", "readback", "rights", "source"] as const)(
  "rolls back both pointers on %s failure",
  async (kind) => {
    const input = await command();
    const before = clone(db);
    failure = kind;
    await expect(
      confirmP1ParticipantBinding(ctx, moveId, input),
    ).rejects.toMatchObject({
      transactionOutcome: "rolled_back",
      code:
        kind === "audit"
          ? "participant_binding_audit_failed"
          : kind === "readback"
            ? "participant_binding_readback_failed"
            : "participant_binding_preservation_failed",
    });
    expect(db).toEqual(before);
  },
);
it.each(["commit", "begin"] as const)(
  "keeps the wrapper's truthful %s outcome",
  async (kind) => {
    const input = await command();
    failure = kind;
    await expect(
      confirmP1ParticipantBinding(ctx, moveId, input),
    ).rejects.toMatchObject({
      transactionOutcome: kind === "commit" ? "unknown" : "not_started",
    });
  },
);
it.each([
  [
    "later phase",
    () => {
      db.engagements[0].current_phase = 2;
    },
  ],
  [
    "other client",
    () => {
      db.engagements[0].client_id = "other";
    },
  ],
  [
    "archived",
    () => {
      db.engagements[0].archived_at = "now";
    },
  ],
  [
    "private declaration",
    () => {
      mockDeclared = false;
    },
  ],
  [
    "flag off",
    () => {
      mockFlag = false;
    },
  ],
  [
    "missing transport",
    () => {
      mockConnection = undefined;
    },
  ],
  [
    "permission drift",
    () => {
      mockPolicy.mockResolvedValue({
        clientId: ctx.clientId,
        userId: ctx.userId,
        canApproveGates: false,
        programIdsAllowed: [moveId],
      });
    },
  ],
  [
    "wrong actor",
    () => {
      mockPolicy.mockResolvedValue({
        clientId: ctx.clientId,
        userId: "other",
        canApproveGates: true,
        programIdsAllowed: [moveId],
      });
    },
  ],
  [
    "outside allowed scope",
    () => {
      mockPolicy.mockResolvedValue({
        clientId: ctx.clientId,
        userId: ctx.userId,
        canApproveGates: true,
        programIdsAllowed: [],
      });
    },
  ],
  [
    "snapshot changed",
    () => {
      db.phase_snapshots[0].approval_status = "pending";
    },
  ],
  [
    "signed version changed",
    () => {
      db.deliverables_v2[0].signed_off_version = 2;
    },
  ],
  [
    "source changed",
    () => {
      db.program_evidence_items[0].content = "Changed";
    },
  ],
] as Array<[string, () => void]>)(
  "refuses %s without any product or audit write",
  async (_label, change) => {
    const input = await command();
    change();
    const before = clone(db);
    await expect(
      confirmP1ParticipantBinding(ctx, moveId, input),
    ).rejects.toBeInstanceOf(Error);
    expect(writes()).toHaveLength(0);
    expect(db).toEqual(before);
  },
);
it.each([
  ["placeholder", () => {}, placeholderId],
  ["arbitrary ID", () => {}, otherId],
  [
    "missing identity",
    () => {
      db.persons[0].graph_node_id = null;
    },
    actorId,
  ],
  [
    "different actor identity",
    () => {
      db.persons[0].graph_node_id = "clerk:user-other";
    },
    actorId,
  ],
  [
    "duplicate participant",
    () => {
      db.engagement_participants.push(clone(db.engagement_participants[0]));
    },
    actorId,
  ],
  [
    "nonmember",
    () => {
      db.engagement_participants.shift();
    },
    actorId,
  ],
  [
    "identified role placeholder",
    () => {
      db.persons[0].personal_threads = ["origination_placeholder"];
    },
    actorId,
  ],
] as Array<[string, () => void, string]>)(
  "refuses selected %s even with a fresh revision",
  async (_label, change, id) => {
    change();
    const input = { ...(await command()), sponsorPersonId: id };
    await expect(
      confirmP1ParticipantBinding(ctx, moveId, input),
    ).rejects.toMatchObject({ code: "participant_binding_identity_refused" });
    expect(writes()).toHaveLength(0);
  },
);
it.each([
  { requestId: "bad" },
  { rationale: " " },
  { rationale: "x".repeat(2001) },
  { expectedRevision: "bad" },
])("rejects malformed reviewed input %j", async (change) => {
  await expect(
    confirmP1ParticipantBinding(ctx, moveId, {
      ...(await command()),
      ...change,
    }),
  ).rejects.toMatchObject({ status: 400 });
  expect(writes()).toHaveLength(0);
});
it("does not imply an independent human review for another declared participant", async () => {
  db.engagement_participants.push({
    id: "other",
    engagement_id: moveId,
    person_id: otherId,
    role: "Existing member",
  });
  db.persons.push({
    id: otherId,
    graph_node_id: "clerk:user-another",
    name: "Declared member",
    personal_threads: [],
  });
  const preview = await readP1ParticipantBinding(ctx, moveId);
  expect(
    preview.choices.find((person) => person.personId === otherId)?.attribution,
  ).toBe("declared_participant");
});
it.each([
  "moves_step_pages_v3",
  "moves_step_pages_p0p1_v1",
  "moves_extended_intake_fields_v1",
])("requires the individual %s flag", async (flag) => {
  const input = await command();
  mockDisabledFlag = flag;
  await expect(
    confirmP1ParticipantBinding(ctx, moveId, input),
  ).rejects.toMatchObject({ code: "participant_binding_not_available" });
  expect(writes()).toHaveLength(0);
});
it("binds delegated automation through the explicit Clerk identity when tenancy retains that actor ID", async () => {
  const clerkContext = { ...ctx, userId: "user-bound" };
  mockPolicy.mockResolvedValue({
    clientId: ctx.clientId,
    userId: "user-bound",
    canApproveGates: true,
    programIdsAllowed: [moveId],
  });
  expect(
    (await readP1ParticipantBinding(clerkContext, moveId)).choices[0]
      .attribution,
  ).toBe("delegated_automated");
});

it("requires both canonical eligible contacts and a stored audit for readiness", async () => {
  const before = await readP1ParticipantBinding(ctx, moveId);
  const bound = {
    ...before,
    current: { sponsorPersonId: actorId, leadPersonId: actorId },
    confirmed: true,
    auditId: "audit",
  };
  expect(p1ParticipantBindingsReady(bound)).toBe(true);
  expect(p1ParticipantBindingsReady({ ...bound, auditId: null })).toBe(false);
  expect(
    p1ParticipantBindingsReady({
      ...bound,
      current: { ...bound.current, leadPersonId: placeholderId },
    }),
  ).toBe(false);
  expect(p1ParticipantBindingsReady({ ...bound, status: "unavailable" })).toBe(
    false,
  );
});
