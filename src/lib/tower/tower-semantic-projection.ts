import { azureRead } from '@/lib/data-plane/azureRead';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
  ConfidenceLevel,
  Stage,
  StatusFlag,
} from '@/lib/admin/ai-initiatives/queries';

type JsonRecord = Record<string, unknown>;

interface ContextRecordRow {
  id: string;
  canonical_record_id: string | null;
  record_type: string | null;
  record_subtype: string | null;
  title: string | null;
  source_record_id: string | null;
  source_row_number: number | null;
  payload: JsonRecord | null;
}

interface AiControlInitiativeRow {
  id: string;
  initiative_key: string | null;
  initiative_name: string | null;
  category: string | null;
  stage: string | null;
  business_owner_role: string | null;
  executive_sponsor_role: string | null;
  promised_benefit: string | number | null;
  status_flag: string | null;
  payload: JsonRecord | null;
}

interface AiControlBenefitRow {
  initiative_key: string | null;
  promised_annual_value_usd: string | number | null;
  realized_annual_value_usd: string | number | null;
  readiness_state: string | null;
  evidence_state: string | null;
}

interface AiControlSpendRow {
  id: string;
  initiative_key: string | null;
  vendor: string | null;
  product_or_service: string | null;
  annualized_spend_usd: string | number | null;
  renewal_date: string | Date | null;
  evidence_state: string | null;
}

interface AiControlRiskRow {
  initiative_key: string | null;
  dimension: string | null;
  severity: string | null;
  status: string | null;
  risk_description: string | null;
  owner_role: string | null;
  governance_gate: string | null;
}

export interface ProjectedTowerReadModel {
  source: 'enterprise_context_records' | 'ai_control_tower' | 'empty';
  initiatives: AIInitiative[];
  vendors: AIInitiativeVendorRow[];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function displayText(value: unknown, fallback = ''): string {
  const raw = text(value);
  return raw || fallback;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,]/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = text(value);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? raw : new Date(parsed).toISOString().slice(0, 10);
}

function normalizeStage(value: unknown): Stage {
  const raw = text(value).toLowerCase();
  if (raw.includes('scale') || raw.includes('run') || raw.includes('live') || raw.includes('operate')) return 'scaled';
  if (raw.includes('sunset') || raw.includes('retire')) return 'sunset';
  if (raw.includes('move') || raw.includes('build') || raw.includes('implement')) return 'in_strategic_move';
  if (raw.includes('multi') || raw.includes('transform')) return 'multi_year_strategic_bet';
  return 'pilot';
}

function normalizeStatus(value: unknown, riskValue?: unknown): StatusFlag {
  const raw = `${text(value)} ${text(riskValue)}`.toLowerCase();
  if (raw.includes('duplicate') || raw.includes('overlap')) return 'duplication_risk';
  if (raw.includes('cost') || raw.includes('overrun') || raw.includes('budget')) return 'cost_overrun';
  if (raw.includes('adoption')) return 'adoption_gap';
  if (raw.includes('blocked') || raw.includes('critical') || raw.includes('fail')) return 'stalled';
  if (raw.includes('high') || raw.includes('lag') || raw.includes('watch') || raw.includes('review')) return 'value_lag';
  if (raw.includes('foundation')) return 'foundation_phase';
  if (raw.includes('move')) return 'in_move';
  return 'healthy';
}

function confidenceFromRisk(value: unknown): ConfidenceLevel {
  const raw = text(value).toLowerCase();
  if (raw.includes('critical') || raw.includes('high') || raw.includes('source') || raw.includes('usable')) return 'HIGH';
  if (raw.includes('low') || raw.includes('missing') || raw.includes('review')) return 'LOW';
  return 'MED';
}

function firstByKey<T>(
  rows: readonly T[],
  keyFn: (row: T) => string,
): Map<string, T> {
  const out = new Map<string, T>();
  for (const row of rows) {
    const key = keyFn(row);
    if (key && !out.has(key)) out.set(key, row);
  }
  return out;
}

function sumByKey<T>(
  rows: readonly T[],
  keyFn: (row: T) => string,
  valueFn: (row: T) => number | null,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    const value = valueFn(row);
    if (!key || value === null) continue;
    out.set(key, (out.get(key) ?? 0) + value);
  }
  return out;
}

