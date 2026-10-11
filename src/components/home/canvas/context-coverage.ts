import type {
  ChapterId,
  HomeRecordRenderSource,
  HomeReviewBundle,
  Signal,
} from "@/lib/home/preview/types";
import { canvasBusiness, narrativeIsCurrent } from "./canvas-model";

const SUBJECTS: Record<ChapterId, string[]> = {
  executive_brief: [
    "tenant_profile",
    "program_initiative",
    "risk_or_control",
    "metric_outcome",
    "ai_value_realization_signal",
  ],
  our_business: ["tenant_profile", "business_segment", "business_function"],
  strategy_value_creation: [
    "program_initiative",
    "ai_automation_use_case",
    "vendor_contract",
  ],
  how_we_operate: [
    "business_function",
    "business_segment",
    "org_owner",
    "organization_ownership",
    "workforce_role",
    "operational_process_evidence",
    "operational_process",
    "managed_service_scope",
  ],
  technology_data: [
    "application_system",
    "data_asset_or_integration",
    "infrastructure_platform",
    "platform_maturity_assessment",
    "ai_tool_usage_observation",
  ],
  performance_value: [
    "metric_outcome",
    "spend_value_fact",
    "ai_value_realization_signal",
    "ai_kpi_outcome_observation",
  ],
  leadership_perspective: [
    "ai_value_interview_evidence",
    "executive_interview",
  ],
  what_needs_attention: ["risk_or_control", "risk_control", "evidence_source"],
};

export function chapterContext(
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
  chapterId: ChapterId,
) {
  if (!narrativeIsCurrent(source)) return [];
  const allowed = new Set(SUBJECTS[chapterId]);
  return [
    ...bundle.thesis.signalPacket.contextItems,
    ...bundle.thesis.signalPacket.signals,
  ].filter(
    (item) =>
      item.domains.some((domain) => allowed.has(domain)) ||
      (chapterId === "strategy_value_creation" &&
        item.statement.startsWith("Declared strategic priority:")),
  );
}

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
export interface LeadershipExcerpt {
  text: string;
  role: string;
  theme: string;
  basis: string;
  evidenceIds: string[];
  sourceRefs: string[];
}
export interface LeadershipTheme {
  name: string;
  count: number;
  unit: string;
  sourceRefs: string[];
}

// Reviewed packets serialize selected testimony in this compiler-owned sentence format.
export function selectedTestimony(
  signal: Signal,
  synthetic: boolean,
): LeadershipExcerpt | null {
  if (signal.kind !== "testimony") return null;
  const match =
    /^A (.+?) said, on the theme of "([^"]+)"(?: \([^)]+ sentiment\))?: "([\s\S]+)"$/.exec(
      signal.statement,
    );
  if (!match) return null;
  return {
    role: match[1],
    theme: match[2],
    text: match[3].replace(/^"([\s\S]*)"$/, "$1"),
    basis: synthetic
      ? "Illustrative quote - synthetic reference, not client testimony"
      : "Recorded excerpt - transcript basis not supplied",
    evidenceIds: [signal.id],
    sourceRefs: [],
  };
}

