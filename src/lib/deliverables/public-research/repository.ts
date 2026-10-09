import "server-only";

/**
 * Server-side store for governed public-source research on a Move.
 *
 * Every read and every write is fenced to ONE tenant and ONE Move:
 *   - writes store the caller's tenant key and Move id;
 *   - reads (and the match predicates of updates) accept every alias of that
 *     one tenant (`tenantAliasesFor`) and the exact Move id, the same fence
 *     `program_evidence_items` readers use, so a row written under the app
 *     client key or the canonical key is found, and another tenant's row for
 *     the same Move id never is.
 *
 * Failures are values, never empty lists: a failed read returns
 * `{ ok: false, reason: "read_failed" }`, not "no sources", so a caller can
 * never mistake an outage for "nothing was found".
 *
 * Storage contract: `supabase/migrations/20261010130000_move_public_research.sql`.
 */

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

import {
  PUBLIC_SOURCE_CONFIDENCE_LEVELS,
  PUBLIC_SOURCE_DECISIONS,
  PUBLIC_SOURCE_KIND,
  PUBLIC_SOURCES_PER_RUN_MAX,
  RESEARCH_RUN_STATUSES,
  validatePublicSource,
  validateResearchRun,
  type NewPublicSource,
  type NewResearchRun,
  type PublicResearchScope,
  type PublicSource,
  type PublicSourceConfidence,
  type PublicSourceDecision,
  type PublicSourceReviewDecision,
  type ResearchRun,
  type ResearchRunStatus,
  type ValidPublicSource,
} from "./types";

export const RUNS_TABLE = "move_public_research_runs";
export const SOURCES_TABLE = "move_public_sources";

export const RUN_COLUMNS =
  "id, tenant_key, program_id, phase, brief_hash, status, source_count, audit_id, started_at, completed_at, duration_ms, error, created_at";
export const SOURCE_COLUMNS =
  "id, tenant_key, program_id, run_id, kind, url, title, publisher, published_at, retrieved_at, excerpt, claim, confidence, decision, reviewed_by_user_id, reviewed_at, created_at";

/** The unique key the database enforces; the writer names it in ON CONFLICT. */
export const SOURCE_DEDUPE_CONFLICT = "tenant_key,program_id,url,excerpt_md5";

const APPROVED_LIST_LIMIT = 200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = Record<string, unknown>;

export type ScopeFailure = {
  ok: false;
  reason: "invalid_scope";
  detail: string;
};

interface Fence {
  tenantKey: string;
  tenantKeys: string[];
  programId: string;
}

function fenceFor(scope: PublicResearchScope): Fence | ScopeFailure {
  const tenantKey =
    typeof scope?.tenantKey === "string" ? scope.tenantKey.trim() : "";
  const programId =
    typeof scope?.programId === "string" ? scope.programId.trim() : "";
  if (!tenantKey) {
    return {
      ok: false,
      reason: "invalid_scope",
      detail: "tenant key is required",
    };
  }
  if (!UUID.test(programId)) {
    return {
      ok: false,
      reason: "invalid_scope",
      detail: "Move id must be a UUID",
    };
  }
  const tenantKeys = tenantAliasesFor(tenantKey);
  if (tenantKeys.length === 0) {
    return {
      ok: false,
      reason: "invalid_scope",
      detail: "tenant key has no aliases",
    };
  }
  return { tenantKey, tenantKeys, programId };
}

function isScopeFailure(value: Fence | ScopeFailure): value is ScopeFailure {
  return (value as ScopeFailure).ok === false;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function timestamp(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  return text(value);
}

/** pg returns DATE as a local-midnight Date; read its calendar components. */
function calendarDate(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = text(value);
  return raw ? raw.slice(0, 10) : null;
}

function integer(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) ? n : null;
}

