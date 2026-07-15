import { azureRead } from '@/lib/data-plane/azureRead';
import {
  canonicalCioTowerTenantKey,
  formatCioTowerMoney,
  numericMetricValue,
} from '@/lib/cio-tower/metric-packet';

export type CioTowerCxoSectionKey =
  | 'value_command_center'
  | 'portfolio_control'
  | 'vendor_contract_exposure'
  | 'evidence_trust'
  | 'ask_ava';

export interface CioTowerCxoEvidenceRef {
  factKey: string;
  label: string;
  measure: string;
  value: string;
  sourceFile: string | null;
  sourceRow: string | null;
  sourceSystem: string | null;
}

export interface CioTowerCxoMeasureCard {
  measureKey: string;
  label: string;
  section: CioTowerCxoSectionKey;
  valueNumeric: number | null;
  displayValue: string;
  period: string | null;
  basis: string | null;
  scope: string | null;
  formulaVersion: string | null;
  sourceFactKeys: string[];
  evidence: CioTowerCxoEvidenceRef[];
  gap: string | null;
}

export interface CioTowerCxoTableRow {
  label: string;
  type: string | null;
  measure: string;
  value: string;
  period: string;
  basis: string;
  confidence: string;
  source: string;
}

export interface CioTowerPortfolioValueRow {
  program: string;
  owner: string;
  blocker: string;
  budgetNumeric: number | null;
  budget: string;
  actualSpendNumeric: number | null;
  actualSpend: string;
  promisedValueNumeric: number | null;
  promisedValue: string;
  measuredValueNumeric: number | null;
  measuredValue: string;
  valueGapNumeric: number | null;
  valueGap: string;
  spendBurnRate: string;
  valueRealizationRate: string;
  measuredValuePerDollarSpent: string;
  evidenceStatus: string;
  inspectionReason: string;
  confidence: string;
  source: string;
  sourceFactKeys: string[];
}

export interface CioTowerCxoBenchmarkRow {
  tenantKey: string;
  label: string;
  isCurrent: boolean;
  totalBudget: number | null;
  runBudget: number | null;
  changeBudget: number | null;
  initiativeBudget: number | null;
  actualSpendYtd: number | null;
  promisedValue: number | null;
  measuredValue: number | null;
}

export interface CioTowerDerivedProjectionMetadata {
  projectionRole: 'derived_read_model';
  projectionPath: 'path_a_derived_projection';
  sourceOfTruthStatus: 'bridge_only';
  v3ReconciliationStatus: 'not_v3_reconciled';
  sourceOfTruthCaveat: string;
  realizedValueLanguagePolicy: string;
}

export const CIO_TOWER_DERIVED_PROJECTION_METADATA: CioTowerDerivedProjectionMetadata = {
  projectionRole: 'derived_read_model',
  projectionPath: 'path_a_derived_projection',
  sourceOfTruthStatus: 'bridge_only',
  v3ReconciliationStatus: 'not_v3_reconciled',
  sourceOfTruthCaveat:
    'cio_tower is a Tower read-model projection until every displayed fact reconciles to v3 evidence, canonical facts, entity profiles, and relationships.',
  realizedValueLanguagePolicy:
    'Realized value requires finance-attested measured evidence; otherwise Tower must render value as promised, planned, forecast, or measurement-readiness.',
};

export interface CioTowerCxoViewModel {
  tenantKey: string;
  tenantName: string;
  generatedFrom: 'cio_tower';
  projectionMetadata: CioTowerDerivedProjectionMetadata;
  headline: string;
  sections: Array<{ key: CioTowerCxoSectionKey; label: string; purpose: string }>;
  cards: CioTowerCxoMeasureCard[];
  portfolioRows: CioTowerCxoTableRow[];
  portfolioValueRows: CioTowerPortfolioValueRow[];
  vendorRows: CioTowerCxoTableRow[];
  trustRows: CioTowerCxoTableRow[];
  benchmarkRows: CioTowerCxoBenchmarkRow[];
  gaps: string[];
  parityMeasureKey: 'total_it_budget_fy26';
}

interface MeasureResultRow {
  measure_key: string;
  label: string | null;
  description: string | null;
  period: string | null;
  basis: string | null;
  scope: string | null;
  value_numeric: string | number | null;
  value_json: Record<string, unknown> | null;
  source_fact_keys: string[] | null;
  formula_version: string | null;
}

