// Function-identity spine — resolve a Move to its `(industryKey, functionKey)`.
//
// AbarVa carries 36 curated Domain Function Packs keyed by
// `(industryKey, functionKey)` (src/lib/programs/expert-kernel/domain/). They
// are fully built but UNREACHABLE: a Move (`engagements` row) carries no
// resolvable function key. `engagements.industry_code` holds RETAIL /
// HEALTHCARE_IDN / FINSERV; `engagements.function_code` holds only a 3-value
// office bucket (FRONT_OFFICE / MIDDLE_OFFICE / BACK_OFFICE) — neither maps to
// a Function Pack key.
//
// This module is the missing bridge. It does three things:
//
//   1. `industryKeyForCode`  — maps an `industry_code` to a FunctionPackIndustryKey.
//   2. `classifyFunctionKey` — deterministically scores a Move's brief text
//      against every catalogued pack for that industry and picks the best
//      match, or returns `null` honestly when nothing clears the floor.
//   3. `resolveMoveFunctionIdentity` — reads the function key that origination
//      persisted into `engagements.charter` and reunites it with the industry.
//
// The classifier is PURE and DETERMINISTIC: same brief text → same key, no I/O,
// no model call, no randomness. It NEVER fabricates a key — an honest "no
// confident match" (`null`) is required over a guess. This mirrors the
// no-fabrication discipline the Function Packs and the expert kernel hold to.

import {
  listFunctionPackCoverage,
  resolveFunctionPack,
} from "./expert-kernel/domain/function-pack-registry";
import type {
  FunctionPack,
  FunctionPackIndustryKey,
} from "./expert-kernel/domain/function-pack-types";

// ─────────────────────────────────────────────────────────────────────────────
// Part 1 — industry-code → industryKey
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical `engagements.industry_code` values, plus the known aliases an
 * older row or a hand-typed code might carry. Keys are matched case-insensitively
 * and after stripping surrounding whitespace, so `retail`, ` RETAIL `, and
 * `Retail` all resolve. Anything not listed resolves to `null` — never guessed.
 */
const INDUSTRY_CODE_TO_KEY: ReadonlyArray<
  readonly [string, FunctionPackIndustryKey]
> = [
  // Retail — canonical + aliases.
  ["retail", "retail"],
  ["retail_cpg", "retail"],
  // Healthcare provider — canonical + aliases. The provider taxonomy backs the
  // healthcare-provider packs; `healthcare_idn` is the production code.
  ["healthcare_idn", "healthcare-provider"],
  ["healthcare", "healthcare-provider"],
  ["healthcare_provider", "healthcare-provider"],
  ["healthcare-provider", "healthcare-provider"],
  ["provider", "healthcare-provider"],
  // Financial services — canonical + aliases.
  ["finserv", "financial-services"],
  ["financial_services", "financial-services"],
  ["financial-services", "financial-services"],
  ["fsi", "financial-services"],
  // Airline / global network carrier — canonical + aliases. The
  // `global_network_airline` production code backs the airline IROPS pack.
  ["global_network_airline", "airline"],
  ["airline", "airline"],
  ["air_transport", "airline"],
  ["aviation", "airline"],
];

/**
 * Map an `engagements.industry_code` to the `FunctionPackIndustryKey` the
 * Function Pack registry is keyed by.
 *
 * `RETAIL` → `'retail'`, `HEALTHCARE_IDN` → `'healthcare-provider'`,
 * `FINSERV` → `'financial-services'`. Tolerant of case and surrounding
 * whitespace, and of the known aliases above. Returns `null` for an unknown
 * code — the honest signal that this Move cannot bind a pack by industry.
 */
