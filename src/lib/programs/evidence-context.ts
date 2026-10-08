import "server-only";

import { canReadProgram } from "@/lib/auth/program-access-policy";
import { azureRead } from "@/lib/data-plane/azureRead";
import type { TenancyCtx } from "./types.db";
import {
  reviewedExtractionFromStoredSourceRef,
  toStoredReviewedStructured,
} from "./evidence-review-contract";
import { moveEvidenceReadTenantKeys } from "./evidence-readiness/tenant-read-scope";

export interface ProgramEvidenceCitation {
  quote: string;
  locator: string;
}

export interface ProgramEvidencePromptItem {
  id: string;
  title: string;
  evidenceType: string;
  phase: number | null;
  summary: string | null;
  parseMethod: string | null;
  structuredSignals: string[];
  extractedText: string | null;
  createdAt: string;
  approvedAt: string | null;
  /** From the flexible envelope — the file's own observations, not forced into a fixed taxonomy. */
  observations: string[];
  assumptions: string[];
  openQuestions: string[];
  citations: ProgramEvidenceCitation[];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readParseMethod(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  return asString((value as { parse_method?: unknown }).parse_method);
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item): item is string => item !== null)
    .slice(0, 12);
}

function readStructuredSignals(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const structured = value as Record<string, unknown>;
  const candidates = [
    ...readStringList(structured.baseline_candidates),
    ...readStringList(structured.decisions),
    ...readStringList(structured.action_items),
    ...readStringList(structured.risks),
  ];
  const seen = new Set<string>();
  return candidates
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}

function readFlexibleField(value: unknown, field: string): string[] {
  if (!value || typeof value !== "object") return [];
  const flexible = (value as Record<string, unknown>).flexible;
  if (!flexible || typeof flexible !== "object") return [];
  return readStringList((flexible as Record<string, unknown>)[field]);
}

function readObservations(value: unknown): string[] {
  return readFlexibleField(value, "observations");
}

function readCitations(value: unknown): ProgramEvidenceCitation[] {
  if (!value || typeof value !== "object") return [];
  const flexible = (value as Record<string, unknown>).flexible;
  if (!flexible || typeof flexible !== "object") return [];
  const raw = (flexible as Record<string, unknown>).citations;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const quote = asString((c as Record<string, unknown>).quote);
      const locator = asString((c as Record<string, unknown>).locator);
      return quote ? { quote, locator: locator ?? "source file" } : null;
    })
    .filter((c): c is ProgramEvidenceCitation => c !== null)
    .slice(0, 10);
}

