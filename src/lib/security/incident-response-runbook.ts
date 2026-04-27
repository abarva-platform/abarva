// SEC2 (Wave 31) · Incident Response Runbook
//
// Deterministic read model encoding the canonical incident response playbook
// for the AbarVa platform. Defines:
//
//   - incident severity classification schema
//   - response phase steps (detect → triage → contain → investigate → recover → review)
//   - escalation matrix per severity level
//   - post-incident review template
//   - runbook query API
//
// This module is consumed by:
//   - Founding team during live incidents
//   - Admin readiness checks (verifying IR runbook exists and is current)
//   - Steward agent when surfacing IR readiness gaps
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no fs reads, no Date.now, no Math.random.


// ---------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------

/**
 * Severity classification for an incident.
 *
 *  SEV1 — Production is down or data is actively leaking. All users affected.
 *  SEV2 — Major degradation. Core features broken for a significant user subset.
 *  SEV3 — Minor degradation. Non-critical feature impacted. Workaround available.
 *  SEV4 — Low-impact issue. No user-visible impact but a risk signal is firing.
 */
export type IncidentSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

/**
 * The phase of incident response.
 */
export type IncidentResponsePhase =
  | 'detect'       // identify that something has gone wrong
  | 'triage'       // classify severity and assign initial responder
  | 'contain'      // stop the bleeding — limit impact spread
  | 'investigate'  // root cause analysis
  | 'recover'      // restore service to normal
  | 'review';      // post-incident review to prevent recurrence

/**
 * An escalation contact role.
 */
export type EscalationRole =
  | 'founder'           // founding team member
  | 'lead-engineer'     // technical lead
  | 'vendor-support'    // e.g. Supabase support, Vercel support
  | 'legal-counsel'     // for data breach scenarios
  | 'affected-tenant';  // notify affected client

/**
 * A single step in the incident response runbook.
 */
export interface IncidentResponseStep {
  stepId: string;
  phase: IncidentResponsePhase;
  label: string;
  description: string;
  applicableSeverities: ReadonlyArray<IncidentSeverity>;
  timeboxMinutes: number | null;  // null = no fixed timebox
  actions: ReadonlyArray<string>;
  escalateIf: string | null;      // condition that triggers escalation
  toolsRequired: ReadonlyArray<string>;
  deterrent: boolean;             // true = step is preventative/hardening, not reactive
}

/**
 * The escalation matrix entry for a severity level.
 */
export interface EscalationMatrixEntry {
  severity: IncidentSeverity;
  label: string;
  initialResponder: EscalationRole;
  escalateTo: ReadonlyArray<EscalationRole>;
  maxResponseTimeMinutes: number;   // time to first acknowledgement
  maxContainmentTimeMinutes: number; // time to stop impact spreading
  notifyAffectedTenants: boolean;
  requiresPostMortem: boolean;
}

/**
 * A post-incident review template section.
 */
export interface PostIncidentReviewSection {
  sectionId: string;
  label: string;
  prompts: ReadonlyArray<string>;
  required: boolean;
}

/**
 * The full incident response runbook.
 */
export interface IncidentResponseRunbook {
  version: '1.0';
  name: string;
  description: string;
  lastReviewedCycle: string;
  phases: ReadonlyArray<IncidentResponsePhase>;
  steps: ReadonlyArray<IncidentResponseStep>;
  escalationMatrix: ReadonlyArray<EscalationMatrixEntry>;
  postIncidentTemplate: ReadonlyArray<PostIncidentReviewSection>;
  createdFrom: 'sec2_w31_incident_response_runbook';
}

/**
 * Result of querying runbook steps for a given scenario.
 */
