// Azure landing-zone ingestion types
//
// Shape of messages flowing through Service Bus queue
// `q-context-ingestion-events` (provisioned by #1946 + #1942 backbone).
//
// A2b: the consumer Function processes these messages, runs the
// sensitive-upload guard, and routes the payload through the broker
// pipeline. See `src/lib/ingestion/azure-landing-zone-consumer.ts`.
//
// Producers today:
//   - Azure Event Grid system topic on the Storage account
//     (BlobCreated trigger emits Event Grid event → Event Grid pushes
//     a normalized message onto `q-context-ingestion-events`)
//
// Producers later:
//   - Direct integrations (Tier-3) that POST a "landed" message
//     after their own pipeline writes the blob
//   - In-VPC customers (Tier-4) — same shape, different network path

import type { UploadDataClassification } from '@/lib/security/sensitive-upload-guard';

/**
 * Canonical message shape. Producers MUST emit this shape; consumers
 * MUST validate via `parseIngestionMessage` before acting on any field.
 */
export interface AzureLandingZoneMessage {
  /** Schema version. Bump when shape changes. */
  readonly schema: 'abarva.ingestion.v1';
  /** Tenant key — must match the customer's canonical ClientKey. */
  readonly tenantClientKey: string;
  /** Which of the 14 setup-data segments this blob belongs to. */
  readonly segmentKey: SegmentKey;
  /** Storage container + path. Used for download + audit trail. */
  readonly storage: {
    readonly accountName: string;
    readonly containerName: string;
    readonly blobPath: string;
    readonly sizeBytes: number;
    readonly contentType: string;
    readonly sha256: string;
  };
  /** Caller-declared classification (per the 5-level taxonomy). */
  readonly declaredClassification?: UploadDataClassification;
  /** ISO-8601 timestamp the producer emitted the message. */
  readonly producedAt: string;
  /** Free-form structured metadata producer may attach. */
  readonly metadata?: Record<string, string | number | boolean>;
}

/**
 * The 14 segments from the canonical setup-data pack. Mirrors the
 * folder structure under `src/scripts/setup-data/<tenant>-data/`.
 */
export type SegmentKey =
  | 'enterprise_profile'
  | 'org_structure'
  | 'it_landscape'
  | 'it_financials'
  | 'kpi_dictionary'
  | 'program_inventory'
  | 'sourcing_artifacts'
  | 'program_deliverables'
  | 'evidence_ledger'
  | 'operating_telemetry'
  | 'vendor_contracts'
  | 'compliance'
  | 'industry_context'
  | 'cross_program_signals'
  | 'data_estate'
  | 'infrastructure';

export const SEGMENT_KEYS: ReadonlyArray<SegmentKey> = [
  'enterprise_profile',
  'org_structure',
  'it_landscape',
  'it_financials',
  'kpi_dictionary',
  'program_inventory',
  'sourcing_artifacts',
  'program_deliverables',
  'evidence_ledger',
  'operating_telemetry',
  'vendor_contracts',
  'compliance',
  'industry_context',
  'cross_program_signals',
  'data_estate',
  'infrastructure',
];

/**
 * Outcome of processing one message. Surfaced in audit log + returned
 * to the queue handler to drive Service Bus complete / dead-letter.
 */
export type IngestionOutcome =
  | { readonly status: 'accepted'; readonly auditRowId: string; readonly chunksWritten: number; readonly durationMs: number }
  | { readonly status: 'quarantined'; readonly auditRowId: string; readonly reasonCodes: ReadonlyArray<string>; readonly durationMs: number }
  | { readonly status: 'rejected'; readonly auditRowId: string | null; readonly reason: string; readonly durationMs: number }
  | { readonly status: 'transient_failure'; readonly auditRowId: string | null; readonly reason: string; readonly durationMs: number };

/**
 * Validate a raw queue payload against the canonical shape. Returns
 * the typed message on success, throws with a precise error on
 * failure. Used both by the consumer and by unit tests that exercise
 * malformed-message paths.
 */
export function parseIngestionMessage(raw: unknown): AzureLandingZoneMessage {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('ingestion_message_not_object');
  }
  const m = raw as Record<string, unknown>;
  if (m.schema !== 'abarva.ingestion.v1') {
    throw new Error(`unsupported_schema:${String(m.schema)}`);
  }
  if (typeof m.tenantClientKey !== 'string' || !m.tenantClientKey) {
    throw new Error('missing_tenantClientKey');
  }
  if (!SEGMENT_KEYS.includes(m.segmentKey as SegmentKey)) {
    throw new Error(`invalid_segmentKey:${String(m.segmentKey)}`);
  }
  const s = m.storage as Record<string, unknown> | undefined;
  if (!s || typeof s.accountName !== 'string' || typeof s.containerName !== 'string'
    || typeof s.blobPath !== 'string' || typeof s.sha256 !== 'string'
    || typeof s.sizeBytes !== 'number' || typeof s.contentType !== 'string') {
    throw new Error('invalid_storage_block');
  }
  if (typeof m.producedAt !== 'string') {
    throw new Error('missing_producedAt');
  }
  return m as unknown as AzureLandingZoneMessage;
}
