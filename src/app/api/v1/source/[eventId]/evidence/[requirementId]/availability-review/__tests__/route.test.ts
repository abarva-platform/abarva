import type { SourceEventEvidenceStateRow } from "@/lib/source/canvas-substrate/types";

const tenancy = {
  clientId: "client-1",
  clientKey: "client-one",
  userId: "person-1",
  role: "maestro",
};

const currentUser: {
  personId: string | null;
  clerkUserId: string;
  email: string;
  name: string;
  primaryRole: string;
  metadataClientKey: string;
} = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "reviewer@example.test",
  name: "User",
  primaryRole: "maestro",
  metadataClientKey: "client-one",
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
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    key: "client-one",
  })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canUploadSourceArtifacts: true,
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

import { GET, POST } from "../route";

const evidenceRow: SourceEventEvidenceStateRow = {
  id: "evidence-row-1",
  source_event_id: "evt-1",
  tenant_key: "client-one",
  requirement_id: "EVID-SRC-RFP-LEGAL-TEMPLATE",
  stage_key: "rfp",
  current_state: "Parsed",
  source_artifact_id: "artifact-1",
  notes: "Parsed: source-legal-template.docx",
  last_synced_at: "2026-09-10T00:00:00.000Z",
  created_at: "2026-09-10T00:00:00.000Z",
  updated_at: "2026-09-10T00:00:00.000Z",
};

let existingEvidence: SourceEventEvidenceStateRow | null = evidenceRow;
let personRow: { id: string; name: string | null; email: string | null } | null = {
  id: "person-1",
  name: "Evidence Reviewer",
  email: "reviewer@example.test",
};
let queriedPersonId: string | null = null;
let parsedArtifacts: Array<{
  id: string;
  original_name: string;
  parse_status: string;
  updated_at: string;
}> = [];

