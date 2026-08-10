const eventRow = {
  id: "event-1",
  lifecycle_state: "waiting_on_client",
  current_stage_key: "rfp",
  event_name: "Sourcing event",
  event_code: "SRC-001",
  event_type: "competitive_rfp",
  classified_category: "ams",
  trigger_description: null,
  client_key: "skyharbor-air",
};

const applyApproval = jest.fn(async () => ({ ok: true }));
const updateStage = jest.fn(async () => ({ ok: true }));

jest.mock("next/server", () => ({
  after: jest.fn((task: () => void | Promise<void>) => {
    void task();
  }),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    role: "client_admin",
  })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "tenancy" })),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "skyharbor-air" })),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
  })),
}));

jest.mock("@/lib/auth/gate-approval-strict-mode", () => ({
  isGateApprovalStrictMode: jest.fn(() => false),
  isStrictModeApprovalRole: jest.fn(() => true),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: jest.fn(() => {
      const query: {
        select: jest.Mock;
        eq: jest.Mock;
        single: jest.Mock;
      } = {
        select: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(async () => ({ data: eventRow, error: null })),
      };
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      return query;
    }),
  })),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    applyApproval,
    updateStage,
  })),
}));

jest.mock("@/lib/source/stage-entry-autodraft", () => ({
  autoDraftOnStageEntry: jest.fn(async () => ({
    queued: ["d09_rfp_pack"],
    generated: ["d09_rfp_pack"],
    skipped: [],
    failed: [],
  })),
}));

jest.mock("@/lib/source/canvas-substrate/queries", () => ({
  getStageSubstrate: jest.fn(async () => ({
    criteria: [],
    artifacts: [],
    evidence: [],
  })),
}));

jest.mock("@/lib/source/gate-advance-contract", () => ({
  evaluateSourceGateAdvanceContract: jest.fn(() => ({
    ok: true,
    status: 200,
    readiness: { ok: true, blockers: [] },
    bypassedGovernanceBlockers: [],
  })),
}));

jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: jest.fn(async () => null),
}));

import { POST } from "../route";
import { after } from "next/server";
import { getActiveClientRow } from "@/lib/active-client";
import { autoDraftOnStageEntry } from "@/lib/source/stage-entry-autodraft";
import { getContractOptimizationProfile } from "@/lib/source/contract-optimization/read";

const mockAfter = jest.mocked(after);
const mockAutoDraftOnStageEntry = jest.mocked(autoDraftOnStageEntry);
const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockGetContractOptimizationProfile = jest.mocked(
  getContractOptimizationProfile,
);

function activeClientRow(key: string) {
  return {
    id: `client-${key}`,
    key,
    name: key,
    industry_code: null,
  };
}

describe("POST Source event approve", () => {
  beforeEach(() => {
    mockAutoDraftOnStageEntry.mockClear();
    mockAfter.mockClear();
    applyApproval.mockClear();
    updateStage.mockClear();
    mockGetActiveClientRow.mockResolvedValue(activeClientRow("skyharbor-air"));
    mockGetContractOptimizationProfile.mockResolvedValue(null);
    applyApproval.mockResolvedValue({ ok: true });
    updateStage.mockResolvedValue({ ok: true });
    eventRow.current_stage_key = "rfp";
    eventRow.client_key = "skyharbor-air";
  });

  it("auto-drafts the approved stage's gate artifacts with the signed-in request context", async () => {
    const request = new Request(
      "https://app.abarva.ai/api/v1/source/events/event-1/approve",
      {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes: "Sponsor confirms RFP gate is ready to advance.",
          confirmations: {
            evidenceComplete: true,
            exclusionsReviewed: true,
            stageFinal: true,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ eventId: "event-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(mockAutoDraftOnStageEntry).toHaveBeenCalledWith(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        enteredStage: "rfp",
      },
      { request },
    );
    expect(updateStage).toHaveBeenCalledWith(
      expect.objectContaining({ stageKey: "responses" }),
    );
  });

  it("fails closed when the approval record writes but stage advancement fails", async () => {
    updateStage.mockResolvedValueOnce({
      ok: false,
      error: "stage update rejected",
    } as never);

    const request = new Request(
      "https://app.abarva.ai/api/v1/source/events/event-1/approve",
      {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes: "Sponsor confirms RFP gate is ready to advance.",
          confirmations: {
            evidenceComplete: true,
            exclusionsReviewed: true,
            stageFinal: true,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ eventId: "event-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("stage_advance_failed");
    expect(payload.stageAdvancedTo).toBeUndefined();
  });

  it("fails closed when approval persistence is rejected", async () => {
    applyApproval.mockResolvedValueOnce({
      ok: false,
      error:
        "approval record insert failed: permission denied for source_event_approvals",
    } as never);

    const request = new Request(
      "https://app.abarva.ai/api/v1/source/events/event-1/approve",
      {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes: "Sponsor confirms RFP gate is ready to advance.",
          confirmations: {
            evidenceComplete: true,
            exclusionsReviewed: true,
            stageFinal: true,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ eventId: "event-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("update_failed");
    expect(payload.detail).toContain("approval record insert failed");
    expect(updateStage).not.toHaveBeenCalled();
  });

  it("uses a contract optimization profile for any tenant, not only SkyHarbor aliases", async () => {
    eventRow.current_stage_key = "pricing";
    eventRow.client_key = "meridian";
    mockGetActiveClientRow.mockResolvedValueOnce(activeClientRow("meridian"));
    mockGetContractOptimizationProfile.mockResolvedValueOnce({
      eventId: "event-1",
    } as never);

    const request = new Request(
      "https://app.abarva.ai/api/v1/source/events/event-1/approve",
      {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes: "Sponsor confirms the commercial baseline is ready.",
          confirmations: {
            evidenceComplete: true,
            exclusionsReviewed: true,
            stageFinal: true,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ eventId: "event-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetContractOptimizationProfile).toHaveBeenCalledWith(
      "meridian",
      "event-1",
    );
    expect(updateStage).toHaveBeenCalledWith(
      expect.objectContaining({ stageKey: "bafo" }),
    );
  });
});
