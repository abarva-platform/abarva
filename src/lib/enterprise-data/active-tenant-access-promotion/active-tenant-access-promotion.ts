import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";

interface PromotionExecutionDryRunReport {
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: "pass";
  executionState: "dry_run_rehearsed_not_promoted";
  priorActiveVersionId: string;
  guardrails: {
    executionMode: "dry_run";
    productionTenantDataWritten: false;
    writesPhysicalTables: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    rollbackExecutedAgainstProduction: false;
  };
  rollbackProof: {
    rollbackRehearsedInDryRun: true;
    rollbackExecutedAgainstProduction: false;
    restoreTarget: {
      activeVersionBeforeDryRun: string;
      activeVersionAfterDryRun: string;
      unchanged: true;
    };
  };
}

interface ActivePromotionGuardrails {
  selectedTenantOnly: true;
  allTenantPromotionAttempted: false;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: true;
  candidatePromoted: true;
  moduleRuntimeConsumptionChanged: false;
  moduleDefaultReadsCandidateData: false;
  rollbackExecutedAgainstProduction: false;
  realizedValueClaimed: false;
}

interface ActiveAccessPromotionReceipt {
  receiptVersion: "active-tenant-access-promotion-receipt/v1";
  tenantKey: string;
  promotedCandidateVersionId: string;
  priorActiveVersionId: string;
  newActiveVersionId: string;
  promotedAt: string;
  promotionScope: "safe_demo_tenant_only";
  operatorApproval: {
    captured: true;
    source: "user_directive";
    scope: "skyharbor-only-active-access-metadata-promotion";
    note: string;
  };
  guardrails: ActivePromotionGuardrails;
}

export interface ActiveTenantAccessRecord {
  recordVersion: "active-tenant-access/v1";
  generatedAt: string;
  tenantKey: string;
  activeVersionId: string;
  priorActiveVersionId: string;
  sourceCandidateVersionId: string;
  activeAccessState: "promoted_for_safe_demo_metadata";
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  moduleRuntimeConsumptionChanged: false;
  moduleDefaultReadsCandidateData: false;
  rollbackTargetVersionId: string;
  rollbackProofPath: string;
}

export interface ActiveTenantAccessPromotionReport {
  reportVersion: "active-tenant-access-promotion/v1";
  generatedAt: string;
  qualityGateStatus: "pass";
  tenantKey: string;
  candidateVersionId: string;
  activeAccessRecord: ActiveTenantAccessRecord;
  promotionReceipt: ActiveAccessPromotionReceipt;
  moduleConsumptionBoundary: {
    modulesMayReadActivePointerByDefault: false;
    postPromotionReadProofRequired: true;
    nextMilestone: "DATA-PR27 - Post-promotion module read proof";
  };
  rollbackBoundary: {
    rollbackTargetVersionId: string;
    rollbackProofRequiredAfterPromotion: true;
    nextMilestone: "DATA-PR28 - Rollback proof";
  };
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    activeAccessRecordPath: string;
    promotionReceiptPath: string;
  };
}

export interface ActiveTenantAccessPromotionOptions {
  repoRoot: string;
  generatedAt?: string;
  outputDir?: string;
  candidateRecordPath?: string;
  dryRunReportPath?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/active-tenant-access/skyharbor";
const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_DRY_RUN_REPORT_PATH =
  "reports/promotion-execution-dry-run/skyharbor/promotion-execution-dry-run.json";

export async function buildActiveTenantAccessPromotion(
  options: ActiveTenantAccessPromotionOptions,
): Promise<ActiveTenantAccessPromotionReport> {
  const generatedAt = options.generatedAt ?? "2026-07-13T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const candidate = await readJson<CandidateTenantDataVersionRecord>(
    resolve(
      options.repoRoot,
      options.candidateRecordPath,
      DEFAULT_CANDIDATE_RECORD_PATH,
    ),
  );
  const dryRun = await readJson<PromotionExecutionDryRunReport>(
    resolve(
      options.repoRoot,
      options.dryRunReportPath,
      DEFAULT_DRY_RUN_REPORT_PATH,
    ),
  );

