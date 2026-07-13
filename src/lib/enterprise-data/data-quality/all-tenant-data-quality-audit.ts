import fs from "node:fs/promises";
import path from "node:path";

import type {
  AllTenantCandidateBatchReport,
  TenantBatchRow,
} from "../all-tenant-candidate-batch/all-tenant-candidate-batch";
import { buildAllTenantCandidateBatch } from "../all-tenant-candidate-batch/all-tenant-candidate-batch";

type QualityStatus =
  | "pass"
  | "watch"
  | "gap"
  | "blocked"
  | "not_available";

type SourceDomain =
  | "enterprise_profile"
  | "systems_estate"
  | "mainframe_and_core"
  | "data_and_analytics"
  | "integration_estate"
  | "vendors_contracts"
  | "financial_value"
  | "moves_execution"
  | "source_events"
  | "tower_outcomes"
  | "risk_controls"
  | "relationships"
  | "benchmarks"
  | "workforce"
  | "documents";

export interface SourceFileSignal {
  fileLabel: string;
  domain: SourceDomain;
  rowCount: number | null;
  evidenceSignals: string[];
}

export interface TenantSourceEstateCoverage {
  tenantKey: string;
  tenantDisplayName: string;
  sourcePackCount: number;
  fileCount: number;
  structuredRowCount: number;
  domainCount: number;
  sourceRichnessScore: number;
  sourceRichnessStatus: QualityStatus;
  sourceRichCandidateThin: boolean;
  domains: Record<SourceDomain, number>;
  evidenceSignals: string[];
  representativeFiles: SourceFileSignal[];
}

export interface TenantCandidateCoverage {
  tenantKey: string;
  tenantDisplayName: string;
  candidateRecordsGenerated: number;
  targetOperationsPlanned: number;
  candidateCoverageRatio: number;
  coverageStatus: QualityStatus;
  candidateThin: boolean;
  falseGreenRisk: boolean;
  unmappedFields: number;
  quarantinedRecords: number;
  strandedIntelligenceRecords: number;
  missingMappings: string[];
  blockers: string[];
}

export interface TenantCanonicalFactQuality {
  tenantKey: string;
  tenantDisplayName: string;
  factOperationCount: number;
  canonicalRecordCount: number;
  sourceStructuredRows: number;
  status: QualityStatus;
  findings: string[];
}

export interface TenantRelationshipGraphQuality {
  tenantKey: string;
  tenantDisplayName: string;
  relationshipOperationCount: number;
  relationshipSourceFiles: number;
  integrationSourceFiles: number;
  graphPlanAvailableForAllModules: boolean;
  status: QualityStatus;
  findings: string[];
}

export interface TenantEvidenceQuality {
  tenantKey: string;
  tenantDisplayName: string;
  evidenceOperationCount: number;
  sourceDocumentCount: number;
  evidenceRatio: number;
  status: QualityStatus;
  findings: string[];
}

export interface TenantGeneratedDataRisk {
  tenantKey: string;
  tenantDisplayName: string;
  generatedOrSyntheticSourceFiles: number;
  narrativeCaveatRequired: boolean;
  status: QualityStatus;
  findings: string[];
}

export interface TenantIsolationQuality {
  tenantKey: string;
  tenantDisplayName: string;
  tenantScopedCandidateArtifacts: boolean;
  crossTenantTokenFindings: string[];
  status: QualityStatus;
}

export interface TenantModuleReadinessQuality {
  tenantKey: string;
  tenantDisplayName: string;
  modulesEvaluated: number;
  modulesWithEvidence: number;
  modulesWithFactPlan: number;
  modulesWithGraphPlan: number;
  modulesWithDerivedPlan: number;
  runtimeReadyModules: number;
  moduleOverreadinessRisk: boolean;
  status: QualityStatus;
  findings: string[];
}

export interface TenantPromotionReadinessQuality {
  tenantKey: string;
  tenantDisplayName: string;
  promotionGateStatus: QualityStatus;
  activeAccessMetadataPresent: boolean;
  promotionUnsafe: boolean;
  blockers: string[];
  requiredBeforeActiveTruth: string[];
}

export interface TenantAdminHomeCaveat {
  tenantKey: string;
  tenantDisplayName: string;
  homeSummaryCaveat: string;
  gapsCaveat: string;
  sourcesCaveat: string;
  relationshipsCaveat: string;
}

export interface TenantQualityMatrixRow {
  tenantKey: string;
  tenantDisplayName: string;
  overallStatus: QualityStatus;
  sourceRichnessScore: number;
  sourceStructuredRows: number;
  candidateCoverageRatio: number;
  candidateRecordsGenerated: number;
  relationshipOperationCount: number;
  evidenceOperationCount: number;
  sourceRichCandidateThin: boolean;
  falseGreenRisk: boolean;
  generatedDataRisk: QualityStatus;
  tenantIsolationStatus: QualityStatus;
  moduleReadinessStatus: QualityStatus;
  promotionReadinessStatus: QualityStatus;
  promotionUnsafe: boolean;
  recommendedNextAction: string;
}

export interface AllTenantDataQualityAudit {
  reportVersion: "all-tenant-data-quality-audit/v1";
  generatedAt: string;
  dryRunOnly: true;
  productionTenantDataWritten: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  writesPhysicalTables: false;
  moduleRuntimeConsumptionChanged: false;
  moduleReadsCandidateByDefault: false;
  realizedValueClaimed: false;
  rollup: {
    tenantsScanned: number;
    sourceRichCandidateThinTenants: number;
    falseGreenRiskTenants: number;
    relationshipGapTenants: number;
    promotionUnsafeTenants: number;
    generatedDataWatchTenants: number;
    tenantIsolationFailures: number;
  };
  tenantQualityMatrix: TenantQualityMatrixRow[];
  sourceEstateCoverage: TenantSourceEstateCoverage[];
  candidateCoverage: TenantCandidateCoverage[];
  canonicalFactQuality: TenantCanonicalFactQuality[];
  relationshipGraphQuality: TenantRelationshipGraphQuality[];
  evidenceQuality: TenantEvidenceQuality[];
  generatedDataRisk: TenantGeneratedDataRisk[];
  tenantIsolation: TenantIsolationQuality[];
  moduleReadinessQuality: TenantModuleReadinessQuality[];
  promotionReadinessQuality: TenantPromotionReadinessQuality[];
  adminHomeCaveats: TenantAdminHomeCaveat[];
}

export interface AllTenantDataQualityAuditOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
}

