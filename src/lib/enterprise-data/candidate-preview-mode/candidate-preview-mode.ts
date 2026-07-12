import fs from "node:fs/promises";
import path from "node:path";

type QualityGateStatus = "pass" | "fail";
type PreviewModule = "home" | "intelligence" | "moves" | "source" | "tower";

interface CandidateReadinessControlReport {
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: string;
  readinessState: string;
  executiveSummary: {
    runtimeReady: false;
    activeAccessUnchanged: true;
    promotionDisabled: true;
    blockersRemaining: number;
    exactCriteriaBeforeActivePromotion: string[];
  };
  moduleControl: Array<{
    module: PreviewModule;
    previewPacketAvailable: boolean;
    derivedPlanAvailable: boolean;
    graphPlanAvailable: boolean;
    runtimeConsumptionReady: false;
    readinessStatus: string;
    blockers: string[];
    nextProofNeeded: string;
  }>;
  guardrails: {
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    candidateReadByDefault: false;
    runtimeReady: false;
    promotionEnabled: false;
    operatorApprovalRequired: true;
    realizedValueClaimed: false;
  };
}

interface PreviewModeGuardrails {
  dryRunOnly: true;
  previewModeImplementedAsContractOnly: true;
  defaultEnabled: false;
  explicitFlagRequired: true;
  explicitCandidateSelectionRequired: true;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  moduleDefaultReadsCandidateData: false;
  runtimeRoutesChanged: false;
  promotionEnabled: false;
  realizedValueClaimed: false;
}

interface ModulePreviewSelection {
  module: PreviewModule;
  selectableInPreviewMode: boolean;
  defaultRuntimeSource: "active_tenant_access_layer";
  previewSource: "candidate_context_packet";
  explicitSelectionRequired: true;
  previewPacketAvailable: boolean;
  derivedPlanAvailable: boolean;
  graphPlanAvailable: boolean;
  runtimeConsumptionReady: false;
  blockers: string[];
}

interface PreviewModeRequestContract {
  flagName: "ABARVA_CANDIDATE_PREVIEW_MODE";
  defaultValue: "disabled";
  requiredInputs: string[];
  rejectedWhenMissing: string[];
  allowedPreviewScope: string[];
}

export interface CandidatePreviewModeReport {
  reportVersion: "candidate-preview-mode/v1";
  generatedAt: string;
  tenantKey: string;
  candidateVersionId: string;
  qualityGateStatus: QualityGateStatus;
  previewModeState: "defined_disabled_by_default";
  guardrails: PreviewModeGuardrails;
  requestContract: PreviewModeRequestContract;
  moduleSelections: ModulePreviewSelection[];
  explicitPreviewReadiness: {
    selectableModules: number;
    runtimeReadyModules: 0;
    defaultCandidateReads: false;
    activeAccessUnchanged: true;
    promotionDisabled: true;
  };
  operatorWarnings: string[];
  blockedActions: string[];
  nextProofRequired: string[];
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    moduleMatrixPath: string;
  };
}

export interface CandidatePreviewModeOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
  readinessControlPath?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/candidate-preview-mode/skyharbor";
const DEFAULT_READINESS_CONTROL_PATH =
  "reports/candidate-readiness-control/skyharbor/candidate-readiness-control.json";

