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
  enrichWithFlexibleEvidenceEnvelope,
  extractProgramEvidenceFromUploadBuffer,
  recordProgramEvidence,
  type ExtractedProgramEvidence,
} from "@/lib/programs/evidence-ingestion";
import {
  classifyUploadedMoveEvidence,
  mergeMoveEvidenceClassification,
} from "@/lib/programs/uploaded-move-evidence-classification";
import { applyUploadedEvidenceToMove } from "@/lib/programs/mutations";
import type { ExtractionReceipt } from "@/lib/programs/discovery/extraction-planner";
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
    mimeType: "text/plain",
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

export interface EnsureEvidenceReviewArgs {
  moveId: string;
  evidenceId: string;
  familyKey: string;
  archetypeId?: string | null;
  phase?: number | null;
  filename?: string | null;
  mimeType?: string | null;
  parseMethod?: string | null;
  evidenceType?: string | null;
  title?: string | null;
  confidence?: number | string | null;
  autoPromoted?: boolean;
  initialDecision?: ReviewDecision;
  rationale?: string | null;
  sourceRef?: Record<string, unknown>;
}

export interface EnsureEvidenceReviewResult {
  ok: true;
  reviewId: string;
  evidenceId: string;
  familyKey: string;
  decision: ReviewDecision;
  reviewState: "pending_review" | "accepted" | "rejected";
  autoPromoted: boolean;
  idempotent: boolean;
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

  const rawEvidence = await extractProgramEvidenceFromUploadBuffer({
    filename: args.filename,
    mimeType: args.mimeType,
    buffer: args.buffer,
    cacheScope: `${tenantKey}:${args.moveId}`,
  });

