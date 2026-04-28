// OPS3 · Automated Wave Runner Model v1.
//
// Pure deterministic read model that encodes the AbarVa wave execution
// protocol as a typed data structure. The wave runner model defines:
//
//   - the canonical steps an orchestration agent must follow per wave
//   - the gate conditions that determine pass/block at each step
//   - the hygiene requirements enforced before merge
//   - the rollback triggers that stop execution
//
// This module is the documentation contract for the autonomous
// orchestration loop. The orchestration agent reads this model to
// understand what is required at each step; the Steward agent uses it
// to surface blockers.
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no audit ledger writes, no Steward runtime.

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

/**
 * Canonical step kind in the wave execution protocol.
 */
export type WaveRunnerStepKind =
  | 'orient'
  | 'identify_wave'
  | 'check_blockers'
  | 'read_wave_spec'
  | 'create_branch'
  | 'implement_slices'
  | 'run_typecheck'
  | 'run_tests'
  | 'run_lint'
  | 'run_hygiene_gate'
  | 'stage_and_commit'
  | 'push_and_pr'
  | 'watch_ci'
  | 'merge'
  | 'update_trackers'
  | 'update_state'
  | 'notify';

/**
 * Gate result for a single step.
 *
 * - pass       → proceed to the next step
 * - block      → stop and escalate (Tier 3 condition)
 * - warn       → proceed with disclosure in final report (Tier 2)
 * - skip       → step not applicable for this wave
 */
export type WaveRunnerGateResult = 'pass' | 'block' | 'warn' | 'skip';

/**
 * Tier classification for an escalation condition.
 *
 * - tier1 → auto-resolve
 * - tier2 → auto-resolve + notify after merge
 * - tier3 → stop and notify; human required
 */
export type EscalationTier = 'tier1' | 'tier2' | 'tier3';

/**
 * A gate condition that can block or warn during wave execution.
 */
export interface WaveRunnerGateCondition {
  conditionId: string;
  description: string;
  tier: EscalationTier;
  autoResolution?: string;
  humanAction?: string;
}

/**
 * A single step in the wave execution protocol.
 */
export interface WaveRunnerStep {
  stepId: string;
  stepKind: WaveRunnerStepKind;
  /** Short label for the step. */
  label: string;
  /** Detailed description of what the step does. */
  description: string;
  /** Commands or actions to execute in this step. */
  actions: ReadonlyArray<string>;
  /** Gate conditions that apply at this step. */
  gateConditions: ReadonlyArray<WaveRunnerGateCondition>;
  /** True when this step must complete before any subsequent step starts. */
  blocking: boolean;
}

/**
 * The full wave runner protocol — ordered list of steps.
 */
export interface WaveRunnerProtocol {
  protocolVersion: '1.0';
  name: string;
  description: string;
  steps: ReadonlyArray<WaveRunnerStep>;
  createdFrom: 'deterministic_wave_runner_model_v1';
}

// ---------------------------------------------------------------------
// Canonical protocol
// ---------------------------------------------------------------------

