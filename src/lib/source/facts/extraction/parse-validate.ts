// ─────────────────────────────────────────────────────────────────────────────
// Parse-and-validate extraction — vendor documents → CANDIDATE facts → (human
// validation) → SourceEventFactInsert[] with source_method: 'parsed'.
//
// This is the counterpart to structured-map.ts. That path is deterministic and
// TRUSTED (our own template columns → facts). This path is the UNTRUSTED one: a
// vendor proposal / incumbent contract is parsed into CANDIDATE facts, each with
// a citation {doc, locator} pointing at the exact snippet a value was located in.
// A candidate is NEVER committed blind — a human confirms / edits / rejects it,
// and only confirmed/edited candidates flow to `source_event_facts`.
//
// DOCTRINE enforced here (non-negotiable):
//  1. No hallucinated numbers. A candidate value MUST be located in the source
//     document text with a locator. A fact that cannot be located + cited is not
//     proposed — it never becomes a candidate at all.
//  2. Typed against the catalog. Every candidate's fact_key resolves in
//     `factSpecByKey`; unknown / mistyped keys are rejected, not coerced. The
//     value must coerce to the catalog unit (numeric today).
//  3. Nothing enters the value math un-validated. A candidate carries a
//     `validationState`; `commitValidatedCandidates` drops everything that is not
//     `confirmed` or `edited`.
//
// LOCATION strategy: deterministic where possible. A caller extracts document
// text upstream (reusing the existing parse infrastructure — this module takes
// text + locators, never raw bytes) into LOCATED BLOCKS. A block is a piece of
// text (a paragraph, a table cell, a clause) with a locator (page/section/cell/
// clause). We match catalog facts against declared, per-fact patterns over those
// blocks — the number is READ from the block, never invented. If Claude-assisted
// location is used, it goes through the audited AI egress path (see the
// `LocatedValueProposal` seam below) and STILL yields a located block + locator
// that a human validates; the model locates, it does not invent the number.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueUnit } from "../../archetypes/types";
import { factSpecByKey, isCatalogFactKey } from "../fact-catalog";
import type {
  FactConfidence,
  FactSourceCitation,
  FactSourceMethod,
  SourceEventFactInsert,
} from "../fact-types";
import { coerceNumericCell } from "./structured-map";

/** Facts extracted from a vendor document are always stamped `parsed`. */
export const PARSED_METHOD: FactSourceMethod = "parsed";

/**
 * A piece of document text with the locator that points at it. The upstream
 * parser (see the ingestion/context-ingestion utilities) is responsible for
 * turning raw bytes (PDF / PPTX / DOCX / contract) into these blocks. This
 * module never touches bytes — it reads located text.
 */
export interface LocatedBlock {
  /** The extracted text of this block. */
  readonly text: string;
  /** Where this block lives inside the document: page/section/cell/clause. */
  readonly locator: string;
}

/** A parsed vendor document: the doc reference + its located text blocks. */
export interface ParsedDocument {
  /** The document key/name an auditor can open to verify (goes into citation.doc). */
  readonly doc: string;
  /** The located text blocks extracted upstream. */
  readonly blocks: readonly LocatedBlock[];
}

/**
 * A rule that locates one catalog fact's value in document text. `factKey` MUST
 * resolve in the catalog (asserted at parse time). `patterns` are RegExps with a
 * single capture group holding the raw value token; the first match across the
 * document's blocks proposes the candidate. `entityRef` is a fixed reference for
 * a non-event fact (e.g. the vendor id the proposal is from) — event facts leave
 * it null.
 */
export interface FactLocatorRule {
  /** The canonical catalog fact key this rule proposes a value for. */
  readonly factKey: string;
  /** Patterns whose first capture group is the raw value token, tried in order. */
  readonly patterns: readonly RegExp[];
  /**
   * Entity reference for a non-event fact (tower / vendor / app id). Ignored for
   * event-level facts (their entity_ref is always null). Required by the catalog
   * entityKind — a non-event rule without one yields a rejection, never a
   * mis-attached fact.
   */
  readonly entityRef?: string | null;
  /** Confidence to stamp on the proposed candidate. Defaults to 'low' (parsed). */
  readonly confidence?: FactConfidence;
}

/** The lifecycle state of a candidate through human validation. */
export type CandidateValidationState =
  | "proposed"
  | "confirmed"
  | "edited"
  | "rejected";

/**
 * A proposed fact awaiting human validation. It IS a SourceEventFactInsert
 * (source_method: 'parsed') plus the validation state and the raw located
 * snippet the value came from. `candidateId` is stable so a human decision can
 * refer back to a specific candidate.
 */
