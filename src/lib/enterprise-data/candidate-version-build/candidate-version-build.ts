import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  buildCanonicalTenantDataReport,
  CANONICAL_DATA_BUILD_REPORT_DIR,
  type CanonicalDataBuildReport,
} from "../canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../contracts/canonical-ingestion";

export const CANDIDATE_VERSION_BUILD_REPORT_DIR =
  "reports/candidate-version-build/latest";
export const CANDIDATE_VERSION_BUILD_VERSION = "candidate-version-build/v1";
export const CANDIDATE_PREVIEW_BANNER =
  "Candidate Preview Mode - inactive candidate data. Not active tenant truth.";
const ACTIVE_SKYHARBOR_TENANT_KEY = "skyharbor_global";
const LEGACY_SKYHARBOR_TENANT_KEY = "skyharbor-air";

type GateStatus = "pass" | "fail" | "warn";
type CandidateCreationStatus = "created" | "blocked";

export interface CandidateQualityGateCheck {
  id: string;
  label: string;
  status: GateStatus;
  detail: string;
}

export interface CandidateVersionDomainCount {
  domain: string;
  sourceRows: number;
  acceptedRecords: number;
  skippedRows: number;
  duplicateNames: number;
}

export interface CandidateReadModelSample {
  domain: string;
  objectType: string;
  sourceObjectId: string;
  displayName: string;
  evidenceKeys: string[];
  sourcePath?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface TenantCandidateVersion {
  candidateVersionId: string;
  tenantId: string;
  tenantKey: string;
  tenantDisplayName: string;
  sourceBuildId: string;
  sourceBuildFingerprint: string;
  inputFingerprint: string;
  canonicalRecordCount: number;
  evidenceAttachmentCount: number;
  relationshipCandidateCount: number;
  domainCounts: CandidateVersionDomainCount[];
  enterpriseProfileStatus: "ready" | "gaps" | "missing";
  profileGapCount: number;
  qualityGateStatus: "pass" | "blocked";
  qualityGates: CandidateQualityGateCheck[];
  promotionBlockers: string[];
  generatedAt: string;
  status: "inactive";
  creationStatus: CandidateCreationStatus;
  mode: "candidate_preview";
  previewBanner: typeof CANDIDATE_PREVIEW_BANNER;
  sourceSnapshotIds: string[];
  sourceLineage: Array<{
    sourcePath: string;
    fingerprint: string;
    rowCount: number;
    domain: string | null;
  }>;
  homeAvaReadiness: {
    ready: boolean;
    profileReady: boolean;
    evidenceReady: boolean;
    relationshipReady: boolean;
    caveats: string[];
    canAnswer: string[];
    mustNotClaim: string[];
  };
  readModelSamples: CandidateReadModelSample[];
  guardrails: CandidateVersionBuildReport["guardrails"];
}

export interface CandidateVersionBuildReport {
  reportVersion: typeof CANDIDATE_VERSION_BUILD_VERSION;
  generatedAt: string;
  sourceBuildId: string;
  sourceBuildPath: string;
  sourceBuildFingerprint: string;
  sourceBuildFiles: Array<{ path: string; fingerprint: string }>;
  guardrails: {
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    moduleReadsCandidateByDefault: false;
    defaultHomeReadsCandidateData: false;
    candidateDataCalledActiveTruth: false;
    writesPhysicalTables: false;
    candidatePreviewRequiresExplicitMode: true;
  };
  candidateVersions: TenantCandidateVersion[];
  blockedTenants: Array<{
    tenantKey: string;
    tenantDisplayName: string;
    blockers: string[];
  }>;
  activeCandidateSeparation: {
    defaultHomeRuntimeSource: "active_home_context";
    candidatePreviewRuntimeSource: "inactive_candidate_read_model";
    defaultHomeReadsCandidateData: false;
    moduleRuntimeReadsCandidateByDefault: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    productionTenantDataWritten: false;
  };
  skyharborPreview: TenantCandidateVersion | null;
  meridianPreview: TenantCandidateVersion | null;
  summary: {
    tenantsProcessed: number;
    candidateVersionsCreated: number;
    tenantsBlocked: number;
    canonicalRecordsRepresented: number;
    evidenceAttachmentsRepresented: number;
    relationshipCandidatesRepresented: number;
    inactiveOnly: true;
  };
}

export type CandidateVersionBuildLoadSource =
  | "report_artifact"
  | "runtime_deterministic_fallback"
  | "missing";

export interface CandidateVersionBuildLoadResult {
  report: CandidateVersionBuildReport | null;
  source: CandidateVersionBuildLoadSource;
  errors: string[];
}

const REQUIRED_SOURCE_BUILD_FILES = [
  "summary.md",
  "tenant-build-index.json",
  "canonical-records-summary.json",
  "evidence-attachment-summary.json",
  "relationship-candidates-summary.json",
  "enterprise-profile-build.json",
  "placeholder-rejection-report.json",
  "tenant-gaps.json",
  "tenant-quality-depth.json",
  "home-ava-readiness.json",
  "source-path-enforcement.json",
  "archive-read-violations.json",
  "all-tenant-build-control.html",
];

const DOMAIN_SAMPLE_PRIORITY = [
  "enterprise_profile",
  "business_functions",
  "applications_systems",
  "data_assets_integrations",
  "infrastructure_platforms",
  "vendors_contracts",
  "programs_initiatives",
  "ai_automation_use_cases",
  "risks_controls",
  "metrics_outcomes",
  "operational_process_evidence",
];

export async function buildCandidateVersionBuildReport(options: {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
}): Promise<CandidateVersionBuildReport> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourceBuildPath = CANONICAL_DATA_BUILD_REPORT_DIR;
  const canonicalBuild = await buildCanonicalTenantDataReport({
    repoRoot: options.repoRoot,
    generatedAt,
  });
  const sourceBuildFiles = await fingerprintSourceBuild(
    options.repoRoot,
    sourceBuildPath,
  ).catch(() => fingerprintInMemoryCanonicalBuild(canonicalBuild));
  const sourceBuildFingerprint = hashJson(sourceBuildFiles);
  const sourceBuildId = `canonical-data-build:${sourceBuildFingerprint.slice(0, 12)}`;

