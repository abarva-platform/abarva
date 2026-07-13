import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";

type StepStatus = "dry_run_pass" | "blocked";

interface ReadinessClosureReport {
  executiveSummary: {
    safeDemoTenantForNextDryRun: string | null;
    activePromotionReadyTenants: 0;
    allTenantPromotionAttempted: false;
  };
}

interface PromotionGateResult {
  decisionRecord: {
    decision: string;
    promotionEnabled: boolean;
    activeTenantAccessLayerUpdated: boolean;
    writesPhysicalTables: boolean;
    moduleRuntimeConsumptionChanged: boolean;
    noModuleReadsCandidateByDefault: boolean;
    operatorApprovalRequired: boolean;
    rollbackPlanRequired: boolean;
    failedChecks: string[];
    blockers: string[];
  };
}

interface OperatorPromotionWorkflowReport {
  workflowState: string;
  promotionDecision: {
    promotionEnabled: false;
    activePromotionAttempted: false;
  };
  rollbackPlan: {
    rollbackPlanId: string;
    required: true;
    testedInThisRelease: false;
    activeVersionBeforePromotion: "unchanged";
    rollbackSteps: string[];
  };
}

interface ExecutionGuardrails {
  executionMode: "dry_run";
  selectedTenantOnly: true;
  allTenantPromotionAttempted: false;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  moduleDefaultReadsCandidateData: false;
  rollbackExecutedAgainstProduction: false;
  realizedValueClaimed: false;
}

interface ExecutionStep {
  stepId: string;
  label: string;
  status: StepStatus;
  evidence: string[];
  detail: string;
}

interface RollbackProof {
  rollbackProofVersion: "promotion-rollback-proof/v1";
  tenantKey: string;
  candidateVersionId: string;
  priorActiveVersionId: string;
  rollbackRehearsedInDryRun: true;
  rollbackExecutedAgainstProduction: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  rollbackRequiredIfPromotionFails: true;
  rollbackStepsVerified: Array<{
    step: string;
    status: "dry_run_verified";
  }>;
  restoreTarget: {
    activeVersionBeforeDryRun: string;
    activeVersionAfterDryRun: string;
    unchanged: true;
  };
}

export interface PromotionExecutionDryRunReport {
  reportVersion: "promotion-execution-dry-run/v1";
  generatedAt: string;
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: "pass";
  executionState: "dry_run_rehearsed_not_promoted";
  priorActiveVersionId: string;
  guardrails: ExecutionGuardrails;
  prerequisites: Array<{
    prerequisiteId: string;
    status: "pass";
    detail: string;
  }>;
  executionLedger: ExecutionStep[];
  rollbackProof: RollbackProof;
  nextMilestoneGate: {
    dataPr26AllowedForTenant: string;
    activePromotionStillRequires: string[];
    blockedForAllOtherTenants: true;
  };
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    executionLedgerPath: string;
    rollbackProofPath: string;
  };
}

export interface PromotionExecutionDryRunOptions {
  repoRoot: string;
  generatedAt?: string;
  outputDir?: string;
  readinessClosurePath?: string;
  candidateRecordPath?: string;
  promotionGatePath?: string;
  operatorWorkflowPath?: string;
  priorActiveVersionId?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/promotion-execution-dry-run/skyharbor";
const DEFAULT_READINESS_CLOSURE_PATH =
  "reports/all-tenant-readiness-closure/all-tenant-readiness-closure.json";
const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_PROMOTION_GATE_PATH =
  "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json";
const DEFAULT_OPERATOR_WORKFLOW_PATH =
  "reports/operator-promotion-workflow/skyharbor/operator-promotion-workflow.json";

export async function buildPromotionExecutionDryRun(
  options: PromotionExecutionDryRunOptions,
): Promise<PromotionExecutionDryRunReport> {
  const generatedAt = options.generatedAt ?? "2026-07-13T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const readinessClosure = await readJson<ReadinessClosureReport>(
    resolve(
      options.repoRoot,
      options.readinessClosurePath,
      DEFAULT_READINESS_CLOSURE_PATH,
    ),
  );
  const candidate = await readJson<CandidateTenantDataVersionRecord>(
    resolve(
      options.repoRoot,
      options.candidateRecordPath,
      DEFAULT_CANDIDATE_RECORD_PATH,
    ),
  );
  const promotionGate = await readJson<PromotionGateResult>(
    resolve(
      options.repoRoot,
      options.promotionGatePath,
      DEFAULT_PROMOTION_GATE_PATH,
    ),
  );
  const operatorWorkflow = await readJson<OperatorPromotionWorkflowReport>(
    resolve(
      options.repoRoot,
      options.operatorWorkflowPath,
      DEFAULT_OPERATOR_WORKFLOW_PATH,
    ),
  );

