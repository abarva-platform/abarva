// /admin/reasoning/patterns — Per-pattern usage analytics view.
//
// Server component. Computes the pure `PatternUsageReport` against the live
// telemetry buffers and passes the sorted rows into `PatternFilterView` (a
// client component) that handles keyword search and category filtering.
//
// The admin layout enforces dynamic rendering via `force-dynamic`.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { computePatternUsage } from '@/lib/reasoning/pattern-usage-analytics';
import { PatternFilterView } from './PatternFilterView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern usage analytics · AbarVa Admin',
};

function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

// ─── Headline tiles ───────────────────────────────────────────────────────────

function HeadlineTile({
  label,
  primary,
  sub,
}: {
  label: string;
  primary: string;
  sub?: string;
}) {
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
          fontSize: 32,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {primary}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReasoningPatternsPage() {
  const report = computePatternUsage();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open reasoning telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Pattern usage"
        title="Pattern usage analytics"
        subtitle="Per-pattern footprint across the reasoning layer — bound fixtures, template coverage on those fixtures, and how often each pattern shows up in synthesis and cascade telemetry."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: SPACING.md,
          }}
        >
          <HeadlineTile
            label="Total patterns"
            primary={`${report.totalPatterns}`}
            sub="source-event + program lifecycles in the catalogue"
          />
          <HeadlineTile
            label="Patterns with fixtures"
            primary={`${report.totalBound} / ${report.totalPatterns}`}
            sub={`${formatPct(
              report.totalPatterns === 0
                ? 0
                : report.totalBound / report.totalPatterns,
            )} have at least one bound instance`}
          />
          <HeadlineTile
            label="Mean coverage"
            primary={formatPct(report.meanCoverageRatio)}
            sub="avg of (contradiction + failure-mode) coverage ratios per pattern"
          />
        </div>

        <a
          href="/admin/reasoning"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.sm,
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.sm} ${SPACING.md}`,
            textDecoration: 'none',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ fontWeight: 600 }}>Back to reasoning telemetry</span>
          <span style={{ color: `${COLORS.ink}88` }}>cache, latency, feedback</span>
        </a>

        {/* Client component: handles keyword search + category filtering */}
        <PatternFilterView rows={report.rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