  validateInputs(candidate, dryRun);
  const tenantKey = candidate.lineage.tenantKey;
  const newActiveVersionId = candidate.candidateVersionKey;
  const priorActiveVersionId = dryRun.priorActiveVersionId;
  const guardrails = buildGuardrails();
  const activeAccessRecord: ActiveTenantAccessRecord = {
    recordVersion: "active-tenant-access/v1",
    generatedAt,
    tenantKey,
    activeVersionId: newActiveVersionId,
    priorActiveVersionId,
    sourceCandidateVersionId: candidate.candidateVersionKey,
    activeAccessState: "promoted_for_safe_demo_metadata",
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    moduleRuntimeConsumptionChanged: false,
    moduleDefaultReadsCandidateData: false,
    rollbackTargetVersionId: priorActiveVersionId,
    rollbackProofPath:
      "reports/promotion-execution-dry-run/skyharbor/rollback-proof.json",
  };
  const promotionReceipt: ActiveAccessPromotionReceipt = {
    receiptVersion: "active-tenant-access-promotion-receipt/v1",
    tenantKey,
    promotedCandidateVersionId: candidate.candidateVersionKey,
    priorActiveVersionId,
    newActiveVersionId,
    promotedAt: generatedAt,
    promotionScope: "safe_demo_tenant_only",
    operatorApproval: {
      captured: true,
      source: "user_directive",
      scope: "skyharbor-only-active-access-metadata-promotion",
      note: "Approved in-thread by Anand for DATA-PR26 after DATA-PR25 dry-run and rollback proof.",
    },
    guardrails,
  };
  const report: ActiveTenantAccessPromotionReport = {
    reportVersion: "active-tenant-access-promotion/v1",
    generatedAt,
    qualityGateStatus: "pass",
    tenantKey,
    candidateVersionId: candidate.candidateVersionKey,
    activeAccessRecord,
    promotionReceipt,
    moduleConsumptionBoundary: {
      modulesMayReadActivePointerByDefault: false,
      postPromotionReadProofRequired: true,
      nextMilestone: "DATA-PR27 - Post-promotion module read proof",
    },
    rollbackBoundary: {
      rollbackTargetVersionId: priorActiveVersionId,
      rollbackProofRequiredAfterPromotion: true,
      nextMilestone: "DATA-PR28 - Rollback proof",
    },
    outputPaths: {
      jsonPath: path.join(outputDir, "active-tenant-access-promotion.json"),
      mdPath: path.join(outputDir, "active-tenant-access-promotion.md"),
      htmlPath: path.join(outputDir, "active-tenant-access-promotion.html"),
      activeAccessRecordPath: path.join(
        outputDir,
        "active-tenant-access-record.json",
      ),
      promotionReceiptPath: path.join(outputDir, "promotion-receipt.json"),
    },
  };

  validateReport(report);
  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  return report;
}

function validateInputs(
  candidate: CandidateTenantDataVersionRecord,
  dryRun: PromotionExecutionDryRunReport,
): void {
  if (candidate.lineage.tenantKey !== "skyharbor-air") {
    throw new Error(
      "DATA-PR26 may only promote the SkyHarbor safe demo tenant.",
    );
  }
  if (
    dryRun.tenantKey !== candidate.lineage.tenantKey ||
    dryRun.candidateVersionId !== candidate.candidateVersionKey ||
    dryRun.qualityGateStatus !== "pass" ||
    dryRun.executionState !== "dry_run_rehearsed_not_promoted"
  ) {
    throw new Error("Promotion dry-run proof is missing or not aligned.");
  }
  if (
    dryRun.guardrails.productionTenantDataWritten ||
    dryRun.guardrails.writesPhysicalTables ||
    dryRun.guardrails.activeTenantAccessLayerUpdated ||
    dryRun.guardrails.candidatePromoted ||
    dryRun.guardrails.moduleRuntimeConsumptionChanged ||
    dryRun.guardrails.rollbackExecutedAgainstProduction
  ) {
    throw new Error("Dry-run proof crossed a production mutation boundary.");
  }
  if (
    !dryRun.rollbackProof.rollbackRehearsedInDryRun ||
    dryRun.rollbackProof.rollbackExecutedAgainstProduction ||
    !dryRun.rollbackProof.restoreTarget.unchanged
  ) {
    throw new Error("Rollback dry-run proof is not valid.");
  }
}

