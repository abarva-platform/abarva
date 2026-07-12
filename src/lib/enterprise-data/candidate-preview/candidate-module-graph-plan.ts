import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";
import type {
  CanonicalDomain,
  CanonicalIngestionRecord,
  CanonicalValue,
} from "../contracts/canonical-ingestion";
import type { TenantPacketModule } from "../contracts/tenant-packet";
import type { ModuleReadinessProof } from "../proof-harness/module-readiness-proof";

type GraphPlanQualityGateStatus = "pass" | "fail";
type WorkbenchModule = "moves" | "source" | "tower";

interface ModuleGraphPlanGuardrails {
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

interface ModuleDerivedPlanStage {
  derivedEntries: Array<{
    derivedObjectKey: string;
    sourceObjectIds: string[];
    domains: CanonicalDomain[];
    targetModules: TenantPacketModule[];
  }>;
}

interface ModuleGraphNode {
  nodeKey: string;
  nodeType:
    | "candidate_module"
    | "derived_object"
    | "canonical_object"
    | "evidence";
  label: string;
  sourceObjectId?: string;
  domain?: CanonicalDomain;
}

interface ModuleGraphEdge {
  edgeKey: string;
  fromNodeKey: string;
  toNodeKey: string;
  relationshipType:
    | "module_uses_derived_plan"
    | "derived_from_canonical_object"
    | "canonical_object_evidenced_by";
  evidenceKeys: string[];
  confidence: number;
}

interface ModuleGraphPlanEntry {
  graphObjectKey: string;
  targetModules: TenantPacketModule[];
  sourceObjectIds: string[];
  status: "planned_not_materialized";
  nodes: ModuleGraphNode[];
  edges: ModuleGraphEdge[];
  requiredRuntimeProof: string[];
}

interface ModuleGraphPlanStage {
  stage: "module_targeted_graph_plan";
  status: "pass" | "blocked";
  graphObjectsPlanned: number;
  graphEntries: ModuleGraphPlanEntry[];
}

interface ModuleGraphPlanSummary {
  resultVersion: "candidate-module-graph-plan/v1";
  tenantKey: string;
  candidateVersionKey: string;
  generatedAt: string;
  qualityGateStatus: GraphPlanQualityGateStatus;
  requestedModules: WorkbenchModule[];
  guardrails: ModuleGraphPlanGuardrails;
  counts: {
    sourceRecordsRead: number;
    graphObjectsPlanned: number;
    graphNodesPlanned: number;
    graphEdgesPlanned: number;
    movesEdgesPlanned: number;
    sourceEdgesPlanned: number;
    towerEdgesPlanned: number;
    runtimeReadyModules: 0;
  };
  outputPaths: {
    stagePath: string;
    proofPath: string;
    summaryPath: string;
    summaryMdPath: string;
  };
}

export interface CandidateModuleGraphPlanProof {
  summary: ModuleGraphPlanSummary;
  candidateRecord: Pick<
    CandidateTenantDataVersionRecord,
    | "candidateVersionKey"
    | "currentStatus"
    | "dryRunOnly"
    | "writesPhysicalTables"
    | "activeTenantAccessLayerUpdated"
    | "moduleRuntimeConsumptionChanged"
    | "lineage"
    | "promotionControl"
  >;
  moduleGraphPlanStage: ModuleGraphPlanStage;
}

export interface CandidateModuleGraphPlanOptions {
  repoRoot: string;
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  moduleDerivedPlanPath?: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_MODULE_READINESS_PROOF_PATH =
  "reports/module-readiness-proof/skyharbor/module-readiness-proof.json";
const DEFAULT_MODULE_DERIVED_PLAN_PATH =
  "reports/candidate-module-derived-plans/skyharbor/module-derived-plan-stage.json";
const DEFAULT_OUTPUT_DIR = "reports/candidate-module-graph-plans/skyharbor";
const MODULES: WorkbenchModule[] = ["moves", "source", "tower"];

export async function buildCandidateModuleGraphPlan(
  options: CandidateModuleGraphPlanOptions,
): Promise<CandidateModuleGraphPlanProof> {
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
  const moduleDerivedPlan = await readJson<ModuleDerivedPlanStage>(
    resolve(
      options,
      options.moduleDerivedPlanPath,
      DEFAULT_MODULE_DERIVED_PLAN_PATH,
    ),
  );

  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const guardrails = buildGuardrails(candidateRecord);
  const moduleGraphPlanStage = buildModuleGraphPlanStage(
    moduleProof.sourceRecords,
    moduleDerivedPlan,
  );
  const qualityGateStatus: GraphPlanQualityGateStatus =
    guardrails.noModuleReadsCandidateByDefault &&
    candidateRecord.currentStatus === "validated" &&
    moduleGraphPlanStage.status === "pass" &&
    moduleGraphPlanStage.graphEntries.length === MODULES.length
      ? "pass"
      : "fail";

  const summary: ModuleGraphPlanSummary = {
    resultVersion: "candidate-module-graph-plan/v1",
    tenantKey: candidateRecord.lineage.tenantKey,
    candidateVersionKey: candidateRecord.candidateVersionKey,
    generatedAt,
    qualityGateStatus,
    requestedModules: MODULES,
    guardrails,
    counts: {
      sourceRecordsRead: moduleProof.sourceRecords.length,
      graphObjectsPlanned: moduleGraphPlanStage.graphObjectsPlanned,
      graphNodesPlanned: sum(moduleGraphPlanStage.graphEntries, "nodes"),
      graphEdgesPlanned: sum(moduleGraphPlanStage.graphEntries, "edges"),
      movesEdgesPlanned: countEdgesForModule(
        "moves",
        moduleGraphPlanStage.graphEntries,
      ),
      sourceEdgesPlanned: countEdgesForModule(
        "source",
        moduleGraphPlanStage.graphEntries,
      ),
      towerEdgesPlanned: countEdgesForModule(
        "tower",
        moduleGraphPlanStage.graphEntries,
      ),
      runtimeReadyModules: 0,
    },
    outputPaths: {
      stagePath: path.join(outputDir, "module-graph-plan-stage.json"),
      proofPath: path.join(outputDir, "candidate-module-graph-plan-proof.json"),
      summaryPath: path.join(outputDir, "summary.json"),
      summaryMdPath: path.join(outputDir, "README.md"),
    },
  };

  const proof: CandidateModuleGraphPlanProof = {
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
      promotionControl: candidateRecord.promotionControl,
    },
    moduleGraphPlanStage,
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), proof);
  if (qualityGateStatus !== "pass") {
    throw new Error("Candidate module graph-plan quality gate failed.");
  }
  return proof;
}

