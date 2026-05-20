import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { SourcingEventSummary } from '@/lib/source/types';
import { tenantAbbreviationForAccount, portfolioStatusOf } from '@/lib/source/portfolio-filtering';
import { CANVAS } from './canvas-tokens';

interface EventIdStripProps {
  event: Pick<
    SourcingEventSummary,
    'id' | 'code' | 'name' | 'accountName' | 'status' | 'statusLabel' | 'archetype' | 'rigor' | 'owner'
  >;
}

export function EventIdStrip({ event }: EventIdStripProps) {
  const tenant = tenantAbbreviationForAccount(event.accountName);
  const bucket = portfolioStatusOf(event as SourcingEventSummary);
  const dotColor =
    bucket === 'active'
      ? CANVAS.ACTIVE
      : bucket === 'waiting'
        ? CANVAS.WAITING
        : bucket === 'completed'
          ? CANVAS.COMPLETED
          : CANVAS.BLOCKED;

  return (
    <header data-testid="source-canvas-id-strip" style={STRIP_STYLE}>
      <div style={LEFT_STYLE}>
        <nav style={CRUMB_STYLE} aria-label="Breadcrumb">
          <Link href="/source" style={CRUMB_LINK_STYLE}>
            Source
          </Link>
          <span style={CRUMB_SEP_STYLE}>›</span>
          <span style={TENANT_STYLE}>{tenant}</span>
          <span style={CRUMB_SEP_STYLE}>›</span>
          <span style={CODE_STYLE}>{event.code}</span>
        </nav>
        <h1 style={TITLE_STYLE}>{event.name}</h1>
        <div style={META_STYLE}>
          <span>{event.archetype}</span>
          <span style={DOT_STYLE}>·</span>
          <span>{rigorLabel(event.rigor)}</span>
          <span style={DOT_STYLE}>·</span>
          <span>Owner: {event.owner}</span>
        </div>
      </div>
      <div style={RIGHT_STYLE}>
        <a
          data-testid="source-canvas-cxo-report-html"
          href={`/api/v1/source/${encodeURIComponent(event.id)}/cxo-report?format=html`}
          style={REPORT_LINK_STYLE}
          title="Open the governed CXO narrative report in the browser"
          target="_blank"
          rel="noreferrer"
        >
          CXO Report
        </a>
        <a
          data-testid="source-canvas-cxo-report-pptx"
          href={`/api/v1/source/${encodeURIComponent(event.id)}/cxo-report?format=pptx`}
          style={REPORT_LINK_STYLE}
          title="Download an editable PowerPoint CXO narrative deck"
          download
        >
          PPTX
        </a>
        <a
          data-testid="source-canvas-deal-pack-download"
          href={`/api/v1/source/${encodeURIComponent(event.id)}/deal-pack?format=html`}
          style={DEAL_PACK_LINK_STYLE}
          title="Download a single-file HTML Deal Pack bundling every artifact across stages 0–7"
        >
          Download Deal Pack
        </a>
        <span style={STATUS_STYLE}>
          <span aria-hidden style={{ ...STATUS_DOT_STYLE, background: dotColor }} />
          <span style={STATUS_LABEL_STYLE}>{event.statusLabel}</span>
        </span>
      </div>
    </header>
  );
}

function rigorLabel(rigor: SourcingEventSummary['rigor']): string {
  if (rigor === 'enhanced') return 'Enhanced';
  if (rigor === 'strategic') return 'Strategic';
  return 'Standard';
}

const STRIP_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: 16,
  padding: '20px 0 16px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const LEFT_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
};

const CRUMB_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
};

const CRUMB_LINK_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  textDecoration: 'none',
};

const CRUMB_SEP_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const TENANT_STYLE: CSSProperties = {
  fontWeight: 600,
};

const CODE_STYLE: CSSProperties = {
  color: CANVAS.INK,
  fontWeight: 600,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 28,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  color: CANVAS.INK,
  margin: 0,
};

const META_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: CANVAS.SANS,
  fontSize: CANVAS.T_META,
  color: CANVAS.INK_SOFT,
};

const DOT_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const STATUS_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  alignSelf: 'center',
  flexShrink: 0,
};

const STATUS_DOT_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  display: 'inline-block',
};

const STATUS_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.INK,
  fontWeight: 600,
};

const RIGHT_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  alignSelf: 'center',
  flexShrink: 0,
};

const DEAL_PACK_LINK_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 4,
  background: CANVAS.INK,
  color: '#F4F2EC',
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  fontWeight: 600,
};

const REPORT_LINK_STYLE: CSSProperties = {
  ...DEAL_PACK_LINK_STYLE,
  background: '#F4F2EC',
  color: CANVAS.INK,
};
