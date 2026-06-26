import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';
import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import {
  listProjectedTowerReadModelForClient,
  type ProjectedTowerReadModel,
} from '@/lib/tower/tower-semantic-projection';

type JsonRecord = Record<string, unknown>;

export type TowerAmountType =
  | 'annual_license'
  | 'annual_subscription'
  | 'annual_run_rate'
  | 'one_time_implementation'
  | 'multi_year_program_budget'
  | 'internal_labor'
  | 'managed_services'
  | 'cloud_consumption'
  | 'contract_value'
  | 'committed_value'
  | 'forecast_value'
  | 'realized_value'
  | 'value_at_stake'
  | 'renewal_exposure'
  | 'unknown';

export interface TowerMaterializedInitiativeWriteRow {
  client_id: string;
  tenant_key: string;
  period_label: string;
  initiative_id: string;
  display_id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  goal_id: string;
  goal_name: string;
  stage: string;
  stage_detail: string | null;
  owner_name: string;
  owner_title: string;
  owner_function: string | null;
  committed_annual_usd: number | null;
  committed_total_usd: number | null;
  measured_value_usd: number | null;
  status_flag: string;
  status_summary: string;
  confidence_level: string;
  aligned_callout: boolean;
  aligned_rationale: string | null;
  loaded_via_template: string;
  amount_type: TowerAmountType;
  accounting_treatment: 'opex' | 'capex' | 'mixed' | 'unknown';
  spend_posture: 'run' | 'change' | 'transformation' | 'innovation' | 'regulatory' | 'unknown';
  scope_type: 'corporate_shared_service' | 'portfolio_company_specific' | 'enterprise_shared_platform' | 'allocated_corporate_cost' | 'unknown';
  allocation_method: 'direct' | 'revenue_based' | 'headcount_based' | 'usage_based' | 'equal_split' | 'manual_allocation' | 'unknown';
  portfolio_company: string | null;
  operating_company: string | null;
  legal_entity: string | null;
  business_unit: string | null;
  business_function: string | null;
  is_synthetic: boolean;
  is_outlier: boolean;
  evidence_ids: string[];
  citations: JsonRecord[];
  lineage: JsonRecord;
  gaps: JsonRecord[];
  freshness_status: string;
}

export interface TowerMaterializedVendorWriteRow {
  client_id: string;
  tenant_key: string;
  period_label: string;
  vendor_id: string;
  vendor_name: string;
  logical_vendor_key: string;
  initiative_id: string | null;
  initiative_display_id: string | null;
  initiative_name: string | null;
  contract_value_usd: number | null;
  renewal_date: string | null;
  financial_health: string | null;
  amount_type: TowerAmountType;
  accounting_treatment: 'opex' | 'capex' | 'mixed' | 'unknown';
  spend_posture: 'run' | 'change' | 'transformation' | 'innovation' | 'regulatory' | 'unknown';
  scope_type: 'corporate_shared_service' | 'portfolio_company_specific' | 'enterprise_shared_platform' | 'allocated_corporate_cost' | 'unknown';
  allocation_method: 'direct' | 'revenue_based' | 'headcount_based' | 'usage_based' | 'equal_split' | 'manual_allocation' | 'unknown';
  is_duplicate_rollup: boolean;
  duplicate_group_key: string | null;
  duplicate_raw_row_count: number;
  is_synthetic: boolean;
  is_outlier: boolean;
  evidence_ids: string[];
  citations: JsonRecord[];
  lineage: JsonRecord;
  gaps: JsonRecord[];
}

export interface TowerGapWriteRow {
  client_id: string;
  tenant_key: string;
  gap_key: string;
  gap_type: string;
  label: string;
  impact: string;
  required_source: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  surface: 'tower';
  status: 'open' | 'resolved' | 'accepted';
  lineage: JsonRecord;
}