export interface TenantQualityMatrixArtifact {
  generatedAt: string;
  guardrails: ReturnType<typeof hardRuntimeBooleans>;
  rollup: AllTenantDataQualityAudit["rollup"];
  tenants: TenantQualityMatrixRow[];
}

const DEFAULT_OUTPUT_DIR = "reports/data-quality/all-tenants/latest";

const TENANT_PROFILES = [
  {
    tenantKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    aliases: ["skyharbor-air", "skyharbor_air", "skyharbor"],
    expectedSignals: ["IBM Z", "CICS", "DB2", "MQ", "SAP", "Teradata", "SAS", "Tableau"],
  },
  {
    tenantKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    aliases: ["lakeshore-holdings", "lakeshore-industries", "lakeshore"],
    expectedSignals: ["contract", "legal", "sourcing", "vendor"],
  },
  {
    tenantKey: "meridian-health",
    displayName: "Meridian Health",
    aliases: ["meridian-health", "meridian"],
    expectedSignals: ["Epic", "Clarity", "Caboodle", "claims", "pharmacy", "Tableau", "SAS"],
  },
  {
    tenantKey: "first-capital",
    displayName: "First Capital",
    aliases: ["first-capital", "firstcapital"],
    expectedSignals: ["financial", "risk", "portfolio"],
  },
  {
    tenantKey: "apex-retail",
    displayName: "Apex Retail",
    aliases: ["apex-retail", "apex"],
    expectedSignals: ["retail", "store", "margin"],
  },
  {
    tenantKey: "northstar",
    displayName: "Northstar",
    aliases: ["northstar", "northstar-clinical"],
    expectedSignals: ["clinical", "health"],
  },
] as const;

const DOMAIN_KEYS: SourceDomain[] = [
  "enterprise_profile",
  "systems_estate",
  "mainframe_and_core",
  "data_and_analytics",
  "integration_estate",
  "vendors_contracts",
  "financial_value",
  "moves_execution",
  "source_events",
  "tower_outcomes",
  "risk_controls",
  "relationships",
  "benchmarks",
  "workforce",
  "documents",
];

export async function buildAllTenantDataQualityAudit(
  options: AllTenantDataQualityAuditOptions,
): Promise<AllTenantDataQualityAudit> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const batch = await readOrBuildBatch(options.repoRoot, generatedAt);
  const sourceEstateCoverage = await Promise.all(
    batch.tenants.map((tenant) => buildSourceEstateCoverage(options.repoRoot, tenant)),
  );
  const candidateCoverage = batch.tenants.map((tenant) =>
    buildCandidateCoverage(tenant, sourceEstateCoverage),
  );
  const canonicalFactQuality = await Promise.all(
    batch.tenants.map((tenant) =>
      buildCanonicalFactQuality(options.repoRoot, tenant, sourceEstateCoverage),
    ),
  );
  const relationshipGraphQuality = await Promise.all(
    batch.tenants.map((tenant) =>
      buildRelationshipGraphQuality(options.repoRoot, tenant, sourceEstateCoverage),
    ),
  );
  const evidenceQuality = await Promise.all(
    batch.tenants.map((tenant) =>
      buildEvidenceQuality(options.repoRoot, tenant, sourceEstateCoverage),
    ),
  );
  const generatedDataRisk = sourceEstateCoverage.map(buildGeneratedDataRisk);
  const tenantIsolation = await Promise.all(
    batch.tenants.map((tenant) => buildTenantIsolation(options.repoRoot, tenant)),
  );
  const moduleReadinessQuality = batch.tenants.map(buildModuleReadinessQuality);
  const promotionReadinessQuality = await Promise.all(
    batch.tenants.map((tenant) =>
      buildPromotionReadinessQuality(
        options.repoRoot,
        tenant,
        sourceEstateCoverage,
        candidateCoverage,
        relationshipGraphQuality,
      ),
    ),
  );
  const adminHomeCaveats = batch.tenants.map((tenant) =>
    buildAdminHomeCaveat(
      tenant,
      sourceEstateCoverage,
      candidateCoverage,
      relationshipGraphQuality,
    ),
  );
  const tenantQualityMatrix = batch.tenants.map((tenant) =>
    buildTenantQualityMatrixRow(
      tenant,
      sourceEstateCoverage,
      candidateCoverage,
      canonicalFactQuality,
      relationshipGraphQuality,
      evidenceQuality,
      generatedDataRisk,
      tenantIsolation,
      moduleReadinessQuality,
      promotionReadinessQuality,
    ),
  );

  const report: AllTenantDataQualityAudit = {
    reportVersion: "all-tenant-data-quality-audit/v1",
    generatedAt,
    dryRunOnly: true,
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    writesPhysicalTables: false,
    moduleRuntimeConsumptionChanged: false,
    moduleReadsCandidateByDefault: false,
    realizedValueClaimed: false,
    rollup: {
      tenantsScanned: tenantQualityMatrix.length,
      sourceRichCandidateThinTenants: tenantQualityMatrix.filter(
        (row) => row.sourceRichCandidateThin,
      ).length,
      falseGreenRiskTenants: tenantQualityMatrix.filter(
        (row) => row.falseGreenRisk,
      ).length,
      relationshipGapTenants: relationshipGraphQuality.filter(
        (row) => row.status === "gap" || row.status === "blocked",
      ).length,
      promotionUnsafeTenants: tenantQualityMatrix.filter(
        (row) => row.promotionUnsafe,
      ).length,
      generatedDataWatchTenants: generatedDataRisk.filter(
        (row) => row.status === "watch",
      ).length,
      tenantIsolationFailures: tenantIsolation.filter(
        (row) => row.status === "blocked",
      ).length,
    },
    tenantQualityMatrix,
    sourceEstateCoverage,
    candidateCoverage,
    canonicalFactQuality,
    relationshipGraphQuality,
    evidenceQuality,
    generatedDataRisk,
    tenantIsolation,
    moduleReadinessQuality,
    promotionReadinessQuality,
    adminHomeCaveats,
  };

  validateAuditGuardrails(report);
  await writeAuditReport(options.repoRoot, outputDir, report);
  return report;
}

export async function readLatestTenantQualityMatrix(
  repoRoot: string,
): Promise<TenantQualityMatrixArtifact | null> {
  const artifact = await readJsonIfExists<TenantQualityMatrixArtifact>(
    repoRoot,
    "reports/data-quality/all-tenants/latest/tenant-quality-matrix.json",
  );
  return artifact ?? buildEmbeddedTenantQualityMatrix();
}

