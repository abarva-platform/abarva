// P5 Activate · Phase Intelligence Pack
//
// Phase semantics:
//   P5 Activate is the controlled rollout phase. The program is no longer
//   proving whether the design can work in a pilot; it is proving whether the
//   organization can adopt it without value leakage, support collapse, or
//   hidden exception paths. Nexus's job is to keep rollout evidence tied to
//   the P4 pilot result, the operating model, and the sponsor's value case.
//
// Gate posture:
//   The formal hard gate in governance.ts is P5 -> P6. It requires CXO
//   verification and benefits realization attestation, with an outcome report
//   drafted as a soft gate. P5 therefore must produce adoption telemetry,
//   support readiness, rollout completion evidence, and an outcome narrative
//   that can survive sponsor review.
//
// In scope:
//   Rollout waves, adoption telemetry, support readiness, benefits evidence,
//   exception handling, change saturation, and cutover accountability.
//
// Out of scope:
//   Re-opening the P3 design, changing the target-state architecture, or
//   treating rollout enthusiasm as benefits realization. Those are P4/P5
//   failure signals, not activation work.
//
// Failure modes encoded here come from cross-pattern lifecycle notes in
// program-lifecycle-patterns.ts: pilot noise, adoption fade, support gaps,
// value-case drift, and rollout programs that confuse training completion
// with behavior change.

import type { PhasePack } from './types';

