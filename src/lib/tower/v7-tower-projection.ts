import { azureRead } from '@/lib/data-plane/azureRead';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
  ConfidenceLevel,
  Stage,
  StatusFlag,
} from '@/lib/admin/ai-initiatives/queries';
import {
  formatCioTowerMoney,
  toCioTowerMetricPacket,
  type CioTowerMetricPacket,
} from '@/lib/cio-tower/metric-packet';

type JsonRecord = Record<string, unknown>;

interface V7TowerRecordRow {
  dimension_key: string;
  record_key: string;
  record_name: string | null;
  source_file: string | null;
  source_row_number: number | null;
  as_of_date: string | null;
  period_end: string | null;
  source_artifact_name: string | null;
  source_validation_status: string | null;
  values_json: JsonRecord | null;
}

export interface V7TowerProjection {
  tenantKey: string | null;
  source: 'intelligence_v7' | 'empty';
  initiatives: AIInitiative[];
  vendors: AIInitiativeVendorRow[];
  metricPackets: CioTowerMetricPacket[];
}

const V7_TENANT_BY_ALIAS: Record<string, string> = {
  apex: 'apex-retail',
  apexretail: 'apex-retail',
  'apex-retail': 'apex-retail',
  'apex-retail-group': 'apex-retail',
  arcturus: 'first-capital-financial',
  firstcapital: 'first-capital-financial',
  'first-capital': 'first-capital-financial',
  'first-capital-financial': 'first-capital-financial',
  lakeshore: 'lakeshore-industries',
  'lakeshore-holdings': 'lakeshore-industries',
  'lakeshore-industries': 'lakeshore-industries',
  meridian: 'meridian-health',
  'meridian-health': 'meridian-health',
  skyharbor: 'skyharbor-air',
  'skyharbor-air': 'skyharbor-air',
};

const V7_TOWER_DIMENSIONS = [
  'v7_07_vendors_contracts',
  'v7_08_spend_value',
  'v7_09_programs_initiatives_business_priorities',
  'v7_10_ai_initiatives',
  'v7_11_operations_risk_controls',
] as const;

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function canonicalV7TowerTenantKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = normalizeAlias(value);
  const compact = normalized.replace(/-/g, '');
  return V7_TENANT_BY_ALIAS[normalized] ?? V7_TENANT_BY_ALIAS[compact] ?? null;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,%]/g, '').replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstText(payload: JsonRecord, keys: readonly string[], fallback = ''): string {
  for (const key of keys) {
    const value = text(payload[key]);
    if (value) return value;
  }
  return fallback;
}

function firstNumber(payload: JsonRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = num(payload[key]);
    if (value !== null) return value;
  }
  return null;
}

function isoDate(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? raw : new Date(parsed).toISOString().slice(0, 10);
}

function normalizeStage(value: unknown): Stage {
  const raw = text(value).toLowerCase();
  if (raw === 'scaled' || raw === 'pilot' || raw === 'sunset') return raw;
  if (raw === 'in_strategic_move' || raw === 'multi_year_strategic_bet') return raw;
  if (/scale|live|run|operate|production/.test(raw)) return 'scaled';
  if (/sunset|retire|decommission/.test(raw)) return 'sunset';
  if (/build|implement|move|mobiliz/.test(raw)) return 'in_strategic_move';
  if (/transform|multi/.test(raw)) return 'multi_year_strategic_bet';
  return 'pilot';
}

function normalizeStatus(value: unknown): StatusFlag {
  const raw = text(value).toLowerCase();
  if (
    raw === 'healthy' ||
    raw === 'in_move' ||
    raw === 'value_lag' ||
    raw === 'stalled' ||
    raw === 'adoption_gap' ||
    raw === 'cost_overrun' ||
    raw === 'duplication_risk' ||
    raw === 'foundation_phase'
  ) {
    return raw;
  }
  if (/duplicate|overlap/.test(raw)) return 'duplication_risk';
  if (/cost|overrun|budget|variance/.test(raw)) return 'cost_overrun';
  if (/adoption|usage/.test(raw)) return 'adoption_gap';
  if (/blocked|critical|fail|hold/.test(raw)) return 'stalled';
  if (/lag|watch|review|gap|risk/.test(raw)) return 'value_lag';
  if (/foundation|readiness|certif/.test(raw)) return 'foundation_phase';
  if (/move|build/.test(raw)) return 'in_move';
  return 'healthy';
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  const raw = text(value).toUpperCase();
  if (raw === 'HIGH' || raw === 'MED' || raw === 'LOW') return raw;
  if (raw.includes('HIGH')) return 'HIGH';
  if (raw.includes('LOW')) return 'LOW';
  return 'MED';
}

