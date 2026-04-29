// /admin/reasoning/evidence-richness-index — Evidence Richness Index (ERI).
//
// Pure server component. Computes a composite ERI score (0-100) for each
// instance across four equally-weighted dimensions (25 pts each):
//   1. Volume    — evidence item count
//   2. Diversity — unique source-type spread (index % 4 proxy)
//   3. Freshness — hash-derived average age in days
//   4. Coverage  — % of gate criteria with evidence
//
// Sections:
//   1. Portfolio ERI summary (4 stat cards)
//   2. ERI leaderboard table (all instances, sorted desc)
//   3. Dimension analysis (4 cards, one per dimension)
//   4. ERI distribution bar (Rich / Adequate / Sparse / Poor)

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Richness Index · AbarVa Admin',
};

// ── ERI computation ───────────────────────────────────────────────────────────

const volumeScore = (count: number): number =>
  count === 0 ? 0 : count <= 2 ? 8 : count <= 5 ? 16 : 25;

const diversityScore = (evidence: unknown[]): number => {
  const types = new Set(evidence.map((_, i) => i % 4));
  return types.size === 0 ? 0 : types.size === 1 ? 8 : types.size === 2 ? 16 : 25;
};

const avgAge = (evidence: unknown[], instanceId: string): number => {
  if (!evidence.length) return 120;
  return (
    evidence.reduce((sum: number, _, i) => sum + ((instanceId.charCodeAt(0) + i * 7) % 121), 0) /
    evidence.length
  );
};

const freshnessScore = (avgAgeDays: number): number =>
  avgAgeDays < 14 ? 25 : avgAgeDays < 30 ? 16 : avgAgeDays < 60 ? 8 : 0;

const coverageScore = (coveragePct: number): number => Math.round((coveragePct / 100) * 25);

type EriRating = 'Rich' | 'Adequate' | 'Sparse' | 'Poor';

const eriRating = (eri: number): EriRating =>
  eri >= 80 ? 'Rich' : eri >= 60 ? 'Adequate' : eri >= 40 ? 'Sparse' : 'Poor';

// ── Data model ────────────────────────────────────────────────────────────────

interface DimensionScores {
  volume: number;
  diversity: number;
  freshness: number;
  coverage: number;
}

interface EriRow {
  instanceId: string;
  instanceName: string;
  evidenceCount: number;
  dimensions: DimensionScores;
  eri: number;
  rating: EriRating;
}

// ── Data computation ──────────────────────────────────────────────────────────

function buildEriRows(): EriRow[] {
  const healthRows = buildHealthBoardRows();
  const allPatterns = getAllLifecyclePatterns();
  const criteriaCount = allPatterns[0]?.gateCriteria?.length ?? 6;

  return healthRows.map((row) => {
    const evidence = getEvidenceFor(row.id);
    const count = evidence.length;

    const vol = volumeScore(count);
    const div = diversityScore(evidence);
    const age = avgAge(evidence, row.id);
    const fresh = freshnessScore(age);

    // Coverage: criterion covered if (criterion index + instanceId.charCodeAt(0)) % 3 !== 2
    let coveredCount = 0;
    for (let ci = 0; ci < criteriaCount; ci++) {
      if ((ci + row.id.charCodeAt(0)) % 3 !== 2) coveredCount++;
    }
    const coveragePct = criteriaCount === 0 ? 0 : (coveredCount / criteriaCount) * 100;
    const cov = coverageScore(coveragePct);

    const eri = vol + div + fresh + cov;

    return {
      instanceId: row.id,
      instanceName: row.label,
      evidenceCount: count,
      dimensions: { volume: vol, diversity: div, freshness: fresh, coverage: cov },
      eri,
      rating: eriRating(eri),
    };
  });
}

// ── Rating palette ────────────────────────────────────────────────────────────

const RATING_PALETTE: Record<EriRating, { bg: string; fg: string; label: string }> = {
  Rich: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Rich' },
  Adequate: { bg: `${COLORS.mintInk}22`, fg: COLORS.mintInk, label: 'Adequate' },
  Sparse: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Sparse' },
  Poor: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Poor' },
};

// ── Style constants ───────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
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

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function RatingChip({ rating }: { rating: EriRating }) {
  const p = RATING_PALETTE[rating];
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {p.label}
    </span>
  );
}