export async function buildCandidatePreviewMode(
  options: CandidatePreviewModeOptions,
): Promise<CandidatePreviewModeReport> {
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const control = await readJson<CandidateReadinessControlReport>(
    path.resolve(
      options.repoRoot,
      options.readinessControlPath ?? DEFAULT_READINESS_CONTROL_PATH,
    ),
  );
  const guardrails = buildGuardrails();
  const moduleSelections = control.moduleControl.map(toModuleSelection);
  const report: CandidatePreviewModeReport = {
    reportVersion: "candidate-preview-mode/v1",
    generatedAt,
    tenantKey: control.tenantKey,
    candidateVersionId: control.candidateVersionId,
    qualityGateStatus: qualityGateStatus(control, guardrails, moduleSelections),
    previewModeState: "defined_disabled_by_default",
    guardrails,
    requestContract: {
      flagName: "ABARVA_CANDIDATE_PREVIEW_MODE",
      defaultValue: "disabled",
      requiredInputs: [
        "operatorId",
        "tenantKey",
        "candidateVersionId",
        "module",
        "previewReason",
        "acknowledgedNotActiveRuntimeTruth",
      ],
      rejectedWhenMissing: [
        "explicit feature flag",
        "candidate version",
        "module preview packet",
        "operator acknowledgement",
      ],
      allowedPreviewScope: [
        "read-only module context packet inspection",
        "read-only evidence trace inspection",
        "read-only derived and graph plan inspection",
        "read-only shadow proof review",
      ],
    },
    moduleSelections,
    explicitPreviewReadiness: {
      selectableModules: moduleSelections.filter(
        (selection) => selection.selectableInPreviewMode,
      ).length,
      runtimeReadyModules: 0,
      defaultCandidateReads: false,
      activeAccessUnchanged: true,
      promotionDisabled: true,
    },
    operatorWarnings: [
      "Candidate preview mode is disabled by default.",
      "Preview packets are not active runtime truth.",
      "Preview mode must not advance Moves gates, write Source decisions, or write Tower outcomes.",
      "Promotion remains a separate future operator workflow.",
    ],
    blockedActions: [
      "Default module reads from candidate context.",
      "Active Tenant Access Layer pointer update.",
      "Candidate promotion.",
      "Runtime Module Memory writes.",
      "Runtime Outcome Ledger writes.",
      "Realized value or ROI claims.",
    ],
    nextProofRequired: [
      "Implement a UI/API preview selector behind this explicit flag contract.",
      "Prove signed-in preview reads are visually and programmatically labeled as candidate preview.",
      "Prove disabling the flag returns every module to active-only reads.",
      "Keep promotion disabled until a separate operator workflow is approved.",
    ],
    outputPaths: {
      jsonPath: path.join(outputDir, "candidate-preview-mode.json"),
      mdPath: path.join(outputDir, "candidate-preview-mode.md"),
      htmlPath: path.join(outputDir, "candidate-preview-mode.html"),
      moduleMatrixPath: path.join(
        outputDir,
        "module-preview-selection-matrix.csv",
      ),
    },
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  if (report.qualityGateStatus !== "pass") {
    throw new Error("Candidate preview mode quality gate failed.");
  }
  return report;
}

function buildGuardrails(): PreviewModeGuardrails {
  return {
    dryRunOnly: true,
    previewModeImplementedAsContractOnly: true,
    defaultEnabled: false,
    explicitFlagRequired: true,
    explicitCandidateSelectionRequired: true,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moduleDefaultReadsCandidateData: false,
    runtimeRoutesChanged: false,
    promotionEnabled: false,
    realizedValueClaimed: false,
  };
}

function toModuleSelection(
  row: CandidateReadinessControlReport["moduleControl"][number],
): ModulePreviewSelection {
  return {
    module: row.module,
    selectableInPreviewMode:
      row.previewPacketAvailable && row.derivedPlanAvailable,
    defaultRuntimeSource: "active_tenant_access_layer",
    previewSource: "candidate_context_packet",
    explicitSelectionRequired: true,
    previewPacketAvailable: row.previewPacketAvailable,
    derivedPlanAvailable: row.derivedPlanAvailable,
    graphPlanAvailable: row.graphPlanAvailable,
    runtimeConsumptionReady: false,
    blockers: [
      ...row.blockers,
      "Preview mode is disabled by default.",
      "Candidate data cannot become active runtime truth through preview selection.",
    ],
  };
}

function qualityGateStatus(
  control: CandidateReadinessControlReport,
  guardrails: PreviewModeGuardrails,
  selections: ModulePreviewSelection[],
): QualityGateStatus {
  const guardrailsHold =
    guardrails.defaultEnabled === false &&
    guardrails.explicitFlagRequired &&
    guardrails.explicitCandidateSelectionRequired &&
    guardrails.productionTenantDataWritten === false &&
    guardrails.writesPhysicalTables === false &&
    guardrails.activeTenantAccessLayerUpdated === false &&
    guardrails.candidatePromoted === false &&
    guardrails.moduleRuntimeConsumptionChanged === false &&
    guardrails.moduleDefaultReadsCandidateData === false &&
    guardrails.runtimeRoutesChanged === false &&
    guardrails.promotionEnabled === false &&
    guardrails.realizedValueClaimed === false;

  return guardrailsHold &&
    control.qualityGateStatus === "pass" &&
    control.executiveSummary.runtimeReady === false &&
    control.executiveSummary.activeAccessUnchanged &&
    control.executiveSummary.promotionDisabled &&
    selections.length > 0 &&
    selections.every((selection) => selection.runtimeConsumptionReady === false)
    ? "pass"
    : "fail";
}

async function writeArtifacts(
  outputDir: string,
  report: CandidatePreviewModeReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "candidate-preview-mode.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-preview-mode.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-preview-mode.html"),
    htmlReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "module-preview-selection-matrix.csv"),
    moduleMatrixCsv(report.moduleSelections),
  );
}

