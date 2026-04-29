/**
 * Lifecycle mini-graph layout helper — REASON-30
 *
 * Pure deterministic positioning logic for `LifecycleMiniGraph`.
 * Computes circle positions and connecting line endpoints for a horizontal
 * row of N stages inside a fixed-width SVG viewport.
 *
 * Same inputs always produce the same outputs — no randomness, no DOM
 * dependencies. Safe to call from server components and unit tests.
 */

/** Circle radius for stage nodes, in viewBox units. */
export const NODE_RADIUS = 24;

/** Fixed vertical centerline of the row, in viewBox units. */
export const NODE_CENTER_Y = 56;

/** Horizontal padding between the viewport edge and the first/last node. */
export const HORIZONTAL_PADDING = 32;

/** Gap between a node's edge and the start/end of its connecting arrow. */
export const ARROW_NODE_GAP = 4;

/**
 * One graph node — pixel coordinates of the circle's center.
 */
export interface GraphNode {
  x: number;
  y: number;
}

/**
 * One directed link between consecutive nodes — from-edge (x1, y1) to
 * to-edge (x2, y2). The endpoints already account for `ARROW_NODE_GAP`
 * so callers can render the line and arrowhead without further math.
 */
export interface GraphLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface StageGraphLayout {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Compute deterministic positions for `stageCount` nodes across a viewport
 * of `viewportWidth` pixels.
 *
 * - 0 stages → empty layout (no nodes, no links).
 * - 1 stage  → single centered node, no links.
 * - N stages → evenly spaced row, with horizontal arrows between consecutive
 *              nodes.
 *
 * The Y coordinate is fixed so callers can size the SVG height in concert
 * with `NODE_CENTER_Y` and `NODE_RADIUS` (label rendered below).
 */
export function computeStageGraphLayout(
  stageCount: number,
  viewportWidth: number,
): StageGraphLayout {
  if (stageCount <= 0) {
    return { nodes: [], links: [] };
  }

  if (stageCount === 1) {
    return {
      nodes: [{ x: viewportWidth / 2, y: NODE_CENTER_Y }],
      links: [],
    };
  }

  const usableWidth = Math.max(
    0,
    viewportWidth - HORIZONTAL_PADDING * 2,
  );
  const step = usableWidth / (stageCount - 1);

  const nodes: GraphNode[] = [];
  for (let i = 0; i < stageCount; i++) {
    nodes.push({
      x: HORIZONTAL_PADDING + step * i,
      y: NODE_CENTER_Y,
    });
  }

  const links: GraphLink[] = [];
  for (let i = 0; i < stageCount - 1; i++) {
    const from = nodes[i]!;
    const to = nodes[i + 1]!;
    links.push({
      x1: from.x + NODE_RADIUS + ARROW_NODE_GAP,
      y1: from.y,
      x2: to.x - NODE_RADIUS - ARROW_NODE_GAP,
      y2: to.y,
    });
  }

  return { nodes, links };
}
