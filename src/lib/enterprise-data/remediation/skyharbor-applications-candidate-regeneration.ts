import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import type { CanonicalIngestionRecord } from "../contracts/canonical-ingestion";
import type { TenantPacketFile } from "../contracts/tenant-packet";
import { CsvSourceAdapter, parseCsv } from "../source-adapters/csv-source-adapter";

type SourceRole = "selected_authoritative" | "supporting" | "excluded";
type SourceLocationType = "repo_dataset_path" | "repo_supporting_evidence_path";
type RelationshipType =
  | "business_function_to_system"
  | "system_to_platform"
  | "system_to_owner"
  | "system_to_vendor"
  | "system_to_source_evidence";

export interface SkyHarborSourceSelection {
  sourceId: string;
  label: string;
  path: string;
  locationType: SourceLocationType;
  role: SourceRole;
  rowCount: number;
  observedFieldCount: number;
  contentFingerprint: string;
  selectionReason: string;
  qualityCaveats: string[];
  provenance: string;
}

export interface SkyHarborApplicationCandidateRecord {
  tenantKey: "skyharbor-air";
  candidateObjectKey: string;
  systemId: string;
  systemName: string;
  businessFunction: string;
  owner: string;
  platformTechnology: string;
  vendorProduct: string;
  lifecycleStatus: string;
  criticality: string;
  evidenceKey: string;
  sourceFile: string;
  sourceRowNumber: number;
  validationStatus: "accepted" | "warning";
  confidence: number;
  qualityCaveats: string[];
}

export interface SkyHarborRelationshipCandidate {
  relationshipId: string;
  relationshipType: RelationshipType;
  fromType: string;
  fromKey: string;
  toType: string;
  toKey: string;
  evidenceKey: string;
  confidence: number;
}

export interface SkyHarborQuarantineItem {
  sourceRowNumber: number;
  sourceObjectId: string;
  reason: string;
  sourceFile: string;
}

export interface SkyHarborSourceConflict {
  conflictType: string;
  sourceObjectId: string;
  selectedValue: string;
  comparedValue: string;
  comparedSource: string;
  action: "reported_not_merged";
}

export interface SkyHarborApplicationsRegenerationResult {
  generatedAt: string;
  tenantKey: "skyharbor-air";
  tenantDisplayName: "SkyHarbor Air";
  dryRunOnly: true;
  productionTenantDataWritten: false;
  candidatePromoted: false;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  activeHomeContextChanged: false;
  realizedValueClaimed: false;
  selectedSource: SkyHarborSourceSelection;
  sourceSelection: SkyHarborSourceSelection[];
  manifestUpdate: {
    tenantKey: "skyharbor-air";
    sourceDomain: "applications_systems";
    sourceFilePath: string;
    templateType: string;
    schemaContract: string;
    adapterMapping: string;
    requiredFields: string[];
    optionalFields: string[];
    evidenceBindingRule: string;
    qualityCaveats: string[];
    promotionBlockersIfIncomplete: string[];
  };
  adapterMapping: {
    adapterKey: "csv";
    adapterVersion: string;
    mappingProfile: "applications-systems-estate/v1";
    sourceFieldCount: number;
    mappedFieldCount: number;
    unmappedFields: string[];
    mappingCoveragePercent: number;
    requiredFieldCount: number;
    missingRequiredFieldCount: number;
  };
  counts: {
    authoritativeSourceRows: number;
    acceptedCandidateRecords: number;
    warningCandidateRecords: number;
    quarantinedRows: number;
    skippedRows: number;
    canonicalIngestionRecords: number;
    evidenceReferencesAttached: number;
    relationshipCandidatesPlanned: number;
    sourceConflictsReported: number;
  };
  canonicalRecords: SkyHarborApplicationCandidateRecord[];
  canonicalRecordSamples: SkyHarborApplicationCandidateRecord[];
  relationshipCandidates: SkyHarborRelationshipCandidate[];
  relationshipSummary: Record<RelationshipType, number>;
  quarantineReport: SkyHarborQuarantineItem[];
  sourceConflicts: SkyHarborSourceConflict[];
  qualityChecks: {
    duplicateApplicationSystemDetection: string;
    conflictingAppSystemIdentitiesAcrossSources: string;
    missingOwner: number;
    missingBusinessDomain: number;
    missingEvidence: number;
    invalidTenantKey: number;
    generatedInconsistentRowRisk: number;
    missingRequiredFields: number;
    sourcePrecedenceConflicts: number;
    orphanRelationshipCandidates: number;
  };
  candidatePreviewSummary: {
    currentThinCandidateRows: number;
    currentCandidateBaselineRecords: number;
    regeneratedApplicationSystemRecords: number;
    materialExpansionAchieved: boolean;
    candidatePreviewOnly: true;
    runtimeReady: false;
  };
  homeAdminPreviewImpact: {
    adminDataLayerExplorerShowsRemediation: true;
    defaultHomeActiveContextChanged: false;
    candidatePreviewExplicitOnly: true;
    candidateDataLeaksIntoDefaultHome: false;
    homeCandidatePreviewWiredInThisPr: false;
    avaReadsCandidateByDefault: false;
  };
  promotionBlockers: string[];
  uploadPathAlignment: {
    selectedSourcePathMode: "repo_dataset_path";
    canonicalLandingPath: string;
    currentLoaderScanPath: string;
    selectedSourceUsesCanonicalLanding: false;
    blocksThisDryRun: false;
    followUp: "DATA-PR33 - Upload Landing Path and Loader Scan Alignment";
  };
  proofOutputDir: string;
}

