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
      preventsFailureModes: [4, 5],
    },
    {
      id: 'quarterly-operating-review-live',
      label: 'Quarterly operating review cadence live',
      severity: 'hard',
      evaluationHint:
        'Program cadence or governance artifact names the review frequency, attendees, metric pack, decision log owner, and next scheduled review date.',
      preventsFailureModes: [5, 9],
    },
    {
      id: 'benefits-attestation-retained',
      label: 'Benefits realization attestation retained as baseline for operations',
      severity: 'hard',
      evaluationHint:
        'program_modules row with module_key="benefits_realization" and status="completed", or equivalent outcome evidence retained in the operating review pack with sponsor/CXO attestation.',
      preventsFailureModes: [1, 9],
    },
    {
      id: 'adoption-drift-dashboard',
      label: 'Adoption drift dashboard active',
      severity: 'soft',
      evaluationHint:
        'Dashboard or evidence record tracks the P5 adoption baseline over time by cohort, including active use, exception volume, support friction, and trend direction.',
      preventsFailureModes: [5, 9],
    },
    {
      id: 'quality-and-risk-controls-live',
      label: 'Quality/risk controls live for the capability',
      severity: 'soft',
      evaluationHint:
        'Operate evidence names the quality controls relevant to the program: data freshness, model performance, hallucination review, defect rate, handoff quality, security exceptions, or control breaches.',
      preventsFailureModes: [6, 9],
    },
    {
      id: 'cost-and-vendor-review-ready',
      label: 'Cost/vendor review evidence ready for renewal or expansion',
      severity: 'soft',
      evaluationHint:
        'Financial or vendor evidence tracks run cost, license utilization, services run-rate, renewal date, and value per active cohort. Missing renewal economics means the program cannot defend expansion.',
      preventsFailureModes: [7, 10],
    },
    {
      id: 'kill-or-expand-thresholds-owned',
      label: 'Kill, remediate, or expand thresholds owned',
      severity: 'soft',
      evaluationHint:
        'Operate review pack names measurable thresholds and owner for expansion, remediation, or retirement. Thresholds must connect to the P2 kill criterion or explain why it changed.',
      preventsFailureModes: [9, 10],
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
        preventsFailureModes: [4, 5],
      },
      {
        id: 'value-still-visible',
        text: 'Which metric proves the value case is still alive this quarter?',
        why:
          'Keeps Operate tied to the signed baseline instead of a generic status report. If value is not visible, the program needs remediation or retirement conversation.',
        expectedAnswerShape:
          'Metric, current value, baseline/target, trend, source system, owner, and review date.',
        preventsFailureModes: [9],
      },
      {
        id: 'adoption-fade-signal',
        text: 'What signal would tell us adoption is fading before the sponsor notices?',
        why:
          'Adoption fade often appears as exception volume, inactive users, support workarounds, or declining workflow completion before executive dashboards show value loss.',
        expectedAnswerShape:
          'Early-warning metric with threshold, cohort breakdown, and owner who responds.',
        preventsFailureModes: [5, 9],
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
        preventsFailureModes: [9, 10],
      },
      {
        id: 'quality-drift-owner',
        text: 'Who detects quality drift, and what are they allowed to change when it appears?',
        why:
          'Quality controls fail when monitoring and authority are split. The owner must be able to remediate data, model, process, or support issues.',
        expectedAnswerShape:
          'Named owner, monitored signals, thresholds, remediation rights, and escalation path.',
        preventsFailureModes: [5, 6],
      },
      {
        id: 'run-cost-vs-value',
        text: 'How does run cost compare with realized value for active cohorts?',
        why:
          'Prevents successful launch from becoming an uneconomic operating burden. License and services spend must stay connected to usage and value.',
        expectedAnswerShape:
          'Run cost, active cohort count, utilization, value metric, renewal date, and threshold for expansion or reduction.',
        preventsFailureModes: [7, 10],
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
        preventsFailureModes: [9, 10],
      },
      {
        id: 'renewal-or-retirement-case',
        text: 'If renewal or expansion were due next week, what evidence would defend it?',
        why:
          'Forces Operate to maintain a living value case. If the answer is anecdotal, the capability is vulnerable at budget or vendor renewal.',
        expectedAnswerShape:
          'Evidence packet: adoption trend, value trend, cost trend, quality/risk trend, vendor performance, and sponsor/CXO position.',
        preventsFailureModes: [7, 10],
      },
      {
        id: 'kill-criterion-revisited',
        text: 'Does the original kill criterion still apply, and has the program crossed it?',
        why:
          'Keeps the charter honest after launch. If thresholds changed, the change must be explicit and approved, not silently ignored.',
        expectedAnswerShape:
          'Original criterion, current signal, crossed/not crossed, owner decision, and rationale for any threshold change.',
        preventsFailureModes: [9, 10],
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
      preventsFailureModes: [5, 9],
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
      preventsFailureModes: [9, 10],
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
      preventsFailureModes: [5, 9],
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
      preventsFailureModes: [7, 10],
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
      preventsFailureModes: [5, 6],
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

  // ── Step decomposition · OV2-5-P6 (design doc D.6.4) ─────────────────────
  //
  // 8 canonical P6 steps. P6 is the steady-state accountability phase: it
  // prevents failure modes #9 (sustained measurement), #5 (sustained workflow
  // change), #10 (sprawl by abandonment / re-tested expectations), and the
  // platform's **learning loop** — the pattern-catalog harvest that lets the
  // next program of this archetype start smarter. The harvest is the
  // compounding mechanism that makes the platform more than a project tool.
  //
  // The DAG threads the P5 handoff into a fan-out: the standing-owner
  // handoff runs first; quarterly-review establish builds on the named owner;
  // quality-and-risk controls run in parallel from the handoff; vendor-renewal
  // prep is parallel and time-triggered (90 days before contract). The first
  // quarterly review consumes review-cadence + quality controls + the P5
  // adoption baseline. Kill-or-expand consumes the first quarterly review's
  // decision log. The pattern-catalog harvest consumes everything substantive
  // and closes the loop.
  //
  // StepComplexity admits only 'simple' | 'complex'. Two design-doc steps are
  // "medium" (quality-risk-controls is a continuous validation activity;
  // vendor-renewal-prep is a time-triggered prep flag). Both are encoded as
  // 'simple' per the slice rule, with a comment naming the design-doc
  // complexity.
  //
  // Output rules: outputs MUST reference real DoD ids on this pack, or be the
  // empty array for intermediate-artifact producers. The first quarterly
  // review produces a decision log — an intermediate artifact that flows into
  // kill-or-expand; downstream steps reference the intermediate artifact id
  // `p6-first-quarterly-review-decision-log` in their `inputs` so the DAG
  // stays legible:
  //   • p6-first-quarterly-review → p6-first-quarterly-review-decision-log
  //
  // The harvest step (`p6-pattern-catalog-harvest`) is unique. Its real
  // output is a write into the pattern catalog itself — outside the P6 DoD,
  // because the DoD captures evidence that the *program* is governed, not
  // evidence that the *platform* is learning. `outputs: []` is the correct
  // encoding; the harvest's value is the cross-program compounding it
  // produces. preventsFailureModes is tagged broadly [9, 10] because the
  // learning loop is what keeps the next archetype-program from repeating
  // the unrealistic-expectations and sustained-measurement failure modes
  // that this program just survived.
  steps: [
    // Continuity step. Tagged [9] because the P5 outcome report and benefits
    // attestation carry the signed baseline forward; without that ingestion,
    // P6 measurement drifts away from the value case. No DoD id maps to a
    // pure handoff-ingest, so outputs is empty; downstream steps reference
    // the intermediate artifact `p6-handoff-ingest-confirmed` to keep the
    // DAG legible.
    {
      id: 'p6-handoff-ingest',
      label:
        'Confirm P5 outcome report + benefits attestation carried into operate',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: [],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [9],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Complex coached interview with the named standing owner pair (business
    // + technical). Off-platform handoff conversation captures explicit RACI,
    // decision rights, escalation path, and budget/run-cost accountability.
    // Output is `standing-owner-named` (hard DoD). Tagged [5] because
    // ownership ambiguity is the dominant cause of sustained workflow-change
    // decay after launch.
    {
      id: 'p6-standing-owner-handoff',
      label:
        'Identify and handoff to standing operating owner with explicit RACI',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: ['p6-handoff-ingest-confirmed'],
      outputs: ['standing-owner-named'],
      templateRefs: [],
      preventsFailureModes: [5],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Complex workshop. Establishes the quarterly operating review cadence,
    // attendees, metric pack, and decision-log owner; stands up the adoption
    // drift dashboard. Outputs both `quarterly-operating-review-live` and
    // `adoption-drift-dashboard` because a single workshop produces the
    // governance artifact and the telemetry surface together. Tagged [9, 5]
    // because sustained measurement and sustained workflow change are both
    // protected by the cadence + drift dashboard pair.
    {
      id: 'p6-quarterly-review-establish',
      label:
        'Establish quarterly operating review cadence + dashboard + decision log',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['standing-owner-named'],
      outputs: [
        'quarterly-operating-review-live',
        'adoption-drift-dashboard',
      ],
      templateRefs: [],
      preventsFailureModes: [9, 5],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Design doc D.6.4 marks quality-and-risk controls "medium" (continuous
    // validation: model drift, bias, security posture, vendor SLA). Encoded
    // as 'simple' per the slice rule — the agent role is `validate`, not a
    // workshop. Runs in parallel from the handoff so quality controls go live
    // before the first quarterly review. Output is the
    // `quality-and-risk-controls-live` DoD. Tagged [6, 9] because late
    // attention to governance/privacy/risk (#6) and inability to measure
    // outcomes (#9) are the two failure modes the controls exist to prevent.
    {
      id: 'p6-quality-risk-controls-live',
      label:
        'Quality-and-risk controls operationalized (model drift, bias, security posture, vendor SLA)',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: ['p6-handoff-ingest-confirmed'],
      outputs: ['quality-and-risk-controls-live'],
      templateRefs: [],
      preventsFailureModes: [6, 9],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // First quarterly operating review. Complex coached workshop executed
    // against the signed P5 baseline + the new drift dashboard + quality
    // controls. Produces an intermediate decision-log artifact that flows
    // into the kill-or-expand decision; no DoD id maps to "first review
    // executed" (the cadence DoD is satisfied by the establish step), so
    // outputs is empty. Tagged [9, 10] because the first review is where
    // sustained measurement either holds (preventing #9) or surfaces the
    // unrealistic-expectations re-test (preventing #10).
    {
      id: 'p6-first-quarterly-review',
      label:
        'Execute the first quarterly operating review against the signed baseline',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: [
        'quarterly-operating-review-live',
        'adoption-drift-dashboard',
        'quality-and-risk-controls-live',
      ],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [9, 10],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Vendor renewal prep is time-triggered: 90 days before contract date the
    // agent flags `vendor-renewal-amnesia` if the operating pack lacks
    // utilization, value, and performance evidence. Design doc D.6.4 marks
    // this "medium"; encoded as 'simple' per the slice rule because the
    // agent role is `flag_anti_pattern` (chat-resolvable). Runs in parallel
    // from the handoff. Output is `cost-and-vendor-review-ready`. Tagged
    // [7, 10] because vendor / build-vs-buy strategy errors (#7) and use-
    // case sprawl / unrealistic expansion (#10) are both surfaced by an
    // unprepared renewal pack.
    {
      id: 'p6-vendor-renewal-prep',
      label:
        "Prep vendor renewal pack 90 days before contract date; flag 'vendor-renewal-amnesia'",
      complexity: 'simple',
      agentRole: 'flag_anti_pattern',
      inputs: ['p6-handoff-ingest-confirmed'],
      outputs: ['cost-and-vendor-review-ready'],
      templateRefs: [],
      preventsFailureModes: [7, 10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Complex coached interview with the standing owner + sponsor. Decides
    // kill / expand / sustain based on the first quarterly review's decision
    // log. Prevents the `dashboard-without-decision` anti-pattern. Output is
    // `kill-or-expand-thresholds-owned` (DoD). Tagged [10, 9] because the
    // kill/expand decision is where unrealistic expectations are explicitly
    // re-tested (#10) and sustained measurement converts into a portfolio
    // choice rather than ceremony (#9).
    {
      id: 'p6-kill-or-expand-decision',
      label:
        'Decide kill / expand / sustain based on quarterly evidence; prevents dashboard-without-decision',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: ['p6-first-quarterly-review-decision-log'],
      outputs: ['kill-or-expand-thresholds-owned'],
      templateRefs: [],
      preventsFailureModes: [10, 9],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Pattern-catalog harvest — the platform's compounding mechanism. Closes
    // the learning loop by writing refined failure-mode patterns, evidence
    // templates, workshop guides, and baseline-capture techniques into the
    // pattern catalog so the next archetype-program starts smarter. Its real
    // output is a write to the pattern catalog itself, which is outside this
    // pack's DoD (the DoD tracks program governance, not platform learning).
    // outputs: [] is the correct encoding — no DoD id captures the harvest.
    // The learning-loop concern is the platform's value-prop made visible;
    // tagged [9, 10] as the broadest-applicable pair because the harvest is
    // what keeps the next program of this archetype from repeating the
    // sustained-measurement and unrealistic-expectations failure modes.
    {
      id: 'p6-pattern-catalog-harvest',
      label:
        'Harvest learnings into the pattern catalog so the next archetype-program starts smarter — closes the loop',
      complexity: 'complex',
      agentRole: 'compose_artifact',
      inputs: [
        'standing-owner-named',
        'quarterly-operating-review-live',
        'adoption-drift-dashboard',
        'quality-and-risk-controls-live',
        'cost-and-vendor-review-ready',
        'kill-or-expand-thresholds-owned',
        'p6-first-quarterly-review-decision-log',
      ],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [9, 10],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
  ],
};
