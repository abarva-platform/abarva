import fs from "node:fs";
import path from "node:path";

import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";
import type { HomeV6ContextBrowser } from "@/lib/home/v6-context-browser";
import type {
  TenantAdminHomeCaveat,
  TenantCandidateCoverage,
  TenantEvidenceQuality,
  TenantGeneratedDataRisk,
  TenantModuleReadinessQuality,
  TenantPromotionReadinessQuality,
  TenantQualityMatrixRow,
  TenantRelationshipGraphQuality,
  TenantSourceEstateCoverage,
} from "@/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";

type QualityTone = "good" | "watch" | "gap" | "blocked" | "unknown";

export type HomeAnswerabilityStatus =
  | "answerable"
  | "partial"
  | "needs_evidence"
  | "candidate_preview_only"
  | "not_available_yet";

export interface HomeQualityCard {
  id:
    | "source_coverage"
    | "candidate_coverage"
    | "evidence_strength"
    | "relationship_coverage"
    | "known_gaps"
    | "answerability"
    | "active_candidate_status"
    | "caveats";
  title: string;
  value: string;
  status: string;
  detail: string;
  tone: QualityTone;
}

export interface HomeQualityWarning {
  title: string;
  detail: string;
  tone: QualityTone;
}

export interface HomeSourceCoverageView {
  status: string;
  domainsAvailable: string[];
  domainsMissing: string[];
  filesMappedToKnownFacts: number;
  filesNotRepresentedInCandidate: number;
  sourceRichCandidateThin: boolean;
  representativeSources: Array<{
    label: string;
    domain: string;
    rows: number | null;
  }>;
  warnings: HomeQualityWarning[];
}

export interface HomeEvidenceQualityView {
  status: string;
  factsWithEvidence: number;
  factsMissingEvidence: number;
  sourceBackedFacts: number;
  warnings: HomeQualityWarning[];
}

export interface HomeRelationshipCoverageView {
  status: string;
  knownRelationships: number;
  unresolvedRelationships: number;
  businessSummary: string;
  warnings: HomeQualityWarning[];
}

export interface HomeAnswerabilityView {
  status: HomeAnswerabilityStatus;
  label: string;
  rationale: string;
  safeToAnswer: string[];
  routeToIntelligence: string[];
  limits: string[];
}

export interface HomeGapView {
  title: string;
  detail: string;
  priority: "P0" | "P1" | "P2";
  source: string;
}

export interface HomeCandidatePreviewQuality {
  previewRequested: boolean;
  available: boolean;
  status: string;
  candidateOnlyLabel: string;
  whatWouldBecomeAvailable: string[];
  promotionBlockers: string[];
  caveats: string[];
}

export interface HomeContextQualityBadge {
  area: string;
  evidence: string;
  relationships: string;
  gaps: string;
  answerability: string;
  tone: QualityTone;
}

export interface HomeDataQualityModel {
  tenantKey: string;
  tenantDisplayName: string;
  generatedAt: string | null;
  activeContextLabel: "Active Home context";
  summaryCards: HomeQualityCard[];
  sourceCoverage: HomeSourceCoverageView;
  evidenceQuality: HomeEvidenceQualityView;
  relationshipCoverage: HomeRelationshipCoverageView;
  answerability: HomeAnswerabilityView;
  gaps: HomeGapView[];
  contextBadges: HomeContextQualityBadge[];
  candidatePreview: HomeCandidatePreviewQuality;
  caveats: string[];
  skyHarborRegression?: {
    sourceRichCandidateThin: boolean;
    answerability: HomeAnswerabilityStatus;
    relationshipGapVisible: boolean;
  };
  guardrails: {
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    candidateReadByDefault: false;
  };
}

export interface HomeDataQualityBuildOptions {
  repoRoot?: string;
  tenantKey?: string | null;
  tenantDisplayName?: string | null;
  candidatePreviewEnabled?: boolean;
  setupControl?: AdminSetupControlResponse | null;
  browser?: HomeV6ContextBrowser | null;
}

interface ArtifactEnvelope<T> {
  generatedAt?: string;
  tenants?: T[];
}

const ARTIFACT_DIR = "reports/data-quality/all-tenants/latest";

