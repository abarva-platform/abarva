import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  linkServiceNowRequestToEvent,
  recordServiceNowRequestMappingDecision,
} from "../servicenow-request-event-authority";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const getClient = getAzureWriteFluentClient as jest.Mock;

describe("ServiceNow request event authority writes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("records a named append-only mapping decision without creating an event", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn().mockReturnValue({ upsert });
    getClient.mockReturnValue({ from });

    await recordServiceNowRequestMappingDecision({
      tenantKey: "tenant-a",
      requestId: "servicenow:table:row-1",
      decision: {
        decisionId: "mapping-1",
        state: "accepted",
        categoryId: "bpo_contact_centre",
        archetypeId: "CONTACT_CENTER_CX",
        decidedByUserId: "person-1",
        decidedByName: "Procurement Lead",
        decidedAt: "2026-09-22T13:00:00.000Z",
        rationale: "Scope and buying motion confirmed.",
        sourceVersion: "v1",
      },
    });

    expect(from).toHaveBeenCalledWith("source.intake_request_mapping_decision");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_key: "tenant-a",
        request_id: "servicenow:table:row-1",
        decision_id: "mapping-1",
        decided_by_name: "Procurement Lead",
      }),
      { onConflict: "tenant_key,decision_id", ignoreDuplicates: true },
    );
  });

  it("links the exact request version to one created event without approving it", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn().mockReturnValue({ upsert });
    getClient.mockReturnValue({ from });

    await linkServiceNowRequestToEvent({
      tenantKey: "tenant-a",
      requestId: "servicenow:table:row-1",
      sourceVersion: "v1",
      sourceEventId: "11111111-1111-4111-8111-111111111111",
      linkedByUserId: "person-1",
      linkedByName: "Procurement Lead",
      linkedAt: "2026-09-22T13:01:00.000Z",
      rationale: "Created after named mapping review.",
    });

    expect(from).toHaveBeenCalledWith("source.intake_request_event_link");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        source_event_id: "11111111-1111-4111-8111-111111111111",
        linked_by_name: "Procurement Lead",
        rationale: "Created after named mapping review.",
      }),
      { onConflict: "tenant_key,request_id", ignoreDuplicates: true },
    );
  });

  it("surfaces authority-write failures", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: { message: "write failed" } });
    getClient.mockReturnValue({ from: jest.fn().mockReturnValue({ upsert }) });

    await expect(
      recordServiceNowRequestMappingDecision({
        tenantKey: "tenant-a",
        requestId: "servicenow:table:row-1",
        decision: {
          decisionId: "mapping-1",
          state: "accepted",
          categoryId: "bpo_contact_centre",
          archetypeId: "CONTACT_CENTER_CX",
          decidedByUserId: "person-1",
          decidedByName: "Procurement Lead",
          decidedAt: "2026-09-22T13:00:00.000Z",
          rationale: "Scope and buying motion confirmed.",
          sourceVersion: "v1",
        },
      }),
    ).rejects.toThrow("write failed");
  });
});