export function assertCandidateCoverageAudit(report: AllTenantDataQualityAudit): void {
  const unsafeRows = report.tenantQualityMatrix.filter(
    (row) => row.sourceRichCandidateThin && row.promotionReadinessStatus === "pass",
  );
  if (unsafeRows.length > 0) {
    throw new Error(
      `Candidate coverage audit failed: ${unsafeRows
        .map((row) => row.tenantKey)
        .join(", ")} marked promotion pass despite source-rich/candidate-thin coverage.`,
    );
  }
}

export function assertTenantIsolationAudit(report: AllTenantDataQualityAudit): void {
  const failures = report.tenantIsolation.filter((row) => row.status === "blocked");
  if (failures.length > 0) {
    throw new Error(
      `Tenant isolation data-quality audit failed: ${failures
        .map((row) => `${row.tenantKey} (${row.crossTenantTokenFindings.join("; ")})`)
        .join(", ")}`,
    );
  }
}

async function readOrBuildBatch(
  repoRoot: string,
  generatedAt: string,
): Promise<AllTenantCandidateBatchReport> {
  const existing = await readJsonIfExists<AllTenantCandidateBatchReport>(
    repoRoot,
    "reports/all-tenant-candidate-batch/all-tenant-candidate-batch.json",
  );
  if (existing) return existing;
  return buildAllTenantCandidateBatch({ repoRoot, generatedAt });
}

async function buildSourceEstateCoverage(
  repoRoot: string,
  tenant: TenantBatchRow,
): Promise<TenantSourceEstateCoverage> {
  const aliases = aliasesForTenant(tenant.tenantKey);
  const sourceFiles = await discoverTenantSourceFiles(repoRoot, aliases);
  const signals = await Promise.all(
    sourceFiles.map((file) => buildSourceFileSignal(repoRoot, file)),
  );
  const domains = emptyDomainCounts();
  for (const signal of signals) domains[signal.domain] += 1;
  const evidenceSignals = [
    ...new Set(signals.flatMap((signal) => signal.evidenceSignals)),
  ].sort();
  const structuredRowCount = sum(
    signals.map((signal) => signal.rowCount ?? 0),
  );
  const domainCount = DOMAIN_KEYS.filter((domain) => domains[domain] > 0).length;
  const sourceRichnessScore = Math.min(
    100,
    domainCount * 6 + Math.min(40, Math.floor(structuredRowCount / 80)),
  );
  const sourceRichnessStatus =
    sourceRichnessScore >= 70 ? "pass" : sourceRichnessScore >= 40 ? "watch" : "gap";

  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    sourcePackCount: tenant.sourcePacksFound.length,
    fileCount: signals.length,
    structuredRowCount,
    domainCount,
    sourceRichnessScore,
    sourceRichnessStatus,
    sourceRichCandidateThin: false,
    domains,
    evidenceSignals,
    representativeFiles: chooseRepresentativeFiles(signals),
  };
}

function buildCandidateCoverage(
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
): TenantCandidateCoverage {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidateRecords = tenant.counts.candidateRecordsGenerated;
  const denominator = Math.max(source.structuredRowCount, source.fileCount * 10, 1);
  const candidateCoverageRatio = round(candidateRecords / denominator, 4);
  const candidateThin =
    candidateRecords === 0 ||
    (source.sourceRichnessScore >= 70 && candidateCoverageRatio < 0.2);
  const falseGreenRisk =
    candidateThin &&
    ["eligible", "partially_eligible"].includes(tenant.readinessStatus);
  const coverageStatus = candidateThin
    ? source.sourceRichnessScore >= 70
      ? "blocked"
      : "gap"
    : "pass";

  source.sourceRichCandidateThin = source.sourceRichnessScore >= 70 && candidateThin;

  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    candidateRecordsGenerated: candidateRecords,
    targetOperationsPlanned: tenant.counts.targetOperationsPlanned,
    candidateCoverageRatio,
    coverageStatus,
    candidateThin,
    falseGreenRisk,
    unmappedFields: tenant.counts.unmappedFields,
    quarantinedRecords: tenant.counts.quarantinedRecords,
    strandedIntelligenceRecords: tenant.counts.strandedIntelligenceRecords,
    missingMappings: tenant.missingMappings,
    blockers: tenant.blockers,
  };
}

async function buildCanonicalFactQuality(
  repoRoot: string,
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
): Promise<TenantCanonicalFactQuality> {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidate = await readCandidateRecord(repoRoot, tenant.tenantKey);
  const factOperationCount = candidate?.sourceCandidatePlan?.factOperationCount ?? 0;
  const canonicalRecordCount =
    candidate?.sourceCandidatePlan?.canonicalRecordCount ??
    tenant.counts.candidateRecordsGenerated;
  const findings: string[] = [];
  if (canonicalRecordCount === 0) {
    findings.push("No canonical candidate records were generated for this tenant.");
  }
  if (source.structuredRowCount > 0 && canonicalRecordCount < source.structuredRowCount * 0.2) {
    findings.push(
      "Canonical candidate records cover only a small fraction of discovered structured source rows.",
    );
  }
  if (factOperationCount < canonicalRecordCount) {
    findings.push("Not every canonical candidate record has a planned fact operation.");
  }
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    factOperationCount,
    canonicalRecordCount,
    sourceStructuredRows: source.structuredRowCount,
    status: findings.length === 0 ? "pass" : canonicalRecordCount === 0 ? "blocked" : "gap",
    findings,
  };
}

async function buildRelationshipGraphQuality(
  repoRoot: string,
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
): Promise<TenantRelationshipGraphQuality> {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidate = await readCandidateRecord(repoRoot, tenant.tenantKey);
  const relationshipOperationCount =
    candidate?.sourceCandidatePlan?.relationshipOperationCount ?? 0;
  const relationshipSourceFiles = source.domains.relationships;
  const integrationSourceFiles = source.domains.integration_estate;
  const graphPlanAvailableForAllModules =
    tenant.moduleReadiness.length > 0 &&
    tenant.moduleReadiness.every((module) => module.graphPlanAvailable);
  const findings: string[] = [];
  if (relationshipOperationCount === 0 && (relationshipSourceFiles > 0 || integrationSourceFiles > 0)) {
    findings.push(
      "Source evidence contains relationship or integration material, but the candidate plan has zero relationship operations.",
    );
  }
  if (!graphPlanAvailableForAllModules) {
    findings.push("At least one module lacks graph-plan readiness.");
  }
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    relationshipOperationCount,
    relationshipSourceFiles,
    integrationSourceFiles,
    graphPlanAvailableForAllModules,
    status: findings.length === 0 ? "pass" : relationshipOperationCount === 0 ? "gap" : "watch",
    findings,
  };
}

