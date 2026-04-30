import type { StagePack } from './types';

export const S1_MARKET_SHAPE: StagePack = {
  stage: 1,
  label: 'S1 Market Shape',
  sourceStageKeys: ['sourcing_strategy'],
  crossReferences: { patternIds: ['PAT-SRC-RFP-001'], sourceStageKeys: ['sourcing_strategy'] },
  outcome:
    'Market shape is complete when the buyer understands the supplier landscape, viable delivery models, incumbent/challenger positions, likely commercial structures, and the questions that must be answered before a shortlist is formed. This stage does not end with a vendor long list pasted from analyst grids. It ends when Sentinel can explain which market hypotheses are evidence-backed, which are still assumptions, and what the sourcing strategy will test through RFI, research, or targeted conversations.',
  definitionOfDone: [
    { id: 'market-hypotheses-written', label: 'Market hypotheses written before vendor contact', severity: 'hard', evaluationHint: 'Sourcing strategy artifact names expected delivery models, likely vendor classes, incumbent/challenger assumptions, and what research will validate or falsify.' },
    { id: 'vendor-landscape-segmented', label: 'Vendor landscape segmented by capability and fit', severity: 'hard', evaluationHint: 'Market artifact separates enterprise platforms, specialists, incumbents, challengers, and unsuitable classes with rationale tied to the intake scope.' },
    { id: 'rfi-questions-buyer-controlled', label: 'RFI or research questions buyer-controlled', severity: 'hard', evaluationHint: 'Question set tests buyer hypotheses rather than asking vendors to describe generic capabilities. Each question links to scope, risk, operating model, or commercial uncertainty.' },
    { id: 'commercial-models-identified', label: 'Likely commercial models identified', severity: 'soft', evaluationHint: 'Strategy artifact names expected pricing units, term structure, implementation/run split, transition cost posture, and where public evidence is thin.' },
    { id: 'named-challenger-included', label: 'Named challenger or non-incumbent option included', severity: 'soft', evaluationHint: 'Landscape includes at least one credible challenger or explains why only incumbents/single-source options are viable.' },
  ],
  rightQuestions: {
    open: [
      { id: 'what-market-do-we-believe', text: 'What do we believe the market can solve better than our current path?', why: 'Forces the team to state a testable market thesis rather than collect vendor brochures.', expectedAnswerShape: 'Capability thesis, vendor classes, expected tradeoff, and uncertainty.' },
      { id: 'incumbent-position', text: 'Is the incumbent a baseline, a favorite, or a risk to be challenged?', why: 'Incumbent posture changes research design and negotiation leverage.', expectedAnswerShape: 'Incumbent role, strengths, constraints, and challenger requirement.' },
    ],
    converge: [
      { id: 'segmentation-logic', text: 'Which vendor classes are in, out, and ambiguous, and why?', why: 'Shortlists are weak when all vendor categories are treated as interchangeable.', expectedAnswerShape: 'Segment list with inclusion/exclusion rationale and evidence gaps.' },
      { id: 'question-tests', text: 'Which RFI questions will actually falsify a market assumption?', why: 'Generic RFIs create generic answers; Sentinel needs questions that change the sourcing path.', expectedAnswerShape: 'Question, hypothesis tested, expected evidence, and decision impact.' },
    ],
    close: [
      { id: 'strategy-to-shortlist', text: 'What must be true for a vendor to enter the shortlist?', why: 'S2 needs entry criteria before names become politically sticky.', expectedAnswerShape: 'Entry criteria, disqualifiers, evidence required, and unresolved assumptions.' },
      { id: 'thin-evidence-caveats', text: 'Where is the market evidence thin enough that we need to hedge?', why: 'Prevents Sentinel from overstating vendor/pricing claims without verified support.', expectedAnswerShape: 'Known gaps, public-source limitations, and follow-up evidence plan.' },
    ],
  },
  antiPatterns: [
    { id: 'analyst-grid-shortcut', label: 'Analyst Grid Shortcut', detectionHint: 'The team uses an analyst category or quadrant as the whole market strategy without mapping it to the buyer scope.', whatToFlag: 'Tell the user market reputation is not the same as fit.', mitigation: 'Segment vendors against scope, operating model, risk, and commercial fit.' },
    { id: 'incumbent-gravity-market', label: 'Incumbent Gravity', detectionHint: 'Research questions are framed around what the incumbent already does rather than what the buyer needs.', whatToFlag: 'Surface that the market test is biased toward the current solution.', mitigation: 'Add challenger hypotheses and buyer-designed scenarios before S2.' },
    { id: 'capability-bingo', label: 'Capability Bingo', detectionHint: 'The RFI asks broad capability yes/no questions that every vendor can answer positively.', whatToFlag: 'Flag that the questions will not discriminate between vendors.', mitigation: 'Rewrite into evidence-bearing questions: examples, constraints, volumes, ownership, transition, and exceptions.' },
  ],
  coachingArc: {
    entry: 'Begin as a market skeptic. Turn the intake problem into hypotheses about vendor classes, delivery models, and commercial structures.',
    midPhase: 'Push for segmentation and falsification. Every research question should change the shortlist or commercial posture if answered differently.',
    exit: 'Lock shortlist-entry criteria, challenger inclusion, and thin-evidence caveats before vendor names become the answer.',
  },
  dependencies: {
    requiresFromPrior: ['S0 Intake: buyer-owned problem statement', 'S0 Intake: scope boundary and kill criterion', 'S0 Intake: sponsor or delegated approver identified'],
    producesForNext: ['Market segmentation and vendor-class rationale', 'RFI/research question set', 'Shortlist-entry criteria and disqualifiers', 'Commercial model assumptions and evidence gaps'],
  },
};
