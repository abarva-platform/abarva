import type { CSSProperties } from 'react';
import Link from 'next/link';
import { PORTFOLIO } from './portfolio-tokens';

const PREVIEW_EVENTS = [
  {
    code: 'SRC-APX-101',
    name: 'POS Systems Modernization',
    stage: '03 RFP/RFI Readiness',
    status: 'Active',
  },
  {
    code: 'SRC-APX-088',
    name: 'AMS Outsourcing Renewal 2026',
    stage: '08 Executive Decision',
    status: 'Waiting',
  },
  {
    code: 'SRC-MER-046',
    name: 'Innovaccer Renewal',
    stage: '11 Value Realization',
    status: 'Completed',
  },
];

export function PortfolioEmptyState() {
  return (
    <section data-testid="source-portfolio-empty-state" style={WRAPPER_STYLE}>
      <div style={LEAD_STYLE}>
        <div style={EYEBROW_STYLE}>Get started</div>
        <h2 style={H2_STYLE}>
          Run technology sourcing events with evidence at every gate.
        </h2>
        <p style={LEAD_PARAGRAPH_STYLE}>
          Source is the operating room for IT sourcing — strategy, scope, RFP, evaluation,
          BAFO, decision, transition, and value realization, with Sentinel running the thread.
          Originate your first event and the portfolio populates from there.
        </p>
        <Link
          href="/source/new"
          data-testid="source-portfolio-empty-cta"
          style={CTA_STYLE}
        >
          + Create your first sourcing event
        </Link>
        <p style={FOOTNOTE_STYLE}>
          After your first event, this page becomes your operating queue.{' '}
          <Link
            href="/source?tour=1"
            data-testid="source-onboarding-tour-entry"
            style={TOUR_LINK_STYLE}
          >
            Take the tour
          </Link>
          {' '}for a 3-step walkthrough.
        </p>
      </div>

      <aside style={PREVIEW_CARD_STYLE} aria-label="Preview of a populated portfolio">
        <div style={PREVIEW_LABEL_STYLE}>Preview · once populated</div>
        <table style={PREVIEW_TABLE_STYLE}>
          <thead>
            <tr>
              <th style={PREVIEW_HEAD_STYLE}>Event</th>
              <th style={PREVIEW_HEAD_STYLE}>Stage</th>
              <th style={{ ...PREVIEW_HEAD_STYLE, textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {PREVIEW_EVENTS.map((row) => (
              <tr key={row.code} style={PREVIEW_ROW_STYLE}>
                <td style={PREVIEW_CELL_STYLE}>
                  <div style={PREVIEW_NAME_STYLE}>{row.name}</div>
                  <div style={PREVIEW_CODE_STYLE}>{row.code}</div>
                </td>
                <td style={PREVIEW_CELL_STYLE}>{row.stage}</td>
                <td style={{ ...PREVIEW_CELL_STYLE, textAlign: 'right' }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
    </section>
  );
}

const WRAPPER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 420px)',
  gap: 32,
  padding: '24px 0',
  alignItems: 'start',
};

const LEAD_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
};

const H2_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SERIF,
  fontSize: 32,
  fontWeight: 400,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  color: PORTFOLIO.INK,
  margin: 0,
  maxWidth: 540,
};

const LEAD_PARAGRAPH_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: 14,
  lineHeight: 1.6,
  color: PORTFOLIO.INK_SOFT,
  margin: 0,
  maxWidth: 560,
};

const CTA_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 18px',
  borderRadius: 999,
  background: PORTFOLIO.INK,
  color: '#ffffff',
  fontFamily: PORTFOLIO.MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  marginTop: 4,
  width: 'fit-content',
};

const FOOTNOTE_STYLE: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: PORTFOLIO.MONO,
  fontSize: 10,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
};

const TOUR_LINK_STYLE: CSSProperties = {
  color: PORTFOLIO.INK,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  fontWeight: 700,
};

const PREVIEW_CARD_STYLE: CSSProperties = {
  border: `1px solid ${PORTFOLIO.RULE_STRONG}`,
  borderRadius: 12,
  background: PORTFOLIO.CARD,
  padding: '16px 18px',
  opacity: 0.78,
  pointerEvents: 'none',
};

const PREVIEW_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: 9,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
  marginBottom: 12,
};

const PREVIEW_TABLE_STYLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const PREVIEW_HEAD_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
  textAlign: 'left',
  padding: '0 0 8px',
  borderBottom: `1px solid ${PORTFOLIO.RULE}`,
};

const PREVIEW_ROW_STYLE: CSSProperties = {
  borderBottom: `1px solid ${PORTFOLIO.RULE}`,
};

const PREVIEW_CELL_STYLE: CSSProperties = {
  padding: '10px 0',
  fontFamily: PORTFOLIO.SANS,
  fontSize: 12,
  color: PORTFOLIO.INK,
  verticalAlign: 'middle',
};

const PREVIEW_NAME_STYLE: CSSProperties = {
  fontWeight: 600,
};

const PREVIEW_CODE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: 10,
  color: PORTFOLIO.GRAY_DK,
  marginTop: 2,
};
