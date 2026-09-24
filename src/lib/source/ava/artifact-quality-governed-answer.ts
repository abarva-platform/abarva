// ─────────────────────────────────────────────────────────────────────────────
// Governed artifact-quality chat answer.
//
// Builds a structured Source aVa answer from the same artifact lifecycle matrix
// the Files workspace renders. This is intentionally read-only: it lists current
// registry rows, maps them through the mandatory context/corpus gate, and then
// projects the deterministic lifecycle/quality summary into a table + chart.
// It never claims OCR, vector indexing, or enterprise-context promotion.
// ─────────────────────────────────────────────────────────────────────────────

import type { GovernedCandidate } from "@/lib/governance/agent-context-bundle";
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
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
import {
  buildGovernedEventContextBundle,
  type EventContextCandidate,
} from "@/lib/source/ava/event-context-bundle";

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

/**
 * artifactId -> the version the acceptance record names as authoritative.
 *
 * Read from `authoritative_version_id`, never from the artifact it is about:
 * the two are equal today for a first acceptance and differ the moment a
 * superseding version is accepted, which is precisely the case the fence has
 * to catch. The fence module is pure and cannot tell a map built correctly
 * from one built out of the wrong column, so this is where that is decided.
 */
export function acceptedArtifactVersionsFor(
  acceptances: ReadonlyMap<string, ArtifactAcceptanceRecord>,
): Record<string, string> {
  const accepted: Record<string, string> = {};
  for (const [artifactId, acceptance] of acceptances) {
    accepted[artifactId] = acceptance.authoritativeVersionId;
  }
  return accepted;
}

/**
 * Map registry rows to event-context candidates for the fence.
 *
 * Every row is handed over, including rows belonging to another tenant or
 * another event, and each candidate carries the tenancy and event it asserts
 * for itself. That is deliberate: a pre-filter here would decide the isolation
 * question before the fence saw it, leaving the fence's tenant and event rules
 * unreachable and therefore unfalsifiable.
 */
export function eventContextCandidatesForArtifactQuality(
  artifacts: readonly SourceArtifactRegistryRecordWithContent[],
  acceptances: ReadonlyMap<string, ArtifactAcceptanceRecord>,
  /**
   * The authenticated tenant id. A registry row asserts a tenant KEY and no
   * tenant id, so the key is the leg of the fence's tenancy rule that decides
   * anything here; the id is carried through so the rule reads the same as it
   * does for candidate kinds that do assert one.
   */
  scope: { tenantId: string | null },
): EventContextCandidate[] {
  return artifacts.map((artifact) => {
    const acceptance = acceptances.get(artifact.id);
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
      kind: "accepted_artifact",
      title: artifact.originalName,
      // Canonicalised at the boundary, from the row's OWN key — so a row from
      // another tenant resolves to another governed key (or to none) and is
      // refused, rather than being handed the authorized identity's key.
      clientKey:
        governedClientKeyForSourceClientKey(artifact.tenantKey) ??
        artifact.tenantKey,
      tenantId: scope.tenantId,
      eventId: artifact.sourceEventId,
      contractId: null,
      artifactId: artifact.id,
      // The accept route stores the source artifact row id as the
      // authoritative version id, so a superseded row is a different id and
      // fails the binding.
      versionId: artifact.id,
      stageKey: artifact.stageKey,
      reviewState: acceptance ? "accepted" : "unreviewed",
      contentDriftStatus: acceptance?.contentDriftStatus ?? "unknown",
      downstreamContextPolicy: acceptance?.downstreamContextPolicy ?? "restricted",
      sourceLayer: "artifact",
      sourceBasis: artifact.originalName,
      classification: sourceDataClassificationToClassification(
        artifact.dataClassification,
      ),
      retrievability: retrievabilityForArtifact(artifact),
      agentReadinessStatus:
        artifact.embeddingStatus === "embedded"
          ? "committed_not_indexed"
          : "not_reviewed",
      confidenceLevel: confidenceForArtifact(artifact),
      citedRenderVerifiedAt: null,
      citations: [`${artifact.originalName} — ${locator}`],
    };
  });
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

  const registered = await listSourceArtifactsForSourceEventIdWithContent(
    input.eventId,
  );
  // The deterministic lifecycle view — counts, table, chart — stays scoped the
  // way it already was. It reports what is registered for this tenant; it
  // quotes nothing, so it is not the evidence path.
  const artifacts = registered.filter(
    (artifact) =>
      artifact.tenantKey === input.clientKey ||
      artifact.tenantKey === governedClientKey,
  );

  // C-506 · the evidence path now runs through the acceptance-bound event
  // fence, and every registered file is handed to it — including files of
  // another tenant or another event, so the fence's isolation rules decide
  // rather than a filter above them.
  const acceptances = await getLatestArtifactAcceptancesByArtifactIds(
    registered.map((artifact) => artifact.id),
  );
  const declaredTenantId = input.tenantId ?? "";
  const fenced = buildGovernedEventContextBundle(
    eventContextCandidatesForArtifactQuality(registered, acceptances, {
      tenantId: declaredTenantId,
    }),
    {
      tenantId: declaredTenantId,
      clientKey: governedClientKey,
      eventId: input.eventId,
      contractId: null,
      // No `stage_plan` candidate is produced here, so no rule reads this.
      // Empty rather than a guessed stage: a guess would become load-bearing
      // the day this mode starts offering plans.
      currentStageKey: "",
      acceptedArtifactVersions: acceptedArtifactVersionsFor(acceptances),
    },
    { requireAgentReady: false },
  );
  const bundle = fenced.bundle;

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
  // Only this tenant's own files are reportable as a gap: a refusal that fired
  // because the file belongs to another tenant or another event is an
  // isolation result, and naming it here would describe someone else's data.
  const tenantArtifactIds = new Set(artifacts.map((artifact) => artifact.id));
  const unboundEvidenceCount = fenced.refused.filter((refusal) =>
    tenantArtifactIds.has(refusal.candidate.id),
  ).length;
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
        : "The artifact set has enough lifecycle signal for a reviewer to focus on remaining warnings and final acceptance rather than searching through loose files.",
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
    gaps: [
      ...(registeredCount === 0
        ? [
            {
              id: "artifact-quality-required-files-missing",
              label: "Required artifact capture has not started",
              detail:
                "Source has the expected artifact standard for this event, but no accepted files are available yet. Upload or accept the required workshop and decision files before using this answer as a readiness view.",
              severity: "high" as const,
            },
          ]
        : []),
      ...(unboundEvidenceCount > 0
        ? [
            {
              id: "artifact-quality-evidence-not-acceptance-bound",
              label: "Some files are not attributable yet",
              detail: `${unboundEvidenceCount} of this event's files are not bound to an accepted, current version, so nothing in this answer is attributed to them. Accept the current version of each file to make it quotable.`,
              severity: "medium" as const,
            },
          ]
        : []),
    ],
    caveats: [
      {
        id: "artifact-quality-canonical-standards",
        label: "Standards plus accepted Source records",
        detail:
          "Missing artifacts come from Source's artifact standards; citations attach only to accepted Source artifact records that passed the governance gate.",
      },
      {
        id: "artifact-quality-indexing-known-gap",
        label: "Persistence is not full enterprise promotion",
        detail:
          "The answer confirms stored artifact records and visible processing status; it does not claim OCR, transcription, search readiness, or enterprise-context promotion unless those statuses already exist.",
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
