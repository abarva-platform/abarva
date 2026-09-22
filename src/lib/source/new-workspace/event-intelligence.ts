import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
  type ValidatedAgentContextBundle,
} from "@/lib/governance/agent-context-bundle";
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import { resolveSourceStageRequirements } from "@/lib/source/archetypes/resolver";
import { industryIntelligenceForArchetype } from "@/lib/source/industry-intelligence/archetype-registry";
import type { ConfidenceLevel } from "@/lib/governance/context-corpus-policy";

export interface SourceNewEventIntelligenceEvent {
  id: string;
  clientId: string;
  clientKey: string;
  eventType: string | null;
  category: string | null;
  currentStage: string;
}

export interface SourceNewEventIntelligenceArtifact {
  id: string;
  title: string;
  artifactType: string;
  artifactFamily: string | null;
  lifecycleState: string;
  sourceBasis: string | null;
  confidence: string | null;
  citationReady: boolean;
  evidenceFamiliesUsed: readonly string[];
  sourceRegisterId: string | null;
  contextBundleTraceId: string | null;
  missingInputs: readonly string[];
  generatedAt: string | null;
}

export interface SourceNewRequiredEvidenceView {
  key: string;
  label: string;
  severity: "hard" | "soft";
  whyNeeded: string;
  sourceDocHint: string;
  state: "available" | "gap";
}

export interface SourceNewIndustryMetricView {
  key: string;
  label: string;
  unit: string;
  requiredComparability: string[];
  sourceAuthorities: string[];
}

export interface SourceNewGovernedContextView {
  policyVersion: string;
  decision: ValidatedAgentContextBundle["decision"];
  usableCount: number;
  blockedCount: number;
  agentReadyCount: number;
  citationsCount: number;
  available: Array<{
    id: string;
    title: string;
    evidenceFamilies: string[];
    contextBundleTraceId: string | null;
  }>;
  blocked: Array<{
    id: string;
    title: string;
    reasons: string[];
  }>;
}

export interface SourceNewEventIntelligenceView {
  posture: "ready" | "limited" | "blocked";
  archetype: {
    id: string | null;
    name: string;
    source: string;
    reason: string;
  };
  currentStage: string;
  stageEvidenceContract: "available" | "not_defined" | "unresolved";
  requiredEvidence: SourceNewRequiredEvidenceView[];
  governedContext: SourceNewGovernedContextView;
  industryMetrics: SourceNewIndustryMetricView[];
  allowedStatement: string;
  gaps: string[];
  refusals: string[];
  nextQuestion: string;
  nextAction: {
    label: string;
    detail: string;
  };
}

function categoryId(value: string | null): SourceCategoryId | null {
  if (!value) return null;
  return (SOURCE_CATEGORY_IDS as readonly string[]).includes(value)
    ? (value as SourceCategoryId)
    : null;
}

function confidenceLevel(value: string | null): ConfidenceLevel | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low" ||
    normalized === "unverified"
  )
    return normalized;
  return null;
}

function artifactCandidate(
  event: SourceNewEventIntelligenceEvent,
  artifact: SourceNewEventIntelligenceArtifact,
): GovernedCandidate {
  const confidence = confidenceLevel(artifact.confidence);
  const hasGovernedTrace = Boolean(
    artifact.sourceBasis &&
    artifact.contextBundleTraceId &&
    artifact.citationReady &&
    confidence &&
    artifact.lifecycleState === "current",
  );
  const citations = [
    artifact.sourceBasis,
    artifact.sourceRegisterId,
    artifact.contextBundleTraceId,
  ].filter((item): item is string => Boolean(item));

  return {
    id: artifact.id,
    title: artifact.title,
    client_key: event.clientKey,
    tenant_id: event.clientId,
    source_layer: "artifact",
    source_basis: artifact.sourceBasis,
    classification: "confidential",
    retrievability: hasGovernedTrace
      ? "search_indexed"
      : artifact.sourceBasis
        ? "committed_not_indexed"
        : "not_indexed",
    agent_readiness_status: hasGovernedTrace
      ? "agent_ready"
      : artifact.sourceBasis
        ? "committed_not_indexed"
        : "not_reviewed",
    confidence_level: confidence,
    cited_render_verified_at: hasGovernedTrace ? artifact.generatedAt : null,
    citations,
  };
}

function artifactFamilies(
  artifacts: readonly SourceNewEventIntelligenceArtifact[],
): Set<string> {
  return new Set(
    artifacts
      .filter((artifact) => artifact.lifecycleState === "current")
      .flatMap((artifact) => [
        artifact.artifactFamily,
        ...artifact.evidenceFamiliesUsed,
      ])
      .filter((item): item is string => Boolean(item)),
  );
}

