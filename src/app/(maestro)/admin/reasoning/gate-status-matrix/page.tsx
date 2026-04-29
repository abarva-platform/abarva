// /admin/reasoning/gate-status-matrix — Hard gate criteria × instances matrix.
//
// Server component. Renders a dense grid showing the met/waived/unmet/N/A status
// of every hard gate criterion across all source and program instances.
//
// Rows    = hard gate criteria (unique across all lifecycle patterns)
// Columns = all source + program instances
// Cell    = Met (mint), Waived (amber/peach), Unmet (rust), N/A (gray)

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
import type { LifecyclePatternSeed, GateCriterion } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate status matrix · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

type CellStatus = 'met' | 'waived' | 'unmet' | 'na';

interface CriterionRow {
  criterionId: string;
  description: string;
  patternId: string;
  stageId: string;
}

interface InstanceCol {
  id: string;
  name: string;
  patternId: string;
  abbr: string;
}

interface MatrixCell {
  status: CellStatus;
}

// ─── Data computation ─────────────────────────────────────────────────────────

/** Collect all unique hard gate criteria across all lifecycle patterns. */
function collectHardCriteria(): CriterionRow[] {
  const seen = new Set<string>();
  const rows: CriterionRow[] = [];

  for (const pattern of getAllLifecyclePatterns()) {
    for (const criterion of pattern.gateCriteria) {
      if (criterion.gateType === 'hard' && !seen.has(criterion.id)) {
        seen.add(criterion.id);
        rows.push({
          criterionId: criterion.id,
          description: criterion.description,
          patternId: pattern.patternId,
          stageId: criterion.stageId,
        });
      }
    }
  }

  return rows;
}

