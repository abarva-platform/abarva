import fs from "node:fs/promises";
import path from "node:path";

import type {
  TenantAdminHomeCaveat,
  TenantCandidateCoverage,
  TenantCanonicalFactQuality,
  TenantEvidenceQuality,
  TenantGeneratedDataRisk,
  TenantModuleReadinessQuality,
  TenantPromotionReadinessQuality,
  TenantQualityMatrixArtifact,
  TenantQualityMatrixRow,
  TenantRelationshipGraphQuality,
  TenantSourceEstateCoverage,
} from "@/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";

export type AdminDataQualityStatus =
  | "strong"
  | "partial"
  | "thin"
  | "blocked"
  | "not_available";

export interface AdminDataQualityGuardrails {
  productionTenantDataWritten: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  writesPhysicalTables: false;
  moduleRuntimeConsumptionChanged: false;
  moduleReadsCandidateByDefault: false;
  realizedValueClaimed: false;
}

export interface AdminDataQualityTenantDetail {
  tenantKey: string;
  tenantDisplayName: string;
  matrix: TenantQualityMatrixRow;
  sourceEstate: TenantSourceEstateCoverage | null;
  candidateCoverage: TenantCandidateCoverage | null;
  canonicalFactQuality: TenantCanonicalFactQuality | null;
  evidenceQuality: TenantEvidenceQuality | null;
  relationshipQuality: TenantRelationshipGraphQuality | null;
  generatedDataRisk: TenantGeneratedDataRisk | null;
  moduleReadiness: TenantModuleReadinessQuality | null;
  promotionReadiness: TenantPromotionReadinessQuality | null;
  adminHomeCaveat: TenantAdminHomeCaveat | null;
  sourceVsCandidateCoverage: {
    sourceStructuredRows: number;
    candidateRecordsGenerated: number;
    candidateCoverageRatio: number;
    sourceRichCandidateThin: boolean;
    falseGreenRisk: boolean;
    summary: string;
  };
  topBlocker: string;
  recommendedNextAction: string;
  warnings: string[];
  remediationActions: string[];
}

export interface AdminDataQualityControlModel {
  generatedAt: string;
  reportVersion: "admin-data-quality-control/v1";
  title: string;
  subtitle: string;
  guardrails: AdminDataQualityGuardrails;
  rollup: TenantQualityMatrixArtifact["rollup"];
  tenantQualityMatrix: TenantQualityMatrixRow[];
  tenantDetails: AdminDataQualityTenantDetail[];
  p0: string[];
  p1: string[];
  p2: string[];
}

interface TenantedArtifact<T> {
  generatedAt: string;
  tenants: T[];
}

const SOURCE_DIR = "reports/data-quality/all-tenants/latest";

const EMPTY_GUARDRAILS: AdminDataQualityGuardrails = {
  productionTenantDataWritten: false,
  activeTenantAccessLayerUpdated: false,
  candidatePromoted: false,
  writesPhysicalTables: false,
  moduleRuntimeConsumptionChanged: false,
  moduleReadsCandidateByDefault: false,
  realizedValueClaimed: false,
};

