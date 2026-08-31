/**
 * Deterministic segmentation of the application estate.
 *
 * The four axes an executive actually asks about -- what kind of system is it, where does it run,
 * which part of the business does it serve, is it clinical -- are three columns and one declared
 * mapping. None of it needs a model, and giving the segmentation to a model is how you get
 * categories that read well and do not reconcile to a count.
 *
 * The one axis the source does not carry is archetype: `system_type` has two values, COTS and
 * Custom-built, which is build-versus-buy rather than what the system is for. `system_category`
 * does carry it, in 79 free-text values, so the archetype is a lookup over a declared map rather
 * than a per-row classification. A model may propose that map once; a human owns it after that,
 * and the classification is then re-derivable rather than regenerated.
 *
 * Every cell of every crosstab here traces to rows, so a number on a page can be checked by
 * filtering the source file.
 */

export interface SegmentationMap {
  map_id: string;
  archetypes: string[];
  system_category_to_archetype: Record<string, string>;
  business_function_map: Record<string, { line: string; clinical: boolean; office: string; contested?: string }>;
  deployment_model_map: Record<string, string>;
}

export interface ApplicationRow {
  system_name?: string;
  system_category?: string;
  business_function?: string;
  deployment_model?: string;
  annual_cost_usd?: string;
  criticality?: string;
  lifecycle_state?: string;
  [key: string]: string | undefined;
}

export interface SegmentedApplication {
  systemName: string;
  archetype: string;
  hosting: string;
  line: string;
  clinical: "clinical" | "non_clinical";
  office: string;
  annualCostUsd: number;
  /** Anything the declared map does not cover, named rather than bucketed into an "other". */
  unmapped: string[];
}

const UNMAPPED = "Unmapped";

export function segmentApplications(rows: ApplicationRow[], map: SegmentationMap): SegmentedApplication[] {
  return rows.map((row) => {
    const category = (row.system_category ?? "").trim();
    const fn = (row.business_function ?? "").trim();
    const deployment = (row.deployment_model ?? "").trim();
    const fnEntry = map.business_function_map[fn];
    const unmapped: string[] = [];
    if (category && !map.system_category_to_archetype[category]) unmapped.push(`system_category:${category}`);
    if (fn && !fnEntry) unmapped.push(`business_function:${fn}`);
    if (deployment && !map.deployment_model_map[deployment]) unmapped.push(`deployment_model:${deployment}`);

    return {
      systemName: (row.system_name ?? "").trim(),
      archetype: map.system_category_to_archetype[category] ?? UNMAPPED,
      hosting: map.deployment_model_map[deployment] ?? UNMAPPED,
      line: fnEntry?.line ?? UNMAPPED,
      clinical: fnEntry?.clinical ? "clinical" : "non_clinical",
      office: fnEntry?.office ?? UNMAPPED,
      annualCostUsd: parseCost(row.annual_cost_usd),
      unmapped,
    };
  });
}

function parseCost(raw: string | undefined): number {
  const value = Number(String(raw ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export interface Crosstab {
  rowKey: string;
  colKey: string;
  rows: string[];
  cols: string[];
  /** cells[rowValue][colValue] = { apps, annualCostUsd } */
  cells: Record<string, Record<string, { apps: number; annualCostUsd: number }>>;
  rowTotals: Record<string, { apps: number; annualCostUsd: number }>;
  colTotals: Record<string, { apps: number; annualCostUsd: number }>;
  total: { apps: number; annualCostUsd: number };
}

export function crosstab(
  apps: SegmentedApplication[],
  rowKey: keyof SegmentedApplication,
  colKey: keyof SegmentedApplication,
): Crosstab {
  const cells: Crosstab["cells"] = {};
  const rowTotals: Crosstab["rowTotals"] = {};
  const colTotals: Crosstab["colTotals"] = {};
  const total = { apps: 0, annualCostUsd: 0 };

  for (const app of apps) {
    const r = String(app[rowKey]);
    const c = String(app[colKey]);
    cells[r] = cells[r] ?? {};
    cells[r][c] = cells[r][c] ?? { apps: 0, annualCostUsd: 0 };
    cells[r][c].apps += 1;
    cells[r][c].annualCostUsd += app.annualCostUsd;
    rowTotals[r] = rowTotals[r] ?? { apps: 0, annualCostUsd: 0 };
    rowTotals[r].apps += 1;
    rowTotals[r].annualCostUsd += app.annualCostUsd;
    colTotals[c] = colTotals[c] ?? { apps: 0, annualCostUsd: 0 };
    colTotals[c].apps += 1;
    colTotals[c].annualCostUsd += app.annualCostUsd;
    total.apps += 1;
    total.annualCostUsd += app.annualCostUsd;
  }

  return {
    rowKey: String(rowKey),
    colKey: String(colKey),
    rows: Object.keys(rowTotals).sort((a, b) => rowTotals[b].apps - rowTotals[a].apps),
    cols: Object.keys(colTotals).sort((a, b) => colTotals[b].apps - colTotals[a].apps),
    cells, rowTotals, colTotals, total,
  };
}

/**
 * Share of the estate serving a business line, against that line's share of revenue. This is the
 * comparison an executive is actually making, and it is the one the raw counts do not show: a line
 * carrying 40% of revenue on 8% of the applications is either the finding of the engagement or a
 * hole in the record, and either way nobody should have to compute it by hand to notice.
 */
export function estateVersusRevenue(
  apps: SegmentedApplication[],
  revenueShareByLine: Record<string, number>,
): Array<{ line: string; apps: number; appShare: number; costShare: number; revenueShare: number | null; gapVsRevenue: number | null }> {
  const totalApps = apps.length;
  const totalCost = apps.reduce((sum, app) => sum + app.annualCostUsd, 0);
  const byLine = new Map<string, { apps: number; cost: number }>();
  for (const app of apps) {
    const entry = byLine.get(app.line) ?? { apps: 0, cost: 0 };
    entry.apps += 1;
    entry.cost += app.annualCostUsd;
    byLine.set(app.line, entry);
  }

  return [...byLine.entries()]
    .map(([line, entry]) => {
      const appShare = totalApps ? round(100 * entry.apps / totalApps) : 0;
      const costShare = totalCost ? round(100 * entry.cost / totalCost) : 0;
      const revenueShare = revenueShareByLine[line] ?? null;
      return {
        line,
        apps: entry.apps,
        appShare,
        costShare,
        revenueShare,
        gapVsRevenue: revenueShare === null ? null : round(costShare - revenueShare),
      };
    })
    .sort((a, b) => b.apps - a.apps);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
