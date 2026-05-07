/**
 * TrustLadderTable · Block 2.4 (Setup Redesign Package PR B).
 *
 * Collapsible 14-row segment inventory: Segment · Records ·
 * Trust rung · Unlocks · Next action. Per `DATA_BINDING_CATALOG.md`
 * §2 Block 2.4 + Setup canon refit.
 */

import Link from 'next/link';
import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type { TrustLadderRow } from '@/lib/admin/data-trust-composer';

const RUNG_COLOR: Record<string, string> = {
  'Decision-grade': SETUP.mint,
  'Agent-usable': SETUP.mint,
  'Usable evidence': SETUP.amber,
  Available: SETUP.amber,
  Loaded: SETUP.amber,
  Empty: SETUP.coral,
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
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={SETUP_TYPE.cardH2}>Trust ladder</h2>
        <span style={SETUP_TYPE.cardMeta}>per segment · all {rows.length}</span>
      </header>
      <div role="table" aria-label="Trust ladder">
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 0.5fr 1fr 2fr 0.7fr',
            gap: 10,
            padding: '6px 0',
            borderBottom: `1px solid ${SETUP.cardLine}`,
            fontFamily: SETUP.mono,
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SETUP.inkMuted,
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
              gap: 10,
              padding: '12px 0',
              borderBottom: `1px solid ${SETUP.cardLine}`,
              fontFamily: SETUP.sans,
              fontSize: 13,
              color: SETUP.ink,
              textDecoration: 'none',
              alignItems: 'center',
            }}
          >
            <div role="cell" style={{ fontWeight: 600 }}>
              <span style={{ fontFamily: SETUP.mono, fontSize: 10, color: SETUP.inkFaint, marginRight: 8 }}>
                {String(row.familyNumber).padStart(2, '0')}
              </span>
              {row.segmentName}
            </div>
            <div role="cell" style={{ fontFamily: SETUP.mono, fontSize: 11, color: SETUP.inkMuted }}>
              {row.records.toLocaleString()}
            </div>
            <div role="cell">
              <span
                style={{
                  fontFamily: SETUP.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: RUNG_COLOR[row.trustRung] ?? SETUP.inkMuted,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {row.trustRung}
              </span>
            </div>
            <div role="cell" style={{ color: SETUP.inkSoft, fontSize: 12, lineHeight: 1.4 }}>
              {row.unlocks}
            </div>
            <div role="cell">
              <span
                style={{
                  fontFamily: SETUP.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    row.nextAction === '—'
                      ? SETUP.inkMuted
                      : row.nextAction === 'Load'
                        ? SETUP.coral
                        : SETUP.signal,
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
            fontFamily: SETUP.sans,
            fontSize: 12,
            fontWeight: 600,
            color: SETUP.signal,
            textDecoration: 'none',
          }}
        >
          {expanded ? '↑ Collapse to top 7' : `↓ Show all ${rows.length}`}
        </Link>
      ) : null}
    </section>
  );
}
