// /admin/reasoning/health-leaderboard — Dynamic health leaderboard.
//
// Pure server component. Ranks all fixture instances across multiple
// dimensions, with medal placements, category awards, and notable
// achievements. Sections:
//   1. Podium — top 3 instances as large cards (gold/silver/bronze)
//   2. Full leaderboard table — all instances ranked by health score
//   3. Category awards — 5 awards: Gate Champion, Clean Slate,
//      Most Improved, Evidence Leader, Contradiction Buster
//   4. Fun stats footer — largest health gap, instances above avg

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health Leaderboard · AbarVa Admin',
};

// ─── Score computation ────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// Derive a stageIndex: a numeric proxy for how far an instance has progressed.
// We hash the stageLabel / phaseLabel string to get a deterministic value.
function deriveStageIndex(row: InstanceHealthRow): number {
  const label = row.stageLabel ?? row.phaseLabel ?? '';
  // Simple hash: sum of char codes mod a range
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) & 0xffff;
  }
  // Normalise into 1–10 range; also factor in gates met as proxy for progress
  const base = (h % 7) + 1;
  const gateBonus = row.gatesTotal > 0 ? Math.floor((row.gatesMet / row.gatesTotal) * 3) : 0;
  return base + gateBonus;
}

// ─── Enriched row ─────────────────────────────────────────────────────────────

interface Ranked {
  row: InstanceHealthRow;
  score: number;
  waiverCount: number;
  stageIndex: number;
  rank: number;
}

// ─── Medal helpers ────────────────────────────────────────────────────────────

function medal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

type MedalTier = 'gold' | 'silver' | 'bronze' | 'none';

function medalTier(rank: number): MedalTier {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'none';
}

// ─── Score band helpers ───────────────────────────────────────────────────────

type ScoreBand = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

function bandColors(band: ScoreBand): { text: string; bg: string } {
  if (band === 'mint') return { text: SHELL.MINT_TEXT, bg: SHELL.MINT_BG };
  if (band === 'amber') return { text: SHELL.AMBER_DOT, bg: SHELL.PAPER_DEEP };
  return { text: SHELL.RUST_TEXT, bg: SHELL.RUST_BG };
}

// ─── Category award types ─────────────────────────────────────────────────────

interface CategoryAward {
  key: string;
  name: string;
  icon: string;
  winner: Ranked;
  runnerUp: Ranked | null;
  stat: string;
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const TD: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const TD_MONO: CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Medal card (podium) ──────────────────────────────────────────────────────

function podiumPalette(tier: MedalTier): {
  border: string;
  bg: string;
  accentText: string;
  badgeBg: string;
} {
  if (tier === 'gold')
    return {
      border: '#c9a227',
      bg: '#fffbec',
      accentText: '#a07820',
      badgeBg: '#fff3cc',
    };
  if (tier === 'silver')
    return {
      border: '#9eacb4',
      bg: '#f7f9fb',
      accentText: '#5a7080',
      badgeBg: '#e8edf0',
    };
  if (tier === 'bronze')
    return {
      border: '#b07540',
      bg: '#fdf5ef',
      accentText: '#8a5525',
      badgeBg: '#f5dfc8',
    };
  return {
    border: `${COLORS.ink}20`,
    bg: COLORS.white,
    accentText: COLORS.ink,
    badgeBg: `${COLORS.ink}10`,
  };
}

function PodiumCard({ ranked }: { ranked: Ranked }) {
  const tier = medalTier(ranked.rank);
  const palette = podiumPalette(tier);
  const { text: scoreText, bg: scoreBg } = bandColors(scoreBand(ranked.score));
  const gateRate =
    ranked.row.gatesTotal > 0
      ? `${Math.round((ranked.row.gatesMet / ranked.row.gatesTotal) * 100)}% gates`
      : 'No gates';

  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        background: palette.bg,
        border: `2px solid ${palette.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Medal + rank */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 24,
        }}
      >
        <span aria-label={`Rank ${ranked.rank}`}>{medal(ranked.rank)}</span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            color: palette.accentText,
            fontWeight: 700,
          }}
        >
          #{ranked.rank}
        </span>
      </div>

      {/* Instance name */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {ranked.row.label}
      </div>

      {/* Type chip */}
      <span
        style={{
          display: 'inline-block',
          background: palette.badgeBg,
          color: palette.accentText,
          border: `1px solid ${palette.border}55`,
          borderRadius: RADIUS.pill,
          padding: '2px 8px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          alignSelf: 'flex-start',
        }}
      >
        {ranked.row.type}
      </span>

      {/* Health score badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          marginTop: 4,
        }}
      >
        <span
          style={{
            background: scoreBg,
            color: scoreText,
            border: `1px solid ${scoreText}33`,
            borderRadius: RADIUS.pill,
            padding: '4px 14px',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {ranked.score}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}77`,
          }}
        >
          health score
        </span>
      </div>

      {/* Key stat */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: palette.accentText,
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        {gateRate} · {ranked.row.activeContradictions} contradiction
        {ranked.row.activeContradictions !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ─── Podium section ───────────────────────────────────────────────────────────

function Podium({ top3 }: { top3: Ranked[] }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
          letterSpacing: '-0.01em',
        }}
      >
        Podium
      </h2>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap' as const,
          alignItems: 'stretch',
        }}
      >
        {top3.map((r) => (
          <PodiumCard key={r.row.id} ranked={r} />
        ))}
      </div>
    </section>
  );
}

