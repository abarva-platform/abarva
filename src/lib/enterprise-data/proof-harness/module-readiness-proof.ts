import fs from 'node:fs/promises';
import path from 'node:path';

import type { CanonicalDomain, CanonicalIngestionRecord } from '../contracts/canonical-ingestion';
import type { TenantPacketModule } from '../contracts/tenant-packet';
import type {
  CandidateTenantDataVersionPlan,
  TargetWriteOperation,
  TargetWriterDryRunSummary,
} from '../contracts/target-writer';

export type ProofStageStatus = 'pass' | 'blocked' | 'not_applicable';

export interface FileToCanonicalStage {
  stage: 'file_to_canonical_object';
  status: ProofStageStatus;
  filesProcessed: number;
  canonicalRecords: number;
  quarantinedRecords: number;
  minimumObservedMappingCoveragePercent: number;
}

export interface FactPlanStage {
  stage: 'canonical_object_to_fact_plan';
  status: ProofStageStatus;
  operationsPlanned: number;
  factOperations: number;
  evidenceOperations: number;
  quarantineOperations: number;
}

export interface GraphPlanEntry {
  sourceObjectId: string;
  canonicalObjectKey?: string;
  graphOperationId?: string;
  relationshipCount: number;
  status: 'planned' | 'no_relationships_detected';
}

export interface GraphPlanStage {
  stage: 'fact_plan_to_graph_plan';
  status: ProofStageStatus;
  graphOperations: number;
  graphEntries: GraphPlanEntry[];
}

export interface DerivedPlanEntry {
  derivedObjectKey: string;
  sourceObjectIds: string[];
  domains: CanonicalDomain[];
  targetModules: TenantPacketModule[];
  status: 'planned_not_materialized';
}

export interface DerivedPlanStage {
  stage: 'fact_plan_to_derived_plan';
  status: ProofStageStatus;
  derivedObjectsPlanned: number;
  derivedEntries: DerivedPlanEntry[];
}

export interface ModuleReadinessEntry {
  module: TenantPacketModule;
  readyForRuntimeConsumption: false;
  evidenceAvailable: boolean;
  factPlanAvailable: boolean;
  graphPlanAvailable: boolean;
  derivedPlanAvailable: boolean;
  blockingReason: string;
  nextProofNeeded: string;
}

export interface ModuleReadinessStage {
  stage: 'derived_plan_to_module_readiness';
  status: ProofStageStatus;
  moduleReadiness: ModuleReadinessEntry[];
}

export interface ModuleReadinessProofSummary {
  tenantKey: string;
  packetId: string;
  generatedAt: string;
  dryRunOnly: true;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  proofBundlePath: string;
  canonicalRecordsEvaluated: number;
  targetOperationsEvaluated: number;
  modulesEvaluated: number;
  runtimeConsumptionReadyModules: 0;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  qualityGateStatus: 'pass' | 'fail';
}

export interface ModuleReadinessProof {
  summary: ModuleReadinessProofSummary;
  candidateVersion: CandidateTenantDataVersionPlan;
  stages: {
    fileToCanonical: FileToCanonicalStage;
    factPlan: FactPlanStage;
    graphPlan: GraphPlanStage;
    derivedPlan: DerivedPlanStage;
    moduleReadiness: ModuleReadinessStage;
  };
  sourceRecords: CanonicalIngestionRecord[];
  targetOperations: TargetWriteOperation[];
}

export interface ModuleReadinessProofOptions {
  repoRoot: string;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  outputDir: string;
}

interface TenantPacketDryRunSummaryInput {
  packetId: string;
  tenantKey: string;
  generatedAt: string;
  filesProcessed: number;
  canonicalRecordCount: number;
  quarantinedRecordCount: number;
  minimumObservedMappingCoveragePercent: number;
  qualityGateStatus: 'pass' | 'fail';
}

