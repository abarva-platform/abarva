/**
 * TowerTopPatternsTile — portfolio-level "Top patterns by reach"
 *
 * Server component summary tile that surfaces which lifecycle patterns are
 * cited most often across portfolio synthesis events. Reads the in-memory
 * synthesis telemetry buffer and shows the top three pattern IDs with their
 * event counts.
 *
 * Each row links to the pattern detail page at `/source/patterns/{patternId}`
 * via `PatternDoctrineLink`, so portfolio-level pattern reach drills down to
 * the same doctrine surface that source/programs ribbon citations use.
 *
 * Empty state ("No portfolio insights yet…") renders whenever the telemetry
 * buffer is empty so the tile remains visible on a cold process.
 *
 * Visual style mirrors `TowerProvenanceRibbon` — paper background, subtle
 * card line, AbarVa palette only via SHELL tokens. No new colors.
 */

import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import {
  summarizeTelemetry,
  type TopPattern,
} from '@/lib/reasoning/synthesis-telemetry-stats';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { PatternDoctrineLink } from '@/components/source/PatternDoctrineLink';
import { SHELL } from '@/lib/shell/shell-tokens';

const TILE_BG = '#F8F7F4';

/**
 * Pure formatter for a single top-patterns row. Resolves the pattern ID to
 * its doctrine title when known, otherwise falls back to the raw ID. The
 * suffix is the human-readable event count phrase ("3 events", "1 event").
 *
 * Extracted so the row presentation can be unit-tested without mounting the
 * server component.
 */
export function formatTopPatternsRow(top: TopPattern): {
  patternId: string;
  title: string;
  countLabel: string;
} {
  const seed = findLifecyclePattern(top.patternId);
  const title = seed?.title ?? top.patternId;
  const countLabel = `${top.count} event${top.count === 1 ? '' : 's'}`;
  return { patternId: top.patternId, title, countLabel };
}

export function TowerTopPatternsTile() {
  const events = getRecentSynthesisEvents(200);
  const summary = summarizeTelemetry(events);
  const rows = summary.topPatterns;

  return (
    <aside
      aria-label="Top patterns by reach"
      data-testid="tower-top-patterns-tile"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 16px',
        background: TILE_BG,
        borderTop: `1px solid ${SHELL.CARD_LINE}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.INK_SOFT,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 700,
        }}
      >
        Top patterns by reach
      </div>

      {rows.length === 0 ? (
        <span
          style={{
            color: SHELL.INK_MUTED,
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          No portfolio insights yet — visit a Source or Programs detail page
          to seed telemetry
        </span>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {rows.map((top) => {
            const row = formatTopPatternsRow(top);
            return (
              <li
                key={row.patternId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <PatternDoctrineLink
                  patternId={row.patternId}
                  title={row.title}
                  hoverTitle={`${row.patternId} · ${row.title}`}
                />
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: SHELL.INK_SOFT,
                    flexShrink: 0,
                  }}
                >
                  {row.countLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
