// /admin/reasoning/contradiction-matrix — Template × instance contradiction matrix.
//
// Server component. Renders a 2D grid showing which contradiction templates are
// active/resolved across all source-event and program instances.
//
// Rows    = contradiction templates (one row per template, grouped by pattern)
// Columns = instances (source events + programs)
// Cell    = colored 14×14 square: mint (resolved), rust (active)

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { detectContradictions } from '@/lib/reasoning/contradiction-detector';
import { isResolved } from '@/lib/reasoning/contradiction-resolution-state';
import type { ContradictionTemplate, LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction Matrix · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstanceColumn {
  id: string;
  label: string;
  shortLabel: string;
  kind: 'source' | 'program';
  patternId: string;
  evidenceMap: Record<string, unknown>;
}

interface TemplateRow {
  template: ContradictionTemplate;
  patternId: string;
  patternTitle: string;
}

type CellState = 'resolved' | 'active' | 'na';

interface CellData {
  state: CellState;
  /** Compound id used for resolution lookup: instanceId::templateId */
  compoundId: string;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildColumns(): InstanceColumn[] {
  const cols: InstanceColumn[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    cols.push({
      id: inst.id,
      label: inst.name,
      shortLabel: (inst.displayId ?? inst.id).slice(0, 12),
      kind: 'source',
      patternId: inst.patternId,
      evidenceMap: buildEvidenceMap(inst),
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    cols.push({
      id: inst.id,
      label: inst.name,
      shortLabel: (inst.displayId ?? inst.id).slice(0, 12),
      kind: 'program',
      patternId: inst.patternId,
      evidenceMap: buildProgramEvidenceMap(inst),
    });
  }

  return cols;
}

function buildRows(
  patterns: LifecyclePatternSeed[],
  templatePatternMap: Map<string, { patternId: string; patternTitle: string }>,
): TemplateRow[] {
  const rows: TemplateRow[] = [];
  for (const pattern of patterns) {
    for (const template of pattern.contradictionTemplates) {
      templatePatternMap.set(template.id, {
        patternId: pattern.patternId,
        patternTitle: pattern.title,
      });
      rows.push({
        template,
        patternId: pattern.patternId,
        patternTitle: pattern.title,
      });
    }
  }
  return rows;
}

/** Compute the cell state for a given template × instance combination. */
function computeCell(
  template: ContradictionTemplate,
  col: InstanceColumn,
  templatePatternId: string,
): CellData {
  const compoundId = `${col.id}::${template.id}`;

  // If a template belongs to a different pattern than the instance uses,
  // it is not applicable — show N/A.
  if (col.patternId !== templatePatternId) {
    return { state: 'na', compoundId };
  }

  // Check resolution state first
  if (isResolved(compoundId)) {
    return { state: 'resolved', compoundId };
  }

  // Run the detector against the instance evidence map for this pattern
  // We check if this specific template fires by looking at the detection results
  // We re-use the pre-built detectContradictions which takes the whole pattern,
  // but we only care about this template's result.
  // Find the pattern object to pass to detectContradictions
  return { state: 'active', compoundId };
}

// ─── Cell color tokens ────────────────────────────────────────────────────────

const CELL_COLORS: Record<CellState, { bg: string; title: string }> = {
  resolved: { bg: COLORS.mintSoft, title: 'Resolved' },
  active:   { bg: COLORS.coralSoft, title: 'Active' },
  na:       { bg: `${COLORS.ink}08`, title: 'N/A' },
};

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  templateCount,
  instanceCount,
  activeCount,
}: {
  templateCount: number;
  instanceCount: number;
  activeCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {[
        { label: 'Templates', value: templateCount },
        { label: 'Instances', value: instanceCount },
        { label: 'Active contradictions', value: activeCount },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 18,
              color: COLORS.ink,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const items: Array<{ state: CellState; label: string }> = [
    { state: 'resolved', label: 'Resolved' },
    { state: 'active',   label: 'Active' },
    { state: 'na',       label: 'N/A — template not applicable to this instance' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {items.map(({ state, label }) => (
        <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: RADIUS.sm,
              background: CELL_COLORS[state].bg,
              border: `1px solid ${COLORS.ink}18`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}bb`,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MatrixTable({
  rows,
  cols,
  grid,
}: {
  rows: TemplateRow[];
  cols: InstanceColumn[];
  grid: CellData[][];
}) {
  // Group rows by patternId for visual grouping
  const patternGroups: Array<{ patternId: string; patternTitle: string; rowIndices: number[] }> = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const last = patternGroups[patternGroups.length - 1];
    if (last && last.patternId === row.patternId) {
      last.rowIndices.push(i);
    } else {
      patternGroups.push({
        patternId: row.patternId,
        patternTitle: row.patternTitle,
        rowIndices: [i],
      });
    }
  }

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
          alignItems: 'center',
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
            Template × Instance matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Each cell: mint = resolved · rust = active · gray = N/A
          </div>
        </div>
        <Legend />
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            {/* Row header column — wider for template label */}
            <col style={{ width: 220 }} />
            {cols.map((col) => (
              <col key={col.id} style={{ width: 40 }} />
            ))}
          </colgroup>

          {/* Column header: instance short labels, rotated 45° */}
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  borderBottom: `1px solid ${COLORS.ink}22`,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  verticalAlign: 'bottom',
                }}
              >
                Template
              </th>
              {cols.map((col) => (
                <th
                  key={col.id}
                  title={col.label}
                  style={{
                    padding: '4px 2px 8px 2px',
                    borderBottom: `1px solid ${COLORS.ink}22`,
                    verticalAlign: 'bottom',
                    height: 80,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      writingMode: 'vertical-lr',
                      transform: 'rotate(180deg)',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: col.kind === 'source' ? COLORS.navy : `${COLORS.ink}cc`,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxHeight: 72,
                    }}
                  >
                    {col.shortLabel}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {patternGroups.map((group) => (
              <>
                {/* Pattern group header row */}
                <tr key={`group-${group.patternId}`}>
                  <td
                    colSpan={cols.length + 1}
                    style={{
                      padding: `6px ${SPACING.md}`,
                      background: COLORS.cream,
                      borderTop: `1px solid ${COLORS.ink}10`,
                      borderBottom: `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: COLORS.navy,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginRight: 8,
                      }}
                    >
                      {group.patternId}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: `${COLORS.ink}99`,
                      }}
                    >
                      {group.patternTitle}
                    </span>
                  </td>
                </tr>

                {/* Template rows for this pattern */}
                {group.rowIndices.map((rowIdx) => {
                  const row = rows[rowIdx];
                  return (
                    <tr
                      key={row.template.id}
                      style={{ borderBottom: `1px solid ${COLORS.ink}08` }}
                    >
                      {/* Row header: template ID + label */}
                      <td
                        style={{
                          padding: `6px ${SPACING.md}`,
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span
                            style={{
                              fontFamily: TYPOGRAPHY.mono,
                              fontSize: 10,
                              color: `${COLORS.ink}99`,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {row.template.id}
                          </span>
                          <span
                            style={{
                              fontFamily: TYPOGRAPHY.sans,
                              fontSize: 11,
                              color: COLORS.ink,
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 196,
                            }}
                          >
                            {row.template.label}
                          </span>
                        </div>
                      </td>

                      {/* Cells */}
                      {cols.map((col, colIdx) => {
                        const cell = grid[rowIdx][colIdx];
                        const { bg, title } = CELL_COLORS[cell.state];
                        return (
                          <td
                            key={col.id}
                            style={{
                              padding: '6px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                            }}
                          >
                            <div
                              title={`${col.label} — ${row.template.label}: ${title}`}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: RADIUS.sm,
                                background: bg,
                                border: `1px solid ${COLORS.ink}14`,
                                margin: '0 auto',
                                flexShrink: 0,
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionMatrixPage() {
  const allPatterns = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  // Build columns (instances)
  const cols = buildColumns();

  // Build rows (templates) — one per template across all patterns
  const templatePatternMap = new Map<string, { patternId: string; patternTitle: string }>();
  const rows = buildRows(allPatterns, templatePatternMap);

  // Pre-compute per-instance active template IDs using detectContradictions
  // keyed as instanceId → Set<templateId>
  const activeByInstance = new Map<string, Set<string>>();
  for (const col of cols) {
    const pattern = allPatterns.find((p) => p.patternId === col.patternId);
    if (!pattern) {
      activeByInstance.set(col.id, new Set());
      continue;
    }
    const detections = detectContradictions(pattern, col.evidenceMap);
    activeByInstance.set(col.id, new Set(detections.map((d) => d.templateId)));
  }

  // Build grid[rowIdx][colIdx]
  const grid: CellData[][] = rows.map((row) =>
    cols.map((col) => {
      const compoundId = `${col.id}::${row.template.id}`;

      // Template does not belong to this instance's pattern → N/A
      if (col.patternId !== row.patternId) {
        return { state: 'na' as CellState, compoundId };
      }

      // Resolved takes precedence
      if (isResolved(compoundId)) {
        return { state: 'resolved' as CellState, compoundId };
      }

      // Active if the template fires for this instance
      const instanceActive = activeByInstance.get(col.id);
      if (instanceActive?.has(row.template.id)) {
        return { state: 'active' as CellState, compoundId };
      }

      // Template applicable to pattern but doesn't fire — still active
      // (fire = contradiction not detected, but template is relevant).
      // Show as active (rust) when not resolved and the template is applicable.
      // This is the conservative default: all pattern-applicable combos are active
      // until a user marks them resolved.
      return { state: 'active' as CellState, compoundId };
    }),
  );

  // Count active cells (state === 'active')
  const activeCount = grid.flat().filter((c) => c.state === 'active').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Contradiction Matrix"
        title="Template × instance matrix"
        subtitle="2D grid showing which contradiction templates are active or resolved across all instances. Rows = templates (grouped by pattern); columns = instances. Mint = resolved · Rust = active · Gray = N/A."
      >
        <SummaryStrip
          templateCount={rows.length}
          instanceCount={cols.length}
          activeCount={activeCount}
        />
        <MatrixTable rows={rows} cols={cols} grid={grid} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
