// ADM6 · Users & Access readiness read-model.
//
// Pure deterministic seed-driven view-model for the Users & Access
// admin surface. Lifts user-facing posture out of the Steward brief
// without claiming a live auth runtime, without touching Clerk, and
// without enumerating real people.
//
// Roles + counts only — no real person names, no email allowlists,
// no PII. The surface is honest about what is wired today (Clerk auth
// only) and what is not (no invite API, no permission editor, no
// revoke pipeline).
//
// This module does NOT import:
//   - src/lib/auth/**                     (no Clerk / runtime auth)
//   - src/lib/source/**                   (Source UI is unrelated)
//   - src/lib/sentinel/**                 (Sentinel intelligence)
//   - src/lib/atlas/**                    (Atlas brief)
//   - src/lib/nexus/**                    (Nexus mastermind)
//   - src/lib/agent/**, src/components/agent/**
//   - supabase/**
//
// No Date.now(), no Math.random(), no fetch(), no model providers.
// Same call → identical view object every time.

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type UsersAccessRole =
  | 'platform_admin'
  | 'tenant_admin'
  | 'maestro'
  | 'sponsor'
  | 'investor'
  | 'steward'
  | 'observer';

export type UsersAccessHealth = 'ready' | 'partial' | 'blocked';

export type RiskySeverity = 'low' | 'medium' | 'high';

export interface UserRoleSeed {
  /** Canonical role key (no real person names — roles + counts only). */
  role: UsersAccessRole;
  /** Human-readable label (role-only, e.g. "Maestro"). */
  label: string;
  /** Seat count assigned to this role across the platform. */
  count: number;
  /** Short rationale for what this role is allowed to see/do today. */
  scopeNote: string;
  /** Whether this role can act today in the live runtime (read-only honesty). */
  readOnlyToday: boolean;
}

export interface TenantAccessPosture {
  /** Tenant access label (no tenant secrets, no real org names beyond seeded demo tenants). */
  tenantLabel: string;
  /** Roles attached to this tenant (counts only). */
  rolesPresent: ReadonlyArray<UsersAccessRole>;
  /** Total seats across all roles for this tenant. */
  totalSeats: number;
  /** Whether tenant isolation guard (S7) is recorded as intact for this tenant. */
  isolationIntact: boolean;
  /** Steward-facing rationale. */
  rationale: string;
}

export interface ProgramAccessPosture {
  /** Canonical program key. */
  programKey: string;
  /** Display label (no real client names beyond seeded canon). */
  programLabel: string;
  /** Roles permitted on this program (e.g. maestro, sponsor, observer). */
  rolesPermitted: ReadonlyArray<UsersAccessRole>;
  /** Whether sponsor seat is captured for this program. */
  sponsorAssigned: boolean;
  /** Steward guidance line. */
  guidance: string;
}

export interface PendingInvitePlaceholder {
  /** Stable id for ordering. */
  id: string;
  /** Honest caption: invites are not wired today. */
  caption: string;
  /** Pending count today (always 0 — no invite API). */
  count: 0;
}

export interface RiskyPermissionFlag {
  /** Stable id for ordering. */
  id: string;
  /** Affected role (no person name). */
  role: UsersAccessRole;
  /** Severity. */
  severity: RiskySeverity;
  /** Short reason — what looks risky. */
  reason: string;
  /** Steward suggested follow-up (disabled today). */
  suggestedReview: string;
}

export interface UsersAccessSummary {
  /** Total seats across all roles. */
  totalSeats: number;
  /** Total distinct roles represented (always 7 in the canonical seed). */
  totalRoles: number;
  /** How many tenants are represented in the posture. */
  totalTenants: number;
  /** How many programs are represented. */
  totalPrograms: number;
  /** Pending invites (always 0 today — no invite API). */
  pendingInvites: 0;
  /** Number of risky permission flags surfaced. */
  riskyFlagCount: number;
  /** Health label. */
  health: UsersAccessHealth;
  /** Sentence summarising the role distribution by count (e.g. "3 maestros, 2 sponsors"). */
  roleDistributionSentence: string;
}

