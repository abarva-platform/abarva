import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ModuleReadinessProof, ProofStageStatus } from '../proof-harness/module-readiness-proof';
import type { TenantPacketManifest, TenantPacketModule } from '../contracts/tenant-packet';
import type {
  CandidateTenantDataVersionPlan,
  TargetStore,
  TargetWriterDryRunSummary,
  TargetWriteOperation,
} from '../contracts/target-writer';

export type CandidateTenantDataVersionStatus =
  | 'created'
  | 'validated'
  | 'blocked'
  | 'promotion-ready'
  | 'rejected';

export interface CandidateVersionLineage {
  tenantKey: string;
  packetId: string;
  packetContractVersion: string;
  packetEffectiveDate: string;
  sourceOwner: string;
  adapterVersions: string[];
  mappingVersions: string[];
  targetWriterVersion: string;
  candidateStoreVersion: 'candidate-version-store/v1';
}

export interface CandidateProofBundleLink {
  stage:
    | 'file_to_canonical_object'
    | 'canonical_object_to_fact_plan'
    | 'fact_plan_to_graph_plan'
    | 'fact_plan_to_derived_plan'
    | 'derived_plan_to_module_readiness';
  status: ProofStageStatus;
  path: string;
  fingerprint: string;
  summary: Record<string, string | number | boolean>;
}

export interface CandidatePlannedWriteFamily {
  targetStore: TargetStore;
  operationCount: number;
  writesPhysicalTables: false;
}

export interface CandidatePromotionControl {
  promotionEnabled: false;
  manualPromotionRequired: true;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  noModuleReadsCandidateByDefault: true;
  requiredProofBeforePromotion: string[];
  blocksPromotion: string[];
  rollbackPlan: string;
}

export interface CandidateTenantDataVersionRecord {
  recordVersion: 'candidate-tenant-data-version/v1';
  candidateVersionKey: string;
  currentStatus: CandidateTenantDataVersionStatus;
  allowedStatuses: CandidateTenantDataVersionStatus[];
  createdAt: string;
  dryRunOnly: true;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  lineage: CandidateVersionLineage;
  sourceCandidatePlan: CandidateTenantDataVersionPlan;
  proofBundles: CandidateProofBundleLink[];
  plannedWriteFootprint: {
    operationsPlanned: number;
    families: CandidatePlannedWriteFamily[];
    targetProofBundlePath: string;
  };
  moduleReadiness: Array<{
    module: TenantPacketModule;
    readyForRuntimeConsumption: false;
    nextProofNeeded: string;
  }>;
  qualityGate: {
    sourceDryRun: 'pass' | 'fail';
    targetWriterDryRun: 'pass' | 'fail';
    moduleReadinessProof: 'pass' | 'fail';
    candidatePersistence: 'pass' | 'fail';
  };
  promotionControl: CandidatePromotionControl;
}

export interface CandidateTenantDataVersionStoreOptions {
  repoRoot: string;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  moduleReadinessProofPath: string;
  outputDir: string;
}

