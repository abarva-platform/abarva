export type PHSManifestSeverity = 'error' | 'warning';

export type PHSManifestObjectType =
  | 'evidence_item'
  | 'uploaded_artifact'
  | 'workload_record'
  | 'rate_card_row'
  | 'gate_criterion'
  | 'approval_record';

export interface PHSManifestIssue {
  severity: PHSManifestSeverity;
  objectType: PHSManifestObjectType | 'manifest';
  objectId: string | null;
  field: string;
  message: string;
}

export interface PHSEvidenceItem {
  citationKey: string;
  title: string;
  sourceType: 'public' | 'synthetic_internal' | 'generated' | 'corpus';
  owner: string;
  evidenceDate: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted_phi';
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  usableBySurface: string[];
}

export interface PHSUploadedArtifact {
  artifactId: string;
  displayName: string;
  artifactType: string;
  phase: string;
  owner: string;
  storagePath: string;
  parseStatus: 'pending' | 'parsed' | 'failed';
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'waived';
  sensitivity: PHSEvidenceItem['sensitivity'];
  sourceEvidenceIds: string[];
}

export interface PHSWorkloadRecord {
  workloadId: string;
  workloadName: string;
  domain: string;
  currentPlatform: string;
  dataSources: string[];
  phiLevel: 'none' | 'limited' | 'moderate' | 'high';
  owner: string;
  businessCriticality: 'low' | 'medium' | 'high' | 'tier_1';
  modernizationDisposition: string;
  effortSize: 'small' | 'medium' | 'large' | 'xl';
  risk: 'low' | 'medium' | 'high';
}

export interface PHSRateCardRow {
  rateCardId: string;
  role: string;
  internalOrExternal: 'internal' | 'external';
  location: string;
  hourlyRateUsd: number;
  utilizationAssumption: number;
  source: string;
  effectiveDate: string;
}

export interface PHSGateCriterion {
  gateId: string;
  phase: string;
  criterion: string;
  blockerLevel: 'P0' | 'P1' | 'P2';
  requiredEvidence: string[];
  owner: string;
  status: 'blocked' | 'met' | 'waived';
  waiverAllowed: boolean;
}

export interface PHSApprovalRecord {
  approvalId: string;
  artifactId: string;
  approverName: string;
  role: string;
  decision: 'approved' | 'rejected' | 'waived';
  note: string;
  timestamp: string;
  conditions: string[];
}

export interface PHSPhase0Manifest {
  manifestId: string;
  tenantKey: string;
  clientName: string;
  generatedAt: string;
  evidenceItems: PHSEvidenceItem[];
  uploadedArtifacts: PHSUploadedArtifact[];
  workloadRecords: PHSWorkloadRecord[];
  rateCardRows: PHSRateCardRow[];
  gateCriteria: PHSGateCriterion[];
  approvalRecords: PHSApprovalRecord[];
}

export interface PHSManifestValidationResult {
  valid: boolean;
  readyForStageAdvance: boolean;
  issues: PHSManifestIssue[];
  counts: Record<PHSManifestObjectType, number>;
}

const REQUIRED_SURFACES = ['moves', 'admin'];

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function pushRequiredStringIssue(
  issues: PHSManifestIssue[],
  objectType: PHSManifestIssue['objectType'],
  objectId: string | null,
  field: string,
  value: unknown,
): void {
  if (!isBlank(value)) return;
  issues.push({
    severity: 'error',
    objectType,
    objectId,
    field,
    message: `${field} is required.`,
  });
}

function pushRequiredArrayIssue(
  issues: PHSManifestIssue[],
  objectType: PHSManifestIssue['objectType'],
  objectId: string | null,
  field: string,
  value: readonly unknown[],
): void {
  if (value.length > 0) return;
  issues.push({
    severity: 'error',
    objectType,
    objectId,
    field,
    message: `${field} must contain at least one item.`,
  });
}

