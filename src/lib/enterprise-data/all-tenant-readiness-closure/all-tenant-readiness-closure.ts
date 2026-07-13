import fs from "node:fs/promises";
import path from "node:path";

import type {
  AllTenantCandidateBatchReport,
  TenantBatchRow,
} from "../all-tenant-candidate-batch/all-tenant-candidate-batch";

type ClosureState =
  | "candidate_preview_ready_not_active_ready"
  | "remediation_ready"
  | "blocked";

type PromotionDisposition =
  | "safe_demo_candidate_for_dry_run_rehearsal"
  | "requires_packet_and_mapping_remediation"
  | "requires_evidence_collection";

interface ClosureGuardrails {
  reportOnly: true;
  dryRunOnly: true;
  productionTenantDataWritten: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  writesPhysicalTables: false;
  moduleRuntimeConsumptionChanged: false;
  candidateReadByDefault: false;
  allTenantActivePromotion: false;
  realizedValueClaimed: false;
}

interface ClosureRow {
  tenantKey: string;
  displayName: string;
  closureState: ClosureState;
  readinessStatus: TenantBatchRow["readinessStatus"];
  promotionDisposition: PromotionDisposition;
  sourcePacksFound: number;
  sourceDataFound: boolean;
  movesDataFound: boolean;
  towerDataFound: boolean;
  candidateRecordsGenerated: number;
  targetOperationsPlanned: number;
  strandedIntelligenceCount: number;
  unmappedFields: string[];
  blockers: string[];
  closureActions: string[];
  minimumEvidenceNeeded: string[];
  readyForPr25DryRun: boolean;
  readyForActivePromotion: false;
  activePromotionBlockedBy: string[];
}

export interface AllTenantReadinessClosureReport {
  reportVersion: "all-tenant-readiness-closure/v1";
  generatedAt: string;
  qualityGateStatus: "pass";
  guardrails: ClosureGuardrails;
  executiveSummary: {
    totalTenantsScanned: number;
    candidatePreviewReadyTenants: number;
    remediationReadyTenants: number;
    blockedTenants: number;
    safeDemoTenantForNextDryRun: string | null;
    activePromotionReadyTenants: 0;
    allTenantPromotionAttempted: false;
    productDecision: string;
  };
  tenantClosure: ClosureRow[];
  recurringRemediationThemes: Array<{ theme: string; tenantCount: number }>;
  nextMilestones: Array<{
    milestone: string;
    allowedScope: string;
    blockedScope: string;
  }>;
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    csvPath: string;
  };
}

export interface AllTenantReadinessClosureOptions {
  repoRoot: string;
  generatedAt?: string;
  outputDir?: string;
  allTenantBatchPath?: string;
}

const DEFAULT_INPUT_PATH =
  "reports/all-tenant-candidate-batch/all-tenant-candidate-batch.json";
const DEFAULT_OUTPUT_DIR = "reports/all-tenant-readiness-closure";

