// Agent mission queue · gate-derived projection.
//
// Wraps the pure derivation in `@/lib/reasoning/mission-derivation.ts`
// against the canonical Apex Retail instance + pattern catalogues, and
// adapts the result to the AG11 panel mission shape so the Steward
// (Admin) and other surfaces can render auto-derived missions alongside
// fixture-authored entries.
//
// Pure module — no IO, no Date.now, no randomness. Same inputs always
// produce the same outputs.
//
// This module exists so surface components (Steward Setup Control
// Center, etc.) do not need to import directly from `@/lib/source/` or
// `@/lib/programs/` — the AG12 module-hygiene rule forbids those
// imports from surface components but allows imports from `@/lib/agent`.

import {
  deriveAllMissions,
  deriveMissionsFromInstance,
  type DerivedMission,
} from '@/lib/reasoning/mission-derivation';
import {
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  SOURCE_EVENT_INSTANCES,
} from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type {
  AgentMissionPanelMission,
  AgentMissionPanelPriority,
} from '@/lib/agent/agent-mission-view';

// ─── Build the deterministic catalogue once at module load ───────────────────

const ALL_INSTANCES = [
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  ...APEX_RETAIL_PROGRAM_INSTANCES,
];

const ALL_PATTERNS = [
  ...SOURCE_LIFECYCLE_PATTERNS,
  ...PROGRAM_LIFECYCLE_PATTERNS,
];

// ─── Public helpers ──────────────────────────────────────────────────────────

/**
 * Returns the auto-derived mission queue across all known instances + patterns,
 * sorted high → medium → low. Pure: same inputs → same outputs.
 */
export function buildDerivedAgentMissions(): readonly DerivedMission[] {
  return deriveAllMissions(ALL_INSTANCES, ALL_PATTERNS);
}

/**
 * Adapt a `DerivedMission` to the AG11 panel mission shape. All derived
 * missions render under the Steward agent because they are gate-criteria
 * compliance items.
 */
export function mapDerivedMissionToPanel(
  mission: DerivedMission,
): AgentMissionPanelMission {
  return {
    id: `derived:${mission.id}`,
    agent: 'steward',
    type: 'gate_check',
    state: 'active',
    priority: derivedPriorityToPanelPriority(mission.priority),
    workObjectLabel: `${mission.instanceLabel} · ${mission.stageId} gate`,
    rationale: mission.description,
    recommendedAction: mission.label,
    handoffTo: null,
    stopCondition:
      mission.evaluationHint ||
      'Criterion is satisfied or formally waived.',
  };
}

function derivedPriorityToPanelPriority(
  p: DerivedMission['priority'],
): AgentMissionPanelPriority {
  // DerivedMission priorities (high/medium/low) map 1:1 onto the panel's
  // (high/medium/low). There is no "critical" tier for derived gates.
  return p;
}

/**
 * Convenience: returns the top-N derived missions adapted to the AG11
 * panel mission shape. Default cap is 3 to match seed-fixture behaviour
 * across surfaces.
 */
export function getTopDerivedPanelMissions(
  limit = 3,
): readonly AgentMissionPanelMission[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  return buildDerivedAgentMissions()
    .slice(0, safeLimit)
    .map(mapDerivedMissionToPanel);
}

/**
 * Returns the auto-derived missions for a single Source event by id.
 *
 * Looks up the typed `SourceEventInstance` in `SOURCE_EVENT_INSTANCES`,
 * resolves its `patternId` against `SOURCE_LIFECYCLE_PATTERNS`, and runs
 * the pure derivation. Returns `[]` when no matching instance or pattern
 * is found — never throws — so detail pages can render an empty
 * mission list cleanly.
 */
export function getMissionsForSourceEvent(
  eventId: string,
): readonly DerivedMission[] {
  const instance = SOURCE_EVENT_INSTANCES.find((i) => i.id === eventId);
  if (!instance) return [];
  const pattern = SOURCE_LIFECYCLE_PATTERNS.find(
    (p) => p.patternId === instance.patternId,
  );
  if (!pattern) return [];
  return deriveMissionsFromInstance(instance, pattern);
}

/**
 * Returns the auto-derived portfolio mission queue across every program +
 * source-event instance, filtered by `priorityFloor` and limited to the
 * top-N rows. Sorted high → medium → low (with the canonical stable
 * tie-breaker from `deriveAllMissions`).
 *
 * - `limit` defaults to 10. Pass 0 (or a negative value) to receive an
 *   empty array.
 * - `priorityFloor` defaults to `'medium'` so the Tower portfolio queue
 *   only surfaces decisive (high + medium) missions. Pass `'low'` to
 *   include every pending criterion.
 *
 * Pure: same module-level fixtures + same arguments → same output.
 */
export function getPortfolioMissions(
  limit = 10,
  options: { priorityFloor?: 'high' | 'medium' | 'low' } = {},
): readonly DerivedMission[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return [];
  const floor = options.priorityFloor ?? 'medium';
  const PRIORITY_RANK: Record<'high' | 'medium' | 'low', number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const floorRank = PRIORITY_RANK[floor];
  return deriveAllMissions(ALL_INSTANCES, ALL_PATTERNS)
    .filter((m) => PRIORITY_RANK[m.priority] <= floorRank)
    .slice(0, safeLimit);
}

/**
 * Returns the auto-derived missions for a single Apex Retail program by id.
 *
 * Match is case-insensitive on either `id` or `displayId` to tolerate
 * the mixed-case program identifiers in router params. Returns `[]` when
 * no matching instance or pattern is found.
 */
export function getMissionsForProgram(
  programId: string,
): readonly DerivedMission[] {
  const needle = programId.toLowerCase();
  const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
    (i) =>
      i.id.toLowerCase() === needle || i.displayId.toLowerCase() === needle,
  );
  if (!instance) return [];
  const pattern = PROGRAM_LIFECYCLE_PATTERNS.find(
    (p) => p.patternId === instance.patternId,
  );
  if (!pattern) return [];
  return deriveMissionsFromInstance(instance, pattern);
}
