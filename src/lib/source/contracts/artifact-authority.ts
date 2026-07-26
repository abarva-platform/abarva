// Central artifact-authority resolver (PR 4C). The single place that turns
// a real persisted source_artifacts row + its acceptance-ledger state + the
// event's current stage + its SourceArtifactContract into one decision
// object — draft / accepted / authoritative / export-eligible / final —
// with structured blockers explaining whatever isn't true yet.
//
// Preserves the PR 4B boundary explicitly: an out-of-sequence, human-authored
// chat-save draft can exist (nothing here blocks SAVING) but this resolver
// is what every accept/export/downstream-context call site now consults
// before treating that draft as accepted, authoritative, exportable-as-final,
// or usable as upstream evidence. Stage and upstream eligibility are
// enforced here — at accept/export/authoritative-use/downstream-consumption
// time — not at save time (ADR-0015's PR 4B amendment).

import {
  deriveSourceArtifactGovernanceStage,
  type SourceArtifactGovernanceStage,
} from "@/lib/source/artifact-governance";
import type { SourceStageKey } from "@/lib/source/types";
import { isArtifactEligibleAtStage, requireSourceArtifactContract } from "./registry";

const GOVERNANCE_STAGE_RANK: Record<SourceArtifactGovernanceStage, number> = {
  ai_draft: 0,
  human_review: 1,
  approved_for_external_use: 2,
  client_final: 3,
  superseded: -1, // never satisfies a minimum-stage requirement
};

export type ArtifactAuthorityBlockerCode =
  | "not_reviewable" // superseded/retired/blocked — terminal, non-authoritative state
  | "review_required" // contract requires review and none has happened yet
  | "not_accepted" // no active acceptance record
  | "stage_not_eligible" // event hasn't reached the artifact's earliest eligible stage
  | "governance_stage_below_export_minimum"
  | "sibling_not_accepted"; // a named finality precondition (e.g. d26 for d24/d27) isn't met

export interface ArtifactAuthorityBlocker {
  code: ArtifactAuthorityBlockerCode;
  detail: string;
  meta?: Record<string, unknown>;
}

export interface ArtifactAuthorityDecision {
  code: string;
  governanceStage: SourceArtifactGovernanceStage;
  /** Nothing has happened to this artifact yet beyond generation/authoring. */
  isDraft: boolean;
  /** True once an active (non-superseded) acceptance record exists. */
  isAccepted: boolean;
  /**
   * Accepted, not superseded/retired/blocked, and the event has reached the
   * artifact's contract-defined eligible stage. This is the ONLY thing that
   * makes an artifact usable as upstream evidence or eligible to enter
   * downstream (aVa/context-binder) consumption.
   */
  isAuthoritative: boolean;
  /** Whether export is currently permitted, per the contract's exportEligibility rule. */
  isExportEligible: boolean;
  /** Finality — a stronger claim than export-eligible; see contract.finalityConditions. */
  isFinal: boolean;
  blockers: ArtifactAuthorityBlocker[];
}

export interface ArtifactAuthorityInput {
  code: string;
  status: string | null;
  lifecycleState: string | null;
  approvalState: string | null;
  approvedBy: string | null;
  /** True when a real, non-superseded row exists in source_artifact_acceptances for this artifact. */
  hasActiveAcceptance: boolean;
  /** The sourcing event's real, current stage — never client-supplied. */
  eventStageKey: SourceStageKey;
  /**
   * Only meaningful for artifacts with contract.finalityConditions set
   * (currently d24_decision_brief, d27_selection_memo, both requiring
   * d26_steward_signoff) — whether that named sibling artifact is itself
   * accepted. Callers without a finality-bearing artifact may omit this.
   */
  siblingArtifactsAccepted?: boolean;
}

function isTerminalNonAuthoritative(input: ArtifactAuthorityInput): boolean {
  return (
    input.lifecycleState === "superseded" ||
    input.lifecycleState === "retired" ||
    input.status === "blocked"
  );
}