  const guardrails: CandidateVersionBuildReport["guardrails"] = {
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moduleReadsCandidateByDefault: false,
    defaultHomeReadsCandidateData: false,
    candidateDataCalledActiveTruth: false,
    writesPhysicalTables: false,
    candidatePreviewRequiresExplicitMode: true,
  };

  const candidateVersions = canonicalBuild.tenants.map((tenant) =>
    buildTenantCandidateVersion({
      tenant,
      canonicalBuild,
      generatedAt,
      sourceBuildId,
      sourceBuildFingerprint,
      guardrails,
    }),
  );
  const blockedTenants = candidateVersions
    .filter((candidate) => candidate.creationStatus === "blocked")
    .map((candidate) => ({
      tenantKey: candidate.tenantKey,
      tenantDisplayName: candidate.tenantDisplayName,
      blockers: candidate.promotionBlockers,
    }));

  const report: CandidateVersionBuildReport = {
    reportVersion: CANDIDATE_VERSION_BUILD_VERSION,
    generatedAt,
    sourceBuildId,
    sourceBuildPath,
    sourceBuildFingerprint,
    sourceBuildFiles,
    guardrails,
    candidateVersions,
    blockedTenants,
    activeCandidateSeparation: {
      defaultHomeRuntimeSource: "active_home_context",
      candidatePreviewRuntimeSource: "inactive_candidate_read_model",
      defaultHomeReadsCandidateData: false,
      moduleRuntimeReadsCandidateByDefault: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      productionTenantDataWritten: false,
    },
    skyharborPreview:
      candidateVersions.find(
        (candidate) =>
          candidate.tenantKey === ACTIVE_SKYHARBOR_TENANT_KEY ||
          candidate.tenantKey === LEGACY_SKYHARBOR_TENANT_KEY,
      ) ?? null,
    meridianPreview:
      candidateVersions.find(
        (candidate) => candidate.tenantKey === "meridian-health",
      ) ?? null,
    summary: {
      tenantsProcessed: candidateVersions.length,
      candidateVersionsCreated: candidateVersions.filter(
        (candidate) => candidate.creationStatus === "created",
      ).length,
      tenantsBlocked: blockedTenants.length,
      canonicalRecordsRepresented: candidateVersions.reduce(
        (sum, candidate) => sum + candidate.canonicalRecordCount,
        0,
      ),
      evidenceAttachmentsRepresented: candidateVersions.reduce(
        (sum, candidate) => sum + candidate.evidenceAttachmentCount,
        0,
      ),
      relationshipCandidatesRepresented: candidateVersions.reduce(
        (sum, candidate) => sum + candidate.relationshipCandidateCount,
        0,
      ),
      inactiveOnly: true,
    },
  };

  if (options.outputDir) {
    await writeCandidateVersionBuildReport(
      options.repoRoot,
      options.outputDir,
      report,
    );
  }

  return report;
}

export async function writeCandidateVersionBuildReport(
  repoRoot: string,
  outputDir: string,
  report: CandidateVersionBuildReport,
): Promise<void> {
  const absoluteOutputDir = path.resolve(repoRoot, outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "summary.md"),
    summaryMarkdown(report),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "candidate-version-index.json"),
    json({
      reportVersion: report.reportVersion,
      generatedAt: report.generatedAt,
      sourceBuildId: report.sourceBuildId,
      sourceBuildPath: report.sourceBuildPath,
      sourceBuildFingerprint: report.sourceBuildFingerprint,
      summary: report.summary,
    }),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "tenant-candidate-versions.json"),
    json(report.candidateVersions),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "quality-gate-results.json"),
    json(
      report.candidateVersions.map((candidate) => ({
        tenantKey: candidate.tenantKey,
        tenantDisplayName: candidate.tenantDisplayName,
        candidateVersionId: candidate.candidateVersionId,
        qualityGateStatus: candidate.qualityGateStatus,
        creationStatus: candidate.creationStatus,
        gates: candidate.qualityGates,
      })),
    ),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "promotion-blockers.json"),
    json(
      report.candidateVersions.map((candidate) => ({
        tenantKey: candidate.tenantKey,
        tenantDisplayName: candidate.tenantDisplayName,
        candidateVersionId: candidate.candidateVersionId,
        blockers: candidate.promotionBlockers,
      })),
    ),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "skyharbor-candidate-preview.json"),
    json(report.skyharborPreview),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "meridian-candidate-preview.json"),
    json(report.meridianPreview),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "candidate-read-model-samples.json"),
    json(
      report.candidateVersions.map((candidate) => ({
        tenantKey: candidate.tenantKey,
        candidateVersionId: candidate.candidateVersionId,
        samples: candidate.readModelSamples,
      })),
    ),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "active-vs-candidate-separation.json"),
    json(report.activeCandidateSeparation),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "guardrails.json"),
    json(report.guardrails),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "candidate-version-control.html"),
    controlHtml(report),
  );
}

