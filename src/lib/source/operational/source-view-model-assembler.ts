import type {
  StageAnalyticsView,
  StageTaskView,
} from "@/components/source/canvas/analytics/view-model";
import {
  buildSourceEventShellView,
  type SourceShellArtifactLike,
} from "@/lib/source/source-event-shell-v2";
import type {
  SourcePriority,
  SourceStageKey,
  SourcingEventSummary,
} from "@/lib/source/types";
import type {
  SourceOperationalPackage,
  SourceOperationalProofViewModel,
  SourceOperationalProvider,
  SourceOperationalProviderIdentity,
  SourceOperationalRelease,
  SourceOperationalWorkflowStep,
} from "@/lib/source/operational/types";

export async function buildSourceOperationalDemoViewModel(
  provider: SourceOperationalProvider,
): Promise<SourceOperationalProofViewModel> {
  const sourcePackage = await provider.getRelease();
  const providerIdentity = identityFor(sourcePackage, provider.identity);
  const release = sourcePackage.release;
  const eventSummary = buildEventSummary(release);
  const stageView = buildExecutiveDecisionStageView(release);
  const shellView = buildSourceEventShellView({
    event: eventSummary,
    tenantName: release.event.tenantKey,
    viewedStageKey: "executive_decision",
    stageView,
    artifacts: buildArtifacts(release),
    activeWorkspace: "steps",
    intelligenceOpen: true,
  });

  return {
    releaseId: sourcePackage.manifest.releaseId,
    releaseHashSha256: sourcePackage.manifest.releaseHashSha256,
    tenantKey: sourcePackage.manifest.tenantKey,
    eventId: release.event.eventId,
    eventCode: release.event.eventCode,
    scenario: release.event.scenario,
    sourceBasis: sourcePackage.manifest.sourceBasis,
    providerIdentity,
    knowledgeContext: sourcePackage.manifest.knowledgeContext,
    objectCounts: sourcePackage.manifest.objectCounts,
    validationChecks: sourcePackage.validation.checks,
    workflow: buildWorkflow(sourcePackage),
    recommendation: {
      recommendedVendorId: release.recommendation.recommendedVendorId,
      decision: release.recommendation.decision,
      rationale: release.recommendation.rationale,
      finalScores: release.recommendation.finalScores,
    },
    limitations: [
      sourcePackage.manifest.knowledgeContext.limitation,
      "Synthetic Source operational records are lab-demo workflow state and are not canonical Knowledge.",
      "Signed-in lab proof and Decision Brief export proof remain separate from this local package proof.",
    ],
    shellView,
  };
}

function identityFor(
  sourcePackage: SourceOperationalPackage,
  providerIdentity: SourceOperationalProviderIdentity,
): SourceOperationalProviderIdentity {
  return {
    ...providerIdentity,
    releaseId: sourcePackage.manifest.releaseId,
    releaseHashSha256: sourcePackage.manifest.releaseHashSha256,
    tenantKey: sourcePackage.manifest.tenantKey,
    eventId: sourcePackage.release.event.eventId,
  };
}

function buildWorkflow(
  sourcePackage: SourceOperationalPackage,
): SourceOperationalWorkflowStep[] {
  const { release, manifest } = sourcePackage;
  return [
    sourceStep("event", "Event", count(manifest, "event")),
    sourceStep("requirements", "Requirements", release.requirements.length),
    sourceStep(
      "vendor_participation",
      "Vendor participation",
      release.vendors.length,
    ),
    sourceStep("proposals", "Proposals", release.proposals.length),
    sourceStep("evaluation", "Weighted evaluation", release.evaluations.length),
    sourceStep("pricing", "Pricing", release.pricing.length),
    sourceStep("bafo", "BAFO", release.bafo.length),
    sourceStep(
      "recommendation",
      "Recommendation",
      count(manifest, "recommendation"),
    ),
    sourceStep(
      "decision_brief",
      "Decision Brief",
      count(manifest, "decisionBrief"),
    ),
    sourceStep(
      "transition",
      "Transition commitments",
      release.transitionCommitments.length,
    ),
    {
      key: "evidence",
      label: "Governed V1 Knowledge context",
      status: release.event.knowledgeContext.provider ? "ready" : "blocked",
      count: release.recommendation.evidenceRefs.length,
      sourceBasis: "governed_v1_knowledge_context",
    },
  ];
}

function sourceStep(
  key: SourceOperationalWorkflowStep["key"],
  label: string,
  countValue: number,
): SourceOperationalWorkflowStep {
  return {
    key,
    label,
    status: countValue > 0 ? "ready" : "blocked",
    count: countValue,
    sourceBasis: "synthetic_source_operational_demo",
  };
}

