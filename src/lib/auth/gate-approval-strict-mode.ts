// Shared strict-mode checks for legacy Source and reasoning approval flows.
//
// Moves uses its explicit per-workspace capability (`canApproveGates`) for
// ordinary approvals. This helper remains for Source and reasoning flows, and
// for the explicit hard-gate bypass path; it does not grant sponsor authority.
// `GATE_APPROVAL_STRICT_MODE` is an env-flag-gated hardening of those paths.
//
// The flag is read here so those remaining call sites share one policy.

/** Roles that may approve a gate when GATE_APPROVAL_STRICT_MODE is ON. */
const STRICT_MODE_APPROVAL_ROLES = new Set([
  'maestro',
  'admin',
  'client_admin',
  'abarva_super_admin',
  'founder',
]);

/** True when GATE_APPROVAL_STRICT_MODE is enabled via env flag. */
export function isGateApprovalStrictMode(): boolean {
  const raw = (process.env.GATE_APPROVAL_STRICT_MODE ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
}

/**
 * True when `role` satisfies the strict-mode admin/maestro requirement.
 * Returns false for null/undefined/non-privileged roles.
 */
export function isStrictModeApprovalRole(role: string | null | undefined): boolean {
  const normalized = (role ?? '').trim().toLowerCase();
  return normalized.length > 0 && STRICT_MODE_APPROVAL_ROLES.has(normalized);
}

/**
 * Separation-of-duties check. When strict mode is on, an approver must
 * differ from the original requester. When strict mode is off this is a
 * no-op (pilot allows self-approval). Returns true when the action is
 * allowed.
 */
export function passesSeparationOfDuties(args: {
  requestedByUserId: string | null | undefined;
  approverUserId: string | null | undefined;
}): boolean {
  if (!isGateApprovalStrictMode()) return true;
  const requester = (args.requestedByUserId ?? '').trim();
  const approver = (args.approverUserId ?? '').trim();
  if (!requester || !approver) return true;
  return requester !== approver;
}
