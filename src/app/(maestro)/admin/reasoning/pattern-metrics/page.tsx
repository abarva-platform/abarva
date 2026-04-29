// /admin/reasoning/pattern-metrics — Pattern-level usage metrics.
//
// Server component. For each lifecycle pattern (Source + Program families)
// renders: instance count, active contradiction count, health grade
// distribution, and average gate coverage %.
//
// Patterns with no instances appear in a separate "Unused patterns" section.
// Rows in the main table are sorted by active contradiction count descending,
// then by instance count descending.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { isResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import type { InstanceHealthGrade } from '@/lib/reasoning/instance-health';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern metrics · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type PatternFamily = 'Source' | 'Program';

interface HealthDistribution {
  green: number;
  amber: number;
  red: number;
}

interface PatternMetricsRow {
  patternId: string;
  family: PatternFamily;
  instanceCount: number;
  activeContradictions: number;
  healthDist: HealthDistribution;
  avgGateCoveragePct: number; // 0–100
}

// ─── Data computation ──────────────────────────────────────────────────────────

function computeMetrics(): {
  active: PatternMetricsRow[];
  unused: PatternMetricsRow[];
} {
  const ALL_PATTERNS: Array<{ pattern: LifecyclePatternSeed; family: PatternFamily }> = [
    ...SOURCE_LIFECYCLE_PATTERNS.map((p) => ({ pattern: p, family: 'Source' as PatternFamily })),
    ...PROGRAM_LIFECYCLE_PATTERNS.map((p) => ({ pattern: p, family: 'Program' as PatternFamily })),
  ];

  // Build pattern-keyed lookup for fast access
  const srcPatternMap = new Map(SOURCE_LIFECYCLE_PATTERNS.map((p) => [p.patternId, p]));
  const prgPatternMap = new Map(PROGRAM_LIFECYCLE_PATTERNS.map((p) => [p.patternId, p]));

  const active: PatternMetricsRow[] = [];
  const unused: PatternMetricsRow[] = [];

  for (const { pattern, family } of ALL_PATTERNS) {
    const pid = pattern.patternId;

    // Collect matching instances
    const srcInstances = SOURCE_EVENT_INSTANCES.filter((i) => i.patternId === pid);
    const prgInstances = APEX_RETAIL_PROGRAM_INSTANCES.filter((i) => i.patternId === pid);
    const totalInstances = srcInstances.length + prgInstances.length;

    if (totalInstances === 0) {
      unused.push({
        patternId: pid,
        family,
        instanceCount: 0,
        activeContradictions: 0,
        healthDist: { green: 0, amber: 0, red: 0 },
        avgGateCoveragePct: 0,
      });
      continue;
    }

    let totalActiveContradictions = 0;
    const healthDist: HealthDistribution = { green: 0, amber: 0, red: 0 };
    let totalGateCoveragePct = 0;

    // Source instances
    for (const inst of srcInstances) {
      const pat = srcPatternMap.get(inst.patternId);
      if (!pat) continue;

      const ctx = buildSourceSynthesisContext(inst, pat);

      // Active (unresolved) contradictions
      for (const c of ctx.activeContradictions) {
        const resolveKey = `${inst.id}::${c.templateId}`;
        if (!isResolved(resolveKey)) {
          totalActiveContradictions += 1;
        }
      }

      // Health grade
      const health = computeInstanceHealth(ctx);
      const grade: InstanceHealthGrade = health.grade;
      healthDist[grade] += 1;

      // Gate coverage for current stage
      const { total, met } = ctx.gatesSummary;
      if (total > 0) {
        totalGateCoveragePct += (met / total) * 100;
      }
      // If total === 0 (no gate criteria for this stage), treat as 100% covered
      // so the average is not artificially penalised.
      else {
        totalGateCoveragePct += 100;
      }
    }

    // Program instances
    for (const inst of prgInstances) {
      const pat = prgPatternMap.get(inst.patternId);
      // buildProgramSynthesisContext resolves the pattern internally when not
      // supplied; pass it explicitly so we only work with bound patterns here.
      const ctx = pat
        ? buildProgramSynthesisContext(inst, pat)
        : buildProgramSynthesisContext(inst);

      for (const c of ctx.activeContradictions) {
        const resolveKey = `${inst.id}::${c.templateId}`;
        if (!isResolved(resolveKey)) {
          totalActiveContradictions += 1;
        }
      }

      const health = computeInstanceHealth(ctx);
      const grade: InstanceHealthGrade = health.grade;
      healthDist[grade] += 1;

      const { total, met } = ctx.gatesSummary;
      if (total > 0) {
        totalGateCoveragePct += (met / total) * 100;
      } else {
        totalGateCoveragePct += 100;
      }
    }

    const avgGateCoveragePct = totalGateCoveragePct / totalInstances;

    active.push({
      patternId: pid,
      family,
      instanceCount: totalInstances,
      activeContradictions: totalActiveContradictions,
      healthDist,
      avgGateCoveragePct,
    });
  }

  // Sort: active contradictions desc, then instance count desc
  active.sort((a, b) => {
    if (b.activeContradictions !== a.activeContradictions) {
      return b.activeContradictions - a.activeContradictions;
    }
    return b.instanceCount - a.instanceCount;
  });

  return { active, unused };
}

