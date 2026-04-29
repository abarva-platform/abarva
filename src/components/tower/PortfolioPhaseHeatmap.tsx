// PortfolioPhaseHeatmap — TOWER10
//
// Server component. Renders a 2D grid: rows = programs, columns = phases P0–P6.
// The cell at the program's current phase is health-color-coded (green/amber/red).
// All other phase cells render as light gray.
//
// Deterministic: no Date.now(), no Math.random(), no model calls.

import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import type { InstanceHealthGrade } from '@/lib/reasoning/instance-health';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — aligned to the Tower surface palette
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  surface: '#F8F7F4',
  card: '#FFFFFF',
  ink: '#0A0C12',
  muted: '#525866',
  mutedSoft: '#9AA3B2',
  border: '#E8E6E1',
  navy: '#1B2B5C',
  // Health colors
  mintBg: 'rgba(22,163,74,0.10)',
  mintBorder: '#16A34A',
  mintText: '#15803D',
  amberBg: 'rgba(245,158,11,0.12)',
  amberBorder: '#F59E0B',
  amberText: '#B45309',
  rustBg: 'rgba(185,28,28,0.10)',
  rustBorder: '#B91C1C',
  rustText: '#B91C1C',
  // Non-current phase cell
  grayBg: '#F3F4F6',
  grayText: '#9AA3B2',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_IDS: ProgramPhaseId[] = [0, 1, 2, 3, 4, 5, 6];

interface CellStyle {
  bg: string;
  border: string;
  text: string;
  isCurrent: boolean;
}

function gradeToStyle(grade: InstanceHealthGrade): Pick<CellStyle, 'bg' | 'border' | 'text'> {
  switch (grade) {
    case 'green':
      return { bg: C.mintBg, border: C.mintBorder, text: C.mintText };
    case 'amber':
      return { bg: C.amberBg, border: C.amberBorder, text: C.amberText };
    case 'red':
      return { bg: C.rustBg, border: C.rustBorder, text: C.rustText };
  }
}

// Human-readable grade label for legend
const GRADE_LABEL: Record<InstanceHealthGrade, string> = {
  green: 'Healthy',
  amber: 'Degraded',
  red: 'Critical',
};

// ─────────────────────────────────────────────────────────────────────────────
// Row data — one per program instance
// ─────────────────────────────────────────────────────────────────────────────

interface HeatmapRow {
  id: string;
  name: string;
  displayId: string;
  currentPhase: number;
  grade: InstanceHealthGrade;
  score: number;
  gatePassRate: number;
  summary: string;
}