export async function buildAllTenantReadinessClosure(
  options: AllTenantReadinessClosureOptions,
): Promise<AllTenantReadinessClosureReport> {
  const generatedAt = options.generatedAt ?? "2026-07-13T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const batch = await readJson<AllTenantCandidateBatchReport>(
    path.resolve(
      options.repoRoot,
      options.allTenantBatchPath ?? DEFAULT_INPUT_PATH,
    ),
  );

  validateBatchGuardrails(batch);
  const tenantClosure = batch.tenants.map(buildClosureRow);
  const safeDemoTenant =
    tenantClosure.find((row) => row.readyForPr25DryRun)?.tenantKey ?? null;

  const report: AllTenantReadinessClosureReport = {
    reportVersion: "all-tenant-readiness-closure/v1",
    generatedAt,
    qualityGateStatus: "pass",
    guardrails: buildGuardrails(),
    executiveSummary: {
      totalTenantsScanned: tenantClosure.length,
      candidatePreviewReadyTenants: tenantClosure.filter(
        (row) =>
          row.closureState === "candidate_preview_ready_not_active_ready",
      ).length,
      remediationReadyTenants: tenantClosure.filter(
        (row) => row.closureState === "remediation_ready",
      ).length,
      blockedTenants: tenantClosure.filter(
        (row) => row.closureState === "blocked",
      ).length,
      safeDemoTenantForNextDryRun: safeDemoTenant,
      activePromotionReadyTenants: 0,
      allTenantPromotionAttempted: false,
      productDecision:
        safeDemoTenant === null
          ? "No tenant is ready for the next promotion execution dry-run."
          : `${safeDemoTenant} is the only safe tenant for the next promotion execution dry-run; all other tenants remain remediation-only.`,
    },
    tenantClosure,
    recurringRemediationThemes: topThemes(
      tenantClosure.flatMap((row) => row.closureActions),
    ),
    nextMilestones: [
      {
        milestone:
          "DATA-PR25 - Promotion execution dry-run with rollback proof",
        allowedScope:
          safeDemoTenant === null
            ? "Blocked until one safe demo tenant has candidate preview-ready closure."
            : `${safeDemoTenant} only, non-destructive dry-run execution rehearsal.`,
        blockedScope:
          "All-tenant active promotion, production tenant data writes, and default module reads remain blocked.",
      },
      {
        milestone:
          "DATA-PR26 - Active Tenant Access promotion for one safe demo tenant",
        allowedScope:
          "Only after DATA-PR25 proves rollback and explicit operator controls.",
        blockedScope:
          "No tenant other than the selected safe demo tenant may be promoted in this runway.",
      },
      {
        milestone: "DATA-PR29 - Repeatable new-client onboarding proof",
        allowedScope:
          "Use the recurring remediation themes as the pilot intake checklist.",
        blockedScope:
          "Do not treat legacy packs as sufficient without Tenant Packet, mapping, and module-readiness proof.",
      },
    ],
    outputPaths: {
      jsonPath: path.join(outputDir, "all-tenant-readiness-closure.json"),
      mdPath: path.join(outputDir, "all-tenant-readiness-closure.md"),
      htmlPath: path.join(outputDir, "all-tenant-readiness-closure.html"),
      csvPath: path.join(outputDir, "all-tenant-readiness-closure.csv"),
    },
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  return report;
}

function buildClosureRow(tenant: TenantBatchRow): ClosureRow {
  const closureState = classifyClosureState(tenant);
  const activePromotionBlockedBy = [
    "Active promotion requires a separately approved execution release.",
    "Rollback proof must pass before Active Tenant Access can be updated.",
    "Post-promotion module read proof must pass after any promotion.",
  ];
  if (closureState !== "candidate_preview_ready_not_active_ready") {
    activePromotionBlockedBy.push(
      "Tenant is not candidate preview-ready in the current all-tenant batch.",
    );
  }

  return {
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    closureState,
    readinessStatus: tenant.readinessStatus,
    promotionDisposition: promotionDisposition(tenant, closureState),
    sourcePacksFound: tenant.sourcePacksFound.length,
    sourceDataFound: tenant.sourceDataFound,
    movesDataFound: tenant.movesDataFound,
    towerDataFound: tenant.towerDataFound,
    candidateRecordsGenerated: tenant.counts.candidateRecordsGenerated,
    targetOperationsPlanned: tenant.counts.targetOperationsPlanned,
    strandedIntelligenceCount: tenant.strandedIntelligenceCount,
    unmappedFields: tenant.unmappedFields,
    blockers: tenant.blockers,
    closureActions: buildClosureActions(tenant, closureState),
    minimumEvidenceNeeded: tenant.minimumFilesEvidenceNeeded,
    readyForPr25DryRun:
      closureState === "candidate_preview_ready_not_active_ready" &&
      tenant.tenantKey === "skyharbor-air",
    readyForActivePromotion: false,
    activePromotionBlockedBy,
  };
}

function classifyClosureState(tenant: TenantBatchRow): ClosureState {
  if (
    tenant.readinessStatus === "eligible" &&
    tenant.candidateMetadataEligibility === "eligible" &&
    tenant.moduleReadinessPreviewEligibility === "eligible" &&
    tenant.sourceShadowProofEligibility === "eligible"
  ) {
    return "candidate_preview_ready_not_active_ready";
  }
  if (tenant.readinessStatus === "partially_eligible") {
    return "remediation_ready";
  }
  return "blocked";
}

function promotionDisposition(
  tenant: TenantBatchRow,
  closureState: ClosureState,
): PromotionDisposition {
  if (
    closureState === "candidate_preview_ready_not_active_ready" &&
    tenant.tenantKey === "skyharbor-air"
  ) {
    return "safe_demo_candidate_for_dry_run_rehearsal";
  }
  if (tenant.sourcePacksFound.length > 0) {
    return "requires_packet_and_mapping_remediation";
  }
  return "requires_evidence_collection";
}

