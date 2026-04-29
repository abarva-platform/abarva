/**
 * Cascade telemetry overlay — pure helpers that fold a stream of recent
 * `CascadeTelemetryEvent`s onto the static cascade graph edges so the
 * Tower portfolio graph can highlight which cross-instance edges have
 * been actively computed.
 *
 * No I/O, no React. Safe to call from server components and tests.
 *
 * Edge key convention: `${source}::${target}::${linkType}` — the same
 * shape used by `TowerPortfolioCascadeGraph` when deduping edges, so
 * caller-side merging does not have to rewrite keys.
 */

import type { CascadeTelemetryEvent } from './cascade-telemetry';

/**
 * Threshold above which an edge is considered "hot" — i.e. it has been
 * computed enough times in the recent window to deserve a brighter
 * visual treatment than a single-hit edge.
 */
export const CASCADE_HOT_EDGE_THRESHOLD = 5;

/**
 * Compose an edge key from its source / target / linkType triple. Kept
 * private to discourage callers from inventing their own format.
 */
function edgeKey(source: string, target: string, linkType: string): string {
  return `${source}::${target}::${linkType}`;
}

/**
 * Public form of the same composer — exported so callers (e.g. the
 * graph component) can look up counts without re-implementing the key.
 */
export function cascadeEdgeKey(
  source: string,
  target: string,
  linkType: string,
): string {
  return edgeKey(source, target, linkType);
}

/**
 * Fold a stream of cascade events into a `Map<edgeKey, hitCount>`.
 *
 * - Events whose linkType is unknown or empty are skipped.
 * - The map is iteration-deterministic in insertion order — handy for
 *   snapshot-style tests.
 */
export function computeEdgeHitCounts(
  events: CascadeTelemetryEvent[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ev of events) {
    if (!ev.linkType) continue;
    const key = edgeKey(
      ev.sourceInstanceId,
      ev.targetInstanceId,
      String(ev.linkType),
    );
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Minimal edge shape this helper needs — matches `CascadeGraphSvgEdge`
 * but is structurally typed so callers don't need to depend on the SVG
 * component type.
 */
export interface CascadeOverlayEdgeInput {
  source: string;
  target: string;
  linkType: string;
}

export type CascadeOverlayEdge<E extends CascadeOverlayEdgeInput> = E & {
  hitCount: number;
  isHot: boolean;
};

/**
 * Merge hit counts onto a list of static edges. Returns a new array;
 * input edges are not mutated.
 */
export function mergeEdgeHits<E extends CascadeOverlayEdgeInput>(
  edges: E[],
  events: CascadeTelemetryEvent[],
): Array<CascadeOverlayEdge<E>> {
  const counts = computeEdgeHitCounts(events);
  return edges.map((edge) => {
    const hitCount =
      counts.get(edgeKey(edge.source, edge.target, edge.linkType)) ?? 0;
    return {
      ...edge,
      hitCount,
      isHot: hitCount >= CASCADE_HOT_EDGE_THRESHOLD,
    };
  });
}
