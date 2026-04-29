'use client';

/**
 * EvidenceCoverageHeatmap — REASON-35
 *
 * Visual grid showing which gate criteria have supporting evidence and which
 * don't, across all lifecycle stages in a pattern.
 *
 * - Rows = lifecycle stages (pattern.stages)
 * - Columns = gate criteria for each stage (pattern.gateCriteria filtered by stageId)
 * - Each cell is a 16×16 px coloured square:
 *     mint  — criterion has ≥1 evidence item whose description contains a keyword
 *     amber — partial/low-quality match (exactly 1 keyword match but evidence is weak)
 *     rust  — no matching evidence
 * - Tooltip on each cell: criterion description + evidence count
 * - Legend at the bottom
 *
 * AbarVa palette only. Strict TypeScript — no `any`.
 */

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { LifecyclePatternSeed, GateCriterion, LifecycleStage } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CoverageStatus = 'covered' | 'partial' | 'uncovered';

export interface CriterionCoverageCell {
  criterion: GateCriterion;
  status: CoverageStatus;
  evidenceCount: number;
  matchedItems: string[];
}

export interface StageCoverageRow {
  stage: LifecycleStage;
  cells: CriterionCoverageCell[];
}

export interface EvidenceCoverageHeatmapProps {
  instance: SourceEventInstance | ProgramInstance;
  pattern: LifecyclePatternSeed;
}

// ─── Colour constants ─────────────────────────────────────────────────────────

const COLOR: Record<CoverageStatus, { fill: string; stroke: string; label: string }> = {
  covered: { fill: SHELL.MINT_BG, stroke: SHELL.MINT_LINE, label: 'Covered' },
  partial:  { fill: '#fdf0cc', stroke: '#e6c96e', label: 'Partial' },
  uncovered: { fill: SHELL.RUST_BG, stroke: '#d9957a', label: 'No evidence' },
};

// ─── Evidence extraction helpers ─────────────────────────────────────────────

/**
 * Extract a flat array of text strings from an instance's evidence array.
 * Works across both SourceEventInstance (EvidenceItem[]) and
 * ProgramInstance (ProgramEvidenceItem[]).
 */
function extractEvidenceDescriptions(
  instance: SourceEventInstance | ProgramInstance,
): string[] {
  const ev = instance.evidence;

  // SourceEventInstance has evidence items with `field` + `value` + (optional) extra text
  if (ev.length === 0) return [];

  // Discriminate by duck-typing: SourceEventInstance evidence items have `field`
  if ('field' in ev[0]) {
    // SourceEventInstance evidence: combine field + value for keyword matching
    return (ev as SourceEventInstance['evidence']).flatMap((item) => [
      item.field,
      item.value,
      item.source,
    ]);
  }

  // ProgramInstance evidence items have `citation`
  return (ev as ProgramInstance['evidence']).map((item) => item.citation);
}

// ─── Coverage computation ─────────────────────────────────────────────────────

/**
 * Extract simple keywords from a criterion description for matching.
 * Strips stop words and short tokens; returns lowercase words ≥ 4 chars.
 */