async function buildEvidenceQuality(
  repoRoot: string,
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
): Promise<TenantEvidenceQuality> {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidate = await readCandidateRecord(repoRoot, tenant.tenantKey);
  const evidenceOperationCount =
    candidate?.sourceCandidatePlan?.evidenceOperationCount ?? 0;
  const canonicalRecordCount =
    candidate?.sourceCandidatePlan?.canonicalRecordCount ??
    tenant.counts.candidateRecordsGenerated;
  const evidenceRatio =
    canonicalRecordCount > 0 ? round(evidenceOperationCount / canonicalRecordCount, 4) : 0;
  const sourceDocumentCount = source.domains.documents;
  const findings: string[] = [];
  if (canonicalRecordCount > 0 && evidenceRatio < 1) {
    findings.push("Candidate facts are not fully evidence-attached.");
  }
  if (sourceDocumentCount > 0 && evidenceOperationCount === 0) {
    findings.push("Narrative/source documents exist but are not represented in evidence operations.");
  }
  if (sourceDocumentCount > 0 && evidenceOperationCount < sourceDocumentCount) {
    findings.push("Only a thin subset of discovered source documents is represented as evidence.");
  }
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    evidenceOperationCount,
    sourceDocumentCount,
    evidenceRatio,
    status: findings.length === 0 ? "pass" : evidenceOperationCount === 0 ? "gap" : "watch",
    findings,
  };
}

function buildGeneratedDataRisk(
  source: TenantSourceEstateCoverage,
): TenantGeneratedDataRisk {
  const generatedOrSyntheticSourceFiles = source.representativeFiles.filter(
    (file) =>
      /synthetic|generated|fixture|demo/i.test(file.fileLabel) ||
      file.evidenceSignals.includes("synthetic-planning-grade"),
  ).length;
  const findings: string[] = [];
  if (generatedOrSyntheticSourceFiles > 0) {
    findings.push(
      "Some discovered source evidence is synthetic or generated and must be labeled as planning-grade.",
    );
  }
  if (source.evidenceSignals.includes("domain-consistency-risk")) {
    findings.push(
      "Domain consistency checks should run before generated rows are treated as operational truth.",
    );
  }
  return {
    tenantKey: source.tenantKey,
    tenantDisplayName: source.tenantDisplayName,
    generatedOrSyntheticSourceFiles,
    narrativeCaveatRequired: generatedOrSyntheticSourceFiles > 0,
    status: generatedOrSyntheticSourceFiles > 0 ? "watch" : "pass",
    findings,
  };
}

async function buildTenantIsolation(
  repoRoot: string,
  tenant: TenantBatchRow,
): Promise<TenantIsolationQuality> {
  const candidate = await readCandidateRecord(repoRoot, tenant.tenantKey);
  if (!candidate) {
    return {
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.displayName,
      tenantScopedCandidateArtifacts: true,
      crossTenantTokenFindings: [],
      status: "not_available",
    };
  }
  const serialized = JSON.stringify(candidate).toLowerCase();
  const crossTenantTokenFindings = TENANT_PROFILES.filter(
    (profile) => profile.tenantKey !== tenant.tenantKey,
  )
    .flatMap((profile) => profile.aliases)
    .filter((alias) => serialized.includes(alias.toLowerCase()));
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    tenantScopedCandidateArtifacts: crossTenantTokenFindings.length === 0,
    crossTenantTokenFindings: [...new Set(crossTenantTokenFindings)].sort(),
    status: crossTenantTokenFindings.length === 0 ? "pass" : "blocked",
  };
}

function buildModuleReadinessQuality(
  tenant: TenantBatchRow,
): TenantModuleReadinessQuality {
  const modules = tenant.moduleReadiness;
  const modulesWithEvidence = modules.filter((module) => module.evidenceAvailable).length;
  const modulesWithFactPlan = modules.filter((module) => module.factPlanAvailable).length;
  const modulesWithGraphPlan = modules.filter((module) => module.graphPlanAvailable).length;
  const modulesWithDerivedPlan = modules.filter((module) => module.derivedPlanAvailable).length;
  const runtimeReadyModules = modules.filter(
    (module) => module.readyForRuntimeConsumption,
  ).length;
  const findings: string[] = [];
  if (modules.length === 0) {
    findings.push("No module readiness proof exists for this tenant.");
  }
  if (modules.length > 0 && modulesWithGraphPlan < modules.length) {
    findings.push("Graph-plan readiness is missing for one or more modules.");
  }
  if (runtimeReadyModules > 0) {
    findings.push("A module is marked runtime-ready in a non-destructive candidate lane.");
  }
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    modulesEvaluated: modules.length,
    modulesWithEvidence,
    modulesWithFactPlan,
    modulesWithGraphPlan,
    modulesWithDerivedPlan,
    runtimeReadyModules,
    moduleOverreadinessRisk: runtimeReadyModules > 0,
    status:
      runtimeReadyModules > 0
        ? "blocked"
        : modules.length === 0
          ? "gap"
          : modulesWithGraphPlan < modules.length
            ? "watch"
            : "pass",
    findings,
  };
}

async function buildPromotionReadinessQuality(
  repoRoot: string,
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
  candidateCoverage: TenantCandidateCoverage[],
  relationshipGraphQuality: TenantRelationshipGraphQuality[],
): Promise<TenantPromotionReadinessQuality> {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidate = findByTenant(candidateCoverage, tenant.tenantKey);
  const graph = findByTenant(relationshipGraphQuality, tenant.tenantKey);
  const gate = await readJsonIfExists<{
    decisionRecord?: { decision?: string; blockers?: string[] };
  }>(
    repoRoot,
    `reports/candidate-promotion-gates/${tenantOutputSlug(tenant.tenantKey)}/promotion-gate-result.json`,
  );
  const activeAccessMetadataPresent = await exists(
    path.join(
      repoRoot,
      `reports/active-tenant-access/${tenantOutputSlug(tenant.tenantKey)}/active-tenant-access-record.json`,
    ),
  );
  const blockers = [
    ...(gate?.decisionRecord?.blockers ?? tenant.blockers),
  ];
  const requiredBeforeActiveTruth: string[] = [];
  if (candidate.candidateThin)
    requiredBeforeActiveTruth.push(
      "Expand candidate packet so canonical records materially cover the discovered source estate.",
    );
  if (graph.relationshipOperationCount === 0)
    requiredBeforeActiveTruth.push(
      "Add relationship mappings and prove graph-plan coverage before active truth claims.",
    );
  if (source.evidenceSignals.length > 0 && candidate.candidateRecordsGenerated === 0)
    requiredBeforeActiveTruth.push(
      "Map discovered evidence signals into candidate records with citations.",
    );
  if (blockers.length > 0)
    requiredBeforeActiveTruth.push("Clear promotion-gate blockers and capture operator approval.");

  const promotionUnsafe =
    candidate.candidateThin ||
    graph.relationshipOperationCount === 0 ||
    blockers.length > 0;

  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    promotionGateStatus: promotionUnsafe ? "blocked" : "pass",
    activeAccessMetadataPresent,
    promotionUnsafe,
    blockers,
    requiredBeforeActiveTruth,
  };
}

