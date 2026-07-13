import fs from "node:fs/promises";
import path from "node:path";

interface AllTenantReadinessClosureReport {
  recurringRemediationThemes: Array<{ theme: string; tenantCount: number }>;
  executiveSummary: {
    totalTenantsScanned: number;
    safeDemoTenantForNextDryRun: string | null;
  };
}

type InputCriticality = "required" | "recommended";
type ProofStatus = "required_before_candidate" | "required_before_promotion";

interface RequiredInputFile {
  fileClass: string;
  criticality: InputCriticality;
  examples: string[];
  mapsToLayer: string;
}

interface OnboardingStep {
  stepId: string;
  label: string;
  owner: "client" | "abarva" | "joint";
  output: string;
  proofGate: ProofStatus;
}

interface TargetLayer {
  layer: string;
  tableFamilies: string[];
  writeMode:
    | "dry_run_first"
    | "candidate_metadata"
    | "active_pointer_after_approval";
}

export interface NewClientOnboardingProofReport {
  reportVersion: "new-client-onboarding-proof/v1";
  generatedAt: string;
  qualityGateStatus: "pass";
  pilotContract: {
    minimumViablePacketName: "standardized-tenant-packet";
    requiredInputFiles: RequiredInputFile[];
    optionalAccelerationFiles: RequiredInputFile[];
  };
  onboardingWorkflow: OnboardingStep[];
  targetDataLayer: TargetLayer[];
  proofGates: Array<{
    gateId: string;
    status: "defined";
    blocksUntil: string;
  }>;
  repeatabilityEvidence: {
    derivedFromTenantsScanned: number;
    referenceTenant: string | null;
    recurringRemediationThemes: Array<{ theme: string; tenantCount: number }>;
  };
  guardrails: {
    proofOnly: true;
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    newClientDataLoaded: false;
    realizedValueClaimed: false;
  };
  outputPaths: {
    jsonPath: string;
    mdPath: string;
    htmlPath: string;
    inputChecklistPath: string;
    workflowPath: string;
  };
}

export interface NewClientOnboardingProofOptions {
  repoRoot: string;
  generatedAt?: string;
  outputDir?: string;
  readinessClosurePath?: string;
}

const DEFAULT_OUTPUT_DIR =
  "reports/new-client-onboarding-proof/reference-pilot";
const DEFAULT_READINESS_CLOSURE_PATH =
  "reports/all-tenant-readiness-closure/all-tenant-readiness-closure.json";

export async function buildNewClientOnboardingProof(
  options: NewClientOnboardingProofOptions,
): Promise<NewClientOnboardingProofReport> {
  const generatedAt = options.generatedAt ?? "2026-07-13T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const closure = await readJson<AllTenantReadinessClosureReport>(
    path.resolve(
      options.repoRoot,
      options.readinessClosurePath ?? DEFAULT_READINESS_CLOSURE_PATH,
    ),
  );

  const report: NewClientOnboardingProofReport = {
    reportVersion: "new-client-onboarding-proof/v1",
    generatedAt,
    qualityGateStatus: "pass",
    pilotContract: {
      minimumViablePacketName: "standardized-tenant-packet",
      requiredInputFiles: requiredInputFiles(),
      optionalAccelerationFiles: optionalAccelerationFiles(),
    },
    onboardingWorkflow: workflowSteps(),
    targetDataLayer: targetLayers(),
    proofGates: proofGates(),
    repeatabilityEvidence: {
      derivedFromTenantsScanned: closure.executiveSummary.totalTenantsScanned,
      referenceTenant: closure.executiveSummary.safeDemoTenantForNextDryRun,
      recurringRemediationThemes: closure.recurringRemediationThemes,
    },
    guardrails: {
      proofOnly: true,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      newClientDataLoaded: false,
      realizedValueClaimed: false,
    },
    outputPaths: {
      jsonPath: path.join(outputDir, "new-client-onboarding-proof.json"),
      mdPath: path.join(outputDir, "new-client-onboarding-proof.md"),
      htmlPath: path.join(outputDir, "new-client-onboarding-proof.html"),
      inputChecklistPath: path.join(outputDir, "pilot-input-checklist.csv"),
      workflowPath: path.join(outputDir, "onboarding-workflow.csv"),
    },
  };
  validateReport(report);
  await writeArtifacts(path.resolve(options.repoRoot, outputDir), report);
  return report;
}

