// /admin/reasoning/waiver-impact — Health score impact analysis of gate waivers.
//
// Pure server component, force-dynamic. For each instance that has active
// gate waivers, computes:
//   - Current health score (from buildHealthBoardRows)
//   - Hypothetical health score without those waivers (subtract waived gates
//     from gatesMet and recompute via the canonical formula)
//
// Sections:
//   SummaryStrip     — N instances · M total waivers · Avg score lift: +X pts
//   ImpactTable      — Instance | Waivers | Current | No-waiver | Lift | Criteria
//   WaiverRiskCard   — Instances whose removal would cross a health threshold
//   EmptyState       — Mint banner when no active waivers

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { InstanceHealthRow } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waiver impact | AbarVa Admin',
};

// ─── Score formula ────────────────────────────────────────────────────────────

/** Canonical health score formula — matches health-board's computeInstanceHealth. */
function computeScore(gatesMet: number, gatesTotal: number, contradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
      (1 - Math.min(contradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Health label helpers ─────────────────────────────────────────────────────

type HealthLabel = 'healthy' | 'warning' | 'critical';

function scoreToLabel(score: number): HealthLabel {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'warning';
  return 'critical';
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface InstanceNameMap {
  [id: string]: string;
}

function buildInstanceNames(): InstanceNameMap {
  const map: InstanceNameMap = {};
  for (const inst of SOURCE_EVENT_INSTANCES) {
    map[inst.id] = inst.name;
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    map[inst.id] = inst.name;
  }
  return map;
}

interface WaiverImpactRow {
  instanceId: string;
  instanceName: string;
  waiverCount: number;
  waivedCriteria: string[];
  currentScore: number;
  noWaiverScore: number;
  lift: number;
  currentLabel: HealthLabel;
  noWaiverLabel: HealthLabel;
  crossesThreshold: boolean;
}

function buildImpactRows(): WaiverImpactRow[] {
  const waivers = getWaivers();
  if (waivers.length === 0) return [];

  const healthRows = buildHealthBoardRows();
  const healthByInstance = new Map<string, InstanceHealthRow>();
  for (const row of healthRows) {
    healthByInstance.set(row.id, row);
  }

  const instanceNames = buildInstanceNames();

  // Group waivers by instanceId
  const byInstance = new Map<string, string[]>();
  for (const w of waivers) {
    const list = byInstance.get(w.instanceId) ?? [];
    list.push(w.criterionId);
    byInstance.set(w.instanceId, list);
  }

  const rows: WaiverImpactRow[] = [];

  for (const [instanceId, criteria] of byInstance.entries()) {
    const health = healthByInstance.get(instanceId);
    if (health === undefined) continue;

    const currentScore = computeScore(
      health.gatesMet,
      health.gatesTotal,
      health.activeContradictions,
    );

    // Hypothetical: subtract waived gates from gatesMet (floor at 0)
    const hypotheticalGatesMet = Math.max(0, health.gatesMet - criteria.length);
    const noWaiverScore = computeScore(
      hypotheticalGatesMet,
      health.gatesTotal,
      health.activeContradictions,
    );

    const lift = currentScore - noWaiverScore;
    const currentLabel = scoreToLabel(currentScore);
    const noWaiverLabel = scoreToLabel(noWaiverScore);
    const crossesThreshold = currentLabel !== noWaiverLabel;

    rows.push({
      instanceId,
      instanceName: instanceNames[instanceId] ?? instanceId,
      waiverCount: criteria.length,
      waivedCriteria: criteria,
      currentScore,
      noWaiverScore,
      lift,
      currentLabel,
      noWaiverLabel,
      crossesThreshold,
    });
  }

  // Sort by lift descending (biggest benefit from waivers first)
  return rows.sort((a, b) => b.lift - a.lift);
}

// ─── Table style constants ────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}bb`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: WaiverImpactRow[] }) {
  const totalWaivers = rows.reduce((sum, r) => sum + r.waiverCount, 0);
  const avgLift =
    rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.lift, 0) / rows.length);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      <SummaryChip label="Instances with waivers" value={String(rows.length)} />
      <Divider />
      <SummaryChip label="Total waivers" value={String(totalWaivers)} />
      <Divider />
      <SummaryChip
        label="Avg score lift"
        value={avgLift > 0 ? `+${avgLift} pts` : `${avgLift} pts`}
        valueColor={avgLift > 0 ? SHELL.MINT_TEXT : `${COLORS.ink}99`}
      />
    </div>
  );
}