function buildAdminHomeCaveat(
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
  candidateCoverage: TenantCandidateCoverage[],
  relationshipGraphQuality: TenantRelationshipGraphQuality[],
): TenantAdminHomeCaveat {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidate = findByTenant(candidateCoverage, tenant.tenantKey);
  const graph = findByTenant(relationshipGraphQuality, tenant.tenantKey);
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    homeSummaryCaveat: candidate.candidateThin
      ? "Home should show a source-rich but candidate-thin caveat until canonical candidate coverage is expanded."
      : "Home may summarize candidate-backed context with evidence caveats.",
    gapsCaveat:
      "Gaps should be derived from source estate coverage, missing mappings, stranded intelligence, relationship coverage, and module readiness, not hand-written placeholders.",
    sourcesCaveat: `${source.fileCount} discovered source files across ${source.domainCount} domains; surface file categories and evidence signals rather than generic source labels.`,
    relationshipsCaveat:
      graph.relationshipOperationCount === 0
        ? "Relationship panel should state that graph operations are not yet planned despite dependency-rich source evidence."
        : "Relationship panel can show planned graph operations with citation status.",
  };
}

function buildTenantQualityMatrixRow(
  tenant: TenantBatchRow,
  sourceEstateCoverage: TenantSourceEstateCoverage[],
  candidateCoverage: TenantCandidateCoverage[],
  canonicalFactQuality: TenantCanonicalFactQuality[],
  relationshipGraphQuality: TenantRelationshipGraphQuality[],
  evidenceQuality: TenantEvidenceQuality[],
  generatedDataRisk: TenantGeneratedDataRisk[],
  tenantIsolation: TenantIsolationQuality[],
  moduleReadinessQuality: TenantModuleReadinessQuality[],
  promotionReadinessQuality: TenantPromotionReadinessQuality[],
): TenantQualityMatrixRow {
  const source = findByTenant(sourceEstateCoverage, tenant.tenantKey);
  const candidate = findByTenant(candidateCoverage, tenant.tenantKey);
  const fact = findByTenant(canonicalFactQuality, tenant.tenantKey);
  const graph = findByTenant(relationshipGraphQuality, tenant.tenantKey);
  const evidence = findByTenant(evidenceQuality, tenant.tenantKey);
  const generated = findByTenant(generatedDataRisk, tenant.tenantKey);
  const isolation = findByTenant(tenantIsolation, tenant.tenantKey);
  const moduleReadiness = findByTenant(moduleReadinessQuality, tenant.tenantKey);
  const promotion = findByTenant(promotionReadinessQuality, tenant.tenantKey);
  const statuses = [
    source.sourceRichnessStatus,
    candidate.coverageStatus,
    fact.status,
    graph.status,
    evidence.status,
    isolation.status,
    moduleReadiness.status,
    promotion.promotionGateStatus,
  ];
  const overallStatus = statuses.includes("blocked")
    ? "blocked"
    : statuses.includes("gap")
      ? "gap"
      : statuses.includes("watch")
        ? "watch"
        : "pass";
  return {
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    overallStatus,
    sourceRichnessScore: source.sourceRichnessScore,
    sourceStructuredRows: source.structuredRowCount,
    candidateCoverageRatio: candidate.candidateCoverageRatio,
    candidateRecordsGenerated: candidate.candidateRecordsGenerated,
    relationshipOperationCount: graph.relationshipOperationCount,
    evidenceOperationCount: evidence.evidenceOperationCount,
    sourceRichCandidateThin: source.sourceRichCandidateThin,
    falseGreenRisk: candidate.falseGreenRisk,
    generatedDataRisk: generated.status,
    tenantIsolationStatus: isolation.status,
    moduleReadinessStatus: moduleReadiness.status,
    promotionReadinessStatus: promotion.promotionGateStatus,
    promotionUnsafe: promotion.promotionUnsafe,
    recommendedNextAction: recommendedNextAction(candidate, graph, fact),
  };
}

async function discoverTenantSourceFiles(
  repoRoot: string,
  aliases: string[],
): Promise<string[]> {
  const roots = ["datasets"];
  const files: string[] = [];
  for (const root of roots) {
    const absoluteRoot = path.join(repoRoot, root);
    if (!(await exists(absoluteRoot))) continue;
    const discovered = await listFiles(absoluteRoot);
    for (const absoluteFile of discovered) {
      const relative = path.relative(repoRoot, absoluteFile).replaceAll(path.sep, "/");
      const lower = relative.toLowerCase();
      if (aliases.some((alias) => lower.includes(alias.toLowerCase()))) {
        files.push(relative);
      }
    }
  }
  return [...new Set(files)].sort();
}

async function buildSourceFileSignal(
  repoRoot: string,
  relativePath: string,
): Promise<SourceFileSignal> {
  const absolutePath = path.join(repoRoot, relativePath);
  const sample = await readSample(absolutePath);
  const domain = classifySourceDomain(relativePath, sample);
  const rowCount = relativePath.endsWith(".csv") ? await countCsvRows(absolutePath) : null;
  return {
    fileLabel: sanitizeFileLabel(relativePath),
    domain,
    rowCount,
    evidenceSignals: extractEvidenceSignals(relativePath, sample),
  };
}

