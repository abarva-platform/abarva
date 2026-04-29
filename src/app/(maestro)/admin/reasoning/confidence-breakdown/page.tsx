// /admin/reasoning/confidence-breakdown — Synthesis confidence scores for all
// instances with a factor-level breakdown of what drives confidence up or down.
//
// Pure server component — no client JS needed. Builds SynthesisContext for
// every source-event and program instance, runs computeSynthesisConfidence,
// then ranks results ascending (least confident first).
//
// Sections:
//   SummaryStrip  — N instances · Avg confidence: X% · X high / Y medium / Z low
//   ConfidenceTable — Rank | Instance | Score bar | Score% | Drag-down | Boost
//   FactorBreakdown — expanded factor list for the bottom-3 instances

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import type { ConfidenceGrade } from '@/lib/reasoning/synthesis-confidence';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Confidence breakdown | AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface InstanceConfidence {
  instanceId: string;
  instanceName: string;
  instanceType: 'source-event' | 'program';
  score: number;
  grade: ConfidenceGrade;
  factors: string[];
}

// ─── Score-band helpers ───────────────────────────────────────────────────────

type ScoreBand = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

interface BandPalette {
  bar: string;
  text: string;
  barBg: string;
  pillBg: string;
  pillText: string;
}

function bandPalette(band: ScoreBand): BandPalette {
  if (band === 'mint') {
    return {
      bar: SHELL.MINT_TEXT,
      text: SHELL.MINT_TEXT,
      barBg: SHELL.MINT_BG,
      pillBg: SHELL.MINT_BG,
      pillText: SHELL.MINT_TEXT,
    };
  }
  if (band === 'amber') {
    return {
      bar: SHELL.AMBER_DOT,
      text: SHELL.AMBER_DOT,
      barBg: SHELL.PAPER_DEEP,
      pillBg: SHELL.PAPER_DEEP,
      pillText: SHELL.AMBER_DOT,
    };
  }
  return {
    bar: SHELL.RUST_TEXT,
    text: SHELL.RUST_TEXT,
    barBg: SHELL.RUST_BG,
    pillBg: SHELL.RUST_BG,
    pillText: SHELL.RUST_TEXT,
  };
}

// ─── Factor classification helpers ───────────────────────────────────────────
//
// computeSynthesisConfidence returns factors as plain strings. We classify each
// factor by inspecting the text for penalty markers ("(−") vs bonus markers
// ("(+"). Neutral factors have neither.

type FactorSentiment = 'negative' | 'positive' | 'neutral';

function factorSentiment(factor: string): FactorSentiment {
  if (factor.includes('(−') || factor.includes('(-')) return 'negative';
  if (factor.includes('(+')) return 'positive';
  return 'neutral';
}

function topDragDown(factors: string[]): string {
  return factors.find((f) => factorSentiment(f) === 'negative') ?? '—';
}

function topBoost(factors: string[]): string {
  return factors.find((f) => factorSentiment(f) === 'positive') ?? '—';
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildAllInstanceConfidences(): InstanceConfidence[] {
  const results: InstanceConfidence[] = [];

  // Source-event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const { score, grade, factors } = computeSynthesisConfidence(ctx);
    results.push({
      instanceId: inst.id,
      instanceName: inst.name,
      instanceType: 'source-event',
      score,
      grade,
      factors,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const { score, grade, factors } = computeSynthesisConfidence(ctx);
    results.push({
      instanceId: inst.id,
      instanceName: inst.name,
      instanceType: 'program',
      score,
      grade,
      factors,
    });
  }

  // Sort ascending — least confident first
  results.sort((a, b) => a.score - b.score);
  return results;
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
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

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ instances }: { instances: InstanceConfidence[] }) {
  const n = instances.length;
  const avg =
    n === 0 ? 0 : Math.round(instances.reduce((s, i) => s + i.score, 0) / n);
  const high = instances.filter((i) => i.grade === 'high').length;
  const medium = instances.filter((i) => i.grade === 'medium').length;
  const low = instances.filter((i) => i.grade === 'low').length;
  const avgBand = scoreBand(avg);
  const avgPalette = bandPalette(avgBand);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${SPACING.sm} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {n} instance{n === 1 ? '' : 's'}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>
        Avg confidence:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color: avgPalette.text,
          }}
        >
          {avg}%
        </span>
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACING.sm,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
        }}
      >
        <span style={{ color: SHELL.MINT_TEXT }}>{high} high</span>
        <span style={{ color: `${COLORS.ink}44` }}>/</span>
        <span style={{ color: SHELL.AMBER_DOT }}>{medium} medium</span>
        <span style={{ color: `${COLORS.ink}44` }}>/</span>
        <span style={{ color: SHELL.RUST_TEXT }}>{low} low</span>
      </span>
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const band = scoreBand(score);
  const p = bandPalette(band);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
      <div
        aria-hidden="true"
        style={{
          flex: 1,
          height: 6,
          borderRadius: RADIUS.pill,
          background: p.barBg,
          overflow: 'hidden',
          minWidth: 60,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: p.bar,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: p.text,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {score}%
      </span>
    </div>
  );
}

