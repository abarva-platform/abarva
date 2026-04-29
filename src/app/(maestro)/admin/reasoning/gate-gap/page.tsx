// /admin/reasoning/gate-gap — Current stage gate gap per instance.
//
// Pure server component. For each source and program instance, evaluates the
// hard and soft gates in the instance's current stage and computes:
//   hardGatesNeeded  = count of hard gates defined for the current stage
//   hardGatesMet     = count of hard gates with status 'met' or 'waived'
//   hardGatesGap     = hardGatesNeeded - hardGatesMet
//   advancementReady = hardGatesGap === 0
//
// Instances are sorted by hardGatesGap descending (biggest gap first).
// Ready-to-advance instances are highlighted in a mint card.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { getWaiversForInstance } from '@/app/api/reasoning/gate-waiver/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate gap · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InstanceGapRow {
  id: string;
  name: string;
  kind: 'source' | 'program';
  currentStage: string;
  hardGatesNeeded: number;
  hardGatesMet: number;
  hardGatesGap: number;
  softGatesNeeded: number;
  softGatesMet: number;
  advancementReady: boolean;
  blockingCriterionIds: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function applyWaivers(instanceId: string, evidenceMap: Record<string, unknown>): void {
  const waivers = getWaiversForInstance(instanceId);
  for (const waiver of waivers) {
    evidenceMap[`${waiver.criterionId}_waived`] = true;
  }
}

function computeGapRow(
  id: string,
  name: string,
  kind: 'source' | 'program',
  patternId: string,
  currentStage: string,
  evidenceMap: Record<string, unknown>,
): InstanceGapRow {
  const pattern = getAllLifecyclePatterns().find(
    (p) => p.patternId === patternId || p.id === patternId,
  );

  if (pattern === undefined) {
    return {
      id,
      name,
      kind,
      currentStage,
      hardGatesNeeded: 0,
      hardGatesMet: 0,
      hardGatesGap: 0,
      softGatesNeeded: 0,
      softGatesMet: 0,
      advancementReady: true,
      blockingCriterionIds: [],
    };
  }

  const evaluations = evaluateStageGates(pattern, currentStage, evidenceMap);

  let hardGatesNeeded = 0;
  let hardGatesMet = 0;
  let softGatesNeeded = 0;
  let softGatesMet = 0;
  const blockingCriterionIds: string[] = [];

  for (const ev of evaluations) {
    const isSatisfied = ev.status === 'met' || ev.status === 'waived';
    if (ev.gateType === 'hard') {
      hardGatesNeeded++;
      if (isSatisfied) {
        hardGatesMet++;
      } else {
        blockingCriterionIds.push(ev.criterionId);
      }
    } else {
      softGatesNeeded++;
      if (isSatisfied) {
        softGatesMet++;
      }
    }
  }

  const hardGatesGap = hardGatesNeeded - hardGatesMet;

  return {
    id,
    name,
    kind,
    currentStage,
    hardGatesNeeded,
    hardGatesMet,
    hardGatesGap,
    softGatesNeeded,
    softGatesMet,
    advancementReady: hardGatesGap === 0,
    blockingCriterionIds,
  };
}

