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

const AGENT_LABEL: Record<NonNullable<TrustLadderRow['unlocksPreview']['agent']>, string> = {
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  nexus: 'Nexus',
  steward: 'Steward',
};

/**
 * Per-segment unlock preview block — surfaces under each sparse row
 * in the trust ladder. Wave 3 PR 2 from `SETUP_AUDIT_2026-05-30_VERDICT.md`
 * §7. Locked palette: cream/white surface, Georgia italic question,
 * mono citation, faint hairline divider — matches the rest of the
 * data-trust page.
 */
function UnlockPreviewBlock({
  segmentId,
  question,
  citationExample,
  agent,
}: {
  segmentId: string;
  question: string;
  citationExample: string;
  agent?: TrustLadderRow['unlocksPreview']['agent'];
}) {
  const agentLabel = agent ? AGENT_LABEL[agent] : 'an agent';
  return (
    <div
      data-testid={`unlock-preview-${segmentId}`}
      data-unlock-preview={segmentId}
      style={{
        background: SETUP.paperSoft,
        borderLeft: `2px solid ${SETUP.cardLineStrong}`,
        margin: '0 0 12px 22px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: SETUP.mono,
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SETUP.inkFaint,
          fontWeight: 700,
        }}
      >
        Load this and {agentLabel} can answer
      </div>
      <div
        data-testid={`unlock-preview-question-${segmentId}`}
        style={{
          fontFamily: SETUP.serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 14,
          lineHeight: 1.35,
          color: SETUP.inkSoft,
        }}
      >
        “{question}”
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: SETUP.mono,
            fontSize: 10,
            color: SETUP.inkFaint,
            letterSpacing: '0.04em',
          }}
        >
          would cite:
        </span>
        <span
          data-testid={`unlock-preview-citation-${segmentId}`}
          style={{
            fontFamily: SETUP.mono,
            fontSize: 11,
            color: SETUP.inkMuted,
            lineHeight: 1.4,
          }}
        >
          {citationExample}
        </span>
      </div>
    </div>
  );
}

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
          <div
            key={row.segmentId}
            data-trust-row-wrapper={row.segmentId}
            style={{ borderBottom: `1px solid ${SETUP.cardLine}` }}
          >
            <Link
              href={`/admin/segments/${row.segmentId}`}
              role="row"
              data-trust-row={row.segmentId}
              data-trust-rung={row.trustRung}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 0.5fr 1fr 2fr 0.7fr',
                gap: 10,
                padding: '12px 0',
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
            {row.isSparse ? (
              <UnlockPreviewBlock
                segmentId={row.segmentId}
                question={row.unlocksPreview.question}
                citationExample={row.unlocksPreview.citationExample}
                agent={row.unlocksPreview.agent}
              />
            ) : null}
          </div>
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
