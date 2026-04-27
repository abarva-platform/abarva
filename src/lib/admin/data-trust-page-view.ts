import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';

export interface TrustLadderRung {
  id: string;
  label: string;
  count: number;
  description: string;
}

// ---------------------------------------------------------------------------
// ADMIN14 — Data Trust depth additions
// ---------------------------------------------------------------------------

export type DataTrustTabKey =
  | 'trust_ladder'
  | 'loaded_files'
  | 'promotion_queue'
  | 'quality_scorecard'
  | 'audit_trail';

export type TrustRungKey =
  | 'loaded'
  | 'available'
  | 'usable'
  | 'agent_usable'
  | 'decision_grade';

export interface DataTrustTabMeta {
  key: DataTrustTabKey;
  label: string;
  description: string;
}

export interface DatasetSummary {
  id: string;
  name: string;
  rung: TrustRungKey;
  owner: string;
  lastUpdated: string; // ISO
  segment: string;
  evidenceUsable: boolean;
  approvalState: 'unapproved' | 'requested' | 'approved' | 'revoked';
}

export interface DatasetDetail extends DatasetSummary {
  provenance: ReadonlyArray<{ at: string; label: string }>;
  approvalOwner: string;
  notes: string;
}

export interface LoadedFileRow {
  id: string;
  name: string;
  segment: 'Business' | 'IT & Technology' | 'Third Party';
  category: string;
  status: 'approved' | 'missing' | 'processing';
  owner: string;
  lastUpdated: string;
}

export type PromotionStatus = 'pending' | 'approved' | 'rejected';

export interface PromotionRequestRow {
  id: string;
  document: string;
  engagement: string;
  org: string;
  category: string;
  requestedAt: string;
  status: PromotionStatus;
  note?: string;
}

export interface QualityPillarScore {
  pillar: 'data' | 'evidence' | 'intelligence' | 'knowledge';
  score: number;
}

export interface QualityScorecardRow {
  tenantKey: string;
  tenantLabel: string;
  pillars: ReadonlyArray<QualityPillarScore>;
  overall: number;
}

export interface AuditTrailEntry {
  id: string;
  at: string; // ISO
  actor: string;
  role: string;
  action: string;
  datasetId?: string;
  rung?: TrustRungKey;
}

export interface DataTrustActionRow {
  id: 'approve_dataset' | 'add_policy' | 'open_evidence_ledger' | 'export_trust_report';
  label: string;
  status: 'hard_gated' | 'safe';
  reason?: string;
  href?: string;
}

export interface TrustProgressionPoint {
  date: string; // ISO date (YYYY-MM-DD)
  loaded: number;
  available: number;
  usable: number;
  agent_usable: number;
  decision_grade: number;
}

export interface DataTrustPageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: ContextLiveStatus;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: EvidenceStrength;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  ladder: ReadonlyArray<TrustLadderRung>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
  // ADMIN14 depth fields
  tabs: ReadonlyArray<DataTrustTabMeta>;
  defaultTab: DataTrustTabKey;
  datasetsByRung: Readonly<Record<TrustRungKey, ReadonlyArray<DatasetSummary>>>;
  datasetDetailMap: Readonly<Record<string, DatasetDetail>>;
  loadedFiles: ReadonlyArray<LoadedFileRow>;
  promotionRequests: ReadonlyArray<PromotionRequestRow>;
  qualityScorecard: ReadonlyArray<QualityScorecardRow>;
  auditTrail: ReadonlyArray<AuditTrailEntry>;
  trustProgression: ReadonlyArray<TrustProgressionPoint>;
  actionStrip: ReadonlyArray<DataTrustActionRow>;
}

const TRUST_LADDER: ReadonlyArray<TrustLadderRung> = [
  { id: 'loaded', label: 'Loaded', count: 14, description: 'Documents/datasets present in the workspace' },
  { id: 'available', label: 'Available', count: 11, description: 'Parsed, indexed, browseable' },
  { id: 'usable', label: 'Usable evidence', count: 7, description: 'Cited in Steward editorial cards' },
  { id: 'agent_usable', label: 'Agent-usable', count: 4, description: 'Approved for agent context' },
  { id: 'decision_grade', label: 'Decision-grade', count: 2, description: 'Approved for decisions/gates' },
];

