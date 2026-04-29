/**
 * TowerPortfolioCascadeGraph — REASON-32
 *
 * Server-rendered portfolio-level cascade visualization. Collects every
 * known program + source-event instance id as nodes, calls
 * `computeCascadeImpacts` on each, and emits one edge per cascade impact
 * whose target lives inside the node set.
 *
 * Source-event ids and displayIds are aliased so a `linkedSourceEvents`
 * entry that references the displayId (e.g. `SRC-AMS-2026`) collapses to
 * the canonical instance id (`apex-retail-ams-outsourcing-2026`) inside
 * the graph.
 *
 * Pure server component — no hooks, no fetching, no client JS.
 */

import { CascadeGraphSvg } from '@/components/_shared/CascadeGraphSvg';
import type {
  CascadeGraphSvgEdge,
  CascadeGraphSvgNode,
} from '@/components/_shared/CascadeGraphSvg';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import { getRecentCascadeEvents } from '@/lib/reasoning/cascade-telemetry';
import { computeEdgeHitCounts } from '@/lib/reasoning/cascade-telemetry-overlay';

export function TowerPortfolioCascadeGraph() {
  // Build the node set first — programs + source events.
  const nodes: CascadeGraphSvgNode[] = [
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((p) => ({
      id: p.displayId,
      label: p.name,
    })),
    ...SOURCE_EVENT_INSTANCES.map((s) => ({
      id: s.displayId,
      label: s.name,
    })),
  ];

  // Map every alias (canonical id, displayId) → the canonical displayId we
  // use as the node id. Keeps cross-instance link payloads (which reference
  // either form) from creating phantom nodes.
  const idToDisplay = new Map<string, string>();
  for (const p of APEX_RETAIL_PROGRAM_INSTANCES) {
    idToDisplay.set(p.id, p.displayId);
    idToDisplay.set(p.displayId, p.displayId);
  }
  for (const s of SOURCE_EVENT_INSTANCES) {
    idToDisplay.set(s.id, s.displayId);
    idToDisplay.set(s.displayId, s.displayId);
  }
  const knownNodeIds = new Set(nodes.map((n) => n.id));

  // Collect cascade impacts from every instance, deduping (source, target,
  // linkType) so the same edge isn't emitted twice from both sides of the
  // dependency.
  const seenEdgeKeys = new Set<string>();
  const edges: CascadeGraphSvgEdge[] = [];

  const allInstances = [
    ...APEX_RETAIL_PROGRAM_INSTANCES,
    ...SOURCE_EVENT_INSTANCES,
  ];

  for (const inst of allInstances) {
    const impacts = computeCascadeImpacts(inst);
    for (const imp of impacts) {
      const sourceId = idToDisplay.get(imp.sourceInstanceId);
      const targetId = idToDisplay.get(imp.targetInstanceId);
      if (!sourceId || !targetId) continue;
      if (!knownNodeIds.has(sourceId) || !knownNodeIds.has(targetId)) continue;
      if (sourceId === targetId) continue;

      const key = `${sourceId}::${targetId}::${imp.linkType}`;
      if (seenEdgeKeys.has(key)) continue;
      seenEdgeKeys.add(key);

      edges.push({
        source: sourceId,
        target: targetId,
        severity: imp.impactSeverity ?? 'low',
        linkType: imp.linkType,
      });
    }
  }

  // Live telemetry overlay — fold recent cascade events through the same
  // canonical-id alias map, then drop any event whose endpoints aren't
  // part of the current node set (otherwise we'd count edges that aren't
  // drawn). The graph stays backward-compatible: when no events have
  // been recorded the map is empty and CascadeGraphSvg renders unchanged.
  const recentEvents = getRecentCascadeEvents();
  const aliasedEvents = recentEvents
    .map((ev) => {
      const sourceId = idToDisplay.get(ev.sourceInstanceId);
      const targetId = idToDisplay.get(ev.targetInstanceId);
      if (!sourceId || !targetId) return null;
      if (!knownNodeIds.has(sourceId) || !knownNodeIds.has(targetId))
        return null;
      return {
        ...ev,
        sourceInstanceId: sourceId,
        targetInstanceId: targetId,
      };
    })
    .filter((ev): ev is NonNullable<typeof ev> => ev !== null);
  const edgeHitCounts = computeEdgeHitCounts(aliasedEvents);

  return (
    <CascadeGraphSvg
      nodes={nodes}
      edges={edges}
      title="Portfolio cascade graph"
      edgeHitCounts={edgeHitCounts}
    />
  );
}

export default TowerPortfolioCascadeGraph;
