import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";

type ArtifactStatus = "present" | "missing";
type QualityGateStatus = "pass" | "fail";

interface PromotionGateResult {
  decisionRecord: {
    decision: string;
    promotionEnabled: boolean;
    operatorApprovalRequired: boolean;
    rollbackPlanRequired: boolean;
    activeTenantAccessLayerUpdated: boolean;
    writesPhysicalTables: boolean;
    moduleRuntimeConsumptionChanged: boolean;
    noModuleReadsCandidateByDefault: boolean;
    failedChecks: string[];
    blockers: string[];
    requiredProofChecks: Array<{
      checkId: string;
      status: string;
      detail: string;
    }>;
  };
}

interface ModuleReadinessPreview {
  summary: {
    qualityGateStatus: string;
    counts: {
      modulesEvaluated: number;
      runtimeReadyModules: number;
      blockedModules: number;
    };
    promotionGate: {
      decision: string;
      promotionEnabled: boolean;
      failedChecks: number;
      blockers: number;
    };
  };
  moduleReadiness: Array<{
    module: string;
    evidenceAvailable: boolean;
    factPlanAvailable: boolean;
    graphPlanAvailable: boolean;
    derivedPlanAvailable: boolean;
    previewPacketAvailable: boolean;
    runtimeConsumptionReady: false;
    readinessStatus: string;
    blockers: string[];
    nextProofNeeded: string;
  }>;
}

interface ModuleWorkbenchPreviewProof {
  summary: {
    previewQualityGateStatus: string;
    requestedModules: string[];
    counts: {
      workbenchPreviewPackets: number;
      runtimeReadyModules: number;
      movesFacts: number;
      sourceFacts: number;
      towerFacts: number;
    };
  };
}

interface DerivedPlanStage {
  derivedEntries: Array<{
    derivedObjectKey: string;
    targetModules: string[];
    status: string;
    sourceObjectIds: string[];
  }>;
}

interface GraphPlanStage {
  graphEntries: Array<{
    graphObjectKey: string;
    targetModules: string[];
    status: string;
    sourceObjectIds: string[];
    edges: unknown[];
  }>;
}

interface SourceShadowProof {
  validationSummary: {
    qualityGateStatus: string;
    leverageFindingCount: number;
    proposedMemoryRecordCount: number;
    evidenceTraceCount: number;
    guardrailsHeld: boolean;
  };
  guardrails: Record<string, boolean>;
  blockers: string[];
}

interface MovesShadowProof {
  qualityGateStatus: string;
  validationSummary: {
    phaseCount: number;
    shadowReadyPhases: number;
    partialPhases: number;
    blockedPhases: number;
    gateAssessments: number;
    proposedDeliverables: number;
    proposedModuleMemoryRecords: number;
    evidenceTraceCount: number;
    noLiveAdvancement: boolean;
    noRuntimeConsumptionChange: boolean;
  };
  guardrails: Record<string, boolean>;
  phaseReadiness: Array<{
    phase: string;
    name: string;
    status: string;
    blockers: string[];
    nextProofRequired: string[];
  }>;
}

interface AllTenantBatchReport {
  rollup: {
    totalTenantsScanned: number;
    eligibleTenants: number;
    partiallyEligibleTenants: number;
    blockedTenants: number;
  };
  tenants: Array<{
    tenantKey: string;
    readinessStatus: string;
    blockers: string[];
    recommendedRemediation: string[];
  }>;
}

interface ControlGuardrails {
  dryRunOnly: true;
  readOnlyControlPanel: true;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  candidateReadByDefault: false;
  runtimeReady: false;
  promotionEnabled: false;
  operatorApprovalRequired: true;
  realizedValueClaimed: false;
}

interface ArtifactChecklistRow {
  artifact: string;
  status: ArtifactStatus;
  path: string;
  summary: string;
}

interface ModuleControlRow {
  module: string;
  previewPacketAvailable: boolean;
  derivedPlanAvailable: boolean;
  graphPlanAvailable: boolean;
  runtimeConsumptionReady: false;
  readinessStatus: string;
  blockers: string[];
  nextProofNeeded: string;
}

