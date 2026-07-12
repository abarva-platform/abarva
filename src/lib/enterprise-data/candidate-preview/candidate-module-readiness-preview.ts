import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";
import type { TenantPacketModule } from "../contracts/tenant-packet";
import type { ModuleReadinessProof } from "../proof-harness/module-readiness-proof";
import type { CandidateModulePreviewSummary } from "./candidate-module-preview";

type PreviewModule = Extract<
  TenantPacketModule,
  "home" | "intelligence" | "moves" | "source" | "tower"
>;
type CandidatePreviewPacketModule =
  CandidateModulePreviewSummary["requestedModules"][number];

type ReadinessStatus =
  | "preview_packet_available"
  | "candidate_context_available"
  | "blocked_missing_derived_plan"
  | "blocked_missing_candidate_context";

interface PromotionGateDecisionRecord {
  decision?: string;
  promotionEnabled?: boolean;
  activePromotionAttempted?: boolean;
  activeTenantAccessLayerUpdated?: boolean;
  writesPhysicalTables?: boolean;
  moduleRuntimeConsumptionChanged?: boolean;
  noModuleReadsCandidateByDefault?: boolean;
  failedChecks?: string[];
  blockers?: string[];
}

interface PromotionGateResult {
  decisionRecord?: PromotionGateDecisionRecord;
}

interface TenantEligibilityMatrixRow {
  tenant: string;
  tenantDisplayName: string;
  sourcePacksFound: string[];
  sourceDataFound: boolean;
  movesDataFound: boolean;
  towerDataFound: boolean;
  requiredMappingsAvailable: boolean;
  candidateGenerationStatus: string;
  blockers: string[];
}

interface WorkbenchPreviewSummary {
  requestedModules?: Array<"moves" | "source" | "tower">;
}

interface ModuleDerivedPlanStage {
  derivedEntries: Array<{
    targetModules: TenantPacketModule[];
  }>;
}

interface ReadinessGuardrails {
  dryRunOnly: true;
  readOnlyPreview: true;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  candidatePromoted: false;
  moduleRuntimeRoutesChanged: false;
  noModuleReadsCandidateByDefault: boolean;
}

export interface CandidateModuleReadinessPreviewRow {
  module: PreviewModule;
  evidenceAvailable: boolean;
  factPlanAvailable: boolean;
  graphPlanAvailable: boolean;
  derivedPlanAvailable: boolean;
  previewPacketAvailable: boolean;
  runtimeConsumptionReady: false;
  readinessStatus: ReadinessStatus;
  blockers: string[];
  nextProofNeeded: string;
}

export interface CandidateModuleReadinessPreviewSummary {
  resultVersion: "candidate-module-readiness-preview/v1";
  tenantKey: string;
  candidateVersionKey: string;
  generatedAt: string;
  qualityGateStatus: "pass" | "fail";
  guardrails: ReadinessGuardrails;
  counts: {
    modulesEvaluated: number;
    previewPacketModules: number;
    candidateContextModules: number;
    blockedModules: number;
    runtimeReadyModules: 0;
    otherTenantsInventoried: number;
  };
  promotionGate: {
    decision: string;
    promotionEnabled: false;
    failedChecks: number;
    blockers: number;
  };
  outputPaths: {
    readinessPreviewPath: string;
    readinessMatrixCsvPath: string;
    readinessSummaryPath: string;
    readinessSummaryMdPath: string;
  };
}

export interface CandidateModuleReadinessPreview {
  summary: CandidateModuleReadinessPreviewSummary;
  moduleReadiness: CandidateModuleReadinessPreviewRow[];
  allTenantInventorySnapshot: Array<{
    tenant: string;
    tenantDisplayName: string;
    candidateGenerationStatus: string;
    requiredMappingsAvailable: boolean;
    sourceDataFound: boolean;
    movesDataFound: boolean;
    towerDataFound: boolean;
    blockerCount: number;
  }>;
}

