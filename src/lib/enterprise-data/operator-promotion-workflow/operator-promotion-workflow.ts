import fs from "node:fs/promises";
import path from "node:path";

type QualityGateStatus = "pass" | "fail";
type StepStatus = "defined" | "blocked" | "operator_required";

interface CandidatePreviewModeReport {
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: string;
  previewModeState: string;
  explicitPreviewReadiness: {
    runtimeReadyModules: 0;
    defaultCandidateReads: false;
    activeAccessUnchanged: true;
    promotionDisabled: true;
  };
  guardrails: {
    defaultEnabled: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    moduleDefaultReadsCandidateData: false;
    runtimeRoutesChanged: false;
    promotionEnabled: false;
    realizedValueClaimed: false;
  };
}

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
    requiredProofChecks: Array<{
      checkId: string;
      status: string;
      detail: string;
    }>;
    failedChecks: string[];
    blockers: string[];
  };
}

interface WorkflowGuardrails {
  workflowDefinedOnly: true;
  promotionExecutionEnabled: false;
  operatorApprovalCaptured: false;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  moduleDefaultReadsCandidateData: false;
  runtimeRoutesChanged: false;
  rollbackExecuted: false;
  realizedValueClaimed: false;
}

interface WorkflowStep {
  stepId: string;
  label: string;
  status: StepStatus;
  requiredEvidence: string[];
  blocksPromotionUntil: string;
}

interface ApprovalChecklistItem {
  itemId: string;
  label: string;
  required: true;
  status: "not_requested";
  evidenceRequired: string;
}

interface RollbackPlan {
  rollbackPlanId: string;
  required: true;
  testedInThisRelease: false;
  activeVersionBeforePromotion: "unchanged";
  rollbackSteps: string[];
  rollbackBlockedUntil: string[];
}

export interface OperatorPromotionWorkflowReport {
  reportVersion: "operator-promotion-workflow/v1";
  generatedAt: string;
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: QualityGateStatus;
  workflowState: "defined_disabled_by_default";
  guardrails: WorkflowGuardrails;
  promotionDecision: {
    currentGateDecision: string;
    promotionEnabled: false;
    operatorApprovalRequired: true;
    rollbackPlanRequired: true;
    eligibleForFutureOperatorReview: boolean;
    activePromotionAttempted: false;
  };
  workflowSteps: WorkflowStep[];
  approvalChecklist: ApprovalChecklistItem[];
  rollbackPlan: RollbackPlan;
  blockedActions: string[];
  futureEnablementCriteria: string[];
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    approvalChecklistPath: string;
    rollbackPlanPath: string;
  };
}

export interface OperatorPromotionWorkflowOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
  candidatePreviewModePath?: string;
  promotionGatePath?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/operator-promotion-workflow/skyharbor";
const DEFAULT_PREVIEW_MODE_PATH =
  "reports/candidate-preview-mode/skyharbor/candidate-preview-mode.json";
const DEFAULT_PROMOTION_GATE_PATH =
  "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json";

