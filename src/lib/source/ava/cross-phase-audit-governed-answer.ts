import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { buildSourceAwardSowHandoffReadiness } from "@/lib/source/award-sow-handoff-readiness";
import type {
  SourceAwardSowArtifactInput,
  SourceAwardSowStageInput,
} from "@/lib/source/award-sow-handoff-readiness-types";
import {
  SOURCE_NEW_PHASE_DISPLAY_LABELS,
  sourceNewHistoricalGapPhases,
  type SourceNewPhaseEvidence,
} from "@/lib/source/new-workspace/phase-state";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import type { SourceStageKey } from "@/lib/source/types";

export interface SourceCrossPhaseAuditEvent {
  id: string;
  name: string;
  lifecycle: string;
  currentStageKey: SourceStageKey;
  currentStageLabel: string;
  triggerDescription?: string | null;
  scopeDescription?: string | null;
  decisionOwner?: string | null;
  stages: readonly SourceAwardSowStageInput[];
  artifacts: readonly SourceAwardSowArtifactInput[];
}

export interface BuildCrossPhaseAuditGovernedAnswerInput {
  question: string;
  event: SourceCrossPhaseAuditEvent;
  evidence: AvaAnswerPacket;
  ndaCoverage: SourceNewStage05NdaCoverage;
}

interface EvidenceCounts {
  stored: number;
  parsed: number;
  searchReady: number;
  needsParser: number;
}

export function looksLikeCrossPhaseAuditQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const asksAuditCompletion =
    /\b(audit[- ]complete|audit readiness|audit-ready|audit ready)\b/.test(q);
  const namesDownstreamHandoff =
    /\bcontract\s*360\b/.test(q) && /\boptimi[sz]e\b/.test(q);
  const namesPhaseHistory =
    /\b(supplier|suppliers|nda|phase history|historical gap)\b/.test(q);
  const namesEvidenceReadiness =
    /\b(evidence|parsed|parsing|search-ready|search ready|readiness)\b/.test(q);
  const namesStage08 = /\b(stage\s*0?8|handoff|contract[- ]formation)\b/.test(
    q,
  );
  return (
    asksAuditCompletion &&
    namesDownstreamHandoff &&
    namesPhaseHistory &&
    namesEvidenceReadiness &&
    namesStage08
  );
}

