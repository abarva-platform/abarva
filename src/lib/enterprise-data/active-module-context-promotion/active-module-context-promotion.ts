import fs from "node:fs/promises";
import path from "node:path";

import type { ActiveTenantAccessRecord } from "../active-tenant-access-promotion/active-tenant-access-promotion";
import {
  buildCandidateVersionBuildReport,
  CANDIDATE_VERSION_BUILD_REPORT_DIR,
  type TenantCandidateVersion,
} from "../candidate-version-build/candidate-version-build";
import type {
  ModuleContextReadRequest,
  ServedModuleContextPacket,
} from "../contracts/module-context-apis";
import { getModuleContext } from "../module-context-serving/module-context-serving";

const MODULES: Array<ModuleContextReadRequest["moduleKey"]> = [
  "home",
  "intelligence",
  "moves",
  "source",
  "tower",
];

const TENANT_INPUT_REGISTRY_PATH =
  "datasets/tenant-inputs/tenant-input-registry.json";

const ACTIVE_TENANT_OUTPUT_SLUGS: Record<string, string> = {
  "apex-retail": "apexretail",
  "first-capital-financial": "firstcapital",
  "lakeshore-holdings": "lakeshore",
  "lakeshore-industries": "lakeshore-industries",
  "meridian-health": "meridian",
  "skyharbor-air": "skyharbor",
};

export interface ActiveModuleContextPromotionOptions {
  repoRoot: string;
  tenantKey: string;
  outputSlug: string;
  generatedAt?: string;
  priorActiveVersionId?: string;
}

export interface AllTenantActiveModuleContextPromotionReport {
  reportVersion: "all-tenant-active-module-context-promotion/v1";
  generatedAt: string;
  activeTenantCount: number;
  retiredTenantKeys: string[];
  guardrails: {
    productionTenantDataWritten: false;
    writesPhysicalTables: false;
    activeTenantAccessLayerUpdated: true;
    candidatePromotedToActiveAccessMetadata: true;
    moduleRuntimeConsumptionChanged: false;
    moduleDefaultReadsCandidateData: false;
    realizedValueClaimed: false;
    northstarExcluded: true;
  };
  tenantPromotions: ActiveModuleContextPromotionReport[];
  tenantMatrix: Array<{
    tenantKey: string;
    outputSlug: string;
    candidateVersionId: string;
    canonicalRecordCount: number;
    evidenceAttachmentCount: number;
    relationshipCandidateCount: number;
    enterpriseProfileStatus: "ready";
    moduleProofStatus: "pass";
  }>;
  outputPaths: {
    outputDir: string;
    reportPath: string;
    summaryPath: string;
  };
}

export interface ActiveModuleContextPromotionReport {
  reportVersion: "active-module-context-promotion/v1";
  generatedAt: string;
  tenantKey: string;
  candidateVersionId: string;
  activeAccessRecord: ActiveTenantAccessRecord;
  guardrails: {
    selectedTenantOnly: true;
    productionTenantDataWritten: false;
    writesPhysicalTables: false;
    activeTenantAccessLayerUpdated: true;
    candidatePromotedToActiveAccessMetadata: true;
    moduleRuntimeConsumptionChanged: false;
    moduleDefaultReadsCandidateData: false;
    realizedValueClaimed: false;
  };
  quality: {
    candidateQualityGateStatus: "pass";
    candidateCreationStatus: "created";
    promotionBlockers: [];
    canonicalRecordCount: number;
    evidenceAttachmentCount: number;
    relationshipCandidateCount: number;
    enterpriseProfileStatus: "ready";
  };
  moduleReadProof: Array<{
    moduleKey: ModuleContextReadRequest["moduleKey"];
    sourceMode: ServedModuleContextPacket["sourceMode"];
    activeTenantAccessVersionId: string | null;
    recordCount: number;
    evidenceRefCount: number;
    candidateDataConsumed: boolean;
    moduleRuntimeConsumptionChanged: boolean;
    readinessStatus: string;
    contextCompletenessOverall: string;
  }>;
  outputPaths: {
    outputDir: string;
    activeAccessRecordPath: string;
    promotionReportPath: string;
    moduleReadProofPath: string;
    summaryPath: string;
  };
}