export const P5_ACTIVATE: PhasePack = {
  phase: 5,
  label: 'P5 Activate',
  outcome:
    'Activation is complete when the approved design has moved through named rollout waves, the operating model is live with accountable owners, adoption telemetry is baselined against the P4 success criteria, support paths are staffed, and the sponsor has enough evidence to attest whether benefits are materializing. The phase does not end because launch communications were sent or training attendance looks high; it ends when the new behavior is observable, exceptions are controlled, and the CXO can verify the result without relying on anecdotes.',

  definitionOfDone: [
    {
      id: 'cxo-verification-complete',
      label: 'CXO verification completed against rollout evidence',
      severity: 'hard',
      evaluationHint:
        'program_modules row with module_key="cxo_verification" and status="completed". The verification note must cite rollout telemetry or outcome evidence, not just a sponsor sentiment statement.',
    },
    {
      id: 'benefits-realization-attested',
      label: 'Benefits realization attested by sponsor or accountable CXO',
      severity: 'hard',
      evaluationHint:
        'program_modules row with module_key="benefits_realization" and status="completed" plus engagement_participants approval_authority="sponsor" present. Attestation must connect observed value to the P2 baseline KPI and P4 pilot criteria.',
    },
    {
      id: 'outcome-report-drafted',
      label: 'Outcome report drafted with pass/fail evidence',
      severity: 'soft',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="outcome_report". The report should state rollout scope, adoption telemetry, value movement, unresolved risks, and whether the program should operate, expand, pause, or roll back.',
    },
    {
      id: 'rollout-waves-completed',
      label: 'Rollout waves completed or explicitly held with rationale',
      severity: 'soft',
      evaluationHint:
        'Execution or rollout deliverable names each wave, target cohort, actual completion state, and hold reason for any skipped cohort. A single "launched" status without cohort detail is not enough.',
    },
    {
      id: 'adoption-telemetry-baselined',
      label: 'Adoption telemetry baseline captured for Operate',
      severity: 'soft',
      evaluationHint:
        'Evidence row or outcome report section names the adoption metric, current value, source system, collection cadence, and owner. Examples: weekly active users, workflow completion, containment rate, self-service completion, or field compliance.',
    },
    {
      id: 'support-readiness-live',
      label: 'Support readiness live with named owner and escalation path',
      severity: 'soft',
      evaluationHint:
        'Operating model or support plan names L1/L2 owner, escalation SLA, knowledge-base owner, defect triage channel, and first 30-day hypercare cadence.',
    },
    {
      id: 'exception-paths-controlled',
      label: 'Exception paths controlled and measured',
      severity: 'soft',
      evaluationHint:
        'Outcome evidence identifies manual workarounds, opt-outs, support exceptions, or old-process fallbacks. Each exception has owner, volume, and disposition: accepted, remediating, or kill-signal candidate.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'pilot-result-interpretation',
        text: 'What exactly did the pilot prove, and what did it fail to prove?',
        why:
          'Prevents the rollout from over-claiming P4 evidence. If the pilot only proved one cohort or workflow, activation must not imply enterprise readiness.',
        expectedAnswerShape:
          'A pass/fail summary tied to P4 success criteria, with explicit caveats: cohort, workflow, volume, geography, and failure modes not tested.',
      },
      {
        id: 'first-rollout-cohort',
        text: 'Which cohort is first, and what makes them safe or necessary to activate first?',
        why:
          'Forces rollout sequencing to be intentional. Random first cohorts hide adoption risk and make support load unpredictable.',
        expectedAnswerShape:
          'Named cohort with rationale, owner, expected volume, support path, and rollback threshold.',
      },
      {
        id: 'support-owner-live',
        text: 'Who owns support the morning after rollout, and what can they decide without escalation?',
        why:
          'Activation fails when support ownership is ceremonial. The first week exposes defects, training gaps, and exception pressure that need real decision rights.',
        expectedAnswerShape:
          'Named operational owner, escalation path, decision rights, support hours, and triage channel.',
      },
    ],
    converge: [
      {
        id: 'telemetry-vs-training',
        text: 'What behavior telemetry tells us people are using the new way of working, not just attending training?',
        why:
          'Training completion is not adoption. Nexus needs a behavior signal that survives Operate and can be compared to the value hypothesis.',
        expectedAnswerShape:
          'Metric with source and cadence: usage, workflow completion, exception volume, containment, cycle time, quality, or compliance.',
      },
      {
        id: 'exception-volume',
        text: 'Where are users still bypassing the new process, and what is the volume of those exceptions?',
        why:
          'Exception paths are the earliest signal that activation is performative. High bypass volume means the rollout is not actually changing operations.',
        expectedAnswerShape:
          'Exception list with owner, volume, root cause, and decision: fix, tolerate, pause, or roll back.',
      },
      {
        id: 'benefit-source',
        text: 'Which source will the CXO use to attest benefits, and does it match the P2 baseline source?',
        why:
          'Prevents benefit claims from changing measurement method midstream. If the source changes, the outcome report must explain the bridge.',
        expectedAnswerShape:
          'Named system/report plus comparison to P2 baseline source and any normalization required.',
      },
    ],
    close: [
      {
        id: 'operate-handoff-owner',
        text: 'Who owns the capability after activation pressure is gone?',
        why:
          'Operate fails when launch teams dissolve and no standing owner inherits adoption, quality, cost, and drift measurement.',
        expectedAnswerShape:
          'Named business owner, technical owner, governance cadence, and escalation route for the next quarter.',
      },
      {
        id: 'cxo-evidence-packet',
        text: 'What evidence will the CXO review to verify this result without taking our word for it?',
        why:
          'Hard-gates the transition to P6. The evidence packet must make benefits attestation auditable and not dependent on program-team optimism.',
        expectedAnswerShape:
          'Outcome report, adoption dashboard, support metrics, exception log, and benefit calculation tied to source systems.',
      },
      {
        id: 'scale-pause-rollback',
        text: 'Is the decision to scale, pause, or roll back, and what signal would change that decision?',
        why:
          'Activation must end with a decision, not a status update. Operate needs a clear posture and thresholds for reversing course.',
        expectedAnswerShape:
          'Decision plus threshold: scale to named cohorts, pause pending fixes, or roll back with trigger and owner.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'training-equals-adoption',
      label: 'The Attendance Mirage',
      detectionHint:
        'User cites training attendance, launch emails, or office-hours participation as the primary evidence that activation succeeded, with no behavior or usage metric.',
      whatToFlag:
        'Tell the user training proves exposure, not adoption. A program can have 95% attendance and still leave the old process untouched.',
      mitigation:
        'Redirect to behavior telemetry: usage, workflow completion, exception volume, support tickets, cycle time, quality, or control adherence by cohort.',
    },
    {
      id: 'pilot-overreach',
      label: 'The Pilot Halo',
      detectionHint:
        'Rollout plan claims enterprise readiness from a narrow pilot: one geography, one friendly team, low transaction volume, or handpicked users.',
      whatToFlag:
        'Surface that the pilot result is being overgeneralized. The rollout may be valid, but the evidence does not yet cover the stated activation scope.',
      mitigation:
        'Make the caveat explicit and sequence rollout waves to test the missing risk: hostile users, higher volume, different geography, or unsupported edge cases.',
    },
    {
      id: 'support-afterthought',
      label: 'The Empty Hypercare Desk',
      detectionHint:
        'Support plan says "hypercare" but no named owner, SLA, defect triage path, knowledge-base owner, or authority to stop a rollout wave.',
      whatToFlag:
        'Tell the user support readiness is ceremonial. Activation will convert first-week friction into workarounds if support cannot decide quickly.',
      mitigation:
        'Name support owners, escalation rights, triage cadence, and rollback thresholds before the next cohort activates.',
    },
    {
      id: 'changed-measurement-source',
      label: 'The Moving Scoreboard',
      detectionHint:
        'Benefit claim uses a different source, window, denominator, or metric definition than the P2 baseline without explaining the bridge.',
      whatToFlag:
        'Flag that the value case is no longer comparable to the signed charter. The outcome report must not move the scoreboard after rollout.',
      mitigation:
        'Either use the original baseline source or document a conversion bridge with finance/sponsor approval and the reason the source changed.',
    },
    {
      id: 'silent-exceptions',
      label: 'The Shadow Process',
      detectionHint:
        'Users keep old spreadsheets, manual approvals, vendor side channels, or override queues alive while rollout status is reported as complete.',
      whatToFlag:
        'Surface that the old operating model is still running under the new label. Value will leak through exceptions that no one is measuring.',
      mitigation:
        'Inventory exception paths, quantify volume, decide disposition, and include residual exceptions in the Operate dashboard.',
    },
  ],

  coachingArc: {
    entry:
      'Start by narrowing the rollout claim. Anchor every activation decision to the P4 pilot result, the named cohort, and the support path. Do not let the user equate launch activity with operating adoption.',
    midPhase:
      'Press on telemetry and exceptions. Compare adoption behavior against the P2 baseline and P4 success criteria, then force support readiness into named owners, escalation rights, and wave-level decisions.',
    exit:
      'Shift into verification posture. Package evidence for CXO review, lock the Operate owner and cadence, and require a scale, pause, or rollback decision before calling activation complete.',
  },

  dependencies: {
    requiresFromPrior: [
      'P4 Build: pilot outcome stated as pass/fail against locked success criteria, including caveats and unresolved defects',
      'P4 Build: operating model with named business owner, technical owner, support path, and decision rights',
      'P4 Build: rollout plan naming waves, cohorts, readiness criteria, and rollback thresholds',
    ],
    producesForNext: [
      'Rollout completion evidence by cohort, including held waves and rationale',
      'Adoption telemetry baseline with source, cadence, owner, and comparison to P2/P4 criteria',
      'Support readiness package with L1/L2 owner, escalation SLA, defect triage, and knowledge-base owner',
      'Outcome report for CXO verification and benefits realization attestation',
      'Scale, pause, or rollback decision with threshold that Operate can monitor',
    ],
  },
};
