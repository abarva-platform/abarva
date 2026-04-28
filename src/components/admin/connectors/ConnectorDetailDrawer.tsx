import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ConnectorReadiness } from '@/lib/admin/connectors-readiness-view';
import type { ConnectorDetail } from '@/lib/admin/connectors-page-view';
import { HealthTrendSparkline } from './HealthTrendSparkline';

export interface ConnectorDetailDrawerProps {
  connector: ConnectorReadiness;
  detail: ConnectorDetail;
  /** Hard-gate reason text reused across stub buttons. */
  hardGateReason: string;
  /** Optional close href — when present, an unobtrusive "Close" link renders. */
  closeHref?: string;
}

const OUTCOME_LABEL: Record<string, string> = {
  success_stub: 'Success (stub)',
  failure: 'Failed',
  skipped: 'Skipped',
  pending: 'Pending',
};

/**
 * ADMIN13 — Per-connector detail drawer.
 *
 * Renders deterministic config schema, last sync attempt, error log, and
 * hard-gated affordances (Test connection / Configure / Remove). Stays
 * read-only — never claims live connectivity.
 */
export function ConnectorDetailDrawer({
  connector,
  detail,
  hardGateReason,
  closeHref,
}: ConnectorDetailDrawerProps) {
  return (
    <aside
      data-component="ConnectorDetailDrawer"
      data-connector-id={connector.id}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}14`,
        padding: SPACING.xl,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: SPACING.md,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              fontWeight: 700,
              marginBottom: SPACING.xs,
            }}
          >
            Connector detail
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {connector.label}
          </h3>
          <div
            style={{
              fontSize: 12,
              color: `${COLORS.ink}99`,
              marginTop: SPACING.xs,
            }}
          >
            {detail.vendor}
          </div>
        </div>
        <HealthTrendSparkline
          points={detail.healthTrend}
          ariaLabel={`24-hour health trend for ${connector.label}`}
        />
        {closeHref ? (
          <a
            href={closeHref}
            data-action="close-drawer"
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              textDecoration: 'none',
              fontWeight: 700,
              marginLeft: SPACING.md,
            }}
          >
            Close
          </a>
        ) : null}
      </header>

      <p
        style={{
          fontSize: 13,
          color: `${COLORS.ink}cc`,
          lineHeight: 1.6,
          marginTop: 0,
          marginBottom: SPACING.lg,
        }}
      >
        {connector.stewardGuidance}
      </p>

      {/* Last sync attempt */}
      <section data-section="last-sync" style={{ marginBottom: SPACING.lg }}>
        <h4 style={sectionHeadStyle}>Last sync attempt</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 100px',
            gap: SPACING.sm,
            fontSize: 12,
            alignItems: 'baseline',
          }}
        >
          <div style={{ fontFamily: TYPOGRAPHY.mono, color: `${COLORS.ink}cc` }}>
            {detail.lastSyncAttempt.occurredAt}
          </div>
          <div style={{ color: COLORS.ink }}>{detail.lastSyncAttempt.message}</div>
          <div style={{ textAlign: 'right' }}>
            <span
              data-outcome={detail.lastSyncAttempt.outcome}
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: RADIUS.pill,
                background:
                  detail.lastSyncAttempt.outcome === 'success_stub'
                    ? COLORS.mintSoft
                    : detail.lastSyncAttempt.outcome === 'failure'
                      ? COLORS.coralSoft
                      : COLORS.amberSoft,
                color:
                  detail.lastSyncAttempt.outcome === 'success_stub'
                    ? COLORS.mintInk
                    : detail.lastSyncAttempt.outcome === 'failure'
                      ? COLORS.coralInk
                      : COLORS.amberInk,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {OUTCOME_LABEL[detail.lastSyncAttempt.outcome] ?? detail.lastSyncAttempt.outcome}
            </span>
          </div>
        </div>
      </section>

      {/* Configuration schema */}
      <section data-section="config-schema" style={{ marginBottom: SPACING.lg }}>
        <h4 style={sectionHeadStyle}>Configuration schema</h4>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {detail.configFields.map((field, idx) => (
            <li
              key={field.key}
              data-config-key={field.key}
              data-required={field.required ? 'true' : 'false'}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 100px',
                gap: SPACING.sm,
                padding: `${SPACING.sm} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}0a`,
                alignItems: 'baseline',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.ink }}>
                  {field.label}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                  }}
                >
                  {field.key}
                </div>
              </div>
              <div style={{ fontSize: 12, color: `${COLORS.ink}cc` }}>
                {field.helpText}
                {field.maskedValue ? (
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}99`,
                      marginTop: SPACING.xs,
                    }}
                  >
                    {field.maskedValue}
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}66`,
                      fontStyle: 'italic',
                      marginTop: SPACING.xs,
                    }}
                  >
                    not set
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: RADIUS.pill,
                    background: field.required ? COLORS.coralSoft : COLORS.cream,
                    color: field.required ? COLORS.coralInk : `${COLORS.ink}99`,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {field.required ? 'Required' : 'Optional'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Error log */}
      <section data-section="error-log" style={{ marginBottom: SPACING.lg }}>
        <h4 style={sectionHeadStyle}>Error log</h4>
        {detail.errorLog.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: `${COLORS.ink}99`,
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            No events recorded.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}cc`,
            }}
          >
            {detail.errorLog.map((event, idx) => (
              <li
                key={`${event.timestamp}:${idx}`}
                data-log-level={event.level}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 60px 1fr',
                  gap: SPACING.sm,
                  padding: `${SPACING.xs} 0`,
                  borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}0a`,
                }}
              >
                <span>{event.timestamp}</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      event.level === 'error'
                        ? COLORS.coralInk
                        : event.level === 'warn'
                          ? COLORS.amberInk
                          : COLORS.mintInk,
                  }}
                >
                  {event.level.toUpperCase()}
                </span>
                <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12 }}>
                  {event.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Hard-gated actions */}
      <section
        data-section="connector-actions"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        }}
      >
        <DisabledStubButton
          id="test-connection"
          label="Test connection"
          reason={hardGateReason}
        />
        <DisabledStubButton
          id="configure"
          label="Configure"
          reason={hardGateReason}
        />
        <DisabledStubButton
          id="remove"
          label="Remove"
          reason={hardGateReason}
        />
        <a
          href={detail.docsHref}
          target="_blank"
          rel="noreferrer noopener"
          data-action="open-docs"
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.ink}1f`,
            background: COLORS.white,
            color: COLORS.navy,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Open docs
        </a>
      </section>

      <p
        style={{
          fontSize: 11,
          color: `${COLORS.ink}80`,
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        {hardGateReason}
      </p>
    </aside>
  );
}

const sectionHeadStyle: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  fontWeight: 700,
  margin: 0,
  marginBottom: SPACING.sm,
};

interface DisabledStubButtonProps {
  id: string;
  label: string;
  reason: string;
}

function DisabledStubButton({ id, label, reason }: DisabledStubButtonProps) {
  return (
    <button
      type="button"
      disabled
      data-action={id}
      data-status="blocked"
      title={reason}
      aria-disabled="true"
      style={{
        padding: '8px 14px',
        borderRadius: RADIUS.md,
        border: `1px solid ${COLORS.ink}1f`,
        background: COLORS.cream,
        color: `${COLORS.ink}80`,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 700,
        cursor: 'not-allowed',
      }}
    >
      {label}
    </button>
  );
}