const DOMAIN_LABELS: Record<string, string> = {
  enterprise_profile: "Enterprise profile",
  systems_estate: "Systems estate",
  mainframe_and_core: "Core platforms",
  data_and_analytics: "Data and analytics",
  integration_estate: "Integrations",
  vendors_contracts: "Vendors and contracts",
  financial_value: "Financial value",
  moves_execution: "Moves execution",
  source_events: "Sourcing events",
  tower_outcomes: "Tower outcomes",
  risk_controls: "Risk and controls",
  relationships: "Relationships",
  benchmarks: "Benchmarks",
  workforce: "Workforce",
  documents: "Documents",
};

const MISSING_AUDIT_CARD: HomeQualityCard = {
  id: "caveats",
  title: "Caveats",
  value: "Not available yet",
  status: "Needs audit payload",
  detail:
    "Home can still browse active context, but data-quality posture is not available yet.",
  tone: "unknown",
};

export function normalizeHomeQualityTenantKey(
  value: string | null | undefined,
): string {
  const normalized = value?.trim().toLowerCase().replace(/_/g, "-") ?? "";
  if (!normalized) return "unknown";
  if (
    normalized === "skyharbor" ||
    normalized === "skyharbor-air" ||
    normalized === "skyharbor-global"
  ) {
    // The canonical key, declared in the tenant alias table. "skyharbor_global" is an ALIAS of it,
    // and this function returning the alias made it the one output here that was not canonical --
    // every other branch already returns one. It also silently killed the branch below, which
    // compared against the canonical key and could therefore never be true.
    return "skyharbor-air";
  }
  if (normalized === "lakeshore" || normalized === "lakeshore-industries") {
    return "lakeshore-holdings";
  }
  if (normalized === "apexretail") return "apex-retail";
  if (normalized === "firstcapital" || normalized === "arcturus")
    return "first-capital";
  if (normalized === "meridian") return "meridian-health";
  return normalized;
}

