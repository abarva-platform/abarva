// src/lib/reasoning/comparison-helpers.ts
//
// Pure helpers for the two-instance reasoning comparison view at
// /source/compare. Extracted so the streaming synthesis quote
// component can be fed a deterministic fallback string while the
// real synthesis is still streaming over the wire.
//
// No React, no fetches, no I/O — just transformation. Covered by
// `comparison-helpers.test.ts`.

import type { SynthesisContext } from '@/lib/reasoning/types';

/** Maximum length of the fallback quote — keeps the grid balanced. */
const MAX_FALLBACK_LENGTH = 240;

/** What we render when no candidate text is available. */
export const FALLBACK_QUOTE_PLACEHOLDER =
  'Synthesis available — open detail page';

/**
 * Returns the first sentence of `text`, capped at `MAX_FALLBACK_LENGTH`.
 * Returns an empty string for null/undefined/whitespace input.
 */
export function firstSentenceQuote(text: string | undefined | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[^.!?]*[.!?]/);
  const sentence = match ? match[0] : trimmed;
  return sentence.length > MAX_FALLBACK_LENGTH
    ? `${sentence.slice(0, MAX_FALLBACK_LENGTH - 3)}…`
    : sentence;
}

/**
 * Picks a deterministic fallback quote for a comparison column.
 *
 * Priority order:
 *   1. First sentence of `context.stageGuidance`
 *   2. First sentence of the first citation excerpt
 *   3. The static placeholder
 *
 * The streaming synthesis quote components use this string as the
 * `fallback` prop so the column has meaningful copy on first paint
 * while the live synthesis is still streaming.
 */
export function pickFallbackQuoteFromContext(
  context: SynthesisContext,
): string {
  const fromGuidance = firstSentenceQuote(context.stageGuidance);
  if (fromGuidance) return fromGuidance;
  const firstCitation = context.citations[0]?.excerpt;
  const fromCitation = firstSentenceQuote(firstCitation);
  if (fromCitation) return fromCitation;
  return FALLBACK_QUOTE_PLACEHOLDER;
}
