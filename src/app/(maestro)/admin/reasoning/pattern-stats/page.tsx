// /admin/reasoning/pattern-stats — Aggregate statistics per lifecycle pattern.
//
// Pure server component. For each lifecycle pattern (source + program), computes:
//   - Stage count, total criteria, hard/soft split, avg criteria per stage
//   - Contradiction template count, failure mode count, source document count
//   - Instance count (from SOURCE_EVENT_INSTANCES + APEX_RETAIL_PROGRAM_INSTANCES)
//
// Renders:
//   1. SummaryStrip — headline counts across all patterns
//   2. DomainDistribution — bar chart of pattern counts by domain
//   3. StatsTable — per-pattern detail, sorted by totalCriteria descending

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { PatternDomain } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern stats · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatternRow {
  patternId: string;
  title: string;
  domain: PatternDomain;
  stageCount: number;
  totalCriteria: number;
  hardCriteria: number;
  softCriteria: number;
  avgCriteriaPerStage: string;
  contradictionCount: number;
  failureModeCount: number;
  sourceDocCount: number;
  instanceCount: number;
}

interface Summary {
  patternCount: number;
  totalCriteria: number;
  avgStages: string;
  avgCriteriaPerStage: string;
}

interface DomainBucket {
  domain: PatternDomain;
  count: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeStats(): { rows: PatternRow[]; summary: Summary; domains: DomainBucket[] } {
  const patterns = getAllLifecyclePatterns();

  // Build instance-count lookup
  const instanceCounts = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instanceCounts.set(inst.patternId, (instanceCounts.get(inst.patternId) ?? 0) + 1);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instanceCounts.set(inst.patternId, (instanceCounts.get(inst.patternId) ?? 0) + 1);
  }

  const rows: PatternRow[] = patterns.map((p) => {
    const stageCount = p.stages.length;
    const totalCriteria = p.gateCriteria.length;
    const hardCriteria = p.gateCriteria.filter((g) => g.gateType === 'hard').length;
    const softCriteria = totalCriteria - hardCriteria;
    const avgCriteriaPerStage =
      stageCount > 0 ? (totalCriteria / stageCount).toFixed(1) : '0.0';
    const contradictionCount = p.contradictionTemplates?.length ?? 0;
    const failureModeCount = p.failureModes?.length ?? 0;
    const sourceDocCount = p.sourceDocuments?.length ?? 0;
    const instanceCount = instanceCounts.get(p.patternId) ?? 0;

    return {
      patternId: p.patternId,
      title: p.title,
      domain: p.domain,
      stageCount,
      totalCriteria,
      hardCriteria,
      softCriteria,
      avgCriteriaPerStage,
      contradictionCount,
      failureModeCount,
      sourceDocCount,
      instanceCount,
    };
  });

  // Sort by totalCriteria descending
  rows.sort((a, b) => b.totalCriteria - a.totalCriteria);

  // Summary strip
  const patternCount = rows.length;
  const totalCriteria = rows.reduce((acc, r) => acc + r.totalCriteria, 0);
  const avgStages =
    patternCount > 0
      ? (rows.reduce((acc, r) => acc + r.stageCount, 0) / patternCount).toFixed(1)
      : '0.0';
  const avgCriteriaPerStage =
    patternCount > 0
      ? (rows.reduce((acc, r) => acc + parseFloat(r.avgCriteriaPerStage), 0) / patternCount).toFixed(1)
      : '0.0';

  // Domain distribution
  const domainMap = new Map<PatternDomain, number>();
  for (const r of rows) {
    domainMap.set(r.domain, (domainMap.get(r.domain) ?? 0) + 1);
  }
  const domains: DomainBucket[] = Array.from(domainMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  return {
    rows,
    summary: { patternCount, totalCriteria, avgStages, avgCriteriaPerStage },
    domains,
  };
}

// ─── Shared cell styles ───────────────────────────────────────────────────────

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
  textAlign: 'right',
};

// ─── Domain label map ─────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<PatternDomain, string> = {
  meta: 'Meta',
  sourcing: 'Sourcing',
  cdp: 'CDP',
  ai_programs: 'AI programs',
  architecture: 'Architecture',
  industry_specific: 'Industry specific',
  compliance: 'Compliance',
  future_of_work: 'Future of work',
};

