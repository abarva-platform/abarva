// src/lib/reasoning/cross-instance-reasoner.ts
//
// REASON-18 — Cross-instance reasoner
//
// Pure functions that derive a renderable "linked program chip" payload from
// the linked ProgramInstance's current state. Replaces hardcoded chip text
// (e.g. "LINKED PROGRAM · APX-CDP-2026 P3 Design") so that if the linked
// program's phase or blocker status changes, the chip reflects the change
// at render time rather than lying.
//
// Deterministic: no network, no LLM calls, no randomness.

import type { CascadeImpact, LinkedInstance, LinkType } from './types';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Status color for the chip:
 * - `green` — linked program found, no open blocker affects the current phase
 * - `amber` — linked program has an open blocker whose phase ≤ current phase
 * - `gray`  — linked program could not be resolved
 */
export type LinkedProgramChipStatus = 'green' | 'amber' | 'gray';

/**
 * Pure data payload for rendering a linked-program chip.
 * Contains everything the UI needs — no JSX, no styling — so the same
 * payload can be rendered by a server component, a client chip, or asserted
 * against in tests.
 */
export interface LinkedProgramChipData {
  /** Constant label, e.g. "LINKED PROGRAM" — included so callers don't hardcode. */
  label: string;
  /** Numeric phase index of the linked program (0-6), or null if unresolved. */
  phase: number | null;
  /** Human label, e.g. "P3 Design", or "Unknown" if unresolved. */
  phaseLabel: string;
  /** Whether the linked program has an open blocker affecting the current phase. */
  hasBlocker: boolean;
  /** Description of the most relevant open blocker, if any. */
  blockerLabel?: string;
  /** Color status — see `LinkedProgramChipStatus` above. */
  status: LinkedProgramChipStatus;
  /** The linked program ID (echoed back for convenience). */
  linkedProgramId: string;
  /** Display name of the linked program, or the ID if unresolved. */
  linkedProgramName: string;
  /** The link type that was passed in. */
  linkType: LinkType;
}

// ─── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Look up a ProgramInstance by ID across the active program instances corpus.
 * Returns null if not found.
 *
 * Today this scans `APEX_RETAIL_PROGRAM_INSTANCES`; when additional tenants
 * are added the lookup can be widened without changing the call site.
 */
export function resolveLinkedProgram(linkedProgramId: string): ProgramInstance | null {
  return APEX_RETAIL_PROGRAM_INSTANCES.find((p) => p.id === linkedProgramId) ?? null;
}

// ─── Chip builder ──────────────────────────────────────────────────────────────

/**
 * Format a phase index (0-6) into a human label like "P3 Design".
 * Falls back to "P{n}" if the phase has no recorded label.
 */
function formatPhaseLabel(instance: ProgramInstance): string {
  const phase = instance.phases.find((p) => p.phaseId === instance.currentPhase);
  if (phase) return `P${phase.phaseId} ${phase.phaseLabel}`;
  return `P${instance.currentPhase}`;
}

/**
 * Locate the most-relevant open blocker on the linked program.
 *
 * Rule: a blocker is "relevant" if the program has any open `kind: 'blocker'`
 * flag. We additionally check linkedSourceEvents that depend-on a source
 * event whose blockedAtPhase ≤ currentPhase — these are upstream blocks.
 */
function findRelevantOpenBlocker(instance: ProgramInstance): string | null {
  const openBlocker = instance.flags.find((f) => f.kind === 'blocker' && f.status === 'open');
  if (openBlocker) return openBlocker.description;

  // Cross-instance source-event block at or before current phase
  const upstream = instance.linkedSourceEvents.find(
    (l) =>
      l.linkType === 'depends-on' &&
      l.blockedAtPhase !== undefined &&
      l.blockedAtPhase <= instance.currentPhase,
  );
  if (upstream) {
    return `Upstream block from ${upstream.sourceEventName}: ${upstream.description}`;
  }

  return null;
}

/**
 * Build a renderable chip payload for a linked program.
 *
 * Status logic:
 * - `gray`  if the linked program is not found
 * - `amber` if the linked program has any open blocker (or upstream depends-on
 *           block whose phase ≤ current phase)
 * - `green` otherwise
 *
 * Pure function — no async, no I/O. Same inputs always yield same outputs.
 */
