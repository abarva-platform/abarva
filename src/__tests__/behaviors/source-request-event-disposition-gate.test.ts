import type { SourceIntakeRequestSummary } from "@/lib/source/intake/servicenow-sourcing-request-repository";

const request: SourceIntakeRequestSummary = {
  requestId: "servicenow:sn_sourcing_request:req-1",
  requestNumber: "REQ-1",
  sourceSystem: "ServiceNow",
  sourceStatus: "New",
  sourceVersion: "v1",
  extractedAt: "2026-10-06T00:00:00Z",
  updatedAt: null,
  title: "Synthetic sourcing request",
  description: "Review the synthetic request.",
  trigger: "Contract renewal.",
  requestedOutcome: "Select a supplier.",
  requestedFor: "Test team",
  businessDomain: "test",
  businessFunction: "IT",
  decisionOwner: "Test owner",
  baselineOwner: "Test team",
  scopeIncluded: "Test scope",
  scopeExcluded: "Production work",
  securityReviewNeeded: false,
  legalReviewNeeded: false,
  value: null,
  requiredFactGaps: [],
  mappingProposal: {
    categoryId: "bpo_contact_centre",
    archetypeId: "CONTACT_CENTER_CX",
    confidence: "high",
    reasons: ["Synthetic mapping"],
  },
  mappingDecision: {
    decisionId: "decision-1",
    state: "accepted",
    categoryId: "bpo_contact_centre",
    archetypeId: "CONTACT_CENTER_CX",
    decidedByUserId: "00000000-0000-4000-8000-000000000001",
    decidedByName: "Test owner",
    decidedAt: "2026-10-06T00:00:00Z",
    rationale: "Synthetic scope reviewed.",
    sourceVersion: "v1",
  },
  eventLink: null,
};

const readDisposition = jest.fn();
const createEvent = jest.fn(async (_input: unknown) => ({
  id: "event-1",
  event_name: "Synthetic sourcing request",
  event_type: "managed_service",
  trigger_description: "Contract renewal.",
  decision_owner: "Test owner",
  scope_description: null,
  estimated_value_usd: null,
  sourcing_motion: "competitive_rfp",
  classified_category: "bpo_contact_centre",
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({ userId: "00000000-0000-4000-8000-000000000001" })),
  tenancyErrorResponse: jest.fn(),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "synthetic-tenant" })),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({ canCreateSourceEvents: true })),
}));
jest.mock("@/lib/source/queries", () => ({
  isUuid: jest.fn(() => true),
  createSourcingEvent: (input: unknown) => createEvent(input),
}));
jest.mock("@/lib/source/intake/servicenow-sourcing-request-repository", () => ({
  readSourceIntakeRequestQueue: jest.fn(async () => ({ registryAvailable: true, requests: [request] })),
}));
jest.mock("@/lib/source/intake/servicenow-request-event-authority", () => ({
  readServiceNowRequestDisposition: (...args: unknown[]) => readDisposition(...args),
  linkServiceNowRequestToEvent: jest.fn(),
}));
jest.mock("@/lib/source/new-workspace/authority-version-store", () => ({
  persistSourceAuthorityVersion: jest.fn(async () => ({ versionId: "version-1" })),
}));
jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({ insertParticipant: jest.fn(async () => ({ ok: true })) })),
}));

import { POST } from "@/app/api/v1/source/events/route";

const createRequest = () => new Request("http://localhost/api/v1/source/events", {
  method: "POST",
  body: JSON.stringify({ sourceRequest: { requestId: request.requestId, sourceVersion: "v1" } }),
});

describe("imported request disposition gates event creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readDisposition.mockResolvedValue(null);
  });

  it.each([null, "returned", "merged", "declined"])("refuses %s without creating an event", async (state) => {
    if (state) readDisposition.mockResolvedValue({ disposition_state: state, source_version: "v1" });
    const response = await POST(createRequest());
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("source_request_disposition_required");
    expect(createEvent).not.toHaveBeenCalled();
  });

  it("fails closed when disposition authority cannot be read", async () => {
    readDisposition.mockRejectedValue(new Error("relation unavailable"));
    const response = await POST(createRequest());
    expect(response.status).toBe(503);
    expect(createEvent).not.toHaveBeenCalled();
  });

  it("permits only the accepted current-version disposition for the same tenant", async () => {
    readDisposition.mockResolvedValue({ disposition_state: "accepted", source_version: "v1" });
    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(readDisposition).toHaveBeenCalledWith({
      tenantKey: "synthetic-tenant",
      requestId: request.requestId,
      sourceVersion: "v1",
    });
    expect(createEvent).toHaveBeenCalledTimes(1);
  });
});
