import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { CanonicalIngestionRecord } from '../contracts/canonical-ingestion';
import type {
  CandidateTenantDataVersionPlan,
  TargetPersistenceMapping,
  TargetStore,
  TargetWriteOperation,
  TargetWriterDryRunPlan,
  TargetWriterDryRunSummary,
} from '../contracts/target-writer';

export interface TargetWriterDryRunOptions {
  repoRoot: string;
  sourceProofBundlePath: string;
  outputDir: string;
  packetId?: string;
  tenantKey?: string;
  generatedAt?: string;
}

interface SourceDryRunSummary {
  packetId: string;
  tenantKey: string;
  generatedAt: string;
  proofBundlePath: string;
}

export async function runTargetWriterDryRun(options: TargetWriterDryRunOptions): Promise<TargetWriterDryRunPlan> {
  const sourceBundlePath = path.resolve(options.repoRoot, options.sourceProofBundlePath);
  const sourceSummary = await readJson<SourceDryRunSummary>(path.join(sourceBundlePath, 'dry-run-summary.json'));
  const sourceRecords = await readJson<CanonicalIngestionRecord[]>(
    path.join(sourceBundlePath, 'canonical-ingestion-records.json'),
  );
  const tenantKey = options.tenantKey ?? sourceSummary.tenantKey;
  const packetId = options.packetId ?? sourceSummary.packetId;
  const generatedAt = options.generatedAt ?? sourceSummary.generatedAt;
  const targetProofBundlePath = options.outputDir;
  const operations = planOperations(sourceRecords, tenantKey, packetId);
  const persistenceMappings = buildPersistenceMappings();
  const candidateVersion = buildCandidateVersion({
    tenantKey,
    packetId,
    sourceProofBundlePath: options.sourceProofBundlePath,
    sourceRecords,
    operations,
  });
  const summary = buildSummary({
    tenantKey,
    packetId,
    generatedAt,
    sourceProofBundlePath: options.sourceProofBundlePath,
    targetProofBundlePath,
    operations,
  });
  const plan: TargetWriterDryRunPlan = {
    planVersion: 'target-writer-dry-run/v1',
    dryRunOnly: true,
    summary,
    candidateVersion,
    persistenceMappings,
    operations,
    sourceRecordFingerprints: sourceRecords.map((record) => fingerprintRecord(record)),
    sourceRecords,
  };

  await writeProofBundle(path.resolve(options.repoRoot, options.outputDir), plan);
  return plan;
}

function planOperations(
  records: CanonicalIngestionRecord[],
  tenantKey: string,
  packetId: string,
): TargetWriteOperation[] {
  const operations: TargetWriteOperation[] = [];

  for (const record of records) {
    const base = {
      sourceObjectId: record.sourceObjectId,
      canonicalObjectKey: record.canonicalObjectKey,
      qualityStatus: record.qualityStatus,
      sensitivity: record.sensitivity,
      dataStatus: record.dataStatus,
    };

    if (record.qualityStatus === 'quarantined') {
      operations.push({
        ...base,
        operationId: operationId('quarantine', record, operations.length),
        action: 'quarantine',
        targetStore: 'quarantine',
        targetObjectType: record.objectType,
        idempotencyKey: idempotencyKey(tenantKey, packetId, 'quarantine', record),
        reason: 'Canonical record qualityStatus is quarantined.',
      });
      continue;
    }

    operations.push({
      ...base,
      operationId: operationId('fact', record, operations.length),
      action: 'upsert',
      targetStore: 'canonical_fact_store',
      targetObjectType: record.objectType,
      idempotencyKey: idempotencyKey(tenantKey, packetId, 'canonical_fact_store', record),
    });

    for (const evidenceReference of record.evidenceReferences) {
      operations.push({
        ...base,
        operationId: operationId('evidence', record, operations.length),
        action: 'link',
        targetStore: 'evidence_registry',
        targetObjectType: 'evidence_reference',
        evidenceKey: evidenceReference.evidenceKey,
        idempotencyKey: idempotencyKey(tenantKey, packetId, 'evidence_registry', record, evidenceReference.evidenceKey),
      });
    }

    for (const relationship of record.relationships) {
      operations.push({
        ...base,
        operationId: operationId('relationship', record, operations.length),
        action: 'link',
        targetStore: 'enterprise_relationship_graph',
        targetObjectType: relationship.relationshipType,
        idempotencyKey: idempotencyKey(tenantKey, packetId, 'enterprise_relationship_graph', record, relationship.targetObjectKey),
      });
    }
  }

  return operations;
}

