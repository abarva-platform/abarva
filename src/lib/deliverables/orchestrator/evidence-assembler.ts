// Assemble governed evidence for the orchestrator from the tenant context index.
//
// Pulls governed context chunks for a tenant (Azure AI Search, BM25), maps them to the
// orchestrator's clean evidence shape, and runs them through buildSourceRegister so
// citation numbers are assigned and internal_only evidence is excluded for vendor-facing
// audiences. The retriever is injectable so the mapping is unit-tested without Azure.

import "server-only";

import {
  queryTenantContext as defaultQueryTenantContext,
  type TenantContextChunk,
} from "@/lib/azure-search/tenant-context-retriever";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  buildSourceRegister,
  type GovernedCandidateLike,
} from "./source-register";
import type { GovernedEvidenceItem, SourceRegisterEntry } from "./types";
import {
  packEvidence,
  resolveContextBudget,
  type ContextBudget,
} from "./context-budget";
import {
  buildContextCoverage,
  type ContextCoverage,
} from "./context-coverage";

export interface AssembleEvidenceParams {
  tenantClientKey: string;
  clientId?: string;
  sourceArtifactRef?: string;
  query?: string;
  queries?: string[];
  topK?: number;
  audienceIsVendorFacing?: boolean;
  minConfidence?: number;
  contextBudget?: ContextBudget;
}

export interface AssembledEvidence {
  evidence: GovernedEvidenceItem[];
  sourceRegister: SourceRegisterEntry[];
  retrievedCount: number;
  coverage: ContextCoverage;
}

type QueryFn = typeof defaultQueryTenantContext;
type FluentDb = ReturnType<typeof getAzureWriteFluentClient>;

const MOVE_PHASE_CAPTURE_LIMIT = 240;
const MOVE_LEDGER_LIMIT = 240;
const MOVE_REVIEW_LIMIT = 160;
const MOVE_GENERATED_ARTIFACT_LIMIT = 80;
const MOVE_CANDIDATE_LIMIT = 720;
const TENANT_CONTEXT_TOP_K = 32;

