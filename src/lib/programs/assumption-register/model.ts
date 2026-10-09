// Move assumptions register — the pure domain model.
//
// A Move's documents rest on figures that are not yet evidence. The register
// makes each one a canonical object with a stable ID that documents cite as
// `[A:V3]`, a named source, an owner ROLE, a confidence of 1, 3 or 5, and a
// status. aVa may only PROPOSE a row; a person accepts, rejects, answers or
// supersedes it. A working figure is always a labelled assumption, never a
// fact.
//
// ID scheme: area prefix + sequence — V (value), D (data), DL (delivery),
// A (adoption). An ID is never reused: rows are never deleted, and a new
// sequence is the maximum EVER allocated for the area plus one, whatever the
// status of the rows holding the lower numbers. A correction keeps its ID; a
// supersede creates a NEW row with a NEW ID and points the old row at it.
//
// Storage: `supabase/migrations/20261010120000_move_assumption_register.sql`.
// I/O lives in `./store.ts`; nothing here reads or writes.

import type { ApprovedAssumption } from "@/lib/deliverables/orchestrator/types";
import { REGISTER_ID_PATTERN } from "@/lib/deliverables/orchestrator/numeric-lineage-tokens";
import {
  POLICY_VERSION,
  evaluateGovernedObject,
  type ConfidenceLevel,
  type GovernedObject,
  type MovePhase,
} from "@/lib/governance/context-corpus-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

/** The tenant flag that turns the register on (routes, aVa tool, generation). */
export const ASSUMPTION_REGISTER_FLAG = "moves_assumption_register_v1" as const;
/**
 * Generation is governed by its own flag, off for every tenant until the
 * register migration is applied and a Move's register is populated: under
 * enforcement an unreadable register stops the build, and an empty one admits
 * no figure outside evidence.
 */
export const ASSUMPTION_REGISTER_GENERATION_FLAG =
  "moves_assumption_register_generation_v1" as const;

/**
 * The reader's sentence when a generation the register governs could not read
 * it. It names no internal error text; the caller logs the cause.
 */
export const REGISTER_UNAVAILABLE_DETAIL =
  "The Move's assumptions register could not be read, so the document was not generated: " +
  "its working figures cannot be cited without it. Nothing was saved; try the build again.";

// ── Controlled vocabularies ──────────────────────────────────────────────────

export const ASSUMPTION_AREAS = [
  "value",
  "data",
  "delivery",
  "adoption",
] as const;
export type AssumptionArea = (typeof ASSUMPTION_AREAS)[number];

/**
 * The register ID prefix per area. A `Record` over the union, so an area
 * without a prefix is a compile error. Must match the CASE in the migration's
 * `move_assumptions_register_id_check`.
 */
export const AREA_ID_PREFIX: Readonly<Record<AssumptionArea, string>> = {
  value: "V",
  data: "D",
  delivery: "DL",
  adoption: "A",
};

export const ASSUMPTION_STATUSES = [
  "proposed",
  "open",
  "confirmed",
  "corrected",
  "superseded",
  "rejected",
] as const;
export type AssumptionStatus = (typeof ASSUMPTION_STATUSES)[number];

export const ASSUMPTION_ORIGINS = [
  "team",
  "ava_proposal",
  "charter_carry_forward",
  "evidence_extraction",
] as const;
export type AssumptionOrigin = (typeof ASSUMPTION_ORIGINS)[number];

export type ActorKind = "person" | "ava";

export const REGISTER_CONFIDENCE_SCORES = [1, 3, 5] as const;
export type RegisterConfidence = (typeof REGISTER_CONFIDENCE_SCORES)[number];

/** Register confidence ↔ the low/medium/high scale the kernel ledger and governance policy use. */
export const CONFIDENCE_LEVEL_BY_SCORE: Readonly<
  Record<RegisterConfidence, "low" | "medium" | "high">
> = { 1: "low", 3: "medium", 5: "high" };

export function isRegisterConfidence(
  value: unknown,
): value is RegisterConfidence {
  return (REGISTER_CONFIDENCE_SCORES as readonly unknown[]).includes(value);
}

