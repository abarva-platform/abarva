// SRC32 — Tenant-Scoped Apex Retail AMS Scenario
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.
// tenantSlug: apex-retail | linkedProgramCode: APX-CDP-2026

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type DemoVendorPricingStatus = 'complete' | 'partial' | 'missing';
export type DemoRiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DemoReadinessStatus = 'ready' | 'partial' | 'not-ready';
export type DemoMissionPriority = 'high' | 'medium' | 'low';
export type DemoSignalSeverity = 'critical' | 'warning' | 'info';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface DemoVendorSummary {
  vendorId: string;
  vendorLabel: string;
  pricingStatus: DemoVendorPricingStatus;
  missingSections: string[];
  bafoOpportunities: string[];
  commercialAssumptions: string[];
  completenessState: string;
  pricingResponsePosture: string;
  assumptionClarity: string;
  transitionTransparency: string;
  productivityCommitmentPosture: string;
  caveat: string;
  deterministicSeed: true;       // always true — marks data as seed
}

export interface DemoRiskItem {
  riskId: string;
  category: string;
  label: string;
  severity: DemoRiskSeverity;
  detail: string;
}

export interface DemoMissionItem {
  missionId: string;
  agentOwner: string;            // "Nexus" | "Sentinel" | "Atlas" | "Steward"
  label: string;
  priority: DemoMissionPriority;
}

export interface DemoSignalItem {
  signalId: string;
  signalType: string;
  label: string;
  severity: DemoSignalSeverity;
  shortSummary: string;
}

export interface DemoStageGateSeed {
  gateKey: string;
  transition: string;
  state: 'ready' | 'blocked' | 'waiting' | 'needs_approval' | 'waiver_required' | 'deferred';
  blocker: string | null;
  requiredArtifacts: string[];
  requiredApprovals: string[];
  evidenceGap: string | null;
}

export interface DemoArtifactMetadataSeed {
  artifactKey: string;
  artifactName: string;
  status: 'not_started' | 'draft' | 'needs_inputs' | 'in_review' | 'changes_requested' | 'approved' | 'locked';
  ownerAgent: 'Nexus' | 'Sentinel' | 'Atlas' | 'Steward';
  version: string;
  evidenceState: 'missing' | 'partial' | 'seeded';
  approvalState: 'not_started' | 'in_review' | 'approved' | 'changes_requested';
}

export interface DemoReviewApprovalSeed {
  reviewName: string;
  ownerRole: string;
  state: 'pending' | 'in_review' | 'approved' | 'changes_requested';
  note: string;
}

export interface DemoVendorResponseStateSeed {
  vendorLabel: string;
  completeness: 'complete' | 'partial' | 'incomplete' | 'not_comparable';
  pricingTemplateState: 'complete' | 'partial' | 'missing';
  transitionPlanState: 'complete' | 'partial' | 'missing';
  evidenceState: 'strong' | 'mixed' | 'weak';
}

export interface DemoPricingAssumptionSeed {
  assumption: string;
  state: 'validated' | 'needs_clarification' | 'unverified';
  note: string;
}

