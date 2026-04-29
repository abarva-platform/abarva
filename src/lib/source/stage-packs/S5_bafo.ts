// S5 BAFO - Sourcing Stage Pack
//
// BAFO is the commercial pressure stage. Sentinel's job is not to cheerlead a
// preferred vendor; it is to keep the buyer's walkaway credible, preserve
// comparability across finalists, and force open assumptions into the final
// commercial record before selection hardens into contract language.

import type { StagePack } from './types';

export const S5_BAFO: StagePack = {
  stage: 5,
  label: 'S5 BAFO',
  sourceStageKeys: ['evaluation', 'orals_bafo', 'selection'],
  crossReferences: {
    patternIds: [
      'PAT-SRC-AMS-001',
      'PAT-SRC-RFP-001',
      'PAT-SRC-SOLE-001',
      'PAT-SRC-FRAMEWORK-001',
    ],
    sourceStageKeys: ['evaluation', 'orals_bafo', 'selection'],
  },
  outcome:
    'BAFO is complete when each finalist has answered the same buyer-controlled clarification set, pricing has been normalized to comparable scope, commercial exceptions are either resolved or decision-visible, the buyer has a credible walkaway alternative, and the executive decision packet can explain why the preferred vendor should proceed into contract. The stage does not end because a vendor submitted a lower number. It ends when the final offer can survive procurement, finance, legal, transition, and sponsor review without hidden exclusions or late surprises.',

  definitionOfDone: [
    {
      id: 'bafo-instruction-locked',
      label: 'BAFO instruction locked and issued consistently to all finalists',
      severity: 'hard',
      evaluationHint:
        'Source artifact with kind="artifact_packet" or decision memo section names the BAFO instruction, issue date, finalist list, response deadline, and the same clarification questions for every finalist unless an exception is explicitly recorded.',
    },
    {
      id: 'pricing-normalized-to-common-scope',
      label: 'Pricing normalized to a common scope and baseline',
      severity: 'hard',
      evaluationHint:
        'Source pricing normalization snapshot or scorecard evidence shows each finalist on the same term, volume, service tower, transition window, assumed service levels, exclusions, and one-time versus recurring split.',
    },
    {
      id: 'walkaway-alternative-documented',
      label: 'Walkaway alternative documented before final negotiation posture is set',
      severity: 'hard',
      evaluationHint:
        'Decision memo or executive tradeoff summary names the credible alternative: runner-up award, incumbent extension, internal build/hold, staged award, or pause. It must include consequences, not just a statement that alternatives exist.',
    },
    {
      id: 'commercial-exceptions-dispositioned',
      label: 'Commercial exceptions dispositioned by owner and consequence',
      severity: 'hard',
      evaluationHint:
        'Contract or BAFO evidence lists material exceptions by vendor, owner, accepted/rejected/deferred state, business consequence, and whether the exception affects selection or only contract drafting.',
    },
    {
      id: 'evaluation-rubric-frozen',
      label: 'Evaluation rubric frozen before final BAFO comparison',
      severity: 'hard',
      evaluationHint:
        'Scorecard or governance evidence shows weights and pass/fail criteria locked before BAFO responses were interpreted. Any weighting change after response receipt requires a decision record with rationale.',
    },
    {
      id: 'transition-and-exit-terms-tested',
      label: 'Transition and exit terms tested against operating risk',
      severity: 'soft',
      evaluationHint:
        'BAFO or contract artifact covers transition staffing, knowledge transfer, exit assistance, data return/destruction, termination assistance, retained-team obligations, and service continuity during cutover.',
    },
    {
      id: 'sponsor-decision-packet-ready',
      label: 'Sponsor decision packet ready with recommendation and dissent',
      severity: 'soft',
      evaluationHint:
        'Executive decision summary states recommended vendor, runner-up, unresolved risks, dissenter or challenge view, financial comparison, contract issues, transition posture, and decision requested from the sponsor.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'what-is-the-walkaway',
        text: 'What is the walkaway alternative if the preferred vendor does not move on price, scope, risk, or transition terms?',
        why:
          'BAFO leverage depends on a believable alternative. If the buyer cannot name the alternative, the final round becomes theatre and the vendor can read the weakness.',
        expectedAnswerShape:
          'Named alternative with consequence: runner-up award, incumbent extension, narrowed scope, phased award, internal delivery, or pause, plus sponsor tolerance for each.',
      },
      {
        id: 'same-clarification-set',
        text: 'Which clarification questions must every finalist answer, and which questions are vendor-specific exceptions?',
        why:
          'Comparability collapses when finalists answer different commercial questions. Sentinel needs a common clarification spine before interpreting final offers.',
        expectedAnswerShape:
          'Common question list, vendor-specific exceptions, response deadline, required evidence format, and owner for adjudicating incomplete answers.',
      },
      {
        id: 'what-is-locked-before-bafo',
        text: 'What evaluation weights, scope boundaries, and pass/fail criteria are frozen before responses come back?',
        why:
          'Prevents the team from changing the scoreboard after seeing vendor numbers. If weights move after BAFO receipt, the selection record becomes fragile.',
        expectedAnswerShape:
          'Locked scorecard dimensions, weights, scope baseline, hard disqualifiers, and explicit change-control rule for any late adjustment.',
      },
    ],
    converge: [
      {
        id: 'normalized-price-comparison',
        text: 'After normalization, what changed in the vendor ranking and what assumptions drive that change?',
        why:
          'The lowest submitted price is not the lowest comparable cost. Sentinel should compare normalized scope, transition, excluded services, and risk cost before calling a vendor cheaper.',
        expectedAnswerShape:
          'Vendor-by-vendor table: submitted price, normalized adjustments, key assumptions, excluded scope, confidence, and ranking movement.',
      },
      {
        id: 'commercial-exception-impact',
        text: 'Which commercial exception would materially change the award recommendation if it stays unresolved?',
        why:
          'Some exceptions are legal cleanup; others destroy the value case. The stage must separate drafting issues from decision-level risks.',
        expectedAnswerShape:
          'Exception, vendor, owner, business impact, acceptable fallback language, decision needed, and whether it blocks selection.',
      },
      {
        id: 'transition-risk-vs-price',
        text: 'Where is a vendor buying price advantage by pushing transition, retained-team, or exit risk back to us?',
        why:
          'BAFO savings can be artificial if the buyer absorbs transition cost or exit exposure. Sentinel should keep operational risk in the commercial comparison.',
        expectedAnswerShape:
          'Specific clauses, transition assumptions, retained obligations, service-level gaps, or exit terms with estimated consequence stated qualitatively when numbers are not available.',
      },
    ],
    close: [
      {
        id: 'executive-decision-request',
        text: 'What exact decision are we asking the sponsor to make: award, downselect, negotiate further, split award, pause, or walk away?',
        why:
          'BAFO must end in a decision request, not a status report. The sponsor needs the action, tradeoff, and consequence in one packet.',
        expectedAnswerShape:
          'Decision requested, preferred vendor, runner-up, unresolved risks, commercial concessions accepted/rejected, and the consequence of delay.',
      },
      {
        id: 'dissenting-view',
        text: 'What is the strongest argument against the recommended vendor, and who owns that dissent?',
        why:
          'A credible decision packet includes the challenge case. Without dissent, Sentinel cannot tell whether the recommendation survived real scrutiny.',
        expectedAnswerShape:
          'Named challenge view with evidence, owner, why it was accepted or rejected, and any residual risk carried into contract.',
      },
      {
        id: 'contract-handoff-terms',
        text: 'Which terms must be handed to contract drafting as non-negotiable, and which can still be traded?',
        why:
          'Selection without a contract posture lets value leak in drafting. The BAFO close must separate hard terms from negotiable give-gets.',
        expectedAnswerShape:
          'Non-negotiables, tradeable terms, fallback language, owner, and link to the commercial exception record.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'discount-theatre',
      label: 'The Discount Theatre',
      detectionHint:
        'The team celebrates a headline discount or lower BAFO number before checking whether scope, term, service levels, transition, or excluded work changed.',
      whatToFlag:
        'Tell the user that a lower number is not a better offer until it is normalized to the same buyer-controlled scope and risk position.',
      mitigation:
        'Redirect to normalized pricing: term, volume, service towers, one-time costs, transition assumptions, retained obligations, exclusions, and risk transfer.',
    },
    {
      id: 'preferred-vendor-gravity',
      label: 'Preferred Vendor Gravity',
      detectionHint:
        'Questions, deadlines, or follow-up effort become softer for the favored vendor while the team describes the process as objective.',
      whatToFlag:
        'Surface that the process is bending around a preferred answer. That weakens negotiation leverage and makes the selection record harder to defend.',
      mitigation:
        'Force every finalist through the same must-answer clarification set, then record any vendor-specific exception as decision evidence.',
    },
    {
      id: 'walkaway-without-consequence',
      label: 'Paper Walkaway',
      detectionHint:
        'The user says the buyer can walk away, but cannot name the runner-up, incumbent bridge, scope reduction, internal fallback, cost of delay, or sponsor tolerance.',
      whatToFlag:
        'Tell the user the walkaway is not credible yet. Vendors can sense when the alternative is only a negotiation phrase.',
      mitigation:
        'Name the real alternative, quantify or describe its consequence, and decide what concession is worth using that alternative.',
    },
    {
      id: 'late-scoreboard-change',
      label: 'The Moving Scoreboard',
      detectionHint:
        'Evaluation weights, pass/fail criteria, or scope boundaries change after BAFO responses are received without a governance decision record.',
      whatToFlag:
        'Flag that the selection process may no longer be defensible. Late score changes can convert evidence into rationalization.',
      mitigation:
        'Freeze the original rubric or create an explicit decision record explaining the change, why it is fair, and how all finalists are affected.',
    },
    {
      id: 'contract-cleanup-fantasy',
      label: 'Contract Cleanup Fantasy',
      detectionHint:
        'Material exceptions are pushed to legal drafting with no owner, fallback language, business consequence, or award impact.',
      whatToFlag:
        'Tell the user that contract drafting will not magically fix a commercial decision gap. If it changes value, risk, or operating feasibility, it belongs in BAFO.',
      mitigation:
        'Disposition each exception before selection: accept, reject, trade, defer with owner, or make it a sponsor-visible award risk.',
    },
  ],

  coachingArc: {
    entry:
      'Start with leverage discipline. Ask for the walkaway, the locked rubric, and the common clarification set before interpreting vendor movement. Keep Sentinel citation-first and skeptical of headline discounts.',
    midPhase:
      'Drive comparability. Normalize pricing, separate commercial exceptions from drafting cleanup, and force transition and exit risk into the same comparison as price and functional fit.',
    exit:
      'Move into decision-record posture. Package the recommendation, runner-up, dissenting view, unresolved risks, non-negotiable contract terms, and sponsor decision request before the event advances to contract.',
  },

  dependencies: {
    requiresFromPrior: [
      'S2 Shortlist: finalist set with documented challenger and no unrecorded late additions',
      'S3 RFP: buyer-controlled scorecard and evaluation weights locked before response interpretation',
      'S4 Demo / POC: finalist evidence, scenario outcomes, unresolved questions, and disqualifiers captured in a comparable record',
      'Current Source event: evaluation, vendor response, pricing normalization, and contract exception evidence available through broker-routed context',
    ],
    producesForNext: [
      'BAFO instruction and response record with common clarifications and vendor-specific exceptions separated',
      'Normalized pricing comparison with assumptions, exclusions, one-time versus recurring cost, and confidence caveats',
      'Commercial exception disposition record for contract drafting and sponsor decision review',
      'Walkaway signal naming the credible alternative and consequence of using it',
      'Executive decision packet with preferred vendor, runner-up, dissenting view, unresolved risks, and requested decision',
    ],
  },
};
