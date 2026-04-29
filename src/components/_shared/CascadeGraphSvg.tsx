/**
 * CascadeGraphSvg — REASON-32
 *
 * Inline SVG visualization of cross-instance cascade relationships. Each
 * node is one instance (program or source-event), each directed arrow is
 * one cascade impact, color-coded by severity:
 *
 *   high   → RUST_TEXT  (red)   — open blocker plus a timing conflict
 *   medium → AMBER_DOT  (amber) — open blocker or a known dependency block
 *   low    → INK_MUTED  (gray)  — informational link
 *
 * Server component: no hooks, no event handlers — purely presentational.
 * Layout is delegated to `computeCascadeGraphLayout` so the same inputs
 * always produce identical output and the render is safe to ship from
 * Server Components without hydration drift.
 *
 * AbarVa palette only — every color references `SHELL` tokens. Renders an
 * empty state message when no cascade relationships are present rather
 * than a vestigial outline.
 */

import { SHELL } from '@/lib/shell/shell-tokens';
import {
  computeCascadeGraphLayout,
  CASCADE_NODE_RADIUS,
} from '@/lib/reasoning/cascade-graph-layout';
import { LINK_TYPE_LABEL } from '@/lib/reasoning/cascade-formatters';
import {
  cascadeEdgeKey,
  CASCADE_HOT_EDGE_THRESHOLD,
} from '@/lib/reasoning/cascade-telemetry-overlay';
import type { LinkType } from '@/lib/reasoning/types';

const DEFAULT_VIEWPORT_WIDTH = 720;
const DEFAULT_VIEWPORT_HEIGHT = 480;

const ARROW_HEAD_HIGH = 'cascade-graph-arrowhead-high';
const ARROW_HEAD_MED = 'cascade-graph-arrowhead-medium';
const ARROW_HEAD_LOW = 'cascade-graph-arrowhead-low';

export type CascadeEdgeSeverity = 'low' | 'medium' | 'high';

export interface CascadeGraphSvgNode {
  /** Stable identifier — must match `source` / `target` references in `edges`. */
  id: string;
  /** Short human label rendered below the node. */
  label: string;
}

export interface CascadeGraphSvgEdge {
  source: string;
  target: string;
  severity: CascadeEdgeSeverity;
  linkType: LinkType;
}

export interface CascadeGraphSvgProps {
  nodes: CascadeGraphSvgNode[];
  edges: CascadeGraphSvgEdge[];
  viewportWidth?: number;
  viewportHeight?: number;
  /** Optional title — rendered as a small section header above the graph. */
  title?: string;
  /**
   * Optional live-telemetry overlay. When supplied, edges that have been
   * recently computed get a slightly thicker stroke, a small count badge,
   * and (above {@link CASCADE_HOT_EDGE_THRESHOLD}) a hotter color. Keys
   * are produced via {@link cascadeEdgeKey}. Omit to render the static
   * graph as before — REASON-32 callers stay backward-compatible.
   */
  edgeHitCounts?: Map<string, number>;
}

interface SeverityColors {
  stroke: string;
  text: string;
  arrowId: string;
}

function colorsForSeverity(severity: CascadeEdgeSeverity): SeverityColors {
  switch (severity) {
    case 'high':
      return {
        stroke: SHELL.RUST_TEXT,
        text: SHELL.RUST_TEXT,
        arrowId: ARROW_HEAD_HIGH,
      };
    case 'medium':
      return {
        stroke: SHELL.AMBER_DOT,
        text: SHELL.PEACH_TEXT,
        arrowId: ARROW_HEAD_MED,
      };
    case 'low':
    default:
      return {
        stroke: SHELL.INK_MUTED,
        text: SHELL.INK_MUTED,
        arrowId: ARROW_HEAD_LOW,
      };
  }
}

const EMPTY_STATE = 'No cascade relationships';