export function industryKeyForCode(
  industryCode: string | null | undefined,
): FunctionPackIndustryKey | null {
  const normalized = industryCode?.trim().toLowerCase();
  if (!normalized) return null;
  for (const [code, key] of INDUSTRY_CODE_TO_KEY) {
    if (code === normalized) return key;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Part 2 — the deterministic function classifier
// ─────────────────────────────────────────────────────────────────────────────

/** The outcome of classifying a brief against an industry's Function Packs. */
export interface FunctionClassification {
  /** The catalogued function key the brief best matched. */
  functionKey: string;
  /**
   * A 0–1 confidence score. It is the winning pack's normalised signal-overlap
   * score — a relative, deterministic measure, not a probability. Higher means
   * a stronger and less ambiguous match against the pack's signal text.
   */
  confidence: number;
}

/**
 * The confidence floor. A classification scoring below this is discarded and
 * the classifier returns `null` — "no confident match" — rather than binding a
 * weak pack. Tuned so a brief that genuinely names a function's terms clears
 * it, while a vague or empty brief does not. A single source of truth so the
 * tests assert against the same number the classifier uses.
 */
export const FUNCTION_CLASSIFY_CONFIDENCE_FLOOR = 0.18;

/**
 * The minimum margin the top candidate must beat the runner-up by. Two packs
 * scoring near-identically means the brief did not actually disambiguate
 * between them — that is an honest `null`, not a coin-flip pick.
 */
const FUNCTION_CLASSIFY_MARGIN_FLOOR = 0.05;

/** English stop words — stripped before tokenising so they never score. */
const STOP_WORDS: ReadonlySet<string> = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "by",
  "at",
  "as",
  "is",
  "are",
  "be",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "we",
  "our",
  "us",
  "their",
  "they",
  "will",
  "can",
  "how",
  "what",
  "when",
  "from",
  "into",
  "over",
  "across",
  "about",
  "than",
  "then",
  "so",
  "but",
  "not",
  "no",
  "all",
  "any",
  "each",
  "more",
  "most",
  "such",
  "per",
  "via",
  "up",
  "out",
  "new",
  "use",
  "using",
  "used",
  "make",
  "made",
  "get",
  "got",
  "has",
  "have",
  "do",
  "does",
  "should",
  "would",
  "could",
  "may",
  "might",
  "must",
  "one",
  "two",
  "also",
  "into",
  "plan",
  "help",
  "need",
  "want",
  "work",
  "team",
  "program",
  "move",
  "project",
  "initiative",
  "business",
  "process",
  "data",
  "system",
  "systems",
  "improve",
  "reduce",
  "increase",
  "better",
  "across",
]);

/**
 * Tokenise free text into a multiset of lower-cased word tokens (length ≥ 3,
 * not a stop word). A multiset (Map of token → count) so repeated mentions of a
 * function's vocabulary in the brief weigh more, mirroring how an operator
 * reading the brief would notice the emphasis.
 */
