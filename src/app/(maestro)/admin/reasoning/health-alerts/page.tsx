// /admin/reasoning/health-alerts — Triage view of at-risk instances.
//
// Server component. Builds health rows from the full fixture corpus, computes
// composite scores, classifies each instance into one or more alert tiers, and
// shows only the highest severity alert per instance. Sorted severity-desc,
// score-asc so the most critical items surface first.
//
// Alert tiers:
//   CRITICAL — healthLabel === 'critical' OR score < 40
//   HIGH     — activeContradictions >= 3
//   MEDIUM   — gatesMet < gatesTotal * 0.5 AND score < 60
//   LOW      — any instance not 'healthy'

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health alerts · AbarVa Admin',
};

// ─── Composite score ──────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Alert classification ─────────────────────────────────────────────────────

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface AlertedRow {
  row: InstanceHealthRow;
  score: number;
  severity: AlertSeverity;
  reason: string;
}

function classifyRow(row: InstanceHealthRow, score: number): AlertSeverity | null {
  const isCritical = row.healthLabel === 'critical' || score < 40;
  if (isCritical) return 'critical';
  if (row.activeContradictions >= 3) return 'high';
  if (row.gatesMet < row.gatesTotal * 0.5 && score < 60) return 'medium';
  if (row.healthLabel !== 'healthy') return 'low';
  return null;
}

function buildAlertReason(row: InstanceHealthRow, score: number, severity: AlertSeverity): string {
  const parts: string[] = [`Score ${score}`];
  if (row.activeContradictions > 0) {
    const pluralised =
      row.activeContradictions === 1
        ? '1 active contradiction blocking progress'
        : `${row.activeContradictions} active contradictions blocking progress`;
    parts.push(pluralised);
  }
  const unmet = row.gatesTotal - row.gatesMet;
  if (unmet > 0) {
    parts.push(
      `${row.gatesMet}/${row.gatesTotal} gates met (${unmet} pending)`,
    );
  }
  if (severity === 'critical') {
    if (row.healthLabel === 'critical') parts.push('health label: critical');
    if (score < 40) parts.push('score below critical threshold');
  }
  return parts.join(' — ');
}

function buildAlertedRows(rows: InstanceHealthRow[]): AlertedRow[] {
  const alerted: AlertedRow[] = [];
  for (const row of rows) {
    const score = computeScore(row);
    const severity = classifyRow(row, score);
    if (severity === null) continue;
    alerted.push({
      row,
      score,
      severity,
      reason: buildAlertReason(row, score, severity),
    });
  }
  // Sort: severity asc (critical=0 first), then score asc (worst first within tier)
  alerted.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.score - b.score,
  );
  return alerted;
}

// ─── Severity palette ─────────────────────────────────────────────────────────

interface SeverityPalette {
  bar: string;
  bg: string;
  text: string;
  label: string;
}

