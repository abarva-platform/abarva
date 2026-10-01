import SourceEventDetailPage from "@/app/(maestro)/source/events/[eventId]/page";
import { getSourcingEventWithReadContext } from "@/lib/source/queries";
import { requireTenancy } from "@/lib/auth/tenancy";
import {
  readEventFacts,
  readRfpClausePresentLeverKeys,
} from "@/lib/source/facts/event-facts-reader";
import { resolveValueArchetype } from "@/lib/source/facts/view/stage-analytics-builder";

jest.mock("next/navigation", () => ({ notFound: jest.fn(() => { throw new Error("notFound"); }) }));
jest.mock("@/components/source/canvas/analytics", () => ({
  SourceAnalyticsCanvas: jest.fn(),
}));
jest.mock("@/lib/source/queries", () => ({
  getSourcingEventWithReadContext: jest.fn(),
  isUuid: jest.fn(() => false),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(() => { throw new Error("independent client lookup must not run"); }),
}));
jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: jest.fn(async () => []),
}));
jest.mock("@/lib/source/file-cabinet/repository", () => ({
  listSourceArtifacts: jest.fn(async () => []),
}));
jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: jest.fn(async () => null),
}));
jest.mock("@/lib/source/canvas-substrate", () => ({
  listArtifactStatesForEventStage: jest.fn(async () => []),
  listEffectiveEvidenceStatesForEvent: jest.fn(async () => []),
  listGateCriterionStatesForEvent: jest.fn(async () => []),
}));
jest.mock("@/lib/source/approvals-inbox", () => ({
  loadApprovalsInbox: jest.fn(async () => ({ items: [], intakeCount: 0, gateReadyCount: 0 })),
}));
jest.mock("@/lib/source/approval-ledger", () => ({
  loadApprovalLedger: jest.fn(async () => []),
}));
jest.mock("@/lib/source/stage-guidebooks/repository", () => ({
  getSourceStageGuidebook: jest.fn(async () => null),
}));
jest.mock("@/lib/source/facts/event-facts-reader", () => ({
  readEventFacts: jest.fn(),
  readRfpClausePresentLeverKeys: jest.fn(),
}));
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => { throw new Error("no stage approval in test"); }),
}));

const mockedEventContext = getSourcingEventWithReadContext as jest.Mock;
const mockedTenancy = requireTenancy as jest.Mock;
const mockedFacts = readEventFacts as jest.Mock;
const mockedRfp = readRfpClausePresentLeverKeys as jest.Mock;
const eventId = "00000000-0000-4000-8000-000000000001";

async function renderRfpPage() {
  return SourceEventDetailPage({
    params: Promise.resolve({ eventId }),
    searchParams: Promise.resolve({ stage: "rfp" }),
  });
}

describe("signed-in RFP clause readback view", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTenancy.mockRejectedValue(new Error("no stage approval in test"));
    mockedEventContext.mockResolvedValue({
      event: {
        id: eventId,
        code: "SYNTHETIC-RFP-001",
        name: "Synthetic RFP",
        accountName: "Test client",
        currentStageKey: "rfp",
        eventType: "infrastructure",
        classifiedCategory: "ams",
        valueAtStakeUsd: null,
      },
      readClient: { key: "test-client", name: "Test client" },
    });
    mockedFacts.mockResolvedValue({
      inputs: { rfp_clause_present: 0 },
      citations: { rfp_clause_present: null },
    });
  });

  it("restores a complete all-zero checklist while withholding value and approval", async () => {
    const requiredKeys = resolveValueArchetype("infrastructure", "ams")!.valueLeverRules!.map((rule) => rule.key);
    mockedRfp.mockResolvedValue({
      signalPresent: true,
      presentLeverKeys: new Set<string>(),
      assessedLeverKeys: new Set(requiredKeys),
    });

    const page = await renderRfpPage();
    expect(page.props.stageView?.tasks[0].evidenceComplete).toBe(true);
    expect(page.props.stageView?.intel.provenance).toBe("live");
    expect(page.props.stageView?.waterfall).toBeUndefined();
    expect(page.props.stepInsight?.provenance).toBe("live");
    expect(page.props.stageView?.gate.action).toBeUndefined();
  });

  it("keeps a partial assessment incomplete and illustrative", async () => {
    const requiredKeys = resolveValueArchetype("infrastructure", "ams")!.valueLeverRules!.map((rule) => rule.key);
    mockedRfp.mockResolvedValue({
      signalPresent: true,
      presentLeverKeys: new Set<string>(),
      assessedLeverKeys: new Set(requiredKeys.slice(0, -1)),
    });

    const page = await renderRfpPage();
    expect(page.props.stageView).toBeUndefined();
    expect(page.props.stepInsight?.provenance).toBe("sample");
  });

  it("uses the client authorized with the event even when a second lookup is unavailable", async () => {
    mockedTenancy.mockRejectedValue(new Error("no_client"));
    const requiredKeys = resolveValueArchetype("infrastructure", "ams")!.valueLeverRules!.map((rule) => rule.key);
    mockedRfp.mockResolvedValue({
      signalPresent: true,
      presentLeverKeys: new Set<string>(),
      assessedLeverKeys: new Set(requiredKeys),
    });

    const page = await renderRfpPage();
    expect(mockedEventContext).toHaveBeenCalledWith(eventId);
    expect(jest.requireMock("@/lib/active-client").getActiveClientRow).not.toHaveBeenCalled();
    expect(mockedFacts).toHaveBeenCalledWith({ eventId, clientKey: "test-client" });
    expect(page.props.stageView?.tasks[0].evidenceComplete).toBe(true);
    expect(page.props.stageView?.gate.action).toBeUndefined();
  });

  it("does not read facts when the event lookup refuses the event", async () => {
    mockedEventContext.mockResolvedValue(null);

    await expect(renderRfpPage()).rejects.toThrow("notFound");
    expect(mockedFacts).not.toHaveBeenCalled();
  });
});
