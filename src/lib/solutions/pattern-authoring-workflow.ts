// PAT2 (Wave 30) · Pattern Authoring Workflow
//
// Deterministic read model encoding the canonical workflow for authoring
// a new solution pattern pack in AbarVa. Defines:
//
//   - the authoring lifecycle stages a new pattern must pass through
//   - the required artefacts for each stage
//   - gate conditions that block stage advancement
//   - quality checks applied before a pattern is marked canonical
//
// This module is consumed by:
//   - The Steward agent when guiding pattern creation
//   - CI checks that enforce pattern quality gates
//   - Build ops tooling that tracks pattern authoring progress
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no fs reads, no Date.now, no Math.random.


// ---------------------------------------------------------------------
// Authoring lifecycle types
// ---------------------------------------------------------------------

/**
 * The lifecycle stage of a pattern being authored.
 */
export type PatternAuthoringStage =
  | 'scoping'       // define scope, domain, primary question
  | 'criteria'      // draft evaluation criteria
  | 'evidence'      // define evidence requirements per criterion
  | 'signals'       // define Sentinel risk signals
  | 'review'        // internal QA review before marking validated
  | 'validated'     // marked validated after first real engagement
  | 'canonical'     // promoted to canonical after 3+ engagements
  | 'deprecated';   // retired

/**
 * An artefact required for a given authoring stage.
 */
export interface PatternAuthoringArtefact {
  artefactId: string;
  label: string;
  description: string;
  required: boolean;
  exampleValue?: string;
}

/**
 * A gate condition that must be met before advancing to the next stage.
 */
export interface PatternAuthoringGate {
  gateId: string;
  description: string;
  /**
   * When true, failing this gate blocks stage advancement entirely.
   * When false, it is a warning-level quality check.
   */
  blocking: boolean;
  autoResolution?: string;
}

/**
 * A single stage in the pattern authoring lifecycle.
 */
export interface PatternAuthoringLifecycleStage {
  stage: PatternAuthoringStage;
  label: string;
  description: string;
  requiredArtefacts: ReadonlyArray<PatternAuthoringArtefact>;
  gates: ReadonlyArray<PatternAuthoringGate>;
  nextStage: PatternAuthoringStage | null;
}

/**
 * The full pattern authoring workflow.
 */
export interface PatternAuthoringWorkflow {
  version: '1.0';
  name: string;
  description: string;
  stages: ReadonlyArray<PatternAuthoringLifecycleStage>;
  createdFrom: 'pat2_w30_pattern_authoring_workflow';
}

// ---------------------------------------------------------------------
// Canonical authoring stages
// ---------------------------------------------------------------------