export function confidenceLevel(
  score: RegisterConfidence,
): "low" | "medium" | "high" {
  return CONFIDENCE_LEVEL_BY_SCORE[score];
}

export function confidenceScore(
  level: "low" | "medium" | "high",
): RegisterConfidence {
  const match = REGISTER_CONFIDENCE_SCORES.find(
    (score) => CONFIDENCE_LEVEL_BY_SCORE[score] === level,
  );
  if (match === undefined)
    throw new Error(`unknown confidence level: ${level}`);
  return match;
}

/**
 * The status a new row starts in, by origin. A person's own row is part of the
 * working register at once; anything a machine raised waits for a person.
 */
export const INITIAL_STATUS_BY_ORIGIN: Readonly<
  Record<AssumptionOrigin, AssumptionStatus>
> = {
  team: "open",
  charter_carry_forward: "open",
  ava_proposal: "proposed",
  evidence_extraction: "proposed",
};

// ── The record ───────────────────────────────────────────────────────────────

export interface AssumptionRecord {
  id: string;
  tenantKey: string;
  programId: string;
  area: AssumptionArea;
  seq: number;
  registerId: string;
  statement: string;
  whyItMatters: string | null;
  workingFigure: string | null;
  workingValue: number | null;
  unit: string | null;
  source: string;
  confidence: RegisterConfidence;
  ownerRole: string;
  ownerName: string | null;
  ownerPersonId: string | null;
  status: AssumptionStatus;
  origin: AssumptionOrigin;
  answer: string | null;
  answerFigure: string | null;
  answerValue: number | null;
  answerSource: string | null;
  answeredByUserId: string | null;
  answeredAt: string | null;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
  supersededBy: string | null;
  raisedPhase: number | null;
  raisedStepId: string | null;
  evidenceIds: string[];
  charterSectionKey: string | null;
  charterValueRevision: string | null;
  revision: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Register IDs ─────────────────────────────────────────────────────────────

/**
 * Every use of this body is anchored (`^…$`, or between `[A:` and `]`), so
 * `DL3` can only ever read as delivery row 3 — the alternation order does not
 * decide it, the anchors do. One definition, shared with the generation
 * lineage check (`numeric-lineage-tokens.ts`).
 */
const REGISTER_ID_BODY = REGISTER_ID_PATTERN;
const REGISTER_ID_RE = new RegExp(`^${REGISTER_ID_BODY}$`);
const AREA_BY_PREFIX: ReadonlyMap<string, AssumptionArea> = new Map(
  ASSUMPTION_AREAS.map((area) => [AREA_ID_PREFIX[area], area] as const),
);

export function formatRegisterId(area: AssumptionArea, seq: number): string {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`register sequence must be a positive integer, got ${seq}`);
  }
  return `${AREA_ID_PREFIX[area]}${seq}`;
}

export function parseRegisterId(
  value: string,
): { area: AssumptionArea; seq: number; registerId: string } | null {
  const match = REGISTER_ID_RE.exec(value);
  if (!match) return null;
  const area = AREA_BY_PREFIX.get(match[1]);
  if (!area) return null;
  return { area, seq: Number(match[2]), registerId: value };
}

/**
 * The next sequence for an area: one past the highest EVER allocated in that
 * area, counting every status — a superseded or rejected row still owns its
 * number, so its ID can never be handed to a different assumption.
 */
export function nextRegisterSeq(
  rows: ReadonlyArray<{ area: AssumptionArea; seq: number }>,
  area: AssumptionArea,
): number {
  let max = 0;
  for (const row of rows) {
    if (row.area === area && row.seq > max) max = row.seq;
  }
  return max + 1;
}

// ── Citations ────────────────────────────────────────────────────────────────

/** A register citation as it appears in a document: `[A:V3]`. */
export const REGISTER_CITATION_PATTERN = `\\[A:${REGISTER_ID_BODY}\\]`;

export interface RegisterCitation {
  registerId: string;
  area: AssumptionArea;
  seq: number;
}