export async function buildModuleReadinessProof(
  options: ModuleReadinessProofOptions,
): Promise<ModuleReadinessProof> {
  const sourceBundlePath = path.resolve(options.repoRoot, options.sourceProofBundlePath);
  const targetBundlePath = path.resolve(options.repoRoot, options.targetProofBundlePath);
  const sourceSummary = await readJson<TenantPacketDryRunSummaryInput>(path.join(sourceBundlePath, 'dry-run-summary.json'));
  const targetSummary = await readJson<TargetWriterDryRunSummary>(path.join(targetBundlePath, 'dry-run-summary.json'));
  const sourceRecords = await readJson<CanonicalIngestionRecord[]>(
    path.join(sourceBundlePath, 'canonical-ingestion-records.json'),
  );
  const targetOperations = await readJson<TargetWriteOperation[]>(path.join(targetBundlePath, 'target-write-plan.json'));
  const candidateVersion = await readJson<CandidateTenantDataVersionPlan>(
    path.join(targetBundlePath, 'candidate-version-plan.json'),
  );
  const graphPlan = buildGraphPlanStage(sourceRecords, targetOperations);
  const derivedPlan = buildDerivedPlanStage(sourceRecords);
  const moduleReadiness = buildModuleReadinessStage(sourceRecords, graphPlan, derivedPlan);
  const summary: ModuleReadinessProofSummary = {
    tenantKey: sourceSummary.tenantKey,
    packetId: sourceSummary.packetId,
    generatedAt: sourceSummary.generatedAt,
    dryRunOnly: true,
    sourceProofBundlePath: options.sourceProofBundlePath,
    targetProofBundlePath: options.targetProofBundlePath,
    proofBundlePath: options.outputDir,
    canonicalRecordsEvaluated: sourceRecords.length,
    targetOperationsEvaluated: targetOperations.length,
    modulesEvaluated: moduleReadiness.moduleReadiness.length,
    runtimeConsumptionReadyModules: 0,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    qualityGateStatus: sourceSummary.qualityGateStatus === 'pass'
      && targetSummary.qualityGateStatus === 'pass'
      && moduleReadiness.moduleReadiness.every((entry) => entry.readyForRuntimeConsumption === false)
      ? 'pass'
      : 'fail',
  };
  const proof: ModuleReadinessProof = {
    summary,
    candidateVersion,
    stages: {
      fileToCanonical: {
        stage: 'file_to_canonical_object',
        status: sourceSummary.qualityGateStatus === 'pass' ? 'pass' : 'blocked',
        filesProcessed: sourceSummary.filesProcessed,
        canonicalRecords: sourceSummary.canonicalRecordCount,
        quarantinedRecords: sourceSummary.quarantinedRecordCount,
        minimumObservedMappingCoveragePercent: sourceSummary.minimumObservedMappingCoveragePercent,
      },
      factPlan: {
        stage: 'canonical_object_to_fact_plan',
        status: targetSummary.qualityGateStatus === 'pass' ? 'pass' : 'blocked',
        operationsPlanned: targetSummary.operationsPlanned,
        factOperations: targetSummary.factOperations,
        evidenceOperations: targetSummary.evidenceOperations,
        quarantineOperations: targetSummary.quarantineOperations,
      },
      graphPlan,
      derivedPlan,
      moduleReadiness,
    },
    sourceRecords,
    targetOperations,
  };

  await writeProofBundle(path.resolve(options.repoRoot, options.outputDir), proof);
  return proof;
}

function buildGraphPlanStage(
  records: CanonicalIngestionRecord[],
  targetOperations: TargetWriteOperation[],
): GraphPlanStage {
  const graphOperations = targetOperations.filter((operation) => operation.targetStore === 'enterprise_relationship_graph');
  const graphEntries: GraphPlanEntry[] = records.map((record) => {
    const graphOperation = graphOperations.find((operation) => operation.sourceObjectId === record.sourceObjectId);
    return {
      sourceObjectId: record.sourceObjectId,
      canonicalObjectKey: record.canonicalObjectKey,
      graphOperationId: graphOperation?.operationId,
      relationshipCount: record.relationships.length,
      status: graphOperation || record.relationships.length > 0 ? 'planned' : 'no_relationships_detected',
    };
  });

  return {
    stage: 'fact_plan_to_graph_plan',
    status: graphOperations.length > 0 ? 'pass' : 'not_applicable',
    graphOperations: graphOperations.length,
    graphEntries,
  };
}

function buildDerivedPlanStage(records: CanonicalIngestionRecord[]): DerivedPlanStage {
  const byDomain = new Map<CanonicalDomain, CanonicalIngestionRecord[]>();
  for (const record of records) {
    byDomain.set(record.domain, [...(byDomain.get(record.domain) ?? []), record]);
  }
  const derivedEntries: DerivedPlanEntry[] = [...byDomain.entries()].map(([domain, domainRecords]) => ({
    derivedObjectKey: `derived:${domain}`,
    sourceObjectIds: domainRecords.map((record) => record.sourceObjectId),
    domains: [domain],
    targetModules: modulesForDomain(domain),
    status: 'planned_not_materialized',
  }));

  return {
    stage: 'fact_plan_to_derived_plan',
    status: derivedEntries.length > 0 ? 'pass' : 'blocked',
    derivedObjectsPlanned: derivedEntries.length,
    derivedEntries,
  };
}

