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
}));

import { recordServiceNowRequestMappingDecision } from "@/lib/source/intake/servicenow-request-event-authority";
import { POST } from "../route";

describe("POST /api/v1/source/intake/servicenow/review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readSourceIntakeRequestQueue.mockResolvedValue({
      registryAvailable: true,
      requests: [importedRequest],
    });
  });

  it("records a named current-version accept decision before event creation", async () => {
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
      expect.objectContaining({
        state: "accepted",
        categoryId: "bpo_contact_centre",
        archetypeId: "CONTACT_CENTER_CX",
        decidedByUserId: "person-1",
        decidedByName: "Procurement Lead",
        sourceVersion: "v1",
      }),
    );
    expect(recordServiceNowRequestMappingDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        requestId: importedRequest.requestId,
        decision: expect.objectContaining({ sourceVersion: "v1" }),
      }),
    );
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
});
