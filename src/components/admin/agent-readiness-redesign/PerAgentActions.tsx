/**
 * PerAgentActions · Block 5.3 (Setup Redesign Package PR C).
 *
 * Two visually distinct sections — admin-actionable (prominent,
 * severity dots, Data Trust links) and engineering-tracked
 * (muted, italic, Wave reference, no severity, no action).
 *
 * Per `DATA_BINDING_CATALOG.md` §5.3 / PR_C §4 + Setup canon refit.
 */

import Link from 'next/link';
import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type {
  AdminActionableItem,
  EngineeringTrackedItem,
} from '@/lib/admin/agent-readiness-composer';

const SEVERITY_DOT = {
  high: SETUP.coral,
  medium: SETUP.amber,
  low: SETUP.mint,
};

export function PerAgentActions({
  adminActionable,
  engineeringTracked,
}: {
  adminActionable: AdminActionableItem[];
  engineeringTracked: EngineeringTrackedItem[];
}) {
  return (
    <section
      data-agent-readiness-block="per-agent-actions"
      data-testid="agent-readiness-per-agent-actions"
      style={{
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <header>
        <h2 style={SETUP_TYPE.cardH2}>Per-agent next-action</h2>
        <p
          style={{
            margin: '4px 0 0',
            ...SETUP_TYPE.bodySans,
            color: SETUP.inkMuted,
            fontSize: 12,
          }}
        >
          What admin can resolve directly, separated from what AbarVa engineering tracks.
        </p>
      </header>

      {/* Admin-actionable */}
      <div data-section="admin-actionable" data-testid="per-agent-admin-actionable">
        <h3
          style={{
            margin: 0,
            fontFamily: SETUP.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SETUP.ink,
            fontWeight: 700,
          }}
        >
          Admin-actionable · {adminActionable.length} item{adminActionable.length === 1 ? '' : 's'}
        </h3>
        {adminActionable.length === 0 ? (
          <p
            style={{
              marginTop: 8,
              ...SETUP_TYPE.bodySans,
              color: SETUP.inkSoft,
            }}
          >
            All four agents have the data they need from the loaded segments.
          </p>
        ) : (
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: 6 }}>
            {adminActionable.map((item) => (
              <li
                key={item.id}
                data-action-id={item.id}
                data-agent-id={item.agentId}
                data-action-severity={item.severity}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '14px auto 1fr auto',
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
                    justifySelf: 'start',
                  }}
                />
                <span
                  style={{ fontFamily: SETUP.sans, fontSize: 13.5, fontWeight: 700, color: SETUP.ink }}
                >
                  {item.agentLabel}
                </span>
                <span style={{ ...SETUP_TYPE.bodySans, color: SETUP.ink }}>
                  → can&apos;t do {item.capabilityGap} · needs {item.needs}
                </span>
                <Link
                  href={item.href}
                  data-testid={`per-agent-action-${item.id}-link`}
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
                  Data Trust →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Engineering-tracked — muted, italic, no severity, no action */}
      <div
        data-section="engineering-tracked"
        data-testid="per-agent-engineering-tracked"
        style={{
          borderTop: `1px dashed ${SETUP.cardLine}`,
          paddingTop: 14,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: SETUP.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SETUP.inkMuted,
            fontWeight: 700,
          }}
        >
          Tracked by AbarVa engineering · {engineeringTracked.length} item
          {engineeringTracked.length === 1 ? '' : 's'}
        </h3>
        <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: 6 }}>
          {engineeringTracked.map((item) => (
            <li
              key={item.id}
              data-engineering-id={item.id}
              style={{
                padding: '6px 0',
                fontFamily: SETUP.sans,
                fontSize: 12,
                fontStyle: 'italic',
                color: SETUP.inkMuted,
                lineHeight: 1.5,
                opacity: 0.85,
              }}
            >
              <span style={{ fontWeight: 600, color: SETUP.inkSoft }}>{item.wave}:</span>{' '}
              {item.capability}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