const WAVE_RUNNER_STEPS: ReadonlyArray<WaveRunnerStep> = [
  {
    stepId: 'step-01-orient',
    stepKind: 'orient',
    label: 'Orient',
    description:
      'Read BACKLOG_CURRENT_STATE.md, BACKLOG_ESCALATION_POLICY.md, WAVE_ROADMAP.md, and backlog-registry.json to understand the current state.',
    actions: [
      'Read docs/backlog/BACKLOG_CURRENT_STATE.md',
      'Read docs/backlog/BACKLOG_ESCALATION_POLICY.md',
      'Read docs/backlog/WAVE_ROADMAP.md',
      'Read docs/backlog/backlog-registry.json',
    ],
    gateConditions: [],
    blocking: true,
  },
  {
    stepId: 'step-02-identify',
    stepKind: 'identify_wave',
    label: 'Identify next wave',
    description:
      'From BACKLOG_CURRENT_STATE.md, read nextWave. If missing, find the lowest-numbered wave not yet completed in WAVE_ROADMAP.md.',
    actions: ['Read nextWave from BACKLOG_CURRENT_STATE.md'],
    gateConditions: [],
    blocking: true,
  },
  {
    stepId: 'step-03-blockers',
    stepKind: 'check_blockers',
    label: 'Check blockers',
    description:
      'Check blockerConditions in BACKLOG_CURRENT_STATE.md. Block on any human-required condition.',
    actions: ['Read blockerConditions from BACKLOG_CURRENT_STATE.md'],
    gateConditions: [
      {
        conditionId: 'blocker-human-required',
        description: 'A blocker condition is marked human-required.',
        tier: 'tier3',
        humanAction: 'Resolve the blocker condition before proceeding.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-04-read-spec',
    stepKind: 'read_wave_spec',
    label: 'Read wave spec',
    description:
      'Read the wave spec file. If no file exists, synthesise from WAVE_ROADMAP.md and track BACKLOG.md.',
    actions: [
      'Read docs/backlog/waves/WAVE-XX-<THEME>.md (or synthesise from WAVE_ROADMAP.md)',
      'Read docs/backlog/tracks/<track>/BACKLOG.md for primary track',
    ],
    gateConditions: [
      {
        conditionId: 'no-wave-spec',
        description: 'Wave spec file does not exist.',
        tier: 'tier1',
        autoResolution: 'Synthesise from WAVE_ROADMAP.md + track BACKLOG.md.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-05-branch',
    stepKind: 'create_branch',
    label: 'Create branch from main',
    description:
      'Check out from origin/main or the confirmed wave SHA. Never work from a stale local main.',
    actions: [
      'git fetch origin main',
      'git branch codex/<wave-branch-name> <main-sha>',
      'git worktree add /tmp/nexus-<wave> codex/<wave-branch-name>',
    ],
    gateConditions: [
      {
        conditionId: 'duplicate-slice-id',
        description: 'A slice ID already exists in build-slices.json as code_complete.',
        tier: 'tier1',
        autoResolution: 'Skip that slice. Proceed with remaining slices.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-06-implement',
    stepKind: 'implement_slices',
    label: 'Implement slices',
    description:
      'For each slice in the wave: create the target files, write pure deterministic TypeScript, add tests.',
    actions: [
      'Create src/lib/<module>/<slice>.ts',
      'Create src/__tests__/integration/<module>/<slice>.test.ts',
      'Follow allowed/forbidden file lists from the wave spec',
    ],
    gateConditions: [
      {
        conditionId: 'migration-required',
        description: 'A new database migration is needed.',
        tier: 'tier3',
        humanAction: 'Founder must approve the migration before proceeding.',
      },
      {
        conditionId: 'auth-change-required',
        description: 'Auth or Clerk configuration must change.',
        tier: 'tier3',
        humanAction: 'Founder must approve auth changes before proceeding.',
      },
      {
        conditionId: 'design-decision-missing',
        description: 'A design decision has no page blueprint coverage.',
        tier: 'tier3',
        humanAction: 'Founder must supply a blueprint or design decision.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-07-typecheck',
    stepKind: 'run_typecheck',
    label: 'TypeScript check',
    description: 'Run tsc --noEmit. Must return 0 errors.',
    actions: ['node_modules/.bin/tsc --noEmit --pretty false'],
    gateConditions: [
      {
        conditionId: 'ts-missing-import',
        description: 'TypeScript error from missing import.',
        tier: 'tier1',
        autoResolution: 'Add the import; re-check.',
      },
      {
        conditionId: 'ts-wrong-prop-type',
        description: 'TypeScript error from wrong prop type (read-model).',
        tier: 'tier1',
        autoResolution: 'Fix the type in the read-model file only.',
      },
      {
        conditionId: 'ts-business-logic',
        description: 'TypeScript error requires understanding business logic.',
        tier: 'tier3',
        humanAction: 'Architect review required.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-08-tests',
    stepKind: 'run_tests',
    label: 'Jest tests',
    description: 'Run Jest on the new test files. All new tests must pass.',
    actions: [
      'node_modules/.bin/jest src/__tests__/integration/<module>/ --no-coverage',
    ],
    gateConditions: [
      {
        conditionId: 'test-path-wrong',
        description: 'Test file references wrong path.',
        tier: 'tier1',
        autoResolution: 'Fix the path; re-run.',
      },
      {
        conditionId: 'test-regression',
        description: 'Pre-existing test that was passing is now failing.',
        tier: 'tier3',
        humanAction: 'Diagnose regression before proceeding.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-09-lint',
    stepKind: 'run_lint',
    label: 'ESLint',
    description:
      'Run ESLint on the new files with --max-warnings=0. Must return 0 warnings.',
    actions: [
      'node_modules/.bin/eslint src/lib/<module>/ src/__tests__/integration/<module>/ --max-warnings=0',
    ],
    gateConditions: [
      {
        conditionId: 'lint-unused-import',
        description: 'ESLint unused import warning.',
        tier: 'tier1',
        autoResolution: 'Remove the unused import.',
      },
      {
        conditionId: 'lint-new-warning',
        description: 'Build produces a new lint warning.',
        tier: 'tier2',
        autoResolution: 'Proceed; note in final report.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-10-hygiene',
    stepKind: 'run_hygiene_gate',
    label: 'Hygiene gate',
    description:
      'Run git diff --check. Must return no trailing whitespace.',
    actions: ['git diff --check'],
    gateConditions: [
      {
        conditionId: 'whitespace-error',
        description: 'Hygiene gate: whitespace error.',
        tier: 'tier1',
        autoResolution: 'Fix the whitespace; re-run.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-11-commit',
    stepKind: 'stage_and_commit',
    label: 'Stage and commit',
    description:
      'Stage explicitly named files. Never git add -A. Create commit with wave summary.',
    actions: [
      'git add <explicit file list>',
      'git commit -m "feat(<module>): <wave-title> · <SLICE_IDs>"',
    ],
    gateConditions: [],
    blocking: true,
  },
  {
    stepId: 'step-12-push-pr',
    stepKind: 'push_and_pr',
    label: 'Push and create PR',
    description:
      'Push the branch to origin and open a PR against main.',
    actions: [
      'git push origin codex/<wave-branch-name>',
      'gh pr create --title "..." --body "..." --base main',
    ],
    gateConditions: [],
    blocking: true,
  },
  {
    stepId: 'step-13-ci',
    stepKind: 'watch_ci',
    label: 'Watch CI',
    description:
      'Wait for all CI checks to complete. Block on code failures; pass billing-quota failures.',
    actions: ['gh pr checks <PR_NUMBER>', 'Poll until no pending checks'],
    gateConditions: [
      {
        conditionId: 'ci-billing-quota',
        description: 'CI: GitHub Actions billing quota failure.',
        tier: 'tier1',
        autoResolution: 'Treat as pass if Vercel checks pass; merge.',
      },
      {
        conditionId: 'ci-code-failure',
        description: 'GitHub Actions fails with a code failure (not billing).',
        tier: 'tier3',
        humanAction: 'Diagnose CI failure before merge.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-14-merge',
    stepKind: 'merge',
    label: 'Merge',
    description: 'Merge the PR using squash merge.',
    actions: ['gh pr merge <PR_NUMBER> --squash'],
    gateConditions: [
      {
        conditionId: 'merge-blocked-by-reviewer',
        description: 'Merge blocked by a human reviewer request.',
        tier: 'tier3',
        humanAction: 'Wait for the reviewer to unblock the merge.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-15-trackers',
    stepKind: 'update_trackers',
    label: 'Update trackers',
    description:
      'Update build-slices.json, build-waves.json, and backlog-registry.json with the wave results.',
    actions: [
      'Update docs/build/build-slices.json — mark slices as code_complete',
      'Update docs/build/build-waves.json — add wave entry with mergedPrs',
      'Update docs/backlog/backlog-registry.json — mark slices as completed',
      'Update EXPECTED_WAVE_IDS in build-wave-progress.test.ts if needed',
    ],
    gateConditions: [
      {
        conditionId: 'json-parse-failure',
        description: 'Hygiene gate: JSON parse failure in tracker.',
        tier: 'tier1',
        autoResolution: 'Fix the JSON; re-run.',
      },
    ],
    blocking: true,
  },
  {
    stepId: 'step-16-state',
    stepKind: 'update_state',
    label: 'Update BACKLOG_CURRENT_STATE.md',
    description:
      'Write the updated state handoff to BACKLOG_CURRENT_STATE.md. Create a separate docs PR.',
    actions: [
      'Edit docs/backlog/BACKLOG_CURRENT_STATE.md',
      'git add docs/backlog/BACKLOG_CURRENT_STATE.md',
      'git commit -m "docs(backlog): record Wave XX PR #NNN merge SHA ..."',
      'gh pr create + merge',
    ],
    gateConditions: [],
    blocking: false,
  },
  {
    stepId: 'step-17-notify',
    stepKind: 'notify',
    label: 'Notify and loop',
    description:
      'Send PushNotification with wave result. If autoLoopEnabled, schedule next wave.',
    actions: [
      'PushNotification: "AbarVa Wave XX merged — PR #NNN. N slices. Next: Wave YY."',
      'If autoLoopEnabled: ScheduleWakeup(270) with orchestration prompt',
    ],
    gateConditions: [],
    blocking: false,
  },
];

const WAVE_RUNNER_PROTOCOL: WaveRunnerProtocol = {
  protocolVersion: '1.0',
  name: 'AbarVa Autonomous Wave Runner Protocol v1',
  description:
    'Canonical step-by-step execution protocol for the AbarVa autonomous orchestration agent. Each step must be completed in order; blocking steps must pass before subsequent steps start.',
  steps: WAVE_RUNNER_STEPS,
  createdFrom: 'deterministic_wave_runner_model_v1',
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full wave runner protocol. Pure.
 */
export function getWaveRunnerProtocol(): WaveRunnerProtocol {
  return WAVE_RUNNER_PROTOCOL;
}

/**
 * Return the steps for a specific step kind. Pure.
 */
export function getStepsByKind(
  kind: WaveRunnerStepKind,
): ReadonlyArray<WaveRunnerStep> {
  return WAVE_RUNNER_STEPS.filter((s) => s.stepKind === kind);
}

/**
 * Return all Tier 3 (human-required) gate conditions across all steps.
 * Pure. Used by orchestration to enumerate all hard-stop conditions.
 */
export function getAllTier3Conditions(): ReadonlyArray<WaveRunnerGateCondition> {
  const result: WaveRunnerGateCondition[] = [];
  for (const step of WAVE_RUNNER_STEPS) {
    for (const cond of step.gateConditions) {
      if (cond.tier === 'tier3') {
        result.push(cond);
      }
    }
  }
  return result;
}

/**
 * Return all blocking steps (steps that must pass before proceeding). Pure.
 */
export function getBlockingSteps(): ReadonlyArray<WaveRunnerStep> {
  return WAVE_RUNNER_STEPS.filter((s) => s.blocking);
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const WAVE_RUNNER_STEP_KINDS_IN_ORDER: ReadonlyArray<WaveRunnerStepKind> =
  [
    'orient',
    'identify_wave',
    'check_blockers',
    'read_wave_spec',
    'create_branch',
    'implement_slices',
    'run_typecheck',
    'run_tests',
    'run_lint',
    'run_hygiene_gate',
    'stage_and_commit',
    'push_and_pr',
    'watch_ci',
    'merge',
    'update_trackers',
    'update_state',
    'notify',
  ];

export const ESCALATION_TIERS_IN_ORDER: ReadonlyArray<EscalationTier> = [
  'tier1',
  'tier2',
  'tier3',
];