function extractKeywords(description: string): string[] {
  const STOP = new Set([
    'with', 'that', 'this', 'from', 'each', 'have', 'been', 'will',
    'must', 'when', 'than', 'also', 'more', 'than', 'into', 'only',
    'over', 'after', 'before', 'their', 'there', 'they', 'where',
    'which', 'while', 'other', 'about', 'every', 'does', 'complete',
    'completed', 'minimum', 'least', 'vendor', 'vendors',
  ]);
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

/**
 * Compute coverage for a single criterion against a flat list of evidence text.
 * Returns:
 *   - 'covered'   — 2+ keyword matches across evidence strings
 *   - 'partial'   — exactly 1 keyword match
 *   - 'uncovered' — 0 keyword matches
 */
function computeCoverage(
  criterion: GateCriterion,
  evidenceTexts: string[],
): { status: CoverageStatus; matchCount: number; matchedItems: string[] } {
  const keywords = extractKeywords(criterion.description);
  if (keywords.length === 0) {
    return { status: 'uncovered', matchCount: 0, matchedItems: [] };
  }

  const combinedEvidence = evidenceTexts.join(' ').toLowerCase();
  const matchedItems: string[] = [];
  let totalMatches = 0;

  for (const kw of keywords) {
    if (combinedEvidence.includes(kw)) {
      totalMatches++;
      matchedItems.push(kw);
    }
  }

  // Also count how many individual evidence strings contain at least one keyword
  let evidenceHits = 0;
  for (const ev of evidenceTexts) {
    const lower = ev.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      evidenceHits++;
    }
  }

  let status: CoverageStatus;
  if (evidenceHits >= 2 || totalMatches >= 3) {
    status = 'covered';
  } else if (evidenceHits >= 1 || totalMatches >= 1) {
    status = 'partial';
  } else {
    status = 'uncovered';
  }

  return { status, matchCount: evidenceHits, matchedItems };
}

/**
 * Build the full heatmap data rows from instance + pattern.
 */
function buildHeatmapRows(
  instance: SourceEventInstance | ProgramInstance,
  pattern: LifecyclePatternSeed,
): StageCoverageRow[] {
  const evidenceTexts = extractEvidenceDescriptions(instance);
  const sortedStages = [...pattern.stages].sort((a, b) => a.order - b.order);

  return sortedStages.map((stage) => {
    const stageCriteria = pattern.gateCriteria.filter(
      (c) => c.stageId === stage.id,
    );

    const cells: CriterionCoverageCell[] = stageCriteria.map((criterion) => {
      const { status, matchCount, matchedItems } = computeCoverage(
        criterion,
        evidenceTexts,
      );
      return {
        criterion,
        status,
        evidenceCount: matchCount,
        matchedItems,
      };
    });

    return { stage, cells };
  });
}

// ─── Cell component ───────────────────────────────────────────────────────────