export function buildHomeDataQualityModel(
  options: HomeDataQualityBuildOptions = {},
): HomeDataQualityModel {
  const repoRoot = options.repoRoot ?? process.cwd();
  const tenantKey = normalizeHomeQualityTenantKey(
    options.tenantKey ?? options.browser?.tenantKey,
  );
  const artifacts = readHomeQualityArtifacts(repoRoot);
  const row = findTenant(artifacts.matrix, tenantKey);
  const source = findTenant(artifacts.sourceCoverage, tenantKey);
  const candidate = findTenant(artifacts.candidateCoverage, tenantKey);
  const evidence = findTenant(artifacts.evidenceQuality, tenantKey);
  const relationships = findTenant(artifacts.relationshipCoverage, tenantKey);
  const generatedRisk = findTenant(artifacts.generatedDataRisk, tenantKey);
  const moduleReadiness = findTenant(artifacts.moduleReadiness, tenantKey);
  const promotion = findTenant(artifacts.promotionReadiness, tenantKey);
  const caveatRow = findTenant(artifacts.adminHomeCaveats, tenantKey);
  const displayName =
    row?.tenantDisplayName ??
    source?.tenantDisplayName ??
    options.tenantDisplayName ??
    options.browser?.displayName ??
    options.setupControl?.tenant.displayName ??
    "This tenant";

  const browserRows = sum(
    Object.values(options.browser?.dimensions ?? {}).map(
      (dimension) => dimension.rowCount,
    ),
  );
  const browserGaps = sum(
    Object.values(options.browser?.dimensions ?? {}).map(
      (dimension) => dimension.dataThinCells,
    ),
  );
  const browserSources = new Set(
    Object.values(options.browser?.dimensions ?? {}).flatMap(
      (dimension) => dimension.fileNames,
    ),
  ).size;
  const sourceRows = source?.structuredRowCount ?? browserRows;
  const sourceFiles = source?.fileCount ?? browserSources;
  const candidateRecords = candidate?.candidateRecordsGenerated ?? 0;
  const evidenceCount =
    evidence?.evidenceOperationCount ??
    options.setupControl?.evidenceRegistry.evidenceItems ??
    0;
  const relationshipCount =
    relationships?.relationshipOperationCount ??
    options.setupControl?.relationshipGraph.graphRelationships ??
    0;
  const unresolvedRelationships =
    options.setupControl?.relationshipGraph.unresolvedRelationships ?? 0;
  const sourceRichCandidateThin =
    Boolean(row?.sourceRichCandidateThin) || Boolean(candidate?.candidateThin);
  const relationshipGap =
    relationshipCount === 0 &&
    ((relationships?.relationshipSourceFiles ?? 0) > 0 ||
      (relationships?.integrationSourceFiles ?? 0) > 0 ||
      Boolean(source?.domains.relationships));
  const evidenceMissing = Math.max(candidateRecords - evidenceCount, 0);
  const answerability = buildAnswerability({
    row,
    sourceRichCandidateThin,
    relationshipGap,
    evidenceCount,
    sourceRows,
    browserRows,
    candidatePreviewOnly:
      Boolean(options.candidatePreviewEnabled) &&
      !options.setupControl?.activeTenantAccess.activeVersionId,
  });
  const sourceCoverage = buildSourceCoverageView({
    source,
    candidateRecords,
    sourceRichCandidateThin,
  });
  const evidenceQuality = buildEvidenceQualityView({
    evidence,
    candidateRecords,
    evidenceCount,
    evidenceMissing,
    generatedRisk,
  });
  const relationshipCoverage = buildRelationshipCoverageView({
    relationships,
    relationshipCount,
    unresolvedRelationships,
    relationshipGap,
  });
  const candidatePreview = buildCandidatePreviewQuality({
    enabled: Boolean(options.candidatePreviewEnabled),
    setupControl: options.setupControl ?? null,
    candidate,
    promotion,
    moduleReadiness,
    sourceRichCandidateThin,
  });
  const gaps = buildHomeGaps({
    row,
    source,
    candidate,
    relationships,
    evidence,
    promotion,
    caveatRow,
    sourceRichCandidateThin,
    relationshipGap,
    browserGaps,
  });
  const caveats = [
    caveatRow?.homeSummaryCaveat,
    caveatRow?.sourcesCaveat,
    caveatRow?.relationshipsCaveat,
    generatedRisk?.narrativeCaveatRequired
      ? "This context includes generated or synthetic planning-grade records; do not treat it as client-certified evidence without validation."
      : null,
    options.setupControl?.sourceOfTruth?.caveats?.[0],
    options.setupControl?.activeTenantAccess.activeVersionId
      ? null
      : "Active tenant access pointer is not wired here; Home displays active Home context, not promoted active tenant truth.",
  ].filter(Boolean) as string[];

  return {
    tenantKey,
    tenantDisplayName: displayName,
    generatedAt: artifacts.generatedAt,
    activeContextLabel: "Active Home context",
    summaryCards: [
      {
        id: "source_coverage",
        title: "Source Coverage",
        value: formatCount(sourceFiles, "file"),
        status: sourceCoverage.status,
        detail:
          sourceRows > 0
            ? `${formatNumber(sourceRows)} source rows across ${sourceCoverage.domainsAvailable.length} domains.`
            : "No source estate audit is available yet.",
        tone: toneFromStatus(source?.sourceRichnessStatus),
      },
      {
        id: "candidate_coverage",
        title: options.candidatePreviewEnabled
          ? "Candidate Coverage"
          : "Inactive Preview",
        value: options.candidatePreviewEnabled
          ? formatCount(candidateRecords, "candidate record")
          : "Hidden",
        status: options.candidatePreviewEnabled
          ? candidatePreview.status
          : "Preview hidden by default",
        detail: options.candidatePreviewEnabled
          ? "Candidate coverage is visible only as inactive preview posture."
          : "Default Home reads active context only.",
        tone: options.candidatePreviewEnabled
          ? toneFromStatus(candidate?.coverageStatus)
          : "unknown",
      },
      {
        id: "evidence_strength",
        title: "Evidence Strength",
        value: formatCount(evidenceCount, "evidence item"),
        status: evidenceQuality.status,
        detail:
          evidenceMissing > 0
            ? `${formatNumber(evidenceMissing)} facts still need evidence.`
            : "Evidence support is visible for the active Home context.",
        tone: toneFromStatus(evidence?.status),
      },
      {
        id: "relationship_coverage",
        title: "Relationship Coverage",
        value: formatCount(relationshipCount, "mapped link"),
        status: relationshipCoverage.status,
        detail: relationshipCoverage.businessSummary,
        tone: toneFromStatus(relationships?.status),
      },
      {
        id: "known_gaps",
        title: "Known Gaps",
        value: formatCount(gaps.length || browserGaps, "gap"),
        status: gaps.length > 0 ? "Needs evidence" : "No priority gap surfaced",
        detail:
          gaps[0]?.detail ??
          "No prioritized data-quality gap was available from the audit payload.",
        tone: gaps.length > 0 ? "gap" : "good",
      },
      {
        id: "answerability",
        title: "Answerability",
        value: answerability.label,
        status: answerability.status.replace(/_/g, " "),
        detail: answerability.rationale,
        tone: answerability.status === "answerable" ? "good" : "watch",
      },
      {
        id: "active_candidate_status",
        title: options.candidatePreviewEnabled
          ? "Active / Candidate Status"
          : "Active Context Status",
        value: options.candidatePreviewEnabled
          ? "Preview mode"
          : "Active Home context",
        status: options.candidatePreviewEnabled
          ? "Candidate preview only"
          : "Inactive preview hidden by default",
        detail: options.candidatePreviewEnabled
          ? "Inactive candidate data is labeled and cannot become runtime truth from Home."
          : "Home shows active context posture and caveats; inactive preview data stays hidden.",
        tone: options.candidatePreviewEnabled ? "watch" : "good",
      },
      caveats.length
        ? {
            id: "caveats",
            title: "Caveats",
            value: formatCount(caveats.length, "caveat"),
            status: "Visible",
            detail: caveats[0] ?? "No caveat available.",
            tone: "watch",
          }
        : MISSING_AUDIT_CARD,
    ],
    sourceCoverage,
    evidenceQuality,
    relationshipCoverage,
    answerability,
    gaps,
    contextBadges: buildContextBadges(
      options.browser ?? null,
      answerability,
      relationshipGap,
    ),
    candidatePreview,
    caveats,
    // Compared against the normaliser's own output rather than a key written out here. A literal on
    // one side of a comparison whose other side is computed is a branch waiting to go dead.
    skyHarborRegression:
      tenantKey === normalizeHomeQualityTenantKey("skyharbor")
        ? {
            sourceRichCandidateThin,
            answerability: answerability.status,
            relationshipGapVisible: relationshipGap,
          }
        : undefined,
    guardrails: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
    },
  };
}