interface PromotionCriterion {
  criterionId: string;
  status: "pass" | "blocked" | "operator_required";
  detail: string;
}

export interface CandidateReadinessControlReport {
  reportVersion: "candidate-readiness-control/v1";
  generatedAt: string;
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: QualityGateStatus;
  readinessState: "candidate_preview_ready_not_active_ready";
  guardrails: ControlGuardrails;
  executiveSummary: {
    candidateVersionExists: boolean;
    promotionGateExists: boolean;
    modulePreviewPacketsExist: boolean;
    moduleReadinessMatrixExists: boolean;
    moduleDerivedPlansExist: boolean;
    moduleGraphPlansExist: boolean;
    sourceShadowProofExists: boolean;
    movesShadowProofExists: boolean;
    runtimeReady: false;
    activeAccessUnchanged: true;
    promotionDisabled: true;
    blockersRemaining: number;
    exactCriteriaBeforeActivePromotion: string[];
  };
  artifactChecklist: ArtifactChecklistRow[];
  moduleControl: ModuleControlRow[];
  promotionCriteria: PromotionCriterion[];
  blockerRegister: string[];
  allTenantContext: {
    totalTenantsScanned: number;
    eligibleTenants: number;
    partiallyEligibleTenants: number;
    blockedTenants: number;
    skyharborStatus: string;
  };
  proofCounts: {
    sourceLeverageFindings: number;
    sourceEvidenceTraceRows: number;
    movesPhases: number;
    movesGateAssessments: number;
    movesEvidenceTraceRows: number;
    derivedPlanObjects: number;
    graphPlanObjects: number;
    graphPlanEdges: number;
  };
  nextDecision: {
    recommendedNextMilestone: string;
    allowedNow: string[];
    stillBlocked: string[];
  };
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    moduleMatrixPath: string;
  };
}

export interface CandidateReadinessControlOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
  candidateRecordPath?: string;
  promotionGatePath?: string;
  moduleReadinessPreviewPath?: string;
  moduleWorkbenchPreviewPath?: string;
  derivedPlanPath?: string;
  graphPlanPath?: string;
  sourceShadowPath?: string;
  movesShadowPath?: string;
  allTenantBatchPath?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/candidate-readiness-control/skyharbor";
const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_PROMOTION_GATE_PATH =
  "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json";
const DEFAULT_MODULE_READINESS_PREVIEW_PATH =
  "reports/candidate-module-readiness-previews/skyharbor/module-readiness-preview.json";
const DEFAULT_MODULE_WORKBENCH_PREVIEW_PATH =
  "reports/candidate-module-workbench-previews/skyharbor/candidate-module-workbench-preview-proof.json";
const DEFAULT_DERIVED_PLAN_PATH =
  "reports/candidate-module-derived-plans/skyharbor/module-derived-plan-stage.json";
const DEFAULT_GRAPH_PLAN_PATH =
  "reports/candidate-module-graph-plans/skyharbor/module-graph-plan-stage.json";
const DEFAULT_SOURCE_SHADOW_PATH =
  "reports/source-shadow-proof/skyharbor/source-shadow-proof.json";
const DEFAULT_MOVES_SHADOW_PATH =
  "reports/moves-shadow-proof/skyharbor/moves-shadow-proof.json";
const DEFAULT_ALL_TENANT_BATCH_PATH =
  "reports/all-tenant-candidate-batch/all-tenant-candidate-batch.json";

