const eventRow = {
  id: "event-1",
  lifecycle_state: "waiting_on_client",
  current_stage_key: "rfp",
  event_name: "Sourcing event",
  event_code: "SRC-001",
  event_type: "competitive_rfp",
  sourcing_motion: null as "competitive_rfp" | "contract_optimization" | null,
  classified_category: "ams",
  trigger_description: null,
  client_key: "skyharbor-air",
  created_by_user_id: "another-user" as string | null,
};

const applyApproval = jest.fn(async () => ({ ok: true }));
const updateStage = jest.fn(async () => ({ ok: true }));
const insertActivityLog = jest.fn(
  async () => ({ ok: true }) as { ok: boolean; error?: string },
);
const requestVersionState = {
  kind: "available" as const,
  currentVersion: {
    id: "request-version-1",
    versionNumber: 1,
    contentHash: "a".repeat(64),
  },
  approvals: [],
};

jest.mock("@/lib/source/new-workspace/authority-version-store", () => ({
  readSourceAuthorityVersionState: jest.fn(async () => requestVersionState),
}));
jest.mock("@/lib/source/sponsor-delegation-repository", () => ({
  hasVerifiedSponsorDelegation: jest.fn(async () => false),
}));
const stageSubstrate = {
  criteria: [] as Array<Record<string, unknown>>,
  artifacts: [],
  evidence: [],
};

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
  getActiveClientRow: jest.fn(async () => ({ key: "skyharbor" })),
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
    insertActivityLog,
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
  getStageSubstrate: jest.fn(async () => stageSubstrate),
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
import type { ClientKey } from "@/lib/client-config";
import { autoDraftOnStageEntry } from "@/lib/source/stage-entry-autodraft";
import { getContractOptimizationProfile } from "@/lib/source/contract-optimization/read";
import { isGateApprovalStrictMode } from "@/lib/auth/gate-approval-strict-mode";
import { evaluateSourceGateAdvanceContract } from "@/lib/source/gate-advance-contract";
import { SOURCE_APPROVAL_REASON_MIN_LENGTH } from "@/lib/source/source-governance-enforcement";

const mockAfter = jest.mocked(after);
const mockAutoDraftOnStageEntry = jest.mocked(autoDraftOnStageEntry);
const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockGetContractOptimizationProfile = jest.mocked(
  getContractOptimizationProfile,
);
const mockIsGateApprovalStrictMode = jest.mocked(isGateApprovalStrictMode);
const mockGateAdvance = jest.mocked(evaluateSourceGateAdvanceContract);

