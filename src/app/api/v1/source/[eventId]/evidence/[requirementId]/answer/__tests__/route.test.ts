import type { SourceEventEvidenceStateRow } from "@/lib/source/canvas-substrate/types";

const tenancy = {
  clientId: "client-1",
  clientKey: "skyharbor",
  userId: "person-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "anand.sundaram+skyharbor@thesundaram.com",
  name: "Anand Sundaram",
  primaryRole: "maestro",
  metadataClientKey: "skyharbor",
};

const writes: Array<{ table: string; payload: Record<string, unknown> }> = [];
const writeAdapter = {
  insertActivityLog: jest.fn(async () => ({ ok: true })),
};
let canApproveSourceStages = true;
let eventStage = "scope";
let workforceState = "Available";
let slaArtifactId: string | null = "sla-v1";
let factBackedSources = false;

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ id: "client-1", key: "skyharbor" })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canGenerateSourcingArtifacts: true,
    canApproveSourceStages,
  })),
}));

jest.mock("@/lib/source/queries", () => ({
  resolveSourceEventUuidForClient: jest.fn(async () => "evt-1"),
}));

jest.mock("@/lib/source/canvas-substrate/queries", () => ({
  listEffectiveEvidenceStatesForEvent: jest.fn(async () => [
    {
      requirementId: "EVID-SRC-SCOPE-WORKFORCE",
      currentState: workforceState,
      ...(factBackedSources ? { sourceEventFactIds: ["workforce-fact-1"] } : { sourceArtifactId: "workforce-v1" }),
    },
    {
      requirementId: "EVID-SRC-SCOPE-SLA-BASELINE",
      currentState: "Parsed",
      ...(factBackedSources ? { sourceEventFactIds: ["sla-fact-1"] } : { sourceArtifactId: slaArtifactId }),
    },
  ]),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => writeAdapter),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(() => fakeFluentClient()),
}));

import { POST } from "../route";

const evidenceRow: SourceEventEvidenceStateRow = {
  id: "evidence-row-1",
  source_event_id: "evt-1",
  tenant_key: "skyharbor",
  requirement_id: "EVID-SRC-SCOPE-APP-INV",
  stage_key: "scope",
  current_state: "Not Requested",
  source_artifact_id: null,
  notes: null,
  last_synced_at: null,
  created_at: "2026-06-17T00:00:00.000Z",
  updated_at: "2026-06-17T00:00:00.000Z",
};

let existingEvidence: SourceEventEvidenceStateRow | null = evidenceRow;

