import type { CSSProperties } from 'react';
import Link from 'next/link';
import { PORTFOLIO } from './portfolio-tokens';

interface PortfolioHeaderProps {
  eventCount: number;
  tenantCount: number;
  attentionCount: number;
  variant: 'empty' | 'partial' | 'mature';
}

export function PortfolioHeader({
  eventCount,
  tenantCount,
  attentionCount,
  variant,
}: PortfolioHeaderProps) {
  const subline = buildSubline(eventCount, tenantCount, attentionCount);
  const showCta = variant !== 'empty';

  return (
    <header data-testid="source-portfolio-header" style={HEADER_STYLE}>
      <div style={{ minWidth: 0, display: 'grid', gap: 6 }}>
        <div style={EYEBROW_STYLE}>Source · Sourcing portfolio</div>
        <h1 style={H1_STYLE}>Sourcing events</h1>
        {subline ? <p style={SUBLINE_STYLE}>{subline}</p> : null}
      </div>
      {showCta ? (
        <div style={CTA_GROUP_STYLE}>
          <Link href="/source/new" data-testid="source-create-event-cta" style={CTA_PRIMARY_STYLE}>
            New sourcing event
          </Link>
        </div>
      ) : null}
    </header>
  );
}

function buildSubline(
  eventCount: number,
  tenantCount: number,
  attentionCount: number,
): string | null {
  if (eventCount === 0) return null;
  const tenantText = tenantCount === 1 ? '1 tenant' : `${tenantCount} tenants`;
  const eventText = eventCount === 1 ? '1 event' : `${eventCount} events`;
  const lead = `${eventText} across ${tenantText}.`;
  if (attentionCount === 0) return `${lead} Nothing needs your attention today.`;
  if (attentionCount === 1) return `${lead} 1 needs your decision today.`;
  return `${lead} ${attentionCount} need your attention today.`;
}

const HEADER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 16,
  alignItems: 'end',
  padding: '32px 0 24px',
  marginBottom: PORTFOLIO.S_BLOCK,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
};

const H1_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SERIF,
  fontSize: PORTFOLIO.T_DISPLAY,
  fontWeight: 400,
  lineHeight: 1.05,
  letterSpacing: '-0.025em',
  color: PORTFOLIO.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY,
  lineHeight: 1.5,
  color: PORTFOLIO.INK_SOFT,
  maxWidth: 640,
};

const CTA_GROUP_STYLE: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
};

const CTA_PRIMARY_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 14px',
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  background: PORTFOLIO.INK,
  color: '#ffffff',
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  border: '1px solid transparent',
};
