// /admin/reasoning/gate-export — Exportable gate status matrix.
//
// Pure server component. Renders a complete matrix of all instances × all gate
// criteria with met/waived/unmet/N/A status cells. Oriented as instances (rows)
// × gate criteria (columns) — the inverse of gate-status-matrix which has
// criteria as rows. Columns are capped at 15 to prevent overflow; a "+N more"
// note is shown when criteria exceed the cap.
//
// Data sources:
//   SOURCE_EVENT_INSTANCES + APEX_RETAIL_PROGRAM_INSTANCES
//   getAllLifecyclePatterns() + evaluateStageGates + getWaiversForInstance

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
  title: 'Gate export · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum criteria columns to display before truncating with "+N more" note. */
const MAX_DISPLAY_CRITERIA = 15;

// ─── Data types ───────────────────────────────────────────────────────────────

type CellStatus = 'met' | 'waived' | 'unmet' | 'na';

interface CriterionCol {
  criterionId: string;
  description: string;
  patternId: string;
  stageId: string;
}

interface InstanceRow {
  id: string;
  name: string;
  patternId: string;
  type: 'source' | 'program';
}

// ─── Data computation ─────────────────────────────────────────────────────────

/** Collect all unique gate criteria (hard + soft) across all lifecycle patterns. */
function collectAllCriteria(): CriterionCol[] {
  const seen = new Set<string>();
  const cols: CriterionCol[] = [];

  for (const pattern of getAllLifecyclePatterns()) {
    for (const criterion of pattern.gateCriteria) {
      if (!seen.has(criterion.id)) {
        seen.add(criterion.id);
        cols.push({
          criterionId: criterion.id,
          description: criterion.description,
          patternId: pattern.patternId,
          stageId: criterion.stageId,
        });
      }
    }
  }

  return cols;
}

/** Build instance row descriptors for all source and program instances. */
function buildInstanceRows(): InstanceRow[] {
  const rows: InstanceRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    rows.push({ id: inst.id, name: inst.name, patternId: inst.patternId, type: 'source' });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    rows.push({ id: inst.id, name: inst.name, patternId: inst.patternId, type: 'program' });
  }

  return rows;
}

/**
 * Augment an evidence map with waivers from the in-memory waiver store.
 * Mutates the map in place.
 */
function applyWaivers(instanceId: string, evidenceMap: Record<string, unknown>): void {
  const waivers = getWaiversForInstance(instanceId);
  for (const waiver of waivers) {
    evidenceMap[`${waiver.criterionId}_waived`] = true;
  }
}

/**
 * Evaluate all gate criteria for an instance's pattern.
 * Returns a map of criterionId → CellStatus.
 */
function evaluateInstance(
  patternId: string,
  evidenceMap: Record<string, unknown>,
): Map<string, CellStatus> {
  const result = new Map<string, CellStatus>();

  const pattern = getAllLifecyclePatterns().find((p) => p.patternId === patternId);
  if (pattern === undefined) return result;

  const stageIds = [...new Set(pattern.stages.map((s) => s.id))];
  const allEvaluations = stageIds.flatMap((stageId) =>
    evaluateStageGates(pattern, stageId, evidenceMap),
  );

  for (const evaluation of allEvaluations) {
    let cellStatus: CellStatus;
    if (evaluation.status === 'met') {
      cellStatus = 'met';
    } else if (evaluation.status === 'waived') {
      cellStatus = 'waived';
    } else {
      cellStatus = 'unmet';
    }
    result.set(evaluation.criterionId, cellStatus);
  }

  return result;
}

interface MatrixData {
  criteria: CriterionCol[];
  displayCriteria: CriterionCol[];
  hiddenCriteriaCount: number;
  instances: InstanceRow[];
  /** cells[instanceId][criterionId] = CellStatus */
  cells: Map<string, Map<string, CellStatus>>;
  metCount: number;
  waivedCount: number;
  unmetCount: number;
  naCount: number;
}