export function buildLinkedProgramChip(
  linkedProgramId: string,
  linkType: LinkType,
): LinkedProgramChipData {
  const instance = resolveLinkedProgram(linkedProgramId);

  if (!instance) {
    return {
      label: 'LINKED PROGRAM',
      phase: null,
      phaseLabel: 'Unknown',
      hasBlocker: false,
      status: 'gray',
      linkedProgramId,
      linkedProgramName: linkedProgramId,
      linkType,
    };
  }

  const phaseLabel = formatPhaseLabel(instance);
  const blockerLabel = findRelevantOpenBlocker(instance);
  const hasBlocker = blockerLabel !== null;

  return {
    label: 'LINKED PROGRAM',
    phase: instance.currentPhase,
    phaseLabel,
    hasBlocker,
    ...(blockerLabel !== null ? { blockerLabel } : {}),
    status: hasBlocker ? 'amber' : 'green',
    linkedProgramId,
    linkedProgramName: instance.name,
    linkType,
  };
}

// ─── REASON-9 — Cascade impact computation ─────────────────────────────────────

/** Discriminator helper — distinguishes a ProgramInstance from a SourceEventInstance. */
function isProgramInstance(
  instance: ProgramInstance | SourceEventInstance,
): instance is ProgramInstance {
  return 'currentPhase' in instance && 'phases' in instance;
}

/**
 * Resolve a SourceEventInstance by either its full id (e.g.
 * `apex-retail-ams-outsourcing-2026`) or its displayId (e.g. `SRC-AMS-2026`).
 * The two are interchangeable in cross-instance link payloads, so we accept
 * either.
 */
export function resolveLinkedSourceEvent(
  sourceEventId: string,
): SourceEventInstance | null {
  if (!sourceEventId) return null;
  return (
    SOURCE_EVENT_INSTANCES.find(
      (s) => s.id === sourceEventId || s.displayId === sourceEventId,
    ) ?? null
  );
}

/**
 * Resolve a linked instance — program or source event — by id-or-displayId.
 * Returns the instance plus a discriminator so callers can branch.
 */
export function resolveLinkedInstance(
  instanceId: string,
):
  | { kind: 'program'; instance: ProgramInstance }
  | { kind: 'source-event'; instance: SourceEventInstance }
  | null {
  if (!instanceId) return null;
  const program = resolveLinkedProgram(instanceId);
  if (program) return { kind: 'program', instance: program };
  const source = resolveLinkedSourceEvent(instanceId);
  if (source) return { kind: 'source-event', instance: source };
  return null;
}

/** Does the program have any open blocker flag? */
function programHasOpenBlocker(p: ProgramInstance): boolean {
  return p.flags.some((f) => f.kind === 'blocker' && f.status === 'open');
}

/** Does the source event have any open blocker flag? */
function sourceHasOpenBlocker(s: SourceEventInstance): boolean {
  return s.flags.some((f) => f.kind === 'blocker' && f.status === 'open');
}

/**
 * Score the risk-tier severity of a single cascade impact.
 *
 * Rules (in order):
 * - `high`   — target has an open blocker AND a known timing/dependency
 *              conflict that points at the current/upcoming phase-or-stage.
 * - `medium` — target has an open blocker OR a known dependency block.
 * - `low`    — neither condition applies; the link is informational.
 *
 * Pure: same inputs always produce the same output.
 */
export function scoreImpactSeverity(
  target: ProgramInstance | SourceEventInstance,
  link: { linkType: LinkType; blockedAtPhase?: number; blockedAtStage?: string },
): 'low' | 'medium' | 'high' {
  const hasBlocker = isProgramInstance(target)
    ? programHasOpenBlocker(target)
    : sourceHasOpenBlocker(target);

  // Timing conflict: link declares the phase/stage being blocked AND that
  // phase/stage is at-or-before the target's current position.
  let timingConflict = false;
  if (isProgramInstance(target)) {
    if (
      link.blockedAtPhase !== undefined &&
      link.blockedAtPhase <= target.currentPhase
    ) {
      timingConflict = true;
    }
  } else {
    if (link.blockedAtStage && link.blockedAtStage === target.currentStage) {
      timingConflict = true;
    }
  }

  const isDependencyLink =
    link.linkType === 'depends-on' || link.linkType === 'unblocks';

  if (hasBlocker && timingConflict) return 'high';
  if (hasBlocker || (isDependencyLink && timingConflict)) return 'medium';
  return 'low';
}

/**
 * Compute every downstream cascade impact for the given instance.
 *
 * For a `SourceEventInstance` the source is the event and targets are the
 * linked programs. For a `ProgramInstance` we emit two flavours:
 *   1. Reverse-source links — `sourceEventId` -> this program (existing
 *      builder semantics: a depends-on link from a source event flows to the
 *      program when the source event drives the program's gate).
 *   2. Program-to-program links — this program -> linked program.
 *
 * Each entry is enriched with the existing `severity` field (preserved for
 * backward compatibility) plus the new `impactSeverity` tier from
 * `scoreImpactSeverity`.
 *
 * The result is sorted by `(targetInstanceId, linkType)` so that callers
 * can rely on stable ordering.
 */
