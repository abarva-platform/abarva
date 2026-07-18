import fs from "node:fs/promises";
import path from "node:path";

import { evaluateCandidatePromotionGate } from "../candidate-promotion-gate/candidate-promotion-gate";
import { persistCandidateTenantDataVersion } from "../candidate-version-store/candidate-tenant-data-version-store";
import { buildSkyHarborCompatibilitySnapshot } from "../compatibility/skyharbor-compatibility-snapshot";
import { runTenantPacketDryRun } from "../dry-run/tenant-packet-dry-run";
import { buildModuleReadinessProof } from "../proof-harness/module-readiness-proof";
import { parseCsv } from "../source-adapters/csv-source-adapter";
import { buildStrandedIntelligenceReport } from "../stranded-intelligence/stranded-intelligence-report";
import { runTargetWriterDryRun } from "../target-writer/target-writer-dry-run";

type CandidateGenerationStatus = "passed" | "blocked" | "inventory_only";

interface SkyHarborGeneratedManifest {
  datasetId: string;
  tenantKey: string;
  tenantName: string;
  sourceBasis: string;
  generatedAt: string;
  notAllowedClaims: string[];
  commonKnownGaps: string[];
}

export interface TenantEligibilityMatrixRow {
  tenant: string;
  tenantDisplayName: string;
  sourcePacksFound: string[];
  sourceDataFound: boolean;
  movesDataFound: boolean;
  towerDataFound: boolean;
  requiredMappingsAvailable: boolean;
  candidateGenerationStatus: CandidateGenerationStatus;
  blockers: string[];
}

export interface TenantCandidateVersionSummary {
  tenant: string;
  tenantDisplayName: string;
  generatedAt: string;
  dryRunOnly: true;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  candidatePromoted: false;
  candidateGenerationStatus: CandidateGenerationStatus;
  blockers: string[];
  proofBundle: {
    compatibilitySnapshotPath: string;
    tenantPacketPath: string;
    sourceDryRunPath: string;
    targetWriterPath: string;
    moduleReadinessPath: string;
    strandedIntelligencePath: string;
    candidateVersionPath: string;
    promotionGatePath: string;
  };
  lineage: {
    packetId: string;
    adapterVersions: string[];
    mappingVersions: string[];
    targetWriterVersion: string;
    candidateVersionKey: string;
    promotionGateDecision: string;
  };
  counts: {
    canonicalRecords: number;
    targetOperationsPlanned: number;
    moduleReadinessEntries: number;
    promotionGatePassedChecks: number;
    promotionGateFailedChecks: number;
    strandedItems: number;
  };
  moduleReadinessSummary: ModuleReadinessSummaryRow[];
}

interface ModuleReadinessSummaryRow {
  module: string;
  evidenceAvailable: boolean;
  factPlanAvailable: boolean;
  graphPlanAvailable: boolean;
  derivedPlanAvailable: boolean;
  readyForRuntimeConsumption: false;
  nextProofNeeded: string;
}

export interface TenantCandidateVersionGeneratorOptions {
  repoRoot: string;
  tenantKey?: string;
  generatedAt?: string;
}

export interface TenantCandidateVersionGeneratorResult {
  selectedTenant: string;
  allTenantEligibilityMatrix: TenantEligibilityMatrixRow[];
  selectedTenantSummary?: TenantCandidateVersionSummary;
}

const SKYHARBOR_TENANT = "skyharbor-air";
const SKYHARBOR_SOURCE_ROOT =
  "datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710";
const SKYHARBOR_PACKET_ROOT =
  "reports/tenant-candidate-generation/skyharbor/packet";
const SKYHARBOR_PACKET_MANIFEST = `${SKYHARBOR_PACKET_ROOT}/tenant-manifest.yaml`;
const SKYHARBOR_SOURCE_PROOF =
  "audit-artifacts/tenant-packet-dry-run/skyharbor";
const SKYHARBOR_TARGET_PROOF =
  "audit-artifacts/target-writer-dry-run/skyharbor";
const SKYHARBOR_MODULE_PROOF = "reports/module-readiness-proof/skyharbor";
const SKYHARBOR_STRANDED_REPORT = "reports/stranded-intelligence/skyharbor";
const SKYHARBOR_CANDIDATE_RECORD =
  "reports/candidate-tenant-data-versions/skyharbor";
const SKYHARBOR_PROMOTION_GATE = "reports/candidate-promotion-gates/skyharbor";
const SKYHARBOR_SUMMARY_ROOT = "reports/tenant-candidate-generation/skyharbor";
const ALL_TENANT_MATRIX_ROOT = "reports/tenant-candidate-generation";

