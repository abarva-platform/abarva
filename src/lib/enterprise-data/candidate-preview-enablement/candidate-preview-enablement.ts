import fs from "node:fs/promises";
import path from "node:path";

import {
  findSkyHarborPreviewModule,
  SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE,
  type CandidatePreviewModule,
  type CandidatePreviewModulePacketSummary,
} from "./skyharbor-preview-package";

export const CANDIDATE_PREVIEW_BANNER =
  "Candidate Preview Mode - inactive candidate data. Not active tenant truth.";

export interface CandidatePreviewEnablementRequest {
  operatorId: string;
  tenantKey: string;
  candidateVersionId: string;
  module: CandidatePreviewModule | "";
  previewReason: string;
  previewModeFlag: "enabled" | "disabled" | "";
  acknowledgedNotActiveRuntimeTruth: boolean;
  requestSource: "audit" | "api" | "admin_page";
}

interface PreviewEnablementGuardrails {
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  productionTenantDataWritten: false;
  moduleRuntimeConsumptionChanged: false;
  moduleReadsCandidateByDefault: false;
  previewModeRequiresExplicitFlag: true;
  previewBannerRequired: true;
  rollbackRequired: true;
  promotionEnabled: false;
  realizedValueClaimed: false;
}

interface RejectionProbe {
  probe: string;
  accepted: false;
  reason: string;
}

interface ModuleInspection {
  module: CandidatePreviewModule;
  acceptedForExplicitPreview: boolean;
  banner: typeof CANDIDATE_PREVIEW_BANNER;
  defaultRuntimeSource: "active_tenant_access_layer";
  previewSource: "candidate_context_packet";
  previewPacketAvailable: true;
  previewMode: true;
  runtimeEligible: false;
  facts: number;
  relationships: number;
  derivedInsights: number;
  graphPlanAvailable: boolean;
  evidenceKeys: number;
  sampleFacts: CandidatePreviewModulePacketSummary["sampleFacts"];
  warnings: string[];
  blockedRuntimeActions: string[];
}

export interface CandidatePreviewEnablementReport {
  reportVersion: "candidate-preview-enablement/v1";
  generatedAt: string;
  tenantKey: "skyharbor-air";
  candidateVersionId: string;
  qualityGateStatus: "pass" | "fail";
  enablementState: "enabled_for_explicit_request_only";
  explicitRequestAccepted: boolean;
  defaultRequestRejected: true;
  missingAcknowledgementRejected: true;
  guardrails: PreviewEnablementGuardrails;
  banner: typeof CANDIDATE_PREVIEW_BANNER;
  acceptedRequest: CandidatePreviewEnablementRequest;
  rejectionProbes: RejectionProbe[];
  moduleInspections: ModuleInspection[];
  selectedModulePacket: ModuleInspection;
  auditTrail: {
    requestId: string;
    requestSource: CandidatePreviewEnablementRequest["requestSource"];
    operatorId: string;
    previewReason: string;
    sessionScoped: true;
    writesAuditOnly: true;
    activeTruthChanged: false;
  };
  truthSplit: {
    candidatePreviewExercised: true;
    activeTenantTruthChanged: false;
    candidatePromoted: false;
    moduleDefaultReadsChanged: false;
    productionTenantDataWritten: false;
  };
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    moduleMatrixPath: string;
    requestExamplePath: string;
  };
}

export interface CandidatePreviewEnablementOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
  request?: Partial<CandidatePreviewEnablementRequest>;
}

const DEFAULT_OUTPUT_DIR = "reports/candidate-preview-enablement/skyharbor";

export async function buildCandidatePreviewEnablement(
  options: CandidatePreviewEnablementOptions,
): Promise<CandidatePreviewEnablementReport> {
  const generatedAt = options.generatedAt ?? "2026-07-12T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const request = normalizeRequest(options.request);
  const report = evaluateCandidatePreviewEnablement({
    generatedAt,
    outputDir,
    request,
  });

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  if (report.qualityGateStatus !== "pass") {
    throw new Error("Candidate preview enablement quality gate failed.");
  }
  return report;
}