function severityPalette(severity: AlertSeverity): SeverityPalette {
  if (severity === 'critical') {
    return { bar: SHELL.RUST_TEXT, bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'Critical' };
  }
  if (severity === 'high') {
    return { bar: SHELL.AMBER_DOT, bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT, label: 'High' };
  }
  if (severity === 'medium') {
    return { bar: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Medium' };
  }
  return { bar: SHELL.GRAY_TEXT, bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Low' };
}

// ─── Score band ───────────────────────────────────────────────────────────────

interface ScorePalette {
  bar: string;
  text: string;
}

function scorePalette(score: number): ScorePalette {
  if (score >= 70) return { bar: SHELL.MINT_TEXT, text: SHELL.MINT_TEXT };
  if (score >= 40) return { bar: SHELL.AMBER_DOT, text: SHELL.AMBER_DOT };
  return { bar: SHELL.RUST_TEXT, text: SHELL.RUST_TEXT };
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  critical,
  high,
  medium,
}: {
  total: number;
  critical: number;
  high: number;
  medium: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 24,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          fontWeight: 700,
        }}
      >
        {total} alert{total !== 1 ? 's' : ''}
      </div>
      <div
        style={{
          width: 1,
          height: 28,
          background: `${COLORS.ink}18`,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      {critical > 0 && (
        <StripCount count={critical} label="critical" color={SHELL.RUST_TEXT} />
      )}
      {high > 0 && (
        <StripCount count={high} label="high" color={SHELL.AMBER_DOT} />
      )}
      {medium > 0 && (
        <StripCount count={medium} label="medium" color={SHELL.PEACH_TEXT} />
      )}
      {total - critical - high - medium > 0 && (
        <StripCount count={total - critical - high - medium} label="low" color={SHELL.GRAY_TEXT} />
      )}
    </div>
  );
}

function StripCount({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color,
          letterSpacing: '-0.01em',
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function AllClearBanner({ total }: { total: number }) {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          color: SHELL.MINT_TEXT,
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        All {total} instances are healthy.
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: SHELL.MINT_TEXT,
          opacity: 0.8,
        }}
      >
        No alerts to display at this time. Refresh to check current state.
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? SHELL.BLUE_BG : `${COLORS.ink}0c`,
        color: isSource ? SHELL.INK_MID : SHELL.INK_SOFT,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {type}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const p = severityPalette(severity);
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        border: `1px solid ${p.text}33`,
      }}
    >
      {p.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const p = scorePalette(score);
  const pct = Math.min(score, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: `${COLORS.ink}0e`,
          borderRadius: 3,
          overflow: 'hidden',
          minWidth: 80,
          maxWidth: 160,
        }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score ${score}/100`}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: p.bar,
            borderRadius: 3,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          fontWeight: 700,
          color: p.text,
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

function AlertCard({ alerted }: { alerted: AlertedRow }) {
  const { row, score, severity, reason } = alerted;
  const sp = severityPalette(severity);
  const stage = row.stageLabel ?? row.phaseLabel ?? '—';

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* Severity bar */}
      <div
        aria-hidden="true"
        style={{
          width: 4,
          flexShrink: 0,
          background: sp.bar,
        }}
      />

      {/* Card body */}
      <div
        style={{
          flex: 1,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {/* Header row: name + badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {row.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                }}
              >
                {row.id}
              </span>
              <TypeBadge type={row.type} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}99`,
                }}
              >
                {row.type === 'source' ? 'Stage:' : 'Phase:'}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: COLORS.ink,
                }}
              >
                {stage}
              </span>
            </div>
          </div>
          <SeverityBadge severity={severity} />
        </div>

        {/* Score bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            paddingTop: 4,
            borderTop: `1px solid ${COLORS.ink}0c`,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              whiteSpace: 'nowrap',
            }}
          >
            Health score
          </span>
          <ScoreBar score={score} />
        </div>

        {/* Alert reason */}
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: sp.text,
            lineHeight: 1.45,
            background: sp.bg,
            borderRadius: RADIUS.sm,
            padding: `${SPACING.xs} ${SPACING.sm}`,
          }}
        >
          {reason}
        </div>

        {/* Action links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, flexWrap: 'wrap' }}>
          <a
            href={`/admin/reasoning/instances/${row.id}`}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              color: SHELL.INK_MID,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View instance
            <span aria-hidden="true" style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 14 }}>
              →
            </span>
          </a>
          <a
            href="/admin/reasoning/bulk-waiver"
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Manage waivers
            <span aria-hidden="true" style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 14 }}>
              →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function SeveritySection({
  severity,
  alerts,
}: {
  severity: AlertSeverity;
  alerts: AlertedRow[];
}) {
  if (alerts.length === 0) return null;
  const p = severityPalette(severity);
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: p.bar,
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            fontWeight: 700,
            color: p.text,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {p.label}
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {alerts.length} instance{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {alerts.map((a) => (
          <div key={a.row.id}>
            <AlertCard alerted={a} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthAlertsPage() {
  const rows = buildHealthBoardRows();
  const alertedRows = buildAlertedRows(rows);

  const criticalAlerts = alertedRows.filter((a) => a.severity === 'critical');
  const highAlerts = alertedRows.filter((a) => a.severity === 'high');
  const mediumAlerts = alertedRows.filter((a) => a.severity === 'medium');
  const lowAlerts = alertedRows.filter((a) => a.severity === 'low');

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Health alerts"
        subtitle="Instances requiring attention, ranked by severity. Refresh for current state."
      >
        {alertedRows.length === 0 ? (
          <AllClearBanner total={rows.length} />
        ) : (
          <>
            <SummaryStrip
              total={alertedRows.length}
              critical={criticalAlerts.length}
              high={highAlerts.length}
              medium={mediumAlerts.length}
            />
            <SeveritySection severity="critical" alerts={criticalAlerts} />
            <SeveritySection severity="high" alerts={highAlerts} />
            <SeveritySection severity="medium" alerts={mediumAlerts} />
            <SeveritySection severity="low" alerts={lowAlerts} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