const TABS: ReadonlyArray<DataTrustTabMeta> = [
  {
    key: 'trust_ladder',
    label: 'Trust Ladder',
    description: '5-rung trust posture with per-rung dataset lists',
  },
  {
    key: 'loaded_files',
    label: 'Loaded Files',
    description: 'Source artifacts grouped by segment (legacy /platform/admin/data)',
  },
  {
    key: 'promotion_queue',
    label: 'Promotion Queue',
    description: 'Engagement → master promotion requests (legacy /platform/admin/data-governance)',
  },
  {
    key: 'quality_scorecard',
    label: 'Quality Scorecard',
    description: '4-tenant × 4-pillar confidence grid (legacy /platform/admin/quality)',
  },
  {
    key: 'audit_trail',
    label: 'Audit Trail',
    description: 'Last 20 dataset-trust events',
  },
];

const DATASETS_BY_RUNG: Readonly<Record<TrustRungKey, ReadonlyArray<DatasetSummary>>> = {
  loaded: [
    {
      id: 'apex_pos_raw',
      name: 'Apex POS · raw export 2026-Q1',
      rung: 'loaded',
      owner: 'Apex IT',
      lastUpdated: '2026-04-22T10:14:00.000Z',
      segment: 'Business',
      evidenceUsable: false,
      approvalState: 'unapproved',
    },
    {
      id: 'apex_store_assoc_raw',
      name: 'Apex store-associate roster · raw',
      rung: 'loaded',
      owner: 'Apex HR',
      lastUpdated: '2026-04-21T08:02:00.000Z',
      segment: 'Business',
      evidenceUsable: false,
      approvalState: 'unapproved',
    },
    {
      id: 'apex_demand_logs_raw',
      name: 'Apex demand-forecast model logs',
      rung: 'loaded',
      owner: 'Apex Data Eng',
      lastUpdated: '2026-04-20T16:33:00.000Z',
      segment: 'IT & Technology',
      evidenceUsable: false,
      approvalState: 'unapproved',
    },
  ],
  available: [
    {
      id: 'apex_pos_indexed',
      name: 'Apex POS · indexed 2026-Q1',
      rung: 'available',
      owner: 'AbarVa Stewards',
      lastUpdated: '2026-04-22T12:00:00.000Z',
      segment: 'Business',
      evidenceUsable: false,
      approvalState: 'requested',
    },
    {
      id: 'apex_vendor_inventory',
      name: 'Apex vendor inventory · parsed',
      rung: 'available',
      owner: 'AbarVa Stewards',
      lastUpdated: '2026-04-19T11:20:00.000Z',
      segment: 'Business',
      evidenceUsable: false,
      approvalState: 'requested',
    },
    {
      id: 'apex_outcome_baseline',
      name: 'Apex outcome baseline lock',
      rung: 'available',
      owner: 'AbarVa Stewards',
      lastUpdated: '2026-04-18T09:45:00.000Z',
      segment: 'Business',
      evidenceUsable: false,
      approvalState: 'requested',
    },
    {
      id: 'apex_tech_inventory',
      name: 'Apex technology inventory',
      rung: 'available',
      owner: 'Apex CIO',
      lastUpdated: '2026-04-17T15:10:00.000Z',
      segment: 'IT & Technology',
      evidenceUsable: false,
      approvalState: 'requested',
    },
  ],
  usable: [
    {
      id: 'apex_demand_forecast_eval',
      name: 'Apex demand-forecast evaluation pack',
      rung: 'usable',
      owner: 'AbarVa Stewards',
      lastUpdated: '2026-04-23T07:30:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'requested',
    },
    {
      id: 'apex_cdp_data_audit',
      name: 'Apex CDP data audit',
      rung: 'usable',
      owner: 'Apex Marketing',
      lastUpdated: '2026-04-22T18:11:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'requested',
    },
    {
      id: 'apex_contact_center_kpis',
      name: 'Apex contact-center KPI deck',
      rung: 'usable',
      owner: 'Apex Ops',
      lastUpdated: '2026-04-21T13:55:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'requested',
    },
  ],
  agent_usable: [
    {
      id: 'apex_master_program_brief',
      name: 'Apex master program brief',
      rung: 'agent_usable',
      owner: 'AbarVa Maestro',
      lastUpdated: '2026-04-24T10:01:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'approved',
    },
    {
      id: 'apex_steward_evidence_pack',
      name: 'Apex Steward evidence pack',
      rung: 'agent_usable',
      owner: 'AbarVa Stewards',
      lastUpdated: '2026-04-23T16:42:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'approved',
    },
    {
      id: 'apex_atlas_pressure_index',
      name: 'Apex Atlas pressure index',
      rung: 'agent_usable',
      owner: 'AbarVa Atlas',
      lastUpdated: '2026-04-22T19:18:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'approved',
    },
  ],
  decision_grade: [
    {
      id: 'apex_outcome_lock_v1',
      name: 'Apex outcome lock (v1, signed)',
      rung: 'decision_grade',
      owner: 'Apex CFO + AbarVa Steward',
      lastUpdated: '2026-04-25T09:00:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'approved',
    },
    {
      id: 'apex_program_gate_pack',
      name: 'Apex program-gate decision pack',
      rung: 'decision_grade',
      owner: 'Apex CIO + AbarVa Maestro',
      lastUpdated: '2026-04-24T14:20:00.000Z',
      segment: 'Business',
      evidenceUsable: true,
      approvalState: 'approved',
    },
  ],
};

