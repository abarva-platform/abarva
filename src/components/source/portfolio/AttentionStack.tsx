import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { AttentionDescriptor } from '@/lib/source/portfolio-filtering';
import type { SourcingEventSummary } from '@/lib/source/types';
import { PORTFOLIO } from './portfolio-tokens';

interface AttentionStackProps {
  banners: Array<{ event: SourcingEventSummary; attention: AttentionDescriptor }>;
}

/**
 * Stack of attention banners. Each banner is a clean white card with a 3px
 * left-edge accent indicating severity. No background tint, no chip — the
 * accent + a small dot do the work.
 */
export function AttentionStack({ banners }: AttentionStackProps) {
  if (banners.length === 0) return null;
  return (
    <section
      data-testid="source-portfolio-attention-stack"
      aria-label="Events that need attention"
      style={STACK_STYLE}
    >
      {banners.map(({ event, attention }) => (
        <AttentionBanner key={event.id} event={event} attention={attention} />
      ))}
    </section>
  );
}

function AttentionBanner({
  event,
  attention,
}: {
  event: SourcingEventSummary;
  attention: AttentionDescriptor;
}) {
  const isCritical = attention.severity === 'critical';
  const accent = isCritical ? PORTFOLIO.BLOCKED : PORTFOLIO.WAITING;

  return (
    <Link
      href={`/source/events/${event.id}`}
      data-testid={`source-attention-banner-${attention.severity}`}
      style={{
        ...BANNER_STYLE,
        borderLeftColor: accent,
      }}
    >
      <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
        <div style={LABEL_ROW_STYLE}>
          <span aria-hidden style={{ ...DOT_STYLE, background: accent }} />
          <span style={{ ...BADGE_STYLE, color: accent }}>
            {attention.badgeLabel} · {attention.badgeDays}d
          </span>
          <span style={CODE_STYLE}>{event.code}</span>
        </div>
        <div style={TITLE_STYLE}>
          <span style={EVENT_NAME_STYLE}>{event.name}</span>
          <span style={DIAGNOSIS_STYLE}>{attention.diagnosis}</span>
        </div>
        <div style={DETAIL_STYLE}>{attention.detail}</div>
      </div>
      <span aria-hidden style={ARROW_STYLE}>→</span>
    </Link>
  );
}

const STACK_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  marginBottom: PORTFOLIO.S_BLOCK,
};

const BANNER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  alignItems: 'center',
  gap: 16,
  padding: '14px 18px',
  background: PORTFOLIO.CARD,
  border: `1px solid ${PORTFOLIO.RULE}`,
  borderLeft: '3px solid',
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  textDecoration: 'none',
  color: PORTFOLIO.INK,
  transition: 'background 120ms ease',
};

const LABEL_ROW_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const DOT_STYLE: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  display: 'inline-block',
};

const BADGE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
};

const CODE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.04em',
  color: PORTFOLIO.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  columnGap: 10,
  rowGap: 2,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY,
  lineHeight: 1.4,
};

const EVENT_NAME_STYLE: CSSProperties = {
  fontWeight: 600,
  color: PORTFOLIO.INK,
};

const DIAGNOSIS_STYLE: CSSProperties = {
  color: PORTFOLIO.INK_SOFT,
};

const DETAIL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  lineHeight: 1.45,
  color: PORTFOLIO.INK_SOFT,
};

const ARROW_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: 16,
  color: PORTFOLIO.GRAY_DK,
  fontWeight: 400,
  flexShrink: 0,
};