export function computeCascadeImpacts(
  instance: SourceEventInstance | ProgramInstance,
): CascadeImpact[] {
  const out: CascadeImpact[] = [];

  if (isProgramInstance(instance)) {
    // Source events feeding this program — depends-on / feeds links.
    for (const link of instance.linkedSourceEvents) {
      const target = resolveLinkedSourceEvent(link.sourceEventId);
      const fallbackForTimingTarget: ProgramInstance | SourceEventInstance =
        target ?? instance; // if unknown, score against this program (worst case)
      const impactSeverity = scoreImpactSeverity(fallbackForTimingTarget, {
        linkType: link.linkType,
        ...(link.blockedAtPhase !== undefined
          ? { blockedAtPhase: link.blockedAtPhase }
          : {}),
      });
      out.push({
        sourceInstanceId: link.sourceEventId,
        targetInstanceId: instance.id,
        linkType: link.linkType,
        impact: link.description,
        severity:
          link.linkType === 'depends-on' ? 'blocking' : 'informational',
        impactSeverity,
        targetInstanceName: instance.name,
      });
    }
    // Program-to-program cascades.
    for (const link of instance.linkedPrograms) {
      const target = resolveLinkedProgram(link.programId);
      const impactSeverity = target
        ? scoreImpactSeverity(target, { linkType: link.linkType })
        : 'low';
      out.push({
        sourceInstanceId: instance.id,
        targetInstanceId: link.programId,
        linkType: link.linkType,
        impact: link.description,
        severity:
          link.linkType === 'depends-on' ? 'blocking' : 'informational',
        impactSeverity,
        ...(target ? { targetInstanceName: target.name } : {}),
      });
    }
  } else {
    // Source event → linked programs.
    for (const link of instance.linkedPrograms) {
      const target = resolveLinkedProgram(link.programId);
      let blockedAtPhase: number | undefined;
      // Map blockedAtStage strings like "P3 Design" to phase number 3.
      if (link.blockedAtStage) {
        const m = link.blockedAtStage.match(/^P(\d)/);
        if (m) blockedAtPhase = Number(m[1]);
      }
      const impactSeverity = target
        ? scoreImpactSeverity(target, {
            linkType: link.linkType,
            ...(blockedAtPhase !== undefined ? { blockedAtPhase } : {}),
          })
        : 'low';
      out.push({
        sourceInstanceId: instance.id,
        targetInstanceId: link.programId,
        linkType: link.linkType,
        impact: link.description,
        severity:
          link.linkType === 'unblocks' ? 'blocking' : 'informational',
        impactSeverity,
        ...(target ? { targetInstanceName: target.name } : {}),
      });
    }
  }

  // Stable order — by target id then linkType — so output is deterministic.
  out.sort((a, b) => {
    if (a.targetInstanceId === b.targetInstanceId) {
      return a.linkType.localeCompare(b.linkType);
    }
    return a.targetInstanceId.localeCompare(b.targetInstanceId);
  });

  return out;
}

/**
 * Compute upstream dependencies for the instance — the set of linked
 * instances this instance is waiting on. Useful for explanatory UI like
 * "Waiting on: AMS Vendor Consolidation 2026".
 *
 * Considers `depends-on` and `unblocks` link types in either direction:
 *   - Programs whose `linkedSourceEvents[].linkType === 'depends-on'`.
 *   - Programs whose `linkedPrograms[].linkType === 'depends-on'`.
 *   - Source events whose `linkedPrograms[].linkType === 'unblocks'` flow
 *     reverse: the source event is what the program is waiting on.
 *
 * Output is sorted by `instanceId` for determinism.
 */
export function computeReverseCascade(
  instance: SourceEventInstance | ProgramInstance,
): LinkedInstance[] {
  const out: LinkedInstance[] = [];

  if (isProgramInstance(instance)) {
    for (const link of instance.linkedSourceEvents) {
      if (link.linkType !== 'depends-on' && link.linkType !== 'feeds') continue;
      out.push({
        instanceId: link.sourceEventId,
        instanceType: 'source-event',
        linkType: link.linkType,
        description: link.description,
      });
    }
    for (const link of instance.linkedPrograms) {
      if (link.linkType !== 'depends-on') continue;
      out.push({
        instanceId: link.programId,
        instanceType: 'program',
        linkType: link.linkType,
        description: link.description,
      });
    }
  } else {
    // Source event waiting on something is rare in current corpus; surface
    // any linkedSourceEvents with depends-on type for completeness.
    for (const link of instance.linkedSourceEvents) {
      if (link.linkType !== 'depends-on' && link.linkType !== 'feeds') continue;
      out.push({
        instanceId: link.sourceEventId,
        instanceType: 'source-event',
        linkType: link.linkType,
        description: link.description,
      });
    }
  }

  out.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  return out;
}

