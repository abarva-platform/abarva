// outputValidator · F0.3 of Programs Strict Completion v1.2
//
// Post-hoc, telemetry-only validator. Runs against the FULL streamed
// response after it has reached the user — does NOT block streaming.
// Pre-stream validation requires buffering, which kills streaming.
// The structural integrity mechanism for action-claims is F0.4 tool-use;
// this module is alarm telemetry that catches the four classes of
// reasoning-layer drift (uncited patterns, fabricated numbers, undisclosed
// fallbacks, rigid-scope refusals) plus malformed citation tags from F0.3.
//
// Per kickoff §4 F0.3: action-claim violations are NOT in this validator
// because tool-use makes them structurally impossible. The validator
// flags the other classes as a regression alarm.

export type ViolationType =
  | 'uncited-pattern'
  | 'fabricated-number'
  | 'undisclosed-fallback'
  | 'rigid-scope-refusal'
  | 'malformed-citation-tag';

export interface Violation {
  type: ViolationType;
  detail: string;
  /** Character span in the output text (inclusive start, exclusive end). */
  span?: [number, number];
}

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
}

export interface ValidationContext {
  /** Pattern IDs that were actually present in retrieval. Used to flag uncited claims. */
  retrievedPatternIds?: ReadonlyArray<string>;
  /** Specific dollar amounts / percentages present in retrieval context. */
  retrievedNumbers?: ReadonlyArray<string>;
  /** When false, the validator skips fabricated-number checks (no retrieval ran). */
  hasRetrieval?: boolean;
}

// ── Regexes ────────────────────────────────────────────────────────────────────

// Pattern IDs the agent might cite. Mirrors markdownTokens grammar.
const PATTERN_ID_GRAMMAR = /\b(PAT(?:-[A-Z]+)+-\d+|T\d+-[A-Z]+\d+)\b/g;

// Citation tag grammar. Anything that looks like a tag but doesn't match
// the canonical [head: detail] form is flagged as malformed.
const CANONICAL_CITATION_TAG =
  /\[(user-context|tenant-specific|PAT(?:-[A-Z]+)+-\d+):\s*[^\]]+\]/g;

// Heuristic for tag-shaped fragments the LLM emitted but malformed.
// Catches case variants ([USER-CONTEXT: ...]), em-dashes ([user-context — ...]),
// missing colons ([user-context based on ...]).
const TAG_LIKE_FRAGMENT =
  /\[\s*(?:USER-CONTEXT|TENANT-SPECIFIC|user[-\s]context|tenant[-\s]specific|PAT[-_][A-Z\-_]+\d*)\b[^\]]{0,200}\]/gi;

// Specific dollar amounts and percentages. We only flag the ones NOT
// present in retrieval context (when retrieval ran). Percentages above
// 100 and obvious approximations ("about 30%", "~14%") are out of scope —
// the heuristic is a regression alarm, not a strict gate.
const DOLLAR_AMOUNT = /\$\s?\d{1,3}(?:[,]\d{3})*(?:\.\d+)?\s?(?:M|B|K)?\b/g;
const PERCENTAGE = /\b\d{1,3}(?:\.\d+)?\s?%/g;

