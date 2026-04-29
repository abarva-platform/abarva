// /admin/reasoning/resolution-effectiveness — Contradiction resolution effectiveness.
//
// Pure server component, force-dynamic.
//
// For each resolved contradiction, compares the instance's current health
// score against an estimated pre-resolution health score, and quantifies the
// improvement.
//
// Effectiveness estimation:
//   estimatedPre = Math.max(10, currentScore - 15)   (each contradiction costs ~15 pts)
//   improvement  = currentScore - estimatedPre
//   effectivePct = (improvement / Math.max(estimatedPre, 1)) × 100
//
// Sections:
//   SummaryStrip      — N resolutions · Avg improvement: +X pts · Most effective path: Y
//   EffectivenessTable — per-resolution detail, sorted by improvement desc
//   PathEffectiveness  — avg improvement per resolution path (bar chart)
//   Empty state        — mint banner when no resolutions yet

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Resolution effectiveness · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface EffectivenessRow {
  compoundId: string;
  instanceId: string;
  instanceLabel: string;
  contradictionId: string;
  contradictionLabel: string;
  resolutionPath: string;
  currentScore: number;
  estimatedPre: number;
  improvement: number;
  effectivenessPct: number;
}

interface PathStat {
  path: string;
  count: number;
  avgImprovement: number;
  totalImprovement: number;
}

// ─── Score computation (same formula as scorecard / health-bands) ─────────────

import type { InstanceHealthRow } from '@/lib/reasoning/health-board';

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildEffectivenessRows(): EffectivenessRow[] {
  const rawEntries = getResolvedEntries();
  if (rawEntries.length === 0) return [];

  // Build health score map: instanceId → score
  const healthRows = buildHealthBoardRows();
  const scoreMap = new Map<string, number>();
  for (const r of healthRows) {
    scoreMap.set(r.id, computeScore(r));
  }

  // Build instance label map: instanceId → label
  const labelMap = new Map<string, string>();
  for (const r of healthRows) {
    labelMap.set(r.id, r.label);
  }

  // Build template map: templateId → { label, resolutionPath }
  const templateMap = new Map<string, { label: string; resolutionPath: string }>();
  for (const pattern of getAllLifecyclePatterns()) {
    for (const tpl of pattern.contradictionTemplates) {
      if (!templateMap.has(tpl.id)) {
        templateMap.set(tpl.id, {
          label: tpl.label,
          resolutionPath: tpl.resolutionPath,
        });
      }
    }
  }

  const rows: EffectivenessRow[] = [];

  for (const entry of rawEntries) {
    const sep = entry.id.indexOf('::');
    const instanceId = sep >= 0 ? entry.id.slice(0, sep) : '';
    const contradictionId = sep >= 0 ? entry.id.slice(sep + 2) : entry.id;

    const currentScore = scoreMap.get(instanceId) ?? 50;
    const estimatedPre = Math.max(10, currentScore - 15);
    const improvement = currentScore - estimatedPre;
    const effectivenessPct = Math.round((improvement / Math.max(estimatedPre, 1)) * 100);

    const tpl = templateMap.get(contradictionId);

    rows.push({
      compoundId: entry.id,
      instanceId,
      instanceLabel: labelMap.get(instanceId) ?? (instanceId || '—'),
      contradictionId,
      contradictionLabel: tpl?.label ?? contradictionId,
      resolutionPath: tpl?.resolutionPath ?? '—',
      currentScore,
      estimatedPre,
      improvement,
      effectivenessPct,
    });
  }

  // Sort by improvement descending
  return rows.sort((a, b) => b.improvement - a.improvement);
}

function buildPathStats(rows: EffectivenessRow[]): PathStat[] {
  if (rows.length === 0) return [];

  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const key = row.resolutionPath === '—' ? 'Unknown' : row.resolutionPath;
    const existing = map.get(key) ?? { total: 0, count: 0 };
    map.set(key, { total: existing.total + row.improvement, count: existing.count + 1 });
  }

  const stats: PathStat[] = [];
  for (const [path, { total, count }] of map.entries()) {
    stats.push({
      path,
      count,
      totalImprovement: total,
      avgImprovement: Math.round(total / count),
    });
  }

  return stats.sort((a, b) => b.avgImprovement - a.avgImprovement);
}

// ─── Summary helpers ──────────────────────────────────────────────────────────

function computeAvgImprovement(rows: EffectivenessRow[]): number {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((sum, r) => sum + r.improvement, 0) / rows.length);
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  rows,
  pathStats,
}: {
  rows: EffectivenessRow[];
  pathStats: PathStat[];
}) {
  const avgImprovement = computeAvgImprovement(rows);
  const topPath = pathStats[0]?.path ?? '—';

  const items = [
    { label: 'Resolutions', value: String(rows.length) },
    { label: 'Avg improvement', value: `+${avgImprovement} pts` },
    { label: 'Most effective path', value: topPath.length > 32 ? topPath.slice(0, 32) + '…' : topPath },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap' as const,
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 18,
              color: COLORS.ink,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyStateBanner() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: SHELL.MINT_TEXT,
        fontWeight: 500,
      }}
    >
      No resolutions yet. Resolve a contradiction from a Source or Programs detail page to see
      effectiveness analysis here.
    </div>
  );
}

