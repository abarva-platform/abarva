import { describe, it, expect, jest } from '@jest/globals';
import {
  consumeOneMessage,
  type ConsumeContext,
} from '../azure-landing-zone-consumer';
import type { AzureLandingZoneMessage } from '../azure-landing-zone-types';

const validMessage: AzureLandingZoneMessage = {
  schema: 'abarva.ingestion.v1',
  tenantClientKey: 'apexretail',
  segmentKey: 'kpi_dictionary',
  storage: {
    accountName: 'staapexretailprod',
    containerName: 'apexretail-tier2',
    blobPath: 'kpi/2026-Q2/kpi-snapshot.csv',
    sizeBytes: 4096,
    contentType: 'text/csv',
    sha256: '00aabbccddeeff'.padEnd(64, '0'),
  },
  declaredClassification: 'confidential_business',
  producedAt: '2026-05-15T12:00:00Z',
};

function makeCtx(
  overrides: Partial<ConsumeContext> = {},
): { ctx: ConsumeContext; calls: { download: number; audit: number; pipeline: number } } {
  const calls = { download: 0, audit: 0, pipeline: 0 };
  const ctx: ConsumeContext = {
    download: jest.fn(async () => {
      calls.download++;
      return { bytes: new Uint8Array([97, 98, 99]), filename: 'kpi-snapshot.csv' };
    }) as unknown as ConsumeContext['download'],
    writeAudit: jest.fn(async () => {
      calls.audit++;
      return `audit-${calls.audit}`;
    }) as unknown as ConsumeContext['writeAudit'],
    runPipeline: jest.fn(async () => {
      calls.pipeline++;
      return { chunksWritten: 7 };
    }) as unknown as ConsumeContext['runPipeline'],
    ...overrides,
  };
  return { ctx, calls };
}

describe('A2b · consumeOneMessage', () => {
  it('returns accepted on the happy path and writes one audit row', async () => {
    const { ctx, calls } = makeCtx();
    const outcome = await consumeOneMessage(validMessage, ctx);
    expect(outcome.status).toBe('accepted');
    if (outcome.status === 'accepted') {
      expect(outcome.chunksWritten).toBe(7);
      expect(outcome.auditRowId).toBe('audit-1');
    }
    expect(calls.download).toBe(1);
    expect(calls.pipeline).toBe(1);
    expect(calls.audit).toBe(1);
  });

  it('passes accepted files to the pilot ledger writer in audit-only mode', async () => {
    const ledgerPlans: unknown[] = [];
    const { ctx } = makeCtx({
      writePilotLedger: jest.fn(async (plan) => {
        ledgerPlans.push(plan);
      }) as unknown as ConsumeContext['writePilotLedger'],
    });
    const outcome = await consumeOneMessage(
      {
        ...validMessage,
        metadata: {
          sourceSystem: 'Workday',
          templateVersion: '2026.06',
          mappingProfileKey: 'default',
          mappingProfileVersion: '1',
        },
      },
      ctx,
    );

    expect(outcome.status).toBe('accepted');
    expect(ledgerPlans).toHaveLength(1);
    expect(ledgerPlans[0]).toMatchObject({
      mode: 'audit_only',
      tenantKey: 'apexretail',
      uploadRun: {
        status: 'awaiting_approval',
        sourceSystem: 'Workday',
        segmentKey: 'kpi_dictionary',
        auditRowId: 'audit-1',
      },
      fileManifest: {
        tenantKey: 'apexretail',
        blobPath: 'kpi/2026-Q2/kpi-snapshot.csv',
        protectionDecision: 'allow',
      },
      commitBlocked: true,
    });
  });

  it('rejects (no audit row) when the schema is wrong', async () => {
    const { ctx, calls } = makeCtx();
    const outcome = await consumeOneMessage(
      { ...validMessage, schema: 'something.else' },
      ctx,
    );
    expect(outcome.status).toBe('rejected');
    expect(calls.download).toBe(0);
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(0);
  });

  it('returns transient_failure when download throws and writes an audit row', async () => {
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => {
        throw new Error('storage unreachable');
      }) as unknown as ConsumeContext['download'],
    });
    const outcome = await consumeOneMessage(validMessage, ctx);
    expect(outcome.status).toBe('transient_failure');
    if (outcome.status === 'transient_failure') {
      expect(outcome.reason).toBe('storage unreachable');
    }
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
  });

  it('quarantines and does NOT run the pipeline when the upload guard fires', async () => {
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => {
        // Construct bytes that the guard's pattern-match library will
        // detect as PHI/PII (a plausible US SSN string).
        const text = 'SSN: 123-45-6789, contact info for our member.';
        const bytes = new TextEncoder().encode(text);
        return { bytes, filename: 'leak.txt' };
      }) as unknown as ConsumeContext['download'],
    });
    const outcome = await consumeOneMessage(
      { ...validMessage, declaredClassification: 'regulated_phi_pii_suspected' },
      ctx,
    );
    expect(outcome.status).toBe('quarantined');
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
  });

  it('passes quarantined files to the pilot ledger writer with reason codes', async () => {
    const ledgerPlans: unknown[] = [];
    const { ctx } = makeCtx({
      download: jest.fn(async () => {
        const bytes = new TextEncoder().encode('SSN: 123-45-6789');
        return { bytes, filename: 'leak.txt' };
      }) as unknown as ConsumeContext['download'],
      writePilotLedger: jest.fn(async (plan) => {
        ledgerPlans.push(plan);
      }) as unknown as ConsumeContext['writePilotLedger'],
    });

    const outcome = await consumeOneMessage(
      { ...validMessage, declaredClassification: 'regulated_phi_pii_suspected' },
      ctx,
    );

    expect(outcome.status).toBe('quarantined');
    expect(ledgerPlans).toHaveLength(1);
    expect(ledgerPlans[0]).toMatchObject({
      mode: 'audit_only',
      uploadRun: { status: 'quarantined' },
      fileManifest: { protectionDecision: 'quarantine' },
      quarantineCase: {
        tenantKey: 'apexretail',
        segmentKey: 'kpi_dictionary',
        auditRowId: 'audit-1',
        status: 'open',
      },
    });
  });

  it('returns transient_failure if the pilot ledger writer fails', async () => {
    const { ctx, calls } = makeCtx({
      writePilotLedger: jest.fn(async () => {
        throw new Error('ledger unavailable');
      }) as unknown as ConsumeContext['writePilotLedger'],
    });

    const outcome = await consumeOneMessage(validMessage, ctx);

    expect(outcome).toMatchObject({
      status: 'transient_failure',
      reason: 'pilot_ledger_write_failed:ledger unavailable',
    });
    expect(calls.audit).toBe(1);
  });

  it('writes audit even on a pipeline failure (transient)', async () => {
    const { ctx, calls } = makeCtx({
      runPipeline: jest.fn(async () => {
        throw new Error('broker down');
      }) as unknown as ConsumeContext['runPipeline'],
    });
    const outcome = await consumeOneMessage(validMessage, ctx);
    expect(outcome.status).toBe('transient_failure');
    if (outcome.status === 'transient_failure') {
      expect(outcome.reason).toBe('broker down');
    }
    expect(calls.audit).toBe(1);
  });
});