// ─── GradePill ────────────────────────────────────────────────────────────────

function GradePill({ grade }: { grade: ConfidenceGrade }) {
  const band = grade === 'high' ? 'mint' : grade === 'medium' ? 'amber' : 'rust';
  const p = bandPalette(band);
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.pillBg,
        color: p.pillText,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      {grade}
    </span>
  );
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: InstanceConfidence['instanceType'] }) {
  const isSource = type === 'source-event';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? SHELL.PEACH_BG : SHELL.BLUE_BG,
        color: isSource ? SHELL.PEACH_TEXT : SHELL.INK_MID,
        border: `1px solid ${isSource ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {isSource ? 'Source' : 'Program'}
    </span>
  );
}

// ─── FactorChip ───────────────────────────────────────────────────────────────

function FactorChip({ factor }: { factor: string }) {
  const sentiment = factorSentiment(factor);
  const bg =
    sentiment === 'negative'
      ? SHELL.RUST_BG
      : sentiment === 'positive'
        ? SHELL.MINT_BG
        : SHELL.GRAY_BG;
  const fg =
    sentiment === 'negative'
      ? SHELL.RUST_TEXT
      : sentiment === 'positive'
        ? SHELL.MINT_TEXT
        : SHELL.GRAY_TEXT;

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.sm,
        padding: '3px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        lineHeight: 1.5,
      }}
    >
      {factor}
    </span>
  );
}

// ─── ConfidenceTable ──────────────────────────────────────────────────────────

function ConfidenceTable({ instances }: { instances: InstanceConfidence[] }) {
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
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          All instances — ranked by confidence
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          least confident first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}
        >
          <thead>
            <tr>
              <th style={{ ...TH, width: 36 }}>#</th>
              <th style={TH}>Instance</th>
              <th style={TH}>Type</th>
              <th style={{ ...TH, minWidth: 180 }}>Score</th>
              <th style={TH}>Grade</th>
              <th style={{ ...TH, maxWidth: 260 }}>Top drag-down</th>
              <th style={{ ...TH, maxWidth: 260 }}>Top boost</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((inst, idx) => (
              <tr key={inst.instanceId}>
                <td style={{ ...TD_MONO, color: `${COLORS.ink}66` }}>
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
                    {inst.instanceName}
                  </span>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}77`,
                      marginTop: 2,
                    }}
                  >
                    {inst.instanceId}
                  </div>
                </td>
                <td style={TD}>
                  <TypeBadge type={inst.instanceType} />
                </td>
                <td style={TD}>
                  <ScoreBar score={inst.score} />
                </td>
                <td style={TD}>
                  <GradePill grade={inst.grade} />
                </td>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: SHELL.RUST_TEXT,
                    maxWidth: 260,
                  }}
                >
                  {topDragDown(inst.factors)}
                </td>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: SHELL.MINT_TEXT,
                    maxWidth: 260,
                  }}
                >
                  {topBoost(inst.factors)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── FactorBreakdown ──────────────────────────────────────────────────────────

function InstanceFactorCard({ inst, rank }: { inst: InstanceConfidence; rank: number }) {
  const band = scoreBand(inst.score);
  const p = bandPalette(band);
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
          background: p.barBg + '66',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              minWidth: 20,
            }}
          >
            #{rank}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {inst.instanceName}
          </span>
          <TypeBadge type={inst.instanceType} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <GradePill grade={inst.grade} />
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 14,
              fontWeight: 700,
              color: p.text,
            }}
          >
            {inst.score}%
          </span>
        </div>
      </div>
      {/* Factors */}
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.xs,
        }}
      >
        {inst.factors.length === 0 ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            No confidence factors recorded.
          </span>
        ) : (
          inst.factors.map((factor, fi) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={fi} style={{ display: 'contents' }}>
              <FactorChip factor={factor} />
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function FactorBreakdown({ instances }: { instances: InstanceConfidence[] }) {
  // Bottom-3 (worst confidence) — already sorted ascending so take first 3
  const bottom3 = instances.slice(0, 3);
  if (bottom3.length === 0) return null;

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
          Factor breakdown — bottom 3 instances
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Expanded confidence factor list for the least-confident instances.{' '}
          <span style={{ color: SHELL.RUST_TEXT }}>Rust = drag-down</span>
          {' · '}
          <span style={{ color: SHELL.MINT_TEXT }}>mint = boost</span>
          {' · '}
          <span style={{ color: SHELL.GRAY_TEXT }}>gray = neutral</span>
        </div>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
          padding: SPACING.md,
        }}
      >
        {bottom3.map((inst, idx) => (
          <div key={inst.instanceId}>
            <InstanceFactorCard inst={inst} rank={idx + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfidenceBreakdownPage() {
  const instances = buildAllInstanceConfidences();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Synthesis preview"
          primaryActionHref="/admin/reasoning/synthesis-preview"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Confidence"
        title="Confidence breakdown"
        subtitle="Synthesis confidence scores for all instances, ranked least-confident first, with a factor-level breakdown of what drives each score up or down."
      >
        <SummaryStrip instances={instances} />
        <ConfidenceTable instances={instances} />
        <FactorBreakdown instances={instances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
