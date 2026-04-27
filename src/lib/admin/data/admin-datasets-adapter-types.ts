/**
 * ADMIN-DATA2 — Admin datasets adapter types.
 */

export type AdminDatasetRung =
  | 'loaded'
  | 'available'
  | 'usable'
  | 'agent_usable'
  | 'decision_grade';

export type AdminDatasetApprovalState =
  | 'unapproved'
  | 'requested'
  | 'approved'
  | 'revoked';

export interface AdminDatasetRow {
  id: string;
  slug: string;
  label: string;
  domain: string;
  rung: AdminDatasetRung;
  rowCount: number | null;
  ownerPersonId: string | null;
  segment: string;
  evidenceUsable: boolean;
  approvalState: AdminDatasetApprovalState;
  lastUpdatedAt: string;
}

export interface AdminDatasetSchemaColumn {
  column: string;
  dtype: string;
  nullable: boolean;
}

export interface AdminDatasetProvenanceEntry {
  at: string;
  label: string;
}

export interface AdminDatasetDetail extends AdminDatasetRow {
  lineageSources: ReadonlyArray<string>;
  schemaSummary: ReadonlyArray<AdminDatasetSchemaColumn>;
  provenance: ReadonlyArray<AdminDatasetProvenanceEntry>;
  approvalOwner: string;
  notes: string;
}

export type AdminDatasetApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AdminDatasetApprovalRow {
  id: string;
  datasetId: string;
  fromRung: AdminDatasetRung;
  toRung: AdminDatasetRung;
  status: AdminDatasetApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  reason: string | null;
}

export interface AdminDatasetQuality {
  datasetId: string;
  completeness: number;
  freshness: number;
  schemaConformance: number;
  lineage: number;
  sampleAgreement: number;
  overall: number;
  measuredAt: string;
}

export type AdminLoadedFileStatus = 'approved' | 'missing' | 'processing';

export interface AdminLoadedFileRow {
  id: string;
  name: string;
  segment: 'Business' | 'IT & Technology' | 'Third Party';
  category: string;
  status: AdminLoadedFileStatus;
  owner: string;
  lastUpdated: string;
}
