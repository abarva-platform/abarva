/**
 * The Technology & Data cockpit's arithmetic, kept pure and apart from the view.
 *
 * Every number the cockpit draws -- the pivot bars, the scatter, the relationship cards, the KPI
 * strip, and every table cell -- is computed here, from the estate rows the bundle already carries
 * and nothing else. No value is authored, estimated, or supplied by a model: a figure that cannot be
 * derived from a row is not produced. Separating this from the React component is what lets the
 * guarantee be tested directly -- a fixture estate in, a known set of aggregates out -- rather than
 * inferred from a chart that jsdom never lays out.
 *
 * The field names are the canonical application/vendor CSV columns the data-build layer publishes
 * (see scripts/data-build/technology-estate.ts and the golden snapshots). They are read defensively:
 * a missing dimension is reported as "Not recorded" rather than folded into a real bucket, because
 * missing is not the same as zero and a silent merge would overstate a real group.
 */

import type { EstateRow } from "./page-tables";

/** One application, normalised to the shape the pivot reasons over. Dimension values are humanised
 * once, here, so grouping, drilling, and display all compare the exact same strings. */
export interface PivotApp {
  name: string;
  provider: string;
  func: string;
  criticality: string;
  deployment: string;
  scope: string;
  lifecycle: string;
  cost: number;
  interfaces: number;
  /** Null when the row declares no technical-debt score; such a row is counted but never plotted on
   * the debt axis as if it were a zero. */
  debt: number | null;
}

/** The value shown when the record does not state a dimension for a row. Never merged with a real
 * group: "missing is not zero" applies to a dimension exactly as to a fact. */
export const NOT_RECORDED = "Not recorded";

export type PivotMeasure = "count" | "cost";

export interface PivotDimension {
  key: keyof Pick<
    PivotApp,
    "provider" | "func" | "criticality" | "deployment" | "scope"
  >;
  label: string;
}

/** The dimensions a reader can pivot and drill the estate across. Provider and Function are the
 * record's own free-text values; Criticality, Deployment, and Scope are humanised enum tokens. */
export const PIVOT_DIMENSIONS: ReadonlyArray<PivotDimension> = [
  { key: "provider", label: "Provider" },
  { key: "func", label: "Function" },
  { key: "criticality", label: "Criticality" },
  { key: "deployment", label: "Deployment" },
  { key: "scope", label: "Scope" },
];

const TIER_LABEL: Record<string, string> = {
  tier1: "Tier 1",
  tier2: "Tier 2",
  tier3: "Tier 3",
};

/** Short forms that read wrong in sentence case, mapped to how a reader expects to see them. */
const ACRONYMS: Record<string, string> = {
  saas: "SaaS",
  aws: "AWS",
  azure: "Azure",
  api: "API",
  ai: "AI",
  erp: "ERP",
  crm: "CRM",
};

/** An enum token rendered for a reader: underscores to spaces, sentence case ("hosted_by_vendor" ->
 * "Hosted by vendor"), with a short list of acronyms restored to their expected form. A machine token
 * must never reach the CXO surface, so this is applied to every enum dimension at normalisation time
 * rather than at render time, where one call site could forget it. */