function buildDatasetDetail(s: DatasetSummary): DatasetDetail {
  const provenance: Array<{ at: string; label: string }> = [
    { at: '2026-04-15T08:00:00.000Z', label: 'Ingested into workspace' },
    { at: '2026-04-17T11:00:00.000Z', label: 'Parsed + indexed by Steward' },
  ];
  if (s.evidenceUsable) {
    provenance.push({
      at: '2026-04-19T15:00:00.000Z',
      label: 'Cited in Steward editorial card',
    });
  }
  if (s.approvalState === 'approved') {
    provenance.push({
      at: s.lastUpdated,
      label: 'Approval recorded (deterministic stub)',
    });
  }

  return {
    ...s,
    provenance,
    approvalOwner:
      s.approvalState === 'approved'
        ? 'Sundaram (Maestro)'
        : s.approvalState === 'requested'
          ? 'Pending — Sundaram (Maestro)'
          : 'Not yet requested',
    notes:
      s.approvalState === 'approved'
        ? 'Approved for agent context and decision-grade use.'
        : 'Live approval requires the audit-event store landing in Wave 27.',
  };
}

const DATASET_DETAIL_MAP: Readonly<Record<string, DatasetDetail>> = Object.fromEntries(
  Object.values(DATASETS_BY_RUNG)
    .flat()
    .map((s) => [s.id, buildDatasetDetail(s)] as const),
);