function HeatmapCell({
  cell,
  stageLabel,
}: {
  cell: CriterionCoverageCell;
  stageLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  const { fill, stroke } = COLOR[cell.status];

  const tooltipText = [
    `Stage: ${stageLabel}`,
    `Criterion: ${cell.criterion.description}`,
    `Evidence hits: ${cell.evidenceCount}`,
    cell.criterion.gateType === 'hard' ? 'Hard gate' : 'Soft gate',
    cell.matchedItems.length > 0
      ? `Keywords matched: ${cell.matchedItems.slice(0, 4).join(', ')}`
      : 'No keyword matches found',
  ].join('\n');

  return (
    <div
      role="gridcell"
      aria-label={`${stageLabel} · ${cell.criterion.description} · ${cell.status}`}
      title={tooltipText}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        background: fill,
        border: `1px solid ${stroke}`,
        cursor: 'default',
        flexShrink: 0,
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        transform: hovered ? 'scale(1.35)' : 'scale(1)',
        boxShadow: hovered ? `0 2px 6px rgba(0,0,0,0.15)` : 'none',
        position: 'relative',
        zIndex: hovered ? 10 : 'auto',
        // Hard gate gets a small dot indicator in the top-right
        ...(cell.criterion.gateType === 'hard'
          ? {
              boxShadow: hovered
                ? `0 2px 6px rgba(0,0,0,0.15), inset 0 0 0 1.5px ${stroke}`
                : `inset 0 0 0 1.5px ${stroke}`,
            }
          : {}),
      }}
    />
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function HeatmapLegend() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        marginTop: 12,
        flexWrap: 'wrap',
      }}
    >
      {(Object.entries(COLOR) as [CoverageStatus, typeof COLOR[CoverageStatus]][]).map(
        ([status, { fill, stroke, label }]) => (
          <div
            key={status}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: fill,
                border: `1px solid ${stroke}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
              }}
            >
              {label}
            </span>
          </div>
        ),
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            background: COLOR.covered.fill,
            border: `1.5px solid ${COLOR.covered.stroke}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.06em',
          }}
        >
          Bold border = hard gate
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EvidenceCoverageHeatmap({
  instance,
  pattern,
}: EvidenceCoverageHeatmapProps) {
  const [open, setOpen] = useState(false);
  const rows = buildHeatmapRows(instance, pattern);

  // Count totals for header
  const totalCriteria = rows.reduce((n, r) => n + r.cells.length, 0);
  const coveredCount = rows.reduce(
    (n, r) => n + r.cells.filter((c) => c.status === 'covered').length,
    0,
  );
  const partialCount = rows.reduce(
    (n, r) => n + r.cells.filter((c) => c.status === 'partial').length,
    0,
  );
  const uncoveredCount = totalCriteria - coveredCount - partialCount;

  // Filter out stages with no criteria so the grid stays compact
  const nonEmptyRows = rows.filter((r) => r.cells.length > 0);

  if (nonEmptyRows.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="evidence-coverage-heatmap"
      style={{
        marginTop: 16,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        overflow: 'hidden',
      }}
    >
      {/* Collapsible trigger */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          textAlign: 'left',
        }}
        aria-expanded={open}
        aria-controls="evidence-heatmap-body"
        onClick={() => setOpen((v: boolean) => !v)}
      >
        <span>Coverage heatmap</span>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {/* Quick summary chips */}
          <span
            style={{
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                background: SHELL.MINT_BG,
                color: SHELL.MINT_TEXT,
                fontFamily: SHELL.MONO,
                fontSize: 9,
                padding: '1px 6px',
                borderRadius: 999,
                border: `1px solid ${SHELL.MINT_LINE}`,
              }}
            >
              {coveredCount} covered
            </span>
            {partialCount > 0 && (
              <span
                style={{
                  background: '#fdf0cc',
                  color: '#7a6020',
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 999,
                  border: '1px solid #e6c96e',
                }}
              >
                {partialCount} partial
              </span>
            )}
            {uncoveredCount > 0 && (
              <span
                style={{
                  background: SHELL.RUST_BG,
                  color: SHELL.RUST_TEXT,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 999,
                  border: '1px solid #d9957a',
                }}
              >
                {uncoveredCount} gaps
              </span>
            )}
          </span>
          <i
            style={{
              display: 'inline-block',
              transition: 'transform 0.18s ease',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              fontStyle: 'normal',
              fontSize: 11,
              color: SHELL.INK_SOFT,
            }}
          >
            ›
          </i>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div
          id="evidence-heatmap-body"
          style={{
            padding: '12px 14px 14px',
            borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          {/* Grid */}
          <div
            role="grid"
            aria-label="Evidence coverage heatmap"
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {nonEmptyRows.map((row) => (
              <div
                key={row.stage.id}
                role="row"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {/* Stage label */}
                <div
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    color: SHELL.INK_SOFT,
                    width: 80,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={row.stage.label}
                >
                  {row.stage.label}
                </div>

                {/* Cells */}
                <div
                  style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}
                >
                  {row.cells.map((cell) => (
                    <HeatmapCell
                      key={cell.criterion.id}
                      cell={cell}
                      stageLabel={row.stage.label}
                    />
                  ))}
                </div>

                {/* Count badge */}
                <div
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: SHELL.INK_MUTED,
                    marginLeft: 4,
                    flexShrink: 0,
                  }}
                >
                  {row.cells.filter((c) => c.status === 'covered').length}
                  <span style={{ color: SHELL.CARD_LINE }}>/</span>
                  {row.cells.length}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <HeatmapLegend />

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 10,
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.04em',
              lineHeight: 1.5,
            }}
            data-honest-disclaimer="evidence-coverage-heatmap"
          >
            Coverage is keyword-matched against evidence descriptions — deterministic
            approximation only. Hard gates (bold border) must be met before stage
            advancement.
          </div>
        </div>
      )}
    </div>
  );
}

export default EvidenceCoverageHeatmap;
