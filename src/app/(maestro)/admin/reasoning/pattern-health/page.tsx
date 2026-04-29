// /admin/reasoning/pattern-health — Health metrics aggregated by lifecycle pattern.
//
// Server component. Groups all fixture instances (source events + programs) by
// their patternId, computes per-pattern aggregates, and renders a sorted list of
// pattern cards — most troubled patterns first (ascending avg composite score).
//
// Composite score formula (mirrors /admin/reasoning/scorecard):
//   gates_component    = (gatesMet / max(gatesTotal, 1)) * 60
//   contradictions_cmp = (1 - min(activeContradictions / 5, 1)) * 30
//   baseline           = 10
//   score              = Math.round(sum)

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthLabel, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern Health · AbarVa Admin',
};

// ─── Composite score ──────────────────────────────────────────────────────────

function compositeScore(gatesMet: number, gatesTotal: number, activeContradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
    (1 - Math.min(activeContradictions / 5, 1)) * 30 +
    10,
  );
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface PatternHealthRow {
  patternId: string;
  patternTitle: string;
  instanceCount: number;
  avgScore: number;
  totalContradictions: number;
  gatesCoveragePct: number;
  healthDist: { healthy: number; warning: number; critical: number; unknown: number };
  worstLabel: string;
  worstScore: number;
}

// ─── Build aggregates ─────────────────────────────────────────────────────────

function buildPatternRows(): PatternHealthRow[] {
  // Build a patternId → instance patternId lookup from raw instances
  const instancePatternMap = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instancePatternMap.set(inst.id, inst.patternId);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instancePatternMap.set(inst.id, inst.patternId);
  }

  // Get health rows and pattern title lookup
  const healthRows: InstanceHealthRow[] = buildHealthBoardRows();
  const allPatterns = getAllLifecyclePatterns();
  const patternTitleMap = new Map<string, string>();
  for (const p of allPatterns) {
    patternTitleMap.set(p.patternId, p.title);
  }

  // Group health rows by patternId
  const grouped = new Map<string, InstanceHealthRow[]>();
  for (const row of healthRows) {
    const patternId = instancePatternMap.get(row.id);
    if (!patternId) continue;
    const list = grouped.get(patternId) ?? [];
    list.push(row);
    grouped.set(patternId, list);
  }

  const result: PatternHealthRow[] = [];

  for (const [patternId, rows] of grouped.entries()) {
    const title = patternTitleMap.get(patternId) ?? patternId;
    const instanceCount = rows.length;

    let sumScore = 0;
    let totalContradictions = 0;
    let sumGatesMet = 0;
    let sumGatesTotal = 0;
    const healthDist = { healthy: 0, warning: 0, critical: 0, unknown: 0 };

    let worstLabel = '';
    let worstScore = Infinity;

    for (const row of rows) {
      const score = compositeScore(row.gatesMet, row.gatesTotal, row.activeContradictions);
      sumScore += score;
      totalContradictions += row.activeContradictions;
      sumGatesMet += row.gatesMet;
      sumGatesTotal += row.gatesTotal;

      const bucket = row.healthLabel as InstanceHealthLabel;
      if (bucket in healthDist) {
        healthDist[bucket as keyof typeof healthDist]++;
      }

      if (score < worstScore) {
        worstScore = score;
        worstLabel = row.label;
      }
    }

    const avgScore = Math.round(sumScore / instanceCount);
    const gatesCoveragePct = sumGatesTotal === 0
      ? 100
      : Math.round((sumGatesMet / sumGatesTotal) * 100);

    result.push({
      patternId,
      patternTitle: title,
      instanceCount,
      avgScore,
      totalContradictions,
      gatesCoveragePct,
      healthDist,
      worstLabel,
      worstScore: worstScore === Infinity ? avgScore : worstScore,
    });
  }

  // Sort ascending by avg score (most troubled first)
  return result.sort((a, b) => a.avgScore - b.avgScore);
}

// ─── Score color helper ───────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return COLORS.mintInk;
  if (score >= 40) return COLORS.amberInk;
  return COLORS.coralInk;
}