type SkyHarborApplicationsRegenerationReport = Omit<
  SkyHarborApplicationsRegenerationResult,
  "canonicalRecords" | "relationshipCandidates" | "sourceConflicts"
> & {
  canonicalRecords: {
    count: number;
    samples: SkyHarborApplicationCandidateRecord[];
  };
  relationshipCandidates: {
    count: number;
    summary: Record<RelationshipType, number>;
    samples: SkyHarborRelationshipCandidate[];
  };
  sourceConflicts: {
    count: number;
    samples: SkyHarborSourceConflict[];
  };
};

interface BuildOptions {
  repoRoot?: string;
  generatedAt?: string;
  outputDir?: string;
  writeReports?: boolean;
}

const TENANT_KEY = "skyharbor-air" as const;
const TENANT_DISPLAY_NAME = "SkyHarbor Air" as const;
const SELECTED_SOURCE_PATH =
  "datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv";
const SUPPORTING_412_SOURCE_PATH =
  "datasets/skyharbor-air-supporting-evidence/applications-systems/01_Application_Portfolio_InScope_412Apps.csv";
const TRANSFORMED_956_SOURCE_PATH =
  "datasets/skyharbor-air-synthetic-v6/templates/V6_05_applications_systems.csv";
const THIN_13_SOURCE_PATH =
  "datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_05_applications_systems.csv";
const OUTPUT_DIR = "reports/data-remediation/skyharbor-applications/latest";

const REQUIRED_FIELDS = ["app_id", "name"];
const OPTIONAL_FIELDS = [
  "vendor",
  "category",
  "it_owner_team",
  "business_function",
  "deployment",
  "lifecycle_stage",
  "criticality",
  "run_cost_fy26_usd",
  "primary_dataclass",
  "integration_count",
];

export async function buildSkyHarborApplicationsCandidateRegeneration(
  options: BuildOptions = {},
): Promise<SkyHarborApplicationsRegenerationResult> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const generatedAt = options.generatedAt ?? "2026-07-13T00:00:00.000Z";
  const proofOutputDir = options.outputDir ?? OUTPUT_DIR;
  const sourceSelection = buildSourceSelection(repoRoot);
  const selectedSource = sourceSelection.find(
    (source) => source.role === "selected_authoritative",
  );
  if (!selectedSource) {
    throw new Error("SkyHarbor applications remediation has no selected source.");
  }

  const adapter = new CsvSourceAdapter();
  const packetFile = buildPacketFile(selectedSource.path);
  const adapterResult = await adapter.parse({
    tenantKey: TENANT_KEY,
    packetId: "skyharbor-air-data-pr32-applications-candidate",
    packetVersion: "data-pr32-applications-systems-candidate/v1",
    sourcePath: resolveSourcePath(repoRoot, selectedSource.path),
    packetFile,
    sourceProfile: "skyharbor-applications-systems-remediation",
    parserVersion: "csv-adapter/v1",
    mappingProfile: "applications-systems-estate/v1",
    observedAt: generatedAt,
  });

  const selectedRows = readRows(repoRoot, selectedSource.path);
  const comparedRows = sourceSelection
    .filter((source) => source.role !== "selected_authoritative")
    .flatMap((source) =>
      readRows(repoRoot, source.path).map((row) => ({ source, row })),
    );
  const quarantineReport = buildQuarantineReport(selectedRows, selectedSource.path);
  const canonicalRecords = buildCandidateRecords(selectedRows, adapterResult.records);
  const sourceConflicts = buildSourceConflicts(canonicalRecords, comparedRows);
  const relationshipCandidates = buildRelationshipCandidates(canonicalRecords);
  const relationshipSummary = summarizeRelationships(relationshipCandidates);
  const qualityChecks = buildQualityChecks(
    selectedRows,
    canonicalRecords,
    quarantineReport,
    sourceConflicts,
    relationshipCandidates,
  );
  const promotionBlockers = buildPromotionBlockers(
    quarantineReport,
    sourceConflicts,
    qualityChecks,
  );

  const result: SkyHarborApplicationsRegenerationResult = {
    generatedAt,
    tenantKey: TENANT_KEY,
    tenantDisplayName: TENANT_DISPLAY_NAME,
    dryRunOnly: true,
    productionTenantDataWritten: false,
    candidatePromoted: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    activeHomeContextChanged: false,
    realizedValueClaimed: false,
    selectedSource,
    sourceSelection,
    manifestUpdate: {
      tenantKey: TENANT_KEY,
      sourceDomain: "applications_systems",
      sourceFilePath: selectedSource.path,
      templateType: "applications_systems_estate_csv",
      schemaContract: "applications-systems-estate/v1",
      adapterMapping: "applications-systems-estate/v1",
      requiredFields: REQUIRED_FIELDS,
      optionalFields: OPTIONAL_FIELDS,
      evidenceBindingRule:
        "Each accepted record binds to the selected source file plus row number; rows without source path and row provenance are quarantined.",
      qualityCaveats: [
        "Synthetic demo-safe data, not real SkyHarbor production data.",
        "Selected 900-row estate is richer than the 13-row current candidate and avoids the transformed template placeholder-name defect.",
        "Financial/run-cost fields remain planning-grade and must not be used as realized value.",
      ],
      promotionBlockersIfIncomplete: promotionBlockers,
    },
    adapterMapping: {
      adapterKey: "csv",
      adapterVersion: adapter.adapterVersion,
      mappingProfile: "applications-systems-estate/v1",
      sourceFieldCount: adapterResult.sourceFieldCount,
      mappedFieldCount: adapterResult.mappedFieldCount,
      unmappedFields: adapterResult.unmappedFields,
      mappingCoveragePercent: adapterResult.mappingCoveragePercent,
      requiredFieldCount: adapterResult.requiredFieldCount,
      missingRequiredFieldCount: adapterResult.missingRequiredFieldCount,
    },
    counts: {
      authoritativeSourceRows: selectedRows.length,
      acceptedCandidateRecords: canonicalRecords.filter(
        (record) => record.validationStatus === "accepted",
      ).length,
      warningCandidateRecords: canonicalRecords.filter(
        (record) => record.validationStatus === "warning",
      ).length,
      quarantinedRows: quarantineReport.length,
      skippedRows: selectedRows.length - canonicalRecords.length - quarantineReport.length,
      canonicalIngestionRecords: adapterResult.records.length,
      evidenceReferencesAttached: canonicalRecords.filter((record) => record.evidenceKey).length,
      relationshipCandidatesPlanned: relationshipCandidates.length,
      sourceConflictsReported: sourceConflicts.length,
    },
    canonicalRecords,
    canonicalRecordSamples: canonicalRecords.slice(0, 25),
    relationshipCandidates,
    relationshipSummary,
    quarantineReport,
    sourceConflicts,
    qualityChecks,
    candidatePreviewSummary: {
      currentThinCandidateRows: 13,
      currentCandidateBaselineRecords: 53,
      regeneratedApplicationSystemRecords: canonicalRecords.length,
      materialExpansionAchieved: canonicalRecords.length > 53,
      candidatePreviewOnly: true,
      runtimeReady: false,
    },
    homeAdminPreviewImpact: {
      adminDataLayerExplorerShowsRemediation: true,
      defaultHomeActiveContextChanged: false,
      candidatePreviewExplicitOnly: true,
      candidateDataLeaksIntoDefaultHome: false,
      homeCandidatePreviewWiredInThisPr: false,
      avaReadsCandidateByDefault: false,
    },
    promotionBlockers,
    uploadPathAlignment: {
      selectedSourcePathMode: "repo_dataset_path",
      canonicalLandingPath:
        "context-landing/landing/<uploadSessionId>/<segmentKey>/<fileName>",
      currentLoaderScanPath:
        "context-landing/landing/<tenantKey>/inbox/<uuid>-<fileName>",
      selectedSourceUsesCanonicalLanding: false,
      blocksThisDryRun: false,
      followUp: "DATA-PR33 - Upload Landing Path and Loader Scan Alignment",
    },
    proofOutputDir,
  };

  if (options.writeReports !== false) {
    await writeReports(repoRoot, result);
  }

  assertGuardrails(result);
  return result;
}

