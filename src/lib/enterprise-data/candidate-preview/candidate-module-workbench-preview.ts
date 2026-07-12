import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";
import type {
  CanonicalDomain,
  CanonicalIngestionRecord,
  CanonicalValue,
} from "../contracts/canonical-ingestion";
import type {
  EvidenceBoundary,
  ModuleContextPacket,
} from "../contracts/module-context-apis";
import type { ModuleReadinessProof } from "../proof-harness/module-readiness-proof";
import type { CandidateModuleReadinessPreview } from "./candidate-module-readiness-preview";

type WorkbenchModule = "moves" | "source" | "tower";
type WorkbenchQualityGateStatus = "pass" | "fail";

interface DerivedPlanStage {
  stage: string;
  status: string;
  derivedObjectsPlanned: number;
  derivedEntries: Array<{
    derivedObjectKey: string;
    sourceObjectIds: string[];
    domains: CanonicalDomain[];
    targetModules: string[];
    status: string;
  }>;
}

interface WorkbenchGuardrails {
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

interface WorkbenchFact {
  objectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  domain: CanonicalDomain;
  label: string;
  previewValues: Record<string, string | number | boolean | null>;
  evidenceKeys: string[];
  qualityStatus: string;
  dataStatus: string;
  confidence?: number;
}

interface WorkbenchDerivedInsight {
  derivedObjectKey: string;
  sourceObjectIds: string[];
  domains: CanonicalDomain[];
  status: string;
}

interface GraphPlanStage {
  stage: string;
  status: string;
  graphObjectsPlanned: number;
  graphEntries: Array<{
    graphObjectKey: string;
    targetModules: string[];
    sourceObjectIds: string[];
    status: string;
    nodes: unknown[];
    edges: Array<{
      edgeKey: string;
      fromNodeKey: string;
      toNodeKey: string;
      relationshipType: string;
      evidenceKeys: string[];
      confidence: number;
    }>;
  }>;
}

interface WorkbenchRelationship {
  graphObjectKey: string;
  edgeKey: string;
  fromNodeKey: string;
  toNodeKey: string;
  relationshipType: string;
  evidenceKeys: string[];
  confidence: number;
  status: string;
}

interface WorkbenchWorkflowPreview {
  focus: string;
  candidateInputs: Array<{
    label: string;
    count: number;
    sourceObjectIds: string[];
  }>;
  requiredNextProof: string[];
}

interface WorkbenchPreviewPacket extends ModuleContextPacket {
  module: WorkbenchModule;
  previewMode: true;
  runtimeEligible: false;
  readinessStatus: string;
  workbenchFocus: string;
  workflowPreview: WorkbenchWorkflowPreview;
  blockers: string[];
  nextProofNeeded: string;
  previewWarnings: string[];
}

export interface CandidateModuleWorkbenchPreviewSummary {
  resultVersion: "candidate-module-workbench-preview/v1";
  tenantKey: string;
  candidateVersionKey: string;
  generatedAt: string;
  previewQualityGateStatus: WorkbenchQualityGateStatus;
  requestedModules: WorkbenchModule[];
  guardrails: WorkbenchGuardrails;
  counts: {
    sourceRecordsRead: number;
    evidenceKeys: number;
    movesFacts: number;
    sourceFacts: number;
    towerFacts: number;
    workbenchPreviewPackets: number;
    runtimeReadyModules: 0;
  };
  outputPaths: {
    movesPreviewPath: string;
    sourcePreviewPath: string;
    towerPreviewPath: string;
    proofPath: string;
    summaryPath: string;
    summaryMdPath: string;
  };
}

export interface CandidateModuleWorkbenchPreviewProof {
  summary: CandidateModuleWorkbenchPreviewSummary;
  candidateRecord: Pick<
    CandidateTenantDataVersionRecord,
    | "candidateVersionKey"
    | "currentStatus"
    | "dryRunOnly"
    | "writesPhysicalTables"
    | "activeTenantAccessLayerUpdated"
    | "moduleRuntimeConsumptionChanged"
    | "lineage"
    | "qualityGate"
    | "promotionControl"
  >;
  movesPreview: WorkbenchPreviewPacket;
  sourcePreview: WorkbenchPreviewPacket;
  towerPreview: WorkbenchPreviewPacket;
}

export interface CandidateModuleWorkbenchPreviewOptions {
  repoRoot: string;
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  moduleReadinessPreviewPath?: string;
  derivedPlanStagePath?: string;
  graphPlanStagePath?: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_MODULE_READINESS_PROOF_PATH =
  "reports/module-readiness-proof/skyharbor/module-readiness-proof.json";
const DEFAULT_MODULE_READINESS_PREVIEW_PATH =
  "reports/candidate-module-readiness-previews/skyharbor/module-readiness-preview.json";
const DEFAULT_DERIVED_PLAN_STAGE_PATH =
  "reports/candidate-module-derived-plans/skyharbor/module-derived-plan-stage.json";
const DEFAULT_GRAPH_PLAN_STAGE_PATH =
  "reports/candidate-module-graph-plans/skyharbor/module-graph-plan-stage.json";
const DEFAULT_OUTPUT_DIR =
  "reports/candidate-module-workbench-previews/skyharbor";
const WORKBENCH_MODULES: WorkbenchModule[] = ["moves", "source", "tower"];

export async function buildCandidateModuleWorkbenchPreview(
  options: CandidateModuleWorkbenchPreviewOptions,
): Promise<CandidateModuleWorkbenchPreviewProof> {
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
  const readinessPreview = await readJson<CandidateModuleReadinessPreview>(
    resolve(
      options,
      options.moduleReadinessPreviewPath,
      DEFAULT_MODULE_READINESS_PREVIEW_PATH,
    ),
  );
  const derivedPlan = await readJson<DerivedPlanStage>(
    resolve(
      options,
      options.derivedPlanStagePath,
      DEFAULT_DERIVED_PLAN_STAGE_PATH,
    ),
  );
  const graphPlan = await readOptionalJson<GraphPlanStage>(
    resolve(options, options.graphPlanStagePath, DEFAULT_GRAPH_PLAN_STAGE_PATH),
  );

  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const guardrails = buildGuardrails(candidateRecord);
  const evidenceBoundary = buildEvidenceBoundary(moduleProof.sourceRecords);

  const movesPreview = buildWorkbenchPacket({
    module: "moves",
    candidateRecord,
    generatedAt,
    sourceRecords: moduleProof.sourceRecords,
    derivedPlan,
    graphPlan,
    evidenceBoundary,
    readinessPreview,
  });
  const sourcePreview = buildWorkbenchPacket({
    module: "source",
    candidateRecord,
    generatedAt,
    sourceRecords: moduleProof.sourceRecords,
    derivedPlan,
    graphPlan,
    evidenceBoundary,
    readinessPreview,
  });
  const towerPreview = buildWorkbenchPacket({
    module: "tower",
    candidateRecord,
    generatedAt,
    sourceRecords: moduleProof.sourceRecords,
    derivedPlan,
    graphPlan,
    evidenceBoundary,
    readinessPreview,
  });

  const summary: CandidateModuleWorkbenchPreviewSummary = {
    resultVersion: "candidate-module-workbench-preview/v1",
    tenantKey: candidateRecord.lineage.tenantKey,
    candidateVersionKey: candidateRecord.candidateVersionKey,
    generatedAt,
    previewQualityGateStatus: qualityGateStatus({
      guardrails,
      candidateRecord,
      previews: [movesPreview, sourcePreview, towerPreview],
    }),
    requestedModules: WORKBENCH_MODULES,
    guardrails,
    counts: {
      sourceRecordsRead: moduleProof.sourceRecords.length,
      evidenceKeys: evidenceBoundary.evidenceKeys.length,
      movesFacts: movesPreview.facts.length,
      sourceFacts: sourcePreview.facts.length,
      towerFacts: towerPreview.facts.length,
      workbenchPreviewPackets: WORKBENCH_MODULES.length,
      runtimeReadyModules: 0,
    },
    outputPaths: {
      movesPreviewPath: path.join(outputDir, "moves-workbench-preview.json"),
      sourcePreviewPath: path.join(outputDir, "source-workbench-preview.json"),
      towerPreviewPath: path.join(outputDir, "tower-workbench-preview.json"),
      proofPath: path.join(
        outputDir,
        "candidate-module-workbench-preview-proof.json",
      ),
      summaryPath: path.join(outputDir, "preview-summary.json"),
      summaryMdPath: path.join(outputDir, "README.md"),
    },
  };

  const proof: CandidateModuleWorkbenchPreviewProof = {
    summary,
    candidateRecord: {
      candidateVersionKey: candidateRecord.candidateVersionKey,
      currentStatus: candidateRecord.currentStatus,
      dryRunOnly: candidateRecord.dryRunOnly,
      writesPhysicalTables: candidateRecord.writesPhysicalTables,
      activeTenantAccessLayerUpdated:
        candidateRecord.activeTenantAccessLayerUpdated,
      moduleRuntimeConsumptionChanged:
        candidateRecord.moduleRuntimeConsumptionChanged,
      lineage: candidateRecord.lineage,
      qualityGate: candidateRecord.qualityGate,
      promotionControl: candidateRecord.promotionControl,
    },
    movesPreview,
    sourcePreview,
    towerPreview,
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), proof);
  if (summary.previewQualityGateStatus !== "pass") {
    throw new Error("Candidate module workbench preview quality gate failed.");
  }
  return proof;
}

function buildWorkbenchPacket(input: {
  module: WorkbenchModule;
  candidateRecord: CandidateTenantDataVersionRecord;
  generatedAt: string;
  sourceRecords: CanonicalIngestionRecord[];
  derivedPlan: DerivedPlanStage;
  graphPlan: GraphPlanStage | undefined;
  evidenceBoundary: EvidenceBoundary;
  readinessPreview: CandidateModuleReadinessPreview;
}): WorkbenchPreviewPacket {
  const selectedRecords = selectRecordsForModule(
    input.module,
    input.sourceRecords,
  );
  const readiness = input.readinessPreview.moduleReadiness.find(
    (row) => row.module === input.module,
  );
  const derivedInsights = derivedForModule(input.module, input.derivedPlan);
  const relationships = relationshipsForModule(input.module, input.graphPlan);
  const facts = selectedRecords.map(toWorkbenchFact);
  const blockers = [
    ...(readiness?.blockers ?? []).map(normalizeReadinessBlocker),
    "Workbench preview is read-only and cannot be used by runtime modules by default.",
  ];
  const previewWarnings = [
    "Candidate uses synthetic/planning-grade SkyHarbor evidence, not production client data.",
    "Candidate has not been promoted to the Active Tenant Access Layer.",
  ];
  if (derivedInsights.length === 0) {
    previewWarnings.push(
      "No module-targeted derived intelligence plan exists yet for this workbench.",
    );
  }
  if (relationships.length === 0) {
    previewWarnings.push(
      "No module-targeted graph plan exists yet for this workbench.",
    );
  }

  return {
    tenantKey: input.candidateRecord.lineage.tenantKey,
    tenantDataVersion: input.candidateRecord.candidateVersionKey,
    generatedAt: input.generatedAt,
    evidenceBoundary: input.evidenceBoundary,
    facts,
    relationships,
    derivedInsights,
    moduleMemory: [],
    module: input.module,
    previewMode: true,
    runtimeEligible: false,
    readinessStatus: readiness?.readinessStatus ?? "unknown",
    workbenchFocus: focusForModule(input.module),
    workflowPreview: workflowPreviewForModule(input.module, facts),
    blockers,
    nextProofNeeded:
      readiness?.nextProofNeeded ??
      "Run module-specific runtime proof after promotion.",
    previewWarnings,
  };
}

function normalizeReadinessBlocker(blocker: string): string {
  if (
    blocker === "Module-specific preview packet has not been generated yet."
  ) {
    return "Runtime module-consumption preview packet has not been generated or wired yet.";
  }
  return blocker;
}

function selectRecordsForModule(
  module: WorkbenchModule,
  records: CanonicalIngestionRecord[],
): CanonicalIngestionRecord[] {
  const selected = records.filter((record) => {
    const text = searchable(record);
    if (module === "moves") {
      return (
        record.sourceObjectId.includes("move") ||
        text.includes("irops") ||
        text.includes("crew recovery") ||
        text.includes("reaccommodation") ||
        text.includes("disruption")
      );
    }
    if (module === "source") {
      return (
        record.sourceObjectId.includes("source") ||
        record.sourceObjectId.includes("ven") ||
        text.includes("contract") ||
        text.includes("vendor") ||
        text.includes("invoice") ||
        text.includes("service-performance")
      );
    }
    return (
      record.sourceObjectId.includes("spend") ||
      text.includes("tower value") ||
      text.includes("value signal") ||
      text.includes("cost") ||
      text.includes("invoice") ||
      text.includes("resource count")
    );
  });

  return selected.slice(0, 24);
}

function workflowPreviewForModule(
  module: WorkbenchModule,
  facts: WorkbenchFact[],
): WorkbenchWorkflowPreview {
  if (module === "moves") {
    return {
      focus: "Candidate phase-workspace inputs for governed Move execution.",
      candidateInputs: [
        bucket("Move findings", facts, "move"),
        bucket("Operational systems", facts, "sys"),
        bucket("Evidence references", facts, "evid"),
      ],
      requiredNextProof: [
        "Generate a phase workspace preview packet for a selected Move.",
        "Prove gate criteria, uploaded evidence, and generated deliverables read from a promoted active slice.",
        "Keep approval human-gated; no automatic phase advancement from candidate preview.",
      ],
    };
  }
  if (module === "source") {
    return {
      focus:
        "Candidate sourcing inputs for contract, vendor, evidence, and value review.",
      candidateInputs: [
        bucket("Vendor/system candidates", facts, "ven"),
        bucket("Source artifacts", facts, "source"),
        bucket("Commercial evidence", facts, "invoice"),
      ],
      requiredNextProof: [
        "Validate the Source-stage derived plan for sourcing events, artifacts, vendors, and award evidence.",
        "Generate Source runtime-consumption packets only after active promotion exists.",
        "Prove RFP/contract artifacts remain evidence-scoped before any runtime Source consumption.",
      ],
    };
  }
  return {
    focus:
      "Candidate Tower inputs for value signals, outcome ledger readiness, and leakage controls.",
    candidateInputs: [
      bucket("Value signals", facts, "spend"),
      bucket("Invoice/cost evidence", facts, "invoice"),
      bucket("Outcome blockers", facts, "value"),
    ],
    requiredNextProof: [
      "Validate the Tower-derived outcome plan before any realized value or ROI claim.",
      "Bind projected value to an Outcome Ledger preview with source evidence.",
      "Run signed-in Tower proof only after active promotion and outcome-ledger validation.",
    ],
  };
}

function bucket(
  label: string,
  facts: WorkbenchFact[],
  needle: string,
): { label: string; count: number; sourceObjectIds: string[] } {
  const matched = facts.filter((fact) =>
    `${fact.sourceObjectId} ${fact.label} ${Object.values(fact.previewValues).join(" ")}`
      .toLowerCase()
      .includes(needle),
  );
  return {
    label,
    count: matched.length,
    sourceObjectIds: matched.map((fact) => fact.sourceObjectId).slice(0, 12),
  };
}

function derivedForModule(
  module: WorkbenchModule,
  derivedPlan: DerivedPlanStage,
): WorkbenchDerivedInsight[] {
  return derivedPlan.derivedEntries
    .filter((entry) => entry.targetModules.includes(module))
    .map((entry) => ({
      derivedObjectKey: entry.derivedObjectKey,
      sourceObjectIds: entry.sourceObjectIds,
      domains: entry.domains,
      status: entry.status,
    }));
}

function relationshipsForModule(
  module: WorkbenchModule,
  graphPlan: GraphPlanStage | undefined,
): WorkbenchRelationship[] {
  const graphEntry = graphPlan?.graphEntries.find((entry) =>
    entry.targetModules.includes(module),
  );
  if (!graphEntry) return [];
  return graphEntry.edges.slice(0, 48).map((edge) => ({
    graphObjectKey: graphEntry.graphObjectKey,
    edgeKey: edge.edgeKey,
    fromNodeKey: edge.fromNodeKey,
    toNodeKey: edge.toNodeKey,
    relationshipType: edge.relationshipType,
    evidenceKeys: edge.evidenceKeys,
    confidence: edge.confidence,
    status: graphEntry.status,
  }));
}

function buildEvidenceBoundary(
  records: CanonicalIngestionRecord[],
): EvidenceBoundary {
  return {
    evidenceKeys: Array.from(
      new Set(
        records.flatMap((record) =>
          record.evidenceReferences.map((reference) => reference.evidenceKey),
        ),
      ),
    ),
    excludedEvidenceKeys: [],
    staleEvidenceKeys: [],
    unsupportedClaimRisk: "medium",
  };
}

function buildGuardrails(
  candidateRecord: CandidateTenantDataVersionRecord,
): WorkbenchGuardrails {
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
      candidateRecord.promotionControl.noModuleReadsCandidateByDefault,
  };
}