/** Parse one citation token exactly (`[A:V3]`); anything else is null. */
export function parseRegisterCitation(token: string): RegisterCitation | null {
  const match = new RegExp(`^${REGISTER_CITATION_PATTERN}$`).exec(token.trim());
  if (!match) return null;
  const parsed = parseRegisterId(`${match[1]}${match[2]}`);
  return parsed
    ? { registerId: parsed.registerId, area: parsed.area, seq: parsed.seq }
    : null;
}

/** Every register citation in a text, in order of appearance (duplicates kept). */
export function findRegisterCitations(text: string): RegisterCitation[] {
  const found: RegisterCitation[] = [];
  for (const match of text.matchAll(
    new RegExp(REGISTER_CITATION_PATTERN, "g"),
  )) {
    const parsed = parseRegisterCitation(match[0]);
    if (parsed) found.push(parsed);
  }
  return found;
}

// ── Refusals ─────────────────────────────────────────────────────────────────

export type ModelRefusal =
  | {
      code: "invalid_transition";
      from: AssumptionStatus;
      action: AssumptionAction;
    }
  | { code: "actor_not_permitted"; action: AssumptionAction | "edit" }
  | { code: "answer_source_required" }
  | { code: "answer_required" }
  | { code: "superseded_by_required" }
  | { code: "edit_not_allowed"; status: AssumptionStatus }
  | { code: "invalid_input"; field: string };

// ── Transitions ──────────────────────────────────────────────────────────────

export type AssumptionAction =
  | "accept"
  | "reject"
  | "confirm"
  | "correct"
  | "supersede";

/**
 * Every allowed edge, keyed by action. Anything not listed is refused.
 *   proposed → open (accept) | rejected (reject)
 *   open → confirmed | corrected | superseded
 *   confirmed | corrected → corrected (re-answer) | superseded
 */
export const ASSUMPTION_TRANSITIONS: Readonly<
  Record<
    AssumptionAction,
    { from: readonly AssumptionStatus[]; to: AssumptionStatus }
  >
> = {
  accept: { from: ["proposed"], to: "open" },
  reject: { from: ["proposed"], to: "rejected" },
  confirm: { from: ["open"], to: "confirmed" },
  correct: { from: ["open", "confirmed", "corrected"], to: "corrected" },
  supersede: { from: ["open", "confirmed", "corrected"], to: "superseded" },
};

/** Statuses a row can still be edited in (before anyone has answered it). */
export const EDITABLE_STATUSES: readonly AssumptionStatus[] = [
  "proposed",
  "open",
];

export type TransitionRequest =
  | { action: "accept" }
  | { action: "reject" }
  | {
      action: "confirm";
      answerSource: string;
      answer?: string | null;
      answerFigure?: string | null;
      answerValue?: number | null;
    }
  | {
      action: "correct";
      answerSource: string;
      answer: string;
      answerFigure?: string | null;
      answerValue?: number | null;
    }
  | { action: "supersede"; supersededBy: string };

/** The columns a transition writes, in record (camelCase) form. */
export type AssumptionPatch = Partial<
  Pick<
    AssumptionRecord,
    | "status"
    | "answer"
    | "answerFigure"
    | "answerValue"
    | "answerSource"
    | "answeredByUserId"
    | "answeredAt"
    | "acceptedByUserId"
    | "acceptedAt"
    | "supersededBy"
    | "statement"
    | "whyItMatters"
    | "workingFigure"
    | "workingValue"
    | "unit"
    | "source"
    | "confidence"
    | "ownerRole"
    | "ownerName"
    | "ownerPersonId"
    | "raisedStepId"
    | "evidenceIds"
  >
>;

export type PlanResult =
  | { ok: true; patch: AssumptionPatch; to: AssumptionStatus }
  | { ok: false; refusal: ModelRefusal };