export function buildHomeContextQualityBadges(
  model: HomeDataQualityModel | null | undefined,
  browser: HomeV6ContextBrowser | null | undefined,
): HomeContextQualityBadge[] {
  return buildContextBadges(
    browser ?? null,
    model?.answerability ?? null,
    false,
  );
}

function readHomeQualityArtifacts(repoRoot: string) {
  const matrix = readTenantArtifact<TenantQualityMatrixRow>(
    repoRoot,
    "tenant-quality-matrix.json",
  );
  return {
    generatedAt: matrix.generatedAt,
    matrix: matrix.tenants,
    sourceCoverage: readTenantArtifact<TenantSourceEstateCoverage>(
      repoRoot,
      "source-estate-coverage.json",
    ).tenants,
    candidateCoverage: readTenantArtifact<TenantCandidateCoverage>(
      repoRoot,
      "candidate-coverage.json",
    ).tenants,
    evidenceQuality: readTenantArtifact<TenantEvidenceQuality>(
      repoRoot,
      "evidence-quality.json",
    ).tenants,
    relationshipCoverage: readTenantArtifact<TenantRelationshipGraphQuality>(
      repoRoot,
      "relationship-graph-quality.json",
    ).tenants,
    generatedDataRisk: readTenantArtifact<TenantGeneratedDataRisk>(
      repoRoot,
      "generated-data-risk.json",
    ).tenants,
    moduleReadiness: readTenantArtifact<TenantModuleReadinessQuality>(
      repoRoot,
      "module-readiness-quality.json",
    ).tenants,
    promotionReadiness: readTenantArtifact<TenantPromotionReadinessQuality>(
      repoRoot,
      "promotion-readiness-quality.json",
    ).tenants,
    adminHomeCaveats: readTenantArtifact<TenantAdminHomeCaveat>(
      repoRoot,
      "admin-home-caveats.json",
    ).tenants,
  };
}

function readTenantArtifact<T>(
  repoRoot: string,
  fileName: string,
): { generatedAt: string | null; tenants: T[] } {
  const filePath = path.join(repoRoot, ARTIFACT_DIR, fileName);
  if (!fs.existsSync(filePath)) return { generatedAt: null, tenants: [] };
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as
    | ArtifactEnvelope<T>
    | T[];
  if (Array.isArray(parsed)) return { generatedAt: null, tenants: parsed };
  return {
    generatedAt: parsed.generatedAt ?? null,
    tenants: parsed.tenants ?? [],
  };
}

