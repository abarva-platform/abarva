/**
 * cascade-graph-layout tests — REASON-32
 *
 * Pure-function deterministic circular layout for `CascadeGraphSvg`.
 * Covers the four meaningful cardinalities (1, 3, 5, 10), the empty case,
 * and edge coordinate stability across repeated calls with the same input.
 */

import {
  computeCascadeGraphLayout,
  CASCADE_NODE_RADIUS,
  CASCADE_ARROW_NODE_GAP,
  CASCADE_VIEWPORT_PADDING,
} from '@/lib/reasoning/cascade-graph-layout';

const VIEWPORT = { w: 600, h: 600 };

describe('computeCascadeGraphLayout', () => {
  it('returns an empty layout when given no nodes', () => {
    const layout = computeCascadeGraphLayout([], [], VIEWPORT.w, VIEWPORT.h);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
  });

  it('places a single node at the viewport center with no edges', () => {
    const layout = computeCascadeGraphLayout(
      ['a'],
      [{ source: 'a', target: 'a' }],
      VIEWPORT.w,
      VIEWPORT.h,
    );
    expect(layout.nodes).toHaveLength(1);
    expect(layout.nodes[0]).toEqual({
      id: 'a',
      x: VIEWPORT.w / 2,
      y: VIEWPORT.h / 2,
    });
    // Self-loop is skipped (zero-distance edge).
    expect(layout.edges).toEqual([]);
  });

  it('lays 3 nodes on a circle starting at 12 o\'clock and going clockwise', () => {
    const layout = computeCascadeGraphLayout(
      ['a', 'b', 'c'],
      [],
      VIEWPORT.w,
      VIEWPORT.h,
    );
    expect(layout.nodes).toHaveLength(3);

    const cx = VIEWPORT.w / 2;
    const cy = VIEWPORT.h / 2;

    // First node sits directly above center (12 o'clock).
    expect(layout.nodes[0]!.x).toBeCloseTo(cx, 6);
    expect(layout.nodes[0]!.y).toBeLessThan(cy);

    // All nodes equidistant from center.
    const radii = layout.nodes.map((n) =>
      Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2),
    );
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeCloseTo(radii[0]!, 6);
    }
  });

  it('lays 5 nodes evenly spaced on a circle inside viewport padding', () => {
    const layout = computeCascadeGraphLayout(
      ['n1', 'n2', 'n3', 'n4', 'n5'],
      [],
      VIEWPORT.w,
      VIEWPORT.h,
    );
    expect(layout.nodes).toHaveLength(5);

    const cx = VIEWPORT.w / 2;
    const cy = VIEWPORT.h / 2;
    const expectedRadius =
      Math.min(VIEWPORT.w, VIEWPORT.h) / 2 - CASCADE_VIEWPORT_PADDING;

    for (const n of layout.nodes) {
      const r = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2);
      expect(r).toBeCloseTo(expectedRadius, 6);
    }

    // All nodes stay inside the viewport.
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(VIEWPORT.w);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(VIEWPORT.h);
    }
  });

  it('lays 10 nodes evenly with consecutive angular spacing of 2π/10', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `n${i}`);
    const layout = computeCascadeGraphLayout(ids, [], VIEWPORT.w, VIEWPORT.h);
    expect(layout.nodes).toHaveLength(10);

    const cx = VIEWPORT.w / 2;
    const cy = VIEWPORT.h / 2;

    for (let i = 0; i < layout.nodes.length; i++) {
      const expectedAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 10;
      const actualAngle = Math.atan2(
        layout.nodes[i]!.y - cy,
        layout.nodes[i]!.x - cx,
      );
      // Normalize both angles into [-π, π) and compare.
      const norm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
      expect(norm(actualAngle)).toBeCloseTo(norm(expectedAngle), 6);
    }
  });

  it('shortens edge endpoints by NODE_RADIUS + ARROW_NODE_GAP at each end', () => {
    const layout = computeCascadeGraphLayout(
      ['a', 'b'],
      [{ source: 'a', target: 'b' }],
      VIEWPORT.w,
      VIEWPORT.h,
    );
    expect(layout.edges).toHaveLength(1);
    const e = layout.edges[0]!;
    const a = layout.nodes.find((n) => n.id === 'a')!;
    const b = layout.nodes.find((n) => n.id === 'b')!;

    const fullLen = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    const shortenedLen = Math.sqrt((e.x2 - e.x1) ** 2 + (e.y2 - e.y1) ** 2);
    const expectedShortening = 2 * (CASCADE_NODE_RADIUS + CASCADE_ARROW_NODE_GAP);

    expect(fullLen - shortenedLen).toBeCloseTo(expectedShortening, 6);
    expect(e.source).toBe('a');
    expect(e.target).toBe('b');
  });

  it('skips edges whose endpoints reference unknown node ids', () => {
    const layout = computeCascadeGraphLayout(
      ['a', 'b'],
      [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'ghost' },
        { source: 'phantom', target: 'b' },
      ],
      VIEWPORT.w,
      VIEWPORT.h,
    );
    expect(layout.edges).toHaveLength(1);
    expect(layout.edges[0]!.source).toBe('a');
    expect(layout.edges[0]!.target).toBe('b');
  });

  it('produces identical output across repeated calls (determinism)', () => {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const edges = [
      { source: 'p1', target: 'p2' },
      { source: 'p3', target: 'p4' },
      { source: 'p5', target: 'p1' },
    ];

    const a = computeCascadeGraphLayout(ids, edges, VIEWPORT.w, VIEWPORT.h);
    const b = computeCascadeGraphLayout(ids, edges, VIEWPORT.w, VIEWPORT.h);

    expect(a).toEqual(b);
  });
});