const AUTHORING_STAGES: ReadonlyArray<PatternAuthoringLifecycleStage> = [
  {
    stage: 'scoping',
    label: 'Scoping',
    description:
      'Define the domain, technology area, primary question the pattern answers, target agent, and applicable sourcing categories. A pattern with fuzzy scope will produce poor criteria.',
    requiredArtefacts: [
      {
        artefactId: 'scope-domain',
        label: 'Domain',
        description: 'Which technology/domain does this pattern cover? (e.g. data-platform, infrastructure-managed-services)',
        required: true,
        exampleValue: 'data-platform',
      },
      {
        artefactId: 'scope-primary-question',
        label: 'Primary Question',
        description: 'The one question this pattern answers for an agent or buyer. 20–120 chars.',
        required: true,
        exampleValue: 'Does this vendor have the right operational model for our data platform?',
      },
      {
        artefactId: 'scope-categories',
        label: 'Pattern Categories',
        description: 'Which sourcing lifecycle categories does this pattern apply to?',
        required: true,
        exampleValue: 'sourcing, evaluation, transition',
      },
      {
        artefactId: 'scope-primary-agent',
        label: 'Primary Agent',
        description: 'Which agent primarily surfaces this pattern?',
        required: true,
        exampleValue: 'nexus',
      },
    ],
    gates: [
      {
        gateId: 'scope-G1-domain-set',
        description: 'At least one domain must be specified.',
        blocking: true,
        autoResolution: 'Add at least one PatternDomain from the canonical domain list.',
      },
      {
        gateId: 'scope-G2-question-length',
        description: 'Primary question must be at least 20 characters.',
        blocking: true,
        autoResolution: 'Expand the primary question to be more specific.',
      },
      {
        gateId: 'scope-G3-categories',
        description: 'At least one category must be specified.',
        blocking: true,
        autoResolution: 'Add at least one PatternCategory.',
      },
    ],
    nextStage: 'criteria',
  },
  {
    stage: 'criteria',
    label: 'Criteria Authoring',
    description:
      'Author the evaluation criteria for each category. Each criterion must have an area, specific criterion text, rationale, and severity. Target 4–8 criteria per sourcing pattern.',
    requiredArtefacts: [
      {
        artefactId: 'criteria-list',
        label: 'Criteria List',
        description: 'Array of evaluation criteria, each with id, area, criterion text, rationale, severity.',
        required: true,
      },
      {
        artefactId: 'criteria-severity-mix',
        label: 'Severity Mix',
        description: 'At least one critical or high severity criterion to anchor the evaluation.',
        required: true,
      },
    ],
    gates: [
      {
        gateId: 'criteria-G1-min-count',
        description: 'Pattern must have at least 1 criterion.',
        blocking: true,
        autoResolution: 'Add at least one criterion before advancing.',
      },
      {
        gateId: 'criteria-G2-severity-present',
        description: 'At least one criterion must have severity critical or high.',
        blocking: false,
        autoResolution: 'Consider elevating at least one criterion to critical or high severity.',
      },
      {
        gateId: 'criteria-G3-rationale',
        description: 'Every criterion must have a non-empty rationale.',
        blocking: true,
        autoResolution: 'Add rationale text explaining why each criterion matters.',
      },
    ],
    nextStage: 'evidence',
  },
  {
    stage: 'evidence',
    label: 'Evidence Requirements',
    description:
      'For each criterion, define what evidence is acceptable, in what format, and how stale it can be. Evidence requirements make the pattern actionable in real engagements.',
    requiredArtefacts: [
      {
        artefactId: 'evidence-requirements',
        label: 'Evidence Requirements',
        description: 'For each key criterion, define required evidence with acceptedFormats and maxStaleDays.',
        required: true,
      },
    ],
    gates: [
      {
        gateId: 'evidence-G1-formats',
        description: 'Each evidence requirement must list at least one accepted format.',
        blocking: true,
        autoResolution: 'Add accepted evidence formats (e.g., "written reference", "demo recording").',
      },
      {
        gateId: 'evidence-G2-max-stale-days',
        description: 'maxStaleDays must be a non-negative integer.',
        blocking: true,
        autoResolution: 'Set maxStaleDays to a positive integer (e.g., 180 for 6-month staleness).',
      },
    ],
    nextStage: 'signals',
  },
  {
    stage: 'signals',
    label: 'Sentinel Signals',
    description:
      'Define the risk signals that Sentinel emits when this pattern detects a concerning pattern in vendor behaviour, pricing, or evidence quality. Each signal must have a trigger and recommended action.',
    requiredArtefacts: [
      {
        artefactId: 'sentinel-signals',
        label: 'Sentinel Signals',
        description: 'Array of Sentinel risk signals with level, trigger, recommendedAction, blocksProgression.',
        required: true,
      },
    ],
    gates: [
      {
        gateId: 'signals-G1-at-least-one',
        description: 'Pattern should have at least one Sentinel signal.',
        blocking: false,
        autoResolution: 'Add at least one risk signal that Sentinel can fire.',
      },
      {
        gateId: 'signals-G2-trigger-required',
        description: 'Every signal must have a non-empty trigger description.',
        blocking: true,
        autoResolution: 'Add a trigger condition for each signal.',
      },
      {
        gateId: 'signals-G3-action-required',
        description: 'Every signal must have a non-empty recommendedAction.',
        blocking: true,
        autoResolution: 'Add a recommendedAction for each signal.',
      },
    ],
    nextStage: 'review',
  },
  {
    stage: 'review',
    label: 'Internal Review',
    description:
      'QA review before marking the pattern as validated. Checks that all required fields are present, quality thresholds are met, and no placeholder text remains.',
    requiredArtefacts: [
      {
        artefactId: 'review-checklist',
        label: 'Review Checklist',
        description: 'Completed review confirming all gates pass, no TODOs remain, and the pattern is consistent.',
        required: true,
      },
      {
        artefactId: 'review-test-coverage',
        label: 'Test Coverage',
        description: 'Integration test file covering all exported functions, 100% coverage of the pattern entry.',
        required: true,
      },
    ],
    gates: [
      {
        gateId: 'review-G1-readiness-gate',
        description: 'Pattern must pass the evaluatePatternReadinessGate (all 10 gates pass).',
        blocking: true,
        autoResolution: 'Fix all failing readiness gate conditions before marking validated.',
      },
      {
        gateId: 'review-G2-no-placeholders',
        description: 'No TODO, FIXME, or placeholder text in any field.',
        blocking: true,
        autoResolution: 'Replace all placeholder text with real content.',
      },
      {
        gateId: 'review-G3-tests-green',
        description: 'All integration tests for this pattern must pass.',
        blocking: true,
        autoResolution: 'Fix failing tests before marking reviewed.',
      },
    ],
    nextStage: 'validated',
  },
  {
    stage: 'validated',
    label: 'Validated',
    description:
      'Pattern has been used in at least one real sourcing engagement. The maturity is set to validated. Monitor for feedback from usage.',
    requiredArtefacts: [
      {
        artefactId: 'engagement-reference',
        label: 'Engagement Reference',
        description: 'Non-identifying reference to the engagement where the pattern was first used.',
        required: true,
      },
    ],
    gates: [
      {
        gateId: 'validated-G1-engagement-recorded',
        description: 'At least one engagement reference must be recorded.',
        blocking: true,
        autoResolution: 'Add a non-identifying engagement reference before marking validated.',
      },
    ],
    nextStage: 'canonical',
  },
  {
    stage: 'canonical',
    label: 'Canonical',
    description:
      'Pattern has been used in 3+ engagements, reviewed with no known gaps, and approved for canonical status. Canonical patterns are the highest quality tier.',
    requiredArtefacts: [
      {
        artefactId: 'canonical-engagement-count',
        label: 'Engagement Count',
        description: 'At least 3 real engagements where this pattern was applied.',
        required: true,
      },
      {
        artefactId: 'canonical-peer-review',
        label: 'Peer Review',
        description: 'Reviewed and approved by a second author or founding team member.',
        required: true,
      },
    ],
    gates: [
      {
        gateId: 'canonical-G1-engagement-count',
        description: 'Pattern must have been applied in 3+ real engagements.',
        blocking: true,
        autoResolution: 'Pattern needs more real-engagement validation before canonical promotion.',
      },
    ],
    nextStage: 'deprecated',
  },
  {
    stage: 'deprecated',
    label: 'Deprecated',
    description:
      'Pattern has been retired, superseded by a newer pattern, or is no longer applicable. Deprecated patterns remain in the registry for reference but are not surfaced by agents.',
    requiredArtefacts: [
      {
        artefactId: 'deprecation-reason',
        label: 'Deprecation Reason',
        description: 'Explanation of why this pattern was deprecated and which pattern supersedes it.',
        required: true,
      },
    ],
    gates: [],
    nextStage: null,
  },
];

