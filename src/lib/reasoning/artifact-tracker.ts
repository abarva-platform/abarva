// src/lib/reasoning/artifact-tracker.ts
//
// Deterministic artifact tracker — Layer 3 pattern application (REASON-8).
// Joins a LifecyclePatternSeed's `expectedArtifacts` declarations against a
// SourceEventInstance's `artifacts` list and reports per-stage completeness.
//
// Like the gate evaluator and contradiction detector, this is pure: same
// inputs → same outputs. No LLM calls, no network access, no Date.now,
// no randomness.
//
// Mapping rules between pattern expectation and instance artifact:
//   - An instance artifact maps to an expectation when
//     `art.expectedArtifactId === expectation.id`.
//   - Falls back to `art.id === expectation.id` for instances that don't
//     populate `expectedArtifactId` (forward-compatible).
//
// Bucketing rules per expectation, derived from the matched artifact's status:
//   - matched + status `'approved'` or `'locked'` → `present`
//   - matched + status `'draft'`                  → `inProgress`
//   - no match                                    → `missing`

import type {
  ArtifactExpectation,
  ArtifactTracker,
  PatternRef,
  StageArtifactTracking,
} from './types';
import type {
  ExpectedArtifact,
  LifecyclePatternSeed,
} from '@/lib/intelligence/seed-types';
import type {
  SourceArtifactRef,
  SourceEventInstance,
} from '@/lib/source/source-event-instance';

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Status values that indicate an artifact is materially complete.
 * Aligns with `SourceArtifactRef.status` semantics:
 *   - `'approved'` — content reviewed and approved
 *   - `'locked'`   — frozen and immutable for the current stage
 */
const COMPLETE_STATUSES: ReadonlySet<SourceArtifactRef['status']> = new Set([
  'approved',
  'locked',
]);

/**
 * Status values that indicate an artifact is in progress.
 *   - `'draft'` — being authored but not yet approved
 */
const IN_PROGRESS_STATUSES: ReadonlySet<SourceArtifactRef['status']> = new Set([
  'draft',
]);

/**
 * Locate the instance artifact (if any) that fulfils a given expectation.
 *
 * Primary match: `art.expectedArtifactId === expectation.id`.
 * Fallback match: `art.id === expectation.id` (covers instances that have
 * not yet been migrated to populate `expectedArtifactId`).
 */
function findMatchingArtifact(
  expectation: ExpectedArtifact,
  instance: SourceEventInstance,
): SourceArtifactRef | undefined {
  // Primary: match by expectedArtifactId
  const byExpectedId = instance.artifacts.find(
    (a) => a.expectedArtifactId === expectation.id,
  );
  if (byExpectedId !== undefined) return byExpectedId;

  // Fallback: match by raw id
  return instance.artifacts.find((a) => a.id === expectation.id);
}

/**
 * Convert an ExpectedArtifact + presence flag into an ArtifactExpectation
 * suitable for inclusion in a tracking result.
 */
function toExpectation(
  expectation: ExpectedArtifact,
  present: boolean,
  patternRef: PatternRef,
): ArtifactExpectation {
  return {
    artifactId: expectation.id,
    label: expectation.label,
    stageId: expectation.stageId,
    requirement: expectation.requirement,
    gateType: expectation.gateType,
    present,
    patternRef: {
      ...patternRef,
      section: `§ Expected artifacts — ${expectation.stageId}`,
    },
  };
}

// ─── LifecycleArtifactTracker ──────────────────────────────────────────────────

/**
 * Tracks artifact completeness for a `SourceEventInstance` against a
 * `LifecyclePatternSeed`'s `expectedArtifacts` list.
 *
 * Per-stage output buckets each expectation as `present` (instance has a
 * complete artifact), `inProgress` (instance has a draft), or `missing`
 * (no instance artifact maps to the expectation), and reports
 * `requiredMissingCount` for gate-readiness checks.
 *
 * Stage readiness (`isStageReady`) is true iff zero `required` artifacts
 * are missing for that stage.  Recommended and optional artifacts do not
 * block readiness.
 */
