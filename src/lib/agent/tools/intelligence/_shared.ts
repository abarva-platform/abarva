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
  // Apex is the one tenant where the app and the data-room disagree:
  // app says `'apexretail'`, data-room says `'apex-retail'`. Without
  // this mapping, the broker returns the unknown_tenant blocked
  // bundle for Apex and Sentinel tools go silent on the demo's
  // primary tenant.
  //
  // NOTE: This function targets the EnterpriseDataRoom in-memory
  // substrate that Sentinel tools read from. Codex's newer
  // `data_inventory_*` tables use a different key for Meridian
  // (`meridian-health`); see `clientKeyToInventorySubstrateKey`
  // for that mapping.
  if (clientKey === 'apexretail') return 'apex-retail';
  return clientKey;
}

/**
 * Map an app-tier ClientKey to the tenant_key used in the
 * `data_inventory_*` Postgres substrate (Codex's 2026-04-30 data
 * layer). App keys and substrate keys differ for all three clients:
 *   - app `'apexretail'` → substrate `'apex-retail'`
 *   - app `'meridian'`   → substrate `'meridian-health'`
 *   - app `'arcturus'`   → substrate `'first-capital'`
 */
export function clientKeyToInventorySubstrateKey(
  clientKey: ClientKey | string,
): string {
  if (clientKey === 'apexretail') return 'apex-retail';
  if (clientKey === 'meridian') return 'meridian-health';
  if (clientKey === 'arcturus') return 'first-capital';
  return clientKey;
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