export async function buildCandidateReadinessControl(
  options: CandidateReadinessControlOptions,
): Promise<CandidateReadinessControlReport> {
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const candidate = await readJson<CandidateTenantDataVersionRecord>(
    resolve(
      options,
      options.candidateRecordPath,
      DEFAULT_CANDIDATE_RECORD_PATH,
    ),
  );
  const promotionGate = await readJson<PromotionGateResult>(
    resolve(options, options.promotionGatePath, DEFAULT_PROMOTION_GATE_PATH),
  );
  const readiness = await readJson<ModuleReadinessPreview>(
    resolve(
      options,
      options.moduleReadinessPreviewPath,
      DEFAULT_MODULE_READINESS_PREVIEW_PATH,
    ),
  );
  const workbench = await readJson<ModuleWorkbenchPreviewProof>(
    resolve(
      options,
      options.moduleWorkbenchPreviewPath,
      DEFAULT_MODULE_WORKBENCH_PREVIEW_PATH,
    ),
  );
  const derivedPlan = await readJson<DerivedPlanStage>(
    resolve(options, options.derivedPlanPath, DEFAULT_DERIVED_PLAN_PATH),
  );
  const graphPlan = await readJson<GraphPlanStage>(
    resolve(options, options.graphPlanPath, DEFAULT_GRAPH_PLAN_PATH),
  );
  const sourceShadow = await readJson<SourceShadowProof>(
    resolve(options, options.sourceShadowPath, DEFAULT_SOURCE_SHADOW_PATH),
  );
  const movesShadow = await readJson<MovesShadowProof>(
    resolve(options, options.movesShadowPath, DEFAULT_MOVES_SHADOW_PATH),
  );
  const allTenantBatch = await readJson<AllTenantBatchReport>(
    resolve(options, options.allTenantBatchPath, DEFAULT_ALL_TENANT_BATCH_PATH),
  );

  const guardrails = buildGuardrails(promotionGate);
  const moduleControl = buildModuleControl(readiness, derivedPlan, graphPlan);
  const artifactChecklist = buildArtifactChecklist({
    candidate,
    promotionGate,
    readiness,
    workbench,
    derivedPlan,
    graphPlan,
    sourceShadow,
    movesShadow,
    allTenantBatch,
  });
  const blockerRegister = unique([
    ...promotionGate.decisionRecord.blockers,
    ...moduleControl.flatMap((row) => row.blockers),
    ...sourceShadow.blockers,
    ...movesShadow.phaseReadiness.flatMap((phase) => phase.blockers),
  ]);
  const promotionCriteria = buildPromotionCriteria({
    promotionGate,
    readiness,
    sourceShadow,
    movesShadow,
    guardrails,
  });
  const qualityGateStatus = controlQualityGate({
    guardrails,
    candidate,
    artifactChecklist,
    moduleControl,
    sourceShadow,
    movesShadow,
    promotionGate,
  });
  const skyharborRow = allTenantBatch.tenants.find(
    (tenant) => tenant.tenantKey === candidate.lineage.tenantKey,
  );

  const report: CandidateReadinessControlReport = {
    reportVersion: "candidate-readiness-control/v1",
    generatedAt,
    tenantKey: candidate.lineage.tenantKey,
    candidateVersionId: candidate.candidateVersionKey,
    qualityGateStatus,
    readinessState: "candidate_preview_ready_not_active_ready",
    guardrails,
    executiveSummary: {
      candidateVersionExists: true,
      promotionGateExists: true,
      modulePreviewPacketsExist:
        workbench.summary.counts.workbenchPreviewPackets > 0,
      moduleReadinessMatrixExists: readiness.moduleReadiness.length > 0,
      moduleDerivedPlansExist: derivedPlan.derivedEntries.length > 0,
      moduleGraphPlansExist: graphPlan.graphEntries.length > 0,
      sourceShadowProofExists:
        sourceShadow.validationSummary.qualityGateStatus === "pass",
      movesShadowProofExists: movesShadow.qualityGateStatus === "pass",
      runtimeReady: false,
      activeAccessUnchanged: true,
      promotionDisabled: true,
      blockersRemaining: blockerRegister.length,
      exactCriteriaBeforeActivePromotion: [
        "Operator approval recorded for this candidate version.",
        "Promotion gate explicitly enabled in a future approved release.",
        "Rollback plan reviewed and accepted.",
        "Active access update command implemented, tested, and reversible.",
        "Signed-in Home, Intelligence, Moves, Source, and Tower preview proof passes against an explicitly selected candidate.",
        "Module Memory and Outcome Ledger write paths remain disabled until separately approved.",
      ],
    },
    artifactChecklist,
    moduleControl,
    promotionCriteria,
    blockerRegister,
    allTenantContext: {
      totalTenantsScanned: allTenantBatch.rollup.totalTenantsScanned,
      eligibleTenants: allTenantBatch.rollup.eligibleTenants,
      partiallyEligibleTenants: allTenantBatch.rollup.partiallyEligibleTenants,
      blockedTenants: allTenantBatch.rollup.blockedTenants,
      skyharborStatus: skyharborRow?.readinessStatus ?? "unknown",
    },
    proofCounts: {
      sourceLeverageFindings:
        sourceShadow.validationSummary.leverageFindingCount,
      sourceEvidenceTraceRows:
        sourceShadow.validationSummary.evidenceTraceCount,
      movesPhases: movesShadow.validationSummary.phaseCount,
      movesGateAssessments: movesShadow.validationSummary.gateAssessments,
      movesEvidenceTraceRows: movesShadow.validationSummary.evidenceTraceCount,
      derivedPlanObjects: derivedPlan.derivedEntries.length,
      graphPlanObjects: graphPlan.graphEntries.length,
      graphPlanEdges: graphPlan.graphEntries.reduce(
        (sum, entry) => sum + entry.edges.length,
        0,
      ),
    },
    nextDecision: {
      recommendedNextMilestone:
        "PR20 - Candidate preview mode behind an explicit flag.",
      allowedNow: [
        "Review candidate proof bundles.",
        "Use the control panel as an operator checklist.",
        "Remediate blockers without changing active runtime truth.",
      ],
      stillBlocked: [
        "Active tenant access update.",
        "Candidate promotion.",
        "Default module reads from candidate data.",
        "Live Moves gate advancement.",
        "Runtime Module Memory or Outcome Ledger writes.",
      ],
    },
    outputPaths: {
      jsonPath: path.join(outputDir, "candidate-readiness-control.json"),
      mdPath: path.join(outputDir, "candidate-readiness-control.md"),
      htmlPath: path.join(outputDir, "candidate-readiness-control.html"),
      moduleMatrixPath: path.join(outputDir, "module-control-matrix.csv"),
    },
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  if (report.qualityGateStatus !== "pass") {
    throw new Error("Candidate readiness control quality gate failed.");
  }
  return report;
}

function buildGuardrails(
  promotionGate: PromotionGateResult,
): ControlGuardrails {
  return {
    dryRunOnly: true,
    readOnlyControlPanel: true,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    runtimeReady: false,
    promotionEnabled: false,
    operatorApprovalRequired: true,
    realizedValueClaimed: false,
  };
}

function buildModuleControl(
  readiness: ModuleReadinessPreview,
  derivedPlan: DerivedPlanStage,
  graphPlan: GraphPlanStage,
): ModuleControlRow[] {
  return readiness.moduleReadiness.map((row) => ({
    module: row.module,
    previewPacketAvailable: row.previewPacketAvailable,
    derivedPlanAvailable:
      row.derivedPlanAvailable ||
      derivedPlan.derivedEntries.some((entry) =>
        entry.targetModules.includes(row.module),
      ),
    graphPlanAvailable:
      row.graphPlanAvailable ||
      graphPlan.graphEntries.some((entry) =>
        entry.targetModules.includes(row.module),
      ),
    runtimeConsumptionReady: false,
    readinessStatus: row.readinessStatus,
    blockers: [
      ...row.blockers,
      "Candidate data is not active runtime truth.",
      "Explicit candidate preview mode is not implemented in this release.",
    ],
    nextProofNeeded: row.nextProofNeeded,
  }));
}

function buildArtifactChecklist(input: {
  candidate: CandidateTenantDataVersionRecord;
  promotionGate: PromotionGateResult;
  readiness: ModuleReadinessPreview;
  workbench: ModuleWorkbenchPreviewProof;
  derivedPlan: DerivedPlanStage;
  graphPlan: GraphPlanStage;
  sourceShadow: SourceShadowProof;
  movesShadow: MovesShadowProof;
  allTenantBatch: AllTenantBatchReport;
}): ArtifactChecklistRow[] {
  return [
    {
      artifact: "Candidate tenant data version",
      status: "present",
      path: DEFAULT_CANDIDATE_RECORD_PATH,
      summary: `${input.candidate.currentStatus}; dry-run only ${input.candidate.dryRunOnly}`,
    },
    {
      artifact: "Promotion gate",
      status: "present",
      path: DEFAULT_PROMOTION_GATE_PATH,
      summary: `${input.promotionGate.decisionRecord.decision}; promotion enabled ${input.promotionGate.decisionRecord.promotionEnabled}`,
    },
    {
      artifact: "Module readiness matrix",
      status: "present",
      path: DEFAULT_MODULE_READINESS_PREVIEW_PATH,
      summary: `${input.readiness.moduleReadiness.length} modules evaluated; ${input.readiness.summary.counts.runtimeReadyModules} runtime-ready`,
    },
    {
      artifact: "Module workbench previews",
      status: "present",
      path: DEFAULT_MODULE_WORKBENCH_PREVIEW_PATH,
      summary: `${input.workbench.summary.counts.workbenchPreviewPackets} packets; ${input.workbench.summary.counts.runtimeReadyModules} runtime-ready`,
    },
    {
      artifact: "Module derived plan",
      status: "present",
      path: DEFAULT_DERIVED_PLAN_PATH,
      summary: `${input.derivedPlan.derivedEntries.length} derived objects planned`,
    },
    {
      artifact: "Module graph plan",
      status: "present",
      path: DEFAULT_GRAPH_PLAN_PATH,
      summary: `${input.graphPlan.graphEntries.length} graph objects planned`,
    },
    {
      artifact: "Source shadow proof",
      status: "present",
      path: DEFAULT_SOURCE_SHADOW_PATH,
      summary: `${input.sourceShadow.validationSummary.qualityGateStatus}; ${input.sourceShadow.validationSummary.leverageFindingCount} findings`,
    },
    {
      artifact: "Moves shadow proof",
      status: "present",
      path: DEFAULT_MOVES_SHADOW_PATH,
      summary: `${input.movesShadow.qualityGateStatus}; ${input.movesShadow.validationSummary.phaseCount} phases`,
    },
    {
      artifact: "All-tenant batch context",
      status: "present",
      path: DEFAULT_ALL_TENANT_BATCH_PATH,
      summary: `${input.allTenantBatch.rollup.totalTenantsScanned} tenants scanned`,
    },
  ];
}

function buildPromotionCriteria(input: {
  promotionGate: PromotionGateResult;
  readiness: ModuleReadinessPreview;
  sourceShadow: SourceShadowProof;
  movesShadow: MovesShadowProof;
  guardrails: ControlGuardrails;
}): PromotionCriterion[] {
  const gateChecks = input.promotionGate.decisionRecord.requiredProofChecks.map(
    (check) =>
      ({
        criterionId: check.checkId,
        status: check.status === "pass" ? "pass" : "blocked",
        detail: check.detail,
      }) satisfies PromotionCriterion,
  );
  return [
    ...gateChecks,
    {
      criterionId: "operator-approval-required",
      status: "operator_required",
      detail:
        "Operator approval is required before any future active promotion.",
    },
    {
      criterionId: "runtime-consumption-disabled",
      status:
        input.readiness.summary.counts.runtimeReadyModules === 0
          ? "pass"
          : "blocked",
      detail: `${input.readiness.summary.counts.runtimeReadyModules} modules are runtime-ready in this control report.`,
    },
    {
      criterionId: "source-shadow-proof",
      status:
        input.sourceShadow.validationSummary.qualityGateStatus === "pass"
          ? "pass"
          : "blocked",
      detail: "Source shadow proof remains report-only.",
    },
    {
      criterionId: "moves-shadow-proof",
      status:
        input.movesShadow.qualityGateStatus === "pass" ? "pass" : "blocked",
      detail: "Moves shadow proof remains report-only.",
    },
    {
      criterionId: "promotion-disabled",
      status: input.guardrails.promotionEnabled === false ? "pass" : "blocked",
      detail: "Promotion is disabled in this release.",
    },
  ];
}

function controlQualityGate(input: {
  guardrails: ControlGuardrails;
  candidate: CandidateTenantDataVersionRecord;
  artifactChecklist: ArtifactChecklistRow[];
  moduleControl: ModuleControlRow[];
  sourceShadow: SourceShadowProof;
  movesShadow: MovesShadowProof;
  promotionGate: PromotionGateResult;
}): QualityGateStatus {
  const guardrailsHold =
    input.guardrails.dryRunOnly &&
    input.guardrails.readOnlyControlPanel &&
    input.guardrails.productionTenantDataWritten === false &&
    input.guardrails.writesPhysicalTables === false &&
    input.guardrails.activeTenantAccessLayerUpdated === false &&
    input.guardrails.candidatePromoted === false &&
    input.guardrails.moduleRuntimeConsumptionChanged === false &&
    input.guardrails.candidateReadByDefault === false &&
    input.guardrails.runtimeReady === false &&
    input.guardrails.promotionEnabled === false &&
    input.guardrails.operatorApprovalRequired &&
    input.guardrails.realizedValueClaimed === false;

  return guardrailsHold &&
    input.candidate.currentStatus === "validated" &&
    input.artifactChecklist.every(
      (artifact) => artifact.status === "present",
    ) &&
    input.moduleControl.every((row) => row.runtimeConsumptionReady === false) &&
    input.sourceShadow.validationSummary.qualityGateStatus === "pass" &&
    input.movesShadow.qualityGateStatus === "pass" &&
    input.promotionGate.decisionRecord.promotionEnabled === false
    ? "pass"
    : "fail";
}

async function writeArtifacts(
  outputDir: string,
  report: CandidateReadinessControlReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "candidate-readiness-control.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-readiness-control.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-readiness-control.html"),
    htmlReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "module-control-matrix.csv"),
    moduleMatrixCsv(report.moduleControl),
  );
}

