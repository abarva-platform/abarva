/**
 * IsolationLane · Wave 2 PR-2 · the Trust Plane incident-response surface.
 *
 * Rendered on /admin/audit?tab=isolation. Surfaces tenant-resolution
 * audit events and cross-tenant anomalies sourced from
 * `ai_egress_audit` via the `isolation-posture-broker`. Answers the
 * STRESS-P0-006 question — "did anything cross tenants in the last
 * 24 hours?" — without leaving Setup.
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §4 (Persona C
 * incident-response admin) and §7 Wave 2 PR-2 for the surface
 * narrative this fulfills.
 *
 * Contract:
 *   - Server component — no client state, no hydration.
 *   - Reads composed `IsolationPosture` from the broker; renders
 *     metadata-only columns. Payload fingerprints (`prompt_hash`,
 *     `response_hash`, `prompt_snapshot_ref`, `response_snapshot_ref`)
 *     are stripped server-side BEFORE this component sees the row;
 *     the contract guarantees the broker does not surface them.
 *
 * Visual register: cream paper, Georgia for the eyebrow + headline,
 * mono for status labels, DM Sans / Inter for body. Locked palette.
 */

import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  IsolationPosture,
  IsolationRecentEvent,
  IsolationSeverity,
} from '@/lib/admin/broker/isolation-posture-broker';

interface IsolationLaneProps {
  posture: IsolationPosture;
  refreshedAtIso: string;
  /**
   * Optional reference time for the lane's relative-time renders.
   * Defaults to `Date.parse(refreshedAtIso)` so the page composer
   * can pass the request-time stamp without a second Date.now()
   * call. Pure-render compatible.
   */
  nowMs?: number;
}

function formatRelativeTime(iso: string, nowMs: number): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  const diff = Math.max(0, nowMs - ms);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function severityDotColor(severity: IsolationSeverity): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'med') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function severityLabel(severity: IsolationSeverity): string {
  return severity === 'high' ? 'High' : severity === 'med' ? 'Med' : 'Low';
}

// ── Top-strip metrics ───────────────────────────────────────────────────────

function MetricCell({
  eyebrow,
  value,
  unit,
}: {
  eyebrow: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          lineHeight: 1,
        }}
      >
        {eyebrow}
      </span>
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 26,
          fontWeight: 600,
          color: SHELL.INK,
          lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
        {unit ? (
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 500,
              color: SHELL.INK_SOFT,
              marginLeft: 6,
            }}
          >
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function HeaderStrip({
  posture,
  refreshedAtIso,
  nowMs,
}: {
  posture: IsolationPosture;
  refreshedAtIso: string;
  nowMs: number;
}) {
  const refreshed = formatRelativeTime(refreshedAtIso, nowMs);
  return (
    <div
      data-testid="isolation-lane-header"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 24,
        padding: '20px 24px',
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 10,
        marginBottom: 20,
      }}
    >
      <MetricCell
        eyebrow="RLS coverage"
        value={String(posture.rlsCoveragePct)}
        unit="%"
      />
      <MetricCell
        eyebrow="Resolution events 24h"
        value={String(posture.tenantResolutionEvents24h)}
      />
      <MetricCell
        eyebrow="Anomalies 24h"
        value={String(posture.anomaliesLast24h)}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 0,
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            lineHeight: 1,
          }}
        >
          Refreshed
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            lineHeight: 1.4,
          }}
        >
          {refreshed}
        </span>
        {posture.evidence === 'estimated' ? (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            (RLS % estimated)
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ── Top anomaly callout ─────────────────────────────────────────────────────

function AnomalyCallout({
  topAnomaly,
  nowMs,
}: {
  topAnomaly: NonNullable<IsolationPosture['topAnomaly']>;
  nowMs: number;
}) {
  const dotColor = severityDotColor(topAnomaly.severity);
  return (
    <div
      data-testid="isolation-lane-anomaly-callout"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 18px',
        background: SHELL.RUST_BG,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 10,
        marginBottom: 20,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: dotColor,
          marginTop: 6,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.RUST_TEXT,
            }}
          >
            {severityLabel(topAnomaly.severity)} severity anomaly
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.08em',
            }}
          >
            {formatRelativeTime(topAnomaly.ts, nowMs)}
          </span>
        </div>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK,
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}
        >
          {topAnomaly.description}
        </span>
        <a
          href={`#isolation-event-${topAnomaly.id}`}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: SHELL.INK,
            textDecoration: 'none',
            borderBottom: '1px solid ' + SHELL.CARD_LINE,
            paddingBottom: 1,
            alignSelf: 'flex-start',
            marginTop: 4,
          }}
        >
          View event →
        </a>
      </div>
    </div>
  );
}

// ── Events table ────────────────────────────────────────────────────────────

const TABLE_HEAD_STYLE: React.CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
  whiteSpace: 'nowrap',
};

const TABLE_CELL_STYLE: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  color: SHELL.INK,
  padding: '10px 12px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT,
  verticalAlign: 'top',
};

