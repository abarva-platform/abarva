// Shared helpers for Sentinel-surface tools (search_patterns,
// pattern_neighborhood, evidence_lookup, validate_synthesis).
//
// Per the broker boundary doc, app-tier code (including tools under
// src/lib/agent/**) MUST NOT directly import EnterpriseDataRoom
// seeds, vector stores, or graph stores. Tenant-scoped reads route
// through SentinelBrokerAdapter; corpus-wide pattern manifest reads
// are allowed because the manifest is static doctrine, not tenant
// data.
//
// Vector retrieval is not yet live (see GRAPH_VECTOR_READINESS.md +
// SESSION_BRIEF_INTELLIGENCE.md Open Decision #2). Until the broker
// contract gains a vectorQuery field and pgvector retrieval is wired,
// these tools score patterns by keyword token overlap. The scoring
// helper is the temporary substitute — swap to a real broker call
// when EnterpriseAgentContextRequest grows vector support.

import { getActiveClientRow } from '@/lib/active-client';
import type { ClientKey } from '@/lib/client-config';
import { brokerTenantKey, canonicalTenantKey } from '@/lib/tenant/aliases';
import {
  getPatternManifestEntries,
  getPatternManifestEntry,
  type PatternManifestEntry,
} from '@/lib/intelligence/pattern-manifest';

export interface SentinelToolTenantContext {
  /**
   * Tenant key in the BROKER vocabulary (i.e. the
   * EnterpriseDataRoom.tenantKey form). Apex carries a dash split:
   * the app's ClientKey is `'apexretail'` (no dash) but the data room
   * keys it `'apex-retail'`. Other tenants pass through unchanged. See
   * `project_apex_tenant_key_split.md` in user memory for the
   * back-story.
   */
  tenantKey: string;
  clientId: string;
  industryCode: string | null;
}

/**
 * Map an app-tier ClientKey to the broker-side tenant key used by
 * EnterpriseDataRoom + buildEnterpriseAgentContextBundle.
 *
 * Pure function so it can be unit-tested without a live session.
 * Exported so future Sentinel-adjacent tools can reuse the same
 * boundary translation instead of duplicating the case statement.
 */
export function clientKeyToBrokerTenantKey(clientKey: ClientKey | string): string {
  // Apex and First Capital are the tenants where the app and the
  // data-room disagree. The app's canonical ClientKeys are legacy
  // compatibility keys (`apexretail`, `arcturus`), while the broker
  // data rooms use public tenant slugs (`apex-retail`,
  // `first-capital`). Without this mapping, the broker returns an
  // unknown_tenant blocked bundle and Sentinel tools go silent.
  //
  // NOTE: This function targets the EnterpriseDataRoom in-memory
  // substrate that Sentinel tools read from. Codex's newer
  // `data_inventory_*` tables use a different key for Meridian
  // (`meridian-health`); see `clientKeyToInventorySubstrateKey`
  // for that mapping.
  return brokerTenantKey(clientKey) ?? clientKey;
}

/**
 * Map an app-tier ClientKey to the tenant_key used in the
 * `data_inventory_*` Postgres substrate (Codex's 2026-04-30 data
 * layer). Differs from `clientKeyToBrokerTenantKey` only for
 * Meridian and First Capital, where the substrate keys differ from
 * the app-facing client key:
 *   - app `'apexretail'` → substrate `'apex-retail'`
 *   - app `'meridian'`   → substrate `'meridian-health'`
 *   - app `'arcturus'`   → substrate `'first-capital'`
 */
export function clientKeyToInventorySubstrateKey(
  clientKey: ClientKey | string,
): string {
  return canonicalTenantKey(clientKey);
}

/**
 * Resolve the active client row and return the broker-shaped tenant
 * context. Returns null when no client is active — the tool handler
 * surfaces this as a recoverable error rather than throwing.
 */
export async function resolveSentinelTenant(): Promise<SentinelToolTenantContext | null> {
  const client = await getActiveClientRow().catch(() => null);
  if (!client) return null;
  return {
    tenantKey: clientKeyToBrokerTenantKey(client.key),
    clientId: client.id,
    industryCode: client.industry_code,
  };
}

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'and',
  'or',
  'but',
  'if',
  'as',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
  'about',
  'from',
  'this',
  'that',
  'these',
  'those',
  'what',
  'which',
  'show',
  'me',
  'find',
  'lookup',
  'look',
  'search',
]);

/** Tokenize a string for keyword-overlap scoring. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length > 1 && !STOPWORDS.has(tok));
}

/**
 * Build the search corpus for a manifest pattern — name, descriptions,
 * observations, detection signals, trigger symptoms.
 */
