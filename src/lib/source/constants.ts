import type {
  ScorecardLifecycleState,
  SourceArtifactStatus,
  SourceArtifactTier,
  SourceLifecycleStatus,
  SourcePlatformFoundation,
  SourceRouteKey,
  SourceStageKey,
  SourceStageStatus,
} from './types';

export const SOURCE_PRODUCT_NAME = 'AbarVa Source';
export const SOURCE_LEAD_AGENT = 'Nexus';

export const SOURCE_ROUTE_LABELS: Record<SourceRouteKey, string> = {
  dashboard: 'Dashboard',
  events: 'Events',
  value: 'Value Ledger',
};

export const SOURCE_STAGE_ORDER: SourceStageKey[] = [
  'intake',
  'scope',
  'sourcing_strategy',
  'rfp_rfi_package',
  'vendor_responses',
  'evaluation',
  'orals_bafo',
  'selection',
  'contract_mobilization',
  'value_realization',
];

export const SOURCE_STAGE_LABELS: Record<SourceStageKey, string> = {
  intake: 'Intake',
  scope: 'Scope',
  sourcing_strategy: 'Sourcing Strategy',
  rfp_rfi_package: 'RFP/RFI Package',
  vendor_responses: 'Vendor Responses',
  evaluation: 'Evaluation',
  orals_bafo: 'Orals/BAFO',
  selection: 'Selection',
  contract_mobilization: 'Contract/Mobilization',
  value_realization: 'Value Realization',
};

export const SOURCE_LIFECYCLE_STATUS_LABELS: Record<SourceLifecycleStatus, string> = {
  active: 'Active',
  waiting_on_client: 'Waiting on Client',
  waiting_on_vendor: 'Waiting on Vendor',
  waiting_on_procurement: 'Waiting on Procurement',
  waiting_on_executive_decision: 'Waiting on Executive Decision',
  paused: 'Paused',
  at_risk: 'At Risk',
  completed: 'Completed',
  archived: 'Archived',
};

export const SOURCE_WAITING_LIFECYCLE_STATUSES: SourceLifecycleStatus[] = [
  'waiting_on_client',
  'waiting_on_vendor',
  'waiting_on_procurement',
  'waiting_on_executive_decision',
];

export const SOURCE_STAGE_STATE_LABELS: Record<SourceStageStatus, string> = {
  not_started: 'Not Started',
  active: 'Active',
  complete: 'Complete',
  blocked: 'Blocked',
  needs_approval: 'Needs Approval',
  reopened: 'Reopened',
};

export const SOURCE_ARTIFACT_STATUS_LABELS: Record<SourceArtifactStatus, string> = {
  not_started: 'Not Started',
  draft: 'Draft',
  needs_inputs: 'Needs Inputs',
  needs_review: 'Needs Review',
  approved: 'Approved',
  locked: 'Locked',
  superseded: 'Superseded',
  archived: 'Archived',
} as const;

export const SOURCE_ARTIFACT_TIER_LABELS: Record<SourceArtifactTier, string> = {
  rich: 'Rich',
  outline: 'Outline',
  stub: 'Stub',
};

export const SOURCE_SCORECARD_LIFECYCLE_LABELS: Record<ScorecardLifecycleState, string> = {
  default_generated: 'Default Generated',
  client_edited: 'Client Edited',
  rationale_added: 'Rationale Added',
  reviewed: 'Reviewed',
  approved: 'Approved',
  locked: 'Locked',
  used_for_vendor_evaluation: 'Used for Vendor Evaluation',
};

export const SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS = {
  dataAiModernization: 'data-ai-modernization-sourcing',
  amsManagedServices: 'ams-managed-services-sourcing',
  digitalProductBuild: 'digital-product-build-vendor-selection',
} as const;

export const SOURCE_GOLDEN_EVENT_IDS = {
  dataAiModernization: 'evt-source-data-ai-si-selection',
  amsConsolidation: 'evt-source-ams-consolidation-assessment',
  digitalAppBuild: 'evt-source-digital-app-build-partner-selection',
} as const;

export const SOURCE_GOLDEN_EVENT_VALUES_USD = {
  [SOURCE_GOLDEN_EVENT_IDS.dataAiModernization]: 18_500_000,
  [SOURCE_GOLDEN_EVENT_IDS.amsConsolidation]: 42_000_000,
  [SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild]: 2_800_000,
} as const;

export const SOURCE_TOTAL_VALUE_AT_STAKE_USD = 63_300_000;

export const SOURCE_FOUNDATIONS: SourcePlatformFoundation[] = [
  {
    key: 'pattern_fabric',
    label: 'Pattern Fabric',
    summary: 'Tenant-scoped patterns, evidence, and applicability signals that ground sourcing decisions.',
  },
  {
    key: 'agent_fabric',
    label: 'Agent Fabric',
    summary: 'Nexus-led workflow orchestration with specialist rails and cited, fail-honest responses.',
  },
  {
    key: 'artifact_studio',
    label: 'Artifact Studio',
    summary: 'Structured scorecards, decision packets, and approval-grade artifacts generated from the event spine.',
  },
  {
    key: 'control_tower',
    label: 'Control Tower',
    summary: 'Portfolio pressure, adoption, risk, cost, and contradiction context available to every event.',
  },
  {
    key: 'value_ledger',
    label: 'Value Ledger',
    summary: 'Projected and realized value tracked as first-class records, not chat-only narrative.',
  },
];

export const SOURCE_REUSE_MAP = {
  shell: [
    'PageShell.tsx',
    'AppChrome.tsx',
    'DrawerProvider.tsx',
    'AttentionProvider.tsx',
  ],
  agentRails: [
    'NexusProgramRail.tsx',
    'AtlasRail.tsx',
    'NexusPanel.tsx',
  ],
  workspace: [
    'ModuleWorkspace.tsx',
    'EngagementConsole.tsx',
  ],
  evidence: [
    'EvidenceChipList.tsx',
    'AgentCitation.tsx',
    'pattern-manifest.ts',
    'evidence-registry.ts',
  ],
  workflow: [
    'types.db.ts',
    'types.ui.ts',
    'governance.ts',
    'quality-gates.ts',
  ],
} as const;

export const SOURCE_AVOID_LIST = [
  'src/app/programs/*',
  'src/app/(maestro)/preview/*',
  'src/app/demo/*',
  'src/components/programs/ProgramSurface.tsx',
  'src/lib/programs/mock.ts',
] as const;