function tokenize(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

/**
 * Assemble a pack's "signal text" — the curated vocabulary the classifier
 * scores a brief against. Drawn from the layers the task names: the function
 * label, the operator summary, the canonical terms of art, and the pain-theme
 * names. These are the words an operator of this exact function would use, so a
 * brief that genuinely concerns the function overlaps with them.
 *
 * The function label and canonical terms are the strongest signal, so they are
 * repeated to weight them above the looser prose of the summary.
 */
function packSignalText(pack: FunctionPack): string {
  // P2-4: weight functionLabel 4x. The function label is the operator's
  // strongest single signal of intent — a brief that says "customer care"
  // almost always means the customer-care function. Weighting it more
  // heavily pushes obvious matches further above the confidence floor and
  // reduces the runner-up margin failures the synthetic pilot rehearsal
  // surfaced (Northwind brief scored 0.279, just above the 0.18 floor).
  const labelSignal = `${pack.functionLabel} ${pack.functionLabel} ${pack.functionLabel} ${pack.functionLabel}`;
  const termSignal = pack.vocabulary.canonicalTerms
    .map((t) => `${t.term} ${t.term}`)
    .join(" ");
  const painSignal = pack.painThemes.map((p) => p.name).join(" ");
  return `${labelSignal} ${pack.summary} ${termSignal} ${painSignal}`;
}

/**
 * Score a brief's tokens against a pack's signal tokens.
 *
 * The score is the share of the brief's token weight that is matched by the
 * pack's signal vocabulary — i.e. how much of what the brief talks about this
 * function actually covers. Each matched brief token contributes its brief
 * frequency, capped by the pack's signal frequency for that token so a single
 * heavily-repeated pack term cannot dominate. Normalised by the brief's total
 * token weight, giving a 0–1 score that does not reward longer briefs.
 */
function scoreBrief(
  briefTokens: Map<string, number>,
  signalTokens: Map<string, number>,
): number {
  let totalBriefWeight = 0;
  let matchedWeight = 0;
  for (const [token, briefCount] of briefTokens) {
    totalBriefWeight += briefCount;
    const signalCount = signalTokens.get(token);
    if (signalCount) {
      matchedWeight += Math.min(briefCount, signalCount);
    }
  }
  if (totalBriefWeight === 0) return 0;
  return matchedWeight / totalBriefWeight;
}

/**
 * Deterministically classify a Move's brief text to a Function Pack function
 * key within a given industry.
 *
 * `briefText` is the concatenation of a Move's title / objective / topic /
 * brief. The classifier resolves every pack catalogued for `industryKey`,
 * scores `briefText` against each pack's signal vocabulary, and picks the
 * highest score.
 *
 * It returns `null` — honest "no confident match" — when:
 *   - the brief is empty or produces no scorable tokens;
 *   - the best score does not clear `FUNCTION_CLASSIFY_CONFIDENCE_FLOOR`;
 *   - the best score does not beat the runner-up by
 *     `FUNCTION_CLASSIFY_MARGIN_FLOOR` (the brief did not disambiguate).
 *
 * It NEVER fabricates a key. Pure and deterministic.
 */
export function classifyFunctionKey(
  industryKey: FunctionPackIndustryKey,
  briefText: string | null | undefined,
): FunctionClassification | null {
  const briefTokens = tokenize(briefText ?? "");
  if (briefTokens.size === 0) return null;

  const coverage = listFunctionPackCoverage().filter(
    (entry) => entry.industryKey === industryKey,
  );
  if (coverage.length === 0) return null;

  const scored: { functionKey: string; score: number }[] = [];
  for (const entry of coverage) {
    const pack = resolveFunctionPack(industryKey, entry.functionKey);
    if (!pack) continue;
    const signalTokens = tokenize(packSignalText(pack));
    scored.push({
      functionKey: String(entry.functionKey),
      score: scoreBrief(briefTokens, signalTokens),
    });
  }
  if (scored.length === 0) return null;

  // Deterministic ordering: score desc, then functionKey asc as a stable
  // tie-break so the same brief always yields the same pick.
  scored.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : a.functionKey.localeCompare(b.functionKey),
  );

  const top = scored[0];
  const runnerUp = scored[1];

  if (top.score < FUNCTION_CLASSIFY_CONFIDENCE_FLOOR) return null;
  if (runnerUp && top.score - runnerUp.score < FUNCTION_CLASSIFY_MARGIN_FLOOR) {
    return null;
  }

  // Clamp to a clean 0–1 confidence; round to keep the value stable.
  const confidence = Math.min(1, Math.round(top.score * 1000) / 1000);
  return { functionKey: top.functionKey, confidence };
}

// ─────────────────────────────────────────────────────────────────────────────
// Part 3 — resolve a stored Move to its full function identity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `(industryKey, functionKey)` spine a Move resolves to — the key a
 * surface uses to call `resolveFunctionPack`.
 */
export interface MoveFunctionIdentity {
  industryKey: FunctionPackIndustryKey;
  functionKey: string;
}