const INVENTORY_TENANTS = [
  {
    tenant: "skyharbor-air",
    tenantDisplayName: "Airline Demo",
    aliases: ["skyharbor"],
    requiredMappingsAvailable: true,
  },
  {
    tenant: "lakeshore-holdings",
    tenantDisplayName: "Lakeshore Holdings",
    aliases: ["lakeshore"],
    requiredMappingsAvailable: false,
  },
  {
    tenant: "meridian-health",
    tenantDisplayName: "Meridian Health",
    aliases: ["meridian"],
    requiredMappingsAvailable: false,
  },
  {
    tenant: "first-capital",
    tenantDisplayName: "First Capital",
    aliases: ["first-capital", "firstcapital"],
    requiredMappingsAvailable: false,
  },
  {
    tenant: "apex-retail",
    tenantDisplayName: "Apex Retail",
    aliases: ["apex", "apexretail"],
    requiredMappingsAvailable: false,
  },
  {
    tenant: "northstar",
    tenantDisplayName: "Northstar",
    aliases: ["northstar"],
    requiredMappingsAvailable: false,
  },
] as const;

export async function generateTenantCandidateVersion(
  options: TenantCandidateVersionGeneratorOptions,
): Promise<TenantCandidateVersionGeneratorResult> {
  const selectedTenant = options.tenantKey ?? SKYHARBOR_TENANT;
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const allTenantEligibilityMatrix = await buildAllTenantEligibilityMatrix(
    options.repoRoot,
    selectedTenant,
  );
  let selectedTenantSummary: TenantCandidateVersionSummary | undefined;

  if (selectedTenant === SKYHARBOR_TENANT || selectedTenant === "skyharbor") {
    selectedTenantSummary = await generateSkyHarborCandidate({
      repoRoot: options.repoRoot,
      generatedAt,
    });
    applySkyHarborSummaryToMatrix(
      allTenantEligibilityMatrix,
      selectedTenantSummary,
    );
  } else if (selectedTenant === "all") {
    const existingSummary = await readExistingSkyHarborSummary(
      options.repoRoot,
    );
    if (existingSummary)
      applySkyHarborSummaryToMatrix(
        allTenantEligibilityMatrix,
        existingSummary,
      );
  } else if (selectedTenant !== "all") {
    const selected = allTenantEligibilityMatrix.find(
      (row) => row.tenant === selectedTenant,
    );
    if (!selected) {
      throw new Error(
        `No tenant inventory profile is configured for ${selectedTenant}.`,
      );
    }
  }

  await writeAllTenantMatrix(options.repoRoot, allTenantEligibilityMatrix);

  return {
    selectedTenant,
    allTenantEligibilityMatrix,
    selectedTenantSummary,
  };
}

