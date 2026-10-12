jest.mock("server-only", () => ({}));
const mockAuth = jest.fn();
const mockFlag = jest.fn();
const mockPolicy = jest.fn();
const mockProgram = jest.fn();
const mockModules = jest.fn();
const mockSnapshots = jest.fn();
const mockEvidence = jest.fn();
const mockCase = jest.fn();
const mockGate = jest.fn();
const mockReadClient = jest.fn();
const mockTransaction = jest.fn();
const mockTables: Record<string, Array<Record<string, unknown>>> = {};
let mockTableError: string | null = null;
let mockHideIndependentRows = false;
const mockFences: Array<[string, string, unknown]> = [];

function mockClient(independent = false) {
  return {
    from: (table: string) => {
      const filters: Array<[string, unknown]> = [];
      let inserted: Array<Record<string, unknown>> | null = null;
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          mockFences.push([table, key, value]);
          return query;
        },
        insert: (rows: Array<Record<string, unknown>>) => {
          inserted = rows;
          return query;
        },
        then: (
          resolve: (result: { data: unknown; error: unknown }) => unknown,
        ) => {
          if (mockTableError === table)
            return Promise.resolve(
              resolve({ data: null, error: { message: "read failed" } }),
            );
          if (inserted) mockTables[table].push(...inserted);
          const data =
            independent && mockHideIndependentRows && table === "outcome_ledger"
              ? []
              : (mockTables[table] ?? []).filter((row) =>
                  filters.every(([key, value]) => row[key] === value),
                );
          return Promise.resolve(resolve({ data, error: null }));
        },
      };
      return query;
    },
  };
}

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockAuth(),
  tenancyErrorResponse: (error: { code?: string }) => {
    if (error?.code === "not_signed_in")
      return Response.json(
        { ok: false, error: "not_signed_in" },
        { status: 401 },
      );
    throw new Error("not tenancy");
  },
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (...args: unknown[]) => mockFlag(...args),
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: () => mockPolicy(),
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockProgram(...args),
  getModuleState: () => mockModules(),
  getPhaseSnapshots: () => mockSnapshots(),
}));
jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  loadApprovedMoveEvidenceSnapshot: () => mockEvidence(),
}));
jest.mock("@/app/api/v1/programs/[programId]/value-case/route", () => ({
  GET: (...args: unknown[]) => mockCase(...args),
}));
jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: (...args: unknown[]) => mockGate(...args),
}));
jest.mock("@/lib/data-plane/tenantConnectionResolver", () => ({
  resolveTenantDatabaseConnection: () => ({
    candidates: ["postgres://synthetic.invalid/test"],
  }),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => mockClient(),
  getAzureReadFluentClient: () => {
    mockReadClient();
    return mockClient(true);
  },
  resolveDatabaseUrlCandidates: () => ["postgres://synthetic.invalid/test"],
  withAzureWriteTransaction: (...args: unknown[]) => mockTransaction(...args),
  writeTransactionOutcome: (error: { transactionOutcome?: string }) =>
    error.transactionOutcome ?? "not_entered",
}));

import { NextRequest } from "next/server";
import {
  GET,
  POST,
} from "@/app/api/v1/programs/[programId]/tower-handoff/route";
import { evaluateValueCase } from "../value-engine";
import type { Lever, ValueCase } from "../value-engine/types";
import { loadP5HandoffBasis, readP5Handoff } from "../p5-tower-handoff";
import {
  P5_MEASUREMENT_PLAN_KEY,
  readP5MeasurementPlan,
  type P5MeasurementPlan,
} from "../p5-measurement-plan";
import {
  captureValueText,
  captureValueGateText,
} from "../structured-capture-text";
import {
  p5Hash,
  p5LedgerId,
} from "@/lib/data-plane/write-adapters/p5OutcomeHandoffAdapter";
import { evaluateGovernedObject } from "@/lib/governance/context-corpus-policy";

