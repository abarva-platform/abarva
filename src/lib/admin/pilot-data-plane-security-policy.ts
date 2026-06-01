export type PilotSecurityBacklogRowId = 'T361' | 'T362' | 'T363' | 'T364';

export type PilotMalwareScanStatus =
  | 'pending'
  | 'clean'
  | 'infected'
  | 'scan_failed'
  | 'not_required';

export type PilotSensitiveDataStatus =
  | 'pending'
  | 'allowed'
  | 'quarantined'
  | 'released';

export type PilotArtifactClass =
  | 'raw_upload'
  | 'quarantine_copy'
  | 'parsed_intermediate'
  | 'failed_load'
  | 'committed_evidence'
  | 'audit_export'
  | 'offboarding_export';

export type PilotEncryptionMode = 'platform_managed' | 'customer_managed_key' | 'bring_your_own_key';

export type PilotAuditExportScope = 'upload_run' | 'load_commit' | 'tenant_window';

export interface PilotMalwareGateInput {
  malwareStatus: PilotMalwareScanStatus;
  sensitiveDataStatus: PilotSensitiveDataStatus;
  artifactClass: PilotArtifactClass;
}

export interface PilotMalwareGateDecision {
  parseAllowed: boolean;
  storagePromotionAllowed: boolean;
  reason: string;
}

export interface PilotEncryptionPostureInput {
  mode: PilotEncryptionMode;
  keyVaultPrivateEndpoint: boolean;
  purgeProtectionEnabled: boolean;
  rotationDays: number;
  regulatedDataExpected: boolean;
}

export interface PilotEncryptionPostureDecision {
  ready: boolean;
  blockers: string[];
}

export interface PilotRetentionPolicy {
  artifactClass: PilotArtifactClass;
  retainDays: number;
  deleteTrigger: string;
  approvalRequired: boolean;
  evidence: string;
}

export interface PilotAuditExportManifestInput {
  tenantKey: string;
  exportKey: string;
  scope: PilotAuditExportScope;
  requestedByUserId: string;
  storagePath: string;
  sha256: string;
}

export interface PilotAuditExportManifest {
  tenantKey: string;
  exportKey: string;
  scope: PilotAuditExportScope;
  requestedByUserId: string;
  storagePath: string;
  sha256: string;
  signedUrlMaxHours: 24;
  includesTables: readonly string[];
}

export const PILOT_SECURITY_BACKLOG_ROWS: readonly PilotSecurityBacklogRowId[] = [
  'T361',
  'T362',
  'T363',
  'T364',
];

export const PILOT_RETENTION_POLICIES: readonly PilotRetentionPolicy[] = [
  {
    artifactClass: 'raw_upload',
    retainDays: 30,
    deleteTrigger: 'delete after commit, rejection, or customer offboarding hold expires',
    approvalRequired: true,
    evidence: 'pilot_ingestion_file_manifests.storage_state and audit export manifest',
  },
  {
    artifactClass: 'quarantine_copy',
    retainDays: 30,
    deleteTrigger: 'delete after release, rejection, hard-delete, or customer-approved retention exception',
    approvalRequired: true,
    evidence: 'pilot_ingestion_quarantine_cases decision row plus sensitive_upload_audit lifecycle row',
  },
  {
    artifactClass: 'parsed_intermediate',
    retainDays: 14,
    deleteTrigger: 'delete after preview approval, rejection, or rollback replay completion',
    approvalRequired: false,
    evidence: 'pilot_ingestion_file_manifests manifest_role=parsed',
  },
  {
    artifactClass: 'failed_load',
    retainDays: 30,
    deleteTrigger: 'delete after failure triage and audit export capture',
    approvalRequired: true,
    evidence: 'pilot_ingestion_upload_runs.error_report and audit export manifest',
  },
  {
    artifactClass: 'committed_evidence',
    retainDays: 2555,
    deleteTrigger: 'retain through audit window unless customer contract specifies a longer period',
    approvalRequired: true,
    evidence: 'pilot_ingestion_load_commits and pilot_ingestion_load_commit_items',
  },
  {
    artifactClass: 'audit_export',
    retainDays: 2555,
    deleteTrigger: 'retain through audit window; expire signed access links within 24 hours',
    approvalRequired: true,
    evidence: 'pilot_ingestion_audit_exports',
  },
  {
    artifactClass: 'offboarding_export',
    retainDays: 30,
    deleteTrigger: 'delete after customer confirms receipt or offboarding window expires',
    approvalRequired: true,
    evidence: 'offboarding export ticket plus pilot_ingestion_audit_exports',
  },
];

export function evaluatePilotMalwareGate(input: PilotMalwareGateInput): PilotMalwareGateDecision {
  if (input.malwareStatus === 'infected') {
    return {
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'malware scan detected an infected file; keep quarantined and block all parsing, indexing, and promotion',
    };
  }

  if (input.malwareStatus === 'scan_failed') {
    return {
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'malware scan failed; retry scan or reviewer-reject before processing',
    };
  }

  if (input.malwareStatus === 'pending') {
    return {
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'malware scan is pending; processing cannot begin until scan is clean',
    };
  }

  if (input.sensitiveDataStatus === 'quarantined' && input.artifactClass !== 'quarantine_copy') {
    return {
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'sensitive-data quarantine must be released before non-quarantine processing',
    };
  }

  return {
    parseAllowed: input.artifactClass !== 'audit_export' && input.artifactClass !== 'offboarding_export',
    storagePromotionAllowed: true,
    reason: 'malware gate is clean and sensitive-data status allows this artifact class',
  };
}

export function validatePilotEncryptionPosture(
  input: PilotEncryptionPostureInput,
): PilotEncryptionPostureDecision {
  const blockers: string[] = [];

  if (input.regulatedDataExpected && input.mode === 'platform_managed') {
    blockers.push('regulated pilot data requires customer_managed_key or bring_your_own_key encryption mode');
  }

  if (!input.keyVaultPrivateEndpoint) {
    blockers.push('Key Vault must use a private endpoint before live pilot files are processed');
  }

  if (!input.purgeProtectionEnabled) {
    blockers.push('Key Vault purge protection must be enabled before live pilot files are processed');
  }

  if (input.rotationDays <= 0 || input.rotationDays > 180) {
    blockers.push('key and secret rotation must be scheduled between 1 and 180 days');
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}

export function getPilotRetentionPolicy(
  artifactClass: PilotArtifactClass,
): PilotRetentionPolicy {
  const policy = PILOT_RETENTION_POLICIES.find((entry) => entry.artifactClass === artifactClass);
  if (!policy) {
    throw new Error(`unknown_pilot_retention_artifact_class:${artifactClass}`);
  }
  return policy;
}

export function buildPilotAuditExportManifest(
  input: PilotAuditExportManifestInput,
): PilotAuditExportManifest {
  const baseTables = [
    'pilot_ingestion_upload_runs',
    'pilot_ingestion_file_manifests',
    'pilot_ingestion_quarantine_cases',
    'pilot_ingestion_clarification_requests',
    'pilot_ingestion_approval_decisions',
    'pilot_ingestion_audit_exports',
  ];

  const commitTables =
    input.scope === 'load_commit' || input.scope === 'tenant_window'
      ? [
          'pilot_ingestion_load_commits',
          'pilot_ingestion_load_commit_items',
          'pilot_ingestion_rollback_requests',
        ]
      : [];

  return {
    ...input,
    signedUrlMaxHours: 24,
    includesTables: [...baseTables, ...commitTables],
  };
}
