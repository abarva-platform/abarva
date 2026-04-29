// /admin/reasoning/evidence-velocity — Evidence ingestion velocity per instance.
//
// Pure server component. Tracks how quickly each instance is accumulating
// evidence relative to its gate requirements, and projects when evidence
// coverage will be sufficient.
//
// Sections:
//   1. Portfolio velocity summary  — avg coverage %, on-track count, stalled count
//   2. Velocity table              — all instances with coverage %, velocity, months to 100%
//   3. Velocity bar chart          — horizontal bars colored by velocity label
//   4. At-risk instances           — monthsToTarget > 6
//   5. Fast movers                 — top 3 instances by velocity

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Velocity · AbarVa Admin',
};

// ─── Velocity label helpers ────────────────────────────────────────────────────

type VelocityLabel = 'Fast' | 'Normal' | 'Slow' | 'Stalled';

function velocityLabel(velocity: number): VelocityLabel {
  if (velocity > 4) return 'Fast';
  if (velocity >= 2) return 'Normal';
  if (velocity >= 1) return 'Slow';
  return 'Stalled';
}

function velocityColors(label: VelocityLabel): { fg: string; bg: string } {
  switch (label) {
    case 'Fast':    return { fg: COLORS.mintInk,  bg: COLORS.mintSoft };
    case 'Normal':  return { fg: COLORS.amberInk, bg: COLORS.amberSoft };
    case 'Slow':    return { fg: COLORS.coralInk, bg: COLORS.coralSoft };
    case 'Stalled': return { fg: COLORS.coralInk, bg: COLORS.coralSoft };
  }
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface EvidenceVelocityRow {
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
  evidenceCount: number;
  evidenceTarget: number;
  coveragePct: number;
  velocity: number;          // evidence items per "month"
  velocityLabel: VelocityLabel;
  monthsToTarget: number;    // months to reach 100% coverage
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function computeVelocityRows(): EvidenceVelocityRow[] {
  const healthRows = buildHealthBoardRows();
  const patterns = getAllLifecyclePatterns();

  const rows: EvidenceVelocityRow[] = [];

  for (const hr of healthRows) {
    // Find matching pattern by type heuristic
    const pattern = patterns.find((p) =>
      hr.type === 'source'
        ? p.patternId.startsWith('PAT-SRC')
        : p.patternId.startsWith('PAT-PRG'),
    ) ?? patterns[0];

    // Evidence target: 1 evidence per gate criterion
    const evidenceTarget = pattern
      ? pattern.gateCriteria.length
      : Math.max(hr.gatesTotal, 1);

    const evidenceCount = getEvidenceFor(hr.id).length;
    const coverage = (evidenceCount / Math.max(evidenceTarget, 1)) * 100;

    // stageIndex proxy: how far through the stages is this instance?
    const stageLabel = hr.stageLabel ?? hr.phaseLabel ?? '';
    const stageIdx = pattern
      ? Math.max(
          pattern.stages.findIndex(
            (s) =>
              s.label.toLowerCase() === stageLabel.toLowerCase() ||
              s.id.toLowerCase() === stageLabel.toLowerCase(),
          ),
          0,
        )
      : 1;

    // Velocity: evidence items per "month" (proxy: evidenceCount / max(stageIndex, 1))
    const velocity = evidenceCount / Math.max(stageIdx, 1);

    // Time to sufficiency: months remaining
    const monthsToTarget =
      velocity > 0
        ? Math.ceil((evidenceTarget - evidenceCount) / velocity)
        : 99; // stalled

    const label = velocityLabel(velocity);

    rows.push({
      instanceId: hr.id,
      instanceName: hr.label,
      instanceType: hr.type,
      evidenceCount,
      evidenceTarget,
      coveragePct: coverage,
      velocity,
      velocityLabel: label,
      monthsToTarget: evidenceCount >= evidenceTarget ? 0 : Math.max(monthsToTarget, 0),
    });
  }

  // Sort: highest velocity first
  rows.sort((a, b) => b.velocity - a.velocity);
  return rows;
}

// ─── Style constants ──────────────────────────────────────────────────────────

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

// ─── Section 1: Portfolio summary cards ──────────────────────────────────────

function KpiCard({
  value,
  label,
  sub,
  fg,
  bg,
}: {
  value: string;
  label: string;
  sub?: string;
  fg: string;
  bg: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        background: bg,
        border: `1px solid ${fg}33`,
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
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: `${fg}99`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 40,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${fg}bb` }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PortfolioSummary({ rows }: { rows: EvidenceVelocityRow[] }) {
  const avgCoverage =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + r.coveragePct, 0) / rows.length
      : 0;
  const onTrackCount = rows.filter((r) => r.coveragePct >= 60).length;
  const stalledCount = rows.filter((r) => r.velocity < 1).length;

  const coverageFg =
    avgCoverage >= 60
      ? COLORS.mintInk
      : avgCoverage >= 40
      ? COLORS.amberInk
      : COLORS.coralInk;
  const coverageBg =
    avgCoverage >= 60
      ? COLORS.mintSoft
      : avgCoverage >= 40
      ? COLORS.amberSoft
      : COLORS.coralSoft;

  return (
    <section style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
      <KpiCard
        value={`${avgCoverage.toFixed(1)}%`}
        label="Portfolio avg evidence coverage"
        sub={`Avg across ${rows.length} instance${rows.length === 1 ? '' : 's'}`}
        fg={coverageFg}
        bg={coverageBg}
      />
      <KpiCard
        value={String(onTrackCount)}
        label="Instances on track"
        sub="Coverage ≥ 60%"
        fg={COLORS.mintInk}
        bg={COLORS.mintSoft}
      />
      <KpiCard
        value={String(stalledCount)}
        label="Stalled instances"
        sub="Velocity < 1 item/month"
        fg={COLORS.coralInk}
        bg={COLORS.coralSoft}
      />
    </section>
  );
}

// ─── Section 2: Velocity table ────────────────────────────────────────────────

function VelocityTable({ rows }: { rows: EvidenceVelocityRow[] }) {
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
            Evidence velocity ranking
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Highest velocity first — evidence items per month, coverage %, months to sufficiency · as of 29 Apr 2026
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Rank</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Evidence</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Target</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Coverage %</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Velocity (items/mo)</th>
              <th style={HEADER_CELL}>Label</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Months to 100%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { fg, bg } = velocityColors(row.velocityLabel);
              const isComplete = row.evidenceCount >= row.evidenceTarget;
              return (
                <tr key={row.instanceId}>
                  <td style={{ ...MONO_CELL, color: `${COLORS.ink}66`, width: 40 }}>
                    {idx + 1}
                  </td>

                  <td style={BODY_CELL}>
                    <a
                      href={`/admin/reasoning/instances/${row.instanceId}`}
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.navy,
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {row.instanceName}
                    </a>
                  </td>

                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background:
                          row.instanceType === 'source' ? COLORS.skyPale : COLORS.amberSoft,
                        color:
                          row.instanceType === 'source' ? COLORS.navy : COLORS.amberInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 8px',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {row.instanceType}
                    </span>
                  </td>

                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.evidenceCount}</td>
                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.evidenceTarget}</td>

                  <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background:
                          row.coveragePct >= 60 ? COLORS.mintSoft
                          : row.coveragePct >= 40 ? COLORS.amberSoft
                          : COLORS.coralSoft,
                        color:
                          row.coveragePct >= 60 ? COLORS.mintInk
                          : row.coveragePct >= 40 ? COLORS.amberInk
                          : COLORS.coralInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.coveragePct.toFixed(0)}%
                    </span>
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      fontWeight: idx === 0 ? 700 : 400,
                      color: fg,
                    }}
                  >
                    {row.velocity.toFixed(2)}
                  </td>

                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: bg,
                        color: fg,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.velocityLabel}
                    </span>
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      paddingRight: SPACING.lg,
                      color: isComplete
                        ? COLORS.mintInk
                        : row.monthsToTarget > 6
                        ? COLORS.coralInk
                        : `${COLORS.ink}cc`,
                    }}
                  >
                    {isComplete ? '—' : row.monthsToTarget >= 99 ? '∞' : `${row.monthsToTarget}mo`}
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

// ─── Section 3: Velocity bar chart ────────────────────────────────────────────

/** Max velocity for bar scaling */
function VelocityBarChart({ rows }: { rows: EvidenceVelocityRow[] }) {
  const maxVelocity = rows.reduce((m, r) => Math.max(m, r.velocity), 0.001);

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
          Velocity distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Horizontal bars proportional to evidence velocity (items/month) — colored by label
        </div>
      </header>

      <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>
        {rows.map((row) => {
          const { fg, bg } = velocityColors(row.velocityLabel);
          const barWidthPct = (row.velocity / maxVelocity) * 100;
          return (
            <div
              key={row.instanceId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `${SPACING.xs} 0`,
                borderBottom: `1px solid ${COLORS.ink}08`,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  fontWeight: 500,
                  minWidth: 200,
                  flex: '0 0 auto',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.instanceName}
              </span>

              <div
                style={{
                  flex: 1,
                  height: 16,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(barWidthPct, 100)}%`,
                    background: fg,
                    borderRadius: RADIUS.pill,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <span
                style={{
                  display: 'inline-block',
                  background: bg,
                  color: fg,
                  borderRadius: RADIUS.pill,
                  padding: '2px 8px',
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  flex: '0 0 auto',
                  minWidth: 72,
                  textAlign: 'center',
                }}
              >
                {row.velocity.toFixed(2)} /mo
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section 4: At-risk instances ─────────────────────────────────────────────

function AtRiskInstances({ rows }: { rows: EvidenceVelocityRow[] }) {
  const atRisk = rows.filter((r) => r.monthsToTarget > 6 && r.monthsToTarget < 99);
  const stalled = rows.filter((r) => r.monthsToTarget >= 99 && r.evidenceCount < r.evidenceTarget);
  const allAtRisk = [...atRisk, ...stalled];

  if (allAtRisk.length === 0) {
    return (
      <section
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.mintInk}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.mintInk,
          }}
        >
          No at-risk instances — all instances are on pace to reach evidence sufficiency within 6 months.
        </span>
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.coralSoft,
        border: `1px solid ${COLORS.coralInk}22`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.coralInk}22`,
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
              color: COLORS.coralInk,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            At-risk instances
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.coralInk}bb`,
              marginTop: 4,
            }}
          >
            Instances where evidence coverage won&apos;t reach sufficiency for more than 6 months at current pace
          </div>
        </div>
        <span
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.coralInk}99` }}
        >
          {allAtRisk.length} instance{allAtRisk.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ padding: `${SPACING.sm} ${SPACING.md}` }}>
        {allAtRisk.map((row) => (
          <div
            key={row.instanceId}
            style={{
              padding: `${SPACING.sm} ${SPACING.sm}`,
              borderBottom: `1px solid ${COLORS.coralInk}14`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.coralInk,
                  fontWeight: 600,
                  flex: '0 0 auto',
                  minWidth: 220,
                }}
              >
                {row.instanceName}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.coralInk}cc`,
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                At current pace,{' '}
                <strong style={{ fontStyle: 'normal' }}>{row.instanceName}</strong>{' '}
                {row.monthsToTarget >= 99
                  ? "won't reach evidence sufficiency (velocity stalled)"
                  : `won't reach evidence sufficiency for ${row.monthsToTarget} months`}
              </span>
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.coralInk}99`,
                marginTop: 4,
                paddingLeft: 2,
              }}
            >
              Action: Accelerate evidence ingestion via POST /api/reasoning/evidence
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 5: Fast movers ────────────────────────────────────────────────────

function FastMovers({ rows }: { rows: EvidenceVelocityRow[] }) {
  // Top 3 by velocity (rows are already sorted desc)
  const top3 = rows.slice(0, 3).filter((r) => r.velocity > 0);
  if (top3.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}22`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.mintInk}22`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.mintInk,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Fast movers
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.mintInk}bb`,
            marginTop: 4,
          }}
        >
          Top 3 instances by evidence velocity — on track to reach full coverage soonest
        </div>
      </header>

      <div style={{ padding: `${SPACING.sm} ${SPACING.md}` }}>
        {top3.map((row, idx) => (
          <div
            key={row.instanceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.sm}`,
              borderBottom: `1px solid ${COLORS.mintInk}14`,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 20,
                color: `${COLORS.mintInk}66`,
                fontWeight: 700,
                flex: '0 0 auto',
                width: 32,
              }}
            >
              {idx + 1}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.mintInk,
                fontWeight: 600,
                flex: '0 0 auto',
                minWidth: 200,
              }}
            >
              {row.instanceName}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.mintInk}cc`,
                flex: 1,
              }}
            >
              {row.evidenceCount >= row.evidenceTarget
                ? 'Already at full evidence coverage'
                : row.monthsToTarget <= 0
                ? 'On track — projected to complete this month'
                : `On track to reach full coverage in ${row.monthsToTarget} month${row.monthsToTarget === 1 ? '' : 's'}`}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.mintInk}bb`,
                flex: '0 0 auto',
              }}
            >
              {row.velocity.toFixed(2)} items/mo · {row.coveragePct.toFixed(0)}% covered
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceVelocityPage() {
  const rows = computeVelocityRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Evidence Ingest"
          primaryActionHref="/admin/reasoning/evidence-ingest"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence velocity"
        title="Evidence Velocity"
        subtitle="Evidence accumulation rate per instance — current pace and time-to-sufficiency projections"
      >
        <PortfolioSummary rows={rows} />
        <VelocityTable rows={rows} />
        <VelocityBarChart rows={rows} />
        <AtRiskInstances rows={rows} />
        <FastMovers rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