export async function buildOperatorPromotionWorkflow(
  options: OperatorPromotionWorkflowOptions,
): Promise<OperatorPromotionWorkflowReport> {
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const previewMode = await readJson<CandidatePreviewModeReport>(
    path.resolve(
      options.repoRoot,
      options.candidatePreviewModePath ?? DEFAULT_PREVIEW_MODE_PATH,
    ),
  );
  const promotionGate = await readJson<PromotionGateResult>(
    path.resolve(
      options.repoRoot,
      options.promotionGatePath ?? DEFAULT_PROMOTION_GATE_PATH,
    ),
  );
  const guardrails = buildGuardrails();
  const workflowSteps = buildWorkflowSteps(promotionGate, previewMode);
  const approvalChecklist = buildApprovalChecklist();
  const rollbackPlan = buildRollbackPlan();
  const report: OperatorPromotionWorkflowReport = {
    reportVersion: "operator-promotion-workflow/v1",
    generatedAt,
    tenantKey: previewMode.tenantKey,
    candidateVersionId: previewMode.candidateVersionId,
    qualityGateStatus: qualityGateStatus({
      previewMode,
      promotionGate,
      guardrails,
      workflowSteps,
    }),
    workflowState: "defined_disabled_by_default",
    guardrails,
    promotionDecision: {
      currentGateDecision: promotionGate.decisionRecord.decision,
      promotionEnabled: false,
      operatorApprovalRequired: true,
      rollbackPlanRequired: true,
      eligibleForFutureOperatorReview:
        promotionGate.decisionRecord.decision === "ready-for-operator-approval",
      activePromotionAttempted: false,
    },
    workflowSteps,
    approvalChecklist,
    rollbackPlan,
    blockedActions: [
      "Promotion execution.",
      "Active Tenant Access Layer pointer update.",
      "Physical production table writes.",
      "Default module reads from candidate data.",
      "Runtime Module Memory writes.",
      "Runtime Outcome Ledger writes.",
      "Rollback execution.",
      "Realized value or ROI claims.",
    ],
    futureEnablementCriteria: [
      "Operator approval captured with named approver and timestamp.",
      "Rollback plan tested in a non-production or isolated promotion rehearsal.",
      "Active access update command implemented with idempotency key and prior-version capture.",
      "Signed-in preview proof confirms candidate labels and active-only fallback.",
      "Post-promotion validation and rollback window are approved.",
    ],
    outputPaths: {
      jsonPath: path.join(outputDir, "operator-promotion-workflow.json"),
      mdPath: path.join(outputDir, "operator-promotion-workflow.md"),
      htmlPath: path.join(outputDir, "operator-promotion-workflow.html"),
      approvalChecklistPath: path.join(outputDir, "approval-checklist.csv"),
      rollbackPlanPath: path.join(outputDir, "rollback-plan.json"),
    },
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  if (report.qualityGateStatus !== "pass") {
    throw new Error("Operator promotion workflow quality gate failed.");
  }
  return report;
}

function buildGuardrails(): WorkflowGuardrails {
  return {
    workflowDefinedOnly: true,
    promotionExecutionEnabled: false,
    operatorApprovalCaptured: false,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moduleDefaultReadsCandidateData: false,
    runtimeRoutesChanged: false,
    rollbackExecuted: false,
    realizedValueClaimed: false,
  };
}

function buildWorkflowSteps(
  promotionGate: PromotionGateResult,
  previewMode: CandidatePreviewModeReport,
): WorkflowStep[] {
  return [
    {
      stepId: "review-candidate-control",
      label: "Review candidate readiness control and preview-mode proof.",
      status: previewMode.qualityGateStatus === "pass" ? "defined" : "blocked",
      requiredEvidence: [DEFAULT_PREVIEW_MODE_PATH],
      blocksPromotionUntil:
        "Preview mode proof passes and stays disabled by default.",
    },
    {
      stepId: "review-promotion-gate",
      label: "Review promotion gate checks and blockers.",
      status:
        promotionGate.decisionRecord.failedChecks?.length === 0
          ? "defined"
          : "blocked",
      requiredEvidence: [DEFAULT_PROMOTION_GATE_PATH],
      blocksPromotionUntil: "Promotion gate has no failed checks.",
    },
    {
      stepId: "capture-operator-approval",
      label: "Capture named operator approval.",
      status: "operator_required",
      requiredEvidence: ["operator approval record"],
      blocksPromotionUntil:
        "Approver identity, approval timestamp, and scope are recorded.",
    },
    {
      stepId: "confirm-rollback",
      label: "Confirm rollback plan and prior active version.",
      status: "operator_required",
      requiredEvidence: [
        "rollback rehearsal evidence",
        "prior active version id",
      ],
      blocksPromotionUntil: "Rollback plan is reviewed and rehearsed.",
    },
    {
      stepId: "enable-promotion-in-future-release",
      label: "Enable promotion only in a future approved release.",
      status: "blocked",
      requiredEvidence: ["future release approval"],
      blocksPromotionUntil: "This release keeps promotion execution disabled.",
    },
  ];
}

function buildApprovalChecklist(): ApprovalChecklistItem[] {
  return [
    {
      itemId: "operator-identity",
      label: "Named operator identity captured.",
      required: true,
      status: "not_requested",
      evidenceRequired: "Approver name, role, and timestamp.",
    },
    {
      itemId: "scope-acknowledgement",
      label: "Candidate scope and tenant acknowledged.",
      required: true,
      status: "not_requested",
      evidenceRequired: "Tenant key, candidate version, and module scope.",
    },
    {
      itemId: "not-active-truth-acknowledgement",
      label: "Candidate is not active runtime truth until promotion executes.",
      required: true,
      status: "not_requested",
      evidenceRequired: "Explicit acknowledgement.",
    },
    {
      itemId: "rollback-approval",
      label: "Rollback plan accepted.",
      required: true,
      status: "not_requested",
      evidenceRequired: "Rollback plan signoff and rehearsal result.",
    },
  ];
}

function buildRollbackPlan(): RollbackPlan {
  return {
    rollbackPlanId: "skyharbor-candidate-rollback-plan",
    required: true,
    testedInThisRelease: false,
    activeVersionBeforePromotion: "unchanged",
    rollbackSteps: [
      "Capture prior active tenant data version before any future promotion.",
      "Keep prior active version addressable during rollback window.",
      "Repoint Active Tenant Access Layer to prior version only through approved promotion tooling.",
      "Run signed-in smoke proof after rollback.",
      "Record rollback evidence bundle.",
    ],
    rollbackBlockedUntil: [
      "Promotion tooling exists.",
      "Prior active version capture is implemented.",
      "Rollback rehearsal passes.",
    ],
  };
}

function qualityGateStatus(input: {
  previewMode: CandidatePreviewModeReport;
  promotionGate: PromotionGateResult;
  guardrails: WorkflowGuardrails;
  workflowSteps: WorkflowStep[];
}): QualityGateStatus {
  const guardrailsHold =
    input.guardrails.workflowDefinedOnly &&
    input.guardrails.promotionExecutionEnabled === false &&
    input.guardrails.operatorApprovalCaptured === false &&
    input.guardrails.productionTenantDataWritten === false &&
    input.guardrails.writesPhysicalTables === false &&
    input.guardrails.activeTenantAccessLayerUpdated === false &&
    input.guardrails.candidatePromoted === false &&
    input.guardrails.moduleRuntimeConsumptionChanged === false &&
    input.guardrails.moduleDefaultReadsCandidateData === false &&
    input.guardrails.runtimeRoutesChanged === false &&
    input.guardrails.rollbackExecuted === false &&
    input.guardrails.realizedValueClaimed === false;

  return guardrailsHold &&
    input.previewMode.qualityGateStatus === "pass" &&
    input.previewMode.explicitPreviewReadiness.defaultCandidateReads ===
      false &&
    input.promotionGate.decisionRecord.promotionEnabled === false &&
    input.workflowSteps.some((step) => step.status === "operator_required") &&
    input.workflowSteps.some((step) => step.status === "blocked")
    ? "pass"
    : "fail";
}

async function writeArtifacts(
  outputDir: string,
  report: OperatorPromotionWorkflowReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "operator-promotion-workflow.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "operator-promotion-workflow.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "operator-promotion-workflow.html"),
    htmlReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "approval-checklist.csv"),
    approvalChecklistCsv(report.approvalChecklist),
  );
  await fs.writeFile(
    path.join(outputDir, "rollback-plan.json"),
    `${JSON.stringify(report.rollbackPlan, null, 2)}\n`,
  );
}