function buildModuleGraphPlanStage(
  records: CanonicalIngestionRecord[],
  moduleDerivedPlan: ModuleDerivedPlanStage,
): ModuleGraphPlanStage {
  const recordsById = new Map(
    records.map((record) => [record.sourceObjectId, record]),
  );
  const graphEntries = MODULES.map((module) => {
    const derivedEntry = moduleDerivedPlan.derivedEntries.find((entry) =>
      entry.targetModules.includes(module),
    );
    if (!derivedEntry) return undefined;
    const selectedRecords = derivedEntry.sourceObjectIds
      .map((sourceObjectId) => recordsById.get(sourceObjectId))
      .filter((record): record is CanonicalIngestionRecord => Boolean(record));
    return buildGraphEntry(
      module,
      derivedEntry.derivedObjectKey,
      selectedRecords,
    );
  }).filter((entry): entry is ModuleGraphPlanEntry => Boolean(entry));

  return {
    stage: "module_targeted_graph_plan",
    status: graphEntries.length === MODULES.length ? "pass" : "blocked",
    graphObjectsPlanned: graphEntries.length,
    graphEntries,
  };
}

function buildGraphEntry(
  module: WorkbenchModule,
  derivedObjectKey: string,
  records: CanonicalIngestionRecord[],
): ModuleGraphPlanEntry {
  const moduleNodeKey = `candidate-module:${module}`;
  const derivedNodeKey = `candidate-derived:${module}`;
  const canonicalNodes: ModuleGraphNode[] = records
    .slice(0, 24)
    .map((record) => ({
      nodeKey: `canonical:${record.sourceObjectId}`,
      nodeType: "canonical_object",
      label: labelOf(record),
      sourceObjectId: record.sourceObjectId,
      domain: record.domain,
    }));
  const evidenceNodes: ModuleGraphNode[] = records
    .slice(0, 24)
    .flatMap((record) =>
      record.evidenceReferences.slice(0, 2).map((reference) => ({
        nodeKey: `evidence:${reference.evidenceKey}`,
        nodeType: "evidence" as const,
        label: reference.evidenceKey,
        sourceObjectId: record.sourceObjectId,
      })),
    );
  const nodes = dedupeNodes([
    {
      nodeKey: moduleNodeKey,
      nodeType: "candidate_module" as const,
      label: module,
    },
    {
      nodeKey: derivedNodeKey,
      nodeType: "derived_object" as const,
      label: derivedObjectKey,
    },
    ...canonicalNodes,
    ...evidenceNodes,
  ]);
  const sourceObjectIds = records.map((record) => record.sourceObjectId);
  const edges: ModuleGraphEdge[] = [
    {
      edgeKey: `${moduleNodeKey}->${derivedNodeKey}`,
      fromNodeKey: moduleNodeKey,
      toNodeKey: derivedNodeKey,
      relationshipType: "module_uses_derived_plan",
      evidenceKeys: [],
      confidence: 0.9,
    },
    ...records.slice(0, 24).map((record) => ({
      edgeKey: `${derivedNodeKey}->canonical:${record.sourceObjectId}`,
      fromNodeKey: derivedNodeKey,
      toNodeKey: `canonical:${record.sourceObjectId}`,
      relationshipType: "derived_from_canonical_object" as const,
      evidenceKeys: record.evidenceReferences.map(
        (reference) => reference.evidenceKey,
      ),
      confidence: record.confidence ?? 0.7,
    })),
    ...records.slice(0, 24).flatMap((record) =>
      record.evidenceReferences.slice(0, 2).map((reference) => ({
        edgeKey: `canonical:${record.sourceObjectId}->evidence:${reference.evidenceKey}`,
        fromNodeKey: `canonical:${record.sourceObjectId}`,
        toNodeKey: `evidence:${reference.evidenceKey}`,
        relationshipType: "canonical_object_evidenced_by" as const,
        evidenceKeys: [reference.evidenceKey],
        confidence: reference.confidence ?? record.confidence ?? 0.7,
      })),
    ),
  ];

  return {
    graphObjectKey: `candidate-workbench-graph:${module}`,
    targetModules: [module],
    sourceObjectIds,
    status: "planned_not_materialized",
    nodes,
    edges,
    requiredRuntimeProof: requiredRuntimeProofForModule(module),
  };
}

