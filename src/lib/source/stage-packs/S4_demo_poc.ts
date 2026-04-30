// S4 Demo / POC - Sourcing Stage Pack
//
// Demo and POC work should prove buyer-defined scenarios, not reward the most
// polished vendor theatre. Sentinel keeps success criteria locked, red-team
// tests visible, and evidence comparable before BAFO pressure starts.

import type { StagePack } from './types';

export const S4_DEMO_POC: StagePack = {
  stage: 4,
  label: 'S4 Demo / POC',
  sourceStageKeys: ['vendor_responses', 'evaluation'],
  crossReferences: {
    patternIds: ['PAT-SRC-RFP-001'],
    sourceStageKeys: ['vendor_responses', 'evaluation'],
  },
  outcome:
    'Demo / POC is complete when each finalist has been tested against buyer-designed scenarios, success criteria were locked before sessions began, red-team or failure-mode scenarios were observed, evaluator notes are comparable, and unresolved claims are either closed or carried forward into BAFO as explicit risk and commercial pressure. This stage does not end because vendors presented impressive walkthroughs. It ends when Sentinel can show what was proven, what failed, what remains unproven, and how the evidence changes finalist ranking or BAFO posture.',

  definitionOfDone: [
    {
      id: 'buyer-designed-scenarios-locked',
      label: 'Buyer-designed demo or POC scenarios locked before vendor sessions',
      severity: 'hard',
      evaluationHint:
        'Demo plan, POC script, or evaluation packet lists the buyer-authored scenarios, data assumptions, role flows, constraints, and lock date before vendor sessions. Vendor-curated agendas alone do not satisfy this item.',
    },
    {
      id: 'success-criteria-predefined',
      label: 'Success criteria and evidence capture predefined',
      severity: 'hard',
      evaluationHint:
        'Evaluation artifact defines pass/fail or scored success criteria, required proof artifacts, observer note format, and evidence owner before demos or POCs begin.',
    },
    {
      id: 'red-team-scenarios-included',
      label: 'Red-team, exception, or failure-mode scenarios included',
      severity: 'hard',
      evaluationHint:
        'Demo/POC plan contains at least one stress path, exception case, integration failure, security/compliance challenge, data-quality issue, or operational handoff scenario for each finalist or a documented rationale for why it is not applicable.',
    },
    {
      id: 'evaluator-notes-comparable',
      label: 'Evaluator notes captured in a comparable format',
      severity: 'hard',
      evaluationHint:
        'Session notes or scorecards use a shared rubric and capture scenario result, evidence observed, caveats, open questions, and owner by vendor rather than free-form impressions only.',
    },
    {
      id: 'claims-dispositioned',
      label: 'Vendor claims dispositioned as proven, unproven, failed, or deferred',
      severity: 'soft',
      evaluationHint:
        'Evaluation summary or decision memo lists key vendor claims with observed proof status and identifies which unresolved claims become BAFO clarifications, contract conditions, references, or post-award risks.',
    },
    {
      id: 'bafo-pressure-points-identified',
      label: 'BAFO pressure points identified from demo/POC evidence',
      severity: 'soft',
      evaluationHint:
        'Pre-BAFO summary maps scenario gaps, transition assumptions, service-level weaknesses, integration risks, or required concessions to finalist-specific BAFO clarification or commercial asks.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'buyer-designed-not-vendor-scripted',
        text: 'Which scenarios are buyer-designed, and where are we still letting vendors drive the script?',
        why:
          'Demo evidence is weak when the vendor chooses the path of least resistance. Sentinel needs buyer-authored scenarios to prove fit against the actual operating problem.',
        expectedAnswerShape:
          'Scenario list, buyer owner, vendor-scripted portions, constraints, data assumptions, and reason each scenario matters.',
      },
      {
        id: 'success-before-session',
        text: 'What counts as success before the first demo or POC session begins?',
        why:
          'Criteria set after watching a demo become rationalization. Success standards must be locked while the team is still vendor-neutral.',
        expectedAnswerShape:
          'Pass/fail criteria, scoring rubric, proof required, observer roles, and evidence capture format.',
      },
    ],
    converge: [
      {
        id: 'red-team-paths',
        text: 'Which red-team or failure-mode scenario would reveal whether this vendor can handle our real operating edge cases?',
        why:
          'Polished happy paths rarely expose implementation, security, workflow, integration, or support risk.',
        expectedAnswerShape:
          'Failure scenario, why it matters, expected vendor behavior, disqualifying outcome, and evidence owner.',
      },
      {
        id: 'claim-proof-status',
        text: 'For each material vendor claim, did we observe proof, a workaround, a promise, or a gap?',
        why:
          'S4 should convert marketing claims into evidence status that can change ranking, BAFO asks, or contract conditions.',
        expectedAnswerShape:
          'Claim, scenario observed, proof status, caveat, owner, and carry-forward action.',
      },
      {
        id: 'observer-disagreement',
        text: 'Where did evaluators disagree, and what evidence would settle the disagreement?',
        why:
          'Divergent stakeholder reactions are useful only if Sentinel turns them into testable evidence rather than preference noise.',
        expectedAnswerShape:
          'Evaluator positions, evidence cited, missing proof, decision impact, and next test or ruling owner.',
      },
    ],
    close: [
      {
        id: 'what-ranking-changed',
        text: 'What changed in finalist ranking or confidence after demo/POC evidence?',
        why:
          'The stage should produce a decision signal. If ranking or confidence did not change, Sentinel needs to know whether that is evidence-backed or because the test was too weak.',
        expectedAnswerShape:
          'Vendor-by-vendor confidence change, evidence that caused it, unresolved caveats, and ranking impact.',
      },
      {
        id: 'bafo-carry-forward',
        text: 'Which unresolved claims, failures, or concessions must become BAFO asks or contract conditions?',
        why:
          'Demo/POC gaps lose leverage if they are not converted into finalist-specific BAFO pressure before selection hardens.',
        expectedAnswerShape:
          'Vendor, unresolved item, BAFO clarification or concession, contract condition if needed, and owner.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'vendor-theatre-demo',
      label: 'Vendor Theatre Demo',
      detectionHint:
        'The agenda is vendor-created, the team praises polish or roadmap slides, and no one can map the session to buyer-designed scenarios or locked criteria.',
      whatToFlag:
        'Tell the user the session is proving presentation quality more than operational fit.',
      mitigation:
        'Replace or supplement the agenda with buyer-owned scenarios, required proof artifacts, and evaluator scorecards.',
    },
    {
      id: 'success-after-the-fact',
      label: 'Success Criteria After The Fact',
      detectionHint:
        'Evaluators decide what mattered only after seeing vendor performance, or scoring notes use different proof standards by vendor.',
      whatToFlag:
        'Flag that the evaluation is drifting into retrospective justification rather than controlled proof.',
      mitigation:
        'Lock success criteria, scoring scale, proof requirements, and observer responsibilities before any further session.',
    },
    {
      id: 'happy-path-only',
      label: 'Happy Path Only',
      detectionHint:
        'Every scenario follows ideal data, clean integrations, standard users, and vendor-prepared workflows with no exception or stress path.',
      whatToFlag:
        'Surface that the stage has not tested implementation and operating risk.',
      mitigation:
        'Add red-team scenarios: bad data, integration failure, permission boundary, SLA breach, edge workflow, or handoff failure.',
    },
    {
      id: 'notes-as-impressions',
      label: 'Notes As Impressions',
      detectionHint:
        'Evaluator notes say things like "strong demo" or "good fit" without scenario result, evidence observed, caveat, or decision impact.',
      whatToFlag:
        'Tell the user impressions cannot support BAFO posture or a defensible selection record.',
      mitigation:
        'Recast notes into a comparable evidence table with scenario, result, proof, caveat, score, and carry-forward action.',
    },
  ],

  coachingArc: {
    entry:
      'Start as a test designer. Pull the user away from vendor agendas and lock buyer scenarios, success criteria, observers, and proof formats before sessions begin.',
    midPhase:
      'Operate as evidence referee. Push through red-team paths, distinguish proof from promise, and convert evaluator disagreement into follow-up tests.',
    exit:
      'Close as BAFO translator. Summarize what was proven, what failed, what remains unproven, and which items become commercial pressure or contract conditions.',
  },

  dependencies: {
    requiresFromPrior: [
      'S3 RFP: issued package and response evidence mapped to evaluation owners',
      'S3 RFP: demo/POC tests carried forward from written-response gaps',
      'S3 RFP: locked mandatory, scored, and informational criteria',
    ],
    producesForNext: [
      'Buyer-designed scenario results by finalist',
      'Comparable evaluator notes and proof artifacts',
      'Red-team scenario outcomes and failure-mode evidence',
      'Dispositioned vendor claims with unresolved gaps',
      'BAFO clarification, concession, and contract-condition asks',
    ],
  },
};
