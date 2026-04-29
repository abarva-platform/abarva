// /admin/reasoning/coverage-report — Pattern richness coverage report.
//
// Pure server component. For each lifecycle pattern (Source + Program families)
// computes a richness score based on gate criteria, contradiction templates,
// failure modes, and source documents. Shows which patterns are exercised by
// live instances and highlights lean patterns needing enrichment.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Coverage report · AbarVa Admin',
};

// ─── Richness thresholds (used for score calculation) ─────────────────────────

const THRESHOLDS = {
  criteria: 5,
  contradictions: 3,
  failureModes: 2,
  sourceDocs: 2,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatternCoverageRow {
  patternId: string;
  title: string;
  domain: string;
  instanceCount: number;
  hasInstances: boolean;
  criteriaCount: number;
  contradictionTemplateCount: number;
  failureModeCount: number;
  sourceDocCount: number;
  /** 0–100 — sum of (non-zero count / threshold) clipped to 1, averaged × 100 */
  coverageScore: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeCoverage(): PatternCoverageRow[] {
  const allPatterns = getAllLifecyclePatterns();

  // Build pattern → instance count lookup from both corpora
  const instancesByPattern = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instancesByPattern.set(inst.patternId, (instancesByPattern.get(inst.patternId) ?? 0) + 1);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instancesByPattern.set(inst.patternId, (instancesByPattern.get(inst.patternId) ?? 0) + 1);
  }

  return allPatterns.map((p) => {
    const instanceCount = instancesByPattern.get(p.patternId) ?? 0;
    const criteriaCount = p.gateCriteria?.length ?? 0;
    const contradictionTemplateCount = p.contradictionTemplates?.length ?? 0;
    const failureModeCount = p.failureModes?.length ?? 0;
    const sourceDocCount = p.sourceDocuments?.length ?? 0;

    // Score = mean of each dimension capped at threshold, normalized 0–100
    const criteriaScore = Math.min(criteriaCount / THRESHOLDS.criteria, 1);
    const contradictionScore = Math.min(contradictionTemplateCount / THRESHOLDS.contradictions, 1);
    const failureModeScore = Math.min(failureModeCount / THRESHOLDS.failureModes, 1);
    const sourceDocScore = Math.min(sourceDocCount / THRESHOLDS.sourceDocs, 1);
    const coverageScore =
      Math.round(((criteriaScore + contradictionScore + failureModeScore + sourceDocScore) / 4) * 100);

    return {
      patternId: p.patternId,
      title: p.title,
      domain: p.domain,
      instanceCount,
      hasInstances: instanceCount > 0,
      criteriaCount,
      contradictionTemplateCount,
      failureModeCount,
      sourceDocCount,
      coverageScore,
    };
  });
}

// ─── Style constants ──────────────────────────────────────────────────────────

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
  textAlign: 'center' as const,
};

// ─── Helper components ────────────────────────────────────────────────────────

function SummaryStrip({
  rows,
}: {
  rows: PatternCoverageRow[];
}) {
  const withInstances = rows.filter((r) => r.hasInstances).length;
  const avgCriteria =
    rows.length === 0 ? 0 : rows.reduce((s, r) => s + r.criteriaCount, 0) / rows.length;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.xl}`,
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
        Summary
      </span>
      <Stat label="Patterns" value={String(rows.length)} />
      <Stat label="With active instances" value={String(withInstances)} accent />
      <Stat label="Without instances" value={String(rows.length - withInstances)} />
      <Stat label="Avg criteria per pattern" value={avgCriteria.toFixed(1)} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: accent ? COLORS.navy : COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CoverageScoreBadge({ score }: { score: number }) {
  const bg =
    score >= 75
      ? COLORS.mintSoft
      : score >= 40
        ? COLORS.amberSoft
        : COLORS.coralSoft;
  const fg =
    score >= 75
      ? COLORS.mintInk
      : score >= 40
        ? COLORS.amberInk
        : COLORS.coralInk;

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        minWidth: 44,
        textAlign: 'center',
      }}
    >
      {score}%
    </span>
  );
}

function InstanceBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}44`,
        }}
      >
        —
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.skyPale,
        color: COLORS.navy,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {count}
    </span>
  );
}

