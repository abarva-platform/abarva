jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    clientId: "client-1",
    clientKey: "skyharbor-air",
    userId: "user-1",
  })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "auth" }, { status: 401 })),
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

jest.mock("@/lib/source/queries", () => ({
  createSourcingEvent: jest.fn(async () => ({
    id: "evt-123",
    code: "SRC-123",
    name: "Data platform sourcing",
  })),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    insertParticipant: jest.fn(async () => ({ ok: true })),
  })),
}));

import { POST } from "../route";
import { createSourcingEvent } from "@/lib/source/queries";

describe("POST /api/v1/source/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(createSourcingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "data_ai_platform",
        sourcingMotion: "competitive_rfp",
      }),
    );
  });
});