  // Office-aware quarantine: DOCX/PPTX/XLSX are ZIP containers, so the route's
  // raw-byte pre-scan sees compressed bytes. Re-scan the DECODED text here,
  // before any write, auto-promotion, or further processing (including the
  // flexible LLM enrichment below, which must never see quarantined text).
  // Quarantine → nothing is persisted, nothing is sent anywhere else.
  const sensitivity = assessExtractedTextSensitivity(
    [rawEvidence.extractedText ?? "", rawEvidence.summary ?? ""]
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

  const evidence = await enrichWithFlexibleEvidenceEnvelope(rawEvidence, {
    tenantId: ctx.clientId,
    userId: ctx.userId,
  });
  const parseMethod = evidence.extractedStructured.parse_method;
  const warnings = evidence.extractedStructured.warnings ?? [];
  const parsed = Boolean(
    evidence.extractedText && evidence.extractedText.trim(),
  );

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

function normalizedFamilyKey(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : "uploaded_move_evidence";
}

function reviewStateForDecision(
  decision: ReviewDecision,
): EnsureEvidenceReviewResult["reviewState"] {
  if (decision === "approved") return "accepted";
  if (decision === "rejected") return "rejected";
  return "pending_review";
}

/**
 * Open or return the governed review row for workspace-uploaded Move evidence.
 * This makes workspace upload follow the same append-only evidence + separate
 * review/acceptance ledger as the current-state document path.
 */
export async function ensureEvidenceReviewForUploadedEvidence(
  ctx: TenancyCtx,
  args: EnsureEvidenceReviewArgs,
): Promise<EnsureEvidenceReviewResult> {
  const tenantKey = ctx.clientKey ?? "";
  const familyKey = normalizedFamilyKey(args.familyKey);
  const autoPromoted = args.autoPromoted === true;
  const decision: ReviewDecision =
    args.initialDecision ?? (autoPromoted ? "approved" : "pending");
  const reviewedOnInsert = decision !== "pending";
  const sourceRef = {
    filename: args.filename ?? undefined,
    mime_type: args.mimeType ?? undefined,
    parse_method: args.parseMethod ?? undefined,
    confidence: args.confidence ?? undefined,
    evidence_type: args.evidenceType ?? undefined,
    title: args.title ?? undefined,
    lifecycle: {
      evidence_status: "uploaded",
      review_status:
        decision === "approved"
          ? autoPromoted
            ? "auto_accepted"
            : "accepted"
          : decision === "rejected"
            ? "rejected"
            : "pending_review",
      attachment_status: "attached_to_move",
      maturity_level: decision === "pending" ? "uploaded" : reviewStateForDecision(decision),
      accepted_by: decision === "approved" ? ctx.userId : null,
      accepted_at: decision === "approved" ? new Date().toISOString() : null,
      attached_to_move_id: args.moveId,
      supported_phase: args.phase ?? null,
      supported_gate: args.phase == null ? null : `P${args.phase}`,
      blueprint_category: familyKey,
    },
    ...(args.sourceRef ?? {}),
  };
  const rationale =
    args.rationale ??
    (autoPromoted
      ? "Structured/internal workspace evidence explicitly auto-accepted on upload."
      : "Workspace-uploaded evidence requires human review before it counts toward readiness or generation.");
  const sb = getAzureWriteFluentClient();

  const { data: existing, error: existingError } = await sb
    .from("program_evidence_reviews")
    .select("id, evidence_id, family_key, decision, auto_promoted")
    .eq("tenant_key", tenantKey)
    .eq("program_id", args.moveId)
    .eq("evidence_id", args.evidenceId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const row = existing as {
      id: string;
      evidence_id: string;
      family_key: string;
      decision: ReviewDecision;
      auto_promoted: boolean;
    };
    return {
      ok: true,
      reviewId: row.id,
      evidenceId: row.evidence_id,
      familyKey: row.family_key,
      decision: row.decision,
      reviewState: reviewStateForDecision(row.decision),
      autoPromoted: row.auto_promoted,
      idempotent: true,
    };
  }

  const { data, error } = await sb
    .from("program_evidence_reviews")
    .insert({
      tenant_key: tenantKey,
      program_id: args.moveId,
      evidence_id: args.evidenceId,
      family_key: familyKey,
      archetype_id: args.archetypeId ?? null,
      phase: args.phase ?? null,
      decision,
      auto_promoted: autoPromoted,
      rationale,
      source_ref: sourceRef,
      submitted_by_user_id: ctx.userId,
      reviewed_by_user_id: reviewedOnInsert ? ctx.userId : null,
      reviewed_at: reviewedOnInsert ? new Date().toISOString() : null,
    })
    .select("id, evidence_id, family_key, decision, auto_promoted")
    .single();
  if (error) throw error;
  const row = data as {
    id: string;
    evidence_id: string;
    family_key: string;
    decision: ReviewDecision;
    auto_promoted: boolean;
  };

  await writeProgramAuditLogBestEffort(ctx, {
    tenantKey,
    programId: args.moveId,
    engagementId: args.moveId,
    action: decision === "approved" && !autoPromoted
      ? "workspace_evidence_committed"
      : autoPromoted
      ? "workspace_evidence_auto_accepted"
      : "workspace_evidence_review_opened",
    fromState: "uploaded",
    toState: reviewStateForDecision(decision),
    rationale,
    evidenceRefs: [args.evidenceId, row.id],
  });

  return {
    ok: true,
    reviewId: row.id,
    evidenceId: row.evidence_id,
    familyKey: row.family_key,
    decision: row.decision,
    reviewState: reviewStateForDecision(row.decision),
    autoPromoted: row.auto_promoted,
    idempotent: false,
  };
}

export interface IngestUploadedMoveEvidenceArgs {
  moveId: string;
  archetypeId: string | null;
  phase: number | null;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  /**
   * `program_evidence_items.attachment_id` is a foreign key into
   * `program_attachments`, NOT `move_artifacts` — only pass a
   * `program_attachments.id` here (e.g. from `recordAttachmentUpload`).
   * Callers whose upload surface writes to a different table (e.g. the
   * Files & Evidence vault, which writes `move_artifacts`) must omit this
   * and instead carry that id via `moveArtifactId` below, which is stored
   * in `source_ref` metadata rather than the FK column.
   */
  attachmentId?: string | null;
  /** The `move_artifacts.id` for this upload, if the caller's surface uses that table. Traceability only — never written to the `attachment_id` FK column. */
  moveArtifactId?: string | null;
  declaredClassification?: unknown;
}

export interface IngestUploadedMoveEvidenceResult {
  evidenceId: string | null;
  evidenceType: string | null;
  parseMethod: string | null;
  warnings: string[];
  whatFound: string[];
  whereUsed: string[];
  reviewId: string | null;
  reviewState: EnsureEvidenceReviewResult["reviewState"] | null;
  quarantined: boolean;
  discoveryReceipt: ExtractionReceipt | null;
}

/**
 * THE single governed path for a Move-scoped file upload of unknown/inferred
 * family — used by every upload surface (Files & Evidence vault, workspace
 * chat paperclip, session/workshop notes) so every approved file goes through
 * the same extraction → classification → review pipeline, per the evidence
 * methodology audit. Never auto-approves free-form content; that stays a
 * separate human step via `decideEvidenceReview`.
 */
export async function ingestUploadedMoveEvidence(
  ctx: TenancyCtx,
  args: IngestUploadedMoveEvidenceArgs,
): Promise<IngestUploadedMoveEvidenceResult> {
  const rawEvidence = await extractProgramEvidenceFromUploadBuffer({
    filename: args.filename,
    mimeType: args.mimeType,
    buffer: args.buffer,
    cacheScope: ctx.clientKey ?? undefined,
  });
  const classification = classifyUploadedMoveEvidence({
    filename: args.filename,
    phase: args.phase,
    extractedText: rawEvidence.extractedText,
    originalEvidenceType: rawEvidence.evidenceType,
  });
  const classifiedEvidence = mergeMoveEvidenceClassification({
    evidence: rawEvidence,
    classification,
    filename: args.filename,
  });

  // Same office-aware re-scan as the current-state document path: the
  // caller's own pre-upload scan (if any) only covers raw bytes, which is
  // insufficient for ZIP-container formats. Quarantined text is never sent
  // to the flexible extraction model, and the evidence is recorded with only
  // its deterministic (non-LLM) fields so nothing sensitive leaves the
  // deterministic parsing boundary.
  const sensitivity = assessExtractedTextSensitivity(
    [classifiedEvidence.extractedText ?? "", classifiedEvidence.summary ?? ""]
      .filter(Boolean)
      .join("\n"),
    {
      filename: args.filename,
      mimeType: args.mimeType,
      declaredClassification:
        typeof args.declaredClassification === "string"
          ? args.declaredClassification
          : null,
    },
  );
  const quarantined = sensitivity.decision === "quarantine";
  const evidence: ExtractedProgramEvidence = quarantined
    ? classifiedEvidence
    : await enrichWithFlexibleEvidenceEnvelope(classifiedEvidence, {
        tenantId: ctx.clientId,
        userId: ctx.userId,
      });

  const evidenceId = await recordProgramEvidence(ctx, {
    ...evidence,
    evidenceType: rawEvidence.evidenceType,
    tenantKey: ctx.clientKey ?? "",
    programId: args.moveId,
    attachmentId: args.attachmentId ?? null,
    phase: args.phase,
    stepId: null,
  });

  const evidenceReview = await ensureEvidenceReviewForUploadedEvidence(ctx, {
    moveId: args.moveId,
    evidenceId,
    familyKey:
      classification.slotIds[0] ??
      classification.evidenceType ??
      rawEvidence.evidenceType,
    archetypeId: args.archetypeId,
    phase: args.phase,
    filename: args.filename,
    mimeType: args.mimeType,
    parseMethod: evidence.extractedStructured.parse_method,
    evidenceType: classification.evidenceType,
    title: evidence.title,
    confidence: evidence.confidence,
    autoPromoted: false,
    rationale: quarantined
      ? "Uploaded evidence flagged by the sensitive-data guard after extraction; recorded with deterministic parsing only, pending human review."
      : "Uploaded evidence captured and opened for review before it counts toward readiness, context extract, or generation.",
    sourceRef: {
      source_type: classification.sourceType,
      slot_ids: classification.slotIds,
      artifact_consumers: classification.artifactConsumers,
      what_found: classification.whatFound,
      where_used: classification.whereUsed,
      quarantined,
      move_artifact_id: args.moveArtifactId ?? undefined,
    },
  });

  let discoveryReceipt: ExtractionReceipt | null = null;
  try {
    discoveryReceipt = await applyUploadedEvidenceToMove(ctx, {
      programId: args.moveId,
      evidence,
      sourceFile: args.filename,
    });
  } catch (err) {
    console.error("[ingestUploadedMoveEvidence] discovery_extraction_failed", {
      moveId: args.moveId,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    evidenceId,
    evidenceType: classification.evidenceType,
    parseMethod: evidence.extractedStructured.parse_method,
    warnings: evidence.extractedStructured.warnings ?? [],
    whatFound: classification.whatFound,
    whereUsed: classification.whereUsed,
    reviewId: evidenceReview.reviewId,
    reviewState: evidenceReview.reviewState,
    quarantined,
    discoveryReceipt,
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
    const { data: existingReview, error: existingReviewError } = await sb
      .from("program_evidence_reviews")
      .select("evidence_id, family_key, decision")
      .eq("tenant_key", tenantKey)
      .eq("program_id", args.moveId)
      .eq("evidence_id", args.evidenceId)
      .maybeSingle();
    if (existingReviewError) throw existingReviewError;
    if (existingReview) {
      const existing = existingReview as {
        evidence_id: string;
        family_key: string | null;
        decision: ReviewDecision;
      };
      if (existing.decision === args.decision) {
        return {
          ok: true,
          evidenceId: existing.evidence_id,
          familyKey: existing.family_key,
          decision: existing.decision,
        };
      }
      return {
        ok: false,
        evidenceId: args.evidenceId,
        familyKey: existing.family_key,
        decision: existing.decision,
      };
    }

    const { data: evidenceRow, error: evidenceError } = await sb
      .from("program_evidence_items")
      .select("id, evidence_type, title, confidence, phase, extracted_structured")
      .eq("tenant_key", tenantKey)
      .eq("program_id", args.moveId)
      .eq("id", args.evidenceId)
      .maybeSingle();
    if (evidenceError) throw evidenceError;
    if (evidenceRow) {
      const evidence = evidenceRow as {
        id: string;
        evidence_type: string | null;
        title: string | null;
        confidence: number | string | null;
        phase: number | null;
        extracted_structured: Record<string, unknown> | null;
      };
      const structured =
        evidence.extracted_structured &&
        typeof evidence.extracted_structured === "object"
          ? evidence.extracted_structured
          : {};
      const familyKey = normalizedFamilyKey(
        typeof structured.evidence_type === "string"
          ? structured.evidence_type
          : evidence.evidence_type,
      );
      const ensured = await ensureEvidenceReviewForUploadedEvidence(ctx, {
        moveId: args.moveId,
        evidenceId: args.evidenceId,
        familyKey,
        phase: evidence.phase,
        evidenceType: evidence.evidence_type,
        title: evidence.title,
        confidence: evidence.confidence,
        autoPromoted: false,
        initialDecision: args.decision,
        rationale:
          args.rationale ??
          "Human reviewer accepted existing workspace-uploaded evidence.",
        sourceRef: {
          late_review_created_from_approval: true,
        },
      });
      return {
        ok: true,
        evidenceId: ensured.evidenceId,
        familyKey: ensured.familyKey,
        decision: ensured.decision,
      };
    }
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