function markdownReport(report: OperatorPromotionWorkflowReport): string {
  const rows = markdownTable(
    ["Step", "Status", "Blocks until"],
    report.workflowSteps.map((step) => [
      step.label,
      step.status,
      step.blocksPromotionUntil,
    ]),
  );
  return `# Operator Promotion Workflow - SkyHarbor

Tenant: \`${report.tenantKey}\`
Candidate: \`${report.candidateVersionId}\`
Generated: \`${report.generatedAt}\`
Quality gate: \`${report.qualityGateStatus}\`
Workflow state: \`${report.workflowState}\`

This report defines the future operator promotion workflow. Promotion execution
is disabled in this release.

## Decision

- Current gate decision: ${report.promotionDecision.currentGateDecision}
- Promotion enabled: ${report.promotionDecision.promotionEnabled}
- Operator approval required: ${report.promotionDecision.operatorApprovalRequired}
- Rollback plan required: ${report.promotionDecision.rollbackPlanRequired}
- Active promotion attempted: ${report.promotionDecision.activePromotionAttempted}

## Workflow Steps

${rows}

## Blocked Actions

${report.blockedActions.map((action) => `- ${action}`).join("\n")}

## Guardrails

- Promotion execution enabled: ${report.guardrails.promotionExecutionEnabled}
- Operator approval captured: ${report.guardrails.operatorApprovalCaptured}
- Active Tenant Access Layer updated: ${report.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${report.guardrails.candidatePromoted}
- Default module reads candidate data: ${report.guardrails.moduleDefaultReadsCandidateData}
- Rollback executed: ${report.guardrails.rollbackExecuted}
- Realized value claimed: ${report.guardrails.realizedValueClaimed}
`;
}