/**
 * The key the origination path writes the classified function key under inside
 * `engagements.charter`. One source of truth for the writer and the reader.
 *
 * As of the `function_pack_key` column promotion this is the FALLBACK source —
 * the first-class `engagements.function_pack_key` column is preferred. The
 * charter key is still dual-written by origination so a rollback to the
 * pre-column code is harmless; retiring it is a separate future cleanup.
 */
export const CHARTER_FUNCTION_PACK_KEY = "functionPackKey";

/**
 * The key the classifier confidence is stored under inside `engagements.charter`.
 * Like `CHARTER_FUNCTION_PACK_KEY`, this is the fallback source — the
 * first-class `engagements.function_pack_confidence` column is preferred.
 */
export const CHARTER_FUNCTION_PACK_CONFIDENCE_KEY = "functionPackConfidence";

/** Narrow an unknown value to a non-empty trimmed string, or `null`. */
function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Narrow an unknown charter value to a plain object with a string field. */
function readCharterString(charter: unknown, field: string): string | null {
  if (!charter || typeof charter !== "object") return null;
  return readNonEmptyString((charter as Record<string, unknown>)[field]);
}

/**
 * Resolve the function-pack key for a stored Move, preferring the first-class
 * `engagements.function_pack_key` column and falling back to the legacy
 * `charter.functionPackKey` JSONB value.
 *
 * The column is the source of truth post-migration; the charter fallback keeps
 * the read path correct (a) in the deploy window before the backfill migration
 * is applied and (b) for any row the backfill missed. The two are kept
 * coherent — origination dual-writes both — so the precedence is a safety net,
 * not a divergence.
 *
 * Exported so a loader that only has one of the two sources can resolve a key
 * the same way the identity resolver does.
 */
export function resolveFunctionPackKey(input: {
  functionPackKey?: string | null | undefined;
  charter?: unknown;
}): string | null {
  return (
    readNonEmptyString(input.functionPackKey) ??
    readCharterString(input.charter, CHARTER_FUNCTION_PACK_KEY)
  );
}

/**
 * Resolve a stored Move to its full `(industryKey, functionKey)` identity.
 *
 * `industryCode` is the `engagements.industry_code` column. The function key is
 * sourced with column-first precedence: the first-class
 * `engagements.function_pack_key` column when present, otherwise the legacy
 * `charter.functionPackKey` JSONB value the origination path dual-writes. A
 * caller holding only the charter (e.g. a row read before the column existed)
 * still resolves via the fallback.
 *
 * Returns `null` when either the industry code does not resolve or neither
 * source carries a function key — the honest signal that this Move cannot bind
 * a Function Pack and the caller should fall back to general reasoning.
 */
export function resolveMoveFunctionIdentity(input: {
  /**
   * The Move's industry code — accepted in either camelCase (`industryCode`)
   * or snake_case (`industry_code`). Other call sites in the codebase use
   * either shape (see `MoveBusinessCaseInput`); this resolver tolerates both.
   */
  industryCode?: string | null | undefined;
  industry_code?: string | null | undefined;
  /**
   * The `engagements.function_pack_key` column — the preferred source. Omit or
   * pass `null` for a row read before the column existed; the charter fallback
   * then resolves the key. Accepted in either camelCase or snake_case.
   */
  functionPackKey?: string | null | undefined;
  function_pack_key?: string | null | undefined;
  /** The `engagements.charter` JSONB — the fallback function-key source. */
  charter: unknown;
}): MoveFunctionIdentity | null {
  const industryCode = input.industryCode ?? input.industry_code;
  const industryKey = industryKeyForCode(industryCode);
  if (!industryKey) return null;

  const functionKey = resolveFunctionPackKey({
    functionPackKey: input.functionPackKey ?? input.function_pack_key,
    charter: input.charter,
  });
  if (!functionKey) return null;

  return { industryKey, functionKey };
}
