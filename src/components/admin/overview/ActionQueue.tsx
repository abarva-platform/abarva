/**
 * ActionQueue · Overview Block 1.3 (Setup Redesign Package PR A).
 *
 * Ranked list of pending decisions with severity dots and links to
 * the resolving panel. Hidden when empty per
 * `DATA_BINDING_CATALOG.md` §1 Block 1.3 + Setup canon refit.
 */

import Link from 'next/link';
import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';

export type ActionSeverity = 'high' | 'medium' | 'low';

export interface ActionQueueItem {
  id: string;
  severity: ActionSeverity;
  label: string;
  consequence: string;
  href: string;
  panelLabel: string;
}

export interface ActionQueueProps {
  items: ActionQueueItem[];
  totalPending?: number;
}

const SEVERITY_DOT: Record<ActionSeverity, string> = {
  high: SETUP.coral,
  medium: SETUP.amber,
  low: SETUP.mint,
};

export function ActionQueue({ items, totalPending }: ActionQueueProps) {
  if (items.length === 0) return null;
  const cap = items.slice(0, 5);
  const overflow = (totalPending ?? items.length) - cap.length;
  return (
    <section
      data-overview-block="action-queue"
      data-testid="overview-action-queue"
      style={{
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h2 style={SETUP_TYPE.cardH2}>Pending your decision</h2>
        <span style={SETUP_TYPE.cardMeta}>({totalPending ?? items.length})</span>
      </header>
      <ul
        role="list"
        data-testid="overview-action-queue-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}
      >
        {cap.map((item) => (
          <li
            key={item.id}
            data-action-id={item.id}
            data-action-severity={item.severity}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px 1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderTop: `1px solid ${SETUP.cardLine}`,
            }}
          >
            <span
              aria-label={`severity-${item.severity}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: SEVERITY_DOT[item.severity],
                flexShrink: 0,
                justifySelf: 'start',
              }}
            />
            <span style={{ ...SETUP_TYPE.bodySans, color: SETUP.ink }}>
              <strong style={{ fontWeight: 600 }}>{item.label}</strong>
              <span style={{ color: SETUP.inkMuted }}> · {item.consequence}</span>
            </span>
            <Link
              href={item.href}
              data-testid={`overview-action-${item.id}-link`}
              style={{
                fontFamily: SETUP.sans,
                fontSize: 11,
                fontWeight: 600,
                color: SETUP.ink,
                background: SETUP.cardWhite,
                textDecoration: 'none',
                border: `1px solid ${SETUP.ink}`,
                borderRadius: SETUP_RADIUS.pill,
                padding: '4px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              {item.panelLabel} →
            </Link>
          </li>
        ))}
      </ul>
      {overflow > 0 ? (
        <Link
          href="/admin/data-trust"
          data-testid="overview-action-queue-view-all"
          style={{
            alignSelf: 'flex-start',
            fontFamily: SETUP.sans,
            fontSize: 12,
            fontWeight: 600,
            color: SETUP.signal,
            textDecoration: 'none',
          }}
        >
          View all ({overflow + cap.length}) →
        </Link>
      ) : null}
    </section>
  );
}
