import fs from "node:fs/promises";
import path from "node:path";

import {
  generateTenantCandidateVersion,
  type TenantCandidateVersionSummary,
  type TenantEligibilityMatrixRow,
} from "../candidate-generation/tenant-candidate-version-generator";

type EligibilityStatus =
  | "eligible"
  | "partially_eligible"
  | "blocked"
  | "not_enough_evidence";
type StageEligibility =
  | "eligible"
  | "partially_eligible"
  | "blocked"
  | "not_available";
type EstimatedEffort = "low" | "medium" | "high";

interface SourceShadowProofSummary {
  sourceOpportunityAssessment: { readinessStatus: string };
  validationSummary: {
    qualityGateStatus: string;
    leverageFindingCount: number;
    proposedMemoryRecordCount: number;
    evidenceTraceCount: number;
  };
  sourceContext: { canonicalRecordsInspected: number };
  evidenceTrace: Array<{ evidenceRefs: string[] }>;
  guardrails: Record<string, boolean>;
}

interface CandidateRecord {
  currentStatus: string;
  dryRunOnly: boolean;
  writesPhysicalTables: boolean;
  activeTenantAccessLayerUpdated: boolean;
  moduleRuntimeConsumptionChanged: boolean;
  sourceCandidatePlan: {
    canonicalRecordCount: number;
    evidenceOperationCount: number;
    factOperationCount: number;
    relationshipOperationCount: number;
    quarantineOperationCount: number;
  };
  plannedWriteFootprint: { operationsPlanned: number };
  proofBundles: Array<{
    stage: string;
    status: string;
    summary?: Record<string, number | string | boolean>;
  }>;
}

interface PromotionGate {
  decisionRecord: {
    decision: string;
    passedChecks: string[];
    failedChecks: string[];
    blockers: string[];
    promotionEnabled: boolean;
    activeTenantAccessLayerUpdated: boolean;
    writesPhysicalTables: boolean;
    moduleRuntimeConsumptionChanged: boolean;
  };
}

