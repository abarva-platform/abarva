import { DEMO_SAFE_CLIENT_NAMES } from "@/lib/client-config";

export type CioTowerMetricKey =
  | "total_it_budget_fy26"
  | "total_it_budget_fy25_baseline"
  | "run_budget_fy26"
  | "change_budget_fy26"
  | "initiative_budget_fy26"
  | "measured_value_ytd"
  | "promised_value_fy26"
  | "actual_spend_ytd"
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
  apex: "apex-retail",
  apexretail: "apex-retail",
  apexretailgroup: "apex-retail",
  retaildemo: "apex-retail",
  "retail-demo": "apex-retail",
  "apex-retail": "apex-retail",
  meridian: "meridian-health",
  meridianhealth: "meridian-health",
  meridianhealthsystem: "meridian-health",
  healthcaredemo: "meridian-health",
  "healthcare-demo": "meridian-health",
  "meridian-health": "meridian-health",
  arcturus: "first-capital-financial",
  firstcapital: "first-capital-financial",
  firstcapitalfinancial: "first-capital-financial",
  financialservicesdemo: "first-capital-financial",
  "financial-services-demo": "first-capital-financial",
  "first-capital": "first-capital-financial",
  "first-capital-financial": "first-capital-financial",
  skyharbor: "skyharbor_global",
  skyharborglobal: "skyharbor_global",
  skyharborair: "skyharbor_global",
  airlinedemo: "skyharbor_global",
  "airline-demo": "skyharbor_global",
  "skyharbor-air": "skyharbor_global",
  "skyharbor-global": "skyharbor_global",
  skyharbor_global: "skyharbor_global",
  lakeshore: "lakeshore-holdings",
  lakeshoreholdings: "lakeshore-holdings",
  lakeshoreindustries: "lakeshore-industries",
  "lakeshore-holdings": "lakeshore-holdings",
  "lakeshore-industries": "lakeshore-industries",
};

const CIO_TOWER_TENANT_DISPLAY_NAME_BY_KEY: Record<string, string> = {
  "apex-retail": "Apex Retail Group",
  "meridian-health": "Meridian Health System",
  "first-capital-financial": DEMO_SAFE_CLIENT_NAMES.arcturus,
  skyharbor_global: DEMO_SAFE_CLIENT_NAMES.skyharbor,
  "lakeshore-holdings": "Lakeshore Holdings",
  "lakeshore-industries": "Lakeshore Industries",
};

export function canonicalCioTowerTenantKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  return (
    CIO_TOWER_TENANT_KEY_BY_ALIAS[normalized] ??
    CIO_TOWER_TENANT_KEY_BY_ALIAS[slug] ??
    CIO_TOWER_TENANT_KEY_BY_ALIAS[compact] ??
    slug ??
    normalized
  );
}

export function canonicalCioTowerTenantDisplayName(args: {
  key?: string | null;
  name?: string | null;
}): string | null {
  const candidates = [args.key, args.name].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  for (const candidate of candidates) {
    const canonicalKey = canonicalCioTowerTenantKey(candidate);
    const displayName = CIO_TOWER_TENANT_DISPLAY_NAME_BY_KEY[canonicalKey];
    if (displayName) return displayName;
  }
  return args.name?.trim() || null;
}

export function formatCioTowerMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "not loaded";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function numericMetricValue(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function toCioTowerMetricPacket(
  row: CioTowerMetricResultLike,
): CioTowerMetricPacket {
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

export function cioTowerMetricRowCount(
  packet: CioTowerMetricPacket | null,
): number | null {
  const value = packet?.valueJson?.row_count;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function requiredMetricKeysForTowerContract(
  contractKey: string,
): CioTowerMetricKey[] {
  if (contractKey === "tower_total_it_spend") return ["total_it_budget_fy26"];
  if (contractKey === "tower_run_change_split")
    return ["run_budget_fy26", "change_budget_fy26"];
  if (contractKey === "tower_trend_it_budget")
    return ["total_it_budget_fy25_baseline", "total_it_budget_fy26"];
  if (contractKey === "tower_value_realization") return ["measured_value_ytd"];
  if (contractKey === "tower_top_it_programs_by_budget")
    return ["initiative_budget_fy26"];
  if (contractKey === "tower_portfolio_value_gap")
    return ["promised_value_fy26", "measured_value_ytd"];
  if (contractKey === "tower_weak_value_evidence")
    return ["promised_value_fy26", "measured_value_ytd"];
  if (contractKey === "tower_inspect_this_week")
    return [
      "initiative_budget_fy26",
      "actual_spend_ytd",
      "promised_value_fy26",
      "measured_value_ytd",
    ];
  if (contractKey === "tower_advisor_morning_brief")
    return [
      "initiative_budget_fy26",
      "actual_spend_ytd",
      "promised_value_fy26",
      "measured_value_ytd",
    ];
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
    .filter((packet): packet is CioTowerMetricPacket =>
      Boolean(packet?.valueNumeric),
    );
  if (required.length === 0) return errors;

  const joined = args.visibleTexts.join("\n");
  for (const packet of required) {
    if (!joined.includes(packet.displayValue)) {
      errors.push(
        `metric_packet_value_missing:${packet.measureKey}:${packet.displayValue}`,
      );
    }
  }
  return errors;
}
