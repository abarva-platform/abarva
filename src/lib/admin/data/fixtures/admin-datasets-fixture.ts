/**
 * ADMIN-DATA2 — Admin datasets fixture.
 *
 * Lifts DATASETS_BY_RUNG, DATASET_DETAIL_MAP, LOADED_FILES,
 * PROMOTION_REQUESTS, QUALITY_SCORECARD from `data-trust-page-view.ts`.
 */

import type {
  AdminDatasetApprovalRow,
  AdminDatasetDetail,
  AdminDatasetQuality,
  AdminDatasetRow,
  AdminDatasetRung,
  AdminLoadedFileRow,
} from '../admin-datasets-adapter-types';

interface DatasetSeed {
  id: string;
  name: string;
  rung: AdminDatasetRung;
  owner: string;
  ownerPersonId: string | null;
  lastUpdated: string;
  segment: string;
  evidenceUsable: boolean;
  approvalState: AdminDatasetRow['approvalState'];
  domain: string;
}

const APEX_DATASET_SEEDS: ReadonlyArray<DatasetSeed> = [
  // loaded
  { id: 'apex_pos_raw', name: 'Apex POS · raw export 2026-Q1', rung: 'loaded', owner: 'Apex IT', ownerPersonId: 'team:apex-it', lastUpdated: '2026-04-22T10:14:00.000Z', segment: 'Business', evidenceUsable: false, approvalState: 'unapproved', domain: 'sales' },
  { id: 'apex_store_assoc_raw', name: 'Apex store-associate roster · raw', rung: 'loaded', owner: 'Apex HR', ownerPersonId: 'team:apex-hr', lastUpdated: '2026-04-21T08:02:00.000Z', segment: 'Business', evidenceUsable: false, approvalState: 'unapproved', domain: 'workforce' },
  { id: 'apex_demand_logs_raw', name: 'Apex demand-forecast model logs', rung: 'loaded', owner: 'Apex Data Eng', ownerPersonId: 'team:apex-data-eng', lastUpdated: '2026-04-20T16:33:00.000Z', segment: 'IT & Technology', evidenceUsable: false, approvalState: 'unapproved', domain: 'ml' },
  // available
  { id: 'apex_pos_indexed', name: 'Apex POS · indexed 2026-Q1', rung: 'available', owner: 'AbarVa Stewards', ownerPersonId: 'agent:steward', lastUpdated: '2026-04-22T12:00:00.000Z', segment: 'Business', evidenceUsable: false, approvalState: 'requested', domain: 'sales' },
  { id: 'apex_vendor_inventory', name: 'Apex vendor inventory · parsed', rung: 'available', owner: 'AbarVa Stewards', ownerPersonId: 'agent:steward', lastUpdated: '2026-04-19T11:20:00.000Z', segment: 'Business', evidenceUsable: false, approvalState: 'requested', domain: 'vendors' },
  { id: 'apex_outcome_baseline', name: 'Apex outcome baseline lock', rung: 'available', owner: 'AbarVa Stewards', ownerPersonId: 'agent:steward', lastUpdated: '2026-04-18T09:45:00.000Z', segment: 'Business', evidenceUsable: false, approvalState: 'requested', domain: 'outcomes' },
  { id: 'apex_tech_inventory', name: 'Apex technology inventory', rung: 'available', owner: 'Apex CIO', ownerPersonId: 'team:apex-cio', lastUpdated: '2026-04-17T15:10:00.000Z', segment: 'IT & Technology', evidenceUsable: false, approvalState: 'requested', domain: 'technology' },
  // usable
  { id: 'apex_demand_forecast_eval', name: 'Apex demand-forecast evaluation pack', rung: 'usable', owner: 'AbarVa Stewards', ownerPersonId: 'agent:steward', lastUpdated: '2026-04-23T07:30:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'requested', domain: 'forecasting' },
  { id: 'apex_cdp_data_audit', name: 'Apex CDP data audit', rung: 'usable', owner: 'Apex Marketing', ownerPersonId: 'team:apex-marketing', lastUpdated: '2026-04-22T18:11:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'requested', domain: 'marketing' },
  { id: 'apex_contact_center_kpis', name: 'Apex contact-center KPI deck', rung: 'usable', owner: 'Apex Ops', ownerPersonId: 'team:apex-ops', lastUpdated: '2026-04-21T13:55:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'requested', domain: 'operations' },
  // agent_usable
  { id: 'apex_master_program_brief', name: 'Apex master program brief', rung: 'agent_usable', owner: 'AbarVa Maestro', ownerPersonId: 'agent:maestro', lastUpdated: '2026-04-24T10:01:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'approved', domain: 'programs' },
  { id: 'apex_steward_evidence_pack', name: 'Apex Steward evidence pack', rung: 'agent_usable', owner: 'AbarVa Stewards', ownerPersonId: 'agent:steward', lastUpdated: '2026-04-23T16:42:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'approved', domain: 'evidence' },
  { id: 'apex_atlas_pressure_index', name: 'Apex Atlas pressure index', rung: 'agent_usable', owner: 'AbarVa Atlas', ownerPersonId: 'agent:atlas', lastUpdated: '2026-04-22T19:18:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'approved', domain: 'portfolio' },
  // decision_grade
  { id: 'apex_outcome_lock_v1', name: 'Apex outcome lock (v1, signed)', rung: 'decision_grade', owner: 'Apex CFO + AbarVa Steward', ownerPersonId: 'agent:steward', lastUpdated: '2026-04-25T09:00:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'approved', domain: 'outcomes' },
  { id: 'apex_program_gate_pack', name: 'Apex program-gate decision pack', rung: 'decision_grade', owner: 'Apex CIO + AbarVa Maestro', ownerPersonId: 'agent:maestro', lastUpdated: '2026-04-24T14:20:00.000Z', segment: 'Business', evidenceUsable: true, approvalState: 'approved', domain: 'programs' },
];

function seedToRow(seed: DatasetSeed): AdminDatasetRow {
  return {
    id: seed.id,
    slug: seed.id,
    label: seed.name,
    domain: seed.domain,
    rung: seed.rung,
    rowCount: null,
    ownerPersonId: seed.ownerPersonId,
    segment: seed.segment,
    evidenceUsable: seed.evidenceUsable,
    approvalState: seed.approvalState,
    lastUpdatedAt: seed.lastUpdated,
  };
}

function buildProvenance(seed: DatasetSeed): ReadonlyArray<{ at: string; label: string }> {
  const provenance: Array<{ at: string; label: string }> = [
    { at: '2026-04-15T08:00:00.000Z', label: 'Ingested into workspace' },
    { at: '2026-04-17T11:00:00.000Z', label: 'Parsed + indexed by Steward' },
  ];
  if (seed.evidenceUsable) {
    provenance.push({ at: '2026-04-19T15:00:00.000Z', label: 'Cited in Steward editorial card' });
  }
  if (seed.approvalState === 'approved') {
    provenance.push({ at: seed.lastUpdated, label: 'Approval recorded (deterministic stub)' });
  }
  return provenance;
}

function buildDetail(seed: DatasetSeed): AdminDatasetDetail {
  const row = seedToRow(seed);
  return {
    ...row,
    lineageSources: [],
    schemaSummary: [],
    provenance: buildProvenance(seed),
    approvalOwner:
      seed.approvalState === 'approved'
        ? 'Sundaram (Maestro)'
        : seed.approvalState === 'requested'
          ? 'Pending — Sundaram (Maestro)'
          : 'Not yet requested',
    notes:
      seed.approvalState === 'approved'
        ? 'Approved for agent context and decision-grade use.'
        : 'Live approval requires the audit-event store landing in Wave 27.',
  };
}

const APEX_QUALITY_SCORES: ReadonlyArray<AdminDatasetQuality> = APEX_DATASET_SEEDS.map(
  (seed) => {
    const base = seed.evidenceUsable ? 80 : 60;
    return {
      datasetId: seed.id,
      completeness: base,
      freshness: base + 5,
      schemaConformance: base + 3,
      lineage: base - 2,
      sampleAgreement: base + 1,
      overall: base + 1,
      measuredAt: seed.lastUpdated,
    };
  },
);

const APEX_LOADED_FILES: ReadonlyArray<AdminLoadedFileRow> = [
  { id: 'lf_apex_fin_fy25', name: 'Apex_Financial_Summary_FY25.xlsx', segment: 'Business', category: 'Financial', status: 'approved', owner: 'Apex CFO', lastUpdated: '2026-04-22T10:14:00.000Z' },
  { id: 'lf_apex_pos_logs', name: 'Apex_POS_Logs_Q1_2026.csv', segment: 'Business', category: 'Operations', status: 'approved', owner: 'Apex IT', lastUpdated: '2026-04-21T08:02:00.000Z' },
  { id: 'lf_apex_vendor_register', name: 'Apex_Vendor_Register_v3.pdf', segment: 'Business', category: 'Vendors', status: 'approved', owner: 'Apex Procurement', lastUpdated: '2026-04-19T11:20:00.000Z' },
  { id: 'lf_apex_tech_inventory', name: 'Apex_Technology_Inventory_2026.xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', owner: 'Apex CIO', lastUpdated: '2026-04-17T15:10:00.000Z' },
  { id: 'lf_apex_cdp_audit', name: 'Apex_CDP_Data_Audit.pdf', segment: 'IT & Technology', category: 'Marketing', status: 'processing', owner: 'Apex Marketing', lastUpdated: '2026-04-22T18:11:00.000Z' },
  { id: 'lf_apex_contact_center', name: 'Apex_Contact_Center_KPI_Deck.pptx', segment: 'Business', category: 'Operations', status: 'approved', owner: 'Apex Ops', lastUpdated: '2026-04-21T13:55:00.000Z' },
  { id: 'lf_apex_store_assoc', name: 'Apex_Store_Associate_Roster.xlsx', segment: 'Business', category: 'Workforce', status: 'processing', owner: 'Apex HR', lastUpdated: '2026-04-21T08:02:00.000Z' },
  { id: 'lf_apex_demand_logs', name: 'Apex_Demand_Forecast_Model_Logs.json', segment: 'IT & Technology', category: 'AI / ML', status: 'approved', owner: 'Apex Data Eng', lastUpdated: '2026-04-20T16:33:00.000Z' },
  { id: 'lf_apex_outcome_baseline', name: 'Apex_Outcome_Baseline_Day0.xlsx', segment: 'Business', category: 'Outcomes', status: 'approved', owner: 'AbarVa Stewards', lastUpdated: '2026-04-18T09:45:00.000Z' },
  { id: 'lf_apex_3p_market_data', name: 'Apex_Third_Party_Market_Data.csv', segment: 'Third Party', category: 'Market intel', status: 'missing', owner: 'Apex Strategy', lastUpdated: '—' },
];

const APEX_APPROVALS: ReadonlyArray<AdminDatasetApprovalRow> = [
  {
    id: 'promo_apex_demand_v2',
    datasetId: 'apex_demand_forecast_eval',
    fromRung: 'usable',
    toRung: 'agent_usable',
    status: 'pending',
    requestedBy: 'Sundaram (Maestro)',
    requestedAt: '2026-04-22T11:00:00.000Z',
    decidedBy: null,
    decidedAt: null,
    reason: 'Maestro requested promotion to master after Apex CFO sign-off.',
  },
  {
    id: 'promo_apex_cdp_audit',
    datasetId: 'apex_cdp_data_audit',
    fromRung: 'usable',
    toRung: 'agent_usable',
    status: 'pending',
    requestedBy: 'Sundaram (Maestro)',
    requestedAt: '2026-04-21T16:30:00.000Z',
    decidedBy: null,
    decidedAt: null,
    reason: 'Awaiting CIO confirmation before promotion.',
  },
  {
    id: 'promo_apex_baseline_lock',
    datasetId: 'apex_outcome_baseline',
    fromRung: 'available',
    toRung: 'usable',
    status: 'approved',
    requestedBy: 'Sundaram (Maestro)',
    requestedAt: '2026-04-18T09:45:00.000Z',
    decidedBy: 'agent:steward',
    decidedAt: '2026-04-18T10:00:00.000Z',
    reason: null,
  },
  {
    id: 'promo_apex_program_brief',
    datasetId: 'apex_master_program_brief',
    fromRung: 'usable',
    toRung: 'agent_usable',
    status: 'approved',
    requestedBy: 'Sundaram (Maestro)',
    requestedAt: '2026-04-15T13:20:00.000Z',
    decidedBy: 'agent:steward',
    decidedAt: '2026-04-15T14:00:00.000Z',
    reason: null,
  },
  {
    id: 'promo_apex_internal_notes',
    datasetId: 'apex_master_program_brief',
    fromRung: 'usable',
    toRung: 'agent_usable',
    status: 'rejected',
    requestedBy: 'Sundaram (Maestro)',
    requestedAt: '2026-04-10T10:00:00.000Z',
    decidedBy: 'agent:steward',
    decidedAt: '2026-04-10T11:00:00.000Z',
    reason: 'Engagement-only — keep out of master intelligence.',
  },
];

export function adminDatasetsFixture(tenantSlug: string): ReadonlyArray<AdminDatasetRow> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_DATASET_SEEDS.map(seedToRow);
}

export function adminDatasetsByRungFixture(
  tenantSlug: string,
): Readonly<Record<AdminDatasetRung, ReadonlyArray<AdminDatasetRow>>> {
  const empty: Record<AdminDatasetRung, ReadonlyArray<AdminDatasetRow>> = {
    loaded: [],
    available: [],
    usable: [],
    agent_usable: [],
    decision_grade: [],
  };
  if (tenantSlug !== 'apex-retail') return empty;
  const out: Record<AdminDatasetRung, AdminDatasetRow[]> = {
    loaded: [],
    available: [],
    usable: [],
    agent_usable: [],
    decision_grade: [],
  };
  for (const seed of APEX_DATASET_SEEDS) {
    out[seed.rung].push(seedToRow(seed));
  }
  return out;
}

export function adminDatasetDetailFixture(
  tenantSlug: string,
  datasetId: string,
): AdminDatasetDetail | null {
  if (tenantSlug !== 'apex-retail') return null;
  const seed = APEX_DATASET_SEEDS.find((s) => s.id === datasetId);
  return seed ? buildDetail(seed) : null;
}

export function adminDatasetApprovalsFixture(
  tenantSlug: string,
  status?: AdminDatasetApprovalRow['status'],
): ReadonlyArray<AdminDatasetApprovalRow> {
  if (tenantSlug !== 'apex-retail') return [];
  if (!status) return APEX_APPROVALS;
  return APEX_APPROVALS.filter((a) => a.status === status);
}

export function adminDatasetQualityFixture(
  tenantSlug: string,
  datasetId: string,
): AdminDatasetQuality | null {
  if (tenantSlug !== 'apex-retail') return null;
  return APEX_QUALITY_SCORES.find((q) => q.datasetId === datasetId) ?? null;
}

export function adminDatasetQualityScoresFixture(
  tenantSlug: string,
): ReadonlyArray<AdminDatasetQuality> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_QUALITY_SCORES;
}

export function adminLoadedFilesFixture(
  tenantSlug: string,
): ReadonlyArray<AdminLoadedFileRow> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_LOADED_FILES;
}