const moveId = "11111111-1111-4111-a111-111111111111";
const clientId = "22222222-2222-4222-a222-222222222222";
const contractId = "33333333-3333-4333-a333-333333333333";
const ctx = { clientId, clientKey: "meridian", userId: "delegated-operator" };
const lit = (value: number) => ({
  kind: "literal" as const,
  value,
  source: "synthetic reviewed assumption",
});
const cost: Lever = {
  id: "L1",
  name: "Synthetic avoided purchases",
  conversion: "cost_reduction",
  driver: {
    name: "Purchases no longer bought",
    unit: "share",
    direction: "increase",
    baseline: lit(0),
    target: lit(0.1),
  },
  terms: [
    { role: "base", label: "Synthetic annual spend", ref: lit(100000) },
    { role: "driver_delta" },
  ],
  attribution: lit(0.5),
  probability: lit(0.8),
  timing: { startMonth: 1, rampMonths: 1, paymentLagMonths: 1 },
};
const nonCash: Lever = {
  ...cost,
  id: "L2",
  name: "Synthetic capacity",
  conversion: "non_cash",
  metricUnit: "hours",
  driver: { ...cost.driver, unit: "hours", target: lit(100) },
  terms: [
    { role: "driver_delta" },
    { role: "unit_value", label: "Planning rate", ref: lit(100) },
  ],
};
const valueCase: ValueCase = {
  levers: [cost, nonCash],
  horizonYears: 3,
  discountRate: lit(0.1),
  cost: { kind: "estimate", baseCents: 100000 },
};
let plan: P5MeasurementPlan;
let modules: Array<{
  moduleKey: string;
  status: string;
  state: { value: string };
}>;
const params = { params: Promise.resolve({ programId: moveId }) };
const get = () =>
  GET(
    new NextRequest(
      `http://test.invalid/api/v1/programs/${moveId}/tower-handoff`,
    ),
    params,
  );