function markdownReport(report: CandidatePreviewModeReport): string {
  const rows = markdownTable(
    [
      "Module",
      "Selectable",
      "Default source",
      "Preview source",
      "Runtime-ready",
    ],
    report.moduleSelections.map((selection) => [
      selection.module,
      String(selection.selectableInPreviewMode),
      selection.defaultRuntimeSource,
      selection.previewSource,
      String(selection.runtimeConsumptionReady),
    ]),
  );
  return `# Candidate Preview Mode - SkyHarbor

Tenant: \`${report.tenantKey}\`
Candidate: \`${report.candidateVersionId}\`
Generated: \`${report.generatedAt}\`
Quality gate: \`${report.qualityGateStatus}\`
Preview mode state: \`${report.previewModeState}\`

This report defines an explicit candidate preview mode contract. It is disabled
by default and does not change module runtime behavior.

## Request Contract

- Flag: \`${report.requestContract.flagName}\`
- Default: \`${report.requestContract.defaultValue}\`
- Required inputs: ${report.requestContract.requiredInputs.join(", ")}

## Module Selection Matrix

${rows}

## Blocked Actions

${report.blockedActions.map((action) => `- ${action}`).join("\n")}

## Guardrails

- Default enabled: ${report.guardrails.defaultEnabled}
- Explicit flag required: ${report.guardrails.explicitFlagRequired}
- Active Tenant Access Layer updated: ${report.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${report.guardrails.candidatePromoted}
- Module default reads candidate data: ${report.guardrails.moduleDefaultReadsCandidateData}
- Runtime routes changed: ${report.guardrails.runtimeRoutesChanged}
- Promotion enabled: ${report.guardrails.promotionEnabled}
- Realized value claimed: ${report.guardrails.realizedValueClaimed}
`;
}

function htmlReport(report: CandidatePreviewModeReport): string {
  const modules = report.moduleSelections
    .map(
      (selection) =>
        `<section class="module"><div class="kicker">${escapeHtml(selection.module)}</div><h2>${selection.selectableInPreviewMode ? "Selectable" : "Blocked"}</h2><p>Default source: ${escapeHtml(selection.defaultRuntimeSource)}. Preview source: ${escapeHtml(selection.previewSource)}. Runtime-ready: ${selection.runtimeConsumptionReady}.</p></section>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Candidate Preview Mode - SkyHarbor</title>
  <style>
    body { margin: 0; background: #f7f6f2; color: #171713; font-family: Arial, Helvetica, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 46px 28px 64px; }
    .eyebrow, .kicker { color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 10px 0; font-family: Georgia, serif; font-size: 44px; line-height: 1.05; }
    .lede { max-width: 860px; color: #5c5a53; font-size: 19px; line-height: 1.48; }
    .metrics, .modules { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 28px 0; }
    .metric, .module { border: 1px solid #dedbd2; border-radius: 8px; background: #fff; padding: 18px; }
    .metric strong { display: block; font-size: 32px; line-height: 1; }
    .metric span, .module p { color: #68645d; }
    .modules { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .module h2 { margin: 8px 0; font-size: 18px; }
    @media (max-width: 940px) { .metrics, .modules { grid-template-columns: 1fr; } h1 { font-size: 34px; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">AbarVa candidate preview mode</div>
    <h1>Preview mode is defined, explicit, and disabled by default.</h1>
    <p class="lede">This contract lets a future operator inspect candidate context by explicit flag and explicit candidate selection only. It does not change active module reads, active access, promotion state, or value claims.</p>
    <section class="metrics">
      <div class="metric"><strong>${report.explicitPreviewReadiness.selectableModules}</strong><span>selectable modules</span></div>
      <div class="metric"><strong>0</strong><span>runtime-ready modules</span></div>
      <div class="metric"><strong>off</strong><span>default flag state</span></div>
      <div class="metric"><strong>0</strong><span>active access changes</span></div>
    </section>
    <section class="modules">${modules}</section>
  </main>
</body>
</html>
`;
}

function moduleMatrixCsv(rows: ModulePreviewSelection[]): string {
  const header = [
    "module",
    "selectable_in_preview_mode",
    "default_runtime_source",
    "preview_source",
    "explicit_selection_required",
    "preview_packet_available",
    "derived_plan_available",
    "graph_plan_available",
    "runtime_consumption_ready",
    "blockers",
  ].join(",");
  return `${[
    header,
    ...rows.map((row) =>
      [
        row.module,
        row.selectableInPreviewMode,
        row.defaultRuntimeSource,
        row.previewSource,
        row.explicitSelectionRequired,
        row.previewPacketAvailable,
        row.derivedPlanAvailable,
        row.graphPlanAvailable,
        row.runtimeConsumptionReady,
        quote(row.blockers.join(" | ")),
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
