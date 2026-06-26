import type { SearchDocument } from "./types";

export type EnterpriseContextChunkRow = {
  readonly client_id: string | null;
  readonly tenant_key: string;
  readonly chunk_id: string;
  readonly source_segment_id: string | null;
  readonly source_record_id: string | null;
  readonly source_doc: string | null;
  readonly source_path: string | null;
  readonly chunk_index: number | null;
  readonly chunk_text: string;
  readonly lifecycle_state: string | null;
  readonly embedded_at: string | null;
  readonly provenance: Record<string, unknown> | null;
  readonly chunk_metadata: Record<string, unknown> | null;
  readonly agent_readiness_status?: string | null;
  readonly source_file_id?: string | null;
  readonly source_row_number?: number | null;
};

const TENANT_KEY_ALIASES: Record<string, string> = {
  "apex-retail-group": "apex-retail",
  apexretail: "apex-retail",
  arcturus: "first-capital",
  firstcapital: "first-capital",
  "first-capital-bank": "first-capital",
  lakeshore: "lakeshore-holdings",
  "lakeshore-holding": "lakeshore-holdings",
  "lakeshore-industries": "lakeshore-holdings",
  morganstreet: "lakeshore-holdings",
  "morganstreet-other": "lakeshore-holdings",
  "morgan-street": "lakeshore-holdings",
  "morgan-street-holdings": "lakeshore-holdings",
  "mona-street": "lakeshore-holdings",
  meridian: "meridian-health",
  "meridian-healthcare": "meridian-health",
  northstar: "northstar-clinical",
  skyharbor: "skyharbor-air",
  "skyharbor-airlines": "skyharbor-air",
};

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function confidenceLevel(value: number): string {
  if (value >= 0.85) return "high";
  if (value >= 0.6) return "medium";
  return "low";
}

function truncateUtf8(value: string, maxBytes: number): string {
  let bytes = 0;
  let output = "";
  for (const char of value) {
    const charBytes = Buffer.byteLength(char, "utf8");
    if (bytes + charBytes > maxBytes) break;
    output += char;
    bytes += charBytes;
  }
  return output;
}

function safeSearchBody(value: string): string {
  return truncateUtf8(value, 30_000);
}

export function tenantContextSearchId(
  tenantKey: string,
  chunkId: string,
): string {
  return Buffer.from(`${tenantKey}:${chunkId}`, "utf-8").toString("base64url");
}

export function canonicalTenantKey(tenantKey: string): string {
  const normalized = tenantKey.trim().toLowerCase().replace(/_/g, "-");
  return TENANT_KEY_ALIASES[normalized] ?? normalized;
}

export function toTenantContextDeleteDocument(
  tenantKey: string,
  chunkId: string,
): SearchDocument {
  return {
    "@search.action": "delete",
    id: tenantContextSearchId(tenantKey, chunkId),
  };
}

export function toTenantContextSearchDocument(
  row: EnterpriseContextChunkRow,
  now = new Date(),
): SearchDocument {
  const tenantKey = canonicalTenantKey(row.tenant_key);
  const metadata = row.chunk_metadata ?? {};
  const provenance = row.provenance ?? {};
  const sourceSegment = safeString(row.source_segment_id, "unknown");
  const sourceDoc = safeString(row.source_doc, sourceSegment);
  const sourcePath = safeString(row.source_path, sourceDoc);
  const confidence = safeNumber(
    metadata.confidence ?? provenance.confidence,
    0.8,
  );
  const sensitivity = safeString(
    metadata.classification ??
      metadata.sensitivity ??
      provenance.classification ??
      provenance.data_classification,
    "internal",
  );
  const sourceBasis = safeString(
    metadata.source_basis ?? provenance.source_basis ?? provenance.loader,
    "enterprise_context_chunks",
  );
  const lifecycleState = safeString(
    row.lifecycle_state ??
      metadata.lifecycle_state ??
      provenance.lifecycle_state,
    "active",
  );
  const sourceCitation = safeString(
    metadata.source_citation ?? provenance.source_citation ?? sourcePath,
    sourcePath,
  );

  return {
    "@search.action": "upload",
    id: tenantContextSearchId(tenantKey, row.chunk_id),
    tenant_key: tenantKey,
    client_id:
      row.client_id ??
      safeString(metadata.client_id ?? provenance.client_id, ""),
    client_key: tenantKey,
    source_segment: sourceSegment,
    record_id: safeString(row.source_record_id, row.chunk_id),
    chunk_id: row.chunk_id,
    title: sourceDoc,
    body: safeSearchBody(row.chunk_text),
    source_uri: sourcePath,
    source_basis: sourceBasis,
    source_citation: sourceCitation,
    confidence,
    confidence_level: confidenceLevel(confidence),
    sensitivity,
    classification: sensitivity,
    lifecycle_state: lifecycleState,
    agent_readiness_status: safeString(
      row.agent_readiness_status ?? metadata.agent_readiness_status,
      "not_reviewed",
    ),
    source_file_id:
      row.source_file_id ??
      safeString(metadata.source_file_id ?? provenance.source_file_id, ""),
    source_row_number:
      typeof row.source_row_number === "number"
        ? row.source_row_number
        : safeNumber(metadata.source_row_number ?? provenance.source_row, 0),
    last_seen_at: row.embedded_at ?? now.toISOString(),
  };
}