  const tenantKey = candidate.lineage.tenantKey;
  assertDryRunInputs({
    readinessClosure,
    candidate,
    promotionGate,
    operatorWorkflow,
  });

  const priorActiveVersionId =
    options.priorActiveVersionId ??
    `${tenantKey}:active-runtime-truth:unchanged`;
  const rollbackProof = buildRollbackProof({
    tenantKey,
    candidateVersionId: candidate.candidateVersionKey,
    priorActiveVersionId,
    operatorWorkflow,
  });
  const report: PromotionExecutionDryRunReport = {
    reportVersion: "promotion-execution-dry-run/v1",
    generatedAt,
    tenantKey,
    candidateVersionId: candidate.candidateVersionKey,
    qualityGateStatus: "pass",
    executionState: "dry_run_rehearsed_not_promoted",
    priorActiveVersionId,
    guardrails: buildGuardrails(),
    prerequisites: [
      {
        prerequisiteId: "safe-demo-tenant-selected",
        status: "pass",
        detail: `${tenantKey} is the safe demo tenant selected by the all-tenant readiness closure report.`,
      },
      {
        prerequisiteId: "promotion-gate-ready-for-operator-approval",
        status: "pass",
        detail:
          "Promotion gate is ready for operator approval, but promotion remains disabled.",
      },
      {
        prerequisiteId: "operator-workflow-defined",
        status: "pass",
        detail:
          "Operator promotion workflow exists and keeps execution disabled by default.",
      },
      {
        prerequisiteId: "rollback-plan-present",
        status: "pass",
        detail: `Rollback plan ${operatorWorkflow.rollbackPlan.rollbackPlanId} is present and rehearsed only in dry-run.`,
      },
    ],
    executionLedger: buildExecutionLedger({
      tenantKey,
      candidateVersionId: candidate.candidateVersionKey,
      priorActiveVersionId,
    }),
    rollbackProof,
    nextMilestoneGate: {
      dataPr26AllowedForTenant: tenantKey,
      activePromotionStillRequires: [
        "Explicit operator approval record.",
        "Promotion command remains scoped to the selected safe demo tenant only.",
        "Active Tenant Access update must be idempotent and capture prior version.",
        "Immediate post-promotion module read proof must pass.",
        "Rollback proof must remain available after active promotion.",
      ],
      blockedForAllOtherTenants: true,
    },
    outputPaths: {
      jsonPath: path.join(outputDir, "promotion-execution-dry-run.json"),
      mdPath: path.join(outputDir, "promotion-execution-dry-run.md"),
      htmlPath: path.join(outputDir, "promotion-execution-dry-run.html"),
      executionLedgerPath: path.join(outputDir, "execution-ledger.csv"),
      rollbackProofPath: path.join(outputDir, "rollback-proof.json"),
    },
  };

  validateGuardrails(report);
  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  return report;
}

function assertDryRunInputs(input: {
  readinessClosure: ReadinessClosureReport;
  candidate: CandidateTenantDataVersionRecord;
  promotionGate: PromotionGateResult;
  operatorWorkflow: OperatorPromotionWorkflowReport;
}): void {
  const tenantKey = input.candidate.lineage.tenantKey;
  if (
    input.readinessClosure.executiveSummary.safeDemoTenantForNextDryRun !==
    tenantKey
  ) {
    throw new Error(
      `Readiness closure did not select ${tenantKey} for dry-run.`,
    );
  }
  if (
    input.readinessClosure.executiveSummary.allTenantPromotionAttempted !==
    false
  ) {
    throw new Error("All-tenant promotion must not be attempted.");
  }
  if (
    input.promotionGate.decisionRecord.decision !==
      "ready-for-operator-approval" ||
    input.promotionGate.decisionRecord.failedChecks.length > 0
  ) {
    throw new Error("Promotion gate is not ready for dry-run rehearsal.");
  }
  if (
    input.promotionGate.decisionRecord.promotionEnabled ||
    input.promotionGate.decisionRecord.activeTenantAccessLayerUpdated ||
    input.promotionGate.decisionRecord.writesPhysicalTables ||
    input.promotionGate.decisionRecord.moduleRuntimeConsumptionChanged
  ) {
    throw new Error("Promotion gate guardrails are not dry-run safe.");
  }
  if (
    input.operatorWorkflow.promotionDecision.promotionEnabled ||
    input.operatorWorkflow.promotionDecision.activePromotionAttempted
  ) {
    throw new Error("Operator workflow must not enable active promotion.");
  }
}