function fakeFluentClient() {
  return {
    from(table: string) {
      let updatePayload: Record<string, unknown> | null = null;
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (column: string, value: unknown) => {
          if (table === "persons" && column === "id") {
            queriedPersonId = typeof value === "string" ? value : null;
          }
          return chain;
        },
        is: () => chain,
        then: (
          resolve: (value: {
            data: typeof parsedArtifacts;
            error: null;
          }) => unknown,
        ) => {
          if (table === "source_artifacts") {
            return Promise.resolve(
              resolve({ data: parsedArtifacts, error: null }),
            );
          }
          return Promise.resolve(resolve({ data: [], error: null }));
        },
        update: (payload: Record<string, unknown>) => {
          updatePayload = payload;
          writes.push({ table, payload });
          return chain;
        },
        maybeSingle: async () => {
          if (table === "source_events") {
            return {
              data: { id: "evt-1", client_key: "client-one" },
              error: null,
            };
          }
          if (table === "persons") {
            return {
              data:
                personRow && queriedPersonId === personRow.id ? personRow : null,
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
              data: { ...evidenceRow, ...updatePayload },
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

function request(body?: unknown): import("next/server").NextRequest {
  return {
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

const ctx = {
  params: Promise.resolve({
    eventId: "evt-1",
    requirementId: "EVID-SRC-RFP-LEGAL-TEMPLATE",
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  writes.length = 0;
  existingEvidence = evidenceRow;
  tenancy.userId = "person-1";
  currentUser.personId = "person-1";
  queriedPersonId = null;
  parsedArtifacts = [];
  personRow = {
    id: "person-1",
    name: "Evidence Reviewer",
    email: "reviewer@example.test",
  };
});

describe("Source parsed-evidence availability review", () => {
  it("previews the exact named audit record without granting approval", async () => {
    const response = await GET(request(), ctx);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      review: Record<string, unknown>;
    };
    expect(payload.review).toEqual(
      expect.objectContaining({
        actionType: "evidence_reviewed",
        actionLabel:
          "Reviewed parsed evidence: Approved legal and commercial template",
        targetState: "Available",
        provenance: "uploaded-evidence-human-review",
        reviewScope: "availability_only",
        approvalGranted: false,
        reviewer: expect.objectContaining({
          personId: "person-1",
          displayName: "Evidence Reviewer",
          email: "reviewer@example.test",
        }),
      }),
    );
  });

  it("records availability review separately from client-stated answers", async () => {
    const response = await POST(
      request({
        rationale:
          "Reviewed the parsed template for workflow relevance; no legal or commercial approval granted.",
        stage: "rfp",
      }),
      ctx,
    );
    expect(response.status).toBe(200);
    expect(writes).toContainEqual(
      expect.objectContaining({
        table: "source_event_evidence_states",
        payload: expect.objectContaining({
          current_state: "Available",
          notes: expect.stringContaining("approval_granted=false"),
        }),
      }),
    );
    expect(writeAdapter.insertActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "person-1",
        actorDisplayName: "Evidence Reviewer",
        actionType: "evidence_reviewed",
        reason: "evidence lifecycle review",
        metadata: expect.objectContaining({
          provenance: "uploaded-evidence-human-review",
          reviewScope: "availability_only",
          approvalGranted: false,
        }),
      }),
    );
    expect(writeAdapter.insertActivityLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "evidence_answered" }),
    );
  });

  it("rejects review when parsed evidence does not exist", async () => {
    existingEvidence = { ...evidenceRow, current_state: "Loaded" };
    const response = await GET(request(), ctx);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "parsed_evidence_required" }),
    );
  });

  it("reconciles a parsed artifact that deterministically matches a legacy evidence row", async () => {
    existingEvidence = {
      ...evidenceRow,
      current_state: "Not Requested",
      source_artifact_id: null,
    };
    parsedArtifacts = [
      {
        id: "artifact-parsed-legacy",
        original_name: "source-legal-template.docx",
        parse_status: "parsed",
        updated_at: "2026-09-21T00:00:00.000Z",
      },
    ];

    const previewResponse = await GET(request(), ctx);
    expect(previewResponse.status).toBe(200);
    await expect(previewResponse.json()).resolves.toEqual(
      expect.objectContaining({
        review: expect.objectContaining({
          currentState: "Parsed",
          targetState: "Available",
        }),
      }),
    );

    const writeResponse = await POST(
      request({
        rationale:
          "Reviewed the parsed legacy artifact for workflow availability only.",
        stage: "rfp",
      }),
      ctx,
    );

    expect(writeResponse.status).toBe(200);
    expect(writes).toContainEqual(
      expect.objectContaining({
        table: "source_event_evidence_states",
        payload: expect.objectContaining({
          current_state: "Available",
          source_artifact_id: "artifact-parsed-legacy",
        }),
      }),
    );
  });

  it("does not reconcile a parsed artifact that maps to another requirement", async () => {
    existingEvidence = {
      ...evidenceRow,
      current_state: "Not Requested",
      source_artifact_id: null,
    };
    parsedArtifacts = [
      {
        id: "artifact-other-requirement",
        original_name: "supplier-market-intelligence.pdf",
        parse_status: "parsed",
        updated_at: "2026-09-21T00:00:00.000Z",
      },
    ];

    const response = await GET(request(), ctx);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "parsed_evidence_required" }),
    );
  });

  it("requires a resolved tenant person before attributing a review", async () => {
    currentUser.personId = null;
    const response = await GET(request(), ctx);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "reviewer_identity_required" }),
    );
  });

  it("uses the canonical person provisioned by tenancy during the request", async () => {
    const provisionedPersonId = "00000000-0000-4000-8000-000000000321";
    currentUser.personId = null;
    tenancy.userId = provisionedPersonId;
    personRow = {
      id: provisionedPersonId,
      name: "Provisioned Evidence Reviewer",
      email: "reviewer@example.test",
    };

    const response = await GET(request(), ctx);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        review: expect.objectContaining({
          reviewer: expect.objectContaining({
            personId: provisionedPersonId,
            displayName: "Provisioned Evidence Reviewer",
          }),
        }),
      }),
    );

    const writeResponse = await POST(
      request({
        rationale:
          "Reviewed the parsed evidence for workflow availability during the synthetic smoke test.",
        stage: "rfp",
      }),
      ctx,
    );
    expect(writeResponse.status).toBe(200);
    expect(writeAdapter.insertActivityLog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        actorUserId: provisionedPersonId,
        actorDisplayName: "Provisioned Evidence Reviewer",
      }),
    );
  });

  it("prefers the request-resolved tenant person over a stale current-user person id", async () => {
    const stalePersonId = "00000000-0000-4000-8000-000000000111";
    const canonicalPersonId = "00000000-0000-4000-8000-000000000321";
    currentUser.personId = stalePersonId;
    tenancy.userId = canonicalPersonId;
    personRow = {
      id: canonicalPersonId,
      name: "Canonical Evidence Reviewer",
      email: "reviewer@example.test",
    };

    const response = await GET(request(), ctx);

    expect(response.status).toBe(200);
    expect(queriedPersonId).toBe(canonicalPersonId);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        review: expect.objectContaining({
          reviewer: expect.objectContaining({
            personId: canonicalPersonId,
            displayName: "Canonical Evidence Reviewer",
          }),
        }),
      }),
    );
  });

  it("fails closed when the canonical person row has no display name", async () => {
    personRow = { id: "person-1", name: null, email: "reviewer@example.test" };
    const response = await GET(request(), ctx);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "reviewer_identity_required" }),
    );
  });

  it("fails closed when the canonical person row has a placeholder name", async () => {
    personRow = {
      id: "person-1",
      name: "User",
      email: "reviewer@example.test",
    };
    const response = await GET(request(), ctx);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "reviewer_identity_required" }),
    );
  });
});