function SummaryChip({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}88`,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          color: valueColor ?? COLORS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 36,
        background: `${COLORS.ink}18`,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Health label badge ───────────────────────────────────────────────────────

function HealthBadge({ label }: { label: HealthLabel }) {
  let bg: string;
  let fg: string;
  if (label === 'healthy') {
    bg = SHELL.MINT_BG;
    fg = SHELL.MINT_TEXT;
  } else if (label === 'warning') {
    bg = COLORS.amberSoft;
    fg = COLORS.amberInk;
  } else {
    bg = COLORS.coralSoft;
    fg = COLORS.coralInk;
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
}

// ─── ImpactTable ──────────────────────────────────────────────────────────────

function ImpactTable({ rows }: { rows: WaiverImpactRow[] }) {
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
            Score impact by instance
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by score lift descending — biggest waiver benefit first
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Waivers</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Current score</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Score w/o waivers</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Lift</th>
              <th style={HEADER_CELL}>Waived criteria</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              return (
                <tr key={row.instanceId} style={{ background: rowBg }}>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {row.instanceName}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}77`,
                        marginTop: 2,
                      }}
                    >
                      {row.instanceId}
                    </div>
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    {row.waiverCount}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 14,
                          fontWeight: 700,
                          color: COLORS.ink,
                        }}
                      >
                        {row.currentScore}
                      </span>
                      <HealthBadge label={row.currentLabel} />
                    </div>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 14,
                          color: `${COLORS.ink}99`,
                        }}
                      >
                        {row.noWaiverScore}
                      </span>
                      <HealthBadge label={row.noWaiverLabel} />
                    </div>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 14,
                        fontWeight: 700,
                        color: row.lift > 0 ? SHELL.MINT_TEXT : row.lift < 0 ? COLORS.coralInk : `${COLORS.ink}88`,
                      }}
                    >
                      {row.lift > 0 ? `+${row.lift}` : String(row.lift)}
                    </span>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      maxWidth: 280,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                      }}
                    >
                      {row.waivedCriteria.map((cid) => (
                        <span
                          key={cid}
                          style={{
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 10,
                            background: COLORS.amberSoft,
                            color: COLORS.amberInk,
                            borderRadius: RADIUS.sm,
                            padding: '2px 6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cid}
                        </span>
                      ))}
                    </div>
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

// ─── WaiverRiskCard ───────────────────────────────────────────────────────────

function WaiverRiskCard({ rows }: { rows: WaiverImpactRow[] }) {
  const atRisk = rows.filter((r) => r.crossesThreshold);
  if (atRisk.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.PEACH_LINE}`,
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
              color: SHELL.PEACH_TEXT,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Waiver risk — threshold crossings
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              marginTop: 2,
              opacity: 0.8,
            }}
          >
            Removing these waivers would change the instance health classification
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.PEACH_TEXT,
            opacity: 0.8,
          }}
        >
          {atRisk.length} instance{atRisk.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ padding: SPACING.md, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {atRisk.map((row) => (
          <div
            key={row.instanceId}
            style={{
              background: COLORS.white,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {row.instanceName}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}77`,
                }}
              >
                {row.instanceId}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              <HealthBadge label={row.currentLabel} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}77`,
                }}
              >
                →
              </span>
              <HealthBadge label={row.noWaiverLabel} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: SHELL.PEACH_TEXT,
                  fontWeight: 700,
                  marginLeft: SPACING.xs,
                }}
              >
                {row.lift > 0 ? `+${row.lift}` : String(row.lift)} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: SHELL.MINT_TEXT,
          marginBottom: SPACING.sm,
          letterSpacing: '-0.01em',
        }}
      >
        No active waivers
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.MINT_TEXT,
          opacity: 0.8,
          lineHeight: 1.5,
        }}
      >
        Gate waivers applied on Source or Programs detail pages will appear here
        with their health score impact.
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WaiverImpactPage() {
  const rows = buildImpactRows();
  const isEmpty = rows.length === 0;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Waiver impact"
        title="Gate waiver impact analysis"
        subtitle="Current health scores compared against hypothetical scores without active waivers. Shows the score lift each waiver provides and flags instances that would cross health thresholds if waivers were removed."
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip rows={rows} />
            <ImpactTable rows={rows} />
            <WaiverRiskCard rows={rows} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