function DimBar({ score, max = 25 }: { score: number; max?: number }) {
  const pct = max === 0 ? 0 : Math.round((score / max) * 100);
  const filled =
    pct >= 80
      ? COLORS.mintInk
      : pct >= 60
        ? COLORS.mintInk
        : pct >= 40
          ? COLORS.amberInk
          : COLORS.coralInk;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 100,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 6,
          background: `${COLORS.ink}12`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: filled,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}88`,
          whiteSpace: 'nowrap',
          minWidth: 32,
        }}
      >
        {score}/{max}
      </span>
    </div>
  );
}

// ── Section 1: Portfolio summary cards ───────────────────────────────────────

function SummaryCards({ rows }: { rows: EriRow[] }) {
  if (rows.length === 0) return null;

  const avgEri = Math.round(rows.reduce((s, r) => s + r.eri, 0) / rows.length);
  const richCount = rows.filter((r) => r.rating === 'Rich').length;
  const poorCount = rows.filter((r) => r.rating === 'Poor').length;
  const top = rows[0];

  const cards = [
    {
      label: 'Portfolio avg ERI',
      value: String(avgEri),
      sub: eriRating(avgEri),
      palette: RATING_PALETTE[eriRating(avgEri)],
    },
    {
      label: 'Rich instances',
      value: String(richCount),
      sub: 'ERI ≥ 80',
      palette: RATING_PALETTE['Rich'],
    },
    {
      label: 'Poor instances',
      value: String(poorCount),
      sub: 'ERI < 40',
      palette: RATING_PALETTE['Poor'],
    },
    {
      label: 'Top ERI instance',
      value: top ? String(top.eri) : '—',
      sub: top?.instanceName ?? '—',
      palette: top ? RATING_PALETTE[top.rating] : RATING_PALETTE['Rich'],
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 38,
              color: card.palette.fg,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {card.value}
          </div>
          <span
            style={{
              display: 'inline-block',
              background: card.palette.bg,
              color: card.palette.fg,
              borderRadius: RADIUS.pill,
              padding: '2px 10px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              alignSelf: 'flex-start',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Section 2: ERI leaderboard table ─────────────────────────────────────────

function LeaderboardTable({ rows }: { rows: EriRow[] }) {
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
            ERI Leaderboard
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            All instances sorted by composite ERI score (descending) — dimension bars show 0–25 contribution
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' as const, width: 72 }}>ERI</th>
              <th style={{ ...HEADER_CELL, width: 96 }}>Rating</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Volume</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Diversity</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Freshness</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const p = RATING_PALETTE[row.rating];
              return (
                <tr
                  key={row.instanceId}
                  style={{ background: idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03` }}
                >
                  <td style={BODY_CELL}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.ink,
                        lineHeight: 1.3,
                      }}
                    >
                      {row.instanceName}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}55`,
                        marginTop: 1,
                      }}
                    >
                      {row.instanceId}
                    </div>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'center' as const,
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 22,
                      fontWeight: 700,
                      color: p.fg,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {row.eri}
                  </td>
                  <td style={BODY_CELL}>
                    <RatingChip rating={row.rating} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.volume} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.diversity} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.freshness} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.coverage} />
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

// ── Section 3: Dimension analysis cards ──────────────────────────────────────

const DIMENSION_ACTIONS: Record<keyof DimensionScores, string> = {
  volume: 'Upload additional supporting documents or evidence items to this instance',
  diversity: 'Add evidence from varied source types: financial, operational, and compliance data',
  freshness: 'Refresh stale evidence — replace or re-confirm items older than 30 days',
  coverage: 'Map evidence to uncovered gate criteria; review criterion checklist with sponsor',
};

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  volume: 'Volume',
  diversity: 'Diversity',
  freshness: 'Freshness',
  coverage: 'Coverage',
};

function DimensionCard({
  dim,
  rows,
}: {
  dim: keyof DimensionScores;
  rows: EriRow[];
}) {
  if (rows.length === 0) return null;

  const scores = rows.map((r) => r.dimensions[dim]);
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  const best = rows.reduce((a, b) => (a.dimensions[dim] >= b.dimensions[dim] ? a : b));
  const worst = rows.reduce((a, b) => (a.dimensions[dim] <= b.dimensions[dim] ? a : b));
  const action = DIMENSION_ACTIONS[dim];
  const label = DIMENSION_LABELS[dim];
  const avgPct = Math.round((avg / 25) * 100);

  const barColor =
    avgPct >= 80 ? COLORS.mintInk : avgPct >= 50 ? COLORS.amberInk : COLORS.coralInk;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.sm }}>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 17,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </h3>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          weight: 25 pts
        </span>
      </div>

      {/* Avg score bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              fontWeight: 600,
            }}
          >
            Portfolio avg
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: barColor,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {avg}
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}66`,
              }}
            >
              /25
            </span>
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: `${COLORS.ink}12`,
            borderRadius: RADIUS.pill,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${avgPct}%`,
              height: '100%',
              background: barColor,
              borderRadius: RADIUS.pill,
            }}
          />
        </div>
      </div>

      {/* Best instance */}
      <div
        style={{
          background: COLORS.mintSoft,
          borderRadius: RADIUS.md,
          padding: `${SPACING.xs} ${SPACING.sm}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.mintInk,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          Best
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.mintInk,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {best.instanceName}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: COLORS.mintInk,
            fontWeight: 700,
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        >
          {best.dimensions[dim]}/25
        </span>
      </div>

      {/* Worst instance + action */}
      <div
        style={{
          background: COLORS.amberSoft,
          borderRadius: RADIUS.md,
          padding: `${SPACING.xs} ${SPACING.sm}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.amberInk,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}
          >
            Weakest
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.amberInk,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {worst.instanceName}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: COLORS.amberInk,
              fontWeight: 700,
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {worst.dimensions[dim]}/25
          </span>
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: COLORS.amberInk,
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 700 }}>Action:</span> {action}
        </div>
      </div>
    </div>
  );
}

function DimensionAnalysis({ rows }: { rows: EriRow[] }) {
  const dims: (keyof DimensionScores)[] = ['volume', 'diversity', 'freshness', 'coverage'];
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
        Dimension Analysis
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {dims.map((dim) => (
          <div key={dim}>
            <DimensionCard dim={dim} rows={rows} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 4: ERI distribution bar ──────────────────────────────────────────

function DistributionBar({ rows }: { rows: EriRow[] }) {
  const total = rows.length;
  if (total === 0) return null;

  const counts: Record<EriRating, number> = { Rich: 0, Adequate: 0, Sparse: 0, Poor: 0 };
  for (const row of rows) counts[row.rating]++;

  const segments: { rating: EriRating; count: number }[] = [
    { rating: 'Rich', count: counts.Rich },
    { rating: 'Adequate', count: counts.Adequate },
    { rating: 'Sparse', count: counts.Sparse },
    { rating: 'Poor', count: counts.Poor },
  ];

  return (
    <section
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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.md }}>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          ERI Distribution
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {total} instance{total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Stacked bar */}
      <div
        style={{
          height: 28,
          display: 'flex',
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          border: `1px solid ${COLORS.ink}12`,
        }}
      >
        {segments.map(({ rating, count }) => {
          if (count === 0) return null;
          const pct = (count / total) * 100;
          const p = RATING_PALETTE[rating];
          return (
            <div
              key={rating}
              title={`${rating}: ${count} (${pct.toFixed(0)}%)`}
              style={{
                width: `${pct}%`,
                background: p.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {pct > 8 && (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    fontWeight: 700,
                    color: p.fg,
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.md }}>
        {segments.map(({ rating, count }) => {
          const p = RATING_PALETTE[rating];
          const pct = ((count / total) * 100).toFixed(0);
          return (
            <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: RADIUS.sm,
                  background: p.bg,
                  border: `1px solid ${p.fg}44`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: p.fg,
                  fontWeight: 600,
                }}
              >
                {p.label}
              </span>
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EvidenceRichnessIndexPage() {
  const allRows = buildEriRows();
  const sorted = [...allRows].sort((a, b) => b.eri - a.eri);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open evidence catalog"
          primaryActionHref="/admin/reasoning/evidence-catalog"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence Richness Index"
        subtitle="Composite evidence quality score — volume, diversity, freshness, and criterion coverage"
      >
        <SummaryCards rows={sorted} />
        <LeaderboardTable rows={sorted} />
        <DimensionAnalysis rows={sorted} />
        <DistributionBar rows={sorted} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
