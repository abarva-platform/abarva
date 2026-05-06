// SEC1 (Wave 31) · Security Posture Model
//
// Deterministic read model encoding the canonical security posture framework
// for the AbarVa platform. Defines:
//
//   - threat categories and associated control families
//   - control maturity levels and scoring
//   - posture gate evaluator for readiness assessments
//   - security domain coverage summary
//
// This module is consumed by:
//   - CI hygiene gates that enforce security posture requirements
//   - Admin readiness checks before pilot/production transitions
//   - Steward agent when surfacing security gaps to founders
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no fs reads, no Date.now, no Math.random.


// ---------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------

/**
 * High-level threat categories relevant to a SaaS platform handling
 * sensitive procurement and vendor evaluation data.
 */
export type SecurityThreatCategory =
  | 'authentication'         // identity and access management
  | 'authorisation'          // tenant isolation, RBAC, row-level policies
  | 'data-at-rest'           // encryption of stored data
  | 'data-in-transit'        // TLS, certificate management
  | 'supply-chain'           // third-party dependencies, SBOMs
  | 'secrets-management'     // API keys, env vars, secret rotation
  | 'audit-logging'          // tamper-evident event logs
  | 'vulnerability-management' // CVE tracking, dependency scanning
  | 'incident-response'      // detection, containment, recovery
  | 'data-residency';        // jurisdiction, data sovereignty

/**
 * Maturity level of a security control.
 */
export type ControlMaturity =
  | 'not-implemented'   // control does not exist
  | 'planned'           // scheduled but not yet active
  | 'partial'           // partially implemented, gaps remain
  | 'implemented'       // fully active, no known gaps
  | 'tested';           // implemented and verified by test/audit

/**
 * Risk level of a security gap.
 */
export type SecurityRiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * A single security control within a threat category.
 */
export interface SecurityControl {
  controlId: string;
  label: string;
  description: string;
  threatCategory: SecurityThreatCategory;
  maturity: ControlMaturity;
  riskIfMissing: SecurityRiskLevel;
  mitigationGuidance: string;
  pilotBlocker: boolean;   // true = must reach 'implemented' before pilot
  requiredMaturity: ControlMaturity;
}

/**
 * A family of related controls grouped under a threat category.
 */
export interface SecurityControlFamily {
  threatCategory: SecurityThreatCategory;
  label: string;
  description: string;
  controls: ReadonlyArray<SecurityControl>;
}

/**
 * Result of evaluating the overall platform security posture.
 */
export interface SecurityPostureGateResult {
  overallPosture: 'blocked' | 'at-risk' | 'acceptable' | 'strong';
  totalControls: number;
  implementedCount: number;
  testedCount: number;
  partialCount: number;
  notImplementedCount: number;
  plannedCount: number;
  pilotBlockersMet: boolean;
  pilotBlockerGaps: ReadonlyArray<string>;   // controlIds not yet at requiredMaturity
  criticalGaps: ReadonlyArray<string>;        // controlIds with riskIfMissing: critical
  highGaps: ReadonlyArray<string>;            // controlIds with riskIfMissing: high
  gateResults: ReadonlyArray<PostureGateCheckResult>;
  deterministicSeed: true;
}

/**
 * A single posture gate check result.
 */
export interface PostureGateCheckResult {
  gateId: string;
  description: string;
  passed: boolean;
  detail: string;
}

/**
 * Summary of security domain coverage.
 */
export interface SecurityPostureSummary {
  totalThreatCategories: number;
  totalControls: number;
  coverageByCategory: Record<SecurityThreatCategory, number>;
  pilotBlockerCount: number;
  criticalControlCount: number;
  deterministicSeed: true;
  createdFrom: 'sec1_w31_security_posture_model';
}

// ---------------------------------------------------------------------
// Canonical security control families
// ---------------------------------------------------------------------