/** Node in a multi-hop cascade graph. */
export interface CascadeGraphNode {
  instanceId: string;
  instanceType: 'program' | 'source-event';
  name: string;
  /** Distance from the root, in hops. */
  depth: number;
}

/** Edge in a multi-hop cascade graph. */
export interface CascadeGraphEdge {
  from: string;
  to: string;
  linkType: LinkType;
  description: string;
}

export interface CascadeGraph {
  nodes: CascadeGraphNode[];
  edges: CascadeGraphEdge[];
}

/**
 * Walk the cross-instance graph from `rootInstanceId` outward up to `depth`
 * hops. The walk follows downstream cascade edges (linked programs / linked
 * source events) and is breadth-first so the shallowest path to each node
 * wins. Cycles are guarded by a visited set.
 *
 * Output is deterministic: nodes sorted by `(depth, instanceId)`, edges
 * sorted by `(from, to, linkType)`.
 */
export function traceMultiHop(
  rootInstanceId: string,
  depth = 2,
): CascadeGraph {
  const root = resolveLinkedInstance(rootInstanceId);
  if (!root) return { nodes: [], edges: [] };

  const nodes = new Map<string, CascadeGraphNode>();
  const edges: CascadeGraphEdge[] = [];
  const visited = new Set<string>();

  const enqueue = (
    id: string,
    kind: 'program' | 'source-event',
    name: string,
    d: number,
  ) => {
    if (!nodes.has(id)) {
      nodes.set(id, { instanceId: id, instanceType: kind, name, depth: d });
    }
  };

  enqueue(
    rootInstanceId,
    root.kind,
    root.kind === 'program' ? root.instance.name : root.instance.name,
    0,
  );

  // BFS
  let frontier: Array<{
    id: string;
    kind: 'program' | 'source-event';
    instance: ProgramInstance | SourceEventInstance;
    d: number;
  }> = [{ id: rootInstanceId, kind: root.kind, instance: root.instance, d: 0 }];

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      if (node.d >= depth) continue;
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      // The node may have an internal id different from its displayId/link id
      // (e.g. AMS instance.id is 'apex-retail-ams-outsourcing-2026' but is
      // referenced elsewhere as 'SRC-AMS-2026'). We treat both as identifying
      // this node when interpreting cascade impact direction.
      const nodeAliases = new Set<string>([node.id, node.instance.id]);
      if (!isProgramInstance(node.instance) && node.instance.displayId) {
        nodeAliases.add(node.instance.displayId);
      }

      const impacts = computeCascadeImpacts(node.instance);
      for (const imp of impacts) {
        // Direction: the impact's targetInstanceId is the downstream node.
        // For program reverse-source impacts (where this node is the target,
        // not the source) we follow the source upstream so the graph captures
        // both directions of the dependency relationship within `depth` hops.
        const sourceIsThisNode = nodeAliases.has(imp.sourceInstanceId);
        const downstreamId = sourceIsThisNode
          ? imp.targetInstanceId
          : imp.sourceInstanceId;

        const resolved = resolveLinkedInstance(downstreamId);
        const downstreamName = resolved ? resolved.instance.name : downstreamId;
        const downstreamKind: 'program' | 'source-event' = resolved
          ? resolved.kind
          : downstreamId.startsWith('SRC-') ||
              downstreamId.startsWith('apex-retail-ams')
            ? 'source-event'
            : 'program';

        enqueue(downstreamId, downstreamKind, downstreamName, node.d + 1);
        edges.push({
          from: sourceIsThisNode ? node.id : downstreamId,
          to: sourceIsThisNode ? downstreamId : node.id,
          linkType: imp.linkType,
          description: imp.impact,
        });

        if (resolved && !visited.has(downstreamId)) {
          next.push({
            id: downstreamId,
            kind: resolved.kind,
            instance: resolved.instance,
            d: node.d + 1,
          });
        }
      }
    }
    frontier = next;
  }

  // Deduplicate edges: same (from,to,linkType) collapses.
  const edgeKey = (e: CascadeGraphEdge) =>
    `${e.from}::${e.to}::${e.linkType}`;
  const seenEdges = new Set<string>();
  const uniqueEdges: CascadeGraphEdge[] = [];
  for (const e of edges) {
    const k = edgeKey(e);
    if (seenEdges.has(k)) continue;
    seenEdges.add(k);
    uniqueEdges.push(e);
  }

  const nodeList = Array.from(nodes.values()).sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.instanceId.localeCompare(b.instanceId);
  });
  uniqueEdges.sort((a, b) => {
    if (a.from !== b.from) return a.from.localeCompare(b.from);
    if (a.to !== b.to) return a.to.localeCompare(b.to);
    return a.linkType.localeCompare(b.linkType);
  });

  return { nodes: nodeList, edges: uniqueEdges };
}
