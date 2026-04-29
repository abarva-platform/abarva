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
import {
  getRecentCascadeEvents,
  type CascadeTelemetryEvent,
} from '@/lib/reasoning/cascade-telemetry';
import { ReasoningHealthBadge } from '@/components/reasoning/ReasoningHealthBadge';
import { ContradictionResolutionPanel } from '@/components/reasoning/ContradictionResolutionPanel';
import { DemoResetButton } from '@/components/admin/reasoning/DemoResetButton';
import { ReasoningMetricsSection } from '@/components/admin/reasoning/ReasoningMetricsSection';
import { detectContradictions } from '@/lib/reasoning/contradiction-detector';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { ContradictionDetection } from '@/lib/reasoning/types';

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

function ExportPill() {
  // Uses a native <details>/<summary> disclosure so the dropdown opens
  // without any client-side JavaScript. Each link points at the export
  // route with `target=_blank` so the browser handles the file download
  // (Content-Disposition: attachment) without leaving the dashboard.
  const linkStyle: React.CSSProperties = {
    display: 'block',
    padding: `${SPACING.xs} ${SPACING.md}`,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 12,
    color: COLORS.ink,
    textDecoration: 'none',
    borderRadius: RADIUS.sm,
  };
  return (
    <details style={{ position: 'relative' }}>
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: COLORS.skyPale,
          color: COLORS.navy,
          borderRadius: RADIUS.pill,
          padding: '6px 14px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          border: `1px solid ${COLORS.navy}22`,
        }}
      >
        Export
        <span
          aria-hidden="true"
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, opacity: 0.7 }}
        >
          ▾
        </span>
      </summary>
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: 200,
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}22`,
          borderRadius: RADIUS.md,
          padding: SPACING.xs,
          boxShadow: `0 8px 24px ${COLORS.ink}1a`,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <a
          href="/api/reasoning/telemetry/export?format=csv"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Download CSV
        </a>
        <a
          href="/api/reasoning/telemetry/export?format=json"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Download JSON
        </a>
        <a
          href="/api/reasoning/telemetry/export?format=json&pretty=1"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Download JSON (pretty)
        </a>
      </div>
    </details>
  );
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
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          {totalEvents} event{totalEvents === 1 ? '' : 's'} in window
        </div>
        <ExportPill />
        <DemoResetButton />
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

type ToolEntry = {
  title: string;
  href: string;
  description: string;
};

const TOOL_ENTRIES: ReadonlyArray<ToolEntry> = [
  {
    title: 'Health Board',
    href: '/admin/reasoning/health',
    description: 'At-a-glance health verdict for every fixture instance — source events and programs',
  },
  {
    title: 'Templates editor',
    href: '/admin/reasoning/templates',
    description: 'Edit contradiction template detection hints in-memory',
  },
  {
    title: 'Coverage audit',
    href: '/admin/reasoning/coverage',
    description: 'Which templates fire across the fixture corpus',
  },
  {
    title: 'Weekly digest',
    href: '/admin/reasoning/digest',
    description: 'Last-7-days synthesis activity per instance',
  },
  {
    title: 'Weekly digest · Print view',
    href: '/admin/reasoning/digest/print',
    description: 'Print- and PDF-ready layout · auto-opens print dialog',
  },
  {
    title: 'Pattern analytics',
    href: '/admin/reasoning/patterns',
    description: 'Pattern usage and event distribution',
  },
  {
    title: 'Fixture quality lint',
    href: '/admin/reasoning/fixture-lint',
    description: 'Instance ↔ pattern drift checks',
  },
  {
    title: 'Audit Trail',
    href: '/admin/reasoning/audit',
    description: 'Log of all reasoning actions — gate waivers, contradiction resolutions, and synthesis feedback',
  },
];

function ToolCard({ entry }: { entry: ToolEntry }) {
  return (
    <a
      href={entry.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        textDecoration: 'none',
        color: COLORS.ink,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {entry.title}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
            }}
          >
            {entry.href}
          </span>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
            lineHeight: 1.4,
          }}
        >
          {entry.description}
        </span>
      </div>
      <span
        aria-hidden="true"
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 18,
          color: COLORS.navy,
          flexShrink: 0,
        }}
      >
        →
      </span>
    </a>
  );
}

function ToolsDirectory() {
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
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Tools
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Reasoning admin sub-routes
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {TOOL_ENTRIES.length} tool{TOOL_ENTRIES.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {TOOL_ENTRIES.map((entry) => (
          <ToolCard key={entry.href} entry={entry} />
        ))}
      </div>
    </section>
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

function CascadeSeverityPill({
  severity,
}: {
  severity: CascadeTelemetryEvent['severity'];
}) {
  const palette =
    severity === 'high'
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : severity === 'medium'
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}99` };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {severity}
    </span>
  );
}