function count(
  sourcePackage: SourceOperationalPackage["manifest"],
  key: string,
) {
  return Number(sourcePackage.objectCounts[key] ?? 0);
}

function buildEventSummary(
  release: SourceOperationalRelease,
): SourcingEventSummary {
  const projectedValueUsd =
    typeof release.valueScorecard.totalAnnualValueUsd === "number"
      ? release.valueScorecard.totalAnnualValueUsd
      : 0;

  return {
    id: release.event.eventId,
    code: release.event.eventCode,
    name: release.event.name,
    accountName: release.event.tenantKey,
    leadAgent: "Sentinel",
    archetype: "operational_recovery_crew_data_platform",
    rigor: "strategic",
    status: "waiting_on_executive_decision",
    statusLabel: "Waiting on Executive Decision",
    priority: "critical" as SourcePriority,
    currentStageKey: release.event.currentStage as SourceStageKey,
    currentStageLabel: "Executive Decision",
    openAlerts: 0,
    owner: "Source demo operations",
    decisionOwner: "Demo decision owner",
    agingDays: 0,
    blocker: null,
    nextAction:
      "Review recommendation, export Decision Brief, and capture lab proof.",
    isAtRisk: false,
    valueAtStakeUsd: projectedValueUsd,
    projectedValueUsd,
    realizedValueUsd: 0,
    nextDecision: "Approve lab-demo recommendation for product proof.",
    classifiedCategory: "operational_recovery_crew_data_platform",
  };
}

function buildExecutiveDecisionStageView(
  release: SourceOperationalRelease,
): StageAnalyticsView {
  const winningVendor = vendorName(
    release,
    release.recommendation.recommendedVendorId,
  );
  const winningScore = release.recommendation.finalScores.find(
    (score) => score.vendorId === release.recommendation.recommendedVendorId,
  );

  return {
    stageKey: "executive_decision",
    stageName: "Executive Decision",
    purpose:
      "Review the Source-owned operational release, its governed V1 context refs, and the deterministic recommendation before lab sign-off.",
    intel: {
      provenance: "sample",
      lead: "This view is backed by the synthetic Source operational release package and governed V1 Knowledge context metadata.",
      points: [
        {
          tone: "found",
          tag: "Release",
          text: `${release.requirements.length} requirements, ${release.vendors.length} vendors, ${release.proposalResponses.length} requirement responses, and ${release.criteria.length} weighted criteria are present.`,
        },
        {
          tone: "found",
          tag: "Recommendation",
          text: `${winningVendor} leads the deterministic recommendation with final score ${winningScore?.finalScore ?? "n/a"}.`,
        },
        {
          tone: "muted",
          tag: "Boundary",
          text: "Operational records stay Source-owned for lab proof and are not promoted into canonical Knowledge.",
        },
        {
          tone: "muted",
          tag: "Knowledge",
          text: release.event.knowledgeContext.limitation,
        },
      ],
    },
    tasks: buildExecutiveDecisionTasks(release),
    gate: {
      approver: "Lab proof reviewer",
      confirms: [
        {
          label: "Workflow complete",
          detail:
            "Event through transition commitments is present in the Source release package.",
        },
        {
          label: "Parity checked",
          detail:
            "Scoring, pricing, proposal coverage, BAFO, and references passed deterministic validation.",
        },
        {
          label: "Boundary preserved",
          detail:
            "The release is synthetic Source workflow state, not a Knowledge baseline or publication.",
        },
      ],
      generates: [
        { label: "Decision Brief", code: "d24" },
        { label: "Risk attestation", code: "d25" },
        {
          label: "Transition readiness pack",
          code: "d29",
          isReadinessPack: true,
        },
      ],
      nextStageName: "Selection",
    },
  };
}

