import assert from 'node:assert/strict';
import {
  DETECTOR_REGISTRY,
  rescoreTranscript,
  type Transcript,
} from '../audit/run-agent-2task-eval';

const registryFlags = DETECTOR_REGISTRY.map((detector) => detector.flag);

assert.deepEqual(registryFlags, [
  'canned_template_detected',
  'template_repetition_detected',
  'capture_defect',
  'data_unavailable_admission',
  'no_prior_context_admission',
  'prose_action_mismatch',
]);

const transcript: Transcript = {
  tenant: 'Foundation Fix 3 Synthetic',
  turns: [
    {
      task: 1,
      turn: 1,
      tag: 'rfi-generation',
      answer:
        'Mode: expert sourcing. Confidence: low. Current state: No cited current-state finding is available. Sourcing implication: Anchor the event in current-state pain. Risks/traps: Do not let vendor materials replace client evidence.',
      score: { total: 9 },
    },
    {
      task: 1,
      turn: 2,
      tag: 'bafo-simulation',
      answer:
        'Mode: expert sourcing. Confidence: low. Current state: No cited current-state finding is available. Sourcing implication: Anchor the event in current-state pain. Risks/traps: Do not let vendor materials replace client evidence.',
      score: { total: 8.5 },
    },
    {
      task: 1,
      turn: 3,
      tag: 'tower-continuity',
      answer:
        'Control Tower Portfolio Value 0 active Moves 0 Source workflows DAG fallback PROJECTED PORTFOLIO VALUE $0 Tracked value $0 Verified value $0',
      score: { total: 7 },
    },
    {
      task: 1,
      turn: 4,
      tag: 'tenant-grounding',
      answer:
        "The active tenant in my connected data is Apex Retail - not a health system. So I don't have an Epic deployment or ambient documentation pilot to draw on.",
      score: { total: 7 },
    },
    {
      task: 1,
      turn: 5,
      tag: 'continuity',
      answer:
        "There's no turn one to repeat - this is the start of our conversation, so I haven't made any sequencing recommendations yet.",
      score: { total: 8 },
    },
    {
      task: 1,
      turn: 6,
      tag: 'create-move',
      answer:
        'Created Strategic Move 8788086c-ab4a-4091-a377-dbe345a43ddc: Commerce Cloud Sequencing and CDP Scope Reset.',
      score: { total: 10 },
    },
    {
      task: 1,
      turn: 7,
      tag: 'null-turn',
      answer: null,
      score: { total: 10 },
    },
  ],
};

const rescored = rescoreTranscript(transcript);
const byTurn = new Map(rescored.map((item) => [item.turn.turn, item]));

assert.equal(byTurn.get(1)?.correctedScore, 3.5);
assert.equal(byTurn.get(1)?.flags.some((flag) => flag.flag === 'canned_template_detected'), true);
assert.equal(byTurn.get(1)?.flags.some((flag) => flag.flag === 'template_repetition_detected'), true);
assert.equal(byTurn.get(1)?.flags.some((flag) => flag.flag === 'data_unavailable_admission'), true);
assert.equal(byTurn.get(1)?.flags.some((flag) => flag.flag === 'prose_action_mismatch'), true);

assert.equal(byTurn.get(3)?.correctedScore, 1);
assert.equal(byTurn.get(3)?.flags.some((flag) => flag.flag === 'capture_defect'), true);
assert.equal(byTurn.get(3)?.flags.some((flag) => flag.flag === 'prose_action_mismatch'), true);

assert.equal(byTurn.get(4)?.correctedScore, 2);
assert.equal(byTurn.get(4)?.flags.some((flag) => flag.flag === 'data_unavailable_admission'), true);

assert.equal(byTurn.get(5)?.correctedScore, 4);
assert.equal(byTurn.get(5)?.flags.some((flag) => flag.flag === 'no_prior_context_admission'), true);

assert.equal(byTurn.get(6)?.correctedScore, 3);
assert.equal(byTurn.get(6)?.flags.some((flag) => flag.flag === 'prose_action_mismatch'), true);

assert.equal(byTurn.get(7)?.correctedScore, null);
assert.equal(byTurn.get(7)?.correctedLetter, 'UNSCORED');
assert.match(byTurn.get(7)?.unscoredReason ?? '', /UNSCORED null turn/);

console.log('FOUNDATION-FIX-3 scorer honesty smoke passed');