async function generateSkyHarborCandidate(input: {
  repoRoot: string;
  generatedAt: string;
}): Promise<TenantCandidateVersionSummary> {
  await generateSkyHarborTenantPacket(input.repoRoot);

  const compatibilitySnapshot = await buildSkyHarborCompatibilitySnapshot({
    repoRoot: input.repoRoot,
    sourceRoot: SKYHARBOR_SOURCE_ROOT,
    outputDir: "reports/skyharbor-compatibility-snapshot",
    generatedAt: input.generatedAt,
  });
  const sourceDryRun = await runTenantPacketDryRun({
    repoRoot: input.repoRoot,
    manifestPath: path.resolve(input.repoRoot, SKYHARBOR_PACKET_MANIFEST),
    outputDir: SKYHARBOR_SOURCE_PROOF,
    generatedAt: input.generatedAt,
  });
  const targetPlan = await runTargetWriterDryRun({
    repoRoot: input.repoRoot,
    sourceProofBundlePath: SKYHARBOR_SOURCE_PROOF,
    outputDir: SKYHARBOR_TARGET_PROOF,
    generatedAt: input.generatedAt,
  });
  const moduleProof = await buildModuleReadinessProof({
    repoRoot: input.repoRoot,
    sourceProofBundlePath: SKYHARBOR_SOURCE_PROOF,
    targetProofBundlePath: SKYHARBOR_TARGET_PROOF,
    outputDir: SKYHARBOR_MODULE_PROOF,
  });
  const strandedReport = await buildStrandedIntelligenceReport({
    repoRoot: input.repoRoot,
    sourceProofBundlePath: SKYHARBOR_SOURCE_PROOF,
    targetProofBundlePath: SKYHARBOR_TARGET_PROOF,
    outputDir: SKYHARBOR_STRANDED_REPORT,
  });
  const candidateRecord = await persistCandidateTenantDataVersion({
    repoRoot: input.repoRoot,
    sourceProofBundlePath: SKYHARBOR_SOURCE_PROOF,
    targetProofBundlePath: SKYHARBOR_TARGET_PROOF,
    moduleReadinessProofPath: SKYHARBOR_MODULE_PROOF,
    outputDir: SKYHARBOR_CANDIDATE_RECORD,
  });
  const promotionGate = await evaluateCandidatePromotionGate({
    repoRoot: input.repoRoot,
    candidateRecordPath: `${SKYHARBOR_CANDIDATE_RECORD}/candidate-version-record.json`,
    outputDir: SKYHARBOR_PROMOTION_GATE,
    priorActiveVersionId: "skyharbor-air:active-access-layer:current",
  });
  const moduleReadinessSummary =
    moduleProof.stages.moduleReadiness.moduleReadiness
      .filter((entry) =>
        ["home", "intelligence", "moves", "source", "tower"].includes(
          entry.module,
        ),
      )
      .map((entry) => ({
        module: entry.module,
        evidenceAvailable: entry.evidenceAvailable,
        factPlanAvailable: entry.factPlanAvailable,
        graphPlanAvailable: entry.graphPlanAvailable,
        derivedPlanAvailable: entry.derivedPlanAvailable,
        readyForRuntimeConsumption: false as const,
        nextProofNeeded: entry.nextProofNeeded,
      }));
  const blockers = buildSkyHarborBlockers({
    sourceQuality: sourceDryRun.summary.qualityGateStatus,
    targetQuality: targetPlan.summary.qualityGateStatus,
    moduleQuality: moduleProof.summary.qualityGateStatus,
    candidateStatus: candidateRecord.currentStatus,
    promotionFailedChecks: promotionGate.decisionRecord.failedChecks,
  });
  const summary: TenantCandidateVersionSummary = {
    tenant: SKYHARBOR_TENANT,
    tenantDisplayName: compatibilitySnapshot.summary.tenantDisplayName,
    generatedAt: input.generatedAt,
    dryRunOnly: true,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    candidatePromoted: false,
    candidateGenerationStatus: blockers.length === 0 ? "passed" : "blocked",
    blockers,
    proofBundle: {
      compatibilitySnapshotPath:
        "reports/skyharbor-compatibility-snapshot/skyharbor-compatibility-snapshot.json",
      tenantPacketPath: SKYHARBOR_PACKET_MANIFEST,
      sourceDryRunPath: SKYHARBOR_SOURCE_PROOF,
      targetWriterPath: SKYHARBOR_TARGET_PROOF,
      moduleReadinessPath: SKYHARBOR_MODULE_PROOF,
      strandedIntelligencePath: SKYHARBOR_STRANDED_REPORT,
      candidateVersionPath: `${SKYHARBOR_CANDIDATE_RECORD}/candidate-version-record.json`,
      promotionGatePath: `${SKYHARBOR_PROMOTION_GATE}/promotion-gate-result.json`,
    },
    lineage: {
      packetId: sourceDryRun.summary.packetId,
      adapterVersions: candidateRecord.lineage.adapterVersions,
      mappingVersions: candidateRecord.lineage.mappingVersions,
      targetWriterVersion: candidateRecord.lineage.targetWriterVersion,
      candidateVersionKey: candidateRecord.candidateVersionKey,
      promotionGateDecision: promotionGate.decisionRecord.decision,
    },
    counts: {
      canonicalRecords: sourceDryRun.summary.canonicalRecordCount,
      targetOperationsPlanned: targetPlan.summary.operationsPlanned,
      moduleReadinessEntries: moduleReadinessSummary.length,
      promotionGatePassedChecks:
        promotionGate.decisionRecord.passedChecks.length,
      promotionGateFailedChecks:
        promotionGate.decisionRecord.failedChecks.length,
      strandedItems: strandedReport.findings.length,
    },
    moduleReadinessSummary,
  };

  await writeSkyHarborSummaries(
    input.repoRoot,
    summary,
    moduleReadinessSummary,
    strandedReport,
  );
  return summary;
}