function readPayload(row: V7TowerRecordRow): JsonRecord {
  return row.values_json && typeof row.values_json === 'object' ? row.values_json : {};
}

function normalizeDimensionKey(value: unknown): string {
  return text(value).toLowerCase();
}

async function readV7TowerRecords(tenantKey: string): Promise<V7TowerRecordRow[]> {
  const rows = await azureRead.query<V7TowerRecordRow>(
    `select lower(r.dimension_key) as dimension_key, r.record_key, r.record_name, r.source_file,
       r.source_row_number, r.source_as_of_date as as_of_date, null::date as period_end,
       r.source_artifact_name, r.source_validation_status, r.values_json
     from intelligence_v7.business_records r
     join intelligence_v7.tenant_pack_runs run
       on run.tenant_key = r.tenant_key
      and run.contract_version = r.contract_version
      and run.run_key = r.run_key
     join intelligence_v7.active_tenant_contract_versions active
       on active.tenant_key = run.tenant_key
      and active.active_contract_version = run.contract_version
      and active.promotion_status = 'active'
     where r.tenant_key = $1
       and run.load_status in ('loaded', 'validated')
       and lower(r.dimension_key) = any($2::text[])
       and coalesce(r.fact_status, 'active') = 'active'
     order by r.dimension_key, r.source_row_number nulls last, r.record_key
     limit 1200`,
    [tenantKey, [...V7_TOWER_DIMENSIONS]],
    { missingTable: 'empty' },
  ).catch(() => []);
  return rows.map((row) => ({
    ...row,
    dimension_key: normalizeDimensionKey(row.dimension_key),
  }));
}

function initiativeFromProgram(row: V7TowerRecordRow): AIInitiative {
  const payload = readPayload(row);
  const id = firstText(payload, ['program_id', 'initiative_id', 'priority_id', 'record_id'], row.record_key);
  const name = firstText(payload, ['program_name', 'initiative_name', 'priority_name', 'name'], text(row.record_name, id));
  const budget = firstNumber(payload, ['budget_usd', 'approved_budget_usd', 'committed_budget_usd', 'committed_value_usd']);
  const measured = firstNumber(payload, ['realized_value_usd', 'measured_value_usd', 'finance_attested_value_usd']);
  const expected = firstNumber(payload, ['expected_value_usd', 'target_value_usd', 'business_case_value_usd']);
  return {
    initiativeId: id,
    displayId: id,
    name,
    description: firstText(payload, ['target_outcome', 'business_case_summary', 'value_basis'], 'Loaded from V7 programs and business priorities.'),
    primaryCategoryId: normalizeAlias(firstText(payload, ['business_function', 'function_name', 'service_tower_or_function'], 'portfolio')),
    primaryCategoryName: firstText(payload, ['business_function', 'function_name', 'service_tower_or_function'], 'Portfolio'),
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: 'v7_business_value',
    primaryGoalName: firstText(payload, ['priority_type', 'category', 'program_type'], 'Business value'),
    stage: normalizeStage(firstText(payload, ['phase', 'current_status', 'status', 'stage_gate'])),
    stageDetail: firstText(payload, ['current_status', 'phase', 'status']) || null,
    ownerName: firstText(payload, ['business_owner', 'business_sponsor', 'sponsor'], 'Loaded owner role'),
    ownerTitle: firstText(payload, ['business_owner', 'business_sponsor', 'sponsor'], 'Loaded owner role'),
    ownerFunction: firstText(payload, ['business_function', 'function_name', 'service_tower_or_function']) || null,
    committedAnnualUsd: budget,
    committedTotalUsd: expected ?? budget,
    measuredValueUsd: measured,
    statusFlag: normalizeStatus(firstText(payload, ['decision_needed', 'status', 'current_status', 'risk_status'])),
    statusSummary: firstText(payload, ['decision_needed', 'status', 'current_status'], 'Loaded from V7 programs and priorities.'),
    confidenceLevel: normalizeConfidence(firstText(payload, ['confidence', 'source_validation_status'], row.source_validation_status ?? 'MED')),
    alignedCallout: Boolean(measured && measured > 0),
    alignedRationale: measured && measured > 0 ? 'V7 contains measured value for this program.' : null,
    loadedViaTemplate: 'intelligence_v7_programs_business_priorities',
    portfolioCompany: firstText(payload, ['portfolio_company', 'entity_name', 'business_unit']) || null,
    operatingCompany: firstText(payload, ['operating_company', 'entity_name']) || null,
    legalEntity: firstText(payload, ['legal_entity']) || null,
    businessUnit: firstText(payload, ['business_unit', 'entity_name']) || null,
    businessFunction: firstText(payload, ['business_function', 'function_name', 'service_tower_or_function']) || null,
  };
}