function markdownReport(report: CandidateReadinessControlReport): string {
  const moduleRows = markdownTable(
    [
      "Module",
      "Preview packet",
      "Derived plan",
      "Graph plan",
      "Runtime-ready",
      "Status",
    ],
    report.moduleControl.map((row) => [
      row.module,
      String(row.previewPacketAvailable),
      String(row.derivedPlanAvailable),
      String(row.graphPlanAvailable),
      String(row.runtimeConsumptionReady),
      row.readinessStatus,
    ]),
  );
  return `# Candidate Readiness Control - SkyHarbor

Tenant: \`${report.tenantKey}\`
Candidate: \`${report.candidateVersionId}\`
Generated: \`${report.generatedAt}\`
Quality gate: \`${report.qualityGateStatus}\`
Readiness state: \`${report.readinessState}\`

This is the consolidated control panel for the inactive SkyHarbor candidate. It
proves candidate preview readiness and keeps active runtime readiness false.

## Executive Summary

- Candidate version exists: ${report.executiveSummary.candidateVersionExists}
- Promotion gate exists: ${report.executiveSummary.promotionGateExists}
- Module preview packets exist: ${report.executiveSummary.modulePreviewPacketsExist}
- Module readiness matrix exists: ${report.executiveSummary.moduleReadinessMatrixExists}
- Module derived plans exist: ${report.executiveSummary.moduleDerivedPlansExist}
- Module graph plans exist: ${report.executiveSummary.moduleGraphPlansExist}
- Source shadow proof exists: ${report.executiveSummary.sourceShadowProofExists}
- Moves shadow proof exists: ${report.executiveSummary.movesShadowProofExists}
- Runtime-ready: ${report.executiveSummary.runtimeReady}
- Active access unchanged: ${report.executiveSummary.activeAccessUnchanged}
- Promotion disabled: ${report.executiveSummary.promotionDisabled}
- Blockers remaining: ${report.executiveSummary.blockersRemaining}

## Module Control

${moduleRows}

## Before Active Promotion

${report.executiveSummary.exactCriteriaBeforeActivePromotion.map((item) => `- ${item}`).join("\n")}

## Guardrails

- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Active Tenant Access Layer updated: ${report.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${report.guardrails.candidatePromoted}
- Module runtime consumption changed: ${report.guardrails.moduleRuntimeConsumptionChanged}
- Candidate read by default: ${report.guardrails.candidateReadByDefault}
- Runtime-ready: ${report.guardrails.runtimeReady}
- Promotion enabled: ${report.guardrails.promotionEnabled}
- Realized value claimed: ${report.guardrails.realizedValueClaimed}
`;
}

function markdownTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const formatRow = (values: string[]) =>
    `| ${values.map((value, index) => value.padEnd(widths[index])).join(" | ")} |`;
  const separator = `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`;
  return [formatRow(headers), separator, ...rows.map(formatRow)].join("\n");
}

function htmlReport(report: CandidateReadinessControlReport): string {
  const artifactRows = report.artifactChecklist
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.artifact)}</td><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.summary)}</td></tr>`,
    )
    .join("");
  const modules = report.moduleControl
    .map(
      (row) =>
        `<section class="module"><div class="kicker">${escapeHtml(row.module)}</div><h2>${escapeHtml(row.readinessStatus)}</h2><p>Preview ${row.previewPacketAvailable}; derived ${row.derivedPlanAvailable}; graph ${row.graphPlanAvailable}; runtime ${row.runtimeConsumptionReady}.</p></section>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Candidate Readiness Control - SkyHarbor</title>
  <style>
    body { margin: 0; background: #f7f6f2; color: #171713; font-family: Arial, Helvetica, sans-serif; }
    main { max-width: 1200px; margin: 0 auto; padding: 46px 28px 64px; }
    .eyebrow, .kicker { color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 10px 0; font-family: Georgia, serif; font-size: 44px; line-height: 1.05; }
    .lede { max-width: 860px; color: #5c5a53; font-size: 19px; line-height: 1.48; }
    .metrics, .modules { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 28px 0; }
    .metric, .module, .panel { border: 1px solid #dedbd2; border-radius: 8px; background: #fff; padding: 18px; }
    .metric strong { display: block; font-size: 32px; line-height: 1; }
    .metric span, .module p { color: #68645d; }
    .modules { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .module h2 { margin: 8px 0; font-size: 17px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    td, th { border-top: 1px solid #e5e1d8; padding: 10px; text-align: left; font-size: 14px; }
    @media (max-width: 940px) { .metrics, .modules { grid-template-columns: 1fr; } h1 { font-size: 34px; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">AbarVa candidate readiness control</div>
    <h1>SkyHarbor is candidate preview-ready, not active-runtime-ready.</h1>
    <p class="lede">This panel consolidates candidate version metadata, promotion gate status, module preview packets, derived and graph plans, Source shadow proof, Moves shadow proof, and all-tenant context. It keeps promotion disabled and active access unchanged.</p>
    <section class="metrics">
      <div class="metric"><strong>${report.artifactChecklist.length}</strong><span>proof artifacts present</span></div>
      <div class="metric"><strong>${report.proofCounts.movesPhases}</strong><span>Moves phases assessed</span></div>
      <div class="metric"><strong>${report.proofCounts.graphPlanEdges}</strong><span>graph plan edges</span></div>
      <div class="metric"><strong>0</strong><span>runtime-ready modules</span></div>
    </section>
    <section class="modules">${modules}</section>
    <section class="panel">
      <div class="kicker">Artifact checklist</div>
      <table><thead><tr><th>Artifact</th><th>Status</th><th>Summary</th></tr></thead><tbody>${artifactRows}</tbody></table>
    </section>
  </main>
</body>
</html>
`;
}

function moduleMatrixCsv(rows: ModuleControlRow[]): string {
  const header = [
    "module",
    "preview_packet_available",
    "derived_plan_available",
    "graph_plan_available",
    "runtime_consumption_ready",
    "readiness_status",
    "blockers",
  ].join(",");
  return `${[
    header,
    ...rows.map((row) =>
      [
        row.module,
        row.previewPacketAvailable,
        row.derivedPlanAvailable,
        row.graphPlanAvailable,
        row.runtimeConsumptionReady,
        row.readinessStatus,
        quote(row.blockers.join(" | ")),
      ].join(","),
    ),
  ].join("\n")}\n`;
}

function resolve(
  options: CandidateReadinessControlOptions,
  filePath: string | undefined,
  fallback: string,
): string {
  return path.resolve(options.repoRoot, filePath ?? fallback);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function quote(input: unknown): string {
  const value = String(input ?? "");
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
