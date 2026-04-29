/**
 * lifecycle-graph-layout tests — REASON-30
 *
 * Pure-function deterministic layout for the inline `LifecycleMiniGraph`.
 * Covers the three meaningful cardinalities (1, 5, 10) and the empty case.
 */

import {
  computeStageGraphLayout,
  HORIZONTAL_PADDING,
  NODE_CENTER_Y,
  NODE_RADIUS,
  ARROW_NODE_GAP,
} from '@/lib/reasoning/lifecycle-graph-layout';

describe('computeStageGraphLayout', () => {
  it('returns an empty layout when stageCount is 0', () => {
    const layout = computeStageGraphLayout(0, 800);
    expect(layout.nodes).toEqual([]);
    expect(layout.links).toEqual([]);
  });

  it('places a single stage at the horizontal center with no links', () => {
    const layout = computeStageGraphLayout(1, 800);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.nodes[0]).toEqual({ x: 400, y: NODE_CENTER_Y });
    expect(layout.links).toEqual([]);
  });

  it('evenly spaces 5 stages across the viewport with 4 connecting links', () => {
    const width = 800;
    const layout = computeStageGraphLayout(5, width);

    expect(layout.nodes).toHaveLength(5);
    expect(layout.links).toHaveLength(4);

    // First and last nodes anchor at HORIZONTAL_PADDING from each edge.
    expect(layout.nodes[0]!.x).toBe(HORIZONTAL_PADDING);
    expect(layout.nodes[4]!.x).toBe(width - HORIZONTAL_PADDING);

    // Step size is uniform: (width - 2*padding) / (n - 1).
    const expectedStep = (width - HORIZONTAL_PADDING * 2) / 4;
    for (let i = 1; i < layout.nodes.length; i++) {
      const delta = layout.nodes[i]!.x - layout.nodes[i - 1]!.x;
      expect(delta).toBeCloseTo(expectedStep, 6);
    }

    // Each link starts past the previous node's right edge and ends before
    // the next node's left edge — leaving room for the arrowhead.
    for (let i = 0; i < layout.links.length; i++) {
      const link = layout.links[i]!;
      const from = layout.nodes[i]!;
      const to = layout.nodes[i + 1]!;
      expect(link.x1).toBeCloseTo(from.x + NODE_RADIUS + ARROW_NODE_GAP, 6);
      expect(link.x2).toBeCloseTo(to.x - NODE_RADIUS - ARROW_NODE_GAP, 6);
      expect(link.y1).toBe(NODE_CENTER_Y);
      expect(link.y2).toBe(NODE_CENTER_Y);
    }
  });

  it('lays out the full AMS 10-stage lifecycle with 9 links and stable bounds', () => {
    const width = 800;
    const layout = computeStageGraphLayout(10, width);

    expect(layout.nodes).toHaveLength(10);
    expect(layout.links).toHaveLength(9);

    // Endpoints align with the configured padding.
    expect(layout.nodes[0]!.x).toBe(HORIZONTAL_PADDING);
    expect(layout.nodes[9]!.x).toBe(width - HORIZONTAL_PADDING);

    // Every node sits on the same horizontal centerline.
    for (const node of layout.nodes) {
      expect(node.y).toBe(NODE_CENTER_Y);
    }

    // No node strays outside the viewport even after accounting for radius.
    for (const node of layout.nodes) {
      expect(node.x - NODE_RADIUS).toBeGreaterThanOrEqual(0);
      expect(node.x + NODE_RADIUS).toBeLessThanOrEqual(width);
    }

    // Layout is deterministic: same inputs → identical outputs.
    const repeat = computeStageGraphLayout(10, width);
    expect(repeat).toEqual(layout);
  });
});
