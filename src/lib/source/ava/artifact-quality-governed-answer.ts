// ─────────────────────────────────────────────────────────────────────────────
// Governed artifact-quality chat answer.
//
// Builds a structured Source aVa answer from the same artifact lifecycle matrix
// the Files workspace renders. This is intentionally read-only: it lists current
// registry rows, maps them through the mandatory context/corpus gate, and then
// projects the deterministic lifecycle/quality summary into a table + chart.
// It never claims OCR, vector indexing, or enterprise-context promotion.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import type {
  Classification,
  ConfidenceLevel,
  Retrievability,
} from "@/lib/governance/context-corpus-policy";
import {
  buildSourceArtifactLifecycleSummary,
  type SourceArtifactLifecycleRow,
} from "@/lib/source/artifact-lifecycle-matrix";
import {
  listSourceArtifactsForSourceEventIdWithContent,
  type SourceArtifactRegistryRecordWithContent,
} from "@/lib/source/artifact-registry";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";

export interface BuildArtifactQualityGovernedAnswerInput {
  eventId: string;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export function looksLikeArtifactQualityQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  return (
    /\b(artifact|artifacts|file|files|document|documents|deliverable|deliverables|draft|drafts|client final|client-final|gate b|quality|lifecycle)\b/.test(
      q,
    ) &&
    /\b(quality|ready|readiness|missing|blocked|blockers?|warnings?|hard fails?|review|client final|client-final|lifecycle|gate b|final|current|status)\b/.test(
      q,
    )
  );
}

export function sourceDataClassificationToClassification(
  value: SourceArtifactRegistryRecordWithContent["dataClassification"],
): Classification {
  switch (value) {
    case "Public":
      return "public";
    case "Internal":
      return "internal";
    case "Restricted":
      return "restricted";
    case "Confidential":
      return "confidential";
  }
}

function confidenceForArtifact(
  artifact: SourceArtifactRegistryRecordWithContent,
): ConfidenceLevel {
  if (artifact.isClientFinal || artifact.approvalState === "approved") {
    return "high";
  }
  if (artifact.parseStatus === "parsed" || artifact.evidenceState === "cited") {
    return "medium";
  }
  return "low";
}

function retrievabilityForArtifact(
  artifact: SourceArtifactRegistryRecordWithContent,
): Retrievability {
  if (artifact.embeddingStatus === "embedded") return "search_indexed";
  if (artifact.parseStatus === "parsed") return "committed_not_indexed";
  return "not_indexed";
}