interface StrandedDelta {
  strandedItemCountAfterCandidateMetadata?: number;
  strandedItems?: unknown[];
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

export interface TenantBatchRow {
  tenantKey: string;
  displayName: string;
  sourcePacksFound: string[];
  tenantPacketAvailability: StageEligibility;
  adapterEligibility: StageEligibility;
  canonicalIngestionEligibility: StageEligibility;
  targetWriterDryRunEligibility: StageEligibility;
  candidateMetadataEligibility: StageEligibility;
  promotionGateEligibility: StageEligibility;
  moduleReadinessPreviewEligibility: StageEligibility;
  derivedPlanEligibility: StageEligibility;
  graphPlanEligibility: StageEligibility;
  sourceShadowProofEligibility: StageEligibility;
  movesShadowProofEligibility: StageEligibility;
  readinessStatus: EligibilityStatus;
  blockers: string[];
  missingSourceClasses: string[];
  missingMappings: string[];
  unmappedFields: string[];
  quarantinedRecords: number;
  strandedIntelligenceCount: number;
  recommendedRemediation: string[];
  minimumFilesEvidenceNeeded: string[];
  estimatedEffort: EstimatedEffort;
  nextAction: string;
  sourceDataFound: boolean;
  movesDataFound: boolean;
  towerDataFound: boolean;
  counts: {
    sourceFilesFound: number;
    candidateRecordsGenerated: number;
    targetOperationsPlanned: number;
    unmappedFields: number;
    quarantinedRecords: number;
    strandedIntelligenceRecords: number;
  };
  moduleReadiness: ModuleReadinessSummaryRow[];
}

export interface AllTenantCandidateBatchReport {
  reportVersion: "all-tenant-candidate-batch/v1";
  generatedAt: string;
  dryRunOnly: true;
  productionTenantDataWritten: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  writesPhysicalTables: false;
  moduleRuntimeConsumptionChanged: false;
  candidateReadByDefault: false;
  realizedValueClaimed: false;
  tenants: TenantBatchRow[];
  rollup: {
    totalTenantsScanned: number;
    eligibleTenants: number;
    partiallyEligibleTenants: number;
    blockedTenants: number;
    notEnoughEvidenceTenants: number;
    totalSourceFilesFound: number;
    totalCandidateRecordsGenerated: number;
    totalPlannedTargetOperations: number;
    totalUnmappedFields: number;
    totalQuarantinedRecords: number;
    totalStrandedIntelligenceRecords: number;
    moduleReadinessByTenant: Record<string, Record<string, boolean>>;
    topRecurringBlockers: Array<{ blocker: string; count: number }>;
    topRemediationActions: Array<{ action: string; count: number }>;
  };
}

export interface AllTenantCandidateBatchOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/all-tenant-candidate-batch";
const REQUIRED_SOURCE_CLASSES = [
  "Tenant Packet manifest",
  "enterprise profile",
  "evidence registry",
  "Source data",
  "Moves artifacts",
  "Tower value data",
];

const MORGAN_STREET_ROW: TenantEligibilityMatrixRow = {
  tenant: "morgan-street",
  tenantDisplayName: "Morgan Street",
  sourcePacksFound: [],
  sourceDataFound: true,
  movesDataFound: false,
  towerDataFound: false,
  requiredMappingsAvailable: false,
  candidateGenerationStatus: "inventory_only",
  blockers: [
    "Morgan Street appears as a Lakeshore operating-unit access boundary, not as a standalone candidate packet.",
    "No standalone Tenant Packet manifest or candidate mapping profile is available yet.",
  ],
};

export async function buildAllTenantCandidateBatch(
  options: AllTenantCandidateBatchOptions,
): Promise<AllTenantCandidateBatchReport> {
  const generatedAt = options.generatedAt ?? "2026-07-12T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const matrixResult = await generateTenantCandidateVersion({
    repoRoot: options.repoRoot,
    tenantKey: "all",
    generatedAt,
  });

  const matrix = await addOptionalInventoryRows(
    options.repoRoot,
    matrixResult.allTenantEligibilityMatrix,
  );
  const skyHarborSummary =
    await readJsonIfExists<TenantCandidateVersionSummary>(
      options.repoRoot,
      "reports/tenant-candidate-generation/skyharbor/skyharbor-candidate-summary.json",
    );
  const skyHarborCandidate = await readJsonIfExists<CandidateRecord>(
    options.repoRoot,
    "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json",
  );
  const skyHarborPromotion = await readJsonIfExists<PromotionGate>(
    options.repoRoot,
    "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json",
  );
  const skyHarborStranded = await readJsonIfExists<StrandedDelta>(
    options.repoRoot,
    "reports/tenant-candidate-generation/skyharbor/stranded-intelligence-delta.json",
  );
  const sourceShadow = await readJsonIfExists<SourceShadowProofSummary>(
    options.repoRoot,
    "reports/source-shadow-proof/skyharbor/source-shadow-proof.json",
  );

  const tenants = matrix.map((row) =>
    buildTenantBatchRow({
      row,
      skyHarborSummary,
      skyHarborCandidate,
      skyHarborPromotion,
      skyHarborStranded,
      sourceShadow,
    }),
  );
  const report: AllTenantCandidateBatchReport = {
    reportVersion: "all-tenant-candidate-batch/v1",
    generatedAt,
    dryRunOnly: true,
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    writesPhysicalTables: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    realizedValueClaimed: false,
    tenants,
    rollup: buildRollup(tenants),
  };

  await writeReport(options.repoRoot, outputDir, report);
  validateGuardrails(report);
  return report;
}

async function addOptionalInventoryRows(
  repoRoot: string,
  matrix: TenantEligibilityMatrixRow[],
): Promise<TenantEligibilityMatrixRow[]> {
  const rows = [...matrix];
  if (!rows.some((row) => row.tenant === "morgan-street")) {
    const matches = await findPathsContaining(
      repoRoot,
      ["datasets", "docs", "reports"],
      ["morgan", "morgan-street"],
    );
    if (matches.length > 0) {
      rows.push({
        ...MORGAN_STREET_ROW,
        sourcePacksFound: summarizeSourcePacks(matches),
      });
    }
  }
  return rows;
}