const LOADED_FILES: ReadonlyArray<LoadedFileRow> = [
  {
    id: 'lf_apex_fin_fy25',
    name: 'Apex_Financial_Summary_FY25.xlsx',
    segment: 'Business',
    category: 'Financial',
    status: 'approved',
    owner: 'Apex CFO',
    lastUpdated: '2026-04-22T10:14:00.000Z',
  },
  {
    id: 'lf_apex_pos_logs',
    name: 'Apex_POS_Logs_Q1_2026.csv',
    segment: 'Business',
    category: 'Operations',
    status: 'approved',
    owner: 'Apex IT',
    lastUpdated: '2026-04-21T08:02:00.000Z',
  },
  {
    id: 'lf_apex_vendor_register',
    name: 'Apex_Vendor_Register_v3.pdf',
    segment: 'Business',
    category: 'Vendors',
    status: 'approved',
    owner: 'Apex Procurement',
    lastUpdated: '2026-04-19T11:20:00.000Z',
  },
  {
    id: 'lf_apex_tech_inventory',
    name: 'Apex_Technology_Inventory_2026.xlsx',
    segment: 'IT & Technology',
    category: 'Technology',
    status: 'approved',
    owner: 'Apex CIO',
    lastUpdated: '2026-04-17T15:10:00.000Z',
  },
  {
    id: 'lf_apex_cdp_audit',
    name: 'Apex_CDP_Data_Audit.pdf',
    segment: 'IT & Technology',
    category: 'Marketing',
    status: 'processing',
    owner: 'Apex Marketing',
    lastUpdated: '2026-04-22T18:11:00.000Z',
  },
  {
    id: 'lf_apex_contact_center',
    name: 'Apex_Contact_Center_KPI_Deck.pptx',
    segment: 'Business',
    category: 'Operations',
    status: 'approved',
    owner: 'Apex Ops',
    lastUpdated: '2026-04-21T13:55:00.000Z',
  },
  {
    id: 'lf_apex_store_assoc',
    name: 'Apex_Store_Associate_Roster.xlsx',
    segment: 'Business',
    category: 'Workforce',
    status: 'processing',
    owner: 'Apex HR',
    lastUpdated: '2026-04-21T08:02:00.000Z',
  },
  {
    id: 'lf_apex_demand_logs',
    name: 'Apex_Demand_Forecast_Model_Logs.json',
    segment: 'IT & Technology',
    category: 'AI / ML',
    status: 'approved',
    owner: 'Apex Data Eng',
    lastUpdated: '2026-04-20T16:33:00.000Z',
  },
  {
    id: 'lf_apex_outcome_baseline',
    name: 'Apex_Outcome_Baseline_Day0.xlsx',
    segment: 'Business',
    category: 'Outcomes',
    status: 'approved',
    owner: 'AbarVa Stewards',
    lastUpdated: '2026-04-18T09:45:00.000Z',
  },
  {
    id: 'lf_apex_3p_market_data',
    name: 'Apex_Third_Party_Market_Data.csv',
    segment: 'Third Party',
    category: 'Market intel',
    status: 'missing',
    owner: 'Apex Strategy',
    lastUpdated: '—',
  },
];

const PROMOTION_REQUESTS: ReadonlyArray<PromotionRequestRow> = [
  {
    id: 'promo_apex_demand_v2',
    document: 'Apex Demand-Forecast Roadmap v2',
    engagement: 'Apex Retail — Demand Intelligence',
    org: 'Apex Retail Group',
    category: 'Strategic Plans',
    requestedAt: '2026-04-22T11:00:00.000Z',
    status: 'pending',
    note: 'Maestro requested promotion to master after Apex CFO sign-off.',
  },
  {
    id: 'promo_apex_cdp_audit',
    document: 'Apex CDP Data Audit (final)',
    engagement: 'Apex Retail — CDP Migration',
    org: 'Apex Retail Group',
    category: 'Vendor Contracts',
    requestedAt: '2026-04-21T16:30:00.000Z',
    status: 'pending',
    note: 'Awaiting CIO confirmation before promotion.',
  },
  {
    id: 'promo_apex_baseline_lock',
    document: 'Apex Outcome Baseline Day-0 Lock',
    engagement: 'Apex Retail — Demand Intelligence',
    org: 'Apex Retail Group',
    category: 'Outcomes',
    requestedAt: '2026-04-18T09:45:00.000Z',
    status: 'approved',
  },
  {
    id: 'promo_apex_program_brief',
    document: 'Apex Master Program Brief',
    engagement: 'Apex Retail — Portfolio Coordination',
    org: 'Apex Retail Group',
    category: 'Strategic Plans',
    requestedAt: '2026-04-15T13:20:00.000Z',
    status: 'approved',
  },
  {
    id: 'promo_apex_internal_notes',
    document: 'Apex internal negotiation notes',
    engagement: 'Apex Retail — CDP Migration',
    org: 'Apex Retail Group',
    category: 'Strategic Plans',
    requestedAt: '2026-04-10T10:00:00.000Z',
    status: 'rejected',
    note: 'Engagement-only — keep out of master intelligence.',
  },
];

