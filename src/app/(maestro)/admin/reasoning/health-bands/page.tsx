// /admin/reasoning/health-bands — Health score band distribution.
//
// Pure server component, force-dynamic.
//
// Assigns each fixture instance a 0-100 composite health score (same formula
// as the scorecard), buckets instances into six bands, then renders:
//
//   SummaryStrip      — N instances · Modal band: X (K) · Avg score: Y
//   BandDistribution  — horizontal stacked bar, proportional width, colour-coded
//   BandDetailTable   — Band | Count | % of total | Avg gates% | Avg contradictions
//                       | Most common pattern | Most common stage
//   BandCards         — one card per band listing instance name + score chips

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  buildHealthBoardRows,
  type InstanceHealthRow,
} from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health bands · AbarVa Admin',
};

// ─── Band definitions ─────────────────────────────────────────────────────────

type BandName = 'Excellent' | 'Good' | 'Fair' | 'Warning' | 'Poor' | 'Critical';

interface BandDef {
  name: BandName;
  min: number;
  max: number;
  /** Solid bar fill */
  color: string;
  /** Pill background */
  bg: string;
  /** Pill / text foreground */
  fg: string;
}

const BANDS: ReadonlyArray<BandDef> = [
  { name: 'Excellent', min: 85, max: 100, color: '#2a5a3a',  bg: SHELL.MINT_BG,   fg: SHELL.MINT_TEXT },
  { name: 'Good',      min: 70, max: 84,  color: '#3d8a54',  bg: '#c6e4c2',        fg: '#1e4a2c'       },
  { name: 'Fair',      min: 55, max: 69,  color: '#d49b3a',  bg: COLORS.amberSoft, fg: '#7A4F01'       },
  { name: 'Warning',   min: 40, max: 54,  color: '#c07c20',  bg: '#ffe0a0',        fg: '#7a4500'       },
  { name: 'Poor',      min: 25, max: 39,  color: '#a06d28',  bg: SHELL.PEACH_BG,  fg: SHELL.PEACH_TEXT},
  { name: 'Critical',  min: 10, max: 24,  color: '#8a3e22',  bg: SHELL.RUST_BG,   fg: SHELL.RUST_TEXT },
];

function getBand(score: number): BandDef {
  for (const band of BANDS) {
    if (score >= band.min && score <= band.max) return band;
  }
  // Score below 10 or above 100 — snap to Critical or Excellent
  if (score < 10) return BANDS[BANDS.length - 1];
  return BANDS[0];
}

// ─── Composite score (same formula as scorecard) ──────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

// ─── PatternId lookup ─────────────────────────────────────────────────────────

/** Build id → patternId map from the raw fixture arrays. */
function buildPatternMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    m.set(inst.id, inst.patternId);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    m.set(inst.id, inst.patternId);
  }
  return m;
}

// ─── Per-band aggregate ───────────────────────────────────────────────────────

interface ScoredRow {
  row: InstanceHealthRow;
  score: number;
  patternId: string;
  stage: string;
}

interface BandAggregate {
  band: BandDef;
  instances: ScoredRow[];
  count: number;
  pctOfTotal: number;
  avgGatesPct: number;
  avgContradictions: number;
  mostCommonPattern: string;
  mostCommonStage: string;
}

function mode<T>(items: T[]): T | '—' {
  if (items.length === 0) return '—';
  const freq = new Map<string, number>();
  for (const item of items) {
    const key = String(item);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [key, count] of freq) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best as unknown as T;
}

