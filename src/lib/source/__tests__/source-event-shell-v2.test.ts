import { SAMPLE_SCOPE_STAGE } from "@/components/source/canvas/analytics/sample-view-model";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import {
  buildSourceEventShellView,
  mergeSourceShellArtifactsWithArtifactStateBodies,
  type SourceShellArtifactLike,
} from "@/lib/source/source-event-shell-v2";
import { buildSourceArtifactLifecycleSummary } from "@/lib/source/artifact-lifecycle-matrix";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate/types";
import { SOURCE_JOURNEYS } from "@/lib/source/sourcing-motion-journeys";
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
    expect(
      view.journey.find((stage) => stage.key === "responses"),
    ).toMatchObject({
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

  it("renders the contract optimization journey instead of the RFP rail", () => {
    const optimizationEvent: SourcingEventSummary = {
      ...EVENT,
      archetype: "Contract Renewal / Renegotiation",
      currentStageKey: "pricing",
      currentStageLabel: "Commercial Baseline",
    };

    const view = buildSourceEventShellView({
      event: optimizationEvent,
      tenantName: "FS Demo",
      viewedStageKey: "pricing",
      stageView: {
        ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
        stageKey: "pricing",
        stageName: "Commercial Baseline",
      },
      journey: SOURCE_JOURNEYS.contract_optimization,
    });

    expect(view.journey.map((stage) => stage.key)).toEqual([
      "strategy",
      "scope",
      "pricing",
      "bafo",
      "executive_decision",
      "transition",
      "value",
    ]);
    expect(view.journey.map((stage) => stage.label)).toContain(
      "Commercial Baseline",
    );
    expect(view.journey.map((stage) => stage.label)).toContain(
      "Negotiation Plan",
    );
    expect(view.journey.map((stage) => stage.key)).not.toContain("rfp");
    expect(view.event.viewedStageLabel).toBe("Commercial Baseline");
  });

  it("does not show an incomplete fraction for a viewed past stage", () => {
    const eventAtPricing: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "pricing",
      currentStageLabel: "Pricing",
    };
    const viewedResponsesStage: StageAnalyticsView = {
      ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
      stageKey: "responses",
      stageName: "Responses",
      tasks: [
        {
          id: "responses.coverage",
          title: "Confirm vendor response coverage",
          subtitle: "One row per vendor x value lever",
          type: "provide",
          state: "todo",
          guide: "Confirm response coverage before evaluation.",
          cta: "Confirm response coverage",
        },
      ],
    };

    const view = buildSourceEventShellView({
      event: eventAtPricing,
      tenantName: "FS Demo",
      viewedStageKey: "responses",
      stageView: viewedResponsesStage,
    });

    expect(view.journey.find((stage) => stage.key === "responses")).toMatchObject({
      viewed: true,
      state: "past",
      done: 1,
      total: 1,
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
      needsComplianceReview: false,
      complianceReviewLabel: null,
      complianceReviewMessage: null,
    });
  });

  it("flags a file item for compliance review when the registry description carries the marker, without leaking the raw text", () => {
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      artifacts: [
        {
          id: "artifact-flagged",
          stageKey: "scope",
          artifactFamily: "scope_document",
          originalName: "Scope Memo.pdf",
          sourceFormat: "pdf",
          evidenceState: "cited",
          description:
            "Generated Source deliverable. [compliance-review-flagged]",
        },
        {
          id: "artifact-clean",
          stageKey: "scope",
          artifactFamily: "scope_document",
          originalName: "App Inventory.xlsx",
          sourceFormat: "xlsx",
          evidenceState: "cited",
          description: "Generated Source deliverable.",
        },
      ],
    });

    const flagged = view.files.items.find(
      (item) => item.id === "artifact-flagged",
    );
    const clean = view.files.items.find((item) => item.id === "artifact-clean");

    expect(flagged?.needsComplianceReview).toBe(true);
    expect(flagged?.complianceReviewLabel).toBe("Compliance review required");
    expect(flagged?.complianceReviewMessage).toBe(
      "This draft was flagged for compliance review before external use.",
    );

    expect(clean?.needsComplianceReview).toBe(false);
    expect(clean?.complianceReviewLabel).toBeNull();
    expect(clean?.complianceReviewMessage).toBeNull();
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
    expect(view.stage.gateReadinessLine).toContain("before approval");
    expect(view.stage.approvalHref).toBe(`/source/events/${EVENT.id}/approval`);
  });

  it("scopes the Approvals workspace to this event only, and never renders the featured item twice", () => {
    // Regression test: the raw inbox is cross-tenant ("everything waiting on
    // you across every event" — the portfolio-level /source/approvals page
    // is where that belongs). A per-event canvas previously rendered every
    // other event's pending items too, AND rendered its own featured item a
    // second time in the list below it.
    const otherEventItem: ApprovalsInboxItem = {
      ...APPROVAL,
      eventId: "other-event",
      ask: "Approve advancing a different event.",
    };
    const secondItemSameEvent: ApprovalsInboxItem = {
      ...APPROVAL,
      stageKey: "value",
      ask: "Approve a different, non-current stage of this same event.",
    };
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      approvalItems: [otherEventItem, APPROVAL, secondItemSameEvent],
    });

    expect(view.approvals.currentStageItem).toBe(APPROVAL);
    // The list must exclude the featured item (no duplicate) and any other
    // event's items, but keep this event's other real items.
    expect(view.approvals.items).toEqual([secondItemSameEvent]);
    expect(view.approvals.items).not.toContain(APPROVAL);
    expect(
      view.approvals.items.some((item) => item.eventId === "other-event"),
    ).toBe(false);
  });

  it("marks guidebook unavailable and returns an empty-state message when no guidebook is authored for the viewed stage", () => {
    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      guidebook: null,
    });

    expect(view.guidebook.available).toBe(false);
    expect(view.guidebook.record).toBeNull();
    expect(view.guidebook.emptyMessage).toContain("Scope");
    expect(view.workspaces.available).toContain("guidebook");
  });

  it("surfaces an authored guidebook record as-is when one exists for the viewed stage", () => {
    const guidebook = {
      id: "guidebook-1",
      stageKey: "strategy" as const,
      clientKey: null,
      title: "Strategy Gate Review",
      purpose:
        "Get a clean sponsor decision on whether this event goes to market.",
      durationMinutes: 20,
      status: "published" as const,
      sections: [
        {
          type: "purpose" as const,
          title: "What this session is for",
          body: "The Strategy gate is a sponsor decision, not a status update.",
          timeBoxMinutes: null,
        },
      ],
      version: 1,
      createdBy: null,
      updatedBy: null,
      publishedAt: "2026-07-20T13:15:00.000Z",
      createdAt: "2026-07-20T13:15:00.000Z",
      updatedAt: "2026-07-20T13:15:00.000Z",
    };

    const view = buildSourceEventShellView({
      event: EVENT,
      tenantName: "FS Demo",
      viewedStageKey: "strategy",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      guidebook,
    });

    expect(view.guidebook.available).toBe(true);
    expect(view.guidebook.record).toBe(guidebook);
  });
});

