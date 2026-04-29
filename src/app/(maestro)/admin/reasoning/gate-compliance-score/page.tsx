// /admin/reasoning/gate-compliance-score — Gate Compliance Score (GCS).
//
// Pure server component. Computes a GCS (0-100) for each instance:
//   GCS = max(0, baseRate - waiverPenalty - contradictionPenalty)
//   where baseRate = (gatesMet / gatesTotal) * 100
//         waiverPenalty = instanceWaivers * 8
//         contradictionPenalty = activeContradictions * 5
//
// Sections:
//   1. Portfolio GCS summary (3 cards)
//   2. GCS vs. raw pass rate table
//   3. Compliance gap chart (CSS bar chart)
//   4. Most-penalized instances (top 5)
//   5. Path to compliance (non-compliant instances)

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Compliance Score · AbarVa Admin',
};

// ── Color constants ────────────────────────────────────────────────────────────

// Deep mint for Compliant (GCS ≥ 80)
const DEEP_MINT_BG = '#D6EED6';
const DEEP_MINT_FG = '#0D3B1A';

// Standard mint for Mostly Compliant (60-79)
const MINT_BG = COLORS.mintSoft;
const MINT_FG = COLORS.mintInk;

// Amber for Partial (40-59)
const AMBER_BG = COLORS.amberSoft;
const AMBER_FG = COLORS.amberInk;

// Rust for Non-Compliant (< 40)
const RUST_BG = '#FFF0E6';
const RUST_FG = '#8B3A0F';

// ── GCS rating ─────────────────────────────────────────────────────────────────

type GcsRating = 'Compliant' | 'Mostly Compliant' | 'Partial' | 'Non-Compliant';

const gcsRating = (gcs: number): GcsRating =>
  gcs >= 80
    ? 'Compliant'
    : gcs >= 60
      ? 'Mostly Compliant'
      : gcs >= 40
        ? 'Partial'
        : 'Non-Compliant';

const GCS_PALETTE: Record<GcsRating, { bg: string; fg: string }> = {
  'Compliant':        { bg: DEEP_MINT_BG, fg: DEEP_MINT_FG },
  'Mostly Compliant': { bg: MINT_BG,      fg: MINT_FG },
  'Partial':          { bg: AMBER_BG,     fg: AMBER_FG },
  'Non-Compliant':    { bg: RUST_BG,      fg: RUST_FG },
};

// ── Data model ─────────────────────────────────────────────────────────────────

interface GcsRow {
  instanceId: string;
  instanceName: string;
  type: 'source' | 'program';
  rawRate: number;          // base gate pass rate (0-100), no penalty
  waivers: number;          // waiver count for this instance
  waiverPenalty: number;    // waivers * 8
  contradictions: number;   // active contradictions
  contradictionPenalty: number; // contradictions * 5
  gcs: number;              // final GCS (0-100)
  delta: number;            // rawRate - gcs (suppression magnitude)
  rating: GcsRating;
}

// ── Build rows ─────────────────────────────────────────────────────────────────

function buildGcsRows(): GcsRow[] {
  const healthRows = buildHealthBoardRows();
  const waivers = getWaivers();

  const waiverCountMap = new Map<string, number>();
  for (const w of waivers) {
    waiverCountMap.set(w.instanceId, (waiverCountMap.get(w.instanceId) ?? 0) + 1);
  }

  return healthRows.map((row) => {
    const instanceWaivers = waiverCountMap.get(row.id) ?? 0;
    const baseRate = (row.gatesMet / Math.max(row.gatesTotal, 1)) * 100;
    const waiverPenalty = instanceWaivers * 8;
    const contradictionPenalty = row.activeContradictions * 5;
    const gcs = Math.max(0, Math.round(baseRate - waiverPenalty - contradictionPenalty));
    const rawRate = Math.round(baseRate);

    return {
      instanceId: row.id,
      instanceName: row.label,
      type: row.type,
      rawRate,
      waivers: instanceWaivers,
      waiverPenalty,
      contradictions: row.activeContradictions,
      contradictionPenalty,
      gcs,
      delta: rawRate - gcs,
      rating: gcsRating(gcs),
    };
  });
}

// ── Style constants ────────────────────────────────────────────────────────────

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

