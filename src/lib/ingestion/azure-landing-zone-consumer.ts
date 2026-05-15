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
  parseIngestionMessage,
  type AzureLandingZoneMessage,
  type IngestionOutcome,
} from '@/lib/ingestion/azure-landing-zone-types';

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
}) => Promise<{ chunksWritten: number }>;

export interface ConsumeContext {
  readonly download: BlobDownloader;
  readonly writeAudit: AuditWriter;
  readonly runPipeline: IngestionPipeline;
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
    return { ...outcome, auditRowId };
  }

  // ── 4. Run the downstream pipeline ───────────────────────────────
  let chunksWritten: number;
  try {
    const result = await ctx.runPipeline({ message: msg, bytes, filename });
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
  return { ...outcome, auditRowId };
}