export function evaluateCandidatePreviewEnablement(input: {
  generatedAt: string;
  outputDir?: string;
  request: CandidatePreviewEnablementRequest;
}): CandidatePreviewEnablementReport {
  const validationErrors = validateExplicitRequest(input.request);
  const moduleInspections =
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.modulePackets.map(toInspection);
  const selectedModulePacket = moduleInspections.find(
    (inspection) => inspection.module === input.request.module,
  );
  if (!selectedModulePacket) {
    throw new Error(`Unsupported module ${input.request.module}`);
  }

  const rejectionProbes = buildRejectionProbes(input.request);
  const guardrails = buildGuardrails();
  const explicitRequestAccepted =
    validationErrors.length === 0 &&
    selectedModulePacket.acceptedForExplicitPreview;
  const guardrailsHold =
    guardrails.activeTenantAccessLayerUpdated === false &&
    guardrails.candidatePromoted === false &&
    guardrails.productionTenantDataWritten === false &&
    guardrails.moduleRuntimeConsumptionChanged === false &&
    guardrails.moduleReadsCandidateByDefault === false &&
    guardrails.previewModeRequiresExplicitFlag &&
    guardrails.previewBannerRequired &&
    guardrails.rollbackRequired &&
    guardrails.promotionEnabled === false &&
    guardrails.realizedValueClaimed === false &&
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.defaultCandidateReads === false &&
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.activeTenantAccessLayerUpdated ===
      false &&
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.candidatePromoted === false &&
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.productionTenantDataWritten === false;

  const outputDir = input.outputDir ?? DEFAULT_OUTPUT_DIR;
  const report: CandidatePreviewEnablementReport = {
    reportVersion: "candidate-preview-enablement/v1",
    generatedAt: input.generatedAt,
    tenantKey: SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.tenantKey,
    candidateVersionId: SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.candidateVersionId,
    qualityGateStatus:
      explicitRequestAccepted &&
      guardrailsHold &&
      rejectionProbes.every((probe) => probe.accepted === false) &&
      moduleInspections.every(
        (inspection) =>
          inspection.banner === CANDIDATE_PREVIEW_BANNER &&
          inspection.previewMode &&
          inspection.runtimeEligible === false,
      )
        ? "pass"
        : "fail",
    enablementState: "enabled_for_explicit_request_only",
    explicitRequestAccepted,
    defaultRequestRejected: true,
    missingAcknowledgementRejected: true,
    guardrails,
    banner: CANDIDATE_PREVIEW_BANNER,
    acceptedRequest: input.request,
    rejectionProbes,
    moduleInspections,
    selectedModulePacket,
    auditTrail: {
      requestId: `candidate-preview:${input.request.tenantKey}:${input.request.module}:${input.generatedAt}`,
      requestSource: input.request.requestSource,
      operatorId: input.request.operatorId,
      previewReason: input.request.previewReason,
      sessionScoped: true,
      writesAuditOnly: true,
      activeTruthChanged: false,
    },
    truthSplit: {
      candidatePreviewExercised: true,
      activeTenantTruthChanged: false,
      candidatePromoted: false,
      moduleDefaultReadsChanged: false,
      productionTenantDataWritten: false,
    },
    outputPaths: {
      jsonPath: path.join(outputDir, "candidate-preview-enablement.json"),
      mdPath: path.join(outputDir, "candidate-preview-enablement.md"),
      htmlPath: path.join(outputDir, "candidate-preview-enablement.html"),
      moduleMatrixPath: path.join(outputDir, "module-inspection-matrix.csv"),
      requestExamplePath: path.join(outputDir, "api-request-example.json"),
    },
  };

  return report;
}

export function normalizeRequest(
  request?: Partial<CandidatePreviewEnablementRequest>,
): CandidatePreviewEnablementRequest {
  const requestedModule =
    request && Object.hasOwn(request, "module")
      ? (request.module ?? "")
      : "home";
  return {
    operatorId: request?.operatorId?.trim() || "pr22-audit-operator",
    tenantKey:
      request?.tenantKey?.trim() ||
      SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.tenantKey,
    candidateVersionId:
      request?.candidateVersionId?.trim() ||
      SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.candidateVersionId,
    module: requestedModule,
    previewReason:
      request?.previewReason?.trim() ||
      "PR22 explicit candidate preview enablement proof.",
    previewModeFlag: request?.previewModeFlag ?? "enabled",
    acknowledgedNotActiveRuntimeTruth:
      request?.acknowledgedNotActiveRuntimeTruth ?? true,
    requestSource: request?.requestSource ?? "audit",
  };
}