type PromotionReadyCandidate = TenantCandidateVersion & {
  qualityGateStatus: "pass";
  creationStatus: "created";
  enterpriseProfileStatus: "ready";
  promotionBlockers: [];
};

export async function buildActiveModuleContextPromotion(
  options: ActiveModuleContextPromotionOptions,
): Promise<ActiveModuleContextPromotionReport> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const candidateReport = await buildCandidateVersionBuildReport({
    repoRoot: options.repoRoot,
    outputDir: CANDIDATE_VERSION_BUILD_REPORT_DIR,
    generatedAt,
  });
  const candidate = candidateReport.candidateVersions.find(
    (entry) => entry.tenantKey === options.tenantKey,
  );
  if (!candidate) {
    throw new Error(`No candidate version found for ${options.tenantKey}.`);
  }
  validateCandidate(candidate);

  const outputDir = `reports/active-tenant-access/${options.outputSlug}`;
  const priorActiveVersionId =
    options.priorActiveVersionId ??
    `${options.tenantKey}:active-runtime-truth:unchanged`;
  const activeAccessRecord: ActiveTenantAccessRecord = {
    recordVersion: "active-tenant-access/v1",
    generatedAt,
    tenantKey: options.tenantKey,
    activeVersionId: candidate.candidateVersionId,
    priorActiveVersionId,
    sourceCandidateVersionId: candidate.candidateVersionId,
    activeAccessState: "promoted_for_safe_demo_metadata",
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    moduleRuntimeConsumptionChanged: false,
    moduleDefaultReadsCandidateData: false,
    rollbackTargetVersionId: priorActiveVersionId,
    rollbackProofPath: `${outputDir}/rollback-proof.md`,
  };

  await writeActiveAccessRecord({
    repoRoot: options.repoRoot,
    outputDir,
    activeAccessRecord,
  });

  const moduleReadProof = await buildModuleReadProof({
    repoRoot: options.repoRoot,
    tenantKey: options.tenantKey,
    generatedAt,
  });

  const report: ActiveModuleContextPromotionReport = {
    reportVersion: "active-module-context-promotion/v1",
    generatedAt,
    tenantKey: options.tenantKey,
    candidateVersionId: candidate.candidateVersionId,
    activeAccessRecord,
    guardrails: {
      selectedTenantOnly: true,
      productionTenantDataWritten: false,
      writesPhysicalTables: false,
      activeTenantAccessLayerUpdated: true,
      candidatePromotedToActiveAccessMetadata: true,
      moduleRuntimeConsumptionChanged: false,
      moduleDefaultReadsCandidateData: false,
      realizedValueClaimed: false,
    },
    quality: {
      candidateQualityGateStatus: candidate.qualityGateStatus,
      candidateCreationStatus: candidate.creationStatus,
      promotionBlockers: [],
      canonicalRecordCount: candidate.canonicalRecordCount,
      evidenceAttachmentCount: candidate.evidenceAttachmentCount,
      relationshipCandidateCount: candidate.relationshipCandidateCount,
      enterpriseProfileStatus: candidate.enterpriseProfileStatus,
    },
    moduleReadProof,
    outputPaths: {
      outputDir,
      activeAccessRecordPath: `${outputDir}/active-tenant-access-record.json`,
      promotionReportPath: `${outputDir}/active-module-context-promotion.json`,
      moduleReadProofPath: `${outputDir}/module-context-read-proof.json`,
      summaryPath: `${outputDir}/active-module-context-promotion.md`,
    },
  };
  validateReport(report);
  await writeReport(options.repoRoot, report);
  return report;
}