function fakeFluentClient() {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      let updatePayload: Record<string, unknown> | null = null;
      let insertPayload: Record<string, unknown> | null = null;
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        update: (payload: Record<string, unknown>) => {
          updatePayload = payload;
          writes.push({ table, payload });
          return chain;
        },
        insert: (payload: Record<string, unknown>) => {
          insertPayload = payload;
          writes.push({ table, payload });
          return chain;
        },
        maybeSingle: async () => {
          if (table === "source_events") {
            return {
              data: {
                id: "evt-1",
                client_key: "skyharbor",
                current_stage_key: eventStage,
              },
              error: null,
            };
          }
          if (table === "source_event_evidence_states") {
            if (filters.requirement_id === "EVID-SRC-SCOPE-RETAINED-VENDOR-DECISION") {
              return { data: null, error: null };
            }
            if (filters.requirement_id === "EVID-SRC-SCOPE-WORKFORCE") {
              return { data: { ...evidenceRow, requirement_id: filters.requirement_id, current_state: workforceState, source_artifact_id: "workforce-v1" }, error: null };
            }
            if (filters.requirement_id === "EVID-SRC-SCOPE-SLA-BASELINE") {
              return { data: { ...evidenceRow, requirement_id: filters.requirement_id, current_state: "Parsed", source_artifact_id: slaArtifactId }, error: null };
            }
            return { data: existingEvidence, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => {
          if (table === "source_event_evidence_states" && updatePayload) {
            return {
              data: {
                ...evidenceRow,
                ...updatePayload,
                current_state: updatePayload.current_state,
              },
              error: null,
            };
          }
          if (table === "source_event_evidence_states" && insertPayload) {
            return {
              data: {
                ...evidenceRow,
                id: "inserted-evidence-row",
                ...insertPayload,
              },
              error: null,
            };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  };
}

function request(body: unknown): import("next/server").NextRequest {
  return {
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

const ctx = {
  params: Promise.resolve({
    eventId: "evt-1",
    requirementId: "EVID-SRC-SCOPE-APP-INV",
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  writes.length = 0;
  existingEvidence = evidenceRow;
  canApproveSourceStages = true;
  eventStage = "scope";
  workforceState = "Available";
  slaArtifactId = "sla-v1";
  factBackedSources = false;
});

describe("POST Source evidence answer", () => {
  const matrixCtx = { params: Promise.resolve({ eventId: "evt-1", requirementId: "EVID-SRC-SCOPE-RETAINED-VENDOR-DECISION" }) };
  const matrixBody = {
    stage: "scope",
    scopeMatrix: {
      retainedResponsibilities: "Client operations retains service ownership, security policy, and approvals.",
      vendorResponsibilities: "Prospective vendor handles L1/L2 service desk and endpoint support only.",
      rationale: "Synthetic owner decision based on the reviewed workforce and SLA test evidence.",
    },
  };

  it("persists a structured owner matrix decision with source identities", async () => {
    const res = await POST(request(matrixBody), matrixCtx);
    expect(res.status).toBe(200);
    expect(writes).toContainEqual(expect.objectContaining({
      table: "source_event_evidence_states",
      payload: expect.objectContaining({
        requirement_id: "EVID-SRC-SCOPE-RETAINED-VENDOR-DECISION",
        current_state: "Available",
        notes: expect.stringContaining('"workforceArtifactId":"workforce-v1"'),
      }),
    }));
  });

  it("persists identities from the effective fact-backed evidence read model", async () => {
    factBackedSources = true;
    const res = await POST(request(matrixBody), matrixCtx);
    expect(res.status).toBe(200);
    expect(writes).toContainEqual(expect.objectContaining({
      table: "source_event_evidence_states",
      payload: expect.objectContaining({
        notes: expect.stringContaining('"slaArtifactId":"facts:sla-fact-1"'),
      }),
    }));
  });

  it("rejects a matrix decision from a contributor without stage approval authority", async () => {
    canApproveSourceStages = false;
    const res = await POST(request(matrixBody), matrixCtx);
    expect(res.status).toBe(403);
    expect(writes).toEqual([]);
  });

  it("rejects a matrix decision outside the active Scope stage", async () => {
    eventStage = "rfp";
    const res = await POST(request(matrixBody), matrixCtx);
    expect(res.status).toBe(409);
    expect(writes).toEqual([]);
  });

  it("rejects missing source evidence or a generic canned answer", async () => {
    slaArtifactId = null;
    const missing = await POST(request(matrixBody), matrixCtx);
    expect(missing.status).toBe(422);
    const canned = await POST(request({ stage: "scope", answer: "Confirm retained vs vendor" }), matrixCtx);
    expect(canned.status).toBe(400);
    expect(writes).toEqual([]);
  });
  it.each([
    "EVID-SRC-STR-INCUMBENT",
    "EVID-SRC-STR-SPEND-BASELINE",
  ])("does not turn a typed answer into record-backed %s", async (requirementId) => {
    const res = await POST(
      request({ answer: "No source extract is available for this synthetic test.", stage: "strategy" }),
      { params: Promise.resolve({ eventId: "evt-1", requirementId }) },
    );
    expect(res.status).toBe(422);
    expect(writes).toEqual([]);
    expect(writeAdapter.insertActivityLog).not.toHaveBeenCalled();
  });

  it("advances existing evidence to client-stated Available and logs provenance", async () => {
    const res = await POST(
      request({
        answer: "The EA council owns the application inventory.",
        stage: "scope",
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.provenance).toBe("client-stated");
    expect(writes).toContainEqual(
      expect.objectContaining({
        table: "source_event_evidence_states",
        payload: expect.objectContaining({
          current_state: "Available",
          notes: expect.stringContaining("Client-stated answer"),
        }),
      }),
    );
    expect(writeAdapter.insertActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "evidence_answered",
        criterionId: "EVID-SRC-SCOPE-APP-INV",
        metadata: expect.objectContaining({
          provenance: "client-stated",
          state: "Available",
        }),
      }),
    );
  });

  it("inserts the evidence row when the scaffold row is missing", async () => {
    existingEvidence = null;
    const res = await POST(
      request({
        answer: "The EA council owns the application inventory.",
        stage: "scope",
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(writes).toContainEqual(
      expect.objectContaining({
        table: "source_event_evidence_states",
        payload: expect.objectContaining({
          requirement_id: "EVID-SRC-SCOPE-APP-INV",
          current_state: "Available",
          notes: expect.stringContaining("Client-stated answer"),
        }),
      }),
    );
  });

  it("does not downgrade usable evidence when a typed answer is added", async () => {
    existingEvidence = {
      ...evidenceRow,
      current_state: "Usable Evidence",
      notes: "Uploaded: app_inventory.csv",
    };
    const res = await POST(
      request({
        answer: "The EA council owns the application inventory.",
        stage: "scope",
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(writes).toContainEqual(
      expect.objectContaining({
        table: "source_event_evidence_states",
        payload: expect.objectContaining({
          current_state: "Usable Evidence",
        }),
      }),
    );
  });
});