// Phrases that signal rigid scope refusal. Matched case-insensitively.
const RIGID_REFUSAL_PHRASES = [
  /\boutside my (?:lane|scope|remit|purview)\b/i,
  /\bI can only discuss\b/i,
  /\bI(?:'m| am) not (?:able to|allowed to) discuss\b/i,
  /\bthat(?:'s| is) not (?:something|a topic) I (?:can|cover)\b/i,
];

// Phrases that signal a layer disclosure (user-context, tenant-specific,
// pattern citation, or the canonical Layer-3 preface).
const DISCLOSURE_PHRASES = [
  /\[(?:user-context|tenant-specific|PAT(?:-[A-Z]+)+-\d+):/i,
  /\bDrawing on general practice \(not AbarVa-specific\):/,
  /\bbased on (?:your|the user's|David's|the team's)\b/i,
];

const REDIRECT_PHRASES = [
  /\bbut you'?re not here for\b/i,
  /\bhere'?s what'?s pressing\b/i,
  /\bthat said,?\b/i,
  /\bmore relevant to your portfolio\b/i,
  /\bcoming back to\b/i,
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function findAll(regex: RegExp, text: string): Array<{ value: string; index: number }> {
  const matches: Array<{ value: string; index: number }> = [];
  let m: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ value: m[0], index: m.index });
  }
  return matches;
}

function violation(
  type: ViolationType,
  detail: string,
  match: { value: string; index: number },
): Violation {
  return {
    type,
    detail,
    span: [match.index, match.index + match.value.length],
  };
}

// ── Individual checks ─────────────────────────────────────────────────────────

function checkUncitedPatterns(text: string, ctx: ValidationContext): Violation[] {
  if (!ctx.retrievedPatternIds || ctx.retrievedPatternIds.length === 0) {
    // If we don't know what was retrieved, we can't flag uncited patterns.
    // The validator's job is regression alarm, not strict gating.
    return [];
  }
  const retrieved = new Set(ctx.retrievedPatternIds);
  const matches = findAll(PATTERN_ID_GRAMMAR, text);
  const out: Violation[] = [];
  for (const match of matches) {
    if (!retrieved.has(match.value)) {
      out.push(
        violation(
          'uncited-pattern',
          `Pattern ${match.value} cited in response but not present in retrieval results`,
          match,
        ),
      );
    }
  }
  return out;
}

function checkFabricatedNumbers(text: string, ctx: ValidationContext): Violation[] {
  if (!ctx.hasRetrieval || !ctx.retrievedNumbers) return [];
  const retrieved = new Set(ctx.retrievedNumbers);
  const out: Violation[] = [];
  for (const match of findAll(DOLLAR_AMOUNT, text)) {
    const normalized = match.value.replace(/\s/g, '');
    if (!retrieved.has(match.value) && !retrieved.has(normalized)) {
      out.push(
        violation(
          'fabricated-number',
          `Specific dollar amount ${match.value} not present in retrieval context`,
          match,
        ),
      );
    }
  }
  for (const match of findAll(PERCENTAGE, text)) {
    const normalized = match.value.replace(/\s/g, '');
    if (!retrieved.has(match.value) && !retrieved.has(normalized)) {
      out.push(
        violation(
          'fabricated-number',
          `Specific percentage ${match.value} not present in retrieval context`,
          match,
        ),
      );
    }
  }
  return out;
}

function checkUndisclosedFallback(text: string): Violation[] {
  // Heuristic: response makes confident claims (specific numbers or
  // pattern IDs) without ANY disclosure phrase. Catches "X costs $50M
  // and is best practice" with no citation. False positives expected;
  // this is alarm telemetry, not a gate.
  const trimmed = text.trim();
  if (trimmed.length < 80) return []; // too short to assess

  const hasDisclosure = DISCLOSURE_PHRASES.some((rx) => rx.test(trimmed));
  if (hasDisclosure) return [];

  const numbers = findAll(DOLLAR_AMOUNT, trimmed).concat(findAll(PERCENTAGE, trimmed));
  const patterns = findAll(PATTERN_ID_GRAMMAR, trimmed);
  if (numbers.length === 0 && patterns.length === 0) return [];

  return [
    {
      type: 'undisclosed-fallback',
      detail: 'Response cites specific numbers or pattern IDs without any layer disclosure',
    },
  ];
}

function checkRigidScopeRefusal(text: string): Violation[] {
  const out: Violation[] = [];
  for (const rx of RIGID_REFUSAL_PHRASES) {
    rx.lastIndex = 0;
    const m = rx.exec(text);
    if (!m) continue;
    // Soft-pass when a redirect phrase is also present — the policy
    // allows refusal-with-redirect; the violation is rigid refusal.
    const hasRedirect = REDIRECT_PHRASES.some((r) => r.test(text));
    if (hasRedirect) continue;
    out.push({
      type: 'rigid-scope-refusal',
      detail: `Response uses rigid-refusal phrase "${m[0]}" without offering a useful redirect`,
      span: [m.index, m.index + m[0].length],
    });
  }
  return out;
}

function checkMalformedCitationTags(text: string): Violation[] {
  const canonicalSpans = findAll(CANONICAL_CITATION_TAG, text).map((m) => ({
    start: m.index,
    end: m.index + m.value.length,
  }));
  const tagLike = findAll(TAG_LIKE_FRAGMENT, text);
  const out: Violation[] = [];
  for (const m of tagLike) {
    const overlapsCanonical = canonicalSpans.some(
      (span) => m.index >= span.start && m.index < span.end,
    );
    if (overlapsCanonical) continue;
    out.push(
      violation(
        'malformed-citation-tag',
        `Citation-tag-shaped fragment "${m.value}" doesn't match canonical [head: detail] grammar`,
        m,
      ),
    );
  }
  return out;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validate an agent's complete response after streaming. Pure function;
 * the caller is responsible for persisting violations to the
 * `synthesis_violations` table for telemetry.
 */
export function validateSynthesisOutput(
  output: string,
  context: ValidationContext = {},
): ValidationResult {
  const violations: Violation[] = [
    ...checkUncitedPatterns(output, context),
    ...checkFabricatedNumbers(output, context),
    ...checkUndisclosedFallback(output),
    ...checkRigidScopeRefusal(output),
    ...checkMalformedCitationTags(output),
  ];
  return {
    valid: violations.length === 0,
    violations,
  };
}
