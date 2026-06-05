import { describe, expect, it, jest } from '@jest/globals';
import {
  buildPilotIngestionAuditOnlyWritePlan,
  type DurablePilotIngestionLedgerWriteInput,
  type DurablePilotIngestionLedgerWriteResult,
} from '@/lib/admin/pilot-ingestion-ledger';
import type { AzureLandingZoneMessage } from '@/lib/ingestion/azure-landing-zone-types';
import {
  buildDurablePilotLedgerInput,
  createDurablePilotLedgerWriter,
} from '../pilot-ledger-writer';

const message: AzureLandingZoneMessage = {
  schema: 'abarva.ingestion.v1',
  tenantClientKey: 'meridian-health',
  segmentKey: 'enterprise_profile',
  storage: {
    accountName: 'stcontextpilot001',
    containerName: 'context-drops',
    blobPath: 'context-uploads/meridian-health/phase-0/abc123/enterprise-profile.yaml',
    sizeBytes: 2048,
    contentType: 'application/x-yaml',
    sha256: 'ab'.padEnd(64, '0'),
  },
  declaredClassification: 'confidential_business',
  producedAt: '2026-06-05T22:00:00.000Z',
  metadata: {
    clientId: 'client-meridian-health',
    initiatedByUserId: 'user-phs-admin',
    attestationVersion: 'pilot-loader-data-load-attestation-v1',
    originalFileName: 'enterprise-profile.yaml',
    sourceSystem: 'admin_bulk_context_upload',
    templateVersion: 'unversioned',
    mappingProfileKey: 'enterprise-profile',
    mappingProfileVersion: 'unversioned',
  },
};

const plan = buildPilotIngestionAuditOnlyWritePlan({
  tenantKey: message.tenantClientKey,
  segmentKey: message.segmentKey,
  storage: message.storage,
  producedAt: message.producedAt,
  sourceSystem: 'admin_bulk_context_upload',
  templateVersion: 'unversioned',
  mappingProfileKey: 'enterprise-profile',
  mappingProfileVersion: 'unversioned',
  auditRowId: 'audit-1',
  outcome: { status: 'accepted', chunksWritten: 4 },
  protectionDecision: 'allow',
});

describe('pilot ledger writer', () => {
  it('builds the durable audit-only ledger input from worker message metadata', () => {
    const input = buildDurablePilotLedgerInput({ message, plan });

    expect(input).toMatchObject({
      clientId: 'client-meridian-health',
      initiatedByUserId: 'user-phs-admin',
      attestationVersion: 'pilot-loader-data-load-attestation-v1',
      originalFilename: 'enterprise-profile.yaml',
      plan: {
        mode: 'audit_only',
        tenantKey: 'meridian-health',
        uploadRun: {
          sourceSystem: 'admin_bulk_context_upload',
          segmentKey: 'enterprise_profile',
          status: 'awaiting_approval',
        },
        commitBlocked: true,
      },
    });
  });

  it('requires client and attestation metadata before writing the durable ledger', () => {
    expect(() =>
      buildDurablePilotLedgerInput({
        message: { ...message, metadata: { ...message.metadata, clientId: '' } },
        plan,
      }),
    ).toThrow('pilot_ledger_metadata_missing:clientId');

    expect(() =>
      buildDurablePilotLedgerInput({
        message: { ...message, metadata: { ...message.metadata, attestationVersion: '' } },
        plan,
      }),
    ).toThrow('pilot_ledger_metadata_missing:attestationVersion');
  });

  it('invokes the durable writer with the generated ledger input', async () => {
    const writes: unknown[] = [];
    const writer = createDurablePilotLedgerWriter(
      jest.fn(async (
        input: DurablePilotIngestionLedgerWriteInput,
      ): Promise<DurablePilotIngestionLedgerWriteResult> => {
        writes.push(input);
        return {
          status: 'written',
          uploadRunId: 'run-1',
          fileManifestId: 'file-1',
          quarantineCaseId: null,
          idempotencyKey: input.plan.uploadRun.idempotencyKey,
          commitBlocked: true,
          commitBlockers: input.plan.commitBlockers,
        };
      }),
    );

    await writer({ message, plan });

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      clientId: 'client-meridian-health',
      originalFilename: 'enterprise-profile.yaml',
    });
  });
});
