/**
 * Cascade-graph layout helper — REASON-32
 *
 * Pure deterministic positioning logic for `CascadeGraphSvg`.
 *
 * Given a set of node ids and a set of directed edges between them, produces
 * a circular layout: every node is placed evenly on a circle inscribed in
 * the supplied viewport, and every edge becomes a line from the source
 * node's circumference to just-before the target node's circumference (so
 * the SVG arrowhead has room to render without poking into the node).
 *
 * Why circular and not force-directed?
 * - Determinism: same inputs always yield identical coordinates. No
 *   iterations, no jitter, no Math.random.
 * - Render parity: the layout is identical on the server and the client,
 *   so we can ship it from a Server Component without hydration drift.
 * - Tower triage UX: at portfolio scale (~5–20 instances) a circular
 *   layout reads as a clean "everything is connected" map; force layouts
 *   require interaction to be useful.
 *
 * Pure function — no DOM dependencies, no IO, no randomness.
 */

/** Radius of the node circle, in viewBox units. */
export const CASCADE_NODE_RADIUS = 28;

/** Padding between the layout circle and the viewport edge, in viewBox units. */
export const CASCADE_VIEWPORT_PADDING = 80;

/** Gap between the node's edge and the start/end of its connecting arrow. */
export const CASCADE_ARROW_NODE_GAP = 6;

/** A positioned node — pixel coordinates of the circle's center. */
export interface CascadeLayoutNode {
  id: string;
  x: number;
  y: number;
}

/**
 * A positioned directed edge — from-edge (x1, y1) to to-edge (x2, y2).
 * Endpoints already account for the node radius and `CASCADE_ARROW_NODE_GAP`
 * so callers can render the line and arrowhead without further math.
 */
export interface CascadeLayoutEdge {
  source: string;
  target: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CascadeGraphLayout {
  nodes: CascadeLayoutNode[];
  edges: CascadeLayoutEdge[];
}

/**
 * Compute deterministic positions for a cascade graph laid out on a circle
 * inscribed in the viewport.
 *
 * - 0 nodes → empty layout.
 * - 1 node  → single node at the viewport center, no edges.
 * - N nodes → evenly spaced on a circle. The first node is at angle
 *             `-π/2` (12 o'clock) and subsequent nodes proceed clockwise.
 *
 * Edges are emitted in the same order they were supplied. Each edge's
 * endpoints are shortened by `CASCADE_NODE_RADIUS + CASCADE_ARROW_NODE_GAP`
 * along the source→target direction, so an SVG arrowhead can render at
 * the target end without overlapping the target node's circle. Edges
 * referencing unknown node ids are skipped.
 */
export function computeCascadeGraphLayout(
  nodes: string[],
  edges: Array<{ source: string; target: string }>,
  viewportWidth: number,
  viewportHeight: number,
): CascadeGraphLayout {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;

  if (nodes.length === 1) {
    const id = nodes[0]!;
    return {
      nodes: [{ id, x: cx, y: cy }],
      edges: [],
    };
  }

  // Inscribe a circle inside the viewport, leaving room for node radius + padding.
  const radius = Math.max(
    0,
    Math.min(viewportWidth, viewportHeight) / 2 -
      CASCADE_VIEWPORT_PADDING,
  );

  // First node at 12 o'clock; remaining nodes clockwise.
  const positioned: CascadeLayoutNode[] = nodes.map((id, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / nodes.length;
    return {
      id,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  const positionsById = new Map<string, CascadeLayoutNode>();
  for (const n of positioned) positionsById.set(n.id, n);

  const layoutEdges: CascadeLayoutEdge[] = [];
  for (const edge of edges) {
    const from = positionsById.get(edge.source);
    const to = positionsById.get(edge.target);
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) {
      // Defensive: a self-loop or zero-distance edge — skip rather than NaN.
      continue;
    }

    const ux = dx / dist;
    const uy = dy / dist;
    const offset = CASCADE_NODE_RADIUS + CASCADE_ARROW_NODE_GAP;

    layoutEdges.push({
      source: edge.source,
      target: edge.target,
      x1: from.x + ux * offset,
      y1: from.y + uy * offset,
      x2: to.x - ux * offset,
      y2: to.y - uy * offset,
    });
  }

  return { nodes: positioned, edges: layoutEdges };
}