function present(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Plan one status transition. Pure: returns the columns to write, or a typed
 * refusal. aVa can never move a row — it only proposes new ones.
 */
export function planTransition(
  current: Pick<AssumptionRecord, "status" | "id">,
  request: TransitionRequest,
  actor: { kind: ActorKind; userId: string },
  now: string,
): PlanResult {
  if (actor.kind !== "person") {
    return {
      ok: false,
      refusal: { code: "actor_not_permitted", action: request.action },
    };
  }
  const edge = ASSUMPTION_TRANSITIONS[request.action];
  if (!edge.from.includes(current.status)) {
    return {
      ok: false,
      refusal: {
        code: "invalid_transition",
        from: current.status,
        action: request.action,
      },
    };
  }
  switch (request.action) {
    case "accept":
      return {
        ok: true,
        to: edge.to,
        patch: {
          status: edge.to,
          acceptedByUserId: actor.userId,
          acceptedAt: now,
        },
      };
    case "reject":
      return { ok: true, to: edge.to, patch: { status: edge.to } };
    case "confirm":
    case "correct": {
      if (!present(request.answerSource)) {
        return { ok: false, refusal: { code: "answer_source_required" } };
      }
      if (request.action === "correct" && !present(request.answer)) {
        return { ok: false, refusal: { code: "answer_required" } };
      }
      return {
        ok: true,
        to: edge.to,
        patch: {
          status: edge.to,
          answer: present(request.answer) ? request.answer.trim() : null,
          answerFigure: present(request.answerFigure)
            ? request.answerFigure.trim()
            : null,
          answerValue: request.answerValue ?? null,
          answerSource: request.answerSource.trim(),
          answeredByUserId: actor.userId,
          answeredAt: now,
        },
      };
    }
    case "supersede": {
      if (
        !present(request.supersededBy) ||
        request.supersededBy === current.id
      ) {
        return { ok: false, refusal: { code: "superseded_by_required" } };
      }
      return {
        ok: true,
        to: edge.to,
        patch: { status: edge.to, supersededBy: request.supersededBy },
      };
    }
  }
}

// ── New rows and edits ───────────────────────────────────────────────────────

export interface NewAssumptionInput {
  area: AssumptionArea;
  statement: string;
  whyItMatters?: string | null;
  workingFigure?: string | null;
  workingValue?: number | null;
  unit?: string | null;
  source: string;
  confidence: RegisterConfidence;
  ownerRole: string;
  ownerName?: string | null;
  ownerPersonId?: string | null;
  origin: AssumptionOrigin;
  raisedPhase?: number | null;
  raisedStepId?: string | null;
  evidenceIds?: string[];
  charterSectionKey?: string | null;
  charterValueRevision?: string | null;
}

/**
 * Validate a new row. aVa may only raise an `ava_proposal`, and a proposal
 * must carry the figure it proposes — a figure is the whole point of one.
 */
export function validateNewAssumption(
  input: NewAssumptionInput,
  actor: { kind: ActorKind },
): { ok: true } | { ok: false; refusal: ModelRefusal } {
  if (!(ASSUMPTION_AREAS as readonly string[]).includes(input.area)) {
    return { ok: false, refusal: { code: "invalid_input", field: "area" } };
  }
  if (!(ASSUMPTION_ORIGINS as readonly string[]).includes(input.origin)) {
    return { ok: false, refusal: { code: "invalid_input", field: "origin" } };
  }
  if ((actor.kind === "ava") !== (input.origin === "ava_proposal")) {
    return { ok: false, refusal: { code: "invalid_input", field: "origin" } };
  }
  if (!present(input.statement))
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "statement" },
    };
  if (!present(input.source))
    return { ok: false, refusal: { code: "invalid_input", field: "source" } };
  if (!present(input.ownerRole))
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "ownerRole" },
    };
  if (!isRegisterConfidence(input.confidence)) {
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "confidence" },
    };
  }
  if (input.origin === "ava_proposal" && !present(input.workingFigure)) {
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "workingFigure" },
    };
  }
  if (
    input.raisedPhase != null &&
    !(
      Number.isInteger(input.raisedPhase) &&
      input.raisedPhase >= 0 &&
      input.raisedPhase <= 5
    )
  ) {
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "raisedPhase" },
    };
  }
  return { ok: true };
}