export interface UsersAccessReadinessView {
  /** Source-of-truth label. */
  createdFrom: 'deterministic_users_access_readiness_seed';
  /** Workspace label (matches Steward setup readiness label). */
  workspaceLabel: string;
  /** Health label. */
  health: UsersAccessHealth;
  /** Health rationale. */
  healthRationale: string;
  /** Role inventory (counts only — no names). */
  roles: ReadonlyArray<UserRoleSeed>;
  /** Per-tenant access posture summary. */
  tenants: ReadonlyArray<TenantAccessPosture>;
  /** Per-program access posture summary. */
  programs: ReadonlyArray<ProgramAccessPosture>;
  /** Pending invite placeholder rows (today: zero invites, no API). */
  pendingInvites: ReadonlyArray<PendingInvitePlaceholder>;
  /** Risky permission flags (with reasons). */
  riskyFlags: ReadonlyArray<RiskyPermissionFlag>;
  /** Steward guidance block sentence. */
  stewardGuidance: string;
  /** Honest interpretation basis. */
  interpretationBasis: string;
}

// ---------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------

const ROLES: ReadonlyArray<UserRoleSeed> = [
  {
    role: 'platform_admin',
    label: 'Platform admin',
    count: 1,
    scopeNote:
      'Full platform scope. Reads tenants, programs, datasets, governance posture. No live role mutation today.',
    readOnlyToday: true,
  },
  {
    role: 'tenant_admin',
    label: 'Tenant admin',
    count: 2,
    scopeNote:
      'Scoped to a single tenant. Reads programs and datasets within tenant scope. No cross-tenant reach.',
    readOnlyToday: true,
  },
  {
    role: 'maestro',
    label: 'Maestro',
    count: 3,
    scopeNote:
      'Active engagement owner. Composes deliverables, drives Programs and Workshop mode. Read-only on governance.',
    readOnlyToday: true,
  },
  {
    role: 'sponsor',
    label: 'Sponsor',
    count: 2,
    scopeNote:
      'Executive program sponsor. Reads tower brief, scorecards, pressure cards. No edit on deliverables.',
    readOnlyToday: true,
  },
  {
    role: 'investor',
    label: 'Investor',
    count: 1,
    scopeNote:
      'Read-only on portfolio brief. No access to raw datasets or program internals.',
    readOnlyToday: true,
  },
  {
    role: 'steward',
    label: 'Steward',
    count: 1,
    scopeNote:
      'Governance + dataset readiness owner. Reviews evidence, owners, risky permissions.',
    readOnlyToday: true,
  },
  {
    role: 'observer',
    label: 'Observer',
    count: 2,
    scopeNote:
      'Calmest read-only role. Watches surfaces but cannot compose, cite, or comment.',
    readOnlyToday: true,
  },
];

const TENANTS: ReadonlyArray<TenantAccessPosture> = [
  {
    tenantLabel: 'AbarVa Platform',
    rolesPresent: ['platform_admin', 'steward', 'observer'],
    totalSeats: 4,
    isolationIntact: true,
    rationale:
      'Platform-scope tenant. Reserved for Steward, platform admin, and observers. No client data resides here.',
  },
  {
    tenantLabel: 'Apex Retail',
    rolesPresent: ['tenant_admin', 'maestro', 'sponsor', 'observer'],
    totalSeats: 5,
    isolationIntact: true,
    rationale:
      'Active demo tenant. 1 tenant admin, 2 maestros, 1 sponsor, 1 observer. Cross-tenant reach is denied by S7 probe.',
  },
  {
    tenantLabel: 'Meridian',
    rolesPresent: ['tenant_admin', 'maestro', 'sponsor', 'investor'],
    totalSeats: 5,
    isolationIntact: true,
    rationale:
      'Secondary demo tenant. 1 tenant admin, 1 maestro, 1 sponsor, 1 investor. Investor scope is read-only on the portfolio brief.',
  },
];

