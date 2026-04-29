// /admin/reasoning/gate-velocity — Gate satisfaction velocity per instance.
//
// Pure server component. Computes how fast each instance is satisfying gate
// criteria over time: gates met per "day of dwell" in the current stage/phase.
//
// Sections:
//   SummaryStrip    — N instances · Avg velocity · Fastest · Slowest
//   VelocityTable   — Rank | Instance | Stage | Gates met | Dwell days |
//                     Velocity | Projected days to complete | Evidence count
//   SlowestInstances — Bottom-5 by velocity in a warning card

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate velocity · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-29');
const TODAY_MS = TODAY.getTime();

// ─── Data model ───────────────────────────────────────────────────────────────

interface VelocityRow {
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
  currentStage: string;
  enteredAt: string;
  dwellDays: number;
  gatesMet: number;
  gatesTotal: number;
  gateVelocity: number;          // gates met per day
  projectedCompletion: number;   // days to finish remaining gates at current velocity
  evidenceCount: number;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

/**
 * Returns days since `enteredAt`, minimum 1 to avoid division-by-zero.
 */
function dwellDaysFrom(enteredAt: string): number {
  if (!enteredAt) return 1;
  const entered = new Date(enteredAt).getTime();
  if (Number.isNaN(entered)) return 1;
  const d = Math.floor((TODAY_MS - entered) / 86_400_000);
  return Math.max(1, d);
}

function computeVelocityRows(): VelocityRow[] {
  const healthRows = buildHealthBoardRows();

  const rows: VelocityRow[] = [];

  // Build a lookup from instanceId → current-stage enteredAt for source instances
  const srcEnteredAt = new Map<string, string>();
  const srcCurrentStage = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const history = (inst.stageHistory ?? []) as Array<{
      stageId: string;
      enteredAt?: string;
      exitedAt?: string;
    }>;
    if (history.length > 0) {
      const last = history[history.length - 1];
      srcEnteredAt.set(inst.id, last.enteredAt ?? '');
      srcCurrentStage.set(inst.id, last.stageId);
    } else {
      srcCurrentStage.set(inst.id, (inst.currentStage as string | undefined) ?? 'Unknown');
    }
  }

  // Build a lookup for program instances — current phase enteredAt
  const prgEnteredAt = new Map<string, string>();
  const prgCurrentStage = new Map<string, string>();
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const phases = inst.phases as Array<{
      phaseId: number;
      phaseLabel?: string;
      enteredAt?: string;
    }>;
    const currentPhaseObj = phases.find((p) => p.phaseId === inst.currentPhase);
    if (currentPhaseObj) {
      prgEnteredAt.set(inst.id, currentPhaseObj.enteredAt ?? '');
      const label = currentPhaseObj.phaseLabel
        ? `P${currentPhaseObj.phaseId} ${currentPhaseObj.phaseLabel}`
        : `Phase ${currentPhaseObj.phaseId}`;
      prgCurrentStage.set(inst.id, label);
    } else {
      prgCurrentStage.set(inst.id, `Phase ${inst.currentPhase}`);
    }
  }

  for (const hr of healthRows) {
    const enteredAt =
      hr.type === 'source'
        ? (srcEnteredAt.get(hr.id) ?? '')
        : (prgEnteredAt.get(hr.id) ?? '');

    const currentStage =
      hr.type === 'source'
        ? (srcCurrentStage.get(hr.id) ?? hr.stageLabel ?? 'Unknown')
        : (prgCurrentStage.get(hr.id) ?? hr.phaseLabel ?? 'Unknown');

    const dwellDays = dwellDaysFrom(enteredAt);

    const gatesMet = hr.gatesMet;
    const gatesTotal = hr.gatesTotal;

    const gateVelocity = gatesMet / dwellDays;

    const projectedCompletion =
      gatesTotal > gatesMet
        ? Math.ceil((gatesTotal - gatesMet) / Math.max(gateVelocity, 0.01))
        : 0;

    // Evidence count: fixture evidence + ingested evidence
    const ingested = getEvidenceFor(hr.id).length;
    let fixtureCount = 0;
    if (hr.type === 'source') {
      const srcInst = SOURCE_EVENT_INSTANCES.find((i) => i.id === hr.id);
      fixtureCount = (srcInst?.evidence as unknown[] | undefined)?.length ?? 0;
    } else {
      const prgInst = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === hr.id);
      fixtureCount = (prgInst?.evidence as unknown[] | undefined)?.length ?? 0;
    }
    const evidenceCount = fixtureCount + ingested;

    rows.push({
      instanceId: hr.id,
      instanceName: hr.label,
      instanceType: hr.type,
      currentStage,
      enteredAt,
      dwellDays,
      gatesMet,
      gatesTotal,
      gateVelocity,
      projectedCompletion,
      evidenceCount,
    });
  }

  // Sort: fastest velocity first (descending)
  rows.sort((a, b) => b.gateVelocity - a.gateVelocity);

  return rows;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtVelocity(v: number): string {
  return v.toFixed(3);
}

function fmtDays(d: number): string {
  return `${d}d`;
}