function EventRow({
  event,
  nowMs,
}: {
  event: IsolationRecentEvent;
  nowMs: number;
}) {
  const dotColor = severityDotColor(event.severity);
  const intended = event.intendedTenant ?? '—';
  const resolved = event.resolvedTenant ?? event.tenantKey;
  const mismatch =
    event.intendedTenant &&
    event.resolvedTenant &&
    event.intendedTenant !== event.resolvedTenant;
  return (
    <tr
      id={`isolation-event-${event.id}`}
      data-testid="isolation-lane-row"
      data-anomaly={event.anomaly ? 'true' : 'false'}
      data-severity={event.severity}
    >
      <td style={TABLE_CELL_STYLE}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            lineHeight: 1.3,
          }}
        >
          {formatRelativeTime(event.ts, nowMs)}
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          {event.ts}
        </div>
      </td>
      <td style={TABLE_CELL_STYLE}>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          {event.tenantKey}
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          {event.workflow}
        </div>
      </td>
      <td style={TABLE_CELL_STYLE}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            wordBreak: 'break-all',
          }}
        >
          {event.userId ?? 'system'}
        </div>
      </td>
      <td style={TABLE_CELL_STYLE}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.04em',
            }}
          >
            intended → resolved
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: mismatch ? SHELL.RUST_TEXT : SHELL.INK,
              fontWeight: mismatch ? 700 : 500,
            }}
          >
            {intended} → {resolved}
          </span>
        </div>
      </td>
      <td style={TABLE_CELL_STYLE}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: dotColor,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
            }}
          />
          {severityLabel(event.severity)}
        </span>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
            marginTop: 4,
          }}
        >
          {event.policyDecision} · {event.dataClass}
        </div>
      </td>
      <td style={TABLE_CELL_STYLE}>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            color: SHELL.INK,
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {event.reason ?? '—'}
        </span>
      </td>
    </tr>
  );
}

function EventsTable({
  events,
  nowMs,
}: {
  events: ReadonlyArray<IsolationRecentEvent>;
  nowMs: number;
}) {
  if (events.length === 0) {
    return (
      <div
        data-testid="isolation-lane-empty"
        style={{
          padding: '24px 20px',
          background: SHELL.CARD_WHITE,
          border: '1px solid ' + SHELL.CARD_LINE,
          borderRadius: 10,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_MUTED,
          textAlign: 'center',
        }}
      >
        No tenant-resolution events in the last 24 hours.
      </div>
    );
  }
  return (
    <div
      data-testid="isolation-lane-table"
      style={{
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 10,
        overflowX: 'auto',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'auto',
        }}
      >
        <thead>
          <tr>
            <th style={TABLE_HEAD_STYLE}>Time</th>
            <th style={TABLE_HEAD_STYLE}>Tenant / workflow</th>
            <th style={TABLE_HEAD_STYLE}>User</th>
            <th style={TABLE_HEAD_STYLE}>Intended → resolved</th>
            <th style={TABLE_HEAD_STYLE}>Severity</th>
            <th style={TABLE_HEAD_STYLE}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <EventRow key={event.id} event={event} nowMs={nowMs} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Top-level lane ──────────────────────────────────────────────────────────

export function IsolationLane({
  posture,
  refreshedAtIso,
  nowMs: nowMsOverride,
}: IsolationLaneProps) {
  // Reference time for every relative-time render. We use the
  // request-time `refreshedAtIso` as the reference so the component
  // stays pure — no Date.now() calls during render.
  const parsed = Date.parse(refreshedAtIso);
  const nowMs = nowMsOverride ?? (Number.isFinite(parsed) ? parsed : 0);
  return (
    <div
      data-testid="isolation-lane"
      style={{
        flex: 1,
        overflowY: 'auto',
        background: SHELL.PAPER,
        padding: '24px 32px',
      }}
    >
      {/* Eyebrow + header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 6,
            lineHeight: 1,
          }}
        >
          Admin · Audit
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.PEACH_TEXT,
            marginBottom: 8,
            lineHeight: 1,
          }}
        >
          Canonical route · /admin/audit?tab=isolation
        </div>
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 24,
            fontWeight: 700,
            color: SHELL.INK,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          Isolation · tenant-resolution audit
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: '8px 0 0 0',
            lineHeight: 1.5,
            maxWidth: 720,
          }}
        >
          The last 24 hours of AI-egress audit events for this tenant.
          An admin can answer &ldquo;did anything cross tenants?&rdquo;
          from this lane without leaving Setup.
        </p>
      </div>

      <HeaderStrip
        posture={posture}
        refreshedAtIso={refreshedAtIso}
        nowMs={nowMs}
      />

      {posture.topAnomaly ? (
        <AnomalyCallout topAnomaly={posture.topAnomaly} nowMs={nowMs} />
      ) : null}

      <EventsTable events={posture.recentEvents} nowMs={nowMs} />
    </div>
  );
}