async function generateSkyHarborTenantPacket(repoRoot: string): Promise<void> {
  const sourceRoot = path.resolve(repoRoot, SKYHARBOR_SOURCE_ROOT);
  const manifest = await readJson<SkyHarborGeneratedManifest>(
    path.join(sourceRoot, "V6_V7_GENERATED_MANIFEST.json"),
  );
  const packetRoot = path.resolve(repoRoot, SKYHARBOR_PACKET_ROOT);
  const sourceDir = path.join(packetRoot, "sources");
  await fs.mkdir(sourceDir, { recursive: true });

  const enterpriseRows = await buildSkyHarborEnterpriseProfileRows(
    sourceRoot,
    manifest,
  );
  const evidenceRows = await buildSkyHarborEvidenceRows(
    sourceRoot,
    repoRoot,
    manifest,
  );
  await fs.writeFile(
    path.join(sourceDir, "enterprise-profile.csv"),
    toCsv(
      [
        "entity_id",
        "entity_name",
        "entity_type",
        "industry",
        "employee_count",
        "primary_system",
        "risk_tier",
        "notes",
      ],
      enterpriseRows,
    ),
  );
  await fs.writeFile(
    path.join(sourceDir, "evidence-registry.csv"),
    toCsv(
      [
        "evidence_key",
        "evidence_title",
        "source_file",
        "source_owner",
        "domain",
        "risk_flag",
        "excerpt",
        "review_status",
      ],
      evidenceRows,
    ),
  );
  await fs.writeFile(
    path.join(packetRoot, "tenant-manifest.yaml"),
    skyHarborManifestYaml(manifest),
  );
}

async function buildSkyHarborEnterpriseProfileRows(
  sourceRoot: string,
  manifest: SkyHarborGeneratedManifest,
): Promise<Record<string, string>[]> {
  const enterprise = parseCsv(
    await fs.readFile(
      path.join(sourceRoot, "v7", "V7_01_enterprise_profile.csv"),
      "utf8",
    ),
  ).rows[0];
  const systems = parseCsv(
    await fs.readFile(
      path.join(sourceRoot, "v7", "V7_05_applications_systems.csv"),
      "utf8",
    ),
  ).rows.slice(0, 12);
  const vendors = parseCsv(
    await fs.readFile(
      path.join(sourceRoot, "v7", "V7_07_vendors_contracts.csv"),
      "utf8",
    ),
  ).rows.slice(0, 8);
  const commonNotes = manifest.commonKnownGaps.join(" | ");
  const rows: Record<string, string>[] = [
    {
      entity_id: enterprise.entity_id,
      entity_name: enterprise.entity_name,
      entity_type: "enterprise",
      industry: enterprise.industry,
      employee_count: enterprise.employee_count,
      primary_system:
        enterprise.primary_cloud || enterprise.strategic_priorities,
      risk_tier: enterprise.source_validation_status,
      notes: `${manifest.sourceBasis}. ${commonNotes}`,
    },
  ];

  for (const system of systems) {
    rows.push({
      entity_id: system.system_id,
      entity_name: system.system_name,
      entity_type: "system",
      industry: enterprise.industry,
      employee_count: "",
      primary_system: system.vendor_product || system.hosting_model,
      risk_tier: system.criticality || system.source_validation_status,
      notes: system.system_business_context || system.known_gaps,
    });
  }

  for (const vendor of vendors) {
    rows.push({
      entity_id: vendor.vendor_id,
      entity_name: vendor.vendor_name,
      entity_type: "vendor",
      industry: enterprise.industry,
      employee_count: "",
      primary_system: vendor.supported_functions || vendor.vendor_role,
      risk_tier: vendor.contract_risk || vendor.source_validation_status,
      notes: vendor.concentration_notes || vendor.known_gaps,
    });
  }

  return rows.filter(
    (row) => row.entity_id && row.entity_name && row.entity_type,
  );
}