export async function buildAdminDataQualityControlModel(
  repoRoot: string,
): Promise<AdminDataQualityControlModel> {
  const matrix = await readRequiredJson<TenantQualityMatrixArtifact>(
    repoRoot,
    `${SOURCE_DIR}/tenant-quality-matrix.json`,
  );
  const sourceEstate = await readTenanted<TenantSourceEstateCoverage>(
    repoRoot,
    "source-estate-coverage.json",
  );
  const candidateCoverage = await readTenanted<TenantCandidateCoverage>(
    repoRoot,
    "candidate-coverage.json",
  );
  const canonicalFactQuality = await readTenanted<TenantCanonicalFactQuality>(
    repoRoot,
    "canonical-fact-quality.json",
  );
  const evidenceQuality = await readTenanted<TenantEvidenceQuality>(
    repoRoot,
    "evidence-quality.json",
  );
  const relationshipQuality = await readTenanted<TenantRelationshipGraphQuality>(
    repoRoot,
    "relationship-graph-quality.json",
  );
  const generatedDataRisk = await readTenanted<TenantGeneratedDataRisk>(
    repoRoot,
    "generated-data-risk.json",
  );
  const moduleReadiness = await readTenanted<TenantModuleReadinessQuality>(
    repoRoot,
    "module-readiness-quality.json",
  );
  const promotionReadiness = await readTenanted<TenantPromotionReadinessQuality>(
    repoRoot,
    "promotion-readiness-quality.json",
  );
  const adminHomeCaveats = await readTenanted<TenantAdminHomeCaveat>(
    repoRoot,
    "admin-home-caveats.json",
  );

  const tenantDetails = matrix.tenants.map((row) =>
    buildTenantDetail(row, {
      sourceEstate,
      candidateCoverage,
      canonicalFactQuality,
      evidenceQuality,
      relationshipQuality,
      generatedDataRisk,
      moduleReadiness,
      promotionReadiness,
      adminHomeCaveats,
    }),
  );
  const p0 = validateGuardrails(matrix.guardrails);
  const p1 = validateTenantReadiness(tenantDetails);
  const p2 = validateDisplayCompleteness(tenantDetails);

  return {
    generatedAt: matrix.generatedAt,
    reportVersion: "admin-data-quality-control/v1",
    title: "All-Tenant Data Quality Control Center",
    subtitle:
      "Read-only Admin view of source estate depth, candidate coverage, evidence, relationships, generated-data risk, module impact, and promotion blockers across every tenant.",
    guardrails: EMPTY_GUARDRAILS,
    rollup: matrix.rollup,
    tenantQualityMatrix: matrix.tenants,
    tenantDetails,
    p0,
    p1,
    p2,
  };
}

export async function writeAdminDataQualityProofArtifacts(
  model: AdminDataQualityControlModel,
  outputDir: string,
): Promise<Record<string, string>> {
  await fs.mkdir(outputDir, { recursive: true });
  const paths: Record<string, string> = {};
  await writeJson(paths, outputDir, "tenant-quality-matrix.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantQualityMatrix,
  });
  await writeJson(paths, outputDir, "tenant-detail-snapshots.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails,
  });
  await writeJson(paths, outputDir, "source-vs-candidate-coverage.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      ...tenant.sourceVsCandidateCoverage,
    })),
  });
  await writeJson(paths, outputDir, "evidence-quality-view.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      evidenceQuality: tenant.evidenceQuality,
    })),
  });
  await writeJson(paths, outputDir, "relationship-quality-view.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      relationshipQuality: tenant.relationshipQuality,
    })),
  });
  await writeJson(paths, outputDir, "module-readiness-impact.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      moduleReadiness: tenant.moduleReadiness,
    })),
  });
  await writeJson(paths, outputDir, "promotion-blockers-view.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      promotionReadiness: tenant.promotionReadiness,
      topBlocker: tenant.topBlocker,
      recommendedNextAction: tenant.recommendedNextAction,
      remediationActions: tenant.remediationActions,
    })),
  });
  await writeJson(paths, outputDir, "admin-home-caveats-view.json", {
    generatedAt: model.generatedAt,
    tenants: model.tenantDetails.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      adminHomeCaveat: tenant.adminHomeCaveat,
    })),
  });
  await writeJson(paths, outputDir, "guardrails.json", {
    generatedAt: model.generatedAt,
    guardrails: model.guardrails,
    p0: model.p0,
    p1: model.p1,
    p2: model.p2,
  });

  const summaryPath = path.join(outputDir, "summary.md");
  await fs.writeFile(summaryPath, buildSummaryMarkdown(model), "utf8");
  paths["summary.md"] = summaryPath;
  return paths;
}

export function mapAdminDataQualityStatus(status: string): AdminDataQualityStatus {
  if (status === "pass") return "strong";
  if (status === "watch") return "partial";
  if (status === "gap") return "thin";
  if (status === "blocked") return "blocked";
  return "not_available";
}

