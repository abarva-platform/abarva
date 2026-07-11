import type { CanonicalIngestionRecord, DataClassification, DataStatus, QualityStatus } from './canonical-ingestion';

export type TargetWriterPlanVersion = 'target-writer-dry-run/v1';

export type TargetStore =
  | 'evidence_registry'
  | 'canonical_fact_store'
  | 'enterprise_relationship_graph'
  | 'derived_intelligence_store'
  | 'module_memory'
  | 'outcome_ledger'
  | 'quarantine';

export type TargetWriteAction = 'upsert' | 'link' | 'quarantine' | 'skip';

export interface TargetPersistenceMapping {
  targetStore: TargetStore;
  targetObjectType: string;
  persistenceFamily: string;
  idempotencyKeyFields: string[];
  writesPhysicalTable: false;
  notes: string;
}

export interface TargetWriteOperation {
  operationId: string;
  action: TargetWriteAction;
  targetStore: TargetStore;
  targetObjectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  idempotencyKey: string;
  qualityStatus: QualityStatus;
  sensitivity: DataClassification;
  dataStatus: DataStatus;
  evidenceKey?: string;
  reason?: string;
}

export interface CandidateTenantDataVersionPlan {
  tenantKey: string;
  packetId: string;
  candidateVersionKey: string;
  createdFromProofBundle: string;
  targetWriterVersion: TargetWriterPlanVersion;
  canonicalRecordCount: number;
  evidenceOperationCount: number;
  factOperationCount: number;
  relationshipOperationCount: number;
  quarantineOperationCount: number;
  promoteAutomatically: false;
}

export interface TargetWriterDryRunSummary {
  tenantKey: string;
  packetId: string;
  generatedAt: string;
  dryRunOnly: true;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  operationsPlanned: number;
  factOperations: number;
  evidenceOperations: number;
  relationshipOperations: number;
  quarantineOperations: number;
  skippedOperations: number;
  qualityGateStatus: 'pass' | 'fail';
}

export interface TargetWriterDryRunPlan {
  planVersion: TargetWriterPlanVersion;
  dryRunOnly: true;
  summary: TargetWriterDryRunSummary;
  candidateVersion: CandidateTenantDataVersionPlan;
  persistenceMappings: TargetPersistenceMapping[];
  operations: TargetWriteOperation[];
  sourceRecordFingerprints: string[];
  sourceRecords: CanonicalIngestionRecord[];
}
