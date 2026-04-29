// /admin/reasoning/instance-risk-matrix — 2D risk matrix for all instances.
//
// Server component. Plots every fixture instance on a 2×2 quadrant grid:
//   X axis = active contradictions (threshold: 2)
//   Y axis = health score (threshold: 60)
//
// Quadrants:
//   Q1 Low Risk   — health ≥ 60, contradictions ≤ 1 → "Healthy & aligned"
//   Q2 Watch      — health ≥ 60, contradictions ≥ 2 → "Healthy but misaligned"
//   Q3 Urgent     — health < 60, contradictions ≥ 2 → "Struggling & misaligned"
//   Q4 Fragile    — health < 60, contradictions ≤ 1 → "Weak but stable"
//
// Composite health score formula (matches scorecard):
//   (gatesMet / max(gatesTotal, 1)) * 60
//   + (1 - min(activeContradictions / 5, 1)) * 30
//   + 10

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance Risk Matrix · AbarVa Admin',
};

// ─── Thresholds ───────────────────────────────────────────────────────────────

const CONTRADICTION_THRESHOLD = 2;
const HEALTH_THRESHOLD = 60;

// ─── Score & quadrant helpers ─────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

function assignQuadrant(healthScore: number, contradictions: number): Quadrant {
  const highHealth = healthScore >= HEALTH_THRESHOLD;
  const fewContradictions = contradictions < CONTRADICTION_THRESHOLD;
  if (highHealth && fewContradictions) return 'Q1';
  if (highHealth && !fewContradictions) return 'Q2';
  if (!highHealth && !fewContradictions) return 'Q3';
  return 'Q4';
}

type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';

function riskLevel(quadrant: Quadrant, healthScore: number): RiskLevel {
  if (quadrant === 'Q3') return 'Critical';
  if (quadrant === 'Q4' || quadrant === 'Q2') return 'High';
  if (quadrant === 'Q1' && healthScore < 80) return 'Moderate';
  return 'Low';
}

// ─── Enriched row ─────────────────────────────────────────────────────────────

interface RiskRow {
  row: InstanceHealthRow;
  healthScore: number;
  quadrant: Quadrant;
  riskLevel: RiskLevel;
  gatesPct: number;
}

function buildRiskRows(): RiskRow[] {
  return buildHealthBoardRows().map((row) => {
    const healthScore = computeScore(row);
    const quadrant = assignQuadrant(healthScore, row.activeContradictions);
    const level = riskLevel(quadrant, healthScore);
    const gatesPct =
      row.gatesTotal > 0 ? Math.round((row.gatesMet / row.gatesTotal) * 100) : 0;
    return { row, healthScore, quadrant, riskLevel: level, gatesPct };
  });
}

// ─── Quadrant metadata ────────────────────────────────────────────────────────

interface QuadrantMeta {
  id: Quadrant;
  name: string;
  subtitle: string;
  bg: string;
  border: string;
  nameColor: string;
}

const QUADRANT_META: Record<Quadrant, QuadrantMeta> = {
  Q1: {
    id: 'Q1',
    name: 'Low Risk',
    subtitle: 'Healthy & aligned',
    bg: SHELL.MINT_BG,
    border: SHELL.MINT_LINE,
    nameColor: SHELL.MINT_TEXT,
  },
  Q2: {
    id: 'Q2',
    name: 'Watch',
    subtitle: 'Healthy but misaligned',
    bg: SHELL.PEACH_BG,
    border: SHELL.PEACH_LINE,
    nameColor: SHELL.PEACH_TEXT,
  },
  Q3: {
    id: 'Q3',
    name: 'Urgent',
    subtitle: 'Struggling & misaligned',
    bg: SHELL.RUST_BG,
    border: `${SHELL.RUST_TEXT}55`,
    nameColor: SHELL.RUST_TEXT,
  },
  Q4: {
    id: 'Q4',
    name: 'Fragile',
    subtitle: 'Weak but stable',
    bg: SHELL.PAPER_DEEP,
    border: SHELL.CARD_LINE,
    nameColor: SHELL.AMBER_DOT,
  },
};

