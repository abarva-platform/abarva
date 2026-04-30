// S7 Activate - Sourcing Stage Pack
//
// Activate is the value-realization launch stage. Sentinel's job is to make the
// contract operational: owners, cadence, telemetry, adoption, obligation
// tracking, and value proof must be in place before sourcing declares victory.

import type { StagePack } from './types';

export const S7_ACTIVATE: StagePack = {
  stage: 7,
  label: 'S7 Activate',
  sourceStageKeys: ['contract_mobilization', 'value_realization'],
  crossReferences: {
    patternIds: [
      'PAT-SRC-AMS-001',
      'PAT-SRC-FRAMEWORK-001',
    ],
    sourceStageKeys: ['contract_mobilization', 'value_realization'],
  },
  outcome:
    'Activate is complete when the signed contract has become an operating system: vendor and buyer owners are named, mobilization gates are tracked, service and adoption measures are live, commercial obligations are monitored, value realization has a baseline, and unresolved contract or transition risks have an owner and review cadence. This stage does not end because the contract was signed or the kickoff meeting happened. It ends when Sentinel can show that the buyer can govern performance, prove early value, catch obligation misses, and decide whether to scale, remediate, or pause based on evidence rather than implementation optimism.',

  definitionOfDone: [
    {
      id: 'activation-owner-map-live',
      label: 'Activation owner map live across buyer, vendor, and governance roles',
      severity: 'hard',
      evaluationHint:
        'Activation plan names accountable buyer owner, vendor owner, procurement/commercial owner, security/data owner, finance owner, operational workstream leads, escalation path, and meeting cadence.',
    },
    {
      id: 'mobilization-gates-tracked',
      label: 'Mobilization gates tracked with evidence and no-go criteria',
      severity: 'hard',
      evaluationHint:
        'Mobilization tracker records gate list, due dates, owners, status, evidence links, dependencies, acceptance criteria, no-go thresholds, and decision path for blocked or waived gates.',
    },
    {
      id: 'value-baseline-and-metrics-set',
      label: 'Value baseline and first realization metrics set',
      severity: 'hard',
      evaluationHint:
        'Value realization artifact states baseline cost, service, adoption, risk, or productivity measures; target outcomes; measurement source; reporting cadence; and owner for confirming early value.',
    },
    {
      id: 'contract-obligation-monitoring-started',
      label: 'Contract obligation monitoring started for both vendor and buyer duties',
      severity: 'hard',
      evaluationHint:
        'Obligation tracker covers service levels, reporting, credits/remedies, deliverables, data/security actions, buyer retained duties, change-control rules, and escalation triggers from the contract packet.',
    },
    {
      id: 'launch-risk-register-owned',
      label: 'Launch risk register owned with remediation cadence',
      severity: 'hard',
      evaluationHint:
        'Activation evidence lists open risks, residual contract exceptions, transition dependencies, severity, owner, due date, mitigation, acceptance decision, and governance forum where status is reviewed.',
    },
    {
      id: 'adoption-and-change-plan-started',
      label: 'Adoption and change plan started for impacted users or teams',
      severity: 'soft',
      evaluationHint:
        'Change plan names impacted populations, training or enablement path, communication owner, launch support model, feedback capture, adoption metric, and consequence if uptake lags.',
    },
    {
      id: 'first-governance-review-scheduled',
      label: 'First governance and value review scheduled with decision agenda',
      severity: 'soft',
      evaluationHint:
        'Calendar, plan, or governance artifact schedules first review and includes agenda for mobilization gates, service metrics, risks, obligations, value baseline, change orders, and decisions needed.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'who-runs-activation',
        text: 'Who is accountable for activation after signature, and who can unblock vendor or buyer misses?',
        why:
          'Activation cannot be governed by the sourcing team alone. Sentinel needs accountable operating owners before kickoff energy fades.',
        expectedAnswerShape:
          'Buyer owner, vendor owner, commercial owner, workstream leads, escalation path, and authority for gate waivers or remediation.',
      },
      {
        id: 'day-one-no-go-gates',
        text: 'Which day-one gates would stop launch if they are not met?',
        why:
          'A kickoff without no-go criteria creates momentum even when access, security, data, staffing, or acceptance evidence is not ready.',
        expectedAnswerShape:
          'Gate, owner, evidence required, due date, no-go threshold, and decision forum.',
      },
      {
        id: 'value-baseline-source',
        text: 'What baseline will prove whether the sourcing decision created value?',
        why:
          'Without a baseline, value realization becomes anecdotal. Sentinel should define proof before benefits are claimed.',
        expectedAnswerShape:
          'Baseline measure, source, owner, target, cadence, and first review date.',
      },
    ],
    converge: [
      {
        id: 'obligation-tracker-coverage',
        text: 'Which contract obligations are being monitored from week one, including buyer obligations?',
        why:
          'Vendors are not the only source of misses. Buyer retained duties, service reporting, credits, deliverables, and change controls need active monitoring.',
        expectedAnswerShape:
          'Obligation list with vendor/buyer owner, trigger, evidence source, cadence, and escalation or remedy.',
      },
      {
        id: 'launch-risk-burn-down',
        text: 'Which launch risks are getting better, worse, or accepted, and who made that call?',
        why:
          'Activation should burn risk down deliberately instead of reclassifying blocked work as implementation noise.',
        expectedAnswerShape:
          'Risk, trend, evidence, mitigation, owner, acceptance decision, and next governance action.',
      },
      {
        id: 'adoption-signal',
        text: 'What early adoption or operating signal would tell us the rollout is not taking hold?',
        why:
          'The first value leak is often user behavior or operating friction, not contract breach. Sentinel should force an early signal.',
        expectedAnswerShape:
          'Population, adoption metric, threshold, feedback source, response owner, and remediation action.',
      },
    ],
    close: [
      {
        id: 'first-value-review-decision',
        text: 'At the first value review, what decision will we be ready to make: scale, continue, remediate, hold, or unwind?',
        why:
          'Activation needs a decision checkpoint. Otherwise governance meetings become status updates without consequences.',
        expectedAnswerShape:
          'Decision options, evidence required, owner, timing, and consequence for each path.',
      },
      {
        id: 'commercial-control-after-launch',
        text: 'How will change orders, credits, missed obligations, and scope drift be controlled after launch?',
        why:
          'Post-launch commercial leakage can erase sourcing value. Sentinel should make the control loop explicit before closing Source work.',
        expectedAnswerShape:
          'Control owner, trigger, approval rule, reporting cadence, escalation, and value impact tracking.',
      },
      {
        id: 'source-closeout-record',
        text: 'What evidence lets Source close the event without abandoning value realization?',
        why:
          'Sourcing should close only when ongoing governance can carry the contract. The handoff must preserve accountability and evidence.',
        expectedAnswerShape:
          'Closeout packet, operating owner acceptance, value dashboard, open risks, review cadence, and escalation path.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'signature-victory-lap',
      label: 'Signature Victory Lap',
      detectionHint:
        'The team treats contract signature or vendor kickoff as completion while mobilization gates, obligation monitoring, or value metrics are not live.',
      whatToFlag:
        'Tell the user that signature is not value realization. The event is still at risk until operating owners can govern the contract with evidence.',
      mitigation:
        'Shift from award language to activation controls: owner map, gate tracker, obligation tracker, value baseline, and first governance review.',
    },
    {
      id: 'vendor-only-accountability',
      label: 'Vendor-Only Accountability',
      detectionHint:
        'Governance focuses on vendor deliverables but ignores buyer retained obligations, access, data readiness, staffing, approvals, or change adoption.',
      whatToFlag:
        'Surface that buyer misses can become vendor excuses and value leakage. Activation accountability must be bilateral.',
      mitigation:
        'Track buyer and vendor obligations in the same operating cadence with owners, due dates, evidence, and escalation triggers.',
    },
    {
      id: 'benefits-without-baseline',
      label: 'Benefits Without Baseline',
      detectionHint:
        'The team claims savings, service improvement, risk reduction, or productivity value without a baseline, measurement source, target, or review owner.',
      whatToFlag:
        'Flag that value cannot be proven from narrative. Without baseline and cadence, benefits become optimism rather than evidence.',
      mitigation:
        'Define baseline, target, data source, cadence, owner, and first value review decision before closing the Source event.',
    },
    {
      id: 'governance-as-status',
      label: 'Governance As Status Meeting',
      detectionHint:
        'The first governance cadence has agenda slots but no decisions, thresholds, remedies, or escalation paths tied to contract and value evidence.',
      whatToFlag:
        'Tell the user the governance forum is informational, not controlling. It will not protect value unless it can make or escalate decisions.',
      mitigation:
        'Turn the cadence into a decision loop: gates, metrics, obligations, risks, change orders, credits, adoption, and scale/remediate/hold decisions.',
    },
  ],

  coachingArc: {
    entry:
      'Begin by moving the user from signature celebration into operating accountability. Name the owners, day-one gates, value baseline, and first governance forum before accepting kickoff momentum.',
    midPhase:
      'Stay evidence-first. Burn down mobilization gates, track bilateral obligations, test launch risks, and push for early adoption and value signals rather than optimistic status language.',
    exit:
      'Close only when governance can carry the contract without Source holding it together. Package the value baseline, control loops, open risks, owner acceptance, and first value-review decision.',
  },

  dependencies: {
    requiresFromPrior: [
      'S6 Contract: signed or approval-ready contract packet with award-critical commitments traced to enforceable language',
      'S6 Contract: mobilization baseline covering obligations, milestones, access/data dependencies, acceptance criteria, and no-go gates',
      'S6 Contract: residual risks, exception approvals, finance/security/privacy terms, and post-signature controls handed off to operating owners',
      'Current Source event: activation plan, owner map, gate tracker, value baseline, obligation tracker, and launch risk register available through broker-routed context',
    ],
    producesForNext: [
      'Operating owner map and governance cadence accepted by buyer and vendor',
      'Mobilization gate tracker with evidence, no-go criteria, decisions, and remediation path',
      'Value realization baseline, early metrics, reporting cadence, and first value-review decision agenda',
      'Bilateral obligation tracker covering service levels, reports, credits/remedies, buyer duties, change control, data/security actions, and escalation triggers',
      'Source closeout record with open risks, adoption/change plan, commercial controls, owner acceptance, and handoff to ongoing governance',
    ],
  },
};