function chunkToCandidate(chunk: TenantContextChunk): GovernedCandidateLike {
  const score = chunk.vectorScore ?? 0;
  const confidence: GovernedCandidateLike["confidence"] =
    score > 0.8 ? "high" : score > 0.5 ? "medium" : "low";
  const disclosureTier: GovernedCandidateLike["disclosureTier"] =
    chunk.classification === "confidential" ||
    chunk.classification === "restricted"
      ? "internal_only"
      : "vendor_facing";
  return {
    label: chunk.sourceDoc ?? chunk.sourceSegmentId ?? "Tenant context",
    statement: chunk.text,
    evidenceFamily:
      chunk.sourceBasis ?? chunk.sourceSegmentId ?? "enterprise_context",
    confidence,
    disclosureTier,
    provenanceRef: chunk.chunkId,
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function confidenceFromScore(
  score: number,
): GovernedCandidateLike["confidence"] {
  return score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low";
}

function sourceRefObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function compactText(
  parts: Array<string | null | undefined>,
  max = 900,
): string {
  return parts
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function renderableDocSignals(value: unknown): string[] {
  const doc = sourceRefObject(value);
  const out: string[] = [];
  const summary = stringOrNull(doc.executiveSummary);
  if (summary) out.push(`Executive summary: ${summary}`);
  const sections = doc.generatedSections;
  if (Array.isArray(sections)) {
    for (const section of sections.slice(0, 5)) {
      const sectionObj = sourceRefObject(section);
      const title = stringOrNull(sectionObj.title);
      const body =
        stringOrNull(sectionObj.bodyMarkdown) ?? stringOrNull(sectionObj.body);
      const text = compactText([title, body], 450);
      if (text) out.push(text);
    }
  }
  const sourceRegister = doc.sourceRegister;
  if (Array.isArray(sourceRegister)) {
    const labels = sourceRegister
      .slice(0, 6)
      .map((entry) => stringOrNull(sourceRefObject(entry).label))
      .filter((label): label is string => Boolean(label));
    if (labels.length > 0) out.push(`Source register: ${labels.join("; ")}`);
  }
  return out;
}

function structuredSignals(value: unknown): string[] {
  const structured = sourceRefObject(value);
  const out: string[] = [];
  const take = (key: string, label: string, max: number) => {
    const items = structured[key];
    if (!Array.isArray(items)) return;
    for (const item of items.slice(0, max)) {
      const text = stringOrNull(item);
      if (text) out.push(`${label}: ${text}`);
    }
  };
  take("decisions", "Decision", 3);
  take("risks", "Risk", 3);
  take("baseline_candidates", "Baseline", 5);
  take("action_items", "Action", 2);
  return out;
}

function phaseCaptureCandidate(
  row: Record<string, unknown>,
): GovernedCandidateLike | null {
  const state = sourceRefObject(row.state_jsonb);
  const value = stringOrNull(state.value);
  if (!value) return null;

  const moduleKey = stringOrNull(row.module_key);
  const sectionKey =
    stringOrNull(state.capture_section_key) ??
    moduleKey?.replace(/^phase_\d+_/, "") ??
    "phase_capture";
  const label =
    stringOrNull(state.label) ?? stringOrNull(row.module_name) ?? sectionKey;
  const phaseNumber = Number.isInteger(row.phase_number)
    ? Number(row.phase_number)
    : null;
  const status = stringOrNull(row.status);
  const confidence: GovernedCandidateLike["confidence"] =
    status === "completed" ? "high" : "medium";
  const phasePrefix =
    phaseNumber === null ? "Move capture" : `P${phaseNumber} capture`;

  return {
    label: `${phasePrefix}: ${label}`,
    statement: `${label}: ${value}`,
    evidenceFamily: `phase_capture:${sectionKey}`,
    confidence,
    asOf:
      stringOrNull(row.completed_at) ??
      stringOrNull(row.updated_at) ??
      undefined,
    disclosureTier: "internal_only",
    provenanceRef:
      stringOrNull(row.id) ?? moduleKey ?? `program_modules:${sectionKey}`,
  };
}

function evidenceItemToCandidate(
  row: Record<string, unknown>,
  opts: {
    family?: string | null;
    familyPrefix?: "document_extract" | "program_evidence";
    title?: string | null;
    asOf?: string | null;
  } = {},
): GovernedCandidateLike | null {
  const family =
    stringOrNull(opts.family) ??
    stringOrNull(row.evidence_type) ??
    "current_state_evidence";
  const title = stringOrNull(opts.title) ?? stringOrNull(row.title) ?? family;
  const signals = structuredSignals(row.extracted_structured);
  const statement = compactText(
    [
      stringOrNull(row.summary),
      signals.length ? `Extracted signals: ${signals.join("; ")}` : null,
      stringOrNull(row.extracted_text),
    ],
    1000,
  );
  if (!statement) return null;
  return {
    label: title,
    statement,
    evidenceFamily: `${opts.familyPrefix ?? "program_evidence"}:${family}`,
    confidence: confidenceFromScore(numberOrDefault(row.confidence, 0.72)),
    asOf: stringOrNull(opts.asOf) ?? stringOrNull(row.created_at) ?? undefined,
    disclosureTier: "internal_only",
    provenanceRef:
      stringOrNull(row.id) ??
      `program_evidence:${family}:${statement.slice(0, 48)}`,
  };
}

function generatedArtifactToCandidate(
  row: Record<string, unknown>,
): GovernedCandidateLike | null {
  const metadata = sourceRefObject(row.metadata);
  const title =
    stringOrNull(metadata.title) ??
    stringOrNull(row.title) ??
    "Generated Move artifact";
  const deliverableType =
    stringOrNull(metadata.deliverableTypeKey) ??
    stringOrNull(metadata.registryKey) ??
    stringOrNull(metadata.deliverableType) ??
    "generated_artifact";
  const generationMetrics = sourceRefObject(metadata.generationMetrics);
  const metricsText = compactText(
    [
      typeof generationMetrics.sectionCount === "number"
        ? `Sections: ${generationMetrics.sectionCount}`
        : null,
      typeof generationMetrics.bodyWordCount === "number"
        ? `Words: ${generationMetrics.bodyWordCount}`
        : null,
      typeof row.quality_score === "number"
        ? `Evidence readiness rating: ${row.quality_score}`
        : null,
    ],
    240,
  );
  const statement = compactText(
    [
      title,
      ...renderableDocSignals(metadata.renderableDoc),
      stringOrNull(metadata.renderedHtml)
        ? stripHtml(stringOrNull(metadata.renderedHtml) ?? "").slice(0, 900)
        : null,
      metricsText || null,
    ],
    1400,
  );
  if (!statement) return null;
  return {
    label: title,
    statement,
    evidenceFamily: `generated_artifact:${deliverableType}`,
    confidence: confidenceFromScore(numberOrDefault(row.quality_score, 0.75)),
    asOf: stringOrNull(row.rendered_at) ?? undefined,
    disclosureTier: "internal_only",
    provenanceRef:
      stringOrNull(row.id) ?? `generated_artifact:${deliverableType}:${title}`,
  };
}

async function loadMoveCurrentStateCandidates(
  params: Pick<
    AssembleEvidenceParams,
    "tenantClientKey" | "clientId" | "sourceArtifactRef"
  >,
  db: FluentDb = getAzureWriteFluentClient(),
): Promise<{
  candidates: GovernedCandidateLike[];
  approvedAvailable: number;
  unreadable: number;
}> {
  const clientId = stringOrNull(params.clientId);
  const moveId = stringOrNull(params.sourceArtifactRef);
  if (!clientId || !moveId)
    return { candidates: [], approvedAvailable: 0, unreadable: 0 };

  const candidates: GovernedCandidateLike[] = [];
  let approvedAvailable = 0;
  let unreadable = 0;

  // The operator's phase capture is the Move's own source of truth for the
  // current generation pass. It is not a signable gate artifact by itself, but
  // it must lead generation context so broad tenant facts cannot hijack a
  // specific Move narrative.
  try {
    const { data: modules } = await db
      .from("program_modules")
      .select(
        "id, module_key, module_name, phase_number, module_order, status, state_jsonb, updated_at, completed_at",
      )
      .eq("engagement_id", moveId)
      .order("phase_number", { ascending: true })
      .order("module_order", { ascending: true })
      .limit(MOVE_PHASE_CAPTURE_LIMIT);
    if (Array.isArray(modules)) {
      for (const row of modules as Array<Record<string, unknown>>) {
        const status = stringOrNull(row.status);
        if (status !== "completed" && status !== "in_progress") continue;
        const moduleKey = stringOrNull(row.module_key);
        if (!moduleKey?.startsWith("phase_")) continue;
        const candidate = phaseCaptureCandidate(row);
        if (candidate) candidates.push(candidate);
      }
    }
  } catch {
    // Older tenants or fixtures may not have phase-capture rows. Fall through to
    // reviewed evidence and tenant context instead of failing generation.
  }

  // Structured current-state CSVs land in canonical tower_* tables and write a
  // move-scoped evidence_ledger row. Pull those ledger claims into the governed
  // evidence prompt so the generated deliverable can cite them.
  try {
    const { data } = await db
      .from("evidence_ledger")
      .select(
        "id, artifact_ref, claim_text, source_ref, freshness_at, confidence",
      )
      .eq("client_id", clientId)
      .eq("surface", "moves")
      .order("created_at", { ascending: false })
      .limit(MOVE_LEDGER_LIMIT);
    if (Array.isArray(data)) {
      for (const row of data as Array<Record<string, unknown>>) {
        const sourceRef = sourceRefObject(row.source_ref);
        if (stringOrNull(sourceRef.moveId) !== moveId) continue;
        const statement = stringOrNull(row.claim_text);
        if (!statement) continue;
        const family =
          stringOrNull(sourceRef.family) ?? "current_state_evidence";
        const fileRef = stringOrNull(sourceRef.fileRef);
        candidates.push({
          label: fileRef ?? family,
          statement,
          evidenceFamily: family,
          confidence: confidenceFromScore(numberOrDefault(row.confidence, 0.7)),
          asOf: stringOrNull(row.freshness_at) ?? undefined,
          disclosureTier: "internal_only",
          provenanceRef: stringOrNull(row.id) ?? `evidence_ledger:${family}`,
        });
      }
    }
  } catch {
    // Retrieval should degrade to tenant-context-only rather than fail generation.
  }

  // Reviewed document-derived current-state evidence is append-only in
  // program_evidence_items. Pull approved review rows and their extracted
  // summaries/signals first so explicit human review remains the preferred path.
  try {
    const { data: reviewSummary } = await db
      .from("program_evidence_reviews")
      .select("decision, source_ref")
      .eq("tenant_key", params.tenantClientKey)
      .eq("program_id", moveId)
      .limit(MOVE_REVIEW_LIMIT);
    if (Array.isArray(reviewSummary)) {
      for (const review of reviewSummary as Array<Record<string, unknown>>) {
        if (stringOrNull(review.decision) === "approved")
          approvedAvailable += 1;
        const sourceRef = sourceRefObject(review.source_ref);
        const parsed = sourceRef.parsed;
        const parseMethod = stringOrNull(sourceRef.parse_method);
        const parseStatus = stringOrNull(sourceRef.parse_status);
        if (
          parsed === false ||
          parseStatus === "failed" ||
          parseMethod === "failed" ||
          parseMethod === "unreadable"
        ) {
          unreadable += 1;
        }
      }
    }
  } catch {
    // Coverage instrumentation is best-effort on older databases; never fail
    // generation because the summary columns are not present yet.
  }

  try {
    const { data: reviews } = await db
      .from("program_evidence_reviews")
      .select("evidence_id, family_key, source_ref, reviewed_at, decision")
      .eq("tenant_key", params.tenantClientKey)
      .eq("program_id", moveId)
      .eq("decision", "approved")
      .limit(MOVE_REVIEW_LIMIT);
    if (Array.isArray(reviews) && reviews.length > 0) {
      if (approvedAvailable === 0) approvedAvailable = reviews.length;
      const reviewRows = reviews as Array<Record<string, unknown>>;
      const evidenceIds = reviewRows
        .map((r) => stringOrNull(r.evidence_id))
        .filter((id): id is string => Boolean(id));
      if (evidenceIds.length > 0) {
        const { data: evidenceRows } = await db
          .from("program_evidence_items")
          .select(
            "id, title, summary, extracted_text, extracted_structured, evidence_type, confidence, created_at",
          )
          .in("id", evidenceIds);
        const byId = new Map(
          (Array.isArray(evidenceRows) ? evidenceRows : []).map((row) => [
            stringOrNull((row as Record<string, unknown>).id),
            row as Record<string, unknown>,
          ]),
        );
        for (const review of reviewRows) {
          const evidenceId = stringOrNull(review.evidence_id);
          if (!evidenceId) continue;
          const row = byId.get(evidenceId);
          if (!row) continue;
          if (
            stringOrNull(row.evidence_type) === "move_context_extract_attached"
          )
            continue;
          const sourceRef = sourceRefObject(review.source_ref);
          const family =
            stringOrNull(review.family_key) ?? "current_state_evidence";
          const title =
            stringOrNull(sourceRef.filename) ??
            stringOrNull(row.title) ??
            family;
          const candidate = evidenceItemToCandidate(row, {
            family,
            familyPrefix: "document_extract",
            title,
            asOf: stringOrNull(review.reviewed_at),
          });
          if (candidate) candidates.push(candidate);
        }
      }
    }
  } catch {
    // Same principle: current-state evidence augments retrieval but should not
    // crash the generator when older tenants lack the review tables.
  }

  // Do not fall back to raw program_evidence_items. Uploaded Move evidence must
  // clear the review lifecycle before generation can consume it; otherwise the
  // context extract, readiness, and generated deliverables can diverge.

  // Prior generated artifacts are the reviewed working product of earlier Move
  // phases. P5 handoff/value contracts must inherit that structured state
  // instead of requiring an operator to upload it again as external evidence.
  try {
    const { data: artifacts } = await db
      .from("generated_artifacts")
      .select(
        "id, quality_score, rendered_at, source_artifact_ref, superseded_by, quarantine_reason, metadata",
      )
      .eq("client_id", clientId)
      .eq("source_artifact_ref", moveId)
      .is("superseded_by", null)
      .is("quarantine_reason", null)
      .order("rendered_at", { ascending: false })
      .limit(MOVE_GENERATED_ARTIFACT_LIMIT);
    if (Array.isArray(artifacts)) {
      for (const row of artifacts as Array<Record<string, unknown>>) {
        const candidate = generatedArtifactToCandidate(row);
        if (candidate) candidates.push(candidate);
      }
    }
  } catch {
    // Generated-artifact inheritance augments Move context; older databases or
    // transient reads should degrade rather than block generation.
  }

  const seen = new Set<string>();
  return {
    candidates: candidates
      .filter((candidate) => {
        const key = `${candidate.provenanceRef}:${candidate.statement}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MOVE_CANDIDATE_LIMIT),
    approvedAvailable,
    unreadable,
  };
}

function normalizedQueries(params: AssembleEvidenceParams): string[] {
  const raw =
    params.queries && params.queries.length > 0
      ? params.queries
      : [params.query ?? "current state baseline"];
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const query of raw) {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(trimmed);
  }
  return queries.length > 0 ? queries : ["current state baseline"];
}

async function queryTenantChunks(
  params: AssembleEvidenceParams,
  queryTenantContext: QueryFn,
): Promise<TenantContextChunk[]> {
  const chunksById = new Map<string, TenantContextChunk>();
  const queries = normalizedQueries(params);
  const results = await Promise.all(
    queries.map((query) =>
      queryTenantContext({
        tenantClientKey: params.tenantClientKey,
        query,
        topK: params.topK ?? TENANT_CONTEXT_TOP_K,
        filters: {
          minConfidence: params.minConfidence ?? 0.5,
          // vendor-facing generation should never even retrieve restricted/confidential
          sensitivity: params.audienceIsVendorFacing
            ? ["public", "internal"]
            : ["public", "internal", "confidential"],
        },
      }),
    ),
  );
  for (const chunk of results.flat()) {
    const id = chunk.chunkId || chunk.sourceSegmentId || chunk.text;
    if (!chunksById.has(id)) chunksById.set(id, chunk);
  }
  return [...chunksById.values()];
}

export async function assembleGovernedEvidence(
  params: AssembleEvidenceParams,
  deps: { queryTenantContext?: QueryFn; db?: FluentDb } = {},
): Promise<AssembledEvidence> {
  const query = deps.queryTenantContext ?? defaultQueryTenantContext;
  const chunks = await queryTenantChunks(params, query);
  const moveContext = await loadMoveCurrentStateCandidates(params, deps.db);
  const moveCandidates = moveContext.candidates;
  const tenantCandidates = chunks.map(chunkToCandidate);
  const candidates = [...moveCandidates, ...tenantCandidates];
  const { evidence, register } = buildSourceRegister(candidates, {
    audienceIsVendorFacing: params.audienceIsVendorFacing,
  });
  const budget = params.contextBudget ?? resolveContextBudget();
  const packed = packEvidence(evidence, budget);
  const packedCitations = new Set(
    packed.packed.map((item) => item.citationNumber),
  );
  const packedRegister = register.filter((entry) =>
    packedCitations.has(entry.citationNumber),
  );
  return {
    evidence: packed.packed,
    sourceRegister: packedRegister,
    retrievedCount: candidates.length,
    coverage: buildContextCoverage({
      approvedAvailable: moveContext.approvedAvailable,
      retrieved: candidates.length,
      packed: packed.packed.length,
      droppedForBudget: packed.droppedCount,
      unreadable: moveContext.unreadable,
      usedTokens: packed.usedTokens,
      evidenceTokenBudget: budget.evidenceTokens,
    }),
  };
}