/** The fields an edit may change. Area is fixed: it is part of the ID. */
export type AssumptionEdit = Partial<
  Pick<
    AssumptionRecord,
    | "statement"
    | "whyItMatters"
    | "workingFigure"
    | "workingValue"
    | "unit"
    | "source"
    | "confidence"
    | "ownerRole"
    | "ownerName"
    | "ownerPersonId"
    | "raisedStepId"
    | "evidenceIds"
  >
>;

const EDITABLE_FIELDS: ReadonlyArray<keyof AssumptionEdit> = [
  "statement",
  "whyItMatters",
  "workingFigure",
  "workingValue",
  "unit",
  "source",
  "confidence",
  "ownerRole",
  "ownerName",
  "ownerPersonId",
  "raisedStepId",
  "evidenceIds",
];

/** Plan an edit. Only a person edits, and only before the row is answered. */
export function planEdit(
  current: Pick<AssumptionRecord, "status">,
  edit: AssumptionEdit,
  actor: { kind: ActorKind },
): PlanResult {
  if (actor.kind !== "person") {
    return {
      ok: false,
      refusal: { code: "actor_not_permitted", action: "edit" },
    };
  }
  if (!EDITABLE_STATUSES.includes(current.status)) {
    return {
      ok: false,
      refusal: { code: "edit_not_allowed", status: current.status },
    };
  }
  const patch: AssumptionPatch = {};
  for (const field of EDITABLE_FIELDS) {
    if (edit[field] !== undefined)
      (patch as Record<string, unknown>)[field] = edit[field];
  }
  for (const field of ["statement", "source", "ownerRole"] as const) {
    if (field in patch && !present(patch[field] as string | null | undefined)) {
      return { ok: false, refusal: { code: "invalid_input", field } };
    }
  }
  if ("confidence" in patch && !isRegisterConfidence(patch.confidence)) {
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "confidence" },
    };
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, refusal: { code: "invalid_input", field: "edit" } };
  }
  return { ok: true, to: current.status, patch };
}

// ── Database row mapping ─────────────────────────────────────────────────────

/** Record field → `move_assumptions` column. */
export const COLUMN_BY_FIELD: Readonly<Record<keyof AssumptionRecord, string>> =
  {
    id: "id",
    tenantKey: "tenant_key",
    programId: "program_id",
    area: "area",
    seq: "seq",
    registerId: "register_id",
    statement: "statement",
    whyItMatters: "why_it_matters",
    workingFigure: "working_figure",
    workingValue: "working_value",
    unit: "unit",
    source: "source",
    confidence: "confidence",
    ownerRole: "owner_role",
    ownerName: "owner_name",
    ownerPersonId: "owner_person_id",
    status: "status",
    origin: "origin",
    answer: "answer",
    answerFigure: "answer_figure",
    answerValue: "answer_value",
    answerSource: "answer_source",
    answeredByUserId: "answered_by_user_id",
    answeredAt: "answered_at",
    acceptedByUserId: "accepted_by_user_id",
    acceptedAt: "accepted_at",
    supersededBy: "superseded_by",
    raisedPhase: "raised_phase",
    raisedStepId: "raised_step_id",
    evidenceIds: "evidence_ids",
    charterSectionKey: "charter_section_key",
    charterValueRevision: "charter_value_revision",
    revision: "revision",
    createdByUserId: "created_by_user_id",
    createdAt: "created_at",
    updatedAt: "updated_at",
  };

/** The select list for every register read: exactly the mapped columns. */
export const ASSUMPTION_COLUMNS = Object.values(COLUMN_BY_FIELD).join(", ");

export function patchToRow(patch: AssumptionPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    row[COLUMN_BY_FIELD[field as keyof AssumptionRecord]] = value;
  }
  return row;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // NUMERIC columns come back as strings from pg.
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

/**
 * Map a `move_assumptions` row to a record. Null when the row does not satisfy
 * the register's own vocabulary — a row the model cannot read is never
 * silently coerced into one it can.
 */
