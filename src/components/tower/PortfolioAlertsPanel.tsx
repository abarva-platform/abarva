/**
 * PortfolioAlertsPanel — server component that renders the deterministic
 * cross-portfolio alert feed produced by `buildPortfolioAlerts()`. Surfaces
 * red-grade instances, high-severity contradictions, high-confidence failure
 * modes, and high-impact cascades grouped by severity.
 *
 * Pure presentational. AbarVa palette only (red dot for high, amber for
 * medium). Renders an empty state when no alerts are open.
 */

import Link from 'next/link';
import type { PortfolioAlert } from '@/lib/reasoning/portfolio-alerts';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';
import { getAlertState } from '@/lib/reasoning/alert-acknowledgment-state';
import { SHELL } from '@/lib/shell/shell-tokens';
import { PortfolioAlertActions } from '@/components/tower/PortfolioAlertActions';
import { RecentPortfolioAlertStates } from '@/components/tower/RecentPortfolioAlertStates';
import '@/lib/reasoning/alert-acknowledgment-init';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const SEVERITY_DOT: Record<PortfolioAlert['severity'], string> = {
  high: SHELL.RUST_TEXT,
  medium: SHELL.AMBER_DOT,
};

const SEVERITY_LABEL: Record<PortfolioAlert['severity'], string> = {
  high: 'High severity',
  medium: 'Medium severity',
};

const KIND_LABEL: Record<PortfolioAlert['kind'], string> = {
  contradiction: 'Contradiction',
  'failure-mode': 'Failure mode',
  health: 'Health',
  cascade: 'Cascade',
};

const KIND_BG: Record<PortfolioAlert['kind'], string> = {
  contradiction: SHELL.PEACH_BG,
  'failure-mode': SHELL.GRAY_BG,
  health: SHELL.RUST_BG,
  cascade: SHELL.PEACH_BG,
};

const KIND_LINE: Record<PortfolioAlert['kind'], string> = {
  contradiction: SHELL.PEACH_LINE,
  'failure-mode': SHELL.GRAY_LINE,
  health: SHELL.PEACH_LINE,
  cascade: SHELL.PEACH_LINE,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PortfolioAlertsPanelProps {
  /**
   * Pre-computed alerts. When omitted the panel calls
   * `buildPortfolioAlerts()` itself — useful as a server component.
   */
  alerts?: PortfolioAlert[];
  /** Optional title shown in the panel header. */
  title?: string;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: PortfolioAlert }) {
  const state = getAlertState(alert.id);
  const acknowledged = state?.status === 'acknowledged';
  return (
    <article
      data-testid={`portfolio-alert-${alert.kind}-${alert.instanceId}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 12px',
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 7,
      }}
    >
      {/* Severity dot */}
      <span
        aria-label={SEVERITY_LABEL[alert.severity]}
        title={SEVERITY_LABEL[alert.severity]}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: SEVERITY_DOT[alert.severity],
          flexShrink: 0,
          marginTop: 6,
        }}
      />

      {/* Body */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Header row: kind chip + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: SHELL.INK_SOFT,
              background: KIND_BG[alert.kind],
              border: `1px solid ${KIND_LINE[alert.kind]}`,
              borderRadius: 999,
              padding: '1px 8px',
            }}
          >
            {KIND_LABEL[alert.kind]}
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            {alert.label}
          </span>
          {acknowledged && (
            <span
              data-testid={`portfolio-alert-ack-badge-${alert.id}`}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 7px',
                borderRadius: 999,
                background: SHELL.MINT_BG,
                color: SHELL.MINT_TEXT,
                whiteSpace: 'nowrap',
              }}
            >
              ack&apos;d
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            <PortfolioAlertActions
              alertId={alert.id}
              acknowledged={acknowledged}
            />
          </span>
        </div>

        {/* Instance link */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Instance
          </span>
          <Link
            href={alert.link}
            style={{
              marginLeft: 8,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            {alert.instanceLabel} →
          </Link>
        </div>

        {/* Detail */}
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {alert.detail}
        </p>
      </div>
    </article>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────────

function AlertGroup({
  severity,
  alerts,
}: {
  severity: PortfolioAlert['severity'];
  alerts: PortfolioAlert[];
}) {
  if (alerts.length === 0) return null;
  return (
    <div
      data-testid={`portfolio-alerts-group-${severity}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: SEVERITY_DOT[severity],
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SHELL.INK_MUTED,
          }}
        >
          {SEVERITY_LABEL[severity]} · {alerts.length}{' '}
          {alerts.length === 1 ? 'alert' : 'alerts'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.map((a) => (
          <AlertRow key={a.id} alert={a} />
        ))}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function PortfolioAlertsPanel({
  alerts,
  title = 'Portfolio alerts',
}: PortfolioAlertsPanelProps = {}) {
  const rows = alerts ?? buildPortfolioAlerts();
  const high = rows.filter((a) => a.severity === 'high');
  const medium = rows.filter((a) => a.severity === 'medium');

  return (
    <section
      data-testid="portfolio-alerts-panel"
      style={{
        marginTop: 16,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SHELL.INK_MUTED,
          }}
        >
          {title} · {rows.length} {rows.length === 1 ? 'alert' : 'alerts'}
        </span>
      </div>

      {rows.length === 0 ? (
        <div
          data-testid="portfolio-alerts-empty"
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            padding: '8px 0',
          }}
        >
          No active alerts.
        </div>
      ) : (
        <>
          <AlertGroup severity="high" alerts={high} />
          <AlertGroup severity="medium" alerts={medium} />
        </>
      )}

      {/* Recently acknowledged / dismissed subsection — only renders when at
          least one alert has been actioned. Mirror of RecentMissionStates. */}
      <RecentPortfolioAlertStates limit={3} />
    </section>
  );
}