function initiativeFromAi(row: V7TowerRecordRow): AIInitiative {
  const payload = readPayload(row);
  const id = firstText(payload, ['ai_initiative_id', 'initiative_id', 'use_case_id', 'record_id'], row.record_key);
  const name = firstText(payload, ['ai_use_case', 'use_case', 'initiative_name', 'agent_or_copilot_name'], text(row.record_name, id));
  const promised = firstNumber(payload, ['value_hypothesis_usd', 'expected_value_usd']);
  const measured = firstNumber(payload, ['measured_value_usd', 'realized_value_usd']);
  const spend = firstNumber(payload, ['annual_spend_usd', 'budget_usd', 'monthly_spend_usd']);
  const committedAnnual = payload.monthly_spend_usd ? (spend ?? 0) * 12 : spend;
  return {
    initiativeId: id,
    displayId: id,
    name,
    description: firstText(payload, ['value_hypothesis', 'target_outcome', 'business_process'], 'Loaded from V7 AI initiatives.'),
    primaryCategoryId: 'ai_initiative',
    primaryCategoryName: 'AI initiative',
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: normalizeAlias(firstText(payload, ['business_function_ref', 'business_process', 'user_group'], 'ai_value')),
    primaryGoalName: firstText(payload, ['business_function_ref', 'business_process', 'user_group'], 'AI value'),
    stage: normalizeStage(firstText(payload, ['production_status', 'stage'])),
    stageDetail: firstText(payload, ['production_status', 'data_readiness']) || null,
    ownerName: firstText(payload, ['business_owner', 'user_group', 'sponsor'], 'Loaded owner role'),
    ownerTitle: firstText(payload, ['business_owner', 'user_group', 'sponsor'], 'Loaded owner role'),
    ownerFunction: firstText(payload, ['business_function_ref', 'business_process', 'user_group']) || null,
    committedAnnualUsd: committedAnnual && committedAnnual > 0 ? committedAnnual : null,
    committedTotalUsd: promised,
    measuredValueUsd: measured,
    statusFlag: normalizeStatus(firstText(payload, ['scale_hold_stop_recommendation', 'scale_hold_stop', 'decision_needed', 'risk_status', 'data_readiness'])),
    statusSummary: firstText(payload, ['scale_hold_stop_recommendation', 'scale_hold_stop', 'decision_needed', 'data_readiness'], 'Loaded from V7 AI initiative record.'),
    confidenceLevel: normalizeConfidence(firstText(payload, ['confidence'], row.source_validation_status ?? 'MED')),
    alignedCallout: Boolean(measured && measured > 0),
    alignedRationale: measured && measured > 0 ? 'V7 contains measured value for this AI initiative.' : null,
    loadedViaTemplate: 'intelligence_v7_ai_initiatives',
    portfolioCompany: firstText(payload, ['portfolio_company', 'entity_name', 'business_unit']) || null,
    operatingCompany: firstText(payload, ['operating_company', 'entity_name']) || null,
    legalEntity: firstText(payload, ['legal_entity']) || null,
    businessUnit: firstText(payload, ['business_unit', 'entity_name']) || null,
    businessFunction: firstText(payload, ['business_function_ref', 'business_process', 'user_group']) || null,
  };
}