function compactLine(value: string | null | undefined, limit = 420): string {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "No text preview available.";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

// Not a business rule — evidence volume within a phase is not something we
// cap (a phase can legitimately accumulate 10s of evidence files). This is a
// pure safety ceiling against a runaway/unbounded query; it should never be
// the reason a real evidence item is excluded from generation.
const EVIDENCE_QUERY_SAFETY_CEILING = 500;

export async function listProgramEvidenceForPrompt(
  ctx: TenancyCtx,
  programId: string,
  /**
   * Scope to a specific phase's evidence — required for generation context.
   * Once a phase gates, its raw evidence is done: what carries forward to
   * later phases is the phase's finished, approved artifact (and its own
   * citations back to that evidence via `evidenceMap`/`PhaseDigest`), not the
   * raw files themselves re-surfacing in every later phase's prompt. Pass
   * `undefined` only for tooling/inspection use cases that genuinely need
   * every approved item across the whole Move (e.g. an admin evidence
   * browser) — never for a generation call.
   */
  phase?: number,
): Promise<ProgramEvidencePromptItem[]> {
  if (!programId || !(await canReadProgram(ctx, programId))) return [];

  // Only APPROVED evidence reaches generation — this is a hard invariant, not
  // an unfiltered "most recent" query. A file that is uploaded but still
  // pending human review (or rejected) must never appear in generation
  // context, no matter how recent it is.
  // One tenant's evidence rows can carry either of that tenant's own keys (the
  // product writes the app client key, a data-plane load job writes the
  // canonical substrate key), so a prompt scoped to a single key is built from
  // only one producer's rows and the rest read as absent. Per-tenant by
  // construction; see `moveEvidenceReadTenantKeys`.
  const tenantKeys = moveEvidenceReadTenantKeys(ctx.clientKey);
  if (tenantKeys.length === 0) return [];
  const reviewRows = await azureRead.select<Record<string, unknown>>({
    table: "program_evidence_reviews",
    columns: ["evidence_id", "reviewed_at", "updated_at", "source_ref"],
    where: {
      tenant_key: { op: "in", value: tenantKeys },
      program_id: programId,
      decision: "approved",
    },
    orderBy: { column: "updated_at", direction: "desc" },
    limit: EVIDENCE_QUERY_SAFETY_CEILING,
  });
  const approvedReviewByEvidenceId = new Map<
    string,
    { approvedAt: string | null; sourceRef: unknown }
  >();
  for (const row of reviewRows) {
    const evidenceId = asString(row.evidence_id);
    if (!evidenceId) continue;
    approvedReviewByEvidenceId.set(evidenceId, {
      approvedAt: asString(row.reviewed_at) ?? asString(row.updated_at),
      sourceRef: row.source_ref,
    });
  }
  const approvedEvidenceIds = Array.from(approvedReviewByEvidenceId.keys());
  if (approvedEvidenceIds.length === 0) return [];

  const rows = await azureRead.select<Record<string, unknown>>({
    table: "program_evidence_items",
    columns: [
      "id",
      "title",
      "evidence_type",
      "phase",
      "summary",
      "extracted_text",
      "extracted_structured",
      "created_at",
    ],
    where: {
      tenant_key: { op: "in", value: tenantKeys },
      program_id: programId,
      id: { op: "in", value: approvedEvidenceIds },
      ...(phase !== undefined ? { phase } : {}),
    },
    orderBy: { column: "created_at", direction: "desc" },
    limit: EVIDENCE_QUERY_SAFETY_CEILING,
  });
  return rows.map((row) => {
    const review = approvedReviewByEvidenceId.get(String(row.id));
    const reviewed = reviewedExtractionFromStoredSourceRef(review?.sourceRef);
    const structured = reviewed
      ? toStoredReviewedStructured(reviewed, row.extracted_structured)
      : row.extracted_structured;
    return {
      id: String(row.id),
      title: asString(row.title) ?? "Untitled evidence",
      evidenceType: asString(row.evidence_type) ?? "evidence",
      phase: typeof row.phase === "number" ? row.phase : null,
      summary: reviewed?.summary ?? asString(row.summary),
      parseMethod: readParseMethod(structured),
      structuredSignals: readStructuredSignals(structured),
      extractedText: reviewed ? null : asString(row.extracted_text),
      createdAt: asString(row.created_at) ?? "",
      approvedAt: review?.approvedAt ?? null,
      observations: readObservations(structured),
      assumptions: readFlexibleField(structured, "assumptions"),
      openQuestions: readFlexibleField(structured, "openQuestions"),
      citations: readCitations(structured),
    };
  });
}

export function formatProgramEvidenceForPrompt(
  items: readonly ProgramEvidencePromptItem[],
): string {
  if (items.length === 0) return "";
  const lines = ["PROGRAM EVIDENCE LEDGER (uploaded/captured, approved only):"];
  for (const item of items) {
    lines.push(
      `- ${item.title} (${item.evidenceType}; ${item.parseMethod ?? "parser unknown"}; ${item.createdAt})`,
      `  Summary: ${compactLine(item.summary)}`,
      item.structuredSignals.length
        ? `  Structured signals: ${item.structuredSignals
            .map((signal) => compactLine(signal, 240))
            .join(" | ")}`
        : "  Structured signals: none captured.",
      item.observations.length
        ? `  Observations: ${item.observations
            .map((observation) => compactLine(observation, 240))
            .join(" | ")}`
        : "  Observations: none captured.",
      item.citations.length
        ? `  Citations: ${item.citations
            .map((c) => `"${compactLine(c.quote, 160)}" (${c.locator})`)
            .join(" | ")}`
        : "  Citations: none captured.",
      item.extractedText
        ? `  Original extracted text: ${compactLine(item.extractedText)}`
        : "  Source text is not sent as an unreviewed fact; use only the approved summary, structured signals, and quoted source references above.",
    );
  }
  lines.push(
    "Use the approved summary and structured signals as the authoritative extracted facts. Cite the named evidence item and its quoted page/slide/section references; do not elevate unreviewed source text into a fact. Do not say there are zero uploaded items when entries are listed here.",
  );
  return lines.join("\n");
}