// ─── Table cells ──────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 10,
  fontWeight: 700,
  color: `${COLORS.ink}66`,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: `${SPACING.sm} ${SPACING.md}`,
  textAlign: 'left',
  borderBottom: `1px solid ${COLORS.ink}14`,
  whiteSpace: 'nowrap',
};

const CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  verticalAlign: 'middle',
  borderBottom: `1px solid ${COLORS.ink}08`,
};

const MONO_CELL: React.CSSProperties = {
  ...CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
};

// ─── ResolutionPathPill ───────────────────────────────────────────────────────

function ResolutionPathPill({ path }: { path: string }) {
  const isUnknown = path === '—' || path === 'Unknown';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isUnknown ? SHELL.GRAY_BG : SHELL.BLUE_BG,
        color: isUnknown ? SHELL.GRAY_TEXT : SHELL.INK_MID,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        flexShrink: 0,
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      }}
      title={path}
    >
      {isUnknown ? 'unknown' : path.length > 30 ? path.slice(0, 30) + '…' : path}
    </span>
  );
}

// ─── ImprovementChip ──────────────────────────────────────────────────────────

function ImprovementChip({ pts }: { pts: number }) {
  const bg = pts >= 10 ? SHELL.MINT_BG : pts >= 5 ? COLORS.amberSoft : SHELL.PEACH_BG;
  const fg = pts >= 10 ? SHELL.MINT_TEXT : pts >= 5 ? '#7A4F01' : SHELL.PEACH_TEXT;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      +{pts}
    </span>
  );
}

// ─── EffectivenessTable ───────────────────────────────────────────────────────

function EffectivenessTable({ rows }: { rows: EffectivenessRow[] }) {
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
            Resolution effectiveness
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Per-resolution health improvement, sorted by improvement descending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} row{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr style={{ background: `${COLORS.ink}04` }}>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Contradiction</th>
              <th style={HEADER_CELL}>Path</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Current health</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Est. pre-resolution</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Improvement</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Effectiveness %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.compoundId}>
                {/* Instance */}
                <td style={CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500 }}>{row.instanceLabel}</span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.instanceId || '—'}
                    </span>
                  </div>
                </td>

                {/* Contradiction */}
                <td style={CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontWeight: 500,
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                      title={row.contradictionLabel}
                    >
                      {row.contradictionLabel}
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

                {/* Resolution path */}
                <td style={CELL}>
                  <ResolutionPathPill path={row.resolutionPath} />
                </td>

                {/* Current health */}
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.currentScore}</td>

                {/* Est. pre-resolution */}
                <td style={{ ...MONO_CELL, textAlign: 'right', color: `${COLORS.ink}88` }}>
                  {row.estimatedPre}
                </td>

                {/* Improvement */}
                <td style={{ ...CELL, textAlign: 'right' }}>
                  <ImprovementChip pts={row.improvement} />
                </td>

                {/* Effectiveness % */}
                <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                  {row.effectivenessPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── PathEffectiveness ────────────────────────────────────────────────────────

function PathEffectiveness({ stats }: { stats: PathStat[] }) {
  if (stats.length === 0) return null;

  const maxAvg = stats[0].avgImprovement;

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
          Path effectiveness
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Average health improvement (pts) per resolution path, sorted descending
        </div>
      </header>

      <div
        style={{
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {stats.map((stat) => {
          const barPct = maxAvg > 0 ? Math.round((stat.avgImprovement / maxAvg) * 100) : 0;
          const isUnknown = stat.path === 'Unknown';
          return (
            <div key={stat.path} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              {/* Path label */}
              <div
                style={{
                  width: 260,
                  flexShrink: 0,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={stat.path}
              >
                {stat.path.length > 42 ? stat.path.slice(0, 42) + '…' : stat.path}
              </div>

              {/* Bar track */}
              <div
                style={{
                  flex: 1,
                  height: 14,
                  background: `${COLORS.ink}0c`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    height: '100%',
                    background: isUnknown ? `${COLORS.ink}44` : SHELL.MINT_TEXT,
                    borderRadius: RADIUS.pill,
                    minWidth: stat.avgImprovement > 0 ? 4 : 0,
                  }}
                />
              </div>

              {/* Avg pts + count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  flexShrink: 0,
                  minWidth: 100,
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  +{stat.avgImprovement} pts
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  ({stat.count})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResolutionEffectivenessPage() {
  const rows = buildEffectivenessRows();
  const pathStats = buildPathStats(rows);

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
        title="Resolution effectiveness"
        subtitle="Estimated health improvement per resolved contradiction — compares current instance health against pre-resolution baseline."
      >
        <SummaryStrip rows={rows} pathStats={pathStats} />

        {rows.length === 0 ? (
          <EmptyStateBanner />
        ) : (
          <>
            <EffectivenessTable rows={rows} />
            <PathEffectiveness stats={pathStats} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
