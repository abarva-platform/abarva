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

/**
 * Whether anything actually acts on a retention policy.
 *
 * Seven policies are declared here, with windows from 14 to 2555 days and
 * delete triggers written in prose. Outside this module's own test, nothing
 * reads any of them: there is no purge job, no expiry sweep, and no code path
 * that consults `retainDays` before keeping or deleting a file.
 *
 * That state is worse than having no policy, because a table of retention
 * windows reads as a control to anyone who finds it — during diligence, most
 * of all. This field is what stops it reading that way. It is deliberately
 * not optional and deliberately not defaulted: a new policy must say which
 * of the two it is.
 */
export type PilotRetentionEnforcement =
  | {
      /** Declared and acted on. `enforcedBy` names the module that does it. */
      state: 'enforced';
      enforcedBy: string;
    }
  | {
      /** Declared and acted on by nothing. The prose is a statement of intent. */
      state: 'declared_not_enforced';
      /** What a customer loses by this being intent rather than mechanism. */
      gap: string;
    };

export interface PilotRetentionPolicy {
  artifactClass: PilotArtifactClass;
  retainDays: number;
  deleteTrigger: string;
  approvalRequired: boolean;
  evidence: string;
  enforcement: PilotRetentionEnforcement;
}

/**
 * Legal hold, recorded as a decision rather than left as an absence.
 *
 * Nothing in the repository expresses "keep this until the dispute closes".
 * There is no hold flag on either artifact store, no hold table, and no code
 * that would honour one.
 *
 * **Out of scope for the pilot**, and the cost of that is stated here rather
 * than discovered in a diligence call: a customer asking "can you suspend
 * deletion on these records pending litigation?" gets a no. Since nothing is
 * deleted on a schedule either — see `PilotRetentionEnforcement` — no data is
 * currently at risk from the absence, which is the only reason this is
 * deferrable. **The two must be decided together**: the day a purge mechanism
 * lands, the absence of legal hold stops being harmless and becomes a way to
 * destroy records somebody was obliged to keep.
 */
export const PILOT_LEGAL_HOLD_POSTURE = {
  state: 'out_of_scope_for_pilot',
  decidedOn: '2026-09-19',
  costIfAsked:
    'A customer cannot suspend deletion pending litigation or audit. There is no '
    + 'hold flag, no hold register, and nothing that would honour one.',
  whyDeferrable:
    'Nothing deletes on a schedule today, so there is no scheduled deletion for a '
    + 'hold to interrupt.',
  reopenTrigger:
    'Any change that makes retention enforceable. A purge mechanism without legal '
    + 'hold can destroy records somebody was obliged to keep.',
} as const;

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
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'An uploaded file is kept indefinitely; the 30-day window is intent, not a sweep.',
    },
  },
  {
    artifactClass: 'quarantine_copy',
    retainDays: 30,
    deleteTrigger: 'delete after release, rejection, hard-delete, or customer-approved retention exception',
    approvalRequired: true,
    evidence: 'pilot_ingestion_quarantine_cases decision row plus sensitive_upload_audit lifecycle row',
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'A quarantined copy is never aged out, so quarantine is storage rather than containment with an end.',
    },
  },
  {
    artifactClass: 'parsed_intermediate',
    retainDays: 14,
    deleteTrigger: 'delete after preview approval, rejection, or rollback replay completion',
    approvalRequired: false,
    evidence: 'pilot_ingestion_file_manifests manifest_role=parsed',
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'Parsed intermediates accumulate; the 14-day window describes nothing that runs.',
    },
  },
  {
    artifactClass: 'failed_load',
    retainDays: 30,
    deleteTrigger: 'delete after failure triage and audit export capture',
    approvalRequired: true,
    evidence: 'pilot_ingestion_upload_runs.error_report and audit export manifest',
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'A failed load keeps its artifacts past triage with nothing to remove them.',
    },
  },
  {
    artifactClass: 'committed_evidence',
    retainDays: 2555,
    deleteTrigger: 'retain through audit window unless customer contract specifies a longer period',
    approvalRequired: true,
    evidence: 'pilot_ingestion_load_commits and pilot_ingestion_load_commit_items',
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'The 7-year window is a statement about intent, not a guarantee the evidence survives that long or is removed after.',
    },
  },
  {
    artifactClass: 'audit_export',
    retainDays: 2555,
    deleteTrigger: 'retain through audit window; expire signed access links within 24 hours',
    approvalRequired: true,
    evidence: 'pilot_ingestion_audit_exports',
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'The 24-hour signed-link expiry is the only part of this with a mechanism elsewhere; the 7-year retention of the export itself is not enforced.',
    },
  },
  {
    artifactClass: 'offboarding_export',
    retainDays: 30,
    deleteTrigger: 'delete after customer confirms receipt or offboarding window expires',
    approvalRequired: true,
    evidence: 'offboarding export ticket plus pilot_ingestion_audit_exports',
    enforcement: {
      state: 'declared_not_enforced',
      gap: 'An offboarding export is not removed after the window, so data belonging to a departed customer stays.',
    },
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

/**
 * How many declared retention policies nothing acts on.
 *
 * Reported as a number so the gap is countable rather than a comment someone
 * has to notice. Seven of seven today.
 */
export function countUnenforcedRetentionPolicies(): number {
  return PILOT_RETENTION_POLICIES.filter(
    (policy) => policy.enforcement.state === 'declared_not_enforced',
  ).length;
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