function buildTenantBatchRow(input: {
  row: TenantEligibilityMatrixRow;
  skyHarborSummary?: TenantCandidateVersionSummary;
  skyHarborCandidate?: CandidateRecord;
  skyHarborPromotion?: PromotionGate;
  skyHarborStranded?: StrandedDelta;
  sourceShadow?: SourceShadowProofSummary;
}): TenantBatchRow {
  const { row } = input;
  const isSkyHarbor = row.tenant === "skyharbor-air";
  if (isSkyHarbor && input.skyHarborSummary && input.skyHarborCandidate) {
    return buildSkyHarborRow(input as Required<typeof input>);
  }

  const missingSourceClasses = REQUIRED_SOURCE_CLASSES.filter((sourceClass) => {
    if (sourceClass === "Tenant Packet manifest") return true;
    if (sourceClass === "Source data") return !row.sourceDataFound;
    if (sourceClass === "Moves artifacts") return !row.movesDataFound;
    if (sourceClass === "Tower value data") return !row.towerDataFound;
    return true;
  });
  const missingMappings = row.requiredMappingsAvailable
    ? []
    : [
        "tenant-packet projection",
        "source adapter mapping profile",
        "target writer mapping profile",
      ];
  const blockers = row.blockers.map(normalizeInventoryBlocker);
  const readinessStatus = classifyInventoryStatus(row, missingSourceClasses);
  const recommendedRemediation = buildRemediation(row, missingSourceClasses);

  return {
    tenantKey: row.tenant,
    displayName: row.tenantDisplayName,
    sourcePacksFound: row.sourcePacksFound,
    tenantPacketAvailability: "blocked",
    adapterEligibility: row.sourceDataFound ? "partially_eligible" : "blocked",
    canonicalIngestionEligibility: "blocked",
    targetWriterDryRunEligibility: "blocked",
    candidateMetadataEligibility: "blocked",
    promotionGateEligibility: "blocked",
    moduleReadinessPreviewEligibility: "blocked",
    derivedPlanEligibility: "blocked",
    graphPlanEligibility: "blocked",
    sourceShadowProofEligibility: "blocked",
    movesShadowProofEligibility: "not_available",
    readinessStatus,
    blockers,
    missingSourceClasses,
    missingMappings,
    unmappedFields: missingMappings,
    quarantinedRecords: 0,
    strandedIntelligenceCount: row.sourcePacksFound.length,
    recommendedRemediation,
    minimumFilesEvidenceNeeded: buildMinimumEvidence(row, missingSourceClasses),
    estimatedEffort: estimateEffort(
      readinessStatus,
      missingSourceClasses,
      missingMappings,
    ),
    nextAction:
      readinessStatus === "partially_eligible"
        ? "Create a Tenant Packet manifest and mapping profile from the discovered source packs."
        : "Collect the missing evidence classes before attempting candidate generation.",
    sourceDataFound: row.sourceDataFound,
    movesDataFound: row.movesDataFound,
    towerDataFound: row.towerDataFound,
    counts: {
      sourceFilesFound: row.sourcePacksFound.length,
      candidateRecordsGenerated: 0,
      targetOperationsPlanned: 0,
      unmappedFields: missingMappings.length,
      quarantinedRecords: 0,
      strandedIntelligenceRecords: row.sourcePacksFound.length,
    },
    moduleReadiness: [],
  };
}

