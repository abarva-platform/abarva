// src/lib/reasoning/fixture-quality-lint.ts
//
// Pure fixture-quality lint for the reasoning layer.
//
// The reasoning layer pairs typed instance fixtures (SourceEventInstance,
// ProgramInstance) with lifecycle pattern seeds. The two corpora drift if a
// fixture author renames a stage on the pattern but forgets to update the
// fixture's `currentStage`, references a deleted `stageId` from an evidence
// item, or wires a `linkedPrograms` cross-reference to an instance that no
// longer exists. None of those drifts are caught at build time — TypeScript
// only enforces the broad `string` shape on `StageId` — but they all break
// gate evaluation, contradiction detection, and the cross-instance reasoner
// in subtle ways at render time.
//
// `lintFixtures()` walks every typed instance and emits a structured report
// of issues per instance. It is a pure, deterministic function — same inputs
// produce the same output, no I/O, no clock reads, no randomness — so it
// runs as a unit test (the green-on-master assertion) and as a server-rendered
// admin view.
//
// The lint is intentionally additive: when a future fixture corpus is added
// (e.g. tower portfolios), wire its array into the same module and the
// existing assertions extend without further test changes.

import type { LifecyclePatternSeed, LifecycleStage } from '@/lib/intelligence/seed-types';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import {
  SOURCE_EVENT_INSTANCES,
} from '@/lib/source/source-event-instances';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import {
  APEX_RETAIL_PROGRAM_INSTANCES,
} from '@/lib/programs/program-instances';
import type { ProgramInstance } from '@/lib/programs/program-instance';

// ─── Public types ─────────────────────────────────────────────────────────────

export type FixtureLintSeverity = 'error' | 'warning';

export interface FixtureLintIssue {
  instanceId: string;
  severity: FixtureLintSeverity;
  /** Short human-readable description; not a localised string, this is operator UI. */
  message: string;
}

export interface FixtureLintReport {
  totalInstances: number;
  issues: FixtureLintIssue[];
}

// ─── Inputs (overridable for tests) ───────────────────────────────────────────

export interface LintInputs {
  sourceInstances: ReadonlyArray<SourceEventInstance>;
  programInstances: ReadonlyArray<ProgramInstance>;
  patterns: ReadonlyArray<LifecyclePatternSeed>;
}

