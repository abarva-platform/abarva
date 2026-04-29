// /admin/reasoning/gate-heatmap — Stage-level gate pass-rate heatmap.
//
// Pure server component. Shows average gate satisfaction per stage across
// all source event + program instances.
//
// Rows    = lifecycle stages (unique across all instances)
// Columns = [Stage, Instances, Avg pass rate bar, Pass%, Blocked count]
// Color   = ≥80% mint, 50–79% amber, <50% rust/coral

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import type { LifecyclePatternId } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate heatmap · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface StagePassRate {
  stageId: string;
  instanceCount: number;
  avgPassRate: number; // 0–1
  blockedCount: number; // instances where pass rate < 1
  totalGatesMet: number;
  totalGatesTotal: number;
}

// ─── Pass-rate color helpers ──────────────────────────────────────────────────

function passRateBg(rate: number): string {
  if (rate >= 0.8) return SHELL.MINT_BG;
  if (rate >= 0.5) return SHELL.PEACH_BG;
  return SHELL.RUST_BG;
}

function passRateText(rate: number): string {
  if (rate >= 0.8) return SHELL.MINT_TEXT;
  if (rate >= 0.5) return SHELL.PEACH_TEXT;
  return SHELL.RUST_TEXT;
}

function passRateBarFill(rate: number): string {
  if (rate >= 0.8) return SHELL.MINT_TEXT;
  if (rate >= 0.5) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function buildHeatmapData(): StagePassRate[] {
  // Collect all patterns for stage-lookup
  const allPatterns = getAllLifecyclePatterns();
  const patternMap = new Map(allPatterns.map((p) => [p.patternId, p]));

  // stageId → accumulated stats
  const stageStats = new Map<
    string,
    { instanceCount: number; sumPassRate: number; blockedCount: number; totalMet: number; totalTotal: number }
  >();

  function processInstance(
    patternId: string,
    evidenceMap: Record<string, unknown>,
  ): void {
    const pattern = patternMap.get(patternId as LifecyclePatternId);
    if (pattern === undefined) return;

    const stageIds = [...new Set(pattern.stages.map((s) => s.id))];

    for (const stageId of stageIds) {
      const evaluations = evaluateStageGates(pattern, stageId, evidenceMap);
      if (evaluations.length === 0) continue;

      const met = evaluations.filter(
        (e) => e.status === 'met' || e.status === 'waived',
      ).length;
      const total = evaluations.length;
      const passRate = met / total;

      const existing = stageStats.get(stageId) ?? {
        instanceCount: 0,
        sumPassRate: 0,
        blockedCount: 0,
        totalMet: 0,
        totalTotal: 0,
      };

      stageStats.set(stageId, {
        instanceCount: existing.instanceCount + 1,
        sumPassRate: existing.sumPassRate + passRate,
        blockedCount: existing.blockedCount + (passRate < 1 ? 1 : 0),
        totalMet: existing.totalMet + met,
        totalTotal: existing.totalTotal + total,
      });
    }
  }

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const evidenceMap = buildEvidenceMap(inst);
    processInstance(inst.patternId, evidenceMap);
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const evidenceMap = buildProgramEvidenceMap(inst);
    processInstance(inst.patternId, evidenceMap);
  }

  const rows: StagePassRate[] = [];
  for (const [stageId, stats] of stageStats) {
    rows.push({
      stageId,
      instanceCount: stats.instanceCount,
      avgPassRate: stats.sumPassRate / stats.instanceCount,
      blockedCount: stats.blockedCount,
      totalGatesMet: stats.totalMet,
      totalGatesTotal: stats.totalTotal,
    });
  }

  // Sort ascending by avgPassRate (worst first)
  return rows.sort((a, b) => a.avgPassRate - b.avgPassRate);
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  stageCount,
  instanceCount,
  avgPassRate,
}: {
  stageCount: number;
  instanceCount: number;
  avgPassRate: number;
}) {
  const pct = Math.round(avgPassRate * 100);

  const items: Array<{ label: string; value: string; color: string }> = [
    { label: 'stages', value: String(stageCount), color: COLORS.ink },
    { label: 'instances', value: String(instanceCount), color: COLORS.ink },
    {
      label: 'avg pass rate',
      value: `${pct}%`,
      color: passRateText(avgPassRate),
    },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: item.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Heatmap grid ──────────────────────────────────────────────────────────────

const COL_WIDTHS = ['220px', '80px', '1fr', '64px', '88px'];
const COL_HEADERS = ['Stage', 'Instances', 'Avg pass rate', 'Pass %', 'Blocked'];

function PassRateBar({ rate }: { rate: number }) {
  const fill = passRateBarFill(rate);
  const pct = Math.round(rate * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          background: `${COLORS.ink}14`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: fill,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
    </div>
  );
}

function HeatmapGrid({ rows }: { rows: StagePassRate[] }) {
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
          Stage pass-rate heatmap
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Sorted by average pass rate ascending — worst stages first. Color: mint ≥80%, amber 50–79%, coral &lt;50%.
        </div>
      </header>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COL_WIDTHS.join(' '),
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}18`,
          background: `${COLORS.ink}04`,
          gap: SPACING.md,
        }}
      >
        {COL_HEADERS.map((h) => (
          <div
            key={h}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: `${COLORS.ink}88`,
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const rowBg = i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
        const pct = Math.round(row.avgPassRate * 100);
        const bg = passRateBg(row.avgPassRate);
        const textCol = passRateText(row.avgPassRate);

        return (
          <div
            key={row.stageId}
            style={{
              display: 'grid',
              gridTemplateColumns: COL_WIDTHS.join(' '),
              padding: `10px ${SPACING.lg}`,
              borderBottom: `1px solid ${COLORS.ink}0d`,
              background: rowBg,
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            {/* Stage */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: COLORS.navy,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={row.stageId}
            >
              {row.stageId}
            </div>

            {/* Instance count */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: `${COLORS.ink}cc`,
                textAlign: 'right',
              }}
            >
              {row.instanceCount}
            </div>

            {/* Pass rate bar */}
            <PassRateBar rate={row.avgPassRate} />

            {/* Pass % badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: bg,
                color: textCol,
                borderRadius: RADIUS.md,
                padding: '3px 8px',
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {pct}%
            </div>

            {/* Blocked count */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: row.blockedCount > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}44`,
                fontWeight: row.blockedCount > 0 ? 700 : 400,
                textAlign: 'right',
              }}
            >
              {row.blockedCount > 0 ? row.blockedCount : '—'}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Worst stages card ─────────────────────────────────────────────────────────

