// =============================================================================
// Current-state DOCUMENT path — review-required governance.
// -----------------------------------------------------------------------------
// Qualitative current-state families (stakeholder map, operating model, KPI
// baseline) have no canonical tower_* table. They are satisfied from DOCUMENTS
// (PDF / PPTX / DOCX / XLSX / CSV) through the existing evidence-ingestion parser.
//
// Honest ladder for documents (AGENTS.md context-ingestion truth standard):
//   upload → parse → program_evidence_items (append-only, cited)
//          → program_evidence_reviews decision='pending'   → readiness 'review_required'
//          → human approval            decision='approved' → readiness 'committed'
//
// Free-form PDF/PPTX/DOCX NEVER auto-commit — extraction is lossy and must be
// reviewed. A schema-validated structured KPI table (XLSX/CSV) MAY auto-promote
// (decision='approved', auto_promoted=true) — the founder-sanctioned exception
// for deterministic structured mappings, mirroring the CSV→tower path.
// =============================================================================

import "server-only";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type {
  EvidenceFamilySpec,
  StrategicMoveArchetype,
} from "@/lib/programs/archetypes/types";
import {
  extractProgramEvidenceFromUploadBuffer,
  recordProgramEvidence,
} from "@/lib/programs/evidence-ingestion";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import {
  evaluateSensitiveUpload,
  type UploadProtectionResult,
} from "@/lib/security/sensitive-upload-guard";

export type ReviewDecision = "pending" | "approved" | "rejected";

/**
 * Thrown when a parsed document's EXTRACTED text trips the sensitive-data guard.
 * Office formats (DOCX/PPTX/XLSX) are ZIP containers, so a raw-byte scan sees
 * only compressed bytes — PHI/PII inside them must be scanned AFTER extraction,
 * before anything is written. The route catches this and returns the standard
 * `sensitive_data_quarantined` (422) response. Nothing is persisted.
 */
export class QuarantinedDocumentError extends Error {
  readonly result: UploadProtectionResult;
  constructor(result: UploadProtectionResult) {
    super("document_quarantined_post_extract");
    this.name = "QuarantinedDocumentError";
    this.result = result;
  }
}

/**
 * Office-aware sensitivity check: run the same guard over the document's decoded
 * text (and summary). Pure + exported for testing. Returns the guard result so
 * the caller can decide. Declared classification still forces quarantine.
 */
export function assessExtractedTextSensitivity(
  text: string,
  opts: {
    filename: string;
    mimeType: string;
    declaredClassification?: string | null;
  },
): UploadProtectionResult {
  return evaluateSensitiveUpload({
    filename: opts.filename,
    mimeType: opts.mimeType,
    bytes: new TextEncoder().encode(text || ""),
    declaredClassification: opts.declaredClassification ?? null,
  });
}

export interface DocIngestResult {
  ok: boolean;
  evidenceId: string;
  reviewId: string;
  familyKey: string;
  /** 'review_required' (pending) or 'committed' (auto-promoted structured). */
  reviewState: "review_required" | "committed";
  autoPromoted: boolean;
  parsed: boolean;
  parseMethod: string;
  confidence: number;
  /** Extracted signals, surfaced so a reviewer sees WHAT will be committed. */
  signals: {
    decisions: string[];
    risks: string[];
    baseline_candidates: string[];
    action_items: string[];
  };
  warnings: string[];
  rationale: string;
}

export interface DocFamilyReviewState {
  familyKey: string;
  approved: number;
  pending: number;
  rejected: number;
  /** Pending reviews a reviewer can act on (governed promotion). */
  pendingItems: Array<{
    evidenceId: string;
    reviewId: string;
    title: string;
    parseMethod: string;
    confidence: number;
    submittedAt: string;
  }>;
  /** Real, citation-ready content lines extracted from the APPROVED (committed)
   *  document evidence — fed verbatim into grounded deliverables so the committed
   *  facts (decisions, risks, baselines) appear, not just "committed". */
  committedSignals: string[];
}