/** Build instance column descriptors for all source and program instances. */
function buildInstanceCols(): InstanceCol[] {
  const cols: InstanceCol[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    cols.push({
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      abbr: inst.name.slice(0, 12),
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    cols.push({
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      abbr: inst.name.slice(0, 12),
    });
  }

  return cols;
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
 * For a given instance and its pattern, evaluate all hard gate criteria that
 * belong to this pattern. Returns a map of criterionId → CellStatus.
 */
function evaluateInstanceCriteria(
  patternId: string,
  evidenceMap: Record<string, unknown>,
  criteria: CriterionRow[],
): Map<string, CellStatus> {
  const result = new Map<string, CellStatus>();

  const pattern = getAllLifecyclePatterns().find((p) => p.patternId === patternId);
  if (pattern === undefined) return result;

  // Evaluate criteria for every stage in this pattern
  const stageIds = [...new Set(pattern.stages.map((s) => s.id))];

  const allEvaluations = stageIds.flatMap((stageId) =>
    evaluateStageGates(pattern, stageId, evidenceMap),
  );

  for (const evaluation of allEvaluations) {
    // Only care about hard gates
    if (evaluation.gateType !== 'hard') continue;

    const status = evaluation.status;
    let cellStatus: CellStatus;
    if (status === 'met') {
      cellStatus = 'met';
    } else if (status === 'waived') {
      cellStatus = 'waived';
    } else {
      cellStatus = 'unmet';
    }

    result.set(evaluation.criterionId, cellStatus);
  }

  return result;
}

interface MatrixData {
  criteria: CriterionRow[];
  instances: InstanceCol[];
  // cells[criterionId][instanceId] = CellStatus
  cells: Map<string, Map<string, CellStatus>>;
  metCount: number;
  waivedCount: number;
  unmetCount: number;
  naCount: number;
}

function buildMatrixData(): MatrixData {
  const criteria = collectHardCriteria();
  const instances = buildInstanceCols();
  const cells = new Map<string, Map<string, CellStatus>>();

  let metCount = 0;
  let waivedCount = 0;
  let unmetCount = 0;
  let naCount = 0;

  // Initialize all cells to 'na'
  for (const cr of criteria) {
    const row = new Map<string, CellStatus>();
    for (const inst of instances) {
      row.set(inst.id, 'na');
    }
    cells.set(cr.criterionId, row);
  }

  // Evaluate source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const evidenceMap = buildEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const evalMap = evaluateInstanceCriteria(inst.patternId, evidenceMap, criteria);

    for (const [criterionId, status] of evalMap) {
      const row = cells.get(criterionId);
      if (row !== undefined) {
        row.set(inst.id, status);
      }
    }
  }

  // Evaluate program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const evidenceMap = buildProgramEvidenceMap(inst);
    applyWaivers(inst.id, evidenceMap);
    const evalMap = evaluateInstanceCriteria(inst.patternId, evidenceMap, criteria);

    for (const [criterionId, status] of evalMap) {
      const row = cells.get(criterionId);
      if (row !== undefined) {
        row.set(inst.id, status);
      }
    }
  }

  // Tally counts
  for (const [, instanceMap] of cells) {
    for (const [, status] of instanceMap) {
      if (status === 'met') metCount++;
      else if (status === 'waived') waivedCount++;
      else if (status === 'unmet') unmetCount++;
      else naCount++;
    }
  }

  return { criteria, instances, cells, metCount, waivedCount, unmetCount, naCount };
}

// ─── Cell styling ──────────────────────────────────────────────────────────────

function cellStyle(status: CellStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 32,
    height: 32,
    minWidth: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 4,
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
    case 'waived': return '~';
    case 'unmet': return '✗';
    case 'na': return '·';
  }
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  criteria,
  instances,
  metCount,
  waivedCount,
  unmetCount,
}: {
  criteria: CriterionRow[];
  instances: InstanceCol[];
  metCount: number;
  waivedCount: number;
  unmetCount: number;
}) {
  const items: Array<{ label: string; value: number; color: string }> = [
    { label: 'hard gates', value: criteria.length, color: COLORS.ink },
    { label: 'instances', value: instances.length, color: COLORS.ink },
    { label: 'met', value: metCount, color: SHELL.MINT_TEXT },
    { label: 'waived', value: waivedCount, color: SHELL.PEACH_TEXT },
    { label: 'unmet', value: unmetCount, color: SHELL.RUST_TEXT },
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
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
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

// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const items: Array<{ status: CellStatus; label: string }> = [
    { status: 'met', label: 'Met' },
    { status: 'waived', label: 'Waived' },
    { status: 'unmet', label: 'Unmet' },
    { status: 'na', label: 'N/A' },
  ];

  return (
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
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.ink,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Matrix table ──────────────────────────────────────────────────────────────

const STICKY_COL_WIDTH = 340;
const CELL_GAP = 4;
const COL_HEADER_HEIGHT = 120;

function MatrixTable({ data }: { data: MatrixData }) {
  const { criteria, instances, cells } = data;

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
            Hard gate criteria matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            {criteria.length} criteria × {instances.length} instances
          </div>
        </div>
        <Legend />
      </header>

      {/* Scrollable matrix container */}
      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <div
          style={{
            // Grid: sticky criterion column + one column per instance
            display: 'grid',
            gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${instances.length}, 36px)`,
            minWidth: STICKY_COL_WIDTH + instances.length * (32 + CELL_GAP),
          }}
        >
          {/* ── Header row ── */}
          {/* Sticky top-left corner cell */}
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
              Criterion
            </span>
          </div>

          {/* Instance column headers — rotated */}
          {instances.map((inst) => (
            <div
              key={inst.id}
              title={inst.name}
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
                  fontSize: 10,
                  color: `${COLORS.ink}cc`,
                  whiteSpace: 'nowrap',
                  maxHeight: 110,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {inst.abbr}
              </span>
            </div>
          ))}

          {/* ── Data rows ── */}
          {criteria.map((cr, rowIdx) => {
            const rowBg = rowIdx % 2 === 0 ? COLORS.white : `${COLORS.ink}04`;
            const instanceRow = cells.get(cr.criterionId);

            return (
              <>
                {/* Sticky criterion label cell */}
                <div
                  key={`label-${cr.criterionId}`}
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    background: rowBg,
                    borderBottom: `1px solid ${COLORS.ink}0d`,
                    borderRight: `1px solid ${COLORS.ink}18`,
                    padding: `6px ${SPACING.md}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 2,
                    minHeight: 40,
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: COLORS.navy,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cr.criterionId}
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: `${COLORS.ink}99`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: STICKY_COL_WIDTH - 32,
                    }}
                    title={cr.description}
                  >
                    {cr.description.length > 40
                      ? `${cr.description.slice(0, 40)}…`
                      : cr.description}
                  </span>
                </div>

                {/* Status cells */}
                {instances.map((inst) => {
                  const status: CellStatus = instanceRow?.get(inst.id) ?? 'na';
                  return (
                    <div
                      key={`cell-${cr.criterionId}-${inst.id}`}
                      style={{
                        background: rowBg,
                        borderBottom: `1px solid ${COLORS.ink}0d`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 2,
                        minHeight: 40,
                      }}
                      title={`${cr.criterionId} × ${inst.name}: ${status}`}
                    >
                      <span style={cellStyle(status)}>
                        {cellGlyph(status)}
                      </span>
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateStatusMatrixPage() {
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
        title="Gate status matrix"
        subtitle="Hard gate criteria × instances. Met (mint), Waived (amber), Unmet (rust), N/A (gray)."
      >
        <SummaryStrip
          criteria={data.criteria}
          instances={data.instances}
          metCount={data.metCount}
          waivedCount={data.waivedCount}
          unmetCount={data.unmetCount}
        />
        <MatrixTable data={data} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
