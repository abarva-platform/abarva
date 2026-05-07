/**
 * TrustLadderTable · Block 2.4 (Setup Redesign Package PR B).
 *
 * Collapsible 14-row segment inventory: Segment · Records ·
 * Trust rung · Unlocks · Next action. Default collapsed below 7
 * rows; expand reveals all 14. Per `DATA_BINDING_CATALOG.md` §2
 * Block 2.4.
 *
 * Note: the `?expand=ladder` query param controls the expanded
 * state — the toggle is server-rendered as a Link rather than a
 * client component.
 */

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { TrustLadderRow } from '@/lib/admin/data-trust-composer';

const RUNG_COLOR: Record<string, string> = {
  'Decision-grade': COLORS.mintInk,
  'Agent-usable': COLORS.mintInk,
  'Usable evidence': COLORS.amberInk,
  Available: COLORS.amberInk,
  Loaded: COLORS.amberInk,
  Empty: COLORS.coralInk,
};

const NEXT_LABEL: Record<TrustLadderRow['nextAction'], string> = {
  Load: 'Load',
  Promote: 'Promote',
  '—': '—',
};

const COLLAPSED_ROWS = 7;

export function TrustLadderTable({
  rows,
  expanded,
  baseHref,
}: {
  rows: TrustLadderRow[];
  expanded: boolean;
  baseHref: string;
}) {
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
  return (
    <section
      data-data-trust-block="trust-ladder"
      data-testid="data-trust-trust-ladder"
      data-expanded={expanded ? 'true' : 'false'}
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm, flexWrap: 'wrap' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          Trust ladder
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: SHELL.INK_MUTED }}>
          per segment · all {rows.length}
        </span>
      </header>
      <div role="table" aria-label="Trust ladder">
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 0.5fr 1fr 2fr 0.7fr',
            gap: SPACING.sm,
            padding: `${SPACING.xs} 0`,
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            fontWeight: 700,
          }}
        >
          <div role="columnheader">Segment</div>
          <div role="columnheader">Records</div>
          <div role="columnheader">Trust rung</div>
          <div role="columnheader">Unlocks</div>
          <div role="columnheader">Next</div>
        </div>
        {visible.map((row) => (
          <Link
            key={row.segmentId}
            href={`/admin/segments/${row.segmentId}`}
            role="row"
            data-trust-row={row.segmentId}
            data-trust-rung={row.trustRung}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.5fr 1fr 2fr 0.7fr',
              gap: SPACING.sm,
              padding: `${SPACING.sm} 0`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: SHELL.INK,
              textDecoration: 'none',
              alignItems: 'center',
            }}
          >
            <div role="cell" style={{ fontWeight: 600 }}>
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: SHELL.INK_MUTED, marginRight: 6 }}>
                {String(row.familyNumber).padStart(2, '0')}
              </span>
              {row.segmentName}
            </div>
            <div role="cell" style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: SHELL.INK_SOFT }}>
              {row.records.toLocaleString()}
            </div>
            <div role="cell">
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  color: RUNG_COLOR[row.trustRung] ?? SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                }}
              >
                {row.trustRung}
              </span>
            </div>
            <div role="cell" style={{ color: SHELL.INK_SOFT, fontSize: 12, lineHeight: 1.4 }}>
              {row.unlocks}
            </div>
            <div role="cell">
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    row.nextAction === '—'
                      ? SHELL.INK_MUTED
                      : row.nextAction === 'Load'
                        ? COLORS.coralInk
                        : COLORS.navy,
                }}
              >
                {NEXT_LABEL[row.nextAction]}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {rows.length > COLLAPSED_ROWS ? (
        <Link
          href={`${baseHref}?expand=${expanded ? '' : 'ladder'}`}
          data-testid="data-trust-trust-ladder-toggle"
          style={{
            alignSelf: 'flex-start',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.navy,
            textDecoration: 'none',
          }}
        >
          {expanded ? '↑ Collapse to top 7' : `↓ Show all ${rows.length}`}
        </Link>
      ) : null}
    </section>
  );
}