function buildMatrixData(): MatrixData {
  const criteria = collectAllCriteria();
  const instances = buildInstanceRows();
  const displayCriteria = criteria.slice(0, MAX_DISPLAY_CRITERIA);
  const hiddenCriteriaCount = Math.max(0, criteria.length - MAX_DISPLAY_CRITERIA);

  const cells = new Map<string, Map<string, CellStatus>>();

  let metCount = 0;
  let waivedCount = 0;
  let unmetCount = 0;
  let naCount = 0;

  // Initialize all display cells to 'na'
  for (const inst of instances) {
    const row = new Map<string, CellStatus>();
    for (const cr of displayCriteria) {
      row.set(cr.criterionId, 'na');
    }
    cells.set(inst.id, row);
  }

  // Evaluate source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const evidenceMap = buildEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const evalMap = evaluateInstance(inst.patternId, evidenceMap);
    const row = cells.get(inst.id);
    if (row === undefined) continue;
    for (const cr of displayCriteria) {
      const status = evalMap.get(cr.criterionId);
      if (status !== undefined) {
        row.set(cr.criterionId, status);
      }
    }
  }

  // Evaluate program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const evidenceMap = buildProgramEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const evalMap = evaluateInstance(inst.patternId, evidenceMap);
    const row = cells.get(inst.id);
    if (row === undefined) continue;
    for (const cr of displayCriteria) {
      const status = evalMap.get(cr.criterionId);
      if (status !== undefined) {
        row.set(cr.criterionId, status);
      }
    }
  }

  // Tally counts across display cells
  for (const [, instanceMap] of cells) {
    for (const [, status] of instanceMap) {
      if (status === 'met') metCount++;
      else if (status === 'waived') waivedCount++;
      else if (status === 'unmet') unmetCount++;
      else naCount++;
    }
  }

  return {
    criteria,
    displayCriteria,
    hiddenCriteriaCount,
    instances,
    cells,
    metCount,
    waivedCount,
    unmetCount,
    naCount,
  };
}

// ─── Cell helpers ─────────────────────────────────────────────────────────────

function cellStyle(status: CellStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 28,
    height: 28,
    minWidth: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 3,
    flexShrink: 0,
  };

  switch (status) {
    case 'met':
      return { ...base, background: SHELL.MINT_BG, color: SHELL.MINT_TEXT };
    case 'waived':
      return { ...base, background: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT };
    case 'unmet':
      return { ...base, background: SHELL.RUST_BG, color: SHELL.RUST_TEXT };
    case 'na':
    default:
      return { ...base, background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT };
  }
}

function cellGlyph(status: CellStatus): string {
  switch (status) {
    case 'met': return '✓';
    case 'waived': return 'W';
    case 'unmet': return '✗';
    case 'na': return '—';
  }
}

// ─── Export header ─────────────────────────────────────────────────────────────