export function governedCandidateFromSourceArtifact(
  artifact: SourceArtifactRegistryRecordWithContent,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const locator = [
    artifact.stageKey,
    artifact.artifactKind,
    `v${artifact.version}`,
    artifact.updatedAt ? `updated ${artifact.updatedAt}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: artifact.id,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: "artifact",
    source_basis: artifact.originalName,
    classification: sourceDataClassificationToClassification(
      artifact.dataClassification,
    ),
    retrievability: retrievabilityForArtifact(artifact),
    agent_readiness_status:
      artifact.embeddingStatus === "embedded"
        ? "committed_not_indexed"
        : "not_reviewed",
    confidence_level: confidenceForArtifact(artifact),
    cited_render_verified_at: null,
    title: artifact.originalName,
    citations: [`${artifact.originalName} — ${locator}`],
  };
}

function lifecycleInputFromArtifact(
  artifact: SourceArtifactRegistryRecordWithContent,
) {
  return {
    artifactKind: artifact.artifactKind,
    artifactType: artifact.artifactKind,
    artifactGroup: artifact.artifactFamily,
    sourceOrigin: artifact.sourceOrigin,
    status: artifact.isClientFinal ? "client_final" : artifact.approvalState,
    approvalState: artifact.approvalState,
    evidenceState: artifact.evidenceState,
    isClientFinal: artifact.isClientFinal,
    bodyMarkdown: artifact.bodyMarkdown ?? null,
  };
}

function rowPriority(row: SourceArtifactLifecycleRow): number {
  if (row.quality.hardFails.length > 0) return 0;
  if (row.contentQuality.blockers.length > 0) return 1;
  if (row.consultingGate.state === "failed") return 2;
  if (row.quality.state === "review_required") return 3;
  if (row.consultingGate.state === "required_not_run") return 4;
  if (row.lifecycleState === "client_final") return 5;
  return 6;
}

function actionRows(rows: readonly SourceArtifactLifecycleRow[]) {
  return [...rows]
    .filter(
      (row) =>
        row.quality.hardFails.length > 0 ||
        row.contentQuality.blockers.length > 0 ||
        row.contentQuality.warnings.length > 0 ||
        row.consultingGate.state === "failed" ||
        row.consultingGate.state === "required_not_run" ||
        row.quality.state === "review_required" ||
        row.lifecycleState === "client_final",
    )
    .sort((a, b) => rowPriority(a) - rowPriority(b))
    .slice(0, 8);
}

function buildArtifactQualityTable(args: {
  rows: readonly SourceArtifactLifecycleRow[];
  citationIds: string[];
}): AnswerTable {
  return {
    id: "source-artifact-quality-lifecycle",
    title: "Artifact quality and lifecycle",
    columns: [
      { key: "stage", label: "Stage", format: "text" },
      { key: "artifact", label: "Artifact", format: "text" },
      { key: "state", label: "State", format: "text" },
      { key: "score", label: "Score", format: "number", align: "right" },
      { key: "nextAction", label: "Next action", format: "text" },
    ],
    rows: actionRows(args.rows).map((row) => ({
      stage: row.stageLabel,
      artifact: row.name,
      state: row.quality.label,
      score: row.quality.score,
      nextAction: row.quality.nextAction,
    })),
    note:
      "This is the same deterministic lifecycle and quality matrix used by the Source Files workspace.",
    citationIds: args.citationIds,
  };
}

function buildArtifactQualityChart(args: {
  registeredCount: number;
  clientFinalCount: number;
  missingRequiredCount: number;
  reviewRequiredCount: number;
  hardFailCount: number;
  citationIds: string[];
}): AnswerChart {
  return {
    id: "source-artifact-quality-posture",
    kind: "horizontal-bar",
    title: "Artifact posture",
    subtitle: "Execution-first view of registered finals, gaps, and review risk.",
    data: {
      type: "horizontal-bar",
      data: [
        { metric: "Registered", count: args.registeredCount },
        { metric: "Client finals", count: args.clientFinalCount },
        { metric: "Missing required", count: args.missingRequiredCount },
        { metric: "Review required", count: args.reviewRequiredCount },
        { metric: "Hard fails", count: args.hardFailCount },
      ],
      xKey: "metric",
      yKey: "count",
      unit: "artifacts",
    },
    xKey: "metric",
    yKey: "count",
    unit: "artifacts",
    citationIds: args.citationIds,
  };
}

function artifactCitationMap(
  artifacts: readonly SourceArtifactRegistryRecordWithContent[],
  citations: readonly AnswerCitation[],
): string[] {
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  return citations
    .filter((citation) => citation.recordId && artifactIds.has(citation.recordId))
    .map((citation) => citation.id);
}

export async function buildArtifactQualityGovernedAnswer(
  input: BuildArtifactQualityGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(input.clientKey);
  if (!governedClientKey) return null;

  const artifacts = (
    await listSourceArtifactsForSourceEventIdWithContent(input.eventId)
  ).filter(
    (artifact) =>
      artifact.tenantKey === input.clientKey ||
      artifact.tenantKey === governedClientKey,
  );

  const candidates = artifacts.map((artifact) =>
    governedCandidateFromSourceArtifact(artifact, {
      clientKey: governedClientKey,
      tenantId: input.tenantId,
    }),
  );
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });

  if (bundle.decision === "block") {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "artifact_quality_lifecycle",
      status: "blocked",
      tenantFencePassed: false,
      gaps: [
        {
          id: "artifact-quality-governance-blocked",
          label: "Artifact evidence blocked by governance policy",
          detail:
            bundle.blocked
              .flatMap((blocked) => blocked.errors)
              .slice(0, 3)
              .join("; ") || "The governance gate blocked every artifact row.",
        },
      ],
    });
  }

  const summary = buildSourceArtifactLifecycleSummary(
    artifacts.map(lifecycleInputFromArtifact),
  );
  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = artifactCitationMap(artifacts, citations);
  const registeredCount =
    summary.aiDraftCount + summary.clientFinalCount + summary.evidenceOnlyCount;
  const directAnswer =
    registeredCount === 0
      ? `No Source artifacts are registered yet. The canonical matrix still expects ${summary.requiredCount} required artifacts, so the immediate gap is file/artifact capture.`
      : `${registeredCount} artifacts are registered: ${summary.clientFinalCount} client-final, ${summary.aiDraftCount} AI draft, and ${summary.evidenceOnlyCount} evidence-only. The quality posture is ${summary.quality.label.toLowerCase()} with ${summary.quality.missingRequiredCount} required gaps and ${summary.quality.hardFailCount} hard fails.`;

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "artifact_quality_lifecycle",
    status: registeredCount === 0 ? "no_data" : "answered",
    tenantFencePassed: true,
    directAnswer,
    businessImplication:
      summary.quality.hardFailCount > 0
        ? "The event should not treat the artifact set as decision-ready until missing required artifacts, draft-finality, and content/consulting-gate blockers are cleared."
        : "The artifact set has enough lifecycle signal for a reviewer to focus on remaining warnings and final acceptance rather than hunting through raw files.",
    recommendation:
      summary.quality.missingRequiredCount > 0
        ? "Start with the missing required artifacts, then accept reviewed client-final versions back into Source so downstream packs use the authoritative version."
        : "Use the current client-final artifacts as the authority base and resolve any review-required drafts before external use.",
    artifacts: [
      {
        ...buildArtifactQualityChart({
          registeredCount,
          clientFinalCount: summary.clientFinalCount,
          missingRequiredCount: summary.quality.missingRequiredCount,
          reviewRequiredCount: summary.quality.reviewRequiredCount,
          hardFailCount: summary.quality.hardFailCount,
          citationIds,
        }),
        artifact: "chart" as const,
      },
      {
        ...buildArtifactQualityTable({
          rows: summary.rows,
          citationIds,
        }),
        artifact: "table" as const,
      },
    ],
    citations,
    caveats: [
      {
        id: "artifact-quality-canonical-standards",
        label: "Canonical standards plus registry rows",
        detail:
          "Missing-artifact rows come from Source's canonical artifact standards; citations attach only to real source_artifacts rows that passed the governance gate.",
      },
      {
        id: "artifact-quality-indexing-known-gap",
        label: "Persistence is not full enterprise promotion",
        detail:
          "The answer proves Azure/Postgres registry persistence and parse/index status from source_artifacts; it does not claim OCR, transcription, vector indexing, or enterprise-context promotion unless those statuses already exist.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
