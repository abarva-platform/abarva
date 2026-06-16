import type { SourceGateCriterion } from "@/lib/source/canonical-specs";
import {
  SOURCE_STAGE_GATE_REQUIRED_APPROVALS_BY_TRANSITION,
  SOURCE_STAGE_GATE_TRANSITIONS,
} from "@/lib/source/source-stage-gates";
import type { SourceStageKey } from "@/lib/source/types";

export type SourceApprovalOwnerRole = SourceGateCriterion["ownerRole"];

export interface SourceApprovalRequirement {
  requirementId: string;
  transitionId: string;
  fromStage: SourceStageKey;
  toStage: SourceStageKey | "closed";
  label: string;
  ownerRole: SourceApprovalOwnerRole;
}

export interface SourceApprovalRoutingEvent {
  id: string;
  decisionOwner?: string | null;
  createdByUserId?: string | null;
}

export type SourceApproverResolution =
  | {
      status: "resolved";
      ownerRole: SourceApprovalOwnerRole;
      name: string;
      userId: string | null;
      personId: string | null;
      basis: "event-created-by" | "event-decision-owner-name";
    }
  | {
      status: "unresolved";
      ownerRole: SourceApprovalOwnerRole;
      reason: string;
    };

export type SourceApprovalDisplayStatus =
  | "pending"
  | "approved"
  | "unresolved";

export interface SourceCriterionApprovalView {
  ownerRole: SourceApprovalOwnerRole;
  status: SourceApprovalDisplayStatus;
  label: string;
  detail: string;
}

export const APPROVAL_LABEL_OWNER_ROLE_MAP: Readonly<
  Record<string, SourceApprovalOwnerRole>
> = {
  "Sourcing lead review": "sourcing-lead",
  "Business sponsor approval": "sponsor",
  "Procurement release approval": "sourcing-lead",
  "Evaluation governance checkpoint": "steward",
  "Finance and commercial lead review": "finance",
  "Steering alignment": "sponsor",
  "Executive review": "sponsor",
  "Contract and mobilization sign-off": "legal",
  "Operations readiness review": "sourcing-lead",
  "Value office closure review": "finance",
};

export function approvalRequirementsForTransitions(): SourceApprovalRequirement[] {
  return SOURCE_STAGE_GATE_TRANSITIONS.flatMap((transition) => {
    const labels =
      SOURCE_STAGE_GATE_REQUIRED_APPROVALS_BY_TRANSITION[transition.id] ?? [];
    return labels.map((label) => ({
      requirementId: `${transition.id}:${slugify(label)}`,
      transitionId: transition.id,
      fromStage: transition.from,
      toStage: transition.to,
      label,
      ownerRole: resolveOwnerRoleForApprovalLabel(label),
    }));
  });
}

export function approvalRequirementsForStage(
  fromStage: SourceStageKey,
): SourceApprovalRequirement[] {
  return approvalRequirementsForTransitions().filter(
    (requirement) => requirement.fromStage === fromStage,
  );
}

export function resolveOwnerRoleForApprovalLabel(
  label: string,
): SourceApprovalOwnerRole {
  const ownerRole = APPROVAL_LABEL_OWNER_ROLE_MAP[label];
  if (!ownerRole) {
    throw new Error(`Unmapped Source approval label: ${label}`);
  }
  return ownerRole;
}

export function resolveApprover(
  event: SourceApprovalRoutingEvent,
  ownerRole: SourceApprovalOwnerRole,
): SourceApproverResolution {
  if (ownerRole === "sourcing-lead") {
    const userId = event.createdByUserId?.trim();
    if (userId) {
      return {
        status: "resolved",
        ownerRole,
        name: "Sourcing lead",
        userId,
        personId: null,
        basis: "event-created-by",
      };
    }
    return {
      status: "unresolved",
      ownerRole,
      reason: "No event creator user id is recorded.",
    };
  }

  if (ownerRole === "sponsor") {
    const sponsorName = event.decisionOwner?.trim();
    if (sponsorName) {
      return {
        status: "resolved",
        ownerRole,
        name: sponsorName,
        userId: null,
        personId: null,
        basis: "event-decision-owner-name",
      };
    }
    return {
      status: "unresolved",
      ownerRole,
      reason: "No decision owner is recorded on the event.",
    };
  }

  if (ownerRole === "atlas" || ownerRole === "sentinel") {
    return {
      status: "unresolved",
      ownerRole,
      reason: "Agent role; no named human approver is recorded.",
    };
  }

  return {
    status: "unresolved",
    ownerRole,
    reason: `${formatOwnerRole(ownerRole)} approval has no resolved person field in C1.`,
  };
}

export function approvalViewForCriterion(args: {
  event: SourceApprovalRoutingEvent;
  ownerRole: SourceApprovalOwnerRole;
  criterionState: "pending" | "met" | "not_met" | "waived" | "deferred";
}): SourceCriterionApprovalView {
  const resolution = resolveApprover(args.event, args.ownerRole);
  if (resolution.status === "unresolved") {
    return {
      ownerRole: args.ownerRole,
      status: "unresolved",
      label: "Approval unresolved",
      detail: resolution.reason,
    };
  }
  const approved =
    args.criterionState === "met" || args.criterionState === "waived";
  return {
    ownerRole: args.ownerRole,
    status: approved ? "approved" : "pending",
    label: resolution.name,
    detail: approved ? "approval recorded" : "approval pending",
  };
}

export function formatCriterionApprovalNotes(args: {
  ownerRole: SourceApprovalOwnerRole;
  requirementId: string;
  humanReason: string;
  resolution: SourceApproverResolution;
}): string {
  const resolved =
    args.resolution.status === "resolved"
      ? `resolved=${args.resolution.name}`
      : `unresolved=${args.resolution.reason}`;
  return [
    `ownerRole=${args.ownerRole}`,
    `requirementId=${args.requirementId}`,
    resolved,
    `reason=${args.humanReason}`,
  ].join(" | ");
}

export function formatOwnerRole(ownerRole: SourceApprovalOwnerRole): string {
  if (ownerRole === "ea-council") return "EA council";
  return ownerRole
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