export interface TowerSpendRealismAuditWriteRow {
  client_id: string;
  tenant_key: string;
  object_type: string;
  object_key: string;
  source_value_usd: number | null;
  recomputed_value_usd: number | null;
  benchmark_unit_price_usd: number | null;
  seat_count: number | null;
  amount_type: TowerAmountType;
  verdict: 'pass' | 'outlier_withheld' | 'gap_amount_type' | 'directional_only';
  rule_key: string;
  notes: string;
  lineage: JsonRecord;
}

export interface TowerForbiddenIdentifierWriteRow {
  tenant_key: string;
  identifier: string;
  identifier_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  reason: string;
}

export interface TowerMaterializationPlan {
  clientId: string;
  tenantKey: string;
  source: ProjectedTowerReadModel['source'];
  initiatives: TowerMaterializedInitiativeWriteRow[];
  vendors: TowerMaterializedVendorWriteRow[];
  gaps: TowerGapWriteRow[];
  spendRealismAudit: TowerSpendRealismAuditWriteRow[];
  forbiddenIdentifiers: TowerForbiddenIdentifierWriteRow[];
  summary: {
    initiativeInputCount: number;
    vendorInputCount: number;
    vendorOutputCount: number;
    duplicateVendorGroups: number;
    gaps: number;
    outliersWithheld: number;
  };
}

export function canonicalizeTowerTenantKey(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  const normalized = raw.toLowerCase().replace(/[_\s]+/g, '-');
  if (
    normalized === 'lakeshore' ||
    normalized === 'lakeshore-industries' ||
    normalized === 'lakeshore-holdings'
  ) {
    return 'lakeshore-holdings';
  }
  if (normalized === 'skyharbor' || normalized === 'skyharbor-air') {
    return 'skyharbor-air';
  }
  return normalized || 'unknown-tenant';
}