function buildClosureActions(
  tenant: TenantBatchRow,
  closureState: ClosureState,
): string[] {
  if (closureState === "candidate_preview_ready_not_active_ready") {
    return [
      "Keep candidate inactive until the next dry-run execution proof passes.",
      "Run rollback proof before any Active Tenant Access update.",
      "Run post-promotion module read proof after any approved promotion.",
    ];
  }
  return tenant.recommendedRemediation;
}

function buildGuardrails(): ClosureGuardrails {
  return {
    reportOnly: true,
    dryRunOnly: true,
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    writesPhysicalTables: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    allTenantActivePromotion: false,
    realizedValueClaimed: false,
  };
}

function validateBatchGuardrails(batch: AllTenantCandidateBatchReport): void {
  if (
    !batch.dryRunOnly ||
    batch.productionTenantDataWritten ||
    batch.activeTenantAccessLayerUpdated ||
    batch.candidatePromoted ||
    batch.writesPhysicalTables ||
    batch.moduleRuntimeConsumptionChanged ||
    batch.candidateReadByDefault ||
    batch.realizedValueClaimed
  ) {
    throw new Error(
      "Cannot build readiness closure from a batch that violated non-destructive guardrails.",
    );
  }
}

async function readJson<T>(absolutePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(absolutePath, "utf8")) as T;
}

async function writeArtifacts(
  absoluteOutputDir: string,
  report: AllTenantReadinessClosureReport,
): Promise<void> {
  await fs.mkdir(absoluteOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-readiness-closure.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-readiness-closure.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-readiness-closure.csv"),
    csvReport(report),
  );
  await fs.writeFile(
    path.join(absoluteOutputDir, "all-tenant-readiness-closure.html"),
    htmlReport(report),
  );
}

function markdownReport(report: AllTenantReadinessClosureReport): string {
  const rows = report.tenantClosure
    .map(
      (row) =>
        `| ${row.tenantKey} | ${row.closureState} | ${row.promotionDisposition} | ${row.readyForPr25DryRun ? "yes" : "no"} | ${row.readyForActivePromotion ? "yes" : "no"} | ${row.closureActions.join("; ")} |`,
    )
    .join("\n");
  return `# All-Tenant Remediation / Readiness Closure

Generated: \`${report.generatedAt}\`

This is a non-destructive closure report. It converts the all-tenant candidate
batch into explicit closure states for the next data runway. It does not write
production tenant data, update Active Tenant Access, promote candidates, change
module runtime behavior, or make modules read candidate data by default.

## Executive Summary

- Tenants scanned: ${report.executiveSummary.totalTenantsScanned}
- Candidate preview-ready, not active-ready: ${report.executiveSummary.candidatePreviewReadyTenants}
- Remediation-ready tenants: ${report.executiveSummary.remediationReadyTenants}
- Blocked tenants: ${report.executiveSummary.blockedTenants}
- Active-promotion-ready tenants: ${report.executiveSummary.activePromotionReadyTenants}
- Safe demo tenant for next dry-run: ${report.executiveSummary.safeDemoTenantForNextDryRun ?? "None"}
- Product decision: ${report.executiveSummary.productDecision}

## Tenant Closure

<!-- prettier-ignore -->
| Tenant | Closure state | Promotion disposition | Ready for PR25 dry-run | Ready for active promotion | Closure actions |
| --- | --- | --- | --- | --- | --- |
${rows}

## Recurring Remediation Themes

${report.recurringRemediationThemes.map((item) => `- ${item.theme} (${item.tenantCount})`).join("\n")}

## Next Milestones

${report.nextMilestones.map((item) => `- **${item.milestone}:** allowed: ${item.allowedScope} blocked: ${item.blockedScope}`).join("\n")}
`;
}