export function leadershipContext(
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
) {
  const family = bundle.technologyEstate?.recordTypes.find(
    (item) => item.objectType === "executive_interview",
  );
  if (family) {
    const byTheme = new Map<string, Set<string>>();
    const excerpts: LeadershipExcerpt[] = [];
    family.rows.forEach((row, i) => {
      const theme = text(row.priorityTheme) || "Theme not recorded";
      const area = text(row.executiveArea);
      const members = byTheme.get(theme) ?? new Set<string>();
      if (area) members.add(area);
      byTheme.set(theme, members);
      const response = text(row.response);
      if (response)
        excerpts.push({
          text: response,
          role: text(row.stakeholderRole) || "Role not recorded",
          theme,
          basis: /modelled/i.test(text(row.responseBasis))
            ? "Modelled response - not a transcript"
            : text(row.responseBasis) === "attributed"
              ? bundle.declaredSyntheticDemo
                ? "Attributed response - synthetic reference, not client testimony"
                : "Attributed response"
              : "Response basis not supplied",
          evidenceIds: [],
          sourceRefs: family.rowSourceRefs?.[i] ?? [],
        });
    });
    return {
      available: true,
      themes: [...byTheme].map(([name, members]) => ({
        name,
        count: members.size,
        unit: "executive areas",
        sourceRefs: [],
      })),
      excerpts,
      basis:
        "Current interview rows; breadth counts distinct executive areas, not answers.",
    };
  }
  if (!narrativeIsCurrent(source))
    return {
      available: false,
      themes: [],
      excerpts: [],
      basis:
        "Current interview detail is not supplied. Earlier excerpts are not current testimony.",
    };
  const packet = bundle.thesis.signalPacket;
  const themes: LeadershipTheme[] = (
    packet.visualDatasets.leadership_theme_frequency ?? []
  )
    .filter(
      (row) =>
        typeof row.theme === "string" &&
        typeof row.leaderCount === "number" &&
        Number.isFinite(row.leaderCount),
    )
    .map((row) => ({
      name: String(row.theme),
      count: Number(row.leaderCount),
      unit: "leaders",
      sourceRefs: [],
    }));
  return {
    available: true,
    themes,
    excerpts: packet.signals
      .map((signal) =>
        selectedTestimony(signal, Boolean(bundle.declaredSyntheticDemo)),
      )
      .filter((item): item is LeadershipExcerpt => item !== null),
    basis:
      "Aligned compiled themes and selected excerpts. Selected quotes are not the full interview corpus or a balanced sample of roles.",
  };
}