const PROGRAMS: ReadonlyArray<ProgramAccessPosture> = [
  {
    programKey: 'apex-retail-contact-center-ai',
    programLabel: 'Apex Retail · Contact Center AI',
    rolesPermitted: ['maestro', 'sponsor', 'observer', 'steward'],
    sponsorAssigned: true,
    guidance:
      'Sponsor + maestro seats captured. Observer attached for QA review.',
  },
  {
    programKey: 'apex-retail-cdp',
    programLabel: 'Apex Retail · Customer Data Platform',
    rolesPermitted: ['maestro', 'sponsor', 'steward'],
    sponsorAssigned: true,
    guidance:
      'Sponsor + maestro seats captured. Observer not yet attached; review at next steering touchpoint.',
  },
  {
    programKey: 'apex-retail-store-associate-productivity',
    programLabel: 'Apex Retail · Store Associate Productivity',
    rolesPermitted: ['maestro', 'observer', 'steward'],
    sponsorAssigned: false,
    guidance:
      'Sponsor seat is missing — Steward should not promote G3 without a captured sponsor.',
  },
  {
    programKey: 'apex-retail-demand-forecasting',
    programLabel: 'Apex Retail · Demand Forecasting',
    rolesPermitted: ['maestro', 'sponsor', 'steward'],
    sponsorAssigned: true,
    guidance:
      'Sponsor + maestro seats captured. Investor read-only access not yet attached.',
  },
];

const PENDING_INVITES: ReadonlyArray<PendingInvitePlaceholder> = [
  {
    id: 'pending-invite-placeholder',
    caption: '0 pending — invite system not wired',
    count: 0,
  },
];

const RISKY_FLAGS: ReadonlyArray<RiskyPermissionFlag> = [
  {
    id: 'flag-platform-admin-dormant',
    role: 'platform_admin',
    severity: 'medium',
    reason:
      'Platform-admin seat is dormant (no recorded sign-in across the last 30 captured days).',
    suggestedReview:
      'Confirm the platform-admin seat is still required; otherwise downgrade to observer.',
  },
  {
    id: 'flag-tenant-admin-broad-scope',
    role: 'tenant_admin',
    severity: 'low',
    reason:
      'Tenant admin can read every dataset domain in tenant scope including L4 sensitive raw data; today this is acceptable but should be lowered when L4 approvals are wired.',
    suggestedReview:
      'Plan a follow-up to scope tenant admin to L0–L3 once the L4 approval ledger is wired.',
  },
  {
    id: 'flag-sponsor-without-attestation',
    role: 'sponsor',
    severity: 'low',
    reason:
      '1 sponsor seat lacks a captured attestation acknowledging the data sharing posture.',
    suggestedReview:
      'Capture sponsor attestation at next steering touchpoint before promoting any G3 deliverable.',
  },
];

// ---------------------------------------------------------------------
// Composition helpers
// ---------------------------------------------------------------------

function composeRoleDistributionSentence(
  roles: ReadonlyArray<UserRoleSeed>,
): string {
  // e.g. "3 maestros, 2 sponsors, 1 platform_admin"
  // Roles + counts only. No names. Plural via simple "+s" rule.
  const ordered = [...roles].sort((a, b) => b.count - a.count);
  const parts = ordered
    .filter((r) => r.count > 0)
    .map((r) => {
      const noun = r.role;
      const plural = r.count === 1 ? noun : `${noun}s`;
      return `${r.count} ${plural}`;
    });
  return parts.join(', ');
}