export class LifecycleArtifactTracker
  implements ArtifactTracker<SourceEventInstance>
{
  private readonly pattern: LifecyclePatternSeed;
  private readonly patternRef: PatternRef;

  constructor(pattern: LifecyclePatternSeed) {
    this.pattern = pattern;
    this.patternRef = {
      patternId: pattern.patternId,
      patternVersion: pattern.version,
      section: '§ Expected artifacts',
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /** Pattern-declared expectations filtered to a single stage. */
  private expectationsForStage(stageId: string): ExpectedArtifact[] {
    return this.pattern.expectedArtifacts.filter((e) => e.stageId === stageId);
  }

  /**
   * Stage ids that have at least one expected artifact, returned in pattern
   * stage `order`.  Stages with no expectations are excluded so callers see
   * one entry per artifact-bearing stage.
   */
  private orderedStageIdsWithArtifacts(): string[] {
    const stageIdsWithArtifacts = new Set(
      this.pattern.expectedArtifacts.map((e) => e.stageId),
    );
    return [...this.pattern.stages]
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id)
      .filter((id) => stageIdsWithArtifacts.has(id));
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Compute per-stage artifact tracking.
   * Returns `present`, `inProgress`, `missing`, and `requiredMissingCount`.
   * If the stage has no expected artifacts the result has empty buckets and
   * `requiredMissingCount === 0`.
   */
  trackForStage(
    stageId: string,
    instance: SourceEventInstance,
  ): StageArtifactTracking {
    const expectations = this.expectationsForStage(stageId);
    const present: ArtifactExpectation[] = [];
    const inProgress: ArtifactExpectation[] = [];
    const missing: ArtifactExpectation[] = [];

    for (const expectation of expectations) {
      const matched = findMatchingArtifact(expectation, instance);

      if (matched === undefined) {
        missing.push(toExpectation(expectation, false, this.patternRef));
        continue;
      }

      if (COMPLETE_STATUSES.has(matched.status)) {
        present.push(toExpectation(expectation, true, this.patternRef));
      } else if (IN_PROGRESS_STATUSES.has(matched.status)) {
        inProgress.push(toExpectation(expectation, false, this.patternRef));
      } else {
        // Unknown status — be conservative and treat as in-progress so callers
        // see the artifact exists but cannot rely on it for gate clearance.
        inProgress.push(toExpectation(expectation, false, this.patternRef));
      }
    }

    const requiredMissingCount = missing.filter(
      (a) => a.requirement === 'required',
    ).length;

    return {
      stageId,
      present,
      inProgress,
      missing,
      requiredMissingCount,
    };
  }

  /**
   * Compute artifact tracking for every artifact-bearing stage in pattern
   * stage order.  Stages with no expectations are skipped.
   */
  trackAll(instance: SourceEventInstance): StageArtifactTracking[] {
    return this.orderedStageIdsWithArtifacts().map((stageId) =>
      this.trackForStage(stageId, instance),
    );
  }

  /**
   * True iff no required artifacts are missing for `stageId`.
   * Recommended and optional artifacts do not affect readiness.
   * In-progress required artifacts also block readiness — they are not yet
   * complete, but the question this method answers is "can the gate clear?",
   * which only `present` (approved/locked) artifacts can satisfy.
   */
  isStageReady(stageId: string, instance: SourceEventInstance): boolean {
    const tracking = this.trackForStage(stageId, instance);
    if (tracking.requiredMissingCount > 0) return false;

    // Required-but-in-progress artifacts also block readiness.
    const requiredInProgress = tracking.inProgress.filter(
      (a) => a.requirement === 'required',
    );
    return requiredInProgress.length === 0;
  }
}

// ─── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a `LifecycleArtifactTracker` for the given lifecycle pattern.
 * Prefer this over `new LifecycleArtifactTracker(...)` so consumers do not
 * need to import the class directly.
 */
export function createArtifactTracker(
  pattern: LifecyclePatternSeed,
): LifecycleArtifactTracker {
  return new LifecycleArtifactTracker(pattern);
}

/**
 * Convenience: compute per-stage tracking for every artifact-bearing stage
 * in one call.  Equivalent to `createArtifactTracker(pattern).trackAll(instance)`.
 */
export function trackArtifacts(
  pattern: LifecyclePatternSeed,
  instance: SourceEventInstance,
): StageArtifactTracking[] {
  return createArtifactTracker(pattern).trackAll(instance);
}