function addCountIssues(
  issues: PHSManifestIssue[],
  manifest: PHSPhase0Manifest,
): void {
  const required: Array<[PHSManifestObjectType, number]> = [
    ['evidence_item', manifest.evidenceItems.length],
    ['uploaded_artifact', manifest.uploadedArtifacts.length],
    ['workload_record', manifest.workloadRecords.length],
    ['rate_card_row', manifest.rateCardRows.length],
    ['gate_criterion', manifest.gateCriteria.length],
    ['approval_record', manifest.approvalRecords.length],
  ];

  for (const [objectType, count] of required) {
    if (count > 0) continue;
    issues.push({
      severity: 'error',
      objectType,
      objectId: null,
      field: objectType,
      message: `At least one ${objectType} is required before the PHS demo can advance beyond setup.`,
    });
  }
}

export function validatePHSPhase0Manifest(
  manifest: PHSPhase0Manifest,
): PHSManifestValidationResult {
  const issues: PHSManifestIssue[] = [];
  pushRequiredStringIssue(issues, 'manifest', manifest.manifestId, 'manifestId', manifest.manifestId);
  pushRequiredStringIssue(issues, 'manifest', manifest.manifestId, 'tenantKey', manifest.tenantKey);
  pushRequiredStringIssue(issues, 'manifest', manifest.manifestId, 'clientName', manifest.clientName);
  if (!isIsoDate(manifest.generatedAt)) {
    issues.push({
      severity: 'error',
      objectType: 'manifest',
      objectId: manifest.manifestId,
      field: 'generatedAt',
      message: 'generatedAt must be an ISO date or timestamp.',
    });
  }

  addCountIssues(issues, manifest);

  const evidenceKeys = new Set<string>();
  for (const item of manifest.evidenceItems) {
    pushRequiredStringIssue(issues, 'evidence_item', item.citationKey, 'citationKey', item.citationKey);
    pushRequiredStringIssue(issues, 'evidence_item', item.citationKey, 'title', item.title);
    pushRequiredStringIssue(issues, 'evidence_item', item.citationKey, 'owner', item.owner);
    pushRequiredStringIssue(issues, 'evidence_item', item.citationKey, 'summary', item.summary);
    if (item.citationKey) {
      if (evidenceKeys.has(item.citationKey)) {
        issues.push({
          severity: 'error',
          objectType: 'evidence_item',
          objectId: item.citationKey,
          field: 'citationKey',
          message: `Duplicate citation key ${item.citationKey}.`,
        });
      }
      evidenceKeys.add(item.citationKey);
    }
    if (!isIsoDate(item.evidenceDate)) {
      issues.push({
        severity: 'error',
        objectType: 'evidence_item',
        objectId: item.citationKey,
        field: 'evidenceDate',
        message: 'evidenceDate must be an ISO date or timestamp.',
      });
    }
    for (const surface of REQUIRED_SURFACES) {
      if (item.usableBySurface.includes(surface)) continue;
      issues.push({
        severity: 'warning',
        objectType: 'evidence_item',
        objectId: item.citationKey,
        field: 'usableBySurface',
        message: `Evidence should declare whether it is usable by ${surface}.`,
      });
    }
  }

  const artifactIds = new Set<string>();
  for (const artifact of manifest.uploadedArtifacts) {
    artifactIds.add(artifact.artifactId);
    pushRequiredStringIssue(issues, 'uploaded_artifact', artifact.artifactId, 'artifactId', artifact.artifactId);
    pushRequiredStringIssue(issues, 'uploaded_artifact', artifact.artifactId, 'displayName', artifact.displayName);
    pushRequiredStringIssue(issues, 'uploaded_artifact', artifact.artifactId, 'storagePath', artifact.storagePath);
    pushRequiredArrayIssue(issues, 'uploaded_artifact', artifact.artifactId, 'sourceEvidenceIds', artifact.sourceEvidenceIds);
    if (artifact.parseStatus !== 'parsed') {
      issues.push({
        severity: 'error',
        objectType: 'uploaded_artifact',
        objectId: artifact.artifactId,
        field: 'parseStatus',
        message: 'Uploaded artifacts must be parsed before stage advance.',
      });
    }
    for (const evidenceId of artifact.sourceEvidenceIds) {
      if (evidenceKeys.has(evidenceId)) continue;
      issues.push({
        severity: 'error',
        objectType: 'uploaded_artifact',
        objectId: artifact.artifactId,
        field: 'sourceEvidenceIds',
        message: `Unknown source evidence key ${evidenceId}.`,
      });
    }
  }

  for (const workload of manifest.workloadRecords) {
    pushRequiredStringIssue(issues, 'workload_record', workload.workloadId, 'workloadId', workload.workloadId);
    pushRequiredStringIssue(issues, 'workload_record', workload.workloadId, 'workloadName', workload.workloadName);
    pushRequiredStringIssue(issues, 'workload_record', workload.workloadId, 'owner', workload.owner);
    pushRequiredArrayIssue(issues, 'workload_record', workload.workloadId, 'dataSources', workload.dataSources);
  }

  for (const rate of manifest.rateCardRows) {
    pushRequiredStringIssue(issues, 'rate_card_row', rate.rateCardId, 'rateCardId', rate.rateCardId);
    pushRequiredStringIssue(issues, 'rate_card_row', rate.rateCardId, 'role', rate.role);
    pushRequiredStringIssue(issues, 'rate_card_row', rate.rateCardId, 'source', rate.source);
    if (rate.hourlyRateUsd <= 0) {
      issues.push({
        severity: 'error',
        objectType: 'rate_card_row',
        objectId: rate.rateCardId,
        field: 'hourlyRateUsd',
        message: 'hourlyRateUsd must be greater than zero.',
      });
    }
    if (rate.utilizationAssumption <= 0 || rate.utilizationAssumption > 1) {
      issues.push({
        severity: 'error',
        objectType: 'rate_card_row',
        objectId: rate.rateCardId,
        field: 'utilizationAssumption',
        message: 'utilizationAssumption must be greater than zero and no more than one.',
      });
    }
  }

  for (const gate of manifest.gateCriteria) {
    pushRequiredStringIssue(issues, 'gate_criterion', gate.gateId, 'gateId', gate.gateId);
    pushRequiredStringIssue(issues, 'gate_criterion', gate.gateId, 'owner', gate.owner);
    pushRequiredArrayIssue(issues, 'gate_criterion', gate.gateId, 'requiredEvidence', gate.requiredEvidence);
    if (gate.status === 'blocked') {
      issues.push({
        severity: 'error',
        objectType: 'gate_criterion',
        objectId: gate.gateId,
        field: 'status',
        message: 'Blocked gates prevent stage advance.',
      });
    }
    if (gate.status === 'waived' && !gate.waiverAllowed) {
      issues.push({
        severity: 'error',
        objectType: 'gate_criterion',
        objectId: gate.gateId,
        field: 'waiverAllowed',
        message: 'This gate is waived but waiverAllowed is false.',
      });
    }
    for (const evidenceId of gate.requiredEvidence) {
      if (evidenceKeys.has(evidenceId)) continue;
      issues.push({
        severity: 'error',
        objectType: 'gate_criterion',
        objectId: gate.gateId,
        field: 'requiredEvidence',
        message: `Unknown required evidence key ${evidenceId}.`,
      });
    }
  }

  for (const approval of manifest.approvalRecords) {
    pushRequiredStringIssue(issues, 'approval_record', approval.approvalId, 'approvalId', approval.approvalId);
    pushRequiredStringIssue(issues, 'approval_record', approval.approvalId, 'approverName', approval.approverName);
    pushRequiredStringIssue(issues, 'approval_record', approval.approvalId, 'role', approval.role);
    pushRequiredStringIssue(issues, 'approval_record', approval.approvalId, 'note', approval.note);
    if (!artifactIds.has(approval.artifactId)) {
      issues.push({
        severity: 'error',
        objectType: 'approval_record',
        objectId: approval.approvalId,
        field: 'artifactId',
        message: `Approval references unknown artifact ${approval.artifactId}.`,
      });
    }
    if (!isIsoDate(approval.timestamp)) {
      issues.push({
        severity: 'error',
        objectType: 'approval_record',
        objectId: approval.approvalId,
        field: 'timestamp',
        message: 'timestamp must be an ISO date or timestamp.',
      });
    }
  }

  const valid = !issues.some((issue) => issue.severity === 'error');
  return {
    valid,
    readyForStageAdvance: valid,
    issues,
    counts: {
      evidence_item: manifest.evidenceItems.length,
      uploaded_artifact: manifest.uploadedArtifacts.length,
      workload_record: manifest.workloadRecords.length,
      rate_card_row: manifest.rateCardRows.length,
      gate_criterion: manifest.gateCriteria.length,
      approval_record: manifest.approvalRecords.length,
    },
  };
}