export async function buildAllTenantActiveModuleContextPromotions(options: {
  repoRoot: string;
  generatedAt?: string;
}): Promise<AllTenantActiveModuleContextPromotionReport> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const registry = await readTenantInputRegistry(options.repoRoot);
  const activeTenantKeys = registry.activeTenants.map((tenant) => tenant.tenantKey);
  const retiredTenantKeys = registry.retiredTenants.map((tenant) => tenant.tenantKey);
  if (activeTenantKeys.some((tenantKey) => /northstar/i.test(tenantKey))) {
    throw new Error("Northstar appears in active tenant registry.");
  }

  const missingSlugs = activeTenantKeys.filter(
    (tenantKey) => !ACTIVE_TENANT_OUTPUT_SLUGS[tenantKey],
  );
  if (missingSlugs.length > 0) {
    throw new Error(
      `Missing active module-context output slugs for: ${missingSlugs.join(", ")}`,
    );
  }

  const tenantPromotions = [];
  for (const tenantKey of activeTenantKeys) {
    tenantPromotions.push(
      await buildActiveModuleContextPromotion({
        repoRoot: options.repoRoot,
        tenantKey,
        outputSlug: ACTIVE_TENANT_OUTPUT_SLUGS[tenantKey],
        generatedAt,
      }),
    );
  }

  const outputDir = "reports/active-tenant-access/all-tenants";
  const report: AllTenantActiveModuleContextPromotionReport = {
    reportVersion: "all-tenant-active-module-context-promotion/v1",
    generatedAt,
    activeTenantCount: activeTenantKeys.length,
    retiredTenantKeys,
    guardrails: {
      productionTenantDataWritten: false,
      writesPhysicalTables: false,
      activeTenantAccessLayerUpdated: true,
      candidatePromotedToActiveAccessMetadata: true,
      moduleRuntimeConsumptionChanged: false,
      moduleDefaultReadsCandidateData: false,
      realizedValueClaimed: false,
      northstarExcluded: true,
    },
    tenantPromotions,
    tenantMatrix: tenantPromotions.map((promotion) => ({
      tenantKey: promotion.tenantKey,
      outputSlug: ACTIVE_TENANT_OUTPUT_SLUGS[promotion.tenantKey],
      candidateVersionId: promotion.candidateVersionId,
      canonicalRecordCount: promotion.quality.canonicalRecordCount,
      evidenceAttachmentCount: promotion.quality.evidenceAttachmentCount,
      relationshipCandidateCount: promotion.quality.relationshipCandidateCount,
      enterpriseProfileStatus: promotion.quality.enterpriseProfileStatus,
      moduleProofStatus: "pass",
    })),
    outputPaths: {
      outputDir,
      reportPath: `${outputDir}/all-tenant-active-module-context-promotion.json`,
      summaryPath: `${outputDir}/all-tenant-active-module-context-promotion.md`,
    },
  };
  validateAllTenantReport(report);
  await writeAllTenantReport(options.repoRoot, report);
  return report;
}

function validateCandidate(candidate: TenantCandidateVersion): asserts candidate is PromotionReadyCandidate {
  if (candidate.qualityGateStatus !== "pass") {
    throw new Error(`${candidate.tenantKey} candidate quality gate is not pass.`);
  }
  if (candidate.creationStatus !== "created") {
    throw new Error(`${candidate.tenantKey} candidate was not created.`);
  }
  if (candidate.enterpriseProfileStatus !== "ready") {
    throw new Error(
      `${candidate.tenantKey} enterprise profile is ${candidate.enterpriseProfileStatus}.`,
    );
  }
  if (candidate.promotionBlockers.length > 0) {
    throw new Error(
      `${candidate.tenantKey} still has promotion blockers: ${candidate.promotionBlockers.join("; ")}`,
    );
  }
  if (candidate.guardrails.productionTenantDataWritten) {
    throw new Error("Candidate build wrote production tenant data.");
  }
  if (candidate.guardrails.moduleReadsCandidateByDefault) {
    throw new Error("Candidate build allows default module candidate reads.");
  }
}