function loadedArtifactFamilies(
  artifacts: readonly SourceNewEventIntelligenceArtifact[],
): Set<string> {
  return artifactFamilies(
    artifacts.filter(
      (artifact) =>
        artifact.lifecycleState === "current" && Boolean(artifact.sourceBasis),
    ),
  );
}

function stageLabel(stage: string): string {
  return stage
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function evidenceReviewTarget(item: SourceNewRequiredEvidenceView): string {
  return (
    item.sourceDocHint.replace(/\s*\([^)]*\)\s*$/, "").trim() || item.label
  );
}

function allowedStatementFor(args: {
  archetypeName: string;
  resolved: boolean;
  stage: string;
  stageEvidenceContract: SourceNewEventIntelligenceView["stageEvidenceContract"];
  availableTitles: readonly string[];
  hardGapLabels: readonly string[];
}): string {
  if (!args.resolved) {
    return "This event does not yet map to a supported sourcing playbook, so Source will not provide event-specific advice.";
  }
  if (args.stageEvidenceContract === "not_defined") {
    if (args.stage === "value") {
      return `Source resolves this event to the ${args.archetypeName} playbook. That playbook does not define a separate evidence contract for the final Value stage, so final value claims must be supported by governed evidence from the completed lifecycle.`;
    }
    return `Source resolves this event to the ${args.archetypeName} playbook. That playbook does not define a separate evidence contract for the ${stageLabel(args.stage)} stage, so Source will not infer requirements or a recommendation for it.`;
  }
  if (args.availableTitles.length === 0) {
    return `Source can identify the ${args.archetypeName} playbook and its evidence gaps, but it cannot make a recommendation yet.`;
  }
  const available = args.availableTitles.slice(0, 3).join(", ");
  if (args.hardGapLabels.length > 0) {
    return `Source can use ${available} for this ${args.archetypeName} event. It will not make claims that depend on the missing ${args.hardGapLabels[0]}.`;
  }
  return `Source can use ${available} for this ${args.archetypeName} event. Savings, benchmark, supplier-selection, and outreach claims still require their own evidence.`;
}