function money(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bexpansion\s+\d+\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function logicalVendorKey(vendorName: string): string {
  return slug(vendorName) || 'unknown-vendor';
}

function classifyInitiativeAmountType(initiative: AIInitiative): TowerAmountType {
  if (initiative.committedAnnualUsd !== null) return 'annual_run_rate';
  if (initiative.committedTotalUsd !== null) return 'multi_year_program_budget';
  if (initiative.measuredValueUsd !== null) return 'realized_value';
  return 'unknown';
}

function spendPostureFor(initiative: AIInitiative): TowerMaterializedInitiativeWriteRow['spend_posture'] {
  const text = `${initiative.primaryCategoryName} ${initiative.stage} ${initiative.statusSummary}`.toLowerCase();
  if (text.includes('run') || text.includes('operate')) return 'run';
  if (text.includes('regulat') || text.includes('control')) return 'regulatory';
  if (text.includes('innov') || text.includes('ai')) return 'innovation';
  if (text.includes('transform') || text.includes('modern')) return 'transformation';
  if (text.includes('change') || text.includes('build')) return 'change';
  return 'unknown';
}

function initiativeGapRows(args: {
  clientId: string;
  tenantKey: string;
  initiatives: readonly AIInitiative[];
}): TowerGapWriteRow[] {
  const gaps: TowerGapWriteRow[] = [];
  if (args.initiatives.length === 0) {
    gaps.push({
      client_id: args.clientId,
      tenant_key: args.tenantKey,
      gap_key: 'tower.no_initiatives_loaded',
      gap_type: 'missing_read_model_input',
      label: 'No Tower initiatives loaded',
      impact: 'Tower cannot show program, value, risk, or decision queues until initiative rows materialize.',
      required_source: 'T01/T07/T08/T10 initiative spine or AI Control Tower source rows',
      severity: 'critical',
      surface: 'tower',
      status: 'open',
      lineage: { source: 'tower_materialization' },
    });
  }

  if (args.tenantKey === 'lakeshore-holdings') {
    gaps.push({
      client_id: args.clientId,
      tenant_key: args.tenantKey,
      gap_key: 'tower.lakeshore.operating_company_dimension_missing',
      gap_type: 'portfolio_path_a_named_gap',
      label: 'Operating-company dimension not loaded',
      impact: 'Level 2 portfolio-company comparisons and Level 3 company drill-downs must render as gaps, not fabricated comparisons.',
      required_source: 'portfolio_company / operating_company / legal_entity fields in Tower input templates',
      severity: 'high',
      surface: 'tower',
      status: 'open',
      lineage: { approved_path: 'Path A' },
    });
  }

  return gaps;
}

function buildInitiativeRows(args: {
  clientId: string;
  tenantKey: string;
  source: ProjectedTowerReadModel['source'];
  initiatives: readonly AIInitiative[];
}): TowerMaterializedInitiativeWriteRow[] {
  return args.initiatives.map((initiative) => {
    const amountType = classifyInitiativeAmountType(initiative);
    const gaps: JsonRecord[] = [];
    if (amountType === 'unknown') {
      gaps.push({
        gap: 'amount_type',
        impact: 'Financial value can be used as evidence but must not drive Tower executive metrics.',
      });
    }
    if (initiative.measuredValueUsd === null) {
      gaps.push({
        gap: 'measured_value',
        impact: 'Value realization is not proven for this program.',
      });
    }
    return {
      client_id: args.clientId,
      tenant_key: args.tenantKey,
      period_label: 'current',
      initiative_id: initiative.initiativeId,
      display_id: initiative.displayId,
      name: initiative.name,
      description: initiative.description,
      category_id: initiative.primaryCategoryId,
      category_name: initiative.primaryCategoryName,
      goal_id: initiative.primaryGoalId,
      goal_name: initiative.primaryGoalName,
      stage: initiative.stage,
      stage_detail: initiative.stageDetail,
      owner_name: initiative.ownerName,
      owner_title: initiative.ownerTitle,
      owner_function: initiative.ownerFunction,
      committed_annual_usd: money(initiative.committedAnnualUsd),
      committed_total_usd: money(initiative.committedTotalUsd),
      measured_value_usd: money(initiative.measuredValueUsd),
      status_flag: initiative.statusFlag,
      status_summary: initiative.statusSummary,
      confidence_level: initiative.confidenceLevel,
      aligned_callout: initiative.alignedCallout,
      aligned_rationale: initiative.alignedRationale,
      loaded_via_template: initiative.loadedViaTemplate,
      amount_type: amountType,
      accounting_treatment: 'unknown',
      spend_posture: spendPostureFor(initiative),
      scope_type: 'unknown',
      allocation_method: 'unknown',
      portfolio_company: null,
      operating_company: null,
      legal_entity: null,
      business_unit: null,
      business_function: initiative.ownerFunction,
      is_synthetic: false,
      is_outlier: false,
      evidence_ids: [initiative.initiativeId],
      citations: [],
      lineage: { materialized_from: args.source, display_id: initiative.displayId },
      gaps,
      freshness_status: 'unknown',
    };
  });
}

function chooseVendorWinner(rows: readonly AIInitiativeVendorRow[]): AIInitiativeVendorRow {
  return [...rows].sort((a, b) => (money(b.contractValueUsd) ?? -1) - (money(a.contractValueUsd) ?? -1))[0]!;
}

function buildVendorRows(args: {
  clientId: string;
  tenantKey: string;
  source: ProjectedTowerReadModel['source'];
  vendors: readonly AIInitiativeVendorRow[];
}): TowerMaterializedVendorWriteRow[] {
  const groups = new Map<string, AIInitiativeVendorRow[]>();
  for (const vendor of args.vendors) {
    const key = logicalVendorKey(vendor.vendorName);
    groups.set(key, [...(groups.get(key) ?? []), vendor]);
  }

  return [...groups.entries()].map(([key, rows]) => {
    const vendor = chooseVendorWinner(rows);
    const duplicateCount = rows.length;
    const amountType: TowerAmountType = vendor.contractValueUsd === null ? 'unknown' : 'contract_value';
    const gaps: JsonRecord[] = [];
    if (amountType === 'unknown') {
      gaps.push({
        gap: 'contract_value',
        impact: 'Vendor can be shown as evidence, but spend/concentration metrics cannot use it.',
      });
    }
    return {
      client_id: args.clientId,
      tenant_key: args.tenantKey,
      period_label: 'current',
      vendor_id: vendor.vendorId,
      vendor_name: vendor.vendorName.replace(/\s+expansion\s+\d+\b/gi, '').trim(),
      logical_vendor_key: key,
      initiative_id: vendor.initiativeId,
      initiative_display_id: vendor.initiativeDisplayId,
      initiative_name: vendor.initiativeName,
      contract_value_usd: money(vendor.contractValueUsd),
      renewal_date: vendor.renewalDate,
      financial_health: vendor.financialHealth,
      amount_type: amountType,
      accounting_treatment: 'unknown',
      spend_posture: 'run',
      scope_type: 'unknown',
      allocation_method: 'unknown',
      is_duplicate_rollup: duplicateCount > 1,
      duplicate_group_key: duplicateCount > 1 ? key : null,
      duplicate_raw_row_count: duplicateCount,
      is_synthetic: false,
      is_outlier: false,
      evidence_ids: rows.map((row) => row.vendorId),
      citations: [],
      lineage: { materialized_from: args.source, duplicate_raw_row_count: duplicateCount },
      gaps,
    };
  });
}

function buildSpendAuditRows(args: {
  clientId: string;
  tenantKey: string;
  initiatives: readonly TowerMaterializedInitiativeWriteRow[];
  vendors: readonly TowerMaterializedVendorWriteRow[];
}): TowerSpendRealismAuditWriteRow[] {
  const initiativeRows = args.initiatives.map((row): TowerSpendRealismAuditWriteRow => {
    const sourceValue = row.committed_annual_usd ?? row.committed_total_usd ?? row.measured_value_usd;
    return {
      client_id: args.clientId,
      tenant_key: args.tenantKey,
      object_type: 'initiative',
      object_key: row.initiative_id,
      source_value_usd: sourceValue,
      recomputed_value_usd: null,
      benchmark_unit_price_usd: null,
      seat_count: null,
      amount_type: row.amount_type,
      verdict: row.amount_type === 'unknown' ? 'gap_amount_type' : 'directional_only',
      rule_key: 'tower.amount_type_required',
      notes: row.amount_type === 'unknown'
        ? 'Amount type is unknown; do not render this as an executive metric.'
        : 'Amount is classified but not yet benchmark-reconciled in this slice.',
      lineage: row.lineage,
    };
  });

  const vendorRows = args.vendors.map((row): TowerSpendRealismAuditWriteRow => ({
    client_id: args.clientId,
    tenant_key: args.tenantKey,
    object_type: 'vendor',
    object_key: row.logical_vendor_key,
    source_value_usd: row.contract_value_usd,
    recomputed_value_usd: null,
    benchmark_unit_price_usd: null,
    seat_count: null,
    amount_type: row.amount_type,
    verdict: row.amount_type === 'unknown' ? 'gap_amount_type' : 'directional_only',
    rule_key: row.is_duplicate_rollup ? 'tower.vendor_dedup_rollup' : 'tower.amount_type_required',
    notes: row.is_duplicate_rollup
      ? `Collapsed ${row.duplicate_raw_row_count} raw vendor rows into one logical vendor.`
      : 'Vendor amount is classified but not yet benchmark-reconciled in this slice.',
    lineage: row.lineage,
  }));

  return [...initiativeRows, ...vendorRows];
}

function forbiddenIdentifiersForTenant(tenantKey: string): TowerForbiddenIdentifierWriteRow[] {
  if (tenantKey !== 'lakeshore-holdings') return [];
  return ['Morgan Street', 'Chicago'].map((identifier) => ({
    tenant_key: tenantKey,
    identifier,
    identifier_type: 'client_identity',
    severity: 'critical',
    active: true,
    reason: 'Gate B: Lakeshore illustrative demo must not expose or imply the real-client identity.',
  }));
}

export function buildTowerMaterializationPlan(args: {
  clientId: string;
  tenantKey: string;
  projected: ProjectedTowerReadModel;
}): TowerMaterializationPlan {
  const tenantKey = canonicalizeTowerTenantKey(args.tenantKey);
  const initiatives = buildInitiativeRows({
    clientId: args.clientId,
    tenantKey,
    source: args.projected.source,
    initiatives: args.projected.initiatives,
  });
  const vendors = buildVendorRows({
    clientId: args.clientId,
    tenantKey,
    source: args.projected.source,
    vendors: args.projected.vendors,
  });
  const gaps = initiativeGapRows({
    clientId: args.clientId,
    tenantKey,
    initiatives: args.projected.initiatives,
  });
  const spendRealismAudit = buildSpendAuditRows({
    clientId: args.clientId,
    tenantKey,
    initiatives,
    vendors,
  });

  return {
    clientId: args.clientId,
    tenantKey,
    source: args.projected.source,
    initiatives,
    vendors,
    gaps,
    spendRealismAudit,
    forbiddenIdentifiers: forbiddenIdentifiersForTenant(tenantKey),
    summary: {
      initiativeInputCount: args.projected.initiatives.length,
      vendorInputCount: args.projected.vendors.length,
      vendorOutputCount: vendors.length,
      duplicateVendorGroups: vendors.filter((vendor) => vendor.is_duplicate_rollup).length,
      gaps: gaps.length,
      outliersWithheld: spendRealismAudit.filter((row) => row.verdict === 'outlier_withheld').length,
    },
  };
}

async function upsertRows<T extends object>(
  db: PostgresCompatClient,
  table: string,
  rows: readonly T[],
  onConflict: string,
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, count } = await db
    .from(table)
    .upsert(serializeJsonbColumnsForTowerWrite(table, rows), { onConflict })
    .select('id');
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return count ?? rows.length;
}

