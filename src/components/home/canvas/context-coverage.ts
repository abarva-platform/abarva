import type {
  ChapterId,
  HomeRecordRenderSource,
  HomeReviewBundle,
  Signal,
  TechObjectType,
} from "@/lib/home/preview/types";
import { homeRecordSourceLabel } from "@/lib/home/preview/record-source";
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

export type ContextCoverageSubject = TechObjectType | "tenant_profile";

const COVERAGE_SUBJECTS: Record<
  ContextCoverageSubject,
  { label: string; domains: string[]; datasets?: string[] }
> = {
  tenant_profile: { label: "Enterprise profile", domains: ["tenant_profile"] },
  business_segment: { label: "Business segments", domains: ["business_segment"] },
  business_function: { label: "Business functions", domains: ["business_function"] },
  workforce_role: { label: "Workforce & roles", domains: ["workforce_role"] },
  operational_process: {
    label: "Operating processes",
    domains: ["operational_process", "operational_process_evidence"],
  },
  application_system: {
    label: "Applications & systems",
    domains: ["application_system"],
    datasets: ["application_landscape_by_function"],
  },
  vendor_contract: {
    label: "Vendor contracts",
    domains: ["vendor_contract"],
    datasets: ["vendor_spend_concentration"],
  },
  infrastructure_platform: {
    label: "Infrastructure & platforms",
    domains: ["infrastructure_platform", "platform_maturity_assessment"],
  },
  data_asset_or_integration: {
    label: "Data assets & integrations",
    domains: ["data_asset_or_integration"],
  },
  metric_outcome: {
    label: "Metrics & outcomes",
    domains: ["metric_outcome", "ai_kpi_outcome_observation"],
    datasets: ["metric_target_attainment"],
  },
  risk_control: {
    label: "Risks & controls",
    domains: ["risk_control", "risk_or_control"],
    datasets: ["risk_system_concentration"],
  },
  program_initiative: {
    label: "Programs & initiatives",
    domains: ["program_initiative"],
    datasets: ["program_investment_distribution", "stalled_programs"],
  },
  organization_ownership: {
    label: "Organization & ownership",
    domains: ["organization_ownership", "org_owner"],
  },
  ai_use_case: {
    label: "AI & automation use cases",
    domains: ["ai_use_case", "ai_automation_use_case"],
  },
  executive_interview: {
    label: "Leadership interviews",
    domains: ["executive_interview", "ai_value_interview_evidence"],
    datasets: ["leadership_theme_frequency", "leadership_evidence_alignment"],
  },
  relationship_edge: {
    label: "Declared relationships",
    domains: ["relationship_edge", "relationship_source_row"],
  },
};

export interface ContextCoverage {
  subject: ContextCoverageSubject;
  label: string;
  state: "detail" | "summary" | "profile" | "missing";
  value: string;
  basis: string;
  detailState: "available" | "empty" | "not_supplied";
  rowCount: number | null;
  rowSourceRefs: string[][] | null;
  summaryState: "available" | "not_supplied" | "not_aligned";
  summaryEvidenceIds: string[];
  summaryDatasetKeys: string[];
  profileState: "available" | "not_supplied";
  profileEvidenceIds: string[];
  profileSourceRefs: string[];
  recordSource: HomeRecordRenderSource;
}