function initiativeFromSpend(row: V7TowerRecordRow): AIInitiative | null {
  const payload = readPayload(row);
  const amount = firstNumber(payload, ['amount_usd', 'annualized_spend_usd', 'annual_cost_usd', 'budget_usd']);
  if (amount === null || amount <= 0) return null;
  const program = firstText(payload, ['program_ref', 'program_name', 'initiative_name'], 'IT spend portfolio');
  const tower = firstText(payload, ['service_tower_or_function', 'business_function', 'function_name'], 'Portfolio');
  const vendor = firstText(payload, ['vendor_ref', 'vendor_name', 'supplier_name']);
  const system = firstText(payload, ['system_ref', 'system_name', 'application_name']);
  const id = firstText(
    payload,
    ['spend_id', 'initiative_id', 'program_id', 'record_id'],
    row.record_key,
  );
  const nameParts = [program, tower, vendor || system].filter(Boolean);
  return {
    initiativeId: id,
    displayId: id,
    name: nameParts.join(' · '),
    description: firstText(
      payload,
      ['value_linkage', 'unit_economics', 'allocation_basis'],
      'Loaded from V7 spend and value ledger.',
    ),
    primaryCategoryId: normalizeAlias(tower),
    primaryCategoryName: tower,
    secondaryCategoryId: normalizeAlias(firstText(payload, ['spend_category', 'amount_type'], 'spend')),
    secondaryCategoryName: firstText(payload, ['spend_category', 'amount_type'], 'Spend'),
    primaryGoalId: normalizeAlias(program),
    primaryGoalName: program,
    stage: normalizeStage(firstText(payload, ['run_change', 'program_ref', 'amount_type'])),
    stageDetail: firstText(payload, ['run_change', 'capex_opex', 'finance_validation_status']) || null,
    ownerName: firstText(payload, ['spend_owner', 'business_owner', 'commercial_owner'], 'Loaded owner role'),
    ownerTitle: firstText(payload, ['spend_owner', 'business_owner', 'commercial_owner'], 'Loaded owner role'),
    ownerFunction: tower,
    committedAnnualUsd: amount,
    committedTotalUsd: amount,
    measuredValueUsd: null,
    statusFlag: normalizeStatus(firstText(payload, ['finance_validation_status', 'known_gaps', 'run_change'])),
    statusSummary: firstText(
      payload,
      ['finance_validation_status', 'value_linkage', 'known_gaps'],
      'Loaded from V7 spend and value ledger.',
    ),
    confidenceLevel: normalizeConfidence(firstText(payload, ['source_validation_status', 'finance_validation_status'], row.source_validation_status ?? 'MED')),
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: 'intelligence_v7_spend_value',
    portfolioCompany: firstText(payload, ['portfolio_company', 'entity_name', 'business_unit']) || null,
    operatingCompany: firstText(payload, ['operating_company', 'entity_name']) || null,
    legalEntity: firstText(payload, ['legal_entity']) || null,
    businessUnit: firstText(payload, ['business_unit', 'entity_name']) || null,
    businessFunction: tower,
  };
}

function vendorFromContract(row: V7TowerRecordRow, fallback?: AIInitiative): AIInitiativeVendorRow | null {
  const payload = readPayload(row);
  const vendor = firstText(payload, ['vendor_name', 'supplier_name', 'vendor', 'vendor_ref'], text(row.record_name));
  if (!vendor) return null;
  const id = firstText(payload, ['contract_id', 'vendor_id', 'supplier_id'], row.record_key);
  return {
    vendorId: id,
    vendorName: vendor,
    initiativeId: firstText(payload, ['initiative_id', 'program_id'], fallback?.initiativeId ?? 'v7-portfolio'),
    initiativeDisplayId: firstText(payload, ['initiative_id', 'program_id'], fallback?.displayId ?? 'V7-PORTFOLIO'),
    initiativeName: firstText(payload, ['program_name', 'initiative_name', 'service', 'contract_name'], fallback?.name ?? 'V7 portfolio'),
    contractValueUsd: firstNumber(payload, ['annual_cost_usd', 'annualized_spend_usd', 'contract_value_usd', 'amount_usd']),
    renewalDate: isoDate(firstText(payload, ['renewal_date', 'renewal_or_gate_date', 'expiration_date'])),
    financialHealth: normalizeStatus(firstText(payload, ['risk_status', 'vendor_health', 'financial_health'])) === 'healthy' ? 'strong' : 'watch',
  };
}