function scoreBg(score: number): string {
  if (score >= 70) return COLORS.mintSoft;
  if (score >= 40) return COLORS.amberSoft;
  return COLORS.coralSoft;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  instanceCount,
}: {
  patternCount: number;
  instanceCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}99`,
      }}
    >
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {patternCount} pattern{patternCount !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {instanceCount} total instance{instanceCount !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>sorted by avg score ascending (most troubled first)</span>
    </div>
  );
}

function HealthDistBar({
  dist,
  total,
}: {
  dist: PatternHealthRow['healthDist'];
  total: number;
}) {
  if (total === 0) return null;

  const segments: Array<{ key: string; count: number; color: string }> = [
    { key: 'critical', count: dist.critical, color: COLORS.coralInk },
    { key: 'warning', count: dist.warning, color: COLORS.amberInk },
    { key: 'healthy', count: dist.healthy, color: COLORS.mintInk },
    { key: 'unknown', count: dist.unknown, color: `${COLORS.ink}33` },
  ];

  return (
    <div>
      {/* Bar */}
      <div
        style={{
          display: 'flex',
          height: 6,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
          gap: 1,
        }}
      >
        {segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <div
              key={s.key}
              title={`${s.key}: ${s.count}`}
              style={{
                flex: s.count / total,
                background: s.color,
                borderRadius: RADIUS.pill,
              }}
            />
          ))}
      </div>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          marginTop: 6,
          flexWrap: 'wrap',
        }}
      >
        {segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: s.color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}99`,
                }}
              >
                {s.key}: {s.count}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function PatternCard({ row }: { row: PatternHealthRow }) {
  const scoreCol = scoreColor(row.avgScore);
  const scoreBgCol = scoreBg(row.avgScore);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 17,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {row.patternTitle}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}77`,
              }}
            >
              {row.patternId}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: COLORS.skyPale,
                color: COLORS.navy,
                borderRadius: RADIUS.pill,
                padding: '2px 8px',
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {row.instanceCount} instance{row.instanceCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Avg score badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: scoreBgCol,
            borderRadius: RADIUS.md,
            padding: '8px 14px',
            flexShrink: 0,
            minWidth: 60,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 22,
              fontWeight: 700,
              color: scoreCol,
              lineHeight: 1,
            }}
          >
            {row.avgScore}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 9,
              color: scoreCol,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 3,
              fontWeight: 600,
            }}
          >
            avg score
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.lg,
          flexWrap: 'wrap',
          paddingBottom: SPACING.sm,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <StatChip
          label="Gates coverage"
          value={`${row.gatesCoveragePct}%`}
          warn={row.gatesCoveragePct < 70}
        />
        <StatChip
          label="Active contradictions"
          value={String(row.totalContradictions)}
          warn={row.totalContradictions > 0}
          warnColor={COLORS.coralInk}
        />
      </div>

      {/* Health distribution bar */}
      <HealthDistBar dist={row.healthDist} total={row.instanceCount} />

      {/* Worst instance */}
      {row.worstLabel && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}77`,
          }}
        >
          Worst instance:{' '}
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}cc`,
            }}
          >
            {row.worstLabel}
          </span>
          {' '}
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: scoreColor(row.worstScore),
              fontWeight: 600,
            }}
          >
            ({row.worstScore})
          </span>
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  warn,
  warnColor,
}: {
  label: string;
  value: string;
  warn?: boolean;
  warnColor?: string;
}) {
  const valueColor = warn === true
    ? (warnColor ?? COLORS.amberInk)
    : COLORS.ink;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: valueColor,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PatternGrid({ rows }: { rows: PatternHealthRow[] }) {
  if (rows.length === 0) {
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
        }}
      >
        No pattern data — no fixture instances found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {rows.map((row) => (
        <PatternCard key={row.patternId} row={row} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternHealthPage() {
  const rows = buildPatternRows();
  const totalInstances = rows.reduce((s, r) => s + r.instanceCount, 0);

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
        title="Pattern health"
        subtitle="Health metrics aggregated by lifecycle pattern — identifies which patterns have the most issues across their instances."
      >
        <SummaryStrip patternCount={rows.length} instanceCount={totalInstances} />
        <PatternGrid rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