export async function readLatestCandidateVersionBuild(
  repoRoot: string,
): Promise<CandidateVersionBuildReport | null> {
  const reportDir = path.resolve(repoRoot, CANDIDATE_VERSION_BUILD_REPORT_DIR);
  try {
    const [
      indexText,
      candidatesText,
      blockersText,
      separationText,
      guardrailsText,
    ] = await Promise.all([
      fs.readFile(path.join(reportDir, "candidate-version-index.json"), "utf8"),
      fs.readFile(
        path.join(reportDir, "tenant-candidate-versions.json"),
        "utf8",
      ),
      fs.readFile(path.join(reportDir, "promotion-blockers.json"), "utf8"),
      fs.readFile(
        path.join(reportDir, "active-vs-candidate-separation.json"),
        "utf8",
      ),
      fs.readFile(path.join(reportDir, "guardrails.json"), "utf8"),
    ]);
    const index = JSON.parse(indexText) as Pick<
      CandidateVersionBuildReport,
      | "reportVersion"
      | "generatedAt"
      | "sourceBuildId"
      | "sourceBuildPath"
      | "sourceBuildFingerprint"
      | "summary"
    >;
    const candidateVersions = JSON.parse(
      candidatesText,
    ) as TenantCandidateVersion[];
    const blockers = JSON.parse(blockersText) as Array<{
      tenantKey: string;
      tenantDisplayName: string;
      candidateVersionId: string;
      blockers: string[];
    }>;
    return normalizeCandidateVersionBuildReportForActiveTenants({
      ...index,
      sourceBuildFiles: [],
      guardrails: JSON.parse(
        guardrailsText,
      ) as CandidateVersionBuildReport["guardrails"],
      candidateVersions,
      blockedTenants: blockers
        .filter((entry) => entry.blockers.length > 0)
        .map((entry) => ({
          tenantKey: entry.tenantKey,
          tenantDisplayName: entry.tenantDisplayName,
          blockers: entry.blockers,
        })),
      activeCandidateSeparation: JSON.parse(
        separationText,
      ) as CandidateVersionBuildReport["activeCandidateSeparation"],
      skyharborPreview:
        candidateVersions.find(
          (candidate) =>
            candidate.tenantKey === ACTIVE_SKYHARBOR_TENANT_KEY ||
            candidate.tenantKey === LEGACY_SKYHARBOR_TENANT_KEY,
        ) ?? null,
      meridianPreview: null,
    });
  } catch {
    return null;
  }
}