export function assumptionFromRow(
  row: Record<string, unknown>,
): AssumptionRecord | null {
  const area = row.area as AssumptionArea;
  const status = row.status as AssumptionStatus;
  const origin = row.origin as AssumptionOrigin;
  const confidence = num(row.confidence);
  const seq = num(row.seq);
  const revision = num(row.revision);
  if (
    !(ASSUMPTION_AREAS as readonly string[]).includes(area) ||
    !(ASSUMPTION_STATUSES as readonly string[]).includes(status) ||
    !(ASSUMPTION_ORIGINS as readonly string[]).includes(origin) ||
    !isRegisterConfidence(confidence) ||
    seq === null ||
    revision === null
  ) {
    return null;
  }
  const id = text(row.id);
  const tenantKey = text(row.tenant_key);
  const programId = text(row.program_id);
  const registerId = text(row.register_id);
  const statement = text(row.statement);
  const source = text(row.source);
  const ownerRole = text(row.owner_role);
  if (
    !id ||
    !tenantKey ||
    !programId ||
    !registerId ||
    !statement ||
    !source ||
    !ownerRole
  ) {
    return null;
  }
  return {
    id,
    tenantKey,
    programId,
    area,
    seq,
    registerId,
    statement,
    whyItMatters: text(row.why_it_matters),
    workingFigure: text(row.working_figure),
    workingValue: num(row.working_value),
    unit: text(row.unit),
    source,
    confidence,
    ownerRole,
    ownerName: text(row.owner_name),
    ownerPersonId: text(row.owner_person_id),
    status,
    origin,
    answer: text(row.answer),
    answerFigure: text(row.answer_figure),
    answerValue: num(row.answer_value),
    answerSource: text(row.answer_source),
    answeredByUserId: text(row.answered_by_user_id),
    answeredAt: text(row.answered_at),
    acceptedByUserId: text(row.accepted_by_user_id),
    acceptedAt: text(row.accepted_at),
    supersededBy: text(row.superseded_by),
    raisedPhase: num(row.raised_phase),
    raisedStepId: text(row.raised_step_id),
    evidenceIds: Array.isArray(row.evidence_ids)
      ? row.evidence_ids.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    charterSectionKey: text(row.charter_section_key),
    charterValueRevision: text(row.charter_value_revision),
    revision,
    createdByUserId: text(row.created_by_user_id) ?? "",
    createdAt: text(row.created_at) ?? "",
    updatedAt: text(row.updated_at) ?? "",
  };
}

// ── Projections ──────────────────────────────────────────────────────────────

/** The statuses that may reach a document or a model prompt. */
export const COUNTED_STATUSES = ["open", "confirmed", "corrected"] as const;
export type CountedStatus = (typeof COUNTED_STATUSES)[number];

export function isCountedStatus(
  status: AssumptionStatus,
): status is CountedStatus {
  return (COUNTED_STATUSES as readonly string[]).includes(status);
}

/**
 * The figure a row stands on. An open row stands on its working figure; a
 * confirmed row on its answer figure, falling back to the working figure it
 * confirmed; a corrected row ONLY on its answer figure — the working figure is
 * the one that was wrong.
 */
export function effectiveFigure(
  record: Pick<AssumptionRecord, "status" | "workingFigure" | "answerFigure">,
): string | null {
  switch (record.status) {
    case "open":
      return record.workingFigure;
    case "confirmed":
      return record.answerFigure ?? record.workingFigure;
    case "corrected":
      return record.answerFigure;
    default:
      return null;
  }
}

/**
 * The generation-facing view of a register row, or null for a row that must
 * never reach a document (proposed, rejected, superseded). Carries the owner
 * ROLE only — never a personal name.
 */
export function toApprovedAssumption(
  record: AssumptionRecord,
): ApprovedAssumption | null {
  if (!isCountedStatus(record.status)) return null;
  const answered = record.status !== "open";
  const basis =
    answered && record.answerSource
      ? `${record.source}; answered from ${record.answerSource}`
      : record.source;
  return {
    key: record.registerId,
    statement:
      record.status === "corrected" && record.answer
        ? `${record.statement} — corrected: ${record.answer}`
        : record.statement,
    basis,
    mustValidate: record.status === "open",
    registerId: record.registerId,
    figure: effectiveFigure(record),
    ownerRole: record.ownerRole,
    confidence: record.confidence,
    status: record.status,
  };
}