function requiredInputFiles(): RequiredInputFile[] {
  return [
    {
      fileClass: "tenant_manifest",
      criticality: "required",
      examples: ["tenant-manifest.yaml", "tenant-profile.json"],
      mapsToLayer: "Tenant Packet",
    },
    {
      fileClass: "enterprise_profile",
      criticality: "required",
      examples: ["enterprise-profile.csv", "systems-vendors-initiatives.xlsx"],
      mapsToLayer: "Canonical Fact Store",
    },
    {
      fileClass: "evidence_registry",
      criticality: "required",
      examples: ["evidence-registry.csv", "source-file-index.xlsx"],
      mapsToLayer: "Evidence Registry",
    },
    {
      fileClass: "source_events",
      criticality: "required",
      examples: ["contracts.csv", "vendors.csv", "rfp-events.csv"],
      mapsToLayer: "Source Adapter Input",
    },
    {
      fileClass: "moves_artifacts",
      criticality: "required",
      examples: ["moves.csv", "initiative-dossiers.zip", "phase-evidence.csv"],
      mapsToLayer: "Module Memory",
    },
    {
      fileClass: "tower_value_baselines",
      criticality: "required",
      examples: ["value-baselines.csv", "outcome-metrics.xlsx"],
      mapsToLayer: "Outcome Ledger",
    },
    {
      fileClass: "mapping_profiles",
      criticality: "required",
      examples: ["mapping-profile.yaml", "field-map.csv"],
      mapsToLayer: "Canonical Ingestion Contract",
    },
  ];
}

function optionalAccelerationFiles(): RequiredInputFile[] {
  return [
    {
      fileClass: "relationship_edges",
      criticality: "recommended",
      examples: ["system-relationships.csv", "vendor-service-map.xlsx"],
      mapsToLayer: "Enterprise Relationship Graph",
    },
    {
      fileClass: "workshop_outputs",
      criticality: "recommended",
      examples: ["workshop-notes.zip", "decision-log.csv"],
      mapsToLayer: "Derived Intelligence Store",
    },
  ];
}

function workflowSteps(): OnboardingStep[] {
  return [
    step(
      "packet-intake",
      "Collect the standardized Tenant Packet.",
      "client",
      "packet manifest plus source file inventory",
      "required_before_candidate",
    ),
    step(
      "contract-validation",
      "Validate required files and attest synthetic/client-safe boundaries.",
      "abarva",
      "validated packet contract",
      "required_before_candidate",
    ),
    step(
      "adapter-dry-run",
      "Run source adapters into canonical ingestion records.",
      "abarva",
      "canonical ingestion records and quarantine report",
      "required_before_candidate",
    ),
    step(
      "target-writer-plan",
      "Build the target writer dry-run plan.",
      "abarva",
      "fact/evidence/graph/derived write plan",
      "required_before_candidate",
    ),
    step(
      "candidate-version",
      "Persist candidate metadata only.",
      "abarva",
      "inactive candidate tenant data version",
      "required_before_promotion",
    ),
    step(
      "preview-and-readiness",
      "Generate module preview and readiness proof.",
      "joint",
      "Home/Intelligence/Moves/Source/Tower readiness",
      "required_before_promotion",
    ),
    step(
      "promotion-dry-run",
      "Rehearse promotion execution and rollback.",
      "abarva",
      "dry-run ledger and rollback proof",
      "required_before_promotion",
    ),
    step(
      "operator-decision",
      "Approve or reject active access promotion.",
      "joint",
      "operator decision record",
      "required_before_promotion",
    ),
  ];
}

function step(
  stepId: string,
  label: string,
  owner: OnboardingStep["owner"],
  output: string,
  proofGate: ProofStatus,
): OnboardingStep {
  return { stepId, label, owner, output, proofGate };
}

function targetLayers(): TargetLayer[] {
  return [
    {
      layer: "Evidence Registry",
      tableFamilies: [
        "evidence_objects",
        "source_file_index",
        "lineage_events",
      ],
      writeMode: "dry_run_first",
    },
    {
      layer: "Canonical Fact Store",
      tableFamilies: [
        "tenant_facts",
        "systems",
        "vendors",
        "initiatives",
        "metrics",
      ],
      writeMode: "dry_run_first",
    },
    {
      layer: "Enterprise Relationship Graph",
      tableFamilies: ["graph_nodes", "graph_edges", "graph_quality_reports"],
      writeMode: "dry_run_first",
    },
    {
      layer: "Derived Intelligence Store",
      tableFamilies: [
        "derived_profiles",
        "readiness_summaries",
        "remediation_themes",
      ],
      writeMode: "dry_run_first",
    },
    {
      layer: "Candidate Tenant Data Version",
      tableFamilies: [
        "candidate_versions",
        "candidate_proof_links",
        "promotion_gates",
      ],
      writeMode: "candidate_metadata",
    },
    {
      layer: "Active Tenant Access",
      tableFamilies: [
        "active_version_pointer",
        "promotion_receipts",
        "rollback_receipts",
      ],
      writeMode: "active_pointer_after_approval",
    },
  ];
}

