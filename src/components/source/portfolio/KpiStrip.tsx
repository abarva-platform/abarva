import type { CSSProperties } from 'react';
import type { PortfolioKpis } from '@/lib/source/portfolio-filtering';
import { PORTFOLIO } from './portfolio-tokens';

interface KpiStripProps {
  kpis: PortfolioKpis;
  canViewFinancialValues: boolean;
}

/**
 * Borderless KPI strip — type-driven hierarchy. Four columns separated by
 * vertical hairlines. The colored dot on `Need attention` is the only place
 * status hue appears in this block.
 */
export function KpiStrip({ kpis, canViewFinancialValues }: KpiStripProps) {
  const eventsBreakdown = buildEventsBreakdown(kpis);
  const attentionDetail = kpis.attentionTopReason ?? 'No blockers logged';
  const onTrackDetail =
    kpis.onTrack === 0
      ? 'No events currently active'
      : 'No gate or evidence pressure';

  return (
    <section
      data-testid="source-portfolio-kpi-strip"
      aria-label="Portfolio KPIs"
      style={STRIP_STYLE}
    >
      <KpiCell label="Events" value={String(kpis.total)} detail={eventsBreakdown} />
      <Divider />
      <KpiCell
        label="Need attention"
        value={String(kpis.attentionCount)}
        detail={attentionDetail}
        accent={kpis.attentionCount > 0 ? PORTFOLIO.BLOCKED : undefined}
      />
      <Divider />
      <KpiCell label="On track" value={String(kpis.onTrack)} detail={onTrackDetail} />
      <Divider />
      <KpiCell
        label="Value at stake"
        value={canViewFinancialValues ? formatValue(kpis.valueAtStakeUsd) : '—'}
        detail={canViewFinancialValues ? 'Combined seeded exposure' : 'Financial visibility off'}
      />
    </section>
  );
}

function buildEventsBreakdown({
  active,
  waiting,
  completed,
}: PortfolioKpis): string {
  const parts: string[] = [`${active} active`, `${waiting} waiting`];
  if (completed > 0) parts.push(`${completed} completed`);
  return parts.join(' · ');
}

function formatValue(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '$0';
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${usd}`;
}

interface KpiCellProps {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}

function KpiCell({ label, value, detail, accent }: KpiCellProps) {
  return (
    <div style={CELL_STYLE}>
      <div style={LABEL_STYLE}>
        {accent ? (
          <span aria-hidden style={{ ...DOT_STYLE, background: accent }} />
        ) : null}
        {label}
      </div>
      <div style={VALUE_STYLE}>{value}</div>
      <div style={DETAIL_STYLE}>{detail}</div>
    </div>
  );
}

function Divider() {
  return <div role="presentation" style={DIVIDER_STYLE} />;
}

const STRIP_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 1px minmax(0,1.2fr) 1px minmax(0,1fr) 1px minmax(0,1fr)',
  alignItems: 'stretch',
  gap: 0,
  padding: '24px 0',
  borderTop: `1px solid ${PORTFOLIO.RULE_STRONG}`,
  borderBottom: `1px solid ${PORTFOLIO.RULE_STRONG}`,
  marginBottom: PORTFOLIO.S_BLOCK,
};

const CELL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: '0 24px',
  minWidth: 0,
};

const LABEL_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
};

const DOT_STYLE: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  display: 'inline-block',
  flexShrink: 0,
};

const VALUE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SERIF,
  fontSize: PORTFOLIO.T_NUMBER_LARGE,
  fontWeight: 400,
  lineHeight: 1.1,
  letterSpacing: '-0.025em',
  color: PORTFOLIO.INK,
};

const DETAIL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  lineHeight: 1.45,
  color: PORTFOLIO.INK_SOFT,
};

const DIVIDER_STYLE: CSSProperties = {
  width: 1,
  background: PORTFOLIO.HAIRLINE,
};