export interface CandidateModuleReadinessPreviewOptions {
  repoRoot: string;
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  candidateModulePreviewSummaryPath?: string;
  promotionGatePath?: string;
  tenantEligibilityMatrixPath?: string;
  moduleTargetedDerivedPlanPath?: string;
  workbenchPreviewSummaryPath?: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_MODULE_READINESS_PROOF_PATH =
  "reports/module-readiness-proof/skyharbor/module-readiness-proof.json";
const DEFAULT_CANDIDATE_MODULE_PREVIEW_SUMMARY_PATH =
  "reports/candidate-module-previews/skyharbor/preview-summary.json";
const DEFAULT_PROMOTION_GATE_PATH =
  "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json";
const DEFAULT_TENANT_ELIGIBILITY_MATRIX_PATH =
  "reports/tenant-candidate-generation/all-tenant-eligibility-matrix.json";
const DEFAULT_MODULE_TARGETED_DERIVED_PLAN_PATH =
  "reports/candidate-module-derived-plans/skyharbor/module-derived-plan-stage.json";
const DEFAULT_WORKBENCH_PREVIEW_SUMMARY_PATH =
  "reports/candidate-module-workbench-previews/skyharbor/preview-summary.json";
const DEFAULT_OUTPUT_DIR =
  "reports/candidate-module-readiness-previews/skyharbor";
const MODULES: PreviewModule[] = [
  "home",
  "intelligence",
  "moves",
  "source",
  "tower",
];

export async function buildCandidateModuleReadinessPreview(
  options: CandidateModuleReadinessPreviewOptions,
): Promise<CandidateModuleReadinessPreview> {
  const candidateRecord = await readJson<CandidateTenantDataVersionRecord>(
    resolve(
      options,
      options.candidateRecordPath,
      DEFAULT_CANDIDATE_RECORD_PATH,
    ),
  );
  const moduleProof = await readJson<ModuleReadinessProof>(
    resolve(
      options,
      options.moduleReadinessProofPath,
      DEFAULT_MODULE_READINESS_PROOF_PATH,
    ),
  );
  const modulePreviewSummary = await readJson<CandidateModulePreviewSummary>(
    resolve(
      options,
      options.candidateModulePreviewSummaryPath,
      DEFAULT_CANDIDATE_MODULE_PREVIEW_SUMMARY_PATH,
    ),
  );
  const promotionGate = await readJson<PromotionGateResult>(
    resolve(options, options.promotionGatePath, DEFAULT_PROMOTION_GATE_PATH),
  );
  const tenantMatrix = await readJson<TenantEligibilityMatrixRow[]>(
    resolve(
      options,
      options.tenantEligibilityMatrixPath,
      DEFAULT_TENANT_ELIGIBILITY_MATRIX_PATH,
    ),
  );
  const moduleTargetedDerivedPlan =
    await readOptionalJson<ModuleDerivedPlanStage>(
      resolve(
        options,
        options.moduleTargetedDerivedPlanPath,
        DEFAULT_MODULE_TARGETED_DERIVED_PLAN_PATH,
      ),
    );
  const workbenchPreviewSummary =
    await readOptionalJson<WorkbenchPreviewSummary>(
      resolve(
        options,
        options.workbenchPreviewSummaryPath,
        DEFAULT_WORKBENCH_PREVIEW_SUMMARY_PATH,
      ),
    );

  const guardrails = buildGuardrails(candidateRecord, promotionGate);
  const moduleReadiness = buildRows({
    candidateRecord,
    moduleProof,
    modulePreviewSummary,
    promotionGate,
    moduleTargetedDerivedPlan,
    workbenchPreviewSummary,
  });
  const qualityGateStatus =
    guardrails.noModuleReadsCandidateByDefault &&
    candidateRecord.currentStatus === "validated" &&
    moduleProof.summary.qualityGateStatus === "pass" &&
    promotionGate.decisionRecord?.promotionEnabled !== true &&
    moduleReadiness.every((row) => row.runtimeConsumptionReady === false)
      ? "pass"
      : "fail";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const summary: CandidateModuleReadinessPreviewSummary = {
    resultVersion: "candidate-module-readiness-preview/v1",
    tenantKey: candidateRecord.lineage.tenantKey,
    candidateVersionKey: candidateRecord.candidateVersionKey,
    generatedAt: options.generatedAt ?? "2026-07-10T00:00:00.000Z",
    qualityGateStatus,
    guardrails,
    counts: {
      modulesEvaluated: moduleReadiness.length,
      previewPacketModules: moduleReadiness.filter(
        (row) => row.previewPacketAvailable,
      ).length,
      candidateContextModules: moduleReadiness.filter(
        (row) => row.readinessStatus === "candidate_context_available",
      ).length,
      blockedModules: moduleReadiness.filter((row) =>
        row.readinessStatus.startsWith("blocked"),
      ).length,
      runtimeReadyModules: 0,
      otherTenantsInventoried: Math.max(0, tenantMatrix.length - 1),
    },
    promotionGate: {
      decision: promotionGate.decisionRecord?.decision ?? "unknown",
      promotionEnabled: false,
      failedChecks: promotionGate.decisionRecord?.failedChecks?.length ?? 0,
      blockers: promotionGate.decisionRecord?.blockers?.length ?? 0,
    },
    outputPaths: {
      readinessPreviewPath: path.join(
        outputDir,
        "module-readiness-preview.json",
      ),
      readinessMatrixCsvPath: path.join(
        outputDir,
        "module-readiness-preview-matrix.csv",
      ),
      readinessSummaryPath: path.join(outputDir, "readiness-summary.json"),
      readinessSummaryMdPath: path.join(outputDir, "readiness-summary.md"),
    },
  };

  const preview: CandidateModuleReadinessPreview = {
    summary,
    moduleReadiness,
    allTenantInventorySnapshot: tenantMatrix.map((row) => ({
      tenant: row.tenant,
      tenantDisplayName: row.tenantDisplayName,
      candidateGenerationStatus: row.candidateGenerationStatus,
      requiredMappingsAvailable: row.requiredMappingsAvailable,
      sourceDataFound: row.sourceDataFound,
      movesDataFound: row.movesDataFound,
      towerDataFound: row.towerDataFound,
      blockerCount: row.blockers.length,
    })),
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), preview);
  if (qualityGateStatus !== "pass") {
    throw new Error("Candidate module readiness preview quality gate failed.");
  }
  return preview;
}