function patternHaystack(pattern: PatternManifestEntry): string {
  return [
    pattern.name,
    pattern.shortDescription ?? '',
    pattern.longDescription ?? '',
    ...pattern.observations,
    ...pattern.triggerSymptoms,
    ...pattern.detectionSignals,
    ...pattern.diagnosticQuestions,
    ...pattern.interventions,
    pattern.category ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

export interface PatternScore {
  pattern: PatternManifestEntry;
  score: number;
}

/**
 * Score patterns by keyword overlap with the query. Used as a
 * deterministic stand-in for vector similarity until the broker
 * contract grows a vectorQuery field and pgvector retrieval is live.
 *
 * ---------------------------------------------------------------
 * RETIRED, NOT REPAIRED — decided 2026-09-19, with measurements.
 * ---------------------------------------------------------------
 *
 * The known complaint is that `haystack.includes(tok)` matches inside
 * unrelated words, so `ai` hits `available`, `maintain`, `detail`. The
 * obvious repair is word-boundary matching. It was measured over the
 * real 3,569-entry manifest before being rejected, and the numbers say
 * it is not a repair:
 *
 *   query 'AI use case portfolio', entries scoring above zero
 *     substring         3,524 of 3,569   (98.7%)
 *     word boundary     3,200 of 3,569   (89.7%)
 *     boundary + stem   3,226 of 3,569   (90.4%)
 *
 * Returning 90% of the corpus instead of 99% is not retrieval. The
 * cause is not the matching strategy but term frequency: on an exact
 * word-boundary basis `governance` still appears in 2,260 entries
 * (63%), `operating` in 2,283, `risk` in 2,512. A binary token-overlap
 * score over a corpus like that has no discriminating power however
 * the tokens are matched.
 *
 * And the repair has a real cost, which is what item 35's standing rule
 * asks to be measured on an acronym corpus rather than assumed. Share
 * of substring's hits that word-boundary matching keeps:
 *
 *     ml 6%   ·   ai 32%   ·   erp 32%   ·   sla 56%   ·   kpi 69%
 *     sow 93%   ·   crm 100%   ·   rfp 100%
 *
 * So the tempting fix costs most of the recall on the shortest
 * acronyms and buys a result set that is still almost the whole
 * corpus. The tools' own stated plan — pgvector retrieval through the
 * broker — remains the answer, and this stays a stand-in until it
 * lands. Do not re-derive the boundary-matching fix; it was tried on
 * paper and these are its numbers.
 *
 * What DID change is honesty at the call site, not retrieval: see
 * `topScoreTieCount`. Nothing about scoring or ordering moved, so the
 * documenting case in __tests__/_shared.test.ts still holds and must
 * still fail on the day word-boundary matching actually arrives.
 */
export function scorePatternsByKeyword(
  query: string,
  patterns: PatternManifestEntry[],
): PatternScore[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return patterns
    .map((pattern) => {
      const haystack = patternHaystack(pattern);
      let hits = 0;
      for (const tok of tokens) {
        if (haystack.includes(tok)) hits += 1;
      }
      return { pattern, score: hits };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * How many entries share the top score.
 *
 * The score is a count of query tokens present, so a four-token query
 * tops out at 4 and, on the real corpus, 72 entries reach it. The sort
 * is stable, so `.slice(0, limit)` then returns the first few of those
 * 72 in manifest insertion order. Which patterns the advisor is shown
 * is decided by file order, and it is stable enough across calls to
 * look deliberate.
 *
 * That is the user-visible harm, and it is independent of the matching
 * strategy — word-boundary matching still leaves 65 tied at the top for
 * the same query. So rather than change what is retrieved, the caller
 * is told when the list it is holding is an arbitrary slice of a tie,
 * and can say so instead of presenting it as a ranking.
 */
export function topScoreTieCount(scored: PatternScore[]): number {
  if (scored.length === 0) return 0;
  const top = scored[0].score;
  return scored.filter((entry) => entry.score === top).length;
}

/**
 * A caveat for the caller when the returned slice cannot be a ranking,
 * or `null` when the top score genuinely separates the results.
 */
export function describeRankingTie(
  scored: PatternScore[],
  returned: number,
): string | null {
  const tied = topScoreTieCount(scored);
  if (tied <= returned) return null;

  return (
    `Keyword scoring put ${tied} corpus patterns at the same top score of ${scored[0].score}, ` +
    `and only ${returned} are returned — which ${returned} is decided by corpus order, not by ` +
    'relevance. Treat these as examples of the shape the query matches, not as the closest ' +
    'matches, and say so rather than presenting them as ranked. Vector retrieval is not live ' +
    'yet; keyword overlap is a stand-in.'
  );
}

const SCOPE_KEYWORDS: Record<
  Exclude<SentinelSearchScope, 'all'>,
  ReadonlyArray<string>
> = {
  sourcing: ['sourcing', 'procurement', 'vendor', 'contract', 'category'],
  lifecycle: ['lifecycle', 'phase', 'gate', 'cadence'],
  programs: ['program', 'transformation', 'modernization'],
  evidence: ['evidence', 'attestation', 'citation', 'audit'],
};

export type SentinelSearchScope = 'all' | 'sourcing' | 'lifecycle' | 'programs' | 'evidence';

/**
 * Soft-filter patterns by scope. The manifest doesn't carry the
 * brief's exact scope vocabulary, so we match scope keywords against
 * the pattern's category + descriptions. Returns the unfiltered list
 * for `'all'` or when the scope keyword set is empty.
 */
export function filterPatternsByScope(
  patterns: PatternManifestEntry[],
  scope: SentinelSearchScope,
): PatternManifestEntry[] {
  if (scope === 'all') return patterns;
  const keywords = SCOPE_KEYWORDS[scope];
  if (!keywords || keywords.length === 0) return patterns;
  return patterns.filter((pattern) => {
    const haystack = patternHaystack(pattern);
    return keywords.some((kw) => haystack.includes(kw));
  });
}

export {
  getPatternManifestEntries,
  getPatternManifestEntry,
  type PatternManifestEntry,
};