export interface RunbookQueryResult {
  severity: IncidentSeverity;
  phase: IncidentResponsePhase | null;
  matchedSteps: ReadonlyArray<IncidentResponseStep>;
  escalationEntry: EscalationMatrixEntry;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Runbook data
// ---------------------------------------------------------------------

const RESPONSE_STEPS: ReadonlyArray<IncidentResponseStep> = [
  // ── DETECT ──────────────────────────────────────────────────────────
  {
    stepId: 'det-01-alert-fired',
    phase: 'detect',
    label: 'Acknowledge Initial Alert',
    description:
      'An alert fires (Vercel error spike, Supabase alert email, user report, or Sentinel signal). The on-call responder acknowledges within the SLA window.',
    applicableSeverities: ['SEV1', 'SEV2', 'SEV3', 'SEV4'],
    timeboxMinutes: 5,
    actions: [
      'Check Vercel dashboard for 5xx spike or function timeout alerts.',
      'Check Supabase dashboard for DB connection failures or RLS violations.',
      'Check PostHog or log drain for unusual error patterns.',
      'Open #incidents Slack channel and post initial acknowledgement.',
    ],
    escalateIf: 'Alert not acknowledged within SLA: SEV1=5min, SEV2=15min, SEV3=30min, SEV4=4h.',
    toolsRequired: ['Vercel dashboard', 'Supabase dashboard', 'Slack'],
    deterrent: false,
  },
  {
    stepId: 'det-02-impact-scope',
    phase: 'detect',
    label: 'Determine Impact Scope',
    description:
      'Identify which tenants, routes, or data categories are affected. Check whether the impact is isolated to one tenant or platform-wide.',
    applicableSeverities: ['SEV1', 'SEV2', 'SEV3'],
    timeboxMinutes: 10,
    actions: [
      'Query Vercel logs for affected route patterns.',
      'Check Supabase query logs for affected tenant_id.',
      'Determine if authentication (Clerk), data layer (Supabase), or app layer (Next.js) is the failure plane.',
      'Note affected pilot/production tenants by name.',
    ],
    escalateIf: 'Multiple tenants affected or data exfiltration suspected → escalate to SEV1.',
    toolsRequired: ['Vercel log drain', 'Supabase logs'],
    deterrent: false,
  },

  // ── TRIAGE ──────────────────────────────────────────────────────────
  {
    stepId: 'tri-01-classify-severity',
    phase: 'triage',
    label: 'Classify Incident Severity',
    description:
      'Based on impact scope, assign severity using the classification schema. Severity drives escalation, timebox, and post-mortem requirements.',
    applicableSeverities: ['SEV1', 'SEV2', 'SEV3', 'SEV4'],
    timeboxMinutes: 5,
    actions: [
      'SEV1: production down or active data leak.',
      'SEV2: major feature broken, significant user subset affected.',
      'SEV3: non-critical feature broken, workaround available.',
      'SEV4: risk signal, no direct user impact.',
      'Post severity and incident ID in #incidents channel.',
    ],
    escalateIf: null,
    toolsRequired: ['Slack'],
    deterrent: false,
  },
  {
    stepId: 'tri-02-assign-ic',
    phase: 'triage',
    label: 'Assign Incident Commander',
    description:
      'For SEV1 and SEV2, explicitly designate an Incident Commander (IC) who owns communication and decision-making throughout the incident.',
    applicableSeverities: ['SEV1', 'SEV2'],
    timeboxMinutes: 5,
    actions: [
      'IC is the founding team member or lead engineer on-call.',
      'IC opens incident thread in Slack with title, severity, start time, and IC name.',
      'IC delegates sub-tasks and ensures no duplicate work.',
    ],
    escalateIf: 'No IC available → escalate to second founding team member.',
    toolsRequired: ['Slack'],
    deterrent: false,
  },

  // ── CONTAIN ─────────────────────────────────────────────────────────
  {
    stepId: 'con-01-feature-flag-disable',
    phase: 'contain',
    label: 'Disable Affected Feature via Flag',
    description:
      'If the incident is caused by a recently deployed feature, disable it using a feature flag or config toggle without requiring a code deploy.',
    applicableSeverities: ['SEV1', 'SEV2'],
    timeboxMinutes: 10,
    actions: [
      'Identify the feature or route responsible.',
      'Toggle the relevant environment variable or PostHog feature flag OFF in Vercel.',
      'Trigger a Vercel redeploy to pick up the change.',
      'Confirm 5xx rate returns to baseline.',
    ],
    escalateIf: 'Feature flag toggle does not reduce error rate → proceed to rollback.',
    toolsRequired: ['Vercel environment variables', 'PostHog feature flags'],
    deterrent: false,
  },
  {
    stepId: 'con-02-rollback-deployment',
    phase: 'contain',
    label: 'Roll Back to Previous Deployment',
    description:
      'If feature flag disable is insufficient, roll back to the last known-good deployment in Vercel.',
    applicableSeverities: ['SEV1', 'SEV2'],
    timeboxMinutes: 10,
    actions: [
      'Open Vercel project → Deployments.',
      'Identify the last successful deployment before the incident.',
      'Click "Promote to Production" on the known-good deployment.',
      'Monitor error rate for 5 minutes post-rollback.',
      'Confirm Clerk auth and Supabase connection still healthy after rollback.',
    ],
    escalateIf: 'Rollback does not resolve the issue → this may be a data or infrastructure issue, not a code issue.',
    toolsRequired: ['Vercel dashboard'],
    deterrent: false,
  },
  {
    stepId: 'con-03-db-readonly',
    phase: 'contain',
    label: 'Enable Database Read-Only Mode',
    description:
      'For active data corruption or exfiltration incidents, put the Supabase project into read-only mode to halt writes while investigation proceeds.',
    applicableSeverities: ['SEV1'],
    timeboxMinutes: 5,
    actions: [
      'Open Supabase dashboard → Database → Configuration.',
      'Revoke write permissions from the anon and service_role keys.',
      'Post status update in #incidents that writes are halted.',
      'Notify affected tenants that the platform is in maintenance mode.',
    ],
    escalateIf: 'Data exfiltration confirmed → escalate to legal-counsel immediately.',
    toolsRequired: ['Supabase dashboard'],
    deterrent: false,
  },

  // ── INVESTIGATE ─────────────────────────────────────────────────────
  {
    stepId: 'inv-01-root-cause',
    phase: 'investigate',
    label: 'Root Cause Analysis',
    description:
      'Determine the underlying cause of the incident. Use the 5 Whys technique. Document findings in the incident thread.',
    applicableSeverities: ['SEV1', 'SEV2', 'SEV3'],
    timeboxMinutes: 60,
    actions: [
      'Collect Vercel function logs for the affected time window.',
      'Collect Supabase slow query logs and error events.',
      'Review recent deployment history for correlated changes.',
      'Identify the proximate and root cause.',
      'Document in #incidents thread: what failed, when, and why.',
    ],
    escalateIf: null,
    toolsRequired: ['Vercel log drain', 'Supabase logs', 'GitHub commit history'],
    deterrent: false,
  },
  {
    stepId: 'inv-02-data-integrity-check',
    phase: 'investigate',
    label: 'Data Integrity Verification',
    description:
      'For SEV1 data incidents, verify the extent of any data corruption or exposure. Run targeted Supabase queries to scope the blast radius.',
    applicableSeverities: ['SEV1'],
    timeboxMinutes: 30,
    actions: [
      'Query affected tables with time-bounded filters to identify corrupted rows.',
      'Verify RLS policies were enforced (check Supabase auth.uid() in row updates).',
      'Produce a count of potentially affected records by tenant_id.',
      'Document findings with specific table names, row counts, and time range.',
    ],
    escalateIf: 'Evidence of unauthorised cross-tenant data access → notify affected tenants.',
    toolsRequired: ['Supabase SQL editor'],
    deterrent: false,
  },

  // ── RECOVER ─────────────────────────────────────────────────────────
  {
    stepId: 'rec-01-fix-deploy',
    phase: 'recover',
    label: 'Deploy Fix',
    description:
      'Deploy a targeted fix for the root cause. Fix must be reviewed by a second engineer before deploying to production.',
    applicableSeverities: ['SEV1', 'SEV2', 'SEV3'],
    timeboxMinutes: 60,
    actions: [
      'Create a focused fix PR targeting the root cause.',
      'Request expedited review from second founding team member.',
      'Merge with squash after CI passes.',
      'Monitor Vercel deployment logs during rollout.',
      'Confirm error rate returns to zero.',
    ],
    escalateIf: 'Fix deployment fails CI → revert and reassess.',
    toolsRequired: ['GitHub', 'Vercel dashboard'],
    deterrent: false,
  },
  {
    stepId: 'rec-02-data-restoration',
    phase: 'recover',
    label: 'Data Restoration (if applicable)',
    description:
      'For incidents involving data corruption, restore from Supabase PITR (point-in-time recovery) backup or apply compensating transactions.',
    applicableSeverities: ['SEV1'],
    timeboxMinutes: null,
    actions: [
      'Identify the last clean state timestamp before corruption.',
      'Use Supabase PITR to restore affected tables.',
      'Verify restored data integrity with targeted queries.',
      'Coordinate with affected tenants on any data loss window.',
    ],
    escalateIf: 'Restoration fails or data loss exceeds expected window → escalate to Supabase support.',
    toolsRequired: ['Supabase PITR', 'vendor-support'],
    deterrent: false,
  },
  {
    stepId: 'rec-03-comms-update',
    phase: 'recover',
    label: 'Communication Update',
    description:
      'Notify affected tenants and stakeholders that the incident is resolved. Provide a brief summary of impact and remediation.',
    applicableSeverities: ['SEV1', 'SEV2'],
    timeboxMinutes: 15,
    actions: [
      'Draft a plain-language summary of what happened and what was done.',
      'Send direct communication to affected tenant contacts.',
      'Post resolution message in #incidents Slack channel.',
      'Update incident status to RESOLVED with timestamp.',
    ],
    escalateIf: null,
    toolsRequired: ['Slack', 'email'],
    deterrent: false,
  },

  // ── REVIEW ──────────────────────────────────────────────────────────
  {
    stepId: 'rev-01-post-mortem',
    phase: 'review',
    label: 'Post-Incident Review (Post-Mortem)',
    description:
      'Blameless post-mortem within 48 hours for SEV1/SEV2 incidents. Document timeline, root cause, impact, and action items.',
    applicableSeverities: ['SEV1', 'SEV2'],
    timeboxMinutes: 60,
    actions: [
      'Complete the post-incident review template (see postIncidentTemplate).',
      'Identify at least one corrective action item per contributing cause.',
      'Assign action items to owners with due dates.',
      'Store completed review in docs/security/incident-reviews/.',
      'Share with founding team within 48 hours of incident close.',
    ],
    escalateIf: null,
    toolsRequired: ['Markdown editor', 'GitHub'],
    deterrent: false,
  },
  {
    stepId: 'rev-02-control-hardening',
    phase: 'review',
    label: 'Security Control Hardening',
    description:
      'Determine if the incident reveals a gap in the security posture model. Update SEC1 control maturity and create a backlog slice if a new control is needed.',
    applicableSeverities: ['SEV1', 'SEV2', 'SEV3'],
    timeboxMinutes: 30,
    actions: [
      'Review SEC1 security-posture-model.ts controls for any that should have prevented this incident.',
      'If a missing control is identified, add it to backlog-registry.json as a new SEC slice.',
      'If an existing control was marked implemented but failed, downgrade maturity to partial.',
      'Create a PR with the updated SEC1 maturity values.',
    ],
    escalateIf: null,
    toolsRequired: ['VS Code', 'GitHub'],
    deterrent: true,
  },
];

// ---------------------------------------------------------------------
// Escalation matrix
// ---------------------------------------------------------------------

const ESCALATION_MATRIX: ReadonlyArray<EscalationMatrixEntry> = [
  {
    severity: 'SEV1',
    label: 'Critical — Production Down or Active Data Leak',
    initialResponder: 'founder',
    escalateTo: ['lead-engineer', 'vendor-support', 'legal-counsel', 'affected-tenant'],
    maxResponseTimeMinutes: 5,
    maxContainmentTimeMinutes: 30,
    notifyAffectedTenants: true,
    requiresPostMortem: true,
  },
  {
    severity: 'SEV2',
    label: 'Major Degradation — Core Features Broken',
    initialResponder: 'lead-engineer',
    escalateTo: ['founder', 'vendor-support'],
    maxResponseTimeMinutes: 15,
    maxContainmentTimeMinutes: 60,
    notifyAffectedTenants: true,
    requiresPostMortem: true,
  },
  {
    severity: 'SEV3',
    label: 'Minor Degradation — Non-Critical Feature Impacted',
    initialResponder: 'lead-engineer',
    escalateTo: ['founder'],
    maxResponseTimeMinutes: 30,
    maxContainmentTimeMinutes: 240,
    notifyAffectedTenants: false,
    requiresPostMortem: false,
  },
  {
    severity: 'SEV4',
    label: 'Low-Impact Risk Signal',
    initialResponder: 'lead-engineer',
    escalateTo: [],
    maxResponseTimeMinutes: 240,
    maxContainmentTimeMinutes: 1440,
    notifyAffectedTenants: false,
    requiresPostMortem: false,
  },
];

// ---------------------------------------------------------------------
// Post-incident review template
// ---------------------------------------------------------------------

const POST_INCIDENT_TEMPLATE: ReadonlyArray<PostIncidentReviewSection> = [
  {
    sectionId: 'pir-1-summary',
    label: 'Incident Summary',
    prompts: [
      'What happened, in one sentence?',
      'When did the incident start and end?',
      'What was the maximum severity classification?',
      'Which tenants or users were affected?',
    ],
    required: true,
  },
  {
    sectionId: 'pir-2-timeline',
    label: 'Timeline',
    prompts: [
      'When was the first signal detected?',
      'When was the incident acknowledged?',
      'When was containment achieved?',
      'When was recovery complete?',
      'List key events with timestamps.',
    ],
    required: true,
  },
  {
    sectionId: 'pir-3-root-cause',
    label: 'Root Cause',
    prompts: [
      'What was the proximate cause?',
      'What was the root cause (5 Whys)?',
      'Was this a code defect, infrastructure failure, configuration error, or process gap?',
    ],
    required: true,
  },
  {
    sectionId: 'pir-4-impact',
    label: 'Impact Assessment',
    prompts: [
      'How many users/tenants were affected?',
      'Was any data corrupted, lost, or potentially exposed?',
      'What was the estimated downtime?',
      'Was any SLA breached?',
    ],
    required: true,
  },
  {
    sectionId: 'pir-5-what-went-well',
    label: 'What Went Well',
    prompts: [
      'Which processes, tools, or controls worked as expected?',
      'What helped the team detect or contain the incident quickly?',
    ],
    required: false,
  },
  {
    sectionId: 'pir-6-action-items',
    label: 'Action Items',
    prompts: [
      'List corrective actions with owner and due date.',
      'Are any security controls in SEC1 affected? Update maturity if so.',
      'Does any action item require a new backlog slice?',
    ],
    required: true,
  },
];

// ---------------------------------------------------------------------
// Canonical runbook object
// ---------------------------------------------------------------------

const INCIDENT_RESPONSE_RUNBOOK: IncidentResponseRunbook = {
  version: '1.0',
  name: 'AbarVa Incident Response Runbook v1',
  description:
    'Canonical playbook for detecting, triaging, containing, investigating, recovering from, and reviewing security and availability incidents on the AbarVa platform. Covers SEV1–SEV4 severity levels with explicit escalation paths and timebox targets.',
  lastReviewedCycle: 'wave-31',
  phases: ['detect', 'triage', 'contain', 'investigate', 'recover', 'review'],
  steps: RESPONSE_STEPS,
  escalationMatrix: ESCALATION_MATRIX,
  postIncidentTemplate: POST_INCIDENT_TEMPLATE,
  createdFrom: 'sec2_w31_incident_response_runbook',
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full incident response runbook. Pure.
 */
export function getIncidentResponseRunbook(): IncidentResponseRunbook {
  return INCIDENT_RESPONSE_RUNBOOK;
}

/**
 * Return all steps for a given phase. Pure.
 */
export function getStepsByPhase(
  phase: IncidentResponsePhase,
): ReadonlyArray<IncidentResponseStep> {
  return RESPONSE_STEPS.filter((s) => s.phase === phase);
}

/**
 * Return all steps applicable to a given severity level. Pure.
 */
export function getStepsBySeverity(
  severity: IncidentSeverity,
): ReadonlyArray<IncidentResponseStep> {
  return RESPONSE_STEPS.filter((s) => s.applicableSeverities.includes(severity));
}

/**
 * Return the escalation matrix entry for a given severity. Pure.
 */
export function getEscalationEntry(
  severity: IncidentSeverity,
): EscalationMatrixEntry | undefined {
  return ESCALATION_MATRIX.find((e) => e.severity === severity);
}

/**
 * Return all steps that require escalation conditions (escalateIf not null). Pure.
 */
export function getStepsWithEscalationConditions(): ReadonlyArray<IncidentResponseStep> {
  return RESPONSE_STEPS.filter((s) => s.escalateIf !== null);
}

/**
 * Return the post-incident review template sections. Pure.
 */
export function getPostIncidentTemplate(): ReadonlyArray<PostIncidentReviewSection> {
  return POST_INCIDENT_TEMPLATE;
}

/**
 * Return required post-incident review sections only. Pure.
 */
export function getRequiredReviewSections(): ReadonlyArray<PostIncidentReviewSection> {
  return POST_INCIDENT_TEMPLATE.filter((s) => s.required);
}

/**
 * Query the runbook for a specific severity and optional phase.
 * Returns matched steps and the escalation entry.
 */
export function queryRunbook(
  severity: IncidentSeverity,
  phase: IncidentResponsePhase | null = null,
): RunbookQueryResult {
  const stepsForSeverity = getStepsBySeverity(severity);
  const matchedSteps = phase
    ? stepsForSeverity.filter((s) => s.phase === phase)
    : stepsForSeverity;

  const escalationEntry = getEscalationEntry(severity)!;

  return {
    severity,
    phase,
    matchedSteps,
    escalationEntry,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

export const INCIDENT_SEVERITIES_IN_ORDER: ReadonlyArray<IncidentSeverity> = [
  'SEV1',
  'SEV2',
  'SEV3',
  'SEV4',
];

export const INCIDENT_RESPONSE_PHASES_IN_ORDER: ReadonlyArray<IncidentResponsePhase> = [
  'detect',
  'triage',
  'contain',
  'investigate',
  'recover',
  'review',
];