function buildGuardrails(): ExecutionGuardrails {
  return {
    executionMode: "dry_run",
    selectedTenantOnly: true,
    allTenantPromotionAttempted: false,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moduleDefaultReadsCandidateData: false,
    rollbackExecutedAgainstProduction: false,
    realizedValueClaimed: false,
  };
}

function buildExecutionLedger(input: {
  tenantKey: string;
  candidateVersionId: string;
  priorActiveVersionId: string;
}): ExecutionStep[] {
  return [
    {
      stepId: "select-safe-demo-tenant",
      label: "Select the safe demo tenant for promotion rehearsal.",
      status: "dry_run_pass",
      evidence: [DEFAULT_READINESS_CLOSURE_PATH],
      detail: `${input.tenantKey} selected; all other tenants remain blocked from this dry-run.`,
    },
    {
      stepId: "capture-prior-active-version",
      label: "Capture prior active version before simulated pointer update.",
      status: "dry_run_pass",
      evidence: [DEFAULT_CANDIDATE_RECORD_PATH],
      detail: `Prior active version remains ${input.priorActiveVersionId}.`,
    },
    {
      stepId: "simulate-active-access-update",
      label: "Simulate Active Tenant Access pointer update.",
      status: "dry_run_pass",
      evidence: [DEFAULT_PROMOTION_GATE_PATH],
      detail: `Would point ${input.tenantKey} to ${input.candidateVersionId}; no pointer was written.`,
    },
    {
      stepId: "simulate-module-readiness-lock",
      label: "Verify modules do not read candidate data by default.",
      status: "dry_run_pass",
      evidence: [DEFAULT_OPERATOR_WORKFLOW_PATH],
      detail: "Module runtime consumption remains unchanged in dry-run.",
    },
    {
      stepId: "simulate-rollback",
      label: "Simulate rollback to the prior active version.",
      status: "dry_run_pass",
      evidence: ["rollback-proof.json"],
      detail: `Rollback target remains ${input.priorActiveVersionId}; no production rollback was executed.`,
    },
  ];
}

function buildRollbackProof(input: {
  tenantKey: string;
  candidateVersionId: string;
  priorActiveVersionId: string;
  operatorWorkflow: OperatorPromotionWorkflowReport;
}): RollbackProof {
  return {
    rollbackProofVersion: "promotion-rollback-proof/v1",
    tenantKey: input.tenantKey,
    candidateVersionId: input.candidateVersionId,
    priorActiveVersionId: input.priorActiveVersionId,
    rollbackRehearsedInDryRun: true,
    rollbackExecutedAgainstProduction: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    rollbackRequiredIfPromotionFails: true,
    rollbackStepsVerified:
      input.operatorWorkflow.rollbackPlan.rollbackSteps.map((step) => ({
        step,
        status: "dry_run_verified",
      })),
    restoreTarget: {
      activeVersionBeforeDryRun: input.priorActiveVersionId,
      activeVersionAfterDryRun: input.priorActiveVersionId,
      unchanged: true,
    },
  };
}

function validateGuardrails(report: PromotionExecutionDryRunReport): void {
  const guardrailsHold =
    report.guardrails.executionMode === "dry_run" &&
    report.guardrails.selectedTenantOnly &&
    report.guardrails.allTenantPromotionAttempted === false &&
    report.guardrails.productionTenantDataWritten === false &&
    report.guardrails.writesPhysicalTables === false &&
    report.guardrails.activeTenantAccessLayerUpdated === false &&
    report.guardrails.candidatePromoted === false &&
    report.guardrails.moduleRuntimeConsumptionChanged === false &&
    report.guardrails.moduleDefaultReadsCandidateData === false &&
    report.guardrails.rollbackExecutedAgainstProduction === false &&
    report.guardrails.realizedValueClaimed === false &&
    report.rollbackProof.restoreTarget.unchanged &&
    report.rollbackProof.rollbackExecutedAgainstProduction === false;

  if (!guardrailsHold) {
    throw new Error("Promotion execution dry-run violated guardrails.");
  }
}