function csvReport(report: AllTenantReadinessClosureReport): string {
  const headers = [
    "tenant",
    "display_name",
    "closure_state",
    "promotion_disposition",
    "source_packs_found",
    "source_data_found",
    "moves_data_found",
    "tower_data_found",
    "candidate_records_generated",
    "target_operations_planned",
    "stranded_intelligence_count",
    "ready_for_pr25_dry_run",
    "ready_for_active_promotion",
    "blockers",
    "closure_actions",
    "minimum_evidence_needed",
    "active_promotion_blocked_by",
  ];
  return `${headers.join(",")}\n${report.tenantClosure
    .map((row) =>
      headers
        .map((header) =>
          csvCell(
            {
              tenant: row.tenantKey,
              display_name: row.displayName,
              closure_state: row.closureState,
              promotion_disposition: row.promotionDisposition,
              source_packs_found: String(row.sourcePacksFound),
              source_data_found: String(row.sourceDataFound),
              moves_data_found: String(row.movesDataFound),
              tower_data_found: String(row.towerDataFound),
              candidate_records_generated: String(
                row.candidateRecordsGenerated,
              ),
              target_operations_planned: String(row.targetOperationsPlanned),
              stranded_intelligence_count: String(
                row.strandedIntelligenceCount,
              ),
              ready_for_pr25_dry_run: String(row.readyForPr25DryRun),
              ready_for_active_promotion: String(row.readyForActivePromotion),
              blockers: row.blockers.join("; "),
              closure_actions: row.closureActions.join("; "),
              minimum_evidence_needed: row.minimumEvidenceNeeded.join("; "),
              active_promotion_blocked_by:
                row.activePromotionBlockedBy.join("; "),
            }[header] ?? "",
          ),
        )
        .join(","),
    )
    .join("\n")}\n`;
}

function htmlReport(report: AllTenantReadinessClosureReport): string {
  const cards = report.tenantClosure
    .map(
      (row) => `<section class="tenant">
  <div class="tenant-head">
    <div>
      <p>${escapeHtml(row.tenantKey)}</p>
      <h2>${escapeHtml(row.displayName)}</h2>
    </div>
    <span class="badge ${row.closureState}">${row.closureState.replaceAll("_", " ")}</span>
  </div>
  <dl>
    <div><dt>Source packs</dt><dd>${row.sourcePacksFound}</dd></div>
    <div><dt>Candidate records</dt><dd>${row.candidateRecordsGenerated}</dd></div>
    <div><dt>Target ops</dt><dd>${row.targetOperationsPlanned}</dd></div>
    <div><dt>PR25 dry-run</dt><dd>${row.readyForPr25DryRun ? "Yes" : "No"}</dd></div>
  </dl>
  <h3>Closure actions</h3>
  <ul>${row.closureActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  <h3>Active promotion blocked by</h3>
  <ul>${row.activePromotionBlockedBy.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
</section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>All-Tenant Readiness Closure</title>
<style>
body{margin:0;background:#f7f6f2;color:#181713;font-family:Arial,Helvetica,sans-serif}
main{max-width:1240px;margin:0 auto;padding:42px 28px}
h1,h2,h3{font-family:Georgia,'Times New Roman',serif}
h1{font-size:44px;margin:0 0 10px}.lead{max-width:900px;color:#625d54;font-size:18px;line-height:1.5}
.summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:28px 0}
.metric,.tenant{background:#fff;border:1px solid #dedbd3;border-radius:8px;padding:18px}.metric b{display:block;font-size:30px}
.metric span,.tenant-head p,.eyebrow,dt{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#777168}
.tenant{margin:16px 0}.tenant-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
.tenant h2{margin:4px 0 0;font-size:25px}.badge{border-radius:999px;padding:8px 11px;font-weight:700;background:#ece8df}
.candidate_preview_ready_not_active_ready{background:#dff4eb;color:#106244}.remediation_ready{background:#fff0cc;color:#855b07}.blocked{background:#f8ded8;color:#8a2718}
dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}dl div{background:#faf9f6;border:1px solid #ebe8df;border-radius:7px;padding:12px}dd{font-size:24px;font-weight:700;margin:4px 0 0}
li{margin:6px 0}
</style>
</head>
<body>
<main>
<p class="eyebrow">Shadow proof only - no active promotion</p>
<h1>All-Tenant Remediation / Readiness Closure</h1>
<p class="lead">${escapeHtml(report.executiveSummary.productDecision)}</p>
<section class="summary">
<div class="metric"><b>${report.executiveSummary.totalTenantsScanned}</b><span>tenants</span></div>
<div class="metric"><b>${report.executiveSummary.candidatePreviewReadyTenants}</b><span>preview-ready</span></div>
<div class="metric"><b>${report.executiveSummary.remediationReadyTenants}</b><span>remediation-ready</span></div>
<div class="metric"><b>${report.executiveSummary.blockedTenants}</b><span>blocked</span></div>
<div class="metric"><b>${report.executiveSummary.activePromotionReadyTenants}</b><span>active-ready</span></div>
</section>
${cards}
</main>
</body>
</html>
`;
}

function topThemes(
  items: string[],
): Array<{ theme: string; tenantCount: number }> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, 10)
    .map(([theme, tenantCount]) => ({ theme, tenantCount }));
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