function buildSkyHarborRow(input: {
  row: TenantEligibilityMatrixRow;
  skyHarborSummary: TenantCandidateVersionSummary;
  skyHarborCandidate: CandidateRecord;
  skyHarborPromotion?: PromotionGate;
  skyHarborStranded?: StrandedDelta;
  sourceShadow?: SourceShadowProofSummary;
}): TenantBatchRow {
  const failedPromotionChecks =
    input.skyHarborPromotion?.decisionRecord.failedChecks ?? [];
  const promotionBlockers =
    input.skyHarborPromotion?.decisionRecord.blockers ?? [];
  const sourceShadowReady =
    input.sourceShadow?.sourceOpportunityAssessment.readinessStatus ===
      "shadow_ready" &&
    input.sourceShadow.validationSummary.qualityGateStatus === "pass";

  return {
    tenantKey: input.row.tenant,
    displayName: input.row.tenantDisplayName,
    sourcePacksFound: input.row.sourcePacksFound,
    tenantPacketAvailability: "eligible",
    adapterEligibility: "eligible",
    canonicalIngestionEligibility: "eligible",
    targetWriterDryRunEligibility: "eligible",
    candidateMetadataEligibility: "eligible",
    promotionGateEligibility:
      failedPromotionChecks.length === 0 ? "eligible" : "partially_eligible",
    moduleReadinessPreviewEligibility: "eligible",
    derivedPlanEligibility: "eligible",
    graphPlanEligibility: "eligible",
    sourceShadowProofEligibility: sourceShadowReady ? "eligible" : "blocked",
    movesShadowProofEligibility: "not_available",
    readinessStatus: sourceShadowReady ? "eligible" : "partially_eligible",
    blockers: promotionBlockers,
    missingSourceClasses: [],
    missingMappings: [],
    unmappedFields: [],
    quarantinedRecords:
      input.skyHarborCandidate.sourceCandidatePlan.quarantineOperationCount,
    strandedIntelligenceCount:
      input.skyHarborStranded?.strandedItemCountAfterCandidateMetadata ??
      input.skyHarborSummary.counts.strandedItems,
    recommendedRemediation: [
      "Keep SkyHarbor inactive until a future explicit operator promotion gate is enabled.",
      "Run Moves shadow proof before active promotion preview.",
    ],
    minimumFilesEvidenceNeeded: [],
    estimatedEffort: "low",
    nextAction:
      "Use SkyHarbor as the reference tenant for Moves shadow proof and candidate readiness control.",
    sourceDataFound: true,
    movesDataFound: true,
    towerDataFound: true,
    counts: {
      sourceFilesFound: input.row.sourcePacksFound.length,
      candidateRecordsGenerated:
        input.skyHarborCandidate.sourceCandidatePlan.canonicalRecordCount,
      targetOperationsPlanned:
        input.skyHarborCandidate.plannedWriteFootprint.operationsPlanned,
      unmappedFields: 0,
      quarantinedRecords:
        input.skyHarborCandidate.sourceCandidatePlan.quarantineOperationCount,
      strandedIntelligenceRecords:
        input.skyHarborStranded?.strandedItemCountAfterCandidateMetadata ??
        input.skyHarborSummary.counts.strandedItems,
    },
    moduleReadiness: input.skyHarborSummary.moduleReadinessSummary,
  };
}

function classifyInventoryStatus(
  row: TenantEligibilityMatrixRow,
  missingSourceClasses: string[],
): EligibilityStatus {
  if (row.sourcePacksFound.length === 0) return "not_enough_evidence";
  if (!row.sourceDataFound && !row.movesDataFound && !row.towerDataFound)
    return "not_enough_evidence";
  if (missingSourceClasses.length <= 3) return "partially_eligible";
  return "blocked";
}

function buildRemediation(
  row: TenantEligibilityMatrixRow,
  missingSourceClasses: string[],
): string[] {
  const actions = [
    "Create a standardized Tenant Packet manifest for this tenant.",
    "Map discovered source files to canonical source classes.",
    "Add tenant-specific source adapter mapping profiles.",
  ];
  if (!row.movesDataFound)
    actions.push(
      "Add or link Moves artifacts for current strategic initiatives.",
    );
  if (!row.towerDataFound)
    actions.push(
      "Add or link Tower value baseline and outcome metric evidence.",
    );
  if (!row.sourceDataFound)
    actions.push(
      "Add or link Source event, vendor, contract, pricing, or RFP evidence.",
    );
  if (missingSourceClasses.length > 0)
    actions.push(
      "Re-run the dry-run after missing evidence classes are supplied.",
    );
  return actions;
}

function normalizeInventoryBlocker(blocker: string): string {
  if (blocker.includes("PR10 inventories this tenant only")) {
    return "Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added.";
  }
  return blocker;
}

function buildMinimumEvidence(
  row: TenantEligibilityMatrixRow,
  missingSourceClasses: string[],
): string[] {
  const evidence = [
    "tenant-manifest.yaml",
    "enterprise-profile source file",
    "evidence-registry source file",
  ];
  if (!row.sourceDataFound)
    evidence.push("Source event/vendor/contract source file");
  if (!row.movesDataFound)
    evidence.push("Moves artifacts or initiative dossier");
  if (!row.towerDataFound)
    evidence.push("Tower value baseline or outcome metric file");
  if (missingSourceClasses.length > 0)
    evidence.push("mapping-profile coverage for each supplied source class");
  return evidence;
}

function estimateEffort(
  status: EligibilityStatus,
  missingSourceClasses: string[],
  missingMappings: string[],
): EstimatedEffort {
  if (status === "eligible") return "low";
  if (missingSourceClasses.length <= 3 && missingMappings.length <= 3)
    return "medium";
  return "high";
}