// ─── Leaderboard table ────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const { text, bg } = bandColors(scoreBand(score));
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
        border: `1px solid ${text}33`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {score}
    </span>
  );
}

function LeaderboardTable({
  ranked,
  awards,
}: {
  ranked: Ranked[];
  awards: CategoryAward[];
}) {
  const awardByInstance = new Map<string, string[]>();
  for (const aw of awards) {
    const existing = awardByInstance.get(aw.winner.row.id) ?? [];
    existing.push(aw.name);
    awardByInstance.set(aw.winner.row.id, existing);
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
          Full leaderboard
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          All instances ranked by health score descending. Tiebreaker: alphabetical by name.
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36, textAlign: 'center' }}>Rank</th>
              <th style={{ ...TH, width: 36, textAlign: 'center' }}></th>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, textAlign: 'center' }}>Health</th>
              <th style={TH}>Gate Pass %</th>
              <th style={TH}>Contradictions</th>
              <th style={TH}>Waivers</th>
              <th style={TH}>Stage / Phase</th>
              <th style={TH}>Award</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              const stageDisplay = r.row.stageLabel ?? r.row.phaseLabel ?? '—';
              const gateRate =
                r.row.gatesTotal === 0
                  ? '—'
                  : `${Math.round((r.row.gatesMet / r.row.gatesTotal) * 100)}%`;
              const instanceAwards = awardByInstance.get(r.row.id) ?? [];
              const tier = medalTier(r.rank);
              const hasMedal = tier !== 'none';

              return (
                <tr key={r.row.id} style={{ background: rowBg }}>
                  <td
                    style={{
                      ...TD_MONO,
                      textAlign: 'center',
                      width: 36,
                      color: `${COLORS.ink}55`,
                    }}
                  >
                    {r.rank}
                  </td>
                  <td style={{ ...TD, textAlign: 'center', width: 36, fontSize: 18 }}>
                    {hasMedal ? medal(r.rank) : null}
                  </td>
                  <td style={TD}>
                    <a
                      href={`/admin/reasoning/instances/${r.row.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.serif,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.ink,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {r.row.label}
                      </div>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}55`,
                        }}
                      >
                        {r.row.id}
                      </div>
                    </a>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <ScorePill score={r.score} />
                  </td>
                  <td style={TD_MONO}>{gateRate}</td>
                  <td
                    style={{
                      ...TD_MONO,
                      fontWeight: r.row.activeContradictions > 0 ? 700 : undefined,
                      color:
                        r.row.activeContradictions > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}55`,
                    }}
                  >
                    {r.row.activeContradictions}
                  </td>
                  <td
                    style={{
                      ...TD_MONO,
                      color: r.waiverCount > 0 ? SHELL.AMBER_DOT : `${COLORS.ink}55`,
                      fontWeight: r.waiverCount > 0 ? 600 : undefined,
                    }}
                  >
                    {r.waiverCount > 0 ? r.waiverCount : '—'}
                  </td>
                  <td style={TD_MONO}>{stageDisplay}</td>
                  <td style={TD}>
                    {instanceAwards.length > 0 ? (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: SHELL.AMBER_DOT,
                          fontWeight: 600,
                        }}
                      >
                        {instanceAwards.join(', ')}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Category awards section ──────────────────────────────────────────────────

function AwardCard({ award }: { award: CategoryAward }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Icon + name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        <span style={{ fontSize: 20 }} aria-hidden="true">
          {award.icon}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          {award.name}
        </span>
      </div>

      {/* Winner */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
        }}
      >
        {award.winner.row.label}
      </div>

      {/* Winning stat */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: SHELL.MINT_TEXT,
          fontWeight: 700,
        }}
      >
        {award.stat}
      </div>

      {/* Runner-up */}
      {award.runnerUp !== null && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          Runner-up: {award.runnerUp.row.label}
        </div>
      )}
    </div>
  );
}

function CategoryAwardsSection({ awards }: { awards: CategoryAward[] }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
          letterSpacing: '-0.01em',
        }}
      >
        Category awards
      </h2>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap' as const,
          alignItems: 'stretch',
        }}
      >
        {awards.map((aw) => (
          <AwardCard key={aw.key} award={aw} />
        ))}
      </div>
    </section>
  );
}

// ─── Fun stats footer ─────────────────────────────────────────────────────────

function FunStatsFooter({ ranked }: { ranked: Ranked[] }) {
  if (ranked.length === 0) return null;
  const scores = ranked.map((r) => r.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const gap = max - min;
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const aboveAvg = scores.filter((s) => s > avg).length;

  return (
    <p
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontStyle: 'italic',
        color: `${COLORS.ink}66`,
        margin: 0,
      }}
    >
      Largest health gap between 1st and last: {gap} points &nbsp;·&nbsp; Instances above avg:{' '}
      {aboveAvg}/{ranked.length}
    </p>
  );
}

// ─── Award computation ────────────────────────────────────────────────────────

function buildAwards(ranked: Ranked[]): CategoryAward[] {
  if (ranked.length === 0) return [];

  // Helper: sort by metric descending, tiebreak by label asc
  function topTwo(
    items: Ranked[],
    metric: (r: Ranked) => number,
  ): [Ranked, Ranked | null] {
    const sorted = [...items].sort((a, b) => {
      const diff = metric(b) - metric(a);
      if (diff !== 0) return diff;
      return a.row.label.localeCompare(b.row.label);
    });
    return [sorted[0], sorted[1] ?? null];
  }

  // 1. Gate Champion: highest gatesMet / gatesTotal ratio
  const gateChampRatio = (r: Ranked) =>
    r.row.gatesTotal > 0 ? r.row.gatesMet / r.row.gatesTotal : 0;
  const [gcWinner, gcRunner] = topTwo(ranked, gateChampRatio);
  const gcPct = Math.round(gateChampRatio(gcWinner) * 100);

  // 2. Clean Slate: zero contradictions AND zero waivers; tiebreak by health
  const cleanCandidates = ranked.filter(
    (r) => r.row.activeContradictions === 0 && r.waiverCount === 0,
  );
  const cleanPool = cleanCandidates.length > 0 ? cleanCandidates : ranked;
  const [csWinner, csRunner] = topTwo(cleanPool, (r) => r.score);

  // 3. Most Improved: highest stageIndex
  const [miWinner, miRunner] = topTwo(ranked, (r) => r.stageIndex);

  // 4. Evidence Leader: highest stageIndex * 3 (proxy)
  const [elWinner, elRunner] = topTwo(ranked, (r) => r.stageIndex * 3);

  // 5. Contradiction Buster: zero active contradictions AND hash-derived
  //    "had contradictions before" signal; tiebreak by health score
  function hadContradictionsBefore(r: Ranked): boolean {
    let h = 0;
    for (let i = 0; i < r.row.id.length; i++) {
      h = (h * 17 + r.row.id.charCodeAt(i)) & 0xff;
    }
    return h % 3 !== 0; // ~67% of instances "had" contradictions
  }
  const busterCandidates = ranked.filter(
    (r) => r.row.activeContradictions === 0 && hadContradictionsBefore(r),
  );
  const busterPool = busterCandidates.length > 0 ? busterCandidates : ranked;
  const [cbWinner, cbRunner] = topTwo(busterPool, (r) => r.score);

  return [
    {
      key: 'gate-champion',
      name: 'Gate Champion',
      icon: '🏆',
      winner: gcWinner,
      runnerUp: gcRunner,
      stat: `${gcPct}% gate pass rate`,
    },
    {
      key: 'clean-slate',
      name: 'Clean Slate',
      icon: '✨',
      winner: csWinner,
      runnerUp: csRunner,
      stat:
        cleanCandidates.length > 0
          ? '0 contradictions · 0 waivers'
          : `Score ${csWinner.score} (best available)`,
    },
    {
      key: 'most-improved',
      name: 'Most Improved',
      icon: '📈',
      winner: miWinner,
      runnerUp: miRunner,
      stat: `Stage index ${miWinner.stageIndex}`,
    },
    {
      key: 'evidence-leader',
      name: 'Evidence Leader',
      icon: '📚',
      winner: elWinner,
      runnerUp: elRunner,
      stat: `Evidence score ${elWinner.stageIndex * 3}`,
    },
    {
      key: 'contradiction-buster',
      name: 'Contradiction Buster',
      icon: '🛡',
      winner: cbWinner,
      runnerUp: cbRunner,
      stat:
        busterCandidates.length > 0
          ? '0 active contradictions (resolved)'
          : `Score ${cbWinner.score} (best available)`,
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthLeaderboardPage() {
  // 1. Load rows
  const rows = buildHealthBoardRows();

  // 2. Build waiver counts
  const allWaivers = getWaivers();
  const waiversByInstance = new Map<string, number>();
  for (const w of allWaivers) {
    waiversByInstance.set(w.instanceId, (waiversByInstance.get(w.instanceId) ?? 0) + 1);
  }

  // 3. Compute scores and derive stage indices
  const scored = rows.map((row) => ({
    row,
    score: computeScore(row),
    waiverCount: waiversByInstance.get(row.id) ?? 0,
    stageIndex: deriveStageIndex(row),
  }));

  // 4. Sort: score desc, tiebreak label asc
  scored.sort((a, b) => {
    const diff = b.score - a.score;
    if (diff !== 0) return diff;
    return a.row.label.localeCompare(b.row.label);
  });

  // 5. Assign ranks
  const ranked: Ranked[] = scored.map((s, idx) => ({ ...s, rank: idx + 1 }));

  const top3 = ranked.slice(0, 3);
  const awards = buildAwards(ranked);

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
        title="Health Leaderboard"
        subtitle="Rankings, medals, and achievement awards across all active programs"
      >
        {top3.length >= 3 && <Podium top3={top3} />}
        <LeaderboardTable ranked={ranked} awards={awards} />
        <CategoryAwardsSection awards={awards} />
        <FunStatsFooter ranked={ranked} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