function buildAggregates(): { aggregates: BandAggregate[]; totalInstances: number; avgScore: number } {
  const rows = buildHealthBoardRows();
  const patternMap = buildPatternMap();

  const scored: ScoredRow[] = rows.map((row) => ({
    row,
    score: computeScore(row),
    patternId: patternMap.get(row.id) ?? '—',
    stage: row.stageLabel ?? row.phaseLabel ?? '—',
  }));

  const totalInstances = scored.length;
  const avgScore =
    totalInstances === 0
      ? 0
      : Math.round(scored.reduce((s, r) => s + r.score, 0) / totalInstances);

  const aggregates: BandAggregate[] = BANDS.map((band) => {
    const members = scored.filter((r) => r.score >= band.min && r.score <= band.max);
    const count = members.length;

    const avgGatesPct =
      count === 0
        ? 0
        : Math.round(
            (members.reduce(
              (s, r) => s + r.row.gatesMet / Math.max(r.row.gatesTotal, 1),
              0,
            ) /
              count) *
              100,
          );

    const avgContradictions =
      count === 0
        ? 0
        : parseFloat(
            (members.reduce((s, r) => s + r.row.activeContradictions, 0) / count).toFixed(1),
          );

    const mostCommonPattern = mode(members.map((r) => r.patternId)) as string;
    const mostCommonStage = mode(members.map((r) => r.stage)) as string;

    return {
      band,
      instances: members,
      count,
      pctOfTotal: totalInstances === 0 ? 0 : Math.round((count / totalInstances) * 100),
      avgGatesPct,
      avgContradictions,
      mostCommonPattern,
      mostCommonStage,
    };
  });

  // Modal band = band with highest count
  return { aggregates, totalInstances, avgScore };
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

function SummaryStrip({
  totalInstances,
  avgScore,
  aggregates,
}: {
  totalInstances: number;
  avgScore: number;
  aggregates: BandAggregate[];
}) {
  const modalBand = aggregates.reduce(
    (best, a) => (a.count > best.count ? a : best),
    aggregates[0],
  );

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: SPACING.md,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {totalInstances} instance{totalInstances === 1 ? '' : 's'}
      </span>
      <span style={{ color: `${COLORS.ink}55` }}>·</span>
      <span>
        Modal band:{' '}
        <span
          style={{
            display: 'inline-block',
            background: modalBand.band.bg,
            color: modalBand.band.fg,
            borderRadius: RADIUS.pill,
            padding: '1px 10px',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {modalBand.band.name}
        </span>{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: `${COLORS.ink}99` }}>
          ({modalBand.count} instance{modalBand.count === 1 ? '' : 's'})
        </span>
      </span>
      <span style={{ color: `${COLORS.ink}55` }}>·</span>
      <span>
        Avg score:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            fontWeight: 700,
            color: getBand(avgScore).fg,
          }}
        >
          {avgScore}
        </span>
      </span>
    </div>
  );
}

// ─── BandDistribution ─────────────────────────────────────────────────────────

function BandDistribution({
  aggregates,
  totalInstances,
}: {
  aggregates: BandAggregate[];
  totalInstances: number;
}) {
  const nonEmpty = aggregates.filter((a) => a.count > 0);
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md} 0`,
          letterSpacing: '-0.01em',
        }}
      >
        Band distribution
      </h2>

      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 32,
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          border: `1px solid ${COLORS.ink}14`,
        }}
      >
        {aggregates.map((a) => {
          if (a.count === 0 || totalInstances === 0) return null;
          const widthPct = (a.count / totalInstances) * 100;
          return (
            <div
              key={a.band.name}
              title={`${a.band.name}: ${a.count} (${a.pctOfTotal}%)`}
              style={{
                width: `${widthPct}%`,
                background: a.band.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {widthPct > 8 ? (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.04em',
                  }}
                >
                  {a.count}
                </span>
              ) : null}
            </div>
          );
        })}
        {totalInstances === 0 && (
          <div
            style={{
              width: '100%',
              background: SHELL.GRAY_BG,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: SHELL.GRAY_TEXT,
              }}
            >
              No data
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
          marginTop: SPACING.sm,
        }}
      >
        {nonEmpty.map((a) => (
          <div
            key={a.band.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}99`,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: a.band.color,
                flexShrink: 0,
              }}
            />
            <span>
              {a.band.name} ({a.band.min}–{a.band.max})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── BandDetailTable ──────────────────────────────────────────────────────────