// ─── Summary totals ────────────────────────────────────────────────────────────

interface SummaryTotals {
  totalPatterns: number;
  totalInstances: number;
  totalActiveContradictions: number;
}

function computeSummary(rows: PatternMetricsRow[]): SummaryTotals {
  return {
    totalPatterns: rows.length,
    totalInstances: rows.reduce((s, r) => s + r.instanceCount, 0),
    totalActiveContradictions: rows.reduce((s, r) => s + r.activeContradictions, 0),
  };
}

// ─── Styles (shared with existing admin pages) ─────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryBar({ totals, usedCount }: { totals: SummaryTotals; usedCount: number }) {
  const tiles: Array<{ label: string; value: string | number }> = [
    { label: 'Patterns analysed', value: totals.totalPatterns },
    { label: 'With instances', value: usedCount },
    { label: 'Total instances', value: totals.totalInstances },
    { label: 'Active contradictions', value: totals.totalActiveContradictions },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      {tiles.map((tile) => (
        <div
          key={tile.label}
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
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
            {tile.label}
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
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function FamilyBadge({ family }: { family: PatternFamily }) {
  const isSource = family === 'Source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? COLORS.skyPale : COLORS.mintSoft,
        color: isSource ? COLORS.navy : COLORS.mintInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {family}
    </span>
  );
}

function ContradictionCell({ count }: { count: number }) {
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: count > 0 ? 700 : 400,
        color: count > 0 ? COLORS.coralInk : `${COLORS.ink}66`,
      }}
    >
      {count}
    </span>
  );
}

// Renders N green / amber / red dots in a compact inline row.
function HealthMixCell({ dist }: { dist: HealthDistribution }) {
  const DOT_SIZE = 8;

  function dots(count: number, color: string): React.ReactNode[] {
    return Array.from({ length: count }, (_, i) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
    ));
  }

  const all = [
    ...dots(dist.green, '#4CAF50'),
    ...dots(dist.amber, '#FFA726'),
    ...dots(dist.red, '#EF5350'),
  ];

  if (all.length === 0) {
    return (
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>
        —
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      {all}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}88`,
          marginLeft: 4,
        }}
      >
        {dist.green}g · {dist.amber}a · {dist.red}r
      </span>
    </span>
  );
}

function GateCoverageCell({ pct }: { pct: number }) {
  const formatted = `${pct.toFixed(1)}%`;
  const color =
    pct >= 80
      ? COLORS.mintInk
      : pct >= 50
        ? COLORS.amberInk
        : COLORS.coralInk;

  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        color,
        fontWeight: 600,
      }}
    >
      {formatted}
    </span>
  );
}

function MetricsTable({ rows, title }: { rows: PatternMetricsRow[]; title: string }) {
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
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} pattern{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern ID</th>
              <th style={HEADER_CELL}>Family</th>
              <th style={HEADER_CELL}>Instances</th>
              <th style={HEADER_CELL}>Active contradictions</th>
              <th style={HEADER_CELL}>Health mix</th>
              <th style={HEADER_CELL}>Avg gate coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.patternId}>
                <td style={MONO_CELL}>{row.patternId}</td>
                <td style={BODY_CELL}>
                  <FamilyBadge family={row.family} />
                </td>
                <td style={MONO_CELL}>{row.instanceCount}</td>
                <td style={BODY_CELL}>
                  <ContradictionCell count={row.activeContradictions} />
                </td>
                <td style={BODY_CELL}>
                  <HealthMixCell dist={row.healthDist} />
                </td>
                <td style={BODY_CELL}>
                  {row.instanceCount > 0 ? (
                    <GateCoverageCell pct={row.avgGateCoveragePct} />
                  ) : (
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}44`,
                      }}
                    >
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UnusedPatternsSection({ rows }: { rows: PatternMetricsRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}22`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px dashed ${COLORS.ink}10`,
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
              color: `${COLORS.ink}88`,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Unused patterns
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}66`,
              marginTop: 2,
            }}
          >
            No instances currently bound to these patterns
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {rows.length} pattern{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {rows.map((row) => (
          <span
            key={row.patternId}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: `${COLORS.ink}06`,
              borderRadius: RADIUS.pill,
              padding: '4px 12px',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {row.patternId}
            </span>
            <FamilyBadge family={row.family} />
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PatternMetricsPage() {
  const { active, unused } = computeMetrics();
  const summary = computeSummary([...active, ...unused]);

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
        title="Pattern metrics"
        subtitle="Per-pattern instance usage, active contradiction counts, health grade distribution, and average gate coverage across the full fixture corpus."
      >
        <SummaryBar totals={summary} usedCount={active.length} />
        {active.length > 0 ? (
          <MetricsTable rows={active} title="Pattern usage" />
        ) : (
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
            }}
          >
            No pattern instances found — seed some instances and re-visit.
          </div>
        )}
        <UnusedPatternsSection rows={unused} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
