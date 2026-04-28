import { SHELL } from '@/lib/shell/shell-tokens';
import type { CSSProperties } from 'react';
import type { SourceValueLedgerSnapshot, ValueLedgerEntry, ValueConfidence } from '@/lib/source/types';
import { formatUsd, getLedgerRollup } from '@/lib/source/value-ledger';

type RowPerspective = 'projected' | 'committed' | 'measuring' | 'realized';

interface ValueLedgerRowView {
  entry: ValueLedgerEntry;
  perspective: RowPerspective;
}

const SOURCE_CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const SOURCE_INSET_CARD: CSSProperties = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE_SOFT,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const SOURCE_TABLE_HEADER_CELL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  padding: '0 14px 10px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
};

const SOURCE_TABLE_CELL: CSSProperties = {
  padding: '12px 14px',
  borderTop: '1px solid ' + SHELL.CARD_LINE,
  verticalAlign: 'top' as const,
};

const SUMMARY_PANEL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  alignItems: 'start',
};

const PANEL_CARD: CSSProperties = {
  ...SOURCE_INSET_CARD,
  borderRadius: 12,
  background: '#FFFFFF',
  border: '1px solid #E8E6E1',
};

const PERSPECTIVE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: SHELL.INK_SOFT,
};

const VALUE_TEXT: CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 26,
  lineHeight: 1,
  color: SHELL.INK,
};

const CHIP_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
};

const CHIPS: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  borderRadius: 14,
  border: '1px solid #D7DEE9',
  padding: '5px 10px',
  background: '#F5F8FD',
  color: SHELL.INK,
};

const TWO_COL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
  gap: 16,
  alignItems: 'start',
};

const SECTION_GRID: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const ACTION_LINK: CSSProperties = {
  ...SOURCE_CARD,
  textDecoration: 'none',
  display: 'inline-flex',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #1B2B5C',
  background: '#F6F9FF',
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
};

const TEXT_SMALL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
};

function toPerspectiveLabel(perspective: RowPerspective): string {
  if (perspective === 'projected') return 'Projected';
  if (perspective === 'committed') return 'Committed';
  if (perspective === 'measuring') return 'Measuring';
  return 'Realized';
}

function confidenceTone(confidence: ValueConfidence): 'high' | 'medium' | 'low' {
  if (confidence === 'high') return 'high';
  if (confidence === 'medium') return 'medium';
  return 'low';
}

function confidenceColor(confidence: ValueConfidence): string {
  return confidenceTone(confidence) === 'high'
    ? '#0B5FA5'
    : confidenceTone(confidence) === 'medium'
      ? '#D97706'
      : '#B91C1C';
}

function deriveRows(snapshot: SourceValueLedgerSnapshot): {
  rows: ValueLedgerRowView[];
  projected: ValueLedgerEntry[];
  committed: ValueLedgerEntry[];
  measuring: ValueLedgerEntry[];
  realized: ValueLedgerEntry[];
} {
  const projected = [...snapshot.projected];
  const realized = [...snapshot.realized];
  const committed = projected.filter((entry) => entry.confidence === 'high' && entry.evidenceCount > 0);
  const measuring = projected.filter((entry) => !(entry.confidence === 'high' && entry.evidenceCount > 0));
  const rows: ValueLedgerRowView[] = [
    ...projected.map((entry) => ({ entry, perspective: 'projected' as const })),
    ...committed.map((entry) => ({ entry, perspective: 'committed' as const })),
    ...measuring.map((entry) => ({ entry, perspective: 'measuring' as const })),
    ...realized.map((entry) => ({ entry, perspective: 'realized' as const })),
  ];
  return { rows, projected, committed, measuring, realized };
}

function buildAssumptions(snapshot: SourceValueLedgerSnapshot): string[] {
  const assumptionSet = new Set<string>();

  [...snapshot.projected, ...snapshot.realized].forEach((entry) => {
    if (entry.note) {
      assumptionSet.add(entry.note);
    }
  });

  if (assumptionSet.size > 0) {
    return [...assumptionSet].slice(0, 6);
  }
  return ['No detailed assumptions are seeded for current ledger entries.'];
}

