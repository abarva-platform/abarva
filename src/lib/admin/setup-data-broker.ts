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

import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  InventoryActivityEvent,
  InventorySegmentRollup,
  SetupInventorySnapshot,
} from "@/lib/admin/setup-acts-registry";

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
  last_reviewed_at: string | Date | null;
  last_ingested_at: string | Date | null;
}

interface AuditLogRow {
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  segment_id: string | null;
  source_doc: string | null;
  created_at: string | Date;
}

interface IngestionRunRow {
  source_label: string;
  records_loaded: number | string;
  chunks_loaded: number | string;
  nodes_loaded: number | string;
  edges_loaded: number | string;
  status: string;
  started_at: string | Date;
  completed_at: string | Date | null;
}

const ACTIVITY_LIMIT = 8;

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function describeAuditEvent(row: AuditLogRow): string {
  const segment = row.segment_id ? `segment ${row.segment_id}` : "";
  const doc = row.source_doc ? ` from ${row.source_doc}` : "";
  switch (row.action) {
    case "segment_imported":
      return `Imported ${segment}${doc}`.trim();
    case "records_persisted":
      return `Persisted records into ${segment}${doc}`.trim();
    case "chunks_persisted":
      return `Indexed context chunks for ${segment}${doc}`.trim();
    case "graph_persisted":
      return `Wrote graph nodes + edges for ${segment}`.trim();
    default:
      return `${row.action}${segment ? ` · ${segment}` : ""}`.trim();
  }
}

function describeActor(row: AuditLogRow): string {
  if (row.actor_id) return row.actor_id;
  switch (row.actor_role) {
    case "system_import":
      return "Import pipeline";
    case "sentinel":
      return "Sentinel";
    case "tenant_admin":
      return "Tenant admin";
    default:
      return row.actor_role ?? "System";
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
  let segmentRows: SegmentRollupRow[];
  let auditRows: AuditLogRow[];
  let ingestRows: IngestionRunRow[];
  try {
    [segmentRows, auditRows, ingestRows] = await Promise.all([
      azureRead.select<SegmentRollupRow>({
        table: "data_inventory_segments",
        columns: [
          "segment_id",
          "segment_name",
          "family_number",
          "record_count",
          "coverage_score",
          "stale_count",
          "missing_count",
          "health_state",
          "last_reviewed_at",
          "last_ingested_at",
        ],
        where: { tenant_key: brokerTenantKey },
        orderBy: { column: "family_number", direction: "asc" },
      }),
      azureRead.select<AuditLogRow>({
        table: "data_inventory_audit_log",
        columns: [
          "action",
          "actor_id",
          "actor_role",
          "segment_id",
          "source_doc",
          "created_at",
        ],
        where: { tenant_key: brokerTenantKey },
        orderBy: { column: "created_at", direction: "desc" },
        limit: ACTIVITY_LIMIT,
      }),
      azureRead.select<IngestionRunRow>({
        table: "data_ingestion_runs",
        columns: [
          "source_label",
          "records_loaded",
          "chunks_loaded",
          "nodes_loaded",
          "edges_loaded",
          "status",
          "started_at",
          "completed_at",
        ],
        where: { tenant_key: brokerTenantKey },
        orderBy: { column: "started_at", direction: "desc" },
        limit: 1,
      }),
    ]);
  } catch {
    return null;
  }

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
    lastReviewedAt: toIsoString(row.last_reviewed_at),
    lastIngestedAt: toIsoString(row.last_ingested_at),
  }));

  const totalRecords = segments.reduce((acc, s) => acc + s.recordCount, 0);

  const recentActivity: InventoryActivityEvent[] = auditRows.map((row) => ({
    actor: describeActor(row),
    what: describeAuditEvent(row),
    timestampIso: toIsoString(row.created_at) ?? new Date(0).toISOString(),
  }));

  const lastIngestRow = ingestRows[0] ?? null;
  const totalChunks = lastIngestRow ? toNumber(lastIngestRow.chunks_loaded) : 0;
  const totalNodes = lastIngestRow ? toNumber(lastIngestRow.nodes_loaded) : 0;
  const totalEdges = lastIngestRow ? toNumber(lastIngestRow.edges_loaded) : 0;
  const lastIngestedAt = toIsoString(
    lastIngestRow?.completed_at ?? lastIngestRow?.started_at,
  );

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
  record_payload?: Record<string, unknown> | null;
  source_doc: string;
  data_classification: string;
  freshness_state: string;
  confidence: number | string | null;
  last_reviewed: string | Date | null;
  uploaded_by: string;
  uploaded_at: string | Date;
}

