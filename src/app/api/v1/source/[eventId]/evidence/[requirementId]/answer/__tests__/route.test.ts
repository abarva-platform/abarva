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
  })),
}));

jest.mock("@/lib/source/queries", () => ({
  resolveSourceEventUuidForClient: jest.fn(async () => "evt-1"),
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
                current_stage_key: "scope",
              },
              error: null,
            };
          }
          if (table === "source_event_evidence_states") {
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
});

describe("POST Source evidence answer", () => {
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