function oneOf<T extends string>(
  values: readonly T[],
  value: unknown,
): T | null {
  return typeof value === "string" &&
    (values as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

export function rowToResearchRun(row: Row): ResearchRun | null {
  const id = text(row.id);
  const tenantKey = text(row.tenant_key);
  const programId = text(row.program_id);
  const briefHash = text(row.brief_hash);
  const status = oneOf<ResearchRunStatus>(RESEARCH_RUN_STATUSES, row.status);
  const startedAt = timestamp(row.started_at);
  const createdAt = timestamp(row.created_at);
  if (
    !id ||
    !tenantKey ||
    !programId ||
    !briefHash ||
    !status ||
    !startedAt ||
    !createdAt
  ) {
    return null;
  }
  return {
    id,
    tenantKey,
    programId,
    phase: integer(row.phase),
    briefHash,
    status,
    sourceCount: integer(row.source_count) ?? 0,
    auditId: text(row.audit_id),
    startedAt,
    completedAt: timestamp(row.completed_at),
    durationMs: integer(row.duration_ms),
    error: text(row.error),
    createdAt,
  };
}

export function rowToPublicSource(row: Row): PublicSource | null {
  const id = text(row.id);
  const tenantKey = text(row.tenant_key);
  const programId = text(row.program_id);
  const runId = text(row.run_id);
  const url = text(row.url);
  const title = text(row.title);
  const excerpt = text(row.excerpt);
  const retrievedAt = timestamp(row.retrieved_at);
  const createdAt = timestamp(row.created_at);
  const decision = oneOf<PublicSourceDecision>(
    PUBLIC_SOURCE_DECISIONS,
    row.decision,
  );
  if (
    row.kind !== PUBLIC_SOURCE_KIND ||
    !id ||
    !tenantKey ||
    !programId ||
    !runId ||
    !url ||
    !title ||
    !excerpt ||
    !retrievedAt ||
    !createdAt ||
    !decision
  ) {
    return null;
  }
  return {
    id,
    tenantKey,
    programId,
    runId,
    kind: PUBLIC_SOURCE_KIND,
    sourceClass: "public_source",
    url,
    title,
    publisher: text(row.publisher),
    publishedAt: calendarDate(row.published_at),
    retrievedAt,
    excerpt,
    claim: text(row.claim),
    confidence: oneOf<PublicSourceConfidence>(
      PUBLIC_SOURCE_CONFIDENCE_LEVELS,
      row.confidence,
    ),
    decision,
    reviewedByUserId: text(row.reviewed_by_user_id),
    reviewedAt: timestamp(row.reviewed_at),
    createdAt,
  };
}

function errorDetail(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return String(error ?? "unknown error");
}

// ── Runs ────────────────────────────────────────────────────────────────────

export type InsertRunResult =
  | { ok: true; run: ResearchRun }
  | ScopeFailure
  | { ok: false; reason: "invalid_input"; detail: string }
  | { ok: false; reason: "write_failed"; detail: string };

/** Record one research attempt, including one that produced nothing. */
export async function insertResearchRun(
  scope: PublicResearchScope,
  input: NewResearchRun,
): Promise<InsertRunResult> {
  const fence = fenceFor(scope);
  if (isScopeFailure(fence)) return fence;
  const valid = validateResearchRun(input);
  if (!valid.ok) {
    return {
      ok: false,
      reason: "invalid_input",
      detail: valid.reasons.join("; "),
    };
  }
  try {
    const db = getAzureWriteFluentClient();
    const { data, error } = await db
      .from(RUNS_TABLE)
      .insert({
        tenant_key: fence.tenantKey,
        program_id: fence.programId,
        phase: input.phase,
        brief_hash: input.briefHash.trim(),
        status: input.status,
        source_count: input.sourceCount,
        audit_id: input.auditId ?? null,
        started_at: input.startedAt,
        completed_at: input.completedAt ?? null,
        duration_ms: input.durationMs ?? null,
        error: input.error ?? null,
      })
      .select(RUN_COLUMNS);
    if (error)
      return { ok: false, reason: "write_failed", detail: errorDetail(error) };
    const row = Array.isArray(data) ? (data[0] as Row | undefined) : undefined;
    const run = row ? rowToResearchRun(row) : null;
    if (!run) {
      return {
        ok: false,
        reason: "write_failed",
        detail: "insert returned no run row",
      };
    }
    return { ok: true, run };
  } catch (error) {
    return { ok: false, reason: "write_failed", detail: errorDetail(error) };
  }
}

// ── Sources ─────────────────────────────────────────────────────────────────

export interface RejectedSource {
  index: number;
  reasons: string[];
}

export type InsertSourcesResult =
  | {
      ok: true;
      inserted: PublicSource[];
      /** Already stored for this Move (or repeated in the batch); not written. */
      duplicates: number;
      /** Refused before the write, by input position, with reasons. */
      rejected: RejectedSource[];
    }
  | ScopeFailure
  | { ok: false; reason: "invalid_input"; detail: string }
  /** The run is not this tenant's run for this Move. Nothing was written. */
  | { ok: false; reason: "run_not_found"; detail: string }
  /** A fence or dedupe read failed. Nothing was written. */
  | { ok: false; reason: "read_failed"; detail: string }
  /** The single insert statement failed. Nothing was written. */
  | { ok: false; reason: "write_failed"; detail: string };

type Candidate = ValidPublicSource & { index: number };

function dedupeKey(source: { url: string; excerpt: string }): string {
  return `${source.url}\u0000${source.excerpt}`;
}

/**
 * Store the sources one run found, pending review. Invalid sources are refused
 * with reasons; a source already stored for this Move (same URL, same excerpt,
 * under any alias of the tenant) or repeated within the batch is counted as a
 * duplicate and not written; at most PUBLIC_SOURCES_PER_RUN_MAX are stored.
 */
export async function insertPublicSources(
  scope: PublicResearchScope,
  runId: string,
  sources: readonly NewPublicSource[],
): Promise<InsertSourcesResult> {
  const fence = fenceFor(scope);
  if (isScopeFailure(fence)) return fence;
  if (typeof runId !== "string" || !UUID.test(runId)) {
    return {
      ok: false,
      reason: "invalid_input",
      detail: "run id must be a UUID",
    };
  }

  const rejected: RejectedSource[] = [];
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  sources.forEach((source, index) => {
    const valid = validatePublicSource(source);
    if (!valid.ok) {
      rejected.push({ index, reasons: valid.reasons });
      return;
    }
    const key = dedupeKey(valid.value);
    if (seen.has(key)) {
      duplicates += 1;
      return;
    }
    seen.add(key);
    candidates.push({ ...valid.value, index });
  });

  // Only the final statement writes; a throw before it wrote nothing.
  let writing = false;
  try {
    const db = getAzureWriteFluentClient();

    // The run must be this tenant's run for this Move.
    const { data: runRow, error: runError } = await db
      .from(RUNS_TABLE)
      .select("id")
      .eq("id", runId)
      .in("tenant_key", fence.tenantKeys)
      .eq("program_id", fence.programId)
      .maybeSingle();
    if (runError)
      return {
        ok: false,
        reason: "read_failed",
        detail: errorDetail(runError),
      };
    if (!runRow) {
      return {
        ok: false,
        reason: "run_not_found",
        detail: "no research run with this id for this tenant and Move",
      };
    }

    if (candidates.length === 0) {
      return { ok: true, inserted: [], duplicates, rejected };
    }

    // Already stored for this Move under any alias of this tenant.
    const urls = Array.from(new Set(candidates.map((source) => source.url)));
    const { data: existing, error: existingError } = await db
      .from(SOURCES_TABLE)
      .select("url, excerpt")
      .in("tenant_key", fence.tenantKeys)
      .eq("program_id", fence.programId)
      .in("url", urls);
    if (existingError) {
      return {
        ok: false,
        reason: "read_failed",
        detail: errorDetail(existingError),
      };
    }
    const stored = new Set(
      (Array.isArray(existing) ? (existing as Row[]) : []).map((row) =>
        dedupeKey({
          url: String(row.url ?? ""),
          excerpt: String(row.excerpt ?? ""),
        }),
      ),
    );

    const fresh: Candidate[] = [];
    for (const candidate of candidates) {
      if (stored.has(dedupeKey(candidate))) {
        duplicates += 1;
      } else if (fresh.length >= PUBLIC_SOURCES_PER_RUN_MAX) {
        rejected.push({
          index: candidate.index,
          reasons: [
            `over the limit of ${PUBLIC_SOURCES_PER_RUN_MAX} sources per run`,
          ],
        });
      } else {
        fresh.push(candidate);
      }
    }
    if (fresh.length === 0) {
      return { ok: true, inserted: [], duplicates, rejected };
    }

    writing = true;
    const { data: written, error: writeError } = await db
      .from(SOURCES_TABLE)
      .upsert(
        fresh.map((source) => ({
          tenant_key: fence.tenantKey,
          program_id: fence.programId,
          run_id: runId,
          kind: PUBLIC_SOURCE_KIND,
          url: source.url,
          title: source.title,
          publisher: source.publisher,
          published_at: source.publishedAt,
          retrieved_at: source.retrievedAt,
          excerpt: source.excerpt,
          claim: source.claim,
          confidence: source.confidence,
          decision: "pending",
        })),
        { onConflict: SOURCE_DEDUPE_CONFLICT, ignoreDuplicates: true },
      )
      .select(SOURCE_COLUMNS);
    if (writeError) {
      return {
        ok: false,
        reason: "write_failed",
        detail: errorDetail(writeError),
      };
    }
    const inserted = (Array.isArray(written) ? (written as Row[]) : [])
      .map(rowToPublicSource)
      .filter((source): source is PublicSource => source !== null);
    // A row a concurrent writer stored between the read and the write is
    // skipped by the database's unique key, and is a duplicate too.
    duplicates += fresh.length - inserted.length;
    return { ok: true, inserted, duplicates, rejected };
  } catch (error) {
    return {
      ok: false,
      reason: writing ? "write_failed" : "read_failed",
      detail: errorDetail(error),
    };
  }
}

export type ListSourcesResult =
  | { ok: true; sources: PublicSource[] }
  | ScopeFailure
  | { ok: false; reason: "read_failed"; detail: string };

/** The consultant-approved public sources for one Move — the only citable ones. */
export async function listApprovedPublicSources(
  scope: PublicResearchScope,
): Promise<ListSourcesResult> {
  const fence = fenceFor(scope);
  if (isScopeFailure(fence)) return fence;
  try {
    const db = getAzureWriteFluentClient();
    const { data, error } = await db
      .from(SOURCES_TABLE)
      .select(SOURCE_COLUMNS)
      .in("tenant_key", fence.tenantKeys)
      .eq("program_id", fence.programId)
      .eq("kind", PUBLIC_SOURCE_KIND)
      .eq("decision", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(APPROVED_LIST_LIMIT);
    if (error)
      return { ok: false, reason: "read_failed", detail: errorDetail(error) };
    const sources = (Array.isArray(data) ? (data as Row[]) : [])
      .map(rowToPublicSource)
      .filter((source): source is PublicSource => source !== null);
    return { ok: true, sources };
  } catch (error) {
    return { ok: false, reason: "read_failed", detail: errorDetail(error) };
  }
}

export interface DecidePublicSourceInput {
  sourceId: string;
  decision: PublicSourceReviewDecision;
  reviewerUserId: string;
  /** Defaults to now. */
  decidedAt?: string;
}

export type DecidePublicSourceResult =
  | { ok: true; source: PublicSource }
  | ScopeFailure
  | { ok: false; reason: "invalid_input"; detail: string }
  /** No such source for this tenant and Move. Nothing was written. */
  | { ok: false; reason: "not_found"; detail: string }
  /** The source was already decided. Nothing was written. */
  | {
      ok: false;
      reason: "already_decided";
      detail: string;
      currentDecision: PublicSourceReviewDecision;
    }
  /** The source was decided by someone else between the read and the write. */
  | { ok: false; reason: "conflict"; detail: string }
  | { ok: false; reason: "read_failed"; detail: string }
  | { ok: false; reason: "write_failed"; detail: string };

/**
 * Record a reviewer's decision: pending → approved, or pending → rejected.
 * A decided source is never re-decided here; the write only matches a row that
 * is still pending, so two reviewers cannot both win.
 */
export async function decidePublicSource(
  scope: PublicResearchScope,
  input: DecidePublicSourceInput,
): Promise<DecidePublicSourceResult> {
  const fence = fenceFor(scope);
  if (isScopeFailure(fence)) return fence;
  if (input.decision !== "approved" && input.decision !== "rejected") {
    return {
      ok: false,
      reason: "invalid_input",
      detail: "decision must be approved or rejected",
    };
  }
  const reviewer =
    typeof input.reviewerUserId === "string" ? input.reviewerUserId.trim() : "";
  if (!reviewer) {
    return {
      ok: false,
      reason: "invalid_input",
      detail: "reviewer is required",
    };
  }
  if (typeof input.sourceId !== "string" || !UUID.test(input.sourceId)) {
    return {
      ok: false,
      reason: "invalid_input",
      detail: "source id must be a UUID",
    };
  }
  const decidedAt = input.decidedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(decidedAt))) {
    return {
      ok: false,
      reason: "invalid_input",
      detail: "decidedAt must be a timestamp",
    };
  }

  let writing = false;
  try {
    const db = getAzureWriteFluentClient();
    const { data: current, error: readError } = await db
      .from(SOURCES_TABLE)
      .select(SOURCE_COLUMNS)
      .eq("id", input.sourceId)
      .in("tenant_key", fence.tenantKeys)
      .eq("program_id", fence.programId)
      .maybeSingle();
    if (readError)
      return {
        ok: false,
        reason: "read_failed",
        detail: errorDetail(readError),
      };
    const before = current ? rowToPublicSource(current as Row) : null;
    if (!before) {
      return {
        ok: false,
        reason: "not_found",
        detail: "no public source with this id for this tenant and Move",
      };
    }
    if (before.decision !== "pending") {
      return {
        ok: false,
        reason: "already_decided",
        detail: `this source was already ${before.decision}`,
        currentDecision: before.decision,
      };
    }

    writing = true;
    const { data: updated, error: writeError } = await db
      .from(SOURCES_TABLE)
      .update({
        decision: input.decision,
        reviewed_by_user_id: reviewer,
        reviewed_at: decidedAt,
      })
      .eq("id", input.sourceId)
      .in("tenant_key", fence.tenantKeys)
      .eq("program_id", fence.programId)
      .eq("decision", "pending")
      .select(SOURCE_COLUMNS);
    if (writeError)
      return {
        ok: false,
        reason: "write_failed",
        detail: errorDetail(writeError),
      };
    const row = Array.isArray(updated)
      ? (updated[0] as Row | undefined)
      : undefined;
    const source = row ? rowToPublicSource(row) : null;
    if (!source) {
      return {
        ok: false,
        reason: "conflict",
        detail:
          "the source was decided by another reviewer first; reload to see the decision",
      };
    }
    return { ok: true, source };
  } catch (error) {
    return {
      ok: false,
      reason: writing ? "write_failed" : "read_failed",
      detail: errorDetail(error),
    };
  }
}
