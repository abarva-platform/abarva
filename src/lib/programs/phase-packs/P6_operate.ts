// P6 Operate · Phase Intelligence Pack
//
// Phase semantics:
//   P6 Operate is the steady-state accountability phase. The program has
//   moved beyond launch; Nexus now protects the value case against adoption
//   fade, support decay, quality drift, cost growth, ownership ambiguity, and
//   stale knowledge. Operate is not a victory lap. It is the standing system
//   that proves the capability keeps earning its place in the portfolio.
//
// Gate posture:
//   There is no next phase in the current P0-P6 model, so this pack does not
//   drive a formal phase-advance gate. It still requires evidence: benefits
//   attestation, operating cadence, telemetry ownership, drift review, and a
//   renewal/retirement decision path. Its outputs feed portfolio review,
//   renewal, expansion, or retirement decisions.
//
// In scope:
//   Sustained value measurement, quarterly operating review, adoption drift,
//   support quality, model/process/data quality, cost-to-serve, vendor renewal
//   evidence, and kill/expand decisions.
//
// Out of scope:
//   Re-running activation, hiding poor outcomes behind status language, or
//   creating a new project without closing the original value loop.
//
// Failure modes encoded here draw from program-lifecycle-patterns.ts notes on
// adoption fade, knowledge-base decay, quality drift, data freshness drift,
// license-spend events, and unowned steady-state capabilities.

import type { PhasePack } from './types';