export function resolveArtifactAuthority(
  input: ArtifactAuthorityInput,
): ArtifactAuthorityDecision {
  const contract = requireSourceArtifactContract(input.code);
  const blockers: ArtifactAuthorityBlocker[] = [];

  const governanceStage = deriveSourceArtifactGovernanceStage({
    status: input.status,
    isClientFinal: input.status === "client_final",
    lifecycleState: input.lifecycleState,
    approvalState: input.approvalState,
    approvedBy: input.approvedBy,
  });

  const terminal = isTerminalNonAuthoritative(input);
  if (terminal) {
    blockers.push({
      code: "not_reviewable",
      detail: `${contract.displayName} (${contract.code}) is superseded, retired, or blocked and cannot be authoritative, exported as final, or used as upstream evidence.`,
      meta: { lifecycleState: input.lifecycleState, status: input.status },
    });
  }

  const isDraft = !terminal && !input.hasActiveAcceptance;
  if (
    isDraft &&
    contract.reviewRequirement !== "review_recommended" &&
    !input.hasActiveAcceptance
  ) {
    blockers.push({
      code: "review_required",
      detail: `${contract.displayName} (${contract.code}) requires ${contract.reviewRequirement.replace(/_/g, " ")} before it can be accepted.`,
      meta: { reviewRequirement: contract.reviewRequirement },
    });
  }
  if (!input.hasActiveAcceptance && !terminal) {
    blockers.push({
      code: "not_accepted",
      detail: `${contract.displayName} (${contract.code}) has not been accepted as authoritative yet — a human-authored or AI-generated draft alone is never authoritative.`,
    });
  }

  const stageEligible = isArtifactEligibleAtStage(
    input.code,
    input.eventStageKey,
  );
  if (!stageEligible) {
    blockers.push({
      code: "stage_not_eligible",
      detail: `${contract.displayName} (${contract.code}) cannot become authoritative before stage "${contract.earliestEligibleStage}" — the event is currently at "${input.eventStageKey}".`,
      meta: {
        earliestEligibleStage: contract.earliestEligibleStage,
        currentStage: input.eventStageKey,
      },
    });
  }

  const isAccepted = input.hasActiveAcceptance && !terminal;
  const isAuthoritative = isAccepted && stageEligible;

  const requiredMinimumStage = contract.governanceBannerClientFacing
    ? contract.exportEligibility.clientFacingMinimumGovernanceStage
    : contract.exportEligibility.internalMinimumGovernanceStage;
  const meetsExportMinimum =
    !terminal &&
    GOVERNANCE_STAGE_RANK[governanceStage] >=
      GOVERNANCE_STAGE_RANK[requiredMinimumStage];
  if (!meetsExportMinimum) {
    blockers.push({
      code: "governance_stage_below_export_minimum",
      detail: `${contract.displayName} (${contract.code}) is at governance stage "${governanceStage}", below the required "${requiredMinimumStage}" for ${contract.governanceBannerClientFacing ? "client/vendor-facing" : "internal"} export.`,
      meta: { governanceStage, requiredMinimumStage },
    });
  }
  const isExportEligible = meetsExportMinimum;

  let isFinal = false;
  if (contract.finalityConditions) {
    const meetsFinalityStage =
      GOVERNANCE_STAGE_RANK[governanceStage] >=
      GOVERNANCE_STAGE_RANK[contract.finalityConditions.requiresGovernanceStageAtLeast];
    const siblingsOk =
      contract.finalityConditions.requiresSiblingArtifactsAccepted.length ===
        0 || input.siblingArtifactsAccepted === true;
    if (!siblingsOk) {
      blockers.push({
        code: "sibling_not_accepted",
        detail: `${contract.displayName} (${contract.code}) cannot claim finality until ${contract.finalityConditions.requiresSiblingArtifactsAccepted.join(", ")} ${contract.finalityConditions.requiresSiblingArtifactsAccepted.length > 1 ? "are" : "is"} accepted.`,
        meta: {
          requiresSiblingArtifactsAccepted:
            contract.finalityConditions.requiresSiblingArtifactsAccepted,
        },
      });
    }
    isFinal = isAuthoritative && meetsFinalityStage && siblingsOk;
  }

  return {
    code: input.code,
    governanceStage,
    isDraft,
    isAccepted,
    isAuthoritative,
    isExportEligible,
    isFinal,
    blockers,
  };
}

/**
 * Whether a candidate upstream artifact satisfies a required-upstream
 * dependency — the shared semantics ask #6 (ADR-0015) required: correct
 * code (caller's responsibility — this checks one already-code-matched
 * candidate), accepted/authoritative, current (non-superseded) version.
 * Tenant/event ownership match is the caller's query-scoping responsibility
 * (the candidate must already come from a tenant/event-scoped read) — this
 * function only judges the row it's given.
 */
export function upstreamCandidateSatisfiesRequirement(
  input: ArtifactAuthorityInput,
): boolean {
  return resolveArtifactAuthority(input).isAuthoritative;
}
