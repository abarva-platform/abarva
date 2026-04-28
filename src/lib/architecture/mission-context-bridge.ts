// CTX3 - Mission Context Bridge.
//
// Pure deterministic projection that joins AG10 agent missions to
// CTX2 unified context packs. Given an AgentMission and a tenantKey,
// the bridge maps the mission's work-object kind to a CTX2
// WorkObjectType, calls buildUnifiedContextPack, and returns a
// MissionContextBridgeResult that carries the resolved context pack,
// a MissionContextReadiness verdict, and an honest list of
// MissionContextGap entries describing what was missing or
// unsupported.
//
// CTX3 is a bridge, not a runtime. It does not stream, score, or
// invoke any agent. It does not call any model, perform live
// retrieval, or write to any persistent store. It reads only from
// CTX2 (unified-context-builder) and AG10 (agent-mission-queue) -
// both of which are themselves deterministic seed-backed read
// models.
//
// Companion to:
//   src/lib/architecture/unified-context-builder.ts (CTX2)
//   src/lib/agents/agent-mission-queue.ts (AG10)
//   docs/build/slices/CTX3_MISSION_CONTEXT_BRIDGE.md
//
// The bridge is intentionally narrow: CTX2 v1 supports three
// WorkObjectType kinds (program, intelligence_pattern,
// solution_archetype). AG10 missions reference nine work-object
// kinds. Kinds that do not project cleanly into CTX2 v1
// (tower_dimension, dataset_domain, sourcing_event, vendor_response)
// are surfaced as 'work_object_unsupported' with an explicit gap
// rather than silently dropped. Future CTX slices will widen the
// supported set without changing the bridge result shape.

import {
  buildUnifiedContextPack,
  type UnifiedContextBuildResult,
  type UnifiedContextMissingInput,
  type UnifiedContextQuality,
  type WorkObjectType,
} from '@/lib/architecture/unified-context-builder';
import {
  buildAgentMissionQueue,
  type AgentMission,
  type AgentMissionWorkObject,
  type AgentMissionWorkObjectKind,
} from '@/lib/agent/agent-mission-queue';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type MissionContextReadiness =
  | 'usable'
  | 'partial'
  | 'weak'
  | 'refused'
  | 'work_object_unsupported';

export interface MissionContextGap {
  kind: string;
  impact: 'blocks_response' | 'downgrades_quality' | 'missing_metadata';
  reason: string;
}

export interface MissionContextBuildRequest {
  mission: AgentMission;
  tenantKey: string;
}

export interface MissionContextBridgeResult {
  missionId: string;
  agent: AgentMission['agent'];
  workObject: AgentMissionWorkObject;
  /** null when work-object kind is unsupported by CTX2 v1. */
  contextResult: UnifiedContextBuildResult | null;
  readiness: MissionContextReadiness;
  gaps: readonly MissionContextGap[];
  basis: { source: 'mission_context_bridge'; bridgeVersion: string };
  createdFrom: 'deterministic_seed';
}

