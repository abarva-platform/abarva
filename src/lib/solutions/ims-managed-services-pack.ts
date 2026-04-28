/**
 * PAT2 · Infrastructure Managed Services (IMS) Pattern Pack
 *
 * Structured pattern IP for infrastructure managed services sourcing events.
 * Covers sourcing criteria, transition risk, SLA design, and vendor evaluation
 * for cloud infrastructure and application operations managed services.
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

export type IMSContractTier = 'foundational' | 'enhanced' | 'strategic';
export type IMSSLATier = 'P1' | 'P2' | 'P3' | 'P4';
export type IMSPatternSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IMSSLADefinition {
  tier: IMSSLATier;
  description: string;
  targetResponseTime: string;
  targetResolutionTime: string;
  creditPerBreach: string;
}

export interface IMSCriterion {
  id: string;
  area: string;
  criterion: string;
  rationale: string;
  evidenceRequired: ReadonlyArray<string>;
  probeQuestion: string;
  severity: IMSPatternSeverity;
}

export interface IMSFailureMode {
  id: string;
  title: string;
  description: string;
  preconditions: ReadonlyArray<string>;
  intervention: string;
  agentGuidance: string;
  observedIn: ReadonlyArray<string>;
}

export interface IMSSourcingPattern {
  id: string;
  slug: string;
  name: string;
  contractTier: IMSContractTier;
  shortDescription: string;
  primaryQuestion: string;
  criteria: ReadonlyArray<IMSCriterion>;
  recommendedSLAStructure: ReadonlyArray<IMSSLADefinition>;
  failureModes: ReadonlyArray<IMSFailureMode>;
  bafoReadinessSignals: ReadonlyArray<string>;
  relatedPatternSlugs: ReadonlyArray<string>;
  sentinelSignals: ReadonlyArray<string>;
  createdFrom: 'pat2_ims_managed_services';
}

// ---------------------------------------------------------------------------
// PAT2 pattern data
// ---------------------------------------------------------------------------

const IMS_STANDARD_SLA: ReadonlyArray<IMSSLADefinition> = [
  {
    tier: 'P1',
    description: 'Complete system outage or critical business function unavailable',
    targetResponseTime: '15 minutes',
    targetResolutionTime: '4 hours',
    creditPerBreach: '10% monthly fee per breach, capped at 30% per month',
  },
  {
    tier: 'P2',
    description: 'Significant degradation of production system; workaround available',
    targetResponseTime: '30 minutes',
    targetResolutionTime: '8 business hours',
    creditPerBreach: '5% monthly fee per breach, capped at 15% per month',
  },
  {
    tier: 'P3',
    description: 'Non-critical function impacted; production not directly affected',
    targetResponseTime: '2 business hours',
    targetResolutionTime: '3 business days',
    creditPerBreach: '2% monthly fee per breach',
  },
  {
    tier: 'P4',
    description: 'Minor issue or enhancement request with no production impact',
    targetResponseTime: '1 business day',
    targetResolutionTime: '10 business days',
    creditPerBreach: 'No credit — tracked for CSAT',
  },
];

export const IMS_MANAGED_SERVICES_PATTERNS: ReadonlyArray<IMSSourcingPattern> = [
  {
    id: 'ims-001',
    slug: 'ims-vendor-selection-criteria',
    name: 'Infrastructure Managed Services: Vendor Selection Criteria',
    contractTier: 'enhanced',
    shortDescription:
      'Core evaluation criteria for selecting an IMS vendor covering technical capability, operational model, transition risk, SLA design, and commercial structure.',
    primaryQuestion:
      'Does this vendor have the operational depth, tooling, and transition methodology to take over our infrastructure estate without service degradation?',
    criteria: [
      {
        id: 'ims-c001',
        area: 'Service Scope Definition',
        criterion: 'The vendor proposes a precise service scope with a CI/CD definition of "in scope" vs "out of scope" — no ambiguous boundaries',
        rationale:
          'IMS contracts with ambiguous scope boundaries consistently generate change order disputes. The most common source of conflict is whether security patching, capacity planning, and cloud cost optimization are included in the base fee.',
        evidenceRequired: [
          'Statement of work with explicit in-scope/out-of-scope matrix',
          'List of items explicitly excluded from base fee',
          'Change order trigger definition',
        ],
        probeQuestion:
          'Show us the last three change order disputes from a comparable client and how they were resolved.',
        severity: 'critical',
      },
      {
        id: 'ims-c002',
        area: 'Tooling and Automation',
        criterion: 'Vendor uses a defined toolset for monitoring, incident management, and automation — not ad-hoc scripts or undocumented processes',
        rationale:
          'IMS quality is determined by the consistency of operational execution. Vendors relying on bespoke scripts cannot be audited, transfer knowledge reliably, or scale the team without degradation.',
        evidenceRequired: [
          'CMDB tooling used (ServiceNow, Jira Service Management, etc.)',
          'Monitoring stack (Datadog, Dynatrace, PagerDuty, etc.)',
          'Automation framework (Ansible, Terraform, etc.) with versioned runbooks',
        ],
        probeQuestion:
          'Show us a runbook from a comparable client engagement. How is it versioned and maintained?',
        severity: 'high',
      },
      {
        id: 'ims-c003',
        area: 'Staffing Model',
        criterion: 'Vendor proposes a named account team with defined minimum staffing levels, including backup coverage for key roles',
        rationale:
          'Single points of failure in account staffing create service risk. The most common IMS failure pattern is over-reliance on one or two key engineers who leave mid-contract.',
        evidenceRequired: [
          'Named account manager and technical lead',
          'Minimum staffing level for the account (FTE or dedicated hours)',
          'Backup coverage plan for key roles',
          'Staff attrition rate on comparable accounts (last 12 months)',
        ],
        probeQuestion:
          'What was the staff turnover rate on your three largest comparable accounts last year? How did you manage transitions?',
        severity: 'high',
      },
      {
        id: 'ims-c004',
        area: 'Security and Compliance',
        criterion: 'Vendor holds relevant certifications (ISO 27001, SOC2 Type II) and can demonstrate compliance with client security requirements',
        rationale:
          'IMS vendors have privileged access to production infrastructure. Without verified security certifications and controls, the client inherits the vendor\'s security risk.',
        evidenceRequired: [
          'SOC2 Type II report (current, <12 months)',
          'ISO 27001 certificate (current)',
          'Evidence of privileged access management (PAM) tooling',
          'Security incident disclosure history (last 24 months)',
        ],
        probeQuestion:
          'Show us your last SOC2 bridge letter and confirm your current certification scope covers the services being proposed.',
        severity: 'critical',
      },
      {
        id: 'ims-c005',
        area: 'Cloud Cost Optimization',
        criterion: 'For cloud IMS, vendor includes a defined cloud cost optimization service (rightsizing, commitment planning, waste elimination)',
        rationale:
          'Cloud costs are the largest variable in IMS contracts. Vendors that do not actively manage cloud consumption allow costs to grow 20-40% above baseline within 18 months.',
        evidenceRequired: [
          'Cloud cost optimization methodology (FinOps framework or equivalent)',
          'Target cost reduction commitment for year 1',
          'Reporting cadence and format for cost optimization progress',
        ],
        probeQuestion:
          'Show us cost optimization results from a comparable engagement. What was the baseline cost and what was achieved?',
        severity: 'medium',
      },
    ],
    recommendedSLAStructure: IMS_STANDARD_SLA,
    failureModes: [
      {
        id: 'ims-fm001',
        title: 'Scope Boundary Disputes',
        description:
          'Within 90 days of contract start, the client and vendor disagree on whether specific tasks (security patching, DR testing, capacity planning) are in scope. Change orders accumulate faster than anticipated.',
        preconditions: [
          'Statement of work uses qualitative scope descriptions ("manage all infrastructure")',
          'No explicit exclusion matrix in the contract',
        ],
        intervention:
          'Require a binary in-scope/out-of-scope matrix as a BAFO deliverable. Any task not explicitly listed as in-scope defaults to out-of-scope.',
        agentGuidance:
          'Steward: flag scope ambiguity as a gate blocker. Do not allow BAFO submission without a binary scope matrix.',
        observedIn: ['retail', 'financial-services', 'healthcare'],
      },
      {
        id: 'ims-fm002',
        title: 'Key Person Dependency',
        description:
          'One or two vendor engineers carry all institutional knowledge of the client environment. When they leave or rotate, service quality degrades materially for 30-60 days while the replacement ramps up.',
        preconditions: [
          'Vendor has not maintained a living architecture document',
          'Runbooks are informal or undocumented',
          'No cross-training requirement in the contract',
        ],
        intervention:
          'Require minimum staffing levels, mandatory runbook maintenance, and cross-training as SLA deliverables. Include a staff transition notice period (30 days minimum) as a contract clause.',
        agentGuidance:
          'Sentinel: flag key person dependency risk if the vendor account team has fewer than 3 named engineers for an account of >£2M ACV.',
        observedIn: ['retail', 'financial-services'],
      },
      {
        id: 'ims-fm003',
        title: 'Monitoring Coverage Gaps',
        description:
          'The vendor monitors infrastructure health (CPU, memory, disk) but does not monitor application-level or business-level metrics. Business-impacting degradation goes undetected until users report it.',
        preconditions: [
          'Monitoring scope is defined as "infrastructure health" without application metrics',
          'No synthetic transaction monitoring or user-impact alerting',
        ],
        intervention:
          'Expand monitoring scope definition to include application-level metrics and synthetic transaction monitoring. Require weekly monitoring coverage report showing % of critical paths covered.',
        agentGuidance:
          'Sentinel: flag monitoring coverage gaps as a sourcing event risk. Confidence: high when monitoring scope is not defined beyond infrastructure health.',
        observedIn: ['retail', 'healthcare'],
      },
    ],
    bafoReadinessSignals: [
      'Binary in-scope/out-of-scope matrix provided',
      'SLA credits are quantified per tier (not "negotiate at time of dispute")',
      'Named account team with backup coverage plan provided',
      'Cloud cost optimization methodology and year-1 target specified (if applicable)',
      'Current SOC2 Type II report provided or bridge letter available',
    ],
    relatedPatternSlugs: [
      'data-platform-vendor-selection-criteria',
      'vendor-evaluation-scorecard',
    ],
    sentinelSignals: ['evidence_chain_gap', 'gate_governance_gap'],
    createdFrom: 'pat2_ims_managed_services',
  },
];

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

export function getIMSPattern(slug: string): IMSSourcingPattern | undefined {
  return IMS_MANAGED_SERVICES_PATTERNS.find((p) => p.slug === slug);
}

export function getIMSStandardSLA(): ReadonlyArray<IMSSLADefinition> {
  return IMS_STANDARD_SLA;
}

export function getIMSBafoChecklist(slug: string): ReadonlyArray<string> {
  return getIMSPattern(slug)?.bafoReadinessSignals ?? [];
}

export const IMS_PATTERN_SLUGS: ReadonlyArray<string> =
  IMS_MANAGED_SERVICES_PATTERNS.map((p) => p.slug);