interface FactEvidenceRow {
  fact_key: string;
  entity_key: string | null;
  entity_type: string | null;
  entity_display_name: string | null;
  measure: string;
  view: string;
  period: string;
  basis: string;
  confidence: string;
  value_numeric: string | number | null;
  value_text: string | null;
  unit: string;
  source_key: string | null;
  source_row: string | null;
  source_file: string | null;
  source_system: string | null;
  attributes: Record<string, unknown> | null;
}

const CXO_SECTIONS: CioTowerCxoViewModel['sections'] = [
  {
    key: 'value_command_center',
    label: 'Value Command Center',
    purpose: 'Budget, promised value, measured-value evidence, and the value still needing executive attention.',
  },
  {
    key: 'portfolio_control',
    label: 'Portfolio Control',
    purpose: 'The budget lanes and funded programs the CIO should inspect first.',
  },
  {
    key: 'vendor_contract_exposure',
    label: 'Vendor and Contract Exposure',
    purpose: 'Vendor concentration and renewal exposure only where contract facts are loaded.',
  },
  {
    key: 'evidence_trust',
    label: 'Evidence and Trust',
    purpose: 'Formula lineage, source evidence, missing business fields, and trust gaps.',
  },
  {
    key: 'ask_ava',
    label: 'Ask aVa',
    purpose: 'Ask aVa to explain the numbers, tradeoffs, and action path in plain executive language.',
  },
];

const SECTION_BY_MEASURE: Record<string, CioTowerCxoSectionKey> = {
  total_it_budget_fy26: 'value_command_center',
  total_it_budget_fy25_baseline: 'value_command_center',
  promised_value_fy26: 'value_command_center',
  measured_value_ytd: 'value_command_center',
  actual_spend_ytd: 'value_command_center',
  run_budget_fy26: 'portfolio_control',
  change_budget_fy26: 'portfolio_control',
  initiative_budget_fy26: 'portfolio_control',
};

const REQUIRED_VALUE_MEASURES = [
  'total_it_budget_fy26',
  'promised_value_fy26',
  'measured_value_ytd',
] as const;

function displayFactValue(row: FactEvidenceRow): string {
  const numeric = numericMetricValue(row.value_numeric);
  if (numeric !== null) {
    if (row.unit === 'usd') return formatCioTowerMoney(numeric);
    if (row.unit === 'pct') return `${numeric}%`;
    if (row.unit === 'ratio') return `${numeric}x`;
    return `${numeric}${row.unit && row.unit !== 'none' ? ` ${row.unit}` : ''}`;
  }
  if (row.value_text?.trim()) return row.value_text.trim();
  return 'not loaded';
}

function labelForFact(row: FactEvidenceRow): string {
  return row.entity_display_name?.trim() || row.entity_type || row.measure;
}

function sourceLabel(row: FactEvidenceRow): string {
  const file = row.source_file || row.source_key || 'source not populated';
  return row.source_row ? `${file} row ${row.source_row}` : file;
}

function businessGapForMeasure(measureKey: string): string {
  if (measureKey === 'total_it_budget_fy26') return 'FY26 total IT budget is not available yet.';
  if (measureKey === 'promised_value_fy26') return 'Business-case value is not available yet.';
  if (measureKey === 'measured_value_ytd') return 'Finance-attested measured-value evidence is not available yet.';
  if (measureKey === 'actual_spend_ytd') return 'Year-to-date actual spend is not available yet.';
  if (measureKey === 'run_budget_fy26') return 'Run budget split is not available yet.';
  if (measureKey === 'change_budget_fy26') return 'Change budget split is not available yet.';
  return 'This metric is not available yet.';
}

function cardFromMeasure(row: MeasureResultRow, evidence: CioTowerCxoEvidenceRef[]): CioTowerCxoMeasureCard {
  const valueNumeric = numericMetricValue(row.value_numeric);
  return {
    measureKey: row.measure_key,
    label: row.label?.trim() || row.measure_key,
    section: SECTION_BY_MEASURE[row.measure_key] ?? 'evidence_trust',
    valueNumeric,
    displayValue: valueNumeric === null ? 'gap' : formatCioTowerMoney(valueNumeric),
    period: row.period,
    basis: row.basis,
    scope: row.scope,
    formulaVersion: row.formula_version,
    sourceFactKeys: row.source_fact_keys ?? [],
    evidence,
    gap: valueNumeric === null ? businessGapForMeasure(row.measure_key) : null,
  };
}

