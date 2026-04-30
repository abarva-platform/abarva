import type { StagePack } from './types';

export const S2_SHORTLIST: StagePack = {
  stage: 2,
  label: 'S2 Shortlist',
  sourceStageKeys: ['vendor_responses', 'evaluation'],
  crossReferences: { patternIds: ['PAT-SRC-RFP-001', 'PAT-SRC-SOLE-001'], sourceStageKeys: ['vendor_responses', 'evaluation'] },
  outcome:
    'Shortlist is complete when the buyer has selected a defensible finalist set using criteria locked before vendor preference hardened, with a documented challenger, explicit disqualifiers, known evidence gaps, and a rationale that can be shown to sponsors and procurement without rewriting history. This stage does not end when familiar names are selected. It ends when Sentinel can explain why each vendor is in, why excluded vendors are out, what would change the list, and which risks must be tested in RFP or demo.',
  definitionOfDone: [
    { id: 'shortlist-criteria-locked', label: 'Shortlist criteria locked before final vendor naming', severity: 'hard', evaluationHint: 'Scorecard or shortlist artifact records criteria, weights or priority order, disqualifiers, and date locked before final shortlist recommendation.' },
    { id: 'vendor-inclusion-rationale', label: 'Each shortlisted vendor has inclusion rationale', severity: 'hard', evaluationHint: 'Vendor evidence names why each finalist fits scope, operating model, risk posture, and commercial model. Familiarity alone is not sufficient rationale.' },
    { id: 'exclusion-record-complete', label: 'Excluded vendors have defensible exclusion rationale', severity: 'hard', evaluationHint: 'Shortlist artifact includes excluded or deferred vendor classes with reason: capability gap, scale mismatch, risk, commercial model, conflict, or insufficient evidence.' },
    { id: 'challenger-preserved', label: 'Credible challenger preserved or single-source rationale documented', severity: 'hard', evaluationHint: 'Finalist set includes a challenger/non-incumbent or contains a sponsor-visible explanation for why challenger inclusion is not viable.' },
    { id: 'evidence-gaps-carried-forward', label: 'Evidence gaps carried forward into RFP/demo tests', severity: 'soft', evaluationHint: 'Shortlist decision packet lists unresolved questions per vendor and maps each gap to an RFP, demo, POC, or reference-check test.' },
  ],
  rightQuestions: {
    open: [
      { id: 'criteria-before-names', text: 'Were the shortlist criteria locked before names were chosen?', why: 'Prevents rationalizing a preferred vendor after the fact.', expectedAnswerShape: 'Criteria, disqualifiers, lock date, owner, and any later changes.' },
      { id: 'why-each-in', text: 'Why is each vendor in, using evidence rather than familiarity?', why: 'Shortlist decisions need an auditable basis before RFP effort begins.', expectedAnswerShape: 'Vendor-by-vendor evidence, fit, risk, and caveat.' },
    ],
    converge: [
      { id: 'challenger-test', text: 'Which finalist is the challenger, and what would let them win?', why: 'A finalist who cannot win is process decoration, not leverage.', expectedAnswerShape: 'Challenger name, winning scenario, proof required, and risk caveat.' },
      { id: 'exclusion-defensibility', text: 'Which excluded vendor would be hardest to defend, and why are they still out?', why: 'Finds political or evidence weak spots before procurement review.', expectedAnswerShape: 'Excluded vendor, objection risk, evidence, and response.' },
    ],
    close: [
      { id: 'tests-for-next-stage', text: 'What must the RFP or demo test because the shortlist evidence is still incomplete?', why: 'Moves uncertainty forward deliberately instead of pretending shortlist evidence is complete.', expectedAnswerShape: 'Gap, vendor affected, test method, and decision impact.' },
      { id: 'sponsor-shortlist-approval', text: 'Who approves the shortlist and what dissent must be visible to them?', why: 'Shortlist approval is a governance point, not an informal procurement preference.', expectedAnswerShape: 'Approver, recommendation, dissent, and residual risk.' },
    ],
  },
  antiPatterns: [
    { id: 'favorite-first-shortlist', label: 'Favorite-First Shortlist', detectionHint: 'A preferred vendor is named first and criteria are assembled afterward to fit the choice.', whatToFlag: 'Tell the user the shortlist is being rationalized, not evaluated.', mitigation: 'Freeze criteria, re-score names, and record any sponsor-approved exception.' },
    { id: 'decorative-challenger', label: 'Decorative Challenger', detectionHint: 'A challenger is included but the team cannot describe a credible path for them to win.', whatToFlag: 'Flag that the challenger will not create leverage or learning.', mitigation: 'Either define the challenger winning scenario or remove them with a single-source rationale.' },
    { id: 'silent-exclusion', label: 'Silent Exclusion', detectionHint: 'Vendors are omitted without a reason that procurement, sponsor, or audit could review later.', whatToFlag: 'Surface that exclusion without rationale weakens the process record.', mitigation: 'Record exclusion reasons and link each to scope, risk, capability, scale, conflict, or evidence limitations.' },
  ],
  coachingArc: {
    entry: 'Start by separating names from criteria. Make the user prove the scoreboard existed before the shortlist answer.',
    midPhase: 'Test inclusion, exclusion, challenger credibility, and evidence gaps vendor by vendor. Keep the posture factual, not political.',
    exit: 'Package the shortlist as a decision record with dissent and next-stage tests, then hand S3 a buyer-controlled RFP spine.',
  },
  dependencies: {
    requiresFromPrior: ['S1 Market Shape: segmented vendor landscape', 'S1 Market Shape: shortlist-entry criteria and disqualifiers', 'S1 Market Shape: thin-evidence caveats'],
    producesForNext: ['Finalist set with inclusion rationale', 'Excluded-vendor rationale', 'Challenger or single-source decision record', 'RFP/demo tests for unresolved gaps', 'Sponsor-visible shortlist decision packet'],
  },
};