const PATTERN_AUTHORING_WORKFLOW: PatternAuthoringWorkflow = {
  version: '1.0',
  name: 'AbarVa Pattern Authoring Workflow v1',
  description:
    'Canonical lifecycle and quality gate workflow for authoring, validating, and promoting solution pattern packs in the AbarVa pattern library. Each stage must pass its gates before advancing.',
  stages: AUTHORING_STAGES,
  createdFrom: 'pat2_w30_pattern_authoring_workflow',
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full pattern authoring workflow. Pure.
 */
export function getPatternAuthoringWorkflow(): PatternAuthoringWorkflow {
  return PATTERN_AUTHORING_WORKFLOW;
}

/**
 * Return the lifecycle stage definition for a given stage. Pure.
 */
export function getAuthoringStage(
  stage: PatternAuthoringStage,
): PatternAuthoringLifecycleStage | undefined {
  return AUTHORING_STAGES.find((s) => s.stage === stage);
}

/**
 * Return all blocking gates across all stages. Pure.
 */
export function getAllBlockingGates(): ReadonlyArray<PatternAuthoringGate & { stage: PatternAuthoringStage }> {
  const result: Array<PatternAuthoringGate & { stage: PatternAuthoringStage }> = [];
  for (const stageObj of AUTHORING_STAGES) {
    for (const gate of stageObj.gates) {
      if (gate.blocking) {
        result.push({ ...gate, stage: stageObj.stage });
      }
    }
  }
  return result;
}

/**
 * Return the ordered sequence of stages from a given stage to the end. Pure.
 * Useful for progress display.
 */
export function getRemainingStages(
  currentStage: PatternAuthoringStage,
): ReadonlyArray<PatternAuthoringLifecycleStage> {
  const idx = AUTHORING_STAGES.findIndex((s) => s.stage === currentStage);
  if (idx === -1) return [];
  return AUTHORING_STAGES.slice(idx);
}

/**
 * Evaluate whether a pattern draft is ready to advance to the next stage.
 *
 * This is a structural gate check — it does NOT validate the actual content
 * of the artefacts (that is done by evaluatePatternReadinessGate). It checks
 * that the required artefacts have been provided by the caller.
 *
 * @param stage           - Current stage.
 * @param providedArtefactIds - Set of artefact IDs that have been provided.
 * @returns An object describing whether the pattern can advance.
 */
export interface StageAdvancementResult {
  stage: PatternAuthoringStage;
  canAdvance: boolean;
  nextStage: PatternAuthoringStage | null;
  missingArtefacts: ReadonlyArray<string>;
  deterministicSeed: true;
}

export function evaluateStageAdvancement(
  stage: PatternAuthoringStage,
  providedArtefactIds: ReadonlyArray<string>,
): StageAdvancementResult {
  const stageDef = getAuthoringStage(stage);
  if (!stageDef) {
    return {
      stage,
      canAdvance: false,
      nextStage: null,
      missingArtefacts: [],
      deterministicSeed: true,
    };
  }

  const provided = new Set(providedArtefactIds);
  const missingArtefacts = stageDef.requiredArtefacts
    .filter((a) => a.required && !provided.has(a.artefactId))
    .map((a) => a.artefactId);

  return {
    stage,
    canAdvance: missingArtefacts.length === 0,
    nextStage: stageDef.nextStage,
    missingArtefacts,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------

export const PATTERN_AUTHORING_STAGES_IN_ORDER: ReadonlyArray<PatternAuthoringStage> = [
  'scoping',
  'criteria',
  'evidence',
  'signals',
  'review',
  'validated',
  'canonical',
  'deprecated',
];

// Re-export types from pattern-registry-format that callers may need
// when using pattern authoring together with pattern registry.
export type {
  PatternCategory,
  PatternDomain,
  PatternMaturity,
  PatternOwnerAgent,
} from '@/lib/solutions/pattern-registry-format';