function findTenant<T extends { tenantKey: string }>(
  rows: T[],
  tenantKey: string,
): T | null {
  return (
    rows.find(
      (row) => normalizeHomeQualityTenantKey(row.tenantKey) === tenantKey,
    ) ?? null
  );
}

function buildAnswerability(args: {
  row: TenantQualityMatrixRow | null;
  sourceRichCandidateThin: boolean;
  relationshipGap: boolean;
  evidenceCount: number;
  sourceRows: number;
  browserRows: number;
  candidatePreviewOnly: boolean;
}): HomeAnswerabilityView {
  if (args.candidatePreviewOnly) {
    return {
      status: "candidate_preview_only",
      label: "Preview only",
      rationale:
        "Home can explain the inactive candidate posture, but it cannot present candidate data as active tenant truth.",
      safeToAnswer: [
        "what is loaded in the current Home context",
        "which candidate gaps block promotion",
      ],
      routeToIntelligence: ["strategy, funding, and operating-model synthesis"],
      limits: ["candidate data is inactive", "promotion has not been executed"],
    };
  }
  if (args.sourceRows === 0 && args.browserRows === 0) {
    return {
      status: "not_available_yet",
      label: "Not available yet",
      rationale:
        "No Home context or data-quality audit payload is available for this tenant.",
      safeToAnswer: ["which data is missing"],
      routeToIntelligence: ["all advisory synthesis"],
      limits: ["no source-backed Home context loaded"],
    };
  }
  if (args.sourceRichCandidateThin || args.relationshipGap) {
    return {
      status: "partial",
      label: "Partial",
      rationale:
        "Home can explain loaded context, but candidate coverage and relationship mapping are not complete enough for broad advisory claims.",
      safeToAnswer: [
        "loaded facts in the active Home context",
        "evidence gaps",
        "source coverage and caveats",
      ],
      routeToIntelligence: [
        "portfolio decisions",
        "use-case design",
        "cross-domain recommendations",
      ],
      limits: [
        "source-rich/candidate-thin posture",
        "relationship coverage needs validation",
      ],
    };
  }
  if (args.evidenceCount === 0) {
    return {
      status: "needs_evidence",
      label: "Needs evidence",
      rationale:
        "Loaded context exists, but source-backed evidence operations are not visible.",
      safeToAnswer: ["what records are visible", "what evidence is missing"],
      routeToIntelligence: ["advisory synthesis"],
      limits: ["evidence strength is not available yet"],
    };
  }
  return {
    status: "answerable",
    label: "Answerable",
    rationale:
      "Home can answer context-browser questions from loaded, source-backed evidence.",
    safeToAnswer: ["known facts", "sources", "relationships", "gaps"],
    routeToIntelligence: ["recommendations and decisions"],
    limits: ["Home remains a context browser, not a strategy module"],
  };
}

function buildSourceCoverageView(args: {
  source: TenantSourceEstateCoverage | null;
  candidateRecords: number;
  sourceRichCandidateThin: boolean;
}): HomeSourceCoverageView {
  const domains: Record<string, number> = args.source?.domains ?? {};
  const available = Object.entries(domains)
    .filter(([, count]) => count > 0)
    .map(([domain]) => DOMAIN_LABELS[domain] ?? humanize(domain));
  const missing = Object.entries(domains)
    .filter(([, count]) => count === 0)
    .map(([domain]) => DOMAIN_LABELS[domain] ?? humanize(domain));
  const warnings: HomeQualityWarning[] = [];
  if (args.sourceRichCandidateThin) {
    warnings.push({
      title: "Source-rich, candidate-thin",
      detail:
        "The source estate is richer than the candidate facts Home can treat as promoted runtime context.",
      tone: "blocked",
    });
  }
  if (
    (args.source?.evidenceSignals ?? []).includes("synthetic-planning-grade")
  ) {
    warnings.push({
      title: "Generated planning-grade source",
      detail: "Client validation is required before board-grade use.",
      tone: "watch",
    });
  }
  return {
    status: args.source?.sourceRichnessStatus ?? "not available yet",
    domainsAvailable: available,
    domainsMissing: missing,
    filesMappedToKnownFacts: args.source?.fileCount ?? 0,
    filesNotRepresentedInCandidate: Math.max(
      (args.source?.structuredRowCount ?? 0) - args.candidateRecords,
      0,
    ),
    sourceRichCandidateThin: args.sourceRichCandidateThin,
    representativeSources:
      args.source?.representativeFiles.slice(0, 6).map((file) => ({
        label: file.fileLabel,
        domain: DOMAIN_LABELS[file.domain] ?? humanize(file.domain),
        rows: file.rowCount,
      })) ?? [],
    warnings,
  };
}

