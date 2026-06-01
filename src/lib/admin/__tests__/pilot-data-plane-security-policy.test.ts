import {
  buildPilotAuditExportManifest,
  evaluatePilotMalwareGate,
  getPilotRetentionPolicy,
  PILOT_RETENTION_POLICIES,
  PILOT_SECURITY_BACKLOG_ROWS,
  validatePilotEncryptionPosture,
} from '@/lib/admin/pilot-data-plane-security-policy';

describe('pilot data-plane security and retention policy', () => {
  it('covers T361-T364 explicitly', () => {
    expect(PILOT_SECURITY_BACKLOG_ROWS).toEqual(['T361', 'T362', 'T363', 'T364']);
  });

  it('blocks parsing until malware scan is clean', () => {
    expect(
      evaluatePilotMalwareGate({
        malwareStatus: 'pending',
        sensitiveDataStatus: 'allowed',
        artifactClass: 'raw_upload',
      }),
    ).toEqual({
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'malware scan is pending; processing cannot begin until scan is clean',
    });

    expect(
      evaluatePilotMalwareGate({
        malwareStatus: 'infected',
        sensitiveDataStatus: 'allowed',
        artifactClass: 'raw_upload',
      }),
    ).toEqual({
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'malware scan detected an infected file; keep quarantined and block all parsing, indexing, and promotion',
    });

    expect(
      evaluatePilotMalwareGate({
        malwareStatus: 'clean',
        sensitiveDataStatus: 'allowed',
        artifactClass: 'raw_upload',
      }),
    ).toEqual({
      parseAllowed: true,
      storagePromotionAllowed: true,
      reason: 'malware gate is clean and sensitive-data status allows this artifact class',
    });
  });

  it('keeps sensitive-data quarantine from leaking into normal processing', () => {
    expect(
      evaluatePilotMalwareGate({
        malwareStatus: 'clean',
        sensitiveDataStatus: 'quarantined',
        artifactClass: 'parsed_intermediate',
      }),
    ).toEqual({
      parseAllowed: false,
      storagePromotionAllowed: false,
      reason: 'sensitive-data quarantine must be released before non-quarantine processing',
    });

    expect(
      evaluatePilotMalwareGate({
        malwareStatus: 'clean',
        sensitiveDataStatus: 'quarantined',
        artifactClass: 'quarantine_copy',
      }).storagePromotionAllowed,
    ).toBe(true);
  });

  it('requires stronger key posture for regulated pilot data', () => {
    expect(
      validatePilotEncryptionPosture({
        mode: 'platform_managed',
        keyVaultPrivateEndpoint: false,
        purgeProtectionEnabled: false,
        rotationDays: 365,
        regulatedDataExpected: true,
      }),
    ).toEqual({
      ready: false,
      blockers: [
        'regulated pilot data requires customer_managed_key or bring_your_own_key encryption mode',
        'Key Vault must use a private endpoint before live pilot files are processed',
        'Key Vault purge protection must be enabled before live pilot files are processed',
        'key and secret rotation must be scheduled between 1 and 180 days',
      ],
    });

    expect(
      validatePilotEncryptionPosture({
        mode: 'customer_managed_key',
        keyVaultPrivateEndpoint: true,
        purgeProtectionEnabled: true,
        rotationDays: 90,
        regulatedDataExpected: true,
      }),
    ).toEqual({ ready: true, blockers: [] });
  });

  it('defines retention for every pilot artifact class', () => {
    expect(PILOT_RETENTION_POLICIES).toHaveLength(7);
    expect(getPilotRetentionPolicy('raw_upload').retainDays).toBe(30);
    expect(getPilotRetentionPolicy('parsed_intermediate').retainDays).toBe(14);
    expect(getPilotRetentionPolicy('committed_evidence').retainDays).toBe(2555);
    expect(getPilotRetentionPolicy('audit_export').deleteTrigger).toContain('24 hours');
  });

  it('builds audit export manifests with scoped ledger coverage and 24-hour signed links', () => {
    expect(
      buildPilotAuditExportManifest({
        tenantKey: 'apex-retail',
        exportKey: 'exp-001',
        scope: 'upload_run',
        requestedByUserId: 'user_1',
        storagePath: 'private/audit/apex/exp-001.zip',
        sha256: 'abc123',
      }),
    ).toEqual({
      tenantKey: 'apex-retail',
      exportKey: 'exp-001',
      scope: 'upload_run',
      requestedByUserId: 'user_1',
      storagePath: 'private/audit/apex/exp-001.zip',
      sha256: 'abc123',
      signedUrlMaxHours: 24,
      includesTables: [
        'pilot_ingestion_upload_runs',
        'pilot_ingestion_file_manifests',
        'pilot_ingestion_quarantine_cases',
        'pilot_ingestion_clarification_requests',
        'pilot_ingestion_approval_decisions',
        'pilot_ingestion_audit_exports',
      ],
    });

    expect(
      buildPilotAuditExportManifest({
        tenantKey: 'apex-retail',
        exportKey: 'exp-002',
        scope: 'load_commit',
        requestedByUserId: 'user_1',
        storagePath: 'private/audit/apex/exp-002.zip',
        sha256: 'def456',
      }).includesTables,
    ).toContain('pilot_ingestion_rollback_requests');
  });
});