// ─── Risk level badge palette ──────────────────────────────────────────────────

interface RiskPalette {
  bg: string;
  text: string;
}

function riskPalette(level: RiskLevel): RiskPalette {
  if (level === 'Critical') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
  if (level === 'High') return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT };
  if (level === 'Moderate') return { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT };
  return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
}

// ─── Table styles ──────────────────────────────────────────────────────────────

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
  verticalAlign: 'middle',
};

// ─── Components ───────────────────────────────────────────────────────────────

function InstanceChip({ label }: { label: string }) {
  const truncated = label.length > 10 ? label.slice(0, 10) + '…' : label;
  return (
    <span
      title={label}
      style={{
        display: 'inline-block',
        background: `${COLORS.ink}0c`,
        color: COLORS.ink,
        borderRadius: RADIUS.pill,
        padding: '2px 7px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {truncated}
    </span>
  );
}

function CountBadge({ count, color }: { count: number; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 22,
        borderRadius: RADIUS.pill,
        background: `${color}33`,
        color,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        padding: '0 6px',
        flexShrink: 0,
      }}
    >
      {count}
    </span>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const p = riskPalette(level);
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {level}
    </span>
  );
}

function QuadrantCell({
  meta,
  instances,
}: {
  meta: QuadrantMeta;
  instances: RiskRow[];
}) {
  return (
    <div
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        minHeight: 180,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 700,
              color: meta.nameColor,
              letterSpacing: '0.01em',
            }}
          >
            {meta.name}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}99`,
              marginTop: 2,
            }}
          >
            {meta.subtitle}
          </div>
        </div>
        <CountBadge count={instances.length} color={meta.nameColor} />
      </div>

      {/* Instance chips */}
      {instances.length === 0 ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
            fontStyle: 'italic',
            paddingTop: SPACING.xs,
          }}
        >
          No instances
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            paddingTop: SPACING.xs,
          }}
        >
          {instances.slice(0, 20).map((r) => (
            <div key={r.row.id}>
              <InstanceChip label={r.row.label} />
            </div>
          ))}
          {instances.length > 20 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: `${COLORS.ink}88`,
                alignSelf: 'center',
              }}
            >
              +{instances.length - 20} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function AxisLabel({
  children,
  vertical,
}: {
  children: React.ReactNode;
  vertical?: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: `${COLORS.ink}66`,
        ...(vertical
          ? {
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              textAlign: 'center',
              flexShrink: 0,
            }
          : {
              textAlign: 'center',
              flexShrink: 0,
            }),
      }}
    >
      {children}
    </div>
  );
}

function QuadrantMatrix({ rows }: { rows: RiskRow[] }) {
  const q1 = rows.filter((r) => r.quadrant === 'Q1');
  const q2 = rows.filter((r) => r.quadrant === 'Q2');
  const q3 = rows.filter((r) => r.quadrant === 'Q3');
  const q4 = rows.filter((r) => r.quadrant === 'Q4');

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
          Quadrant matrix
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Health score threshold {HEALTH_THRESHOLD} · Contradictions threshold {CONTRADICTION_THRESHOLD}
        </div>
      </header>

      <div style={{ padding: SPACING.lg }}>
        {/* X-axis labels: FEW / MANY contradictions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 1fr',
            gap: SPACING.sm,
            marginBottom: SPACING.sm,
          }}
        >
          <div />
          <AxisLabel>Few contradictions (0–1)</AxisLabel>
          <AxisLabel>Many contradictions (2+)</AxisLabel>
        </div>

        {/* Main grid with Y-axis labels */}
        <div style={{ display: 'flex', gap: SPACING.sm }}>
          {/* Y-axis labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
              width: 32,
              flexShrink: 0,
            }}
          >
            <AxisLabel vertical>High health (≥{HEALTH_THRESHOLD})</AxisLabel>
            <AxisLabel vertical>Low health (&lt;{HEALTH_THRESHOLD})</AxisLabel>
          </div>

          {/* 2×2 grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING.sm,
              flex: 1,
            }}
          >
            {/* Row 1: High health */}
            <QuadrantCell meta={QUADRANT_META.Q1} instances={q1} />
            <QuadrantCell meta={QUADRANT_META.Q2} instances={q2} />
            {/* Row 2: Low health */}
            <QuadrantCell meta={QUADRANT_META.Q4} instances={q4} />
            <QuadrantCell meta={QUADRANT_META.Q3} instances={q3} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DistributionSummary({ rows }: { rows: RiskRow[] }) {
  const counts: Record<Quadrant, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const r of rows) counts[r.quadrant]++;

  const items: Array<{ quadrant: Quadrant; count: number }> = [
    { quadrant: 'Q1', count: counts.Q1 },
    { quadrant: 'Q2', count: counts.Q2 },
    { quadrant: 'Q3', count: counts.Q3 },
    { quadrant: 'Q4', count: counts.Q4 },
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
        flexWrap: 'wrap',
        gap: SPACING.lg,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}66`,
        }}
      >
        Distribution
      </span>
      {items.map(({ quadrant, count }) => {
        const meta = QUADRANT_META[quadrant];
        return (
          <div key={quadrant} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: meta.nameColor,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 18,
                fontWeight: 700,
                color: meta.nameColor,
                lineHeight: 1,
              }}
            >
              {count}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}99`,
              }}
            >
              {meta.name}
            </span>
          </div>
        );
      })}
      <span
        style={{
          marginLeft: 'auto',
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {rows.length} total instance{rows.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

function RiskTable({ rows }: { rows: RiskRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    // Sort by risk level severity desc, then health score asc
    const levelOrder: Record<RiskLevel, number> = {
      Critical: 0,
      High: 1,
      Moderate: 2,
      Low: 3,
    };
    const byLevel = levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
    if (byLevel !== 0) return byLevel;
    return a.healthScore - b.healthScore;
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
          Ranked risk table
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {sorted.length} instance{sorted.length !== 1 ? 's' : ''}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr>
              <th style={TH}>#</th>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, textAlign: 'right' }}>Health</th>
              <th style={{ ...TH, textAlign: 'right' }}>Contradictions</th>
              <th style={{ ...TH, textAlign: 'right' }}>Gates Met %</th>
              <th style={TH}>Quadrant</th>
              <th style={TH}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => {
              const isOdd = idx % 2 === 1;
              const rowBg = isOdd ? `${COLORS.ink}04` : COLORS.white;
              return (
                <tr key={r.row.id} style={{ background: rowBg }}>
                  <td style={{ ...TD, fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
                    {idx + 1}
                  </td>
                  <td style={TD}>
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
                        color: `${COLORS.ink}66`,
                        marginTop: 2,
                      }}
                    >
                      {r.row.id}
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: TYPOGRAPHY.mono, fontSize: 13, fontWeight: 700, color: r.healthScore >= HEALTH_THRESHOLD ? SHELL.MINT_TEXT : SHELL.RUST_TEXT }}>
                    {r.healthScore}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: TYPOGRAPHY.mono, fontSize: 13, fontWeight: 700, color: r.row.activeContradictions >= CONTRADICTION_THRESHOLD ? SHELL.RUST_TEXT : COLORS.ink }}>
                    {r.row.activeContradictions}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: `${COLORS.ink}99` }}>
                    {r.gatesPct}%
                  </td>
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: QUADRANT_META[r.quadrant].nameColor,
                        fontWeight: 600,
                      }}
                    >
                      {QUADRANT_META[r.quadrant].name}
                    </span>
                  </td>
                  <td style={TD}>
                    <RiskBadge level={r.riskLevel} />
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InstanceRiskMatrixPage() {
  const rows = buildRiskRows();

  return (
    <AdminCanonShellV2 agentRail={null}>
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Instance Risk Matrix"
        subtitle="Health score vs. active contradictions — quadrant analysis"
      >
        <DistributionSummary rows={rows} />
        <QuadrantMatrix rows={rows} />
        <RiskTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