// ─── Cell styles ─────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left' as const,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap' as const,
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle' as const,
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  rows,
}: {
  rows: VelocityRow[];
}) {
  if (rows.length === 0) return null;

  const avgVelocity =
    rows.reduce((sum, r) => sum + r.gateVelocity, 0) / rows.length;

  // Fastest = rows[0] (sorted descending), slowest = last row
  const fastest = rows[0];
  const slowest = rows[rows.length - 1];

  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap' as const,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.navy,
          fontWeight: 600,
        }}
      >
        {rows.length} instance{rows.length === 1 ? '' : 's'}
      </span>

      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>·</span>

      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        Avg velocity:{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 600, color: COLORS.ink }}>
          {fmtVelocity(avgVelocity)} gates/day
        </span>
      </span>

      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>·</span>

      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        Fastest:{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 600, color: COLORS.mintInk }}>
          {fastest.instanceName}
        </span>{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          ({fmtVelocity(fastest.gateVelocity)})
        </span>
      </span>

      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>·</span>

      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        Slowest:{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 600, color: COLORS.coralInk }}>
          {slowest.instanceName}
        </span>{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          ({fmtVelocity(slowest.gateVelocity)})
        </span>
      </span>
    </div>
  );
}

// ─── VelocityTable ────────────────────────────────────────────────────────────

function VelocityTable({ rows }: { rows: VelocityRow[] }) {
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
            Gate velocity ranking
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Fastest gate advancement first — gates met per day of stage/phase dwell · as of 29 Apr 2026
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Rank</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Current stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Gates met</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Dwell days</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Velocity (g/day)</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Proj. days to complete</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isComplete = row.gatesTotal > 0 && row.gatesMet >= row.gatesTotal;
              const isZeroVelocity = row.gateVelocity === 0;
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
                        background: row.instanceType === 'source' ? COLORS.skyPale : COLORS.amberSoft,
                        color: row.instanceType === 'source' ? COLORS.navy : COLORS.amberInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 8px',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {row.instanceType}
                    </span>
                  </td>

                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: `${COLORS.ink}08`,
                        color: COLORS.ink,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {row.currentStage}
                    </span>
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right' as const,
                      color: isComplete ? COLORS.mintInk : `${COLORS.ink}cc`,
                      fontWeight: isComplete ? 700 : 400,
                    }}
                  >
                    {row.gatesMet}/{row.gatesTotal}
                  </td>

                  <td style={{ ...MONO_CELL, textAlign: 'right' as const }}>
                    {fmtDays(row.dwellDays)}
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right' as const,
                      fontWeight: idx === 0 ? 700 : 400,
                      color:
                        isZeroVelocity
                          ? COLORS.coralInk
                          : idx === 0
                            ? COLORS.mintInk
                            : `${COLORS.ink}cc`,
                    }}
                  >
                    {fmtVelocity(row.gateVelocity)}
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right' as const,
                      paddingRight: SPACING.lg,
                      color:
                        isComplete
                          ? COLORS.mintInk
                          : row.projectedCompletion > 60
                            ? COLORS.coralInk
                            : `${COLORS.ink}cc`,
                    }}
                  >
                    {isComplete ? '—' : `${row.projectedCompletion}d`}
                  </td>

                  <td style={{ ...MONO_CELL, textAlign: 'right' as const }}>
                    {row.evidenceCount}
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

// ─── SlowestInstances ─────────────────────────────────────────────────────────

function SlowestInstances({ rows }: { rows: VelocityRow[] }) {
  // Bottom 5 by velocity (slowest = last in the already-sorted desc array)
  const bottom5 = rows.slice(-5).reverse();
  if (bottom5.length === 0) return null;

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
            Slowest instances
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.coralInk}bb`,
              marginTop: 4,
            }}
          >
            Bottom 5 by gate velocity — zero velocity means gates are not advancing
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.coralInk}99` }}>
          {bottom5.length} instance{bottom5.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ padding: `${SPACING.sm} ${SPACING.md}` }}>
        {bottom5.map((row) => (
          <div
            key={row.instanceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.sm}`,
              borderBottom: `1px solid ${COLORS.coralInk}14`,
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
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.coralInk}bb`,
                flex: '0 0 auto',
                minWidth: 140,
              }}
            >
              {row.currentStage}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.coralInk,
                fontWeight: 700,
                flex: '0 0 auto',
              }}
            >
              {fmtVelocity(row.gateVelocity)} g/day
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.coralInk}99`,
                flex: '0 0 auto',
              }}
            >
              {row.gatesMet}/{row.gatesTotal} gates · {fmtDays(row.dwellDays)} dwell
            </span>
            {row.projectedCompletion > 0 && (
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.coralInk}bb`,
                  flex: '0 0 auto',
                }}
              >
                Proj. {row.projectedCompletion}d to complete
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateVelocityPage() {
  const rows = computeVelocityRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Health Board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Gate velocity"
        title="Gate velocity"
        subtitle="Gates satisfied per day of stage dwell — efficiency of gate advancement across all instances. Fastest instances first; projected completion at current velocity."
      >
        <SummaryStrip rows={rows} />
        <VelocityTable rows={rows} />
        <SlowestInstances rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