export function readLatestSkyHarborApplicationsRegeneration(
  repoRoot = process.cwd(),
): SkyHarborApplicationsRegenerationResult {
  const reportPath = path.join(repoRoot, OUTPUT_DIR, "candidate-preview-summary.json");
  if (fs.existsSync(reportPath)) {
    const parsed = JSON.parse(fs.readFileSync(reportPath, "utf8")) as
      | SkyHarborApplicationsRegenerationResult
      | SkyHarborApplicationsRegenerationReport;
    if (Array.isArray(parsed.canonicalRecords)) {
      return parsed as SkyHarborApplicationsRegenerationResult;
    }

    const fallback = buildSynchronousResult(repoRoot);
    return {
      ...fallback,
      ...parsed,
      canonicalRecords: fallback.canonicalRecords,
      relationshipCandidates: fallback.relationshipCandidates,
      sourceConflicts: fallback.sourceConflicts,
    };
  }

  return buildSynchronousResult(repoRoot);
}

function buildSynchronousResult(repoRoot: string): SkyHarborApplicationsRegenerationResult {
  const sourceSelection = buildSourceSelection(repoRoot);
  const selectedSource = sourceSelection.find(
    (source) => source.role === "selected_authoritative",
  );
  if (!selectedSource) {
    throw new Error("SkyHarbor applications remediation has no selected source.");
  }
  const rows = readRows(repoRoot, selectedSource.path);
  const canonicalRecords = buildCandidateRecords(rows, []);
  const sourceConflicts = buildSourceConflicts(
    canonicalRecords,
    sourceSelection
      .filter((source) => source.role !== "selected_authoritative")
      .flatMap((source) =>
        readRows(repoRoot, source.path).map((row) => ({ source, row })),
      ),
  );
  const quarantineReport = buildQuarantineReport(rows, selectedSource.path);
  const relationshipCandidates = buildRelationshipCandidates(canonicalRecords);
  const qualityChecks = buildQualityChecks(
    rows,
    canonicalRecords,
    quarantineReport,
    sourceConflicts,
    relationshipCandidates,
  );
  const promotionBlockers = buildPromotionBlockers(
    quarantineReport,
    sourceConflicts,
    qualityChecks,
  );

  return {
    generatedAt: "2026-07-13T00:00:00.000Z",
    tenantKey: TENANT_KEY,
    tenantDisplayName: TENANT_DISPLAY_NAME,
    dryRunOnly: true,
    productionTenantDataWritten: false,
    candidatePromoted: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    activeHomeContextChanged: false,
    realizedValueClaimed: false,
    selectedSource,
    sourceSelection,
    manifestUpdate: {
      tenantKey: TENANT_KEY,
      sourceDomain: "applications_systems",
      sourceFilePath: selectedSource.path,
      templateType: "applications_systems_estate_csv",
      schemaContract: "applications-systems-estate/v1",
      adapterMapping: "applications-systems-estate/v1",
      requiredFields: REQUIRED_FIELDS,
      optionalFields: OPTIONAL_FIELDS,
      evidenceBindingRule:
        "Each accepted record binds to the selected source file plus row number; rows without source path and row provenance are quarantined.",
      qualityCaveats: selectedSource.qualityCaveats,
      promotionBlockersIfIncomplete: promotionBlockers,
    },
    adapterMapping: {
      adapterKey: "csv",
      adapterVersion: "csv-adapter/v1",
      mappingProfile: "applications-systems-estate/v1",
      sourceFieldCount: REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length,
      mappedFieldCount: REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length,
      unmappedFields: [],
      mappingCoveragePercent: 100,
      requiredFieldCount: REQUIRED_FIELDS.length,
      missingRequiredFieldCount: quarantineReport.length,
    },
    counts: {
      authoritativeSourceRows: rows.length,
      acceptedCandidateRecords: canonicalRecords.filter(
        (record) => record.validationStatus === "accepted",
      ).length,
      warningCandidateRecords: canonicalRecords.filter(
        (record) => record.validationStatus === "warning",
      ).length,
      quarantinedRows: quarantineReport.length,
      skippedRows: rows.length - canonicalRecords.length - quarantineReport.length,
      canonicalIngestionRecords: canonicalRecords.length,
      evidenceReferencesAttached: canonicalRecords.filter((record) => record.evidenceKey).length,
      relationshipCandidatesPlanned: relationshipCandidates.length,
      sourceConflictsReported: sourceConflicts.length,
    },
    canonicalRecords,
    canonicalRecordSamples: canonicalRecords.slice(0, 25),
    relationshipCandidates,
    relationshipSummary: summarizeRelationships(relationshipCandidates),
    quarantineReport,
    sourceConflicts,
    qualityChecks,
    candidatePreviewSummary: {
      currentThinCandidateRows: 13,
      currentCandidateBaselineRecords: 53,
      regeneratedApplicationSystemRecords: canonicalRecords.length,
      materialExpansionAchieved: canonicalRecords.length > 53,
      candidatePreviewOnly: true,
      runtimeReady: false,
    },
    homeAdminPreviewImpact: {
      adminDataLayerExplorerShowsRemediation: true,
      defaultHomeActiveContextChanged: false,
      candidatePreviewExplicitOnly: true,
      candidateDataLeaksIntoDefaultHome: false,
      homeCandidatePreviewWiredInThisPr: false,
      avaReadsCandidateByDefault: false,
    },
    promotionBlockers,
    uploadPathAlignment: {
      selectedSourcePathMode: "repo_dataset_path",
      canonicalLandingPath:
        "context-landing/landing/<uploadSessionId>/<segmentKey>/<fileName>",
      currentLoaderScanPath:
        "context-landing/landing/<tenantKey>/inbox/<uuid>-<fileName>",
      selectedSourceUsesCanonicalLanding: false,
      blocksThisDryRun: false,
      followUp: "DATA-PR33 - Upload Landing Path and Loader Scan Alignment",
    },
    proofOutputDir: OUTPUT_DIR,
  };
}