function stringField(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isGenericRecordTitle(title: string, segmentKey: string): boolean {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return true;
  if (
    segmentKey === "kpi_dictionary" &&
    /^kpi dictionary \d+$/.test(normalized)
  )
    return true;
  return false;
}

function deriveRecordTitle(row: RecordRow, segmentKey: string): string {
  if (!isGenericRecordTitle(row.title, segmentKey)) return row.title;
  const payload = row.record_payload;
  const candidate =
    stringField(payload, "title") ??
    stringField(payload, "kpi_name") ??
    stringField(payload, "metric_name") ??
    stringField(payload, "name") ??
    stringField(payload, "claim");
  if (!candidate) return row.title;

  const currentValue = stringField(payload, "current_value");
  return currentValue ? `${candidate} · ${currentValue}` : candidate;
}

export interface SegmentRecordPage {
  segmentKey: string;
  rollup: InventorySegmentRollup | null;
  records: SegmentRecordSummary[];
}

const SEGMENT_RECORD_LIMIT = 200;

/** Inventory segments that hold the tenant's application/systems estate. */
const APP_INVENTORY_SEGMENTS = ["it_landscape", "application_portfolio"] as const;

/**
 * One application/system row shaped for Source d04 pre-population. Unlike
 * SegmentRecordSummary this preserves the structured payload fields
 * (tier/owner/vendor/criticality) that the d04 table needs.
 */
export interface AppInventoryRecord {
  recordId: string;
  name: string;
  recordKind: string;
  tier: string | null;
  owner: string | null;
  vendor: string | null;
  criticality: string | null;
  notes: string | null;
  sourceDoc: string | null;
}

/**
 * List the tenant's application/systems inventory across the app-inventory
 * segments, preserving the payload fields getSegmentRecordPage drops. This is
 * the sanctioned broker seam: app-tier callers (e.g. Source generation) import
 * this instead of touching data_inventory_records or the tenant-data adapter
 * directly. Returns [] when nothing is loaded, so callers fall back to the
 * blank d04 stub rather than erroring.
 *
 * `brokerTenantKey` must already be the substrate key (dashed form) — translate
 * an app client key with clientKeyToInventorySubstrateKey before calling.
 */
export async function listAppInventoryRecords(
  brokerTenantKey: string,
): Promise<AppInventoryRecord[]> {
  const results = await Promise.allSettled(
    APP_INVENTORY_SEGMENTS.map((segmentId) =>
      azureRead.select<RecordRow>({
        table: "data_inventory_records",
        columns: [
          "record_id",
          "title",
          "record_kind",
          "record_payload",
          "source_doc",
        ],
        where: { tenant_key: brokerTenantKey, segment_id: segmentId },
        orderBy: { column: "uploaded_at", direction: "desc" },
        limit: SEGMENT_RECORD_LIMIT,
      }),
    ),
  );

  const out: AppInventoryRecord[] = [];
  const seen = new Set<string>();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const segmentId = APP_INVENTORY_SEGMENTS[index];
    for (const row of result.value) {
      if (seen.has(row.record_id)) continue;
      seen.add(row.record_id);
      const payload = row.record_payload ?? null;
      out.push({
        recordId: row.record_id,
        name: deriveRecordTitle(row, segmentId),
        recordKind: row.record_kind,
        tier:
          stringField(payload, "tier") ??
          stringField(payload, "app_tier") ??
          stringField(payload, "criticality_tier"),
        owner:
          stringField(payload, "owner") ??
          stringField(payload, "business_owner") ??
          stringField(payload, "it_owner"),
        vendor: stringField(payload, "vendor") ?? stringField(payload, "supplier"),
        criticality:
          stringField(payload, "criticality") ??
          stringField(payload, "business_criticality"),
        notes: stringField(payload, "notes") ?? stringField(payload, "description"),
        sourceDoc: row.source_doc ?? null,
      });
    }
  });
  return out;
}

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
  const [rollupResult, recordsResult] = await Promise.allSettled([
    azureRead.maybeSingle<SegmentRollupRow>({
      table: "data_inventory_segments",
      columns: [
        "segment_id",
        "segment_name",
        "family_number",
        "record_count",
        "coverage_score",
        "stale_count",
        "missing_count",
        "health_state",
        "last_reviewed_at",
        "last_ingested_at",
      ],
      where: { tenant_key: brokerTenantKey, segment_id: segmentKey },
    }),
    azureRead.select<RecordRow>({
      table: "data_inventory_records",
      columns: [
        "record_id",
        "title",
        "record_kind",
        "record_payload",
        "source_doc",
        "data_classification",
        "freshness_state",
        "confidence",
        "last_reviewed",
        "uploaded_by",
        "uploaded_at",
      ],
      where: { tenant_key: brokerTenantKey, segment_id: segmentKey },
      orderBy: { column: "uploaded_at", direction: "desc" },
      limit: SEGMENT_RECORD_LIMIT,
    }),
  ]);

  if (rollupResult.status === "rejected" && recordsResult.status === "rejected")
    return null;

  const rollupRow =
    rollupResult.status === "fulfilled" ? rollupResult.value : null;
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
        lastReviewedAt: toIsoString(rollupRow.last_reviewed_at),
        lastIngestedAt: toIsoString(rollupRow.last_ingested_at),
      }
    : null;

  const recordRows =
    recordsResult.status === "fulfilled" ? recordsResult.value : [];
  const records: SegmentRecordSummary[] = recordRows.map((row) => ({
    recordId: row.record_id,
    title: deriveRecordTitle(row, segmentKey),
    recordKind: row.record_kind,
    sourceDoc: row.source_doc,
    dataClassification: row.data_classification,
    freshnessState: row.freshness_state,
    confidence:
      row.confidence === null
        ? null
        : typeof row.confidence === "number"
          ? row.confidence
          : Number(row.confidence) || null,
    lastReviewed: toIsoString(row.last_reviewed),
    uploadedBy: row.uploaded_by,
    uploadedAt: toIsoString(row.uploaded_at) ?? new Date(0).toISOString(),
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

export type SignalSeverityBucket =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "unknown";

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
  if (!raw) return "unknown";
  const normalized = raw.trim().toLowerCase();
  if (normalized.startsWith("critical")) return "critical";
  if (normalized.startsWith("high")) return "high";
  if (normalized.startsWith("medium")) return "medium";
  if (normalized.startsWith("low")) return "low";
  return "unknown";
}

function isBoilerplateSignalText(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return true;
  return (
    normalized.includes("this signal is generated from shared people") ||
    normalized.includes("intentionally graph-ready") ||
    normalized.includes("should resolve back to named source records")
  );
}

function humanizeSignalType(signalType: string): string {
  return signalType.replace(/_/g, " ").trim() || "cross-program signal";
}

function deriveSignalDescription(args: {
  title: string;
  signalType: string;
  severityBucket: SignalSeverityBucket;
  programs: string[];
}): string {
  const programText =
    args.programs.length > 0
      ? ` It touches ${args.programs.join(", ")}.`
      : " No linked program list was provided in the substrate payload.";
  const severityText =
    args.severityBucket === "unknown"
      ? "unclassified severity"
      : `${args.severityBucket} severity`;
  return `${args.title} is a ${severityText} ${humanizeSignalType(args.signalType)} surfaced by Atlas.${programText}`;
}

function deriveSignalRecommendation(args: {
  signalType: string;
  severityBucket: SignalSeverityBucket;
  programs: string[];
}): string {
  const ownerAction =
    args.severityBucket === "critical"
      ? "Escalate to the sponsor group before the next gate."
      : args.severityBucket === "high"
        ? "Put this on the next sponsor decision agenda."
        : "Track this in the portfolio review and refresh evidence before the next phase change.";
  const programText =
    args.programs.length > 0
      ? ` Anchor the discussion on ${args.programs.join(", ")}.`
      : " Ask Atlas to resolve the linked programs before assigning an owner.";
  return `${ownerAction}${programText} Treat it as ${humanizeSignalType(args.signalType)}, not a generic portfolio note.`;
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
  let rows: SignalRow[];
  try {
    rows = await azureRead.select<SignalRow>({
      table: "data_inventory_records",
      columns: ["record_id", "title", "record_payload"],
      where: {
        tenant_key: brokerTenantKey,
        segment_id: "cross_program_signals",
      },
      orderBy: { column: "record_id", direction: "asc" },
    });
  } catch {
    return [];
  }
  const signals: CrossProgramSignal[] = rows.map((row) => {
    const payload = row.record_payload ?? {};
    const severityRaw = payload.severity ?? "";
    const severityBucket = bucketSeverity(severityRaw);
    const signalType = payload.type ?? "unknown";
    const programs = Array.isArray(payload.programs) ? payload.programs : [];
    const fallbackArgs = {
      title: row.title,
      signalType,
      severityBucket,
      programs,
    };
    return {
      recordId: row.record_id,
      signalId: payload.id ?? row.record_id,
      title: row.title,
      signalType,
      severityRaw,
      severityBucket,
      description: isBoilerplateSignalText(payload.description)
        ? deriveSignalDescription(fallbackArgs)
        : (payload.description ?? ""),
      recommendation: isBoilerplateSignalText(payload.recommendation)
        ? deriveSignalRecommendation(fallbackArgs)
        : (payload.recommendation ?? ""),
      status: payload.status ?? "",
      programs,
      raisedBy: payload.raised_by ?? "",
      raisedDate: payload.raised_date ?? null,
    };
  });

  return signals.sort((a, b) => {
    const rankDiff =
      SEVERITY_RANK[a.severityBucket] - SEVERITY_RANK[b.severityBucket];
    if (rankDiff !== 0) return rankDiff;
    if (a.raisedDate && b.raisedDate) {
      return b.raisedDate.localeCompare(a.raisedDate);
    }
    return 0;
  });
}

// ── Context chunk stats per segment ─────────────────────────────────────────

export interface SegmentChunkStat {
  segmentId: string;
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  failedChunks: number;
}

/**
 * Return per-segment chunk counts from enterprise_context_chunks.
 * Shows how many text chunks have been indexed and how many have
 * embeddings. Returns [] when the table is unreachable — the
 * data landscape table renders 0s as "–" in that case.
 */
export async function getContextChunkStats(
  tenantKey: string,
): Promise<SegmentChunkStat[]> {
  let rows: { source_segment_id: string; embedding_status: string }[];
  try {
    rows = await azureRead.select<{
      source_segment_id: string;
      embedding_status: string;
    }>({
      table: "enterprise_context_chunks",
      columns: ["source_segment_id", "embedding_status"],
      where: { tenant_key: tenantKey },
    });
  } catch {
    return [];
  }

  const map = new Map<string, SegmentChunkStat>();
  for (const row of rows) {
    const seg = row.source_segment_id ?? "unknown";
    if (!map.has(seg)) {
      map.set(seg, {
        segmentId: seg,
        totalChunks: 0,
        embeddedChunks: 0,
        pendingChunks: 0,
        failedChunks: 0,
      });
    }
    const stat = map.get(seg)!;
    stat.totalChunks++;
    if (row.embedding_status === "embedded") stat.embeddedChunks++;
    else if (row.embedding_status === "failed") stat.failedChunks++;
    else stat.pendingChunks++;
  }

  return Array.from(map.values());
}