export function operatingContext(
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
) {
  const business = canvasBusiness(bundle, source);
  const context = business.context;
  const families = bundle.technologyEstate?.recordTypes ?? [];
  const segmentRows = families.find(
    (family) => family.objectType === "business_segment",
  );
  const functionRows = families.find(
    (family) => family.objectType === "business_function",
  );
  const segments = context
    ? context.segmentSpine.segments.map((segment) => {
        const fact = context.segmentFacts[segment.segmentKey];
        const row = segmentRows?.rows.find(
          (candidate) => candidate.segmentKey === segment.segmentKey,
        );
        return {
          key: segment.segmentKey,
          name: segment.segmentName,
          owner: segment.pnlOwnerRole || null,
          revenue: fact?.revenueUsd ?? null,
          share: fact?.revenueSharePct ?? null,
          governance: text(row?.governanceCouncil),
          regulation: text(row?.regulatoryRegime),
          sourceRefs: fact?.sourceRefs ?? [],
          evidenceIds: [] as string[],
          functions: context.functions
            .filter((fn) => fn.segmentKey === segment.segmentKey)
            .map((fn) => ({
              name: fn.title,
              owner: fn.executiveOwner,
              applications: fn.applicationCount,
              programs: fn.programCount,
              risks: fn.riskCount,
              sourceRefs: fn.sourceRefs,
            })),
        };
      })
    : segmentRows
      ? segmentRows.rows.map((row, i) => ({
          key: text(row.segmentKey),
          name: text(row.segmentName) || "Unnamed segment",
          owner: text(row.pnlOwnerRole) || null,
          revenue: typeof row.revenueUsd === "number" ? row.revenueUsd : null,
          share:
            typeof row.revenueSharePct === "number"
              ? row.revenueSharePct
              : null,
          governance: text(row.governanceCouncil),
          regulation: text(row.regulatoryRegime),
          sourceRefs: segmentRows.rowSourceRefs?.[i] ?? [],
          evidenceIds: [] as string[],
          functions: (functionRows?.rows ?? [])
            .map((fn, index) => ({
              fn,
              sourceRefs: functionRows?.rowSourceRefs?.[index] ?? [],
            }))
            .filter(
              ({ fn }) =>
                text(row.segmentKey) &&
                text(fn.businessSegmentKey) === text(row.segmentKey),
            )
            .map(({ fn, sourceRefs }) => ({
              name: text(fn.functionName),
              owner: text(fn.executiveOwner) || null,
              applications: null,
              programs: null,
              risks: null,
              sourceRefs,
            })),
        }))
      : business.segments.map((name) => ({
          key: name,
          name,
          owner: null,
          revenue: null,
          share: null,
          governance: "",
          regulation: "",
          functions: [],
          sourceRefs: [] as string[],
          evidenceIds: narrativeIsCurrent(source)
            ? bundle.thesis.signalPacket.contextItems
                .filter((item) =>
                  item.statement.startsWith("Operating segments:"),
                )
                .map((item) => item.id)
            : [],
        }));
  const applications = families.find(
    (family) => family.objectType === "application_system",
  );
  const groups = new Map<
    string,
    {
      name: string;
      count: number;
      businessOwners: Set<string>;
      technologyOwners: Set<string>;
      sourceRefs: string[];
    }
  >();
  for (const [index, row] of (applications?.rows ?? []).entries()) {
    const name = text(row.businessFunction) || "Function not recorded";
    const group = groups.get(name) ?? {
      name,
      count: 0,
      businessOwners: new Set<string>(),
      technologyOwners: new Set<string>(),
      sourceRefs: [],
    };
    group.count++;
    group.sourceRefs.push(...(applications?.rowSourceRefs?.[index] ?? []));
    if (text(row.businessOwner))
      group.businessOwners.add(text(row.businessOwner));
    if (text(row.technologyOwner))
      group.technologyOwners.add(text(row.technologyOwner));
    groups.set(name, group);
  }
  return {
    segments,
    accountability: [...groups.values()].sort((a, b) => b.count - a.count),
    signals: chapterContext(bundle, source, "how_we_operate").filter(
      (item): item is Signal =>
        "kind" in item &&
        typeof item.kind === "string" &&
        ["workforce", "operational"].includes(item.kind),
    ),
    hasDeclaredMapping: Boolean(context || (segmentRows && functionRows)),
    accountabilityAvailable: Boolean(applications),
    signalsAvailable: narrativeIsCurrent(source),
  };
}

export function flowRecords(bundle: HomeReviewBundle) {
  const family = bundle.technologyEstate?.recordTypes.find(
    (item) => item.objectType === "data_asset_or_integration",
  );
  const rows = (family?.rows ?? [])
    .map((row, index) => ({
      row,
      index,
      sourceRefs: family?.rowSourceRefs?.[index] ?? [],
    }))
    .filter(
      ({ row }) =>
        row.recordKind !== "data_analytics_workload" &&
        (!text(row.currentStateOrTargetState) ||
          row.currentStateOrTargetState === "current_state"),
    );
  const pairs = new Map<
    string,
    {
      source: string;
      target: string;
      mechanism: string;
      platform: string;
      members: typeof rows;
    }
  >();
  for (const item of rows) {
    const source = text(item.row.sourceSystem),
      target = text(item.row.targetSystem);
    if (!source || !target) continue;
    const mechanism = text(item.row.integrationType),
      platform = text(item.row.platformOrDatabase);
    const key = JSON.stringify([source, target, mechanism, platform]);
    const pair = pairs.get(key) ?? {
      source,
      target,
      mechanism,
      platform,
      members: [],
    };
    pair.members.push(item);
    pairs.set(key, pair);
  }
  return {
    family,
    rows,
    pairs: [...pairs.values()].sort(
      (a, b) => b.members.length - a.members.length,
    ),
    missingEndpoints: rows.filter(
      ({ row }) => !text(row.sourceSystem) || !text(row.targetSystem),
    ).length,
    unstatedState: rows.filter(
      ({ row }) => !text(row.currentStateOrTargetState),
    ).length,
  };
}