/**
 * The register row as a governed context object
 * (`src/lib/governance/context-corpus-policy.ts`). It is committed tenant
 * context that is NOT indexed and never claims `agent_ready`: it reaches aVa
 * only as Move-scoped prompt context, so the policy evaluates it to `warn`.
 * An unknown tenant key resolves to a non-canonical `client_key`, which the
 * policy blocks.
 */
export function toGovernedObject(
  record: AssumptionRecord,
  scope: { tenantId: string },
): GovernedObject {
  const phase: MovePhase[] =
    record.raisedPhase != null &&
    record.raisedPhase >= 0 &&
    record.raisedPhase <= 5
      ? [`P${record.raisedPhase}` as MovePhase]
      : [];
  const level: ConfidenceLevel = confidenceLevel(record.confidence);
  const sourceBasis = record.answerSource
    ? `${record.source}; answered from ${record.answerSource}`
    : record.source;
  return {
    id: `move_assumption:${record.id}`,
    tenant_id: scope.tenantId,
    client_key: canonicalTenantKey(record.tenantKey),
    object_type: "move_assumption",
    source_layer: "move",
    industry: null,
    enterprise_area: null,
    function: null,
    process_area: null,
    use_case_category: null,
    strategic_move_phase_applicability: phase,
    applicable_agents: ["nexus"],
    source_basis: sourceBasis,
    source_references: [`[A:${record.registerId}]`, ...record.evidenceIds],
    classification: "confidential",
    compliance_basis: null,
    agent_readiness_status: "committed_not_indexed",
    retrievability: "committed_not_indexed",
    confidence_level: level,
    confidence_rationale: `Register confidence ${record.confidence} of 5, status ${record.status}.`,
    cited_render_verified_at: null,
    last_reviewed_at: record.answeredAt ?? record.acceptedAt ?? null,
    owner: record.ownerRole,
    data_domains: [record.area],
    required_kpis: [],
    baseline_requirements: [],
    measurement_method: null,
    value_levers: [],
    known_failure_modes: [],
    guardrails: [
      "A working figure is an assumption, never a fact.",
      "Cite the register row as [A:<id>].",
    ],
    human_in_loop_controls: [
      "A person accepts or rejects every aVa proposal.",
      "A person answers or supersedes every row, naming the answer's source.",
    ],
    allowed_agent_actions: ["cite_register_row", "propose_assumption"],
    blocked_agent_actions: [
      "accept_assumption",
      "reject_assumption",
      "answer_assumption",
      "supersede_assumption",
      "state_working_figure_as_fact",
    ],
    provenance: {
      source_file: null,
      ingestion_run_id: null,
      parse_method: `move_assumption_register:${record.origin}`,
      committed_at: record.createdAt || null,
      indexed_at: null,
      index_name: null,
    },
    policy_version: POLICY_VERSION,
    contract_hash: null,
    created_at: record.createdAt || null,
    updated_at: record.updatedAt || null,
  };
}

/**
 * The register rows that may enter an agent's context: counted statuses only,
 * and only those whose governed object the policy does not block.
 */
export function agentContextAssumptions(
  records: ReadonlyArray<AssumptionRecord>,
  scope: { tenantId: string },
): AssumptionRecord[] {
  return records.filter(
    (record) =>
      isCountedStatus(record.status) &&
      evaluateGovernedObject(toGovernedObject(record, scope)).decision !==
        "block",
  );
}

/**
 * The register as a generation feed: the rows an agent may use (counted
 * statuses whose governed object the policy does not block), each projected
 * to the generation-facing `ApprovedAssumption` — owner ROLE only, the answer
 * figure for a confirmed or corrected row, `mustValidate` only while open.
 */
export function approvedAssumptionsFromRegister(
  records: ReadonlyArray<AssumptionRecord>,
  scope: { tenantId: string },
): ApprovedAssumption[] {
  const out: ApprovedAssumption[] = [];
  for (const record of agentContextAssumptions(records, scope)) {
    const approved = toApprovedAssumption(record);
    if (approved) out.push(approved);
  }
  return out;
}
