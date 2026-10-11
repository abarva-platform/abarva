import type {
  ChapterId,
  HomeRecordRenderSource,
  HomeReviewBundle,
  TechObjectType,
} from "@/lib/home/preview/types";
import type { EstateRecordTypes } from "../v4/chapter-page-content";

export const CHAPTER_CONTRACTS: Record<
  ChapterId,
  { title: string; purpose: string }
> = {
  executive_brief: {
    title: "Executive Brief",
    purpose: "The business, its priorities and the signals that matter.",
  },
  our_business: {
    title: "Our Business",
    purpose: "How the enterprise creates value and who it serves.",
  },
  strategy_value_creation: {
    title: "Strategy & Value Creation",
    purpose: "The priorities, investments and delivery behind the strategy.",
  },
  how_we_operate: {
    title: "How We Operate",
    purpose:
      "Organization, accountability and the platforms supporting delivery.",
  },
  technology_data: {
    title: "Technology & Data",
    purpose: "The systems, data and dependencies enabling the business.",
  },
  performance_value: {
    title: "Performance & Value",
    purpose: "Investment, measured outcomes and the strength of value proof.",
  },
  leadership_perspective: {
    title: "Leadership Perspective",
    purpose:
      "Shared concerns, less widely raised themes and the voices behind them.",
  },
  what_needs_attention: {
    title: "What Needs Attention",
    purpose: "Rated exposures, unresolved questions and ownership.",
  },
};

export type CanvasView =
  | ChapterId
  | "architecture"
  | "data-flow"
  | "browse-the-data"
  | "context"
  | `tech:${TechObjectType}`;
export type CanvasPanel = "overview" | "evidence" | "reading";

export function canvasViews(bundle: HomeReviewBundle): CanvasView[] {
  return [
    ...(Object.keys(CHAPTER_CONTRACTS) as ChapterId[]),
    "context",
    "architecture",
    "data-flow",
    "browse-the-data",
    ...(bundle.technologyEstate?.recordTypes ?? []).map(
      (family) => `tech:${family.objectType}` as CanvasView,
    ),
  ];
}

export function resolveCanvasLocation(
  params: Pick<URLSearchParams, "get">,
  bundle: HomeReviewBundle,
) {
  const requested = params.get("view");
  const view =
    canvasViews(bundle).find((candidate) => candidate === requested) ??
    "executive_brief";
  const panel =
    (["overview", "evidence", "reading"] as const).find(
      (candidate) => candidate === params.get("panel"),
    ) ?? "overview";
  return { view, panel };
}

export function canvasHref(
  params: { toString(): string },
  view: CanvasView,
  panel: CanvasPanel = "overview",
  query?: string,
) {
  const next = new URLSearchParams(params.toString());
  next.set("view", view);
  next.set("panel", panel);
  next.delete("q");
  if (query) next.set("q", query);
  return `/home?${next.toString()}`;
}

