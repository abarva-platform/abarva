import {
  URGENCY_ORDER,
  type DecisionUrgency,
  type SourceDecisionBundle,
  type SourceDecisionQueue,
} from "@/lib/source/decision-queue/types";

export type SourceTriageBand = "overdue" | "due_this_quarter" | "pipeline";
export type SourceTriageBandFilter = SourceTriageBand | "all";
export type SourceTriageSort = "deadline" | "value" | "vendor";

export const TRIAGE_BAND_ORDER: SourceTriageBand[] = [
  "overdue",
  "due_this_quarter",
  "pipeline",
];

export const TRIAGE_BAND_LABELS: Record<SourceTriageBand, string> = {
  overdue: "Overdue — act now",
  due_this_quarter: "Due this quarter",
  pipeline: "Pipeline",
};

export const TRIAGE_BAND_COPY: Record<SourceTriageBand, string> = {
  overdue: "Renewals past trigger window",
  due_this_quarter: "Events inside the quarter",
  pipeline: "Triggers 6+ months out",
};

export const TRIAGE_SORT_LABELS: Record<SourceTriageSort, string> = {
  deadline: "Deadline",
  value: "Value",
  vendor: "Vendor",
};

export interface SourceTriageBandSummary {
  band: SourceTriageBand;
  label: string;
  count: number;
  aggregateValueUsd: number;
  scopeClarityCount: number;
  context: string;
}

export interface SourceTriageQueueView {
  summaries: SourceTriageBandSummary[];
  visibleBundles: SourceDecisionBundle[];
  totalCount: number;
  overdueCount: number;
  aggregateValueThisQuarterUsd: number;
}

export function triageBandForUrgency(
  urgency: DecisionUrgency,
): SourceTriageBand {
  if (urgency === "due_now") return "overdue";
  if (urgency === "watch") return "pipeline";
  return "due_this_quarter";
}

export function normalizeTriageBandFilter(
  value: string | string[] | undefined,
): SourceTriageBandFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "overdue" || raw === "due_this_quarter" || raw === "pipeline") {
    return raw;
  }
  return "all";
}

export function normalizeTriageSort(
  value: string | string[] | undefined,
): SourceTriageSort {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "value" || raw === "vendor") return raw;
  return "deadline";
}

export function summarizeTriageBands(
  bundles: SourceDecisionBundle[],
): SourceTriageBandSummary[] {
  return TRIAGE_BAND_ORDER.map((band) => {
    const bandBundles = bundles.filter(
      (bundle) => triageBandForUrgency(bundle.urgency) === band,
    );
    const aggregateValueUsd = bandBundles.reduce(
      (sum, bundle) => sum + (bundle.valueAtStakeUsd ?? 0),
      0,
    );
    const scopeClarityCount = bandBundles.filter((bundle) =>
      bundle.subIssues.some((issue) => issue.kind === "blocked_missing_evidence"),
    ).length;
    return {
      band,
      label: TRIAGE_BAND_LABELS[band],
      count: bandBundles.length,
      aggregateValueUsd,
      scopeClarityCount,
      context: TRIAGE_BAND_COPY[band],
    };
  });
}

export function compareTriageBundles(
  sort: SourceTriageSort,
): (a: SourceDecisionBundle, b: SourceDecisionBundle) => number {
  return (a, b) => {
    if (sort === "value") {
      const byValue = (b.valueAtStakeUsd ?? -1) - (a.valueAtStakeUsd ?? -1);
      if (byValue !== 0) return byValue;
    }

    if (sort === "vendor") {
      const byVendor = a.vendorName.localeCompare(b.vendorName);
      if (byVendor !== 0) return byVendor;
    }

    const byBand =
      TRIAGE_BAND_ORDER.indexOf(triageBandForUrgency(a.urgency)) -
      TRIAGE_BAND_ORDER.indexOf(triageBandForUrgency(b.urgency));
    if (byBand !== 0) return byBand;

    const byUrgency = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (byUrgency !== 0) return byUrgency;

    const byValue = (b.valueAtStakeUsd ?? -1) - (a.valueAtStakeUsd ?? -1);
    if (byValue !== 0) return byValue;

    return a.vendorName.localeCompare(b.vendorName) || a.bundleId.localeCompare(b.bundleId);
  };
}

export function buildSourceTriageQueueView(
  queue: SourceDecisionQueue,
  options: {
    activeBand?: SourceTriageBandFilter;
    sort?: SourceTriageSort;
  } = {},
): SourceTriageQueueView {
  const activeBand = options.activeBand ?? "all";
  const sort = options.sort ?? "deadline";
  const summaries = summarizeTriageBands(queue.bundles);
  const visibleBundles = queue.bundles
    .filter(
      (bundle) =>
        activeBand === "all" || triageBandForUrgency(bundle.urgency) === activeBand,
    )
    .slice()
    .sort(compareTriageBundles(sort));
  const aggregateValueThisQuarterUsd = queue.bundles.reduce((sum, bundle) => {
    const band = triageBandForUrgency(bundle.urgency);
    if (band === "pipeline") return sum;
    return sum + (bundle.valueAtStakeUsd ?? 0);
  }, 0);

  return {
    summaries,
    visibleBundles,
    totalCount: queue.bundles.length,
    overdueCount: summaries.find((summary) => summary.band === "overdue")?.count ?? 0,
    aggregateValueThisQuarterUsd,
  };
}
