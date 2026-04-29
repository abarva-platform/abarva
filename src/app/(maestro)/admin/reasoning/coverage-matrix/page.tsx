// /admin/reasoning/coverage-matrix — Instance × stage evidence coverage matrix.
//
// Pure server component. For each instance (source + program), fetches its
// pattern's stages and checks which stages have evidence ingested. Renders a
// CSS-grid matrix with coverage intensity coloring.
//
// Sections:
//   SummaryStrip   — N instances · M stages · X% cells covered
//   CoverageMatrix — instance rows × stage columns; overflow at 8 cols
//   CoverageStats  — top 3 best-covered + top 3 worst-covered instances

import React from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Coverage matrix · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface InstanceRow {
  instanceId: string;
  instanceName: string;
  patternId: string;
  patternLabel: string;
  instanceType: 'source-event' | 'program';
  /** Ordered stage IDs for this instance's pattern */
  stages: string[];
  /** stage → evidence count */
  coverage: Record<string, number>;
  /** 0..1 fraction of stages with evidence */
  coveragePct: number;
  coveredCount: number;
}

// ─── Stage evidence counting ──────────────────────────────────────────────────

function extractStageField(item: Record<string, unknown>): string {
  for (const key of ['stage', 'currentStage', 'stageId']) {
    const val = item[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return '';
}

// ─── Data computation ─────────────────────────────────────────────────────────

function buildMatrix(): InstanceRow[] {
  const allPatterns = getAllLifecyclePatterns();
  const patternMap = new Map<string, LifecyclePatternSeed>();
  for (const p of allPatterns) {
    patternMap.set(p.patternId, p);
  }

  const rows: InstanceRow[] = [];

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = patternMap.get(inst.patternId);
    const stages = pattern ? pattern.stages.map((s) => s.id) : [];
    const evidenceItems = getEvidenceFor(inst.id);

    const coverage: Record<string, number> = {};
    for (const stageId of stages) {
      coverage[stageId] = 0;
    }
    for (const item of evidenceItems) {
      const stage = extractStageField(item as Record<string, unknown>);
      if (stage && coverage[stage] !== undefined) {
        coverage[stage]++;
      }
    }

    const coveredCount = stages.filter((s) => (coverage[s] ?? 0) > 0).length;
    const coveragePct = stages.length > 0 ? coveredCount / stages.length : 0;

    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      patternId: inst.patternId,
      patternLabel: pattern?.title ?? inst.patternId,
      instanceType: 'source-event',
      stages,
      coverage,
      coveragePct,
      coveredCount,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = patternMap.get(inst.patternId);
    const stages = pattern ? pattern.stages.map((s) => s.id) : [];
    const evidenceItems = getEvidenceFor(inst.id);

    const coverage: Record<string, number> = {};
    for (const stageId of stages) {
      coverage[stageId] = 0;
    }
    for (const item of evidenceItems) {
      const stage = extractStageField(item as Record<string, unknown>);
      if (stage && coverage[stage] !== undefined) {
        coverage[stage]++;
      }
    }

    const coveredCount = stages.filter((s) => (coverage[s] ?? 0) > 0).length;
    const coveragePct = stages.length > 0 ? coveredCount / stages.length : 0;

    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      patternId: inst.patternId,
      patternLabel: pattern?.title ?? inst.patternId,
      instanceType: 'program',
      stages,
      coverage,
      coveragePct,
      coveredCount,
    });
  }

  return rows;
}

function computeGlobalStats(rows: InstanceRow[]): {
  totalInstances: number;
  totalStages: number;
  totalCells: number;
  coveredCells: number;
  coveragePct: number;
} {
  let totalCells = 0;
  let coveredCells = 0;
  const stageSet = new Set<string>();

  for (const row of rows) {
    for (const s of row.stages) stageSet.add(s);
    for (const [, count] of Object.entries(row.coverage)) {
      totalCells++;
      if (count > 0) coveredCells++;
    }
  }

  return {
    totalInstances: rows.length,
    totalStages: stageSet.size,
    totalCells,
    coveredCells,
    coveragePct: totalCells > 0 ? coveredCells / totalCells : 0,
  };
}

// ─── Cell colour helpers ──────────────────────────────────────────────────────

const MAX_VISIBLE_COLS = 8;

function cellBackground(count: number): string {
  if (count === 0) return `${COLORS.ink}08`;
  if (count <= 2) return COLORS.mintSoft;
  return COLORS.mintInk + '22'; // mint-strong: tinted deep mint
}

