import { SOURCE_STAGE_ORDER, normalizeSourceStageKey } from "./constants";
import type {
  SourceAwardSowArtifactInput,
  SourceAwardSowHandoffCheckpoint,
  SourceAwardSowHandoffReadiness,
  SourceAwardSowHandoffReadinessInput,
  SourceAwardSowHandoffReadinessStatus,
  SourceAwardSowStageInput,
} from "./award-sow-handoff-readiness-types";
import type { SourceArtifactStatus, SourceStageKey } from "./types";

const DEFAULT_GENERATED_AT = "2026-04-26T00:00:00.000Z";

const SOURCE_MODULES_USED = [
  "event-stage-gate-status",
  "artifact-status-strip",
] as const;

const EXECUTED_AGREEMENT_OR_FINAL_SOW_PATTERNS = [
  /\bsigned (?:contract|agreement|statement of work|sow)\b/,
  /\bexecuted (?:contract|agreement|statement of work|sow)\b/,
  /\bsignature packet\b/,
  /\bfinal (?:statement of work|sow)\b/,
] as const;

const NON_EXECUTED_AGREEMENT_PATTERNS = [
  /\bawaiting signature\b/,
  /\bblocked\b/,
  /\bcontract-ready pending signature\b/,
  /\bfinal (?:statement of work|sow) missing\b/,
  /\bgap log\b/,
  /\bmissing final (?:statement of work|sow)\b/,
  /\bnot signed\b/,
  /\bpending (?:e-?signature|signature)\b/,
  /\bsigned contract (?:has )?not (?:been )?uploaded\b/,
  /\bunsigned\b/,
] as const;

function sortUnique(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort();
}

function artifactIsFinal(status: SourceArtifactStatus): boolean {
  return status === "approved" || status === "locked";
}

function artifactText(artifact: SourceAwardSowArtifactInput): string {
  return [artifact.id, artifact.title, artifact.summary ?? ""]
    .join(" ")
    .toLowerCase();
}

function artifactMatches(
  artifact: SourceAwardSowArtifactInput,
  patterns: readonly RegExp[],
): boolean {
  const text = artifactText(artifact);
  return patterns.some((pattern) => pattern.test(text));
}

function finalArtifacts(
  artifacts: readonly SourceAwardSowArtifactInput[],
  patterns: readonly RegExp[],
): SourceAwardSowArtifactInput[] {
  return artifacts.filter(
    (artifact) =>
      artifactIsFinal(artifact.status) && artifactMatches(artifact, patterns),
  );
}

function finalExecutedAgreementOrSowArtifacts(
  artifacts: readonly SourceAwardSowArtifactInput[],
): SourceAwardSowArtifactInput[] {
  return artifacts.filter((artifact) => {
    if (!artifactIsFinal(artifact.status)) return false;

    const text = artifactText(artifact);
    if (NON_EXECUTED_AGREEMENT_PATTERNS.some((pattern) => pattern.test(text))) {
      return false;
    }

    return EXECUTED_AGREEMENT_OR_FINAL_SOW_PATTERNS.some((pattern) =>
      pattern.test(text),
    );
  });
}

function stageByKey(
  stages: readonly SourceAwardSowStageInput[],
  keys: readonly SourceStageKey[],
): SourceAwardSowStageInput | undefined {
  return stages.find((stage) => {
    const canonical = normalizeSourceStageKey(stage.key);
    return canonical ? keys.includes(canonical) : keys.includes(stage.key);
  });
}

function stageIsComplete(stage: SourceAwardSowStageInput | undefined): boolean {
  return stage?.status === "complete" || stage?.gate?.status === "approved";
}