function proofGates(): NewClientOnboardingProofReport["proofGates"] {
  return [
    {
      gateId: "required-files-present",
      status: "defined",
      blocksUntil:
        "All required file classes are present or explicitly waived.",
    },
    {
      gateId: "canonical-ingestion-clean",
      status: "defined",
      blocksUntil: "Quarantine and unmapped field counts are reviewed.",
    },
    {
      gateId: "candidate-preview-ready",
      status: "defined",
      blocksUntil: "Module preview packets and readiness matrix exist.",
    },
    {
      gateId: "promotion-dry-run-passed",
      status: "defined",
      blocksUntil: "Promotion and rollback dry-run proof passes.",
    },
    {
      gateId: "operator-approval-captured",
      status: "defined",
      blocksUntil: "Named operator approval is captured for active access.",
    },
  ];
}

function validateReport(report: NewClientOnboardingProofReport): void {
  if (
    report.pilotContract.requiredInputFiles.length < 7 ||
    report.onboardingWorkflow.length < 8 ||
    report.targetDataLayer.length < 6 ||
    report.guardrails.productionTenantDataWritten ||
    report.guardrails.activeTenantAccessLayerUpdated ||
    report.guardrails.candidatePromoted ||
    report.guardrails.moduleRuntimeConsumptionChanged ||
    report.guardrails.newClientDataLoaded
  ) {
    throw new Error("New-client onboarding proof failed guardrails.");
  }
}

async function writeArtifacts(
  outputDir: string,
  report: NewClientOnboardingProofReport,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "new-client-onboarding-proof.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "pilot-input-checklist.csv"),
    inputChecklistCsv(report),
  );
  await fs.writeFile(
    path.join(outputDir, "onboarding-workflow.csv"),
    workflowCsv(report),
  );
  await fs.writeFile(
    path.join(outputDir, "new-client-onboarding-proof.md"),
    markdownReport(report),
  );
  await fs.writeFile(
    path.join(outputDir, "new-client-onboarding-proof.html"),
    htmlReport(report),
  );
}

function inputChecklistCsv(report: NewClientOnboardingProofReport): string {
  const rows = [
    ...report.pilotContract.requiredInputFiles,
    ...report.pilotContract.optionalAccelerationFiles,
  ];
  return `file_class,criticality,examples,maps_to_layer\n${rows
    .map((row) =>
      [
        row.fileClass,
        row.criticality,
        csvCell(row.examples.join("; ")),
        csvCell(row.mapsToLayer),
      ].join(","),
    )
    .join("\n")}\n`;
}

function workflowCsv(report: NewClientOnboardingProofReport): string {
  return `step_id,label,owner,output,proof_gate\n${report.onboardingWorkflow
    .map((row) =>
      [
        row.stepId,
        csvCell(row.label),
        row.owner,
        csvCell(row.output),
        row.proofGate,
      ].join(","),
    )
    .join("\n")}\n`;
}

function markdownReport(report: NewClientOnboardingProofReport): string {
  return `# Repeatable New-Client Onboarding Proof

Generated: \`${report.generatedAt}\`

This proof defines the minimum pilot packet, onboarding workflow, target data
layers, and proof gates for a repeatable new-client onboarding process. It does
not load new-client data or promote any tenant.

## Required Input Files

${report.pilotContract.requiredInputFiles.map((file) => `- ${file.fileClass}: ${file.examples.join(", ")} -> ${file.mapsToLayer}`).join("\n")}

## Workflow

${report.onboardingWorkflow.map((step) => `- ${step.stepId}: ${step.label} (${step.owner})`).join("\n")}

## Guardrails

- Production tenant data written: ${report.guardrails.productionTenantDataWritten}
- Active Tenant Access updated: ${report.guardrails.activeTenantAccessLayerUpdated}
- New client data loaded: ${report.guardrails.newClientDataLoaded}
`;
}

function htmlReport(report: NewClientOnboardingProofReport): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>New Client Onboarding Proof</title><style>body{margin:0;background:#f7f6f2;color:#171713;font-family:Arial,Helvetica,sans-serif}main{max-width:1180px;margin:0 auto;padding:44px 28px}h1,h2{font-family:Georgia,'Times New Roman',serif}h1{font-size:42px;margin:8px 0}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0f766e;font-weight:700}.lede{font-size:18px;color:#625d54;line-height:1.5;max-width:900px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:28px 0}.card{background:#fff;border:1px solid #dedbd2;border-radius:8px;padding:18px}.card b{display:block;font-size:30px}@media(max-width:820px){.grid{grid-template-columns:1fr}h1{font-size:34px}}</style></head><body><main><p class="eyebrow">Repeatable pilot intake</p><h1>New-client onboarding is contract-driven.</h1><p class="lede">The pilot starts with a standardized Tenant Packet, runs through canonical ingestion and candidate proof, then blocks active access until dry-run, approval, read proof, and rollback proof exist.</p><section class="grid"><div class="card"><b>${report.pilotContract.requiredInputFiles.length}</b><span>required file classes</span></div><div class="card"><b>${report.onboardingWorkflow.length}</b><span>workflow steps</span></div><div class="card"><b>${report.targetDataLayer.length}</b><span>target layers</span></div></section></main></body></html>`;
}

async function readJson<T>(absolutePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(absolutePath, "utf8")) as T;
}

function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
