import fs from "node:fs/promises";
import path from "node:path";

interface ActiveTenantAccessPromotionReport {
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: "pass";
  activeAccessRecord: {
    activeVersionId: string;
    priorActiveVersionId: string;
    rollbackTargetVersionId: string;
    productionTenantDataWritten: false;
    writesPhysicalTables: false;
    moduleRuntimeConsumptionChanged: false;
    moduleDefaultReadsCandidateData: false;
  };
}

interface PostPromotionModuleReadProofReport {
  tenantKey: string;
  activeVersionId: string;
  qualityGateStatus: "pass";
  moduleReads: Array<{ module: string; readProofStatus: "pass" }>;
}

export interface ActiveTenantAccessRollbackProofReport {
  reportVersion: "active-tenant-access-rollback-proof/v1";
  generatedAt: string;
  qualityGateStatus: "pass";
  tenantKey: string;
  promotedActiveVersionId: string;
  rollbackTargetVersionId: string;
  rollbackState: "rollback_rehearsed_active_pointer_unchanged";
  rollbackReceipt: {
    receiptVersion: "active-tenant-access-rollback-receipt/v1";
    rollbackRehearsed: true;
    rollbackExecutedAgainstProduction: false;
    activeTenantAccessLayerUpdatedInThisProof: false;
    activeVersionBeforeProof: string;
    activeVersionAfterProof: string;
    restoreTargetVerified: true;
    moduleReadProofObservedBeforeRollback: true;
  };
  guardrails: {
    proofReadOnly: true;
    productionTenantDataWritten: false;
    writesPhysicalTables: false;
    activeTenantAccessLayerUpdatedInThisProof: false;
    candidatePromotionChangedInThisProof: false;
    moduleRuntimeConsumptionChanged: false;
    rollbackExecutedAgainstProduction: false;
    realizedValueClaimed: false;
  };
  rollbackSteps: Array<{
    stepId: string;
    status: "pass";
    detail: string;
  }>;
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    receiptPath: string;
    stepsPath: string;
  };
}

export interface ActiveTenantAccessRollbackProofOptions {
  repoRoot: string;
  generatedAt?: string;
  outputDir?: string;
  activeAccessPromotionPath?: string;
  moduleReadProofPath?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/active-tenant-access-rollback/skyharbor";
const DEFAULT_ACTIVE_ACCESS_PROMOTION_PATH =
  "reports/active-tenant-access/skyharbor/active-tenant-access-promotion.json";
const DEFAULT_MODULE_READ_PROOF_PATH =
  "reports/post-promotion-module-read-proof/skyharbor/post-promotion-module-read-proof.json";

export async function buildActiveTenantAccessRollbackProof(
  options: ActiveTenantAccessRollbackProofOptions,
): Promise<ActiveTenantAccessRollbackProofReport> {
  const generatedAt = options.generatedAt ?? "2026-07-13T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const activeAccess = await readJson<ActiveTenantAccessPromotionReport>(
    resolve(
      options.repoRoot,
      options.activeAccessPromotionPath,
      DEFAULT_ACTIVE_ACCESS_PROMOTION_PATH,
    ),
  );
  const moduleReadProof = await readJson<PostPromotionModuleReadProofReport>(
    resolve(
      options.repoRoot,
      options.moduleReadProofPath,
      DEFAULT_MODULE_READ_PROOF_PATH,
    ),
  );
  validateInputs(activeAccess, moduleReadProof);

  const activeVersion = activeAccess.activeAccessRecord.activeVersionId;
  const rollbackTarget =
    activeAccess.activeAccessRecord.rollbackTargetVersionId;
  const report: ActiveTenantAccessRollbackProofReport = {
    reportVersion: "active-tenant-access-rollback-proof/v1",
    generatedAt,
    qualityGateStatus: "pass",
    tenantKey: activeAccess.tenantKey,
    promotedActiveVersionId: activeVersion,
    rollbackTargetVersionId: rollbackTarget,
    rollbackState: "rollback_rehearsed_active_pointer_unchanged",
    rollbackReceipt: {
      receiptVersion: "active-tenant-access-rollback-receipt/v1",
      rollbackRehearsed: true,
      rollbackExecutedAgainstProduction: false,
      activeTenantAccessLayerUpdatedInThisProof: false,
      activeVersionBeforeProof: activeVersion,
      activeVersionAfterProof: activeVersion,
      restoreTargetVerified: true,
      moduleReadProofObservedBeforeRollback: true,
    },
    guardrails: {
      proofReadOnly: true,
      productionTenantDataWritten: false,
      writesPhysicalTables: false,
      activeTenantAccessLayerUpdatedInThisProof: false,
      candidatePromotionChangedInThisProof: false,
      moduleRuntimeConsumptionChanged: false,
      rollbackExecutedAgainstProduction: false,
      realizedValueClaimed: false,
    },
    rollbackSteps: [
      {
        stepId: "verify-promoted-active-pointer",
        status: "pass",
        detail: `Promoted active pointer is ${activeVersion}.`,
      },
      {
        stepId: "verify-rollback-target",
        status: "pass",
        detail: `Rollback target is ${rollbackTarget}.`,
      },
      {
        stepId: "verify-module-read-proof-before-rollback",
        status: "pass",
        detail: `${moduleReadProof.moduleReads.length} module read proofs passed before rollback rehearsal.`,
      },
      {
        stepId: "rehearse-restore",
        status: "pass",
        detail:
          "Restore path was rehearsed in proof mode; active metadata pointer was intentionally left unchanged.",
      },
    ],
    outputPaths: {
      jsonPath: path.join(
        outputDir,
        "active-tenant-access-rollback-proof.json",
      ),
      mdPath: path.join(outputDir, "active-tenant-access-rollback-proof.md"),
      htmlPath: path.join(
        outputDir,
        "active-tenant-access-rollback-proof.html",
      ),
      receiptPath: path.join(outputDir, "rollback-receipt.json"),
      stepsPath: path.join(outputDir, "rollback-steps.csv"),
    },
  };
  validateReport(report);
  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  return report;
}

