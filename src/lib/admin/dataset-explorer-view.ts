// ADM4 · Dataset Explorer view helper.
//
// Pure deterministic projection of the ADM3 dataset domain inventory
// into a renderable explorer view: per-domain rollups + filtered
// dataset rows. The component renders this without re-deriving from
// raw items.
//
// No live runtime, no Claude / OpenAI invocation, no migrations.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import {
  buildDatasetDomainInventory,
  DATASET_DOMAIN_KEYS_IN_ORDER,
  type DatasetDomainInventory,
  type DatasetDomainInventorySummary,
  type DatasetDomainKey,
  type DatasetEvidenceUsability,
  type DatasetInventoryItem,
} from '@/lib/admin/dataset-domain-inventory';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type DatasetExplorerDomainStatus =
  | 'not_started'
  | 'partial'
  | 'ready'
  | 'blocked';

export interface DatasetExplorerDomainRollup {
  key: DatasetDomainKey;
  name: string;
  ordinal: number;
  status: DatasetExplorerDomainStatus;
  loadedCount: number;
  availableCount: number;
  usableCount: number;
  blockedCount: number;
  orphanCount: number;
  topItem: DatasetInventoryItem | null;
}

export interface DatasetExplorerView {
  generatedFrom: 'deterministic_seed';
  inventory: DatasetDomainInventory;
  summary: DatasetDomainInventorySummary;
  domains: ReadonlyArray<DatasetExplorerDomainRollup>;
  /** Total dataset count surfaced in the UI header. */
  totalLoadedAcrossDomains: number;
  totalUsableAcrossDomains: number;
  /** Honest one-liner naming the source-of-truth limit. */
  interpretationBasis: string;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

const DOMAIN_NAME: Record<DatasetDomainKey, string> = {
  enterprise_strategy_c_suite: 'Enterprise Strategy & C-Suite Priorities',
  business_kpi_functional_performance: 'Business KPI / Functional Performance',
  enterprise_architecture_tech_stack: 'Enterprise Architecture & Tech Stack',
  application_portfolio: 'Application Portfolio',
  infrastructure_cloud_data_center: 'Infrastructure / Cloud / Data Center',
  vendor_contract_spend: 'Vendor / Contract / Spend',
  ai_portfolio_use_case_inventory: 'AI Portfolio / Use Case Inventory',
  ai_tool_adoption_usage_cost: 'AI Tool Adoption / Usage / Cost',
  it_operating_model_dora: 'IT Operating Model / Productivity / DORA',
  risk_compliance_governance: 'Risk / Compliance / Governance',
  evidence_reports_artifacts: 'Evidence / Reports / Artifacts',
  org_structure_users_ownership: 'Org Structure / Users / Ownership',
};

const ORDINAL: Record<DatasetDomainKey, number> = {
  enterprise_strategy_c_suite: 1,
  business_kpi_functional_performance: 2,
  enterprise_architecture_tech_stack: 3,
  application_portfolio: 4,
  infrastructure_cloud_data_center: 5,
  vendor_contract_spend: 6,
  ai_portfolio_use_case_inventory: 7,
  ai_tool_adoption_usage_cost: 8,
  it_operating_model_dora: 9,
  risk_compliance_governance: 10,
  evidence_reports_artifacts: 11,
  org_structure_users_ownership: 12,
};

const AT_OR_ABOVE_INDEXED: ReadonlySet<DatasetEvidenceUsability> = new Set([
  'indexed',
  'classified',
  'scoped',
  'cited',
  'quality_checked',
  'usable_as_evidence',
]);

/**
 * Build the deterministic dataset explorer view. Pure: same call →
 * identical output.
 */
export function buildDatasetExplorerView(): DatasetExplorerView {
  const inventory = buildDatasetDomainInventory();
  const domains = composeDomainRollups(inventory);
  const totalLoadedAcrossDomains = inventory.summary.loadedTotal;
  const totalUsableAcrossDomains = inventory.summary.usableTotal;
  return {
    generatedFrom: 'deterministic_seed',
    inventory,
    summary: inventory.summary,
    domains,
    totalLoadedAcrossDomains,
    totalUsableAcrossDomains,
    interpretationBasis:
      'Composed from the ADM3 deterministic seed inventory. No live connector sync, no upload pipeline, no real-time evidence registry.',
  };
}

/**
 * Build the per-domain rollups. Pure.
 */
export function buildDatasetExplorerDomains(
  inventory: DatasetDomainInventory,
): ReadonlyArray<DatasetExplorerDomainRollup> {
  return composeDomainRollups(inventory);
}

// ---------------------------------------------------------------------
// Internal composition
// ---------------------------------------------------------------------

function composeDomainRollups(
  inventory: DatasetDomainInventory,
): ReadonlyArray<DatasetExplorerDomainRollup> {
  const itemsByDomain = new Map<DatasetDomainKey, DatasetInventoryItem[]>();
  for (const k of DATASET_DOMAIN_KEYS_IN_ORDER) itemsByDomain.set(k, []);
  for (const it of inventory.items) {
    itemsByDomain.get(it.domainKey)!.push(it);
  }
  return DATASET_DOMAIN_KEYS_IN_ORDER.map<DatasetExplorerDomainRollup>(
    (k): DatasetExplorerDomainRollup => {
      const items = itemsByDomain.get(k)!;
      const loaded = items.length;
      const available = items.filter((it) =>
        AT_OR_ABOVE_INDEXED.has(it.evidenceUsabilityState),
      ).length;
      const usable = items.filter(
        (it) => it.evidenceUsabilityState === 'usable_as_evidence',
      ).length;
      const blocked = items.filter(
        (it) => it.evidenceUsabilityState === 'blocked',
      ).length;
      const orphan = items.filter((it) => it.owner === null).length;
      const status = pickStatus(loaded, usable, blocked);
      const topItem = items[0] ?? null;
      return {
        key: k,
        name: DOMAIN_NAME[k],
        ordinal: ORDINAL[k],
        status,
        loadedCount: loaded,
        availableCount: available,
        usableCount: usable,
        blockedCount: blocked,
        orphanCount: orphan,
        topItem,
      };
    },
  );
}

function pickStatus(
  loaded: number,
  usable: number,
  blocked: number,
): DatasetExplorerDomainStatus {
  if (loaded === 0) return 'not_started';
  if (blocked > 0 && usable === 0) return 'blocked';
  if (usable >= 1 && usable === loaded) return 'ready';
  return 'partial';
}