export function humanizeToken(raw: string): string {
  const cleaned = raw.trim();
  if (cleaned.length === 0) return raw;
  const acronym = ACRONYMS[cleaned.toLowerCase()];
  if (acronym) return acronym;
  const spaced = cleaned.replace(/[_\s]+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function readStr(row: EstateRow, key: string): string {
  const value = row[key];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return NOT_RECORDED;
}

function readNum(row: EstateRow, key: string): number | null {
  const value = row[key];
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Reads the estate's application rows into the pivot shape. Cost and interface count default to 0
 * only when the row omits them entirely -- a genuine absence that would otherwise crash the sums --
 * while a missing debt score stays null so it is never drawn as a real zero on the debt axis. */
export function normalizeApps(rows: ReadonlyArray<EstateRow>): PivotApp[] {
  return rows.map((row) => {
    const criticalityRaw = readStr(row, "criticality");
    return {
      name: readStr(row, "systemName"),
      provider: readStr(row, "vendor"),
      func: readStr(row, "businessFunction"),
      criticality:
        TIER_LABEL[criticalityRaw] ??
        (criticalityRaw === NOT_RECORDED
          ? NOT_RECORDED
          : humanizeToken(criticalityRaw)),
      deployment: humanizeDimension(readStr(row, "deploymentModel")),
      scope: humanizeDimension(readStr(row, "systemScope")),
      lifecycle: humanizeDimension(readStr(row, "lifecycleState")),
      cost: readNum(row, "annualCostUsd") ?? 0,
      interfaces: readNum(row, "interfacesCount") ?? 0,
      debt: readNum(row, "technicalDebtScore"),
    };
  });
}

function humanizeDimension(value: string): string {
  return value === NOT_RECORDED ? NOT_RECORDED : humanizeToken(value);
}

/** One vendor's annual contracted spend, read from the vendor-contract rows. */
export interface VendorSpend {
  name: string;
  spend: number;
}

export function normalizeVendors(
  rows: ReadonlyArray<EstateRow>,
): VendorSpend[] {
  return rows.map((row) => ({
    name: readStr(row, "vendorName"),
    spend: readNum(row, "annualSpendUsd") ?? 0,
  }));
}

export interface DimensionAggregate {
  name: string;
  count: number;
  cost: number;
}

/** The estate grouped by one dimension, each group carrying both measures so the reader can switch
 * between count and cost without a recompute changing the ordering unexpectedly. Sorted by the active
 * measure, then by name so ties are stable. */
export function aggregateByDimension(
  apps: ReadonlyArray<PivotApp>,
  dimKey: PivotDimension["key"],
  measure: PivotMeasure,
): DimensionAggregate[] {
  const groups = new Map<string, DimensionAggregate>();
  for (const app of apps) {
    const key = app[dimKey];
    const existing = groups.get(key) ?? { name: key, count: 0, cost: 0 };
    existing.count += 1;
    existing.cost += app.cost;
    groups.set(key, existing);
  }
  return [...groups.values()].sort(
    (a, b) =>
      (measure === "cost" ? b.cost - a.cost : b.count - a.count) ||
      a.name.localeCompare(b.name),
  );
}

/** The applications behind a drilled dimension value, or every application when nothing is drilled. */
export function filterByDrill(
  apps: ReadonlyArray<PivotApp>,
  dimKey: PivotDimension["key"],
  value: string | null,
): PivotApp[] {
  if (value === null) return [...apps];
  return apps.filter((app) => app[dimKey] === value);
}

export interface RelationshipSummary {
  applications: number;
  annualCost: number;
  tier1: number;
  functionsTouched: number;
  interfaces: number;
  /** Present only when the drill is by provider and that provider has a matching vendor contract --
   * the one relationship figure that crosses from the application estate into the vendor register. */
  vendorSpend: number | null;
}

/** The cross-dimensional relationships of a drilled slice: how many applications, at what cost, how
 * many tier-1 among them, how many business functions they touch, and how many interfaces they carry
 * -- every figure a direct count or sum over the drilled rows. */
export function relationshipSummary(
  drilled: ReadonlyArray<PivotApp>,
  dimKey: PivotDimension["key"],
  value: string,
  vendorSpendByName: ReadonlyMap<string, number>,
): RelationshipSummary {
  return {
    applications: drilled.length,
    annualCost: drilled.reduce((sum, app) => sum + app.cost, 0),
    tier1: drilled.filter((app) => app.criticality === "Tier 1").length,
    functionsTouched: new Set(drilled.map((app) => app.func)).size,
    interfaces: drilled.reduce((sum, app) => sum + app.interfaces, 0),
    vendorSpend:
      dimKey === "provider" ? (vendorSpendByName.get(value) ?? null) : null,
  };
}

export interface ScatterPoint {
  name: string;
  cost: number;
  debt: number;
  interfaces: number;
  criticality: string;
}

/** The cost-versus-debt points, over only the applications that declare a debt score. The count of
 * rows dropped for a missing score is returned alongside, so the view can say what the scatter does
 * not show rather than quietly omitting it. */
export function scatterPoints(apps: ReadonlyArray<PivotApp>): {
  points: ScatterPoint[];
  dropped: number;
} {
  const points: ScatterPoint[] = [];
  let dropped = 0;
  for (const app of apps) {
    if (app.debt === null) {
      dropped += 1;
      continue;
    }
    points.push({
      name: app.name,
      cost: app.cost,
      debt: app.debt,
      interfaces: app.interfaces,
      criticality: app.criticality,
    });
  }
  return { points, dropped };
}

export interface EstateScale {
  appCount: number;
  appRunCost: number;
  vendorCount: number;
  vendorSpend: number;
  /** Share of total vendor spend held by the two largest vendors -- the record's own concentration,
   * computed from the vendor rows, never asserted. Null when there is no vendor spend to divide. */
  topTwoVendorSharePct: number | null;
  dataAssetCount: number;
}

/** The estate's top-line scale: application count and run cost from the application rows, vendor
 * count and spend from the contract rows, the two-vendor concentration from those same spends, and
 * the data-asset count from the integration rows. Each is a count or a sum, nothing modelled. */
export function estateScale(
  apps: ReadonlyArray<PivotApp>,
  vendors: ReadonlyArray<VendorSpend>,
  dataAssetCount: number,
): EstateScale {
  const vendorSpend = vendors.reduce((sum, vendor) => sum + vendor.spend, 0);
  const topTwo = [...vendors]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 2)
    .reduce((sum, vendor) => sum + vendor.spend, 0);
  return {
    appCount: apps.length,
    appRunCost: apps.reduce((sum, app) => sum + app.cost, 0),
    vendorCount: vendors.length,
    vendorSpend,
    topTwoVendorSharePct:
      vendorSpend > 0 ? (topTwo / vendorSpend) * 100 : null,
    dataAssetCount,
  };
}

/** Vendor spend indexed by name, for the one relationship figure that crosses the two registers. */
export function vendorSpendIndex(
  vendors: ReadonlyArray<VendorSpend>,
): Map<string, number> {
  const index = new Map<string, number>();
  for (const vendor of vendors) index.set(vendor.name, vendor.spend);
  return index;
}

export type TableSortKey =
  | "name"
  | "provider"
  | "func"
  | "criticality"
  | "cost"
  | "interfaces"
  | "debt";

export interface TableSort {
  key: TableSortKey;
  dir: 1 | -1;
}

/** The drilled applications sorted for the detail table. String columns default to ascending, numeric
 * columns to descending, and a repeated click on the same column flips the direction. Debt nulls sort
 * last in either direction so a missing score never masquerades as the best or worst row. */
export function sortApps(
  apps: ReadonlyArray<PivotApp>,
  sort: TableSort,
): PivotApp[] {
  const { key, dir } = sort;
  return [...apps].sort((a, b) => {
    if (key === "debt") {
      if (a.debt === null && b.debt === null) return 0;
      if (a.debt === null) return 1;
      if (b.debt === null) return -1;
      return dir * (a.debt - b.debt);
    }
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
    return dir * String(av).localeCompare(String(bv));
  });
}

/** The default sort direction for a column: names and text ascend, counts and money descend. */
export function defaultDir(key: TableSortKey): 1 | -1 {
  return key === "name" || key === "provider" || key === "func" ? 1 : -1;
}
