import type { SourceIntakeRequestSummary } from "@/lib/source/intake/servicenow-sourcing-request-repository";

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    clientId: "client-1",
    clientKey: "skyharbor-air",
    userId: "user-1",
  })),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ error: "auth" }, { status: 401 }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    key: "skyharbor-air",
    name: "Example Organization",
  })),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canCreateSourceEvents: true,
  })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({
    personId: "person-1",
    clerkUserId: "clerk-1",
    name: "Procurement Lead",
  })),
}));

const importedRequest: SourceIntakeRequestSummary = {
  requestId: "servicenow:sn_sourcing_request:request-1",
  requestNumber: "REQ0010007",
  sourceSystem: "ServiceNow" as const,
  sourceStatus: "New",
  sourceVersion: "v1",
  extractedAt: "2026-09-22T12:00:00Z",
  updatedAt: null,
  title: "Member services contact center replacement",
  description: "Replace the member contact center platform.",
  trigger: "Current agreement expires in nine months.",
  requestedOutcome: "Select a platform and managed operations partner.",
  requestedFor: "Health Plan",
  businessDomain: "plan",
  businessFunction: "Member Services",
  decisionOwner: "VP Member Services",
  baselineOwner: "Contact center operations",
  scopeIncluded: "Member calls, chat, and workforce management.",
  scopeExcluded: "Clinical triage.",
  securityReviewNeeded: true,
  legalReviewNeeded: true,
  value: { amount: 12500000, currency: "USD", validated: false as const },
  requiredFactGaps: [] as string[],
  mappingProposal: {
    categoryId: "bpo_contact_centre",
    archetypeId: "CONTACT_CENTER_CX",
    confidence: "high",
    reasons: ["Matched contact-center scope"],
  },
  mappingDecision: null,
  eventLink: null,
};

const readSourceIntakeRequestQueue = jest.fn(async (tenantKey: string) => {
  void tenantKey;
  return {
    registryAvailable: true,
    requests: [importedRequest],
  };
});

jest.mock("@/lib/source/intake/servicenow-sourcing-request-repository", () => ({
  readSourceIntakeRequestQueue: (tenantKey: string) =>
    readSourceIntakeRequestQueue(tenantKey),
}));

jest.mock("@/lib/source/intake/servicenow-request-event-authority", () => ({
  recordServiceNowRequestMappingDecision: jest.fn(async () => undefined),
  readServiceNowRequestDisposition: jest.fn(async () => null),
  recordServiceNowRequestDisposition: jest.fn(async () => undefined),
}));

import {
  readServiceNowRequestDisposition,
  recordServiceNowRequestDisposition,
  recordServiceNowRequestMappingDecision,
} from "@/lib/source/intake/servicenow-request-event-authority";
import { POST } from "../route";

const readDisposition = readServiceNowRequestDisposition as jest.Mock;
const recordDisposition = recordServiceNowRequestDisposition as jest.Mock;