function buildExecutiveDecisionTasks(
  release: SourceOperationalRelease,
): StageTaskView[] {
  const recommendedVendor = vendorName(
    release,
    release.recommendation.recommendedVendorId,
  );
  const scoreRows = release.recommendation.finalScores
    .slice()
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((score) => ({
      key: vendorName(release, score.vendorId),
      value: `${score.finalScore.toFixed(2)} final score - BAFO year-one $${Math.round(
        score.bafoYearOneUsd / 1_000,
      ).toLocaleString()}k`,
      flag: score.vendorId === release.recommendation.recommendedVendorId,
    }));

  return [
    {
      id: "source-operational.requirements",
      title: "Confirm requirement coverage",
      subtitle: `${release.requirements.length} requirements across ${categoryCount(
        release,
      )} categories`,
      type: "confirm",
      state: "done",
      guide:
        "All requirement records are synthetic Source operational data for the lab release.",
      rows: [
        {
          key: "Proposal responses",
          value: `${release.proposalResponses.length} of ${
            release.requirements.length * release.vendors.length
          } expected`,
        },
        {
          key: "Synthetic label",
          value: release.event.syntheticDataLabel,
        },
      ],
      cta: "Review requirements",
      evidenceComplete: true,
    },
    {
      id: "source-operational.evaluation",
      title: "Review weighted evaluation",
      subtitle: `${release.criteria.length} criteria - weights total 100%`,
      type: "confirm",
      state: "done",
      guide:
        "Weighted scores were recomputed from the package criteria and vendor scores.",
      rows: scoreRows,
      cta: "Review scores",
      evidenceComplete: true,
    },
    {
      id: "source-operational.pricing-bafo",
      title: "Confirm pricing and BAFO parity",
      subtitle: `${release.pricing.length} pricing submissions - ${release.bafo.length} BAFO records`,
      type: "confirm",
      state: "done",
      guide:
        "Pricing totals and BAFO revised year-one totals are recomputed from package lines and references.",
      rows: [
        {
          key: "Lowest BAFO year-one",
          value: `$${Math.min(
            ...release.recommendation.finalScores.map(
              (score) => score.bafoYearOneUsd,
            ),
          ).toLocaleString()}`,
        },
        {
          key: "Service credit controls",
          value: "Captured in pricing and BAFO records",
        },
      ],
      cta: "Review pricing",
      evidenceComplete: true,
    },
    {
      id: "source-operational.recommendation",
      title: "Decide on recommendation",
      subtitle: `${recommendedVendor} recommended`,
      type: "decide",
      state: "done",
      guide: release.recommendation.rationale,
      rows: [
        {
          key: "Decision",
          value: release.recommendation.decision,
        },
        {
          key: "Evidence references",
          value: `${release.recommendation.evidenceRefs.length} refs`,
        },
      ],
      cta: "Open Decision Brief",
      evidenceComplete: true,
    },
    {
      id: "source-operational.transition",
      title: "Confirm transition commitments",
      subtitle: `${release.transitionCommitments.length} commitments`,
      type: "confirm",
      state: "done",
      guide:
        "Transition commitments reference the recommendation and BAFO record for the recommended vendor.",
      rows: release.transitionCommitments.map((commitment) => ({
        key: String(commitment.title ?? commitment.id),
        value: String(commitment.window ?? "transition"),
      })),
      cta: "Review transition",
      evidenceComplete: true,
    },
    {
      id: "source-operational.knowledge-context",
      title: "Check governed Knowledge context",
      subtitle: release.event.knowledgeContext.provider,
      type: "confirm",
      state: "done",
      guide:
        "Source consumes frozen V1 Knowledge context by provider metadata; the operational release does not create a new Knowledge publication.",
      rows: [
        {
          key: "Frozen V1",
          value: release.event.knowledgeContext.frozenV1Status,
        },
        {
          key: "Baseline ref",
          value: release.event.knowledgeContext.baselineRef,
        },
      ],
      cta: "Review evidence",
      evidenceComplete: true,
    },
  ];
}

function buildArtifacts(
  release: SourceOperationalRelease,
): SourceShellArtifactLike[] {
  return [
    {
      id: release.decisionBrief.id,
      sourceEventId: release.event.eventId,
      artifactCode: "d24",
      stageKey: "executive_decision",
      artifactGroup: "generated",
      sourceOrigin: "synthetic_source_operational_demo",
      title: String(release.decisionBrief.title),
      fileName: `${release.decisionBrief.id}.md`,
      fileFormat: "markdown",
      status: "draft",
      approvalState: "draft",
      bodyMarkdown: `# ${release.decisionBrief.title}\n\n${release.decisionBrief.sections
        .map((section) => `- ${section}`)
        .join("\n")}`,
    },
    {
      id: release.valueScorecard.id,
      sourceEventId: release.event.eventId,
      artifactCode: "d33",
      stageKey: "value",
      artifactGroup: "generated",
      sourceOrigin: "synthetic_source_operational_demo",
      title: "Synthetic value scorecard",
      fileName: `${release.valueScorecard.id}.json`,
      fileFormat: "json",
      status: "draft",
      approvalState: "draft",
      plainTextSummary: String(release.valueScorecard.caveat ?? ""),
    },
  ];
}

function categoryCount(release: SourceOperationalRelease): number {
  return new Set(
    release.requirements.map((requirement) => requirement.category),
  ).size;
}

function vendorName(
  release: SourceOperationalRelease,
  vendorId: string,
): string {
  const vendor = release.vendors.find((candidate) => candidate.id === vendorId);
  return vendor?.displayName ?? vendor?.name ?? vendorId;
}
