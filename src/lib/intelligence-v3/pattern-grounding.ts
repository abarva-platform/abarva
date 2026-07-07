// Pattern grounding-namespace validation — pure, deterministic, no I/O (no
// server-only, no data-plane imports) so it is unit-testable and safe to import
// from both server builders and client components.
//
// Why this exists: a pattern id can be VALID in one registry namespace yet WRONG
// for the card it is bound to. `PAT-LSH-D18-00479` is a real Lakeshore *corpus*
// slug (a public-sector procurement pattern in `corpus_patterns`), but it is not
// part of the *treasury* registry (`genome_patterns` / `lakeshore-patterns-v1`,
// ids like `LSH-TMS-002`). Binding it to a Kyriba/treasury decision card is a
// CROSS-NAMESPACE mis-binding — not a generic "does not exist" error.
//
// These helpers classify a pattern id's namespace, derive the grounding a card
// requires from its text, and FAIL CLOSED: a treasury card binds only a treasury
// pattern (or none), never an off-namespace one. Generic global existence is NOT
// sufficient — grounding namespace must match.

export type PatternGroundingNamespace = 'treasury' | 'lakeshore-corpus' | 'unknown';

/** Treasury registry ids: `LSH-TMS-002` (genome_patterns.code / lakeshore-patterns-v1). */
const TREASURY_ID = /^lsh-tms-\d+$/i;
/** General Lakeshore corpus slugs: `PAT-LSH-D18-00479` / `pat-lsh-...` (corpus_patterns). */
const LAKESHORE_CORPUS_ID = /^pat-lsh-[a-z0-9][a-z0-9-]*$/i;

/** Classify a pattern id/slug into its registry namespace. Unknown shapes fail closed. */
export function classifyPatternNamespace(
  idOrSlug: string | null | undefined,
): PatternGroundingNamespace {
  const v = (idOrSlug ?? '').trim();
  if (!v) return 'unknown';
  if (TREASURY_ID.test(v)) return 'treasury';
  if (LAKESHORE_CORPUS_ID.test(v)) return 'lakeshore-corpus';
  return 'unknown';
}

/** Terms that mark a card/use-case as requiring TREASURY grounding. */
const TREASURY_GROUNDING_TERMS = [
  'kyriba', 'treasury', 'cash', 'liquidity', 'payment', 'bank connectivity',
  'bank', 'intercompany', 'covenant', 'reconciliation', 'fx', 'hedge', 'tms',
  'payments factory', 'forecasting',
];

/**
 * Derive the grounding namespace a card/use-case requires from its text. Treasury
 * terms → 'treasury'; otherwise the general Lakeshore corpus namespace.
 */
export function requiredGroundingForText(
  text: string | null | undefined,
): PatternGroundingNamespace {
  const t = (text ?? '').toLowerCase();
  return TREASURY_GROUNDING_TERMS.some((term) => t.includes(term))
    ? 'treasury'
    : 'lakeshore-corpus';
}

/**
 * True only when the pattern id is in the namespace the card requires. Unknown
 * ids and cross-namespace ids fail closed (false). This is grounding-namespace
 * validation, NOT global existence.
 */
export function isPatternBindable(
  idOrSlug: string | null | undefined,
  required: PatternGroundingNamespace,
): boolean {
  if (required === 'unknown') return false;
  const ns = classifyPatternNamespace(idOrSlug);
  if (ns === 'unknown') return false;
  return ns === required;
}

export interface DroppedPattern {
  id: string;
  namespace: PatternGroundingNamespace;
  reason: string;
}

export interface GroundingDecision<T> {
  bound: T | null;
  boundNamespace: PatternGroundingNamespace;
  required: PatternGroundingNamespace;
  dropped: DroppedPattern[];
}

/**
 * From relevance-ranked candidates, bind the first whose namespace matches the
 * required grounding; record every cross-namespace/unknown candidate dropped.
 * Returns `bound: null` (fail closed) when no candidate matches.
 */
export function selectGroundedPattern<T>(opts: {
  required: PatternGroundingNamespace;
  candidates: readonly T[];
  idOf: (row: T) => string;
}): GroundingDecision<T> {
  const dropped: DroppedPattern[] = [];
  for (const row of opts.candidates) {
    const id = opts.idOf(row);
    const ns = classifyPatternNamespace(id);
    if (ns === opts.required && opts.required !== 'unknown') {
      return { bound: row, boundNamespace: ns, required: opts.required, dropped };
    }
    dropped.push({
      id,
      namespace: ns,
      reason: ns === 'unknown' ? 'unknown-namespace' : `cross-namespace:${ns}!=${opts.required}`,
    });
  }
  return { bound: null, boundNamespace: 'unknown', required: opts.required, dropped };
}

/** Keep only citations grounded in the required namespace (fail closed on the rest). */
export function filterCitationsToGrounding<T>(
  citations: readonly T[],
  required: PatternGroundingNamespace,
  idOf: (row: T) => string,
): T[] {
  return citations.filter((c) => isPatternBindable(idOf(c), required));
}

/** Emit a single diagnostic line when off-namespace pattern ids are dropped. */
export function warnDroppedPatterns(context: string, dropped: readonly DroppedPattern[]): void {
  if (dropped.length === 0) return;
  console.warn(
    `[pattern-grounding] ${context}: dropped ${dropped.length} off-namespace pattern id(s): ` +
      dropped.map((d) => `${d.id}(${d.namespace})`).join(', '),
  );
}