describe("POST /api/v1/source/intake/servicenow/review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readSourceIntakeRequestQueue.mockResolvedValue({
      registryAvailable: true,
      requests: [importedRequest],
    });
    readDisposition.mockResolvedValue(null);
  });

  it("records a named current-version accept decision before event creation", async () => {
    const persistedDecision = {
      decisionId: "mapping-persisted",
      state: "accepted" as const,
      categoryId: "bpo_contact_centre",
      archetypeId: "CONTACT_CENTER_CX",
      decidedByUserId: "person-1",
      decidedByName: "Procurement Lead",
      decidedAt: "2026-09-22T13:00:00.000Z",
      rationale: "Scope and buying motion confirmed.",
      sourceVersion: "v1",
    };
    readSourceIntakeRequestQueue
      .mockResolvedValueOnce({
        registryAvailable: true,
        requests: [importedRequest],
      })
      .mockResolvedValueOnce({
        registryAvailable: true,
        requests: [{ ...importedRequest, mappingDecision: persistedDecision }],
      });

    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          decisionState: "accepted",
          rationale: "Scope and buying motion confirmed.",
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.mappingDecision).toEqual(
      persistedDecision,
    );
    expect(recordServiceNowRequestMappingDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        requestId: importedRequest.requestId,
        decision: expect.objectContaining({ sourceVersion: "v1" }),
      }),
    );
    expect(readSourceIntakeRequestQueue).toHaveBeenCalledTimes(2);
  });

  it("returns the stored authority rather than an optimistic duplicate decision", async () => {
    const storedDecision = {
      decisionId: "mapping-existing",
      state: "accepted" as const,
      categoryId: "bpo_contact_centre",
      archetypeId: "CONTACT_CENTER_CX",
      decidedByUserId: "person-1",
      decidedByName: "Procurement Lead",
      decidedAt: "2026-09-22T12:30:00.000Z",
      rationale: "Previously persisted routing rationale.",
      sourceVersion: "v1",
    };
    readSourceIntakeRequestQueue
      .mockResolvedValueOnce({
        registryAvailable: true,
        requests: [importedRequest],
      })
      .mockResolvedValueOnce({
        registryAvailable: true,
        requests: [{ ...importedRequest, mappingDecision: storedDecision }],
      });

    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          decisionState: "accepted",
          rationale: "A newly submitted rationale that conflicts with storage.",
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.mappingDecision).toEqual(storedDecision);
    expect(json.mappingDecision.rationale).not.toBe(
      "A newly submitted rationale that conflicts with storage.",
    );
  });

  it("keeps event creation locked when the review write cannot be read back", async () => {
    readSourceIntakeRequestQueue
      .mockResolvedValueOnce({
        registryAvailable: true,
        requests: [importedRequest],
      })
      .mockResolvedValueOnce({
        registryAvailable: true,
        requests: [importedRequest],
      });

    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          decisionState: "accepted",
          rationale: "Scope and buying motion confirmed.",
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toBe("source_request_review_not_confirmed");
    expect(json.mappingDecision).toBeUndefined();
  });

  it("rejects stale request versions before recording a mapping decision", async () => {
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "stale-version",
          decisionState: "accepted",
          rationale: "Scope and buying motion confirmed.",
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(recordServiceNowRequestMappingDecision).not.toHaveBeenCalled();
  });

  it("accepts a ready imported request only after exact-version authority readback", async () => {
    const readyRequest = {
      ...importedRequest,
      mappingDecision: {
        decisionId: "mapping-1",
        state: "accepted" as const,
        categoryId: "bpo_contact_centre",
        archetypeId: "CONTACT_CENTER_CX",
        decidedByUserId: "person-1",
        decidedByName: "Procurement Lead",
        decidedAt: "2026-09-22T13:00:00Z",
        rationale: "Routing reviewed for this exact version.",
        sourceVersion: "v1",
      },
    };
    const stored = {
      disposition_state: "accepted",
      source_version: "v1",
      decided_by_user_id: "person-1",
    };
    readSourceIntakeRequestQueue.mockResolvedValue({
      registryAvailable: true,
      requests: [readyRequest],
    });
    readDisposition.mockResolvedValueOnce(null).mockResolvedValueOnce(stored);

    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "accepted",
          rationale: "Request is ready for event planning.",
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, disposition: stored });
    expect(recordDisposition).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        requestId: importedRequest.requestId,
        sourceVersion: "v1",
        decidedByUserId: "person-1",
      }),
    );
    expect(readDisposition).toHaveBeenCalledTimes(2);
  });

  it("does not accept a request with unreviewed mapping or missing facts", async () => {
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "accepted",
          rationale: "Request is ready for event planning.",
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it("refuses acceptance when required facts remain missing after mapping review", async () => {
    readSourceIntakeRequestQueue.mockResolvedValue({
      registryAvailable: true,
      requests: [{
        ...importedRequest,
        requiredFactGaps: ["baseline_owner"],
        mappingDecision: {
          decisionId: "mapping-1",
          state: "accepted",
          categoryId: "bpo_contact_centre",
          archetypeId: "CONTACT_CENTER_CX",
          decidedByUserId: "person-1",
          decidedByName: "Procurement Lead",
          decidedAt: "2026-09-22T13:00:00Z",
          rationale: "Routing reviewed for this exact version.",
          sourceVersion: "v1",
        },
      }],
    });
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "accepted",
          rationale: "Ready for planning despite missing baseline.",
        }),
      }),
    );
    expect(res.status).toBe(409);
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it("fails closed when disposition authority is unavailable", async () => {
    readDisposition.mockRejectedValueOnce(new Error("relation missing"));
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "returned",
          rationale: "Please provide the missing baseline owner.",
        }),
      }),
    );

    expect(res.status).toBe(503);
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it("rejects an unknown merge survivor without writing", async () => {
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "merged",
          survivingRequestId: "other-tenant-request",
          survivingSourceVersion: "v1",
          rationale: "Duplicate of a different request.",
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it("refuses to rewrite an existing request disposition", async () => {
    readDisposition.mockResolvedValueOnce({ disposition_state: "declined" });
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "returned",
          rationale: "Please provide the missing baseline owner.",
        }),
      }),
    );
    expect(res.status).toBe(409);
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it("does not claim success when the write cannot be read back", async () => {
    readDisposition.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/v1/source/intake/servicenow/review", {
        method: "POST",
        body: JSON.stringify({
          requestId: importedRequest.requestId,
          sourceVersion: "v1",
          dispositionState: "returned",
          rationale: "Please provide the missing baseline owner.",
        }),
      }),
    );
    expect(res.status).toBe(503);
    expect(recordDisposition).toHaveBeenCalledTimes(1);
  });
});