// `key` is what `getActiveClientRow` returns, which is `tenant.appClientKey` —
// the app-tier ClientKey, not the canonical key. This helper used to take a
// bare `string`, and every caller passed a value that is not a tenant key.
function activeClientRow(key: ClientKey) {
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
    insertActivityLog.mockClear();
    insertActivityLog.mockResolvedValue({ ok: true });
    mockGetActiveClientRow.mockResolvedValue(activeClientRow("skyharbor"));
    mockGetContractOptimizationProfile.mockResolvedValue(null);
    applyApproval.mockResolvedValue({ ok: true });
    updateStage.mockResolvedValue({ ok: true });
    eventRow.current_stage_key = "rfp";
    eventRow.client_key = "skyharbor-air";
    eventRow.sourcing_motion = null;
    eventRow.created_by_user_id = "another-user";
    mockIsGateApprovalStrictMode.mockReturnValue(false);
    stageSubstrate.criteria = [];
    mockGateAdvance.mockImplementation(() => ({
      ok: true,
      status: 200,
      readiness: { ok: true, blockers: [] },
      bypassedGovernanceBlockers: [],
    }));
  });

  it("binds the initial intake approval to the exact current Request version", async () => {
    eventRow.current_stage_key = "strategy";
    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/v1/source/events/event-1/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action: "approve",
            notes:
              "Reviewed the governed intake and accept this exact version.",
            requestAuthorityVersionId: "request-version-1",
            confirmations: {
              strategyMemoReviewed: true,
              valueTargetConfirmed: true,
              archetypeRigorConfirmed: true,
            },
          }),
        },
      ),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );

    expect(response.status).toBe(200);
    expect(applyApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        authorityApproval: {
          authorityKind: "request",
          versionId: "request-version-1",
          role: "request_acceptor",
          decision: "approved",
          actorUserId: "user-1",
          reason: "Reviewed the governed intake and accept this exact version.",
        },
      }),
    );
  });

  it("refuses a stale Request version before writing the intake approval", async () => {
    eventRow.current_stage_key = "strategy";
    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/v1/source/events/event-1/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action: "approve",
            notes:
              "Reviewed the governed intake and accept this exact version.",
            requestAuthorityVersionId: "request-version-old",
            confirmations: {
              strategyMemoReviewed: true,
              valueTargetConfirmed: true,
              archetypeRigorConfirmed: true,
            },
          }),
        },
      ),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "request_authority_version_changed",
    });
    expect(applyApproval).not.toHaveBeenCalled();
  });

  it("does not approve or advance past a pending strategy criterion on self-approval", async () => {
    eventRow.current_stage_key = "strategy";
    stageSubstrate.criteria = [
      {
        criterionId: "GATE-STRATEGY-01",
        fromStage: "strategy",
        state: "pending",
      },
    ];
    mockGateAdvance.mockImplementationOnce(
      jest.requireActual<typeof import("@/lib/source/gate-advance-contract")>(
        "@/lib/source/gate-advance-contract",
      ).evaluateSourceGateAdvanceContract,
    );

    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/v1/source/events/event-1/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action: "approve",
            notes: "Sponsor requests an early strategy advance.",
            selfApproveIfAuthorized: true,
            confirmations: {
              strategyMemoReviewed: true,
              valueTargetConfirmed: true,
              archetypeRigorConfirmed: true,
            },
          }),
        },
      ),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );

    expect(response.status).toBe(409);
    expect((await response.json()).blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "gate_criterion_open" }),
      ]),
    );
    expect(applyApproval).not.toHaveBeenCalled();
    expect(updateStage).not.toHaveBeenCalled();
  });

  /**
   * Lifecycle decisions were the one Source action missing from the activity
   * table that sibling routes write to. The decision is logged once the
   * approval record commits — the human decided even if stage advancement
   * later fails — and a failed activity write never fails a committed
   * approval.
   */
  describe("activity log", () => {
    const decide = (action: string) =>
      new Request(
        "https://app.abarva.ai/api/v1/source/events/event-1/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            notes: "Sponsor confirms RFP gate is ready to advance.",
            confirmations: {
              evidenceComplete: true,
              exclusionsReviewed: true,
              stageFinal: true,
            },
          }),
        },
      );

    it("records the approval decision with actor, stage and lifecycle states", async () => {
      const response = await POST(decide("approve"), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(response.status).toBe(200);
      expect(insertActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: "event-1",
          // The route forwards `activeClient.key`, which is the app-tier
          // ClientKey. This expectation read "skyharbor-air" — the canonical
          // key — only because the fixture supplied one. Both sides of this
          // boundary are typed `string`, so nothing distinguished them.
          clientKey: "skyharbor",
          actorUserId: "user-1",
          actionType: "source_event_approved",
          stageKey: "rfp",
          metadata: expect.objectContaining({
            toState: "active",
            selfApproval: false,
          }),
        }),
      );
    });

    it("marks a self-approval in the activity metadata", async () => {
      eventRow.created_by_user_id = "user-1";

      await POST(decide("approve"), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(insertActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ selfApproval: true }),
        }),
      );
    });

    it("gives a rejection its own action type", async () => {
      await POST(decide("reject"), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(insertActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: "source_event_rejected" }),
      );
    });

    it("does not fail an approval that already committed when the activity write fails", async () => {
      insertActivityLog.mockResolvedValue({
        ok: false,
        error: "insert_failed",
      });
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const response = await POST(decide("approve"), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(response.status).toBe(200);
      // Loud, not swallowed: the audit hole this closes was invisible for weeks.
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("activity_insert_failed"),
        expect.objectContaining({ eventId: "event-1" }),
      );
      consoleError.mockRestore();
    });
  });

  /**
   * The approval screen tells a self-approving creator that the decision is
   * flagged. Whether a decision is a self-approval is a fact about the stored
   * creator and the caller, so the server derives it rather than trusting a
   * client-supplied flag that a caller can simply omit.
   */
  describe("self-approval", () => {
    const approveRequest = (body: Record<string, unknown> = {}) =>
      new Request(
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
            ...body,
          }),
        },
      );

    it("records the notice when the creator approves, without a client flag", async () => {
      eventRow.created_by_user_id = "user-1";

      const response = await POST(approveRequest(), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(response.status).toBe(200);
      expect(applyApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.stringContaining(
            "Self-approval notice: the approver is the recorded event creator.",
          ),
        }),
      );
    });

    it("does not mark an ordinary approval as a self-approval", async () => {
      const response = await POST(approveRequest(), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(response.status).toBe(200);
      expect(applyApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.not.stringContaining("Self-approval notice"),
        }),
      );
    });

    it("refuses a strict-mode self-approval even when the client omits the flag", async () => {
      eventRow.created_by_user_id = "user-1";
      mockIsGateApprovalStrictMode.mockReturnValue(true);

      const response = await POST(approveRequest(), {
        params: Promise.resolve({ eventId: "event-1" }),
      });

      expect(response.status).toBe(403);
      expect(applyApproval).not.toHaveBeenCalled();
    });
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
        clientKey: "skyharbor",
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

  it("honors an explicit competitive journey even when an optimization profile exists", async () => {
    eventRow.current_stage_key = "scope";
    eventRow.client_key = "client-a";
    eventRow.sourcing_motion = "competitive_rfp";
    mockGetActiveClientRow.mockResolvedValueOnce(activeClientRow("arcturus"));
    mockGetContractOptimizationProfile.mockResolvedValueOnce({
      eventId: "event-1",
    } as never);

    const request = new Request(
      "https://app.abarva.ai/api/v1/source/events/event-1/approve",
      {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes:
            "Sponsor confirms the scope gate is ready for the market event.",
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
    expect(updateStage).toHaveBeenCalledWith(
      expect.objectContaining({ stageKey: "rfp" }),
    );
  });

  it("persists completed when approving the terminal Value stage", async () => {
    eventRow.current_stage_key = "value";
    eventRow.sourcing_motion = "competitive_rfp";

    const request = new Request(
      "https://app.abarva.ai/api/v1/source/events/event-1/approve",
      {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes: "Sponsor confirms the final value gate is complete.",
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

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      newLifecycleState: "completed",
      stageAdvancedTo: null,
    });
    expect(applyApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        toState: "completed",
        stageKey: "value",
      }),
    );
    expect(updateStage).not.toHaveBeenCalled();
  });

  it("refuses terminal completion when computed Value readiness is still open", async () => {
    eventRow.current_stage_key = "value";
    eventRow.sourcing_motion = "competitive_rfp";
    stageSubstrate.criteria = [
      {
        criterionId: "GATE-VAL-01",
        fromStage: "value",
        toStage: "closed",
        state: "pending",
      },
    ];
    mockGateAdvance.mockImplementationOnce(
      jest.requireActual<typeof import("@/lib/source/gate-advance-contract")>(
        "@/lib/source/gate-advance-contract",
      ).evaluateSourceGateAdvanceContract,
    );

    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/v1/source/events/event-1/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action: "approve",
            notes: "Sponsor confirms the final value gate is complete.",
            confirmations: {
              evidenceComplete: true,
              exclusionsReviewed: true,
              stageFinal: true,
            },
          }),
        },
      ),
      { params: Promise.resolve({ eventId: "event-1" }) },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "gate_criterion_open",
    });
    expect(applyApproval).not.toHaveBeenCalled();
    expect(insertActivityLog).not.toHaveBeenCalled();
    expect(updateStage).not.toHaveBeenCalled();
  });

  /**
   * Every lifecycle decision on this route is an audit record. Three sibling
   * lifecycle routes (`request-changes`, `route-to-co-approver`, and the event
   * PATCH) already run `validateApprovalReason` server-side; this one did not,
   * so `reject` and `send_back` committed an archived or returned event with a
   * null reason whenever a caller skipped the UI. The approval card and the
   * admin queue enforce the same minimum client-side, which is not a control.
   */
  describe("audit rationale", () => {
    const decideWith = (action: string, notes?: unknown) =>
      new Request(
        "https://app.abarva.ai/api/v1/source/events/event-1/approve",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            ...(notes === undefined ? {} : { notes }),
            confirmations: {
              evidenceComplete: true,
              exclusionsReviewed: true,
              stageFinal: true,
            },
          }),
        },
      );

    it.each(["approve", "reject", "send_back"])(
      "refuses %s with no rationale and writes nothing",
      async (action) => {
        const response = await POST(decideWith(action), {
          params: Promise.resolve({ eventId: "event-1" }),
        });
        const payload = await response.json();

        expect(response.status).toBe(409);
        expect(payload.error).toBe("approval_reason_required");
        expect(applyApproval).not.toHaveBeenCalled();
        expect(insertActivityLog).not.toHaveBeenCalled();
        expect(updateStage).not.toHaveBeenCalled();
      },
    );

    it.each(["approve", "reject", "send_back"])(
      "refuses %s with a rationale shorter than the governed minimum",
      async (action) => {
        const response = await POST(decideWith(action, "no"), {
          params: Promise.resolve({ eventId: "event-1" }),
        });
        const payload = await response.json();

        expect(response.status).toBe(409);
        expect(payload.error).toBe("approval_reason_required");
        expect(payload.detail).toContain(
          String(SOURCE_APPROVAL_REASON_MIN_LENGTH),
        );
        expect(applyApproval).not.toHaveBeenCalled();
      },
    );

    it("refuses whitespace padded to the minimum length", async () => {
      const response = await POST(
        decideWith("reject", " ".repeat(SOURCE_APPROVAL_REASON_MIN_LENGTH + 4)),
        { params: Promise.resolve({ eventId: "event-1" }) },
      );

      expect(response.status).toBe(409);
      expect(applyApproval).not.toHaveBeenCalled();
    });

    it.each(["reject", "send_back"])(
      "still commits %s when the rationale meets the minimum",
      async (action) => {
        const response = await POST(
          decideWith(action, "Sponsor withdrew the mandate for this cycle."),
          { params: Promise.resolve({ eventId: "event-1" }) },
        );

        expect(response.status).toBe(200);
        expect(applyApproval).toHaveBeenCalledWith(
          expect.objectContaining({
            approvalAction: action === "reject" ? "rejected" : "sent_back",
          }),
        );
      },
    );
  });
});