function buildPacketFile(sourcePath: string): TenantPacketFile {
  return {
    path: sourcePath,
    sourceClass: "applications_systems",
    sourceProfile: "skyharbor-applications-systems-remediation",
    mappingProfile: "applications-systems-estate/v1",
    adapterKey: "csv",
    dataStatus: "synthetic",
    sensitivity: "internal",
    evidenceBasis: "source_file",
    required: true,
    expectedDomains: ["technology_estate"],
  };
}

function buildSourceSelection(repoRoot: string): SkyHarborSourceSelection[] {
  return [
    sourceSelectionRow({
      repoRoot,
      sourceId: "skyharbor-applications-900-estate",
      label: "900-row older app/system estate",
      sourcePath: SELECTED_SOURCE_PATH,
      locationType: "repo_dataset_path",
      role: "selected_authoritative",
      selectionReason:
        "Selected because it has unique application/system names, IDs, owners, business functions, deployment, lifecycle, criticality, run cost, data class, and integration counts. It is the cleanest application/system inventory for this one-domain remediation.",
      qualityCaveats: [
        "Synthetic demo-safe source; not real airline production data.",
        "Older source lineage, so promotion remains blocked until client/source-owner review.",
      ],
      provenance:
        "Repo dataset source estate; used as authoritative for the inactive DATA-PR32 applications/systems candidate only.",
    }),
    sourceSelectionRow({
      repoRoot,
      sourceId: "skyharbor-applications-412-supporting",
      label: "412-app portfolio CSV supporting source",
      sourcePath: SUPPORTING_412_SOURCE_PATH,
      locationType: "repo_supporting_evidence_path",
      role: "supporting",
      selectionReason:
        "Supporting source only. It is a useful in-scope application subset, but it has fewer rows than the selected estate and is packaged so deployed proof can evaluate it without a local Downloads dependency.",
      qualityCaveats: [
        "Supporting source is packaged for proof parity; upload landing alignment still remains a separate production data-build follow-up.",
      ],
      provenance:
        "Operator-provided evidence upload pack copied into repo-backed supporting evidence for DATA-PR32 runtime parity.",
    }),
    sourceSelectionRow({
      repoRoot,
      sourceId: "skyharbor-applications-956-transformed-template",
      label: "956-row transformed app/system template",
      sourcePath: TRANSFORMED_956_SOURCE_PATH,
      locationType: "repo_dataset_path",
      role: "excluded",
      selectionReason:
        "Excluded as authoritative because 900 rows carry placeholder system_name values. It remains evidence of a transformation defect and is reported as a conflict, not silently merged.",
      qualityCaveats: [
        "Placeholder identity defect: many rows are named 'application_system record'.",
        "Useful for source lineage, not for authoritative candidate naming in this PR.",
      ],
      provenance:
        "Transformed template generated from source estate; rejected as authoritative for this remediation due to identity quality risk.",
    }),
    sourceSelectionRow({
      repoRoot,
      sourceId: "skyharbor-applications-13-current-candidate",
      label: "13-row current upgrade candidate app/system file",
      sourcePath: THIN_13_SOURCE_PATH,
      locationType: "repo_dataset_path",
      role: "excluded",
      selectionReason:
        "Excluded because it is the thin candidate path DATA-PR31 found to be incomplete for applications/systems coverage.",
      qualityCaveats: [
        "Good for current-candidate comparison only; not enough coverage for a rich enterprise estate.",
      ],
      provenance:
        "Existing inactive upgrade candidate applications/system slice.",
    }),
  ];
}