function requiredRuntimeProofForModule(module: WorkbenchModule): string[] {
  return [
    "Promote an approved candidate version through an explicit operator gate.",
    `Run signed-in ${module} proof against the promoted active graph slice.`,
    "Prove graph nodes and edges remain evidence-backed before runtime display.",
  ];
}

function buildGuardrails(
  candidateRecord: CandidateTenantDataVersionRecord,
): ModuleGraphPlanGuardrails {
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

function dedupeNodes(nodes: ModuleGraphNode[]): ModuleGraphNode[] {
  return [...new Map(nodes.map((node) => [node.nodeKey, node])).values()];
}

function sum(entries: ModuleGraphPlanEntry[], key: "nodes" | "edges"): number {
  return entries.reduce((total, entry) => total + entry[key].length, 0);
}

function countEdgesForModule(
  module: WorkbenchModule,
  entries: ModuleGraphPlanEntry[],
): number {
  return (
    entries.find((entry) => entry.targetModules.includes(module))?.edges
      .length ?? 0
  );
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

function stringify(value: CanonicalValue["value"] | undefined): string {
  if (value === undefined || value === null) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

async function writeArtifacts(
  outputDir: string,
  proof: CandidateModuleGraphPlanProof,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "module-graph-plan-stage.json"),
    `${JSON.stringify(proof.moduleGraphPlanStage, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-module-graph-plan-proof.json"),
    `${JSON.stringify(proof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "summary.json"),
    `${JSON.stringify(proof.summary, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outputDir, "README.md"), summaryMd(proof));
}

function summaryMd(proof: CandidateModuleGraphPlanProof): string {
  const rows = proof.moduleGraphPlanStage.graphEntries
    .map(
      (entry) =>
        `| ${entry.targetModules.join(", ")} | ${entry.nodes.length} | ${entry.edges.length} | ${entry.status} |`,
    )
    .join("\n");
  return `# Candidate Module Graph Plan

Tenant: \`${proof.summary.tenantKey}\`
Candidate: \`${proof.summary.candidateVersionKey}\`
Generated: \`${proof.summary.generatedAt}\`

This report creates module-targeted graph-plan objects for inactive candidate
workbench previews. It does not write production tenant data, update active
tenant access, promote the candidate, change module runtime behavior, or let
modules read candidate data by default.

## Summary

- Quality gate: ${proof.summary.qualityGateStatus}
- Source records read: ${proof.summary.counts.sourceRecordsRead}
- Graph objects planned: ${proof.summary.counts.graphObjectsPlanned}
- Graph nodes planned: ${proof.summary.counts.graphNodesPlanned}
- Graph edges planned: ${proof.summary.counts.graphEdgesPlanned}
- Runtime-ready modules: ${proof.summary.counts.runtimeReadyModules}

## Module Plans

| Module | Nodes | Edges | Status |
| --- | ---: | ---: | --- |
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
  options: CandidateModuleGraphPlanOptions,
  filePath: string | undefined,
  fallback: string,
): string {
  return path.resolve(options.repoRoot, filePath ?? fallback);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}
