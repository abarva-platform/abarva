/**
 * PAT3 · Vendor Evaluation Pattern
 *
 * Standardized vendor evaluation criteria, evidence requirements, scorecard
 * structure, and BAFO readiness signals for enterprise AI/technology vendor
 * selection events.
 *
 * Covers: evaluation dimensions, scoring model, evidence requirements,
 * commercial risk signals, and Sentinel/Nexus/Steward guidance.
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

export type VendorEvaluationDimension =
  | 'technical_capability'
  | 'commercial_structure'
  | 'transition_risk'
  | 'operational_model'
  | 'financial_stability'
  | 'reference_quality'
  | 'contractual_protection'
  | 'strategic_alignment';

export type VendorEvaluationWeight = 1 | 2 | 3 | 4 | 5; // 5 = highest weight
export type VendorScoreRating = 'not_assessed' | 'weak' | 'adequate' | 'strong' | 'leading';

export interface VendorEvaluationCriterion {
  id: string;
  dimension: VendorEvaluationDimension;
  criterion: string;
  weight: VendorEvaluationWeight;
  evidenceRequired: ReadonlyArray<string>;
  weakSignals: ReadonlyArray<string>;
  strongSignals: ReadonlyArray<string>;
}

export interface VendorScorecardRow {
  criterionId: string;
  dimension: VendorEvaluationDimension;
  criterion: string;
  weight: VendorEvaluationWeight;
  rating: VendorScoreRating;
  evidenceNotes: string;
}

export interface VendorScorecardSummary {
  vendorName: string;
  totalWeightedScore: number;
  maxPossibleScore: number;
  normalizedScore: number; // 0-100
  bafoEligible: boolean;
  exclusionReasons: ReadonlyArray<string>;
  rows: ReadonlyArray<VendorScorecardRow>;
  createdFrom: 'pat3_vendor_evaluation';
}

export interface VendorEvaluationCommercialRisk {
  id: string;
  riskName: string;
  description: string;
  triggerConditions: ReadonlyArray<string>;
  mitigationRequired: string;
  agentGuidance: string;
}

export interface VendorEvaluationPattern {
  id: string;
  slug: string;
  name: string;
  applicableCategories: ReadonlyArray<string>;
  shortDescription: string;
  primaryQuestion: string;
  dimensions: ReadonlyArray<VendorEvaluationDimension>;
  criteria: ReadonlyArray<VendorEvaluationCriterion>;
  commercialRisks: ReadonlyArray<VendorEvaluationCommercialRisk>;
  bafoInviteThreshold: number; // minimum normalized score (0-100) to invite to BAFO
  autoExclusionCriteria: ReadonlyArray<string>;
  sentinelSignals: ReadonlyArray<string>;
  createdFrom: 'pat3_vendor_evaluation';
}

// ---------------------------------------------------------------------------
// Rating score mapping
// ---------------------------------------------------------------------------

const RATING_SCORE: Record<VendorScoreRating, number> = {
  not_assessed: 0,
  weak: 1,
  adequate: 2,
  strong: 3,
  leading: 4,
};

// ---------------------------------------------------------------------------
// PAT3 pattern data
// ---------------------------------------------------------------------------

export const VENDOR_EVALUATION_PATTERN: VendorEvaluationPattern = {
  id: 'vep-001',
  slug: 'vendor-evaluation-scorecard',
  name: 'Vendor Evaluation Scorecard — Enterprise AI/Technology Selection',
  applicableCategories: [
    'data-platform-managed-services',
    'infrastructure-managed-services',
    'ai-software-platform',
    'professional-services',
  ],
  shortDescription:
    'Structured 8-dimension vendor evaluation scorecard with weighted criteria, evidence requirements, BAFO eligibility thresholds, and commercial risk signals.',
  primaryQuestion:
    'Which vendor(s) have the capability, commercial structure, and risk profile to be invited to BAFO?',
  dimensions: [
    'technical_capability',
    'commercial_structure',
    'transition_risk',
    'operational_model',
    'financial_stability',
    'reference_quality',
    'contractual_protection',
    'strategic_alignment',
  ],
  criteria: [
    // --- Technical Capability ---
    {
      id: 'vep-c001',
      dimension: 'technical_capability',
      criterion: 'Demonstrated expertise in the required technology stack with certified staff named in the proposal',
      weight: 5,
      evidenceRequired: [
        'Named certified engineers with role in this engagement',
        'Platform certification documents',
        'Relevant case study (same stack, comparable scope)',
      ],
      weakSignals: [
        'Certifications listed without named individuals',
        'Case studies reference different technology versions or older platforms',
        'No named delivery lead in the proposal',
      ],
      strongSignals: [
        'Named engineers with stack-specific certifications provided',
        'Reference customer on same platform version reachable',
        'Technical architecture reviewed and scored by internal team',
      ],
    },
    {
      id: 'vep-c002',
      dimension: 'technical_capability',
      criterion: 'Proposal addresses the specific technical scope without unexplained dependencies on third parties',
      weight: 4,
      evidenceRequired: [
        'Technical scope definition covering all required capabilities',
        'List of subcontractors or third-party dependencies',
        'Architecture diagram for the proposed solution',
      ],
      weakSignals: [
        'Proposal references third parties for critical capabilities without named partners',
        'Architecture diagram is generic (not client-specific)',
        'Key capability described as "to be confirmed at project start"',
      ],
      strongSignals: [
        'All critical capabilities delivered by named staff within the vendor',
        'Subcontractors named with their role and accountability',
        'Client-specific architecture provided at proposal stage',
      ],
    },
    // --- Commercial Structure ---
    {
      id: 'vep-c003',
      dimension: 'commercial_structure',
      criterion: 'Pricing model is clear, fully loaded, and does not rely on assumptions that transfer cost risk to the client',
      weight: 5,
      evidenceRequired: [
        'Fully loaded price breakdown (no reference to "TBD" or "at cost")',
        'Explicit list of items excluded from the base price',
        'Change order trigger definition',
      ],
      weakSignals: [
        'Price sheet references "rates TBD" for any in-scope item',
        'Change order boundary is undefined or qualitative',
        'Travel and expenses excluded with no cap',
      ],
      strongSignals: [
        'Fixed price for all in-scope deliverables',
        'Change order boundary defined quantitatively',
        'T&E included in base price or capped at a stated amount',
      ],
    },
    {
      id: 'vep-c004',
      dimension: 'commercial_structure',
      criterion: 'SLA credits are meaningful (not capped below the cost of breach) and escalate for repeated violations',
      weight: 4,
      evidenceRequired: [
        'SLA credit schedule (per-tier, quantified)',
        'Annual cap on SLA credits',
        'Escalation mechanism for repeated breach',
      ],
      weakSignals: [
        'SLA credits capped at one month fee',
        'No escalation for repeated breach',
        'Credits require formal dispute process to trigger',
      ],
      strongSignals: [
        'SLA credits uncapped or capped at ≥3 months fee',
        'Repeated breach triggers contract review or right to terminate',
        'Credits triggered automatically, not on request',
      ],
    },
    // --- Transition Risk ---
    {
      id: 'vep-c005',
      dimension: 'transition_risk',
      criterion: 'Vendor has a documented transition methodology with phase gates and stabilization period',
      weight: 4,
      evidenceRequired: [
        'Transition plan template from comparable engagement',
        'Phase gate definitions and sign-off criteria',
        'Stabilization period duration and exit criteria',
      ],
      weakSignals: [
        'Transition described as a single "go-live" milestone',
        'No stabilization period defined',
        'Knowledge transfer is not a separate phase gate',
      ],
      strongSignals: [
        'Transition has at least 4 signed phase gates',
        'Stabilization period ≥60 days with incident-free threshold',
        'Knowledge transfer completeness is defined and measurable',
      ],
    },
    // --- Operational Model ---
    {
      id: 'vep-c006',
      dimension: 'operational_model',
      criterion: 'Vendor demonstrates a mature ITSM process including incident management, change management, and problem management',
      weight: 4,
      evidenceRequired: [
        'ITSM tooling (ServiceNow, Jira SM, etc.)',
        'Incident management process document',
        'Monthly service report template from comparable engagement',
      ],
      weakSignals: [
        'ITSM process described verbally without documented procedures',
        'No sample service report provided',
        'Change management process not defined (all changes go through ad-hoc approval)',
      ],
      strongSignals: [
        'Documented ITSM processes with named tool',
        'Sample service report shows metrics aligned to proposed SLAs',
        'Change management follows ITIL or equivalent with CAB approval for production changes',
      ],
    },
    // --- Financial Stability ---
    {
      id: 'vep-c007',
      dimension: 'financial_stability',
      criterion: 'Vendor is financially stable with no material risk of business continuity failure during the contract term',
      weight: 3,
      evidenceRequired: [
        'Audited financial statements (last 2 years)',
        'D&B credit rating or equivalent',
        'Key man insurance or business continuity plan',
      ],
      weakSignals: [
        'Vendor declines to provide financials',
        'Revenue concentration risk (single client >40% of revenue)',
        'Recent ownership change with unclear management continuity',
      ],
      strongSignals: [
        'Strong balance sheet with positive cash position',
        'Revenue diversified across multiple clients and sectors',
        'Parent company guarantee available for large contracts',
      ],
    },
    // --- Reference Quality ---
    {
      id: 'vep-c008',
      dimension: 'reference_quality',
      criterion: 'References are reachable, comparable in scope, and confirm the vendor delivered as proposed',
      weight: 4,
      evidenceRequired: [
        'Three named references with direct contact (email/phone)',
        'Reference scope similarity to proposed engagement',
        'Confirmation that references are current clients (not concluded)',
      ],
      weakSignals: [
        'References not reachable or unavailable to speak',
        'References are from significantly smaller or simpler engagements',
        'References are employees of related entities or affiliates',
      ],
      strongSignals: [
        'References speak to specific performance metrics, not just general satisfaction',
        'At least one reference is on the same technology stack and comparable scope',
        'Vendor proactively connects references without prompt',
      ],
    },
    // --- Contractual Protection ---
    {
      id: 'vep-c009',
      dimension: 'contractual_protection',
      criterion: 'Contract includes appropriate IP ownership, data protection, liability, and termination clauses',
      weight: 4,
      evidenceRequired: [
        'IP ownership clause (client owns all deliverables and work product)',
        'Data protection schedule covering GDPR and data residency',
        'Liability cap negotiated to at least 12 months contract value',
        'Termination for convenience clause with notice period',
      ],
      weakSignals: [
        'IP ownership is ambiguous or shared',
        'Data protection schedule not provided',
        'Liability capped below 3 months contract value',
        'No termination for convenience — termination only for cause',
      ],
      strongSignals: [
        'Client owns all IP and work product outright',
        'Data protection schedule specifically addresses AI data usage rights',
        'Liability cap ≥12 months ACV',
        'Termination for convenience with ≤90 days notice',
      ],
    },
    // --- Strategic Alignment ---
    {
      id: 'vep-c010',
      dimension: 'strategic_alignment',
      criterion: 'Vendor roadmap and investment direction aligns with the client\'s technology and AI strategy over the contract term',
      weight: 3,
      evidenceRequired: [
        'Vendor product or capability roadmap (12-24 months)',
        'AI investment strategy and relevant partnerships',
        'Executive sponsor commitment to the engagement',
      ],
      weakSignals: [
        'Vendor roadmap not available or confidential',
        'Vendor is in a sunset or maintenance mode for the proposed platform',
        'No executive sponsor named above account manager level',
      ],
      strongSignals: [
        'Roadmap shows active investment in capabilities relevant to client AI strategy',
        'Vendor has named partnership with relevant platform vendors',
        'C-level executive sponsor named for the engagement',
      ],
    },
  ],
  commercialRisks: [
    {
      id: 'vep-cr001',
      riskName: 'BAFO Deadline Compression',
      description:
        'BAFO deadline is set without sufficient time for vendors to revise pricing and terms. Vendors submit rushed BAFOs that do not reflect genuine best-and-final positions, leading to post-BAFO renegotiation.',
      triggerConditions: [
        'BAFO deadline is fewer than 10 business days from BAFO invitation',
        'BAFO requirements include significant changes from original RFP scope',
      ],
      mitigationRequired:
        'Allow minimum 10 business days for BAFO response. Send BAFO invitation with explicit list of items to address.',
      agentGuidance:
        'Steward: flag BAFO timeline risk if deadline is <10 business days. Surface to programme sponsor.',
    },
    {
      id: 'vep-cr002',
      riskName: 'Pricing Comparability Gap',
      description:
        'Vendors have interpreted the RFP scope differently, making their pricing proposals incomparable. One vendor includes items that another has excluded, making a simple price comparison misleading.',
      triggerConditions: [
        'RFP scope defined qualitatively without a mandatory item list',
        'Proposals show significant price variance (>30%) without explanation',
      ],
      mitigationRequired:
        'Issue a mandatory scope clarification memo before BAFO. Require vendors to complete a standard pricing template with explicit item-level pricing.',
      agentGuidance:
        'Nexus: flag pricing comparability risk if vendor proposals show unexplained price variance >30%.',
    },
    {
      id: 'vep-cr003',
      riskName: 'Reference Reachability Failure',
      description:
        'Vendor provides references that cannot be reached or decline to speak. The evaluation proceeds without independent reference validation.',
      triggerConditions: [
        'References not contacted within 5 business days of shortlist',
        'Reference declines to speak or provides only written response',
      ],
      mitigationRequired:
        'Require vendor to confirm reference availability before BAFO invitation. Exclude vendor from BAFO if references are not reachable.',
      agentGuidance:
        'Steward: block BAFO invitation if references have not been validated. Reference validation is a gate condition.',
    },
  ],
  bafoInviteThreshold: 55, // normalized score (0-100) minimum
  autoExclusionCriteria: [
    'Vendor cannot provide current SOC2 Type II or ISO 27001 certification',
    'References are not reachable within 10 business days of shortlist',
    'Vendor has been subject to a material data breach in the past 24 months without adequate disclosure',
    'Pricing is incomplete with items marked as TBD at BAFO stage',
    'Vendor is under active litigation with a current or recent client on a comparable engagement',
  ],
  sentinelSignals: ['evidence_chain_gap', 'gate_governance_gap'],
  createdFrom: 'pat3_vendor_evaluation',
};

// ---------------------------------------------------------------------------
// Accessor and scoring functions
// ---------------------------------------------------------------------------

export function buildVendorScorecard(
  vendorName: string,
  ratings: Partial<Record<string, VendorScoreRating>>,
): VendorScorecardSummary {
  const rows: VendorScorecardRow[] = VENDOR_EVALUATION_PATTERN.criteria.map((criterion) => ({
    criterionId: criterion.id,
    dimension: criterion.dimension,
    criterion: criterion.criterion,
    weight: criterion.weight,
    rating: ratings[criterion.id] ?? 'not_assessed',
    evidenceNotes: '',
  }));

  const totalWeightedScore = rows.reduce(
    (sum, row) => sum + row.weight * RATING_SCORE[row.rating],
    0,
  );
  const maxPossibleScore = VENDOR_EVALUATION_PATTERN.criteria.reduce(
    (sum, c) => sum + c.weight * RATING_SCORE['leading'],
    0,
  );
  const normalizedScore = maxPossibleScore > 0
    ? Math.round((totalWeightedScore / maxPossibleScore) * 100)
    : 0;

  return {
    vendorName,
    totalWeightedScore,
    maxPossibleScore,
    normalizedScore,
    bafoEligible: normalizedScore >= VENDOR_EVALUATION_PATTERN.bafoInviteThreshold,
    exclusionReasons: [],
    rows,
    createdFrom: 'pat3_vendor_evaluation',
  };
}

export function getVendorEvaluationCriteriaByDimension(
  dimension: VendorEvaluationDimension,
): ReadonlyArray<VendorEvaluationCriterion> {
  return VENDOR_EVALUATION_PATTERN.criteria.filter((c) => c.dimension === dimension);
}

export const VENDOR_EVALUATION_DIMENSIONS: ReadonlyArray<VendorEvaluationDimension> =
  VENDOR_EVALUATION_PATTERN.dimensions;
