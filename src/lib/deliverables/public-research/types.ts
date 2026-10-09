/**
 * Governed public-source research for Moves — the storage contract.
 *
 * A PUBLIC SOURCE is a public web page retrieved by the audited Anthropic web
 * search / fetch tools during a Move deliverable build: a program rule, a
 * payment rule, a published study. It is never a fact about the client. It is
 * stored tenant- and Move-scoped with its URL, its retrieval date and a short
 * verbatim excerpt, and it may be cited only after a consultant approves it.
 *
 * This module is pure (no I/O) so the same rules can be read by the server
 * repository, the research step and the tests. Every rule the database
 * enforces with a CHECK is mirrored here, so a bad row is refused with a
 * reason before it reaches the write, not reported as an opaque SQL error.
 * The migration is `supabase/migrations/20261010130000_move_public_research.sql`.
 */

import {
  CONFIDENCE_LEVELS,
  type ConfidenceLevel,
} from "@/lib/governance/context-corpus-policy";

import { PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS } from "./review-contract";

/**
 * The tenant flag every part of public-source research sits behind: the
 * research step, the review routes and the review panel.
 */
export const PUBLIC_RESEARCH_FLAG = "moves_public_source_research" as const;

/** The only `kind` a stored public source may carry (DB CHECK). */
export const PUBLIC_SOURCE_KIND = "public_source" as const;
export type PublicSourceKind = typeof PUBLIC_SOURCE_KIND;

/**
 * Which side of the evidence boundary an item sits on. Client-private evidence
 * is what the client gave us; a public source is what the public web says.
 */
export const SOURCE_CLASSES = ["client_private", "public_source"] as const;
export type SourceClass = (typeof SOURCE_CLASSES)[number];

/** A stored excerpt is a short quotation, never a copied page (DB CHECK). */
export const PUBLIC_SOURCE_EXCERPT_MAX_CHARS = 300;

/** At most this many sources are stored from one research run. */
export const PUBLIC_SOURCES_PER_RUN_MAX = 12;

export const RESEARCH_RUN_STATUSES = [
  "ok",
  "failed",
  "timeout",
  "skipped",
  "denied",
] as const;
export type ResearchRunStatus = (typeof RESEARCH_RUN_STATUSES)[number];

export const PUBLIC_SOURCE_DECISIONS = [
  "pending",
  "approved",
  "rejected",
] as const;
export type PublicSourceDecision = (typeof PUBLIC_SOURCE_DECISIONS)[number];

/** The decisions a reviewer can record; `pending` is only ever the start. */
export type PublicSourceReviewDecision = Exclude<
  PublicSourceDecision,
  "pending"
>;

/** Confidence uses the governance vocabulary, not a parallel one. */
export const PUBLIC_SOURCE_CONFIDENCE_LEVELS = CONFIDENCE_LEVELS;
export type PublicSourceConfidence = ConfidenceLevel;

/** Every read and write is fenced to one tenant and one Move. */
export interface PublicResearchScope {
  /** The tenant key the writer stores; reads match every alias of it. */
  tenantKey: string;
  /** The Move (engagements.id). */
  programId: string;
}

export interface ResearchRun {
  id: string;
  tenantKey: string;
  programId: string;
  phase: number | null;
  briefHash: string;
  status: ResearchRunStatus;
  sourceCount: number;
  auditId: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

export interface NewResearchRun {
  phase: number | null;
  briefHash: string;
  status: ResearchRunStatus;
  sourceCount: number;
  auditId?: string | null;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  error?: string | null;
}

export interface PublicSource {
  id: string;
  tenantKey: string;
  programId: string;
  runId: string;
  kind: PublicSourceKind;
  sourceClass: "public_source";
  url: string;
  title: string;
  publisher: string | null;
  /** YYYY-MM-DD when the page states one. */
  publishedAt: string | null;
  retrievedAt: string;
  excerpt: string;
  claim: string | null;
  confidence: PublicSourceConfidence | null;
  decision: PublicSourceDecision;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  /** Why the reviewer decided as they did, when they said. Null while pending. */
  reviewNote: string | null;
  createdAt: string;
}

export interface NewPublicSource {
  url: string;
  title: string;
  publisher?: string | null;
  publishedAt?: string | null;
  retrievedAt: string;
  excerpt: string;
  claim?: string | null;
  confidence?: PublicSourceConfidence | null;
  /** Optional; when present it must be `public_source`. */
  kind?: string;
}

/** A NewPublicSource that passed validation, normalized for storage. */
export interface ValidPublicSource {
  url: string;
  title: string;
  publisher: string | null;
  publishedAt: string | null;
  retrievedAt: string;
  excerpt: string;
  claim: string | null;
  confidence: PublicSourceConfidence | null;
}

export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; reasons: string[] };

function trimmedOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Character count as Postgres `char_length` counts it (code points), not as
 * JavaScript `.length` counts it (UTF-16 units), so the two limits agree on
 * text outside the Basic Multilingual Plane.
 */