function classifySourceDomain(relativePath: string, sample: string): SourceDomain {
  const pathOnly = relativePath.toLowerCase();
  if (/(f05_applications-systems|applications-systems|application-portfolio)/i.test(pathOnly))
    return "systems_estate";
  if (/(f09_data-analytics-estate|data-analytics-estate|data-assets|data_assets|data-product)/i.test(pathOnly))
    return "data_and_analytics";
  if (/(f10_integrations-interfaces|integrations-interfaces|integration-topology|interfaces)/i.test(pathOnly))
    return "integration_estate";
  if (/(f12_relationships|relationships_graph|graph_edges|context-relationships)/i.test(pathOnly))
    return "relationships";
  const haystack = `${relativePath}\n${sample}`.toLowerCase();
  if (/(mainframe|ibm z|cics|cobol|db2|ims|mq|racf|sap)/i.test(haystack))
    return "mainframe_and_core";
  if (/(integration|interface|lineage|hl7|fhir|api|event stream)/i.test(haystack))
    return "integration_estate";
  if (/(teradata|analytics|data product|data asset|tableau|power bi|sas|datastage|informatica|caboodle|clarity|lakehouse)/i.test(haystack))
    return "data_and_analytics";
  if (/(application|system|technology estate|cmdb|platform volumetric|infrastructure|cloud)/i.test(haystack))
    return "systems_estate";
  if (/(relationship|edge|graph|dependency|ownership|map)/i.test(haystack))
    return "relationships";
  if (/(vendor|contract|license|source|rfp|sourcing|pricing|rate card)/i.test(haystack))
    return "vendors_contracts";
  if (/(budget|financial|spend|value|benefit|outcome|margin|tower)/i.test(haystack))
    return "financial_value";
  if (/(initiative|move|roadmap|program|milestone|phase|charter)/i.test(haystack))
    return "moves_execution";
  if (/(risk|control|security|compliance|regulatory|governance)/i.test(haystack))
    return "risk_controls";
  if (/(benchmark|industry|market|corpus|pattern)/i.test(haystack))
    return "benchmarks";
  if (/(persona|workforce|role|team|org|owner)/i.test(haystack))
    return "workforce";
  if (/(profile|business function|capabilit)/i.test(haystack))
    return "enterprise_profile";
  if (/source/.test(haystack)) return "source_events";
  if (/tower/.test(haystack)) return "tower_outcomes";
  return "documents";
}

function extractEvidenceSignals(relativePath: string, sample: string): string[] {
  const haystack = `${relativePath}\n${sample}`;
  const signals: string[] = [];
  const checks: Array<[RegExp, string]> = [
    [/IBM Z|CICS|COBOL|DB2|IMS|RACF|mainframe/i, "mainframe-core"],
    [/Teradata|Vantage/i, "teradata-estate"],
    [/SAS|DataStage|Informatica|Tableau|BusinessObjects|Power BI/i, "analytics-toolchain"],
    [/SAP/i, "sap-estate"],
    [/Epic|Clarity|Caboodle/i, "healthcare-core-systems"],
    [/claims|pharmacy|prior auth|utilization/i, "healthcare-claims-operations"],
    [/contract|vendor|RFP|sourcing|rate card/i, "sourcing-commercial"],
    [/generated|synthetic|demo/i, "synthetic-planning-grade"],
  ];
  for (const [pattern, signal] of checks) {
    if (pattern.test(haystack)) signals.push(signal);
  }
  if (/cloud/i.test(haystack) && /mainframe/i.test(haystack))
    signals.push("domain-consistency-risk");
  return [...new Set(signals)].sort();
}

async function readCandidateRecord(repoRoot: string, tenantKey: string) {
  return readJsonIfExists<{
    sourceCandidatePlan?: {
      canonicalRecordCount: number;
      evidenceOperationCount: number;
      factOperationCount: number;
      relationshipOperationCount: number;
      quarantineOperationCount: number;
    };
  }>(
    repoRoot,
    `reports/candidate-tenant-data-versions/${tenantOutputSlug(tenantKey)}/candidate-version-record.json`,
  );
}

function recommendedNextAction(
  candidate: TenantCandidateCoverage,
  graph: TenantRelationshipGraphQuality,
  fact: TenantCanonicalFactQuality,
): string {
  if (candidate.candidateThin)
    return "Expand Tenant Packet projection and source adapter mappings before more promotion work.";
  if (graph.relationshipOperationCount === 0)
    return "Add relationship mappings and graph-plan proof before active truth claims.";
  if (fact.status !== "pass")
    return "Close canonical fact coverage gaps before module-read claims.";
  return "Keep candidate preview-only until operator promotion and rollback proof are explicitly approved.";
}

async function writeAuditReport(
  repoRoot: string,
  outputDir: string,
  report: AllTenantDataQualityAudit,
): Promise<void> {
  const absoluteOutputDir = path.resolve(repoRoot, outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await writeJson(path.join(absoluteOutputDir, "tenant-quality-matrix.json"), {
    generatedAt: report.generatedAt,
    guardrails: hardRuntimeBooleans(report),
    rollup: report.rollup,
    tenants: report.tenantQualityMatrix,
  });
  await writeJson(path.join(absoluteOutputDir, "source-estate-coverage.json"), {
    generatedAt: report.generatedAt,
    tenants: report.sourceEstateCoverage,
  });
  await writeJson(path.join(absoluteOutputDir, "candidate-coverage.json"), {
    generatedAt: report.generatedAt,
    tenants: report.candidateCoverage,
  });
  await writeJson(path.join(absoluteOutputDir, "canonical-fact-quality.json"), {
    generatedAt: report.generatedAt,
    tenants: report.canonicalFactQuality,
  });
  await writeJson(path.join(absoluteOutputDir, "relationship-graph-quality.json"), {
    generatedAt: report.generatedAt,
    tenants: report.relationshipGraphQuality,
  });
  await writeJson(path.join(absoluteOutputDir, "evidence-quality.json"), {
    generatedAt: report.generatedAt,
    tenants: report.evidenceQuality,
  });
  await writeJson(path.join(absoluteOutputDir, "generated-data-risk.json"), {
    generatedAt: report.generatedAt,
    tenants: report.generatedDataRisk,
  });
  await writeJson(path.join(absoluteOutputDir, "tenant-isolation.json"), {
    generatedAt: report.generatedAt,
    tenants: report.tenantIsolation,
  });
  await writeJson(path.join(absoluteOutputDir, "module-readiness-quality.json"), {
    generatedAt: report.generatedAt,
    tenants: report.moduleReadinessQuality,
  });
  await writeJson(path.join(absoluteOutputDir, "promotion-readiness-quality.json"), {
    generatedAt: report.generatedAt,
    tenants: report.promotionReadinessQuality,
  });
  await writeJson(path.join(absoluteOutputDir, "admin-home-caveats.json"), {
    generatedAt: report.generatedAt,
    tenants: report.adminHomeCaveats,
  });
  await fs.writeFile(path.join(absoluteOutputDir, "summary.md"), summaryMarkdown(report), "utf8");
  await fs.writeFile(
    path.join(absoluteOutputDir, "recommended-remediation-plan.md"),
    remediationMarkdown(report),
    "utf8",
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "data-quality-control.html"),
    htmlReport(report),
    "utf8",
  );
}