describe("mergeSourceShellArtifactsWithArtifactStateBodies", () => {
  it("threads authored artifact-state body text into existing registry rows", () => {
    const merged = mergeSourceShellArtifactsWithArtifactStateBodies(
      [
        {
          id: "registry-d01",
          artifactKind: "d01_strategy_memo",
          artifactGroup: "generated",
          sourceOrigin: "generated",
          status: "approved",
        },
      ],
      [
        artifactState({
          artifactCode: "d01_strategy_memo",
          body: passingStrategyMemoBody,
        }),
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.body).toContain("Decision requested");
    expect(merged[0]?.bodyMarkdown).toContain("Decision requested");

    const summary = buildSourceArtifactLifecycleSummary(merged);
    const strategyMemo = summary.rows.find(
      (row) => row.code === "d01_strategy_memo",
    );

    expect(summary.quality.contentScoredCount).toBe(1);
    expect(strategyMemo?.contentQuality.state).toBe("passed");
  });

  it("does not overwrite registry body text that is already available", () => {
    const artifacts: SourceShellArtifactLike[] = [
      {
        id: "registry-d01",
        artifactKind: "d01_strategy_memo",
        bodyMarkdown: "Registry body wins.",
      },
    ];

    const merged = mergeSourceShellArtifactsWithArtifactStateBodies(artifacts, [
      artifactState({
        artifactCode: "d01_strategy_memo",
        body: passingStrategyMemoBody,
      }),
    ]);

    expect(merged[0]?.bodyMarkdown).toBe("Registry body wins.");
    expect(merged[0]?.body).toBeUndefined();
  });

  it("adds authored state-only artifacts and ignores blank state bodies", () => {
    const merged = mergeSourceShellArtifactsWithArtifactStateBodies(
      [],
      [
        artifactState({
          artifactCode: "d01_strategy_memo",
          body: passingStrategyMemoBody,
        }),
        artifactState({
          id: "state-blank",
          artifactCode: "d05_scope_memo",
          body: "   ",
        }),
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: "artifact-state:state-d01_strategy_memo",
      artifactKind: "d01_strategy_memo",
      sourceOrigin: "generated",
      artifactGroup: "generated",
      fileFormat: "md",
    });
  });
});

function artifactState(
  overrides: Partial<SourceEventArtifactState> &
    Pick<SourceEventArtifactState, "artifactCode">,
): SourceEventArtifactState {
  const { artifactCode, ...rest } = overrides;
  return {
    id: `state-${artifactCode}`,
    sourceEventId: "event-1",
    tenantKey: "fs-demo",
    artifactCode,
    stage: "strategy",
    family: "sourcing_strategy",
    tier: "rich",
    status: "approved",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: null,
    bodyFormat: "markdown",
    bodyAuthoredBy: "source-agent",
    bodyUpdatedAt: "2026-07-20T00:00:00.000Z",
    bodyGenerationMetadata: null,
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    ...rest,
  };
}

const passingStrategyMemoBody = `Recommendation: approve the sourcing event and authorize scope preparation.
Decision requested: confirm the sourcing approach and authorize RFP preparation.
Why now: incumbent contract expires Q4; cost pressure from board.
Recommended approach: competitive RFP targeting the managed applications estate.
What we know: estate has 180 apps; current run cost is about $12M per year.
What remains open: application tiers and ticket volume require upload.
Value hypothesis: $4-7M annually. Confidence band: medium.
Next gate: lock scope boundary before RFP issue.`;