export async function persistCandidateTenantDataVersion(
  options: CandidateTenantDataVersionStoreOptions,
): Promise<CandidateTenantDataVersionRecord> {
  const sourceBundlePath = path.resolve(options.repoRoot, options.sourceProofBundlePath);
  const targetBundlePath = path.resolve(options.repoRoot, options.targetProofBundlePath);
  const moduleProofBundlePath = path.resolve(options.repoRoot, options.moduleReadinessProofPath);
  const manifest = await readJson<TenantPacketManifest>(path.join(sourceBundlePath, 'manifest.normalized.json'));
  const sourceSummary = await readJson<{ qualityGateStatus: 'pass' | 'fail'; generatedAt: string }>(
    path.join(sourceBundlePath, 'dry-run-summary.json'),
  );
  const targetSummary = await readJson<TargetWriterDryRunSummary>(path.join(targetBundlePath, 'dry-run-summary.json'));
  const targetOperations = await readJson<TargetWriteOperation[]>(path.join(targetBundlePath, 'target-write-plan.json'));
  const candidatePlan = await readJson<CandidateTenantDataVersionPlan>(
    path.join(targetBundlePath, 'candidate-version-plan.json'),
  );
  const moduleProof = await readJson<ModuleReadinessProof>(
    path.join(moduleProofBundlePath, 'module-readiness-proof.json'),
  );

  const blocksPromotion = buildPromotionBlocks(manifest, sourceSummary.qualityGateStatus, targetSummary, moduleProof);
  const currentStatus = sourceSummary.qualityGateStatus === 'pass'
    && targetSummary.qualityGateStatus === 'pass'
    && moduleProof.summary.qualityGateStatus === 'pass'
    ? 'validated'
    : 'blocked';
  const record: CandidateTenantDataVersionRecord = {
    recordVersion: 'candidate-tenant-data-version/v1',
    candidateVersionKey: candidatePlan.candidateVersionKey,
    currentStatus,
    allowedStatuses: ['created', 'validated', 'blocked', 'promotion-ready', 'rejected'],
    createdAt: sourceSummary.generatedAt,
    dryRunOnly: true,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    lineage: {
      tenantKey: manifest.tenantKey,
      packetId: manifest.packetId,
      packetContractVersion: manifest.contractVersion,
      packetEffectiveDate: manifest.effectiveDate,
      sourceOwner: manifest.sourceOwner,
      adapterVersions: unique(manifest.sourceProfiles.map((profile) => profile.parserVersion)),
      mappingVersions: unique(manifest.sourceProfiles.map((profile) => profile.mappingProfile)),
      targetWriterVersion: candidatePlan.targetWriterVersion,
      candidateStoreVersion: 'candidate-version-store/v1',
    },
    sourceCandidatePlan: candidatePlan,
    proofBundles: await buildProofBundleLinks({
      repoRoot: options.repoRoot,
      sourceProofBundlePath: options.sourceProofBundlePath,
      targetProofBundlePath: options.targetProofBundlePath,
      moduleReadinessProofPath: options.moduleReadinessProofPath,
      moduleProof,
    }),
    plannedWriteFootprint: {
      operationsPlanned: targetOperations.length,
      families: summarizePlannedWrites(targetOperations),
      targetProofBundlePath: options.targetProofBundlePath,
    },
    moduleReadiness: moduleProof.stages.moduleReadiness.moduleReadiness.map((entry) => ({
      module: entry.module,
      readyForRuntimeConsumption: false,
      nextProofNeeded: entry.nextProofNeeded,
    })),
    qualityGate: {
      sourceDryRun: sourceSummary.qualityGateStatus,
      targetWriterDryRun: targetSummary.qualityGateStatus,
      moduleReadinessProof: moduleProof.summary.qualityGateStatus,
      candidatePersistence: currentStatus === 'blocked' ? 'fail' : 'pass',
    },
    promotionControl: {
      promotionEnabled: false,
      manualPromotionRequired: true,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
      noModuleReadsCandidateByDefault: true,
      requiredProofBeforePromotion: [
        'Candidate promotion gate implemented and enabled by explicit operator action.',
        'Candidate proof bundle reviewed with no failed source, target-writer, graph, derived, or module-readiness stage.',
        'Rollback target identified as the prior active tenant data version before any promotion.',
        'Signed-in module preview proof completed before active tenant access changes.',
      ],
      blocksPromotion,
      rollbackPlan: `Preserve the prior active tenant data version for ${manifest.promotionPolicy.rollbackWindowDays} days and keep this candidate version inactive until an explicit promotion gate changes the active pointer.`,
    },
  };

  await writeCandidateRecord(path.resolve(options.repoRoot, options.outputDir), record);
  return record;
}

async function buildProofBundleLinks(input: {
  repoRoot: string;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  moduleReadinessProofPath: string;
  moduleProof: ModuleReadinessProof;
}): Promise<CandidateProofBundleLink[]> {
  return [
    {
      stage: 'file_to_canonical_object',
      status: input.moduleProof.stages.fileToCanonical.status,
      path: path.join(input.sourceProofBundlePath, 'canonical-ingestion-records.json'),
      fingerprint: await fileFingerprint(input.repoRoot, input.sourceProofBundlePath, 'canonical-ingestion-records.json'),
      summary: {
        filesProcessed: input.moduleProof.stages.fileToCanonical.filesProcessed,
        canonicalRecords: input.moduleProof.stages.fileToCanonical.canonicalRecords,
        quarantinedRecords: input.moduleProof.stages.fileToCanonical.quarantinedRecords,
      },
    },
    {
      stage: 'canonical_object_to_fact_plan',
      status: input.moduleProof.stages.factPlan.status,
      path: path.join(input.targetProofBundlePath, 'target-write-plan.json'),
      fingerprint: await fileFingerprint(input.repoRoot, input.targetProofBundlePath, 'target-write-plan.json'),
      summary: {
        operationsPlanned: input.moduleProof.stages.factPlan.operationsPlanned,
        factOperations: input.moduleProof.stages.factPlan.factOperations,
        evidenceOperations: input.moduleProof.stages.factPlan.evidenceOperations,
        quarantineOperations: input.moduleProof.stages.factPlan.quarantineOperations,
      },
    },
    {
      stage: 'fact_plan_to_graph_plan',
      status: input.moduleProof.stages.graphPlan.status,
      path: path.join(input.moduleReadinessProofPath, 'graph-plan-stage.json'),
      fingerprint: await fileFingerprint(input.repoRoot, input.moduleReadinessProofPath, 'graph-plan-stage.json'),
      summary: {
        graphOperations: input.moduleProof.stages.graphPlan.graphOperations,
        graphEntries: input.moduleProof.stages.graphPlan.graphEntries.length,
      },
    },
    {
      stage: 'fact_plan_to_derived_plan',
      status: input.moduleProof.stages.derivedPlan.status,
      path: path.join(input.moduleReadinessProofPath, 'derived-plan-stage.json'),
      fingerprint: await fileFingerprint(input.repoRoot, input.moduleReadinessProofPath, 'derived-plan-stage.json'),
      summary: {
        derivedObjectsPlanned: input.moduleProof.stages.derivedPlan.derivedObjectsPlanned,
      },
    },
    {
      stage: 'derived_plan_to_module_readiness',
      status: input.moduleProof.stages.moduleReadiness.status,
      path: path.join(input.moduleReadinessProofPath, 'module-readiness-stage.json'),
      fingerprint: await fileFingerprint(input.repoRoot, input.moduleReadinessProofPath, 'module-readiness-stage.json'),
      summary: {
        modulesEvaluated: input.moduleProof.summary.modulesEvaluated,
        runtimeConsumptionReadyModules: input.moduleProof.summary.runtimeConsumptionReadyModules,
      },
    },
  ];
}

