import { createHash } from "node:crypto";
import type { buildEnterpriseSignalPacket } from "../../../../scripts/data-build/enterprise-signal-packet";

export type HomeNarrativeSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;
export type HomeVerifiedSourceRefs = Map<string, Map<string, Set<string>>>;

export interface HomeNarrativeBasisRow {
  id?: string | null;
  snapshot_id?: string | null;
  projection_manifest_id?: string | null;
  projection_version?: number | null;
  page_key: string;
  row_key: string;
  row_type: string;
  section_key?: string | null;
  title: string;
  summary: string | null;
  projection_entry_id?: string | null;
  source_hash?: string | null;
  source_refs_json?: unknown;
  primary_object_id?: string | null;
  metric_keys_json?: unknown;
  relationship_ids_json?: unknown;
  basis_summary?: string | null;
  value_state?: string | null;
  quality_state?: string | null;
  admission_status?: string | null;
  admission_gate_key?: string | null;
  admission_result_json?: unknown;
  gap_flags_json?: unknown;
  display_payload_json?: unknown;
}

export interface HomeNarrativePacketArtifact {
  contractVersion: "home-narrative-packet/v1";
  tenantKey: string;
  assessmentId: string;
  factualRowsHash: string;
  sourceLineageHash: string;
  packetHash: string;
  packet: HomeNarrativeSignalPacket;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

export function hashHomeNarrativeValue(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function homeNarrativeFactualRows(rows: readonly HomeNarrativeBasisRow[]): HomeNarrativeBasisRow[] {
  return rows.filter((row) => !["summary", "chapter_claim", "story_plan"].includes(row.row_type));
}

function sourceRefIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => {
    if (typeof item === "string") return item.trim();
    if (!item || typeof item !== "object" || Array.isArray(item)) return "";
    const ref = item as Record<string, unknown>;
    const id = ref.source_record_id ?? ref.sourceRecordId ?? ref.record_id;
    return typeof id === "string" ? id.trim() : "";
  }).filter(Boolean))];
}

export function admittedHomeSourceRefs(
  row: HomeNarrativeBasisRow,
  verifiedSourceRefs: HomeVerifiedSourceRefs,
): string[] {
  if (!(["admitted", "not_applicable"].includes(row.admission_status ?? "") && row.source_hash)) return [];
  const linked = verifiedSourceRefs.get(row.projection_entry_id ?? "")?.get(row.source_hash);
  if (!linked) return [];
  return sourceRefIds(row.source_refs_json).filter((id) => linked.has(id));
}

function displayPayload(row: HomeNarrativeBasisRow): unknown {
  const value = row.display_payload_json;
  if (!value || typeof value !== "object" || Array.isArray(value)) return value ?? null;
  const outer = value as Record<string, unknown>;
  return outer.page_key === row.page_key && outer.row_key === row.row_key &&
    outer.display_payload_json && typeof outer.display_payload_json === "object"
    ? outer.display_payload_json
    : value;
}

function basisField(row: HomeNarrativeBasisRow, key: keyof HomeNarrativeBasisRow): unknown {
  const direct = row[key];
  if (direct !== undefined) return direct;
  const wrapper = row.display_payload_json;
  return wrapper && typeof wrapper === "object" && !Array.isArray(wrapper)
    ? (wrapper as Record<string, unknown>)[key] ?? null
    : null;
}

export function homeNarrativeFactualRowsHash(rows: readonly HomeNarrativeBasisRow[]): string {
  return hashHomeNarrativeValue(
    homeNarrativeFactualRows(rows)
      .map((row) => ({
        pageKey: row.page_key,
        rowKey: row.row_key,
        rowType: row.row_type,
        id: basisField(row, "id"),
        snapshotId: basisField(row, "snapshot_id"),
        projectionManifestId: basisField(row, "projection_manifest_id"),
        projectionVersion: basisField(row, "projection_version"),
        sectionKey: basisField(row, "section_key"),
        title: row.title,
        summary: row.summary,
        projectionEntryId: row.projection_entry_id ?? null,
        sourceHash: row.source_hash ?? null,
        sourceRefs: sourceRefIds(row.source_refs_json).sort(),
        primaryObjectId: row.primary_object_id ?? null,
        metricKeys: basisField(row, "metric_keys_json"),
        relationshipIds: basisField(row, "relationship_ids_json"),
        basisSummary: basisField(row, "basis_summary"),
        valueState: basisField(row, "value_state"),
        qualityState: basisField(row, "quality_state"),
        admissionStatus: row.admission_status ?? null,
        admissionGateKey: basisField(row, "admission_gate_key"),
        admissionResult: basisField(row, "admission_result_json"),
        gapFlags: basisField(row, "gap_flags_json"),
        displayPayload: displayPayload(row),
      }))
      .sort((a, b) => `${a.pageKey}:${a.rowKey}:${a.rowType}`.localeCompare(`${b.pageKey}:${b.rowKey}:${b.rowType}`)),
  );
}