function sourceSelectionRow(input: {
  repoRoot: string;
  sourceId: string;
  label: string;
  sourcePath: string;
  locationType: SourceLocationType;
  role: SourceRole;
  selectionReason: string;
  qualityCaveats: string[];
  provenance: string;
}): SkyHarborSourceSelection {
  const absolutePath = resolveSourcePath(input.repoRoot, input.sourcePath);
  const content = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
  const parsed = content ? parseCsv(content) : { headers: [], rows: [] };
  return {
    sourceId: input.sourceId,
    label: input.label,
    path: input.sourcePath,
    locationType: input.locationType,
    role: input.role,
    rowCount: parsed.rows.length,
    observedFieldCount: parsed.headers.length,
    contentFingerprint: fingerprint(content),
    selectionReason: input.selectionReason,
    qualityCaveats: input.qualityCaveats,
    provenance: input.provenance,
  };
}

function readRows(repoRoot: string, sourcePath: string): Record<string, string>[] {
  const absolutePath = resolveSourcePath(repoRoot, sourcePath);
  if (!fs.existsSync(absolutePath)) return [];
  return parseCsv(fs.readFileSync(absolutePath, "utf8")).rows;
}

function buildCandidateRecords(
  rows: Record<string, string>[],
  adapterRecords: CanonicalIngestionRecord[],
): SkyHarborApplicationCandidateRecord[] {
  const adapterById = new Map(adapterRecords.map((record) => [record.sourceObjectId, record]));
  return rows
    .map((row, index) => {
      const systemId = row.app_id?.trim();
      const systemName = row.name?.trim();
      if (!systemId || !systemName) return null;
      const sourceRowNumber = index + 2;
      const evidenceKey = `skyharbor-air:data-pr32:${path.basename(SELECTED_SOURCE_PATH)}:${systemId}:row-${sourceRowNumber}`;
      const caveats = qualityCaveatsForRow(row);
      const adapterRecord = adapterById.get(systemId);
      return {
        tenantKey: TENANT_KEY,
        candidateObjectKey: `${TENANT_KEY}:application_system:${systemId}`,
        systemId,
        systemName,
        businessFunction: row.business_function || "needs_source_owner_validation",
        owner: row.it_owner_team || "needs_source_owner_validation",
        platformTechnology: row.deployment || "needs_platform_validation",
        vendorProduct: row.vendor || "needs_vendor_validation",
        lifecycleStatus: row.lifecycle_stage || "needs_lifecycle_validation",
        criticality: row.criticality || "needs_criticality_validation",
        evidenceKey,
        sourceFile: SELECTED_SOURCE_PATH,
        sourceRowNumber,
        validationStatus:
          caveats.length > 0 || adapterRecord?.qualityStatus === "warning"
            ? "warning"
            : "accepted",
        confidence: caveats.length > 0 ? 0.78 : 0.86,
        qualityCaveats: caveats,
      } satisfies SkyHarborApplicationCandidateRecord;
    })
    .filter((record): record is SkyHarborApplicationCandidateRecord => record !== null);
}