async function writeActiveAccessRecord(input: {
  repoRoot: string;
  outputDir: string;
  activeAccessRecord: ActiveTenantAccessRecord;
}): Promise<void> {
  const absoluteOutputDir = path.resolve(input.repoRoot, input.outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "active-tenant-access-record.json"),
    `${JSON.stringify(input.activeAccessRecord, null, 2)}\n`,
  );
}

async function buildModuleReadProof(input: {
  repoRoot: string;
  tenantKey: string;
  generatedAt: string;
}): Promise<ActiveModuleContextPromotionReport["moduleReadProof"]> {
  const rows = [];
  for (const moduleKey of MODULES) {
    const packet = await getModuleContext(
      {
        tenantKey: input.tenantKey,
        moduleKey,
        purpose: moduleKey === "home" ? "context_summary" : "answer_context",
        requestedDomains: [
          "enterprise_profile",
          "functions",
          "applications_systems",
          "vendors_contracts",
          "data_assets_integrations",
          "programs_priorities",
          "risks_controls",
          "metrics_outcomes",
        ],
        relationshipPolicy: "validated_only",
      },
      {
        repoRoot: input.repoRoot,
        generatedAt: input.generatedAt,
      },
    );
    rows.push({
      moduleKey,
      sourceMode: packet.sourceMode,
      activeTenantAccessVersionId: packet.activeTenantAccessVersionId,
      recordCount: packet.records.length,
      evidenceRefCount: packet.evidenceRefs.length,
      candidateDataConsumed: packet.guardrails.candidateDataConsumed,
      moduleRuntimeConsumptionChanged:
        packet.guardrails.moduleRuntimeConsumptionChanged,
      readinessStatus: packet.readiness.status,
      contextCompletenessOverall: packet.contextCompleteness.overall,
    });
  }
  return rows;
}

function validateReport(report: ActiveModuleContextPromotionReport): void {
  const allModuleReadsPass = report.moduleReadProof.every(
    (row) =>
      row.sourceMode === "active_tenant_access" &&
      row.activeTenantAccessVersionId === report.candidateVersionId &&
      row.recordCount > 0 &&
      row.evidenceRefCount > 0 &&
      !row.candidateDataConsumed &&
      !row.moduleRuntimeConsumptionChanged,
  );
  if (
    !allModuleReadsPass ||
    report.guardrails.productionTenantDataWritten ||
    report.guardrails.writesPhysicalTables ||
    !report.guardrails.activeTenantAccessLayerUpdated ||
    report.guardrails.moduleRuntimeConsumptionChanged ||
    report.guardrails.moduleDefaultReadsCandidateData ||
    report.guardrails.realizedValueClaimed
  ) {
    throw new Error("Active module context promotion proof failed guardrails.");
  }
}

function validateAllTenantReport(
  report: AllTenantActiveModuleContextPromotionReport,
): void {
  const allTenantsPass =
    report.activeTenantCount === report.tenantPromotions.length &&
    report.tenantPromotions.every(
      (promotion) =>
        promotion.quality.enterpriseProfileStatus === "ready" &&
        promotion.quality.promotionBlockers.length === 0 &&
        promotion.moduleReadProof.every(
          (row) =>
            row.sourceMode === "active_tenant_access" &&
            row.activeTenantAccessVersionId === promotion.candidateVersionId &&
            !row.candidateDataConsumed &&
            !row.moduleRuntimeConsumptionChanged,
        ),
    );
  if (
    !allTenantsPass ||
    !report.retiredTenantKeys.some((tenantKey) => /northstar/i.test(tenantKey)) ||
    report.guardrails.productionTenantDataWritten ||
    report.guardrails.writesPhysicalTables ||
    report.guardrails.moduleRuntimeConsumptionChanged ||
    report.guardrails.moduleDefaultReadsCandidateData ||
    report.guardrails.realizedValueClaimed
  ) {
    throw new Error("All-tenant active module context promotion proof failed.");
  }
}