function buildPersistenceMappings(): TargetPersistenceMapping[] {
  return [
    {
      targetStore: 'evidence_registry',
      targetObjectType: 'evidence_reference',
      persistenceFamily: 'Evidence Registry',
      idempotencyKeyFields: ['tenantKey', 'packetId', 'evidenceKey', 'sourceObjectId'],
      writesPhysicalTable: false,
      notes: 'Dry-run link plan only. PR4 does not write evidence records.',
    },
    {
      targetStore: 'canonical_fact_store',
      targetObjectType: 'canonical_record',
      persistenceFamily: 'Canonical Fact Store',
      idempotencyKeyFields: ['tenantKey', 'packetId', 'objectType', 'sourceObjectId', 'canonicalObjectKey'],
      writesPhysicalTable: false,
      notes: 'Dry-run upsert plan only. PR4 does not persist facts.',
    },
    {
      targetStore: 'enterprise_relationship_graph',
      targetObjectType: 'relationship_edge',
      persistenceFamily: 'Enterprise Relationship Graph',
      idempotencyKeyFields: ['tenantKey', 'packetId', 'sourceObjectId', 'relationshipType', 'targetObjectKey'],
      writesPhysicalTable: false,
      notes: 'Dry-run relationship plan only. PR4 does not materialize graph nodes or edges.',
    },
    {
      targetStore: 'quarantine',
      targetObjectType: 'quarantined_canonical_record',
      persistenceFamily: 'Quarantine',
      idempotencyKeyFields: ['tenantKey', 'packetId', 'objectType', 'sourceObjectId', 'validationFindings'],
      writesPhysicalTable: false,
      notes: 'Dry-run quarantine plan only. PR4 does not persist quarantine rows.',
    },
  ];
}

function buildCandidateVersion(input: {
  tenantKey: string;
  packetId: string;
  sourceProofBundlePath: string;
  sourceRecords: CanonicalIngestionRecord[];
  operations: TargetWriteOperation[];
}): CandidateTenantDataVersionPlan {
  return {
    tenantKey: input.tenantKey,
    packetId: input.packetId,
    candidateVersionKey: `${input.tenantKey}:${input.packetId}:candidate-dry-run`,
    createdFromProofBundle: input.sourceProofBundlePath,
    targetWriterVersion: 'target-writer-dry-run/v1',
    canonicalRecordCount: input.sourceRecords.length,
    evidenceOperationCount: countOperations(input.operations, 'evidence_registry'),
    factOperationCount: countOperations(input.operations, 'canonical_fact_store'),
    relationshipOperationCount: countOperations(input.operations, 'enterprise_relationship_graph'),
    quarantineOperationCount: countOperations(input.operations, 'quarantine'),
    promoteAutomatically: false,
  };
}

function buildSummary(input: {
  tenantKey: string;
  packetId: string;
  generatedAt: string;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  operations: TargetWriteOperation[];
}): TargetWriterDryRunSummary {
  const quarantineOperations = countOperations(input.operations, 'quarantine');
  return {
    tenantKey: input.tenantKey,
    packetId: input.packetId,
    generatedAt: input.generatedAt,
    dryRunOnly: true,
    sourceProofBundlePath: input.sourceProofBundlePath,
    targetProofBundlePath: input.targetProofBundlePath,
    operationsPlanned: input.operations.length,
    factOperations: countOperations(input.operations, 'canonical_fact_store'),
    evidenceOperations: countOperations(input.operations, 'evidence_registry'),
    relationshipOperations: countOperations(input.operations, 'enterprise_relationship_graph'),
    quarantineOperations,
    skippedOperations: input.operations.filter((operation) => operation.action === 'skip').length,
    qualityGateStatus: quarantineOperations === 0 ? 'pass' : 'fail',
  };
}

async function writeProofBundle(outputDir: string, plan: TargetWriterDryRunPlan): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'target-write-plan.json'), `${JSON.stringify(plan.operations, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'persistence-mapping.json'), `${JSON.stringify(plan.persistenceMappings, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'candidate-version-plan.json'), `${JSON.stringify(plan.candidateVersion, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'dry-run-summary.json'), `${JSON.stringify(plan.summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'README.md'), proofReadme(plan.summary));
}

function proofReadme(summary: TargetWriterDryRunSummary): string {
  return `# Target Writer Dry-Run Proof Bundle

Packet: \`${summary.packetId}\`
Tenant: \`${summary.tenantKey}\`
Generated: \`${summary.generatedAt}\`

This proof bundle maps canonical ingestion candidates to planned target-store operations.
It is dry-run only: no production DB writes, no tenant data mutation, no candidate promotion,
and no module runtime behavior change.

## Result

- Operations planned: ${summary.operationsPlanned}
- Fact operations: ${summary.factOperations}
- Evidence operations: ${summary.evidenceOperations}
- Relationship operations: ${summary.relationshipOperations}
- Quarantine operations: ${summary.quarantineOperations}
- Quality gate: ${summary.qualityGateStatus}
`;
}

function operationId(prefix: string, record: CanonicalIngestionRecord, index: number): string {
  return `${prefix}-${record.sourceObjectId}-${index + 1}`;
}

function idempotencyKey(
  tenantKey: string,
  packetId: string,
  targetStore: TargetStore,
  record: CanonicalIngestionRecord,
  suffix = '',
): string {
  return fingerprint([tenantKey, packetId, targetStore, record.objectType, record.sourceObjectId, record.canonicalObjectKey ?? '', suffix].join('|'));
}

function fingerprintRecord(record: CanonicalIngestionRecord): string {
  return fingerprint(JSON.stringify(record));
}

function fingerprint(value: string): string {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function countOperations(operations: TargetWriteOperation[], targetStore: TargetStore): number {
  return operations.filter((operation) => operation.targetStore === targetStore).length;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}