const SECURITY_CONTROL_FAMILIES: ReadonlyArray<SecurityControlFamily> = [
  {
    threatCategory: 'authentication',
    label: 'Authentication',
    description:
      'Controls ensuring only authorised principals can access the platform. Covers Clerk integration, session expiry, MFA, and bot detection.',
    controls: [
      {
        controlId: 'auth-C1-clerk-sso',
        label: 'Clerk SSO Integration',
        description:
          'Clerk is the primary authentication provider. All routes enforce Clerk middleware. No bypass routes exist.',
        threatCategory: 'authentication',
        maturity: 'implemented',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Audit all Next.js routes for Clerk middleware enforcement. Use clerkMiddleware() in middleware.ts.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'auth-C2-session-expiry',
        label: 'Session Expiry Policy',
        description:
          'Sessions expire after a defined idle period. Configurable in Clerk dashboard (recommended: 1 hour idle).',
        threatCategory: 'authentication',
        maturity: 'partial',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Set session token expiry in Clerk to 1 hour idle / 24 hour absolute. Verify on staging.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'auth-C3-bot-detection',
        label: 'Bot Detection',
        description:
          'Automated traffic is blocked at the CDN/WAF layer. Vercel BotID or Cloudflare bot management.',
        threatCategory: 'authentication',
        maturity: 'planned',
        riskIfMissing: 'medium',
        mitigationGuidance:
          'Enable Vercel BotID on production domain. Test with common crawler user-agents.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
    ],
  },
  {
    threatCategory: 'authorisation',
    label: 'Authorisation & Tenant Isolation',
    description:
      'Controls ensuring tenants cannot access each other\'s data. Covers route-level tenant slug enforcement, DB row-level policies, and RBAC.',
    controls: [
      {
        controlId: 'authz-C1-tenant-slug-guard',
        label: 'Tenant Slug Route Guard',
        description:
          'Every /tenant/[slug]/* route validates the authenticated user belongs to the slug before serving data.',
        threatCategory: 'authorisation',
        maturity: 'implemented',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Add integration tests asserting cross-tenant slug access returns 403. Run on every PR.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'authz-C2-db-rls',
        label: 'Database Row-Level Security',
        description:
          'Per-user, role-aware RLS on all Source, Admin, Tower, and Intelligence tables. JWT tenant_key + role claims enforced at Postgres layer. Role helpers (is_maestro, is_tenant_admin, can_read_tenant_by_key/id) standardize the policy pattern. 108-test negative suite passes. Phase 5 shipped 2026-05-07.',
        threatCategory: 'authorisation',
        maturity: 'implemented',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Run manual pen-test per RLS_OPERATIONS_RUNBOOK.md §5 before onboarding first real customer. SME/program_initiator write permissions are Phase 5.1.',
        pilotBlocker: false,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'authz-C3-admin-rbac',
        label: 'Admin RBAC',
        description:
          'Admin routes (/admin/*) are gated by an admin role claim. Non-admin users receive 403.',
        threatCategory: 'authorisation',
        maturity: 'implemented',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Verify admin role metadata is set in Clerk public metadata. Add smoke test for /admin route with non-admin user.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
    ],
  },
  {
    threatCategory: 'data-at-rest',
    label: 'Data At Rest',
    description:
      'Controls ensuring stored data is encrypted and protected from unauthorised extraction.',
    controls: [
      {
        controlId: 'dar-C1-db-encryption',
        label: 'Database Encryption At Rest',
        description:
          'Supabase encrypts all data at rest using AES-256. No plaintext storage of sensitive fields.',
        threatCategory: 'data-at-rest',
        maturity: 'implemented',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Confirm Supabase project encryption settings. Do not store vendor PII in unencrypted side-channels.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'dar-C2-blob-encryption',
        label: 'Blob Storage Encryption',
        description:
          'All file uploads (evidence, attachments) stored in Vercel Blob are encrypted at rest.',
        threatCategory: 'data-at-rest',
        maturity: 'planned',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Configure Vercel Blob with server-side encryption. Add private access mode for sensitive attachments.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
    ],
  },
  {
    threatCategory: 'data-in-transit',
    label: 'Data In Transit',
    description:
      'Controls ensuring all data transferred over the network is encrypted via TLS.',
    controls: [
      {
        controlId: 'dit-C1-tls-enforcement',
        label: 'TLS Enforcement',
        description:
          'All production endpoints redirect HTTP to HTTPS. TLS 1.2+ enforced. HSTS header present.',
        threatCategory: 'data-in-transit',
        maturity: 'implemented',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Verify Vercel project HTTPS enforcement. Check HSTS header in production response headers.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'dit-C2-api-tls',
        label: 'API Route TLS',
        description:
          'All internal and external API calls (Supabase, Clerk, external vendors) use HTTPS.',
        threatCategory: 'data-in-transit',
        maturity: 'implemented',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Audit all fetch/axios calls for http:// prefixes. Fail CI on plain-http URLs in API routes.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
    ],
  },
  {
    threatCategory: 'secrets-management',
    label: 'Secrets Management',
    description:
      'Controls ensuring API keys, database URLs, and credentials are not exposed in source code or client bundles.',
    controls: [
      {
        controlId: 'sec-C1-env-vars',
        label: 'Environment Variable Hygiene',
        description:
          'All secrets are in environment variables. No secrets in committed code. .env.local in .gitignore.',
        threatCategory: 'secrets-management',
        maturity: 'implemented',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Run truffleHog or gitleaks on repository history. Ensure NEXT_PUBLIC_ prefix is only used for safe, non-secret values.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'sec-C2-client-bundle-audit',
        label: 'Client Bundle Secret Audit',
        description:
          'Production bundle does not contain server-side secrets. No SUPABASE_SERVICE_ROLE_KEY or similar in client JS.',
        threatCategory: 'secrets-management',
        maturity: 'partial',
        riskIfMissing: 'critical',
        mitigationGuidance:
          'Audit next build output with bundle-analyzer. Assert SUPABASE_SERVICE_ROLE_KEY not present in client chunk.',
        pilotBlocker: true,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'sec-C3-key-rotation',
        label: 'API Key Rotation Policy',
        description:
          'A rotation schedule exists for Supabase anon key, service role key, Clerk keys, and any vendor API keys.',
        threatCategory: 'secrets-management',
        maturity: 'planned',
        riskIfMissing: 'medium',
        mitigationGuidance:
          'Document rotation schedule. Set calendar reminders for 90-day rotation. Use Vercel env management for rotation.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
    ],
  },
  {
    threatCategory: 'audit-logging',
    label: 'Audit Logging',
    description:
      'Controls ensuring security-relevant events are logged in a tamper-evident, queryable store.',
    controls: [
      {
        controlId: 'log-C1-auth-events',
        label: 'Authentication Event Logging',
        description:
          'Clerk webhooks capture sign-in, sign-out, and failed authentication events. Events stored for 90 days.',
        threatCategory: 'audit-logging',
        maturity: 'partial',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Wire Clerk webhook to a persistent log store (Supabase audit_log table or Axiom). Verify retention policy.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
      {
        controlId: 'log-C2-data-access-log',
        label: 'Data Access Audit Log',
        description:
          'Read and write operations on sensitive program/vendor data emit structured log entries.',
        threatCategory: 'audit-logging',
        maturity: 'planned',
        riskIfMissing: 'medium',
        mitigationGuidance:
          'Add Vercel Log Drain to PostHog or Axiom. Tag sensitive API routes with audit:true in structured logs.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
    ],
  },
  {
    threatCategory: 'vulnerability-management',
    label: 'Vulnerability Management',
    description:
      'Controls ensuring known vulnerabilities in dependencies are tracked and remediated.',
    controls: [
      {
        controlId: 'vuln-C1-dep-scanning',
        label: 'Dependency Vulnerability Scanning',
        description:
          'npm audit or equivalent runs on every PR. High/critical CVEs block merge.',
        threatCategory: 'vulnerability-management',
        maturity: 'partial',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Add npm audit --audit-level=high step to CI. Enable GitHub Dependabot alerts on the repository.',
        pilotBlocker: true,
        requiredMaturity: 'partial',
      },
      {
        controlId: 'vuln-C2-sbom',
        label: 'Software Bill of Materials',
        description:
          'An SBOM is generated for each production release listing all direct and transitive dependencies.',
        threatCategory: 'vulnerability-management',
        maturity: 'not-implemented',
        riskIfMissing: 'low',
        mitigationGuidance:
          'Generate SBOM with syft or cyclonedx-npm. Attach to GitHub releases.',
        pilotBlocker: false,
        requiredMaturity: 'planned',
      },
    ],
  },
  {
    threatCategory: 'incident-response',
    label: 'Incident Response',
    description:
      'Controls ensuring the team can detect, contain, and recover from security incidents.',
    controls: [
      {
        controlId: 'ir-C1-runbook-exists',
        label: 'Incident Response Runbook',
        description:
          'A documented incident response runbook exists covering detection, triage, containment, and recovery.',
        threatCategory: 'incident-response',
        maturity: 'planned',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Implement SEC2 runbook. Review with founding team. Store in docs/security/.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
      {
        controlId: 'ir-C2-alert-channels',
        label: 'Alert Channels Configured',
        description:
          'PagerDuty, Slack, or equivalent is configured to receive Vercel/Supabase error alerts.',
        threatCategory: 'incident-response',
        maturity: 'partial',
        riskIfMissing: 'medium',
        mitigationGuidance:
          'Configure Vercel notification hooks to Slack #incidents channel. Set up Supabase email alerts for >5xx spike.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
    ],
  },
  {
    threatCategory: 'data-residency',
    label: 'Data Residency',
    description:
      'Controls ensuring data is stored in jurisdictions that comply with client and regulatory requirements.',
    controls: [
      {
        controlId: 'res-C1-supabase-region',
        label: 'Supabase Region Configuration',
        description:
          'Supabase project is deployed in the correct region (EU or US) based on pilot client requirements.',
        threatCategory: 'data-residency',
        maturity: 'implemented',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Document chosen region in pilot contract. Confirm Supabase project settings match.',
        pilotBlocker: false,
        requiredMaturity: 'implemented',
      },
      {
        controlId: 'res-C2-no-us-eu-cross',
        label: 'No Unauthorised Cross-Region Transfer',
        description:
          'No EU personal data is transferred to US systems without adequate legal basis (SCCs or adequacy decision).',
        threatCategory: 'data-residency',
        maturity: 'partial',
        riskIfMissing: 'high',
        mitigationGuidance:
          'Map all third-party integrations (Clerk, Vercel, PostHog) for data transfer mechanisms. Document in DPA.',
        pilotBlocker: false,
        requiredMaturity: 'partial',
      },
    ],
  },
  {
    threatCategory: 'supply-chain',
    label: 'Supply Chain',
    description:
      'Controls reducing risk from compromised or malicious third-party packages.',
    controls: [
      {
        controlId: 'sc-C1-lockfile-pinning',
        label: 'Lockfile Pinning',
        description:
          'package-lock.json is committed and CI installs with --frozen-lockfile (npm ci). Prevents floating version installs.',
        threatCategory: 'supply-chain',
        maturity: 'implemented',
        riskIfMissing: 'medium',
        mitigationGuidance:
          'Verify CI uses npm ci. Ensure renovatebot or dependabot updates lockfile in PRs.',
        pilotBlocker: false,
        requiredMaturity: 'implemented',
      },
    ],
  },
];

// Flatten all controls for convenience
const ALL_CONTROLS: ReadonlyArray<SecurityControl> = SECURITY_CONTROL_FAMILIES.flatMap(
  (f) => f.controls,
);

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return all security control families. Pure.
 */
export function getSecurityControlFamilies(): ReadonlyArray<SecurityControlFamily> {
  return SECURITY_CONTROL_FAMILIES;
}

/**
 * Return a specific control family by threat category. Pure.
 */
export function getControlFamily(
  category: SecurityThreatCategory,
): SecurityControlFamily | undefined {
  return SECURITY_CONTROL_FAMILIES.find((f) => f.threatCategory === category);
}

/**
 * Return all controls across all families. Pure.
 */
export function getAllSecurityControls(): ReadonlyArray<SecurityControl> {
  return ALL_CONTROLS;
}

/**
 * Return all controls that are pilot blockers. Pure.
 */
export function getPilotBlockerControls(): ReadonlyArray<SecurityControl> {
  return ALL_CONTROLS.filter((c) => c.pilotBlocker);
}

/**
 * Return all controls with a given risk level. Pure.
 */
export function getControlsByRisk(
  risk: SecurityRiskLevel,
): ReadonlyArray<SecurityControl> {
  return ALL_CONTROLS.filter((c) => c.riskIfMissing === risk);
}

/**
 * Evaluate the overall platform security posture against the current
 * control maturity values.
 *
 * This is a read-only assessment of the CANONICAL maturity values encoded
 * in this module. It does NOT perform live checks.
 *
 * Gate rules (all must pass for pilotBlockersMet = true):
 *   PG1 — All pilot-blocking controls are at or above their requiredMaturity
 *   PG2 — No critical-risk controls are 'not-implemented'
 *   PG3 — No critical-risk controls are 'planned'
 *   PG4 — At least 50% of all controls are 'implemented' or 'tested'
 *   PG5 — Data-at-rest critical controls are all 'implemented'
 */
export function evaluateSecurityPostureGate(): SecurityPostureGateResult {
  const MATURITY_ORDER: ReadonlyArray<ControlMaturity> = [
    'not-implemented',
    'planned',
    'partial',
    'implemented',
    'tested',
  ];

  function maturityRank(m: ControlMaturity): number {
    return MATURITY_ORDER.indexOf(m);
  }

  function meetsRequiredMaturity(control: SecurityControl): boolean {
    return maturityRank(control.maturity) >= maturityRank(control.requiredMaturity);
  }

  const pilotBlockers = ALL_CONTROLS.filter((c) => c.pilotBlocker);
  const pilotBlockerGaps = pilotBlockers
    .filter((c) => !meetsRequiredMaturity(c))
    .map((c) => c.controlId);

  const criticalControls = ALL_CONTROLS.filter((c) => c.riskIfMissing === 'critical');
  const criticalGaps = criticalControls
    .filter((c) => c.maturity === 'not-implemented' || c.maturity === 'planned')
    .map((c) => c.controlId);

  const highGaps = ALL_CONTROLS.filter(
    (c) =>
      c.riskIfMissing === 'high' &&
      (c.maturity === 'not-implemented'),
  ).map((c) => c.controlId);

  const implementedCount = ALL_CONTROLS.filter(
    (c) => c.maturity === 'implemented' || c.maturity === 'tested',
  ).length;
  const testedCount = ALL_CONTROLS.filter((c) => c.maturity === 'tested').length;
  const partialCount = ALL_CONTROLS.filter((c) => c.maturity === 'partial').length;
  const notImplementedCount = ALL_CONTROLS.filter((c) => c.maturity === 'not-implemented').length;
  const plannedCount = ALL_CONTROLS.filter((c) => c.maturity === 'planned').length;

  const implementedPct = implementedCount / ALL_CONTROLS.length;

  // Gate checks
  const gateResults: PostureGateCheckResult[] = [
    {
      gateId: 'PG1-pilot-blockers-met',
      description: 'All pilot-blocking controls are at or above their required maturity.',
      passed: pilotBlockerGaps.length === 0,
      detail:
        pilotBlockerGaps.length === 0
          ? 'All pilot-blocking controls meet required maturity.'
          : `${pilotBlockerGaps.length} pilot blockers below required maturity: ${pilotBlockerGaps.join(', ')}`,
    },
    {
      gateId: 'PG2-no-critical-not-implemented',
      description: 'No critical-risk control is in not-implemented state.',
      passed: criticalControls.filter((c) => c.maturity === 'not-implemented').length === 0,
      detail:
        criticalControls.filter((c) => c.maturity === 'not-implemented').length === 0
          ? 'No critical controls in not-implemented state.'
          : `Critical controls not implemented: ${criticalControls.filter((c) => c.maturity === 'not-implemented').map((c) => c.controlId).join(', ')}`,
    },
    {
      gateId: 'PG3-no-critical-planned-only',
      description: 'No critical-risk control is only in planned state.',
      passed: criticalControls.filter((c) => c.maturity === 'planned').length === 0,
      detail:
        criticalControls.filter((c) => c.maturity === 'planned').length === 0
          ? 'No critical controls stuck at planned.'
          : `Critical controls only planned: ${criticalControls.filter((c) => c.maturity === 'planned').map((c) => c.controlId).join(', ')}`,
    },
    {
      gateId: 'PG4-coverage-threshold',
      description: 'At least 50% of controls are implemented or tested.',
      passed: implementedPct >= 0.5,
      detail: `${Math.round(implementedPct * 100)}% of controls implemented or tested (need ≥50%).`,
    },
    {
      gateId: 'PG5-data-at-rest-critical',
      description: 'All critical data-at-rest controls are implemented.',
      passed: criticalControls
        .filter((c) => c.threatCategory === 'data-at-rest')
        .every((c) => c.maturity === 'implemented' || c.maturity === 'tested'),
      detail:
        criticalControls
          .filter((c) => c.threatCategory === 'data-at-rest')
          .every((c) => c.maturity === 'implemented' || c.maturity === 'tested')
          ? 'All critical data-at-rest controls implemented.'
          : 'Some critical data-at-rest controls not yet implemented.',
    },
  ];

  const pilotBlockersMet = pilotBlockerGaps.length === 0;
  const allGatesPass = gateResults.every((g) => g.passed);

  let overallPosture: SecurityPostureGateResult['overallPosture'];
  if (!allGatesPass && (criticalGaps.length > 0 || pilotBlockerGaps.length > 0)) {
    overallPosture = 'blocked';
  } else if (!allGatesPass) {
    overallPosture = 'at-risk';
  } else if (testedCount >= ALL_CONTROLS.length * 0.5) {
    overallPosture = 'strong';
  } else {
    overallPosture = 'acceptable';
  }

  return {
    overallPosture,
    totalControls: ALL_CONTROLS.length,
    implementedCount,
    testedCount,
    partialCount,
    notImplementedCount,
    plannedCount,
    pilotBlockersMet,
    pilotBlockerGaps,
    criticalGaps,
    highGaps,
    gateResults,
    deterministicSeed: true,
  };
}

/**
 * Return a summary of security posture coverage. Pure.
 */
export function summarizeSecurityPosture(): SecurityPostureSummary {
  const coverageByCategory = {} as Record<SecurityThreatCategory, number>;
  for (const family of SECURITY_CONTROL_FAMILIES) {
    coverageByCategory[family.threatCategory] = family.controls.length;
  }

  return {
    totalThreatCategories: SECURITY_CONTROL_FAMILIES.length,
    totalControls: ALL_CONTROLS.length,
    coverageByCategory,
    pilotBlockerCount: ALL_CONTROLS.filter((c) => c.pilotBlocker).length,
    criticalControlCount: ALL_CONTROLS.filter((c) => c.riskIfMissing === 'critical').length,
    deterministicSeed: true,
    createdFrom: 'sec1_w31_security_posture_model',
  };
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

export const SECURITY_THREAT_CATEGORIES_IN_ORDER: ReadonlyArray<SecurityThreatCategory> = [
  'authentication',
  'authorisation',
  'data-at-rest',
  'data-in-transit',
  'supply-chain',
  'secrets-management',
  'audit-logging',
  'vulnerability-management',
  'incident-response',
  'data-residency',
];

export const CONTROL_MATURITY_LEVELS_IN_ORDER: ReadonlyArray<ControlMaturity> = [
  'not-implemented',
  'planned',
  'partial',
  'implemented',
  'tested',
];
