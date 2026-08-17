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

/**
 * How a fact came to be known.
 *
 * This exists because the same metric legitimately arrives twice by different routes and the
 * two will not match. A client workbook declares annual spend of $44M; metered cloud cost
 * reports $51M. Neither is wrong — one is a budget, the other is consumption — but with no way
 * to say which is which, the only options were to overwrite one with the other, keep them in
 * separate stores, or mark the metric CONFLICT and refuse to quote it. All three lose the most
 * valuable answer, which is the 16% gap.
 *
 * - `declared` — the client asserts it about themselves, typically from an intake workbook.
 * - `observed` — the platform measured it from a live system, typically a tool API.
 * - `derived`  — computed from other facts, including the variance between a declared and an
 *                observed value of the same metric.
 *
 * CONFLICT should mean two sources of the SAME basis disagree. Two bases differing is not a
 * conflict; it is the finding.
 */
export type FactBasis = 'declared' | 'observed' | 'derived';

export interface SourceAuthority {
  sourceSystem: string;
  sourceType: string;
  owner?: string;
  authority: 'authoritative' | 'supporting' | 'self_reported' | 'derived' | 'benchmark';
  /**
   * Defaults to `declared` when omitted: everything ingested from a client intake workbook is
   * the client asserting something about themselves. Collectors reading a live system must set
   * `observed` explicitly, so the burden of declaring provenance falls on the path that is not
   * the norm.
   */
  basis?: FactBasis;
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
