// /admin/reasoning/synthesis-timeline — Chronological timeline of synthesis
// confidence evolution — simulating how confidence scores change as evidence
// is added and contradictions are resolved over time.
//
// Pure server component. Generates 5 "historical" snapshots per instance by
// applying confidence multipliers to the current score, then renders:
//   1. Portfolio trend — avg confidence at each time point (table + arrows)
//   2. Per-instance timeline — top 8 instances, 5-box rows, net-trend chip
//   3. Confidence quartiles — distribution shift from 4 months ago to today
//   4. Inflection events — biggest single-step jump per instance

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Synthesis Timeline · AbarVa Admin',
};

// ─── Snapshot config ──────────────────────────────────────────────────────────

interface SnapshotConfig {
  label: string;
  confidenceMultiplier: number;
  contradictionAdd: number;
}

const SNAPSHOTS: SnapshotConfig[] = [
  { label: '4 months ago', confidenceMultiplier: 0.55, contradictionAdd: 2 },
  { label: '3 months ago', confidenceMultiplier: 0.68, contradictionAdd: 1 },
  { label: '2 months ago', confidenceMultiplier: 0.78, contradictionAdd: 1 },
  { label: '1 month ago',  confidenceMultiplier: 0.88, contradictionAdd: 0 },
  { label: 'Today',        confidenceMultiplier: 1.00, contradictionAdd: 0 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstanceTimeline {
  id: string;
  name: string;
  type: 'source' | 'program';
  currentScore: number;
  scores: number[]; // length === SNAPSHOTS.length
  trend: number;   // Today - 4 months ago
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildTimelineData(): InstanceTimeline[] {
  const timelines: InstanceTimeline[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const { score } = computeSynthesisConfidence(ctx);
    const scores = SNAPSHOTS.map((s) => Math.round(score * s.confidenceMultiplier));
    timelines.push({
      id: inst.id,
      name: inst.name,
      type: 'source',
      currentScore: score,
      scores,
      trend: scores[scores.length - 1] - scores[0],
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const { score } = computeSynthesisConfidence(ctx);
    const scores = SNAPSHOTS.map((s) => Math.round(score * s.confidenceMultiplier));
    timelines.push({
      id: inst.id,
      name: inst.name,
      type: 'program',
      currentScore: score,
      scores,
      trend: scores[scores.length - 1] - scores[0],
    });
  }

  return timelines;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return SHELL.MINT_TEXT;
  if (score >= 40) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

function scoreBg(score: number): string {
  if (score >= 70) return SHELL.MINT_BG;
  if (score >= 40) return SHELL.PAPER_DEEP;
  return SHELL.RUST_BG;
}

const TH: CSSProperties = {
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

const TD: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

// ─── Section 1 — Portfolio trend ──────────────────────────────────────────────

function PortfolioTrend({ timelines }: { timelines: InstanceTimeline[] }) {
  const n = timelines.length;
  if (n === 0) return null;

  const avgBySnapshot = SNAPSHOTS.map((_, si) => {
    const total = timelines.reduce((s, t) => s + t.scores[si], 0);
    return Math.round(total / n);
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
          Portfolio trend
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Average confidence score across {n} instances at each time point
        </div>
      </header>

      {/* Trend row of boxes with arrows */}
      <div
        style={{
          padding: SPACING.lg,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          overflowX: 'auto',
        }}
      >
        {avgBySnapshot.map((avg, si) => (
          <div
            key={SNAPSHOTS[si].label}
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}
          >
            <div
              style={{
                background: scoreBg(avg),
                borderRadius: RADIUS.md,
                padding: `${SPACING.sm} ${SPACING.md}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                minWidth: 90,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 22,
                  fontWeight: 700,
                  color: scoreColor(avg),
                  lineHeight: 1,
                }}
              >
                {avg}%
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}77`,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {SNAPSHOTS[si].label}
              </span>
            </div>
            {si < avgBySnapshot.length - 1 && (
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 18,
                  color: `${COLORS.ink}44`,
                  flexShrink: 0,
                }}
              >
                →
              </span>
            )}
          </div>
        ))}

        {/* Overall portfolio trend chip */}
        {(() => {
          const gain = avgBySnapshot[avgBySnapshot.length - 1] - avgBySnapshot[0];
          const chipColor = gain > 0 ? SHELL.MINT_TEXT : gain < 0 ? SHELL.RUST_TEXT : `${COLORS.ink}88`;
          const chipBg = gain > 0 ? SHELL.MINT_BG : gain < 0 ? SHELL.RUST_BG : `${COLORS.ink}0a`;
          const label = gain > 0 ? `↑ +${gain} pts net` : gain < 0 ? `↓ ${gain} pts net` : '→ stable';
          return (
            <span
              style={{
                marginLeft: SPACING.md,
                background: chipBg,
                color: chipColor,
                borderRadius: RADIUS.pill,
                padding: '4px 14px',
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {label}
            </span>
          );
        })()}
      </div>

      {/* Numeric table */}
      <div style={{ overflowX: 'auto', borderTop: `1px solid ${COLORS.ink}08` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={TH}>Metric</th>
              {SNAPSHOTS.map((s) => (
                <th key={s.label} style={{ ...TH, textAlign: 'center' }}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...TD, fontWeight: 600 }}>Avg confidence</td>
              {avgBySnapshot.map((avg, si) => (
                <td
                  key={SNAPSHOTS[si].label}
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.mono,
                    fontWeight: 700,
                    textAlign: 'center',
                    color: scoreColor(avg),
                  }}
                >
                  {avg}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Section 2 — Per-instance timeline ───────────────────────────────────────

function TrendChip({ trend }: { trend: number }) {
  const positive = trend > 2;
  const negative = trend < -2;
  const color = positive ? SHELL.MINT_TEXT : negative ? SHELL.RUST_TEXT : `${COLORS.ink}88`;
  const bg = positive ? SHELL.MINT_BG : negative ? SHELL.RUST_BG : `${COLORS.ink}0a`;
  const label =
    positive ? `↑ +${trend} pts` : negative ? `↓ ${trend} pts` : '→ stable';

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '3px 12px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function SnapshotBox({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <div
      style={{
        background: scoreBg(score),
        border: `1px solid ${scoreColor(score)}33`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.xs} ${SPACING.sm}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        minWidth: 72,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 15,
          fontWeight: 700,
          color: scoreColor(score),
          lineHeight: 1,
        }}
      >
        {score}%
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          color: `${COLORS.ink}77`,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function InstanceTimelineRow({
  timeline,
  isFastestRiser,
}: {
  timeline: InstanceTimeline;
  isFastestRiser: boolean;
}) {
  const isSource = timeline.type === 'source';

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {timeline.name}
        </span>
        <span
          style={{
            display: 'inline-block',
            background: isSource ? SHELL.PEACH_BG : SHELL.BLUE_BG,
            color: isSource ? SHELL.PEACH_TEXT : SHELL.INK_MID,
            border: `1px solid ${isSource ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
            borderRadius: RADIUS.pill,
            padding: '1px 7px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {isSource ? 'Source' : 'Program'}
        </span>
        {/* Current confidence badge */}
        <span
          style={{
            display: 'inline-block',
            background: scoreBg(timeline.currentScore),
            color: scoreColor(timeline.currentScore),
            borderRadius: RADIUS.pill,
            padding: '1px 9px',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {timeline.currentScore}%
        </span>
        <TrendChip trend={timeline.trend} />
        {isFastestRiser && (
          <span
            title="Fastest riser — biggest improvement in this cohort"
            style={{ fontSize: 16 }}
          >
            🚀
          </span>
        )}
      </div>

      {/* Snapshot boxes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          overflowX: 'auto',
        }}
      >
        {timeline.scores.map((score, si) => (
          <div
            key={SNAPSHOTS[si].label}
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}
          >
            <SnapshotBox score={score} label={SNAPSHOTS[si].label} />
            {si < timeline.scores.length - 1 && (
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: `${COLORS.ink}33`,
                  flexShrink: 0,
                }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PerInstanceTimeline({ timelines }: { timelines: InstanceTimeline[] }) {
  // Top 8 by current confidence, descending
  const top8 = [...timelines]
    .sort((a, b) => b.currentScore - a.currentScore)
    .slice(0, 8);

  // Fastest riser: instance with biggest improvement (trend)
  const fastestRiserId = top8.reduce(
    (best, t) => (t.trend > (timelines.find((x) => x.id === best)?.trend ?? -Infinity) ? t.id : best),
    top8[0]?.id ?? '',
  );

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
          Per-instance timeline
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Top 8 instances by current confidence — 5-snapshot confidence evolution, net trend chip, fastest riser
        </div>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {top8.map((t) => (
          <div key={t.id}>
            <InstanceTimelineRow
              timeline={t}
              isFastestRiser={t.id === fastestRiserId && t.trend > 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 3 — Confidence quartiles ────────────────────────────────────────

interface QuartileBucket {
  label: string;
  color: string;
  bg: string;
  countThen: number;
  countNow: number;
}

function buildQuartiles(timelines: InstanceTimeline[]): QuartileBucket[] {
  const buckets: QuartileBucket[] = [
    { label: '< 40%',   color: SHELL.RUST_TEXT,  bg: SHELL.RUST_BG,  countThen: 0, countNow: 0 },
    { label: '40–60%',  color: SHELL.AMBER_DOT,  bg: SHELL.PAPER_DEEP, countThen: 0, countNow: 0 },
    { label: '60–80%',  color: COLORS.navy,      bg: SHELL.BLUE_BG,  countThen: 0, countNow: 0 },
    { label: '80%+',    color: SHELL.MINT_TEXT,  bg: SHELL.MINT_BG,  countThen: 0, countNow: 0 },
  ];

  function bucket(score: number): number {
    if (score < 40) return 0;
    if (score < 60) return 1;
    if (score < 80) return 2;
    return 3;
  }

  for (const t of timelines) {
    buckets[bucket(t.scores[0])].countThen++;       // 4 months ago
    buckets[bucket(t.scores[t.scores.length - 1])].countNow++; // Today
  }

  return buckets;
}

function QuartileBar({
  count,
  total,
  color,
  bg,
}: {
  count: number;
  total: number;
  color: string;
  bg: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: RADIUS.pill,
          background: `${COLORS.ink}0a`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: RADIUS.pill,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color,
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {count}
      </span>
    </div>
  );
}

function ConfidenceQuartiles({ timelines }: { timelines: InstanceTimeline[] }) {
  const buckets = buildQuartiles(timelines);
  const total = timelines.length;

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
          Confidence quartiles
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Distribution shift from 4 months ago to today — instance counts by confidence band
        </div>
      </header>

      <div style={{ padding: SPACING.lg }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 1fr',
            gap: `${SPACING.sm} ${SPACING.md}`,
            alignItems: 'center',
          }}
        >
          {/* Header row */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}77`,
            }}
          >
            Band
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}77`,
            }}
          >
            4 months ago
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}77`,
            }}
          >
            Today
          </div>

          {buckets.map((b) => (
            <>
              <div
                key={`${b.label}-label`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: b.bg,
                  color: b.color,
                  borderRadius: RADIUS.pill,
                  padding: '3px 10px',
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {b.label}
              </div>
              <div key={`${b.label}-then`} style={{ display: 'flex', alignItems: 'center' }}>
                <QuartileBar count={b.countThen} total={total} color={b.color} bg={b.bg} />
              </div>
              <div key={`${b.label}-now`} style={{ display: 'flex', alignItems: 'center' }}>
                <QuartileBar count={b.countNow} total={total} color={b.color} bg={b.bg} />
              </div>
            </>
          ))}
        </div>

        <div
          style={{
            marginTop: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontStyle: 'italic',
            color: `${COLORS.ink}77`,
          }}
        >
          {total} instances total. Counts show how many fall into each confidence band at the given time point.
        </div>
      </div>
    </section>
  );
}

// ─── Section 4 — Inflection events ───────────────────────────────────────────

interface InflectionEvent {
  instanceId: string;
  instanceName: string;
  gain: number;
  fromPeriod: string;
  toPeriod: string;
  fromScore: number;
  toScore: number;
}

function buildInflectionEvents(timelines: InstanceTimeline[]): InflectionEvent[] {
  return timelines.map((t) => {
    let maxGain = -Infinity;
    let bestFrom = 0;
    let bestTo = 1;
    for (let i = 0; i < t.scores.length - 1; i++) {
      const gain = t.scores[i + 1] - t.scores[i];
      if (gain > maxGain) {
        maxGain = gain;
        bestFrom = i;
        bestTo = i + 1;
      }
    }
    return {
      instanceId: t.id,
      instanceName: t.name,
      gain: maxGain,
      fromPeriod: SNAPSHOTS[bestFrom].label,
      toPeriod: SNAPSHOTS[bestTo].label,
      fromScore: t.scores[bestFrom],
      toScore: t.scores[bestTo],
    };
  });
}

function InflectionEvents({ timelines }: { timelines: InstanceTimeline[] }) {
  const events = buildInflectionEvents(timelines)
    .filter((e) => e.gain > 0)
    .sort((a, b) => b.gain - a.gain);

  if (events.length === 0) {
    return null;
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
          Inflection events
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Largest single-period confidence improvement per instance — ranked by gain
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36 }}>#</th>
              <th style={TH}>Instance</th>
              <th style={TH}>Period</th>
              <th style={{ ...TH, width: 110 }}>From</th>
              <th style={{ ...TH, width: 110 }}>To</th>
              <th style={{ ...TH, width: 110 }}>Gain</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, idx) => (
              <tr key={e.instanceId}>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {idx + 1}
                </td>
                <td style={TD}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {e.instanceName}
                  </span>
                </td>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}99`,
                  }}
                >
                  {e.fromPeriod} → {e.toPeriod}
                </td>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: scoreColor(e.fromScore),
                    fontWeight: 600,
                  }}
                >
                  {e.fromScore}%
                </td>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: scoreColor(e.toScore),
                    fontWeight: 700,
                  }}
                >
                  {e.toScore}%
                </td>
                <td style={TD}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: SHELL.MINT_BG,
                      color: SHELL.MINT_TEXT,
                      borderRadius: RADIUS.pill,
                      padding: '2px 12px',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    +{e.gain} pts
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Largest improvement callout */}
      {events[0] && (
        <div
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            borderTop: `1px solid ${COLORS.ink}08`,
            background: `${SHELL.MINT_BG}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.MINT_TEXT,
            fontStyle: 'italic',
          }}
        >
          Largest improvement:{' '}
          <strong style={{ fontWeight: 700 }}>{events[0].instanceName}</strong> gained{' '}
          <strong>+{events[0].gain} pts</strong> between {events[0].fromPeriod} and{' '}
          {events[0].toPeriod}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SynthesisTimelinePage() {
  const timelines = buildTimelineData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Synthesis Comparison"
          primaryActionHref="/admin/reasoning/synthesis-comparison"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Synthesis"
        title="Synthesis Timeline"
        subtitle="Confidence evolution over time — simulated history of synthesis score changes per instance"
      >
        <PortfolioTrend timelines={timelines} />
        <PerInstanceTimeline timelines={timelines} />
        <ConfidenceQuartiles timelines={timelines} />
        <InflectionEvents timelines={timelines} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
