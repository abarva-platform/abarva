import crypto from "node:crypto";

import type { PostgresCompatClient } from "@/lib/data-plane/postgresCompat";

export interface GraphLoadResult {
  edgesWritten: number;
  edgesByType: Record<string, number>;
  fkResolutionErrors: number;
}

interface RawGraphEdge {
  relationship_key?: string;
  relationship_type?: string;
  from_record_key?: string;
  to_record_key?: string;
  edge_id?: string;
  type?: string;
  relationship?: string;
  from?: string;
  to?: string;
  domain?: string;
  confidence?: number | string;
  evidence?: string;
  source_system?: string;
  source_file?: string;
  properties?: unknown;
}

interface NormalizedGraphEdge {
  relationship_key: string;
  relationship_type: string;
  from_record_key: string;
  to_record_key: string;
  source_system?: string;
  source_file?: string;
  properties: Record<string, unknown>;
}

const PAYLOAD_ID_FIELDS = [
  "app_id",
  "capability_id",
  "initiative_id",
  "kpi_id",
  "tool_id",
  "model_id",
  "control_id",
  "vendor_id",
  "contract_id",
  "function_id",
  "persona_id",
  "team_id",
  "resource_id",
  "platform_id",
  "data_product_id",
  "edge_id",
  "record_id",
  "workflow_id",
  "agent_id",
  "risk_id",
  "gate_id",
  "milestone_id",
  "budget_line_id",
];

function parseProperties(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { raw: value };
    } catch {
      return { raw: value };
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

function stableUuid(parts: string[]): string {
  const hex = crypto
    .createHash("sha256")
    .update(parts.join("\u0000"))
    .digest("hex");
  const version = `5${hex.slice(13, 16)}`;
  const variant = (Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80;
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    version,
    variant.toString(16).padStart(2, "0") + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join("-");
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeGraphEdge(edge: RawGraphEdge): NormalizedGraphEdge {
  const relationshipKey = stringValue(edge.relationship_key) ?? stringValue(edge.edge_id);
  const relationshipType =
    stringValue(edge.relationship_type) ??
    stringValue(edge.relationship) ??
    stringValue(edge.type);
  const fromRecordKey = stringValue(edge.from_record_key) ?? stringValue(edge.from);
  const toRecordKey = stringValue(edge.to_record_key) ?? stringValue(edge.to);

  if (!relationshipKey || !relationshipType || !fromRecordKey || !toRecordKey) {
    return {
      relationship_key: relationshipKey ?? "",
      relationship_type: relationshipType ?? "",
      from_record_key: fromRecordKey ?? "",
      to_record_key: toRecordKey ?? "",
      source_system: edge.source_system,
      source_file: edge.source_file,
      properties: parseProperties(edge.properties),
    };
  }

  return {
    relationship_key: relationshipKey,
    relationship_type: relationshipType,
    from_record_key: fromRecordKey,
    to_record_key: toRecordKey,
    source_system: edge.source_system,
    source_file: edge.source_file,
    properties: {
      ...parseProperties(edge.properties),
      ...(edge.domain === undefined ? {} : { domain: edge.domain }),
      ...(edge.confidence === undefined ? {} : { confidence: edge.confidence }),
      ...(edge.evidence === undefined ? {} : { evidence: edge.evidence }),
    },
  };
}

async function buildRecordLookup(
  db: PostgresCompatClient,
  tenantKey: string,
): Promise<Map<string, string>> {
  const result = await db
    .from("enterprise_context_records")
    .select("id,canonical_record_id,source_record_id,payload")
    .eq("tenant_key", tenantKey)
    .eq("lifecycle_state", "active")
    .limit(50000);
  if (result.error) {
    throw new Error(
      `jsonl_graph_record_lookup_failed: ${result.error.message}`,
    );
  }
  const rows = (result.data ?? []) as Array<{
    id: string;
    canonical_record_id?: string | null;
    source_record_id?: string | null;
    payload?: Record<string, unknown> | null;
  }>;
  const lookup = new Map<string, string>();
  for (const row of rows) {
    if (row.canonical_record_id) lookup.set(row.canonical_record_id, row.id);
    if (row.source_record_id) {
      lookup.set(row.source_record_id, row.id);
      const parts = row.source_record_id.split(":");
      const last = parts[parts.length - 1];
      if (last) lookup.set(last, row.id);
    }
    for (const field of PAYLOAD_ID_FIELDS) {
      const value = row.payload?.[field];
      if (typeof value === "string" && value.trim()) {
        lookup.set(value.trim(), row.id);
      }
    }
  }
  return lookup;
}

export async function loadJsonlGraphEdges(input: {
  jsonlText: string;
  tenantKey: string;
  db: PostgresCompatClient;
}): Promise<GraphLoadResult> {
  const lookup = await buildRecordLookup(input.db, input.tenantKey);
  const edgesByType: Record<string, number> = {};
  let edgesWritten = 0;
  let fkResolutionErrors = 0;

  const rows = input.jsonlText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeGraphEdge(JSON.parse(line) as RawGraphEdge));

  for (let index = 0; index < rows.length; index++) {
    const edge = rows[index]!;
    if (
      !edge.relationship_key ||
      !edge.relationship_type ||
      !edge.from_record_key ||
      !edge.to_record_key
    ) {
      fkResolutionErrors++;
      console.warn("[jsonl-graph-loader] skipped malformed edge", {
        tenantKey: input.tenantKey,
        relationshipKey: edge.relationship_key,
        fromRecordKey: edge.from_record_key,
        toRecordKey: edge.to_record_key,
      });
      continue;
    }
    const fromRecordId = lookup.get(edge.from_record_key);
    const toRecordId = lookup.get(edge.to_record_key);
    if (!fromRecordId || !toRecordId) {
      fkResolutionErrors++;
      console.warn("[jsonl-graph-loader] skipped unresolved edge", {
        tenantKey: input.tenantKey,
        relationshipKey: edge.relationship_key,
        fromRecordKey: edge.from_record_key,
        toRecordKey: edge.to_record_key,
      });
      continue;
    }

    const result = await input.db
      .from("enterprise_context_relationships")
      .upsert(
        {
          id: stableUuid([
            "enterprise_context_relationships",
            input.tenantKey,
            edge.relationship_key,
          ]),
          tenant_key: input.tenantKey,
          relationship_key: edge.relationship_key,
          relationship_type: edge.relationship_type,
          from_record_id: fromRecordId,
          to_record_id: toRecordId,
          from_external_id: edge.from_record_key,
          to_external_id: edge.to_record_key,
          source_system: edge.source_system ?? "context_relationship_graph",
          source_record_id: edge.relationship_key,
          source_file: edge.source_file ?? "context-relationships.jsonl",
          source_sheet: null,
          source_row_number: index + 1,
          lifecycle_state: "active",
          properties: edge.properties,
        },
        { onConflict: "tenant_key,relationship_key" },
      )
      .select("id");
    if (result.error) {
      throw new Error(
        `jsonl_graph_edge_upsert_failed: ${result.error.message}`,
      );
    }
    edgesWritten += Array.isArray(result.data) ? result.data.length : 1;
    edgesByType[edge.relationship_type] =
      (edgesByType[edge.relationship_type] ?? 0) + 1;
  }

  return { edgesWritten, edgesByType, fkResolutionErrors };
}
