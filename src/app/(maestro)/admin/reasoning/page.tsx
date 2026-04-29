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
import { ReasoningErrorBoundary } from '@/components/reasoning/ReasoningErrorBoundary';
import { DemoResetButton } from '@/components/admin/reasoning/DemoResetButton';
import { DemoScenarioPanel } from '@/components/admin/reasoning/DemoScenarioPanel';
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
    title: 'Audit log',
    href: '/admin/reasoning/audit',
    description: 'Live chronological log of gate waivers, approvals, and contradiction resolutions',
  },
  {
    title: 'Evidence Quality',
    href: '/admin/reasoning/evidence-quality',
    description: 'Quality scores for every evidence item across all fixture instances — grade distribution, stale callout, CSV export',
  },
  {
    title: 'Corpus Stats',
    href: '/admin/reasoning/corpus-stats',
    description: 'Body-length distribution, family breakdown, top keywords, and pattern extremes across the full reasoning corpus',
  },
  {
    title: 'Active contradictions',
    href: '/admin/reasoning/contradictions',
    description: 'Cross-instance view of all active unresolved contradictions',
  },
  {
    title: 'Waiver Analysis',
    href: '/admin/reasoning/waiver-analysis',
    description: 'Deep-dive waiver patterns — frequency by instance and criterion, concentration risk, waiver-free instances.',
  },
  {
    title: 'Feedback stats',
    href: '/admin/reasoning/feedback-stats',
    description: 'Aggregated synthesis feedback ratings per surface and instance',
  },
  {
    title: 'Pattern metrics',
    href: '/admin/reasoning/pattern-metrics',
    description: 'Per-pattern instance usage, contradiction counts, and gate coverage',
  },
  {
    title: 'Evidence gaps',
    href: '/admin/reasoning/evidence-gaps',
    description: 'Unmet gate criteria with zero supporting evidence — missing evidence ranked by frequency across instances',
  },
  {
    title: 'Phase matrix',
    href: '/admin/reasoning/phase-matrix',
    description: 'Cross-program × phase gate coverage grid',
  },
  {
    title: 'Changelog',
    href: '/admin/reasoning/changelog',
    description: '114-entry audit history of all reasoning system changes by wave',
  },
  {
    title: 'Scorecard',
    href: '/admin/reasoning/scorecard',
    description: 'All instances ranked by composite reasoning health score',
  },
  {
    title: 'Demo panel',
    href: '/admin/reasoning/demo-panel',
    description: 'Trigger pre-built demo scenarios: green-path, red-alert, mid-review',
  },
  {
    title: 'Contradiction matrix',
    href: '/admin/reasoning/contradiction-matrix',
    description: 'Template × instance grid showing active and resolved contradictions',
  },
  {
    title: 'Export report',
    href: '/admin/reasoning/export',
    description: 'Download a Markdown reasoning health report for presentations and briefings',
  },
  {
    title: 'Source timeline',
    href: '/admin/reasoning/source-timeline',
    description: 'Visual timeline showing all source events at their current procurement lifecycle stage',
  },
  {
    title: 'Pattern explorer',
    href: '/admin/reasoning/patterns',
    description: 'Data-dictionary view of all lifecycle patterns — stages, gate criteria, contradiction templates',
  },
  {
    title: 'Health snapshot',
    href: '/admin/reasoning/snapshot',
    description: 'Auto-refreshing portfolio health dashboard with headline metrics — ideal for demo display',
  },
  {
    title: 'Playground',
    href: '/admin/reasoning/playground',
    description: 'Interactive gate evaluation — toggle evidence to see how coverage changes',
  },
  {
    title: 'Evidence catalog',
    href: '/admin/reasoning/evidence-catalog',
    description: 'Dictionary of all evidence types referenced across gate criteria, grouped by pattern',
  },
  {
    title: 'Bulk waiver',
    href: '/admin/reasoning/bulk-waiver',
    description: 'Apply gate waivers to multiple criteria at once — useful for demo preparation',
  },
  {
    title: 'Pattern compare',
    href: '/admin/reasoning/pattern-compare',
    description: 'Side-by-side comparison of two lifecycle patterns — stages, gates, contradiction templates',
  },
  {
    title: 'Resolution log',
    href: '/admin/reasoning/resolution-log',
    description: 'All contradiction templates currently marked resolved — in-memory store state',
  },
  {
    title: 'Instance compare',
    href: '/admin/reasoning/instance-compare',
    description: 'Side-by-side health metrics comparison for any two instances',
  },
  {
    title: 'Waiver log',
    href: '/admin/reasoning/waiver-log',
    description: 'All active gate waivers across instances — current in-memory state',
  },
  {
    title: 'Gate approvals',
    href: '/admin/reasoning/gate-approvals',
    description: 'Gate advancement approval records — which instances advanced through which stages',
  },
  {
    title: 'Failure modes',
    href: '/admin/reasoning/failure-modes',
    description: 'Catalog of all failure modes across lifecycle patterns with affected stages and mitigations',
  },
  {
    title: 'Contradiction browser',
    href: '/admin/reasoning/contradiction-browser',
    description: 'Full dictionary of contradiction templates with live resolution status and severity breakdown',
  },
  {
    title: 'Gate status matrix',
    href: '/admin/reasoning/gate-status-matrix',
    description: 'Hard gate criteria × instances grid — met/waived/unmet/N/A status at a glance',
  },
  {
    title: 'Risk register',
    href: '/admin/reasoning/risk-register',
    description: 'Portfolio-wide risk register — all contradictions and failure modes ranked by severity',
  },
  {
    title: 'Artifact tracker',
    href: '/admin/reasoning/artifacts',
    description: 'Expected vs submitted artifacts across all instances — identifies missing and draft items',
  },
  {
    title: 'Governance flags',
    href: '/admin/reasoning/governance-flags',
    description: 'All governance flags across instances — blockers, risks, exceptions, and notes',
  },
  {
    title: 'Stage transitions',
    href: '/admin/reasoning/stage-transitions',
    description: 'Chronological log of all stage advancement events across source event instances',
  },
  {
    title: 'Pattern health',
    href: '/admin/reasoning/pattern-health',
    description: 'Health metrics aggregated by lifecycle pattern — avg score, contradictions, gate coverage',
  },
  {
    title: 'Evidence ingest',
    href: '/admin/reasoning/evidence-ingest',
    description: 'Inject evidence fields into instances to trigger gate evaluation changes — demo affordance',
  },
  {
    title: 'Vendor tracker',
    href: '/admin/reasoning/vendor-tracker',
    description: 'All vendor participants across source events with status and selection tracking',
  },
  {
    title: 'Evidence coverage',
    href: '/admin/reasoning/evidence-coverage',
    description: 'Evidence map contents per instance — what data the gate evaluator sees for each instance',
  },
  {
    title: 'Linked instances',
    href: '/admin/reasoning/linked-instances',
    description: 'Cross-instance dependency map — program links, source event links, and blocking dependencies',
  },
  {
    title: 'Sponsor directory',
    href: '/admin/reasoning/sponsors',
    description: 'All sponsors across instances with their portfolio responsibilities',
  },
  {
    title: 'Co-application map',
    href: '/admin/reasoning/co-application',
    description: 'Lifecycle patterns that commonly appear together — defined and observed relationships',
  },
  {
    title: 'Contradiction debug',
    href: '/admin/reasoning/contradiction-debug',
    description: 'Per-instance contradiction detection — active, resolved, and non-firing templates with evidence',
  },
  {
    title: 'Vendor responses',
    href: '/admin/reasoning/vendor-responses',
    description: 'All vendor response submissions across source events with completeness tracking',
  },
  {
    title: 'Regulatory reference',
    href: '/admin/reasoning/regulatory',
    description: 'All regulatory and compliance tags across lifecycle patterns with active instance coverage',
  },
  {
    title: 'Health alerts',
    href: '/admin/reasoning/health-alerts',
    description: 'At-risk instances requiring attention — critical, high, medium, and low severity alerts',
  },
  {
    title: 'Health simulator',
    href: '/admin/reasoning/health-simulator',
    description: 'What-if score projections — adjust gates and contradictions to see health score changes',
  },
  {
    title: 'Pattern domains',
    href: '/admin/reasoning/pattern-domains',
    description: 'Lifecycle patterns organized by domain and tier with active instance counts',
  },
  {
    title: 'Related patterns',
    href: '/admin/reasoning/related-patterns',
    description: 'Pattern similarity and derivation lineage — related-to and derived-from relationships',
  },
  {
    title: 'Gate weights',
    href: '/admin/reasoning/gate-weights',
    description: 'Gate criteria ranked by weight — highest-weight unmet gates and score improvement opportunities',
  },
  {
    title: 'Pattern docs',
    href: '/admin/reasoning/pattern-docs',
    description: 'Full documentation browser for lifecycle patterns — thesis, applicability, and body text',
  },
  {
    title: 'Contradiction frequency',
    href: '/admin/reasoning/contradiction-frequency',
    description: 'Which contradiction templates fire most often across instances — frequency ranking and resolution rates',
  },
  {
    title: 'Pattern confidence',
    href: '/admin/reasoning/pattern-confidence',
    description: 'Lifecycle patterns ranked by confidence score with validation status and instance counts',
  },
  {
    title: 'Demo state',
    href: '/admin/reasoning/demo-state',
    description: 'Current state of all in-memory stores — waivers, resolutions, evidence, stage overrides, and audit trail',
  },
  {
    title: 'Source documents',
    href: '/admin/reasoning/source-documents',
    description: 'All source document references across lifecycle patterns — the knowledge base behind each pattern',
  },
  {
    title: 'Portfolio trend',
    href: '/admin/reasoning/portfolio-trend',
    description: 'Stage progression timeline across all instances — derived from stage history timestamps',
  },
  {
    title: 'Synthesis preview',
    href: '/admin/reasoning/synthesis-preview',
    description: 'L4 synthesis output for any instance — reasoning layer assessment, findings, and recommendations',
  },
  {
    title: 'Stage dwell',
    href: '/admin/reasoning/stage-dwell',
    description: 'Per-instance time-in-current-stage metrics — ranked by longest dwell, with freshness thresholds',
  },
  {
    title: 'Evidence timeline',
    href: '/admin/reasoning/evidence-timeline',
    description: 'Chronological log of all evidence ingestions across instances — grouped by day',
  },
  {
    title: 'Pattern usage',
    href: '/admin/reasoning/pattern-usage',
    description: 'Pattern adoption analytics — instance count per lifecycle pattern broken down by tenant',
  },
  {
    title: 'Gate heatmap',
    href: '/admin/reasoning/gate-heatmap',
    description: 'Stage-level gate pass-rate heatmap — average gate satisfaction per stage across all instances',
  },
  {
    title: 'Resolution flow',
    href: '/admin/reasoning/resolution-flow',
    description: 'Contradiction resolution history — which paths were chosen and how resolutions affected instance health',
  },
  {
    title: 'Audit trail',
    href: '/admin/reasoning/audit-trail',
    description: 'Unified event log — gate waivers, contradiction resolutions, evidence ingestions, and stage approvals in one view',
  },
  {
    title: 'Instance scorecard',
    href: '/admin/reasoning/instance-scorecard',
    description: 'Full scorecard comparison — health score, gates, contradictions, evidence, and waivers for every instance',
  },
  {
    title: 'Criterion detail',
    href: '/admin/reasoning/criterion-detail',
    description: 'Every gate criterion across all patterns with per-instance pass rates and hardest-criteria ranking',
  },
  {
    title: 'Confidence breakdown',
    href: '/admin/reasoning/confidence-breakdown',
    description: 'Synthesis confidence scores for all instances with factor-level breakdown of what drives confidence',
  },
  {
    title: 'Lifecycle map',
    href: '/admin/reasoning/lifecycle-map',
    description: 'Visual stage-pipeline map for every lifecycle pattern — stages ordered with gate criterion counts',
  },
  {
    title: 'Waiver impact',
    href: '/admin/reasoning/waiver-impact',
    description: 'Health score impact analysis of active gate waivers — current vs. without-waiver scores per instance',
  },
  {
    title: 'Coverage matrix',
    href: '/admin/reasoning/coverage-matrix',
    description: 'Instance × stage evidence coverage matrix — which instances have evidence for which stages',
  },
  {
    title: 'Contradiction network',
    href: '/admin/reasoning/contradiction-network',
    description: 'Co-occurrence network of contradiction templates — which contradictions appear together across instances',
  },
  {
    title: 'Pattern similarity',
    href: '/admin/reasoning/pattern-similarity',
    description: 'Pairwise similarity between lifecycle patterns based on shared gate criteria and contradiction templates',
  },
  {
    title: 'Gate owners',
    href: '/admin/reasoning/gate-owners',
    description: 'Hard gate criterion ownership by stakeholder category — grouped by pattern with distribution chart',
  },
  {
    title: 'Gate gap',
    href: '/admin/reasoning/gate-gap',
    description: 'Current stage gate gap per instance — hard gates remaining before advancement, with ready-to-advance list',
  },
  {
    title: 'Health forecast',
    href: '/admin/reasoning/health-forecast',
    description: 'Projected health scores based on open gates and remaining stages — trajectory and at-risk instances',
  },
  {
    title: 'Instance timeline',
    href: '/admin/reasoning/instance-timeline',
    description: 'Per-instance chronological event stream — stage transitions, evidence, waivers, and resolutions combined',
  },
  {
    title: 'Regulatory map',
    href: '/admin/reasoning/regulatory-map',
    description: 'Regulatory framework coverage across patterns — which regulations affect which instances',
  },
  {
    title: 'Tenant comparison',
    href: '/admin/reasoning/tenant-comparison',
    description: 'Cross-tenant reasoning health metrics — avg score, gate pass rate, and contradiction rate by client',
  },
  {
    title: 'Synthesis diff',
    href: '/admin/reasoning/synthesis-diff',
    description: 'Before/after synthesis confidence comparison for instances with evidence ingestions or contradiction resolutions',
  },
  {
    title: 'Coverage report',
    href: '/admin/reasoning/coverage-report',
    description: 'Pattern richness coverage — gate criteria, contradiction templates, failure modes, and source docs per pattern',
  },
  {
    title: 'Gate sequence',
    href: '/admin/reasoning/gate-sequence',
    description: 'Recommended evaluation order for gate criteria — hard gates first, ordered by stage and priority',
  },
  {
    title: 'Failure tracker',
    href: '/admin/reasoning/failure-tracker',
    description: 'Active vs. latent failure mode tracking — which failure modes are triggered or at risk across instances',
  },
  {
    title: 'Stage blockers',
    href: '/admin/reasoning/stage-blockers',
    description: 'What is blocking each instance from advancing — unmet hard gates ranked by frequency',
  },
  {
    title: 'Pattern lineage',
    href: '/admin/reasoning/pattern-lineage',
    description: 'Pattern derivation tree — root patterns, derived patterns, co-applies relationships, and inheritance chains',
  },
  {
    title: 'Gate velocity',
    href: '/admin/reasoning/gate-velocity',
    description: 'Gate satisfaction velocity per instance — gates met per dwell day with projected completion times',
  },
  {
    title: 'Health history',
    href: '/admin/reasoning/health-history',
    description: 'Reconstructed health score timeline from stage transitions — derived historical health per instance',
  },
  {
    title: 'Contradiction severity',
    href: '/admin/reasoning/contradiction-severity',
    description: 'Active contradiction ranking by severity — critical to low, correlated with instance health scores',
  },
  {
    title: 'Waiver expiry',
    href: '/admin/reasoning/waiver-expiry',
    description: 'Gate waiver age tracking — fresh, aging, and stale waivers flagged for review',
  },
  {
    title: 'Risk score',
    href: '/admin/reasoning/risk-score',
    description: 'Composite instance risk score combining health, contradictions, dwell time, gate gap, and waivers',
  },
  {
    title: 'Pattern benchmark',
    href: '/admin/reasoning/pattern-benchmark',
    description: 'Within-pattern instance benchmarking — best vs. worst performers within each lifecycle pattern group',
  },
  {
    title: 'Contradiction age',
    href: '/admin/reasoning/contradiction-age',
    description: 'Active contradiction age tracking — chronic (>30d), ongoing, and fresh, with resolution urgency',
  },
  {
    title: 'Gate audit',
    href: '/admin/reasoning/gate-audit',
    description: 'Complete gate action audit log — waivers, approvals, and evidence submissions that affect gate status',
  },
  {
    title: 'Pattern stats',
    href: '/admin/reasoning/pattern-stats',
    description: 'Aggregate statistics per lifecycle pattern — stages, criteria, contradictions, failure modes, and instance counts',
  },
  {
    title: 'Citation map',
    href: '/admin/reasoning/citation-map',
    description: 'Source document citation map — which knowledge base documents back which patterns and instances',
  },
  {
    title: 'Stage readiness',
    href: '/admin/reasoning/stage-readiness',
    description: 'Stage-level readiness dashboard — what % of instances in each stage are ready to advance',
  },
  {
    title: 'Pattern gap report',
    href: '/admin/reasoning/pattern-gap',
    description: 'Pattern definition completeness — stages with no gates, missing contradiction templates, failure modes, source docs',
  },
  {
    title: 'Instance comparison',
    href: '/admin/reasoning/instance-comparison',
    description: 'Top vs. bottom performer comparison — side-by-side health metrics for best and worst instances',
  },
  {
    title: 'Health bands',
    href: '/admin/reasoning/health-bands',
    description: 'Health score band distribution — instance counts per band with common pattern and stage analysis',
  },
  {
    title: 'Resolution effectiveness',
    href: '/admin/reasoning/resolution-effectiveness',
    description: 'Contradiction resolution effectiveness — estimated health improvement per resolution and path analysis',
  },
  {
    title: 'Gate radar',
    href: '/admin/reasoning/gate-radar',
    description: '5-dimension gate progress radar — hard gates, soft gates, evidence, waivers, and contradiction-free rate',
  },
  {
    title: 'Activity feed',
    href: '/admin/reasoning/activity-feed',
    description: 'Real-time activity feed — stage transitions, evidence, waivers, and resolutions as event cards',
  },
  {
    title: 'Pattern evolution',
    href: '/admin/reasoning/pattern-evolution',
    description: 'Instance health evolution through pattern stages — how health progresses as instances advance',
  },
  {
    title: 'Instance notes',
    href: '/admin/reasoning/instance-notes',
    description: 'Deterministic advisory notes per instance — health grade, stage advisory, blockers, and contradictions',
  },
  {
    title: 'Gate dependency',
    href: '/admin/reasoning/gate-dependency',
    description: 'Inferred gate criterion dependencies across stages — critical path and dependency chain analysis',
  },
  {
    title: 'Gate export',
    href: '/admin/reasoning/gate-export',
    description: 'Exportable gate status matrix — all instances × all criteria with met/waived/unmet status cells',
  },
  {
    title: 'Alerts dashboard',
    href: '/admin/reasoning/alerts-dashboard',
    description: 'Unified triage dashboard — critical health, stale waivers, chronic contradictions, and long dwell alerts',
  },
  {
    title: 'Contradiction resolver',
    href: '/admin/reasoning/contradiction-resolver',
    description: 'Guided contradiction resolution — all available paths per template with recommended actions and API examples',
  },
  {
    title: 'Instance Risk Matrix',
    href: '/admin/reasoning/instance-risk-matrix',
    description: '2×2 quadrant matrix plotting health vs. contradictions — identify urgent, watch, fragile, and low-risk instances.',
  },
  {
    title: 'Gate Progress Summary',
    href: '/admin/reasoning/gate-progress-summary',
    description: 'Executive KPI strip, stage advancement table, top/bottom performers — consolidated printable view.',
  },
  {
    title: 'Pattern Recommendations',
    href: '/admin/reasoning/pattern-recommendation',
    description: 'Jaccard-based co-apply suggestions per instance — compatibility scores and shared-stage rationale.',
  },
  {
    title: 'Evidence Heatmap',
    href: '/admin/reasoning/evidence-heatmap',
    description: 'Instance × stage evidence density grid — identify under-evidenced stages at a glance.',
  },
  {
    title: 'Synthesis Comparison',
    href: '/admin/reasoning/synthesis-comparison',
    description: 'Health vs. confidence rank comparison — spot divergence between structural health and synthesis quality.',
  },
  {
    href: '/admin/reasoning/gate-timeline',
    title: 'Gate Timeline',
    description: 'Chronological gate events per instance — gate-met, waivers, and stage transitions with demo timestamps.',
  },
  {
    title: 'Gate Pass Rate Trend',
    href: '/admin/reasoning/gate-pass-rate-trend',
    description: 'Stage-by-stage pass rate trajectory — early vs. late program performance with inflection point detection.',
  },
  {
    title: 'Health Clusters',
    href: '/admin/reasoning/health-clusters',
    description: 'Instances grouped into 5 health bands with within-cluster pattern analysis and structural mismatch detection.',
  },
  {
    href: '/admin/reasoning/stage-gate-scorecard',
    title: 'Stage Gate Scorecard',
    description: 'Per-stage Pass/Partial/Fail ratings across all instances — identify worst and best performing stages.',
  },
  {
    href: '/admin/reasoning/contradiction-map',
    title: 'Contradiction Map',
    description: 'Active contradiction triage board — instance cards with resolution path snippets, pattern heat row.',
  },
  {
    title: 'Evidence Staleness',
    href: '/admin/reasoning/evidence-staleness',
    description: 'Fresh/Aging/Stale categorization by instance — staleness scores, most stale instances, freshness trend.',
  },
  {
    href: '/admin/reasoning/instance-lifecycle-status',
    title: 'Instance Lifecycle Status',
    description: 'Visual pipeline showing current stage position for every instance — complete, active, and upcoming stages.',
  },
  {
    href: '/admin/reasoning/program-health-report',
    title: 'Program Health Report',
    description: 'Dense executive overview — health, gates, waivers, contradictions in a printable one-page report.',
  },
  {
    href: '/admin/reasoning/gate-criteria-browser',
    title: 'Gate Criteria Browser',
    description: 'Browsable catalog of all gate criteria by pattern and stage — type, hardest flags, and failure simulation.',
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
        {TOOL_ENTRIES.map((entry) => {
          const card = <ToolCard entry={entry} />;
          return <div key={entry.href}>{card}</div>;
        })}
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
        <ReasoningErrorBoundary section="Contradiction Resolution">
          <ContradictionResolutionPanel contradictions={contradictions} />
        </ReasoningErrorBoundary>
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
        <DemoScenarioPanel />
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