function qualityGateStatus(input: {
  guardrails: WorkbenchGuardrails;
  candidateRecord: CandidateTenantDataVersionRecord;
  previews: WorkbenchPreviewPacket[];
}): WorkbenchQualityGateStatus {
  return input.guardrails.noModuleReadsCandidateByDefault &&
    input.candidateRecord.currentStatus === "validated" &&
    input.previews.every(
      (preview) =>
        preview.previewMode &&
        preview.runtimeEligible === false &&
        preview.facts.length > 0,
    )
    ? "pass"
    : "fail";
}

function toWorkbenchFact(record: CanonicalIngestionRecord): WorkbenchFact {
  return {
    objectType: record.objectType,
    sourceObjectId: record.sourceObjectId,
    canonicalObjectKey: record.canonicalObjectKey,
    domain: record.domain,
    label: labelOf(record),
    previewValues: previewValues(record.attributes),
    evidenceKeys: record.evidenceReferences.map(
      (reference) => reference.evidenceKey,
    ),
    qualityStatus: record.qualityStatus,
    dataStatus: record.dataStatus,
    confidence: record.confidence,
  };
}

function labelOf(record: CanonicalIngestionRecord): string {
  const candidate =
    record.attributes.name?.value ??
    record.attributes.title?.value ??
    record.attributes.label?.value ??
    record.attributes.metric?.value ??
    record.sourceObjectId;
  return stringify(candidate);
}

