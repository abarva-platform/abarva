export type CanonicalDomain =
  | 'enterprise_structure'
  | 'technology_estate'
  | 'vendor_commercial_estate'
  | 'financial_value'
  | 'transformation_ai_portfolio'
  | 'risk_control_governance'
  | 'sourcing_procurement'
  | 'moves_execution'
  | 'tower_outcomes'
  | 'intelligence_answering'
  | 'memory_learning';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type DataStatus = 'real' | 'synthetic' | 'curated' | 'benchmark';

export type QualityStatus = 'valid' | 'warning' | 'quarantined';

export interface CanonicalValue {
  value: string | number | boolean | Record<string, unknown> | unknown[] | null;
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'currency' | 'percent' | 'json' | 'unknown';
  unit?: string;
  confidence?: number;
}

export interface EvidenceReference {
  evidenceKey: string;
  sourceObjectId?: string;
  sourceField?: string;
  excerpt?: string;
  confidence?: number;
}

export interface SourceAuthority {
  sourceSystem: string;
  sourceType: string;
  owner?: string;
  authority: 'authoritative' | 'supporting' | 'self_reported' | 'derived' | 'benchmark';
}

export interface CanonicalRelationship {
  relationshipType: string;
  targetObjectType: string;
  targetObjectKey: string;
  evidenceReferences: EvidenceReference[];
  confidence?: number;
}

export interface TransformationLineage {
  step: string;
  version: string;
  at: string;
  adapterKey?: string;
  mappingProfile?: string;
  contractVersion?: string;
  notes?: string;
}

export interface CanonicalValidationFinding {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  evidenceKey?: string;
  sourceObjectId?: string;
}

export interface CanonicalIngestionRecord {
  tenantKey: string;
  deploymentKey?: string;
  packetVersion: string;
  domain: CanonicalDomain;
  objectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  attributes: Record<string, CanonicalValue>;
  relationships: CanonicalRelationship[];
  evidenceReferences: EvidenceReference[];
  sourceAuthority: SourceAuthority;
  effectiveDate?: string;
  observedAt?: string;
  confidence?: number;
  sensitivity: DataClassification;
  dataStatus: DataStatus;
  qualityStatus: QualityStatus;
  validationFindings?: CanonicalValidationFinding[];
  lineage: TransformationLineage[];
}
