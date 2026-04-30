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