function previewValues(
  attributes: Record<string, CanonicalValue>,
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(attributes)
      .slice(0, 8)
      .map(([key, value]) => [key, scalar(value.value)]),
  );
}

function scalar(
  value: CanonicalValue["value"],
): string | number | boolean | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  return JSON.stringify(value);
}

function focusForModule(module: WorkbenchModule): string {
  if (module === "moves") {
    return "Turn candidate enterprise context into governed P0-P5 execution proof.";
  }
  if (module === "source") {
    return "Turn candidate contract/vendor evidence into sourcing workflow proof.";
  }
  return "Turn candidate value signals into outcome-ledger and leakage proof.";
}

async function writeArtifacts(
  outputDir: string,
  proof: CandidateModuleWorkbenchPreviewProof,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "moves-workbench-preview.json"),
    `${JSON.stringify(proof.movesPreview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "source-workbench-preview.json"),
    `${JSON.stringify(proof.sourcePreview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "tower-workbench-preview.json"),
    `${JSON.stringify(proof.towerPreview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-module-workbench-preview-proof.json"),
    `${JSON.stringify(proof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "preview-summary.json"),
    `${JSON.stringify(proof.summary, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outputDir, "README.md"), summaryMd(proof));
}

function summaryMd(proof: CandidateModuleWorkbenchPreviewProof): string {
  const rows = [proof.movesPreview, proof.sourcePreview, proof.towerPreview]
    .map(
      (packet) =>
        `| ${packet.module} | ${packet.readinessStatus} | ${packet.facts.length} | ${packet.derivedInsights.length} | ${packet.runtimeEligible} | ${packet.blockers.length} |`,
    )
    .join("\n");
  return `# Candidate Module Workbench Preview

Tenant: \`${proof.summary.tenantKey}\`
Candidate: \`${proof.summary.candidateVersionKey}\`
Generated: \`${proof.summary.generatedAt}\`

This report creates read-only candidate workbench packets for Moves, Source,
and Tower. It does not write production tenant data, update active tenant
access, promote the candidate, change module runtime behavior, or allow modules
to read candidate data by default.

## Summary

- Quality gate: ${proof.summary.previewQualityGateStatus}
- Workbench preview packets: ${proof.summary.counts.workbenchPreviewPackets}
- Runtime-ready modules: ${proof.summary.counts.runtimeReadyModules}
- Evidence keys: ${proof.summary.counts.evidenceKeys}
- Moves facts: ${proof.summary.counts.movesFacts}
- Source facts: ${proof.summary.counts.sourceFacts}
- Tower facts: ${proof.summary.counts.towerFacts}

## Module Packets

| Module | Readiness | Facts | Derived insights | Runtime eligible | Blockers |
| --- | --- | ---: | ---: | --- | ---: |
${rows}

## Guardrails

- Production tenant data written: ${proof.summary.guardrails.productionTenantDataWritten}
- Active Tenant Access Layer updated: ${proof.summary.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${proof.summary.guardrails.candidatePromoted}
- Module runtime routes changed: ${proof.summary.guardrails.moduleRuntimeRoutesChanged}
- No module reads candidate by default: ${proof.summary.guardrails.noModuleReadsCandidateByDefault}
`;
}

function resolve(
  options: CandidateModuleWorkbenchPreviewOptions,
  filePath: string | undefined,
  fallback: string,
): string {
  return path.resolve(options.repoRoot, filePath ?? fallback);
}

function searchable(record: CanonicalIngestionRecord): string {
  return [
    record.sourceObjectId,
    record.objectType,
    record.domain,
    ...Object.values(record.attributes).map((value) => stringify(value.value)),
    ...record.evidenceReferences.map((reference) => reference.excerpt ?? ""),
  ]
    .join(" ")
    .toLowerCase();
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
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