async function buildSkyHarborEvidenceRows(
  sourceRoot: string,
  repoRoot: string,
  manifest: SkyHarborGeneratedManifest,
): Promise<Record<string, string>[]> {
  const evidence = parseCsv(
    await fs.readFile(
      path.join(sourceRoot, "v7", "V7_13_source_evidence_registry.csv"),
      "utf8",
    ),
  ).rows;
  const findings = parseCsv(
    await fs.readFile(
      path.join(
        sourceRoot,
        "derived",
        "skyharbor_air_moves_current_state_findings.csv",
      ),
      "utf8",
    ),
  ).rows.slice(0, 12);
  const spend = parseCsv(
    await fs.readFile(
      path.join(sourceRoot, "v7", "V7_08_spend_value.csv"),
      "utf8",
    ),
  ).rows.slice(0, 8);
  const sourcePackPaths = await findPathsContaining(
    repoRoot,
    ["datasets/source", "docs", "reports"],
    ["skyharbor"],
  );
  const rows: Record<string, string>[] = [];

  for (const row of evidence) {
    rows.push({
      evidence_key: row.evidence_id,
      evidence_title: row.source_artifact_label,
      source_file: row.source_artifact_uri,
      source_owner: row.owner,
      domain: row.evidence_purpose || "source_evidence",
      risk_flag: row.sensitivity === "high" ? "true" : "false",
      excerpt: `${row.source_artifact_label}. ${row.known_gaps}`,
      review_status: row.source_validation_status || row.validation_status,
    });
  }

  for (const row of findings) {
    rows.push({
      evidence_key: row.finding_id,
      evidence_title: `Moves finding: ${row.move_name}`,
      source_file: row.source_system,
      source_owner: "AbarVa synthetic data steward",
      domain: row.data_domain,
      risk_flag: "true",
      excerpt: `${row.current_state_finding} ${row.business_implication}`,
      review_status: row.confidence || "medium",
    });
  }

  for (const row of spend) {
    rows.push({
      evidence_key: row.spend_id,
      evidence_title: `Tower value signal: ${row.spend_category}`,
      source_file: `${SKYHARBOR_SOURCE_ROOT}/v7/V7_08_spend_value.csv`,
      source_owner: row.spend_owner || "AbarVa synthetic data steward",
      domain: row.spend_type || "spend_value",
      risk_flag:
        row.value_evidence_status === "not_quantified" ? "true" : "false",
      excerpt: row.value_linkage || row.known_gaps || manifest.sourceBasis,
      review_status: row.value_evidence_status || row.source_validation_status,
    });
  }

  for (const relativePath of sourcePackPaths.slice(0, 8)) {
    rows.push({
      evidence_key: `SHA-SOURCE-${stableSlug(relativePath)}`,
      evidence_title: `Source artifact: ${path.basename(relativePath)}`,
      source_file: relativePath,
      source_owner: "AbarVa source workspace",
      domain: "source_event_data",
      risk_flag: "false",
      excerpt:
        "Source event data discovered for the SkyHarbor candidate inventory; dry-run proof does not change Source runtime behavior.",
      review_status: "inventory_discovered",
    });
  }

  return rows.filter(
    (row) => row.evidence_key && row.evidence_title && row.source_file,
  );
}

function skyHarborManifestYaml(manifest: SkyHarborGeneratedManifest): string {
  return `contractVersion: tenant-packet/v1
packetId: skyharbor-air-pr10-candidate
tenantKey: skyharbor-air
tenantDisplayName: Airline Demo
sourceOwner: AbarVa synthetic data steward
effectiveDate: 2026-07-10
purpose: Existing tenant candidate-version proof through source adapter, canonical ingestion, target writer, module readiness, candidate metadata, and promotion gate.
modules:
  - home
  - intelligence
  - moves
  - source
  - tower
sourceProfiles:
  - profileId: skyharbor-enterprise-profile-pr10
    sourceClass: enterprise_profile
    parserVersion: csv-adapter/v1
    mappingProfile: enterprise-profile-minimal/v1
  - profileId: skyharbor-evidence-registry-pr10
    sourceClass: evidence_registry
    parserVersion: csv-adapter/v1
    mappingProfile: evidence-registry-minimal/v1
files:
  - path: sources/enterprise-profile.csv
    sourceProfile: skyharbor-enterprise-profile-pr10
    sourceClass: enterprise_profile
    adapterKey: csv
    mappingProfile: enterprise-profile-minimal/v1
    dataStatus: synthetic
    sensitivity: internal
    required: true
    evidenceBasis: ${manifest.datasetId}
  - path: sources/evidence-registry.csv
    sourceProfile: skyharbor-evidence-registry-pr10
    sourceClass: evidence_registry
    adapterKey: csv
    mappingProfile: evidence-registry-minimal/v1
    dataStatus: synthetic
    sensitivity: internal
    required: true
    evidenceBasis: ${manifest.datasetId}
qualityGates:
  minimumMappingCoveragePercent: 85
  allowQuarantinedRecords: false
promotionPolicy:
  allowAutoPromotion: false
  requiresHumanApproval: true
  rollbackWindowDays: 30
legacyMigrationName: SkyHarbor compatibility adapter evidence path only; not an architecture layer name.
`;
}