const post = (binding: unknown) =>
  POST(
    new NextRequest(
      `http://test.invalid/api/v1/programs/${moveId}/tower-handoff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept_planned_handoff", binding }),
      },
    ),
    params,
  );
async function binding() {
  return (await loadP5HandoffBasis(ctx, moveId)).view.binding!;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFences.length = 0;
  mockTableError = null;
  mockHideIndependentRows = false;
  plan = {
    kind: "p5_measurement_handoff",
    version: 1,
    measures: ["L1", "L2"].map((leverId) => ({
      leverId,
      ownerUserId: "receiving-participant",
      ownerRole: "Measurement owner",
      sourceReference: "[A:V1] source cohort export",
      comparator: "Same-cohort pre-change comparator",
      method: "Finance reconciliation of unique claims",
      cadence: "monthly",
      firstReviewTrigger: "First mature cohort",
      exclusionRules:
        "Credit each collection once; capacity is zero cash without release",
      openConditions: "Synthetic plan; access and lineage checks remain open",
    })),
  };
  modules = [
    {
      moduleKey: "phase_4_value_plan",
      status: "completed",
      state: {
        value: JSON.stringify({
          kind: "value_model",
          version: 1,
          case: valueCase,
          deliveryModel: "internal",
        }),
      },
    },
    {
      moduleKey: `phase_5_${P5_MEASUREMENT_PLAN_KEY}`,
      status: "completed",
      state: { value: JSON.stringify(plan) },
    },
  ];
  mockAuth.mockResolvedValue(ctx);
  mockFlag.mockReturnValue(true);
  mockPolicy.mockResolvedValue({
    canApproveGates: true,
    canPublishDeliverables: true,
    canViewFinancialData: true,
    programIdsAllowed: [moveId],
  });
  mockProgram.mockImplementation((scope, id) =>
    Promise.resolve(
      scope.clientId === clientId && id === moveId
        ? { id: moveId, clientId, currentPhase: 5 }
        : null,
    ),
  );
  mockModules.mockImplementation(() => Promise.resolve(modules));
  mockSnapshots.mockResolvedValue([
    {
      id: "p4-approval",
      phaseNumber: 4,
      approvalStatus: "approved",
      lockedAt: "2026-10-01T00:00:00Z",
      createdAt: "2026-10-01T00:00:00Z",
      snapshot: { phaseEvidenceSnapshotHash: "p4-current" },
    },
  ]);
  mockEvidence.mockResolvedValue({
    revision: "current",
    latestEvidenceActivityAt: null,
    revisionByPhase: { 4: "p4-current", 5: "p5-current" },
    latestEvidenceActivityAtByPhase: { 4: null, 5: null },
  });
  mockCase.mockImplementation(async () =>
    Response.json({
      ok: true,
      programId: moveId,
      figuresRedacted: false,
      case: evaluateValueCase(valueCase),
      costBasis: { status: "approved_rom", snapshotId: "approved-p3" },
      registerInputs: [],
    }),
  );
  mockGate.mockResolvedValue({ pass: true, failedChecks: [] });
  mockTables.engagement_participants = [
    {
      engagement_id: moveId,
      user_id: "receiving-participant",
      role: "Measurement owner",
      program_access_level: "program_member",
    },
  ];
  mockTables.deliverables_v2 = [
    {
      id: contractId,
      engagement_id: moveId,
      deliverable_type_key: "value_measurement_contract",
      status: "signed_off",
      current_version: 2,
      signed_off_version: 2,
      structured_data: { phaseEvidenceSnapshotHash: "p5-current" },
    },
  ];
  mockTables.deliverable_versions = [
    {
      deliverable_id: contractId,
      version: 2,
      content: "Synthetic signed measurement contract",
      structured_data: { source: "generated_by_orchestrator" },
    },
  ];
  mockTables.outcome_ledger = [];
  mockTransaction.mockImplementation(async (_url, work) => {
    const prior = [...mockTables.outcome_ledger];
    try {
      return await work(async (_sql: string, values: unknown[]) => ({
        rows:
          values[0] === moveId && values[1] === clientId
            ? [{ id: moveId, current_phase: 5 }]
            : [],
      }));
    } catch (error) {
      mockTables.outcome_ledger = prior;
      Object.assign(error as object, { transactionOutcome: "rolled_back" });
      throw error;
    }
  });
});

test("previews the current signed version, current P4 basis and explicit unknown measurements", async () => {
  const response = await get();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.binding).toMatchObject({
    tenantKey: "meridian-health",
    clientId,
    moveId,
    contractId,
    contractVersion: 2,
    contractHash: p5Hash("Synthetic signed measurement contract"),
  });
  expect(body.levers).toEqual([
    { leverId: "L1", name: cost.name, inCash: true, projectedUsd: 4000 },
    { leverId: "L2", name: nonCash.name, inCash: false, projectedUsd: 0 },
  ]);
  expect(body.publication).toEqual({ state: "not_yet_linked", rowIds: [] });
  expect(mockTables.outcome_ledger).toHaveLength(0);
});

test("publishes projected-only governed rows with valid identity, actor, timestamps and independent readback", async () => {
  const expected = await binding();
  const response = await post(expected);
  expect(response.status).toBe(200);
  expect((await response.json()).publication.state).toBe("published");
  expect(mockReadClient).toHaveBeenCalled();
  expect(mockTables.outcome_ledger).toHaveLength(2);
  expect(mockTransaction).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(Function),
    { includeReads: true },
  );
  const row = mockTables.outcome_ledger[0];
  expect(row).toMatchObject({
    tenant_client_key: "meridian-health",
    client_id: clientId,
    subject_ref: moveId,
    projected_amount: 4000,
    realized_amount: null,
    baseline_amount: null,
    value_rung: "projected_only",
    recorded_by: ctx.userId,
  });
  expect(row.id).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/,
  );
  expect(Number.isFinite(Date.parse(String(row.recorded_at)))).toBe(true);
  const metadata = row.metadata as { governedObject: unknown };
  const policy = evaluateGovernedObject(metadata.governedObject);
  expect(policy.decision).not.toBe("block");
  expect(policy.agentReady).toBe(false);
  expect(mockFences).toContainEqual(["outcome_ledger", "client_id", clientId]);
  expect(mockFences).toContainEqual(["outcome_ledger", "subject_ref", moveId]);
});

test("a repeated identical product acceptance is idempotent and retains original actor/time", async () => {
  const expected = await binding();
  expect((await post(expected)).status).toBe(200);
  const before = JSON.stringify(mockTables.outcome_ledger);
  mockAuth.mockResolvedValue({ ...ctx, userId: "second-authorized-operator" });
  const response = await post(expected);
  expect(response.status).toBe(200);
  expect((await response.json()).alreadyPublished).toBe(true);
  expect(JSON.stringify(mockTables.outcome_ledger)).toBe(before);
});

test.each(["read", "accept"])(
  "signed-out %s refuses before any physical write",
  async (action) => {
    const expected = await binding();
    mockAuth.mockRejectedValue(
      Object.assign(new Error("Sign in required"), { code: "not_signed_in" }),
    );
    const response = action === "read" ? await get() : await post(expected);
    expect(response.status).toBe(401);
    expect(mockTables.outcome_ledger).toHaveLength(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  },
);

test("rechecks the actor inside the transaction and rolls back a changed identity", async () => {
  const expected = await binding();
  mockAuth
    .mockResolvedValueOnce(ctx)
    .mockResolvedValueOnce({ ...ctx, userId: "changed-operator" });
  const response = await post(expected);
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({
    error: "handoff_actor_changed",
    transactionOutcome: "rolled_back",
  });
  expect(mockTables.outcome_ledger).toHaveLength(0);
});

test("a physical phase change at the lock refuses acceptance and leaves no rows", async () => {
  const expected = await binding();
  mockTransaction.mockImplementation(async (_url, work) => {
    try {
      return await work(async () => ({
        rows: [{ id: moveId, current_phase: 6 }],
      }));
    } catch (error) {
      Object.assign(error as object, { transactionOutcome: "rolled_back" });
      throw error;
    }
  });
  const response = await post(expected);
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({
    error: "handoff_phase_required",
    transactionOutcome: "rolled_back",
  });
  expect(mockTables.outcome_ledger).toHaveLength(0);
});

test.each(["money", "action", "hash"])(
  "refuses injected %s request data before opening a transaction",
  async (field) => {
    const expected = await binding();
    const body: Record<string, unknown> = {
      action: "accept_planned_handoff",
      binding: expected,
    };
    if (field === "money") body.projectedUsd = 99999999;
    if (field === "action") body.action = "claim_realized_value";
    if (field === "hash") expected.contractHash = "not-a-content-hash";
    const response = await POST(
      new NextRequest(
        `http://test.invalid/api/v1/programs/${moveId}/tower-handoff`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
      params,
    );
    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockTables.outcome_ledger).toHaveLength(0);
  },
);