export interface DemoBafoAskSeed {
  vendorLabel: string;
  ask: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DemoTransitionReadinessSeed {
  checkpoint: string;
  state: 'not_started' | 'partial' | 'ready';
  note: string;
}

export interface DemoValueRealizationSeed {
  placeholder: string;
  state: 'not_started' | 'partial';
  note: string;
}

export interface SourceCommercialDemoScenario {
  scenarioId: string;
  tenantSlug: string;
  linkedProgramCode: string;
  eventName: string;
  sourceEventId: string;
  clientContext: string;
  sourcingScope: string;
  vendors: DemoVendorSummary[];  // 4 vendors
  risks: DemoRiskItem[];         // 5 risks
  readinessState: DemoReadinessStatus;
  readinessDetail: string;
  missions: DemoMissionItem[];   // 5 missions
  signals: DemoSignalItem[];     // 4 signals
  bafoOpportunities: string[];   // 3 top-level BAFO items
  sourcingStrategy: {
    objective: string;
    strategyPosture: string;
    primaryConstraint: string;
    deterministicSeed: true;
  };
  stageGates: DemoStageGateSeed[];
  artifactMetadata: DemoArtifactMetadataSeed[];
  reviewApprovalStates: DemoReviewApprovalSeed[];
  vendorResponseStates: DemoVendorResponseStateSeed[];
  pricingAssumptions: DemoPricingAssumptionSeed[];
  bafoAsks: DemoBafoAskSeed[];
  executiveDecisionPosture: {
    posture: 'proceed_to_bafo' | 'defer_pending_clarifications' | 'blocked_missing_pricing';
    reason: string;
    steeringQuestion: string;
  };
  transitionReadinessPlaceholders: DemoTransitionReadinessSeed[];
  valueRealizationPlaceholders: DemoValueRealizationSeed[];
  caveats: string[];             // 3 caveats
  deterministicSeed: true;       // always true — marks scenario as seed
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSourceCommercialDemoScenario(): SourceCommercialDemoScenario {
  const vendors: DemoVendorSummary[] = [
    {
      vendorId: 'vendor-northstar',
      vendorLabel: 'Northstar Managed Services',
      pricingStatus: 'complete',
      missingSections: [],
      bafoOpportunities: ['Volume commitment discount', 'SLA rebate structure'],
      commercialAssumptions: ['FTE cost normalised to onshore equivalent'],
      completenessState: 'full',
      pricingResponsePosture: 'comprehensive',
      assumptionClarity: 'high',
      transitionTransparency: 'full',
      productivityCommitmentPosture: 'committed',
      caveat: 'Deterministic seed data. Not an actual vendor response.',
      deterministicSeed: true,
    },
    {
      vendorId: 'vendor-bluepeak',
      vendorLabel: 'BluePeak Digital Operations',
      pricingStatus: 'partial',
      missingSections: ['L3 support rate card', 'Knowledge transfer costs'],
      bafoOpportunities: ['Offshore ratio optimisation'],
      commercialAssumptions: ['Offshore rate applied uniformly'],
      completenessState: 'partial',
      pricingResponsePosture: 'partial',
      assumptionClarity: 'medium',
      transitionTransparency: 'partial',
      productivityCommitmentPosture: 'conditional',
      caveat: 'Deterministic seed data. Not an actual vendor response.',
      deterministicSeed: true,
    },
    {
      vendorId: 'vendor-horizon',
      vendorLabel: 'Horizon Application Services',
      pricingStatus: 'partial',
      missingSections: ['Transition management costs'],
      bafoOpportunities: ['Transition milestone payment deferral'],
      commercialAssumptions: ['Transition timeline assumes parallel run'],
      completenessState: 'partial',
      pricingResponsePosture: 'partial',
      assumptionClarity: 'medium',
      transitionTransparency: 'opaque',
      productivityCommitmentPosture: 'conditional',
      caveat: 'Deterministic seed data. Not an actual vendor response.',
      deterministicSeed: true,
    },
    {
      vendorId: 'vendor-meridian-systems',
      vendorLabel: 'Meridian Systems Partners',
      pricingStatus: 'missing',
      missingSections: [
        'Full rate card',
        'SLA commercial framework',
        'Rebate structure',
      ],
      bafoOpportunities: [],
      commercialAssumptions: [],
      completenessState: 'missing',
      pricingResponsePosture: 'non-responsive',
      assumptionClarity: 'low',
      transitionTransparency: 'absent',
      productivityCommitmentPosture: 'uncommitted',
      caveat: 'Deterministic seed data. Not an actual vendor response.',
      deterministicSeed: true,
    },
  ];

  const risks: DemoRiskItem[] = [
    {
      riskId: 'risk-001',
      category: 'pricing',
      label: 'Incomplete rate card coverage',
      severity: 'high',
      detail:
        'Meridian Systems Partners has not submitted a complete rate card. BluePeak Digital Operations is missing L3 support rates.',
    },
    {
      riskId: 'risk-002',
      category: 'commercial',
      label: 'Assumption divergence across vendors',
      severity: 'medium',
      detail:
        'Vendors have applied different offshore ratios making direct comparison difficult.',
    },
    {
      riskId: 'risk-003',
      category: 'transition',
      label: 'Transition cost opacity',
      severity: 'high',
      detail:
        'Horizon Application Services transition management costs not included in submission.',
    },
    {
      riskId: 'risk-004',
      category: 'governance',
      label: 'SLA rebate structure absent for two vendors',
      severity: 'medium',
      detail:
        'Without rebate structures it is not possible to assess commercial risk protection.',
    },
    {
      riskId: 'risk-005',
      category: 'evidence',
      label: 'Knowledge transfer cost unknown for BluePeak Digital Operations',
      severity: 'low',
      detail:
        'Knowledge transfer costs not submitted; likely to surface in BAFO.',
    },
  ];

  const missions: DemoMissionItem[] = [
    {
      missionId: 'mission-001',
      agentOwner: 'Nexus',
      label: 'Request complete rate card from Meridian Systems Partners',
      priority: 'high',
    },
    {
      missionId: 'mission-002',
      agentOwner: 'Sentinel',
      label: 'Validate L3 support rate card from BluePeak Digital Operations',
      priority: 'high',
    },
    {
      missionId: 'mission-003',
      agentOwner: 'Atlas',
      label: 'Normalise offshore cost assumptions across all vendors',
      priority: 'medium',
    },
    {
      missionId: 'mission-004',
      agentOwner: 'Steward',
      label: 'Confirm SLA rebate framework with Northstar Managed Services and Horizon Application Services',
      priority: 'medium',
    },
    {
      missionId: 'mission-005',
      agentOwner: 'Nexus',
      label: 'Prepare executive decision brief pending Meridian Systems Partners clarification',
      priority: 'low',
    },
  ];

  const signals: DemoSignalItem[] = [
    {
      signalId: 'signal-001',
      signalType: 'pricing_gap',
      label: 'Rate card gap — Meridian Systems Partners',
      severity: 'critical',
      shortSummary:
        'Meridian Systems Partners rate card missing. Cannot proceed to normalised comparison without complete submission.',
    },
    {
      signalId: 'signal-002',
      signalType: 'assumption_divergence',
      label: 'Offshore ratio divergence',
      severity: 'warning',
      shortSummary:
        'Offshore ratios vary materially across vendors. Normalisation required before BAFO.',
    },
    {
      signalId: 'signal-003',
      signalType: 'bafo_readiness',
      label: 'BAFO scope partially confirmed',
      severity: 'warning',
      shortSummary:
        'BAFO strategy confirmed for Northstar Managed Services and BluePeak Digital Operations. Horizon Application Services and Meridian Systems Partners pending.',
    },
    {
      signalId: 'signal-004',
      signalType: 'governance_gap',
      label: 'Rebate framework absent',
      severity: 'info',
      shortSummary:
        'Two vendors have not provided SLA rebate structures. Governance risk if not resolved before award.',
    },
  ];

  const bafoOpportunities: string[] = [
    'Volume commitment step-down at 24 months',
    'Offshore ratio optimisation for steady-state',
    'SLA rebate commercial protection',
  ];

  const stageGates: DemoStageGateSeed[] = [
    {
      gateKey: 'strategy_to_scope',
      transition: 'Strategy -> Scope',
      state: 'ready',
      blocker: null,
      requiredArtifacts: ['Sourcing Strategy Memo'],
      requiredApprovals: ['Nexus lead review'],
      evidenceGap: null,
    },
    {
      gateKey: 'scope_to_rfp',
      transition: 'Scope -> RFP',
      state: 'needs_approval',
      blocker: 'Retained role split still needs sponsor sign-off.',
      requiredArtifacts: ['Scope Document', 'Minimum Data Request'],
      requiredApprovals: ['Business sponsor'],
      evidenceGap: 'Retained organization evidence remains partial.',
    },
    {
      gateKey: 'rfp_to_responses',
      transition: 'RFP -> Vendor Responses',
      state: 'waiting',
      blocker: 'Pricing template clarifications are open for two vendors.',
      requiredArtifacts: ['RFP Package', 'Pricing Template'],
      requiredApprovals: ['Procurement'],
      evidenceGap: 'SLA baseline evidence is still mixed.',
    },
    {
      gateKey: 'evaluation_to_bafo',
      transition: 'Evaluation -> BAFO',
      state: 'blocked',
      blocker: 'Comparable pricing is unavailable for one vendor.',
      requiredArtifacts: ['Vendor Response Checklist', 'Commercial Risk Log'],
      requiredApprovals: ['Steering prep review'],
      evidenceGap: 'Transition costs are incomplete for at least one response.',
    },
    {
      gateKey: 'bafo_to_selection',
      transition: 'BAFO -> Selection',
      state: 'deferred',
      blocker: 'Awaiting BAFO clarification pack closure.',
      requiredArtifacts: ['BAFO Question Pack', 'Executive Decision Brief'],
      requiredApprovals: ['Steward gate review'],
      evidenceGap: 'Automation commitments are not contract-backed yet.',
    },
  ];

  const artifactMetadata: DemoArtifactMetadataSeed[] = [
    {
      artifactKey: 'sourcing_strategy_memo',
      artifactName: 'Sourcing Strategy Memo',
      status: 'draft',
      ownerAgent: 'Nexus',
      version: 'v0.3',
      evidenceState: 'partial',
      approvalState: 'in_review',
    },
    {
      artifactKey: 'minimum_data_request',
      artifactName: 'Minimum Data Request',
      status: 'locked',
      ownerAgent: 'Steward',
      version: 'v1.0',
      evidenceState: 'seeded',
      approvalState: 'approved',
    },
    {
      artifactKey: 'scope_document',
      artifactName: 'Scope Document',
      status: 'in_review',
      ownerAgent: 'Nexus',
      version: 'v0.7',
      evidenceState: 'partial',
      approvalState: 'changes_requested',
    },
    {
      artifactKey: 'rfp_package',
      artifactName: 'RFP Package',
      status: 'needs_inputs',
      ownerAgent: 'Steward',
      version: 'v0.2',
      evidenceState: 'missing',
      approvalState: 'not_started',
    },
    {
      artifactKey: 'pricing_template',
      artifactName: 'Pricing Template',
      status: 'draft',
      ownerAgent: 'Sentinel',
      version: 'v0.4',
      evidenceState: 'partial',
      approvalState: 'in_review',
    },
    {
      artifactKey: 'vendor_response_checklist',
      artifactName: 'Vendor Response Checklist',
      status: 'draft',
      ownerAgent: 'Sentinel',
      version: 'v0.5',
      evidenceState: 'partial',
      approvalState: 'in_review',
    },
    {
      artifactKey: 'bafo_question_pack',
      artifactName: 'BAFO Question Pack',
      status: 'draft',
      ownerAgent: 'Nexus',
      version: 'v0.3',
      evidenceState: 'partial',
      approvalState: 'not_started',
    },
    {
      artifactKey: 'executive_decision_brief',
      artifactName: 'Executive Decision Brief',
      status: 'needs_inputs',
      ownerAgent: 'Atlas',
      version: 'v0.1',
      evidenceState: 'missing',
      approvalState: 'not_started',
    },
    {
      artifactKey: 'transition_readiness_checklist',
      artifactName: 'Transition Readiness Checklist',
      status: 'not_started',
      ownerAgent: 'Steward',
      version: 'v0.0',
      evidenceState: 'missing',
      approvalState: 'not_started',
    },
    {
      artifactKey: 'value_ledger_assumptions',
      artifactName: 'Value Ledger Assumptions',
      status: 'draft',
      ownerAgent: 'Atlas',
      version: 'v0.2',
      evidenceState: 'partial',
      approvalState: 'in_review',
    },
  ];

  const reviewApprovalStates: DemoReviewApprovalSeed[] = [
    {
      reviewName: 'Scope package review',
      ownerRole: 'Business Sponsor',
      state: 'changes_requested',
      note: 'Retained role split and transition ownership need tighter wording.',
    },
    {
      reviewName: 'RFP readiness review',
      ownerRole: 'Procurement Lead',
      state: 'in_review',
      note: 'Pricing template rows are being normalized before release.',
    },
    {
      reviewName: 'Executive steering pre-read',
      ownerRole: 'Steering Committee',
      state: 'pending',
      note: 'Will start after BAFO clarifications close.',
    },
  ];

  const vendorResponseStates: DemoVendorResponseStateSeed[] = vendors.map((vendor) => ({
    vendorLabel: vendor.vendorLabel,
    completeness:
      vendor.pricingStatus === 'complete'
        ? 'complete'
        : vendor.pricingStatus === 'partial'
          ? 'partial'
          : 'not_comparable',
    pricingTemplateState: vendor.pricingStatus,
    transitionPlanState:
      vendor.transitionTransparency === 'full'
        ? 'complete'
        : vendor.transitionTransparency === 'partial' || vendor.transitionTransparency === 'opaque'
          ? 'partial'
          : 'missing',
    evidenceState:
      vendor.productivityCommitmentPosture === 'committed'
        ? 'strong'
        : vendor.productivityCommitmentPosture === 'conditional'
          ? 'mixed'
          : 'weak',
  }));

  const pricingAssumptions: DemoPricingAssumptionSeed[] = [
    {
      assumption: 'Offshore mix held at 62 percent for steady-state scope',
      state: 'needs_clarification',
      note: 'Two vendors used lower offshore share in baseline calculations.',
    },
    {
      assumption: 'Transition management included in year-1 pricing',
      state: 'unverified',
      note: 'One vendor excluded transition PM effort from base scope.',
    },
    {
      assumption: 'Automation productivity gain is contract-backed',
      state: 'needs_clarification',
      note: 'Claims are present but commitment language is still conditional.',
    },
  ];

  const bafoAsks: DemoBafoAskSeed[] = [
    {
      vendorLabel: 'Northstar Managed Services',
      ask: 'Commit to explicit SLA rebate thresholds for severity-one incidents.',
      rationale: 'Current rebate language is directional and weak on enforceability.',
      priority: 'high',
    },
    {
      vendorLabel: 'BluePeak Digital Operations',
      ask: 'Submit missing L3 support rate card and knowledge-transfer costs.',
      rationale: 'Comparability and transition risk remain blocked without these rows.',
      priority: 'high',
    },
    {
      vendorLabel: 'Horizon Application Services',
      ask: 'Provide transition management and governance effort detail.',
      rationale: 'Transition cost opacity currently suppresses confidence.',
      priority: 'medium',
    },
    {
      vendorLabel: 'Meridian Systems Partners',
      ask: 'Submit complete pricing template with contractual assumptions and exclusions.',
      rationale: 'Response is currently not comparable and blocks selection posture.',
      priority: 'high',
    },
  ];

  const transitionReadinessPlaceholders: DemoTransitionReadinessSeed[] = [
    {
      checkpoint: 'Runbook ownership split',
      state: 'partial',
      note: 'Draft owner matrix exists; business sign-off pending.',
    },
    {
      checkpoint: 'Knowledge transfer wave plan',
      state: 'not_started',
      note: 'Awaiting final vendor transition commitments.',
    },
    {
      checkpoint: 'Cutover risk rehearsal plan',
      state: 'not_started',
      note: 'Will be drafted after BAFO clarifications are closed.',
    },
  ];

  const valueRealizationPlaceholders: DemoValueRealizationSeed[] = [
    {
      placeholder: 'Year-1 run-rate reduction tracker',
      state: 'partial',
      note: 'Baseline defined, evidence links still seed-only.',
    },
    {
      placeholder: 'Productivity uplift checkpoint',
      state: 'not_started',
      note: 'Depends on contract-backed automation commitments.',
    },
    {
      placeholder: 'Transition stabilization KPI pack',
      state: 'not_started',
      note: 'Will open after partner mobilization starts.',
    },
  ];

  const caveats: string[] = [
    'All pricing data in this scenario is deterministic seed data. Values are representative and do not reflect real market rates or vendor proposals.',
    'Vendor labels are representative names for demonstration purposes. No real vendor proprietary information is used.',
    'This scenario is for demonstration purposes only. Commercial decisions must be based on actual vendor submissions and independent legal review.',
  ];

  return {
    scenarioId: 'apex-retail-ams-outsourcing-2026',
    tenantSlug: 'apex-retail',
    linkedProgramCode: 'APX-CDP-2026',
    eventName: 'Application Management Services — Vendor Consolidation 2026',
    sourceEventId: 'apex-retail-ams-outsourcing-2026',
    clientContext:
      'Apex Retail is consolidating three incumbent AMS providers into a preferred-supplier structure. Engagement scope includes application support, incident management, and platform operations across 40+ retail applications under the APX-CDP-2026 program.',
    sourcingScope:
      'Scope: Application Management Services (AMS), L1/L2/L3 support, incident SLAs, platform operations, knowledge transfer. 3-year initial term.',
    vendors,
    risks,
    readinessState: 'partial',
    readinessDetail:
      'Pricing normalisation incomplete due to missing rate cards. Risk assessment partially complete. BAFO strategy available for Northstar Managed Services and BluePeak Digital Operations only. Executive decision pending clarification from Meridian Systems Partners.',
    missions,
    signals,
    bafoOpportunities,
    sourcingStrategy: {
      objective: 'Consolidate AMS operations under a contractable, evidence-backed sourcing model.',
      strategyPosture: 'Single-prime with retained governance guardrails.',
      primaryConstraint: 'Baseline and transition assumptions are still partially evidenced.',
      deterministicSeed: true,
    },
    stageGates,
    artifactMetadata,
    reviewApprovalStates,
    vendorResponseStates,
    pricingAssumptions,
    bafoAsks,
    executiveDecisionPosture: {
      posture: 'proceed_to_bafo',
      reason: 'Vendor comparability and evidence confidence are not yet strong enough for selection review.',
      steeringQuestion: 'Can the committee approve BAFO clarification scope and timeline this week?',
    },
    transitionReadinessPlaceholders,
    valueRealizationPlaceholders,
    caveats,
    deterministicSeed: true,
    generatedAt: '2026-04-26',
  };
}
