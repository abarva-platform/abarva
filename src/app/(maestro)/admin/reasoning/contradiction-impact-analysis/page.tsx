// /admin/reasoning/contradiction-impact-analysis — Health cost per active
// contradiction. Shows how much health each contradiction is suppressing per
// instance and what recovery would be gained by resolving each one.
//
// Pure server component. Iterates all source + program instances, runs
// contradiction detection, applies the portfolio health formula, and computes
// the marginal cost of each detected (unresolved) contradiction.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction Impact Analysis · AbarVa Admin',
};

// ─── Health formula ───────────────────────────────────────────────────────────

/**
 * Portfolio health formula (from the reasoning spec):
 *   score = (gatesMet/gatesTotal)*60 + (1-min(c/5,1))*30 + 10
 *
 * The contradiction term is `(1-min(c/5,1))*30`.
 * Marginal cost of one contradiction:
 *   cost = term(c) - term(c-1)  [health recovered if one is removed]
 */
function contradictionTerm(c: number): number {
  return (1 - Math.min(c / 5, 1)) * 30;
}

function contradictionHealthCost(c: number): number {
  const withContradiction = contradictionTerm(c);
  const without = contradictionTerm(c - 1);
  return Math.round((without - withContradiction) * 10) / 10;
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface ContradictionCostRow {
  instanceId: string;
  instanceName: string;
  contradictionId: string;
  templateLabel: string;
  patternId: string;
  /** Total number of active contradictions on this instance (used for cost). */
  totalContradictions: number;
  /** Health cost of this one contradiction (marginal, at c=totalContradictions). */
  healthCost: number;
  /** Health points recovered if this contradiction is resolved (= healthCost). */
  recoveryPoints: number;
  priority: 'high' | 'medium' | 'low';
  resolutionPath: string;
  gatesMet: number;
  gatesTotal: number;
}

interface InstanceCostAgg {
  instanceId: string;
  instanceName: string;
  totalHealthCost: number;
  contradictionCount: number;
  /** Health score that would be recovered if ALL contradictions resolved. */
  totalRecovery: number;
  gatesMet: number;
  gatesTotal: number;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildImpactData(): {
  rows: ContradictionCostRow[];
  aggs: InstanceCostAgg[];
} {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  // Build resolved-ID set to exclude already-resolved contradictions.
  const resolvedIds = new Set(getResolvedEntries().map((e) => e.id));

  // We need gates-met/total per instance; reuse buildHealthBoardRows().
  const healthBoard = buildHealthBoardRows();
  const gatesByInstId = new Map(
    healthBoard.map((r) => ({ id: r.id, met: r.gatesMet, total: r.gatesTotal })).map((x) => [x.id, x]),
  );

  const rows: ContradictionCostRow[] = [];

  function processInstance(
    inst: { id: string; name: string; patternId: string },
    evidenceMap: Record<string, unknown>,
    patternId: string,
  ) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === patternId);
    if (!pattern) return;

    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(evidenceMap);

    // Filter out already-resolved contradictions.
    const active = detections.filter((d) => !resolvedIds.has(d.templateId));
    if (active.length === 0) return;

    const gates = gatesByInstId.get(inst.id);
    const gatesMet = gates?.met ?? 0;
    const gatesTotal = gates?.total ?? 1;
    const c = active.length;

    for (const d of active) {
      const cost = contradictionHealthCost(c);
      const priority: 'high' | 'medium' | 'low' =
        cost >= 8 ? 'high' : cost >= 4 ? 'medium' : 'low';
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        contradictionId: d.templateId,
        templateLabel: d.label,
        patternId: patternId,
        totalContradictions: c,
        healthCost: cost,
        recoveryPoints: cost,
        priority,
        resolutionPath: d.resolutionPath,
        gatesMet,
        gatesTotal,
      });
    }
  }

  for (const inst of SOURCE_EVENT_INSTANCES) {
    processInstance(inst, buildEvidenceMap(inst), inst.patternId);
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    processInstance(inst, buildProgramEvidenceMap(inst), inst.patternId);
  }

  // Sort by health cost descending.
  rows.sort((a, b) => b.healthCost - a.healthCost);

  // Aggregate per instance.
  const aggMap = new Map<string, InstanceCostAgg>();
  for (const row of rows) {
    const existing = aggMap.get(row.instanceId);
    if (existing) {
      existing.totalHealthCost += row.healthCost;
      existing.contradictionCount += 1;
      // Recovery if all resolved: compute difference between term(0) and term(c).
      const gates = gatesByInstId.get(row.instanceId);
      const c = row.totalContradictions;
      existing.totalRecovery = Math.round((contradictionTerm(0) - contradictionTerm(c)) * 10) / 10;
    } else {
      const gates = gatesByInstId.get(row.instanceId);
      const c = row.totalContradictions;
      const totalRecovery = Math.round((contradictionTerm(0) - contradictionTerm(c)) * 10) / 10;
      aggMap.set(row.instanceId, {
        instanceId: row.instanceId,
        instanceName: row.instanceName,
        totalHealthCost: row.healthCost,
        contradictionCount: 1,
        totalRecovery,
        gatesMet: row.gatesMet,
        gatesTotal: row.gatesTotal,
      });
    }
  }

  const aggs = Array.from(aggMap.values()).sort((a, b) => b.totalHealthCost - a.totalHealthCost);

  return { rows, aggs };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}88`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `2px solid ${COLORS.ink}14`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0a`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCards({
  totalSuppressed,
  avgCost,
  costliestInstance,
}: {
  totalSuppressed: number;
  avgCost: number;
  costliestInstance: string;
}) {
  const cards: Array<{ label: string; value: string; note: string; valueColor: string }> = [
    {
      label: 'Total suppressed health',
      value: `${totalSuppressed.toFixed(1)} pts`,
      note: 'across all instances',
      valueColor: COLORS.coralInk,
    },
    {
      label: 'Avg cost per contradiction',
      value: `${avgCost.toFixed(1)} pts`,
      note: 'marginal health impact',
      valueColor: COLORS.amberInk,
    },
    {
      label: 'Most costly instance',
      value: costliestInstance || '—',
      note: 'highest total contradiction cost',
      valueColor: COLORS.ink,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.md} ${SPACING.lg}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
            }}
          >
            {card.label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 22,
              fontWeight: 700,
              color: card.valueColor,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {card.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}66`,
            }}
          >
            {card.note}
          </span>
        </div>
      ))}
    </div>
  );
}

function PriorityPill({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles: Record<string, CSSProperties> = {
    high: { background: COLORS.coralSoft, color: COLORS.coralInk },
    medium: { background: COLORS.amberSoft, color: COLORS.amberInk },
    low: { background: `${COLORS.ink}0d`, color: `${COLORS.ink}88` },
  };
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0,
        ...styles[priority],
      }}
    >
      {priority}
    </span>
  );
}

function CostTable({ rows }: { rows: ContradictionCostRow[] }) {
  if (rows.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
        }}
      >
        No active contradictions detected across any instance.
      </section>
    );
  }

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
            Per-contradiction cost
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            All active contradictions sorted by health cost descending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            flexShrink: 0,
          }}
        >
          {rows.length} row{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Contradiction</th>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Health cost</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Recovery</th>
              <th style={HEADER_CELL}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.instanceId}::${row.contradictionId}`}>
                <td style={MONO_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.ink,
                        fontWeight: 600,
                      }}
                    >
                      {row.instanceName}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.instanceId}
                    </span>
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.ink,
                      }}
                    >
                      {row.templateLabel}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.contradictionId}
                    </span>
                  </div>
                </td>
                <td style={{ ...MONO_CELL, maxWidth: 180 }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}88`,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {row.patternId}
                  </span>
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        row.healthCost >= 8
                          ? COLORS.coralInk
                          : row.healthCost >= 4
                            ? COLORS.amberInk
                            : `${COLORS.ink}88`,
                    }}
                  >
                    -{row.healthCost} pts
                  </span>
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.mintInk,
                    }}
                  >
                    +{row.recoveryPoints} pts
                  </span>
                </td>
                <td style={BODY_CELL}>
                  <PriorityPill priority={row.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InstanceCostAggregation({ aggs }: { aggs: InstanceCostAgg[] }) {
  if (aggs.length === 0) return null;

  const maxCost = Math.max(...aggs.map((a) => a.totalHealthCost), 1);

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
          Instance cost aggregation
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Total health suppressed per instance — sorted by cost descending
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {aggs.map((agg) => {
          const barWidthPct = Math.round((agg.totalHealthCost / maxCost) * 100);
          return (
            <div
              key={agg.instanceId}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 120px 130px',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLORS.ink,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {agg.instanceName}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {agg.contradictionCount} contradiction
                  {agg.contradictionCount === 1 ? '' : 's'}
                </span>
              </div>

              {/* Bar visualization */}
              <div
                style={{
                  height: 24,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {agg.totalHealthCost > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barWidthPct}%`,
                      background: COLORS.coralSoft,
                      borderRadius: RADIUS.sm,
                    }}
                  />
                )}
              </div>

              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.coralInk,
                  textAlign: 'right',
                }}
              >
                -{agg.totalHealthCost.toFixed(1)} pts
              </span>

              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: COLORS.mintInk,
                  textAlign: 'right',
                }}
              >
                if resolved: +{agg.totalRecovery.toFixed(1)} pts
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HighRoiResolutions({ rows }: { rows: ContradictionCostRow[] }) {
  const top5 = rows.slice(0, 5);
  if (top5.length === 0) return null;

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
          High ROI resolutions
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Top 5 resolutions by health gain — highest recovery potential first
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {top5.map((row, idx) => (
          <div
            key={`${row.instanceId}::${row.contradictionId}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              padding: `${SPACING.sm} 0`,
              borderBottom:
                idx < top5.length - 1 ? `1px solid ${COLORS.ink}0a` : 'none',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                fontWeight: 700,
                color: `${COLORS.ink}44`,
                flexShrink: 0,
                width: 24,
                textAlign: 'right',
              }}
            >
              {idx + 1}.
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.ink,
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                Resolving{' '}
                <strong>{row.templateLabel}</strong> on{' '}
                <strong>{row.instanceName}</strong> would recover{' '}
                <span style={{ color: COLORS.mintInk, fontWeight: 700 }}>
                  +{row.recoveryPoints} health points
                </span>
              </p>
              {row.resolutionPath && (
                <p
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: `${COLORS.ink}88`,
                    margin: `4px 0 0`,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {row.resolutionPath}
                </p>
              )}
            </div>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: COLORS.mintInk,
                fontWeight: 700,
                flexShrink: 0,
                background: COLORS.mintSoft,
                borderRadius: RADIUS.pill,
                padding: '3px 10px',
              }}
            >
              +{row.recoveryPoints} pts
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderTop: `1px solid ${COLORS.ink}08`,
          background: `${COLORS.ink}04`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          Resolution endpoint:{' '}
          <code
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              background: `${COLORS.ink}0d`,
              borderRadius: RADIUS.sm,
              padding: '2px 6px',
              color: COLORS.navy,
            }}
          >
            POST /api/reasoning/resolve-contradiction
          </code>
        </span>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionImpactAnalysisPage() {
  const { rows, aggs } = buildImpactData();

  const totalSuppressed = rows.reduce((sum, r) => sum + r.healthCost, 0);
  const avgCost = rows.length > 0 ? totalSuppressed / rows.length : 0;
  const costliestInstance = aggs.length > 0 ? aggs[0].instanceName : '—';

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open contradiction resolver"
          primaryActionHref="/admin/reasoning/contradiction-resolver"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction Impact Analysis"
        subtitle="Health cost per contradiction — what each active contradiction is costing and what resolution recovers"
      >
        <SummaryCards
          totalSuppressed={Math.round(totalSuppressed * 10) / 10}
          avgCost={avgCost}
          costliestInstance={costliestInstance}
        />
        <CostTable rows={rows} />
        <InstanceCostAggregation aggs={aggs} />
        <HighRoiResolutions rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