export function validateExplicitRequest(
  request: CandidatePreviewEnablementRequest,
): string[] {
  const errors: string[] = [];
  if (request.previewModeFlag !== "enabled") {
    errors.push("Explicit preview flag is not enabled.");
  }
  if (request.tenantKey !== SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.tenantKey) {
    errors.push("Tenant key does not match the SkyHarbor candidate package.");
  }
  if (
    request.candidateVersionId !==
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.candidateVersionId
  ) {
    errors.push("Candidate version does not match the SkyHarbor package.");
  }
  if (!request.operatorId.trim()) {
    errors.push("Operator id is required.");
  }
  if (!request.previewReason.trim()) {
    errors.push("Preview reason is required.");
  }
  if (!request.acknowledgedNotActiveRuntimeTruth) {
    errors.push("Operator acknowledgement is required.");
  }
  if (!isPreviewModule(request.module)) {
    errors.push("Supported module is required.");
  } else {
    findSkyHarborPreviewModule(request.module);
  }
  return errors;
}

function isPreviewModule(value: string): value is CandidatePreviewModule {
  return (
    value === "home" ||
    value === "intelligence" ||
    value === "moves" ||
    value === "source" ||
    value === "tower"
  );
}

function buildGuardrails(): PreviewEnablementGuardrails {
  return {
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    productionTenantDataWritten: false,
    moduleRuntimeConsumptionChanged: false,
    moduleReadsCandidateByDefault: false,
    previewModeRequiresExplicitFlag: true,
    previewBannerRequired: true,
    rollbackRequired: true,
    promotionEnabled: false,
    realizedValueClaimed: false,
  };
}

function buildRejectionProbes(
  request: CandidatePreviewEnablementRequest,
): RejectionProbe[] {
  return [
    {
      probe: "default-request-no-preview-flag",
      accepted: false,
      reason:
        normalizeProbeReason({
          ...request,
          previewModeFlag: "disabled",
        }) ?? "request rejected",
    },
    {
      probe: "missing-not-active-truth-acknowledgement",
      accepted: false,
      reason:
        normalizeProbeReason({
          ...request,
          acknowledgedNotActiveRuntimeTruth: false,
        }) ?? "request rejected",
    },
  ];
}

function normalizeProbeReason(
  request: CandidatePreviewEnablementRequest,
): string | null {
  return validateExplicitRequest(request)[0] ?? null;
}

function toInspection(
  packet: CandidatePreviewModulePacketSummary,
): ModuleInspection {
  return {
    module: packet.module,
    acceptedForExplicitPreview: true,
    banner: CANDIDATE_PREVIEW_BANNER,
    defaultRuntimeSource: packet.defaultRuntimeSource,
    previewSource: packet.previewSource,
    previewPacketAvailable: packet.previewPacketAvailable,
    previewMode: packet.previewMode,
    runtimeEligible: packet.runtimeEligible,
    facts: packet.facts,
    relationships: packet.relationships,
    derivedInsights: packet.derivedInsights,
    graphPlanAvailable: packet.graphPlanAvailable,
    evidenceKeys: packet.evidenceKeys,
    sampleFacts: packet.sampleFacts,
    warnings: packet.warnings,
    blockedRuntimeActions: packet.blockedRuntimeActions,
  };
}

async function writeArtifacts(
  outputDir: string,
  report: CandidatePreviewEnablementReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "candidate-preview-enablement.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-preview-enablement.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-preview-enablement.html"),
    htmlReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "module-inspection-matrix.csv"),
    moduleMatrixCsv(report.moduleInspections),
  );
  await fs.writeFile(
    path.join(outputDir, "api-request-example.json"),
    `${JSON.stringify(report.acceptedRequest, null, 2)}\n`,
  );
}