async function buildAllTenantEligibilityMatrix(
  repoRoot: string,
  selectedTenant: string,
): Promise<TenantEligibilityMatrixRow[]> {
  const rows: TenantEligibilityMatrixRow[] = [];

  for (const tenant of INVENTORY_TENANTS) {
    const matches = await findPathsContaining(
      repoRoot,
      ["datasets", "docs", "reports"],
      tenant.aliases,
    );
    const sourcePacksFound = summarizeSourcePacks(matches);
    const sourceDataFound = matches.some((match) =>
      /(^|\/)(source|source-docs|source-material)(\/|-)/i.test(match),
    );
    const movesDataFound = matches.some((match) =>
      /moves|strategic-moves|move_/i.test(match),
    );
    const towerDataFound = matches.some((match) =>
      /tower|value|spend|fy2025|outcome/i.test(match),
    );
    const blockers = buildInventoryBlockers({
      tenant: tenant.tenant,
      selectedTenant,
      sourcePacksFound,
      sourceDataFound,
      movesDataFound,
      towerDataFound,
      requiredMappingsAvailable: tenant.requiredMappingsAvailable,
    });

    rows.push({
      tenant: tenant.tenant,
      tenantDisplayName: tenant.tenantDisplayName,
      sourcePacksFound,
      sourceDataFound,
      movesDataFound,
      towerDataFound,
      requiredMappingsAvailable: tenant.requiredMappingsAvailable,
      candidateGenerationStatus:
        tenant.tenant === SKYHARBOR_TENANT && selectedTenant !== "all"
          ? "blocked"
          : "inventory_only",
      blockers,
    });
  }

  return rows;
}

function applySkyHarborSummaryToMatrix(
  matrix: TenantEligibilityMatrixRow[],
  summary: TenantCandidateVersionSummary,
): void {
  const skyharbor = matrix.find((row) => row.tenant === SKYHARBOR_TENANT);
  if (!skyharbor) return;
  skyharbor.requiredMappingsAvailable = true;
  skyharbor.candidateGenerationStatus = summary.candidateGenerationStatus;
  skyharbor.blockers = summary.blockers;
}

async function readExistingSkyHarborSummary(
  repoRoot: string,
): Promise<TenantCandidateVersionSummary | undefined> {
  const summaryPath = path.resolve(
    repoRoot,
    SKYHARBOR_SUMMARY_ROOT,
    "skyharbor-candidate-summary.json",
  );
  if (!(await exists(summaryPath))) return undefined;
  return readJson<TenantCandidateVersionSummary>(summaryPath);
}

function buildInventoryBlockers(input: {
  tenant: string;
  selectedTenant: string;
  sourcePacksFound: string[];
  sourceDataFound: boolean;
  movesDataFound: boolean;
  towerDataFound: boolean;
  requiredMappingsAvailable: boolean;
}): string[] {
  const blockers: string[] = [];
  if (input.sourcePacksFound.length === 0)
    blockers.push(
      "No tenant source pack discovered in datasets, docs, or reports inventory.",
    );
  if (!input.sourceDataFound)
    blockers.push(
      "No Source event data discovered in the repository inventory.",
    );
  if (!input.movesDataFound)
    blockers.push("No Moves artifacts discovered in the repository inventory.");
  if (!input.towerDataFound)
    blockers.push(
      "No Tower/value data discovered in the repository inventory.",
    );
  if (!input.requiredMappingsAvailable)
    blockers.push(
      "Required packet projection and mapping profile configuration is not available yet.",
    );
  if (input.tenant !== SKYHARBOR_TENANT)
    blockers.push(
      "PR10 inventories this tenant only; full candidate generation remains future work.",
    );
  if (input.tenant === SKYHARBOR_TENANT && input.selectedTenant === "all") {
    blockers.push(
      "All-tenant mode inventories only and does not generate or promote any candidate.",
    );
  }
  return blockers;
}

function buildSkyHarborBlockers(input: {
  sourceQuality: string;
  targetQuality: string;
  moduleQuality: string;
  candidateStatus: string;
  promotionFailedChecks: string[];
}): string[] {
  const blockers: string[] = [];
  if (input.sourceQuality !== "pass")
    blockers.push(
      `Source adapter dry-run quality gate is ${input.sourceQuality}.`,
    );
  if (input.targetQuality !== "pass")
    blockers.push(
      `Target writer dry-run quality gate is ${input.targetQuality}.`,
    );
  if (input.moduleQuality !== "pass")
    blockers.push(`Module readiness quality gate is ${input.moduleQuality}.`);
  if (!["validated", "promotion-ready"].includes(input.candidateStatus)) {
    blockers.push(`Candidate metadata status is ${input.candidateStatus}.`);
  }
  if (input.promotionFailedChecks.length > 0) {
    blockers.push(
      `Promotion gate failed checks: ${input.promotionFailedChecks.join(", ")}.`,
    );
  }
  return blockers;
}

