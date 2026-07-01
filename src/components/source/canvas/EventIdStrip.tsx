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
  exportItems?: ReadonlyArray<{
    key: string;
    label: string;
    href: string;
    testId: string;
    download?: boolean;
    external?: boolean;
  }>;
}

export function EventIdStrip({ event, exportItems = [] }: EventIdStripProps) {
  const displayEvent = normalizeEventDisplay(event);
  const tenant = tenantAbbreviationForAccount(displayEvent.accountName);
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
          <span style={CODE_STYLE}>{displayEvent.code}</span>
        </nav>
        <h1 style={TITLE_STYLE}>{displayEvent.name}</h1>
        <div style={META_STYLE}>
          <span>{event.archetype}</span>
          <span style={DOT_STYLE}>·</span>
          <span>{rigorLabel(event.rigor)}</span>
          <span style={DOT_STYLE}>·</span>
          <span>Owner: {event.owner}</span>
        </div>
      </div>
      <div style={RIGHT_STYLE}>
        {exportItems.length > 0 ? (
          <details
            data-testid="source-canvas-export-menu"
            style={EXPORT_MENU_STYLE}
          >
            <summary style={EXPORT_SUMMARY_STYLE}>Export ▾</summary>
            <div style={EXPORT_LIST_STYLE}>
              {exportItems.map((item) => (
                <a
                  key={item.key}
                  data-testid={item.testId}
                  href={item.href}
                  style={EXPORT_ITEM_STYLE}
                  download={item.download}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </details>
        ) : null}
        <span style={STATUS_STYLE}>
          <span aria-hidden style={{ ...STATUS_DOT_STYLE, background: dotColor }} />
          <span style={STATUS_LABEL_STYLE}>{event.statusLabel}</span>
        </span>
      </div>
    </header>
  );
}

function normalizeEventDisplay(
  event: Pick<SourcingEventSummary, 'code' | 'name' | 'accountName'>,
): Pick<SourcingEventSummary, 'code' | 'name' | 'accountName'> {
  const isSkyHarborDemo =
    event.code.toUpperCase().startsWith('SKYH-') ||
    /skyharbor|airline demo/i.test(`${event.accountName} ${event.name}`);
  if (!isSkyHarborDemo) return event;
  return {
    ...event,
    accountName: 'SkyHarbor Air',
    code: 'SKYH-AMS-RFP-2026',
    name: 'SkyHarbor Air AMS Outsourcing RFP',
  };
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

const EXPORT_MENU_STYLE: CSSProperties = {
  position: 'relative',
};

const EXPORT_SUMMARY_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 4,
  background: '#F4F2EC',
  color: CANVAS.INK,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 600,
  cursor: 'pointer',
  listStyle: 'none',
};

const EXPORT_LIST_STYLE: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  minWidth: 220,
  display: 'grid',
  gap: 4,
  padding: 8,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: '#fff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
  zIndex: 10,
};

const EXPORT_ITEM_STYLE: CSSProperties = {
  display: 'block',
  padding: '8px 10px',
  borderRadius: 6,
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  background: '#fff',
};
