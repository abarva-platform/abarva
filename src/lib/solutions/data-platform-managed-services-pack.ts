/**
 * PAT1 · Data Platform Managed Services Pattern Pack
 *
 * Structured pattern IP for data platform managed services sourcing events.
 * Covers sourcing criteria, evidence requirements, failure modes, and
 * Sentinel/Nexus guidance for enterprise data platform vendor selection.
 *
 * No model calls. No DB writes. No React hooks. No Date.now reads.
 * Same input → identical output every time (deterministic seed).
 *
 * This module does NOT import:
 *   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
 *   - src/lib/agent/**, src/components/agent/**
 *   - src/lib/source/**, src/app/(maestro)/source/**
 *   - src/app/programs/**
 *   - src/lib/programs/mock.ts
 *   - src/lib/auth/**
 *   - supabase/**
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DataPlatformPatternSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DataPlatformCriteria {
  id: string;
  area: string;
  criterion: string;
  rationale: string;
  evidenceRequired: ReadonlyArray<string>;
  commonVendorWeakness: string;
  severity: DataPlatformPatternSeverity;
}

export interface DataPlatformFailureMode {
  id: string;
  title: string;
  description: string;
  observedIn: ReadonlyArray<string>; // industry verticals where observed
  frequencyNote: string;
  intervention: string;
  agentGuidance: string;
}

export interface DataPlatformSourcingPattern {
  id: string;
  slug: string;
  name: string;
  category: 'sourcing' | 'evaluation' | 'governance' | 'transition' | 'ongoing-ops';
  shortDescription: string;
  primaryQuestion: string;
  criteria: ReadonlyArray<DataPlatformCriteria>;
  failureModes: ReadonlyArray<DataPlatformFailureMode>;
  bafoReadinessSignals: ReadonlyArray<string>;
  recommendedGates: ReadonlyArray<string>;
  relatedPatternSlugs: ReadonlyArray<string>;
  sentinelSignals: ReadonlyArray<string>;
  createdFrom: 'pat1_data_platform_managed_services';
}

// ---------------------------------------------------------------------------
// PAT1 pattern data
// ---------------------------------------------------------------------------

export const DATA_PLATFORM_MANAGED_SERVICES_PATTERNS: ReadonlyArray<DataPlatformSourcingPattern> = [
  {
    id: 'dpms-001',
    slug: 'data-platform-vendor-selection-criteria',
    name: 'Data Platform Managed Services: Vendor Selection Criteria',
    category: 'sourcing',
    shortDescription:
      'Structured criteria for selecting a data platform managed services partner, covering technical capability, operational model, transition risk, and commercial structure.',
    primaryQuestion:
      'Does this vendor have the right operational model, data engineering depth, and transition capability for our data platform?',
    criteria: [
      {
        id: 'dpms-c001',
        area: 'Technical Depth',
        criterion: 'Vendor demonstrates certified expertise in the target data platform stack (Databricks, Snowflake, dbt, or equivalent)',
        rationale:
          'Managed services without deep stack expertise consistently underdelivers on SLA and escalates to the client team for resolution. Certified expertise is the baseline signal.',
        evidenceRequired: [
          'Named certified engineers with role in this engagement',
          'Platform partnership tier (Premier, Select, etc.)',
          'Reference customer on same stack version',
        ],
        commonVendorWeakness:
          'Vendors claim expertise via partnership tier without named certified staff. Probe for specific engineers assigned to the account.',
        severity: 'critical',
      },
      {
        id: 'dpms-c002',
        area: 'Operational Model',
        criterion: 'Vendor provides 24/7 monitoring with a defined escalation matrix and SLA for incident response',
        rationale:
          'Data platform incidents are often silent (pipeline failures, data quality drift) rather than visible outages. Passive monitoring with business-hours SLAs misses the majority of critical events.',
        evidenceRequired: [
          'Incident response SLA (P1, P2, P3 definitions and response times)',
          'Monitoring tooling used (Datadog, PagerDuty, Monte Carlo, etc.)',
          'On-call rotation structure and geography',
        ],
        commonVendorWeakness:
          'Vendors propose follow-the-sun coverage but cannot name the teams or show the escalation matrix with actual names and time zones.',
        severity: 'high',
      },
      {
        id: 'dpms-c003',
        area: 'Transition Risk',
        criterion: 'Vendor has documented transition methodology covering knowledge transfer, runbook migration, and stabilization period',
        rationale:
          'Managed services transitions are the highest-risk period. Vendors without a structured methodology absorb tribal knowledge informally, creating dependency gaps that manifest as incidents 60-90 days post-transition.',
        evidenceRequired: [
          'Transition plan template with phase gates',
          'Knowledge transfer checklist used in last three transitions',
          'Stabilization period definition and exit criteria',
        ],
        commonVendorWeakness:
          'Vendors provide a project plan with milestones but no runbook migration methodology. The plan shows transition dates but not what constitutes readiness.',
        severity: 'high',
      },
      {
        id: 'dpms-c004',
        area: 'Commercial Structure',
        criterion: 'Pricing model includes outcome-linked SLA credits and clear change order boundaries',
        rationale:
          'Fixed-fee managed services contracts without outcome linkage incentivize minimum-effort delivery. Change order boundaries prevent scope creep from becoming an uncontrolled cost driver.',
        evidenceRequired: [
          'SLA credit schedule (credits per breach, cap, calculation method)',
          'Change order threshold definition (what triggers a change order)',
          'Multi-year pricing structure and indexation clause',
        ],
        commonVendorWeakness:
          'SLA credits exist but the cap is so low (e.g., one month fee) that breach is not commercially meaningful. Probe for annual cap and aggregated credit calculation.',
        severity: 'medium',
      },
      {
        id: 'dpms-c005',
        area: 'Data Governance',
        criterion: 'Vendor operates within a documented data governance framework covering access controls, audit logging, and data residency',
        rationale:
          'Managed services vendors have elevated access to production data. Without a governance framework, audit trails are incomplete and residency violations are undetectable.',
        evidenceRequired: [
          'Access control model (least-privilege, PAM tooling used)',
          'Audit log retention policy and format',
          'Data residency commitment and enforcement mechanism',
        ],
        commonVendorWeakness:
          'Vendors reference their own SOC2 certification but cannot describe client-specific access controls or show an example audit log from a comparable client.',
        severity: 'high',
      },
    ],
    failureModes: [
      {
        id: 'dpms-fm001',
        title: 'Transition-Phase Knowledge Loss',
        description:
          'The internal team transfers operational responsibility before runbooks are complete. The vendor lacks the tribal knowledge to resolve non-standard incidents and escalates back to the client team, defeating the purpose of the managed service.',
        observedIn: ['retail', 'financial-services', 'healthcare'],
        frequencyNote: 'Observed in approximately 40% of first-time managed services transitions where no structured knowledge transfer gate is enforced.',
        intervention:
          'Require a signed knowledge transfer sign-off from both client and vendor engineering leads as a gate to transition completion. Define "runbook completeness" as a measurable criterion (e.g., 100% of P1/P2 incident types have a documented runbook).',
        agentGuidance:
          'Nexus: flag this risk if the transition plan does not include a knowledge transfer gate. Surface the pattern to the programme sponsor before the transition phase starts.',
      },
      {
        id: 'dpms-fm002',
        title: 'Silent Data Quality Drift',
        description:
          'Pipeline failures or schema drift go undetected because the monitoring coverage does not include data quality checks — only infrastructure health. Business teams discover the issue when downstream reports fail, typically 3-7 days after the drift begins.',
        observedIn: ['retail', 'financial-services'],
        frequencyNote: 'Consistent pattern in managed services contracts that do not explicitly scope data quality monitoring (DQM). Infrastructure SLAs do not cover DQM.',
        intervention:
          'Explicitly scope data quality monitoring (freshness, completeness, distribution drift) as a separate SLA tier. Require vendor to propose a DQM tool (Monte Carlo, Great Expectations, dbt tests) and include DQM metrics in the monthly service report.',
        agentGuidance:
          'Sentinel: flag when a managed services contract does not include a data quality monitoring scope definition. Pattern confidence: high.',
      },
      {
        id: 'dpms-fm003',
        title: 'Change Order Scope Creep',
        description:
          'Minor requests — schema changes, new pipeline additions, access provisioning — accumulate as change orders. Total change order cost exceeds base contract value within 18 months. The client perceives the vendor as expensive relative to original proposal.',
        observedIn: ['retail', 'financial-services', 'healthcare'],
        frequencyNote: 'Common when the change order boundary is defined in ambiguous language (e.g., "material changes to scope") rather than quantitative thresholds.',
        intervention:
          'Define change order thresholds quantitatively (e.g., any new pipeline >8 hours estimated effort, any schema change >3 tables). Include an annual change order budget in the base contract.',
        agentGuidance:
          'Steward: require change order boundary definition as a BAFO clarification if not present in the original RFP response. Block commercial gate advancement without it.',
      },
    ],
    bafoReadinessSignals: [
      'Vendor has provided a named transition project manager and engineering lead',
      'SLA credit schedule is specific (not referential to "standard terms")',
      'Data quality monitoring scope is explicitly included in the statement of work',
      'Change order thresholds are defined quantitatively',
      'Reference customer on same platform version has been contacted',
    ],
    recommendedGates: [
      'G1: Vendor shortlist — technical depth verified (certificates, named engineers)',
      'G2: BAFO invite — commercial structure reviewed (SLA credits, change order bounds)',
      'G3: Selection — transition plan reviewed and knowledge transfer gate confirmed',
      'G4: Contract — governance framework signed (access controls, audit logging, residency)',
    ],
    relatedPatternSlugs: [
      'vendor-evaluation-scorecard',
      'ims-managed-services-criteria',
      'ai-program-failure-modes',
    ],
    sentinelSignals: [
      'evidence_chain_gap',
      'gate_governance_gap',
    ],
    createdFrom: 'pat1_data_platform_managed_services',
  },
  {
    id: 'dpms-002',
    slug: 'data-platform-transition-governance',
    name: 'Data Platform Managed Services: Transition Governance',
    category: 'transition',
    shortDescription:
      'Governance model for managing a data platform managed services transition, covering phase gates, knowledge transfer, and stabilization exit criteria.',
    primaryQuestion:
      'Is the transition structured to prevent knowledge loss, SLA gap, and dependency re-creation?',
    criteria: [
      {
        id: 'dpms-c006',
        area: 'Phase Gates',
        criterion: 'Transition plan includes signed phase gates (discovery complete, runbooks complete, parallel-run passed, stabilization complete)',
        rationale:
          'Unstaged transitions allow vendors to declare readiness without objective criteria. Phase gates with mutual sign-off enforce completeness.',
        evidenceRequired: [
          'Transition plan with named gate owners and sign-off criteria',
          'Parallel-run duration and success criteria',
          'Stabilization period definition (e.g., 90 days with zero P1 incidents)',
        ],
        commonVendorWeakness:
          'Vendors propose a single "go-live" milestone without distinct phase gates. Stabilization is not defined — the transition is considered complete at go-live.',
        severity: 'critical',
      },
      {
        id: 'dpms-c007',
        area: 'Knowledge Transfer',
        criterion: 'Runbook completeness is defined as a measurable criterion, not a qualitative judgment',
        rationale:
          'Runbooks are the primary knowledge artifact. If completeness is undefined, the vendor declares completion without full coverage.',
        evidenceRequired: [
          'Runbook inventory scope (all P1/P2 incident types, all critical pipelines)',
          'Runbook sign-off protocol (who approves, what constitutes "complete")',
        ],
        commonVendorWeakness:
          'Runbook completeness is not defined. Vendor commits to "document all processes" without an inventory of what processes must be documented.',
        severity: 'high',
      },
    ],
    failureModes: [
      {
        id: 'dpms-fm004',
        title: 'Premature Go-Live',
        description:
          'The vendor declares the transition complete before the stabilization period confirms stable operation. First major incident occurs within 30 days, requiring significant client-side support.',
        observedIn: ['retail', 'financial-services'],
        frequencyNote: 'Observed when the contract does not include a stabilization period with defined exit criteria.',
        intervention:
          'Require a 60-90 day stabilization period with a P1 incident-free threshold as the exit criterion. Payment of the final transition milestone should be contingent on stabilization exit.',
        agentGuidance:
          'Nexus: flag premature go-live risk if the transition plan does not include a stabilization period with defined exit criteria.',
      },
    ],
    bafoReadinessSignals: [
      'Transition plan has at least 4 phase gates with named sign-off criteria',
      'Runbook inventory is defined (count of P1/P2 types to be documented)',
      'Stabilization period duration and exit criteria are specified',
    ],
    recommendedGates: [
      'G1: Transition kickoff — discovery complete gate signed',
      'G2: Parallel-run — operational for minimum 4 weeks without P1',
      'G3: Stabilization — 90-day P1-free period passed',
      'G4: Closeout — final runbook completeness audit passed',
    ],
    relatedPatternSlugs: ['data-platform-vendor-selection-criteria'],
    sentinelSignals: ['gate_governance_gap'],
    createdFrom: 'pat1_data_platform_managed_services',
  },
];

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

export function getDataPlatformPattern(
  slug: string,
): DataPlatformSourcingPattern | undefined {
  return DATA_PLATFORM_MANAGED_SERVICES_PATTERNS.find((p) => p.slug === slug);
}

export function getDataPlatformPatternsByCategory(
  category: DataPlatformSourcingPattern['category'],
): ReadonlyArray<DataPlatformSourcingPattern> {
  return DATA_PLATFORM_MANAGED_SERVICES_PATTERNS.filter((p) => p.category === category);
}

export function getDataPlatformBafoChecklist(slug: string): ReadonlyArray<string> {
  return getDataPlatformPattern(slug)?.bafoReadinessSignals ?? [];
}

export const DATA_PLATFORM_PATTERN_SLUGS: ReadonlyArray<string> =
  DATA_PLATFORM_MANAGED_SERVICES_PATTERNS.map((p) => p.slug);