export const P6_OPERATE: PhasePack = {
  phase: 6,
  label: 'P6 Operate',
  outcome:
    'Operate is successful when the capability has a named steady-state owner, a recurring review cadence, telemetry that shows whether value is sustaining against the signed baseline, and a decision path for expansion, remediation, renewal, or retirement. Nexus should treat P6 as active governance: adoption can fade, costs can creep, data quality can drift, support can decay, and vendor commitments can expire. The program is not complete because it launched; it is complete only while the operating evidence keeps defending the value case.',

  definitionOfDone: [
    {
      id: 'standing-owner-named',
      label: 'Standing owner named with decision rights',
      severity: 'hard',
      evaluationHint:
        'Operating model or program record names a business owner and technical owner who continue after launch. A PM, vendor lead, or temporary hypercare owner is not sufficient.',
    },
    {
      id: 'quarterly-operating-review-live',
      label: 'Quarterly operating review cadence live',
      severity: 'hard',
      evaluationHint:
        'Program cadence or governance artifact names the review frequency, attendees, metric pack, decision log owner, and next scheduled review date.',
    },
    {
      id: 'benefits-attestation-retained',
      label: 'Benefits realization attestation retained as baseline for operations',
      severity: 'hard',
      evaluationHint:
        'program_modules row with module_key="benefits_realization" and status="completed", or equivalent outcome evidence retained in the operating review pack with sponsor/CXO attestation.',
    },
    {
      id: 'adoption-drift-dashboard',
      label: 'Adoption drift dashboard active',
      severity: 'soft',
      evaluationHint:
        'Dashboard or evidence record tracks the P5 adoption baseline over time by cohort, including active use, exception volume, support friction, and trend direction.',
    },
    {
      id: 'quality-and-risk-controls-live',
      label: 'Quality/risk controls live for the capability',
      severity: 'soft',
      evaluationHint:
        'Operate evidence names the quality controls relevant to the program: data freshness, model performance, hallucination review, defect rate, handoff quality, security exceptions, or control breaches.',
    },
    {
      id: 'cost-and-vendor-review-ready',
      label: 'Cost/vendor review evidence ready for renewal or expansion',
      severity: 'soft',
      evaluationHint:
        'Financial or vendor evidence tracks run cost, license utilization, services run-rate, renewal date, and value per active cohort. Missing renewal economics means the program cannot defend expansion.',
    },
    {
      id: 'kill-or-expand-thresholds-owned',
      label: 'Kill, remediate, or expand thresholds owned',
      severity: 'soft',
      evaluationHint:
        'Operate review pack names measurable thresholds and owner for expansion, remediation, or retirement. Thresholds must connect to the P2 kill criterion or explain why it changed.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'standing-owner',
        text: 'Who owns this capability now that program pressure has ended?',
        why:
          'Programs decay when ownership stays with the launch team. Operate needs a business owner and technical owner with decision rights, not a project manager closing tasks.',
        expectedAnswerShape:
          'Named owner pair, decision rights, review cadence, escalation path, and budget/run-cost accountability.',
      },
      {
        id: 'value-still-visible',
        text: 'Which metric proves the value case is still alive this quarter?',
        why:
          'Keeps Operate tied to the signed baseline instead of a generic status report. If value is not visible, the program needs remediation or retirement conversation.',
        expectedAnswerShape:
          'Metric, current value, baseline/target, trend, source system, owner, and review date.',
      },
      {
        id: 'adoption-fade-signal',
        text: 'What signal would tell us adoption is fading before the sponsor notices?',
        why:
          'Adoption fade often appears as exception volume, inactive users, support workarounds, or declining workflow completion before executive dashboards show value loss.',
        expectedAnswerShape:
          'Early-warning metric with threshold, cohort breakdown, and owner who responds.',
      },
    ],
    converge: [
      {
        id: 'review-pack-decision',
        text: 'What decision does the next operating review need to make: expand, remediate, renew, or retire?',
        why:
          'A review without a decision is ceremony. Operate should convert telemetry into portfolio choices, not just report status.',
        expectedAnswerShape:
          'One primary decision with evidence required, owner, date, and consequence if the evidence misses threshold.',
      },
      {
        id: 'quality-drift-owner',
        text: 'Who detects quality drift, and what are they allowed to change when it appears?',
        why:
          'Quality controls fail when monitoring and authority are split. The owner must be able to remediate data, model, process, or support issues.',
        expectedAnswerShape:
          'Named owner, monitored signals, thresholds, remediation rights, and escalation path.',
      },
      {
        id: 'run-cost-vs-value',
        text: 'How does run cost compare with realized value for active cohorts?',
        why:
          'Prevents successful launch from becoming an uneconomic operating burden. License and services spend must stay connected to usage and value.',
        expectedAnswerShape:
          'Run cost, active cohort count, utilization, value metric, renewal date, and threshold for expansion or reduction.',
      },
    ],
    close: [
      {
        id: 'quarterly-decision-log',
        text: 'Where is the decision log that records what changed because of the operating review?',
        why:
          'Without a decision log, governance becomes theatre. Nexus needs proof that reviews alter funding, scope, controls, or ownership.',
        expectedAnswerShape:
          'Artifact or system of record with decision, owner, date, evidence cited, and next review trigger.',
      },
      {
        id: 'renewal-or-retirement-case',
        text: 'If renewal or expansion were due next week, what evidence would defend it?',
        why:
          'Forces Operate to maintain a living value case. If the answer is anecdotal, the capability is vulnerable at budget or vendor renewal.',
        expectedAnswerShape:
          'Evidence packet: adoption trend, value trend, cost trend, quality/risk trend, vendor performance, and sponsor/CXO position.',
      },
      {
        id: 'kill-criterion-revisited',
        text: 'Does the original kill criterion still apply, and has the program crossed it?',
        why:
          'Keeps the charter honest after launch. If thresholds changed, the change must be explicit and approved, not silently ignored.',
        expectedAnswerShape:
          'Original criterion, current signal, crossed/not crossed, owner decision, and rationale for any threshold change.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'launch-is-done',
      label: 'The Launch Hangover',
      detectionHint:
        'Program narrative switches to completion language after rollout, with no owner, metric cadence, or operating review date for the next quarter.',
      whatToFlag:
        'Tell the user the capability is launched but not governed. P6 starts when launch pressure drops; that is when value leakage usually begins.',
      mitigation:
        'Name the steady-state owner, telemetry pack, and next operating review before declaring the program operationally complete.',
    },
    {
      id: 'dashboard-without-decision',
      label: 'The Museum Dashboard',
      detectionHint:
        'Dashboard exists but no one can name the decision it supports, the threshold that triggers action, or the owner who changes course.',
      whatToFlag:
        'Surface that the dashboard is observational, not operational. Metrics that do not trigger decisions do not protect value.',
      mitigation:
        'Attach each metric to an expand, remediate, renew, or retire decision with owner and threshold.',
    },
    {
      id: 'adoption-fade-hidden',
      label: 'The Quiet Fade',
      detectionHint:
        'Weekly active use, workflow completion, containment, or cohort participation declines while status remains green because no threshold was set.',
      whatToFlag:
        'Tell the user adoption is drifting under the status layer. Green status without trend thresholds hides value erosion.',
      mitigation:
        'Set cohort-level thresholds and require remediation actions when trend breaks for two reporting periods.',
    },
    {
      id: 'vendor-renewal-amnesia',
      label: 'The Renewal Surprise',
      detectionHint:
        'Vendor renewal, license true-up, or services extension is approaching but the operating pack lacks utilization, value, and performance evidence.',
      whatToFlag:
        'Surface that renewal economics are not defensible. Without value-per-use evidence, renewal becomes procurement theatre.',
      mitigation:
        'Build a renewal evidence pack: utilization, value trend, support issues, vendor obligations, alternatives, and recommendation.',
    },
    {
      id: 'knowledge-base-decay',
      label: 'The Stale Brain',
      detectionHint:
        'Capability depends on policies, prompts, data mappings, workflows, or knowledge articles, but no owner or freshness cadence is named.',
      whatToFlag:
        'Flag that the capability will degrade silently. Stale knowledge produces declining trust before anyone sees a system outage.',
      mitigation:
        'Assign freshness owner, review cadence, quality metric, and exception path for stale or disputed content.',
    },
  ],

  coachingArc: {
    entry:
      'Re-anchor the conversation on ownership and value evidence. Assume launch optimism is fading and ask who owns the next quarter, what metric proves value, and what early signal catches drift.',
    midPhase:
      'Turn telemetry into decisions. Push every dashboard, review, and owner toward expand, remediate, renew, or retire choices. Watch for adoption fade, cost creep, quality drift, and vendor-renewal amnesia.',
    exit:
      'Operate has no final gate, so close each cycle with a decision log. Require evidence that the review changed something: funding, controls, scope, ownership, renewal posture, or retirement path.',
  },

  dependencies: {
    requiresFromPrior: [
      'P5 Activate: rollout completion by cohort, including any held waves and rationale',
      'P5 Activate: adoption telemetry baseline with source, cadence, owner, and threshold',
      'P5 Activate: support readiness package with escalation path, defect triage, and knowledge-base owner',
      'P5 Activate: outcome report and benefits realization attestation reviewed by sponsor/CXO',
    ],
    producesForNext: [
      'Quarterly operating review packet for portfolio governance, renewal, expansion, remediation, or retirement decisions',
      'Sustained value realization evidence tied to the original baseline and any approved measurement changes',
      'Adoption, quality, cost, and risk drift signals with owners and thresholds',
      'Decision log showing what changed because of operating telemetry',
      'Renewal or retirement evidence packet for vendor, budget, and portfolio review cycles',
    ],
  },
};
