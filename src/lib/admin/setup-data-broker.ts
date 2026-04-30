/**
 * Setup data broker · SETUP-1.2
 *
 * Server-only seam between `/admin` page rendering and the
 * `data_inventory_*` substrate Codex landed in
 * `supabase/migrations/20260430121500_apex_setup_data_layer.sql`.
 *
 * Per the broker boundary doctrine
 * (memory · feedback_broker_boundary.md), app-tier surfaces don't
 * directly query the substrate — they go through a typed broker
 * call that returns surface-shaped view-models. This module is the
 * /admin landing's broker.
 *
 * What it returns: segment rollups (one row per family), the most
 * recent ingestion-run summary, the audit-log tail (last N events),
 * and chunk/node/edge counts. The authored fixture in
 * `setup-acts-registry.ts` overlays these into a finished
 * `SetupActsContent` via `mergeInventorySnapshot`.
 *
 * What it does NOT return: per-record content or context-chunk
 * text. Those are the domain of SETUP-1.7 (inventory substrate
 * route) where a user clicks into a segment.
 */

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  InventoryActivityEvent,
  InventorySegmentRollup,
  SetupInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';

export interface SegmentRecordSummary {
  recordId: string;
  title: string;
  recordKind: string;
  sourceDoc: string;
  dataClassification: string;
  freshnessState: string;
  confidence: number | null;
  lastReviewed: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

interface SegmentRollupRow {
  segment_id: string;
  segment_name: string;
  family_number: number;
  record_count: number | string;
  coverage_score: number | string;
  stale_count: number | string;
  missing_count: number | string;
  health_state: string;
  last_reviewed_at: string | null;
  last_ingested_at: string | null;
}

interface AuditLogRow {
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  segment_id: string | null;
  source_doc: string | null;
  created_at: string;
}

interface IngestionRunRow {
  source_label: string;
  records_loaded: number | string;
  chunks_loaded: number | string;
  nodes_loaded: number | string;
  edges_loaded: number | string;
  status: string;
  started_at: string;
  completed_at: string | null;
}

const ACTIVITY_LIMIT = 8;

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function describeAuditEvent(row: AuditLogRow): string {
  const segment = row.segment_id ? `segment ${row.segment_id}` : '';
  const doc = row.source_doc ? ` from ${row.source_doc}` : '';
  switch (row.action) {
    case 'segment_imported':
      return `Imported ${segment}${doc}`.trim();
    case 'records_persisted':
      return `Persisted records into ${segment}${doc}`.trim();
    case 'chunks_persisted':
      return `Indexed context chunks for ${segment}${doc}`.trim();
    case 'graph_persisted':
      return `Wrote graph nodes + edges for ${segment}`.trim();
    default:
      return `${row.action}${segment ? ` · ${segment}` : ''}`.trim();
  }
}

function describeActor(row: AuditLogRow): string {
  if (row.actor_id) return row.actor_id;
  switch (row.actor_role) {
    case 'system_import':
      return 'Import pipeline';
    case 'sentinel':
      return 'Sentinel';
    case 'tenant_admin':
      return 'Tenant admin';
    default:
      return row.actor_role ?? 'System';
  }
}

/**
 * Read the segment rollups, audit-log tail, and most recent
 * ingestion-run summary for a tenant. Returns null when the live
 * substrate is unreachable or carries no data — the caller falls
 * back to authored fixture content rather than fail-closing the
 * page.
 */
export async function getSetupInventorySnapshot(
  brokerTenantKey: string,
): Promise<SetupInventorySnapshot | null> {
  const sb = (() => {
    try {
      return getServerSupabase();
    } catch {
      return null;
    }
  })();
  if (!sb) return null;

  const [segmentsResult, auditResult, ingestResult] = await Promise.all([
    sb
      .from('data_inventory_segments')
      .select(
        'segment_id, segment_name, family_number, record_count, coverage_score, stale_count, missing_count, health_state, last_reviewed_at, last_ingested_at',
      )
      .eq('tenant_key', brokerTenantKey)
      .order('family_number'),
    sb
      .from('data_inventory_audit_log')
      .select('action, actor_id, actor_role, segment_id, source_doc, created_at')
      .eq('tenant_key', brokerTenantKey)
      .order('created_at', { ascending: false })
      .limit(ACTIVITY_LIMIT),
    sb
      .from('data_ingestion_runs')
      .select(
        'source_label, records_loaded, chunks_loaded, nodes_loaded, edges_loaded, status, started_at, completed_at',
      )
      .eq('tenant_key', brokerTenantKey)
      .order('started_at', { ascending: false })
      .limit(1),
  ]);

  if (segmentsResult.error || !segmentsResult.data) return null;
  const segmentRows = segmentsResult.data as SegmentRollupRow[];
  if (segmentRows.length === 0) return null;

  const segments: InventorySegmentRollup[] = segmentRows.map((row) => ({
    segmentId: row.segment_id,
    segmentName: row.segment_name,
    familyNumber: row.family_number,
    recordCount: toNumber(row.record_count),
    coverageScore: toNumber(row.coverage_score),
    staleCount: toNumber(row.stale_count),
    missingCount: toNumber(row.missing_count),
    healthState: row.health_state,
    lastReviewedAt: row.last_reviewed_at,
    lastIngestedAt: row.last_ingested_at,
  }));

  const totalRecords = segments.reduce((acc, s) => acc + s.recordCount, 0);

  const auditRows = (auditResult.data ?? []) as AuditLogRow[];
  const recentActivity: InventoryActivityEvent[] = auditRows.map((row) => ({
    actor: describeActor(row),
    what: describeAuditEvent(row),
    timestampIso: row.created_at,
  }));

  const lastIngestRow = (ingestResult.data?.[0] ?? null) as IngestionRunRow | null;
  const totalChunks = lastIngestRow ? toNumber(lastIngestRow.chunks_loaded) : 0;
  const totalNodes = lastIngestRow ? toNumber(lastIngestRow.nodes_loaded) : 0;
  const totalEdges = lastIngestRow ? toNumber(lastIngestRow.edges_loaded) : 0;
  const lastIngestedAt = lastIngestRow?.completed_at ?? lastIngestRow?.started_at ?? null;

  return {
    tenantKey: brokerTenantKey,
    segments,
    totalRecords,
    totalChunks,
    totalNodes,
    totalEdges,
    recentActivity,
    lastIngestedAt,
  };
}

interface RecordRow {
  record_id: string;
  title: string;
  record_kind: string;
  source_doc: string;
  data_classification: string;
  freshness_state: string;
  confidence: number | string | null;
  last_reviewed: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

export interface SegmentRecordPage {
  segmentKey: string;
  rollup: InventorySegmentRollup | null;
  records: SegmentRecordSummary[];
}

const SEGMENT_RECORD_LIMIT = 200;

/**
 * Read the per-record list for a segment, plus the rollup row.
 * Returns null when both queries fail; returns an empty record
 * list with a non-null rollup when the segment exists but has no
 * records yet.
 */
export async function getSegmentRecordPage(
  brokerTenantKey: string,
  segmentKey: string,
): Promise<SegmentRecordPage | null> {
  const sb = (() => {
    try {
      return getServerSupabase();
    } catch {
      return null;
    }
  })();
  if (!sb) return null;

  const [rollupResult, recordsResult] = await Promise.all([
    sb
      .from('data_inventory_segments')
      .select(
        'segment_id, segment_name, family_number, record_count, coverage_score, stale_count, missing_count, health_state, last_reviewed_at, last_ingested_at',
      )
      .eq('tenant_key', brokerTenantKey)
      .eq('segment_id', segmentKey)
      .maybeSingle(),
    sb
      .from('data_inventory_records')
      .select(
        'record_id, title, record_kind, source_doc, data_classification, freshness_state, confidence, last_reviewed, uploaded_by, uploaded_at',
      )
      .eq('tenant_key', brokerTenantKey)
      .eq('segment_id', segmentKey)
      .order('uploaded_at', { ascending: false })
      .limit(SEGMENT_RECORD_LIMIT),
  ]);

  if (rollupResult.error && recordsResult.error) return null;

  const rollupRow = rollupResult.data as SegmentRollupRow | null | undefined;
  const rollup: InventorySegmentRollup | null = rollupRow
    ? {
        segmentId: rollupRow.segment_id,
        segmentName: rollupRow.segment_name,
        familyNumber: rollupRow.family_number,
        recordCount: toNumber(rollupRow.record_count),
        coverageScore: toNumber(rollupRow.coverage_score),
        staleCount: toNumber(rollupRow.stale_count),
        missingCount: toNumber(rollupRow.missing_count),
        healthState: rollupRow.health_state,
        lastReviewedAt: rollupRow.last_reviewed_at,
        lastIngestedAt: rollupRow.last_ingested_at,
      }
    : null;

  const recordRows = (recordsResult.data ?? []) as RecordRow[];
  const records: SegmentRecordSummary[] = recordRows.map((row) => ({
    recordId: row.record_id,
    title: row.title,
    recordKind: row.record_kind,
    sourceDoc: row.source_doc,
    dataClassification: row.data_classification,
    freshnessState: row.freshness_state,
    confidence:
      row.confidence === null
        ? null
        : typeof row.confidence === 'number'
          ? row.confidence
          : Number(row.confidence) || null,
    lastReviewed: row.last_reviewed,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  }));

  return {
    segmentKey,
    rollup,
    records,
  };
}

// ── Cross-program signals (segment 14) view-model ────────────────────────────
//
// Surfaced as a dedicated panel at /admin/cross-program-signals.
// Each signal is a row in the cross_program_signals partition of
// `data_inventory_records`; the substantive fields live in
// `record_payload` (a JSONB column).

export type SignalSeverityBucket = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export interface CrossProgramSignal {
  recordId: string;
  signalId: string;
  title: string;
  /** "shared_sme_overcommitment", "shared_system_dependency", etc. */
  signalType: string;
  /** Raw severity string from the substrate. */
  severityRaw: string;
  /** Bucketed severity for filtering / grouping. */
  severityBucket: SignalSeverityBucket;
  description: string;
  recommendation: string;
  status: string;
  /** Program ids the signal touches. */
  programs: string[];
  raisedBy: string;
  raisedDate: string | null;
}

interface SignalRow {
  record_id: string;
  title: string;
  record_payload: {
    id?: string;
    type?: string;
    severity?: string;
    description?: string;
    recommendation?: string;
    status?: string;
    programs?: string[];
    raised_by?: string;
    raised_date?: string;
  } | null;
}

function bucketSeverity(raw: string | undefined): SignalSeverityBucket {
  if (!raw) return 'unknown';
  const normalized = raw.toLowerCase();
  if (normalized.startsWith('critical')) return 'critical';
  if (normalized.startsWith('high')) return 'high';
  if (normalized.startsWith('medium')) return 'medium';
  if (normalized.startsWith('low')) return 'low';
  return 'unknown';
}

const SEVERITY_RANK: Record<SignalSeverityBucket, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  unknown: 4,
};

/**
 * Read the cross-program signals (segment 14) for a tenant.
 * Returns an empty list when the substrate is unreachable or the
 * segment is unpopulated. Sorted by severity-bucket ascending
 * (high first) then by raised_date descending (most recent first).
 */
export async function getCrossProgramSignals(
  brokerTenantKey: string,
): Promise<CrossProgramSignal[]> {
  const sb = (() => {
    try {
      return getServerSupabase();
    } catch {
      return null;
    }
  })();
  if (!sb) return [];

  const { data, error } = await sb
    .from('data_inventory_records')
    .select('record_id, title, record_payload')
    .eq('tenant_key', brokerTenantKey)
    .eq('segment_id', 'cross_program_signals')
    .order('record_id');

  if (error || !data) return [];

  const rows = data as SignalRow[];
  const signals: CrossProgramSignal[] = rows.map((row) => {
    const payload = row.record_payload ?? {};
    const severityRaw = payload.severity ?? '';
    return {
      recordId: row.record_id,
      signalId: payload.id ?? row.record_id,
      title: row.title,
      signalType: payload.type ?? 'unknown',
      severityRaw,
      severityBucket: bucketSeverity(severityRaw),
      description: payload.description ?? '',
      recommendation: payload.recommendation ?? '',
      status: payload.status ?? '',
      programs: Array.isArray(payload.programs) ? payload.programs : [],
      raisedBy: payload.raised_by ?? '',
      raisedDate: payload.raised_date ?? null,
    };
  });

  return signals.sort((a, b) => {
    const rankDiff = SEVERITY_RANK[a.severityBucket] - SEVERITY_RANK[b.severityBucket];
    if (rankDiff !== 0) return rankDiff;
    if (a.raisedDate && b.raisedDate) {
      return b.raisedDate.localeCompare(a.raisedDate);
    }
    return 0;
  });
}