function buildEvidenceQualityView(args: {
  evidence: TenantEvidenceQuality | null;
  candidateRecords: number;
  evidenceCount: number;
  evidenceMissing: number;
  generatedRisk: TenantGeneratedDataRisk | null;
}): HomeEvidenceQualityView {
  const warnings: HomeQualityWarning[] = [];
  if (args.evidenceMissing > 0) {
    warnings.push({
      title: "Facts need evidence",
      detail: `${formatNumber(args.evidenceMissing)} candidate facts do not have evidence operations attached yet.`,
      tone: "gap",
    });
  }
  for (const finding of args.evidence?.findings ?? []) {
    warnings.push({
      title: "Evidence finding",
      detail: finding,
      tone: "watch",
    });
  }
  if (args.generatedRisk?.narrativeCaveatRequired) {
    warnings.push({
      title: "Validation required",
      detail: "Generated or synthetic records must stay clearly labeled.",
      tone: "watch",
    });
  }
  return {
    status: args.evidence?.status ?? "not available yet",
    factsWithEvidence: args.evidenceCount,
    factsMissingEvidence: args.evidenceMissing,
    sourceBackedFacts: Math.max(args.candidateRecords, args.evidenceCount),
    warnings,
  };
}

function buildRelationshipCoverageView(args: {
  relationships: TenantRelationshipGraphQuality | null;
  relationshipCount: number;
  unresolvedRelationships: number;
  relationshipGap: boolean;
}): HomeRelationshipCoverageView {
  const warnings: HomeQualityWarning[] = (
    args.relationships?.findings ?? []
  ).map((finding) => ({
    title: "Relationship finding",
    detail: finding,
    tone: "gap",
  }));
  if (args.relationshipGap) {
    warnings.unshift({
      title: "Dependency links need mapping",
      detail:
        "Source files indicate systems, integrations, or dependencies, but mapped business links are not complete yet.",
      tone: "blocked",
    });
  }
  return {
    status: args.relationships?.status ?? "not available yet",
    knownRelationships: args.relationshipCount,
    unresolvedRelationships: args.unresolvedRelationships,
    businessSummary:
      args.relationshipCount > 0
        ? `${formatNumber(args.relationshipCount)} mapped links are available for browsing dependencies.`
        : "Relationship evidence exists in sources, but business links are not ready enough to overstate dependency coverage.",
    warnings,
  };
}

function buildCandidatePreviewQuality(args: {
  enabled: boolean;
  setupControl: AdminSetupControlResponse | null;
  candidate: TenantCandidateCoverage | null;
  promotion: TenantPromotionReadinessQuality | null;
  moduleReadiness: TenantModuleReadinessQuality | null;
  sourceRichCandidateThin: boolean;
}): HomeCandidatePreviewQuality {
  const candidateVersionId =
    args.setupControl?.candidateTenantDataVersion.candidateVersionId ?? null;
  const blockers = [
    ...(args.candidate?.blockers ?? []),
    ...(args.promotion?.blockers ?? []),
    ...(args.promotion?.requiredBeforeActiveTruth ?? []),
    ...(args.setupControl?.promotionControl.blockers ?? []),
  ].filter(Boolean);
  const caveats = [
    args.sourceRichCandidateThin
      ? "Candidate coverage does not represent the full source estate."
      : null,
    args.moduleReadiness?.moduleOverreadinessRisk
      ? "Module readiness could look greener than the evidence supports."
      : null,
    args.setupControl?.candidateTenantDataVersion.activeTenantAccessLayerUpdated
      ? null
      : "Active access layer was not updated by this preview.",
  ].filter(Boolean) as string[];
  return {
    previewRequested: args.enabled,
    available: Boolean(candidateVersionId),
    status: args.enabled
      ? candidateVersionId
        ? "Inactive candidate visible"
        : "Preview requested; no candidate version available"
      : "Not active by default",
    candidateOnlyLabel: "Candidate preview only - inactive data",
    whatWouldBecomeAvailable: [
      "candidate coverage posture",
      "promotion blockers",
      "module-readiness caveats",
      "evidence and relationship gaps before active use",
    ],
    promotionBlockers: blockers.slice(0, 8),
    caveats,
  };
}