// ── Sub-components ─────────────────────────────────────────────────────────────

function GcsChip({ rating }: { rating: GcsRating }) {
  const p = GCS_PALETTE[rating];
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
        whiteSpace: 'nowrap' as const,
      }}
    >
      {rating}
    </span>
  );
}

// ── Section 1: Portfolio GCS Summary ──────────────────────────────────────────

function PortfolioSummary({ rows }: { rows: GcsRow[] }) {
  if (rows.length === 0) return null;

  const avgGcs = Math.round(rows.reduce((s, r) => s + r.gcs, 0) / rows.length);
  const fullyCompliant = rows.filter((r) => r.gcs >= 80).length;
  const nonCompliant = rows.filter((r) => r.gcs < 40).length;

  const avgRating = gcsRating(avgGcs);
  const avgPalette = GCS_PALETTE[avgRating];

  const cards = [
    {
      label: 'Portfolio Avg GCS',
      value: String(avgGcs),
      sub: avgRating,
      bg: avgPalette.bg,
      fg: avgPalette.fg,
    },
    {
      label: 'Fully Compliant',
      value: String(fullyCompliant),
      sub: `GCS ≥ 80 — ${rows.length} total`,
      bg: DEEP_MINT_BG,
      fg: DEEP_MINT_FG,
    },
    {
      label: 'Non-Compliant',
      value: String(nonCompliant),
      sub: `GCS < 40 — needs attention`,
      bg: nonCompliant > 0 ? RUST_BG : DEEP_MINT_BG,
      fg: nonCompliant > 0 ? RUST_FG : DEEP_MINT_FG,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: card.bg,
            border: `1px solid ${card.fg}22`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              color: card.fg,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}
          >
            {card.label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 40,
              color: card.fg,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {card.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: card.fg,
              opacity: 0.8,
            }}
          >
            {card.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Section 2: GCS vs. Raw Pass Rate Table ────────────────────────────────────

function GcsTable({ rows }: { rows: GcsRow[] }) {
  const sorted = [...rows].sort((a, b) => b.gcs - a.gcs);

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
            GCS vs. Raw Pass Rate
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Delta column shows suppression — how much waivers and contradictions reduce native compliance
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {sorted.length} instance{sorted.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const, width: 100 }}>Raw Rate %</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const, width: 110 }}>Waiver Penalty</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const, width: 140 }}>Contradiction Penalty</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' as const, width: 72 }}>GCS</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Rating</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const, width: 80 }}>Delta</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const p = GCS_PALETTE[row.rating];
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
                      textAlign: 'right' as const,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                    }}
                  >
                    {row.rawRate}%
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'right' as const,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      color: row.waiverPenalty > 0 ? RUST_FG : `${COLORS.ink}55`,
                    }}
                  >
                    {row.waiverPenalty > 0 ? `−${row.waiverPenalty} pts` : '—'}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'right' as const,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      color: row.contradictionPenalty > 0 ? RUST_FG : `${COLORS.ink}55`,
                    }}
                  >
                    {row.contradictionPenalty > 0 ? `−${row.contradictionPenalty} pts` : '—'}
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
                    {row.gcs}
                  </td>
                  <td style={BODY_CELL}>
                    <GcsChip rating={row.rating} />
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'right' as const,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      color: row.delta > 0 ? RUST_FG : `${COLORS.ink}55`,
                      fontWeight: row.delta > 0 ? 700 : 400,
                    }}
                  >
                    {row.delta > 0 ? `−${row.delta}` : '0'}
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

// ── Section 3: Compliance Gap Chart ───────────────────────────────────────────

