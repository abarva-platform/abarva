/**
 * PatternRecommendationChips — server component that recommends the top 3
 * most relevant sourcing patterns for a given event name and type.
 *
 * Scoring: tokenize both the event name+type haystack and each pattern's body
 * text, count overlapping tokens, then normalize by pattern body token count.
 * Only patterns with at least 1 keyword overlap are surfaced.
 *
 * Pure server component — no client state, no hooks.
 */

import Link from 'next/link';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';
import type { PatternSeed } from '@/lib/intelligence/seed-types';
import { SHELL } from '@/lib/shell/shell-tokens';

// ── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Tokenize a string into lowercase, alphabetic-only words of 3+ chars,
 * deduplicating into a Set.
 */
function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 3);
  return new Set(tokens);
}

interface ScoredPattern {
  pattern: PatternSeed;
  score: number;
  overlapCount: number;
}

/**
 * Score ALL patterns in SOURCING_PATTERNS against the provided event name and
 * optional type string.
 *
 * Scoring formula:
 *   overlap  = |tokens(haystack) ∩ tokens(pattern.body)|
 *   score    = overlap / tokens(pattern.body).size
 *
 * Returns the top `topN` patterns that have at least 1 overlap, sorted
 * descending by score.
 */
function scorePatterns(
  eventName: string,
  eventType: string | undefined,
  topN: number,
): ScoredPattern[] {
  const haystackTokens = tokenize(
    [eventName, eventType ?? ''].join(' '),
  );

  if (haystackTokens.size === 0) return [];

  const scored: ScoredPattern[] = SOURCING_PATTERNS.map((pattern) => {
    const bodyTokens = tokenize(pattern.body);
    let overlap = 0;
    for (const t of haystackTokens) {
      if (bodyTokens.has(t)) overlap++;
    }
    const score = bodyTokens.size > 0 ? overlap / bodyTokens.size : 0;
    return { pattern, score, overlapCount: overlap };
  });

  return scored
    .filter((s) => s.overlapCount >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// ── Component ────────────────────────────────────────────────────────────────

export interface PatternRecommendationChipsProps {
  eventName: string;
  eventType?: string;
}

export function PatternRecommendationChips({
  eventName,
  eventType,
}: PatternRecommendationChipsProps) {
  const recommendations = scorePatterns(eventName, eventType, 3);

  if (recommendations.length === 0) return null;

  return (
    <section
      data-testid="pattern-recommendation-chips"
      style={{
        marginTop: 12,
        padding: '10px 14px',
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 6,
      }}
    >
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          margin: '0 0 8px',
        }}
      >
        Suggested patterns
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {recommendations.map(({ pattern }) => {
          const preview = pattern.body.slice(0, 80).trimEnd();
          const label = `${pattern.id} — ${preview}${pattern.body.length > 80 ? '…' : ''}`;

          return (
            <Link
              key={pattern.id}
              href="/admin/reasoning/patterns"
              title={`${pattern.title}\n\n${pattern.thesis}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${SHELL.BLUE_LINE}`,
                background: SHELL.BLUE_BG,
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: SHELL.INK_MID,
                textDecoration: 'none',
                maxWidth: 340,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: SHELL.INK_MID,
                  background: SHELL.CARD_WHITE,
                  border: `1px solid ${SHELL.BLUE_LINE}`,
                  borderRadius: 999,
                  padding: '1px 6px',
                  flexShrink: 0,
                }}
              >
                {pattern.id}
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: SHELL.INK_SOFT,
                }}
                aria-label={label}
              >
                {preview}
                {pattern.body.length > 80 ? '…' : ''}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
