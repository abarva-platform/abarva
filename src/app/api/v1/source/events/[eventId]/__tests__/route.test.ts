const eventRow = {
  id: "event-1",
  client_key: "apex-retail",
  trigger_description: "Old trigger.",
  scope_description: "Existing scope.",
  decision_owner: "CIO",
  estimated_value_usd: 1_000_000,
};

const updateEventIntake = jest.fn(async () => ({ ok: true }));
const insertActivityLog = jest.fn(async () => ({ ok: true }));
const maybeSingle = jest.fn(
  async (): Promise<{ data: typeof eventRow | null; error: null }> => ({
    data: eventRow,
    error: null,
  }),
);

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    email: "admin@example.test",
    role: "client_admin",
  })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "tenancy" })),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "apex-retail" })),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
    accessLevel: "client_admin",
  })),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: jest.fn(() => {
      const query: Record<string, jest.Mock> = {
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle,
      };
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      return query;
    }),
  })),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    updateEventIntake,
    insertActivityLog,
  })),
}));

jest.mock("@/lib/source/canvas-substrate/event-intake-sync", () => ({
  syncEventIntakeEvidence: jest.fn(async () => true),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: jest.fn(async () => null),
}));

import { PATCH } from "../route";
import type { NextRequest } from "next/server";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { syncEventIntakeEvidence } from "@/lib/source/canvas-substrate/event-intake-sync";

const mockLoadUserSourceAccessPolicy = jest.mocked(loadUserSourceAccessPolicy);
const mockSyncEventIntakeEvidence = jest.mocked(syncEventIntakeEvidence);

function correctionRequest(body: Record<string, unknown>) {
  return new Request("https://app.abarva.ai/api/v1/source/events/event-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("PATCH Source event intake", () => {
  beforeEach(() => {
    updateEventIntake.mockClear();
    insertActivityLog.mockClear();
    maybeSingle.mockClear();
    maybeSingle.mockResolvedValue({ data: eventRow, error: null });
    mockSyncEventIntakeEvidence.mockClear();
    mockLoadUserSourceAccessPolicy.mockResolvedValue({
      canApproveSourceStages: true,
      accessLevel: "client_admin",
    } as never);
  });

  it("requires an explicit confirmation and human reason", async () => {
    const response = await PATCH(
      correctionRequest({ triggerDescription: "Corrected trigger." }),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );
    expect(response.status).toBe(409);
    expect(updateEventIntake).not.toHaveBeenCalled();
  });

  it("tenant-scopes and audits a governed intake correction", async () => {
    const response = await PATCH(
      correctionRequest({
        confirmed: true,
        reason: "Correct the renewal dates to match the executed agreement.",
        triggerDescription: "Corrected renewal trigger.",
        estimatedValueUsd: 2_000_000,
      }),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );
    expect(response.status).toBe(200);
    expect(updateEventIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "event-1",
        clientKey: "apex-retail",
        triggerDescription: "Corrected renewal trigger.",
        estimatedValueUsd: 2_000_000,
      }),
    );
    expect(mockSyncEventIntakeEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceEventId: "event-1",
        tenantKey: "apex-retail",
        triggerDescription: "Corrected renewal trigger.",
      }),
    );
    expect(insertActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "source_event_intake_corrected",
        reason: "Correct the renewal dates to match the executed agreement.",
      }),
    );
  });

  it("fails closed without Source stage-approval authority", async () => {
    mockLoadUserSourceAccessPolicy.mockResolvedValueOnce({
      canApproveSourceStages: false,
    } as never);
    const response = await PATCH(
      correctionRequest({
        confirmed: true,
        reason: "Correct the renewal dates to match the executed agreement.",
        triggerDescription: "Corrected renewal trigger.",
      }),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );
    expect(response.status).toBe(403);
    expect(updateEventIntake).not.toHaveBeenCalled();
  });

  it("returns not found when the event is outside the active tenant", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const response = await PATCH(
      correctionRequest({
        confirmed: true,
        reason: "Correct the renewal dates to match the executed agreement.",
        triggerDescription: "Corrected renewal trigger.",
      }),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );
    expect(response.status).toBe(404);
    expect(updateEventIntake).not.toHaveBeenCalled();
  });
});