function asInitiative(args: {
  initiativeId: string;
  displayId: string;
  name: string;
  description: string;
  category: string;
  stage: Stage;
  stageDetail: string | null;
  ownerRole: string;
  committedUsd: number | null;
  measuredUsd: number | null;
  statusFlag: StatusFlag;
  statusSummary: string;
  confidenceLevel: ConfidenceLevel;
  loadedViaTemplate: string;
}): AIInitiative {
  const ownerRole = args.ownerRole || 'Loaded owner role';
  return {
    initiativeId: args.initiativeId,
    displayId: args.displayId,
    name: args.name,
    description: args.description,
    primaryCategoryId: args.category || 'it_portfolio',
    primaryCategoryName: args.category || 'IT portfolio',
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: 'tower_it_portfolio',
    primaryGoalName: 'IT portfolio value and control',
    stage: args.stage,
    stageDetail: args.stageDetail,
    ownerName: ownerRole,
    ownerTitle: ownerRole,
    ownerFunction: args.category || null,
    committedAnnualUsd: args.committedUsd,
    committedTotalUsd: args.committedUsd,
    measuredValueUsd: args.measuredUsd,
    statusFlag: args.statusFlag,
    statusSummary: args.statusSummary,
    confidenceLevel: args.confidenceLevel,
    alignedCallout: args.statusFlag === 'healthy' || args.statusFlag === 'in_move',
    alignedRationale: null,
    loadedViaTemplate: args.loadedViaTemplate,
  };
}

export function projectContextRecordsToTowerReadModel(args: {
  initiativeRows: readonly ContextRecordRow[];
  vendorRows: readonly ContextRecordRow[];
}): ProjectedTowerReadModel {
  const initiatives = args.initiativeRows.map((row, index) => {
    const payload = row.payload ?? {};
    const key = displayText(payload.initiative_id, row.source_record_id ?? `IT-INIT-${index + 1}`);
    const name = displayText(payload.initiative_name, row.title ?? key);
    const risk = payload.risk_status;
    const dependency = displayText(payload.dependency);
    const statusFlag = normalizeStatus(risk, risk);
    const statusSummary = [
      dependency ? `Dependency: ${dependency}.` : '',
      risk ? `Risk status: ${String(risk)}.` : '',
      payload.move_relevance ? `Move relevance: ${String(payload.move_relevance)}.` : '',
    ].filter(Boolean).join(' ') || 'Loaded from the tenant IT initiatives portfolio.';

    return asInitiative({
      initiativeId: `enterprise_context:${row.id}`,
      displayId: key,
      name,
      description: statusSummary,
      category: displayText(payload.business_area, 'IT portfolio'),
      stage: normalizeStage(payload.stage),
      stageDetail: displayText(payload.stage) || null,
      ownerRole: displayText(payload.owner_role, 'Portfolio owner role'),
      committedUsd: num(payload.budget_usd),
      measuredUsd: null,
      statusFlag,
      statusSummary,
      confidenceLevel: confidenceFromRisk(risk),
      loadedViaTemplate: 'enterprise_context_initiatives_portfolio',
    });
  });

  const fallbackInitiative = initiatives[0] ?? null;
  const vendors = args.vendorRows.map((row, index): AIInitiativeVendorRow => {
    const payload = row.payload ?? {};
    const initiative = fallbackInitiative;
    const risk = text(payload.commercial_risk).toLowerCase();
    const health: AIInitiativeVendorRow['financialHealth'] =
      risk.includes('high') || risk.includes('implementation') || risk.includes('risk')
        ? 'watch'
        : 'moderate';
    return {
      vendorId: displayText(payload.vendor_id, row.source_record_id ?? `vendor-${index + 1}`),
      initiativeId: initiative?.initiativeId ?? 'enterprise_context:portfolio',
      initiativeDisplayId: initiative?.displayId ?? 'IT-PORTFOLIO',
      initiativeName: initiative?.name ?? 'IT portfolio',
      vendorName: displayText(payload.vendor_name, row.title ?? `Vendor ${index + 1}`),
      contractValueUsd: num(payload.annual_contract_value_usd),
      renewalDate: isoDate(payload.renewal_date),
      financialHealth: health,
    };
  });

  return {
    source: initiatives.length > 0 || vendors.length > 0 ? 'enterprise_context_records' : 'empty',
    initiatives,
    vendors: vendors.filter((vendor) => vendor.vendorName),
  };
}