export function homeNarrativeSourceLineageHash(
  rows: readonly HomeNarrativeBasisRow[],
  verifiedSourceRefs: HomeVerifiedSourceRefs,
): string {
  return hashHomeNarrativeValue(
    homeNarrativeFactualRows(rows)
      .map((row) => ({
        pageKey: row.page_key,
        rowKey: row.row_key,
        sourceHash: row.source_hash ?? null,
        sourceRefs: admittedHomeSourceRefs(row, verifiedSourceRefs).sort(),
      }))
      .sort((a, b) => `${a.pageKey}:${a.rowKey}`.localeCompare(`${b.pageKey}:${b.rowKey}`)),
  );
}

export function createHomeNarrativePacketArtifact(args: {
  tenantKey: string;
  assessmentId: string;
  rows: readonly HomeNarrativeBasisRow[];
  verifiedSourceRefs: HomeVerifiedSourceRefs;
  packet: HomeNarrativeSignalPacket;
}): HomeNarrativePacketArtifact {
  return {
    contractVersion: "home-narrative-packet/v1",
    tenantKey: args.tenantKey,
    assessmentId: args.assessmentId,
    factualRowsHash: homeNarrativeFactualRowsHash(args.rows),
    sourceLineageHash: homeNarrativeSourceLineageHash(args.rows, args.verifiedSourceRefs),
    packetHash: hashHomeNarrativeValue(args.packet),
    packet: args.packet,
  };
}

function isPacket(value: unknown): value is HomeNarrativeSignalPacket {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const packet = value as Record<string, unknown>;
  return Array.isArray(packet.signals) && Array.isArray(packet.contextItems) &&
    Array.isArray(packet.sourceSummaries) && Array.isArray(packet.pagePromptContracts) &&
    Boolean(packet.enterpriseIdentity && typeof packet.enterpriseIdentity === "object") &&
    Boolean(packet.visualDatasets && typeof packet.visualDatasets === "object") &&
    Boolean(packet.coverageManifest && typeof packet.coverageManifest === "object") &&
    packet.signals.every((signal: unknown) => Boolean(signal && typeof signal === "object" &&
      typeof (signal as Record<string, unknown>).id === "string" &&
      Array.isArray((signal as Record<string, unknown>).evidenceRefs))) &&
    packet.contextItems.every((item: unknown) => Boolean(item && typeof item === "object" &&
      typeof (item as Record<string, unknown>).id === "string" &&
      typeof (item as Record<string, unknown>).statement === "string"));
}

export function verifiedHomeNarrativePacketArtifact(
  value: unknown,
  args: {
    tenantKey: string;
    assessmentId: string;
    rows: readonly HomeNarrativeBasisRow[];
    verifiedSourceRefs: HomeVerifiedSourceRefs;
  },
): HomeNarrativePacketArtifact | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const artifact = value as Record<string, unknown>;
  if (artifact.contractVersion !== "home-narrative-packet/v1" ||
      artifact.tenantKey !== args.tenantKey || artifact.assessmentId !== args.assessmentId ||
      artifact.factualRowsHash !== homeNarrativeFactualRowsHash(args.rows) ||
      artifact.sourceLineageHash !== homeNarrativeSourceLineageHash(args.rows, args.verifiedSourceRefs) ||
      !isPacket(artifact.packet) || artifact.packetHash !== hashHomeNarrativeValue(artifact.packet)) return null;
  return artifact as unknown as HomeNarrativePacketArtifact;
}
