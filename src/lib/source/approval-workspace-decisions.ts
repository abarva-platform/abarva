import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import {
  SOURCE_APPROVAL_REASON_MIN_LENGTH,
  normalizeApprovalReason,
} from "@/lib/source/source-governance-enforcement";

export type ApprovalDecisionBlockerCode =
  | "approval_item_missing"
  | "approval_already_recorded"
  | "stale_version"
  | "reviewer_role_missing"
  | "workflow_inputs_open"
  | "artifact_review_open"
  | "unauthorized_viewer"
  | "approval_reason_required";

export interface ApprovalDecisionBlocker {
  code: ApprovalDecisionBlockerCode;
  detail: string;
}

export interface ApprovalDecisionPrimaryAction {
  label: string;
  enabled: boolean;
  disabledReason: string | null;
}

export interface ApprovalDecisionSummary {
  id: string;
  eventId: string;
  eventCode: string;
  eventName: string;
  versionKey: string | null;
  versionLabel: string;
  stageLabel: string;
  reviewerRole: string | null;
  status: "ready" | "blocked" | "recorded";
  blockers: ApprovalDecisionBlocker[];
  primaryAction: ApprovalDecisionPrimaryAction;
}

export interface ApprovalDecisionGroup {
  key: string;
  eventId: string;
  eventCode: string;
  eventName: string;
  versionKey: string | null;
  versionLabel: string;
  decisions: ApprovalDecisionSummary[];
}

export interface BuildApprovalWorkspaceDecisionsInput {
  eventId: string;
  eventCode: string;
  eventName: string;
  currentStageKey: string;
  stageLabel: string;
  currentStageItem: ApprovalsInboxItem | null;
  approvalRecorded: boolean;
  workflowComplete: boolean;
  artifactsReady: boolean;
  gateActionArmed: boolean;
  approvalRationale?: string | null;
}

export function buildApprovalWorkspaceDecisions(
  input: BuildApprovalWorkspaceDecisionsInput,
): ApprovalDecisionGroup[] {
  const decision = buildDecision(input);
  return [
    {
      key: `${input.eventId}:${decision.versionKey ?? "unbound"}`,
      eventId: input.eventId,
      eventCode: input.eventCode,
      eventName: input.eventName,
      versionKey: decision.versionKey,
      versionLabel: decision.versionLabel,
      decisions: [decision],
    },
  ];
}

function buildDecision(
  input: BuildApprovalWorkspaceDecisionsInput,
): ApprovalDecisionSummary {
  const item = input.currentStageItem;
  const decisionEvidenceItem = input.approvalRecorded ? null : item;
  const versionKey = clean(decisionEvidenceItem?.versionKey);
  const versionLabel =
    clean(decisionEvidenceItem?.versionLabel) ?? input.stageLabel;
  const reviewerRole =
    clean(decisionEvidenceItem?.requiredReviewerRole) ?? null;
  const expectedVersionKey = `${input.eventId}:${input.currentStageKey}`;
  const blockers: ApprovalDecisionBlocker[] = [];

  if (!item) {
    blockers.push({
      code: "approval_item_missing",
      detail:
        "No routed approval item is bound to this event and current stage.",
    });
  }

  if (input.approvalRecorded) {
    blockers.push({
      code: "approval_already_recorded",
      detail: `${input.stageLabel} already has a recorded approval.`,
    });
  }

  if (!versionKey) {
    blockers.push({
      code: "stale_version",
      detail:
        "No authoritative event/version binding was supplied for this decision.",
    });
  } else if (versionKey !== expectedVersionKey) {
    blockers.push({
      code: "stale_version",
      detail: `This decision is bound to ${versionLabel}, not the current ${input.stageLabel} gate.`,
    });
  }

  if (!reviewerRole) {
    blockers.push({
      code: "reviewer_role_missing",
      detail: "No reviewer role is recorded for this decision.",
    });
  }

  if (!input.workflowComplete) {
    blockers.push({
      code: "workflow_inputs_open",
      detail: "Required workflow inputs are still open for the current stage.",
    });
  }

  if (!input.artifactsReady) {
    blockers.push({
      code: "artifact_review_open",
      detail:
        "Required or gate-defining artifacts still need review before approval.",
    });
  }

  if (!input.approvalRecorded && !input.gateActionArmed) {
    blockers.push({
      code: "unauthorized_viewer",
      detail:
        "This viewer does not currently have the server-side approval action armed.",
    });
  }

  const rationale = normalizeApprovalReason(input.approvalRationale);
  if (
    !input.approvalRecorded &&
    input.gateActionArmed &&
    rationale.length < SOURCE_APPROVAL_REASON_MIN_LENGTH
  ) {
    blockers.push({
      code: "approval_reason_required",
      detail: `A human approval reason of at least ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters is required.`,
    });
  }

  const status: ApprovalDecisionSummary["status"] = input.approvalRecorded
    ? "recorded"
    : blockers.length === 0
      ? "ready"
      : "blocked";

  const disabledReason = blockers[0]?.detail ?? null;
  return {
    id: `${input.eventId}:${input.currentStageKey}:decision`,
    eventId: input.eventId,
    eventCode: input.eventCode,
    eventName: input.eventName,
    versionKey,
    versionLabel,
    stageLabel: input.stageLabel,
    reviewerRole,
    status,
    blockers,
    primaryAction: {
      label: status === "ready" ? "Approve now" : "Resolve blockers",
      enabled: status === "ready",
      disabledReason,
    },
  };
}

function clean(value: string | null | undefined): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}