function missingCard(measureKey: string): CioTowerCxoMeasureCard {
  return {
    measureKey,
    label: measureKey.replace(/_/g, ' '),
    section: SECTION_BY_MEASURE[measureKey] ?? 'evidence_trust',
    valueNumeric: null,
    displayValue: 'gap',
    period: null,
    basis: null,
    scope: null,
    formulaVersion: null,
    sourceFactKeys: [],
    evidence: [],
    gap: businessGapForMeasure(measureKey),
  };
}

function tableRowsFromFacts(rows: FactEvidenceRow[]): CioTowerCxoTableRow[] {
  return rows.map((row) => ({
    label: labelForFact(row),
    type: row.entity_type,
    measure: row.measure,
    value: displayFactValue(row),
    period: row.period,
    basis: row.basis,
    confidence: row.confidence,
    source: sourceLabel(row),
  }));
}

function attributeText(row: FactEvidenceRow, key: string): string | null {
  const value = row.attributes?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function groupKeyForPortfolioValue(row: FactEvidenceRow): string {
  return row.entity_key
    ?? attributeText(row, 'initiative_id')
    ?? attributeText(row, 'program_id')
    ?? attributeText(row, 'source_record_id')
    ?? row.entity_display_name
    ?? row.fact_key;
}

// The Lakeshore V7 projection (project-lakeshore-v7-to-tower-standardized.mjs) builds
// source_label by suffixing the real program/entity name with a fixed set of fact-type
// descriptors (e.g. "<name> directional promised value"). Facts carry no separate
// record_name/initiative_name, so source_label is the only place the real name lives;
// strip the known suffixes (iteratively, since FY2025 trend rows double-suffix) rather
// than discarding the field, or every program label falls through to a bare fallback.
const SOURCE_LABEL_SUFFIX_PATTERN = /\s+(FY26 committed budget|directional promised value|directional measured value|local IT FY26 budget|FY26 run budget component|FY26 change budget component|FY2025 trend baseline)$/i;

function cleanedSourceLabel(row: FactEvidenceRow): string | null {
  const raw = attributeText(row, 'source_label');
  if (!raw) return null;
  let cleaned = raw;
  while (SOURCE_LABEL_SUFFIX_PATTERN.test(cleaned)) {
    cleaned = cleaned.replace(SOURCE_LABEL_SUFFIX_PATTERN, '').trim();
  }
  return cleaned.length > 0 ? cleaned : null;
}

function programLabel(row: FactEvidenceRow, fallback: string): string {
  return attributeText(row, 'record_name')
    ?? attributeText(row, 'initiative_name')
    ?? attributeText(row, 'program_name')
    ?? attributeText(row, 'display_name')
    ?? attributeText(row, 'title')
    ?? attributeText(row, 'business_name')
    ?? attributeText(row, 'business_label')
    ?? cleanedSourceLabel(row)
    ?? attributeText(row, 'label')
    ?? attributeText(row, 'name')
    ?? row.entity_display_name
    ?? fallback;
}

function portfolioValueAmount(row: FactEvidenceRow, kind: 'budget' | 'actual' | 'promised' | 'measured'): number | null {
  const value = numericMetricValue(row.value_numeric);
  if (value === null) return null;
  if (kind === 'budget') {
    return row.view === 'initiative_budget' && row.period.toLowerCase() === 'fy26' ? value : null;
  }
  if (kind === 'actual') {
    return row.view === 'initiative_budget'
      && row.period.toLowerCase() === 'ytd'
      && row.basis.toLowerCase() === 'actual'
      ? value
      : null;
  }
  if (row.view !== 'value') return null;
  const measure = row.measure.toLowerCase();
  const basis = row.basis.toLowerCase();
  if (kind === 'promised') {
    return basis === 'forecast' || measure.includes('promised') || measure.includes('benefit') ? value : null;
  }
  return basis === 'actual' || basis === 'measured' || measure.includes('measured') || measure.includes('realized') ? value : null;
}

function firstBusinessText(rows: FactEvidenceRow[], keys: string[], fallback: string): string {
  for (const row of rows) {
    for (const key of keys) {
      const value = attributeText(row, key);
      if (value) return value;
    }
  }
  return fallback;
}

function highestConfidence(rows: FactEvidenceRow[]): string {
  const order = ['high', 'medium', 'low', 'not_loaded'];
  return rows
    .map((row) => row.confidence)
    .sort((left, right) => order.indexOf(left) - order.indexOf(right))[0] ?? 'not_loaded';
}

function formatRate(numerator: number | null, denominator: number | null): string {
  if (!numerator || !denominator || denominator <= 0) return 'gap';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatMultiple(numerator: number | null, denominator: number | null): string {
  if (!numerator || !denominator || denominator <= 0) return 'gap';
  return `${(numerator / denominator).toFixed(2)}x`;
}

function inspectionReason(args: {
  budget: number | null;
  actualSpend: number | null;
  promisedValue: number | null;
  measuredValue: number | null;
  valueGap: number | null;
  owner: string;
  blocker: string;
  evidenceStatus: string;
}): string {
  if (!args.owner || args.owner === 'Owner not loaded') return 'Owner accountability is missing.';
  if (!args.promisedValue) return 'Business-case value is missing.';
  if (!args.measuredValue) return 'Finance-attested value proof is missing.';
  if (args.valueGap && args.valueGap > 0) return 'Promised value is ahead of measured value.';
  if (args.actualSpend && args.budget && args.actualSpend / args.budget > 0.6) return 'Spend burn is ahead of the annual budget pace.';
  if (args.evidenceStatus === 'Evidence status not loaded') return 'Evidence status is missing.';
  if (args.blocker !== 'No blocker loaded') return args.blocker;
  return 'Review proof before the next funding gate.';
}

function buildPortfolioValueRows(rows: FactEvidenceRow[]): CioTowerPortfolioValueRow[] {
  const grouped = new Map<string, FactEvidenceRow[]>();
  for (const row of rows) {
    if (!['initiative_budget', 'value'].includes(row.view)) continue;
    const key = groupKeyForPortfolioValue(row);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return Array.from(grouped.values())
    .map((group) => {
      const budgetNumeric = group.reduce((sum, row) => sum + (portfolioValueAmount(row, 'budget') ?? 0), 0);
      const actualSpendNumeric = group.reduce((sum, row) => sum + (portfolioValueAmount(row, 'actual') ?? 0), 0);
      const promisedValueNumeric = group.reduce((sum, row) => sum + (portfolioValueAmount(row, 'promised') ?? 0), 0);
      const measuredValueNumeric = group.reduce((sum, row) => sum + (portfolioValueAmount(row, 'measured') ?? 0), 0);
      const hasBudget = budgetNumeric > 0;
      const hasActualSpend = actualSpendNumeric > 0;
      const hasPromised = promisedValueNumeric > 0;
      const hasMeasured = measuredValueNumeric > 0;
      const valueGapNumeric = hasPromised ? Math.max(promisedValueNumeric - measuredValueNumeric, 0) : null;
      const sourceFacts = Array.from(new Set(group.map((row) => row.fact_key)));
      const primary = group[0] as FactEvidenceRow;
      const owner = firstBusinessText(group, ['owner_role', 'owner_name', 'owner', 'business_sponsor_role'], 'Owner not loaded');
      const blocker = firstBusinessText(group, ['primary_blocker', 'blocker', 'status_summary'], 'No blocker loaded');
      const evidenceStatus = firstBusinessText(group, ['evidence_status', 'value_confidence', 'finance_attested'], 'Evidence status not loaded');
      const budget = hasBudget ? budgetNumeric : null;
      const actualSpend = hasActualSpend ? actualSpendNumeric : null;
      const promisedValue = hasPromised ? promisedValueNumeric : null;
      const measuredValue = hasMeasured ? measuredValueNumeric : null;
      return {
        program: programLabel(primary, 'Program name not loaded'),
        owner,
        blocker,
        budgetNumeric: budget,
        budget: hasBudget ? formatCioTowerMoney(budgetNumeric) : 'gap',
        actualSpendNumeric: actualSpend,
        actualSpend: hasActualSpend ? formatCioTowerMoney(actualSpendNumeric) : 'gap',
        promisedValueNumeric: promisedValue,
        promisedValue: hasPromised ? formatCioTowerMoney(promisedValueNumeric) : 'gap',
        measuredValueNumeric: measuredValue,
        measuredValue: hasMeasured ? formatCioTowerMoney(measuredValueNumeric) : 'gap',
        valueGapNumeric,
        valueGap: valueGapNumeric === null ? 'gap' : formatCioTowerMoney(valueGapNumeric),
        spendBurnRate: formatRate(actualSpend, budget),
        valueRealizationRate: formatRate(measuredValue, promisedValue),
        measuredValuePerDollarSpent: formatMultiple(measuredValue, actualSpend),
        evidenceStatus,
        inspectionReason: inspectionReason({
          budget,
          actualSpend,
          promisedValue,
          measuredValue,
          valueGap: valueGapNumeric,
          owner,
          blocker,
          evidenceStatus,
        }),
        confidence: highestConfidence(group),
        source: sourceLabel(primary),
        sourceFactKeys: sourceFacts,
      };
    })
    .filter((row) => row.budgetNumeric !== null || row.actualSpendNumeric !== null || row.promisedValueNumeric !== null || row.measuredValueNumeric !== null)
    .sort((left, right) => (right.budgetNumeric ?? 0) - (left.budgetNumeric ?? 0))
    .slice(0, 12);
}

async function loadMeasureRows(tenantKey: string): Promise<MeasureResultRow[]> {
  return azureRead.query<MeasureResultRow>(
    `select mr.measure_key, m.label, m.description, mr.period, mr.basis, mr.scope,
            mr.value_numeric, mr.value_json, mr.source_fact_keys, mr.formula_version
       from cio_tower.measure_results mr
       left join cio_tower.measures m on m.measure_key = mr.measure_key
      where mr.tenant_key = $1
      order by mr.measure_key, mr.period`,
    [tenantKey],
    { missingTable: 'empty' },
  );
}

async function loadFactsByKeys(tenantKey: string, factKeys: string[]): Promise<FactEvidenceRow[]> {
  if (factKeys.length === 0) return [];
  return azureRead.query<FactEvidenceRow>(
    `select f.fact_key, f.entity_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.view, f.period, f.basis, f.confidence, f.value_numeric, f.value_text,
            f.unit, f.source_key, f.source_row, sr.source_file, sr.source_system, f.attributes
       from cio_tower.facts f
       left join cio_tower.entities e on e.entity_key = f.entity_key
       left join cio_tower.source_registry sr on sr.source_key = f.source_key
      where f.tenant_key = $1
        and f.fact_key = any($2::text[])
      order by f.view, coalesce(f.value_numeric, 0) desc, f.fact_key`,
    [tenantKey, factKeys],
    { missingTable: 'empty' },
  );
}

async function loadFactsForViews(tenantKey: string, views: string[], limit: number): Promise<FactEvidenceRow[]> {
  return azureRead.query<FactEvidenceRow>(
    `select f.fact_key, f.entity_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.view, f.period, f.basis, f.confidence, f.value_numeric, f.value_text,
            f.unit, f.source_key, f.source_row, sr.source_file, sr.source_system, f.attributes
       from cio_tower.facts f
       left join cio_tower.entities e on e.entity_key = f.entity_key
       left join cio_tower.source_registry sr on sr.source_key = f.source_key
      where f.tenant_key = $1
        and f.view = any($2::text[])
      order by coalesce(f.value_numeric, 0) desc, f.created_at desc
      limit ${limit}`,
    [tenantKey, views],
    { missingTable: 'empty' },
  );
}

async function loadTrustFacts(tenantKey: string): Promise<FactEvidenceRow[]> {
  return azureRead.query<FactEvidenceRow>(
    `select f.fact_key, f.entity_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.view, f.period, f.basis, f.confidence, f.value_numeric, f.value_text,
            f.unit, f.source_key, f.source_row, sr.source_file, sr.source_system, f.attributes
       from cio_tower.facts f
       left join cio_tower.entities e on e.entity_key = f.entity_key
       left join cio_tower.source_registry sr on sr.source_key = f.source_key
      where f.tenant_key = $1
      order by f.created_at desc
      limit 8`,
    [tenantKey],
    { missingTable: 'empty' },
  );
}

async function loadBenchmarkRows(currentTenantKey: string): Promise<CioTowerCxoBenchmarkRow[]> {
  const rows = await azureRead.query<{
    tenant_key: string;
    measure_key: string;
    value_numeric: string | number | null;
  }>(
    `select tenant_key, measure_key, value_numeric
       from cio_tower.measure_results
      where measure_key = any($1::text[])
      order by tenant_key, measure_key`,
    [[
      'total_it_budget_fy26',
      'run_budget_fy26',
      'change_budget_fy26',
      'initiative_budget_fy26',
      'actual_spend_ytd',
      'promised_value_fy26',
      'measured_value_ytd',
    ]],
    { missingTable: 'empty' },
  );
  const byTenant = new Map<string, Map<string, number | null>>();
  for (const row of rows) {
    const tenant = row.tenant_key;
    const bucket = byTenant.get(tenant) ?? new Map<string, number | null>();
    bucket.set(row.measure_key, numericMetricValue(row.value_numeric));
    byTenant.set(tenant, bucket);
  }

  let peerIndex = 1;
  return Array.from(byTenant.entries()).map(([tenantKey, values]) => {
    const isCurrent = tenantKey === currentTenantKey;
    return {
      tenantKey,
      label: isCurrent ? 'This tenant' : `Peer ${peerIndex++}`,
      isCurrent,
      totalBudget: values.get('total_it_budget_fy26') ?? null,
      runBudget: values.get('run_budget_fy26') ?? null,
      changeBudget: values.get('change_budget_fy26') ?? null,
      initiativeBudget: values.get('initiative_budget_fy26') ?? null,
      actualSpendYtd: values.get('actual_spend_ytd') ?? null,
      promisedValue: values.get('promised_value_fy26') ?? null,
      measuredValue: values.get('measured_value_ytd') ?? null,
    };
  });
}

function evidenceRefs(rows: FactEvidenceRow[]): CioTowerCxoEvidenceRef[] {
  return rows.map((row) => ({
    factKey: row.fact_key,
    label: labelForFact(row),
    measure: row.measure,
    value: displayFactValue(row),
    sourceFile: row.source_file,
    sourceRow: row.source_row,
    sourceSystem: row.source_system,
  }));
}

export async function loadCioTowerCxoView(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
  tenantName: string;
}): Promise<CioTowerCxoViewModel | null> {
  const tenantKeys = Array.from(
    new Set(
      args.tenantKeyCandidates
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => canonicalCioTowerTenantKey(value)),
    ),
  );
  if (tenantKeys.length === 0) return null;

  for (const tenantKey of tenantKeys) {
    const measureRows = await loadMeasureRows(tenantKey);
    if (measureRows.length === 0) continue;

    const allSourceFactKeys = Array.from(new Set(measureRows.flatMap((row) => row.source_fact_keys ?? [])));
    const [measureEvidenceRows, portfolioFacts, vendorFacts, trustFacts, benchmarkRows] = await Promise.all([
      loadFactsByKeys(tenantKey, allSourceFactKeys),
      loadFactsForViews(tenantKey, ['initiative_budget', 'value', 'it_budget'], 240),
      loadFactsForViews(tenantKey, ['vendor_contract'], 8),
      loadTrustFacts(tenantKey),
      loadBenchmarkRows(tenantKey),
    ]);
    const evidenceByFactKey = new Map(measureEvidenceRows.map((row) => [row.fact_key, row]));
    const measureByKey = new Map(measureRows.map((row) => [row.measure_key, row]));
    const cards = [
      ...REQUIRED_VALUE_MEASURES.map((measureKey) => {
        const row = measureByKey.get(measureKey);
        if (!row) return missingCard(measureKey);
        return cardFromMeasure(
          row,
          evidenceRefs((row.source_fact_keys ?? []).map((factKey) => evidenceByFactKey.get(factKey)).filter((value): value is FactEvidenceRow => Boolean(value))),
        );
      }),
      ...measureRows
        .filter((row) => !REQUIRED_VALUE_MEASURES.includes(row.measure_key as (typeof REQUIRED_VALUE_MEASURES)[number]))
        .map((row) => cardFromMeasure(
          row,
          evidenceRefs((row.source_fact_keys ?? []).map((factKey) => evidenceByFactKey.get(factKey)).filter((value): value is FactEvidenceRow => Boolean(value))),
        )),
    ];
    const gaps = Array.from(new Set(cards.map((card) => card.gap).filter((gap): gap is string => Boolean(gap))));
    const totalBudget = cards.find((card) => card.measureKey === 'total_it_budget_fy26');
    const headline = totalBudget?.valueNumeric
      ? `${args.tenantName} has ${totalBudget.displayValue} of FY26 technology budget in view. The executive question is how much of that spend has finance-attested measurement evidence.`
      : `${args.tenantName}'s Tower command center is waiting for the FY26 technology budget before it can tell a board-grade measurement story.`;

    return {
      tenantKey,
      tenantName: args.tenantName,
      generatedFrom: 'cio_tower',
      projectionMetadata: CIO_TOWER_DERIVED_PROJECTION_METADATA,
      headline,
      sections: CXO_SECTIONS,
      cards,
      portfolioRows: tableRowsFromFacts(portfolioFacts),
      portfolioValueRows: buildPortfolioValueRows(portfolioFacts),
      vendorRows: tableRowsFromFacts(vendorFacts),
      trustRows: tableRowsFromFacts(trustFacts),
      benchmarkRows,
      gaps,
      parityMeasureKey: 'total_it_budget_fy26',
    };
  }

  return null;
}