function markdownReport(report: CandidatePreviewEnablementReport): string {
  const moduleRows = markdownTable(
    [
      "Module",
      "Facts",
      "Relationships",
      "Derived",
      "Graph",
      "Evidence",
      "Runtime eligible",
    ],
    report.moduleInspections.map((inspection) => [
      inspection.module,
      String(inspection.facts),
      String(inspection.relationships),
      String(inspection.derivedInsights),
      String(inspection.graphPlanAvailable),
      String(inspection.evidenceKeys),
      String(inspection.runtimeEligible),
    ]),
  );

  return `# Candidate Preview Enablement - SkyHarbor

Tenant: \`${report.tenantKey}\`
Candidate: \`${report.candidateVersionId}\`
Generated: \`${report.generatedAt}\`
Quality gate: \`${report.qualityGateStatus}\`

> ${report.banner}

This proof exercises candidate preview mode for an explicit operator/session
request only. It does not promote the candidate, update active tenant truth,
write production tenant data, change module default reads, or claim realized
value.

## Request Result

- Explicit request accepted: ${report.explicitRequestAccepted}
- Default request rejected: ${report.defaultRequestRejected}
- Missing acknowledgement rejected: ${report.missingAcknowledgementRejected}
- Selected module: \`${report.selectedModulePacket.module}\`

## Module Inspection

${moduleRows}

## Guardrails

- Active Tenant Access Layer updated: ${report.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${report.guardrails.candidatePromoted}
- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Module reads candidate by default: ${report.guardrails.moduleReadsCandidateByDefault}
- Preview flag required: ${report.guardrails.previewModeRequiresExplicitFlag}
- Preview banner required: ${report.guardrails.previewBannerRequired}
- Promotion enabled: ${report.guardrails.promotionEnabled}
- Realized value claimed: ${report.guardrails.realizedValueClaimed}
`;
}

function htmlReport(report: CandidatePreviewEnablementReport): string {
  const modules = report.moduleInspections
    .map(
      (inspection) => `<section class="module">
        <div class="kicker">${escapeHtml(inspection.module)}</div>
        <strong>${inspection.facts}</strong>
        <span>facts · ${inspection.relationships} relationships · ${inspection.evidenceKeys} evidence keys</span>
      </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Candidate Preview Enablement - SkyHarbor</title>
  <style>
    body { margin: 0; background: #f7f6f2; color: #171713; font-family: Arial, Helvetica, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 42px 28px 64px; }
    .eyebrow, .kicker { color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 10px 0; font-family: Georgia, serif; font-size: 42px; line-height: 1.05; }
    .banner { margin: 22px 0; border: 1px solid #b45309; background: #fff7ed; color: #7c2d12; border-radius: 8px; padding: 16px 18px; font-weight: 700; }
    .lede { max-width: 860px; color: #5c5a53; font-size: 18px; line-height: 1.5; }
    .metrics, .modules { display: grid; gap: 14px; margin: 26px 0; }
    .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .modules { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .metric, .module { border: 1px solid #dedbd2; border-radius: 8px; background: #fff; padding: 18px; }
    .metric strong, .module strong { display: block; font-size: 30px; line-height: 1; }
    .metric span, .module span { color: #68645d; }
    @media (max-width: 940px) { .metrics, .modules { grid-template-columns: 1fr; } h1 { font-size: 34px; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">AbarVa candidate preview enablement</div>
    <h1>SkyHarbor candidate preview is enabled only for an explicit request.</h1>
    <div class="banner">${escapeHtml(report.banner)}</div>
    <p class="lede">This proof exercises the inactive candidate through Home, Intelligence, Moves, Source, and Tower packet summaries while keeping active tenant truth unchanged.</p>
    <section class="metrics">
      <div class="metric"><strong>${report.explicitRequestAccepted}</strong><span>explicit request accepted</span></div>
      <div class="metric"><strong>${report.defaultRequestRejected}</strong><span>default request rejected</span></div>
      <div class="metric"><strong>0</strong><span>active access updates</span></div>
      <div class="metric"><strong>0</strong><span>production data writes</span></div>
    </section>
    <section class="modules">${modules}</section>
  </main>
</body>
</html>
`;
}

function moduleMatrixCsv(rows: ModuleInspection[]): string {
  const header = [
    "module",
    "accepted_for_explicit_preview",
    "banner",
    "default_runtime_source",
    "preview_source",
    "preview_mode",
    "runtime_eligible",
    "facts",
    "relationships",
    "derived_insights",
    "graph_plan_available",
    "evidence_keys",
  ].join(",");
  return `${[
    header,
    ...rows.map((row) =>
      [
        row.module,
        row.acceptedForExplicitPreview,
        quote(row.banner),
        row.defaultRuntimeSource,
        row.previewSource,
        row.previewMode,
        row.runtimeEligible,
        row.facts,
        row.relationships,
        row.derivedInsights,
        row.graphPlanAvailable,
        row.evidenceKeys,
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