function buildRollup(
  tenants: TenantBatchRow[],
): AllTenantCandidateBatchReport["rollup"] {
  return {
    totalTenantsScanned: tenants.length,
    eligibleTenants: tenants.filter(
      (tenant) => tenant.readinessStatus === "eligible",
    ).length,
    partiallyEligibleTenants: tenants.filter(
      (tenant) => tenant.readinessStatus === "partially_eligible",
    ).length,
    blockedTenants: tenants.filter(
      (tenant) => tenant.readinessStatus === "blocked",
    ).length,
    notEnoughEvidenceTenants: tenants.filter(
      (tenant) => tenant.readinessStatus === "not_enough_evidence",
    ).length,
    totalSourceFilesFound: sum(
      tenants.map((tenant) => tenant.counts.sourceFilesFound),
    ),
    totalCandidateRecordsGenerated: sum(
      tenants.map((tenant) => tenant.counts.candidateRecordsGenerated),
    ),
    totalPlannedTargetOperations: sum(
      tenants.map((tenant) => tenant.counts.targetOperationsPlanned),
    ),
    totalUnmappedFields: sum(
      tenants.map((tenant) => tenant.counts.unmappedFields),
    ),
    totalQuarantinedRecords: sum(
      tenants.map((tenant) => tenant.counts.quarantinedRecords),
    ),
    totalStrandedIntelligenceRecords: sum(
      tenants.map((tenant) => tenant.counts.strandedIntelligenceRecords),
    ),
    moduleReadinessByTenant: Object.fromEntries(
      tenants.map((tenant) => [
        tenant.tenantKey,
        Object.fromEntries(
          tenant.moduleReadiness.map((module) => [
            module.module,
            module.evidenceAvailable &&
              module.factPlanAvailable &&
              module.graphPlanAvailable &&
              module.derivedPlanAvailable,
          ]),
        ),
      ]),
    ),
    topRecurringBlockers: topCounts(
      tenants.flatMap((tenant) => tenant.blockers),
    ),
    topRemediationActions: topActionCounts(
      tenants.flatMap((tenant) => tenant.recommendedRemediation),
    ),
  };
}

async function writeReport(
  repoRoot: string,
  outputDir: string,
  report: AllTenantCandidateBatchReport,
): Promise<void> {
  const absoluteOutputDir = path.resolve(repoRoot, outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-candidate-batch.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-candidate-batch-summary.md"),
    summaryMarkdown(report),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "tenant-remediation-matrix.csv"),
    remediationCsv(report.tenants),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-candidate-batch.html"),
    htmlReport(report),
  );
}

function validateGuardrails(report: AllTenantCandidateBatchReport): void {
  if (
    !report.dryRunOnly ||
    report.productionTenantDataWritten ||
    report.activeTenantAccessLayerUpdated ||
    report.candidatePromoted ||
    report.writesPhysicalTables ||
    report.moduleRuntimeConsumptionChanged ||
    report.candidateReadByDefault ||
    report.realizedValueClaimed
  ) {
    throw new Error(
      "All-tenant candidate batch violated a non-destructive guardrail.",
    );
  }
}