export interface CandidateFact {
  /** Stable id for this candidate within a parse run (fact_key + entity + locator). */
  readonly candidateId: string;
  /** The proposed insert. `source_method` is always 'parsed' and citation is set. */
  readonly insert: SourceEventFactInsert;
  /** The raw text snippet the value was located in (for the reviewer to eyeball). */
  readonly locatedSnippet: string;
  /** Where the value was located (mirrors insert.source_citation.locator). */
  readonly locator: string;
  /** The validation state. Freshly proposed candidates are always 'proposed'. */
  readonly validationState: CandidateValidationState;
}

/** A locator rule that could not become a candidate (why is captured). */
export interface RejectedCandidate {
  /** The fact key the rule targeted. */
  readonly factKey: string;
  /** Why no candidate was proposed. */
  readonly reason: string;
}

/** The outcome of parsing a document into candidate facts. */
export interface ParseProposeResult {
  /** Candidates ready for human review (all `validationState: 'proposed'`). */
  readonly candidates: CandidateFact[];
  /** Rules that could not yield a cited candidate (unknown key, unlocatable, etc). */
  readonly rejected: RejectedCandidate[];
}

/** The context every candidate/fact is scoped to. */
export interface ParseContext {
  readonly sourceEventId: string;
  readonly clientKey: string;
}

/** Units whose located value lands in `value_numeric`. Mirrors structured-map. */
const NUMERIC_UNITS: ReadonlySet<ValueUnit> = new Set<ValueUnit>([
  "usd",
  "usd_per_year",
  "pct",
  "count",
  "fte",
  "months",
  "ratio",
]);

/** Deterministic candidate id: value math never needs it, humans + audit do. */
function candidateIdFor(
  factKey: string,
  entityRef: string | null,
  locator: string,
): string {
  return `${factKey}::${entityRef ?? "-"}::${locator}`;
}

/**
 * Locate the first value for a rule across a document's blocks. Returns the raw
 * token + the block it came from, or null when no pattern matches anywhere. This
 * is the ONLY place a value is READ — never synthesised.
 */
function locateValue(
  rule: FactLocatorRule,
  doc: ParsedDocument,
): { rawToken: string; block: LocatedBlock } | null {
  for (const block of doc.blocks) {
    for (const pattern of rule.patterns) {
      // Reset lastIndex defensively in case a /g regex is passed in.
      pattern.lastIndex = 0;
      const match = pattern.exec(block.text);
      const captured = match?.[1];
      if (captured !== undefined && captured !== null && captured !== "") {
        return { rawToken: captured, block };
      }
    }
  }
  return null;
}

/**
 * Parse a vendor document into CANDIDATE facts, deterministically.
 *
 * For each locator rule: the fact_key must be in the catalog (else rejected); a
 * non-event fact must carry an entityRef (else rejected); the value must be
 * located in the document with a locator (else rejected — NOT proposed); and it
 * must coerce to the catalog unit (else rejected). Only a fully located + typed
 * value becomes a `proposed` candidate carrying its citation.
 *
 * @param doc    The parsed document (text + locators, extracted upstream).
 * @param rules  The per-fact locator rules to try against the document.
 * @param ctx    The event + tenant scope every candidate is stamped with.
 */