function summaryMarkdown(report: AllTenantDataQualityAudit): string {
  const rows = report.tenantQualityMatrix
    .map(
      (row) =>
        `| ${row.tenantKey} | ${row.overallStatus} | ${row.sourceRichnessScore} | ${row.sourceStructuredRows} | ${(row.candidateCoverageRatio * 100).toFixed(1)}% | ${row.candidateRecordsGenerated} | ${row.relationshipOperationCount} | ${row.sourceRichCandidateThin ? "yes" : "no"} | ${row.promotionUnsafe ? "yes" : "no"} |`,
    )
    .join("\n");
  return `# All-Tenant Data Quality And Coverage Audit

Generated: \`${report.generatedAt}\`

This is a read-only audit. It does not write production tenant data, update
Active Tenant Access, promote candidates, write physical tables, change module
runtime behavior, make modules read candidate data by default, or claim realized
value.

## Rollup

- Tenants scanned: ${report.rollup.tenantsScanned}
- Source-rich / candidate-thin tenants: ${report.rollup.sourceRichCandidateThinTenants}
- False-green risk tenants: ${report.rollup.falseGreenRiskTenants}
- Relationship gap tenants: ${report.rollup.relationshipGapTenants}
- Promotion-unsafe tenants: ${report.rollup.promotionUnsafeTenants}
- Generated-data watch tenants: ${report.rollup.generatedDataWatchTenants}
- Tenant-isolation failures: ${report.rollup.tenantIsolationFailures}

## Tenant Quality Matrix

| Tenant | Overall | Source score | Source rows | Candidate coverage | Candidate records | Relationship ops | Source-rich thin | Promotion unsafe |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
${rows}
`;
}

function remediationMarkdown(report: AllTenantDataQualityAudit): string {
  const rows = report.tenantQualityMatrix
    .map((row) => {
      const caveat = findByTenant(report.adminHomeCaveats, row.tenantKey);
      return `## ${row.tenantDisplayName}

- Status: ${row.overallStatus}
- Next action: ${row.recommendedNextAction}
- Home caveat: ${caveat.homeSummaryCaveat}
- Sources caveat: ${caveat.sourcesCaveat}
- Relationships caveat: ${caveat.relationshipsCaveat}
`;
    })
    .join("\n");
  return `# Recommended Remediation Plan

The audit treats source-rich/candidate-thin coverage as a blocker for broad
promotion claims. The next work should expand packet projection and mapping
coverage before UI polish or additional promotion surfaces.

${rows}
`;
}