const JSONB_COLUMNS_BY_TABLE: Readonly<Record<string, readonly string[]>> = {
  tower_read_model_initiatives: ['citations', 'lineage', 'gaps'],
  tower_read_model_vendors: ['citations', 'lineage', 'gaps'],
  tower_gap_register: ['lineage'],
  tower_spend_realism_audit: ['lineage'],
};

function serializeJsonbColumnsForTowerWrite<T extends object>(
  table: string,
  rows: readonly T[],
): Array<Record<string, unknown>> {
  const jsonbColumns = JSONB_COLUMNS_BY_TABLE[table] ?? [];

  return rows.map((row) => {
    const next: Record<string, unknown> = Object.fromEntries(Object.entries(row));
    for (const column of jsonbColumns) {
      next[column] = JSON.stringify(next[column] ?? null);
    }
    return next;
  });
}

export async function persistTowerMaterializationPlan(args: {
  db: PostgresCompatClient;
  plan: TowerMaterializationPlan;
}): Promise<{
  initiatives: number;
  vendors: number;
  gaps: number;
  spendRealismAudit: number;
  forbiddenIdentifiers: number;
}> {
  return {
    initiatives: await upsertRows(
      args.db,
      'tower_read_model_initiatives',
      args.plan.initiatives,
      'client_id,initiative_id,period_label',
    ),
    vendors: await upsertRows(
      args.db,
      'tower_read_model_vendors',
      args.plan.vendors,
      'client_id,logical_vendor_key,period_label',
    ),
    gaps: await upsertRows(args.db, 'tower_gap_register', args.plan.gaps, 'client_id,gap_key'),
    spendRealismAudit: await upsertRows(
      args.db,
      'tower_spend_realism_audit',
      args.plan.spendRealismAudit,
      'client_id,object_type,object_key,rule_key',
    ),
    forbiddenIdentifiers: await upsertRows(
      args.db,
      'tower_forbidden_identifiers',
      args.plan.forbiddenIdentifiers,
      'tenant_key,identifier',
    ),
  };
}

export async function buildTowerMaterializationPlanFromUpstream(args: {
  clientId: string;
  tenantKey: string;
}): Promise<TowerMaterializationPlan> {
  const projected = await listProjectedTowerReadModelForClient({
    clientId: args.clientId,
    tenantKey: canonicalizeTowerTenantKey(args.tenantKey),
  });
  return buildTowerMaterializationPlan({
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    projected,
  });
}