function buildTenantDetail(
  row: TenantQualityMatrixRow,
  collections: {
    sourceEstate: TenantSourceEstateCoverage[];
    candidateCoverage: TenantCandidateCoverage[];
    canonicalFactQuality: TenantCanonicalFactQuality[];
    evidenceQuality: TenantEvidenceQuality[];
    relationshipQuality: TenantRelationshipGraphQuality[];
    generatedDataRisk: TenantGeneratedDataRisk[];
    moduleReadiness: TenantModuleReadinessQuality[];
    promotionReadiness: TenantPromotionReadinessQuality[];
    adminHomeCaveats: TenantAdminHomeCaveat[];
  },
): AdminDataQualityTenantDetail {
  const sourceEstate = findByTenant(collections.sourceEstate, row.tenantKey);
  const candidateCoverage = findByTenant(collections.candidateCoverage, row.tenantKey);
  const canonicalFactQuality = findByTenant(
    collections.canonicalFactQuality,
    row.tenantKey,
  );
  const evidenceQuality = findByTenant(collections.evidenceQuality, row.tenantKey);
  const relationshipQuality = findByTenant(
    collections.relationshipQuality,
    row.tenantKey,
  );
  const generatedDataRisk = findByTenant(collections.generatedDataRisk, row.tenantKey);
  const moduleReadiness = findByTenant(collections.moduleReadiness, row.tenantKey);
  const promotionReadiness = findByTenant(
    collections.promotionReadiness,
    row.tenantKey,
  );
  const adminHomeCaveat = findByTenant(collections.adminHomeCaveats, row.tenantKey);

  const warnings = buildWarnings({
    row,
    sourceEstate,
    candidateCoverage,
    canonicalFactQuality,
    evidenceQuality,
    relationshipQuality,
    generatedDataRisk,
    moduleReadiness,
    promotionReadiness,
  });
  const remediationActions = [
    ...(promotionReadiness?.requiredBeforeActiveTruth ?? []),
    row.recommendedNextAction,
  ].filter(uniqueString);

  return {
    tenantKey: row.tenantKey,
    tenantDisplayName: row.tenantDisplayName,
    matrix: row,
    sourceEstate,
    candidateCoverage,
    canonicalFactQuality,
    evidenceQuality,
    relationshipQuality,
    generatedDataRisk,
    moduleReadiness,
    promotionReadiness,
    adminHomeCaveat,
    sourceVsCandidateCoverage: {
      sourceStructuredRows: sourceEstate?.structuredRowCount ?? row.sourceStructuredRows,
      candidateRecordsGenerated:
        candidateCoverage?.candidateRecordsGenerated ?? row.candidateRecordsGenerated,
      candidateCoverageRatio:
        candidateCoverage?.candidateCoverageRatio ?? row.candidateCoverageRatio,
      sourceRichCandidateThin: row.sourceRichCandidateThin,
      falseGreenRisk: row.falseGreenRisk,
      summary: buildCoverageSummary(row, sourceEstate, candidateCoverage),
    },
    topBlocker: chooseTopBlocker({
      row,
      candidateCoverage,
      relationshipQuality,
      generatedDataRisk,
      moduleReadiness,
      promotionReadiness,
      canonicalFactQuality,
      evidenceQuality,
    }),
    recommendedNextAction:
      promotionReadiness?.requiredBeforeActiveTruth[0] ??
      row.recommendedNextAction,
    warnings,
    remediationActions,
  };
}

function buildCoverageSummary(
  row: TenantQualityMatrixRow,
  sourceEstate: TenantSourceEstateCoverage | null,
  candidateCoverage: TenantCandidateCoverage | null,
): string {
  const sourceRows = sourceEstate?.structuredRowCount ?? row.sourceStructuredRows;
  const candidateRows =
    candidateCoverage?.candidateRecordsGenerated ?? row.candidateRecordsGenerated;
  const ratio = candidateCoverage?.candidateCoverageRatio ?? row.candidateCoverageRatio;
  if (row.sourceRichCandidateThin) {
    return `${formatNumber(sourceRows)} source rows exist, but only ${formatNumber(candidateRows)} candidate records are generated (${formatPercent(ratio)} coverage). Treat this as source-rich and candidate-thin.`;
  }
  return `${formatNumber(sourceRows)} source rows and ${formatNumber(candidateRows)} candidate records are visible in the latest read-only audit (${formatPercent(ratio)} coverage).`;
}

