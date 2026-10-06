import type { SourceGateCriterion } from "./canonical-specs";

export type SourceApprovalPolicyCode = "legacy_signed_scope_v1" | "self_v1";

export interface SourceApprovalPolicy {
  code: SourceApprovalPolicyCode;
  selfApprovalAllowed: boolean;
  requiresExternalSigners: boolean;
}

export function resolveSourceApprovalPolicy(
  value: string | null | undefined,
): SourceApprovalPolicy {
  if (value === "self_v1") {
    return {
      code: "self_v1",
      selfApprovalAllowed: true,
      requiresExternalSigners: false,
    };
  }
  if (value == null || value === "legacy_signed_scope_v1") {
    return {
      code: "legacy_signed_scope_v1",
      selfApprovalAllowed: false,
      requiresExternalSigners: true,
    };
  }
  throw new Error(`Unknown Source approval policy: ${value}`);
}

const SELF_CRITERION_TITLES: Record<string, string> = {
  "GATE-STRATEGY-01": "Sourcing strategy memo approved by Event Owner",
  "GATE-SCOPE-01": "Application portfolio reviewed by Event Owner",
  "GATE-SCOPE-02": "Scope commitment recorded by Event Owner",
  "GATE-SCOPE-03": "Exclusion log reviewed by Event Owner",
  "GATE-SCOPE-04": "Scope memo approved by Event Owner",
  "GATE-RFP-04": "RFP terms reviewed by Event Owner",
  "GATE-EVAL-04": "Scorecard weight set approved by Event Owner",
  "GATE-EVAL-05": "Scorecard governance reviewed by Event Owner",
  "GATE-PRICE-02": "Pricing trap log reviewed by Event Owner",
  "GATE-PRICE-03": "TCO horizon accepted by Event Owner",
  "GATE-PRICE-05": "BAFO question pack approved by Event Owner",
  "GATE-DEC-01": "Decision brief reviewed by Event Owner",
  "GATE-DEC-02": "Decision governance recorded by Event Owner",
  "GATE-DEC-04": "Award commitment recorded by Event Owner",
  "GATE-SEL-01": "Selection memo approved by Event Owner",
};

export function criterionForSourceApprovalPolicy(
  criterion: SourceGateCriterion | undefined,
  policyCode: string | null | undefined,
): SourceGateCriterion | undefined {
  if (!criterion || !resolveSourceApprovalPolicy(policyCode).selfApprovalAllowed) {
    return criterion;
  }
  return {
    ...criterion,
    title: SELF_CRITERION_TITLES[criterion.criterionId] ?? criterion.title,
    description: SELF_CRITERION_TITLES[criterion.criterionId]
      ? "Event Owner reviews the governed evidence and records this decision."
      : criterion.description,
    ownerRole:
      criterion.ownerRole === "atlas" || criterion.ownerRole === "sentinel"
        ? criterion.ownerRole
        : "event-owner",
  };
}

export function sourceEvidenceAppliesToApprovalPolicy(
  requirementId: string,
  policyCode: string | null | undefined,
): boolean {
  const policy = resolveSourceApprovalPolicy(policyCode);
  return !(policy.selfApprovalAllowed && requirementId === "EVID-SRC-STR-SPONSOR-COMMIT");
}