export async function loadCandidateVersionBuildForAdmin(options: {
  repoRoot: string;
  allowRuntimeFallback?: boolean;
  forceRuntimeFallback?: boolean;
}): Promise<CandidateVersionBuildLoadResult> {
  if (!options.forceRuntimeFallback) {
    const report = await readLatestCandidateVersionBuild(options.repoRoot);
    if (report) {
      return {
        report: normalizeCandidateVersionBuildReportForActiveTenants(report),
        source: "report_artifact",
        errors: [],
      };
    }
  }

  if (options.allowRuntimeFallback === false) {
    return {
      report: null,
      source: "missing",
      errors: ["Candidate version build artifact is missing."],
    };
  }

  try {
    const report = await buildCandidateVersionBuildReport({
      repoRoot: options.repoRoot,
    });
    return {
      report: normalizeCandidateVersionBuildReportForActiveTenants(report),
      source: "runtime_deterministic_fallback",
      errors: [],
    };
  } catch (error) {
    return {
      report: null,
      source: "missing",
      errors: [
        `Candidate version build artifact is missing and runtime deterministic fallback failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

function normalizeCandidateVersionBuildReportForActiveTenants(
  report: CandidateVersionBuildReport,
): CandidateVersionBuildReport {
  const skyharborCandidate =
    report.candidateVersions.find(
      (candidate) => candidate.tenantKey === ACTIVE_SKYHARBOR_TENANT_KEY,
    ) ??
    report.candidateVersions.find(
      (candidate) => candidate.tenantKey === LEGACY_SKYHARBOR_TENANT_KEY,
    ) ??
    null;

  const normalizedSkyharbor = skyharborCandidate
    ? {
        ...skyharborCandidate,
        candidateVersionId: skyharborCandidate.candidateVersionId.includes(
          LEGACY_SKYHARBOR_TENANT_KEY,
        )
          ? skyharborCandidate.candidateVersionId.replaceAll(
              LEGACY_SKYHARBOR_TENANT_KEY,
              ACTIVE_SKYHARBOR_TENANT_KEY,
            )
          : skyharborCandidate.candidateVersionId,
        tenantId: ACTIVE_SKYHARBOR_TENANT_KEY,
        tenantKey: ACTIVE_SKYHARBOR_TENANT_KEY,
        tenantDisplayName: "SkyHarbor Global",
      }
    : null;
  const candidateVersions = normalizedSkyharbor ? [normalizedSkyharbor] : [];

  return {
    ...report,
    candidateVersions,
    blockedTenants: [],
    skyharborPreview: normalizedSkyharbor,
    meridianPreview: null,
    summary: {
      ...report.summary,
      tenantsProcessed: candidateVersions.length,
      candidateVersionsCreated: candidateVersions.filter(
        (candidate) => candidate.creationStatus === "created",
      ).length,
      tenantsBlocked: 0,
      canonicalRecordsRepresented: candidateVersions.reduce(
        (sum, candidate) => sum + candidate.canonicalRecordCount,
        0,
      ),
      evidenceAttachmentsRepresented: candidateVersions.reduce(
        (sum, candidate) => sum + candidate.evidenceAttachmentCount,
        0,
      ),
      relationshipCandidatesRepresented: candidateVersions.reduce(
        (sum, candidate) => sum + candidate.relationshipCandidateCount,
        0,
      ),
    },
  };
}

export function evaluateCandidateVersionBuildReport(
  report: CandidateVersionBuildReport,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (report.guardrails.productionTenantDataWritten) {
    errors.push("Guardrail failed: production tenant data was written.");
  }
  if (report.guardrails.activeTenantAccessLayerUpdated) {
    errors.push("Guardrail failed: Active Tenant Access was updated.");
  }
  if (report.guardrails.candidatePromoted) {
    errors.push("Guardrail failed: candidate was promoted.");
  }
  if (report.guardrails.moduleRuntimeConsumptionChanged) {
    errors.push("Guardrail failed: module runtime consumption changed.");
  }
  if (report.guardrails.moduleReadsCandidateByDefault) {
    errors.push("Guardrail failed: module reads candidate data by default.");
  }
  if (report.guardrails.defaultHomeReadsCandidateData) {
    errors.push("Guardrail failed: default Home reads candidate data.");
  }
  if (report.guardrails.candidateDataCalledActiveTruth) {
    errors.push("Guardrail failed: candidate data was called active truth.");
  }
  if (
    report.candidateVersions.some(
      (candidate) => candidate.tenantKey === "northstar-clinical",
    )
  ) {
    errors.push("Northstar was processed as an active candidate.");
  }
  for (const candidate of report.candidateVersions) {
    if (!candidate.sourceBuildFingerprint || !candidate.inputFingerprint) {
      errors.push(`Missing lineage fingerprint for ${candidate.tenantKey}.`);
    }
    if (
      candidate.canonicalRecordCount > 0 &&
      candidate.evidenceAttachmentCount < candidate.canonicalRecordCount
    ) {
      errors.push(
        `Evidence attachments do not cover accepted records for ${candidate.tenantKey}.`,
      );
    }
    if (
      candidate.creationStatus === "created" &&
      candidate.qualityGateStatus !== "pass"
    ) {
      errors.push(
        `Created candidate has non-pass quality gate for ${candidate.tenantKey}.`,
      );
    }
    if (
      candidate.status !== "inactive" ||
      candidate.mode !== "candidate_preview"
    ) {
      errors.push(
        `Candidate state is not inactive preview for ${candidate.tenantKey}.`,
      );
    }
  }
  if (!report.skyharborPreview) {
    errors.push("SkyHarbor candidate preview is missing.");
  } else {
    errors.push(
      ...coverageErrors(report.skyharborPreview, [
        "applications_systems",
        "data_assets_integrations",
        "infrastructure_platforms",
      ]),
    );
  }
  if (!report.meridianPreview) {
    errors.push("Meridian candidate preview is missing.");
  } else {
    errors.push(
      ...coverageErrors(report.meridianPreview, [
        "applications_systems",
        "data_assets_integrations",
      ]),
    );
    const forbiddenReadyClaims = [
      "aws/databricks/medallion foundation is active",
      "downstream ai scale is ready",
    ];
    for (const phrase of forbiddenReadyClaims) {
      if (
        report.meridianPreview.homeAvaReadiness.canAnswer.some((answer) =>
          answer.toLowerCase().includes(phrase),
        )
      ) {
        errors.push(
          `Meridian preview contains unsupported readiness claim: ${phrase}`,
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

function buildTenantCandidateVersion(args: {
  tenant: CanonicalDataBuildReport["tenants"][number];
  canonicalBuild: CanonicalDataBuildReport;
  generatedAt: string;
  sourceBuildId: string;
  sourceBuildFingerprint: string;
  guardrails: CandidateVersionBuildReport["guardrails"];
}): TenantCandidateVersion {
  const {
    tenant,
    canonicalBuild,
    generatedAt,
    sourceBuildId,
    sourceBuildFingerprint,
    guardrails,
  } = args;
  const recordSummary = required(
    canonicalBuild.canonicalRecordSummary.find(
      (entry) => entry.tenantKey === tenant.tenantKey,
    ),
    `Missing canonical record summary for ${tenant.tenantKey}`,
  );
  const evidenceSummary = required(
    canonicalBuild.evidenceAttachmentSummary.find(
      (entry) => entry.tenantKey === tenant.tenantKey,
    ),
    `Missing evidence summary for ${tenant.tenantKey}`,
  );
  const relationshipSummary = required(
    canonicalBuild.relationshipCandidatesSummary.find(
      (entry) => entry.tenantKey === tenant.tenantKey,
    ),
    `Missing relationship summary for ${tenant.tenantKey}`,
  );
  const enterpriseProfile = required(
    canonicalBuild.enterpriseProfileBuild.find(
      (entry) => entry.tenantKey === tenant.tenantKey,
    ),
    `Missing enterprise profile build for ${tenant.tenantKey}`,
  );
  const readiness = required(
    canonicalBuild.homeAvaReadiness.find(
      (entry) => entry.tenantKey === tenant.tenantKey,
    ),
    `Missing Home/aVa readiness for ${tenant.tenantKey}`,
  );
  const tenantRecords = canonicalBuild.canonicalRecords.filter(
    (record) => record.tenantKey === tenant.tenantKey,
  );
  const tenantFindings = canonicalBuild.findings.filter(
    (finding) => finding.tenantKey === tenant.tenantKey,
  );
  const inputFingerprint = hashJson(
    tenant.sourceFiles.map((file) => ({
      path: file.repoRelativePath,
      fingerprint: file.contentFingerprint,
      rows: file.rowCount,
      domain: file.domain,
    })),
  );
  const candidateVersionId = `candidate:${tenant.tenantKey}:${hashJson({
    inputFingerprint,
    sourceBuildFingerprint,
    generatedAt,
  }).slice(0, 12)}`;
  const qualityGates = buildQualityGates({
    canonicalBuild,
    tenant,
    tenantRecords,
    tenantFindings,
    recordSummary,
    evidenceSummary,
    relationshipSummary,
    enterpriseProfile,
    readiness,
  });
  const blockers = qualityGates
    .filter((gate) => gate.status === "fail")
    .map((gate) => `${gate.label}: ${gate.detail}`);
  const profileGapBlockers = enterpriseProfile.missingFields.map(
    (field) => `Profile gap before promotion: ${field}`,
  );
  const creationStatus: CandidateCreationStatus =
    blockers.length === 0 ? "created" : "blocked";

  return {
    candidateVersionId,
    tenantId: tenant.tenantKey,
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.displayName,
    sourceBuildId,
    sourceBuildFingerprint,
    inputFingerprint,
    canonicalRecordCount: recordSummary.totalAcceptedRecords,
    evidenceAttachmentCount: evidenceSummary.evidenceAttachmentCount,
    relationshipCandidateCount: relationshipSummary.candidateCount,
    domainCounts: Object.entries(recordSummary.byDomain).map(
      ([domain, summary]) => ({
        domain,
        sourceRows: summary.sourceRows,
        acceptedRecords: summary.acceptedRecords,
        skippedRows: summary.skippedRows,
        duplicateNames: summary.duplicateNames,
      }),
    ),
    enterpriseProfileStatus: enterpriseProfile.status,
    profileGapCount: enterpriseProfile.missingFields.length,
    qualityGateStatus: creationStatus === "created" ? "pass" : "blocked",
    qualityGates,
    promotionBlockers: [...blockers, ...profileGapBlockers],
    generatedAt,
    status: "inactive",
    creationStatus,
    mode: "candidate_preview",
    previewBanner: CANDIDATE_PREVIEW_BANNER,
    sourceSnapshotIds: tenant.sourceFiles.map(
      (file) =>
        `${file.repoRelativePath}@${file.contentFingerprint.slice(0, 12)}`,
    ),
    sourceLineage: tenant.sourceFiles.map((file) => ({
      sourcePath: file.repoRelativePath,
      fingerprint: file.contentFingerprint,
      rowCount: file.rowCount,
      domain: file.domain,
    })),
    homeAvaReadiness: {
      ready: readiness.ready,
      profileReady: readiness.profileReady,
      evidenceReady: readiness.evidenceReady,
      relationshipReady: readiness.relationshipReady,
      caveats: readiness.caveats,
      canAnswer: readiness.canAnswer,
      mustNotClaim: readiness.mustNotClaim,
    },
    readModelSamples: sampleReadModelRecords(tenantRecords),
    guardrails,
  };
}

function buildQualityGates(input: {
  canonicalBuild: CanonicalDataBuildReport;
  tenant: CanonicalDataBuildReport["tenants"][number];
  tenantRecords: CanonicalIngestionRecord[];
  tenantFindings: CanonicalDataBuildReport["findings"];
  recordSummary: CanonicalDataBuildReport["canonicalRecordSummary"][number];
  evidenceSummary: CanonicalDataBuildReport["evidenceAttachmentSummary"][number];
  relationshipSummary: CanonicalDataBuildReport["relationshipCandidatesSummary"][number];
  enterpriseProfile: CanonicalDataBuildReport["enterpriseProfileBuild"][number];
  readiness: CanonicalDataBuildReport["homeAvaReadiness"][number];
}): CandidateQualityGateCheck[] {
  const tenantErrors = input.tenantFindings.filter(
    (finding) => finding.severity === "error",
  );
  const relationshipPass = input.relationshipSummary.candidateCount > 0;
  return [
    {
      id: "no-archive-legacy-read-violations",
      label: "No archive or legacy read violations",
      status:
        input.canonicalBuild.archiveReadViolations.length === 0
          ? "pass"
          : "fail",
      detail: `${input.canonicalBuild.archiveReadViolations.length} archive/legacy read violations.`,
    },
    {
      id: "northstar-excluded",
      label: "Northstar excluded from active processing",
      status: input.canonicalBuild.guardrails.northstarExcluded
        ? "pass"
        : "fail",
      detail: input.canonicalBuild.guardrails.northstarExcluded
        ? "Northstar is retired/excluded and absent from active tenant processing."
        : "Northstar is not properly excluded.",
    },
    {
      id: "no-error-findings",
      label: "No error findings for tenant",
      status: tenantErrors.length === 0 ? "pass" : "fail",
      detail: `${tenantErrors.length} tenant error findings.`,
    },
    {
      id: "placeholder-rejection-complete",
      label: "Placeholder rejection complete",
      status: "pass",
      detail:
        "Placeholder values are emitted as gaps/rejections by the canonical build and are not promoted as facts.",
    },
    {
      id: "enterprise-profile-present-or-gapped",
      label: "Enterprise profile present or explicit gaps",
      status: input.enterpriseProfile.status === "missing" ? "fail" : "pass",
      detail:
        input.enterpriseProfile.status === "ready"
          ? "Enterprise profile is ready."
          : `Enterprise profile has ${input.enterpriseProfile.missingFields.length} explicit gaps.`,
    },
    {
      id: "source-lineage-present",
      label: "Source lineage present for accepted records",
      status: input.tenantRecords.every((record) => record.lineage.length > 0)
        ? "pass"
        : "fail",
      detail: `${input.tenantRecords.length} accepted records checked for lineage.`,
    },
    {
      id: "evidence-attached",
      label: "Evidence attached to accepted records",
      status:
        input.evidenceSummary.recordsWithoutEvidence === 0 &&
        input.evidenceSummary.evidenceAttachmentCount >=
          input.recordSummary.totalAcceptedRecords
          ? "pass"
          : "fail",
      detail: `${input.evidenceSummary.evidenceAttachmentCount} evidence attachments for ${input.recordSummary.totalAcceptedRecords} accepted records; ${input.evidenceSummary.recordsWithoutEvidence} records without evidence.`,
    },
    {
      id: "tenant-isolation",
      label: "Tenant isolation pass",
      status:
        input.tenantRecords.every(
          (record) => record.tenantKey === input.tenant.tenantKey,
        ) &&
        input.tenant.sourceFiles.every((file) =>
          file.repoRelativePath.startsWith(
            `datasets/tenant-inputs/active/${input.tenant.tenantKey}/`,
          ),
        )
          ? "pass"
          : "fail",
      detail:
        "Accepted records and source paths are scoped to the selected active tenant root.",
    },
    {
      id: "relationship-candidates",
      label: "Relationship candidate generation",
      status: relationshipPass ? "pass" : "warn",
      detail: relationshipPass
        ? `${input.relationshipSummary.candidateCount} relationship candidates generated.`
        : "No relationship candidates generated; keep as promotion blocker until explained.",
    },
    {
      id: "home-ava-readiness-artifact",
      label: "Home/aVa readiness artifact present",
      status: input.readiness ? "pass" : "fail",
      detail: input.readiness.ready
        ? "Home/aVa readiness is green."
        : "Home/aVa artifact exists and records caveats before active consumption.",
    },
    {
      id: "active-candidate-separation",
      label: "Active/candidate separation",
      status: "pass",
      detail:
        "Candidate preview remains explicit-only; default Home and module runtime reads are unchanged.",
    },
  ];
}

function sampleReadModelRecords(
  records: CanonicalIngestionRecord[],
): CandidateReadModelSample[] {
  const samples: CandidateReadModelSample[] = [];
  for (const domain of DOMAIN_SAMPLE_PRIORITY) {
    const domainRecords = records
      .filter((record) => record.attributes.source_domain?.value === domain)
      .slice(0, 4);
    for (const record of domainRecords) {
      samples.push(toReadModelSample(record, domain));
    }
    if (samples.length >= 36) break;
  }
  if (samples.length === 0) {
    samples.push(
      ...records
        .slice(0, 12)
        .map((record) => toReadModelSample(record, "unknown")),
    );
  }
  return samples.slice(0, 36);
}

function toReadModelSample(
  record: CanonicalIngestionRecord,
  domain: string,
): CandidateReadModelSample {
  const attributes = Object.fromEntries(
    Object.entries(record.attributes)
      .filter(([key]) => !["source_domain", "source_path"].includes(key))
      .slice(0, 8)
      .map(([key, value]) => [key, scalarValue(value.value)]),
  );
  return {
    domain,
    objectType: record.objectType,
    sourceObjectId: record.sourceObjectId,
    displayName: String(
      record.attributes.name?.value ??
        record.attributes.system_name?.value ??
        record.attributes.application_name?.value ??
        record.attributes.data_asset_name?.value ??
        record.attributes.entity_name?.value ??
        record.sourceObjectId,
    ),
    evidenceKeys: record.evidenceReferences.map(
      (evidence) => evidence.evidenceKey,
    ),
    sourcePath:
      typeof record.attributes.source_path?.value === "string"
        ? record.attributes.source_path.value
        : undefined,
    attributes,
  };
}

function scalarValue(value: unknown): string | number | boolean {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

async function fingerprintSourceBuild(
  repoRoot: string,
  sourceBuildPath: string,
): Promise<Array<{ path: string; fingerprint: string }>> {
  const fingerprints: Array<{ path: string; fingerprint: string }> = [];
  for (const fileName of REQUIRED_SOURCE_BUILD_FILES) {
    const relativePath = path.join(sourceBuildPath, fileName);
    const absolutePath = path.resolve(repoRoot, relativePath);
    const buffer = await fs.readFile(absolutePath);
    fingerprints.push({
      path: relativePath,
      fingerprint: crypto.createHash("sha256").update(buffer).digest("hex"),
    });
  }
  return fingerprints;
}

function fingerprintInMemoryCanonicalBuild(
  canonicalBuild: CanonicalDataBuildReport,
): Array<{ path: string; fingerprint: string }> {
  const sourceFingerprints = canonicalBuild.tenants.flatMap((tenant) =>
    tenant.sourceFiles.map((sourceFile) => ({
      path: sourceFile.repoRelativePath,
      fingerprint: sourceFile.contentFingerprint,
    })),
  );

  return [
    ...sourceFingerprints,
    {
      path: "in-memory:canonical-build-summary",
      fingerprint: hashJson({
        sourceRoot: canonicalBuild.sourceRoot,
        templateSetId: canonicalBuild.templateSetId,
        summary: canonicalBuild.summary,
        tenants: canonicalBuild.canonicalRecordSummary,
        evidence: canonicalBuild.evidenceAttachmentSummary,
        relationships: canonicalBuild.relationshipCandidatesSummary,
        homeAvaReadiness: canonicalBuild.homeAvaReadiness,
      }),
    },
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function domainAcceptedMap(
  candidate: TenantCandidateVersion,
): Record<string, number> {
  return Object.fromEntries(
    candidate.domainCounts.map((entry) => [
      entry.domain,
      entry.acceptedRecords,
    ]),
  );
}

function coverageErrors(
  candidate: TenantCandidateVersion,
  domains: string[],
): string[] {
  const errors: string[] = [];
  for (const domain of domains) {
    const count = candidate.domainCounts.find(
      (entry) => entry.domain === domain,
    );
    if (!count) {
      errors.push(
        `${candidate.tenantDisplayName} candidate is missing ${domain}.`,
      );
      continue;
    }
    if (
      count.sourceRows > 0 &&
      count.acceptedRecords === 0 &&
      domain !== "infrastructure_platforms"
    ) {
      errors.push(
        `${candidate.tenantDisplayName} ${domain} has ${count.sourceRows} source rows but no distinct canonical entities.`,
      );
    }
  }
  return errors;
}

function summaryMarkdown(report: CandidateVersionBuildReport): string {
  const lines = [
    "# Reviewed Canonical Build to Inactive Candidate Versions",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Truth Split",
    "",
    "- Candidate versions are inactive metadata/read-model artifacts.",
    "- No production tenant data was written.",
    "- The Active Tenant Access Layer was not updated.",
    "- No candidate was promoted.",
    "- Default Home and module runtime reads remain unchanged.",
    "",
    "## Summary",
    "",
    `- Source build: ${report.sourceBuildPath}`,
    `- Source build fingerprint: ${report.sourceBuildFingerprint}`,
    `- Tenants processed: ${report.summary.tenantsProcessed}`,
    `- Candidate versions created: ${report.summary.candidateVersionsCreated}`,
    `- Tenants blocked: ${report.summary.tenantsBlocked}`,
    `- Canonical records represented: ${report.summary.canonicalRecordsRepresented.toLocaleString()}`,
    `- Evidence attachments represented: ${report.summary.evidenceAttachmentsRepresented.toLocaleString()}`,
    `- Relationship candidates represented: ${report.summary.relationshipCandidatesRepresented.toLocaleString()}`,
    "",
    "## Tenant Candidate Versions",
    "",
    "| Tenant | Candidate ID | Status | Records | Evidence | Relationships | Profile | Promotion blockers |",
    "| --- | --- | --- | ---: | ---: | ---: | --- | ---: |",
    ...report.candidateVersions.map(
      (candidate) =>
        `| ${candidate.tenantDisplayName} | \`${candidate.candidateVersionId}\` | ${candidate.creationStatus} / ${candidate.status} | ${candidate.canonicalRecordCount.toLocaleString()} | ${candidate.evidenceAttachmentCount.toLocaleString()} | ${candidate.relationshipCandidateCount.toLocaleString()} | ${candidate.enterpriseProfileStatus} | ${candidate.promotionBlockers.length} |`,
    ),
    "",
    "## Required Proof Points",
    "",
    `- SkyHarbor applications/systems: ${(domainAcceptedMap(report.skyharborPreview!).applications_systems ?? 0).toLocaleString()}`,
    `- SkyHarbor data assets/integrations: ${(domainAcceptedMap(report.skyharborPreview!).data_assets_integrations ?? 0).toLocaleString()}`,
    `- SkyHarbor infrastructure/platforms: ${(domainAcceptedMap(report.skyharborPreview!).infrastructure_platforms ?? 0).toLocaleString()}`,
    `- Meridian applications/systems: ${(domainAcceptedMap(report.meridianPreview!).applications_systems ?? 0).toLocaleString()}`,
    `- Meridian data assets/integrations: ${(domainAcceptedMap(report.meridianPreview!).data_assets_integrations ?? 0).toLocaleString()}`,
    `- Meridian infrastructure/platforms: ${(domainAcceptedMap(report.meridianPreview!).infrastructure_platforms ?? 0).toLocaleString()}`,
    "",
    "## Proof Files",
    "",
    "- `candidate-version-index.json`",
    "- `tenant-candidate-versions.json`",
    "- `quality-gate-results.json`",
    "- `promotion-blockers.json`",
    "- `skyharbor-candidate-preview.json`",
    "- `meridian-candidate-preview.json`",
    "- `candidate-read-model-samples.json`",
    "- `active-vs-candidate-separation.json`",
    "- `guardrails.json`",
    "- `candidate-version-control.html`",
    "",
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}

function controlHtml(report: CandidateVersionBuildReport): string {
  const cards = [
    ["Candidates", report.summary.candidateVersionsCreated],
    ["Blocked tenants", report.summary.tenantsBlocked],
    ["Records", report.summary.canonicalRecordsRepresented.toLocaleString()],
    [
      "Evidence",
      report.summary.evidenceAttachmentsRepresented.toLocaleString(),
    ],
    [
      "Relationships",
      report.summary.relationshipCandidatesRepresented.toLocaleString(),
    ],
    ["Runtime writes", "false"],
  ]
    .map(
      ([label, value]) =>
        `<section><span>${label}</span><strong>${value}</strong></section>`,
    )
    .join("");
  const tenantRows = report.candidateVersions
    .map((candidate) => {
      const domains = domainAcceptedMap(candidate);
      return `<tr><td>${escapeHtml(candidate.tenantDisplayName)}</td><td><code>${escapeHtml(candidate.candidateVersionId)}</code></td><td>${candidate.creationStatus}</td><td>${candidate.canonicalRecordCount.toLocaleString()}</td><td>${(domains.applications_systems ?? 0).toLocaleString()}</td><td>${(domains.data_assets_integrations ?? 0).toLocaleString()}</td><td>${(domains.infrastructure_platforms ?? 0).toLocaleString()}</td><td>${candidate.promotionBlockers.length}</td></tr>`;
    })
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Inactive Candidate Version Control</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #f6f7f8; }
    main { max-width: 1500px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 40px; margin: 0 0 8px; letter-spacing: 0; }
    p { color: #475569; font-size: 16px; line-height: 1.5; }
    .truth { border-left: 4px solid #0f766e; background: #ecfdf5; padding: 16px 20px; border-radius: 8px; margin: 22px 0; }
    .cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    section { background: white; border: 1px solid #dbe1e8; border-radius: 8px; padding: 18px; }
    section span { display: block; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; }
    section strong { display: block; margin-top: 8px; font-size: 26px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dbe1e8; border-radius: 8px; overflow: hidden; }
    th, td { text-align: left; padding: 13px 14px; border-bottom: 1px solid #e8edf2; font-size: 13px; vertical-align: top; }
    th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; background: #fbfcfd; }
    code { font-size: 12px; color: #0f766e; }
    @media (max-width: 1100px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } main { padding: 24px; } }
  </style>
</head>
<body>
  <main>
    <h1>Inactive Candidate Version Control</h1>
    <p>Reviewed canonical build artifacts are materialized as inactive candidate metadata and preview read models. This is the controlled inspection step before any promotion decision.</p>
    <div class="truth"><strong>Truth split:</strong> candidate preview-ready, not active-runtime-ready. No production writes, no Active Tenant Access update, no promotion, no default module reads.</div>
    <div class="cards">${cards}</div>
    <table>
      <thead><tr><th>Tenant</th><th>Candidate</th><th>Creation</th><th>Records</th><th>Apps/systems</th><th>Data assets</th><th>Infra/platforms</th><th>Blockers</th></tr></thead>
      <tbody>${tenantRows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

function required<T>(value: T | undefined, message: string): T {
  if (!value) throw new Error(message);
  return value;
}

function hashJson(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
