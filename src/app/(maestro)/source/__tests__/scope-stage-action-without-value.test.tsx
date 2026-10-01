import SourceEventDetailPage from "@/app/(maestro)/source/events/[eventId]/page";

jest.mock("server-only", () => ({}));
jest.mock("next/navigation", () => ({
  notFound: () => { throw new Error("missing event"); },
}));
jest.mock("@/components/source/canvas/analytics", () => ({
  SourceAnalyticsCanvas: () => null,
}));

const getSourcingEventWithReadContext = jest.fn();
jest.mock("@/lib/source/queries", () => ({
  getSourcingEventWithReadContext: (...args: unknown[]) => getSourcingEventWithReadContext(...args),
  isUuid: () => false,
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: async () => ({ key: "test-client", name: "Test Client" }),
}));
jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: async () => [],
}));
jest.mock("@/lib/source/file-cabinet/repository", () => ({
  listSourceArtifacts: async () => [],
}));
jest.mock("@/lib/source/canvas-substrate", () => ({
  listArtifactStatesForEventStage: async () => [],
  listEffectiveEvidenceStatesForEvent: async () => [],
  listGateCriterionStatesForEvent: async () => [],
}));
jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: async () => null,
}));
jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: async () => new Map(),
}));
jest.mock("@/lib/source/approvals-inbox", () => ({
  loadApprovalsInbox: async () => ({ items: [], intakeCount: 0, gateReadyCount: 0 }),
}));
jest.mock("@/lib/source/approval-ledger", () => ({ loadApprovalLedger: async () => [] }));
jest.mock("@/lib/source/stage-guidebooks/repository", () => ({
  getSourceStageGuidebook: async () => null,
}));
jest.mock("@/lib/source/sponsor-delegation-repository", () => ({
  hasVerifiedSponsorDelegation: async () => false,
}));
jest.mock("@/lib/source/facts/event-facts-reader", () => ({
  readEventFacts: async () => ({ inputs: {}, citations: {} }),
}));
jest.mock("@/lib/source/facts/view/stage-analytics-builder", () => ({
  buildLiveStageView: () => null,
}));
jest.mock("@/lib/source/facts/view/step-insight-builder", () => ({
  buildStepInsight: () => null,
}));

const requireTenancy = jest.fn();
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancy(...args),
}));
const loadUserSourceAccessPolicy = jest.fn();
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => loadUserSourceAccessPolicy(...args),
}));

const EVENT_ID = "11111111-2222-4333-8444-555555555555";
const EVENT = {
  id: EVENT_ID,
  code: "SRC-TEST",
  name: "Synthetic internal sourcing event",
  accountName: "Test Client",
  currentStageKey: "scope",
  currentStageLabel: "Scope",
  status: "active",
  eventType: "managed_service",
  sourcingMotion: "competitive_rfp",
  approvalPolicyCode: "self_v1",
  valueAtStakeUsd: null,
};

async function pageProps(stage: string) {
  const page = await SourceEventDetailPage({
    params: Promise.resolve({ eventId: EVENT_ID }),
    searchParams: Promise.resolve({ stage }),
  });
  return page.props as { stageView?: { gate?: { action?: { eventId: string; redirectStageKey: string } } }; stageGateAction?: { eventId: string; redirectStageKey: string } };
}

beforeEach(() => {
  jest.clearAllMocks();
  getSourcingEventWithReadContext.mockResolvedValue({
    event: EVENT,
    readClient: { key: "test-client", name: "Test Client" },
  });
  requireTenancy.mockResolvedValue({ userId: "owner", clientKey: "test-client" });
  loadUserSourceAccessPolicy.mockResolvedValue({ canApproveSourceStages: true, canViewFinancialData: false });
});

describe("stage action without a computed value lever", () => {
  it("arms the authorized current Scope stage even when analytics have no live view", async () => {
    const props = await pageProps("scope");
    expect(props.stageView).toBeUndefined();
    expect(props.stageGateAction).toMatchObject({ eventId: EVENT_ID, redirectStageKey: "rfp" });
  });

  it("does not arm a future or past stage", async () => {
    expect((await pageProps("rfp")).stageGateAction).toBeUndefined();
    getSourcingEventWithReadContext.mockResolvedValue({
      event: { ...EVENT, currentStageKey: "rfp" },
      readClient: { key: "test-client", name: "Test Client" },
    });
    expect((await pageProps("scope")).stageGateAction).toBeUndefined();
  });

  it("fails closed for denied or unreadable approval policy", async () => {
    loadUserSourceAccessPolicy.mockResolvedValue({ canApproveSourceStages: false });
    expect((await pageProps("scope")).stageGateAction).toBeUndefined();
    loadUserSourceAccessPolicy.mockRejectedValue(new Error("policy unavailable"));
    expect((await pageProps("scope")).stageGateAction).toBeUndefined();
    requireTenancy.mockRejectedValue(new Error("session unavailable"));
    expect((await pageProps("scope")).stageGateAction).toBeUndefined();
  });
});
