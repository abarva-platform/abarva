// Azure landing-zone consumer · A2b
//
// Processes one message from `q-context-ingestion-events`:
//
//   1. Validate the message shape
//   2. Download the blob bytes (or accept them inline for testing)
//   3. Run the existing sensitive-upload guard
//   4. Persist + audit accordingly
//
// Designed to be the body of an Azure Function in production. Also
// runnable as a local CLI for smoke-testing without spinning up the
// Function (see `scripts/tier2-consume.ts`).
//
// Deployment surface (Codex's lane):
//   - Azure Function triggered by Service Bus queue trigger on
//     `q-context-ingestion-events`
//   - Or: ContainerApps-job pull mode against the Service Bus client
//
// This module abstracts both. It's pure logic — pass in the message
// + a `BlobDownloader` + an `AuditWriter`; the function returns an
// `IngestionOutcome`. No SDK initialization happens inside.
//
// Backlog: A2b (docs/BACKLOG-2026-05-14.md)

import {
  evaluateSensitiveUpload,
  type UploadProtectionResult,
} from '@/lib/security/sensitive-upload-guard';
import {
  buildPilotIngestionAuditOnlyWritePlan,
  type PilotIngestionAuditOnlyWritePlan,
} from '@/lib/admin/pilot-ingestion-ledger';
import {
  parseIngestionMessage,
  type AzureLandingZoneMessage,
  type IngestionOutcome,
} from '@/lib/ingestion/azure-landing-zone-types';
import {
  buildDefenderStorageProtectionResult,
  evaluateDefenderStorageScanTags,
  hasDefenderScanMetadata,
  type DefenderStorageScanGateResult,
} from '@/lib/ingestion/defender-storage-scan-gate';
import {
  parseIngestionDocument,
  type ParsedIngestionDocument,
} from '@/lib/ingestion/document-upload-parser';

/**
 * Downloads the bytes for an inbound message. The caller passes in a
 * real implementation in production (using `@azure/storage-blob` +
 * managed identity); tests pass a mock.
 */
export type BlobDownloader = (msg: AzureLandingZoneMessage) => Promise<{
  bytes: Uint8Array | ArrayBuffer;
  filename: string;
}>;

/**
 * Writes one audit row capturing the outcome. Caller passes the real
 * Supabase-backed writer in production; tests pass a recorder.
 */
export type AuditWriter = (args: {
  message: AzureLandingZoneMessage;
  outcome: IngestionOutcome;
  protectionResult?: UploadProtectionResult;
}) => Promise<string>; // returns the audit-row id

export interface PilotLedgerWriterInput {
  readonly plan: PilotIngestionAuditOnlyWritePlan;
  readonly message: AzureLandingZoneMessage;
}

export type PilotLedgerWriter = (input: PilotLedgerWriterInput) => Promise<void>;

export type DefenderStorageScanGate = (
  message: AzureLandingZoneMessage,
) => Promise<DefenderStorageScanGateResult> | DefenderStorageScanGateResult;

/**
 * Optional downstream-pipeline hook. After the guard passes, the
 * caller decides what to do with the bytes — write to the broker
 * substrate, kick off chunking, fire downstream events, etc. Returns
 * the chunk count for the outcome report.
 */
export type IngestionPipeline = (args: {
  message: AzureLandingZoneMessage;
  bytes: Uint8Array;
  filename: string;
  document: ParsedIngestionDocument | null;
}) => Promise<{ chunksWritten: number }>;

export type IngestionDocumentParser = (args: {
  message: AzureLandingZoneMessage;
  bytes: Uint8Array;
  filename: string;
}) => Promise<ParsedIngestionDocument | null>;

export interface ConsumeContext {
  readonly download: BlobDownloader;
  readonly writeAudit: AuditWriter;
  readonly runPipeline: IngestionPipeline;
  readonly writePilotLedger?: PilotLedgerWriter;
  readonly checkDefenderScan?: DefenderStorageScanGate;
  readonly parseDocument?: IngestionDocumentParser;
}