const DOMAIN_COLORS: Record<PatternDomain, string> = {
  meta: COLORS.navy,
  sourcing: '#4A6FA5',
  cdp: '#2E8B7A',
  ai_programs: '#7B5EA7',
  architecture: '#B8860B',
  industry_specific: '#C2572B',
  compliance: '#2C6E49',
  future_of_work: '#4A4E69',
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: Summary }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
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
          flexShrink: 0,
        }}
      >
        Pattern stats
      </span>
      {[
        { label: 'patterns', value: summary.patternCount.toString() },
        { label: 'total criteria', value: summary.totalCriteria.toString() },
        { label: 'avg stages', value: summary.avgStages },
        { label: 'avg criteria/stage', value: summary.avgCriteriaPerStage },
      ].map(({ label, value }) => (
        <span
          key={label}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              marginRight: 5,
            }}
          >
            {value}
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── DomainDistribution ───────────────────────────────────────────────────────

function DomainDistribution({ domains }: { domains: DomainBucket[] }) {
  const maxCount = Math.max(...domains.map((d) => d.count), 1);

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
          Domain distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Pattern count by domain
        </div>
      </header>
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {domains.map(({ domain, count }) => {
          const pct = (count / maxCount) * 100;
          const barColor = DOMAIN_COLORS[domain] ?? COLORS.navy;
          return (
            <div
              key={domain}
              style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  width: 140,
                  flexShrink: 0,
                  fontWeight: 500,
                }}
              >
                {DOMAIN_LABELS[domain] ?? domain}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 14,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: RADIUS.pill,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: `${COLORS.ink}99`,
                  width: 28,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── DomainPill ───────────────────────────────────────────────────────────────

function DomainPill({ domain }: { domain: PatternDomain }) {
  const color = DOMAIN_COLORS[domain] ?? COLORS.navy;
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${color}18`,
        color: color,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {DOMAIN_LABELS[domain] ?? domain}
    </span>
  );
}

// ─── HardSoftBadge ────────────────────────────────────────────────────────────

function HardSoftBadge({ hard, soft }: { hard: number; soft: number }) {
  return (
    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, display: 'inline-flex', gap: 4 }}>
      <span style={{ color: COLORS.coralInk ?? '#C2572B', fontWeight: 700 }}>{hard}H</span>
      <span style={{ color: `${COLORS.ink}66` }}>/</span>
      <span style={{ color: `${COLORS.ink}99` }}>{soft}S</span>
    </span>
  );
}

// ─── StatsTable ───────────────────────────────────────────────────────────────

function StatsTable({ rows }: { rows: PatternRow[] }) {
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
            Per-pattern breakdown
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by total criteria descending
          </div>
        </div>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={HEADER_CELL}>Domain</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Stages</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Total criteria</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Hard / Soft</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Avg/stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Contradictions</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Failure modes</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Source docs</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instances</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.patternId} style={{ transition: 'background 0.1s' }}>
                <td style={{ ...BODY_CELL, maxWidth: 240 }}>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      color: COLORS.ink,
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {row.title}
                  </div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                      marginTop: 2,
                    }}
                  >
                    {row.patternId}
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <DomainPill domain={row.domain} />
                </td>
                <td style={MONO_CELL}>{row.stageCount}</td>
                <td style={{ ...MONO_CELL, fontWeight: 700, color: COLORS.ink }}>
                  {row.totalCriteria}
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>
                  <HardSoftBadge hard={row.hardCriteria} soft={row.softCriteria} />
                </td>
                <td style={MONO_CELL}>{row.avgCriteriaPerStage}</td>
                <td style={MONO_CELL}>
                  {row.contradictionCount === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    row.contradictionCount
                  )}
                </td>
                <td style={MONO_CELL}>
                  {row.failureModeCount === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    row.failureModeCount
                  )}
                </td>
                <td style={MONO_CELL}>
                  {row.sourceDocCount === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    row.sourceDocCount
                  )}
                </td>
                <td style={MONO_CELL}>
                  {row.instanceCount === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    row.instanceCount
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternStatsPage() {
  const { rows, summary, domains } = computeStats();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View patterns"
          primaryActionHref="/admin/reasoning/patterns"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Patterns"
        title="Pattern statistics"
        subtitle="Aggregate statistics per lifecycle pattern — stages, gate criteria, contradictions, failure modes, source documents, and instance counts across the full fixture corpus."
      >
        <SummaryStrip summary={summary} />
        <DomainDistribution domains={domains} />
        <StatsTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
