import { SAMPLE_SCOPE_STAGE } from "@/components/source/canvas/analytics/sample-view-model";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import { buildSourceEventShellView } from "@/lib/source/source-event-shell-v2";
import type { SourcingEventSummary } from "@/lib/source/types";

const EVENT: SourcingEventSummary = {
  id: "event-1",
  code: "SRC-AMS-01",
  name: "FS Demo AMS Consolidation 2026",
  accountName: "FS Demo",
  leadAgent: "Sentinel",
  archetype: "Managed Services",
  rigor: "strategic",
  status: "active",
  statusLabel: "Active",
  priority: "high",
  currentStageKey: "responses",
  currentStageLabel: "Responses",
  openAlerts: 0,
  owner: "CIO",
  decisionOwner: "K. Oshima",
  agingDays: 17,
  blocker: null,
  nextAction: "Collect vendor responses",
  isAtRisk: false,
  valueAtStakeUsd: 42_000_000,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Advance from Responses",
};

const APPROVAL: ApprovalsInboxItem = {
  kind: "stage_gate",
  eventId: EVENT.id,
  eventCode: EVENT.code,
  eventName: EVENT.name,
  ask: "Approve advancing out of Responses.",
  readiness: "2 of 3 gate items met - review before approval.",
  status: "ready_with_gaps",
  stageKey: "responses",
  stageLabel: "Responses",
  estimatedValueUsd: EVENT.valueAtStakeUsd,
  href: `/source/events/${EVENT.id}?stage=responses`,
  actionLabel: "Review & decide",
};

describe("buildSourceEventShellView", () => {
  it("keeps current event stage and viewed workspace stage explicit", () => {
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      approvalItems: [APPROVAL],
    });

    expect(view.event.currentStageKey).toBe("responses");
    expect(view.event.viewedStageKey).toBe("scope");
    expect(view.event.viewedStageLabel).toBe("Scope");
    expect(view.journey).toHaveLength(11);
    expect(view.journey.find((stage) => stage.key === "responses")).toMatchObject({
      current: true,
      viewed: false,
      state: "current",
    });
    expect(view.journey.find((stage) => stage.key === "scope")).toMatchObject({
      current: false,
      viewed: true,
      state: "past",
    });
  });

  it("groups stage work into design-ready blocks and marks only persisted/computed completion as captured", () => {
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });

    expect(view.stage.pattern).toBe("intake");
    expect(view.stage.total).toBe(SAMPLE_SCOPE_STAGE.tasks.length);
    expect(view.stage.ready).toBe(3);
    expect(view.stage.activeStep?.id).toBe("scope.volumetrics");
    expect(view.stage.groups.map((group) => group.label)).toEqual([
      "Inclusions & exclusions",
      "Baseline evidence",
      "Boundary & owner",
    ]);
    expect(view.stage.groups[0]?.steps[0]).toMatchObject({
      id: "scope.apps",
      status: "captured",
      sourceBasis: "computed",
    });
    expect(view.stage.groups[1]?.steps[0]).toMatchObject({
      id: "scope.volumetrics",
      status: "active",
      sourceBasis: "missing",
    });
  });

  it("turns artifacts into a stage-grouped file ledger with live-artifact basis", () => {
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      artifacts: [
        {
          id: "artifact-1",
          stageKey: "scope",
          artifactFamily: "scope_document",
          originalName: "Scope Memo.pdf",
          sourceFormat: "pdf",
          evidenceState: "cited",
        },
        {
          id: "artifact-2",
          stageKey: "responses",
          artifactFamily: "vendor_response",
          fileName: "Vendor A Response.xlsx",
          fileFormat: "xlsx",
          status: "uploaded",
        },
      ],
    });

    expect(view.files.items).toHaveLength(2);
    expect(view.files.byStage.map((group) => group.stageLabel)).toEqual([
      "Scope",
      "Responses",
    ]);
    expect(view.files.items[0]).toMatchObject({
      name: "Scope Memo.pdf",
      format: "PDF",
      sourceBasis: "live_artifact",
    });
  });

  it("exposes Intelligence Explorer context without implying chat responses are persisted", () => {
    const liveStage: StageAnalyticsView = {
      ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
      intel: {
        ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView).intel,
        provenance: "live",
      },
    };

    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: liveStage,
      intelligenceOpen: true,
    });

    expect(view.intelligence.state).toBe("open");
    expect(view.intelligence.sourceBasis).toBe("computed");
    expect(view.intelligence.contextChips).toEqual(
      expect.arrayContaining([EVENT.code, "Scope", EVENT.archetype]),
    );
    expect(view.intelligence.captureSemantics.conversationOnlyLabel).toContain(
      "not saved to the Source record",
    );
    expect(view.intelligence.captureSemantics.saveActionLabel).toBe(
      "Save to Source record",
    );
  });

  it("selects the current-stage approval item even while another stage is viewed", () => {
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      approvalItems: [
        {
          ...APPROVAL,
          eventId: "other-event",
          readiness: "Wrong item",
        },
        APPROVAL,
      ],
    });

    expect(view.approvals.currentStageItem).toBe(APPROVAL);
    expect(view.approvals.readinessLine).toBe(APPROVAL.readiness);
    expect(view.stage.gateReadinessLine).toContain("approval workspace");
  });
});
