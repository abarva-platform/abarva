// Tower · outcome-report download control
//
// G8 — the masthead download control for the Control Tower outcome /
// measurement report. Two plain anchors (DOCX + XLSX) pointing at
// /api/v1/tower/outcome-report; GET so the browser downloads directly.
//
// Design: reuses the locked Tower v3 tokens (navy ink, gold eyebrow,
// hairline rules) — no new visual language. Server component; the
// anchors need no client JS.

import type { CSSProperties } from 'react';

// Tower v3 tokens — mirror the `T` register in TowerIndexPage.tsx.
const INK = '#1A1A18';
const NAVY = '#1B2B5C';
const GOLD = '#c9a227';
const RULE = 'rgba(10,10,11,0.18)';
const GRAY_DK = '#525866';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'var(--font-inter), "Inter", system-ui, sans-serif';

const eyebrowStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: '1.6px',
  fontWeight: 700,
  color: GOLD,
  textTransform: 'uppercase',
  marginBottom: 6,
  textAlign: 'right',
};

const primaryAnchorStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.2px',
  color: '#ffffff',
  background: NAVY,
  border: `1px solid ${NAVY}`,
  borderRadius: 6,
  padding: '7px 12px',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const ghostAnchorStyle: CSSProperties = {
  ...primaryAnchorStyle,
  color: INK,
  background: 'transparent',
  border: `1px solid ${RULE}`,
};

const captionStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 8.5,
  letterSpacing: '0.6px',
  color: GRAY_DK,
  textTransform: 'uppercase',
  marginTop: 6,
  textAlign: 'right',
};

/**
 * Renders the outcome-report download control. When `clientKey` is
 * supplied it is forwarded so the report binds to a specific tenant
 * even when the active-client cookie is cleared.
 */
export function TowerOutcomeReportDownload({
  clientKey,
}: {
  clientKey?: string;
}) {
  const clientParam = clientKey ? `&client=${encodeURIComponent(clientKey)}` : '';
  const docxHref = `/api/v1/tower/outcome-report?format=docx${clientParam}`;
  const xlsxHref = `/api/v1/tower/outcome-report?format=xlsx${clientParam}`;

  return (
    <div data-testid="tower-outcome-report-download">
      <div style={eyebrowStyle}>Outcome report</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <a href={docxHref} style={primaryAnchorStyle} download>
          Download DOCX
        </a>
        <a href={xlsxHref} style={ghostAnchorStyle} download>
          Download XLSX
        </a>
      </div>
      <div style={captionStyle}>Realized outcomes · measurement model</div>
    </div>
  );
}