function buildModuleReadinessStage(
  records: CanonicalIngestionRecord[],
  graphPlan: GraphPlanStage,
  derivedPlan: DerivedPlanStage,
): ModuleReadinessStage {
  const modules: TenantPacketModule[] = ['home', 'intelligence', 'moves', 'source', 'tower', 'export'];
  const entries: ModuleReadinessEntry[] = modules.map((module) => {
    const evidenceAvailable = records.some((record) => record.evidenceReferences.length > 0);
    const factPlanAvailable = records.length > 0;
    const graphPlanAvailable = graphPlan.graphOperations > 0;
    const derivedPlanAvailable = derivedPlan.derivedEntries.some((entry) => entry.targetModules.includes(module));
    return {
      module,
      readyForRuntimeConsumption: false as const,
      evidenceAvailable,
      factPlanAvailable,
      graphPlanAvailable,
      derivedPlanAvailable,
      blockingReason: 'Dry-run proof only. Candidate facts, graph entries, and derived intelligence have not been persisted, promoted, or proven through the module runtime.',
      nextProofNeeded: nextProofForModule(module),
    };
  });

  return {
    stage: 'derived_plan_to_module_readiness',
    status: 'pass',
    moduleReadiness: entries,
  };
}

function modulesForDomain(domain: CanonicalDomain): TenantPacketModule[] {
  switch (domain) {
    case 'enterprise_structure':
      return ['home', 'intelligence', 'moves', 'export'];
    case 'technology_estate':
      return ['home', 'intelligence', 'moves', 'source', 'export'];
    case 'vendor_commercial_estate':
    case 'sourcing_procurement':
      return ['source', 'tower', 'intelligence', 'export'];
    case 'financial_value':
    case 'tower_outcomes':
      return ['tower', 'intelligence', 'export'];
    case 'moves_execution':
      return ['moves', 'tower', 'intelligence', 'export'];
    case 'risk_control_governance':
      return ['home', 'intelligence', 'moves', 'source', 'tower', 'export'];
    case 'transformation_ai_portfolio':
      return ['home', 'intelligence', 'moves', 'tower', 'export'];
    case 'intelligence_answering':
    case 'memory_learning':
      return ['intelligence', 'export'];
    default:
      return ['intelligence', 'export'];
  }
}

function nextProofForModule(module: TenantPacketModule): string {
  switch (module) {
    case 'home':
      return 'Persist and promote the candidate version, then prove Home reads the promoted active tenant slice.';
    case 'intelligence':
      return 'Run signed-in answer retrieval with citations from the promoted active tenant slice.';
    case 'moves':
      return 'Run a phase workspace proof that consumes promoted facts, evidence, graph context, and derived readiness.';
    case 'source':
      return 'Run a sourcing workflow proof that consumes promoted vendor, contract, evidence, and value context.';
    case 'tower':
      return 'Run an outcome-ledger proof before any realized value or ROI claim.';
    case 'export':
      return 'Generate a cited executive artifact from the promoted active tenant slice.';
  }
}

async function writeProofBundle(outputDir: string, proof: ModuleReadinessProof): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'module-readiness-proof.json'), `${JSON.stringify(proof, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'file-to-canonical-stage.json'), `${JSON.stringify(proof.stages.fileToCanonical, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'fact-plan-stage.json'), `${JSON.stringify(proof.stages.factPlan, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'graph-plan-stage.json'), `${JSON.stringify(proof.stages.graphPlan, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'derived-plan-stage.json'), `${JSON.stringify(proof.stages.derivedPlan, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'module-readiness-stage.json'), `${JSON.stringify(proof.stages.moduleReadiness, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'README.md'), proofReadme(proof));
}

function proofReadme(proof: ModuleReadinessProof): string {
  const readinessRows = proof.stages.moduleReadiness.moduleReadiness
    .map((entry) => `| ${entry.module} | ${entry.readyForRuntimeConsumption} | ${entry.derivedPlanAvailable} | ${entry.nextProofNeeded} |`)
    .join('\n');

  return `# Module Readiness Proof Harness

Packet: \`${proof.summary.packetId}\`
Tenant: \`${proof.summary.tenantKey}\`
Generated: \`${proof.summary.generatedAt}\`

This proof bundle is dry-run only. It stitches together file parsing, canonical objects,
target fact plans, graph plans, derived intelligence plans, and module-readiness blockers.
It does not write to production DB, mutate tenant data, promote a candidate version,
or change module runtime behavior.

## Stage Summary

- File to canonical object: ${proof.stages.fileToCanonical.status}
- Canonical object to fact plan: ${proof.stages.factPlan.status}
- Fact plan to graph plan: ${proof.stages.graphPlan.status}
- Fact plan to derived plan: ${proof.stages.derivedPlan.status}
- Derived plan to module readiness: ${proof.stages.moduleReadiness.status}
- Runtime-ready modules: ${proof.summary.runtimeConsumptionReadyModules}
- Quality gate: ${proof.summary.qualityGateStatus}

## Module Readiness

| Module | Runtime ready | Derived plan available | Next proof |
| --- | --- | --- | --- |
${readinessRows}
`;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}