function ComplianceGapChart({ rows }: { rows: GcsRow[] }) {
  const sorted = [...rows].sort((a, b) => b.rawRate - a.rawRate);
  const maxVal = Math.max(...sorted.map((r) => r.rawRate), 1);

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
            Compliance Gap Chart
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Raw pass rate (mint) vs. GCS after penalties (rust) — gap width = suppression
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: MINT_FG,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}88` }}>
              Raw rate
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: RUST_FG,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}88` }}>
              GCS
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((row) => {
          const rawPct = (row.rawRate / maxVal) * 100;
          const gcsPct = (row.gcs / maxVal) * 100;

          return (
            <div key={row.instanceId} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: COLORS.ink,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                    maxWidth: '60%',
                  }}
                >
                  {row.instanceName}
                </span>
                <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
                  {row.rawRate}% → GCS {row.gcs}
                </span>
              </div>

              {/* Raw rate bar */}
              <div
                style={{
                  height: 10,
                  background: `${COLORS.ink}10`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${rawPct}%`,
                    height: '100%',
                    background: MINT_FG,
                    borderRadius: RADIUS.pill,
                    opacity: 0.6,
                  }}
                />
              </div>

              {/* GCS bar */}
              <div
                style={{
                  height: 10,
                  background: `${COLORS.ink}10`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${gcsPct}%`,
                    height: '100%',
                    background: row.delta > 0 ? RUST_FG : MINT_FG,
                    borderRadius: RADIUS.pill,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Section 4: Most-Penalized Instances ───────────────────────────────────────

function MostPenalized({ rows }: { rows: GcsRow[] }) {
  const top5 = [...rows]
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  if (top5.length === 0) return null;

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
        Most-Penalized Instances
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {top5.map((row, rank) => (
          <div
            key={row.instanceId}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}14`,
              borderLeft: `4px solid ${RUST_FG}`,
              borderRadius: RADIUS.lg,
              padding: `${SPACING.md} ${SPACING.lg}`,
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.md,
              flexWrap: 'wrap' as const,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                color: `${COLORS.ink}44`,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              #{rank + 1}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 15,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              {row.instanceName}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: RUST_FG,
                flex: 1,
                minWidth: 200,
              }}
            >
              is{' '}
              <strong>{row.delta}%</strong> below native compliance due to waivers/contradictions
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}66`,
                flexShrink: 0,
              }}
            >
              {row.rawRate}% raw → {row.gcs} GCS
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 5: Path to Compliance ─────────────────────────────────────────────

function PathToCompliance({ rows }: { rows: GcsRow[] }) {
  const nonCompliant = rows.filter((r) => r.rating === 'Non-Compliant');

  if (nonCompliant.length === 0) {
    return (
      <section
        style={{
          background: DEEP_MINT_BG,
          border: `1px solid ${DEEP_MINT_FG}22`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: DEEP_MINT_FG,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Path to Compliance
        </h2>
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: DEEP_MINT_FG }}>
          No non-compliant instances. All instances have GCS ≥ 40.
        </div>
      </section>
    );
  }

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
        Path to Compliance
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {nonCompliant.map((row) => {
          const actions: string[] = [];
          if (row.waivers > 0) {
            actions.push(
              `Clear ${row.waivers} waiver${row.waivers === 1 ? '' : 's'} to gain +${row.waiverPenalty} pts`,
            );
          }
          if (row.contradictions > 0) {
            actions.push(
              `Resolve ${row.contradictions} contradiction${row.contradictions === 1 ? '' : 's'} to gain +${row.contradictionPenalty} pts`,
            );
          }

          return (
            <div
              key={row.instanceId}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.lg,
                padding: `${SPACING.md} ${SPACING.lg}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.md, flexWrap: 'wrap' as const }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 15,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {row.instanceName}
                </span>
                <GcsChip rating={row.rating} />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: RUST_FG,
                    fontWeight: 700,
                  }}
                >
                  GCS {row.gcs}
                </span>
              </div>
              {actions.length > 0 && (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: SPACING.lg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {actions.map((action) => (
                    <li
                      key={action}
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: `${COLORS.ink}99`,
                        lineHeight: 1.5,
                      }}
                    >
                      {action}
                    </li>
                  ))}
                </ul>
              )}
              {actions.length === 0 && (
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  Improve raw gate pass rate — meet more gate criteria natively.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GateComplianceScorePage() {
  const rows = buildGcsRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open gate status matrix"
          primaryActionHref="/admin/reasoning/gate-status-matrix"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Gates"
        title="Gate Compliance Score"
        subtitle="Native gate compliance per instance — pass rate minus waiver adjustments"
      >
        <PortfolioSummary rows={rows} />
        <GcsTable rows={rows} />
        <ComplianceGapChart rows={rows} />
        <MostPenalized rows={rows} />
        <PathToCompliance rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
