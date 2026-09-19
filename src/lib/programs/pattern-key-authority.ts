// The Programs pattern-key authority.
//
// A row in `pattern_match_logs` carries `acted_upon: true` and
// `matched_by_agent: 'classifier_v1'`, so it reads as evidence that a
// classification resolved against the catalog. Three writers outside
// the classifier take that key from their caller — a model in
// `commit_program`, a request body in `originateProgram`, a form in
// `submitOriginationBrief` — and before this module none of them
// checked it against anything. AGENTS.md: identity and classification
// authority are declared, never inferred.
//
// The authority is the `engagement_topics` catalog, in the promotion
// states the column can actually hold. `promotion_state` is
// constrained to ('draft','pilot','mature','deprecated') by
// supabase/migrations/041_programs_foundation.sql; `draft` is Maestro
// authoring and `deprecated` is retired, which leaves `pilot` and
// `mature` — the same pair /api/v1/programs/patterns already shows a
// client, so it is also the only pair a user could have chosen from.
//
// Everything here fails closed. A lookup that cannot answer is not a
// match, because the cost of a wrong `resolved` is a governed row
// asserting a classification that never happened.

import { azureRead } from '@/lib/data-plane/azureRead';

export const PROMOTED_PATTERN_STATES = ['pilot', 'mature'] as const;

export type PromotedPatternState = (typeof PROMOTED_PATTERN_STATES)[number];

export type PatternKeyRefusalReason =
  /** The catalog has no row with this key. */
  | 'unknown_key'
  /** The row exists but is in authoring, retired, or unpromoted. */
  | 'not_promoted'
  /** The catalog could not be read. Fail closed. */
  | 'lookup_failed';

export type PatternKeyResolution =
  | { status: 'resolved'; patternKey: string }
  /** No key was supplied. Not a refusal — there is nothing to record. */
  | { status: 'absent' }
  | { status: 'refused'; reason: PatternKeyRefusalReason };

function isPromoted(state: unknown): state is PromotedPatternState {
  return (
    typeof state === 'string' &&
    (PROMOTED_PATTERN_STATES as readonly string[]).includes(state)
  );
}

/**
 * Resolve a caller-supplied pattern key against the promoted catalog.
 *
 * Callers must persist the key only on `status: 'resolved'`. On any
 * refusal the key is not evidence of anything and must not be written
 * into a governed audit row.
 */
export async function resolvePromotedPatternKey(
  raw: string | null | undefined,
): Promise<PatternKeyResolution> {
  const patternKey = typeof raw === 'string' ? raw.trim() : '';
  if (!patternKey) return { status: 'absent' };

  let row: { topic_key?: unknown; promotion_state?: unknown } | null;
  try {
    row = await azureRead.maybeSingle<{
      topic_key: string;
      promotion_state: string | null;
    }>({
      table: 'engagement_topics',
      columns: ['topic_key', 'promotion_state'],
      where: { topic_key: patternKey },
    });
  } catch {
    return { status: 'refused', reason: 'lookup_failed' };
  }

  if (!row) return { status: 'refused', reason: 'unknown_key' };
  if (!isPromoted(row.promotion_state)) {
    return { status: 'refused', reason: 'not_promoted' };
  }
  return { status: 'resolved', patternKey };
}