/** A family is DOCUMENT-eligible when it has no canonical committed-store table —
 *  it is satisfied through the governed document → review → commit path. */
export function isDocumentFamily(family: EvidenceFamilySpec): boolean {
  return !family.backing;
}

export function documentFamilyKeys(
  archetype: StrategicMoveArchetype,
): string[] {
  return archetype.evidenceFamilies.filter(isDocumentFamily).map((f) => f.key);
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Conservative KPI-table schema check for structured auto-promotion. Requires a
 * header naming a metric/kpi column AND a baseline/current/value column, plus at
 * least one data row. Anything ambiguous returns false → review_required.
 */
export function validateKpiTable(text: string | null): {
  valid: boolean;
  rows: number;
} {
  if (!text) return { valid: false, rows: 0 };
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { valid: false, rows: 0 };
  const headerIdx = lines.findIndex((l) => {
    const h = l.toLowerCase();
    const hasMetric = /\b(kpi|metric|measure)\b/.test(h);
    const hasValue = /\b(baseline|current|value|today|actual)\b/.test(h);
    return hasMetric && hasValue;
  });
  if (headerIdx === -1) return { valid: false, rows: 0 };
  const dataRows = lines.slice(headerIdx + 1).filter((l) => /[0-9]/.test(l));
  return { valid: dataRows.length >= 1, rows: dataRows.length };
}

export interface IngestDocArgs {
  moveId: string;
  family: EvidenceFamilySpec;
  archetypeId: string;
  phase: number;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  /** Optional declared data classification (e.g. "phi") from the upload form. */
  declaredClassification?: string | null;
}

/**
 * Parse an uploaded document for a qualitative family, append the cited evidence
 * (never mutated), and open the governed review record. Structured KPI tables
 * (XLSX/CSV) that pass schema validation auto-promote; everything else is
 * review_required.
 */
export async function ingestCurrentStateDoc(
  ctx: TenancyCtx,
  args: IngestDocArgs,
): Promise<DocIngestResult> {
  const tenantKey = ctx.clientKey ?? "";
  const familyKey = args.family.key;

  const evidence = await extractProgramEvidenceFromUploadBuffer({
    filename: args.filename,
    mimeType: args.mimeType,
    buffer: args.buffer,
    cacheScope: `${tenantKey}:${args.moveId}`,
  });
  const parseMethod = evidence.extractedStructured.parse_method;
  const warnings = evidence.extractedStructured.warnings ?? [];
  const parsed = Boolean(
    evidence.extractedText && evidence.extractedText.trim(),
  );

  // Office-aware quarantine: DOCX/PPTX/XLSX are ZIP containers, so the route's
  // raw-byte pre-scan sees compressed bytes. Re-scan the DECODED text here,
  // before any write or auto-promotion. Quarantine → nothing is persisted.
  const sensitivity = assessExtractedTextSensitivity(
    [evidence.extractedText ?? "", evidence.summary ?? ""]
      .filter(Boolean)
      .join("\n"),
    {
      filename: args.filename,
      mimeType: args.mimeType,
      declaredClassification: args.declaredClassification,
    },
  );
  if (sensitivity.decision === "quarantine") {
    throw new QuarantinedDocumentError(sensitivity);
  }

  // Auto-promotion is allowed ONLY for a schema-validated structured KPI table on
  // a financial/value family from a spreadsheet/CSV source. Never for free-form.
  const isStructuredSource =
    args.mimeType === XLSX_MIME ||
    args.mimeType === "text/csv" ||
    /\.(xlsx|csv)$/i.test(args.filename);
  const kpiCheck =
    args.family.kind === "financial" && isStructuredSource
      ? validateKpiTable(evidence.extractedText)
      : { valid: false, rows: 0 };
  const autoPromoted = kpiCheck.valid;

  // 1) Append-only evidence row (cited; step_id tags the current-state family).
  const evidenceId = await recordProgramEvidence(ctx, {
    ...evidence,
    tenantKey,
    programId: args.moveId,
    phase: args.phase,
    stepId: `current-state:${familyKey}`,
  });

  // 2) Governed promotion record (the honest ladder for documents).
  const decision: ReviewDecision = autoPromoted ? "approved" : "pending";
  const rationale = autoPromoted
    ? `Schema-validated structured KPI table (${kpiCheck.rows} row${
        kpiCheck.rows === 1 ? "" : "s"
      }) auto-promoted on ingest.`
    : `Document-extracted evidence for ${args.family.label} — pending human review before it counts as committed current-state evidence.`;

  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("program_evidence_reviews")
    .insert({
      tenant_key: tenantKey,
      program_id: args.moveId,
      evidence_id: evidenceId,
      family_key: familyKey,
      archetype_id: args.archetypeId,
      phase: args.phase,
      decision,
      auto_promoted: autoPromoted,
      rationale,
      source_ref: {
        filename: args.filename,
        mime_type: args.mimeType,
        parse_method: parseMethod,
        confidence: evidence.confidence,
        evidence_type: evidence.evidenceType,
        title: evidence.title,
      },
      submitted_by_user_id: ctx.userId,
      reviewed_by_user_id: autoPromoted ? ctx.userId : null,
      reviewed_at: autoPromoted ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) throw error;
  const reviewId = (data as { id: string }).id;

  await writeProgramAuditLogBestEffort(ctx, {
    tenantKey,
    programId: args.moveId,
    engagementId: args.moveId,
    action: autoPromoted
      ? "current_state_doc_auto_committed"
      : "current_state_doc_review_opened",
    fromState: "missing",
    toState: autoPromoted ? "committed" : "review_required",
    rationale,
    evidenceRefs: [evidenceId, reviewId],
  });

  return {
    ok: true,
    evidenceId,
    reviewId,
    familyKey,
    reviewState: autoPromoted ? "committed" : "review_required",
    autoPromoted,
    parsed,
    parseMethod,
    confidence: evidence.confidence,
    signals: {
      decisions: evidence.extractedStructured.decisions ?? [],
      risks: evidence.extractedStructured.risks ?? [],
      baseline_candidates:
        evidence.extractedStructured.baseline_candidates ?? [],
      action_items: evidence.extractedStructured.action_items ?? [],
    },
    warnings,
    rationale,
  };
}

/**
 * The governed promotion: flip a pending document review to approved/rejected.
 * This is what turns review_required → committed for the readiness resolver.
 * Service-role scoped + audited; tenant + move are enforced in the predicate.
 */
export async function decideEvidenceReview(
  ctx: TenancyCtx,
  args: {
    moveId: string;
    evidenceId: string;
    decision: Exclude<ReviewDecision, "pending">;
    rationale?: string;
  },
): Promise<{
  ok: boolean;
  evidenceId: string;
  familyKey: string | null;
  decision: ReviewDecision;
}> {
  const tenantKey = ctx.clientKey ?? "";
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("program_evidence_reviews")
    .update({
      decision: args.decision,
      reviewed_by_user_id: ctx.userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rationale:
        args.rationale ??
        `Reviewed ${args.decision} by ${ctx.userId} on the current-state evidence review.`,
    })
    .eq("tenant_key", tenantKey)
    .eq("program_id", args.moveId)
    .eq("evidence_id", args.evidenceId)
    .eq("decision", "pending")
    .select("evidence_id, family_key, decision")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      ok: false,
      evidenceId: args.evidenceId,
      familyKey: null,
      decision: "pending",
    };
  }

  const row = data as { family_key: string; decision: ReviewDecision };
  await writeProgramAuditLogBestEffort(ctx, {
    tenantKey,
    programId: args.moveId,
    engagementId: args.moveId,
    action:
      args.decision === "approved"
        ? "current_state_doc_committed"
        : "current_state_doc_rejected",
    fromState: "review_required",
    toState: args.decision === "approved" ? "committed" : "rejected",
    rationale: args.rationale ?? null,
    evidenceRefs: [args.evidenceId],
  });

  return {
    ok: true,
    evidenceId: args.evidenceId,
    familyKey: row.family_key,
    decision: row.decision,
  };
}