test.each([
  "null_amount",
  "changed_amount",
  "realized_amount",
  "baseline_amount",
  "subject_label",
  "contract_reference",
  "owner",
  "governance",
  "binding",
  "partial_rows",
])(
  "withholds publication after physical %s readback differs",
  async (changed) => {
    expect((await post(await binding())).status).toBe(200);
    const row = mockTables.outcome_ledger[0];
    if (changed === "null_amount") row.projected_amount = null;
    if (changed === "changed_amount") row.projected_amount = 4001;
    if (changed === "realized_amount") row.realized_amount = 1;
    if (changed === "baseline_amount") row.baseline_amount = 0;
    if (changed === "subject_label") row.subject_label = "Wrong lever";
    if (changed === "contract_reference")
      row.evidence_claim_ids = ["different-document"];
    if (changed === "owner")
      (row.metadata as Record<string, unknown>).ownerUserId = "different-owner";
    if (changed === "governance")
      (row.metadata as Record<string, unknown>).governedObject = null;
    if (changed === "binding")
      (row.metadata as Record<string, unknown>).binding = {
        ...(await binding()),
        contractHash: "f".repeat(64),
      };
    if (changed === "partial_rows") mockTables.outcome_ledger.pop();
    const response = await get();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "publication_basis_changed",
    });
  },
);