function buildQuarantineReport(
  rows: Record<string, string>[],
  sourceFile: string,
): SkyHarborQuarantineItem[] {
  const items: SkyHarborQuarantineItem[] = [];
  rows.forEach((row, index) => {
    const sourceRowNumber = index + 2;
    if (!row.app_id?.trim()) {
      items.push({
        sourceRowNumber,
        sourceObjectId: row.app_id || `row-${sourceRowNumber}`,
        reason: "missing_required_app_id",
        sourceFile,
      });
    }
    if (!row.name?.trim()) {
      items.push({
        sourceRowNumber,
        sourceObjectId: row.app_id || `row-${sourceRowNumber}`,
        reason: "missing_required_name",
        sourceFile,
      });
    }
  });
  return items;
}

function buildSourceConflicts(
  selectedRecords: SkyHarborApplicationCandidateRecord[],
  comparedRows: Array<{ source: SkyHarborSourceSelection; row: Record<string, string> }>,
): SkyHarborSourceConflict[] {
  const selectedByNormalizedId = new Map(
    selectedRecords.map((record) => [normalizeId(record.systemId), record]),
  );
  const conflicts: SkyHarborSourceConflict[] = [];

  for (const { source, row } of comparedRows) {
    const comparedId = row.app_id || row.system_id || row.record_id;
    const comparedName = row.app_name || row.name || row.system_name || row.record_name;
    if (!comparedId || !comparedName) continue;

    const selected = selectedByNormalizedId.get(normalizeId(comparedId));
    if (selected && selected.systemName !== comparedName) {
      conflicts.push({
        conflictType: "same_id_different_name",
        sourceObjectId: selected.systemId,
        selectedValue: selected.systemName,
        comparedValue: comparedName,
        comparedSource: source.label,
        action: "reported_not_merged",
      });
      continue;
    }

    if (source.sourceId === "skyharbor-applications-956-transformed-template") {
      const systemName = row.system_name || "";
      if (systemName === "application_system record") {
        conflicts.push({
          conflictType: "placeholder_identity_in_transformed_template",
          sourceObjectId: comparedId,
          selectedValue: "authoritative 900-row estate retains named application identity",
          comparedValue: systemName,
          comparedSource: source.label,
          action: "reported_not_merged",
        });
      }
    }
  }

  return conflicts;
}

function buildRelationshipCandidates(
  records: SkyHarborApplicationCandidateRecord[],
): SkyHarborRelationshipCandidate[] {
  const relationships: SkyHarborRelationshipCandidate[] = [];

  for (const record of records) {
    const fromKey = record.candidateObjectKey;
    pushRelationship(relationships, record, {
      relationshipType: "business_function_to_system",
      fromType: "business_function",
      fromKey: `skyharbor-air:business_function:${slug(record.businessFunction)}`,
      toType: "application_system",
      toKey: fromKey,
    });
    pushRelationship(relationships, record, {
      relationshipType: "system_to_platform",
      fromType: "application_system",
      fromKey,
      toType: "technology_platform",
      toKey: `skyharbor-air:technology_platform:${slug(record.platformTechnology)}`,
    });
    pushRelationship(relationships, record, {
      relationshipType: "system_to_owner",
      fromType: "application_system",
      fromKey,
      toType: "owner_team",
      toKey: `skyharbor-air:owner_team:${slug(record.owner)}`,
    });
    pushRelationship(relationships, record, {
      relationshipType: "system_to_vendor",
      fromType: "application_system",
      fromKey,
      toType: "vendor_product",
      toKey: `skyharbor-air:vendor_product:${slug(record.vendorProduct)}`,
    });
    pushRelationship(relationships, record, {
      relationshipType: "system_to_source_evidence",
      fromType: "application_system",
      fromKey,
      toType: "source_evidence",
      toKey: record.evidenceKey,
    });
  }

  return relationships;
}

function pushRelationship(
  relationships: SkyHarborRelationshipCandidate[],
  record: SkyHarborApplicationCandidateRecord,
  input: Omit<SkyHarborRelationshipCandidate, "relationshipId" | "evidenceKey" | "confidence">,
): void {
  if (input.toKey.includes("needs_")) return;
  relationships.push({
    ...input,
    relationshipId: `rel-${relationships.length + 1}-${slug(record.systemId)}`,
    evidenceKey: record.evidenceKey,
    confidence: record.validationStatus === "accepted" ? 0.82 : 0.74,
  });
}

function summarizeRelationships(
  relationships: SkyHarborRelationshipCandidate[],
): Record<RelationshipType, number> {
  return relationships.reduce(
    (summary, relationship) => {
      summary[relationship.relationshipType] += 1;
      return summary;
    },
    {
      business_function_to_system: 0,
      system_to_platform: 0,
      system_to_owner: 0,
      system_to_vendor: 0,
      system_to_source_evidence: 0,
    } satisfies Record<RelationshipType, number>,
  );
}

