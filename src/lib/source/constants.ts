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
export const SOURCE_LEAD_AGENT = 'Sentinel';

export const SOURCE_ROUTE_LABELS: Record<SourceRouteKey, string> = {
  dashboard: 'Dashboard',
  events: 'Events',
  value: 'Value Ledger',
};

export const SOURCE_STAGE_ORDER: SourceStageKey[] = [
  'strategy',
  'scope',
  'rfp',
  'responses',
  'evaluation',
  'pricing',
  'bafo',
  'executive_decision',
  'selection',
  'transition',
  'value',
];

export const SOURCE_STAGE_LABELS: Record<SourceStageKey, string> = {
  strategy: 'Strategy',
  scope: 'Scope',
  rfp: 'RFP',
  responses: 'Responses',
  evaluation: 'Evaluation',
  pricing: 'Pricing',
  bafo: 'BAFO',
  executive_decision: 'Executive Decision',
  selection: 'Selection',
  transition: 'Transition',
  value: 'Value',
  intake: 'Strategy',
  sourcing_strategy: 'Strategy',
  rfp_rfi_package: 'RFP',
  vendor_responses: 'Responses',
  orals_bafo: 'BAFO',
  contract_mobilization: 'Transition',
  value_realization: 'Value',
};

export const SOURCE_LEGACY_STAGE_ALIASES: Partial<Record<SourceStageKey | string, SourceStageKey>> = {
  intake: 'strategy',
  sourcing_strategy: 'strategy',
  rfp_rfi_package: 'rfp',
  vendor_responses: 'responses',
  orals_bafo: 'bafo',
  contract_mobilization: 'transition',
  value_realization: 'value',
};

export function isSourceStageKey(value: unknown): value is SourceStageKey {
  return typeof value === 'string' && value in SOURCE_STAGE_LABELS;
}

export function isCanonicalSourceStageKey(value: unknown): value is SourceStageKey {
  return typeof value === 'string' && (SOURCE_STAGE_ORDER as readonly string[]).includes(value);
}

export function normalizeSourceStageKey(value: unknown): SourceStageKey | null {
  if (typeof value !== 'string') return null;
  if (isCanonicalSourceStageKey(value)) return value;
  return SOURCE_LEGACY_STAGE_ALIASES[value] ?? null;
}

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
  // SRC38 — Apex Retail AMS Outsourcing 2026 demo storyline event
  apexRetailAmsOutsourcing2026: 'apex-retail-ams-outsourcing-2026',
} as const;

export const SOURCE_GOLDEN_EVENT_VALUES_USD = {
  [SOURCE_GOLDEN_EVENT_IDS.dataAiModernization]: 18_500_000,
  [SOURCE_GOLDEN_EVENT_IDS.amsConsolidation]: 42_000_000,
  [SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild]: 2_800_000,
  [SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026]: 35_000_000,
} as const;

export const SOURCE_TOTAL_VALUE_AT_STAKE_USD = 98_300_000;

export const SOURCE_FOUNDATIONS: SourcePlatformFoundation[] = [
  {
    key: 'pattern_fabric',
    label: 'Pattern Fabric',
    summary: 'Tenant-scoped patterns, evidence, and applicability signals that ground sourcing decisions.',
  },
  {
    key: 'agent_fabric',
    label: 'Agent Fabric',
    summary: 'Sentinel-led workflow orchestration with specialist rails and cited, fail-honest responses.',
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
