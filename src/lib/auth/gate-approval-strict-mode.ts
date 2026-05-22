// Gate approval strict mode — audit 2026-05-22, finding P1-4.
//
// `GATE_APPROVAL_STRICT_MODE` is an env-flag-gated hardening of every gate
// approval / phase-advance path. Per Memory · Gate self-approval model:
//
//   - Pilot (flag OFF, default): any tenant member with an approval-bearing
//     capability (canApproveGates / sponsor / approver) may approve a gate,
//     and a requester may approve their own request.
//   - Production (flag ON): gate approval additionally requires an
//     admin / maestro role AND enforces separation of duties — the
//     approver must differ from the requester.
//
// The flag is the single switch wired into the phase-gate route, the
// programs advance route, the gate-criterion routes, and the reasoning
// gate routes. This module is the one place that reads the env var so the
// behavior cannot drift between call sites.

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