function buildGapData(): InstanceGapRow[] {
  const rows: InstanceGapRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const evidenceMap = buildEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    rows.push(
      computeGapRow(inst.id, inst.name, 'source', inst.patternId, inst.currentStage, evidenceMap),
    );
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const evidenceMap = buildProgramEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    // Program instances use phase numbers as stage IDs
    const stageLabel = `phase-${inst.currentPhase}`;
    rows.push(
      computeGapRow(inst.id, inst.name, 'program', inst.patternId, stageLabel, evidenceMap),
    );
  }

  // Sort: biggest gap first, then alphabetical by name
  rows.sort((a, b) => {
    if (b.hardGatesGap !== a.hardGatesGap) return b.hardGatesGap - a.hardGatesGap;
    return a.name.localeCompare(b.name);
  });

  return rows;
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: InstanceGapRow[] }) {
  const total = rows.length;
  const ready = rows.filter((r) => r.advancementReady).length;
  const blocked = total - ready;
  const totalGap = rows.reduce((acc, r) => acc + r.hardGatesGap, 0);
  const avgGap = total > 0 ? (totalGap / total).toFixed(1) : '0.0';

  const items: Array<{ label: string; value: string; color: string }> = [
    { label: 'instances', value: String(total), color: COLORS.ink },
    { label: 'ready to advance', value: String(ready), color: SHELL.MINT_TEXT },
    { label: 'blocked', value: String(blocked), color: SHELL.RUST_TEXT },
    { label: 'avg gap (hard gates)', value: avgGap, color: COLORS.navy },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: item.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Ready-to-advance card ──────────────────────────────────────────────────────

function ReadyToAdvanceCard({ rows }: { rows: InstanceGapRow[] }) {
  const ready = rows.filter((r) => r.advancementReady);

  return (
    <section
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.MINT_LINE}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.MINT_TEXT,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Ready to advance
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.MINT_TEXT,
            background: `${SHELL.MINT_LINE}88`,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
          }}
        >
          {ready.length} instance{ready.length !== 1 ? 's' : ''}
        </span>
      </header>

      {ready.length === 0 ? (
        <div
          style={{
            padding: `${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.MINT_TEXT,
          }}
        >
          No instances are currently ready to advance.
        </div>
      ) : (
        <ul
          style={{
            margin: 0,
            padding: `${SPACING.sm} ${SPACING.lg}`,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          {ready.map((row) => (
            <li
              key={row.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: SPACING.sm,
                padding: `${SPACING.xs} 0`,
                borderBottom: `1px solid ${SHELL.MINT_LINE}55`,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: SHELL.MINT_TEXT,
                  minWidth: 80,
                  flexShrink: 0,
                }}
              >
                {row.id}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: SHELL.MINT_TEXT,
                  fontWeight: 600,
                }}
              >
                {row.name}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${SHELL.MINT_TEXT}aa`,
                }}
              >
                {row.currentStage}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: SHELL.MINT_TEXT,
                  background: `${SHELL.MINT_LINE}88`,
                  borderRadius: RADIUS.pill,
                  padding: '1px 8px',
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                {row.kind}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Gap table ────────────────────────────────────────────────────────────────

function pillStyle(ready: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    padding: '2px 10px',
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 600,
    background: ready ? SHELL.MINT_BG : SHELL.RUST_BG,
    color: ready ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
    border: `1px solid ${ready ? SHELL.MINT_LINE : SHELL.RUST_BG}`,
    whiteSpace: 'nowrap' as const,
  };
}

function GapTable({ rows }: { rows: InstanceGapRow[] }) {
  const thStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    padding: `${SPACING.sm} ${SPACING.md}`,
    textAlign: 'left',
    borderBottom: `1px solid ${COLORS.ink}14`,
    whiteSpace: 'nowrap',
  };

  const tdBase: React.CSSProperties = {
    padding: `10px ${SPACING.md}`,
    verticalAlign: 'middle',
    borderBottom: `1px solid ${COLORS.ink}0d`,
  };

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
          Gate gap by instance
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Sorted by hard gate gap descending — biggest blocker first
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 820,
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Instance</th>
              <th style={thStyle}>Current stage</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Hard gates met / needed</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Gap</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Soft gates met / needed</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Ready?</th>
              <th style={thStyle}>Blocking gates</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
              return (
                <tr key={row.id} style={{ background: rowBg }}>
                  {/* Instance */}
                  <td style={tdBase}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: COLORS.navy,
                        fontWeight: 600,
                      }}
                    >
                      {row.id}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        color: COLORS.ink,
                        marginTop: 1,
                      }}
                    >
                      {row.name}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                        marginTop: 1,
                      }}
                    >
                      {row.kind}
                    </div>
                  </td>

                  {/* Current stage */}
                  <td style={tdBase}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        color: COLORS.ink,
                      }}
                    >
                      {row.currentStage}
                    </span>
                  </td>

                  {/* Hard gates met / needed */}
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        color: row.hardGatesMet === row.hardGatesNeeded && row.hardGatesNeeded > 0
                          ? SHELL.MINT_TEXT
                          : COLORS.ink,
                      }}
                    >
                      {row.hardGatesMet} / {row.hardGatesNeeded}
                    </span>
                  </td>

                  {/* Gap */}
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 20,
                        letterSpacing: '-0.02em',
                        color: row.hardGatesGap === 0
                          ? SHELL.MINT_TEXT
                          : row.hardGatesGap >= 3
                            ? SHELL.RUST_TEXT
                            : COLORS.ink,
                        fontWeight: row.hardGatesGap > 0 ? 600 : 400,
                      }}
                    >
                      {row.hardGatesGap}
                    </span>
                  </td>

                  {/* Soft gates met / needed */}
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        color: `${COLORS.ink}99`,
                      }}
                    >
                      {row.softGatesMet} / {row.softGatesNeeded}
                    </span>
                  </td>

                  {/* Ready pill */}
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span style={pillStyle(row.advancementReady)}>
                      {row.advancementReady ? 'Ready' : 'Blocked'}
                    </span>
                  </td>

                  {/* Blocking gates */}
                  <td style={tdBase}>
                    {row.blockingCriterionIds.length === 0 ? (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: `${COLORS.ink}55`,
                        }}
                      >
                        —
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: SHELL.RUST_TEXT,
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.blockingCriterionIds.join(', ')}
                      </span>
                    )}
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

export default function GateGapPage() {
  const rows = buildGapData();

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
        eyebrow="Reasoning · Admin"
        title="Gate gap"
        subtitle="Current stage hard gate gap per instance — how many hard gates remain before advancement, sorted by biggest gap first."
      >
        <SummaryStrip rows={rows} />
        <ReadyToAdvanceCard rows={rows} />
        <GapTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