test.each(["content", "version", "plan", "value", "evidence"])(
  "refuses stale %s between preview and acceptance without writing",
  async (changed) => {
    const expected = await binding();
    if (changed === "content")
      mockTables.deliverable_versions[0].content = "Changed contract";
    if (changed === "version")
      mockTables.deliverables_v2[0].current_version = 3;
    if (changed === "plan") {
      plan.measures[0].comparator = "Changed cohort";
      modules[1].state.value = JSON.stringify(plan);
    }
    if (changed === "value")
      modules[0].state.value = modules[0].state.value.replace(
        "Purchases no longer bought",
        "Changed driver",
      );
    if (changed === "evidence")
      mockEvidence.mockResolvedValue({
        revision: "changed",
        revisionByPhase: { 4: "stale" },
        latestEvidenceActivityAt: null,
      });
    const response = await post(expected);
    expect(response.status).toBe(409);
    expect(mockTables.outcome_ledger).toHaveLength(0);
  },
);

test("refuses a changed signed contract after publication and withholds stale readback", async () => {
  expect((await post(await binding())).status).toBe(200);
  mockTables.deliverable_versions[0].content = "Changed signed contract";
  const response = await get();
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({
    error: "publication_basis_changed",
  });
  expect(mockTables.outcome_ledger).toHaveLength(2);
});

test.each([
  "engagement_participants",
  "deliverables_v2",
  "deliverable_versions",
  "outcome_ledger",
])("failed %s read is unknown, never an empty success", async (table) => {
  mockTableError = table;
  const response = await get();
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.publication).toBeUndefined();
  expect(mockTables.outcome_ledger).toHaveLength(0);
});

test.each(["unsigned", "old_version", "absent_plan"])(
  "%s offers preparation only and cannot publish",
  async (mode) => {
    const expected = await binding();
    if (mode === "unsigned") mockTables.deliverables_v2[0].status = "draft";
    if (mode === "old_version")
      mockTables.deliverables_v2[0].signed_off_version = 1;
    if (mode === "absent_plan") modules[1].state.value = "";
    expect((await (await get()).json()).binding).toBeNull();
    expect((await post(expected)).status).toBe(409);
    expect(mockTables.outcome_ledger).toHaveLength(0);
  },
);

test.each([
  "wrong_tenant",
  "wrong_move",
  "no_gate",
  "no_publication",
  "no_financial",
  "outside_grant",
  "flag_off",
  "flag_unknown",
])("refuses %s before writing", async (mode) => {
  const expected = await binding();
  if (mode === "wrong_tenant")
    mockAuth.mockResolvedValue({
      ...ctx,
      clientId: "44444444-4444-4444-a444-444444444444",
    });
  if (mode === "wrong_move")
    expected.moveId = "44444444-4444-4444-a444-444444444444";
  if (mode === "no_gate")
    mockPolicy.mockResolvedValue({
      canApproveGates: false,
      canPublishDeliverables: true,
      canViewFinancialData: true,
    });
  if (mode === "no_publication")
    mockPolicy.mockResolvedValue({
      canApproveGates: true,
      canPublishDeliverables: false,
      canViewFinancialData: true,
    });
  if (mode === "no_financial")
    mockPolicy.mockResolvedValue({
      canApproveGates: true,
      canPublishDeliverables: true,
      canViewFinancialData: false,
    });
  if (mode === "outside_grant")
    mockPolicy.mockResolvedValue({
      canApproveGates: true,
      canPublishDeliverables: true,
      canViewFinancialData: true,
      programIdsAllowed: [],
    });
  if (mode === "flag_off") mockFlag.mockReturnValue(false);
  if (mode === "flag_unknown") mockFlag.mockReturnValue(undefined);
  expect((await post(expected)).status).toBe(
    mode === "wrong_tenant" || mode === "flag_off" || mode === "flag_unknown"
      ? 404
      : 403,
  );
  expect(mockTables.outcome_ledger).toHaveLength(0);
  expect(mockTransaction).not.toHaveBeenCalled();
});