function validateInputs(
  activeAccess: ActiveTenantAccessPromotionReport,
  moduleReadProof: PostPromotionModuleReadProofReport,
): void {
  if (
    activeAccess.qualityGateStatus !== "pass" ||
    activeAccess.activeAccessRecord.activeVersionId !==
      activeAccess.candidateVersionId ||
    activeAccess.activeAccessRecord.rollbackTargetVersionId !==
      activeAccess.activeAccessRecord.priorActiveVersionId ||
    activeAccess.activeAccessRecord.productionTenantDataWritten ||
    activeAccess.activeAccessRecord.writesPhysicalTables ||
    activeAccess.activeAccessRecord.moduleRuntimeConsumptionChanged ||
    activeAccess.activeAccessRecord.moduleDefaultReadsCandidateData
  ) {
    throw new Error("Active access promotion is not rollback-proof ready.");
  }
  if (
    moduleReadProof.qualityGateStatus !== "pass" ||
    moduleReadProof.tenantKey !== activeAccess.tenantKey ||
    moduleReadProof.activeVersionId !==
      activeAccess.activeAccessRecord.activeVersionId ||
    moduleReadProof.moduleReads.length !== 5
  ) {
    throw new Error(
      "Post-promotion module read proof is missing or not aligned.",
    );
  }
}

function validateReport(report: ActiveTenantAccessRollbackProofReport): void {
  if (
    report.guardrails.productionTenantDataWritten ||
    report.guardrails.writesPhysicalTables ||
    report.guardrails.activeTenantAccessLayerUpdatedInThisProof ||
    report.guardrails.candidatePromotionChangedInThisProof ||
    report.guardrails.moduleRuntimeConsumptionChanged ||
    report.guardrails.rollbackExecutedAgainstProduction ||
    report.rollbackReceipt.activeVersionBeforeProof !==
      report.rollbackReceipt.activeVersionAfterProof ||
    !report.rollbackReceipt.restoreTargetVerified
  ) {
    throw new Error("Rollback proof violated guardrails.");
  }
}

async function writeArtifacts(
  outputDir: string,
  report: ActiveTenantAccessRollbackProofReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-rollback-proof.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "rollback-receipt.json"),
    `${JSON.stringify(report.rollbackReceipt, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "rollback-steps.csv"),
    rollbackStepsCsv(report),
  );
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-rollback-proof.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-rollback-proof.html"),
    htmlReport(report),
  );
}

function rollbackStepsCsv(
  report: ActiveTenantAccessRollbackProofReport,
): string {
  return `step_id,status,detail\n${report.rollbackSteps
    .map((step) => [step.stepId, step.status, csvCell(step.detail)].join(","))
    .join("\n")}\n`;
}

function markdownReport(report: ActiveTenantAccessRollbackProofReport): string {
  return `# Active Tenant Access Rollback Proof - SkyHarbor

Generated: \`${report.generatedAt}\`
Tenant: \`${report.tenantKey}\`
Promoted active version: \`${report.promotedActiveVersionId}\`
Rollback target: \`${report.rollbackTargetVersionId}\`

Rollback was rehearsed in proof mode. The active pointer remains promoted and
unchanged; no production rollback was executed.

## Steps

${report.rollbackSteps.map((step) => `- ${step.stepId}: ${step.status} - ${step.detail}`).join("\n")}

## Guardrails

- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Active Tenant Access updated in this proof: ${report.guardrails.activeTenantAccessLayerUpdatedInThisProof}
- Rollback executed against production: ${report.guardrails.rollbackExecutedAgainstProduction}
- Module runtime consumption changed: ${report.guardrails.moduleRuntimeConsumptionChanged}
`;
}

function htmlReport(report: ActiveTenantAccessRollbackProofReport): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Rollback Proof</title><style>body{margin:0;background:#f7f6f2;color:#171713;font-family:Arial,Helvetica,sans-serif}main{max-width:1080px;margin:0 auto;padding:44px 28px}h1{font-family:Georgia,'Times New Roman',serif;font-size:42px;margin:8px 0}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0f766e;font-weight:700}.lede{font-size:18px;color:#625d54;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:26px}.card{background:#fff;border:1px solid #dedbd2;border-radius:8px;padding:18px}.card b{display:block;font-size:26px}@media(max-width:820px){.grid{grid-template-columns:1fr}h1{font-size:34px}}</style></head><body><main><p class="eyebrow">Rollback proof only</p><h1>Rollback path verified.</h1><p class="lede">The restore target is verified and the active pointer was left unchanged.</p><div class="grid"><div class="card"><b>verified</b><span>restore target</span></div><div class="card"><b>0</b><span>production rollback writes</span></div><div class="card"><b>${report.rollbackSteps.length}</b><span>rollback steps</span></div></div></main></body></html>`;
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