export function projectAiControlRowsToTowerReadModel(args: {
  initiativeRows: readonly AiControlInitiativeRow[];
  benefitRows: readonly AiControlBenefitRow[];
  spendRows: readonly AiControlSpendRow[];
  riskRows: readonly AiControlRiskRow[];
}): ProjectedTowerReadModel {
  const benefitPromised = sumByKey(args.benefitRows, (row) => text(row.initiative_key), (row) => num(row.promised_annual_value_usd));
  const benefitRealized = sumByKey(args.benefitRows, (row) => text(row.initiative_key), (row) => num(row.realized_annual_value_usd));
  const spendAnnualized = sumByKey(args.spendRows, (row) => text(row.initiative_key), (row) => num(row.annualized_spend_usd));
  const riskByInitiative = firstByKey(args.riskRows, (row) => text(row.initiative_key));

  const knownKeys = new Set<string>();
  for (const row of args.initiativeRows) if (text(row.initiative_key)) knownKeys.add(text(row.initiative_key));
  for (const row of args.benefitRows) if (text(row.initiative_key)) knownKeys.add(text(row.initiative_key));
  for (const row of args.spendRows) if (text(row.initiative_key)) knownKeys.add(text(row.initiative_key));
  for (const row of args.riskRows) if (text(row.initiative_key)) knownKeys.add(text(row.initiative_key));

  const sourceByKey = firstByKey(args.initiativeRows, (row) => text(row.initiative_key));
  const initiatives = [...knownKeys].map((key, index) => {
    const row = sourceByKey.get(key);
    const risk = riskByInitiative.get(key);
    const committed = spendAnnualized.get(key) ?? benefitPromised.get(key) ?? null;
    const measured = benefitRealized.get(key) ?? null;
    const statusFlag = normalizeStatus(row?.status_flag, risk?.severity ?? risk?.governance_gate ?? risk?.status);
    const riskSentence = risk
      ? `Risk: ${risk.risk_description ?? risk.dimension ?? 'loaded risk item'}${risk.severity ? ` (${risk.severity})` : ''}.`
      : '';
    const benefitSentence = benefitPromised.has(key) || benefitRealized.has(key)
      ? `Benefit evidence: promised ${benefitPromised.get(key) ?? 'not loaded'}, realized ${benefitRealized.get(key) ?? 'not loaded'}.`
      : 'Benefit evidence is not loaded in the Tower-control rows.';

    return asInitiative({
      initiativeId: `ai_control:${key}`,
      displayId: key || `TWR-INIT-${index + 1}`,
      name: displayText(row?.initiative_name, key || `Tower initiative ${index + 1}`),
      description: displayText(row?.promised_benefit, risk?.risk_description ?? 'Loaded from Tower-control rows.'),
      category: displayText(row?.category, risk?.dimension ?? 'Tower portfolio'),
      stage: normalizeStage(row?.stage),
      stageDetail: displayText(row?.stage) || null,
      ownerRole: displayText(row?.business_owner_role, risk?.owner_role ?? row?.executive_sponsor_role ?? 'Portfolio owner role'),
      committedUsd: committed,
      measuredUsd: measured,
      statusFlag,
      statusSummary: [riskSentence, benefitSentence].filter(Boolean).join(' '),
      confidenceLevel: confidenceFromRisk(risk?.severity ?? row?.status_flag),
      loadedViaTemplate: 'ai_control_tower_projection',
    });
  });

  const initiativeByKey = new Map(initiatives.map((initiative) => [initiative.displayId, initiative] as const));
  const vendors = args.spendRows.map((row, index): AIInitiativeVendorRow => {
    const initiative = initiativeByKey.get(text(row.initiative_key));
    return {
      vendorId: row.id ?? `ai-control-spend-${index + 1}`,
      initiativeId: initiative?.initiativeId ?? `ai_control:${text(row.initiative_key) || 'portfolio'}`,
      initiativeDisplayId: initiative?.displayId ?? (text(row.initiative_key) || 'IT-PORTFOLIO'),
      initiativeName: initiative?.name ?? (text(row.initiative_key) || 'IT portfolio'),
      vendorName: displayText(row.vendor, row.product_or_service ?? `Vendor ${index + 1}`),
      contractValueUsd: num(row.annualized_spend_usd),
      renewalDate: isoDate(row.renewal_date),
      financialHealth: row.evidence_state === 'review_required' ? 'watch' : 'moderate',
    };
  });

  return {
    source: initiatives.length > 0 || vendors.length > 0 ? 'ai_control_tower' : 'empty',
    initiatives,
    vendors: vendors.filter((vendor) => vendor.vendorName),
  };
}