function CascadeHitsTile({ events }: { events: CascadeTelemetryEvent[] }) {
  const recent = events.slice(0, 5);
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
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Cascade hits
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Cross-instance impacts surfaced in synthesis context builds
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          {events.length} event{events.length === 1 ? '' : 's'}
        </span>
      </header>
      {recent.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
          }}
        >
          No cascade impacts recorded yet — visit a Source, Programs, or Tower
          synthesis route to populate this buffer.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Timestamp</th>
                <th style={HEADER_CELL}>Source</th>
                <th style={HEADER_CELL}>Target</th>
                <th style={HEADER_CELL}>Link</th>
                <th style={HEADER_CELL}>Severity</th>
                <th style={HEADER_CELL}>Impact</th>
                <th style={HEADER_CELL}>Build context</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((event) => (
                <tr key={event.id}>
                  <td style={MONO_CELL}>{formatTimestamp(event.timestamp)}</td>
                  <td style={MONO_CELL}>{event.sourceInstanceId}</td>
                  <td style={MONO_CELL}>{event.targetInstanceId}</td>
                  <td style={MONO_CELL}>{event.linkType}</td>
                  <td style={BODY_CELL}>
                    <CascadeSeverityPill severity={event.severity} />
                  </td>
                  <td style={BODY_CELL}>
                    {event.impactSeverity ? (
                      <CascadeSeverityPill severity={event.impactSeverity} />
                    ) : (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td style={MONO_CELL}>{event.buildContext}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Contradiction Resolution Section ────────────────────────────────────────

/**
 * Gathers all active (non-resolved) contradictions across the fixture corpus
 * (source instances + program instances) by running the detector against each
 * bound pattern. Deduplicates by templateId — if the same template fires on
 * multiple instances the first detection is kept.
 */
function gatherActiveContradictions(): ContradictionDetection[] {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  // Build pattern-keyed evidence maps so we only iterate once.
  const srcByPattern = new Map<string, Array<{ evidenceMap: Record<string, unknown> }>>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const list = srcByPattern.get(inst.patternId) ?? [];
    list.push({ evidenceMap: buildEvidenceMap(inst) });
    srcByPattern.set(inst.patternId, list);
  }
  const prgByPattern = new Map<string, Array<{ evidenceMap: Record<string, unknown> }>>();
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const list = prgByPattern.get(inst.patternId) ?? [];
    list.push({ evidenceMap: buildProgramEvidenceMap(inst) });
    prgByPattern.set(inst.patternId, list);
  }

  const seen = new Set<string>();
  const out: ContradictionDetection[] = [];

  for (const pattern of ALL_PATTERNS) {
    const instances = [
      ...(srcByPattern.get(pattern.patternId) ?? []),
      ...(prgByPattern.get(pattern.patternId) ?? []),
    ];
    for (const { evidenceMap } of instances) {
      const detections = detectContradictions(pattern, evidenceMap);
      for (const d of detections) {
        if (!seen.has(d.templateId)) {
          seen.add(d.templateId);
          out.push(d);
        }
      }
    }
  }

  return out;
}

function ContradictionResolutionSection({
  contradictions,
}: {
  contradictions: ContradictionDetection[];
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
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Contradiction Resolution
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Active contradictions across the fixture corpus — mark resolved to dismiss
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          {contradictions.length} active
        </span>
      </header>
      <div style={{ padding: SPACING.md }}>
        <ContradictionResolutionPanel contradictions={contradictions} />
      </div>
    </section>
  );
}

export default async function ReasoningTelemetryPage({
  searchParams,
}: {
  // Next 16 typed search params: a Promise of the parsed query string. We
  // accept a single optional `?tenantId=...` filter and forward it to the
  // telemetry readers. With one tenant in fixtures the filter is a no-op
  // today; the wiring is what matters for the multi-tenant scaffolding.
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const rawTenant = params.tenantId;
  const tenantId =
    typeof rawTenant === 'string' && rawTenant.length > 0 ? rawTenant : undefined;
  const filterOptions = tenantId !== undefined ? { tenantId } : undefined;

  const events = getRecentSynthesisEvents(200, filterOptions);
  const summary = summarizeTelemetry(events);
  const cascadeEvents = getRecentCascadeEvents(200, filterOptions);
  const activeContradictions = gatherActiveContradictions();

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
        <ReasoningMetricsSection />
        <ToolsDirectory />
        <ContradictionResolutionSection contradictions={activeContradictions} />
        {summary.totalEvents === 0 ? (
          <EmptyState />
        ) : (
          <>
            <StatGrid summary={summary} />
            <TopPatterns summary={summary} />
            <SurfaceBreakdownTable surfaceStats={summary.bySurface} />
            <CascadeHitsTile events={cascadeEvents} />
            <RecentEventsTable events={events} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