function recorded(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function stageRecorded(
  event: SourceCrossPhaseAuditEvent,
  keys: readonly SourceStageKey[],
): boolean {
  return event.stages.some(
    (stage) =>
      keys.includes(stage.key) &&
      (stage.status === "complete" || stage.gate?.status === "approved"),
  );
}

function phaseEvidenceFor(
  event: SourceCrossPhaseAuditEvent,
  ndaCoverage: SourceNewStage05NdaCoverage,
): SourceNewPhaseEvidence {
  return {
    request:
      recorded(event.triggerDescription) ||
      stageRecorded(event, ["strategy", "sourcing_strategy", "intake"]),
    define:
      recorded(event.scopeDescription) ||
      recorded(event.decisionOwner) ||
      stageRecorded(event, ["scope"]),
    suppliers: ndaCoverage.suppliers.length > 0,
    rfi: stageRecorded(event, ["rfp", "rfp_rfi_package"]),
  };
}

function evidenceCounts(answer: AvaAnswerPacket): EvidenceCounts | null {
  const chart = answer.artifacts.find(
    (artifact) =>
      artifact.artifact === "chart" &&
      artifact.id === "source-evidence-processing-readiness",
  );
  if (!chart || chart.artifact !== "chart") return null;
  const data = chart.data as
    | { data?: Array<{ metric?: unknown; count?: unknown }> }
    | undefined;
  if (!Array.isArray(data?.data)) return null;
  const countFor = (label: string): number => {
    const row = data.data?.find((item) => item.metric === label);
    return typeof row?.count === "number" ? row.count : 0;
  };
  return {
    stored: countFor("Stored"),
    parsed: countFor("Parsed"),
    searchReady: countFor("Search-ready"),
    needsParser: countFor("Needs parser") || countFor("Parser-ready"),
  };
}

function evidenceIsIncomplete(
  answer: AvaAnswerPacket,
  counts: EvidenceCounts | null,
): boolean {
  if (!answer.safety.tenantFencePassed) return true;
  if (answer.status === "blocked" || answer.status === "no_data") return true;
  if (!counts) return true;
  return (
    counts.stored === 0 ||
    counts.parsed < counts.stored ||
    counts.searchReady < counts.stored ||
    counts.needsParser > 0
  );
}

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function buildCrossPhaseAuditGovernedAnswer(
  input: BuildCrossPhaseAuditGovernedAnswerInput,
): AvaAnswerPacket {
  const phaseEvidence = phaseEvidenceFor(input.event, input.ndaCoverage);
  const historicalGaps = sourceNewHistoricalGapPhases(
    {
      currentStage: input.event.currentStageKey,
      lifecycle: input.event.lifecycle,
    },
    phaseEvidence,
  );
  const evidenceProjection = evidenceCounts(input.evidence);
  const evidenceIncomplete = evidenceIsIncomplete(
    input.evidence,
    evidenceProjection,
  );
  const handoff = buildSourceAwardSowHandoffReadiness({
    event: {
      id: input.event.id,
      name: input.event.name,
      currentStageKey: input.event.currentStageKey,
      currentStageLabel: input.event.currentStageLabel,
      stages: input.event.stages,
      artifacts: input.event.artifacts,
    },
  });

  const phaseGapLabels = historicalGaps.map(
    (phase) => SOURCE_NEW_PHASE_DISPLAY_LABELS[phase],
  );
  const phaseHistoryLine = phaseGapLabels.length
    ? `Phase history: ${phaseGapLabels.join(", ")} ${phaseGapLabels.length === 1 ? "is a historical gap" : "are historical gaps"}; the event is terminal, but no governed record proves that work.`
    : "Phase history: no historical gap is identified in the recorded Source New checkpoints.";
  const handoffLine = handoff.readyForContract360Handoff
    ? "Stage 08 handoff has reached contract-formation review, but canonical contract identity and Optimize launch remain human-governed actions."
    : `Stage 08 handoff is blocked: ${handoff.blockers.join(" ")}`;

  const earliestAction =
    phaseGapLabels.length > 0
      ? {
          label: `Reconstruct ${phaseGapLabels[0]} history`,
          rationale:
            "The earliest missing governed phase record must be resolved before later evidence or handoff work can make the event audit-complete.",
        }
      : evidenceIncomplete
        ? {
            label:
              input.evidence.recommendation?.trim() ||
              "Resolve governed evidence readiness",
            rationale:
              "Evidence must be parsed, indexed, and governed before it can support a complete audit or downstream handoff.",
          }
        : {
            label: handoff.recommendedNextAction,
            rationale:
              "Stage 08 is the next unresolved governed checkpoint after phase history and evidence readiness.",
          };

  const gaps = [
    ...historicalGaps.map((phase) => ({
      id: `source-cross-phase-history-${phase}`,
      label: `${SOURCE_NEW_PHASE_DISPLAY_LABELS[phase]} historical gap`,
      detail:
        "The event is complete, but this Source New phase has no governed record. Position in the lifecycle is not evidence that the work occurred.",
      severity: "critical" as const,
    })),
    ...(evidenceIncomplete
      ? [
          {
            id: "source-cross-phase-evidence-readiness",
            label: "Evidence readiness incomplete",
            detail: input.evidence.directAnswer,
            severity: "high" as const,
          },
        ]
      : []),
    ...handoff.blockers.map((blocker, index) => ({
      id: `source-cross-phase-stage08-${index + 1}`,
      label: "Stage 08 handoff blocker",
      detail: blocker,
      severity: "high" as const,
    })),
  ];

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: input.evidence.tenantKey,
    question: input.question,
    intent: "source_cross_phase_audit_readiness",
    status: "blocked",
    tenantFencePassed: input.evidence.safety.tenantFencePassed,
    directAnswer: [
      "No. Audit completion and Contract 360 / Optimize readiness are not proven.",
      phaseHistoryLine,
      `Current evidence readiness: ${input.evidence.directAnswer}`,
      handoffLine,
      `One next action: ${earliestAction.label}.`,
    ].join("\n\n"),
    businessImplication:
      "A terminal event is not an audit-complete event when an earlier governed phase is missing, evidence is not ready, or the contract-formation handoff remains blocked.",
    recommendation: earliestAction.label,
    factsUsed: uniqueById(input.evidence.factsUsed),
    metricsUsed: uniqueById(input.evidence.metricsUsed),
    relationshipsUsed: uniqueById(input.evidence.relationshipsUsed),
    artifacts: input.evidence.artifacts,
    citations: input.evidence.citations,
    gaps: uniqueById([...input.evidence.gaps, ...gaps]),
    caveats: uniqueById([
      ...input.evidence.caveats,
      {
        id: "source-cross-phase-no-authority-action",
        label: "Read-only audit answer",
        detail:
          "This answer does not approve evidence, select or contact a supplier, make an award, fabricate a signature, create a contract, publish Contract 360, or launch Optimize.",
      },
    ]),
    nextSteps: [
      {
        id: "source-cross-phase-audit-earliest-action",
        label: earliestAction.label,
        rationale: earliestAction.rationale,
        targetSurface: "source",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: input.evidence.citations.length,
      factCount:
        input.evidence.factsUsed.length +
        historicalGaps.length +
        handoff.blockers.length,
      metricCount: input.evidence.metricsUsed.length,
      relationshipCount: input.evidence.relationshipsUsed.length,
      hasTenantFacts:
        input.evidence.safety.tenantFencePassed &&
        (input.evidence.citations.length > 0 || evidenceProjection !== null),
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
