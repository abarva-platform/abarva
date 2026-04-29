'use client';

/**
 * LifecycleMiniGraph — REASON-30
 *
 * Inline SVG mini-graph that complements `StageTrackerStrip`. Renders one
 * circle per pattern stage, connected by directional arrows, with a small
 * gate-criteria count badge attached to each node.
 *
 * Client component (no hooks of its own — the `'use client'` boundary exists
 * solely so the optional `onStageClick` callback can be wired through). When
 * `onStageClick` is omitted the rendered output is identical to the legacy
 * presentational SVG that shipped in PR #762.
 *
 * Caller is expected to pass a deterministic `stages` list, the same
 * `stageStates` map already computed for the strip, and a `gateCriteriaCount`
 * map keyed by stage id.
 *
 * Returns `null` when there are no stages — patternless instances render as
 * nothing rather than a vestigial SVG outline.
 */

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { LifecycleStage } from '@/lib/intelligence/seed-types';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  computeStageGraphLayout,
  NODE_CENTER_Y,
  NODE_RADIUS,
} from '@/lib/reasoning/lifecycle-graph-layout';
import type { StageStatus } from '@/components/shell/StageTrackerStrip';

const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 132;
const ARROW_HEAD_ID = 'lifecycle-mini-graph-arrowhead';

interface NodeColors {
  fill: string;
  stroke: string;
  label: string;
  labelWeight: number;
  badgeFill: string;
  badgeText: string;
}

function colorsForStatus(status: StageStatus): NodeColors {
  switch (status) {
    case 'passed':
      return {
        fill: SHELL.MINT_BG,
        stroke: SHELL.MINT_TEXT,
        label: SHELL.MINT_TEXT,
        labelWeight: 500,
        badgeFill: SHELL.MINT_TEXT,
        badgeText: SHELL.PAPER,
      };
    case 'current':
      return {
        fill: SHELL.INK,
        stroke: SHELL.INK,
        label: SHELL.INK,
        labelWeight: 600,
        badgeFill: SHELL.PAPER,
        badgeText: SHELL.INK,
      };
    case 'blocked':
      return {
        fill: SHELL.PAPER,
        stroke: SHELL.AMBER_DOT,
        label: SHELL.AMBER_DOT,
        labelWeight: 600,
        badgeFill: SHELL.AMBER_DOT,
        badgeText: SHELL.PAPER,
      };
    case 'upcoming':
    default:
      return {
        fill: SHELL.PAPER,
        stroke: SHELL.GRAY_LINE,
        label: SHELL.INK_MUTED,
        labelWeight: 400,
        badgeFill: SHELL.GRAY_BG,
        badgeText: SHELL.GRAY_TEXT,
      };
  }
}

export interface LifecycleMiniGraphProps {
  stages: LifecycleStage[];
  /** Status keyed by stage label (matches StageTrackerStrip convention). */
  stageStates: Record<string, StageStatus>;
  /** Count of gate criteria per stage, keyed by stage id. */
  gateCriteriaCount: Record<string, number>;
  /**
   * Optional per-stage micro-synthesis text, keyed by stage id. When provided,
   * the corresponding `<title>` element on each stage node group renders the
   * advisory string as a native SVG tooltip — surfaced on hover, no JS needed.
   * Falls back to the stage's pattern description when absent for a stage.
   */
  microSynthesis?: Record<string, string>;
  /**
   * Optional click handler. When provided, each stage node becomes
   * interactive: clicking calls `onStageClick(stageId)` and the cursor
   * upgrades to `pointer`. When omitted the graph renders as a presentational
   * SVG with hover-tooltips only (legacy PR #762 behaviour).
   */
  onStageClick?: (stageId: string) => void;
}

export function LifecycleMiniGraph({
  stages,
  stageStates,
  gateCriteriaCount,
  microSynthesis,
  onStageClick,
}: LifecycleMiniGraphProps) {
  if (!stages || stages.length === 0) {
    return null;
  }

  const layout = computeStageGraphLayout(stages.length, VIEWPORT_WIDTH);

  return (
    <div
      data-testid="lifecycle-mini-graph"
      style={{
        width: '100%',
        maxWidth: VIEWPORT_WIDTH,
        margin: '0 auto',
      }}
    >
      <svg
        role="img"
        aria-label={`Lifecycle mini-graph · ${stages.length} stages`}
        viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <marker
            id={ARROW_HEAD_ID}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={SHELL.INK_MUTED} />
          </marker>
        </defs>

        {/* Directional arrows between consecutive stages */}
        {layout.links.map((link, idx) => (
          <line
            key={`link-${idx}`}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            stroke={SHELL.INK_MUTED}
            strokeWidth={1}
            markerEnd={`url(#${ARROW_HEAD_ID})`}
          />
        ))}

        {/* Stage nodes + labels + gate-criteria badges */}
        {stages.map((stage, idx) => {
          const node = layout.nodes[idx];
          if (!node) return null;
          const status: StageStatus = stageStates[stage.label] ?? 'upcoming';
          const colors = colorsForStatus(status);
          const count = gateCriteriaCount[stage.id] ?? 0;
          const badgeCx = node.x + NODE_RADIUS - 4;
          const badgeCy = node.y - NODE_RADIUS + 4;

          const tooltip =
            microSynthesis?.[stage.id] && microSynthesis[stage.id]!.length > 0
              ? `${stage.label} — ${microSynthesis[stage.id]}`
              : stage.description;
          const interactive = typeof onStageClick === 'function';
          const clickProps = interactive
            ? {
                role: 'button' as const,
                tabIndex: 0,
                style: { cursor: 'pointer' as const },
                onClick: () => onStageClick!(stage.id),
                onKeyDown: (e: ReactKeyboardEvent<SVGGElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStageClick!(stage.id);
                  }
                },
                'aria-label': `Open synthesis for stage ${stage.label}`,
              }
            : {};
          return (
            <g key={stage.id} data-stage-id={stage.id} {...clickProps}>
              <title>{tooltip}</title>
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={status === 'upcoming' ? 1 : 1.5}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontFamily={SHELL.MONO}
                fontSize={10}
                fontWeight={600}
                fill={status === 'current' ? SHELL.PAPER : colors.stroke}
              >
                {String(stage.order).padStart(2, '0')}
              </text>
              {/* Stage label below the node */}
              <text
                x={node.x}
                y={NODE_CENTER_Y + NODE_RADIUS + 18}
                textAnchor="middle"
                fontFamily={SHELL.SANS}
                fontSize={10}
                fontWeight={colors.labelWeight}
                fill={colors.label}
              >
                {stage.label}
              </text>
              {/* Gate-criteria count badge — anchored top-right of the node */}
              {count > 0 && (
                <g>
                  <circle
                    cx={badgeCx}
                    cy={badgeCy}
                    r={9}
                    fill={colors.badgeFill}
                    stroke={colors.stroke}
                    strokeWidth={1}
                  />
                  <text
                    x={badgeCx}
                    y={badgeCy + 3}
                    textAnchor="middle"
                    fontFamily={SHELL.MONO}
                    fontSize={9}
                    fontWeight={600}
                    fill={colors.badgeText}
                  >
                    {count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