export function parseDocumentToCandidates(
  doc: ParsedDocument,
  rules: readonly FactLocatorRule[],
  ctx: ParseContext,
): ParseProposeResult {
  const candidates: CandidateFact[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const rule of rules) {
    // 1) Typed against the catalog — unknown/mistyped keys are rejected.
    const spec = factSpecByKey(rule.factKey);
    if (!spec || !isCatalogFactKey(rule.factKey)) {
      rejected.push({
        factKey: rule.factKey,
        reason: `fact key '${rule.factKey}' is not in the catalog`,
      });
      continue;
    }

    // 2) Only numeric-unit facts are proposable today (mirrors structured-map).
    if (!NUMERIC_UNITS.has(spec.unit)) {
      rejected.push({
        factKey: rule.factKey,
        reason: `unit '${spec.unit}' is not a supported numeric unit for parse-validate`,
      });
      continue;
    }

    // 3) Entity attachment follows the FACT's entityKind. A non-event fact needs
    //    an entity ref; an event fact must be null.
    const entityRef =
      spec.entityKind === "event" ? null : (rule.entityRef ?? null);
    if (spec.entityKind !== "event" && !entityRef) {
      rejected.push({
        factKey: rule.factKey,
        reason: `entity-level fact '${rule.factKey}' (${spec.entityKind}) requires an entityRef`,
      });
      continue;
    }

    // 4) The value MUST be located in the document. No location → no candidate.
    const located = locateValue(rule, doc);
    if (!located) {
      rejected.push({
        factKey: rule.factKey,
        reason: `no value could be located + cited for '${rule.factKey}' in '${doc.doc}'`,
      });
      continue;
    }

    // 5) The located token must coerce to the catalog unit — no guessing.
    const numeric = coerceNumericCell(located.rawToken);
    if (numeric === null) {
      rejected.push({
        factKey: rule.factKey,
        reason: `located value '${located.rawToken}' is not a valid number for unit '${spec.unit}'`,
      });
      continue;
    }

    const locator = located.block.locator;
    const citation: FactSourceCitation = {
      doc: doc.doc,
      locator,
      located_snippet: located.block.text,
      raw_token: located.rawToken,
    };

    const insert: SourceEventFactInsert = {
      source_event_id: ctx.sourceEventId,
      client_key: ctx.clientKey,
      fact_key: rule.factKey,
      entity_kind: spec.entityKind,
      entity_ref: entityRef,
      value_numeric: numeric,
      value_text: null,
      unit: spec.unit,
      source_method: PARSED_METHOD,
      source_citation: citation,
      confidence: rule.confidence ?? "low",
    };

    candidates.push({
      candidateId: candidateIdFor(rule.factKey, entityRef, locator),
      insert,
      locatedSnippet: located.block.text,
      locator,
      validationState: "proposed",
    });
  }

  return { candidates, rejected };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate → commit
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A human's decision on one candidate. `confirm` accepts the proposed value as
 * located. `edit` accepts the candidate but overrides the numeric value (a human
 * corrected a mis-parse — the citation is preserved so the edit is still tied to
 * the located evidence). `reject` drops it.
 */
export type ValidationDecision =
  | { readonly candidateId: string; readonly action: "confirm" }
  | {
      readonly candidateId: string;
      readonly action: "edit";
      readonly valueNumeric: number;
    }
  | { readonly candidateId: string; readonly action: "reject" };

/** A candidate paired with the reviewer's validation state, ready to commit. */
export interface ValidatedCandidate {
  readonly candidate: CandidateFact;
  readonly state: CandidateValidationState;
}

/** A decision that could not be applied (no such candidate). */
export interface UnappliedDecision {
  readonly candidateId: string;
  readonly reason: string;
}

/** The outcome of applying human decisions to proposed candidates. */
export interface ApplyDecisionsResult {
  /** Candidates with their post-decision state (confirmed / edited / rejected). */
  readonly validated: ValidatedCandidate[];
  /** Decisions that referenced no known candidate. */
  readonly unapplied: UnappliedDecision[];
}

/**
 * Apply human validation decisions to proposed candidates. Pure: produces the
 * validated candidates (state transitioned, value overridden for edits) plus any
 * decisions that referenced an unknown candidate. Candidates with no decision
 * remain `proposed` and are therefore NOT committed downstream.
 */
export function applyValidationDecisions(
  candidates: readonly CandidateFact[],
  decisions: readonly ValidationDecision[],
): ApplyDecisionsResult {
  const byId = new Map(candidates.map((c) => [c.candidateId, c]));
  const decidedIds = new Set<string>();
  const validated: ValidatedCandidate[] = [];
  const unapplied: UnappliedDecision[] = [];

  for (const decision of decisions) {
    const candidate = byId.get(decision.candidateId);
    if (!candidate) {
      unapplied.push({
        candidateId: decision.candidateId,
        reason: `no proposed candidate with id '${decision.candidateId}'`,
      });
      continue;
    }
    decidedIds.add(decision.candidateId);

    if (decision.action === "reject") {
      validated.push({
        candidate: { ...candidate, validationState: "rejected" },
        state: "rejected",
      });
      continue;
    }

    if (decision.action === "confirm") {
      validated.push({
        candidate: { ...candidate, validationState: "confirmed" },
        state: "confirmed",
      });
      continue;
    }

    // edit: override the numeric value, preserve the located citation.
    const editedInsert: SourceEventFactInsert = {
      ...candidate.insert,
      value_numeric: decision.valueNumeric,
      source_citation: candidate.insert.source_citation
        ? {
            ...candidate.insert.source_citation,
            edited_from: candidate.insert.value_numeric ?? null,
          }
        : candidate.insert.source_citation,
    };
    validated.push({
      candidate: {
        ...candidate,
        insert: editedInsert,
        validationState: "edited",
      },
      state: "edited",
    });
  }

  return { validated, unapplied };
}

/**
 * Select the inserts to persist from validated candidates: ONLY `confirmed` and
 * `edited`. Rejected and still-`proposed` candidates are dropped — nothing enters
 * the value math un-validated. Also re-asserts single-tenant + catalog-typing as
 * defense-in-depth before the write seam sees the rows.
 */
export function selectCommittableInserts(
  validated: readonly ValidatedCandidate[],
  ctx: ParseContext,
): SourceEventFactInsert[] {
  return validated
    .filter((v) => v.state === "confirmed" || v.state === "edited")
    .map((v) => v.candidate.insert)
    .filter((insert) => {
      // Defense-in-depth: never commit a row that drifted tenant or catalog.
      if (insert.client_key !== ctx.clientKey) return false;
      if (insert.source_event_id !== ctx.sourceEventId) return false;
      if (!isCatalogFactKey(insert.fact_key)) return false;
      if (insert.source_method !== PARSED_METHOD) return false;
      return true;
    });
}

/** A minimal write-seam contract (matches sourceFactWriteAdapter.insertFacts). */
export interface FactWriteSeam {
  insertFacts(facts: readonly SourceEventFactInsert[]): Promise<{
    readonly ok: boolean;
    readonly data?: { readonly inserted: number };
    readonly error?: string;
  }>;
}

/** The outcome of committing validated candidates. */
export interface CommitResult {
  readonly ok: boolean;
  readonly committed: number;
  readonly dropped: number;
  readonly error?: string;
}

/**
 * Commit validated candidates: pick the confirmed/edited inserts and persist
 * them through the provided write seam (the MERGED sourceFactWriteAdapter).
 * Rejected/proposed candidates are counted as `dropped` and never written. An
 * empty committable set is a no-op success.
 */
export async function commitValidatedCandidates(
  validated: readonly ValidatedCandidate[],
  ctx: ParseContext,
  writeSeam: FactWriteSeam,
): Promise<CommitResult> {
  const inserts = selectCommittableInserts(validated, ctx);
  const dropped = validated.length - inserts.length;

  if (inserts.length === 0) {
    return { ok: true, committed: 0, dropped };
  }

  const write = await writeSeam.insertFacts(inserts);
  if (!write.ok) {
    return { ok: false, committed: 0, dropped, error: write.error };
  }
  return { ok: true, committed: write.data?.inserted ?? inserts.length, dropped };
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude-assisted location seam (audited egress path)
// ─────────────────────────────────────────────────────────────────────────────
//
// Deterministic locator rules cover the common vendor-doc shapes. When a value
// is worded too variably for a regex, an OPTIONAL Claude-assisted locate step can
// PROPOSE which block + token a value lives in — but it MUST return a locator into
// an existing block, and its output STILL becomes a `proposed` candidate a human
// validates. The model LOCATES; it never supplies a number that isn't in the
// document. This runs through the audited AI egress path (callModel in
// src/lib/integrations/ai-egress) — never a raw OpenAI/Anthropic client. The
// contract below is the seam; wiring the live adapter is a follow-on slice.

/** What a Claude-assisted locate step may return for ONE fact. */
export interface LocatedValueProposal {
  readonly factKey: string;
  /** The locator of the EXISTING block the value was found in. */
  readonly locator: string;
  /** The raw value token, copied verbatim from that block's text. */
  readonly rawToken: string;
}

/**
 * Convert model-proposed locations into candidates WITHOUT trusting the model's
 * arithmetic: every proposal is re-grounded against the actual document blocks
 * (the locator must exist AND the raw token must appear in that block's text),
 * then run through the same typing/coercion path as deterministic parsing. A
 * proposal that cannot be re-grounded is rejected — the model cannot smuggle in
 * a number that is not literally present + cited.
 */
export function groundModelProposals(
  doc: ParsedDocument,
  proposals: readonly LocatedValueProposal[],
  ctx: ParseContext,
): ParseProposeResult {
  const blockByLocator = new Map(doc.blocks.map((b) => [b.locator, b]));
  const candidates: CandidateFact[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const proposal of proposals) {
    const spec = factSpecByKey(proposal.factKey);
    if (!spec) {
      rejected.push({
        factKey: proposal.factKey,
        reason: `fact key '${proposal.factKey}' is not in the catalog`,
      });
      continue;
    }
    const block = blockByLocator.get(proposal.locator);
    if (!block) {
      rejected.push({
        factKey: proposal.factKey,
        reason: `model locator '${proposal.locator}' does not exist in '${doc.doc}'`,
      });
      continue;
    }
    if (!block.text.includes(proposal.rawToken)) {
      rejected.push({
        factKey: proposal.factKey,
        reason: `model token '${proposal.rawToken}' is not present in block '${proposal.locator}' — refusing to invent`,
      });
      continue;
    }

    // Re-ground as a single-pattern deterministic locate against just this block.
    const escaped = proposal.rawToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const single = parseDocumentToCandidates(
      { doc: doc.doc, blocks: [block] },
      [
        {
          factKey: proposal.factKey,
          patterns: [new RegExp(`(${escaped})`)],
        },
      ],
      ctx,
    );
    candidates.push(...single.candidates);
    rejected.push(...single.rejected);
  }

  return { candidates, rejected };
}