function buildPromotionBlocks(
  manifest: TenantPacketManifest,
  sourceGate: 'pass' | 'fail',
  targetSummary: TargetWriterDryRunSummary,
  moduleProof: ModuleReadinessProof,
): string[] {
  const blocks: string[] = [
    'PR8 persists candidate proof metadata only. The candidate promotion gate is not implemented in this release.',
    'Active Tenant Access Layer pointer updates are explicitly disabled.',
    'Module runtime consumption of candidate data is explicitly disabled.',
  ];

  if (sourceGate !== 'pass') blocks.push('Source dry-run quality gate failed.');
  if (targetSummary.qualityGateStatus !== 'pass') blocks.push('Target writer dry-run quality gate failed.');
  if (moduleProof.summary.qualityGateStatus !== 'pass') blocks.push('Module readiness proof quality gate failed.');
  if (manifest.qualityGates.requirePromotionApproval) {
    blocks.push('Tenant packet policy requires manual promotion approval.');
  }
  if (manifest.qualityGates.requireModuleConsumptionProof) {
    blocks.push('Tenant packet policy requires module consumption proof before active promotion.');
  }

  return unique(blocks);
}

function summarizePlannedWrites(operations: TargetWriteOperation[]): CandidatePlannedWriteFamily[] {
  const counts = new Map<TargetStore, number>();
  for (const operation of operations) {
    counts.set(operation.targetStore, (counts.get(operation.targetStore) ?? 0) + 1);
  }

  return [...counts.entries()].map(([targetStore, operationCount]) => ({
    targetStore,
    operationCount,
    writesPhysicalTables: false,
  }));
}

async function writeCandidateRecord(outputDir: string, record: CandidateTenantDataVersionRecord): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'candidate-version-record.json'), `${JSON.stringify(record, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'candidate-version-index.json'), `${JSON.stringify(candidateIndex(record), null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'README.md'), candidateReadme(record));
}

function candidateIndex(record: CandidateTenantDataVersionRecord): Record<string, unknown> {
  return {
    candidateVersionKey: record.candidateVersionKey,
    status: record.currentStatus,
    tenantKey: record.lineage.tenantKey,
    packetId: record.lineage.packetId,
    dryRunOnly: record.dryRunOnly,
    writesPhysicalTables: record.writesPhysicalTables,
    activeTenantAccessLayerUpdated: record.activeTenantAccessLayerUpdated,
    moduleRuntimeConsumptionChanged: record.moduleRuntimeConsumptionChanged,
    proofBundleCount: record.proofBundles.length,
    promotionEnabled: record.promotionControl.promotionEnabled,
  };
}

function candidateReadme(record: CandidateTenantDataVersionRecord): string {
  const proofRows = record.proofBundles
    .map((bundle) => `| ${bundle.stage} | ${bundle.status} | \`${bundle.path}\` | ${bundle.fingerprint} |`)
    .join('\n');
  const writeRows = record.plannedWriteFootprint.families
    .map((family) => `| ${family.targetStore} | ${family.operationCount} | ${family.writesPhysicalTables} |`)
    .join('\n');
  const blocks = record.promotionControl.blocksPromotion.map((block) => `- ${block}`).join('\n');

  return `# Candidate Tenant Data Version Record

Candidate: \`${record.candidateVersionKey}\`
Tenant: \`${record.lineage.tenantKey}\`
Packet: \`${record.lineage.packetId}\`
Status: \`${record.currentStatus}\`

This record persists candidate proof metadata only. It does not write production DB rows,
does not mutate tenant data, does not update the Active Tenant Access Layer, and does not
change module runtime behavior.

## Proof Chain

| Stage | Status | Path | Fingerprint |
| --- | --- | --- | --- |
${proofRows}

## Planned Persistence Footprint

| Target store | Planned operations | Writes physical tables |
| --- | ---: | --- |
${writeRows}

## Promotion Control

- Promotion enabled: ${record.promotionControl.promotionEnabled}
- Manual promotion required: ${record.promotionControl.manualPromotionRequired}
- No module reads candidate by default: ${record.promotionControl.noModuleReadsCandidateByDefault}
- Active tenant access updated: ${record.activeTenantAccessLayerUpdated}
- Module runtime consumption changed: ${record.moduleRuntimeConsumptionChanged}

## Blocks Promotion

${blocks}
`;
}

async function fileFingerprint(repoRoot: string, bundlePath: string, fileName: string): Promise<string> {
  const bytes = await fs.readFile(path.resolve(repoRoot, bundlePath, fileName));
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