export function SourceValueLedger({ snapshot }: { snapshot: SourceValueLedgerSnapshot }) {
  const rollup = getLedgerRollup(snapshot);
  const { rows, projected, committed, measuring, realized } = deriveRows(snapshot);
  const assumptions = buildAssumptions(snapshot);
  const events = [...new Set(rows.map(({ entry }) => entry.eventName))];
  const lowConfidenceRows = rows.filter(({ entry }) => entry.confidence === 'low' || entry.evidenceCount === 0);
  const assumptionCount = assumptions.length;
  const totalLowConfidenceAmount = lowConfidenceRows.reduce((sum, row) => sum + Math.abs(row.entry.amountUsd), 0);

  return (
    <section style={SECTION_GRID}>
      <section style={SOURCE_CARD} aria-label="Atlas value ledger shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ ...PERSPECTIVE_LABEL, color: '#1D4F8C', marginBottom: 6 }}>Atlas value ledger lead</div>
            <h2 style={{ fontFamily: SHELL.SERIF, color: SHELL.INK, fontSize: 30, margin: 0 }}>
              Source value ledger
            </h2>
            <p style={{ ...TEXT_SMALL, marginTop: 8, marginBottom: 0, maxWidth: 720 }}>
              Atlas is monitoring value intent, measurability, and risk posture for the seeded Source program set.
            </p>
          </div>
          <div style={{ ...TEXT_SMALL, textAlign: 'right', color: '#576074' }}>
            Updated {snapshot.updatedAt}<br />
            Deterministic seeded input only.
          </div>
        </div>

        <div style={SUMMARY_PANEL}>
          <article style={PANEL_CARD}>
            <div style={PERSPECTIVE_LABEL}>Projected</div>
            <div style={VALUE_TEXT}>{formatUsd(rollup.projectedUsd)}</div>
            <div style={{ ...TEXT_SMALL, color: '#576074' }}>{projected.length} line items from seeded event contracts.</div>
          </article>
          <article style={PANEL_CARD}>
            <div style={PERSPECTIVE_LABEL}>Committed</div>
            <div style={VALUE_TEXT}>{formatUsd(committed.reduce((sum, entry) => sum + entry.amountUsd, 0))}</div>
            <div style={{ ...TEXT_SMALL, color: '#576074' }}>Evidence-backed high-confidence line items.</div>
          </article>
          <article style={PANEL_CARD}>
            <div style={PERSPECTIVE_LABEL}>Measuring</div>
            <div style={VALUE_TEXT}>{formatUsd(measuring.reduce((sum, entry) => sum + entry.amountUsd, 0))}</div>
            <div style={{ ...TEXT_SMALL, color: '#576074' }}>{measuring.length} items not yet confirmed.</div>
          </article>
          <article style={PANEL_CARD}>
            <div style={PERSPECTIVE_LABEL}>Realized</div>
            <div style={VALUE_TEXT}>{formatUsd(rollup.realizedUsd)}</div>
            <div style={{ ...TEXT_SMALL, color: '#576074' }}>{realized.length} realized entries with seeded status only.</div>
          </article>
        </div>
      </section>

      <div style={TWO_COL}>
        <section style={SOURCE_CARD}>
          <div style={{ ...PERSPECTIVE_LABEL, color: '#1D4F8C' }}>Value ledger line items</div>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Source value line item table">
              <thead>
                <tr>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Perspective</th>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Event</th>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Line item</th>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Stage</th>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Amount</th>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Evidence</th>
                  <th style={SOURCE_TABLE_HEADER_CELL}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.entry.id}-${row.perspective}-${index}`}>
                    <td style={SOURCE_TABLE_CELL}>{toPerspectiveLabel(row.perspective)}</td>
                    <td style={SOURCE_TABLE_CELL}>{row.entry.eventName}</td>
                    <td style={SOURCE_TABLE_CELL}>
                      <div style={{ fontWeight: 700 }}>{row.entry.label}</div>
                      <div style={{ ...TEXT_SMALL, color: '#576074', marginTop: 4 }}>{row.entry.note}</div>
                    </td>
                    <td style={SOURCE_TABLE_CELL}>{row.entry.stageKey ?? 'n/a'}</td>
                    <td style={SOURCE_TABLE_CELL}>{formatUsd(row.entry.amountUsd)}</td>
                    <td style={SOURCE_TABLE_CELL}>{row.entry.evidenceCount}</td>
                    <td style={SOURCE_TABLE_CELL}>
                      <span style={{ color: confidenceColor(row.entry.confidence) }}>
                        {row.entry.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={SECTION_GRID}>
        <section style={SOURCE_CARD}>
            <div style={PERSPECTIVE_LABEL}>Context used</div>
            <div style={CHIP_ROW} aria-label="context used">
              <span style={CHIPS}>Event set: {events.length}</span>
              <span style={CHIPS}>Source context: seeded only</span>
              <span style={CHIPS}>Confidence model: high / medium / low</span>
              <span style={CHIPS}>Measurement owner: Source Value Office</span>
            </div>
          </section>

          <section id="value-confidence" style={SOURCE_CARD}>
            <div style={PERSPECTIVE_LABEL}>Evidence confidence summary</div>
            <p style={{ ...TEXT_SMALL, marginTop: 8 }}>
              Confidence is deterministic from seeded evidence depth and stage assumptions. We treat low confidence and zero-evidence items as
              variance risk for executive review.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {lowConfidenceRows.length > 0 ? (
                lowConfidenceRows.slice(0, 5).map((row) => (
                  <li key={`${row.entry.id}-conf`} style={TEXT_SMALL}>
                    {toPerspectiveLabel(row.perspective)} item "{row.entry.label}" remains at {row.entry.confidence} confidence.
                  </li>
                ))
              ) : (
                <li style={TEXT_SMALL}>No low-confidence or missing-evidence items are seeded.</li>
              )}
            </ul>
          </section>

          <section id="value-assumptions" style={SOURCE_CARD}>
            <div style={PERSPECTIVE_LABEL}>Assumptions & variance notes</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
              {assumptions.map((assumption, index) => (
                <li key={`assumption-${index}`} style={TEXT_SMALL}>
                  {assumption}
                </li>
              ))}
            </ul>
            <div style={{ ...TEXT_SMALL, color: '#9B5F17', marginTop: 8 }}>
              Variance watch: {assumptionCount} assumption anchors, {formatUsd(totalLowConfidenceAmount)} currently in low-confidence posture.
            </div>
          </section>

          <section id="value-actions" style={SOURCE_CARD}>
            <div style={PERSPECTIVE_LABEL}>Action layer</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              <a href="#value-assumptions" style={ACTION_LINK}>Show assumptions</a>
              <a href="#value-confidence" style={ACTION_LINK}>Show evidence gaps</a>
              <a href="#value-caveat" style={ACTION_LINK}>Explain value confidence</a>
              <label htmlFor="value-custom-input" style={{ ...TEXT_SMALL, color: '#3B4453', display: 'grid', gap: 6 }}>
                Ask custom
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="value-custom-input"
                    type="text"
                    readOnly
                    placeholder="Ask Atlas about this value ledger, gate, event, or evidence..."
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 14,
                      lineHeight: 1.6,
                      flex: 1,
                      border: '1px solid #C9D2E1',
                      borderRadius: 8,
                      background: '#F4F7FB',
                      color: '#7B8598',
                      padding: '8px 10px',
                    }}
                  />
                  <span style={{ ...ACTION_LINK, whiteSpace: 'nowrap' }}>
                    Submit (disabled until runtime)
                  </span>
                </div>
              </label>
            </div>
          </section>
        </aside>
      </div>

      <div style={{ ...SOURCE_CARD, padding: '12px 16px', background: '#F8FAFF' }} id="value-caveat">
        <div style={{ ...TEXT_SMALL, color: '#576074' }}>
          Atlas ledger values are deterministic, seed-backed, and for execution planning. This is not a live realized-savings
          claim unless downstream evidence and measurement gates are explicitly marked as usable.
        </div>
      </div>
    </section>
  );
}
