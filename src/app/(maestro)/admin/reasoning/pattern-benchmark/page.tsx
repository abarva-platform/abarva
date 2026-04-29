// /admin/reasoning/pattern-benchmark — Within-pattern instance benchmarking.
//
// Pure server component. Groups all fixture instances by lifecycle pattern,
// computes min/max/avg health score per group, and identifies best and worst
// performers both within each group and across all patterns.
//
// Score formula (same as scorecard, 0–100):
//   gates_component    = (gatesMet / max(gatesTotal, 1)) * 60
//   contradictions_cmp = (1 - min(activeContradictions / 5, 1)) * 30
//   baseline           = 10
//   total              = round(gates_component + contradictions_cmp + baseline)

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern benchmark · AbarVa Admin',
};

// ─── Score helpers ────────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

type ScoreBand = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

function bandBar(band: ScoreBand): string {
  if (band === 'mint') return SHELL.MINT_TEXT;
  if (band === 'amber') return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

function bandBarBg(band: ScoreBand): string {
  if (band === 'mint') return SHELL.MINT_BG;
  if (band === 'amber') return SHELL.PAPER_DEEP;
  return SHELL.RUST_BG;
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface ScoredInstance {
  row: InstanceHealthRow;
  score: number;
  rank: number; // 1-based rank within pattern group (1 = best)
  delta: number; // score - groupAvg (positive = above avg)
}

interface PatternBenchmarkGroup {
  patternId: string;
  patternTitle: string;
  domain: string;
  instances: ScoredInstance[];
  avgScore: number;
  minScore: number;
  maxScore: number;
  bestInstance: ScoredInstance;
  worstInstance: ScoredInstance;
}

// ─── Build benchmark groups ───────────────────────────────────────────────────

function buildBenchmarkGroups(): PatternBenchmarkGroup[] {
  const allPatterns = getAllLifecyclePatterns();
  const patternMap = new Map<string, { title: string; domain: string }>();
  for (const p of allPatterns) {
    patternMap.set(p.patternId, { title: p.title, domain: p.domain });
  }

  // Build id → patternId lookup from the raw fixture arrays
  const idToPattern = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    idToPattern.set(inst.id, inst.patternId);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    idToPattern.set(inst.id, inst.patternId);
  }

  const rows = buildHealthBoardRows();

  // Group health rows by patternId
  const grouped = new Map<string, Array<{ row: InstanceHealthRow; score: number }>>();
  for (const row of rows) {
    const patternId = idToPattern.get(row.id);
    if (!patternId) continue;
    const score = computeScore(row);
    const list = grouped.get(patternId) ?? [];
    list.push({ row, score });
    grouped.set(patternId, list);
  }

  const groups: PatternBenchmarkGroup[] = [];

  for (const [patternId, items] of grouped.entries()) {
    if (items.length < 2) continue; // need ≥2 instances for a meaningful benchmark

    const meta = patternMap.get(patternId);
    const scores = items.map((i) => i.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Sort by score descending to assign ranks
    const sorted = [...items].sort((a, b) => b.score - a.score);
    const scoredInstances: ScoredInstance[] = sorted.map((item, idx) => ({
      row: item.row,
      score: item.score,
      rank: idx + 1,
      delta: item.score - avgScore,
    }));

    const bestInstance = scoredInstances[0];
    const worstInstance = scoredInstances[scoredInstances.length - 1];

    groups.push({
      patternId,
      patternTitle: meta?.title ?? patternId,
      domain: meta?.domain ?? 'unknown',
      instances: scoredInstances,
      avgScore,
      minScore,
      maxScore,
      bestInstance,
      worstInstance,
    });
  }

  // Sort by avgScore descending
  return groups.sort((a, b) => b.avgScore - a.avgScore);
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({ groups }: { groups: PatternBenchmarkGroup[] }) {
  const totalInstances = groups.reduce((s, g) => s + g.instances.length, 0);
  const bestGroup = groups[0];
  const worstGroup = groups[groups.length - 1];

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}99`,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {groups.length} pattern group{groups.length !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {totalInstances} total instance{totalInstances !== 1 ? 's' : ''}
      </span>
      {bestGroup ? (
        <>
          <span style={{ color: `${COLORS.ink}44` }}>·</span>
          <span>
            Best performing:{' '}
            <span style={{ fontWeight: 700, color: SHELL.MINT_TEXT }}>
              {bestGroup.patternTitle}
            </span>{' '}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.MINT_TEXT,
              }}
            >
              (avg {bestGroup.avgScore})
            </span>
          </span>
        </>
      ) : null}
      {worstGroup && worstGroup !== bestGroup ? (
        <>
          <span style={{ color: `${COLORS.ink}44` }}>·</span>
          <span>
            Worst:{' '}
            <span style={{ fontWeight: 700, color: SHELL.RUST_TEXT }}>
              {worstGroup.patternTitle}
            </span>{' '}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.RUST_TEXT,
              }}
            >
              (avg {worstGroup.avgScore})
            </span>
          </span>
        </>
      ) : null}
    </div>
  );
}

function DomainPill({ domain }: { domain: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.skyPale,
        color: COLORS.navy,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {domain.replace(/_/g, ' ')}
    </span>
  );
}

function AvgScoreBadge({ score }: { score: number }) {
  const band = scoreBand(score);
  const bg = bandBarBg(band);
  const fg = bandBar(band);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      avg {score}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const band = scoreBand(score);
  const barColor = bandBar(band);
  const barBgColor = bandBarBg(band);
  return (
    <div
      aria-hidden="true"
      style={{
        flex: 1,
        height: 8,
        borderRadius: RADIUS.pill,
        background: barBgColor,
        overflow: 'hidden',
        minWidth: 60,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${score}%`,
          background: barColor,
          borderRadius: RADIUS.pill,
        }}
      />
    </div>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}55`,
        }}
      >
        ±0
      </span>
    );
  }
  const isPos = delta > 0;
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        color: isPos ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
      }}
    >
      {isPos ? '+' : ''}
      {delta}
    </span>
  );
}

function BenchmarkTable({ group }: { group: PatternBenchmarkGroup }) {
  const TH: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: `${COLORS.ink}66`,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}14`,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const TD: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    color: COLORS.ink,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle',
  };

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Pattern header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          background: `${COLORS.ink}03`,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            flex: 1,
            minWidth: 180,
          }}
        >
          {group.patternTitle}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: `${COLORS.ink}66`,
          }}
        >
          {group.patternId}
        </span>
        <DomainPill domain={group.domain} />
        <AvgScoreBadge score={group.avgScore} />
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {group.instances.length} instances · range {group.minScore}–{group.maxScore}
        </span>
      </div>

      {/* Instance rows */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36, textAlign: 'center' }}>Rank</th>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, minWidth: 140 }}>Score bar</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Score</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>vs avg</th>
            </tr>
          </thead>
          <tbody>
            {group.instances.map((inst) => (
              <tr
                key={inst.row.id}
                style={{
                  background:
                    inst.rank === 1
                      ? `${SHELL.MINT_BG}55`
                      : inst.rank === group.instances.length
                        ? `${SHELL.RUST_BG}44`
                        : COLORS.white,
                }}
              >
                <td
                  style={{
                    ...TD,
                    textAlign: 'center',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      inst.rank === 1
                        ? SHELL.MINT_TEXT
                        : inst.rank === group.instances.length
                          ? SHELL.RUST_TEXT
                          : `${COLORS.ink}66`,
                  }}
                >
                  {inst.rank}
                </td>
                <td style={TD}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.ink,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {inst.row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}77`,
                      }}
                    >
                      {inst.row.id}
                    </span>
                  </div>
                </td>
                <td style={{ ...TD, minWidth: 140 }}>
                  <ScoreBar score={inst.score} />
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: bandBar(scoreBand(inst.score)),
                  }}
                >
                  {inst.score}
                </td>
                <td style={{ ...TD, textAlign: 'right' }}>
                  <DeltaChip delta={inst.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BestWorstCard({ groups }: { groups: PatternBenchmarkGroup[] }) {
  if (groups.length === 0) return null;

  // Best instance across all patterns = highest individual score
  let bestInst: ScoredInstance | null = null;
  let bestGroupTitle = '';
  let worstInst: ScoredInstance | null = null;
  let worstGroupTitle = '';

  for (const g of groups) {
    for (const inst of g.instances) {
      if (bestInst === null || inst.score > bestInst.score) {
        bestInst = inst;
        bestGroupTitle = g.patternTitle;
      }
      if (worstInst === null || inst.score < worstInst.score) {
        worstInst = inst;
        worstGroupTitle = g.patternTitle;
      }
    }
  }

  if (!bestInst || !worstInst) return null;

  const cardBase: React.CSSProperties = {
    flex: '1 1 280px',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.sm,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 2,
  };

  const instanceNameStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  };

  const metaStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 11,
    opacity: 0.75,
  };

  const scoreStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    marginTop: SPACING.xs,
  };

  const statRowStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 12,
    display: 'flex',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginTop: 4,
  };

  // Safe access since we checked above
  const best = bestInst as ScoredInstance;
  const worst = worstInst as ScoredInstance;

  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      {/* Best performer — mint */}
      <div
        style={{
          ...cardBase,
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_LINE}`,
          color: SHELL.MINT_TEXT,
        }}
      >
        <div style={{ ...labelStyle, color: SHELL.MINT_TEXT }}>Best performer across all patterns</div>
        <div style={{ ...instanceNameStyle, color: SHELL.INK }}>{best.row.label}</div>
        <div style={{ ...metaStyle, color: SHELL.MINT_TEXT }}>{bestGroupTitle}</div>
        <div style={{ ...scoreStyle, color: SHELL.MINT_TEXT }}>{best.score}</div>
        <div style={{ height: 6, background: `${SHELL.MINT_TEXT}22`, borderRadius: RADIUS.pill, overflow: 'hidden', marginTop: 4 }}>
          <div
            style={{
              height: '100%',
              width: `${best.score}%`,
              background: SHELL.MINT_TEXT,
              borderRadius: RADIUS.pill,
            }}
          />
        </div>
        <div style={{ ...statRowStyle, color: SHELL.MINT_TEXT }}>
          <span>Gates: {best.row.gatesMet}/{best.row.gatesTotal}</span>
          <span>·</span>
          <span>Contradictions: {best.row.activeContradictions}</span>
        </div>
      </div>

      {/* Worst performer — rust */}
      <div
        style={{
          ...cardBase,
          background: SHELL.RUST_BG,
          border: `1px solid ${COLORS.ink}18`,
          color: SHELL.RUST_TEXT,
        }}
      >
        <div style={{ ...labelStyle, color: SHELL.RUST_TEXT }}>Worst performer across all patterns</div>
        <div style={{ ...instanceNameStyle, color: SHELL.INK }}>{worst.row.label}</div>
        <div style={{ ...metaStyle, color: SHELL.RUST_TEXT }}>{worstGroupTitle}</div>
        <div style={{ ...scoreStyle, color: SHELL.RUST_TEXT }}>{worst.score}</div>
        <div style={{ height: 6, background: `${SHELL.RUST_TEXT}22`, borderRadius: RADIUS.pill, overflow: 'hidden', marginTop: 4 }}>
          <div
            style={{
              height: '100%',
              width: `${worst.score}%`,
              background: SHELL.RUST_TEXT,
              borderRadius: RADIUS.pill,
            }}
          />
        </div>
        <div style={{ ...statRowStyle, color: SHELL.RUST_TEXT }}>
          <span>Gates: {worst.row.gatesMet}/{worst.row.gatesTotal}</span>
          <span>·</span>
          <span>Contradictions: {worst.row.activeContradictions}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
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
        lineHeight: 1.5,
      }}
    >
      No pattern groups with ≥2 instances found — populate the fixture corpus to enable benchmarking.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternBenchmarkPage() {
  const groups = buildBenchmarkGroups();

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
        title="Pattern benchmark"
        subtitle="Within-pattern instance benchmarking — best vs. worst performers within each lifecycle pattern group. Score = gates (60 pts) + contradiction penalty (30 pts) + baseline (10 pts). Groups with ≥2 instances only."
      >
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip groups={groups} />
            <BestWorstCard groups={groups} />
            {groups.map((group) => {
              const table = <BenchmarkTable group={group} />;
              return <div key={group.patternId}>{table}</div>;
            })}
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
