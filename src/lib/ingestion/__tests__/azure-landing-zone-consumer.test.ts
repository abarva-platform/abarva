import { describe, it, expect, jest } from '@jest/globals';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import {
  consumeOneMessage,
  type ConsumeContext,
  type PilotLedgerWriterInput,
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
      writePilotLedger: jest.fn(async (input: PilotLedgerWriterInput) => {
        ledgerPlans.push(input.plan);
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

  it('waits for Defender for Storage scan proof before downloading or parsing', async () => {
    const { ctx, calls } = makeCtx({
      checkDefenderScan: jest.fn(() => ({
        decision: 'retry',
        scanResult: 'missing',
        reason: 'defender_scan_result_missing',
      })) as unknown as ConsumeContext['checkDefenderScan'],
    });
    const outcome = await consumeOneMessage(validMessage, ctx);

    expect(outcome).toMatchObject({
      status: 'transient_failure',
      reason: 'defender_scan_result_missing',
    });
    expect(calls.download).toBe(0);
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
  });

  it('quarantines Defender-malicious blobs before download or parsing', async () => {
    const { ctx, calls } = makeCtx({
      checkDefenderScan: jest.fn(() => ({
        decision: 'quarantine',
        scanResult: 'malicious',
        reasonCode: 'malware.defender_storage',
        message: 'Upload quarantined because Microsoft Defender for Storage reported a malicious blob.',
      })) as unknown as ConsumeContext['checkDefenderScan'],
    });
    const outcome = await consumeOneMessage(validMessage, ctx);

    expect(outcome).toMatchObject({
      status: 'quarantined',
      auditRowId: 'audit-1',
      reasonCodes: ['malware.defender_storage'],
    });
    expect(calls.download).toBe(0);
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
  });

  it('continues to download and parse after Defender reports no threats found', async () => {
    const { ctx, calls } = makeCtx({
      checkDefenderScan: jest.fn(() => ({
        decision: 'allow',
        scanResult: 'no_threats_found',
        scanTimeUtc: '2026-06-03T13:35:00Z',
      })) as unknown as ConsumeContext['checkDefenderScan'],
    });
    const outcome = await consumeOneMessage(validMessage, ctx);

    expect(outcome.status).toBe('accepted');
    expect(calls.download).toBe(1);
    expect(calls.pipeline).toBe(1);
    expect(calls.audit).toBe(1);
  });

  it('parses supported documents and passes extracted text to the downstream pipeline', async () => {
    const pipelineArgs: unknown[] = [];
    const parseDocument = jest.fn(async () => ({
      text: 'Agreement term: vendor may not train models on customer data.',
      parseMethod: 'azure-document-intelligence-layout',
      warnings: ['Azure AI Document Intelligence prebuilt-layout parser used.'],
      metadata: {
        mimeType: 'application/pdf',
        extension: 'pdf',
        bytesParsed: 17,
        truncated: false,
        pageCount: 2,
        tableCount: 1,
      },
    })) as unknown as ConsumeContext['parseDocument'];
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => {
        calls.download++;
        return {
          bytes: new TextEncoder().encode('%PDF-1.4 contract'),
          filename: 'kyriba-contract.pdf',
        };
      }) as unknown as ConsumeContext['download'],
      parseDocument,
      runPipeline: jest.fn(async (args) => {
        calls.pipeline++;
        pipelineArgs.push(args);
        return { chunksWritten: 3 };
      }) as unknown as ConsumeContext['runPipeline'],
    });

    const outcome = await consumeOneMessage(
      {
        ...validMessage,
        segmentKey: 'vendor_contracts',
        storage: {
          ...validMessage.storage,
          blobPath: 'contracts/kyriba-contract.pdf',
          contentType: 'application/pdf',
        },
      },
      ctx,
    );

    expect(outcome).toMatchObject({
      status: 'accepted',
      chunksWritten: 3,
      auditRowId: 'audit-1',
    });
    expect(parseDocument).toHaveBeenCalledWith({
      message: expect.objectContaining({ segmentKey: 'vendor_contracts' }),
      bytes: expect.any(Uint8Array),
      filename: 'kyriba-contract.pdf',
    });
    expect(pipelineArgs[0]).toMatchObject({
      filename: 'kyriba-contract.pdf',
      document: {
        text: 'Agreement term: vendor may not train models on customer data.',
        parseMethod: 'azure-document-intelligence-layout',
      },
    });
    expect(calls.audit).toBe(1);
  });

  it.each([
    ['unsupported', 'archive.zip', 'application/zip', new Uint8Array([80, 75]), 'document_parse_unsupported'],
    ['mismatched', 'contract.pdf', 'application/pdf', new TextEncoder().encode('plain text'), 'document_parse_mismatch'],
    ['oversized', 'large.txt', 'text/plain', new Uint8Array(21 * 1024 * 1024).fill(97), 'document_parse_too_large'],
    ['empty', 'empty.txt', 'text/plain', new TextEncoder().encode('  '), 'document_parse_empty'],
  ])('rejects %s document bytes after auditing the correct tenant', async (_case, filename, contentType, bytes, reasonCode) => {
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => ({ bytes, filename })) as unknown as ConsumeContext['download'],
    });
    const message = {
      ...validMessage,
      tenantClientKey: 'test-tenant-a',
      storage: { ...validMessage.storage, blobPath: filename, contentType },
    };

    const outcome = await consumeOneMessage(message, ctx);

    expect(outcome).toMatchObject({
      status: 'rejected',
      auditRowId: 'audit-1',
      reason: expect.stringContaining(reasonCode),
    });
    expect(ctx.writeAudit).toHaveBeenCalledWith({
      message: expect.objectContaining({ tenantClientKey: 'test-tenant-a' }),
      outcome: expect.objectContaining({ status: 'rejected' }),
      protectionResult: expect.objectContaining({ decision: 'allow' }),
    });
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
  });

  it('keeps an extractor fault retryable and does not run the pipeline', async () => {
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => {
        calls.download++;
        return {
          bytes: new TextEncoder().encode('%PDF-1.4 contract'),
          filename: 'broken-contract.pdf',
        };
      }) as unknown as ConsumeContext['download'],
      parseDocument: jest.fn(async () => {
        throw new Error('extractor unavailable');
      }) as unknown as ConsumeContext['parseDocument'],
    });

    const outcome = await consumeOneMessage(
      {
        ...validMessage,
        segmentKey: 'vendor_contracts',
        storage: {
          ...validMessage.storage,
          blobPath: 'contracts/broken-contract.pdf',
          contentType: 'application/pdf',
        },
      },
      ctx,
    );

    expect(outcome).toMatchObject({
      status: 'transient_failure',
      reason: 'document_parse_failed:extractor unavailable',
      auditRowId: null,
    });
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
  });

  it('retries a binary extractor fault that returns no text with a warning', async () => {
    const zip = new JSZip();
    zip.file('word/document.xml', '<w:document><w:t>Readable text</w:t></w:document>');
    const bytes = await zip.generateAsync({ type: 'nodebuffer' });
    const extractor = jest.spyOn(mammoth, 'extractRawText').mockRejectedValueOnce(new Error('extractor unavailable'));
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => ({ bytes, filename: 'document.docx' })) as unknown as ConsumeContext['download'],
    });

    try {
      const outcome = await consumeOneMessage({
        ...validMessage,
        storage: {
          ...validMessage.storage,
          blobPath: 'document.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      }, ctx);

      expect(outcome).toMatchObject({
        status: 'transient_failure',
        auditRowId: null,
        reason: 'document_parse_failed:document_extraction_failed',
      });
      expect(calls.pipeline).toBe(0);
      expect(calls.audit).toBe(1);
    } finally {
      extractor.mockRestore();
    }
  });

  it('retries deterministic input when its audit cannot be written', async () => {
    const { ctx, calls } = makeCtx({
      download: jest.fn(async () => ({
        bytes: new TextEncoder().encode(' '),
        filename: 'empty.txt',
      })) as unknown as ConsumeContext['download'],
      writeAudit: jest.fn(async () => {
        calls.audit++;
        throw new Error('audit unavailable');
      }) as unknown as ConsumeContext['writeAudit'],
    });

    const outcome = await consumeOneMessage({
      ...validMessage,
      storage: { ...validMessage.storage, contentType: 'text/plain' },
    }, ctx);

    expect(outcome).toMatchObject({
      status: 'transient_failure',
      auditRowId: null,
      reason: expect.stringContaining('audit unavailable'),
    });
    expect(calls.pipeline).toBe(0);
    expect(calls.audit).toBe(1);
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
      writePilotLedger: jest.fn(async (input: PilotLedgerWriterInput) => {
        ledgerPlans.push(input.plan);
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
