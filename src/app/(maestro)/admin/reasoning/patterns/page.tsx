// /admin/reasoning/patterns — Per-pattern usage analytics view.
//
// Server component. Computes the pure `PatternUsageReport` against the live
// telemetry buffers and renders one table row per lifecycle pattern (13 in
// the current catalogue). Each row links into the lifecycle pattern detail
// page so operators can drill in from "this pattern is hot" → "what does it
// actually look like".
//
// No client JS — values are point-in-time and the admin layout enforces
// dynamic rendering via `force-dynamic`.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  computePatternUsage,
  type PatternUsageRow,
} from '@/lib/reasoning/pattern-usage-analytics';

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

// ─── Coverage chip ────────────────────────────────────────────────────────────

function CoverageChip({
  covered,
  total,
}: {
  covered: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}66`,
        }}
      >
        —
      </span>
    );
  }
  const ratio = covered / total;
  const palette =
    ratio >= 0.66
      ? { bg: COLORS.mintSoft, fg: COLORS.mintInk }
      : ratio >= 0.33
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : { bg: COLORS.coralSoft, fg: COLORS.coralInk };
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
      }}
    >
      {covered} / {total} · {formatPct(ratio)}
    </span>
  );
}

function FamilyPill({ family }: { family: PatternUsageRow['family'] }) {
  const isProgram = family === 'program';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isProgram ? COLORS.skyPale : `${COLORS.ink}08`,
        color: isProgram ? COLORS.navy : `${COLORS.ink}99`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {isProgram ? 'Program' : 'Source'}
    </span>
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

function PatternUsageTable({ rows }: { rows: PatternUsageRow[] }) {
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
          Patterns by activity
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          sorted by total events desc · {rows.length} patterns
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={HEADER_CELL}>Family</th>
              <th style={HEADER_CELL}>Instances</th>
              <th style={HEADER_CELL}>Contradiction coverage</th>
              <th style={HEADER_CELL}>Failure-mode coverage</th>
              <th style={HEADER_CELL}>Synthesis events</th>
              <th style={HEADER_CELL}>Cascade events</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.patternId}>
                <td style={BODY_CELL}>
                  <a
                    href={`/source/patterns/${row.patternId}`}
                    style={{
                      textDecoration: 'none',
                      color: COLORS.ink,
                      display: 'block',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}77`,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {row.patternId}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 14,
                        color: COLORS.navy,
                        marginTop: 2,
                      }}
                    >
                      {row.patternLabel}
                    </div>
                  </a>
                </td>
                <td style={BODY_CELL}>
                  <FamilyPill family={row.family} />
                </td>
                <td style={MONO_CELL}>
                  {row.instanceCount === 0 ? (
                    <span style={{ color: `${COLORS.ink}66` }}>0</span>
                  ) : (
                    row.instanceCount
                  )}
                </td>
                <td style={BODY_CELL}>
                  <CoverageChip
                    covered={row.contradictionTemplatesCovered}
                    total={row.contradictionTemplateCount}
                  />
                </td>
                <td style={BODY_CELL}>
                  <CoverageChip
                    covered={row.failureModesCovered}
                    total={row.failureModeTemplateCount}
                  />
                </td>
                <td style={MONO_CELL}>
                  {row.synthesisEventCount}
                  <span style={{ color: `${COLORS.ink}66`, marginLeft: 4 }}>
                    ({row.synthesisEventCountLast24h} in 24h)
                  </span>
                </td>
                <td style={MONO_CELL}>
                  {row.cascadeAsSourceCount}→ / →{row.cascadeAsTargetCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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

        <PatternUsageTable rows={report.rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
