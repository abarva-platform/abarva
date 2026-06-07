// Grounding-scoped pattern guard — pure, deterministic, no I/O (no server-only,
// no data-plane imports) so it is unit-testable in isolation.
//
// Why this exists: pattern IDs live in two parallel namespaces —
//   • corpus_patterns   → slugs like `pat-lsh-d18-00479`  (emitted UPPERCASE: PAT-LSH-*)
//   • genome_patterns   → codes like `LSH-TMS-002`        (served by the runtime
//                          Azure Search index `lakeshore-patterns-v1`)
// A *valid* corpus id (PAT-LSH-D18-00479, a public-sector procurement pattern)
// leaked onto a Kyriba/treasury decision card whose grounding set is the
// genome / LSH-TMS namespace. A generic "reject ids absent from all tables"
// guard would NOT catch this — PAT-LSH-D18-00479 is a real id, just in the wrong
// namespace. The guard here is GROUNDING-SCOPED: each decision/card has an active
// grounding namespace, and a pattern id is valid for that card only if it belongs
// to that namespace — even if it is a perfectly valid id somewhere else.

export type PatternNamespace = 'corpus-pat-lsh' | 'genome-lsh-tms';

/**
 * Classify an emitted pattern id by its shape (case-insensitive).
 * Returns 'unknown' for ids that match no known namespace — those fail closed.
 */
export function classifyPatternId(id: string | null | undefined): PatternNamespace | 'unknown' {
  const v = (id ?? '').trim().toUpperCase();
  if (/^LSH-TMS-\d+/.test(v)) return 'genome-lsh-tms';
  if (/^PAT-LSH-/.test(v)) return 'corpus-pat-lsh';
  return 'unknown';
}

/** True iff the id belongs to the given grounding namespace (case-insensitive). */
export function isIdInNamespace(id: string | null | undefined, ns: PatternNamespace): boolean {
  return classifyPatternId(id) === ns;
}

// Terms that put a decision/card in the genome LSH-TMS (treasury/Kyriba) grounding
// namespace. Keyword-driven so it is data-derived per card, NOT a hardcoded id map.
const TMS_GROUNDING_TERMS = [
  'kyriba', 'treasury', 'tms', 'cash management', 'liquidity', 'bank connectivity',
  'bank-connectivity', 'payment', 'payments', 'bec', 'intercompany', 'covenant',
  'banking consolidation',
];

/**
 * Determine the active grounding namespace for a decision/card from its text
 * (use case name + problem statement + decision label). Treasury/Kyriba/TMS
 * decisions ground in the genome LSH-TMS namespace; everything else defaults to
 * the Lakeshore corpus pat-lsh namespace.
 */
export function groundingNamespaceForText(text: string | null | undefined): PatternNamespace {
  const t = (text ?? '').toLowerCase();
  return TMS_GROUNDING_TERMS.some((term) => t.includes(term)) ? 'genome-lsh-tms' : 'corpus-pat-lsh';
}

export interface GroundingDiagnostic {
  rejectedId: string;
  rejectedNamespace: PatternNamespace | 'unknown';
  grounding: PatternNamespace;
  reason: string;
}

/**
 * Keep only id-bearing items whose id is in the grounding namespace. Cross-
 * namespace ids (valid elsewhere) and unknown ids are dropped and reported into
 * `diagnostics`. This is the backstop guard applied at every emission point
 * (binding patterns, citations, evidence, score basis, anti-patterns).
 */
export function filterToGrounding<T>(
  items: readonly T[],
  getId: (item: T) => string,
  grounding: PatternNamespace,
  diagnostics?: GroundingDiagnostic[],
): T[] {
  const kept: T[] = [];
  for (const item of items) {
    const id = getId(item);
    const ns = classifyPatternId(id);
    if (ns === grounding) {
      kept.push(item);
      continue;
    }
    diagnostics?.push({
      rejectedId: id,
      rejectedNamespace: ns,
      grounding,
      reason: `pattern id "${id}" (${ns}) is outside this card's grounding namespace "${grounding}"`,
    });
  }
  return kept;
}

/** Split a list of raw ids into those valid for the grounding namespace and the rest. */
export function partitionIdsByGrounding(
  ids: readonly string[],
  grounding: PatternNamespace,
): { valid: string[]; rejected: string[] } {
  const valid: string[] = [];
  const rejected: string[] = [];
  for (const id of ids) {
    if (classifyPatternId(id) === grounding) valid.push(id);
    else rejected.push(id);
  }
  return { valid, rejected };
}

/** Emit grounding diagnostics to the server log (one structured line each). */
export function recordGroundingDiagnostics(context: string, diagnostics: readonly GroundingDiagnostic[]): void {
  for (const d of diagnostics) {
    console.warn(JSON.stringify({ event: 'pattern_grounding_reject', context, ...d }));
  }
}