function buildRows(input: {
  candidateRecord: CandidateTenantDataVersionRecord;
  moduleProof: ModuleReadinessProof;
  modulePreviewSummary: CandidateModulePreviewSummary;
  promotionGate: PromotionGateResult;
  moduleTargetedDerivedPlan: ModuleDerivedPlanStage | undefined;
  workbenchPreviewSummary: WorkbenchPreviewSummary | undefined;
}): CandidateModuleReadinessPreviewRow[] {
  const previewModules = new Set<TenantPacketModule>([
    ...input.modulePreviewSummary.requestedModules,
    ...(input.workbenchPreviewSummary?.requestedModules ?? []),
  ]);
  return MODULES.map((module) => {
    const proofEntry =
      input.moduleProof.stages.moduleReadiness.moduleReadiness.find(
        (entry) => entry.module === module,
      );
    const evidenceAvailable = proofEntry?.evidenceAvailable ?? false;
    const factPlanAvailable = proofEntry?.factPlanAvailable ?? false;
    const graphPlanAvailable = proofEntry?.graphPlanAvailable ?? false;
    const derivedPlanAvailable =
      proofEntry?.derivedPlanAvailable === true ||
      hasModuleTargetedDerivedPlan(module, input.moduleTargetedDerivedPlan);
    const previewPacketAvailable =
      isPreviewPacketModule(module) && previewModules.has(module);
    const readinessStatus = statusFor({
      evidenceAvailable,
      factPlanAvailable,
      derivedPlanAvailable,
      previewPacketAvailable,
    });
    const blockers = blockersFor({
      candidateRecord: input.candidateRecord,
      promotionGate: input.promotionGate,
      graphPlanAvailable,
      derivedPlanAvailable,
      previewPacketAvailable,
      readinessStatus,
    });
    return {
      module,
      evidenceAvailable,
      factPlanAvailable,
      graphPlanAvailable,
      derivedPlanAvailable,
      previewPacketAvailable,
      runtimeConsumptionReady: false,
      readinessStatus,
      blockers,
      nextProofNeeded:
        proofEntry?.nextProofNeeded ?? "Build module-specific preview proof.",
    };
  });
}

function isPreviewPacketModule(
  module: PreviewModule,
): module is CandidatePreviewPacketModule | "moves" | "source" | "tower" {
  return (
    module === "home" ||
    module === "intelligence" ||
    module === "moves" ||
    module === "source" ||
    module === "tower"
  );
}

function hasModuleTargetedDerivedPlan(
  module: PreviewModule,
  moduleTargetedDerivedPlan: ModuleDerivedPlanStage | undefined,
): boolean {
  return (
    moduleTargetedDerivedPlan?.derivedEntries.some((entry) =>
      entry.targetModules.includes(module),
    ) ?? false
  );
}

function statusFor(input: {
  evidenceAvailable: boolean;
  factPlanAvailable: boolean;
  derivedPlanAvailable: boolean;
  previewPacketAvailable: boolean;
}): ReadinessStatus {
  if (input.previewPacketAvailable) return "preview_packet_available";
  if (!input.evidenceAvailable || !input.factPlanAvailable) {
    return "blocked_missing_candidate_context";
  }
  if (!input.derivedPlanAvailable) return "blocked_missing_derived_plan";
  return "candidate_context_available";
}