async function writeReport(
  repoRoot: string,
  report: ActiveModuleContextPromotionReport,
): Promise<void> {
  const absoluteOutputDir = path.resolve(repoRoot, report.outputPaths.outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "active-module-context-promotion.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "module-context-read-proof.json"),
    `${JSON.stringify(report.moduleReadProof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "active-module-context-promotion.md"),
    markdownReport(report),
  );
}

function markdownReport(report: ActiveModuleContextPromotionReport): string {
  return `# Active Module Context Promotion - ${report.tenantKey}

Generated: \`${report.generatedAt}\`

This promotes a reviewed candidate metadata pointer into Active Tenant Access for
the selected safe demo tenant only. It does not write production tenant data,
write physical tables, change module runtime behavior, make modules read
candidate data by default, or claim realized value.

## Quality

- Candidate version: \`${report.candidateVersionId}\`
- Enterprise profile: ${report.quality.enterpriseProfileStatus}
- Canonical records: ${report.quality.canonicalRecordCount}
- Evidence attachments: ${report.quality.evidenceAttachmentCount}
- Relationship candidates: ${report.quality.relationshipCandidateCount}
- Promotion blockers: ${report.quality.promotionBlockers.length}

## Module Read Proof

${report.moduleReadProof
  .map(
    (row) =>
      `- ${row.moduleKey}: ${row.sourceMode}, records ${row.recordCount}, evidence ${row.evidenceRefCount}, candidate consumed ${row.candidateDataConsumed}`,
  )
  .join("\n")}

## Guardrails

- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Physical table writes: ${report.guardrails.writesPhysicalTables}
- Module runtime consumption changed: ${report.guardrails.moduleRuntimeConsumptionChanged}
- Default module candidate reads: ${report.guardrails.moduleDefaultReadsCandidateData}
`;
}

async function readTenantInputRegistry(repoRoot: string): Promise<{
  activeTenants: Array<{ tenantKey: string }>;
  retiredTenants: Array<{ tenantKey: string }>;
}> {
  const text = await fs.readFile(
    path.resolve(repoRoot, TENANT_INPUT_REGISTRY_PATH),
    "utf8",
  );
  return JSON.parse(text) as {
    activeTenants: Array<{ tenantKey: string }>;
    retiredTenants: Array<{ tenantKey: string }>;
  };
}

async function writeAllTenantReport(
  repoRoot: string,
  report: AllTenantActiveModuleContextPromotionReport,
): Promise<void> {
  const absoluteOutputDir = path.resolve(repoRoot, report.outputPaths.outputDir);
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-active-module-context-promotion.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-active-module-context-promotion.md"),
    allTenantMarkdownReport(report),
  );
}

function allTenantMarkdownReport(
  report: AllTenantActiveModuleContextPromotionReport,
): string {
  return `# All-Tenant Active Module Context Promotion

Generated: \`${report.generatedAt}\`

This report proves every active tenant in the universal tenant-input registry has
an Active Tenant Access metadata pointer and module-context read proof. Northstar
is retired/excluded and is not processed as an active tenant.

## Guardrails

- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Physical table writes: ${report.guardrails.writesPhysicalTables}
- Module runtime consumption changed: ${report.guardrails.moduleRuntimeConsumptionChanged}
- Default module candidate reads: ${report.guardrails.moduleDefaultReadsCandidateData}
- Realized value claimed: ${report.guardrails.realizedValueClaimed}
- Northstar excluded: ${report.guardrails.northstarExcluded}

## Tenant Matrix

| Tenant | Candidate | Canonical records | Evidence | Relationships | Profile | Module proof |
| --- | --- | ---: | ---: | ---: | --- | --- |
${report.tenantMatrix
  .map(
    (row) =>
      `| ${row.tenantKey} | \`${row.candidateVersionId}\` | ${row.canonicalRecordCount.toLocaleString()} | ${row.evidenceAttachmentCount.toLocaleString()} | ${row.relationshipCandidateCount.toLocaleString()} | ${row.enterpriseProfileStatus} | ${row.moduleProofStatus} |`,
  )
  .join("\n")}

## Retired / Excluded

${report.retiredTenantKeys.map((tenantKey) => `- ${tenantKey}`).join("\n")}
`;
}