function ExportHeader({ data }: { data: MatrixData }) {
  const { criteria, instances, hiddenCriteriaCount } = data;

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
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Gate Status Export Preview
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 14,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          {instances.length} instances × {criteria.length} gate criteria
          {hiddenCriteriaCount > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}88`,
                marginLeft: 10,
              }}
            >
              · showing first {MAX_DISPLAY_CRITERIA}, +{hiddenCriteriaCount} more
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
          background: `${COLORS.ink}06`,
          borderRadius: RADIUS.md,
          padding: '6px 12px',
          border: `1px solid ${COLORS.ink}10`,
        }}
      >
        Full export via /api/reasoning/gate-status-matrix
      </div>
    </div>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const items: Array<{ status: CellStatus; label: string }> = [
    { status: 'met', label: 'Met' },
    { status: 'waived', label: 'Waived' },
    { status: 'unmet', label: 'Unmet' },
    { status: 'na', label: 'N/A' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: `${COLORS.ink}88`,
        }}
      >
        Legend
      </span>
      {items.map((item) => (
        <span
          key={item.status}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={cellStyle(item.status)}>{cellGlyph(item.status)}</span>
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.ink }}>
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Gate matrix ───────────────────────────────────────────────────────────────

const INSTANCE_COL_WIDTH = 280;
const COL_HEADER_HEIGHT = 96;

function GateMatrix({ data }: { data: MatrixData }) {
  const { displayCriteria, instances, cells, hiddenCriteriaCount } = data;

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
          flexWrap: 'wrap',
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
            Gate matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Instances (rows) × gate criteria (columns)
            {hiddenCriteriaCount > 0 && (
              <span style={{ marginLeft: 8, color: SHELL.PEACH_TEXT }}>
                · +{hiddenCriteriaCount} criteria hidden (overflow)
              </span>
            )}
          </div>
        </div>
        <Legend />
      </header>

      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${INSTANCE_COL_WIDTH}px repeat(${displayCriteria.length}, 32px)`,
            minWidth: INSTANCE_COL_WIDTH + displayCriteria.length * 32,
          }}
        >
          {/* ── Sticky header row ── */}

          {/* Top-left corner */}
          <div
            style={{
              position: 'sticky',
              left: 0,
              zIndex: 2,
              background: COLORS.white,
              borderBottom: `1px solid ${COLORS.ink}18`,
              borderRight: `1px solid ${COLORS.ink}18`,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'flex-end',
              minHeight: COL_HEADER_HEIGHT,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: `${COLORS.ink}88`,
              }}
            >
              Instance
            </span>
          </div>

          {/* Criterion column headers — rotated */}
          {displayCriteria.map((cr) => (
            <div
              key={cr.criterionId}
              title={`${cr.criterionId}: ${cr.description}`}
              style={{
                borderBottom: `1px solid ${COLORS.ink}18`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                minHeight: COL_HEADER_HEIGHT,
                paddingBottom: 6,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 9,
                  color: `${COLORS.ink}cc`,
                  whiteSpace: 'nowrap',
                  maxHeight: 88,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {cr.criterionId}
              </span>
            </div>
          ))}

          {/* ── Data rows ── */}
          {instances.map((inst, rowIdx) => {
            const rowBg = rowIdx % 2 === 0 ? COLORS.white : `${COLORS.ink}04`;
            const instanceMap = cells.get(inst.id);

            return (
              <>
                {/* Sticky instance label cell */}
                <div
                  key={`label-${inst.id}`}
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    background: rowBg,
                    borderBottom: `1px solid ${COLORS.ink}0d`,
                    borderRight: `1px solid ${COLORS.ink}18`,
                    padding: `4px ${SPACING.md}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 2,
                    minHeight: 36,
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: COLORS.navy,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {inst.id}
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 10,
                      color: `${COLORS.ink}99`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {inst.name.length > 36 ? `${inst.name.slice(0, 36)}…` : inst.name}
                    <span
                      style={{
                        marginLeft: 6,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 9,
                        color: `${COLORS.ink}66`,
                        background: `${COLORS.ink}0a`,
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}
                    >
                      {inst.type}
                    </span>
                  </span>
                </div>

                {/* Status cells */}
                {displayCriteria.map((cr) => {
                  const status: CellStatus = instanceMap?.get(cr.criterionId) ?? 'na';
                  return (
                    <div
                      key={`cell-${inst.id}-${cr.criterionId}`}
                      title={`${inst.name} × ${cr.criterionId}: ${status}`}
                      style={{
                        background: rowBg,
                        borderBottom: `1px solid ${COLORS.ink}0d`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 2,
                        minHeight: 36,
                      }}
                    >
                      <span style={cellStyle(status)}>{cellGlyph(status)}</span>
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Export note ───────────────────────────────────────────────────────────────

function ExportNote() {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: `${COLORS.ink}99`,
          marginBottom: SPACING.sm,
        }}
      >
        CSV Export
      </div>
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.sm}`,
          lineHeight: 1.6,
        }}
      >
        The full gate status matrix — all instances × all criteria — is available as a
        machine-readable CSV via the reasoning API. Each row is one instance; each column
        is one gate criterion ID; values are{' '}
        <code
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, background: `${COLORS.ink}08`, borderRadius: 3, padding: '1px 5px' }}
        >
          met
        </code>
        ,{' '}
        <code
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, background: `${COLORS.ink}08`, borderRadius: 3, padding: '1px 5px' }}
        >
          waived
        </code>
        ,{' '}
        <code
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, background: `${COLORS.ink}08`, borderRadius: 3, padding: '1px 5px' }}
        >
          unmet
        </code>
        , or{' '}
        <code
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, background: `${COLORS.ink}08`, borderRadius: 3, padding: '1px 5px' }}
        >
          na
        </code>
        .
      </p>
      <div
        style={{
          background: `${COLORS.ink}06`,
          border: `1px solid ${COLORS.ink}10`,
          borderRadius: RADIUS.md,
          padding: `${SPACING.sm} ${SPACING.md}`,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: COLORS.navy,
          letterSpacing: '0.01em',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        curl /api/reasoning/gate-status-matrix?format=csv
      </div>
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          margin: `${SPACING.sm} 0 0`,
          lineHeight: 1.5,
        }}
      >
        Append{' '}
        <code
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, background: `${COLORS.ink}08`, borderRadius: 3, padding: '1px 5px' }}
        >
          &amp;gate_type=hard
        </code>{' '}
        to filter to hard gates only.
      </p>
    </section>
  );
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: MatrixData }) {
  const { instances, criteria, metCount, waivedCount, unmetCount, naCount } = data;

  const items = [
    { label: 'instances', value: instances.length, color: COLORS.ink },
    { label: 'criteria', value: criteria.length, color: COLORS.ink },
    { label: 'met', value: metCount, color: SHELL.MINT_TEXT },
    { label: 'waived', value: waivedCount, color: SHELL.PEACH_TEXT },
    { label: 'unmet', value: unmetCount, color: SHELL.RUST_TEXT },
    { label: 'n/a', value: naCount, color: `${COLORS.ink}88` },
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateExportPage() {
  const data = buildMatrixData();

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
        title="Gate status export"
        subtitle="Exportable gate status matrix — all instances × all criteria. Oriented as instances (rows) × gate criteria (columns)."
      >
        <ExportHeader data={data} />
        <SummaryStrip data={data} />
        <GateMatrix data={data} />
        <ExportNote />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
