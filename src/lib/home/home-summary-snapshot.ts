import crypto from "node:crypto";

import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";
import type { HomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import {
  buildHomeEnglishSummary,
  type HomeEnglishModuleImpact,
  type HomeEnglishSummary,
} from "@/lib/home/home-english-summary";
import type {
  HomeV6BrowserPreview,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";

export type HomeSummarySnapshotMode =
  | "active_home_context"
  | "candidate_preview";

export type HomeSummarySnapshotStatus =
  | "ready"
  | "ready_with_caveats"
  | "partial"
  | "blocked"
  | "not_available";

export interface HomeTenantProfileHeader {
  tenantId: string | null;
  tenantKey: string;
  displayName: string;
  industry: string | null;
  headquarters: string | null;
  revenue: string | null;
  revenueVerified: boolean;
  employees: string | null;
  employeesVerified: boolean;
  dataOrigin: string;
  mode: HomeSummarySnapshotMode;
  activeContextStatus: string;
  candidatePreviewStatus: string;
}

export interface HomeEnterpriseSnapshotMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
}

export interface HomeContextDepthWidth {
  loadedAreas: number;
  loadedRecords: number;
  sourceCount: number;
  evidenceCount: number;
  relationshipCount: number;
  visibleGaps: number;
  contextPosture: string;
}

export interface HomeContextAreaSummary {
  areaKey: string;
  displayName: string;
  executiveSummaryInputs: string[];
  loadedCount: number;
  mappedCount: number;
  sourceCount: number;
  evidenceCount: number;
  relationshipCount: number;
  examples: string[];
  topGaps: Array<{
    label: string;
    count: number;
    whyItMatters: string | null;
  }>;
  evidencePosture: string;
  relationshipDepth: string;
  answerability: string;
  safeQuestions: string[];
  unsupportedQuestions: string[];
  decisionsSupported: string[];
  decisionsNotReady: string[];
  nextDataActions: string[];
  caveats: string[];
}

export interface HomeDataQualitySummary {
  sourceCoverage: string;
  candidateCoverage: string;
  evidenceStrength: string;
  relationshipCoverage: string;
  manifestCompleteness: string;
  homeAvaRepresentationWarnings: string[];
  promotionBlockers: string[];
  answerabilityPosture: string;
}

export interface HomeAvaScope {
  canAnswer: string[];
  shouldCaveat: string[];
  mustRefuseOrMarkUnsupported: string[];
  suggestedPrompts: string[];
  sourceSnapshotReference: string;
}

export interface HomeSummaryLineage {
  generatedAt: string;
  generatedBy: "home_summary_engine";
  inputFingerprint: string;
  tenantDataVersionId: string | null;
  candidateVersionId: string | null;
  sourceSnapshotIds: string[];
  dataQualitySnapshotId: string | null;
  manifestProjectionSnapshotId: string | null;
  answerabilitySnapshotId: string | null;
  mode: HomeSummarySnapshotMode;
  status: HomeSummarySnapshotStatus;
}

export interface HomeExecutiveProfile {
  companySummaryFacts: string[];
  businessModelSignals: string[];
  strategicPrioritySignals: string[];
  enterpriseSnapshotMetrics: HomeEnterpriseSnapshotMetric[];
  contextDepthWidth: HomeContextDepthWidth;
  whatAbarVaKnows: string[];
  whatIsMissing: string[];
  safeToAsk: string[];
  doNotRelyYet: string[];
  recommendedNextDataActions: string[];
  moduleImpact: HomeEnglishModuleImpact[];
}

export interface HomeSummarySnapshot {
  contractVersion: "home_summary_snapshot.v1";
  tenantProfileHeader: HomeTenantProfileHeader;
  executiveProfile: HomeExecutiveProfile;
  contextAreas: HomeContextAreaSummary[];
  dataQualitySummary: HomeDataQualitySummary;
  avaScope: HomeAvaScope;
  caveats: string[];
  guardrails: {
    deterministicBuilder: true;
    callsClaude: false;
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    candidateReadByDefault: false;
    uploadsFiles: false;
    validatesFiles: false;
    createsCandidates: false;
  };
  lineage: HomeSummaryLineage;
}

export interface HomeSummarySnapshotBuildOptions {
  repoRoot?: string;
  tenantId?: string | null;
  tenantKey: string | null | undefined;
  displayName?: string | null;
  industry?: string | null;
  mode?: HomeSummarySnapshotMode;
  browser?: HomeV6ContextBrowser | null;
  setupControl?: AdminSetupControlResponse | null;
  dataQuality?: HomeDataQualityModel | null;
  englishSummary?: HomeEnglishSummary | null;
  generatedAt?: string;
}

const REQUIRED_CONTEXT_AREAS = [
  ["business-functions", "Business Functions"],
  ["applications-systems", "Applications & Systems"],
  ["vendors-contracts", "Vendors & Contracts"],
  ["data-assets", "Data Assets"],
  ["integrations", "Integrations"],
  ["programs-initiatives", "Programs & Initiatives"],
  ["risks-controls", "Risks & Controls"],
  ["metrics-kpis", "Metrics / KPIs"],
  ["evidence-sources", "Evidence Sources"],
  ["relationships", "Relationships"],
] as const;

export function buildHomeSummarySnapshot(
  options: HomeSummarySnapshotBuildOptions,
): HomeSummarySnapshot {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const mode = options.mode ?? "active_home_context";
  const dataQuality =
    options.dataQuality ??
    buildHomeDataQualityModel({
      repoRoot: options.repoRoot,
      tenantKey: options.tenantKey,
      tenantDisplayName: options.displayName,
      candidatePreviewEnabled: mode === "candidate_preview",
      setupControl: options.setupControl ?? null,
      browser: options.browser ?? null,
    });
  const englishSummary =
    options.englishSummary ?? buildHomeEnglishSummary(dataQuality);
  const dimensions = Object.values(options.browser?.dimensions ?? {});
  const profile = deriveTenantProfile({
    tenantId: options.tenantId ?? null,
    tenantKey: dataQuality.tenantKey,
    displayName: options.displayName ?? dataQuality.tenantDisplayName,
    industry: options.industry ?? null,
    mode,
    dimensions,
    dataQuality,
    setupControl: options.setupControl ?? null,
  });
  const contextAreas = buildContextAreas({
    dimensions,
    dataQuality,
    englishSummary,
  });
  const contextDepthWidth = buildContextDepthWidth({
    dimensions,
    dataQuality,
    setupControl: options.setupControl ?? null,
  });
  const dataQualitySummary = buildDataQualitySummary(dataQuality);
  const avaScope = buildAvaScope({
    tenantKey: dataQuality.tenantKey,
    englishSummary,
    dataQuality,
    mode,
  });
  const status = snapshotStatus(dataQuality);
  const lineageWithoutFingerprint = {
    generatedAt,
    generatedBy: "home_summary_engine" as const,
    inputFingerprint: "",
    tenantDataVersionId:
      options.setupControl?.activeTenantAccess.activeVersionId ?? null,
    candidateVersionId:
      mode === "candidate_preview"
        ? (options.setupControl?.candidateTenantDataVersion
            .candidateVersionId ?? null)
        : null,
    sourceSnapshotIds: deriveSourceSnapshotIds({
      browser: options.browser ?? null,
      dataQuality,
    }),
    dataQualitySnapshotId: dataQuality.generatedAt ?? null,
    manifestProjectionSnapshotId:
      "reports/data-quality/manifest-projection/latest",
    answerabilitySnapshotId: dataQuality.answerability.status,
    mode,
    status,
  };
  const snapshotWithoutFingerprint = {
    contractVersion: "home_summary_snapshot.v1" as const,
    tenantProfileHeader: profile,
    executiveProfile: {
      companySummaryFacts: deriveCompanyFacts(profile, englishSummary),
      businessModelSignals: deriveSignals(
        "business",
        dimensions,
        englishSummary,
      ),
      strategicPrioritySignals: deriveSignals(
        "priority",
        dimensions,
        englishSummary,
      ),
      enterpriseSnapshotMetrics: buildEnterpriseMetrics({
        profile,
        contextDepthWidth,
        dataQuality,
      }),
      contextDepthWidth,
      whatAbarVaKnows: [
        englishSummary.currentUnderstanding,
        englishSummary.evidencePosture,
        englishSummary.relationshipPosture,
      ],
      whatIsMissing: [
        ...englishSummary.decisionCautions,
        ...dataQuality.gaps.map((gap) => gap.detail),
      ].slice(0, 8),
      safeToAsk: englishSummary.safeToAsk,
      doNotRelyYet: englishSummary.decisionCautions,
      recommendedNextDataActions: [englishSummary.nextDataAction],
      moduleImpact: englishSummary.moduleImpact,
    },
    contextAreas,
    dataQualitySummary,
    avaScope,
    caveats: englishSummary.caveats.length
      ? englishSummary.caveats
      : dataQuality.caveats,
    guardrails: {
      deterministicBuilder: true as const,
      callsClaude: false as const,
      productionTenantDataWritten: false as const,
      activeTenantAccessLayerUpdated: false as const,
      candidatePromoted: false as const,
      moduleRuntimeConsumptionChanged: false as const,
      candidateReadByDefault: false as const,
      uploadsFiles: false as const,
      validatesFiles: false as const,
      createsCandidates: false as const,
    },
    lineage: lineageWithoutFingerprint,
  };
  const inputFingerprint = stableFingerprint(snapshotWithoutFingerprint);
  return {
    ...snapshotWithoutFingerprint,
    lineage: {
      ...lineageWithoutFingerprint,
      inputFingerprint,
    },
  };
}

function deriveTenantProfile(args: {
  tenantId: string | null;
  tenantKey: string;
  displayName: string;
  industry: string | null;
  mode: HomeSummarySnapshotMode;
  dimensions: HomeV6BrowserPreview[];
  dataQuality: HomeDataQualityModel;
  setupControl: AdminSetupControlResponse | null;
}): HomeTenantProfileHeader {
  const profileRows = args.dimensions.find((dimension) =>
    /enterprise profile|portfolio/i.test(dimension.dimension),
  );
  const values = Object.fromEntries(
    profileRows?.sourceRows
      .flatMap((row) => Object.entries(row.values))
      .map(([key, value]) => [key.toLowerCase(), value]) ?? [],
  );
  return {
    tenantId: args.tenantId,
    tenantKey: args.tenantKey,
    displayName: args.displayName,
    industry:
      args.industry ??
      firstValue(values, ["industry", "vertical", "market"]) ??
      null,
    headquarters: firstValue(values, ["headquarters", "hq", "location"]),
    revenue: firstValue(values, ["revenue", "revenue usd", "annual revenue"]),
    revenueVerified: false,
    employees: firstValue(values, ["employees", "employee count", "headcount"]),
    employeesVerified: false,
    dataOrigin: args.dataQuality.caveats.some((caveat) =>
      /synthetic|generated|demo/i.test(caveat),
    )
      ? "Demo-safe"
      : "Source-backed",
    mode: args.mode,
    activeContextStatus: args.dataQuality.activeContextLabel,
    candidatePreviewStatus:
      args.mode === "candidate_preview"
        ? args.dataQuality.candidatePreview.candidateOnlyLabel
        : "Not active",
  };
}

function buildContextDepthWidth(args: {
  dimensions: HomeV6BrowserPreview[];
  dataQuality: HomeDataQualityModel;
  setupControl: AdminSetupControlResponse | null;
}): HomeContextDepthWidth {
  return {
    loadedAreas: args.dimensions.length,
    loadedRecords: sum(args.dimensions.map((dimension) => dimension.rowCount)),
    sourceCount: new Set(
      args.dimensions.flatMap((dimension) => dimension.fileNames),
    ).size,
    evidenceCount:
      args.dataQuality.evidenceQuality.factsWithEvidence ??
      args.setupControl?.evidenceRegistry.evidenceItems ??
      0,
    relationshipCount:
      args.dataQuality.relationshipCoverage.knownRelationships ??
      args.setupControl?.relationshipGraph.graphRelationships ??
      0,
    visibleGaps: sum(
      args.dimensions.map((dimension) => dimension.dataThinCells),
    ),
    contextPosture: args.dataQuality.answerability.label,
  };
}

function buildContextAreas(args: {
  dimensions: HomeV6BrowserPreview[];
  dataQuality: HomeDataQualityModel;
  englishSummary: HomeEnglishSummary;
}): HomeContextAreaSummary[] {
  return REQUIRED_CONTEXT_AREAS.map(([areaKey, displayName]) => {
    const matches = args.dimensions.filter((dimension) =>
      areaMatches(displayName, dimension.dimension),
    );
    const loadedCount = sum(matches.map((dimension) => dimension.rowCount));
    const sourceCount = new Set(
      matches.flatMap((dimension) => dimension.fileNames),
    ).size;
    const topGaps = matches
      .flatMap((dimension) =>
        dimension.knownGaps.map((gap) => ({
          label: gap.label,
          count: gap.count,
          whyItMatters: gap.whyItMatters ?? null,
        })),
      )
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
    const examples = matches
      .flatMap((dimension) =>
        dimension.sourceRows
          .map((row) => row.label)
          .filter((label) => label && label !== "Needs evidence")
          .slice(0, 3),
      )
      .slice(0, 5);
    const gapCount = sum(topGaps.map((gap) => gap.count));
    const relationshipCount =
      /relationship|integration|application|system|vendor/i.test(displayName)
        ? args.dataQuality.relationshipCoverage.knownRelationships
        : 0;
    return {
      areaKey,
      displayName,
      executiveSummaryInputs: matches
        .map((dimension) => dimension.title)
        .slice(0, 6),
      loadedCount,
      mappedCount: loadedCount,
      sourceCount,
      evidenceCount: Math.min(
        args.dataQuality.evidenceQuality.factsWithEvidence,
        Math.max(loadedCount, 0),
      ),
      relationshipCount,
      examples,
      topGaps,
      evidencePosture:
        loadedCount > 0
          ? `${displayName} has ${formatNumber(loadedCount)} loaded record${loadedCount === 1 ? "" : "s"} from ${formatNumber(sourceCount)} source file${sourceCount === 1 ? "" : "s"}.`
          : `${displayName} is not represented in the current Home snapshot.`,
      relationshipDepth:
        relationshipCount > 0
          ? `${formatNumber(relationshipCount)} mapped relationship${relationshipCount === 1 ? "" : "s"} visible.`
          : "Relationship depth is limited or not projected for this area.",
      answerability:
        loadedCount > 0 && gapCount === 0
          ? "answerable_from_loaded_context"
          : loadedCount > 0
            ? "answerable_with_caveats"
            : "not_available_yet",
      safeQuestions: args.englishSummary.safeToAsk.slice(0, 4),
      unsupportedQuestions: args.englishSummary.decisionCautions.slice(0, 4),
      decisionsSupported:
        loadedCount > 0
          ? ["Source-backed context browsing", "Evidence inspection"]
          : [],
      decisionsNotReady:
        gapCount > 0 || relationshipCount === 0
          ? ["Broad advisory synthesis", "Cross-domain dependency decisions"]
          : ["Realized value claims without Tower evidence"],
      nextDataActions:
        loadedCount > 0
          ? [
              gapCount > 0
                ? "Close visible evidence gaps for this area."
                : "Validate loaded rows with the client owner.",
            ]
          : [`Load source-backed ${displayName.toLowerCase()} evidence.`],
      caveats: args.dataQuality.caveats.slice(0, 3),
    };
  });
}

function buildDataQualitySummary(
  dataQuality: HomeDataQualityModel,
): HomeDataQualitySummary {
  return {
    sourceCoverage: dataQuality.sourceCoverage.status,
    candidateCoverage: dataQuality.candidatePreview.status,
    evidenceStrength: dataQuality.evidenceQuality.status,
    relationshipCoverage: dataQuality.relationshipCoverage.status,
    manifestCompleteness: dataQuality.sourceCoverage.sourceRichCandidateThin
      ? "Source-rich/candidate-thin"
      : "No manifest warning visible",
    homeAvaRepresentationWarnings: [
      ...dataQuality.sourceCoverage.warnings.map((warning) => warning.detail),
      ...dataQuality.relationshipCoverage.warnings.map(
        (warning) => warning.detail,
      ),
    ].slice(0, 8),
    promotionBlockers: dataQuality.candidatePreview.promotionBlockers,
    answerabilityPosture: dataQuality.answerability.rationale,
  };
}

function buildAvaScope(args: {
  tenantKey: string;
  englishSummary: HomeEnglishSummary;
  dataQuality: HomeDataQualityModel;
  mode: HomeSummarySnapshotMode;
}): HomeAvaScope {
  return {
    canAnswer: args.englishSummary.safeToAsk,
    shouldCaveat: [
      args.englishSummary.completenessMeaning,
      args.englishSummary.relationshipPosture,
      ...args.dataQuality.caveats,
    ].slice(0, 6),
    mustRefuseOrMarkUnsupported: args.englishSummary.decisionCautions,
    suggestedPrompts: [
      "Explain this company in plain English.",
      "What does AbarVa know?",
      "What is missing?",
      "What can I safely ask?",
      "What should I not rely on yet?",
      "What data should we load or project next?",
    ],
    sourceSnapshotReference: `${args.tenantKey}:${args.mode}`,
  };
}

function buildEnterpriseMetrics(args: {
  profile: HomeTenantProfileHeader;
  contextDepthWidth: HomeContextDepthWidth;
  dataQuality: HomeDataQualityModel;
}): HomeEnterpriseSnapshotMetric[] {
  return [
    {
      key: "evidence_items",
      label: "Evidence items",
      value: formatNumber(args.contextDepthWidth.evidenceCount),
      detail: "Visible to the current Home context.",
    },
    {
      key: "evidence_posture",
      label: "Evidence posture",
      value: args.dataQuality.evidenceQuality.status,
      detail:
        args.dataQuality.evidenceQuality.warnings[0]?.detail ??
        "Source support is visible.",
    },
    {
      key: "relationship_depth",
      label: "Relationship depth",
      value:
        args.contextDepthWidth.relationshipCount > 0
          ? formatNumber(args.contextDepthWidth.relationshipCount)
          : "Limited",
      detail: args.dataQuality.relationshipCoverage.businessSummary,
    },
    {
      key: "next_actions",
      label: "Next best actions",
      value: formatNumber(args.dataQuality.gaps.length || 1),
      detail:
        args.dataQuality.gaps[0]?.detail ??
        "Validate and review the loaded context.",
    },
  ];
}

function deriveCompanyFacts(
  profile: HomeTenantProfileHeader,
  summary: HomeEnglishSummary,
): string[] {
  return [
    profile.industry ? `Industry: ${profile.industry}` : null,
    profile.headquarters ? `Headquarters: ${profile.headquarters}` : null,
    profile.revenue ? `Revenue: ${profile.revenue}` : null,
    profile.employees ? `Employees: ${profile.employees}` : null,
    summary.currentUnderstanding,
  ].filter(Boolean) as string[];
}

function deriveSignals(
  kind: "business" | "priority",
  dimensions: HomeV6BrowserPreview[],
  summary: HomeEnglishSummary,
): string[] {
  const pattern =
    kind === "business"
      ? /business|function|operating|profile|vendor|customer|member|passenger/i
      : /priority|program|initiative|risk|metric|outcome|ai/i;
  const derived = dimensions
    .filter((dimension) => pattern.test(dimension.dimension))
    .flatMap((dimension) => dimension.sourceRows.map((row) => row.label))
    .filter(Boolean)
    .slice(0, 5);
  return derived.length
    ? derived
    : kind === "business"
      ? [summary.currentUnderstanding]
      : [summary.nextDataAction];
}

function deriveSourceSnapshotIds(args: {
  browser: HomeV6ContextBrowser | null;
  dataQuality: HomeDataQualityModel;
}): string[] {
  const fileIds = Object.values(args.browser?.dimensions ?? {})
    .flatMap((dimension) => dimension.fileNames)
    .filter(Boolean);
  return [
    ...new Set(
      [
        args.browser?.datasetDir,
        ...fileIds,
        args.dataQuality.generatedAt,
      ].filter(Boolean) as string[],
    ),
  ];
}

function snapshotStatus(
  model: HomeDataQualityModel,
): HomeSummarySnapshotStatus {
  if (model.answerability.status === "answerable") return "ready";
  if (model.answerability.status === "partial") return "partial";
  if (model.answerability.status === "needs_evidence")
    return "ready_with_caveats";
  if (model.answerability.status === "candidate_preview_only") return "blocked";
  return "not_available";
}

function areaMatches(area: string, dimension: string): boolean {
  const normalized = `${area} ${dimension}`.toLowerCase();
  if (area === "Business Functions")
    return /business|function/.test(normalized);
  if (area === "Applications & Systems")
    return /application|system|infrastructure|cloud/.test(normalized);
  if (area === "Vendors & Contracts")
    return /vendor|contract|sourcing/.test(normalized);
  if (area === "Data Assets")
    return /data asset|analytics|data/.test(normalized);
  if (area === "Integrations")
    return /integration|interface|bridge/.test(normalized);
  if (area === "Programs & Initiatives")
    return /program|initiative|priority|roadmap/.test(normalized);
  if (area === "Risks & Controls")
    return /risk|control|compliance|security/.test(normalized);
  if (area === "Metrics / KPIs")
    return /metric|kpi|outcome|value/.test(normalized);
  if (area === "Evidence Sources")
    return /evidence|source|document/.test(normalized);
  if (area === "Relationships")
    return /relationship|graph|dependency|bridge/.test(normalized);
  return false;
}

function firstValue(
  values: Record<string, string>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = values[key]?.trim();
    if (value && value !== "Needs evidence") return value;
  }
  return null;
}

function stableFingerprint(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(sortForFingerprint(value)))
    .digest("hex");
}

function sortForFingerprint(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForFingerprint);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForFingerprint(entry)]),
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value,
  );
}
