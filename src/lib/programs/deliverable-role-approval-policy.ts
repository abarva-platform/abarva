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

/** Moves approvals are recorded by one authorized workspace user, not role buckets. */
export const REQUIRED_APPROVAL_ROLES: Partial<Record<string, ApprovalRole[]>> =
  {};

export function requiredApprovalRolesFor(
  deliverableTypeKey: string,
): ApprovalRole[] {
  return REQUIRED_APPROVAL_ROLES[deliverableTypeKey] ?? [];
}