async function writeSkyHarborSummaries(
  repoRoot: string,
  summary: TenantCandidateVersionSummary,
  moduleReadinessSummary: ModuleReadinessSummaryRow[],
  strandedReport: {
    summary: { strandedRecordCount: number };
    findings: unknown[];
  },
): Promise<void> {
  const outputDir = path.resolve(repoRoot, SKYHARBOR_SUMMARY_ROOT);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "skyharbor-candidate-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "skyharbor-candidate-summary.md"),
    skyHarborSummaryMarkdown(summary),
  );
  await fs.writeFile(
    path.join(outputDir, "module-readiness-summary.json"),
    `${JSON.stringify(moduleReadinessSummary, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "module-readiness-summary.md"),
    moduleReadinessMarkdown(moduleReadinessSummary),
  );
  await fs.writeFile(
    path.join(outputDir, "stranded-intelligence-delta.json"),
    `${JSON.stringify(
      {
        tenant: summary.tenant,
        candidateMetadataCreated: true,
        candidatePromoted: false,
        activeTenantAccessLayerUpdated: false,
        moduleRuntimeConsumptionChanged: false,
        strandedItemCountBeforeCandidate:
          strandedReport.summary.strandedRecordCount,
        strandedItemCountAfterCandidateMetadata:
          strandedReport.summary.strandedRecordCount,
        deltaInterpretation:
          "Candidate metadata now exists for proof lineage, but stranded intelligence is not active tenant truth until a future promotion gate updates active access.",
        strandedItems: strandedReport.findings,
      },
      null,
      2,
    )}\n`,
  );
}

async function writeAllTenantMatrix(
  repoRoot: string,
  matrix: TenantEligibilityMatrixRow[],
): Promise<void> {
  const outputDir = path.resolve(repoRoot, ALL_TENANT_MATRIX_ROOT);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "all-tenant-eligibility-matrix.json"),
    `${JSON.stringify(matrix, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "all-tenant-eligibility-matrix.csv"),
    matrixCsv(matrix),
  );
  await fs.writeFile(
    path.join(outputDir, "all-tenant-eligibility-matrix.md"),
    matrixMarkdown(matrix),
  );
}

function skyHarborSummaryMarkdown(
  summary: TenantCandidateVersionSummary,
): string {
  const blockers =
    summary.blockers.length === 0
      ? "- None for candidate metadata persistence. Active promotion is still disabled by design."
      : summary.blockers.map((blocker) => `- ${blocker}`).join("\n");
  const modules = summary.moduleReadinessSummary
    .map(
      (entry) =>
        `| ${entry.module} | ${entry.evidenceAvailable} | ${entry.factPlanAvailable} | ${entry.graphPlanAvailable} | ${entry.derivedPlanAvailable} | ${entry.readyForRuntimeConsumption} |`,
    )
    .join("\n");

  return `# SkyHarbor Candidate Tenant Data Version

Tenant: \`${summary.tenant}\`
Status: \`${summary.candidateGenerationStatus}\`
Candidate: \`${summary.lineage.candidateVersionKey}\`
Promotion gate decision: \`${summary.lineage.promotionGateDecision}\`

This PR10 proof creates inactive candidate-version metadata only. It does not write
production tenant data, update the Active Tenant Access Layer, promote the candidate,
or change module runtime consumption.

## Guardrails

- Dry-run only: ${summary.dryRunOnly}
- Physical table writes: ${summary.writesPhysicalTables}
- Active Tenant Access Layer updated: ${summary.activeTenantAccessLayerUpdated}
- Module runtime consumption changed: ${summary.moduleRuntimeConsumptionChanged}
- Candidate promoted: ${summary.candidatePromoted}

## Proof Bundle

- Compatibility snapshot: \`${summary.proofBundle.compatibilitySnapshotPath}\`
- Tenant packet: \`${summary.proofBundle.tenantPacketPath}\`
- Source dry-run: \`${summary.proofBundle.sourceDryRunPath}\`
- Target writer dry-run: \`${summary.proofBundle.targetWriterPath}\`
- Module readiness: \`${summary.proofBundle.moduleReadinessPath}\`
- Stranded intelligence: \`${summary.proofBundle.strandedIntelligencePath}\`
- Candidate version: \`${summary.proofBundle.candidateVersionPath}\`
- Promotion gate: \`${summary.proofBundle.promotionGatePath}\`

## Counts

- Canonical records: ${summary.counts.canonicalRecords}
- Target operations planned: ${summary.counts.targetOperationsPlanned}
- Module readiness entries: ${summary.counts.moduleReadinessEntries}
- Promotion checks passed: ${summary.counts.promotionGatePassedChecks}
- Promotion checks failed: ${summary.counts.promotionGateFailedChecks}
- Stranded intelligence items: ${summary.counts.strandedItems}

## Module Readiness Summary

<!-- prettier-ignore -->
| Module | Evidence | Fact plan | Graph plan | Derived plan | Runtime reads candidate |
| --- | --- | --- | --- | --- | --- |
${modules}

## Blockers

${blockers}
`;
}

