import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  linkServiceNowRequestToEvent,
  recordServiceNowRequestMappingDecision,
  readServiceNowRequestDisposition,
  recordServiceNowRequestDisposition,
} from "../servicenow-request-event-authority";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: jest.fn() },
}));

const getClient = getAzureWriteFluentClient as jest.Mock;
const query = azureRead.query as jest.Mock;

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

  it("reads a request disposition only for the exact tenant and version", async () => {
    query.mockResolvedValueOnce([{ disposition_state: "returned" }]);

    await expect(
      readServiceNowRequestDisposition({
        tenantKey: "tenant-a",
        requestId: "servicenow:table:row-1",
        sourceVersion: "v2",
      }),
    ).resolves.toEqual({ disposition_state: "returned" });
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/tenant_key = \$1 AND request_id = \$2 AND source_version = \$3/),
      ["tenant-a", "servicenow:table:row-1", "v2"],
    );
  });

  it("does not turn an unavailable disposition relation into an empty decision", async () => {
    query.mockRejectedValueOnce(new Error("relation missing"));
    await expect(
      readServiceNowRequestDisposition({
        tenantKey: "tenant-a",
        requestId: "servicenow:table:row-1",
        sourceVersion: "v1",
      }),
    ).rejects.toThrow("relation missing");
  });

  it("records a named request disposition with no upsert or event mutation", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn().mockReturnValue({ insert });
    getClient.mockReturnValue({ from });

    await recordServiceNowRequestDisposition({
      tenantKey: "tenant-a",
      requestId: "servicenow:table:row-1",
      sourceVersion: "v1",
      state: "merged",
      survivingRequestId: "servicenow:table:row-2",
      survivingSourceVersion: "v1",
      rationale: "Duplicate of the surviving request.",
      decidedByUserId: "person-1",
      decidedByName: "Procurement Lead",
    });

    expect(from).toHaveBeenCalledWith("source.intake_request_disposition");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_key: "tenant-a",
        request_id: "servicenow:table:row-1",
        source_version: "v1",
        disposition_state: "merged",
        surviving_request_id: "servicenow:table:row-2",
        surviving_source_version: "v1",
        decided_by_user_id: "person-1",
      }),
    );
  });
});