function blockersFor(input: {
  candidateRecord: CandidateTenantDataVersionRecord;
  promotionGate: PromotionGateResult;
  graphPlanAvailable: boolean;
  derivedPlanAvailable: boolean;
  previewPacketAvailable: boolean;
  readinessStatus: ReadinessStatus;
}): string[] {
  const blockers = [
    "Candidate is inactive and cannot be consumed by runtime modules by default.",
    "Active Tenant Access Layer has not been updated.",
  ];
  if (input.promotionGate.decisionRecord?.promotionEnabled !== true) {
    blockers.push("Promotion execution remains disabled.");
  }
  if (!input.graphPlanAvailable) {
    blockers.push("Enterprise Relationship Graph plan is not available yet.");
  }
  if (!input.derivedPlanAvailable) {
    blockers.push(
      "Derived intelligence plan is not available for this module.",
    );
  }
  if (!input.previewPacketAvailable) {
    blockers.push("Module-specific preview packet has not been generated yet.");
  }
  if (input.candidateRecord.currentStatus !== "validated") {
    blockers.push(
      `Candidate status is ${input.candidateRecord.currentStatus}.`,
    );
  }
  if (input.readinessStatus.startsWith("blocked")) {
    blockers.push(`Readiness status is ${input.readinessStatus}.`);
  }
  return blockers;
}

function buildGuardrails(
  candidateRecord: CandidateTenantDataVersionRecord,
  promotionGate: PromotionGateResult,
): ReadinessGuardrails {
  return {
    dryRunOnly: true,
    readOnlyPreview: true,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    candidatePromoted: false,
    moduleRuntimeRoutesChanged: false,
    noModuleReadsCandidateByDefault:
      candidateRecord.promotionControl.noModuleReadsCandidateByDefault &&
      promotionGate.decisionRecord?.noModuleReadsCandidateByDefault !== false,
  };
}

async function writeArtifacts(
  outputDir: string,
  preview: CandidateModuleReadinessPreview,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "module-readiness-preview.json"),
    `${JSON.stringify(preview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "readiness-summary.json"),
    `${JSON.stringify(preview.summary, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "module-readiness-preview-matrix.csv"),
    matrixCsv(preview.moduleReadiness),
  );
  await fs.writeFile(
    path.join(outputDir, "readiness-summary.md"),
    summaryMd(preview),
  );
}

function matrixCsv(rows: CandidateModuleReadinessPreviewRow[]): string {
  const header = [
    "module",
    "evidence_available",
    "fact_plan_available",
    "graph_plan_available",
    "derived_plan_available",
    "preview_packet_available",
    "runtime_consumption_ready",
    "readiness_status",
    "blocker_count",
    "next_proof_needed",
  ];
  const lines = rows.map((row) =>
    [
      row.module,
      row.evidenceAvailable,
      row.factPlanAvailable,
      row.graphPlanAvailable,
      row.derivedPlanAvailable,
      row.previewPacketAvailable,
      row.runtimeConsumptionReady,
      row.readinessStatus,
      row.blockers.length,
      row.nextProofNeeded,
    ]
      .map(csvCell)
      .join(","),
  );
  return `${header.join(",")}\n${lines.join("\n")}\n`;
}

function summaryMd(preview: CandidateModuleReadinessPreview): string {
  const rows = preview.moduleReadiness
    .map(
      (row) =>
        `| ${row.module} | ${row.readinessStatus} | ${row.previewPacketAvailable} | ${row.runtimeConsumptionReady} | ${row.blockers.length} | ${row.nextProofNeeded} |`,
    )
    .join("\n");
  return `# Candidate Module Readiness Preview

Tenant: \`${preview.summary.tenantKey}\`
Candidate: \`${preview.summary.candidateVersionKey}\`
Generated: \`${preview.summary.generatedAt}\`

This preview shows module readiness for an inactive candidate tenant data
version. It does not write production tenant data, update active tenant access,
promote the candidate, or change module runtime behavior.

## Summary

- Quality gate: ${preview.summary.qualityGateStatus}
- Modules evaluated: ${preview.summary.counts.modulesEvaluated}
- Preview-packet modules: ${preview.summary.counts.previewPacketModules}
- Candidate-context modules: ${preview.summary.counts.candidateContextModules}
- Blocked modules: ${preview.summary.counts.blockedModules}
- Runtime-ready modules: ${preview.summary.counts.runtimeReadyModules}
- Promotion decision: ${preview.summary.promotionGate.decision}
- Promotion enabled: ${preview.summary.promotionGate.promotionEnabled}

## Module Matrix

| Module | Status | Preview packet | Runtime ready | Blockers | Next proof |
| --- | --- | --- | --- | --- | --- |
${rows}

## Guardrails

- Production tenant data written: ${preview.summary.guardrails.productionTenantDataWritten}
- Active Tenant Access Layer updated: ${preview.summary.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${preview.summary.guardrails.candidatePromoted}
- Module runtime routes changed: ${preview.summary.guardrails.moduleRuntimeRoutesChanged}
- No module reads candidate by default: ${preview.summary.guardrails.noModuleReadsCandidateByDefault}
`;
}

function resolve(
  options: CandidateModuleReadinessPreviewOptions,
  filePath: string | undefined,
  fallback: string,
): string {
  return path.resolve(options.repoRoot, filePath ?? fallback);
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readOptionalJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return await readJson<T>(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
