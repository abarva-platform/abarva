const persistedEvent = {
  id: "event-1",
  client_key: "skyharbor-air",
  current_stage_key: "rfp",
  lifecycle_state: "active",
};

const updateStage = jest.fn(async () => ({ ok: true }));
const insertActivityLog = jest.fn(async () => ({ ok: true }));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    clientKey: "skyharbor-air",
    userId: "user-1",
    role: "admin",
  })),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ error: "auth" }, { status: 401 }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    key: "skyharbor-air",
  })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({
    personId: "person-1",
    clerkUserId: "user-1",
    email: "qa@example.com",
    metadataClientKey: "skyharbor-air",
    name: "QA User",
    primaryRole: "admin",
  })),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
  })),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    updateStage,
    insertActivityLog,
  })),
}));

jest.mock("@/lib/source/queries", () => ({
  resolveSourceEventUuidForClient: jest.fn(async () => "event-1"),
  scaffoldNewEventSubstrate: jest.fn(async () => undefined),
}));

jest.mock("@/lib/source/canvas-substrate/queries", () => ({
  getStageSubstrate: jest.fn(async () => ({
    criteria: [],
    artifacts: [],
    evidence: [],
  })),
}));

jest.mock("@/lib/source/gate-auto-assessment-persist", () => ({
  persistAutoAssessment: jest.fn(async () => ({ ok: true })),
}));

jest.mock("@/lib/source/gate-advance-contract", () => ({
  evaluateSourceGateAdvanceContract: jest.fn(() => ({
    ok: true,
    status: 200,
    readiness: { ok: true, blockers: [] },
    bypassedGovernanceBlockers: [],
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

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      const query: {
        select: jest.Mock;
        eq: jest.Mock;
        maybeSingle: jest.Mock;
      } = {
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle: jest.fn(),
      };
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      query.maybeSingle.mockImplementation(async () => {
        if (table === "source_events") {
          return { data: persistedEvent, error: null };
        }
        return { data: null, error: null };
      });
      return query;
    }),
  })),
}));

import { PATCH } from "../route";
import { autoDraftOnStageEntry } from "@/lib/source/stage-entry-autodraft";

const mockAutoDraftOnStageEntry = jest.mocked(autoDraftOnStageEntry);

describe("PATCH /api/v1/source/[eventId]/stage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auto-drafts the approved stage, not the next stage entered", async () => {
    const request = new Request(
      "https://app.abarva.ai/api/v1/source/event-1/stage",
      {
        method: "PATCH",
        body: JSON.stringify({
          stageKey: "responses",
          reason: "RFP gate approved for QA verification.",
          confirmations: {
            evidenceComplete: true,
            exclusionsReviewed: true,
            stageFinal: true,
          },
          selfApproveIfAuthorized: true,
        }),
      },
    );

    const response = await PATCH(request as never, {
      params: Promise.resolve({ eventId: "event-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        eventId: "event-1",
        stageKey: "responses",
        persisted: true,
      }),
    );
    expect(updateStage).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "event-1",
        clientKey: "skyharbor-air",
        stageKey: "responses",
      }),
    );
    expect(mockAutoDraftOnStageEntry).toHaveBeenCalledWith(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        enteredStage: "rfp",
      },
      { request },
    );
  });
});