export function charLength(value: string): number {
  return Array.from(value).length;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

/**
 * Normalize a URL for storage, or say why it cannot be stored. Only an
 * absolute https URL with a host and no embedded credentials is accepted.
 */
export function normalizePublicSourceUrl(raw: unknown): Validation<string> {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, reasons: ["url is required"] };
  }
  const value = raw.trim();
  if (/\s/.test(value)) {
    return { ok: false, reasons: ["url must not contain whitespace"] };
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reasons: ["url is not an absolute URL"] };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reasons: ["url must use https"] };
  }
  if (!parsed.hostname) {
    return { ok: false, reasons: ["url has no host"] };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reasons: ["url must not carry credentials"] };
  }
  return { ok: true, value: parsed.href };
}

/**
 * Validate one source before it is written. Mirrors every CHECK on
 * `move_public_sources`: kind, https url, non-empty title, excerpt of 1 to
 * PUBLIC_SOURCE_EXCERPT_MAX_CHARS characters, confidence vocabulary; and adds
 * what a CHECK cannot see (a real calendar date, a parseable retrieval time).
 */
export function validatePublicSource(
  input: NewPublicSource,
): Validation<ValidPublicSource> {
  const reasons: string[] = [];

  if (input.kind !== undefined && input.kind !== PUBLIC_SOURCE_KIND) {
    reasons.push(`kind must be ${PUBLIC_SOURCE_KIND}`);
  }

  const url = normalizePublicSourceUrl(input.url);
  if (!url.ok) reasons.push(...url.reasons);

  const title = trimmedOrNull(input.title);
  if (!title) reasons.push("title is required");

  const excerpt = typeof input.excerpt === "string" ? input.excerpt.trim() : "";
  if (!excerpt) {
    reasons.push("excerpt is required");
  } else if (charLength(excerpt) > PUBLIC_SOURCE_EXCERPT_MAX_CHARS) {
    reasons.push(
      `excerpt is ${charLength(excerpt)} characters; the limit is ${PUBLIC_SOURCE_EXCERPT_MAX_CHARS}`,
    );
  }

  const retrievedAt = trimmedOrNull(input.retrievedAt);
  if (!retrievedAt || !isTimestamp(retrievedAt)) {
    reasons.push("retrievedAt must be a timestamp");
  }

  const publishedAt = trimmedOrNull(input.publishedAt);
  if (publishedAt && !isRealIsoDate(publishedAt)) {
    reasons.push("publishedAt must be a YYYY-MM-DD date");
  }

  const confidence = input.confidence ?? null;
  if (
    confidence !== null &&
    !(PUBLIC_SOURCE_CONFIDENCE_LEVELS as readonly string[]).includes(confidence)
  ) {
    reasons.push(
      `confidence must be one of ${PUBLIC_SOURCE_CONFIDENCE_LEVELS.join(", ")}`,
    );
  }

  if (reasons.length > 0 || !url.ok || !title || !retrievedAt) {
    return { ok: false, reasons };
  }
  return {
    ok: true,
    value: {
      url: url.value,
      title,
      publisher: trimmedOrNull(input.publisher),
      publishedAt,
      retrievedAt,
      excerpt,
      claim: trimmedOrNull(input.claim),
      confidence,
    },
  };
}

/**
 * Normalize a reviewer's optional note: absent or blank is no note; a string
 * longer than PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS, or anything that is not a
 * string, is refused rather than cut, so a reviewer never has part of what
 * they wrote stored as if it were the whole.
 */
export function normalizeReviewNote(raw: unknown): Validation<string | null> {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, reasons: ["note must be text"] };
  }
  const note = raw.trim();
  if (!note) return { ok: true, value: null };
  if (charLength(note) > PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS) {
    return {
      ok: false,
      reasons: [
        `note is ${charLength(note)} characters; the limit is ${PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS}`,
      ],
    };
  }
  return { ok: true, value: note };
}

/** Validate a run before it is written. Mirrors the CHECKs on the runs table. */
export function validateResearchRun(
  input: NewResearchRun,
): Validation<NewResearchRun> {
  const reasons: string[] = [];
  if (!(RESEARCH_RUN_STATUSES as readonly string[]).includes(input.status)) {
    reasons.push(`status must be one of ${RESEARCH_RUN_STATUSES.join(", ")}`);
  }
  if (!trimmedOrNull(input.briefHash)) reasons.push("briefHash is required");
  if (!Number.isInteger(input.sourceCount) || input.sourceCount < 0) {
    reasons.push("sourceCount must be a non-negative integer");
  }
  if (
    input.phase !== null &&
    (!Number.isInteger(input.phase) || input.phase < 0 || input.phase > 5)
  ) {
    reasons.push("phase must be an integer from 0 to 5, or null");
  }
  if (!trimmedOrNull(input.startedAt) || !isTimestamp(input.startedAt)) {
    reasons.push("startedAt must be a timestamp");
  }
  return reasons.length > 0
    ? { ok: false, reasons }
    : { ok: true, value: input };
}
