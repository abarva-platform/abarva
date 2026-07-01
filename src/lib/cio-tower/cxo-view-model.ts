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

export interface CioTowerCxoViewModel {
  tenantKey: string;
  tenantName: string;
  generatedFrom: 'cio_tower';
  headline: string;
  sections: Array<{ key: CioTowerCxoSectionKey; label: string; purpose: string }>;
  cards: CioTowerCxoMeasureCard[];
  portfolioRows: CioTowerCxoTableRow[];
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
}

const CXO_SECTIONS: CioTowerCxoViewModel['sections'] = [
  {
    key: 'value_command_center',
    label: 'Value Command Center',
    purpose: 'Budget, promised value, proven value, and the value still needing executive attention.',
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
  if (measureKey === 'measured_value_ytd') return 'Finance-attested realized value is not available yet.';
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
    `select f.fact_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.view, f.period, f.basis, f.confidence, f.value_numeric, f.value_text,
            f.unit, f.source_key, f.source_row, sr.source_file, sr.source_system
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
    `select f.fact_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.view, f.period, f.basis, f.confidence, f.value_numeric, f.value_text,
            f.unit, f.source_key, f.source_row, sr.source_file, sr.source_system
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
    `select f.fact_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.view, f.period, f.basis, f.confidence, f.value_numeric, f.value_text,
            f.unit, f.source_key, f.source_row, sr.source_file, sr.source_system
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
      loadFactsForViews(tenantKey, ['initiative_budget', 'value', 'it_budget'], 10),
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
      ? `${args.tenantName} has ${totalBudget.displayValue} of FY26 technology budget in view. The executive question is how much of that spend is turning into measurable value.`
      : `${args.tenantName}'s Tower command center is waiting for the FY26 technology budget before it can tell a board-grade value story.`;

    return {
      tenantKey,
      tenantName: args.tenantName,
      generatedFrom: 'cio_tower',
      headline,
      sections: CXO_SECTIONS,
      cards,
      portfolioRows: tableRowsFromFacts(portfolioFacts),
      vendorRows: tableRowsFromFacts(vendorFacts),
      trustRows: tableRowsFromFacts(trustFacts),
      benchmarkRows,
      gaps,
      parityMeasureKey: 'total_it_budget_fy26',
    };
  }

  return null;
}