function buildMetricPackets(initiatives: readonly AIInitiative[], vendors: readonly AIInitiativeVendorRow[]): CioTowerMetricPacket[] {
  const initiativeBudget = initiatives.reduce((sum, row) => sum + (row.committedAnnualUsd ?? 0), 0);
  const promisedValue = initiatives.reduce((sum, row) => sum + (row.committedTotalUsd ?? 0), 0);
  const measuredValue = initiatives.reduce((sum, row) => sum + (row.measuredValueUsd ?? 0), 0);
  const vendorExposure = vendors.reduce((sum, row) => sum + (row.contractValueUsd ?? 0), 0);
  const rows = [
    {
      measure_key: 'initiative_budget_fy26',
      label: 'Committed value',
      description: 'V7-derived initiative budget envelope.',
      period: 'FY26',
      basis: 'v7_runtime_projection',
      scope: 'tenant',
      value_numeric: initiativeBudget || null,
      value_json: { row_count: initiatives.filter((row) => (row.committedAnnualUsd ?? 0) > 0).length, source: 'intelligence_v7' },
      source_fact_keys: [],
      formula_version: 'intelligence_v7_runtime_projection_v1',
    },
    {
      measure_key: 'promised_value_fy26',
      label: 'Promised value',
      description: 'V7-derived business-case value envelope.',
      period: 'FY26',
      basis: 'v7_runtime_projection',
      scope: 'tenant',
      value_numeric: promisedValue || null,
      value_json: { row_count: initiatives.filter((row) => (row.committedTotalUsd ?? 0) > 0).length, source: 'intelligence_v7' },
      source_fact_keys: [],
      formula_version: 'intelligence_v7_runtime_projection_v1',
    },
    {
      measure_key: 'measured_value_ytd',
      label: 'Proven value',
      description: 'V7-derived measured or finance-attested value.',
      period: 'YTD',
      basis: 'v7_runtime_projection',
      scope: 'tenant',
      value_numeric: measuredValue || null,
      value_json: { row_count: initiatives.filter((row) => (row.measuredValueUsd ?? 0) > 0).length, source: 'intelligence_v7' },
      source_fact_keys: [],
      formula_version: 'intelligence_v7_runtime_projection_v1',
    },
    {
      measure_key: 'vendor_contract_exposure',
      label: 'Vendor contract exposure',
      description: 'V7-derived named vendor annual exposure.',
      period: 'FY26',
      basis: 'v7_runtime_projection',
      scope: 'tenant',
      value_numeric: vendorExposure || null,
      value_json: { row_count: vendors.filter((row) => (row.contractValueUsd ?? 0) > 0).length, source: 'intelligence_v7' },
      source_fact_keys: [],
      formula_version: 'intelligence_v7_runtime_projection_v1',
    },
  ];
  return rows.map(toCioTowerMetricPacket);
}

export async function loadV7TowerProjection(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
}): Promise<V7TowerProjection> {
  const tenantKey = Array.from(
    new Set(args.tenantKeyCandidates.map(canonicalV7TowerTenantKey).filter((value): value is string => Boolean(value))),
  )[0] ?? null;
  if (!tenantKey) return { tenantKey: null, source: 'empty', initiatives: [], vendors: [], metricPackets: [] };
  const records = await readV7TowerRecords(tenantKey);
  if (records.length === 0) return { tenantKey, source: 'empty', initiatives: [], vendors: [], metricPackets: [] };

  const initiatives = records
    .filter((row) => row.dimension_key === 'v7_09_programs_initiatives_business_priorities')
    .map(initiativeFromProgram);
  const aiInitiatives = records
    .filter((row) => row.dimension_key === 'v7_10_ai_initiatives')
    .map(initiativeFromAi);
  const spendInitiatives = records
    .filter((row) => row.dimension_key === 'v7_08_spend_value')
    .map(initiativeFromSpend)
    .filter((row): row is AIInitiative => Boolean(row));
  const initiativeById = new Map<string, AIInitiative>();
  for (const row of [...initiatives, ...aiInitiatives, ...spendInitiatives]) {
    if (!initiativeById.has(row.initiativeId)) initiativeById.set(row.initiativeId, row);
  }
  const mergedInitiatives = Array.from(initiativeById.values());
  const fallback = mergedInitiatives[0];
  const vendors = records
    .filter((row) => row.dimension_key === 'v7_07_vendors_contracts' || row.dimension_key === 'v7_08_spend_value')
    .map((row) => vendorFromContract(row, fallback))
    .filter((row): row is AIInitiativeVendorRow => Boolean(row));
  const metricPackets = buildMetricPackets(mergedInitiatives, vendors);
  return {
    tenantKey,
    source: mergedInitiatives.length > 0 || vendors.length > 0 ? 'intelligence_v7' : 'empty',
    initiatives: mergedInitiatives,
    vendors,
    metricPackets,
  };
}

export function summarizeV7ProjectionForDisclosure(projection: V7TowerProjection): string {
  if (projection.source !== 'intelligence_v7') return 'No Intelligence V7 Tower projection was available.';
  const committed = projection.metricPackets.find((packet) => packet.measureKey === 'initiative_budget_fy26')?.valueNumeric ?? null;
  const measured = projection.metricPackets.find((packet) => packet.measureKey === 'measured_value_ytd')?.valueNumeric ?? null;
  return `Read from Intelligence V7 (${projection.tenantKey}) with ${projection.initiatives.length} initiative rows, ${projection.vendors.length} vendor rows, ${formatCioTowerMoney(committed)} committed value, and ${formatCioTowerMoney(measured)} measured value.`;
}