export interface MissionContextReadinessSummary {
  total: number;
  byReadiness: Record<MissionContextReadiness, number>;
  totalGaps: number;
  unsupportedWorkObjectKinds: readonly string[];
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const BRIDGE_VERSION = 'ctx3.v1';

/**
 * Canonical mapping from AG10 work-object kind to CTX2 WorkObjectType.
 *
 * - 'program' is the natural CTX2 program scope.
 * - 'phase' / 'workshop' / 'artifact' all live under a program in the
 *   canonical S9 read model, so they project to the program scope.
 *   The phase ordinal / workshop / artifact id is intentionally
 *   dropped in v1 - CTX2 program scope already covers phase timeline
 *   and artifact inventory via programs_canonical_view.
 * - 'pattern' projects to CTX2 'intelligence_pattern'.
 * - 'tower_dimension' / 'dataset_domain' / 'sourcing_event' /
 *   'vendor_response' have no CTX2 v1 work-object scope and are
 *   surfaced as unsupported.
 */
const SUPPORTED_KIND_MAP: Readonly<Partial<
  Record<AgentMissionWorkObjectKind, WorkObjectType>
>> = Object.freeze({
  program: 'program',
  phase: 'program',
  workshop: 'program',
  artifact: 'program',
  pattern: 'intelligence_pattern',
});

/** Work-object kinds CTX2 v1 cannot scope. Sorted ascending. */
const UNSUPPORTED_KINDS: ReadonlyArray<AgentMissionWorkObjectKind> = Object.freeze([
  'dataset_domain',
  'sourcing_event',
  'tower_dimension',
  'vendor_response',
] as const);

/** Canonical readiness states the summary will key on, in canonical order. */
const READINESS_ORDER: ReadonlyArray<MissionContextReadiness> = Object.freeze([
  'usable',
  'partial',
  'weak',
  'refused',
  'work_object_unsupported',
] as const);

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build a context bridge result for a single agent mission. Pure:
 * same request input produces byte-equal output across calls.
 */
export function buildContextForAgentMission(
  request: MissionContextBuildRequest,
): MissionContextBridgeResult {
  const { mission, tenantKey } = request;
  const kind = mission.workObject.kind;

  if (isUnsupportedKind(kind)) {
    const gap: MissionContextGap = {
      kind: 'work_object_kind_unsupported',
      impact: 'blocks_response',
      reason:
        `CTX2 v1 does not scope work-object kind '${kind}'. Mission '${mission.id}' cannot be projected into a unified context pack until a future CTX slice widens the supported kinds.`,
    };
    return Object.freeze({
      missionId: mission.id,
      agent: mission.agent,
      workObject: mission.workObject,
      contextResult: null,
      readiness: 'work_object_unsupported',
      gaps: Object.freeze([gap]),
      basis: Object.freeze({
        source: 'mission_context_bridge' as const,
        bridgeVersion: BRIDGE_VERSION,
      }),
      createdFrom: 'deterministic_seed' as const,
    });
  }

  const mappedKind = SUPPORTED_KIND_MAP[kind];
  if (!mappedKind) {
    // Defensive: every supported kind must be in SUPPORTED_KIND_MAP.
    // If a future AG10 kind lands without a CTX3 mapping, surface it
    // as unsupported rather than throwing.
    const gap: MissionContextGap = {
      kind: 'work_object_kind_unmapped',
      impact: 'blocks_response',
      reason:
        `Mission work-object kind '${kind}' has no CTX3 mapping yet; treating as unsupported.`,
    };
    return Object.freeze({
      missionId: mission.id,
      agent: mission.agent,
      workObject: mission.workObject,
      contextResult: null,
      readiness: 'work_object_unsupported',
      gaps: Object.freeze([gap]),
      basis: Object.freeze({
        source: 'mission_context_bridge' as const,
        bridgeVersion: BRIDGE_VERSION,
      }),
      createdFrom: 'deterministic_seed' as const,
    });
  }

  const contextResult = buildUnifiedContextPack({
    tenantKey,
    workObject: { kind: mappedKind, id: mission.workObject.id },
  });

  const gaps = promoteMissingInputsToGaps(contextResult.missingInputs);
  const readiness = mapQualityToReadiness(contextResult.quality);

  return Object.freeze({
    missionId: mission.id,
    agent: mission.agent,
    workObject: mission.workObject,
    contextResult,
    readiness,
    gaps: Object.freeze(gaps),
    basis: Object.freeze({
      source: 'mission_context_bridge' as const,
      bridgeVersion: BRIDGE_VERSION,
    }),
    createdFrom: 'deterministic_seed' as const,
  });
}

/**
 * Build context bridge results for a list of mission requests. The
 * canonical mission order from the caller is preserved verbatim.
 */
export function buildMissionContextBatch(
  requests: readonly MissionContextBuildRequest[],
): readonly MissionContextBridgeResult[] {
  const out: MissionContextBridgeResult[] = [];
  for (const request of requests) {
    out.push(buildContextForAgentMission(request));
  }
  return Object.freeze(out);
}

/**
 * Reconcile a list of bridge results: counts per readiness state,
 * total honest-gap count, and the sorted unique list of unsupported
 * work-object kinds. Pure.
 */
export function summarizeMissionContextReadiness(
  results: readonly MissionContextBridgeResult[],
): MissionContextReadinessSummary {
  const byReadiness: Record<MissionContextReadiness, number> = {
    usable: 0,
    partial: 0,
    weak: 0,
    refused: 0,
    work_object_unsupported: 0,
  };

  let totalGaps = 0;
  const unsupportedSet = new Set<string>();

  for (const result of results) {
    byReadiness[result.readiness] += 1;
    totalGaps += result.gaps.length;
    if (result.readiness === 'work_object_unsupported') {
      unsupportedSet.add(result.workObject.kind);
    }
  }

  const unsupportedWorkObjectKinds = Array.from(unsupportedSet).sort();

  return {
    total: results.length,
    byReadiness,
    totalGaps,
    unsupportedWorkObjectKinds,
  };
}

/**
 * Helper: build the bridge result for every seeded AG10 mission
 * against a single tenant key. Convenience for batch consumers; not
 * used by the bridge itself.
 */
export function buildMissionContextBatchForAllSeededMissions(
  tenantKey: string,
): readonly MissionContextBridgeResult[] {
  const missions = buildAgentMissionQueue();
  const requests: MissionContextBuildRequest[] = missions.map((mission) => ({
    mission,
    tenantKey,
  }));
  return buildMissionContextBatch(requests);
}

/**
 * The canonical readiness ordering. Useful for callers that render
 * summary chips in a stable order without re-deriving the canon.
 */
export function getMissionContextReadinessOrder(): ReadonlyArray<MissionContextReadiness> {
  return READINESS_ORDER;
}

// ---------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------

function isUnsupportedKind(kind: AgentMissionWorkObjectKind): boolean {
  return (UNSUPPORTED_KINDS as ReadonlyArray<string>).includes(kind);
}

function mapQualityToReadiness(
  quality: UnifiedContextQuality,
): MissionContextReadiness {
  switch (quality) {
    case 'usable':
      return 'usable';
    case 'partial':
      return 'partial';
    case 'weak':
      return 'weak';
    case 'refused':
      return 'refused';
  }
}

function promoteMissingInputsToGaps(
  missingInputs: ReadonlyArray<UnifiedContextMissingInput>,
): MissionContextGap[] {
  // 1:1 promotion. CTX2 missingInputs already carry the same shape;
  // we re-emit them with explicit MissionContextGap typing so callers
  // do not need to know about the CTX2 internal type. All fields are
  // preserved verbatim for byte-equal determinism.
  return missingInputs.map((input) => ({
    kind: input.kind,
    impact: input.impact,
    reason: input.reason,
  }));
}