function evaluateHealth(
  roles: ReadonlyArray<UserRoleSeed>,
  tenants: ReadonlyArray<TenantAccessPosture>,
  riskyFlags: ReadonlyArray<RiskyPermissionFlag>,
): { health: UsersAccessHealth; rationale: string } {
  const allTenantsIsolated = tenants.every((t) => t.isolationIntact);
  const allSevenRolesPresent = roles.length === 7 && roles.every((r) => r.count >= 0);
  const highSeverityCount = riskyFlags.filter((f) => f.severity === 'high').length;
  const mediumSeverityCount = riskyFlags.filter((f) => f.severity === 'medium').length;

  if (!allTenantsIsolated) {
    return {
      health: 'blocked',
      rationale:
        'Tenant isolation is not intact across one or more tenants; users-access posture is blocked until S7 returns green.',
    };
  }

  if (!allSevenRolesPresent || highSeverityCount > 0) {
    return {
      health: 'blocked',
      rationale:
        'Either the canonical role set is not fully represented or a high-severity risky permission flag is open.',
    };
  }

  if (mediumSeverityCount > 0) {
    return {
      health: 'partial',
      rationale: `All 7 canonical roles are represented across ${tenants.length} tenants; tenant-isolation guard is intact; ${mediumSeverityCount} medium-severity risky permission flag(s) require Steward review.`,
    };
  }

  return {
    health: 'ready',
    rationale: `All 7 canonical roles are represented across ${tenants.length} tenants; tenant-isolation guard is intact; no medium- or high-severity risky permissions today.`,
  };
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic Users & Access readiness view. Pure: same
 * call → identical view object every time. No live auth, no DB read,
 * no Clerk runtime claim.
 */
export function buildUsersAccessReadinessView(): UsersAccessReadinessView {
  const workspaceLabel = 'AbarVa Platform';
  const { health, rationale } = evaluateHealth(ROLES, TENANTS, RISKY_FLAGS);

  const stewardGuidance =
    'Roles + counts surface honestly today. The platform does not invite, edit, or revoke users from this surface — those verbs are deferred to a future runtime slice. Steward should review the medium-severity flags at the next governance touchpoint.';

  const interpretationBasis =
    'Composed from a deterministic users-access readiness seed. No live Clerk runtime is read, no live invite API is called, no permission mutation is performed. Roles + counts only — no real person names enumerated.';

  return {
    createdFrom: 'deterministic_users_access_readiness_seed',
    workspaceLabel,
    health,
    healthRationale: rationale,
    roles: ROLES,
    tenants: TENANTS,
    programs: PROGRAMS,
    pendingInvites: PENDING_INVITES,
    riskyFlags: RISKY_FLAGS,
    stewardGuidance,
    interpretationBasis,
  };
}

/**
 * Compose a deterministic summary line from a view.
 */
export function summarizeUsersAccess(
  view: UsersAccessReadinessView,
): UsersAccessSummary {
  const totalSeats = view.roles.reduce((acc, r) => acc + r.count, 0);
  const totalRoles = view.roles.length;
  const totalTenants = view.tenants.length;
  const totalPrograms = view.programs.length;
  const riskyFlagCount = view.riskyFlags.length;
  const roleDistributionSentence = composeRoleDistributionSentence(view.roles);

  return {
    totalSeats,
    totalRoles,
    totalTenants,
    totalPrograms,
    pendingInvites: 0,
    riskyFlagCount,
    health: view.health,
    roleDistributionSentence,
  };
}

/**
 * List risky permission flags ordered by severity (high → medium → low),
 * stable on id within the same severity.
 */
export function listRiskyPermissionFlags(
  view: UsersAccessReadinessView,
): ReadonlyArray<RiskyPermissionFlag> {
  const severityRank: Record<RiskySeverity, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return [...view.riskyFlags].sort((a, b) => {
    const da = severityRank[a.severity] - severityRank[b.severity];
    if (da !== 0) return da;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Test-only convenience: the canonical 7 role keys in canonical order.
 */
export const USERS_ACCESS_ROLES_IN_ORDER: ReadonlyArray<UsersAccessRole> = [
  'platform_admin',
  'tenant_admin',
  'maestro',
  'sponsor',
  'investor',
  'steward',
  'observer',
];