function CountCell({ count, threshold }: { count: number; threshold: number }) {
  const met = count >= threshold;
  return (
    <td
      style={{
        ...MONO_CELL,
        color: count === 0 ? `${COLORS.ink}33` : met ? COLORS.mintInk : COLORS.amberInk,
        fontWeight: count === 0 ? 400 : 600,
      }}
    >
      {count === 0 ? '—' : count}
    </td>
  );
}

// ─── Main sections ────────────────────────────────────────────────────────────

function CoverageTable({ rows }: { rows: PatternCoverageRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    // Active instances first, then by coverage score desc
    if (a.hasInstances !== b.hasInstances) return a.hasInstances ? -1 : 1;
    return b.coverageScore - a.coverageScore;
  });

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
            Pattern richness
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Coverage score = avg of (criteria/5, templates/3, failure modes/2, source docs/2) × 100
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} pattern{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={HEADER_CELL}>Domain</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Instances</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Gate criteria</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Contr. templates</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Failure modes</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Source docs</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Coverage score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.patternId}
                style={{ background: row.hasInstances ? COLORS.white : `${COLORS.ink}03` }}
              >
                <td style={{ ...BODY_CELL, maxWidth: 260 }}>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
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
                  <span
                    style={{
                      display: 'inline-block',
                      background: `${COLORS.ink}08`,
                      color: `${COLORS.ink}cc`,
                      borderRadius: RADIUS.sm,
                      padding: '2px 8px',
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      textTransform: 'capitalize',
                    }}
                  >
                    {row.domain}
                  </span>
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'center' }}>
                  <InstanceBadge count={row.instanceCount} />
                </td>
                <CountCell count={row.criteriaCount} threshold={THRESHOLDS.criteria} />
                <CountCell count={row.contradictionTemplateCount} threshold={THRESHOLDS.contradictions} />
                <CountCell count={row.failureModeCount} threshold={THRESHOLDS.failureModes} />
                <CountCell count={row.sourceDocCount} threshold={THRESHOLDS.sourceDocs} />
                <td style={{ ...MONO_CELL, textAlign: 'center' }}>
                  <CoverageScoreBadge score={row.coverageScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LeanPatterns({ rows }: { rows: PatternCoverageRow[] }) {
  const lean = rows.filter((r) => r.criteriaCount < 3);
  if (lean.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.amberInk}22`,
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
            Lean patterns — need enrichment
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Fewer than 3 gate criteria — these patterns may produce weak gate evaluations
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: COLORS.amberInk,
            fontWeight: 600,
          }}
        >
          {lean.length} pattern{lean.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {lean.map((row) => (
          <div
            key={row.patternId}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.amberInk}22`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.ink,
                lineHeight: 1.3,
              }}
            >
              {row.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}66`,
                }}
              >
                {row.patternId}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: COLORS.amberInk,
                  fontWeight: 600,
                }}
              >
                {row.criteriaCount} criteri{row.criteriaCount === 1 ? 'on' : 'a'}
              </span>
              {row.hasInstances && (
                <span
                  style={{
                    display: 'inline-block',
                    background: COLORS.skyPale,
                    color: COLORS.navy,
                    borderRadius: RADIUS.pill,
                    padding: '1px 7px',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {row.instanceCount} instance{row.instanceCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoverageReportPage() {
  const rows = computeCoverage();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open patterns"
          primaryActionHref="/admin/reasoning/patterns"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Coverage"
        title="Pattern coverage report"
        subtitle="Per-pattern richness scorecard — gate criteria, contradiction templates, failure modes, and source documents. Coverage score = average of four dimensions against target thresholds."
      >
        <SummaryStrip rows={rows} />
        <CoverageTable rows={rows} />
        <LeanPatterns rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