export function CascadeGraphSvg({
  nodes,
  edges,
  viewportWidth = DEFAULT_VIEWPORT_WIDTH,
  viewportHeight = DEFAULT_VIEWPORT_HEIGHT,
  title,
  edgeHitCounts,
}: CascadeGraphSvgProps) {
  // Empty state — no nodes, or nodes but no edges → nothing meaningful to graph.
  if (nodes.length === 0 || edges.length === 0) {
    return (
      <section
        data-testid="cascade-graph-svg-empty"
        style={containerStyle}
      >
        {title && <SectionHeader label={title} count={0} />}
        <div style={emptyStyle}>{EMPTY_STATE}</div>
      </section>
    );
  }

  const layout = computeCascadeGraphLayout(
    nodes.map((n) => n.id),
    edges.map((e) => ({ source: e.source, target: e.target })),
    viewportWidth,
    viewportHeight,
  );

  const labelById = new Map<string, string>();
  for (const n of nodes) labelById.set(n.id, n.label);

  return (
    <section data-testid="cascade-graph-svg" style={containerStyle}>
      {title && <SectionHeader label={title} count={edges.length} />}
      <svg
        role="img"
        aria-label={`Cascade graph · ${nodes.length} instances · ${edges.length} relationships`}
        viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* One arrow-head marker per severity tier so the head color
              matches the line color. */}
          <ArrowMarker id={ARROW_HEAD_HIGH} fill={SHELL.RUST_TEXT} />
          <ArrowMarker id={ARROW_HEAD_MED} fill={SHELL.AMBER_DOT} />
          <ArrowMarker id={ARROW_HEAD_LOW} fill={SHELL.INK_MUTED} />
        </defs>

        {/* Edges first so nodes paint over the line endpoints. */}
        {layout.edges.map((edge, idx) => {
          const meta = edges[idx]!;
          const colors = colorsForSeverity(meta.severity);
          const midX = (edge.x1 + edge.x2) / 2;
          const midY = (edge.y1 + edge.y2) / 2;
          const hitCount = edgeHitCounts
            ? (edgeHitCounts.get(
                cascadeEdgeKey(edge.source, edge.target, meta.linkType),
              ) ?? 0)
            : 0;
          const hasHits = hitCount >= 1;
          const isHot = hitCount >= CASCADE_HOT_EDGE_THRESHOLD;
          // Backward-compat: when no telemetry map is passed, stroke widths
          // collapse to the original 2 / 1.5 split so REASON-32 callers
          // render unchanged.
          const baseStrokeWidth = meta.severity === 'high' ? 2 : 1.5;
          const strokeWidth = hasHits ? (isHot ? 3 : 2.5) : baseStrokeWidth;
          // Hot edges promote their color one tier within the existing
          // palette so we never introduce non-AbarVa hues. low → amber,
          // medium / high → rust.
          const stroke = isHot
            ? meta.severity === 'low'
              ? SHELL.AMBER_DOT
              : SHELL.RUST_TEXT
            : colors.stroke;
          const arrowId = isHot
            ? meta.severity === 'low'
              ? ARROW_HEAD_MED
              : ARROW_HEAD_HIGH
            : colors.arrowId;
          return (
            <g
              key={`edge-${edge.source}::${edge.target}::${meta.linkType}::${idx}`}
              data-testid={`cascade-graph-edge-${edge.source}-${edge.target}-${meta.linkType}`}
              data-severity={meta.severity}
              data-hit-count={hitCount}
              data-hot={isHot ? 'true' : undefined}
            >
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                markerEnd={`url(#${arrowId})`}
              />
              {/* linkType chip text near the arrow midpoint */}
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontFamily={SHELL.MONO}
                fontSize={9}
                fontWeight={600}
                fill={colors.text}
                style={{
                  paintOrder: 'stroke',
                  stroke: SHELL.PAPER,
                  strokeWidth: 3,
                  strokeLinejoin: 'round',
                }}
              >
                {LINK_TYPE_LABEL[meta.linkType]}
              </text>
              {/* Recent-hit pip + count badge — only when telemetry is present. */}
              {hasHits && (
                <g
                  data-testid={`cascade-graph-edge-pip-${edge.source}-${edge.target}-${meta.linkType}`}
                >
                  <circle
                    cx={midX + 14}
                    cy={midY - 4}
                    r={6}
                    fill={isHot ? SHELL.RUST_TEXT : SHELL.AMBER_DOT}
                    stroke={SHELL.PAPER}
                    strokeWidth={1}
                  />
                  <text
                    x={midX + 14}
                    y={midY - 1}
                    textAnchor="middle"
                    fontFamily={SHELL.MONO}
                    fontSize={8}
                    fontWeight={700}
                    fill={SHELL.PAPER}
                  >
                    {hitCount > 99 ? '99+' : hitCount}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((node) => {
          const label = labelById.get(node.id) ?? node.id;
          return (
            <g
              key={`node-${node.id}`}
              data-testid={`cascade-graph-node-${node.id}`}
            >
              <title>{label}</title>
              <circle
                cx={node.x}
                cy={node.y}
                r={CASCADE_NODE_RADIUS}
                fill={SHELL.CARD_WHITE}
                stroke={SHELL.INK}
                strokeWidth={1.25}
              />
              {/* Node id rendered inside the circle, label below. */}
              <text
                x={node.x}
                y={node.y + 3}
                textAnchor="middle"
                fontFamily={SHELL.MONO}
                fontSize={9}
                fontWeight={600}
                fill={SHELL.INK}
              >
                {node.id.length > 12 ? `${node.id.slice(0, 11)}…` : node.id}
              </text>
              <text
                x={node.x}
                y={node.y + CASCADE_NODE_RADIUS + 14}
                textAnchor="middle"
                fontFamily={SHELL.SANS}
                fontSize={10}
                fontWeight={500}
                fill={SHELL.INK_SOFT}
              >
                {label.length > 28 ? `${label.slice(0, 27)}…` : label}
              </text>
            </g>
          );
        })}
      </svg>
      <CascadeGraphLegend />
    </section>
  );
}

// ─── Internals ────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 16,
  marginBottom: 16,
  padding: '14px 16px',
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 10,
};

const emptyStyle: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
  background: SHELL.PAPER_SOFT,
  border: `1px dashed ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 8,
  padding: '12px 14px',
  lineHeight: 1.5,
};

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_SOFT,
        }}
      >
        {count} {count === 1 ? 'edge' : 'edges'}
      </span>
    </div>
  );
}

function ArrowMarker({ id, fill }: { id: string; fill: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerUnits="strokeWidth"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={fill} />
    </marker>
  );
}

function CascadeGraphLegend() {
  const items: Array<{ label: string; color: string }> = [
    { label: 'High · blocker + timing', color: SHELL.RUST_TEXT },
    { label: 'Medium · blocker or dep block', color: SHELL.AMBER_DOT },
    { label: 'Low · informational', color: SHELL.INK_MUTED },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        paddingTop: 4,
        borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        marginTop: 4,
      }}
    >
      {items.map((it) => (
        <span
          key={it.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.06em',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 16,
              height: 2,
              background: it.color,
              borderRadius: 1,
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export default CascadeGraphSvg;