const DEFAULT_INPUTS: LintInputs = {
  sourceInstances: SOURCE_EVENT_INSTANCES,
  programInstances: APEX_RETAIL_PROGRAM_INSTANCES,
  patterns: [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function indexPatterns(
  patterns: ReadonlyArray<LifecyclePatternSeed>,
): Map<string, LifecyclePatternSeed> {
  const map = new Map<string, LifecyclePatternSeed>();
  for (const p of patterns) map.set(p.patternId, p);
  return map;
}

function stageIdSet(stages: ReadonlyArray<LifecycleStage>): Set<string> {
  return new Set(stages.map((s) => s.id));
}

/** Maps a program currentPhase number to the canonical 'P{n}-…' stage id. */
function programPhaseToStageId(
  phaseId: number,
  pattern: LifecyclePatternSeed,
): string | undefined {
  // Program patterns use stage IDs of shape 'P{n}-Label'. We match by
  // numeric prefix rather than exact label to stay resilient to label
  // tweaks (the canonical fact is the phase number, not its title).
  const prefix = `P${phaseId}-`;
  return pattern.stages.find((s) => s.id.startsWith(prefix))?.id;
}

// ─── Per-instance linters ─────────────────────────────────────────────────────

function lintSourceInstance(
  instance: SourceEventInstance,
  patternIndex: Map<string, LifecyclePatternSeed>,
  knownSourceIds: Set<string>,
  knownProgramIds: Set<string>,
): FixtureLintIssue[] {
  const out: FixtureLintIssue[] = [];

  const pattern = patternIndex.get(instance.patternId);
  if (!pattern) {
    out.push({
      instanceId: instance.id,
      severity: 'error',
      message: `patternId "${instance.patternId}" does not resolve to a known LifecyclePatternSeed`,
    });
    // Without a pattern the rest of the checks are not meaningful.
    return out;
  }

  const stages = stageIdSet(pattern.stages);

  // currentStage must be one of the pattern's declared stage ids.
  if (!stages.has(instance.currentStage)) {
    out.push({
      instanceId: instance.id,
      severity: 'error',
      message: `currentStage "${instance.currentStage}" is not declared on pattern ${pattern.patternId}`,
    });
  }

  // Each stageHistory entry must reference a known stage.
  for (const transition of instance.stageHistory) {
    if (!stages.has(transition.stageId)) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `stageHistory references unknown stageId "${transition.stageId}" on pattern ${pattern.patternId}`,
      });
    }
  }

  // Vendor invitedToStages must reference declared stages.
  for (const vendor of instance.vendors) {
    for (const stageId of vendor.invitedToStages) {
      if (!stages.has(stageId)) {
        out.push({
          instanceId: instance.id,
          severity: 'error',
          message: `vendor "${vendor.id}" invitedToStages references unknown stageId "${stageId}"`,
        });
      }
    }
  }

  // Vendor responses reference stages too.
  for (const response of instance.responses) {
    if (!stages.has(response.stageId)) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `vendor response "${response.id}" references unknown stageId "${response.stageId}"`,
      });
    }
  }

  // Artifact stageId.
  for (const artifact of instance.artifacts) {
    if (!stages.has(artifact.stageId)) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `artifact "${artifact.id}" references unknown stageId "${artifact.stageId}"`,
      });
    }
  }

  // Linked programs / source events reference resolvable IDs (warning, not error,
  // because cross-corpus drift may be intentional during fixture authoring).
  for (const link of instance.linkedPrograms) {
    if (!knownProgramIds.has(link.programId)) {
      out.push({
        instanceId: instance.id,
        severity: 'warning',
        message: `linkedPrograms entry "${link.programId}" does not resolve to a known program instance`,
      });
    }
  }
  for (const link of instance.linkedSourceEvents) {
    if (!knownSourceIds.has(link.sourceEventId)) {
      out.push({
        instanceId: instance.id,
        severity: 'warning',
        message: `linkedSourceEvents entry "${link.sourceEventId}" does not resolve to a known source event instance`,
      });
    }
  }

  return out;
}

