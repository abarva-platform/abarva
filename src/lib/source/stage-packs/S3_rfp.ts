// S3 RFP - Sourcing Stage Pack
//
// The RFP stage converts shortlist hypotheses into buyer-controlled evidence.
// Sentinel's job is to keep the questions outcome-led, manage Q&A as an
// ambiguity surface, and prevent stakeholder drift before responses arrive.

import type { StagePack } from './types';

export const S3_RFP: StagePack = {
  stage: 3,
  label: 'S3 RFP',
  sourceStageKeys: ['rfp_rfi_package', 'vendor_responses'],
  crossReferences: {
    patternIds: ['PAT-SRC-RFP-001'],
    sourceStageKeys: ['rfp_rfi_package', 'vendor_responses'],
  },
  outcome:
    'RFP is complete when the buyer has issued a finalist-ready request package with outcome-based questions, mandatory versus scored criteria separated, evaluation owners named, Q&A governance active, and response instructions that make vendor answers comparable. This stage does not end when a document is sent. It ends when Sentinel can explain what each question tests, how ambiguity will be surfaced and dispositioned, which stakeholders will score which sections, and what evidence must be present before demos or POCs begin.',

  definitionOfDone: [
    {
      id: 'rfp-package-issued-from-shortlist-gaps',
      label: 'RFP package traces questions to shortlist gaps and buyer outcomes',
      severity: 'hard',
      evaluationHint:
        'RFP artifact or question matrix links each major section to S2 evidence gaps, buyer outcomes, disqualifiers, or commercial/risk assumptions. Generic capability prompts without decision linkage should not satisfy this item.',
    },
    {
      id: 'mandatory-scored-informational-separated',
      label: 'Mandatory, scored, and informational criteria separated before release',
      severity: 'hard',
      evaluationHint:
        'Scorecard or RFP instructions identify pass/fail requirements, weighted scored criteria, and informational questions with no hidden scoring. The evidence should show the separation before vendor responses are evaluated.',
    },
    {
      id: 'evaluation-owners-assigned',
      label: 'Evaluation owners assigned by section and decision role',
      severity: 'hard',
      evaluationHint:
        'Evaluation plan names business, IT, security/legal, finance, procurement, and operations owners where relevant, with the sections each owns and who arbitrates cross-functional scoring disputes.',
    },
    {
      id: 'qa-governance-defined',
      label: 'Q&A governance defined as a controlled ambiguity log',
      severity: 'hard',
      evaluationHint:
        'RFP timeline or Q&A log includes submission deadline, answer publication method, owner for rulings, vendor-specific confidentiality rule, and how clarifications update the baseline for all finalists.',
    },
    {
      id: 'response-format-comparable',
      label: 'Response format forces comparable evidence',
      severity: 'soft',
      evaluationHint:
        'RFP instructions request the same response format, evidence attachments, exception table, pricing template, implementation assumptions, and proof examples from every finalist.',
    },
    {
      id: 'stakeholder-alignment-recorded',
      label: 'Stakeholder alignment recorded before release',
      severity: 'soft',
      evaluationHint:
        'Approval note, kickoff artifact, or decision memo shows stakeholders accepted the package scope, scoring model, Q&A process, and response timeline before vendors received the RFP.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'what-does-each-section-test',
        text: 'What decision or uncertainty does each RFP section test?',
        why:
          'A question that does not change the decision creates response volume, not evidence. Sentinel needs the test behind the question before release.',
        expectedAnswerShape:
          'Section-by-section mapping to outcome, shortlist gap, risk, commercial assumption, or disqualifier.',
      },
      {
        id: 'mandatory-vs-scored',
        text: 'Which requirements are mandatory, which are scored, and which are informational only?',
        why:
          'Vendors and evaluators need to know what can disqualify, what differentiates, and what simply provides context.',
        expectedAnswerShape:
          'Pass/fail list, scored criteria with weights or priority order, informational prompts, and exception handling rule.',
      },
    ],
    converge: [
      {
        id: 'qa-ambiguity-surface',
        text: 'What ambiguities do we expect vendors to challenge, and how will Q&A rulings change the baseline?',
        why:
          'Q&A is where weak scope, hidden assumptions, and unfair vendor-specific interpretations appear before evaluation damage is done.',
        expectedAnswerShape:
          'Expected ambiguity list, ruling owner, publication rule, impact on all finalists, and escalation path.',
      },
      {
        id: 'evaluation-orchestration',
        text: 'Who scores each section, who moderates disagreement, and what evidence standard will they apply?',
        why:
          'Multi-stakeholder RFPs fail when scoring ownership is vague or every evaluator applies a different proof threshold.',
        expectedAnswerShape:
          'Evaluator roster, sections, moderation owner, evidence standard, conflict rule, and final decision path.',
      },
      {
        id: 'response-comparability',
        text: 'Where could vendors answer in non-comparable formats, and how will the package prevent that?',
        why:
          'Comparability must be designed into the request package; it cannot be reliably repaired after responses arrive.',
        expectedAnswerShape:
          'Required templates, answer formats, pricing baseline, assumptions table, and exception table.',
      },
    ],
    close: [
      {
        id: 'release-readiness',
        text: 'Can every finalist receive the same package, timeline, baseline assumptions, and scoring instructions?',
        why:
          'Uneven instructions create avoidable fairness and comparability problems before the response window even starts.',
        expectedAnswerShape:
          'Finalist list, release artifact, response deadline, common baseline, known exceptions, and owner approval.',
      },
      {
        id: 'demo-poc-tests-carried-forward',
        text: 'Which answer gaps or claims must be carried into demo or POC testing?',
        why:
          'S4 should test the claims that written responses cannot prove rather than replay a vendor sales deck.',
        expectedAnswerShape:
          'Vendor claim, unresolved gap, planned demo/POC scenario, success criterion, and owner.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'question-dump-rfp',
      label: 'Question Dump RFP',
      detectionHint:
        'The package contains long capability checklists copied from prior RFPs, but the user cannot say what decision each section changes.',
      whatToFlag:
        'Tell the user the RFP is generating response volume without a clear evidence purpose.',
      mitigation:
        'Rewrite each section around outcomes, shortlist gaps, disqualifiers, evaluation criteria, and proof formats.',
    },
    {
      id: 'qa-as-admin',
      label: 'Q&A As Admin Chore',
      detectionHint:
        'Q&A is described as inbox management with no owner for ambiguity rulings, common-answer publication, or baseline change control.',
      whatToFlag:
        'Surface that vendor questions are evidence about unclear scope and must be governed as part of the decision record.',
      mitigation:
        'Create a Q&A log with ruling owner, shared-answer rule, deadline, escalation path, and effect on scoring or scope.',
    },
    {
      id: 'hidden-scorecard',
      label: 'Hidden Scorecard',
      detectionHint:
        'Evaluators discuss preferences or scoring weights that are not visible in the RFP instructions or evaluation plan.',
      whatToFlag:
        'Flag that the process is relying on unstated criteria that vendors cannot answer and evaluators cannot defend consistently.',
      mitigation:
        'Separate mandatory, scored, and informational criteria, then lock the scoring model before responses arrive.',
    },
    {
      id: 'stakeholder-after-release',
      label: 'Stakeholder Alignment After Release',
      detectionHint:
        'Security, legal, operations, finance, or sponsor reviewers first see the RFP after vendors have already received it.',
      whatToFlag:
        'Tell the user late stakeholder review will create rework, addenda, or hidden evaluation criteria.',
      mitigation:
        'Run pre-release alignment with section owners, required signoffs, and explicit dissent or unresolved items.',
    },
  ],

  coachingArc: {
    entry:
      'Start as an evidence architect. Translate shortlist gaps into outcome-led RFP sections and make the user distinguish mandatory, scored, and informational criteria.',
    midPhase:
      'Shift into orchestration discipline. Govern Q&A, assign evaluators, normalize response formats, and keep stakeholders aligned before vendor answers arrive.',
    exit:
      'Close as a gatekeeper. Confirm the released package, scoring plan, Q&A process, and demo/POC carry-forward tests are ready before S4 begins.',
  },

  dependencies: {
    requiresFromPrior: [
      'S2 Shortlist: finalist set with inclusion and exclusion rationale',
      'S2 Shortlist: locked shortlist criteria, disqualifiers, and unresolved evidence gaps',
      'S2 Shortlist: sponsor-visible shortlist approval and dissent record',
    ],
    producesForNext: [
      'Issued RFP package with buyer-controlled questions and response templates',
      'Locked evaluation plan with mandatory, scored, and informational criteria separated',
      'Q&A log and ambiguity disposition process',
      'Vendor response evidence mapped to evaluation owners',
      'Demo/POC test list for claims that written responses cannot prove',
    ],
  },
};