function metadataString(
  metadata: AzureLandingZoneMessage['metadata'] | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

async function writePilotLedgerOrTransient(args: {
  ctx: ConsumeContext;
  message: AzureLandingZoneMessage;
  outcome: Extract<IngestionOutcome, { status: 'accepted' | 'quarantined' }>;
  protectionResult: UploadProtectionResult;
}): Promise<IngestionOutcome | null> {
  if (!args.ctx.writePilotLedger) return null;

  try {
    const plan = buildPilotIngestionAuditOnlyWritePlan({
      tenantKey: args.message.tenantClientKey,
      segmentKey: args.message.segmentKey,
      storage: args.message.storage,
      producedAt: args.message.producedAt,
      sourceSystem: metadataString(args.message.metadata, 'sourceSystem'),
      templateVersion: metadataString(args.message.metadata, 'templateVersion'),
      mappingProfileKey: metadataString(args.message.metadata, 'mappingProfileKey'),
      mappingProfileVersion: metadataString(args.message.metadata, 'mappingProfileVersion'),
      auditRowId: args.outcome.auditRowId,
      outcome:
        args.outcome.status === 'accepted'
          ? { status: 'accepted', chunksWritten: args.outcome.chunksWritten }
          : { status: 'quarantined', reasonCodes: args.outcome.reasonCodes },
      protectionDecision: args.protectionResult.decision,
    });
    await args.ctx.writePilotLedger({ plan, message: args.message });
    return null;
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'pilot_ledger_write_failed';
    return {
      status: 'transient_failure',
      auditRowId: null,
      reason: `pilot_ledger_write_failed:${reason}`,
      durationMs: args.outcome.durationMs,
    };
  }
}

/**
 * Process exactly one message. Caller (the Azure Function or the
 * local CLI) is responsible for telling Service Bus to complete /
 * dead-letter based on the returned outcome status:
 *
 *   - `accepted` / `quarantined`            → complete (we've persisted the audit row)
 *   - `rejected`                            → dead-letter (message itself is malformed)
 *   - `transient_failure`                   → abandon (let Service Bus retry)
 */
export async function consumeOneMessage(
  rawPayload: unknown,
  ctx: ConsumeContext,
): Promise<IngestionOutcome> {
  const t0 = Date.now();

  // ── 1. Validate ──────────────────────────────────────────────────
  let msg: AzureLandingZoneMessage;
  try {
    msg = parseIngestionMessage(rawPayload);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'invalid_message';
    return {
      status: 'rejected',
      auditRowId: null,
      reason,
      durationMs: Date.now() - t0,
    };
  }

  // ── 2. Defender malware scan gate ───────────────────────────────
  const defenderScan = ctx.checkDefenderScan
    ? await ctx.checkDefenderScan(msg)
    : hasDefenderScanMetadata(msg.metadata)
      ? evaluateDefenderStorageScanTags(msg.metadata)
      : null;

  if (defenderScan?.decision === 'retry') {
    const outcome: IngestionOutcome = {
      status: 'transient_failure',
      auditRowId: null,
      reason: defenderScan.reason,
      durationMs: Date.now() - t0,
    };
    try {
      await ctx.writeAudit({ message: msg, outcome });
    } catch {
      // Let Service Bus retry; no parsing may occur before Defender scan proof.
    }
    return outcome;
  }

  if (defenderScan?.decision === 'quarantine') {
    const protection = buildDefenderStorageProtectionResult(defenderScan);
    const outcome: IngestionOutcome = {
      status: 'quarantined',
      auditRowId: '',
      reasonCodes: [defenderScan.reasonCode],
      durationMs: Date.now() - t0,
    };
    const auditRowId = await ctx.writeAudit({
      message: msg,
      outcome,
      protectionResult: protection,
    });
    const outcomeWithAudit = { ...outcome, auditRowId };
    return (await writePilotLedgerOrTransient({
      ctx,
      message: msg,
      outcome: outcomeWithAudit,
      protectionResult: protection,
    })) ?? outcomeWithAudit;
  }

  // ── 2. Download ──────────────────────────────────────────────────
  let bytes: Uint8Array;
  let filename: string;
  try {
    const downloaded = await ctx.download(msg);
    bytes =
      downloaded.bytes instanceof Uint8Array
        ? downloaded.bytes
        : new Uint8Array(downloaded.bytes);
    filename = downloaded.filename;
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'download_failed';
    const outcome: IngestionOutcome = {
      status: 'transient_failure',
      auditRowId: null,
      reason,
      durationMs: Date.now() - t0,
    };
    try {
      await ctx.writeAudit({ message: msg, outcome });
    } catch {
      // audit-write failure on a transient download path is itself
      // transient; let Service Bus retry the whole message.
    }
    return outcome;
  }

  // ── 3. Sensitive-data gate ───────────────────────────────────────
  const protection = evaluateSensitiveUpload({
    filename,
    mimeType: msg.storage.contentType,
    bytes,
    declaredClassification: msg.declaredClassification ?? null,
  });

  if (protection.decision === 'quarantine') {
    const reasonCodes = protection.matchedRules.map((r) => r.ruleId);
    const outcome: IngestionOutcome = {
      status: 'quarantined',
      auditRowId: '',
      reasonCodes,
      durationMs: Date.now() - t0,
    };
    const auditRowId = await ctx.writeAudit({
      message: msg,
      outcome,
      protectionResult: protection,
    });
    const outcomeWithAudit = { ...outcome, auditRowId };
    return (await writePilotLedgerOrTransient({
      ctx,
      message: msg,
      outcome: outcomeWithAudit,
      protectionResult: protection,
    })) ?? outcomeWithAudit;
  }

  // ── 4. Parse document payloads before the downstream pipeline ─────
  const parseDocument =
    ctx.parseDocument ??
    ((args) =>
      parseIngestionDocument({
        filename: args.filename,
        mimeType: msg.storage.contentType,
        bytes: args.bytes,
        cacheScope: `${msg.tenantClientKey}:${msg.storage.sha256}`,
      }));
  let document: ParsedIngestionDocument | null;
  try {
    document = await parseDocument({ message: msg, bytes, filename });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'document_parse_failed';
    const outcome: IngestionOutcome = {
      status: 'transient_failure',
      auditRowId: null,
      reason: `document_parse_failed:${reason}`,
      durationMs: Date.now() - t0,
    };
    try {
      await ctx.writeAudit({ message: msg, outcome, protectionResult: protection });
    } catch {
      // see comment above
    }
    return outcome;
  }

  // ── 5. Run the downstream pipeline ───────────────────────────────
  let chunksWritten: number;
  try {
    const result = await ctx.runPipeline({ message: msg, bytes, filename, document });
    chunksWritten = result.chunksWritten;
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'pipeline_failed';
    const outcome: IngestionOutcome = {
      status: 'transient_failure',
      auditRowId: null,
      reason,
      durationMs: Date.now() - t0,
    };
    try {
      await ctx.writeAudit({ message: msg, outcome, protectionResult: protection });
    } catch {
      // see comment above
    }
    return outcome;
  }

  const outcome: IngestionOutcome = {
    status: 'accepted',
    auditRowId: '',
    chunksWritten,
    durationMs: Date.now() - t0,
  };
  const auditRowId = await ctx.writeAudit({
    message: msg,
    outcome,
    protectionResult: protection,
  });
  const outcomeWithAudit = { ...outcome, auditRowId };
  return (await writePilotLedgerOrTransient({
    ctx,
    message: msg,
    outcome: outcomeWithAudit,
    protectionResult: protection,
  })) ?? outcomeWithAudit;
}