function moduleReadinessMarkdown(rows: ModuleReadinessSummaryRow[]): string {
  const table = rows
    .map(
      (row) =>
        `| ${row.module} | ${row.evidenceAvailable} | ${row.factPlanAvailable} | ${row.graphPlanAvailable} | ${row.derivedPlanAvailable} | ${row.readyForRuntimeConsumption} | ${row.nextProofNeeded.replaceAll("\n", " ")} |`,
    )
    .join("\n");
  return `# SkyHarbor Module Readiness Summary

The modules below are evaluated against candidate proof metadata only. None reads candidate
data by default in PR10.

<!-- prettier-ignore -->
| Module | Evidence | Fact plan | Graph plan | Derived plan | Runtime reads candidate | Next proof needed |
| --- | --- | --- | --- | --- | --- | --- |
${table}
`;
}

function matrixMarkdown(matrix: TenantEligibilityMatrixRow[]): string {
  const rows = matrix
    .map(
      (row) =>
        `| ${row.tenant} | ${row.sourcePacksFound.length} | ${row.sourceDataFound} | ${row.movesDataFound} | ${row.towerDataFound} | ${row.requiredMappingsAvailable} | ${row.candidateGenerationStatus} | ${row.blockers.join("; ") || "None"} |`,
    )
    .join("\n");
  return `# Tenant Candidate Eligibility Matrix

This inventory is non-destructive. It does not perform all-tenant active promotion, write
production tenant data, update active tenant access, or change module runtime consumption.

<!-- prettier-ignore -->
| Tenant | Source packs found | Source data | Moves data | Tower data | Required mappings | Candidate generation status | Blockers |
| --- | ---: | --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function matrixCsv(matrix: TenantEligibilityMatrixRow[]): string {
  return toCsv(
    [
      "tenant",
      "source_packs_found",
      "source_data_found",
      "moves_data_found",
      "tower_data_found",
      "required_mappings_available",
      "candidate_generation_status",
      "blockers",
    ],
    matrix.map((row) => ({
      tenant: row.tenant,
      source_packs_found: row.sourcePacksFound.join("; "),
      source_data_found: String(row.sourceDataFound),
      moves_data_found: String(row.movesDataFound),
      tower_data_found: String(row.towerDataFound),
      required_mappings_available: String(row.requiredMappingsAvailable),
      candidate_generation_status: row.candidateGenerationStatus,
      blockers: row.blockers.join("; "),
    })),
  );
}

function summarizeSourcePacks(paths: string[]): string[] {
  const packRoots = new Set<string>();
  for (const item of paths) {
    const parts = item.split("/");
    if (parts[0] === "datasets" && parts[1])
      packRoots.add(`${parts[0]}/${parts[1]}`);
    else if (parts[0] === "docs" && parts[1])
      packRoots.add(`${parts[0]}/${parts[1]}`);
    else if (parts[0] === "reports" && parts[1])
      packRoots.add(`${parts[0]}/${parts[1]}`);
  }
  return [...packRoots].sort().slice(0, 12);
}

async function findPathsContaining(
  repoRoot: string,
  roots: string[],
  aliases: readonly string[],
): Promise<string[]> {
  const matches: string[] = [];
  for (const root of roots) {
    const absoluteRoot = path.resolve(repoRoot, root);
    if (!(await exists(absoluteRoot))) continue;
    const files = await listFilesAndDirs(absoluteRoot);
    for (const file of files) {
      const relative = path.relative(repoRoot, file).replaceAll(path.sep, "/");
      const lower = relative.toLowerCase();
      if (aliases.some((alias) => lower.includes(alias.toLowerCase())))
        matches.push(relative);
    }
  }
  return [...new Set(matches)].sort();
}

async function listFilesAndDirs(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const results: string[] = [root];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const absolutePath = path.join(root, entry.name);
    results.push(absolutePath);
    if (entry.isDirectory())
      results.push(...(await listFilesAndDirs(absolutePath)));
  }
  return results;
}

async function exists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(absolutePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(absolutePath, "utf8")) as T;
}

function toCsv(headers: string[], rows: Record<string, string>[]): string {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function stableSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