function buildHomeGaps(args: {
  row: TenantQualityMatrixRow | null;
  source: TenantSourceEstateCoverage | null;
  candidate: TenantCandidateCoverage | null;
  relationships: TenantRelationshipGraphQuality | null;
  evidence: TenantEvidenceQuality | null;
  promotion: TenantPromotionReadinessQuality | null;
  caveatRow: TenantAdminHomeCaveat | null;
  sourceRichCandidateThin: boolean;
  relationshipGap: boolean;
  browserGaps: number;
}): HomeGapView[] {
  const gaps: HomeGapView[] = [];
  if (args.sourceRichCandidateThin) {
    gaps.push({
      title: "Source coverage exceeds candidate coverage",
      detail:
        args.caveatRow?.homeSummaryCaveat ??
        "The loaded source estate is richer than the promoted/candidate facts currently visible to runtime modules.",
      priority: "P0",
      source: "Source Coverage",
    });
  }
  if (args.relationshipGap) {
    gaps.push({
      title: "Relationships need business mapping",
      detail:
        args.caveatRow?.relationshipsCaveat ??
        "Dependency-rich source evidence exists, but mapped relationships are incomplete.",
      priority: "P1",
      source: "Relationship Coverage",
    });
  }
  for (const mapping of args.candidate?.missingMappings.slice(0, 3) ?? []) {
    gaps.push({
      title: "Mapping missing",
      detail: mapping,
      priority: "P1",
      source: "Candidate Coverage",
    });
  }
  for (const finding of args.evidence?.findings.slice(0, 2) ?? []) {
    gaps.push({
      title: "Evidence finding",
      detail: finding,
      priority: "P1",
      source: "Evidence Strength",
    });
  }
  for (const blocker of args.promotion?.requiredBeforeActiveTruth.slice(0, 3) ??
    []) {
    gaps.push({
      title: "Before active use",
      detail: blocker,
      priority: "P0",
      source: "Active / Candidate Status",
    });
  }
  if (args.browserGaps > 0 && gaps.length === 0) {
    gaps.push({
      title: "Home context gaps",
      detail: `${formatNumber(args.browserGaps)} visible client-to-complete fields remain in the loaded Home context.`,
      priority: "P2",
      source: "Context Explorer",
    });
  }
  if (
    args.row?.recommendedNextAction &&
    !gaps.some((gap) => gap.detail === args.row?.recommendedNextAction)
  ) {
    gaps.push({
      title: "Recommended next action",
      detail: args.row.recommendedNextAction,
      priority: "P1",
      source: "Data Quality Audit",
    });
  }
  return gaps.slice(0, 10);
}

function buildContextBadges(
  browser: HomeV6ContextBrowser | null,
  answerability: HomeAnswerabilityView | null,
  relationshipGap: boolean,
): HomeContextQualityBadge[] {
  const dimensions = Object.values(browser?.dimensions ?? {});
  return dimensions.map((dimension) => {
    const hasRelationshipName =
      /\b(relationship|dependency|dependencies|system|systems|application|applications|data|integration|vendor|vendors)\b/i.test(
        dimension.dimension,
      );
    const gapLabel =
      dimension.dataThinCells > 0
        ? `${formatNumber(dimension.dataThinCells)} gaps`
        : "No visible gaps";
    const answer =
      answerability?.status === "answerable"
        ? "Answerable"
        : dimension.rowCount > 0
          ? "Partial"
          : "Needs evidence";
    return {
      area: dimension.dimension,
      evidence: dimension.sourceCount > 0 ? "Evidence" : "Needs evidence",
      relationships:
        hasRelationshipName && !relationshipGap
          ? "Relationships"
          : hasRelationshipName
            ? "Relation gaps"
            : "No links",
      gaps: gapLabel,
      answerability: answer,
      tone:
        dimension.dataThinCells > 0 || answer !== "Answerable"
          ? "watch"
          : ("good" as QualityTone),
    };
  });
}

function toneFromStatus(status: string | null | undefined): QualityTone {
  if (status === "pass" || status === "ready") return "good";
  if (status === "watch" || status === "partially-ready") return "watch";
  if (status === "gap") return "gap";
  if (status === "blocked") return "blocked";
  return "unknown";
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatCount(value: number, singular: string): string {
  return `${formatNumber(value)} ${singular}${value === 1 ? "" : "s"}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value,
  );
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