function htmlReport(report: AllTenantDataQualityAudit): string {
  const rows = report.tenantQualityMatrix
    .map(
      (row) => `<tr>
  <td>${escapeHtml(row.tenantDisplayName)}</td>
  <td><span class="pill ${row.overallStatus}">${row.overallStatus}</span></td>
  <td>${row.sourceRichnessScore}</td>
  <td>${row.sourceStructuredRows.toLocaleString()}</td>
  <td>${(row.candidateCoverageRatio * 100).toFixed(1)}%</td>
  <td>${row.candidateRecordsGenerated}</td>
  <td>${row.relationshipOperationCount}</td>
  <td>${row.sourceRichCandidateThin ? "Yes" : "No"}</td>
  <td>${escapeHtml(row.recommendedNextAction)}</td>
</tr>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>All-Tenant Data Quality Audit</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f6f7f8; color: #0f172a; }
    main { max-width: 1440px; margin: 0 auto; padding: 34px; }
    h1 { font-size: 42px; margin: 0 0 8px; letter-spacing: 0; }
    p { color: #475569; font-size: 16px; line-height: 1.55; }
    .hero, table { background: #fff; border: 1px solid rgba(15,23,42,.12); border-radius: 8px; box-shadow: 0 1px 2px rgba(15,23,42,.05); }
    .hero { padding: 24px; margin-bottom: 18px; }
    .metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
    .metric { border: 1px solid rgba(15,23,42,.1); border-radius: 8px; padding: 12px; background: #fbfbfa; }
    .label { text-transform: uppercase; color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: 0; }
    .value { margin-top: 8px; font-size: 22px; font-weight: 850; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; }
    th, td { padding: 12px; border-bottom: 1px solid rgba(15,23,42,.08); text-align: left; vertical-align: top; font-size: 14px; }
    th { color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0; }
    .pill { display: inline-block; border-radius: 999px; padding: 5px 8px; font-size: 12px; font-weight: 800; background: #e2e8f0; }
    .pill.blocked, .pill.gap { background: #fff1f2; color: #be123c; }
    .pill.watch { background: #fff7ed; color: #c2410c; }
    .pill.pass { background: #ecfdf5; color: #047857; }
  </style>
</head>
<body>
<main>
  <section class="hero">
    <div class="label">Data quality control</div>
    <h1>All-Tenant Data Quality Audit</h1>
    <p>Read-only proof that compares discovered source richness with candidate coverage, graph readiness, evidence quality, generated-data caveats, tenant isolation, module readiness, and promotion safety.</p>
    <div class="metrics">
      <div class="metric"><div class="label">Tenants</div><div class="value">${report.rollup.tenantsScanned}</div></div>
      <div class="metric"><div class="label">Source-rich thin</div><div class="value">${report.rollup.sourceRichCandidateThinTenants}</div></div>
      <div class="metric"><div class="label">False green</div><div class="value">${report.rollup.falseGreenRiskTenants}</div></div>
      <div class="metric"><div class="label">Graph gaps</div><div class="value">${report.rollup.relationshipGapTenants}</div></div>
      <div class="metric"><div class="label">Promotion unsafe</div><div class="value">${report.rollup.promotionUnsafeTenants}</div></div>
      <div class="metric"><div class="label">Isolation failures</div><div class="value">${report.rollup.tenantIsolationFailures}</div></div>
    </div>
  </section>
  <table>
    <thead><tr><th>Tenant</th><th>Status</th><th>Source score</th><th>Rows</th><th>Coverage</th><th>Candidate</th><th>Graph ops</th><th>Thin?</th><th>Next action</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</main>
</body>
</html>
`;
}

function validateAuditGuardrails(report: AllTenantDataQualityAudit): void {
  if (
    !report.dryRunOnly ||
    report.productionTenantDataWritten ||
    report.activeTenantAccessLayerUpdated ||
    report.candidatePromoted ||
    report.writesPhysicalTables ||
    report.moduleRuntimeConsumptionChanged ||
    report.moduleReadsCandidateByDefault ||
    report.realizedValueClaimed
  ) {
    throw new Error("Data quality audit violated non-destructive guardrails.");
  }
  assertCandidateCoverageAudit(report);
  assertTenantIsolationAudit(report);
}

function buildEmbeddedTenantQualityMatrix(): TenantQualityMatrixArtifact {
  return {
    generatedAt: "2026-07-13T04:30:21.622Z",
    guardrails: {
      dryRunOnly: true,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      writesPhysicalTables: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
      realizedValueClaimed: false,
    },
    rollup: {
      tenantsScanned: 7,
      sourceRichCandidateThinTenants: 6,
      falseGreenRiskTenants: 4,
      relationshipGapTenants: 7,
      promotionUnsafeTenants: 7,
      generatedDataWatchTenants: 6,
      tenantIsolationFailures: 0,
    },
    tenants: [
      embeddedTenant("skyharbor-air", "SkyHarbor Air", 100, 31213, 0.0017, 53, 53, true, true, "watch", "pass", "watch"),
      embeddedTenant("lakeshore-holdings", "Lakeshore Holdings", 82, 8721, 0, 0, 0, true, true, "watch", "not_available", "gap"),
      embeddedTenant("meridian-health", "Meridian Health", 100, 11226, 0, 0, 0, true, true, "watch", "not_available", "gap"),
      embeddedTenant("first-capital", "First Capital", 70, 14576, 0, 0, 0, true, false, "watch", "not_available", "gap"),
      embeddedTenant("apex-retail", "Apex Retail", 100, 10388, 0, 0, 0, true, true, "watch", "not_available", "gap"),
      embeddedTenant("northstar", "Northstar", 100, 6032, 0, 0, 0, true, false, "watch", "not_available", "gap"),
      embeddedTenant("morgan-street", "Morgan Street", 0, 0, 0, 0, 0, false, false, "pass", "not_available", "gap"),
    ],
  };
}

function embeddedTenant(
  tenantKey: string,
  tenantDisplayName: string,
  sourceRichnessScore: number,
  sourceStructuredRows: number,
  candidateCoverageRatio: number,
  candidateRecordsGenerated: number,
  evidenceOperationCount: number,
  sourceRichCandidateThin: boolean,
  falseGreenRisk: boolean,
  generatedDataRisk: QualityStatus,
  tenantIsolationStatus: QualityStatus,
  moduleReadinessStatus: QualityStatus,
): TenantQualityMatrixRow {
  return {
    tenantKey,
    tenantDisplayName,
    overallStatus: "blocked",
    sourceRichnessScore,
    sourceStructuredRows,
    candidateCoverageRatio,
    candidateRecordsGenerated,
    relationshipOperationCount: 0,
    evidenceOperationCount,
    sourceRichCandidateThin,
    falseGreenRisk,
    generatedDataRisk,
    tenantIsolationStatus,
    moduleReadinessStatus,
    promotionReadinessStatus: "blocked",
    promotionUnsafe: true,
    recommendedNextAction:
      "Expand Tenant Packet projection and source adapter mappings before more promotion work.",
  };
}

function hardRuntimeBooleans(report: AllTenantDataQualityAudit) {
  return {
    dryRunOnly: report.dryRunOnly,
    productionTenantDataWritten: report.productionTenantDataWritten,
    activeTenantAccessLayerUpdated: report.activeTenantAccessLayerUpdated,
    candidatePromoted: report.candidatePromoted,
    writesPhysicalTables: report.writesPhysicalTables,
    moduleRuntimeConsumptionChanged: report.moduleRuntimeConsumptionChanged,
    moduleReadsCandidateByDefault: report.moduleReadsCandidateByDefault,
    realizedValueClaimed: report.realizedValueClaimed,
  };
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath)));
    } else if (isAuditableSourceFile(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function isAuditableSourceFile(fileName: string): boolean {
  return /\.(csv|json|jsonl|ya?ml|md|txt)$/i.test(fileName);
}

async function countCsvRows(absolutePath: string): Promise<number> {
  const text = await fs.readFile(absolutePath, "utf8");
  return Math.max(0, text.split(/\r?\n/).filter(Boolean).length - 1);
}

async function readSample(absolutePath: string): Promise<string> {
  const file = await fs.open(absolutePath, "r");
  try {
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).toString("utf8");
  } finally {
    await file.close();
  }
}

async function readJsonIfExists<T>(
  repoRoot: string,
  relativePath: string,
): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(path.join(repoRoot, relativePath), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    return undefined;
  }
}

async function exists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(absolutePath: string, value: unknown): Promise<void> {
  await fs.writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function chooseRepresentativeFiles(signals: SourceFileSignal[]): SourceFileSignal[] {
  const byDomain = new Map<SourceDomain, SourceFileSignal>();
  for (const signal of signals) {
    const current = byDomain.get(signal.domain);
    if (!current || (signal.rowCount ?? 0) > (current.rowCount ?? 0)) {
      byDomain.set(signal.domain, signal);
    }
  }
  return [...byDomain.values()]
    .sort((left, right) => (right.rowCount ?? 0) - (left.rowCount ?? 0))
    .slice(0, 18);
}

function aliasesForTenant(tenantKey: string): string[] {
  return [
    ...(TENANT_PROFILES.find((tenant) => tenant.tenantKey === tenantKey)
      ?.aliases ?? [tenantKey]),
  ];
}

function tenantOutputSlug(tenantKey: string): string {
  if (tenantKey === "skyharbor-air") return "skyharbor";
  return tenantKey;
}

function emptyDomainCounts(): Record<SourceDomain, number> {
  return Object.fromEntries(DOMAIN_KEYS.map((domain) => [domain, 0])) as Record<
    SourceDomain,
    number
  >;
}

function findByTenant<T extends { tenantKey: string }>(
  rows: T[],
  tenantKey: string,
): T {
  const row = rows.find((candidate) => candidate.tenantKey === tenantKey);
  if (!row) throw new Error(`Missing data-quality row for tenant ${tenantKey}.`);
  return row;
}

function sanitizeFileLabel(relativePath: string): string {
  return relativePath
    .split("/")
    .filter((part) => part !== "datasets" && part !== "reports")
    .map((part) =>
      part
        .replace(/\b[Vv](?:1|2|4|6|7)(?:_[A-Za-z0-9]+)*(?:-[A-Za-z0-9]+)*/g, "legacy-pack")
        .replace(/synthetic/gi, "planning")
        .replace(/\s+/g, " "),
    )
    .join(" / ");
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