export function buildSourceNewEventIntelligence(input: {
  event: SourceNewEventIntelligenceEvent;
  artifacts: readonly SourceNewEventIntelligenceArtifact[];
}): SourceNewEventIntelligenceView {
  const stage = normalizeSourceStageKey(input.event.currentStage) ?? "strategy";
  const resolution = resolveArchetypeForEvent({
    categoryId: categoryId(input.event.category),
    eventType: input.event.eventType,
  });
  const candidates = input.artifacts
    .filter((artifact) => artifact.lifecycleState === "current")
    .map((artifact) => artifactCandidate(input.event, artifact));
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: true,
  });
  const usableIds = new Set(bundle.usable.map((candidate) => candidate.id));
  const familySet = artifactFamilies(
    input.artifacts.filter((artifact) => usableIds.has(artifact.id)),
  );
  const loadedFamilySet = loadedArtifactFamilies(input.artifacts);
  const gaps = new Set<string>();
  const refusals = new Set<string>();

  let requiredEvidence: SourceNewRequiredEvidenceView[] = [];
  let industryMetrics: SourceNewIndustryMetricView[] = [];
  const stageEvidenceContract: SourceNewEventIntelligenceView["stageEvidenceContract"] =
    !resolution.resolved || !resolution.archetype
      ? "unresolved"
      : resolution.archetype.stageModel.some((item) => item.stage === stage)
        ? "available"
        : "not_defined";

  if (resolution.resolved && resolution.archetype) {
    const requirements = resolveSourceStageRequirements(
      resolution.archetype,
      stage,
      { committedFamilies: [...familySet] },
    );
    requiredEvidence = requirements.requiredEvidence.map((item) => {
      const state = familySet.has(item.family) ? "available" : "gap";
      if (state === "gap" && item.severity === "hard") {
        gaps.add(
          `${item.spec?.label ?? item.family} is required for this stage and is not ready to use.`,
        );
      }
      return {
        key: item.family,
        label: item.spec?.label ?? item.family,
        severity: item.severity,
        whyNeeded:
          item.spec?.whyNeeded ?? "Required by the resolved Source archetype.",
        sourceDocHint: item.spec?.sourceDocHint ?? "Governed source evidence",
        state,
      };
    });

    industryMetrics = (
      industryIntelligenceForArchetype(resolution.archetype.id)
        ?.benchmarkMetrics ?? []
    )
      .filter((metric) => metric.stages.includes(stage))
      .map((metric) => ({
        key: metric.key,
        label: metric.label,
        unit: metric.unit,
        requiredComparability: [...metric.requiredComparability],
        sourceAuthorities: [...metric.sourceAuthorities],
      }));
  } else {
    refusals.add(
      "This event does not yet map to a supported sourcing playbook.",
    );
  }

  for (const blocked of bundle.blocked) {
    refusals.add(
      `${blocked.candidate.title ?? blocked.candidate.id}: review its source, confidence, citations, and retrieval status before Source can use it.`,
    );
  }
  for (const artifact of input.artifacts) {
    for (const missingInput of artifact.missingInputs) {
      if (missingInput.trim()) gaps.add(missingInput.trim());
    }
  }
  if (bundle.usable.length === 0) {
    gaps.add("No current evidence is ready to cite yet.");
  }

  const firstEvidenceGap = requiredEvidence.find(
    (item) => item.state === "gap" && item.severity === "hard",
  );
  const firstLoadedEvidenceGap =
    firstEvidenceGap && loadedFamilySet.has(firstEvidenceGap.key)
      ? firstEvidenceGap
      : null;
  const availableTitles = bundle.usable.map(
    (candidate) => candidate.title ?? candidate.id,
  );
  const hardGapLabels = requiredEvidence
    .filter((item) => item.state === "gap" && item.severity === "hard")
    .map((item) => item.label);
  const allowedStatement = allowedStatementFor({
    archetypeName: resolution.archetype?.name ?? "unresolved archetype",
    resolved: resolution.resolved,
    stage,
    stageEvidenceContract,
    availableTitles,
    hardGapLabels,
  });
  const nextQuestion =
    stageEvidenceContract === "not_defined" && stage === "value"
      ? "Which governed evidence supports the recorded final value outcome?"
      : stageEvidenceContract === "not_defined"
        ? `Which governed evidence should support the recorded ${stageLabel(stage)} decision?`
        : firstLoadedEvidenceGap
          ? `${evidenceReviewTarget(firstLoadedEvidenceGap)} is already loaded but not ready. Which governance review or promotion step should clear it?`
          : firstEvidenceGap
            ? `Can you provide ${firstEvidenceGap.sourceDocHint}?`
            : industryMetrics[0]
              ? `Which comparability fields are valid for ${industryMetrics[0].label}?`
              : "Which governed evidence should resolve the next sourcing decision?";
  const nextAction =
    stageEvidenceContract === "not_defined"
      ? {
          label: "Review lifecycle evidence",
          detail:
            stage === "value"
              ? "Review the governed evidence and unresolved gaps from the completed lifecycle before relying on a final value claim."
              : `Review governed lifecycle evidence before relying on the recorded ${stageLabel(stage)} outcome.`,
        }
      : firstLoadedEvidenceGap
        ? {
            label: "Review loaded evidence",
            detail: `Complete governance review or promotion for ${firstLoadedEvidenceGap.label} before relying on this intelligence.`,
          }
        : firstEvidenceGap
          ? {
              label: "Resolve evidence gap",
              detail: `Add or review ${firstEvidenceGap.label} before relying on this intelligence.`,
            }
          : bundle.usable.length > 0
            ? {
                label: "Open current stage",
                detail:
                  "Use the current stage to decide which evidence should support the next answer.",
              }
            : {
                label: "Review governed context",
                detail:
                  "Review the loaded files and complete their evidence checks before asking for recommendations.",
              };

  const posture =
    !resolution.resolved || bundle.usable.length === 0
      ? "blocked"
      : gaps.size > 0 || bundle.blocked.length > 0
        ? "limited"
        : "ready";

  return {
    posture,
    archetype: {
      id: resolution.archetypeId,
      name: resolution.archetype?.name ?? "Unresolved archetype",
      source: resolution.source,
      reason: resolution.reason,
    },
    currentStage: stage,
    stageEvidenceContract,
    requiredEvidence,
    governedContext: {
      policyVersion: bundle.policy_version,
      decision: bundle.decision,
      usableCount: bundle.usable.length,
      blockedCount: bundle.blocked.length,
      agentReadyCount: bundle.agentReadyCount,
      citationsCount: bundle.citations.length,
      available: bundle.usable.map((candidate) => {
        const artifact = input.artifacts.find(
          (item) => item.id === candidate.id,
        );
        return {
          id: candidate.id,
          title: candidate.title ?? candidate.id,
          evidenceFamilies: artifact?.evidenceFamiliesUsed
            ? [...artifact.evidenceFamiliesUsed]
            : [],
          contextBundleTraceId: artifact?.contextBundleTraceId ?? null,
        };
      }),
      blocked: bundle.blocked.map((blocked) => ({
        id: blocked.candidate.id,
        title: blocked.candidate.title ?? blocked.candidate.id,
        reasons: blocked.errors,
      })),
    },
    industryMetrics,
    allowedStatement,
    gaps: [...gaps],
    refusals: [...refusals],
    nextQuestion,
    nextAction,
  };
}