function buildHeatmapRows(): HeatmapRow[] {
  // Only the 6 core Apex Retail instances (first 6 in the array)
  const coreInstances = APEX_RETAIL_PROGRAM_INSTANCES.slice(0, 6);

  return coreInstances.map((instance) => {
    const ctx = buildProgramSynthesisContext(instance);
    const health = computeInstanceHealth(ctx);
    const { total, met } = ctx.gatesSummary;
    const gatePassRate = total > 0 ? Math.round((met / total) * 100) : 100;

    return {
      id: instance.id,
      name: instance.name,
      displayId: instance.displayId,
      currentPhase: instance.currentPhase,
      grade: health.grade,
      score: health.score,
      gatePassRate,
      summary: health.summary,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function LegendDot({ grade }: { grade: InstanceHealthGrade }) {
  const style = gradeToStyle(grade);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: style.border,
        flexShrink: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function PortfolioPhaseHeatmap() {
  const rows = buildHeatmapRows();

  // Column count: label column + 7 phase columns
  const gridTemplateColumns = `minmax(160px, 220px) repeat(7, 1fr)`;

  return (
    <section
      aria-label="Portfolio phase heatmap"
      data-testid="portfolio-phase-heatmap"
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Grid wrapper — full-bleed so borders tile cleanly */}
      <div
        role="grid"
        aria-label="Programs × phase health grid"
        style={{
          display: 'grid',
          gridTemplateColumns,
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {/* ── Header row ── */}
        {/* Top-left corner cell */}
        <div
          role="columnheader"
          aria-label="Program"
          style={{
            padding: '8px 12px',
            backgroundColor: C.surface,
            borderBottom: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.muted,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Program
        </div>

        {/* Phase header cells */}
        {PHASE_IDS.map((phaseId) => (
          <div
            key={phaseId}
            role="columnheader"
            aria-label={`Phase P${phaseId}: ${PHASE_LABEL_MAP[phaseId]}`}
            style={{
              padding: '8px 6px',
              backgroundColor: C.surface,
              borderBottom: `1px solid ${C.border}`,
              borderRight: phaseId < 6 ? `1px solid ${C.border}` : undefined,
              fontSize: 10,
              fontWeight: 600,
              color: C.muted,
              textAlign: 'center',
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ fontSize: 9, color: C.mutedSoft, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>
              P{phaseId}
            </div>
            <div style={{ fontSize: 10, lineHeight: 1.2 }}>
              {PHASE_LABEL_MAP[phaseId]}
            </div>
          </div>
        ))}

        {/* ── Data rows ── */}
        {rows.map((row, rowIdx) => {
          const isLastRow = rowIdx === rows.length - 1;
          const rowBorderBottom = isLastRow ? undefined : `1px solid ${C.border}`;
          const gradeStyle = gradeToStyle(row.grade);

          return (
            <>
              {/* Row label */}
              <div
                key={`label-${row.id}`}
                role="rowheader"
                style={{
                  padding: '10px 12px',
                  borderBottom: rowBorderBottom,
                  borderRight: `1px solid ${C.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    color: C.mutedSoft,
                    textTransform: 'uppercase',
                  }}
                >
                  {row.displayId}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.ink,
                    lineHeight: 1.3,
                  }}
                >
                  {row.name}
                </span>
              </div>

              {/* Phase cells */}
              {PHASE_IDS.map((phaseId) => {
                const isCurrent = phaseId === row.currentPhase;
                const isLast = phaseId === 6;

                if (isCurrent) {
                  // Current phase: health-color cell
                  const tooltip = [
                    `${GRADE_LABEL[row.grade]} · score ${row.score}`,
                    `Gate pass rate ${row.gatePassRate}%`,
                    row.summary,
                  ].join(' · ');

                  return (
                    <div
                      key={`cell-${row.id}-${phaseId}`}
                      role="gridcell"
                      title={tooltip}
                      aria-label={`${row.name} · P${phaseId} ${PHASE_LABEL_MAP[phaseId]} · ${GRADE_LABEL[row.grade]} · score ${row.score} · gate pass rate ${row.gatePassRate}%`}
                      data-health={row.grade}
                      data-program={row.id}
                      data-phase={phaseId}
                      style={{
                        padding: '8px 4px',
                        borderBottom: rowBorderBottom,
                        borderRight: isLast ? undefined : `1px solid ${C.border}`,
                        backgroundColor: gradeStyle.bg,
                        border: `2px solid ${gradeStyle.border}`,
                        // Override the right border with the full 2px colored border
                        // by using a box-shadow for the colored outline on the current cell
                        boxShadow: `inset 0 0 0 2px ${gradeStyle.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        cursor: 'default',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11,
                          fontWeight: 700,
                          color: gradeStyle.text,
                        }}
                      >
                        {row.score}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: gradeStyle.text,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {row.gatePassRate}%
                      </span>
                    </div>
                  );
                }

                // Non-current phase: light gray
                return (
                  <div
                    key={`cell-${row.id}-${phaseId}`}
                    role="gridcell"
                    aria-label={`${row.name} · P${phaseId} ${PHASE_LABEL_MAP[phaseId]} · not current`}
                    data-program={row.id}
                    data-phase={phaseId}
                    style={{
                      padding: '8px 4px',
                      borderBottom: rowBorderBottom,
                      borderRight: isLast ? undefined : `1px solid ${C.border}`,
                      backgroundColor: C.grayBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: phaseId < row.currentPhase ? '#D1FAE5' : C.border,
                        display: 'block',
                      }}
                    />
                  </div>
                );
              })}
            </>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div
        aria-label="Heatmap legend"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 14px',
          borderTop: `1px solid ${C.border}`,
          backgroundColor: C.surface,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.mutedSoft,
            fontWeight: 700,
            marginRight: 4,
          }}
        >
          Legend
        </span>
        {(['green', 'amber', 'red'] as InstanceHealthGrade[]).map((grade) => (
          <span
            key={grade}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: C.muted,
            }}
          >
            <LegendDot grade={grade} />
            {GRADE_LABEL[grade]}
          </span>
        ))}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: C.muted,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: C.border,
            }}
          />
          Not yet reached
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: C.muted,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#D1FAE5',
            }}
          />
          Completed phase
        </span>
      </div>
    </section>
  );
}