function lintProgramInstance(
  instance: ProgramInstance,
  patternIndex: Map<string, LifecyclePatternSeed>,
  knownSourceIds: Set<string>,
  knownProgramIds: Set<string>,
): FixtureLintIssue[] {
  const out: FixtureLintIssue[] = [];

  const pattern = patternIndex.get(instance.patternId);
  if (!pattern) {
    out.push({
      instanceId: instance.id,
      severity: 'error',
      message: `patternId "${instance.patternId}" does not resolve to a known LifecyclePatternSeed`,
    });
    return out;
  }

  const stages = stageIdSet(pattern.stages);

  // currentPhase must be in 0–6 and resolve to a stage on the pattern.
  if (
    !Number.isInteger(instance.currentPhase) ||
    instance.currentPhase < 0 ||
    instance.currentPhase > 6
  ) {
    out.push({
      instanceId: instance.id,
      severity: 'error',
      message: `currentPhase ${instance.currentPhase} is outside the valid 0–6 range`,
    });
  } else if (!programPhaseToStageId(instance.currentPhase, pattern)) {
    out.push({
      instanceId: instance.id,
      severity: 'error',
      message: `currentPhase ${instance.currentPhase} does not resolve to a stage on pattern ${pattern.patternId}`,
    });
  }

  // Each phase entry must have a phaseId in 0–6 and resolve to a pattern stage.
  for (const phase of instance.phases) {
    if (
      !Number.isInteger(phase.phaseId) ||
      phase.phaseId < 0 ||
      phase.phaseId > 6
    ) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `phases entry phaseId ${phase.phaseId} is outside the valid 0–6 range`,
      });
      continue;
    }
    const stageId = programPhaseToStageId(phase.phaseId, pattern);
    if (!stageId || !stages.has(stageId)) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `phases entry phaseId ${phase.phaseId} does not resolve to a stage on pattern ${pattern.patternId}`,
      });
    }
  }

  // Deliverables phaseId in 0–6.
  for (const d of instance.deliverables) {
    if (!Number.isInteger(d.phaseId) || d.phaseId < 0 || d.phaseId > 6) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `deliverable "${d.id}" has phaseId ${d.phaseId} outside the valid 0–6 range`,
      });
    }
  }

  // Evidence items also carry phaseId — same range check.
  for (const ev of instance.evidence) {
    if (!Number.isInteger(ev.phaseId) || ev.phaseId < 0 || ev.phaseId > 6) {
      out.push({
        instanceId: instance.id,
        severity: 'error',
        message: `evidence "${ev.id}" has phaseId ${ev.phaseId} outside the valid 0–6 range`,
      });
    }
  }

  // Linked source events / programs reference resolvable IDs (warning).
  for (const link of instance.linkedSourceEvents) {
    if (!knownSourceIds.has(link.sourceEventId)) {
      out.push({
        instanceId: instance.id,
        severity: 'warning',
        message: `linkedSourceEvents entry "${link.sourceEventId}" does not resolve to a known source event instance`,
      });
    }
  }
  for (const link of instance.linkedPrograms) {
    if (!knownProgramIds.has(link.programId)) {
      out.push({
        instanceId: instance.id,
        severity: 'warning',
        message: `linkedPrograms entry "${link.programId}" does not resolve to a known program instance`,
      });
    }
  }

  return out;
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Lint the fixture corpus against the lifecycle pattern shapes.
 *
 * Pure: deterministic, no I/O. Iterates fixture arrays in their declaration
 * order, so the issue list is stable across runs.
 *
 * Pass an explicit `inputs` argument to lint a synthetic fixture set —
 * the `__tests__` suite uses this to exercise drift cases without mutating
 * the production corpus.
 */
export function lintFixtures(inputs: LintInputs = DEFAULT_INPUTS): FixtureLintReport {
  const patternIndex = indexPatterns(inputs.patterns);
  // The cross-instance reasoner accepts either the canonical `id` or the
  // operator-friendly `displayId` when resolving cross-instance links, so
  // we mirror that policy here: a link is "resolvable" if it matches either.
  const knownSourceIds = new Set<string>();
  for (const i of inputs.sourceInstances) {
    knownSourceIds.add(i.id);
    if (i.displayId) knownSourceIds.add(i.displayId);
  }
  const knownProgramIds = new Set<string>();
  for (const i of inputs.programInstances) {
    knownProgramIds.add(i.id);
    if (i.displayId) knownProgramIds.add(i.displayId);
  }

  const issues: FixtureLintIssue[] = [];

  for (const inst of inputs.sourceInstances) {
    issues.push(
      ...lintSourceInstance(inst, patternIndex, knownSourceIds, knownProgramIds),
    );
  }
  for (const inst of inputs.programInstances) {
    issues.push(
      ...lintProgramInstance(inst, patternIndex, knownSourceIds, knownProgramIds),
    );
  }

  return {
    totalInstances: inputs.sourceInstances.length + inputs.programInstances.length,
    issues,
  };
}

// ─── Convenience: split issues by severity ────────────────────────────────────

export interface FixtureLintSummary {
  totalInstances: number;
  errors: FixtureLintIssue[];
  warnings: FixtureLintIssue[];
}

export function summarizeLintReport(report: FixtureLintReport): FixtureLintSummary {
  return {
    totalInstances: report.totalInstances,
    errors: report.issues.filter((i) => i.severity === 'error'),
    warnings: report.issues.filter((i) => i.severity === 'warning'),
  };
}