/**
 * Read the governed review state for a document family on a Move. Used by the
 * readiness resolver to decide committed (approved>0) vs review_required
 * (pending>0) vs missing. Read-only; never throws.
 */
export async function resolveDocFamilyReviews(
  ctx: TenancyCtx,
  moveId: string,
  familyKey: string,
): Promise<DocFamilyReviewState> {
  const tenantKey = ctx.clientKey ?? "";
  const empty: DocFamilyReviewState = {
    familyKey,
    approved: 0,
    pending: 0,
    rejected: 0,
    pendingItems: [],
    committedSignals: [],
  };
  if (!tenantKey || !moveId) return empty;
  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("program_evidence_reviews")
      .select("id, evidence_id, decision, source_ref, created_at")
      .eq("tenant_key", tenantKey)
      .eq("program_id", moveId)
      .eq("family_key", familyKey);
    if (error || !Array.isArray(data)) return empty;
    const rows = data as Array<{
      id: string;
      evidence_id: string;
      decision: ReviewDecision;
      source_ref: Record<string, unknown> | null;
      created_at: string;
    }>;
    const state: DocFamilyReviewState = {
      ...empty,
      pendingItems: [],
      committedSignals: [],
    };
    const approvedEvidenceIds: string[] = [];
    for (const r of rows) {
      if (r.decision === "approved") {
        state.approved += 1;
        approvedEvidenceIds.push(r.evidence_id);
      } else if (r.decision === "rejected") state.rejected += 1;
      else {
        state.pending += 1;
        const ref = r.source_ref ?? {};
        state.pendingItems.push({
          evidenceId: r.evidence_id,
          reviewId: r.id,
          title: String(ref.title ?? ref.filename ?? "Uploaded document"),
          parseMethod: String(ref.parse_method ?? "unknown"),
          confidence: typeof ref.confidence === "number" ? ref.confidence : 0.7,
          submittedAt: r.created_at,
        });
      }
    }

    // Pull the REAL extracted content from the approved (committed) evidence so
    // grounded deliverables can cite actual decisions/risks/baselines — not just
    // "committed". Generic across families (uses the shared extraction shape).
    if (approvedEvidenceIds.length) {
      const { data: ev } = await sb
        .from("program_evidence_items")
        .select("extracted_structured, summary, title")
        .in("id", approvedEvidenceIds);
      if (Array.isArray(ev)) {
        state.committedSignals = buildCommittedSignals(
          ev as Array<{
            extracted_structured: Record<string, unknown> | null;
            summary: string | null;
            title: string | null;
          }>,
        );
      }
    }
    return state;
  } catch {
    return empty;
  }
}

/**
 * Turn approved document evidence into a compact set of citation-ready content
 * lines (decisions, risks, baselines, key facts). Generic, format-agnostic,
 * bounded — so a deliverable cites the committed facts without flooding.
 */
function buildCommittedSignals(
  items: Array<{
    extracted_structured: Record<string, unknown> | null;
    summary: string | null;
    title: string | null;
  }>,
): string[] {
  const out: string[] = [];
  const take = (arr: unknown, label: string, max: number) => {
    if (!Array.isArray(arr)) return;
    for (const v of arr.slice(0, max)) {
      const s = String(v ?? "").trim();
      if (s) out.push(label ? `${label} — ${s}` : s);
    }
  };
  for (const it of items) {
    const es = it.extracted_structured ?? {};
    take(es.decisions, "Decision", 4);
    take(es.risks, "Risk", 4);
    take(es.baseline_candidates, "Baseline", 6);
    take(es.action_items, "Action", 2);
    // Fall back to the summary if no structured signals were extracted.
    if (out.length === 0 && it.summary) {
      out.push(String(it.summary).slice(0, 240));
    }
  }
  // De-dup + cap so deliverables stay tight.
  return Array.from(new Set(out)).slice(0, 12);
}
