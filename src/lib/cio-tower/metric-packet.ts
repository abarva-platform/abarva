export type CioTowerMetricKey =
  | 'total_it_budget_fy26'
  | 'total_it_budget_fy25_baseline'
  | 'run_budget_fy26'
  | 'change_budget_fy26'
  | 'initiative_budget_fy26'
  | 'measured_value_ytd'
  | 'promised_value_fy26'
  | 'actual_spend_ytd'
  | string;

export interface CioTowerMetricPacket {
  measureKey: CioTowerMetricKey;
  label: string;
  description: string | null;
  period: string;
  basis: string;
  scope: string;
  valueNumeric: number | null;
  displayValue: string;
  valueJson: Record<string, unknown>;
  sourceFactKeys: string[];
  formulaVersion: string;
}

export interface CioTowerMetricResultLike {
  measure_key: string;
  period: string;
  basis: string;
  scope: string;
  value_numeric: string | number | null;
  value_json?: Record<string, unknown> | null;
  source_fact_keys?: string[] | null;
  formula_version: string;
  label?: string | null;
  description?: string | null;
}

const CIO_TOWER_TENANT_KEY_BY_ALIAS: Record<string, string> = {
  apex: 'apex-retail',
  apexretail: 'apex-retail',
  'apex-retail': 'apex-retail',
  meridian: 'meridian-health',
  'meridian-health': 'meridian-health',
  arcturus: 'first-capital-financial',
  firstcapital: 'first-capital-financial',
  'first-capital': 'first-capital-financial',
  'first-capital-financial': 'first-capital-financial',
  skyharbor: 'skyharbor-air',
  'skyharbor-air': 'skyharbor-air',
  lakeshore: 'lakeshore-industries',
  'lakeshore-holdings': 'lakeshore-industries',
  'lakeshore-industries': 'lakeshore-industries',
  morganstreet: 'lakeshore-industries',
  'morgan-street': 'lakeshore-industries',
};

export function canonicalCioTowerTenantKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  return CIO_TOWER_TENANT_KEY_BY_ALIAS[normalized] ?? normalized;
}

export function formatCioTowerMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'not loaded';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function numericMetricValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function toCioTowerMetricPacket(row: CioTowerMetricResultLike): CioTowerMetricPacket {
  const valueNumeric = numericMetricValue(row.value_numeric);
  return {
    measureKey: row.measure_key,
    label: row.label?.trim() || row.measure_key,
    description: row.description ?? null,
    period: row.period,
    basis: row.basis,
    scope: row.scope,
    valueNumeric,
    displayValue: formatCioTowerMoney(valueNumeric),
    valueJson: row.value_json ?? {},
    sourceFactKeys: row.source_fact_keys ?? [],
    formulaVersion: row.formula_version,
  };
}

export function findCioTowerMetricPacket(
  packets: readonly CioTowerMetricPacket[],
  measureKey: CioTowerMetricKey,
): CioTowerMetricPacket | null {
  return packets.find((packet) => packet.measureKey === measureKey) ?? null;
}

export function cioTowerMetricNumber(
  packets: readonly CioTowerMetricPacket[],
  measureKey: CioTowerMetricKey,
): number | null {
  return findCioTowerMetricPacket(packets, measureKey)?.valueNumeric ?? null;
}

export function cioTowerMetricRowCount(packet: CioTowerMetricPacket | null): number | null {
  const value = packet?.valueJson?.row_count;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function requiredMetricKeysForTowerContract(contractKey: string): CioTowerMetricKey[] {
  if (contractKey === 'tower_total_it_spend') return ['total_it_budget_fy26'];
  if (contractKey === 'tower_run_change_split') return ['run_budget_fy26', 'change_budget_fy26'];
  if (contractKey === 'tower_trend_it_budget') return ['total_it_budget_fy25_baseline', 'total_it_budget_fy26'];
  if (contractKey === 'tower_value_realization') return ['measured_value_ytd'];
  if (contractKey === 'tower_top_it_programs_by_budget') return ['initiative_budget_fy26'];
  return [];
}

export function validateCioTowerMetricPacketVisibility(args: {
  contractKey: string;
  packets: readonly CioTowerMetricPacket[];
  visibleTexts: readonly string[];
}): string[] {
  const errors: string[] = [];
  const required = requiredMetricKeysForTowerContract(args.contractKey)
    .map((key) => findCioTowerMetricPacket(args.packets, key))
    .filter((packet): packet is CioTowerMetricPacket => Boolean(packet?.valueNumeric));
  if (required.length === 0) return errors;

  const joined = args.visibleTexts.join('\n');
  for (const packet of required) {
    if (!joined.includes(packet.displayValue)) {
      errors.push(`metric_packet_value_missing:${packet.measureKey}:${packet.displayValue}`);
    }
  }
  return errors;
}
