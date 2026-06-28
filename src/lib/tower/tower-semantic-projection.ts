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
  source_file?: string | null;
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

function firstValue(payload: JsonRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = payload[key];
    if (value !== null && value !== undefined && text(value)) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function firstText(payload: JsonRecord, keys: readonly string[], fallback = ''): string {
  return displayText(firstValue(payload, keys), fallback);
}

function firstNum(payload: JsonRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = num(payload[key]);
    if (value !== null) return value;
  }
  return null;
}

function recordKey(row: ContextRecordRow, keys: readonly string[], fallbackPrefix: string, index: number): string {
  return firstText(row.payload ?? {}, keys, row.source_record_id ?? `${fallbackPrefix}-${index + 1}`);
}

function sourceKind(row: ContextRecordRow): string {
  return `${row.source_file ?? ''} ${row.record_type ?? ''} ${row.record_subtype ?? ''}`.toLowerCase();
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
  aiControlInitiativeRows?: readonly ContextRecordRow[];
  benefitRows?: readonly ContextRecordRow[];
  spendRows?: readonly ContextRecordRow[];
  riskRows?: readonly ContextRecordRow[];
}): ProjectedTowerReadModel {
  const benefitRealized = sumByKey(
    args.benefitRows ?? [],
    (row) => firstText(row.payload ?? {}, ['initiative_id', 'initiative_key']),
    (row) => firstNum(row.payload ?? {}, ['realized_value_ytd_usd', 'realized_value_usd', 'measured_value_ytd_usd', 'measured_value_usd']),
  );
  const spendBudget = sumByKey(
    args.spendRows ?? [],
    (row) => firstText(row.payload ?? {}, ['initiative_id', 'initiative_key']),
    (row) => firstNum(row.payload ?? {}, ['fy26_budget_usd', 'annual_budget_usd', 'spend_amount_usd', 'annualized_spend_usd', 'contract_value_usd']),
  );
  const spendActual = sumByKey(
    args.spendRows ?? [],
    (row) => firstText(row.payload ?? {}, ['initiative_id', 'initiative_key']),
    (row) => firstNum(row.payload ?? {}, ['actual_ytd_usd', 'ytd_spend_usd', 'realized_spend_usd']),
  );
  const riskByInitiative = firstByKey(
    args.riskRows ?? [],
    (row) => firstText(row.payload ?? {}, ['initiative_id', 'initiative_key']),
  );

  const seenInitiatives = new Set<string>();
  const sourceRows = [...args.initiativeRows, ...(args.aiControlInitiativeRows ?? [])];
  const initiatives = sourceRows.map((row, index) => {
    const payload = row.payload ?? {};
    const key = recordKey(row, ['initiative_id', 'initiative_key', 'program_id'], 'IT-INIT', index);
    if (seenInitiatives.has(key)) return null;
    seenInitiatives.add(key);

    const name = firstText(payload, ['initiative_name', 'program_name', 'name'], row.title ?? key);
    const riskRow = riskByInitiative.get(key);
    const riskPayload = riskRow?.payload ?? {};
    const risk = firstValue(payload, ['risk_status', 'primary_blocker', 'status_flag', 'evidence_status', 'scale_decision'])
      ?? firstValue(riskPayload, ['severity', 'status', 'risk_description', 'governance_gate']);
    const dependency = firstText(payload, ['dependency', 'primary_blocker', 'blocker']);
    const committedUsd =
      firstNum(payload, ['budget_usd', 'fy26_budget_usd', 'annual_budget_usd', 'program_budget_usd', 'spend_amount_usd'])
      ?? spendBudget.get(key)
      ?? null;
    const measuredUsd =
      firstNum(payload, ['measured_value_usd', 'measured_value_ytd_usd', 'realized_value_usd', 'realized_value_ytd_usd'])
      ?? benefitRealized.get(key)
      ?? null;
    const actualYtd = spendActual.get(key);
    const statusFlag = normalizeStatus(risk, risk);
    const statusSummary = [
      dependency ? `Dependency: ${dependency}.` : '',
      risk ? `Risk status: ${String(risk)}.` : '',
      payload.move_relevance ? `Move relevance: ${String(payload.move_relevance)}.` : '',
      actualYtd ? `Actual YTD spend is ${actualYtd}.` : '',
    ].filter(Boolean).join(' ') || 'Loaded from the tenant IT initiatives portfolio.';

    return asInitiative({
      initiativeId: `enterprise_context:${row.id}`,
      displayId: key,
      name,
      description: statusSummary,
      category: firstText(payload, ['business_area', 'business_function', 'portfolio_segment', 'category'], 'IT portfolio'),
      stage: normalizeStage(firstValue(payload, ['stage', 'lifecycle_stage', 'scale_decision'])),
      stageDetail: firstText(payload, ['stage', 'lifecycle_stage', 'scale_decision']) || null,
      ownerRole: firstText(payload, ['owner_role', 'owning_team', 'business_owner_role', 'business_sponsor_role', 'owner'], 'Portfolio owner role'),
      committedUsd,
      measuredUsd,
      statusFlag,
      statusSummary,
      confidenceLevel: confidenceFromRisk(risk),
      loadedViaTemplate: sourceKind(row).includes('t01') ? 'ai_control_tower_context' : 'enterprise_context_initiatives_portfolio',
    });
  }).filter((initiative): initiative is AIInitiative => Boolean(initiative));

  const fallbackInitiative = initiatives[0] ?? null;
  const vendors = [...args.vendorRows, ...(args.spendRows ?? [])].map((row, index): AIInitiativeVendorRow => {
    const payload = row.payload ?? {};
    const initiativeKey = firstText(payload, ['initiative_id', 'initiative_key']);
    const initiative = initiatives.find((candidate) => candidate.displayId === initiativeKey) ?? fallbackInitiative;
    const risk = firstText(payload, ['commercial_risk', 'evidence_state', 'spend_posture']).toLowerCase();
    const health: AIInitiativeVendorRow['financialHealth'] =
      risk.includes('high') || risk.includes('implementation') || risk.includes('risk')
        ? 'watch'
        : 'moderate';
    const vendorName = firstText(
      payload,
      ['vendor_name', 'vendor', 'vendor_or_internal', 'product_or_service'],
      row.title ?? `Vendor ${index + 1}`,
    );
    return {
      vendorId: firstText(payload, ['vendor_id', 'spend_id', 'contract_id'], row.source_record_id ?? `vendor-${index + 1}`),
      initiativeId: initiative?.initiativeId ?? 'enterprise_context:portfolio',
      initiativeDisplayId: initiative?.displayId ?? 'IT-PORTFOLIO',
      initiativeName: initiative?.name ?? 'IT portfolio',
      vendorName,
      contractValueUsd: firstNum(payload, ['annual_contract_value_usd', 'contract_value_usd', 'annual_budget_usd', 'fy26_budget_usd', 'spend_amount_usd', 'annualized_spend_usd']),
      renewalDate: isoDate(firstValue(payload, ['renewal_date', 'renewal_or_gate_date', 'gate_date'])),
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

  const refreshRun = await azureRead.maybeSingle<{ id: string }>({
    table: 'ai_control_refresh_runs',
    columns: ['id'],
    where: { client_id: args.clientId },
    orderBy: { column: 'reporting_period_end', direction: 'desc', nulls: 'last' },
    missingTable: 'empty',
  }).catch(() => null);

  if (refreshRun?.id) {
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

    const aiControlProjection = projectAiControlRowsToTowerReadModel({
      initiativeRows: aiControlInitiatives,
      benefitRows: benefits,
      spendRows: spend,
      riskRows: risks,
    });

    if (aiControlProjection.initiatives.length > 0 || aiControlProjection.vendors.length > 0) {
      return aiControlProjection;
    }
  }

  const [initiativeRows, vendorRows, aiControlInitiativeRows, benefitRows, spendRows, riskRows] = await Promise.all([
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, source_file, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND (record_type = 'initiatives_portfolio'
            OR record_subtype = 'initiatives-portfolio'
            OR source_file ILIKE '%F13_initiatives-portfolio%')
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 300`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, source_file, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND (record_type = 'vendors_contracts_licenses'
            OR record_subtype = 'vendors-contracts-licenses'
            OR source_file ILIKE '%F11_vendors-contracts-licenses%')
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 300`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, source_file, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND source_file ILIKE '%T01_initiative%'
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 300`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, source_file, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND source_file ILIKE '%T07_benefit%'
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 300`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, source_file, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND source_file ILIKE '%T08_spend%'
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 600`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
    azureRead.query<ContextRecordRow>(
      `SELECT id, canonical_record_id, record_type, record_subtype, source_file, title, source_record_id, source_row_number, payload
         FROM enterprise_context_records
        WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
          AND source_file ILIKE '%T09_risk%'
        ORDER BY source_row_number NULLS LAST, title
        LIMIT 300`,
      [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
      { missingTable: 'empty' },
    ),
  ]);

  const contextProjection = projectContextRecordsToTowerReadModel({
    initiativeRows,
    vendorRows,
    aiControlInitiativeRows,
    benefitRows,
    spendRows,
    riskRows,
  });
  if (contextProjection.initiatives.length > 0 || contextProjection.vendors.length > 0) {
    return contextProjection;
  }

  return { source: 'empty', initiatives: [], vendors: [] };
}