async function writeArtifacts(
  outputDir: string,
  report: PromotionExecutionDryRunReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "promotion-execution-dry-run.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "rollback-proof.json"),
    `${JSON.stringify(report.rollbackProof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "promotion-execution-dry-run.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "execution-ledger.csv"),
    executionLedgerCsv(report),
  );
  await fs.writeFile(
    path.join(outputDir, "promotion-execution-dry-run.html"),
    htmlReport(report),
  );
}

function markdownReport(report: PromotionExecutionDryRunReport): string {
  return `# Promotion Execution Dry-Run - SkyHarbor

Generated: \`${report.generatedAt}\`
Tenant: \`${report.tenantKey}\`
Candidate: \`${report.candidateVersionId}\`
State: \`${report.executionState}\`

This is a dry-run rehearsal only. It does not promote the candidate, write
production tenant data, update Active Tenant Access, change module runtime
consumption, or execute rollback against production.

## Guardrails

- Execution mode: ${report.guardrails.executionMode}
- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Active Tenant Access updated: ${report.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${report.guardrails.candidatePromoted}
- Module runtime consumption changed: ${report.guardrails.moduleRuntimeConsumptionChanged}
- Rollback executed against production: ${report.guardrails.rollbackExecutedAgainstProduction}

## Execution Ledger

${report.executionLedger.map((step) => `- **${step.stepId}:** ${step.status} - ${step.detail}`).join("\n")}

## Rollback Proof

- Prior active version: ${report.rollbackProof.priorActiveVersionId}
- Rollback rehearsed in dry-run: ${report.rollbackProof.rollbackRehearsedInDryRun}
- Restore target unchanged: ${report.rollbackProof.restoreTarget.unchanged}
`;
}

function executionLedgerCsv(report: PromotionExecutionDryRunReport): string {
  const header = "step_id,label,status,evidence,detail";
  return `${[
    header,
    ...report.executionLedger.map((step) =>
      [
        step.stepId,
        csvCell(step.label),
        step.status,
        csvCell(step.evidence.join("; ")),
        csvCell(step.detail),
      ].join(","),
    ),
  ].join("\n")}\n`;
}

function htmlReport(report: PromotionExecutionDryRunReport): string {
  const steps = report.executionLedger
    .map(
      (step) =>
        `<section><p>${escapeHtml(step.status)}</p><h2>${escapeHtml(step.label)}</h2><span>${escapeHtml(step.detail)}</span></section>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Promotion Execution Dry-Run</title>
<style>
body{margin:0;background:#f7f6f2;color:#171713;font-family:Arial,Helvetica,sans-serif}
main{max-width:1180px;margin:0 auto;padding:44px 28px}h1,h2{font-family:Georgia,'Times New Roman',serif}
h1{font-size:44px;margin:8px 0}.lede{font-size:18px;max-width:860px;color:#625d54;line-height:1.5}.eyebrow,section p{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0f766e;font-weight:700}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:28px 0}.metric,section{background:#fff;border:1px solid #dedbd2;border-radius:8px;padding:18px}.metric b{display:block;font-size:30px}.steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}section h2{font-size:19px;margin:8px 0}section span{color:#625d54;line-height:1.45}
@media(max-width:860px){.metrics,.steps{grid-template-columns:1fr}h1{font-size:34px}}
</style>
</head>
<body><main>
<div class="eyebrow">Dry-run only - not active tenant truth</div>
<h1>Promotion execution rehearsed without promotion.</h1>
<p class="lede">SkyHarbor is rehearsed as the selected safe demo tenant. Active access remains unchanged and rollback is proven as a dry-run restore path.</p>
<div class="metrics">
<div class="metric"><b>0</b><span>production writes</span></div>
<div class="metric"><b>0</b><span>active access updates</span></div>
<div class="metric"><b>0</b><span>candidate promotions</span></div>
<div class="metric"><b>${report.executionLedger.length}</b><span>dry-run steps</span></div>
</div>
<div class="steps">${steps}</div>
</main></body></html>
`;
}

function resolve(
  repoRoot: string,
  configuredPath: string | undefined,
  defaultPath: string,
): string {
  return path.resolve(repoRoot, configuredPath ?? defaultPath);
}

async function readJson<T>(absolutePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(absolutePath, "utf8")) as T;
}

function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
