import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";
import type { AtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";
import type { AtlasSuggestion } from "@/lib/atlas/types";
import type { TowerBudgetRollup } from "@/lib/tower/tower-budget-rollups";

export interface TowerFactualSpineResult {
  response: string;
  suggestions: AtlasSuggestion[];
  matchedIntent: string;
}

const PRESSURE_FLAGS = new Set([
  "cost_overrun",
  "value_lag",
  "stalled",
  "duplication_risk",
  "adoption_gap",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
}

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "not loaded";
  if (Math.abs(value) >= 1_000_000_000)
    return `$${trimFixed(value / 1_000_000_000, 3)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function trimFixed(value: number, digits: number): string {
  return value
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function labelize(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayLabel(value: string | null | undefined): string {
  const label = labelize(value);
  if (!label) return "";
  if (!/[_-]/.test(String(value ?? "")) && /[A-Z]/.test(label.slice(1))) {
    return label;
  }
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function compactList(items: string[], limit = 6): string {
  return items.slice(0, limit).join("; ");
}

function moneySort<T>(
  items: readonly T[],
  accessor: (item: T) => number | null | undefined,
): T[] {
  return [...items].sort((a, b) => (accessor(b) ?? 0) - (accessor(a) ?? 0));
}

function requestedCount(question: string, fallback = 10): number {
  const match = question.match(/\btop\s+(\d{1,2})\b/i);
  if (!match) return fallback;
  return Math.max(1, Math.min(25, Number(match[1])));
}

function valueLabel(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? formatMoney(value)
    : "not tracked";
}

function statusLabel(value: string | null | undefined): string {
  const label = labelize(value);
  return label || "not loaded";
}

function ownerLabel(initiative: AIInitiative): string {
  return initiative.ownerName || initiative.ownerTitle || "owner not loaded";
}

function isAiProgram(initiative: AIInitiative): boolean {
  const text = [
    initiative.name,
    initiative.description,
    initiative.primaryCategoryId,
    initiative.primaryCategoryName,
    initiative.secondaryCategoryId,
    initiative.secondaryCategoryName,
    initiative.primaryGoalId,
    initiative.primaryGoalName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(ai|agentic|automation|automated|copilot|genai|machine learning|ml|predictive|forecast|optimization|decisioning|intelligence)\b/.test(
    text,
  );
}

function sum(values: Iterable<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) total += value;
  }
  return total;
}

function budgetRollupLine(rollup: TowerBudgetRollup): string {
  const details = [
    `${displayLabel(rollup.portfolioCompany)}: ${formatMoney(rollup.totalItBudgetUsd)}`,
    rollup.actualSpendYtdUsd > 0
      ? `${formatMoney(rollup.actualSpendYtdUsd)} YTD`
      : null,
    rollup.runAmountUsd > 0 ? `${formatMoney(rollup.runAmountUsd)} run` : null,
    rollup.changeAmountUsd > 0
      ? `${formatMoney(rollup.changeAmountUsd)} change`
      : null,
  ].filter(Boolean);
  return details.join(", ");
}

function findInitiativeByQuestion(
  initiatives: readonly AIInitiative[],
  question: string,
): AIInitiative | null {
  const q = normalize(question);
  const scored = initiatives
    .map((initiative) => {
      const name = normalize(initiative.name);
      const tokens = name.split(" ").filter((token) => token.length > 2);
      const score = tokens.reduce(
        (n, token) => n + (q.includes(token) ? 1 : 0),
        0,
      );
      return { initiative, score };
    })
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.initiative ?? null;
}

function vendorAggregates(vendors: readonly AIInitiativeVendorRow[]): Array<{
  vendorName: string;
  value: number;
  rows: number;
}> {
  const byVendor = new Map<
    string,
    { vendorName: string; value: number; rows: number }
  >();
  for (const vendor of vendors) {
    const key = normalize(vendor.vendorName);
    const current = byVendor.get(key) ?? {
      vendorName: vendor.vendorName,
      value: 0,
      rows: 0,
    };
    current.value += vendor.contractValueUsd ?? 0;
    current.rows += 1;
    byVendor.set(key, current);
  }
  return [...byVendor.values()].sort((a, b) => b.value - a.value);
}

function suggestions(): AtlasSuggestion[] {
  return [
    {
      label: "Compare value proof",
      value: "Compare the loaded budget against measured value proof.",
      kind: "message",
    },
    {
      label: "Vendor exposure",
      value: "Who are the top vendors by contract value?",
      kind: "message",
    },
    {
      label: "Pressure flags",
      value: "How many programs are not marked healthy?",
      kind: "message",
    },
  ];
}

function buildTotalBudgetAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  if (state.budgetRollups.length === 0) return null;
  const total = sum(
    state.budgetRollups.map((rollup) => rollup.totalItBudgetUsd),
  );
  return {
    matchedIntent: "tower_total_it_budget",
    response: [
      `The loaded Tower IT budget is ${formatMoney(total)} across ${state.budgetRollups.length} budget rollups.`,
      `Breakdown: ${compactList(state.budgetRollups.map(budgetRollupLine), 8)}.`,
      "The useful comparison is whether that budget is matched by measured value, vendor exposure, and pressure flags.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildBudgetByPortfolioAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  if (state.budgetRollups.length === 0) return null;
  return {
    matchedIntent: "tower_budget_by_portfolio_company",
    response: [
      `Tower has ${state.budgetRollups.length} loaded budget rollups.`,
      `Breakdown: ${compactList(state.budgetRollups.map(budgetRollupLine), 8)}.`,
      "The next useful cut is ranking those rollups by value proof and pressure exposure.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildSingleCompanyBudgetAnswer(
  state: AtlasTowerCurrentState,
  question: string,
): TowerFactualSpineResult | null {
  const q = normalize(question);
  const match = state.budgetRollups.find((rollup) =>
    normalize(rollup.portfolioCompany)
      .split(" ")
      .filter((part) => part.length > 3)
      .some((part) => q.includes(part)),
  );
  if (!match) return null;
  return {
    matchedIntent: "tower_single_company_budget",
    response: [
      `${displayLabel(match.portfolioCompany)} has ${formatMoney(match.totalItBudgetUsd)} of loaded FY Tower IT budget.`,
      `Spend shape: ${formatMoney(match.actualSpendYtdUsd)} YTD, ${formatMoney(match.runAmountUsd)} run, ${formatMoney(match.changeAmountUsd)} change, ${formatMoney(match.vendorAmountUsd)} vendor, ${formatMoney(match.laborAmountUsd)} labor.`,
      "The right follow-up is comparing this company against the rest of the portfolio.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildInitiativeBudgetAnswer(
  state: AtlasTowerCurrentState,
  question: string,
): TowerFactualSpineResult | null {
  const initiative = findInitiativeByQuestion(state.initiatives, question);
  if (!initiative) return null;
  return {
    matchedIntent: "tower_initiative_budget",
    response: [
      `${initiative.name} has ${formatMoney(initiative.committedAnnualUsd)} of annual budget in Tower.`,
      `Measured value is ${formatMoney(initiative.measuredValueUsd)}; owner is ${initiative.ownerName || "not loaded"}; status is ${labelize(initiative.statusFlag) || "not loaded"}.`,
      "Judge it against the dashboard's top program list and the available value proof before funding more work.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildTopVendorsAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  const top = vendorAggregates(state.vendors).slice(0, 5);
  if (top.length === 0) return null;
  return {
    matchedIntent: "tower_top_vendors",
    response: [
      `The top ${top.length} loaded vendors by contract value are ${compactList(
        top.map(
          (vendor) => `${vendor.vendorName}: ${formatMoney(vendor.value)}`,
        ),
        5,
      )}.`,
      "This is the same vendor-exposure rollup Tower uses for the dashboard; split vendor entries are aggregated by vendor name.",
      "The decision lens is renewal timing, concentration risk, and which initiatives each vendor supports.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildTopProgramsAnswer(
  state: AtlasTowerCurrentState,
  question: string,
): TowerFactualSpineResult | null {
  if (state.initiatives.length === 0) return null;
  const count = requestedCount(question, 10);
  const top = moneySort(
    state.initiatives.filter(
      (initiative) =>
        typeof initiative.committedAnnualUsd === "number" &&
        initiative.committedAnnualUsd > 0,
    ),
    (initiative) => initiative.committedAnnualUsd,
  ).slice(0, count);
  if (top.length === 0) return null;
  const valueLagCount = top.filter(
    (initiative) => initiative.statusFlag === "value_lag",
  ).length;
  const lines = top.map((initiative, index) => {
    const measured = valueLabel(initiative.measuredValueUsd);
    const measuredClause =
      measured === "not tracked" ? "measured value not tracked" : `${measured} measured value`;
    return `${index + 1}. ${initiative.name} — ${formatMoney(
      initiative.committedAnnualUsd,
    )} budget; ${measuredClause}; ${ownerLabel(initiative)}; ${statusLabel(
      initiative.statusFlag,
    )}.`;
  });
  return {
    matchedIntent: "tower_top_it_programs",
    response: [
      `Top ${top.length} IT programs at ${state.client.clientName}, ranked by annual budget commitment.`,
      valueLagCount > 0
        ? `${valueLagCount} of these ${top.length} sit in value lag, so the CIO question is not just spend concentration; it is proof of value.`
        : "The largest programs do not show value-lag status in the current Tower view.",
      ...lines,
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildTopAiProgramsAnswer(
  state: AtlasTowerCurrentState,
  question: string,
): TowerFactualSpineResult | null {
  if (state.initiatives.length === 0) return null;
  const count = requestedCount(question, 5);
  const candidates = state.initiatives.filter(isAiProgram);
  const top = moneySort(
    candidates.filter(
      (initiative) =>
        typeof initiative.committedAnnualUsd === "number" &&
        initiative.committedAnnualUsd > 0,
    ),
    (initiative) => initiative.committedAnnualUsd,
  ).slice(0, count);
  if (top.length === 0) return null;
  const lines = top.map((initiative, index) => {
    const measured = valueLabel(initiative.measuredValueUsd);
    const measuredClause =
      measured === "not tracked" ? "measured value not tracked" : `${measured} measured value`;
    return `${index + 1}. ${initiative.name} — ${formatMoney(
      initiative.committedAnnualUsd,
    )} budget; ${measuredClause}; ${ownerLabel(initiative)}; ${statusLabel(
      initiative.statusFlag,
    )}.`;
  });
  const unmeasured = top.filter(
    (initiative) => initiative.measuredValueUsd === null,
  ).length;
  return {
    matchedIntent: "tower_top_ai_programs",
    response: [
      `Top ${top.length} AI programs at ${state.client.clientName}, ranked by annual budget commitment with measured value shown separately.`,
      unmeasured > 0
        ? `${unmeasured} of these ${top.length} do not yet have measured value, so do not treat budget size as ROI.`
        : "Every program in this cut has a measured-value field, but Tower still separates measured value from realized ROI.",
      ...lines,
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildMeasuredValueAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  if (state.initiatives.length === 0) return null;
  const withMeasured = state.initiatives.filter(
    (initiative) => initiative.measuredValueUsd !== null,
  );
  const totalMeasured = sum(
    withMeasured.map((initiative) => initiative.measuredValueUsd),
  );
  return {
    matchedIntent: "tower_total_measured_value",
    response: [
      `The loaded measured value across Tower initiatives is ${formatMoney(totalMeasured)} across ${withMeasured.length} of ${state.initiatives.length} initiatives.`,
      withMeasured.length < state.initiatives.length
        ? `${state.initiatives.length - withMeasured.length} initiatives still lack measured-value inputs, so this is an available total, not a full realized-value claim.`
        : "Every loaded initiative has a measured-value input.",
      "Rank the initiatives with measured value against the pressure list before treating this as portfolio performance.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildPressureAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  if (state.initiatives.length === 0) return null;
  const pressuring = state.initiatives.filter((initiative) =>
    PRESSURE_FLAGS.has(initiative.statusFlag),
  );
  const byFlag = new Map<string, number>();
  for (const initiative of pressuring) {
    const key = labelize(initiative.statusFlag);
    byFlag.set(key, (byFlag.get(key) ?? 0) + 1);
  }
  const breakdown = [...byFlag.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([flag, count]) => `${count} ${flag}`);
  return {
    matchedIntent: "tower_active_pressure_flags",
    response: [
      `Tower shows ${pressuring.length} active pressure flags across ${state.initiatives.length} loaded initiatives.`,
      breakdown.length
        ? `Breakdown: ${compactList(breakdown, 6)}.`
        : "Breakdown: none of the loaded initiatives are in pressure-bearing status.",
      "The management view should name the affected programs and the budget attached to them.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildNotHealthyAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  if (state.initiatives.length === 0) return null;
  const notHealthy = moneySort(
    state.initiatives.filter(
      (initiative) => initiative.statusFlag !== "healthy",
    ),
    (initiative) => initiative.committedAnnualUsd,
  );
  return {
    matchedIntent: "tower_not_healthy_programs",
    response: [
      `${notHealthy.length} of ${state.initiatives.length} loaded programs are not marked healthy.`,
      notHealthy.length
        ? `Largest by loaded annual budget: ${compactList(
            notHealthy
              .slice(0, 6)
              .map(
                (initiative) =>
                  `${initiative.name}: ${formatMoney(initiative.committedAnnualUsd)} (${labelize(initiative.statusFlag)})`,
              ),
            6,
          )}.`
        : "No loaded programs are in a non-healthy status.",
      "Separate true delivery risk from missing value proof before escalating this as a funding problem.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildRoiAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  const metric = state.bandMetrics.metrics.find(
    (item) => item.key === "portfolio_roi",
  );
  if (!metric) return null;
  return {
    matchedIntent: "tower_portfolio_roi",
    response: [
      metric.value === "gap" || metric.confidence === "none"
        ? "Tower cannot state a board-grade portfolio ROI from the loaded data."
        : `Tower cannot state a board-grade portfolio ROI from the loaded data. The current ${metric.value} is a directional initiative-value proxy, not a true portfolio ROI.`,
      `${metric.subtext}. ${metric.tooltip}`,
      "Do not use ROI in a board readout until measured value, actual spend basis, and benefit period are all explicit.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

function buildAdoptionAnswer(
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  const metric = state.bandMetrics.metrics.find(
    (item) => item.key === "adoption_rate",
  );
  if (!metric) return null;
  return {
    matchedIntent: "tower_adoption_rate",
    response: [
      metric.confidence === "low"
        ? `Tower shows ${metric.value} adoption as a low-confidence proxy, not true active-user adoption.`
        : `Tower shows ${metric.value} adoption from the loaded Tower metric.`,
      `${metric.subtext}. ${metric.tooltip}`,
      "The missing telemetry source determines whether this can move from proxy to measured adoption.",
    ].join("\n"),
    suggestions: suggestions(),
  };
}

export function buildTowerFactualSpineAnswer(
  question: string,
  state: AtlasTowerCurrentState,
): TowerFactualSpineResult | null {
  const q = normalize(question);
  const asksBudget = /\b(budget|spend|money|cost)\b/.test(q);
  const asksBreakdown =
    /\b(break down|breakdown|by portfolio|portfolio company|company)\b/.test(q);
  const asksTotalBudget =
    asksBudget &&
    /\b(total|loaded|overall|portfolio|tower|annual|committed)\b/.test(q) &&
    !/\b(vendor|vendors|contract|contracts|renewal|renewals|initiative|program|top|largest|biggest|by)\b/.test(
      q,
    );

  if (/\b(top|largest|biggest)\b/.test(q) && /\b(ai|agentic)\b/.test(q)) {
    return buildTopAiProgramsAnswer(state, question);
  }
  if (
    /\b(top|largest|biggest|list)\b/.test(q) &&
    /\b(programs?|initiatives?)\b/.test(q)
  ) {
    return buildTopProgramsAnswer(state, question);
  }
  if (asksBudget && /\b(warehouse automation|initiative|program)\b/.test(q)) {
    return buildInitiativeBudgetAnswer(state, question);
  }
  if (
    asksTotalBudget ||
    (asksBudget &&
      /\b(total|loaded|overall)\b/.test(q) &&
      /\b(it|tower)\b/.test(q))
  ) {
    return buildTotalBudgetAnswer(state);
  }
  if (asksBudget && /\b(my|our|it|tower)\b/.test(q)) {
    return buildTotalBudgetAnswer(state);
  }
  if (asksBudget && asksBreakdown) {
    return buildBudgetByPortfolioAnswer(state);
  }
  if (asksBudget) {
    const company = buildSingleCompanyBudgetAnswer(state, question);
    if (company) return company;
    const initiative = buildInitiativeBudgetAnswer(state, question);
    if (initiative) return initiative;
  }
  if (/\b(top|largest|biggest)\b/.test(q) && /\bvendor|contract\b/.test(q)) {
    return buildTopVendorsAnswer(state);
  }
  if (
    /\b(measured value|value proof|realized value)\b/.test(q) &&
    /\b(total|across|all)\b/.test(q)
  ) {
    return buildMeasuredValueAnswer(state);
  }
  if (
    /\b(active pressure|pressure flags?|flags?)\b/.test(q) &&
    /\b(how many|count|number)\b/.test(q)
  ) {
    return buildPressureAnswer(state);
  }
  if (/\b(not marked healthy|not healthy|unhealthy|non healthy)\b/.test(q)) {
    return buildNotHealthyAnswer(state);
  }
  if (/\b(portfolio roi|return on ai|roi)\b/.test(q)) {
    return buildRoiAnswer(state);
  }
  if (/\b(adoption rate|current adoption|scaled initiatives)\b/.test(q)) {
    return buildAdoptionAnswer(state);
  }

  return null;
}

export function isTowerFactualSpineCandidate(question: string): boolean {
  const q = normalize(question);
  return (
    /\b(budget|spend|money|cost)\b/.test(q) ||
    (/\b(top|largest|biggest|list)\b/.test(q) &&
      /\b(programs?|initiatives?)\b/.test(q)) ||
    /\b(value\s+gap|promised.*measured|unproven\s+value|least\s+proven)\b/.test(q) ||
    /\b(committed\s+value|value\s+has\s+been\s+proven|proven\s+so\s+far|claim(?:ed)?\s+yet|best\s+ai\s+investment\s+story)\b/.test(q) ||
    /\b(weak\s+value\s+evidence|weakest\s+evidence|missing\s+value\s+evidence|missing\s+value\s+proof|evidence\s+gap|under[- ]?proven)\b/.test(q) ||
    /\b(no\s+measured\s+value\s+evidence|measured\s+value\s+evidence|value\s+proof\s+missing|no\s+value\s+proof|value\s+evidence.*board|strong\s+enough.*board|board\s+discussion)\b/.test(q) ||
    /\b(inspect\s+this\s+week|what\s+should\s+i\s+inspect|where\s+should\s+i\s+focus|what\s+needs\s+(my\s+)?attention|next\s+funding\s+gate)\b/.test(q) ||
    /\b(healthy.*watched.*risk|watched.*risk|group(?:ed)?\s+by\s+business\s+function|program\s+owners?|largest\s+budget\s+responsibility|foundational\s+(?:data|platform)|platform\s+work|biggest\s+blockers?)\b/.test(q) ||
    /\b(investment\s+posture|posture\s+should\s+the\s+cio|cio\s+morning\s+brief|morning\s+brief|what\s+should\s+the\s+cio\s+know|executive\s+brief|advisor\s+brief)\b/.test(q) ||
    (/\b(top|largest|biggest)\b/.test(q) && /\bvendor|contract\b/.test(q)) ||
    /\b(contracts?\s+renew|renewals?\s+soon|vendor\s+relationships?|vendor\s+spend|vendor\s+exposure|vendor\s+concentration|procurement\s+challenge|vendor\s+review|contract\s+exposure)\b/.test(q) ||
    /\b(source\s+evidence|dashboard\s+evidence|board[- ]grade|claims?.*directional|directional.*proven|not\s+say\s+yet|evidence\s+is\s+missing|least\s+trustworthy|biggest\s+tower\s+risks?|cleanest\s+executive\s+summary)\b/.test(q) ||
    /\b(run\s+versus\s+change|run.*change|change.*run|capex.*opex|opex.*capex)\b/.test(q) ||
    (/\b(measured value|value proof|realized value)\b/.test(q) &&
      /\b(total|across|all)\b/.test(q)) ||
    (/\b(active pressure|pressure flags?|flags?)\b/.test(q) &&
      /\b(how many|count|number)\b/.test(q)) ||
    /\b(not marked healthy|not healthy|unhealthy|non healthy)\b/.test(q) ||
    /\b(portfolio roi|return on ai|roi)\b/.test(q) ||
    /\b(adoption rate|current adoption|scaled initiatives)\b/.test(q)
  );
}
