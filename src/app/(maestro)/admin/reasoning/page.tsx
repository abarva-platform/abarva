// /admin/reasoning — Reasoning telemetry dashboard.
//
// Server component. Reads up to 200 most-recent synthesis telemetry events
// from the in-process ring buffer, computes aggregated stats, and renders
// the operator view: summary tiles, per-surface breakdown, and a table of
// recent events. No client JS needed — values are point-in-time and the
// admin layout enforces dynamic rendering via `force-dynamic`.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  getRecentSynthesisEvents,
  type SynthesisSurface,
  type SynthesisTelemetryEvent,
} from '@/lib/reasoning/synthesis-telemetry';
import {
  summarizeTelemetry,
  type SurfaceStats,
  type TelemetrySummary,
} from '@/lib/reasoning/synthesis-telemetry-stats';
import { ReasoningHealthBadge } from '@/components/reasoning/ReasoningHealthBadge';

export const metadata = {
  title: 'Reasoning telemetry · AbarVa Admin',
};

const SURFACE_ORDER: ReadonlyArray<SynthesisSurface> = ['source', 'programs', 'tower'];

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMs(value: number): string {
  if (value === 0) return '0 ms';
  return `${Math.round(value)} ms`;
}

function formatNum(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function formatTimestamp(iso: string): string {
  // Compact local-ish form for the table without dragging a date library in.
  // Falls back to raw string if parsing fails.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function HeaderCard({ totalEvents }: { totalEvents: number }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Reasoning telemetry
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Last 200 events
        </div>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: `${COLORS.ink}99`,
        }}
      >
        {totalEvents} event{totalEvents === 1 ? '' : 's'} in window
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 120,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function StatGrid({ summary }: { summary: TelemetrySummary }) {
  const feedbackTotal = summary.feedback.thumbsUp + summary.feedback.thumbsDown;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <StatTile
        label="Cache hit rate"
        value={formatPct(summary.cacheHitRate)}
        sub={`${summary.totalEvents} synthesis calls`}
      />
      <StatTile
        label="Mean latency"
        value={formatMs(summary.meanLatencyMs)}
        sub={`median ${formatMs(summary.medianLatencyMs)}`}
      />
      <StatTile
        label="Feedback ratio"
        value={feedbackTotal === 0 ? '—' : formatPct(summary.feedback.ratio)}
        sub={`${summary.feedback.thumbsUp} up · ${summary.feedback.thumbsDown} down · ${summary.feedback.noFeedback} silent`}
      />
      <StatTile
        label="Mean signals"
        value={formatNum(summary.meanCitationCount)}
        sub={`citations · ${formatNum(summary.meanContradictionCount)} contradictions · ${formatNum(summary.meanFailureModeCount)} failure modes`}
      />
    </div>
  );
}

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

function SurfaceBreakdownTable({
  surfaceStats,
}: {
  surfaceStats: Record<SynthesisSurface, SurfaceStats>;
}) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: `${SPACING.md} ${SPACING.lg}`, borderBottom: `1px solid ${COLORS.ink}10` }}>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Surface breakdown
        </h2>
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Surface</th>
            <th style={HEADER_CELL}>Events</th>
            <th style={HEADER_CELL}>Cache hit %</th>
            <th style={HEADER_CELL}>Median ms</th>
            <th style={HEADER_CELL}>Up / Down</th>
          </tr>
        </thead>
        <tbody>
          {SURFACE_ORDER.map((surface) => {
            const s = surfaceStats[surface];
            return (
              <tr key={surface}>
                <td style={{ ...BODY_CELL, textTransform: 'capitalize', fontWeight: 600 }}>{surface}</td>
                <td style={MONO_CELL}>{s.events}</td>
                <td style={MONO_CELL}>{s.events === 0 ? '—' : formatPct(s.cacheHitRate)}</td>
                <td style={MONO_CELL}>{s.events === 0 ? '—' : formatMs(s.medianLatencyMs)}</td>
                <td style={MONO_CELL}>
                  {s.thumbsUp} / {s.thumbsDown}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function FeedbackPill({ feedback }: { feedback: SynthesisTelemetryEvent['feedback'] }) {
  if (feedback === 'up') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: COLORS.mintSoft,
          color: COLORS.mintInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        up
      </span>
    );
  }
  if (feedback === 'down') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: COLORS.coralSoft,
          color: COLORS.coralInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        down
      </span>
    );
  }
  return (
    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>—</span>
  );
}

function CacheBadge({ hit }: { hit: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: hit ? COLORS.skyPale : `${COLORS.ink}08`,
        color: hit ? COLORS.navy : `${COLORS.ink}99`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {hit ? 'HIT' : 'MISS'}
    </span>
  );
}

function RecentEventsTable({ events }: { events: SynthesisTelemetryEvent[] }) {
  const visible = events.slice(0, 50);
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Recent events
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          showing {visible.length} of {events.length}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Timestamp</th>
              <th style={HEADER_CELL}>Surface</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={HEADER_CELL}>Cache</th>
              <th style={HEADER_CELL}>ms</th>
              <th style={HEADER_CELL}>cit / con / fm</th>
              <th style={HEADER_CELL}>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((event) => (
              <tr key={event.id}>
                <td style={MONO_CELL}>{formatTimestamp(event.timestamp)}</td>
                <td style={{ ...BODY_CELL, textTransform: 'capitalize' }}>{event.surface}</td>
                <td style={MONO_CELL}>{event.instanceId}</td>
                <td style={MONO_CELL}>{event.patternId ?? '—'}</td>
                <td style={BODY_CELL}>
                  <CacheBadge hit={event.cacheHit} />
                </td>
                <td style={MONO_CELL}>{event.latencyMs}</td>
                <td style={MONO_CELL}>
                  {event.citationCount} / {event.contradictionCount} / {event.failureModeCount}
                </td>
                <td style={BODY_CELL}>
                  <FeedbackPill feedback={event.feedback} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}aa`,
        lineHeight: 1.5,
      }}
    >
      No synthesis events yet — interact with a Source or Programs detail page
      to populate the buffer.
    </div>
  );
}

function TopPatterns({ summary }: { summary: TelemetrySummary }) {
  if (summary.topPatterns.length === 0) return null;
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        Top patterns
      </span>
      {summary.topPatterns.map((p) => (
        <span
          key={p.patternId}
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.ink,
            background: COLORS.skyPale,
            borderRadius: RADIUS.pill,
            padding: '4px 10px',
          }}
        >
          {p.patternId} · {p.count}
        </span>
      ))}
    </section>
  );
}

export default async function ReasoningTelemetryPage() {
  const events = getRecentSynthesisEvents(200);
  const summary = summarizeTelemetry(events);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Telemetry"
        title="Synthesis dashboard"
        subtitle="Live operator view of the reasoning layer. Each row is one synthesis call — cache hits, latency, citation grounding, contradictions, failure modes, and the user's thumbs signal."
      >
        <HeaderCard totalEvents={summary.totalEvents} />
        <ReasoningHealthBadge />
        {summary.totalEvents === 0 ? (
          <EmptyState />
        ) : (
          <>
            <StatGrid summary={summary} />
            <TopPatterns summary={summary} />
            <SurfaceBreakdownTable surfaceStats={summary.bySurface} />
            <RecentEventsTable events={events} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