function buildWarnings(args: {
  row: TenantQualityMatrixRow;
  sourceEstate: TenantSourceEstateCoverage | null;
  candidateCoverage: TenantCandidateCoverage | null;
  canonicalFactQuality: TenantCanonicalFactQuality | null;
  evidenceQuality: TenantEvidenceQuality | null;
  relationshipQuality: TenantRelationshipGraphQuality | null;
  generatedDataRisk: TenantGeneratedDataRisk | null;
  moduleReadiness: TenantModuleReadinessQuality | null;
  promotionReadiness: TenantPromotionReadinessQuality | null;
}): string[] {
  const warnings: string[] = [];
  if (args.row.sourceRichCandidateThin) {
    warnings.push("Source-rich / candidate-thin: do not promote until candidate coverage expands.");
  }
  if (args.row.falseGreenRisk) {
    warnings.push("False-green risk: candidate state may look eligible while coverage is thin.");
  }
  if ((args.relationshipQuality?.relationshipOperationCount ?? 0) === 0) {
    warnings.push("Zero relationship operations: relationships are not ready for module use.");
  }
  if (args.evidenceQuality && args.evidenceQuality.status !== "pass") {
    warnings.push("Evidence linkage is incomplete or thin.");
  }
  if (args.generatedDataRisk?.status === "watch") {
    warnings.push("Generated or synthetic source material requires planning-grade caveats.");
  }
  if (args.canonicalFactQuality && args.canonicalFactQuality.status !== "pass") {
    warnings.push("Known-fact coverage is incomplete.");
  }
  if ((args.moduleReadiness?.runtimeReadyModules ?? 0) > 0) {
    warnings.push("Module runtime readiness is overclaimed in a candidate lane.");
  }
  if (args.promotionReadiness?.promotionUnsafe) {
    warnings.push("Promotion is unsafe until blockers and required-before-active items are closed.");
  }
  return warnings.filter(uniqueString);
}

function chooseTopBlocker(args: {
  row: TenantQualityMatrixRow;
  candidateCoverage: TenantCandidateCoverage | null;
  relationshipQuality: TenantRelationshipGraphQuality | null;
  generatedDataRisk: TenantGeneratedDataRisk | null;
  moduleReadiness: TenantModuleReadinessQuality | null;
  promotionReadiness: TenantPromotionReadinessQuality | null;
  canonicalFactQuality: TenantCanonicalFactQuality | null;
  evidenceQuality: TenantEvidenceQuality | null;
}): string {
  return (
    args.promotionReadiness?.requiredBeforeActiveTruth[0] ??
    args.promotionReadiness?.blockers[0] ??
    args.candidateCoverage?.blockers[0] ??
    args.relationshipQuality?.findings[0] ??
    args.canonicalFactQuality?.findings[0] ??
    args.evidenceQuality?.findings[0] ??
    args.generatedDataRisk?.findings[0] ??
    args.moduleReadiness?.findings[0] ??
    args.row.recommendedNextAction ??
    "No blocker surfaced by the latest read-only audit."
  );
}

function validateGuardrails(guardrails: TenantQualityMatrixArtifact["guardrails"]): string[] {
  const p0: string[] = [];
  const expectedFalse = [
    "productionTenantDataWritten",
    "activeTenantAccessLayerUpdated",
    "candidatePromoted",
    "writesPhysicalTables",
    "moduleRuntimeConsumptionChanged",
    "moduleReadsCandidateByDefault",
    "realizedValueClaimed",
  ] as const;
  for (const key of expectedFalse) {
    if (guardrails[key] !== false) {
      p0.push(`${key} must remain false for the Admin data-quality view.`);
    }
  }
  return p0;
}

function validateTenantReadiness(details: AdminDataQualityTenantDetail[]): string[] {
  const p1: string[] = [];
  if (details.length === 0) p1.push("No tenants are visible in the quality matrix.");
  for (const tenant of details) {
    if (
      tenant.matrix.sourceRichCandidateThin &&
      tenant.matrix.promotionReadinessStatus === "pass"
    ) {
      p1.push(`${tenant.tenantDisplayName} is source-rich/candidate-thin but promotion shows pass.`);
    }
    if (tenant.matrix.promotionUnsafe === false && tenant.warnings.length > 0) {
      p1.push(`${tenant.tenantDisplayName} has warnings but is not promotion-unsafe.`);
    }
  }
  return p1;
}