function htmlReport(report: OperatorPromotionWorkflowReport): string {
  const steps = report.workflowSteps
    .map(
      (step) =>
        `<section class="step"><div class="kicker">${escapeHtml(step.status)}</div><h2>${escapeHtml(step.label)}</h2><p>${escapeHtml(step.blocksPromotionUntil)}</p></section>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Operator Promotion Workflow - SkyHarbor</title>
  <style>
    body { margin: 0; background: #f7f6f2; color: #171713; font-family: Arial, Helvetica, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 46px 28px 64px; }
    .eyebrow, .kicker { color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 10px 0; font-family: Georgia, serif; font-size: 44px; line-height: 1.05; }
    .lede { max-width: 860px; color: #5c5a53; font-size: 19px; line-height: 1.48; }
    .metrics, .steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 28px 0; }
    .metric, .step { border: 1px solid #dedbd2; border-radius: 8px; background: #fff; padding: 18px; }
    .metric strong { display: block; font-size: 32px; line-height: 1; }
    .metric span, .step p { color: #68645d; }
    .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .step h2 { margin: 8px 0; font-size: 18px; }
    @media (max-width: 940px) { .metrics, .steps { grid-template-columns: 1fr; } h1 { font-size: 34px; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">AbarVa operator promotion workflow</div>
    <h1>Promotion workflow is defined, but execution remains disabled.</h1>
    <p class="lede">This artifact defines operator approval, rollback, and future enablement criteria without promoting the candidate or changing active runtime truth.</p>
    <section class="metrics">
      <div class="metric"><strong>off</strong><span>promotion execution</span></div>
      <div class="metric"><strong>0</strong><span>active access changes</span></div>
      <div class="metric"><strong>${report.approvalChecklist.length}</strong><span>approval items</span></div>
      <div class="metric"><strong>${report.workflowSteps.length}</strong><span>workflow steps</span></div>
    </section>
    <section class="steps">${steps}</section>
  </main>
</body>
</html>
`;
}

function approvalChecklistCsv(rows: ApprovalChecklistItem[]): string {
  const header = [
    "item_id",
    "label",
    "required",
    "status",
    "evidence_required",
  ].join(",");
  return `${[
    header,
    ...rows.map((row) =>
      [
        row.itemId,
        quote(row.label),
        row.required,
        row.status,
        quote(row.evidenceRequired),
      ].join(","),
    ),
  ].join("\n")}\n`;
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

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
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