function WorstStagesCard({ rows }: { rows: StagePassRate[] }) {
  const worst = rows.slice(0, 5);
  if (worst.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.RUST_BG,
        border: `1px solid ${SHELL.RUST_TEXT}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <h3
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: SHELL.RUST_TEXT,
          margin: `0 0 ${SPACING.md} 0`,
          letterSpacing: '-0.01em',
        }}
      >
        Worst 5 stages by pass rate
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {worst.map((row, i) => {
          const pct = Math.round(row.avgPassRate * 100);
          return (
            <div
              key={row.stageId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                background: `${SHELL.RUST_TEXT}08`,
                borderRadius: RADIUS.md,
                padding: `8px ${SPACING.md}`,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${SHELL.RUST_TEXT}99`,
                  minWidth: 16,
                  fontWeight: 700,
                }}
              >
                #{i + 1}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  color: SHELL.RUST_TEXT,
                  fontWeight: 700,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.stageId}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${SHELL.RUST_TEXT}aa`,
                }}
              >
                {row.instanceCount} instance{row.instanceCount !== 1 ? 's' : ''}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                  background: `${SHELL.RUST_TEXT}18`,
                  borderRadius: RADIUS.sm,
                  padding: '2px 8px',
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateHeatmapPage() {
  const rows = buildHeatmapData();

  const totalInstances = Math.max(
    ...rows.map((r) => r.instanceCount),
    0,
  );
  const overallAvg =
    rows.length === 0
      ? 0
      : rows.reduce((s, r) => s + r.avgPassRate, 0) / rows.length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate heatmap"
        subtitle="Average gate satisfaction per lifecycle stage across all source event and program instances. Worst stages surface first."
      >
        <SummaryStrip
          stageCount={rows.length}
          instanceCount={totalInstances}
          avgPassRate={overallAvg}
        />
        <WorstStagesCard rows={rows} />
        <HeatmapGrid rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
