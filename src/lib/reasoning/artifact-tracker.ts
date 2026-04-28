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

/**
 * Status bucket an artifact match resolves to.
 *   - `present`     — the artifact is materially complete (e.g. approved/locked).
 *   - `in-progress` — the artifact exists but is not yet complete (e.g. draft).
 *   - `missing`     — no artifact maps to the expectation.
 */
export type ArtifactMatchStatus = 'present' | 'in-progress' | 'missing';

/**
 * Adapter that resolves an `ExpectedArtifact` against a concrete instance type
 * to its match status. Lets the tracker stay generic across instance shapes
 * (SourceEventInstance, ProgramInstance, etc.) while keeping the bucketing
 * rules identical.
 */
export type ArtifactMatchResolver<TInstance> = (
  expectation: ExpectedArtifact,
  instance: TInstance,
) => ArtifactMatchStatus;

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

/**
 * Default match resolver for `SourceEventInstance` — preserves the original
 * bucketing rules (approved/locked → present, draft → in-progress, otherwise
 * → in-progress when matched at all, missing when not).
 */
const sourceEventMatchResolver: ArtifactMatchResolver<SourceEventInstance> = (
  expectation,
  instance,
) => {
  const matched = findMatchingArtifact(expectation, instance);
  if (matched === undefined) return 'missing';
  if (COMPLETE_STATUSES.has(matched.status)) return 'present';
  if (IN_PROGRESS_STATUSES.has(matched.status)) return 'in-progress';
  // Unknown status — treat as in-progress (artifact exists but cannot be
  // relied on for gate clearance).
  return 'in-progress';
};

// ─── LifecycleArtifactTracker ──────────────────────────────────────────────────

/**
 * Tracks artifact completeness for an instance (Source, Program, etc.) against
 * a `LifecyclePatternSeed`'s `expectedArtifacts` list.
 *
 * Per-stage output buckets each expectation as `present` (instance has a
 * complete artifact), `inProgress` (instance has a draft), or `missing`
 * (no instance artifact maps to the expectation), and reports
 * `requiredMissingCount` for gate-readiness checks.
 *
 * Stage readiness (`isStageReady`) is true iff zero `required` artifacts
 * are missing for that stage.  Recommended and optional artifacts do not
 * block readiness.
 *
 * Generic over `TInstance`: a match resolver translates `(expectation, instance)`
 * into a `present | in-progress | missing` bucket, so the tracker can serve
 * Source events, Programs, and future surfaces without per-surface duplication.
 * The default resolver is provided for `SourceEventInstance`.
 */
export class LifecycleArtifactTracker<TInstance = SourceEventInstance>
  implements ArtifactTracker<TInstance>
{
  private readonly pattern: LifecyclePatternSeed;
  private readonly patternRef: PatternRef;
  private readonly resolver: ArtifactMatchResolver<TInstance>;

  constructor(
    pattern: LifecyclePatternSeed,
    resolver?: ArtifactMatchResolver<TInstance>,
  ) {
    this.pattern = pattern;
    this.patternRef = {
      patternId: pattern.patternId,
      patternVersion: pattern.version,
      section: '§ Expected artifacts',
    };
    // Default to the SourceEventInstance resolver when none is supplied so
    // existing callers (`createArtifactTracker(pattern)`) keep working unchanged.
    this.resolver = (resolver ?? (sourceEventMatchResolver as ArtifactMatchResolver<TInstance>));
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
    instance: TInstance,
  ): StageArtifactTracking {
    const expectations = this.expectationsForStage(stageId);
    const present: ArtifactExpectation[] = [];
    const inProgress: ArtifactExpectation[] = [];
    const missing: ArtifactExpectation[] = [];

    for (const expectation of expectations) {
      const status = this.resolver(expectation, instance);

      if (status === 'present') {
        present.push(toExpectation(expectation, true, this.patternRef));
      } else if (status === 'in-progress') {
        inProgress.push(toExpectation(expectation, false, this.patternRef));
      } else {
        missing.push(toExpectation(expectation, false, this.patternRef));
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
  trackAll(instance: TInstance): StageArtifactTracking[] {
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
  isStageReady(stageId: string, instance: TInstance): boolean {
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
 *
 * Pass an `ArtifactMatchResolver` to use the tracker with non-Source instance
 * shapes (e.g. `ProgramInstance`). Without a resolver the tracker defaults to
 * the `SourceEventInstance` resolver for backward compatibility.
 */
export function createArtifactTracker<TInstance = SourceEventInstance>(
  pattern: LifecyclePatternSeed,
  resolver?: ArtifactMatchResolver<TInstance>,
): LifecycleArtifactTracker<TInstance> {
  return new LifecycleArtifactTracker<TInstance>(pattern, resolver);
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