async function readJsonIfExists<T>(
  repoRoot: string,
  relativePath: string,
): Promise<T | undefined> {
  try {
    return JSON.parse(
      await fs.readFile(path.resolve(repoRoot, relativePath), "utf8"),
    ) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function findPathsContaining(
  repoRoot: string,
  roots: string[],
  aliases: string[],
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

function summaryMarkdown(report: AllTenantCandidateBatchReport): string {
  const rows = report.tenants
    .map(
      (tenant) =>
        `| ${tenant.tenantKey} | ${tenant.readinessStatus} | ${tenant.sourcePacksFound.length} | ${tenant.candidateMetadataEligibility} | ${tenant.sourceShadowProofEligibility} | ${tenant.movesShadowProofEligibility} | ${tenant.counts.candidateRecordsGenerated} | ${tenant.counts.targetOperationsPlanned} | ${tenant.blockers.join("; ") || "None"} |`,
    )
    .join("\n");
  return `# All-Tenant Candidate Batch Dry-Run

Generated: \`${report.generatedAt}\`

This report is non-destructive. It does not write production tenant data, update
active tenant access, promote candidates, write physical tables, change module
runtime behavior, make modules read candidate data by default, or claim realized
value.

## Rollup

- Tenants scanned: ${report.rollup.totalTenantsScanned}
- Eligible tenants: ${report.rollup.eligibleTenants}
- Partially eligible tenants: ${report.rollup.partiallyEligibleTenants}
- Blocked tenants: ${report.rollup.blockedTenants}
- Not enough evidence tenants: ${report.rollup.notEnoughEvidenceTenants}
- Source packs found: ${report.rollup.totalSourceFilesFound}
- Candidate records generated: ${report.rollup.totalCandidateRecordsGenerated}
- Planned target operations: ${report.rollup.totalPlannedTargetOperations}
- Unmapped fields: ${report.rollup.totalUnmappedFields}
- Quarantined records: ${report.rollup.totalQuarantinedRecords}
- Stranded intelligence records: ${report.rollup.totalStrandedIntelligenceRecords}

## Tenant Eligibility

<!-- prettier-ignore -->
| Tenant | Readiness | Source packs | Candidate metadata | Source shadow | Moves shadow | Candidate records | Target ops | Blockers |
| --- | --- | ---: | --- | --- | --- | ---: | ---: | --- |
${rows}

## Top Blockers

${report.rollup.topRecurringBlockers.map((item) => `- ${item.blocker} (${item.count})`).join("\n")}

## Top Remediation Actions

${report.rollup.topRemediationActions.map((item) => `- ${item.action} (${item.count})`).join("\n")}
`;
}

function remediationCsv(tenants: TenantBatchRow[]): string {
  return toCsv(
    [
      "tenant",
      "display_name",
      "source_packs_found",
      "source_data_found",
      "moves_data_found",
      "tower_data_found",
      "tenant_packet_availability",
      "adapter_eligibility",
      "canonical_ingestion_eligibility",
      "target_writer_dry_run_eligibility",
      "candidate_metadata_eligibility",
      "promotion_gate_eligibility",
      "module_readiness_preview_eligibility",
      "derived_plan_eligibility",
      "graph_plan_eligibility",
      "source_shadow_proof_eligibility",
      "moves_shadow_proof_eligibility",
      "readiness_status",
      "blockers",
      "missing_source_classes",
      "missing_mappings",
      "unmapped_fields",
      "quarantined_records",
      "stranded_intelligence_count",
      "recommended_remediation",
      "minimum_files_evidence_needed",
      "estimated_effort",
      "next_action",
    ],
    tenants.map((tenant) => ({
      tenant: tenant.tenantKey,
      display_name: tenant.displayName,
      source_packs_found: String(tenant.sourcePacksFound.length),
      source_data_found: String(tenant.sourceDataFound),
      moves_data_found: String(tenant.movesDataFound),
      tower_data_found: String(tenant.towerDataFound),
      tenant_packet_availability: tenant.tenantPacketAvailability,
      adapter_eligibility: tenant.adapterEligibility,
      canonical_ingestion_eligibility: tenant.canonicalIngestionEligibility,
      target_writer_dry_run_eligibility: tenant.targetWriterDryRunEligibility,
      candidate_metadata_eligibility: tenant.candidateMetadataEligibility,
      promotion_gate_eligibility: tenant.promotionGateEligibility,
      module_readiness_preview_eligibility:
        tenant.moduleReadinessPreviewEligibility,
      derived_plan_eligibility: tenant.derivedPlanEligibility,
      graph_plan_eligibility: tenant.graphPlanEligibility,
      source_shadow_proof_eligibility: tenant.sourceShadowProofEligibility,
      moves_shadow_proof_eligibility: tenant.movesShadowProofEligibility,
      readiness_status: tenant.readinessStatus,
      blockers: tenant.blockers.join("; "),
      missing_source_classes: tenant.missingSourceClasses.join("; "),
      missing_mappings: tenant.missingMappings.join("; "),
      unmapped_fields: tenant.unmappedFields.join("; "),
      quarantined_records: String(tenant.quarantinedRecords),
      stranded_intelligence_count: String(tenant.strandedIntelligenceCount),
      recommended_remediation: tenant.recommendedRemediation.join("; "),
      minimum_files_evidence_needed:
        tenant.minimumFilesEvidenceNeeded.join("; "),
      estimated_effort: tenant.estimatedEffort,
      next_action: tenant.nextAction,
    })),
  );
}

function htmlReport(report: AllTenantCandidateBatchReport): string {
  const cards = report.tenants
    .map(
      (tenant) => `<section class="tenant">
  <div>
    <p class="eyebrow">${escapeHtml(tenant.tenantKey)}</p>
    <h2>${escapeHtml(tenant.displayName)}</h2>
    <p class="status ${tenant.readinessStatus}">${tenant.readinessStatus}</p>
  </div>
  <dl>
    <div><dt>Source packs</dt><dd>${tenant.sourcePacksFound.length}</dd></div>
    <div><dt>Candidate records</dt><dd>${tenant.counts.candidateRecordsGenerated}</dd></div>
    <div><dt>Target ops</dt><dd>${tenant.counts.targetOperationsPlanned}</dd></div>
    <div><dt>Stranded</dt><dd>${tenant.strandedIntelligenceCount}</dd></div>
  </dl>
  <table>
    <tbody>
      <tr><th>Tenant Packet</th><td>${tenant.tenantPacketAvailability}</td></tr>
      <tr><th>Adapter</th><td>${tenant.adapterEligibility}</td></tr>
      <tr><th>Candidate metadata</th><td>${tenant.candidateMetadataEligibility}</td></tr>
      <tr><th>Source shadow</th><td>${tenant.sourceShadowProofEligibility}</td></tr>
      <tr><th>Moves shadow</th><td>${tenant.movesShadowProofEligibility}</td></tr>
    </tbody>
  </table>
  <h3>Next action</h3>
  <p>${escapeHtml(tenant.nextAction)}</p>
  <h3>Blockers</h3>
  <ul>${(tenant.blockers.length ? tenant.blockers : ["None"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
</section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>All-Tenant Candidate Batch Dry-Run</title>
<style>
body{margin:0;background:#f7f6f2;color:#171715;font-family:Arial,Helvetica,sans-serif}
main{max-width:1180px;margin:0 auto;padding:40px 28px}
h1,h2,h3{font-family:Georgia,'Times New Roman',serif}
h1{font-size:44px;margin:0 0 10px}
.lead{font-size:18px;color:#5f5a52;max-width:880px;line-height:1.5}
.rollup{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:28px 0}
.metric,.tenant{background:#fff;border:1px solid #dedbd3;border-radius:8px;padding:18px}
.metric b{display:block;font-size:30px}
.metric span,.eyebrow,dt{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#777168}
.tenant{margin:16px 0}
.tenant>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:18px}
.tenant h2{font-size:26px;margin:4px 0 0}
.status{border-radius:999px;padding:7px 11px;font-weight:700;background:#ece8df}
.status.eligible{background:#dff4eb;color:#106244}.status.partially_eligible{background:#fff0cc;color:#8a5a00}.status.blocked,.status.not_enough_evidence{background:#f8ded8;color:#8a2718}
dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}
dl div{background:#faf9f6;border:1px solid #ebe8df;border-radius:7px;padding:12px}
dd{font-size:24px;font-weight:700;margin:4px 0 0}
table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border-top:1px solid #e8e4db;padding:10px;text-align:left}th{width:220px}
li{margin:6px 0}
</style>
</head>
<body>
<main>
<p class="eyebrow">Shadow proof only - inactive candidate data</p>
<h1>All-Tenant Candidate Batch Dry-Run</h1>
<p class="lead">This control report shows which tenants can move through the candidate runway today, which tenants are blocked, and the minimum remediation needed. It does not promote candidates or change active runtime truth.</p>
<section class="rollup">
<div class="metric"><b>${report.rollup.totalTenantsScanned}</b><span>tenants</span></div>
<div class="metric"><b>${report.rollup.eligibleTenants}</b><span>eligible</span></div>
<div class="metric"><b>${report.rollup.partiallyEligibleTenants}</b><span>partial</span></div>
<div class="metric"><b>${report.rollup.blockedTenants}</b><span>blocked</span></div>
<div class="metric"><b>${report.rollup.totalCandidateRecordsGenerated}</b><span>candidate records</span></div>
</section>
${cards}
</main>
</body>
</html>
`;
}

function toCsv(headers: string[], rows: Record<string, string>[]): string {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvCell(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function topCounts(items: string[]): Array<{ blocker: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, 8)
    .map(([blocker, count]) => ({ blocker, count }));
}

function topActionCounts(
  items: string[],
): Array<{ action: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, 8)
    .map(([action, count]) => ({ action, count }));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
