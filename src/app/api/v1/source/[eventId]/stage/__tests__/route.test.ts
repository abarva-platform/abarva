const persistedEvent = {
  id: "event-1",
  client_key: "skyharbor-air",
  current_stage_key: "rfp",
  lifecycle_state: "active",
};

const updateStage = jest.fn(async () => ({ ok: true }));
const insertActivityLog = jest.fn(async () => ({ ok: true }));
let criterionRows: Array<Record<string, unknown>> = [];

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
        then: jest.Mock;
      } = {
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle: jest.fn(),
        then: jest.fn((resolve: (value: unknown) => void) =>
          resolve({
            data:
              table === "source_event_gate_criterion_states"
                ? criterionRows
                : [],
            error: null,
          }),
        ),
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
import { evaluateSourceGateAdvanceContract } from "@/lib/source/gate-advance-contract";

const mockAutoDraftOnStageEntry = jest.mocked(autoDraftOnStageEntry);

describe("PATCH /api/v1/source/[eventId]/stage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    criterionRows = [];
    persistedEvent.current_stage_key = "rfp";
    jest.mocked(evaluateSourceGateAdvanceContract).mockImplementation(() => ({
      ok: true,
      status: 200,
      readiness: { ok: true, blockers: [] },
      bypassedGovernanceBlockers: [],
    }));
  });

  it("does not advance a strategy event with a pending hard criterion on self-approval", async () => {
    persistedEvent.current_stage_key = "strategy";
    criterionRows = [
      {
        id: "criterion-1",
        source_event_id: "event-1",
        tenant_key: "skyharbor-air",
        criterion_id: "GATE-STRATEGY-01",
        from_stage: "strategy",
        to_stage: "scope",
        state: "pending",
        reviewer_user_id: null,
        reviewed_at: null,
        notes: null,
        evidence_artifact_ids: [],
        waiver_approval_id: null,
        created_at: "2026-09-18T00:00:00Z",
        updated_at: "2026-09-18T00:00:00Z",
      },
    ];
    jest
      .mocked(evaluateSourceGateAdvanceContract)
      .mockImplementationOnce(
        jest.requireActual<typeof import("@/lib/source/gate-advance-contract")>(
          "@/lib/source/gate-advance-contract",
        ).evaluateSourceGateAdvanceContract,
      );

    const response = await PATCH(
      new Request("https://app.abarva.ai/api/v1/source/event-1/stage", {
        method: "PATCH",
        body: JSON.stringify({
          stageKey: "scope",
          reason: "Sponsor requests an early strategy advance.",
          selfApproveIfAuthorized: true,
          confirmations: {
            strategyMemoReviewed: true,
            valueTargetConfirmed: true,
            archetypeRigorConfirmed: true,
          },
        }),
      }) as never,
      { params: Promise.resolve({ eventId: "event-1" }) },
    );

    expect(response.status).toBe(409);
    expect((await response.json()).blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "gate_criterion_open" }),
      ]),
    );
    expect(updateStage).not.toHaveBeenCalled();
    expect(insertActivityLog).not.toHaveBeenCalled();
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