export function legacyCanvasView(hash: string, bundle: HomeReviewBundle) {
  try {
    const requested = decodeURIComponent(hash.replace(/^#/, "")).trim();
    return canvasViews(bundle).find((view) => view === requested) ?? null;
  } catch {
    return null;
  }
}

export function narrativeIsCurrent(source: HomeRecordRenderSource): boolean {
  return (
    source.kind !== "ecl_serving_projection" ||
    source.contextVersion?.coherence === "coherent"
  );
}

const FAMILY_KEYS: Partial<Record<TechObjectType, keyof EstateRecordTypes>> = {
  application_system: "applications",
  vendor_contract: "vendors",
  infrastructure_platform: "infrastructure",
  data_asset_or_integration: "data",
  metric_outcome: "metrics",
  risk_control: "risks",
  program_initiative: "programs",
  ai_use_case: "ai",
  organization_ownership: "organization",
  executive_interview: "interviews",
  relationship_edge: "relationships",
};

export function canvasEstate(bundle: HomeReviewBundle): EstateRecordTypes {
  const estate: EstateRecordTypes = {
    asOf: bundle.contextVersion?.dataAsOf ?? undefined,
  };
  for (const family of bundle.technologyEstate?.recordTypes ?? []) {
    const key = FAMILY_KEYS[family.objectType];
    if (key && key !== "asOf") estate[key] = family.rows;
  }
  return estate;
}

export function recordCount(
  bundle: HomeReviewBundle,
  objectType: TechObjectType,
): number | null {
  const family = bundle.technologyEstate?.recordTypes.find(
    (candidate) => candidate.objectType === objectType,
  );
  return family ? family.rows.length : null;
}

export function formatCanvasNumber(value: number | null): string {
  return value === null ? "Not recorded" : value.toLocaleString("en-US");
}

export function formatCanvasMoney(value: number | null): string {
  return value === null
    ? "Not recorded"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export interface BusinessMix {
  label: string;
  share: number;
  sourceRefs: string[];
}

// A declared split can be visualized, but not expanded into inferred segment dollars.
export function declaredRevenueSplit(
  text: string,
  sourceRefs: string[],
): BusinessMix[] {
  const match =
    /(?:^|[.;]\s*)Revenue splits\s+(\d+(?:\.\d+)?)%\s+([^/;]+?)\s*\/\s*(\d+(?:\.\d+)?)%\s+([^;.]+)(?:[;. ]|$)/i.exec(
      text,
    );
  if (!match || sourceRefs.length === 0) return [];
  const shares = [Number(match[1]), Number(match[3])];
  if (
    shares.some((share) => share < 0 || share > 100) ||
    Math.abs(shares[0] + shares[1] - 100) > 0.001
  )
    return [];
  return [
    { label: match[2].trim(), share: shares[0], sourceRefs },
    { label: match[4].trim(), share: shares[1], sourceRefs },
  ];
}

export function canvasBusiness(
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
) {
  const packet = bundle.thesis.signalPacket;
  const context = packet.homeEnterpriseContext;
  const current = narrativeIsCurrent(source);
  const identity = current ? packet.enterpriseIdentity : null;
  const economics = current ? packet.businessEconomics : null;
  const profileRefs =
    context?.profile.sourceRefs ??
    (current
      ? packet.contextItems
          .filter(
            (item) =>
              item.domains.includes("tenant_profile") &&
              item.statement.startsWith("Business model:"),
          )
          .map((item) => item.id)
      : []);
  const businessModel =
    context?.profile.businessModel ?? identity?.businessModel ?? "";
  const segmentFacts = Object.values(context?.segmentFacts ?? {});
  const structuredMix = segmentFacts
    .filter(
      (fact) => fact.revenueSharePct !== null && fact.sourceRefs.length > 0,
    )
    .map((fact) => ({
      label: fact.title,
      share: fact.revenueSharePct!,
      sourceRefs: fact.sourceRefs,
    }));
  const completeMix =
    structuredMix.length === segmentFacts.length &&
    structuredMix.length > 0 &&
    Math.abs(structuredMix.reduce((sum, item) => sum + item.share, 0) - 100) <
      0.001;
  const revenueMix = completeMix
    ? structuredMix
    : context
      ? []
      : declaredRevenueSplit(businessModel, profileRefs);
  const priorities = context
    ? context.priorities.map((priority) => ({
        text: priority.title,
        detail: priority.targetOutcome,
        refs: priority.sourceRefs,
      }))
    : current
      ? packet.strategicPriorities.map((text) => ({
          text: text.replace(/^\d+[.)]\s*/, ""),
          detail: null,
          refs: packet.contextItems
            .filter(
              (item) =>
                item.domains.includes("tenant_profile") &&
                item.statement.includes(text.replace(/^\d+[.)]\s*/, "")),
            )
            .map((item) => item.id),
        }))
      : [];
  return {
    revenue: context
      ? context.profile.annualRevenueUsd
      : finite(identity?.revenue),
    employees: finite(identity?.employeeCount),
    industry: identity?.industry ?? "",
    businessModel,
    profileRefs,
    revenueMix,
    priorities,
    segments: context
      ? segmentFacts.map((fact) => fact.title)
      : (economics?.operatingSegments ?? []),
    customers: economics?.customerSegments ?? [],
    context,
  };
}

export interface CanvasMetric {
  label: string;
  value: string;
  basis: string;
  objectType?: TechObjectType;
}

export function canvasMetrics(
  chapterId: ChapterId,
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
): CanvasMetric[] {
  const business = canvasBusiness(bundle, source);
  const count = (label: string, objectType: TechObjectType): CanvasMetric => ({
    label,
    objectType,
    value:
      recordCount(bundle, objectType) === null
        ? "Not supplied"
        : formatCanvasNumber(recordCount(bundle, objectType)),
    basis:
      recordCount(bundle, objectType) === null
        ? "Detail rows absent from this bundle; not an enterprise absence"
        : "Rows in the record on screen",
  });
  const profile: CanvasMetric[] = [
    {
      label: "Annual revenue",
      value: formatCanvasMoney(business.revenue),
      basis: "Declared enterprise profile",
    },
    {
      label: "People",
      value: formatCanvasNumber(business.employees),
      basis: "Declared enterprise profile",
    },
    {
      label: "Operating segments",
      value: business.segments.length
        ? String(business.segments.length)
        : "Not recorded",
      basis: "Declared business segments",
    },
    {
      label: "Strategic priorities",
      value: business.priorities.length
        ? String(business.priorities.length)
        : "Not recorded",
      basis: "Declared priorities, not a progress score",
    },
  ];
  switch (chapterId) {
    case "executive_brief": {
      const execution = narrativeIsCurrent(source)
        ? bundle.thesis.signalPacket.visualDatasets.stalled_programs
        : null;
      const completion = Array.isArray(execution)
        ? execution
            .filter(
              (row) =>
                typeof row.pctComplete === "number" &&
                Number.isFinite(row.pctComplete),
            )
            .map((row) => row.pctComplete as number)
        : [];
      return [
        profile[0],
        profile[3],
        {
          label: "Programs in execution exhibit",
          value: formatCanvasNumber(
            completion.length ? completion.length : null,
          ),
          basis: "Aligned execution exhibit, not whole portfolio",
        },
        {
          label: "Below 10% complete",
          value: completion.length
            ? `${completion.filter((value) => value < 10).length} / ${completion.length}`
            : "Not recorded",
          basis: "Programs in the aligned execution exhibit",
        },
      ];
    }
    case "our_business":
      return profile;
    case "strategy_value_creation":
      return [
        profile[3],
        count("Programs", "program_initiative"),
        count("AI use cases", "ai_use_case"),
        count("Vendor contracts", "vendor_contract"),
      ];
    case "how_we_operate":
      return [
        profile[2],
        count("Business functions", "business_function"),
        count("Organization records", "organization_ownership"),
        count("Platforms", "infrastructure_platform"),
      ];
    case "technology_data":
      return [
        count("Applications & systems", "application_system"),
        count("Data assets & integrations", "data_asset_or_integration"),
        count("Platforms", "infrastructure_platform"),
        count("Relationships", "relationship_edge"),
      ];
    case "performance_value": {
      const proof = business.context?.valueProof;
      return proof
        ? [
            {
              label: "Approved program budget",
              value: formatCanvasMoney(proof.approvedBudgetUsd),
              basis: `${proof.programCount} programs; ${proof.missingFinancialCount} with financial gaps`,
            },
            {
              label: "Program forecast",
              value: formatCanvasMoney(proof.forecastUsd),
              basis: "Recorded forecast, not realized value",
            },
            {
              label: "Over-budget programs",
              value: String(proof.overBudgetProgramCount),
              basis: "Forecast exceeds approved budget",
            },
            count("Outcome measures", "metric_outcome"),
          ]
        : [
            count("Outcome measures", "metric_outcome"),
            count("Programs", "program_initiative"),
            count("AI use cases", "ai_use_case"),
            count("Vendor contracts", "vendor_contract"),
          ];
    }
    case "leadership_perspective":
      return [
        count("Interview records", "executive_interview"),
        count("Organization records", "organization_ownership"),
        count("Business functions", "business_function"),
        count("Risk records", "risk_control"),
      ];
    case "what_needs_attention": {
      const risk = business.context?.riskTriage;
      return risk
        ? [
            count("Risk records", "risk_control"),
            {
              label: "High / critical",
              value: String(risk.highOrCritical),
              basis: "Severity rated in the record",
            },
            {
              label: "Partial controls",
              value: String(risk.partialControl),
              basis: "Control effectiveness recorded",
            },
            {
              label: "Unknown controls",
              value: String(risk.unknownControl),
              basis: "Not equivalent to uncontrolled",
            },
          ]
        : [
            count("Risk records", "risk_control"),
            count("Applications", "application_system"),
            count("Platforms", "infrastructure_platform"),
            count("Programs", "program_initiative"),
          ];
    }
  }
}
