/**
 * Cascade telemetry overlay tests — deterministic, no I/O.
 */

import {
  computeEdgeHitCounts,
  mergeEdgeHits,
  cascadeEdgeKey,
  CASCADE_HOT_EDGE_THRESHOLD,
} from '@/lib/reasoning/cascade-telemetry-overlay';
import type { CascadeTelemetryEvent } from '@/lib/reasoning/cascade-telemetry';

function ev(
  source: string,
  target: string,
  linkType: string,
  idx: number,
): CascadeTelemetryEvent {
  return {
    id: `csc_test_${idx}`,
    timestamp: new Date(2026, 0, 1, 0, 0, idx).toISOString(),
    sourceInstanceId: source,
    targetInstanceId: target,
    linkType,
    severity: 'medium',
    impactSeverity: 'medium',
    buildContext: 'tower-synthesis',
  };
}

describe('computeEdgeHitCounts', () => {
  it('returns an empty map when no events are supplied', () => {
    const counts = computeEdgeHitCounts([]);
    expect(counts.size).toBe(0);
  });

  it('aggregates duplicate (source, target, linkType) triples', () => {
    const events = [
      ev('a', 'b', 'unblocks', 1),
      ev('a', 'b', 'unblocks', 2),
      ev('a', 'b', 'unblocks', 3),
      ev('a', 'c', 'depends_on', 4),
    ];
    const counts = computeEdgeHitCounts(events);
    expect(counts.get(cascadeEdgeKey('a', 'b', 'unblocks'))).toBe(3);
    expect(counts.get(cascadeEdgeKey('a', 'c', 'depends_on'))).toBe(1);
    expect(counts.size).toBe(2);
  });

  it('treats different linkTypes as distinct edges between the same pair', () => {
    const events = [
      ev('a', 'b', 'unblocks', 1),
      ev('a', 'b', 'depends_on', 2),
    ];
    const counts = computeEdgeHitCounts(events);
    expect(counts.get(cascadeEdgeKey('a', 'b', 'unblocks'))).toBe(1);
    expect(counts.get(cascadeEdgeKey('a', 'b', 'depends_on'))).toBe(1);
  });
});

describe('mergeEdgeHits', () => {
  it('returns hitCount 0 and isHot false for edges with no events', () => {
    const merged = mergeEdgeHits(
      [{ source: 'a', target: 'b', linkType: 'unblocks', severity: 'low' }],
      [],
    );
    expect(merged).toEqual([
      {
        source: 'a',
        target: 'b',
        linkType: 'unblocks',
        severity: 'low',
        hitCount: 0,
        isHot: false,
      },
    ]);
  });

  it('marks an edge as hot once hits reach the threshold', () => {
    const events = Array.from({ length: CASCADE_HOT_EDGE_THRESHOLD }, (_, i) =>
      ev('a', 'b', 'unblocks', i),
    );
    const merged = mergeEdgeHits(
      [
        { source: 'a', target: 'b', linkType: 'unblocks' },
        { source: 'a', target: 'c', linkType: 'unblocks' },
      ],
      events,
    );
    expect(merged[0]!.hitCount).toBe(CASCADE_HOT_EDGE_THRESHOLD);
    expect(merged[0]!.isHot).toBe(true);
    expect(merged[1]!.hitCount).toBe(0);
    expect(merged[1]!.isHot).toBe(false);
  });

  it('does not mutate the input edges array', () => {
    const edges = [
      { source: 'a', target: 'b', linkType: 'unblocks', severity: 'medium' },
    ];
    const snapshot = JSON.parse(JSON.stringify(edges));
    mergeEdgeHits(edges, [ev('a', 'b', 'unblocks', 1)]);
    expect(edges).toEqual(snapshot);
  });
});