export async function listProjectedTowerReadModelForClient(args: {
  clientId: string;
  tenantKey: string | null;
}): Promise<ProjectedTowerReadModel> {
  const tenantAliases = [
    args.tenantKey,
    args.tenantKey?.replace(/-/g, ''),
    args.tenantKey === 'lakeshore' ? 'lakeshore-industries' : null,
    args.tenantKey === 'lakeshore' ? 'lakeshore-holdings' : null,
  ].filter((value): value is string => Boolean(value));

  const [initiativeRows, vendorRows] = await Promise.all([
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND (record_type = 'initiatives_portfolio'
            OR record_subtype = 'initiatives-portfolio'
            OR source_file ILIKE '%F13_initiatives-portfolio%')
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 100`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND (record_type = 'vendors_contracts_licenses'
            OR record_subtype = 'vendors-contracts-licenses'
            OR source_file ILIKE '%F11_vendors-contracts-licenses%')
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 100`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
  ]);

  const contextProjection = projectContextRecordsToTowerReadModel({ initiativeRows, vendorRows });
  if (contextProjection.initiatives.length > 0 || contextProjection.vendors.length > 0) {
    return contextProjection;
  }

  const refreshRun = await azureRead.maybeSingle<{ id: string }>({
    table: 'ai_control_refresh_runs',
    columns: ['id'],
    where: { client_id: args.clientId },
    orderBy: { column: 'reporting_period_end', direction: 'desc', nulls: 'last' },
    missingTable: 'empty',
  }).catch(() => null);

  if (!refreshRun?.id) return { source: 'empty', initiatives: [], vendors: [] };

  const [aiControlInitiatives, benefits, spend, risks] = await Promise.all([
    azureRead.select<AiControlInitiativeRow>({
      table: 'ai_control_initiatives',
      columns: ['id', 'initiative_key', 'initiative_name', 'category', 'stage', 'business_owner_role', 'executive_sponsor_role', 'promised_benefit', 'status_flag', 'payload'],
      where: { refresh_run_id: refreshRun.id },
      missingTable: 'empty',
    }),
    azureRead.select<AiControlBenefitRow>({
      table: 'ai_control_benefit_realization',
      columns: ['initiative_key', 'promised_annual_value_usd', 'realized_annual_value_usd', 'readiness_state', 'evidence_state'],
      where: { refresh_run_id: refreshRun.id },
      missingTable: 'empty',
    }),
    azureRead.select<AiControlSpendRow>({
      table: 'ai_control_spend_contracts',
      columns: ['id', 'initiative_key', 'vendor', 'product_or_service', 'annualized_spend_usd', 'renewal_date', 'evidence_state'],
      where: { refresh_run_id: refreshRun.id },
      missingTable: 'empty',
    }),
    azureRead.select<AiControlRiskRow>({
      table: 'ai_control_risk_governance',
      columns: ['initiative_key', 'dimension', 'severity', 'status', 'risk_description', 'owner_role', 'governance_gate'],
      where: { refresh_run_id: refreshRun.id },
      missingTable: 'empty',
    }),
  ]);

  return projectAiControlRowsToTowerReadModel({
    initiativeRows: aiControlInitiatives,
    benefitRows: benefits,
    spendRows: spend,
    riskRows: risks,
  });
}
