export type ApprovalRole =
  | "business"
  | "technology"
  | "finance"
  | "risk_security";

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  business: "Business approver",
  technology: "Technology approver",
  finance: "Finance approver",
  risk_security: "Risk/security approver",
};

/**
 * Which roles a deliverable TYPE requires, keyed by deliverableTypeKey. A type
 * absent from this map requires no role approvals; the existing single-actor
 * sign-off behavior remains unaffected unless a type opts in.
 *
 * These keys MUST match `deliverables_v2.deliverable_type_key` verbatim. That
 * column stores the phase-registry key from `deliverable-registry.ts`, not the
 * orchestrator's internal `deliverableType` name.
 */
export const REQUIRED_APPROVAL_ROLES: Partial<Record<string, ApprovalRole[]>> =
  {
    business_case: ["business", "finance"],
    target_state_architecture: ["technology", "risk_security"],
    operating_model_design: ["business", "technology"],
  };

export function requiredApprovalRolesFor(
  deliverableTypeKey: string,
): ApprovalRole[] {
  return REQUIRED_APPROVAL_ROLES[deliverableTypeKey] ?? [];
}