function buildQualityChecks(
  rows: Record<string, string>[],
  records: SkyHarborApplicationCandidateRecord[],
  quarantineReport: SkyHarborQuarantineItem[],
  sourceConflicts: SkyHarborSourceConflict[],
  relationships: SkyHarborRelationshipCandidate[],
): SkyHarborApplicationsRegenerationResult["qualityChecks"] {
  const duplicateCount = countDuplicates(records.map((record) => normalizeId(record.systemId)));
  const missingOwner = records.filter((record) => isMissing(record.owner)).length;
  const missingBusinessDomain = records.filter((record) => isMissing(record.businessFunction)).length;
  const missingEvidence = records.filter((record) => !record.evidenceKey).length;
  const invalidTenantKey = rows.filter((row) => row.tenant_key && row.tenant_key !== TENANT_KEY).length;
  const generatedInconsistentRowRisk = rows.filter((row) =>
    Object.values(row).some((value) => /application_system record|data_thin:/i.test(value)),
  ).length;
  const expectedRelationships = records.length * 5;
  return {
    duplicateApplicationSystemDetection:
      duplicateCount === 0 ? "pass" : `${duplicateCount} duplicate identifiers detected`,
    conflictingAppSystemIdentitiesAcrossSources:
      sourceConflicts.length === 0 ? "pass" : `${sourceConflicts.length} source conflicts reported`,
    missingOwner,
    missingBusinessDomain,
    missingEvidence,
    invalidTenantKey,
    generatedInconsistentRowRisk,
    missingRequiredFields: quarantineReport.length,
    sourcePrecedenceConflicts: sourceConflicts.length,
    orphanRelationshipCandidates: Math.max(0, expectedRelationships - relationships.length),
  };
}

function buildPromotionBlockers(
  quarantineReport: SkyHarborQuarantineItem[],
  sourceConflicts: SkyHarborSourceConflict[],
  qualityChecks: SkyHarborApplicationsRegenerationResult["qualityChecks"],
): string[] {
  const blockers = [
    "Candidate preview only; active promotion is out of scope for DATA-PR32.",
    "Selected source is synthetic demo-safe source, not real SkyHarbor production data.",
    "Upload landing path alignment remains open for DATA-PR33 before production data-build use.",
    "Operator/source-owner approval is required before any candidate can become active tenant truth.",
  ];
  if (quarantineReport.length > 0) {
    blockers.push(`${quarantineReport.length} source rows require quarantine review.`);
  }
  if (sourceConflicts.length > 0) {
    blockers.push(`${sourceConflicts.length} source conflicts were reported and not merged.`);
  }
  if (qualityChecks.generatedInconsistentRowRisk > 0) {
    blockers.push(
      `${qualityChecks.generatedInconsistentRowRisk} rows carry generated/thin-data risk signals requiring caveat review.`,
    );
  }
  return blockers;
}

async function writeReports(
  repoRoot: string,
  result: SkyHarborApplicationsRegenerationResult,
): Promise<void> {
  const outDir = path.join(repoRoot, result.proofOutputDir);
  await fsp.mkdir(outDir, { recursive: true });

  await writeJson(outDir, "source-selection.json", result.sourceSelection);
  await writeJson(outDir, "manifest-update.json", result.manifestUpdate);
  await writeJson(outDir, "adapter-mapping.json", result.adapterMapping);
  await writeJson(outDir, "canonical-records-summary.json", {
    counts: result.counts,
    samples: result.canonicalRecordSamples,
  });
  await writeJson(outDir, "evidence-attachment-summary.json", {
    evidenceReferencesAttached: result.counts.evidenceReferencesAttached,
    missingEvidence: result.qualityChecks.missingEvidence,
    evidenceBindingRule: result.manifestUpdate.evidenceBindingRule,
  });
  await writeJson(outDir, "relationship-candidates.json", {
    summary: result.relationshipSummary,
    count: result.relationshipCandidates.length,
    samples: result.relationshipCandidates.slice(0, 100),
  });
  await writeJson(outDir, "quarantine-report.json", result.quarantineReport);
  await writeJson(outDir, "source-conflicts.json", result.sourceConflicts);
  await writeJson(outDir, "candidate-preview-summary.json", toReportSummary(result));
  await writeJson(outDir, "home-admin-preview-impact.json", result.homeAdminPreviewImpact);
  await writeJson(outDir, "promotion-blockers.json", result.promotionBlockers);

  await fsp.writeFile(path.join(outDir, "summary.md"), renderSummary(result));
  await fsp.writeFile(path.join(outDir, "source-selection.md"), renderSourceSelection(result));
  await fsp.writeFile(path.join(outDir, "upload-path-alignment.md"), renderUploadPathAlignment(result));
}

function toReportSummary(
  result: SkyHarborApplicationsRegenerationResult,
): SkyHarborApplicationsRegenerationReport {
  return {
    ...result,
    canonicalRecords: {
      count: result.canonicalRecords.length,
      samples: result.canonicalRecordSamples,
    },
    relationshipCandidates: {
      count: result.relationshipCandidates.length,
      summary: result.relationshipSummary,
      samples: result.relationshipCandidates.slice(0, 100),
    },
    sourceConflicts: {
      count: result.sourceConflicts.length,
      samples: result.sourceConflicts.slice(0, 100),
    },
  };
}

