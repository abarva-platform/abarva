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
    name: "SkyHarbor Global",
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
  mappingDecision: {
    decisionId: "mapping-1",
    state: "accepted" as const,
    categoryId: "bpo_contact_centre",
    archetypeId: "CONTACT_CENTER_CX",
    decidedByUserId: "person-1",
    decidedByName: "Procurement Lead",
    decidedAt: "2026-09-22T13:00:00.000Z",
    rationale: "Scope and buying motion confirmed.",
    sourceVersion: "v1",
  },
  eventLink: null,
};

const readSourceIntakeRequestQueue = jest.fn(async (tenantKey: string) => {
  void tenantKey;
  return {
    registryAvailable: true,
    requests: [importedRequest],
  };
});

jest.mock("@/lib/source/new-workspace/authority-version-store", () => ({
  persistSourceAuthorityVersion: jest.fn(async () => ({
    action: "create_version",
    versionId: "request-version-1",
    versionNumber: 1,
    contentHash: "a".repeat(64),
  })),
}));

jest.mock("@/lib/source/intake/servicenow-sourcing-request-repository", () => ({
  readSourceIntakeRequestQueue: (tenantKey: string) =>
    readSourceIntakeRequestQueue(tenantKey),
}));

jest.mock("@/lib/source/intake/servicenow-request-event-authority", () => ({
  recordServiceNowRequestMappingDecision: jest.fn(async () => undefined),
  linkServiceNowRequestToEvent: jest.fn(async () => undefined),
}));

jest.mock("@/lib/source/queries", () => ({
  createSourcingEvent: jest.fn(async () => ({
    id: "evt-123",
    code: "SRC-123",
    name: "Data platform sourcing",
    event_code: "SRC-123",
    event_name: "Data platform sourcing",
    event_type: "software",
    sourcing_motion: "competitive_rfp",
    classified_category: "data_ai_platform",
    trigger_description: "Analytics platform renewal needs review.",
    scope_description: null,
    decision_owner: null,
    estimated_value_usd: null,
  })),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    insertParticipant: jest.fn(async () => ({ ok: true })),
  })),
}));

import { POST } from "../route";
import { requireTenancy } from "@/lib/auth/tenancy";
import { createSourcingEvent } from "@/lib/source/queries";
import { persistSourceAuthorityVersion } from "@/lib/source/new-workspace/authority-version-store";
import {
  linkServiceNowRequestToEvent,
  recordServiceNowRequestMappingDecision,
} from "@/lib/source/intake/servicenow-request-event-authority";

describe("POST /api/v1/source/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readSourceIntakeRequestQueue.mockResolvedValue({
      registryAvailable: true,
      requests: [importedRequest],
    });
    jest.mocked(persistSourceAuthorityVersion).mockClear();
  });

  it("returns an event-specific approval URL and persists the selected category", async () => {
    const res = await POST(
      new Request("http://localhost/api/v1/source/events", {
        method: "POST",
        body: JSON.stringify({
          eventName: "Data platform sourcing",
          triggerDescription: "Analytics platform renewal needs review.",
          categoryId: "data_ai_platform",
          sourcingMotion: "competitive_rfp",
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.approvalUrl).toBe("/source/events/evt-123/approval");
    expect(json.eventUrl).toBe("/source/events/evt-123?stage=strategy");
    expect(json.approvalAuthority).toContain("Event Owner");
    expect(json.approvalAuthority).not.toMatch(/co-signed|tenant admin/i);
    expect(createSourcingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "data_ai_platform",
        sourcingMotion: "competitive_rfp",
      }),
    );
    expect(persistSourceAuthorityVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-123",
        clientKey: "skyharbor-air",
        authorityKind: "request",
        createdByUserId: "user-1",
      }),
    );
  });

  it("rejects a missing named creator before writing an event", async () => {
    jest.mocked(requireTenancy).mockResolvedValueOnce({
      clientId: "client-1",
      clientKey: "skyharbor-air",
      userId: "",
    } as Awaited<ReturnType<typeof requireTenancy>>);
    const res = await POST(new Request("http://localhost/api/v1/source/events", {
      method: "POST",
      body: JSON.stringify({
        eventName: "Synthetic source request",
        triggerDescription: "Review a renewal",
      }),
    }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("named_source_event_creator_required");
    expect(createSourcingEvent).not.toHaveBeenCalled();
  });

  it("creates and links an event from the persisted current-version mapping decision", async () => {
    const res = await POST(
      new Request("http://localhost/api/v1/source/events", {
        method: "POST",
        body: JSON.stringify({
          sourceRequest: {
            requestId: importedRequest.requestId,
            sourceVersion: "v1",
            categoryId: "cloud_finops",
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(recordServiceNowRequestMappingDecision).not.toHaveBeenCalled();
    expect(createSourcingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        clientKey: "skyharbor-air",
        eventName: importedRequest.title,
        categoryId: "bpo_contact_centre",
        creationRequestId: importedRequest.requestId,
      }),
    );
    expect(linkServiceNowRequestToEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: importedRequest.requestId,
        sourceVersion: "v1",
        sourceEventId: "evt-123",
        linkedByName: "Procurement Lead",
      }),
    );
  });

  it("rejects event creation when the current request version has no persisted mapping decision", async () => {
    readSourceIntakeRequestQueue.mockResolvedValueOnce({
      registryAvailable: true,
      requests: [{ ...importedRequest, mappingDecision: null }],
    });

    const res = await POST(
      new Request("http://localhost/api/v1/source/events", {
        method: "POST",
        body: JSON.stringify({
          sourceRequest: {
            requestId: importedRequest.requestId,
            sourceVersion: "v1",
          },
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(createSourcingEvent).not.toHaveBeenCalled();
    expect(linkServiceNowRequestToEvent).not.toHaveBeenCalled();
  });

  it("returns the already-linked event on repeated current-version create commands", async () => {
    readSourceIntakeRequestQueue.mockResolvedValueOnce({
      registryAvailable: true,
      requests: [
        {
          ...importedRequest,
          eventLink: {
            eventId: "evt-linked",
            linkedAt: "2026-09-22T13:10:00.000Z",
            sourceVersion: "v1",
          },
        },
      ],
    });

    const res = await POST(
      new Request("http://localhost/api/v1/source/events", {
        method: "POST",
        body: JSON.stringify({
          sourceRequest: {
            requestId: importedRequest.requestId,
            sourceVersion: "v1",
          },
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.event.id).toBe("evt-linked");
    expect(createSourcingEvent).not.toHaveBeenCalled();
    expect(linkServiceNowRequestToEvent).not.toHaveBeenCalled();
  });

  it("refuses a stale request version before creating an event", async () => {
    const res = await POST(
      new Request("http://localhost/api/v1/source/events", {
        method: "POST",
        body: JSON.stringify({
          sourceRequest: {
            requestId: importedRequest.requestId,
            sourceVersion: "stale-version",
            decisionState: "accepted",
            rationale: "Scope and buying motion confirmed.",
          },
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(createSourcingEvent).not.toHaveBeenCalled();
  });
});