// Summary IDs and chart rows describe coverage; they are never a count of detail records.
export function recordCoverage(
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
  subject: ContextCoverageSubject,
): ContextCoverage {
  const definition = COVERAGE_SUBJECTS[subject];
  const packet = bundle.thesis.signalPacket;
  const aligned = narrativeIsCurrent(source);
  const family = bundle.technologyEstate?.recordTypes.find(
    (item) => item.objectType === subject,
  );
  const rowCount = family?.rows.length ?? null;
  const detailState =
    rowCount === null
      ? "not_supplied"
      : rowCount > 0
        ? "available"
        : "empty";
  const profileItems = packet.contextItems.filter((item) =>
    subject === "tenant_profile"
      ? item.domains.includes("tenant_profile")
      : subject === "business_segment" &&
        item.statement.startsWith("Operating segments:"),
  );
  const business = canvasBusiness(bundle, source);
  const hasProfile =
    subject === "tenant_profile"
      ? Boolean(
          business.businessModel ||
          business.industry ||
          business.revenue !== null ||
          business.employees !== null ||
          business.priorities.length ||
          business.customers.length ||
          business.segments.length ||
          (aligned && profileItems.length),
        )
      : subject === "business_segment" && business.segments.length > 0;
  const summaryItems =
    subject === "tenant_profile"
      ? []
      : [...packet.contextItems, ...packet.signals].filter(
          (item) =>
            item.statement.trim() &&
            !item.statement.startsWith("Operating segments:") &&
            item.domains.some((domain) => definition.domains.includes(domain)),
        );
  const datasetKeys = (definition.datasets ?? []).filter(
    (key) => packet.visualDatasets[key]?.length > 0,
  );
  const hasSummary = summaryItems.length > 0 || datasetKeys.length > 0;
  const summaryState = hasSummary
    ? aligned
      ? "available"
      : "not_aligned"
    : "not_supplied";
  const state =
    detailState === "available"
      ? "detail"
      : summaryState === "available"
        ? "summary"
        : hasProfile
          ? "profile"
          : "missing";
  const value =
    state === "detail"
      ? rowCount!.toLocaleString("en-US")
      : state === "summary"
        ? "Summary available"
        : state === "profile"
          ? "Profile declared"
          : rowCount === 0
            ? "0"
            : "Detail not supplied";
  const detailBasis =
    detailState === "available"
      ? "Inspectable detail rows in this record; not a whole-enterprise count."
      : detailState === "empty"
        ? "This family contains no detail rows in this record; enterprise coverage is unknown."
        : "Detail rows are not supplied in this record; enterprise coverage is unknown.";
  const summaryBasis =
    summaryState === "available"
      ? "Compiled summary available; summary coverage does not establish detail coverage."
      : summaryState === "not_aligned"
        ? "Earlier compiled summary is not aligned with the served record."
        : "Compiled summary is not supplied for this subject.";
  return {
    subject,
    label: definition.label,
    state,
    value,
    basis: [
      homeRecordSourceLabel(source) + ".",
      detailBasis,
      summaryBasis,
      hasProfile ? "Declared profile context; not independently attested." : "",
      bundle.declaredSyntheticDemo
        ? "Synthetic reference, not client-attested."
        : "",
    ].filter(Boolean).join(" "),
    detailState,
    rowCount,
    rowSourceRefs: family?.rowSourceRefs ?? null,
    summaryState,
    summaryEvidenceIds: aligned ? summaryItems.map((item) => item.id) : [],
    summaryDatasetKeys: aligned ? datasetKeys : [],
    profileState: hasProfile ? "available" : "not_supplied",
    profileEvidenceIds:
      aligned && hasProfile ? profileItems.map((item) => item.id) : [],
    profileSourceRefs: hasProfile
      ? subject === "business_segment"
        ? Object.values(business.context?.segmentFacts ?? {}).flatMap(
            (fact) => fact.sourceRefs,
          )
        : business.context?.profile.sourceRefs ?? []
      : [],
    recordSource: source,
  };
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

interface OperatingFunction {
  name: string;
  owner: string | null;
  capabilities: string;
  budget: number | null;
  fte: number | null;
  parent: string;
  applications: number | null;
  programs: number | null;
  risks: number | null;
  sourceRefs: string[];
}

interface OperatingSegment {
  key: string;
  name: string;
  owner: string | null;
  revenue: number | null;
  share: number | null;
  governance: string;
  regulation: string;
  description: string;
  sourceRefs: string[];
  evidenceIds: string[];
  functions: OperatingFunction[];
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
  const functionDetail = (row: Record<string, unknown> | undefined) => ({
    capabilities: text(row?.businessCapabilities),
    budget:
      typeof row?.annualBudgetUsd === "number" &&
      Number.isFinite(row.annualBudgetUsd)
        ? row.annualBudgetUsd
        : null,
    fte:
      typeof row?.fteCount === "number" && Number.isFinite(row.fteCount)
        ? row.fteCount
        : null,
    parent: text(row?.parentFunction),
  });
  const segments: OperatingSegment[] = context
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
          description: text(row?.segmentNotes),
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
              ...functionDetail(
                functionRows?.rows.find(
                  (candidate) =>
                    candidate.functionId === fn.functionId &&
                    candidate.businessSegmentKey === segment.segmentKey,
                ),
              ),
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
          description: text(row.segmentNotes),
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
              ...functionDetail(fn),
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
          description: "",
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
    hasDeclaredMapping: segments.some(
      (segment) => segment.functions.length > 0,
    ),
    segmentsWithDetail: segments.filter(
      (segment) =>
        segment.owner ||
        segment.governance ||
        segment.regulation ||
        segment.description ||
        segment.functions.length,
    ).length,
    unlinkedFunctions: (functionRows?.rows ?? []).filter(
      (row) =>
        !segments.some(
          (segment) =>
            segment.key && segment.key === text(row.businessSegmentKey),
        ),
    ).length,
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
