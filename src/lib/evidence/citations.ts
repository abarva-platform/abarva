import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import type { EvidenceLedgerRow, EvidenceSourceType } from "./ledger";

export interface ResolvedCitation {
  ledgerId: string;
  humanText: string;
  deepLink: string;
  sourceQuote: string | null;
  freshness: string;
  confidenceLabel: "high" | "medium" | "low" | "insufficient";
  sourceType: EvidenceSourceType;
}

export async function resolveCitation(
  ledgerId: string,
): Promise<ResolvedCitation> {
  const row = await azureRead
    .maybeSingle<EvidenceLedgerRow>({
      table: "evidence_ledger",
      columns: "*",
      where: { id: ledgerId },
    })
    .catch((error) => {
      throw new Error(
        `evidence_ledger citation lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  if (!row)
    throw new Error(
      `evidence_ledger citation lookup failed: not_found ${ledgerId}`,
    );
  return resolveCitationRow(row);
}

export function resolveCitationRow(row: EvidenceLedgerRow): ResolvedCitation {
  const freshness = toIsoString(row.freshness_at);
  return {
    ledgerId: row.id,
    humanText: humanCitationText(row),
    deepLink: evidenceDeepLink(row),
    sourceQuote: row.source_quote,
    freshness,
    confidenceLabel: confidenceLabel(row),
    sourceType: row.source_type,
  };
}

export function confidenceLabel(
  row: Pick<EvidenceLedgerRow, "confidence" | "not_enough_data_flag">,
): ResolvedCitation["confidenceLabel"] {
  if (row.not_enough_data_flag) return "insufficient";
  if (row.confidence >= 0.85) return "high";
  if (row.confidence >= 0.6) return "medium";
  return "low";
}

function humanCitationText(row: EvidenceLedgerRow): string {
  const ref = row.source_ref ?? {};
  if (row.source_type === "tenant_record") {
    const table = readRef(ref, "table") ?? "tenant_record";
    const rowId =
      readRef(ref, "row_id") ?? readRef(ref, "id") ?? row.artifact_ref;
    const field = readRef(ref, "field");
    const value = readRef(ref, "value");
    const owner = row.owner_role ? `, owner ${row.owner_role}` : "";
    const valueText = value ? ` = ${value}` : "";
    return `${table}[${rowId}]${field ? `.${field}` : ""}${valueText} (${row.confidence_basis}${owner}, refreshed ${dateOnly(row.freshness_at)})`;
  }

  if (row.source_type === "corpus_pattern") {
    const patternId =
      readRef(ref, "corpus_pattern_id") ??
      readRef(ref, "pattern_id") ??
      "pattern";
    const chunkId = readRef(ref, "chunk_id");
    return `Pattern ${patternId}${chunkId ? `, evidence chunk ${chunkId}` : ""}, refreshed ${dateOnly(row.freshness_at)}`;
  }

  if (row.source_type === "document_extract") {
    const documentId = readRef(ref, "document_id") ?? "document";
    const page = readRef(ref, "page");
    const pageText = page ? ` p.${page}` : "";
    return `${documentId}${pageText}: ${row.source_quote ?? "document extract"} (confidence ${Math.round(row.confidence * 100)}%)`;
  }

  if (row.source_type === "workshop_output") {
    const workshopId = readRef(ref, "workshop_id") ?? "workshop";
    return `Workshop output ${workshopId}: ${row.confidence_basis}, refreshed ${dateOnly(row.freshness_at)}`;
  }

  if (row.source_type === "live_telemetry") {
    const metric =
      readRef(ref, "metric") ?? readRef(ref, "field") ?? "telemetry";
    return `Live telemetry ${metric}: ${row.confidence_basis}, refreshed ${dateOnly(row.freshness_at)}`;
  }

  if (row.source_type === "derived") {
    const formula = readRef(ref, "formula") ?? "derived calculation";
    return `${formula}: ${row.confidence_basis}`;
  }

  return row.not_enough_data_reason
    ? `Sentinel inferred; no tenant data to ground: ${row.not_enough_data_reason}`
    : "Sentinel inferred; no tenant data to ground";
}

function evidenceDeepLink(row: EvidenceLedgerRow): string {
  const params = new URLSearchParams({
    surface: row.surface,
    artifact_ref: row.artifact_ref,
    ledger_id: row.id,
  });
  return `/evidence-ledger?${params.toString()}`;
}

function readRef(ref: Record<string, unknown>, key: string): string | null {
  const value = ref[key];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return null;
}

function dateOnly(value: string): string {
  return toIsoString(value).slice(0, 10);
}

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : value;
}