function buildGuardrails(): ActivePromotionGuardrails {
  return {
    selectedTenantOnly: true,
    allTenantPromotionAttempted: false,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: true,
    candidatePromoted: true,
    moduleRuntimeConsumptionChanged: false,
    moduleDefaultReadsCandidateData: false,
    rollbackExecutedAgainstProduction: false,
    realizedValueClaimed: false,
  };
}

function validateReport(report: ActiveTenantAccessPromotionReport): void {
  const guardrails = report.promotionReceipt.guardrails;
  const valid =
    guardrails.selectedTenantOnly &&
    guardrails.allTenantPromotionAttempted === false &&
    guardrails.productionTenantDataWritten === false &&
    guardrails.writesPhysicalTables === false &&
    guardrails.activeTenantAccessLayerUpdated === true &&
    guardrails.candidatePromoted === true &&
    guardrails.moduleRuntimeConsumptionChanged === false &&
    guardrails.moduleDefaultReadsCandidateData === false &&
    guardrails.rollbackExecutedAgainstProduction === false &&
    guardrails.realizedValueClaimed === false &&
    report.activeAccessRecord.activeVersionId === report.candidateVersionId &&
    report.moduleConsumptionBoundary.postPromotionReadProofRequired;
  if (!valid) {
    throw new Error("Active Tenant Access promotion report failed guardrails.");
  }
}

async function writeArtifacts(
  outputDir: string,
  report: ActiveTenantAccessPromotionReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-promotion.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-record.json"),
    `${JSON.stringify(report.activeAccessRecord, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "promotion-receipt.json"),
    `${JSON.stringify(report.promotionReceipt, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-promotion.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "active-tenant-access-promotion.html"),
    htmlReport(report),
  );
}

function markdownReport(report: ActiveTenantAccessPromotionReport): string {
  return `# Active Tenant Access Promotion - SkyHarbor

Generated: \`${report.generatedAt}\`
Tenant: \`${report.tenantKey}\`
Active version: \`${report.activeAccessRecord.activeVersionId}\`
Prior active version: \`${report.activeAccessRecord.priorActiveVersionId}\`

This promotes the safe demo tenant Active Tenant Access metadata pointer only.
It does not write production tenant data, write physical tables, change module
runtime consumption, make modules read promoted data by default, execute
rollback, or claim realized value.

## Promotion Receipt

- Active Tenant Access updated: ${report.promotionReceipt.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${report.promotionReceipt.guardrails.candidatePromoted}
- Production tenant data written: ${report.promotionReceipt.guardrails.productionTenantDataWritten}
- Module runtime consumption changed: ${report.promotionReceipt.guardrails.moduleRuntimeConsumptionChanged}
- Post-promotion read proof required: ${report.moduleConsumptionBoundary.postPromotionReadProofRequired}
- Rollback target: ${report.rollbackBoundary.rollbackTargetVersionId}
`;
}

function htmlReport(report: ActiveTenantAccessPromotionReport): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Active Tenant Access Promotion</title>
<style>
body{margin:0;background:#f7f6f2;color:#171713;font-family:Arial,Helvetica,sans-serif}
main{max-width:1080px;margin:0 auto;padding:44px 28px}h1{font-family:Georgia,'Times New Roman',serif;font-size:44px;margin:8px 0}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0f766e;font-weight:700}.lede{font-size:18px;color:#625d54;line-height:1.5;max-width:860px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:28px 0}.card{background:#fff;border:1px solid #dedbd2;border-radius:8px;padding:18px}.card b{display:block;font-size:30px}.card span{color:#625d54}@media(max-width:820px){.grid{grid-template-columns:1fr}h1{font-size:34px}}
</style></head><body><main>
<p class="eyebrow">Safe demo tenant only</p>
<h1>Active Tenant Access pointer promoted.</h1>
<p class="lede">SkyHarbor now has an auditable active metadata pointer to the candidate version. Runtime module consumption remains disabled until DATA-PR27 proves reads.</p>
<section class="grid">
<div class="card"><b>yes</b><span>active access metadata updated</span></div>
<div class="card"><b>0</b><span>production tenant data writes</span></div>
<div class="card"><b>0</b><span>default module reads</span></div>
</section>
<section class="card"><span>Active version</span><b>${escapeHtml(report.activeAccessRecord.activeVersionId)}</b></section>
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