function stageIsOpen(
  currentStage: SourceStageKey,
  target: SourceStageKey,
): boolean {
  const current = normalizeSourceStageKey(currentStage) ?? currentStage;
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(current);
  const targetIndex = SOURCE_STAGE_ORDER.indexOf(target);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

function firstBlocker(
  checkpoints: SourceAwardSowHandoffCheckpoint[],
): SourceAwardSowHandoffCheckpoint | undefined {
  return checkpoints.find((checkpoint) => checkpoint.blockers.length > 0);
}

function statusFromBlockedCheckpoint(
  checkpoint: SourceAwardSowHandoffCheckpoint | undefined,
): SourceAwardSowHandoffReadinessStatus {
  switch (checkpoint?.key) {
    case "candidate_selection":
      return "blocked_candidate_selection";
    case "approval_readiness":
      return "blocked_approval_readiness";
    case "executed_agreement_sow":
      return "blocked_executed_agreement_sow";
    case "contract360_handoff":
      return "blocked_contract360_handoff";
    default:
      return "ready_for_contract360_handoff";
  }
}

function checkpointEvidence(items: string[]): string[] {
  return sortUnique(items);
}

function nextActionFor(
  status: SourceAwardSowHandoffReadinessStatus,
  blockers: readonly string[],
): string {
  if (status === "ready_for_contract360_handoff") {
    return "Open Contract 360 handoff review and confirm the canonical contract record mapping.";
  }

  return (
    blockers[0] ?? "Resolve the first blocked Stage 08 readiness checkpoint."
  );
}

export function buildSourceAwardSowHandoffReadiness(
  input: SourceAwardSowHandoffReadinessInput,
): SourceAwardSowHandoffReadiness {
  const event = input.event;
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const selectionReadiness = input.selectionReadiness;

  const selectionStage = stageByKey(event.stages, ["selection"]);
  const executiveStage = stageByKey(event.stages, ["executive_decision"]);
  const transitionStage = stageByKey(event.stages, ["transition"]);
  const selectionArtifacts = finalArtifacts(event.artifacts, [
    /\bd27_selection_memo\b/,
    /\bselection\b/,
    /\baward\b/,
  ]);
  const approvalArtifacts = finalArtifacts(event.artifacts, [
    /\bd24_decision_brief\b/,
    /\bapproval\b/,
    /\bdecision\b/,
    /\bsteward signoff\b/,
  ]);
  const agreementArtifacts = finalExecutedAgreementOrSowArtifacts(
    event.artifacts,
  );
  const handoffArtifacts = finalArtifacts(event.artifacts, [
    /\bd28_contract_record\b/,
    /\bd29_transition_plan\b/,
    /\bcontract 360\b/,
    /\bhandoff\b/,
    /\btransition plan\b/,
  ]);
  const selectionBlockers = sortUnique([
    ...(selectionReadiness?.unresolvedGateIssues ?? []),
    ...(selectionReadiness?.unresolvedCommercialIssues ?? []),
    ...(selectionReadiness?.unresolvedEvidenceIssues ?? []),
    selectionStage?.gate?.blocker ?? "",
  ]);

  const candidateSelectionBlockers =
    selectionReadiness?.selectionReviewReady ||
    stageIsComplete(selectionStage) ||
    selectionArtifacts.length > 0
      ? []
      : [
          selectionBlockers[0] ??
            "Candidate selection is not ready for award/SOW handoff.",
        ];
  const approvalBlockers =
    stageIsComplete(executiveStage) ||
    stageIsComplete(selectionStage) ||
    approvalArtifacts.length > 0
      ? []
      : [
          selectionStage?.gate?.blocker ??
            executiveStage?.gate?.blocker ??
            "Approval readiness is not proven by an approved executive decision, selection gate, or decision artifact.",
        ];
  const agreementBlockers =
    agreementArtifacts.length > 0
      ? []
      : [
          "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
        ];
  const handoffBlockers =
    agreementBlockers.length === 0 &&
    (stageIsOpen(event.currentStageKey, "transition") ||
      handoffArtifacts.length > 0)
      ? []
      : [
          agreementBlockers[0] ??
            transitionStage?.gate?.blocker ??
            "Contract 360 handoff is not ready until executed agreement/SOW evidence is present and the event has reached Transition.",
        ];

  const checkpoints: SourceAwardSowHandoffCheckpoint[] = [
    {
      key: "candidate_selection",
      label: "Candidate selection",
      status: candidateSelectionBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence: checkpointEvidence([
        selectionReadiness?.selectionReviewReady
          ? "Vendor selection readiness is clear."
          : "",
        stageIsComplete(selectionStage)
          ? "Selection stage or gate is complete."
          : "",
        ...selectionArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ]),
      blockers: checkpointEvidence(candidateSelectionBlockers),
    },
    {
      key: "approval_readiness",
      label: "Approval readiness",
      status: approvalBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence: checkpointEvidence([
        stageIsComplete(executiveStage)
          ? "Executive decision stage or gate is approved."
          : "",
        stageIsComplete(selectionStage) ? "Selection gate is approved." : "",
        ...approvalArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ]),
      blockers: checkpointEvidence(approvalBlockers),
    },
    {
      key: "executed_agreement_sow",
      label: "Executed agreement / SOW",
      status: agreementBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence: checkpointEvidence(
        agreementArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ),
      blockers: checkpointEvidence(agreementBlockers),
    },
    {
      key: "contract360_handoff",
      label: "Contract 360 handoff",
      status: handoffBlockers.length === 0 ? "ready" : "not_open",
      completedEvidence: checkpointEvidence([
        agreementArtifacts.length > 0
          ? "Executed agreement/SOW evidence is present for canonical mapping."
          : "",
        stageIsOpen(event.currentStageKey, "transition")
          ? "Event is at or beyond Transition."
          : "",
        ...handoffArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ]),
      blockers: checkpointEvidence(handoffBlockers),
    },
  ];

  const blockerCheckpoint = firstBlocker(checkpoints);
  const readinessStatus = statusFromBlockedCheckpoint(blockerCheckpoint);
  const blockers = checkpointEvidence(
    checkpoints.flatMap((checkpoint) => checkpoint.blockers),
  );
  const completedEvidence = checkpointEvidence(
    checkpoints.flatMap((checkpoint) => checkpoint.completedEvidence),
  );

  return {
    eventId: event.id,
    eventName: event.name,
    generatedAt,
    readinessStatus,
    readyForContract360Handoff:
      readinessStatus === "ready_for_contract360_handoff",
    checkpoints,
    completedEvidence,
    blockers,
    recommendedNextAction: nextActionFor(readinessStatus, blockers),
    authority: "source-award-sow-handoff-readiness",
    sourceModulesUsed: [...SOURCE_MODULES_USED],
    rationale: `Stage 08 Award & SOW handoff readiness is derived from vendor selection readiness, stage gates, and event artifact status for ${event.id}; it does not create awards, approvals, contracts, or Contract 360 records.`,
  };
}

export function formatSourceAwardSowHandoffReadinessAsMarkdown(
  readiness: SourceAwardSowHandoffReadiness,
): string {
  return [
    "# Source Stage 08 Award & SOW Handoff Readiness",
    "",
    `- Event: ${readiness.eventName} (${readiness.eventId})`,
    `- Generated: ${readiness.generatedAt}`,
    `- Authority: ${readiness.authority}`,
    `- Readiness status: ${readiness.readinessStatus}`,
    `- Contract 360 handoff ready: ${readiness.readyForContract360Handoff ? "Yes" : "No"}`,
    "",
    "## Checkpoints",
    ...readiness.checkpoints.flatMap((checkpoint) => [
      `- ${checkpoint.label}: ${checkpoint.status}`,
      `  - Completed evidence: ${checkpoint.completedEvidence.join("; ") || "none"}`,
      `  - Blockers: ${checkpoint.blockers.join("; ") || "none"}`,
    ]),
    "",
    `- Recommended next action: ${readiness.recommendedNextAction}`,
    `- Source modules used: ${readiness.sourceModulesUsed.join(", ")}`,
  ].join("\n");
}