function validateDisplayCompleteness(details: AdminDataQualityTenantDetail[]): string[] {
  const p2: string[] = [];
  for (const tenant of details) {
    if (!tenant.sourceEstate) p2.push(`${tenant.tenantDisplayName}: source estate artifact missing.`);
    if (!tenant.candidateCoverage) p2.push(`${tenant.tenantDisplayName}: candidate coverage artifact missing.`);
    if (!tenant.evidenceQuality) p2.push(`${tenant.tenantDisplayName}: evidence quality artifact missing.`);
    if (!tenant.relationshipQuality) p2.push(`${tenant.tenantDisplayName}: relationship quality artifact missing.`);
    if (!tenant.adminHomeCaveat) p2.push(`${tenant.tenantDisplayName}: Admin/Home caveat artifact missing.`);
  }
  return p2;
}

async function readTenanted<T>(repoRoot: string, fileName: string): Promise<T[]> {
  const artifact = await readRequiredJson<TenantedArtifact<T>>(
    repoRoot,
    `${SOURCE_DIR}/${fileName}`,
  );
  return artifact.tenants;
}

async function readRequiredJson<T>(repoRoot: string, relativePath: string): Promise<T> {
  const absolutePath = path.join(repoRoot, relativePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

function findByTenant<T extends { tenantKey: string }>(
  collection: T[],
  tenantKey: string,
): T | null {
  return collection.find((item) => item.tenantKey === tenantKey) ?? null;
}

async function writeJson(
  paths: Record<string, string>,
  outputDir: string,
  fileName: string,
  payload: unknown,
): Promise<void> {
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  paths[fileName] = filePath;
}

function buildSummaryMarkdown(model: AdminDataQualityControlModel): string {
  const rows = model.tenantDetails
    .map(
      (tenant) =>
        `| ${tenant.tenantDisplayName} | ${tenant.matrix.overallStatus} | ${tenant.matrix.sourceRichnessScore} | ${formatPercent(tenant.matrix.candidateCoverageRatio)} | ${tenant.matrix.relationshipOperationCount} | ${tenant.matrix.promotionReadinessStatus} | ${tenant.topBlocker} |`,
    )
    .join("\n");

  return `# Admin Data Quality Control Center

Generated: \`${model.generatedAt}\`

This is an Admin-only, read-only control-center proof. It does not write
production tenant data, promote a candidate, update Active Tenant Access, or
change module runtime behavior.

## Rollup

- Tenants shown: ${model.tenantDetails.length}
- Source-rich / candidate-thin tenants: ${model.rollup.sourceRichCandidateThinTenants}
- False-green risk tenants: ${model.rollup.falseGreenRiskTenants}
- Relationship gap tenants: ${model.rollup.relationshipGapTenants}
- Promotion-unsafe tenants: ${model.rollup.promotionUnsafeTenants}
- Generated-data watch tenants: ${model.rollup.generatedDataWatchTenants}

## Quality Matrix

| Tenant | Overall | Source score | Candidate coverage | Relationship ops | Promotion | Top blocker |
| --- | --- | ---: | ---: | ---: | --- | --- |
${rows}

## Guardrails

- Production tenant data written: ${model.guardrails.productionTenantDataWritten}
- Active Tenant Access updated: ${model.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${model.guardrails.candidatePromoted}
- Module runtime changed: ${model.guardrails.moduleRuntimeConsumptionChanged}
- Module reads candidate by default: ${model.guardrails.moduleReadsCandidateByDefault}
- Realized value claimed: ${model.guardrails.realizedValueClaimed}

## Validation Findings

- P0: ${model.p0.length === 0 ? "None" : model.p0.join("; ")}
- P1: ${model.p1.length === 0 ? "None" : model.p1.join("; ")}
- P2: ${model.p2.length === 0 ? "None" : model.p2.join("; ")}
`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function uniqueString(value: string, index: number, array: string[]): boolean {
  return value.trim().length > 0 && array.indexOf(value) === index;
}