function BandDetailTable({ aggregates }: { aggregates: BandAggregate[] }) {
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
          Band detail
        </h2>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={TH}>Band</th>
              <th style={{ ...TH, textAlign: 'right' }}>Count</th>
              <th style={{ ...TH, textAlign: 'right' }}>% of total</th>
              <th style={{ ...TH, textAlign: 'right' }}>Avg gates %</th>
              <th style={{ ...TH, textAlign: 'right' }}>Avg contradictions</th>
              <th style={TH}>Most common pattern</th>
              <th style={TH}>Most common stage</th>
            </tr>
          </thead>
          <tbody>
            {aggregates.map((a) => (
              <tr key={a.band.name}>
                <td style={TD}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: a.band.bg,
                      color: a.band.fg,
                      borderRadius: RADIUS.pill,
                      padding: '3px 12px',
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.band.name}
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                      marginLeft: 8,
                    }}
                  >
                    {a.band.min}–{a.band.max}
                  </span>
                </td>
                <td style={{ ...TD_MONO, textAlign: 'right' }}>
                  {a.count === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    a.count
                  )}
                </td>
                <td style={{ ...TD_MONO, textAlign: 'right' }}>
                  {a.count === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    `${a.pctOfTotal}%`
                  )}
                </td>
                <td style={{ ...TD_MONO, textAlign: 'right' }}>
                  {a.count === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    `${a.avgGatesPct}%`
                  )}
                </td>
                <td style={{ ...TD_MONO, textAlign: 'right' }}>
                  {a.count === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    a.avgContradictions
                  )}
                </td>
                <td style={TD_MONO}>
                  {a.count === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    a.mostCommonPattern
                  )}
                </td>
                <td style={TD_MONO}>
                  {a.count === 0 ? (
                    <span style={{ color: `${COLORS.ink}44` }}>—</span>
                  ) : (
                    a.mostCommonStage
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── BandCards ────────────────────────────────────────────────────────────────

function InstanceChip({ name, score, band }: { name: string; score: number; band: BandDef }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: band.bg,
        border: `1px solid ${band.color}44`,
        borderRadius: RADIUS.pill,
        padding: '4px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        color: band.fg,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 600 }}>{name}</span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          opacity: 0.8,
        }}
      >
        {score}
      </span>
    </div>
  );
}

function BandCard({ aggregate }: { aggregate: BandAggregate }) {
  const { band, instances } = aggregate;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderBottom: `1px solid ${COLORS.ink}08`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          background: band.bg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              fontWeight: 700,
              color: band.fg,
              letterSpacing: '-0.01em',
            }}
          >
            {band.name}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: band.fg,
              opacity: 0.7,
            }}
          >
            {band.min}–{band.max}
          </span>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            fontWeight: 700,
            color: band.fg,
            opacity: 0.8,
          }}
        >
          {instances.length} instance{instances.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.xs,
          minHeight: 56,
        }}
      >
        {instances.length === 0 ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}55`,
              fontStyle: 'italic',
            }}
          >
            No instances in this band
          </span>
        ) : (
          instances
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((r) => {
              const chip = <InstanceChip name={r.row.label} score={r.score} band={band} />;
              return <div key={r.row.id} style={{ display: 'contents' }}>{chip}</div>;
            })
        )}
      </div>
    </div>
  );
}

function BandCards({ aggregates }: { aggregates: BandAggregate[] }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md} 0`,
          letterSpacing: '-0.01em',
        }}
      >
        Instances by band
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {aggregates.map((a) => {
          const card = <BandCard aggregate={a} />;
          return <div key={a.band.name}>{card}</div>;
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthBandsPage() {
  const { aggregates, totalInstances, avgScore } = buildAggregates();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Health"
        title="Health bands"
        subtitle="Distribution of all fixture instances across six composite health score bands. Each band shows instance counts, gate coverage, contradiction rates, and the most common pattern and stage within the band."
      >
        <SummaryStrip
          totalInstances={totalInstances}
          avgScore={avgScore}
          aggregates={aggregates}
        />
        <BandDistribution aggregates={aggregates} totalInstances={totalInstances} />
        <BandDetailTable aggregates={aggregates} />
        <BandCards aggregates={aggregates} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