function cellTextColor(count: number): string {
  if (count === 0) return `${COLORS.ink}44`;
  if (count <= 2) return COLORS.mintInk;
  return COLORS.mintInk;
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  totalInstances,
  totalStages,
  coveragePct,
}: {
  totalInstances: number;
  totalStages: number;
  coveragePct: number;
}) {
  const pctStr = `${(coveragePct * 100).toFixed(1)}%`;
  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {[
        `${totalInstances} instance${totalInstances === 1 ? '' : 's'}`,
        `${totalStages} unique stage${totalStages === 1 ? '' : 's'}`,
        `${pctStr} cells covered`,
      ].map((stat, i) => (
        <span
          key={i}
          style={{
            fontFamily: i === 0 ? TYPOGRAPHY.sans : TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: i === 0 ? 600 : 400,
            color: i === 0 ? COLORS.navy : `${COLORS.ink}99`,
          }}
        >
          {i > 0 && (
            <span
              style={{
                marginRight: SPACING.lg,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}44`,
              }}
            >
              ·
            </span>
          )}
          {stat}
        </span>
      ))}
    </div>
  );
}

// ─── PatternBadge ─────────────────────────────────────────────────────────────

function PatternBadge({
  patternId,
  instanceType,
}: {
  patternId: string;
  instanceType: 'source-event' | 'program';
}) {
  const bg = instanceType === 'source-event' ? COLORS.skyPale : COLORS.amberSoft;
  const color = instanceType === 'source-event' ? COLORS.navy : COLORS.amberInk;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {patternId}
    </span>
  );
}

// ─── CoverageMatrix ───────────────────────────────────────────────────────────

function CoverageMatrix({ rows }: { rows: InstanceRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.mintInk}33`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md} ${SPACING.lg}`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.mintInk,
          }}
        >
          No instances found
        </span>
      </div>
    );
  }

  // Collect the union of all stage IDs (preserving first-seen order)
  const allStageIds: string[] = [];
  const stageSeen = new Set<string>();
  for (const row of rows) {
    for (const s of row.stages) {
      if (!stageSeen.has(s)) {
        stageSeen.add(s);
        allStageIds.push(s);
      }
    }
  }

  const visibleStages = allStageIds.slice(0, MAX_VISIBLE_COLS);
  const overflowCount = allStageIds.length - visibleStages.length;

  // CSS grid: row header col + N stage cols (+ optional overflow col)
  const colCount = visibleStages.length + 1 + (overflowCount > 0 ? 1 : 0);
  const gridTemplateColumns = `200px repeat(${visibleStages.length}, 56px)${overflowCount > 0 ? ' 44px' : ''}`;

  const HEADER_STYLE: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    fontWeight: 600,
    color: `${COLORS.ink}88`,
    padding: '6px 4px',
    textAlign: 'center',
    borderBottom: `1px solid ${COLORS.ink}18`,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

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
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Instance × stage coverage
        </span>
        {overflowCount > 0 && (
          <span
            style={{
              marginLeft: SPACING.md,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
            }}
          >
            (showing first {MAX_VISIBLE_COLS} of {allStageIds.length} stages)
          </span>
        )}
      </header>

      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns,
            minWidth: `${200 + visibleStages.length * 56 + (overflowCount > 0 ? 44 : 0)}px`,
          }}
        >
          {/* Column headers row */}
          <div
            style={{
              ...HEADER_STYLE,
              textAlign: 'left',
              paddingLeft: SPACING.md,
            }}
          >
            Instance
          </div>
          {visibleStages.map((stageId) => (
            <div key={stageId} style={HEADER_STYLE}>
              {stageId}
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              style={{
                ...HEADER_STYLE,
                color: `${COLORS.ink}55`,
              }}
            >
              +{overflowCount}
            </div>
          )}

          {/* Data rows */}
          {rows.map((row, rowIdx) => {
            const rowBg = rowIdx % 2 === 0 ? COLORS.white : `${COLORS.ink}02`;
            return (
              <React.Fragment key={row.instanceId}>
                {/* Row header */}
                <div
                  style={{
                    background: rowBg,
                    padding: `${SPACING.sm} ${SPACING.md}`,
                    borderBottom: `1px solid ${COLORS.ink}08`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      fontWeight: 500,
                      color: COLORS.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={row.instanceId}
                  >
                    {row.instanceName}
                  </span>
                  <PatternBadge
                    patternId={row.patternId}
                    instanceType={row.instanceType}
                  />
                </div>

                {/* Stage cells */}
                {visibleStages.map((stageId) => {
                  const count = row.coverage[stageId] ?? -1;
                  const isNA = count === -1;
                  return (
                    <div
                      key={stageId}
                      title={
                        isNA
                          ? `${stageId}: not in pattern`
                          : `${stageId}: ${count} evidence item${count === 1 ? '' : 's'}`
                      }
                      style={{
                        background: isNA ? `${COLORS.ink}04` : cellBackground(count),
                        borderBottom: `1px solid ${COLORS.ink}08`,
                        borderLeft: `1px solid ${COLORS.ink}06`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 44,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          fontWeight: 600,
                          color: isNA ? `${COLORS.ink}22` : cellTextColor(count),
                        }}
                      >
                        {isNA ? '—' : count === 0 ? '0' : String(count)}
                      </span>
                    </div>
                  );
                })}

                {/* Overflow indicator */}
                {overflowCount > 0 && (
                  <div
                    style={{
                      background: `${COLORS.ink}03`,
                      borderBottom: `1px solid ${COLORS.ink}08`,
                      borderLeft: `1px solid ${COLORS.ink}06`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}44`,
                      }}
                    >
                      …
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <footer
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}03`,
          borderTop: `1px solid ${COLORS.ink}08`,
          display: 'flex',
          gap: SPACING.lg,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {[
          { bg: `${COLORS.ink}08`, label: '0 — no evidence', textColor: `${COLORS.ink}66` },
          { bg: COLORS.mintSoft, label: '1–2 items', textColor: COLORS.mintInk },
          { bg: COLORS.mintInk + '22', label: '3+ items', textColor: COLORS.mintInk },
          { bg: `${COLORS.ink}04`, label: '— not in pattern', textColor: `${COLORS.ink}44` },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: RADIUS.sm,
                background: item.bg,
                border: `1px solid ${COLORS.ink}14`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </footer>
    </section>
  );
}

// ─── CoverageStats ─────────────────────────────────────────────────────────────

function InstanceStatRow({
  row,
  rank,
}: {
  row: InstanceRow;
  rank: number;
}) {
  const pctStr = `${(row.coveragePct * 100).toFixed(0)}%`;
  const barColor =
    row.coveragePct >= 0.5
      ? COLORS.mintInk
      : row.coveragePct > 0
        ? COLORS.amberInk
        : `${COLORS.ink}33`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 1fr 60px 80px',
        gap: SPACING.sm,
        alignItems: 'center',
        padding: `${SPACING.sm} 0`,
        borderBottom: `1px solid ${COLORS.ink}08`,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}55`,
          textAlign: 'right',
        }}
      >
        {rank}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.instanceName}
        </div>
        <PatternBadge patternId={row.patternId} instanceType={row.instanceType} />
      </div>
      <div
        style={{
          height: 6,
          borderRadius: RADIUS.pill,
          background: `${COLORS.ink}12`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${row.coveragePct * 100}%`,
            background: barColor,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 600,
          color: barColor,
          textAlign: 'right',
        }}
      >
        {pctStr} ({row.coveredCount}/{row.stages.length})
      </span>
    </div>
  );
}

function CoverageStats({ rows }: { rows: InstanceRow[] }) {
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => b.coveragePct - a.coveragePct);
  const top3 = sorted.slice(0, 3);
  const worst3 = sorted.slice(-3).reverse();

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
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Coverage ranking
        </span>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        {/* Best covered */}
        <div
          style={{
            padding: `${SPACING.md} ${SPACING.lg}`,
            borderRight: `1px solid ${COLORS.ink}10`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.mintInk,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: SPACING.sm,
            }}
          >
            Best covered
          </div>
          {top3.map((row, i) => (
            <div key={row.instanceId}>
              <InstanceStatRow row={row} rank={i + 1} />
            </div>
          ))}
        </div>

        {/* Worst covered */}
        <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.coralInk,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: SPACING.sm,
            }}
          >
            Needs coverage
          </div>
          {worst3.map((row, i) => (
            <div key={row.instanceId}>
              <InstanceStatRow row={row} rank={i + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CoverageMatrixPage() {
  const rows = buildMatrix();
  const stats = computeGlobalStats(rows);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Evidence Ingest"
          primaryActionHref="/admin/reasoning/evidence-ingest"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Coverage matrix"
        subtitle="Instance × stage evidence coverage — which instances have evidence ingested for which lifecycle stages. Resets on server restart."
      >
        <SummaryStrip
          totalInstances={stats.totalInstances}
          totalStages={stats.totalStages}
          coveragePct={stats.coveragePct}
        />

        <CoverageMatrix rows={rows} />

        <CoverageStats rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