test.each(["absent", "viewer", "changed_role"])(
  "refuses an %s receiving participant",
  async (mode) => {
    if (mode === "absent") mockTables.engagement_participants = [];
    if (mode === "viewer")
      mockTables.engagement_participants[0].program_access_level =
        "program_viewer";
    if (mode === "changed_role")
      mockTables.engagement_participants[0].role = "Different role";
    await expect(loadP5HandoffBasis(ctx, moveId)).rejects.toMatchObject({
      code: "receiving_owner_invalid",
    });
  },
);

test("blocks existing hard prerequisites inside the publication transaction", async () => {
  const expected = await binding();
  mockGate.mockResolvedValue({
    failedChecks: [
      { check: "value_measurement_contract_signed_off", severity: "hard" },
    ],
  });
  const response = await post(expected);
  expect(response.status).toBe(409);
  expect(mockTables.outcome_ledger).toHaveLength(0);
  expect(mockGate).toHaveBeenCalledWith(ctx, moveId, 4, 5, {
    allowHistoricalPhase: true,
    skipP5Publication: true,
  });
});

test("does not claim success when independent readback cannot confirm a committed write", async () => {
  const expected = await binding();
  mockHideIndependentRows = true;
  const response = await post(expected);
  expect(response.status).toBe(503);
  expect(mockTables.outcome_ledger).toHaveLength(2);
  expect(await response.json()).toMatchObject({
    error: "publication_readback_unavailable",
    transactionOutcome: "committed",
  });
});

test("a different Move never joins the published rows", async () => {
  await post(await binding());
  mockTables.outcome_ledger.forEach(
    (row) => (row.subject_ref = "different-move"),
  );
  expect((await readP5Handoff(ctx, moveId, true)).view.publication.state).toBe(
    "not_yet_linked",
  );
});

test("record readers emit only team words and reject malformed/duplicate/injected fields", () => {
  const raw = JSON.stringify(plan);
  expect(captureValueText(P5_MEASUREMENT_PLAN_KEY, raw)).toContain(
    plan.measures[0].method,
  );
  expect(captureValueText(P5_MEASUREMENT_PLAN_KEY, raw)).not.toMatch(
    /ownerUserId|receiving-participant|leverId|p5_measurement_handoff/,
  );
  expect(captureValueGateText(P5_MEASUREMENT_PLAN_KEY, raw)).not.toMatch(
    /ownerUserId|receiving-participant|leverId|p5_measurement_handoff/,
  );
  expect(
    readP5MeasurementPlan(
      JSON.stringify({
        ...plan,
        measures: [plan.measures[0], plan.measures[0]],
      }),
    ),
  ).toBeNull();
  expect(
    readP5MeasurementPlan(JSON.stringify({ ...plan, projectedUsd: 999999 })),
  ).toBeNull();
  expect(captureValueGateText(P5_MEASUREMENT_PLAN_KEY, "bad JSON")).toBe("");
});

test("idempotency UUID changes with Move, tenant and immutable basis", async () => {
  const current = await binding();
  const id = p5LedgerId(current, "L1");
  expect(p5LedgerId(current, "L1")).toBe(id);
  for (const change of [
    { moveId: "other" },
    { tenantKey: "other" },
    { contractHash: "b".repeat(64) },
    { planHash: "c".repeat(64) },
    { inputBasisHash: "d".repeat(64) },
  ])
    expect(p5LedgerId({ ...current, ...change }, "L1")).not.toBe(id);
});