const QUALITY_SCORECARD: ReadonlyArray<QualityScorecardRow> = [
  {
    tenantKey: 'apexretail',
    tenantLabel: 'Apex Retail',
    pillars: [
      { pillar: 'data', score: 78 },
      { pillar: 'evidence', score: 71 },
      { pillar: 'intelligence', score: 64 },
      { pillar: 'knowledge', score: 59 },
    ],
    overall: 68,
  },
  {
    tenantKey: 'meridian',
    tenantLabel: 'Meridian Health',
    pillars: [
      { pillar: 'data', score: 82 },
      { pillar: 'evidence', score: 76 },
      { pillar: 'intelligence', score: 70 },
      { pillar: 'knowledge', score: 65 },
    ],
    overall: 73,
  },
  {
    tenantKey: 'firstcapital',
    tenantLabel: 'First Capital Bank',
    pillars: [
      { pillar: 'data', score: 74 },
      { pillar: 'evidence', score: 68 },
      { pillar: 'intelligence', score: 61 },
      { pillar: 'knowledge', score: 55 },
    ],
    overall: 64,
  },
  {
    tenantKey: 'abarva',
    tenantLabel: 'AbarVa internal',
    pillars: [
      { pillar: 'data', score: 88 },
      { pillar: 'evidence', score: 84 },
      { pillar: 'intelligence', score: 79 },
      { pillar: 'knowledge', score: 75 },
    ],
    overall: 82,
  },
];