async function writeJson(outDir: string, name: string, value: unknown): Promise<void> {
  await fsp.writeFile(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function renderSummary(result: SkyHarborApplicationsRegenerationResult): string {
  return [
    "# DATA-PR32 SkyHarbor Applications & Systems Candidate Regeneration",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    "## Truth split",
    "",
    "- Implemented: source selection, applications/systems mapping, inactive candidate regeneration, evidence attachment, relationship candidate planning, quality/quarantine reports, Admin visibility.",
    "- Not implemented: production writes, candidate promotion, Active Tenant Access update, default Home update, runtime module consumption change, all-domain SkyHarbor remediation.",
    "",
    "## Selected source",
    "",
    `- ${result.selectedSource.label}`,
    `- Path: ${result.selectedSource.path}`,
    `- Rows: ${result.selectedSource.rowCount}`,
    `- Reason: ${result.selectedSource.selectionReason}`,
    "",
    "## Counts",
    "",
    `- Accepted candidate records: ${result.counts.acceptedCandidateRecords}`,
    `- Warning candidate records: ${result.counts.warningCandidateRecords}`,
    `- Quarantined rows: ${result.counts.quarantinedRows}`,
    `- Canonical ingestion records: ${result.counts.canonicalIngestionRecords}`,
    `- Evidence references attached: ${result.counts.evidenceReferencesAttached}`,
    `- Relationship candidates planned: ${result.counts.relationshipCandidatesPlanned}`,
    `- Source conflicts reported: ${result.counts.sourceConflictsReported}`,
    "",
    "## Guardrails",
    "",
    `- productionTenantDataWritten: ${result.productionTenantDataWritten}`,
    `- candidatePromoted: ${result.candidatePromoted}`,
    `- activeTenantAccessLayerUpdated: ${result.activeTenantAccessLayerUpdated}`,
    `- moduleRuntimeConsumptionChanged: ${result.moduleRuntimeConsumptionChanged}`,
    `- activeHomeContextChanged: ${result.activeHomeContextChanged}`,
    `- realizedValueClaimed: ${result.realizedValueClaimed}`,
    "",
    "## Promotion blockers",
    "",
    ...result.promotionBlockers.map((blocker) => `- ${blocker}`),
    "",
  ].join("\n");
}

function renderSourceSelection(result: SkyHarborApplicationsRegenerationResult): string {
  return [
    "# DATA-PR32 Source Selection",
    "",
    "| Source | Role | Rows | Location | Reason |",
    "| --- | --- | ---: | --- | --- |",
    ...result.sourceSelection.map(
      (source) =>
        `| ${source.label} | ${source.role} | ${source.rowCount} | ${source.locationType} | ${source.selectionReason} |`,
    ),
    "",
    "Conflicting or weak sources are reported, not silently merged.",
    "",
  ].join("\n");
}

function renderUploadPathAlignment(result: SkyHarborApplicationsRegenerationResult): string {
  return [
    "# DATA-PR32 Upload Path Alignment",
    "",
    `- Selected source path mode: ${result.uploadPathAlignment.selectedSourcePathMode}`,
    `- Canonical landing path: ${result.uploadPathAlignment.canonicalLandingPath}`,
    `- Current loader scan path: ${result.uploadPathAlignment.currentLoaderScanPath}`,
    `- Selected source uses canonical landing: ${result.uploadPathAlignment.selectedSourceUsesCanonicalLanding}`,
    `- Blocks this dry-run: ${result.uploadPathAlignment.blocksThisDryRun}`,
    `- Follow-up: ${result.uploadPathAlignment.followUp}`,
    "",
  ].join("\n");
}

function assertGuardrails(result: SkyHarborApplicationsRegenerationResult): void {
  if (
    !result.dryRunOnly ||
    result.productionTenantDataWritten ||
    result.candidatePromoted ||
    result.activeTenantAccessLayerUpdated ||
    result.moduleRuntimeConsumptionChanged ||
    result.activeHomeContextChanged ||
    result.realizedValueClaimed ||
    result.homeAdminPreviewImpact.candidateDataLeaksIntoDefaultHome
  ) {
    throw new Error("DATA-PR32 guardrail violation detected.");
  }
  if (result.counts.acceptedCandidateRecords <= result.candidatePreviewSummary.currentThinCandidateRows) {
    throw new Error("DATA-PR32 did not materially expand the thin applications/systems candidate.");
  }
  if (result.qualityChecks.missingEvidence > 0) {
    throw new Error("DATA-PR32 accepted rows without evidence references.");
  }
}

function qualityCaveatsForRow(row: Record<string, string>): string[] {
  const caveats: string[] = [];
  if (isMissing(row.it_owner_team)) caveats.push("missing_owner");
  if (isMissing(row.business_function)) caveats.push("missing_business_function");
  if (isMissing(row.vendor)) caveats.push("missing_vendor");
  if (isMissing(row.lifecycle_stage)) caveats.push("missing_lifecycle_status");
  if (isMissing(row.criticality)) caveats.push("missing_criticality");
  if (Object.values(row).some((value) => /data_thin:|application_system record/i.test(value))) {
    caveats.push("generated_or_data_thin_signal");
  }
  return caveats;
}

function isMissing(value: string | undefined): boolean {
  return !value || /^data_thin:|^needs_/i.test(value);
}

function countDuplicates(values: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const value of values) {
    if (seen.has(value)) duplicates += 1;
    seen.add(value);
  }
  return duplicates;
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/^app-0+/, "app-").replace(/[^a-z0-9]+/g, "");
}

function slug(value: string): string {
  return (value || "missing")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function resolveSourcePath(repoRoot: string, sourcePath: string): string {
  return path.isAbsolute(sourcePath) ? sourcePath : path.join(repoRoot, sourcePath);
}

function fingerprint(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