const AUDIT_TRAIL: ReadonlyArray<AuditTrailEntry> = [
  { id: 'a1', at: '2026-04-25T09:00:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_decision_grade', datasetId: 'apex_outcome_lock_v1', rung: 'decision_grade' },
  { id: 'a2', at: '2026-04-24T14:20:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_decision_grade', datasetId: 'apex_program_gate_pack', rung: 'decision_grade' },
  { id: 'a3', at: '2026-04-24T10:01:00.000Z', actor: 'Steward', role: 'AGENT', action: 'promoted_to_agent_usable', datasetId: 'apex_master_program_brief', rung: 'agent_usable' },
  { id: 'a4', at: '2026-04-23T16:42:00.000Z', actor: 'Steward', role: 'AGENT', action: 'promoted_to_agent_usable', datasetId: 'apex_steward_evidence_pack', rung: 'agent_usable' },
  { id: 'a5', at: '2026-04-23T07:30:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_demand_forecast_eval', rung: 'usable' },
  { id: 'a6', at: '2026-04-22T19:18:00.000Z', actor: 'Atlas', role: 'AGENT', action: 'promoted_to_agent_usable', datasetId: 'apex_atlas_pressure_index', rung: 'agent_usable' },
  { id: 'a7', at: '2026-04-22T18:11:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_cdp_data_audit', rung: 'usable' },
  { id: 'a8', at: '2026-04-22T12:00:00.000Z', actor: 'Steward', role: 'AGENT', action: 'parsed_and_indexed', datasetId: 'apex_pos_indexed', rung: 'available' },
  { id: 'a9', at: '2026-04-22T11:00:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'promotion_requested', datasetId: 'apex_demand_forecast_eval' },
  { id: 'a10', at: '2026-04-22T10:14:00.000Z', actor: 'Apex IT', role: 'TENANT', action: 'ingested', datasetId: 'apex_pos_raw', rung: 'loaded' },
  { id: 'a11', at: '2026-04-21T16:30:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'promotion_requested', datasetId: 'apex_cdp_data_audit' },
  { id: 'a12', at: '2026-04-21T13:55:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_contact_center_kpis', rung: 'usable' },
  { id: 'a13', at: '2026-04-21T08:02:00.000Z', actor: 'Apex HR', role: 'TENANT', action: 'ingested', datasetId: 'apex_store_assoc_raw', rung: 'loaded' },
  { id: 'a14', at: '2026-04-20T16:33:00.000Z', actor: 'Apex Data Eng', role: 'TENANT', action: 'ingested', datasetId: 'apex_demand_logs_raw', rung: 'loaded' },
  { id: 'a15', at: '2026-04-19T15:00:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_demand_forecast_eval' },
  { id: 'a16', at: '2026-04-19T11:20:00.000Z', actor: 'Steward', role: 'AGENT', action: 'parsed_and_indexed', datasetId: 'apex_vendor_inventory', rung: 'available' },
  { id: 'a17', at: '2026-04-18T09:45:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_promotion', datasetId: 'apex_outcome_baseline' },
  { id: 'a18', at: '2026-04-17T15:10:00.000Z', actor: 'Apex CIO', role: 'TENANT', action: 'parsed_and_indexed', datasetId: 'apex_tech_inventory', rung: 'available' },
  { id: 'a19', at: '2026-04-15T13:20:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_promotion', datasetId: 'apex_master_program_brief' },
  { id: 'a20', at: '2026-04-10T10:00:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'rejected_promotion' },
];

function buildTrustProgression(): ReadonlyArray<TrustProgressionPoint> {
  const points: TrustProgressionPoint[] = [];
  const end = Date.UTC(2026, 3, 25); // 2026-04-25
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 29; i >= 0; i--) {
    const t = new Date(end - i * dayMs);
    const iso = t.toISOString().slice(0, 10);
    const tick = 29 - i;
    const loaded = Math.min(14, 4 + Math.floor(tick * 0.36));
    const available = Math.min(11, Math.max(2, Math.floor(tick * 0.32)));
    const usable = Math.min(7, Math.max(1, Math.floor(tick * 0.22)));
    const agent_usable = Math.min(4, Math.max(0, Math.floor(tick * 0.13)));
    const decision_grade = Math.min(2, Math.max(0, Math.floor(tick * 0.07)));
    points.push({ date: iso, loaded, available, usable, agent_usable, decision_grade });
  }
  return points;
}

const TRUST_PROGRESSION: ReadonlyArray<TrustProgressionPoint> = buildTrustProgression();

const ACTION_STRIP: ReadonlyArray<DataTrustActionRow> = [
  {
    id: 'approve_dataset',
    label: 'Approve dataset',
    status: 'hard_gated',
    reason: 'Live approval available with audit event store in Wave 27',
  },
  {
    id: 'add_policy',
    label: 'Add governance policy',
    status: 'hard_gated',
    reason: 'Live policy writes available with audit event store in Wave 27',
  },
  {
    id: 'open_evidence_ledger',
    label: 'Open evidence ledger',
    status: 'safe',
    href: '/admin/data-trust?tab=audit_trail',
  },
  {
    id: 'export_trust_report',
    label: 'Export trust report',
    status: 'safe',
    href: '/admin/data-trust?tab=trust_ladder&export=trust_report',
  },
];

export function buildDataTrustPageView(): DataTrustPageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  return {
    eyebrow: 'Data trust posture',
    title: 'Data Trust',
    subtitle:
      'How loaded data becomes usable evidence — and what is not yet usable. Counts trace to the deterministic evidence manifest.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: editorial.body,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    ladder: TRUST_LADDER,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open evidence ledger',
    primaryActionHref: '/admin/data-trust?tab=audit_trail',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
    tabs: TABS,
    defaultTab: 'trust_ladder',
    datasetsByRung: DATASETS_BY_RUNG,
    datasetDetailMap: DATASET_DETAIL_MAP,
    loadedFiles: LOADED_FILES,
    promotionRequests: PROMOTION_REQUESTS,
    qualityScorecard: QUALITY_SCORECARD,
    auditTrail: AUDIT_TRAIL,
    trustProgression: TRUST_PROGRESSION,
    actionStrip: ACTION_STRIP,
  };
}

const TAB_KEYS: ReadonlyArray<DataTrustTabKey> = [
  'trust_ladder',
  'loaded_files',
  'promotion_queue',
  'quality_scorecard',
  'audit_trail',
];

export function resolveDataTrustTab(input: string | undefined | null): DataTrustTabKey {
  if (!input) return 'trust_ladder';
  return (TAB_KEYS as ReadonlyArray<string>).includes(input)
    ? (input as DataTrustTabKey)
    : 'trust_ladder';
}

export function findDataTrustDataset(
  view: DataTrustPageView,
  id: string | undefined | null,
): DatasetDetail | null {
  if (!id) return null;
  return view.datasetDetailMap[id] ?? null;
}
