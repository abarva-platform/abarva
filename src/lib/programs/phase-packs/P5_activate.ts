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
      preventsFailureModes: [1, 9],
    },
    {
      id: 'benefits-realization-attested',
      label: 'Benefits realization attested by sponsor or accountable CXO',
      severity: 'hard',
      evaluationHint:
        'program_modules row with module_key="benefits_realization" and status="completed" plus engagement_participants approval_authority="sponsor" present. Attestation must connect observed value to the P2 baseline KPI and P4 pilot criteria.',
      preventsFailureModes: [1, 9],
    },
    {
      id: 'outcome-report-drafted',
      label: 'Outcome report drafted with pass/fail evidence',
      severity: 'soft',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="outcome_report". The report should state rollout scope, adoption telemetry, value movement, unresolved risks, and whether the program should operate, expand, pause, or roll back.',
      preventsFailureModes: [8, 9],
    },
    {
      id: 'rollout-waves-completed',
      label: 'Rollout waves completed or explicitly held with rationale',
      severity: 'soft',
      evaluationHint:
        'Execution or rollout deliverable names each wave, target cohort, actual completion state, and hold reason for any skipped cohort. A single "launched" status without cohort detail is not enough.',
      preventsFailureModes: [5, 8],
    },
    {
      id: 'adoption-telemetry-baselined',
      label: 'Adoption telemetry baseline captured for Operate',
      severity: 'soft',
      evaluationHint:
        'Evidence row or outcome report section names the adoption metric, current value, source system, collection cadence, and owner. Examples: weekly active users, workflow completion, containment rate, self-service completion, or field compliance.',
      preventsFailureModes: [5, 9],
    },
    {
      id: 'support-readiness-live',
      label: 'Support readiness live with named owner and escalation path',
      severity: 'soft',
      evaluationHint:
        'Operating model or support plan names L1/L2 owner, escalation SLA, knowledge-base owner, defect triage channel, and first 30-day hypercare cadence.',
      preventsFailureModes: [4, 5, 8],
    },
    {
      id: 'exception-paths-controlled',
      label: 'Exception paths controlled and measured',
      severity: 'soft',
      evaluationHint:
        'Outcome evidence identifies manual workarounds, opt-outs, support exceptions, or old-process fallbacks. Each exception has owner, volume, and disposition: accepted, remediating, or kill-signal candidate.',
      preventsFailureModes: [5, 8],
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
        preventsFailureModes: [8, 9],
      },
      {
        id: 'first-rollout-cohort',
        text: 'Which cohort is first, and what makes them safe or necessary to activate first?',
        why:
          'Forces rollout sequencing to be intentional. Random first cohorts hide adoption risk and make support load unpredictable.',
        expectedAnswerShape:
          'Named cohort with rationale, owner, expected volume, support path, and rollback threshold.',
        preventsFailureModes: [5, 8],
      },
      {
        id: 'support-owner-live',
        text: 'Who owns support the morning after rollout, and what can they decide without escalation?',
        why:
          'Activation fails when support ownership is ceremonial. The first week exposes defects, training gaps, and exception pressure that need real decision rights.',
        expectedAnswerShape:
          'Named operational owner, escalation path, decision rights, support hours, and triage channel.',
        preventsFailureModes: [4, 5],
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
        preventsFailureModes: [5, 9],
      },
      {
        id: 'exception-volume',
        text: 'Where are users still bypassing the new process, and what is the volume of those exceptions?',
        why:
          'Exception paths are the earliest signal that activation is performative. High bypass volume means the rollout is not actually changing operations.',
        expectedAnswerShape:
          'Exception list with owner, volume, root cause, and decision: fix, tolerate, pause, or roll back.',
        preventsFailureModes: [5, 8],
      },
      {
        id: 'benefit-source',
        text: 'Which source will the CXO use to attest benefits, and does it match the P2 baseline source?',
        why:
          'Prevents benefit claims from changing measurement method midstream. If the source changes, the outcome report must explain the bridge.',
        expectedAnswerShape:
          'Named system/report plus comparison to P2 baseline source and any normalization required.',
        preventsFailureModes: [3, 9],
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
        preventsFailureModes: [4, 5],
      },
      {
        id: 'cxo-evidence-packet',
        text: 'What evidence will the CXO review to verify this result without taking our word for it?',
        why:
          'Hard-gates the transition to P6. The evidence packet must make benefits attestation auditable and not dependent on program-team optimism.',
        expectedAnswerShape:
          'Outcome report, adoption dashboard, support metrics, exception log, and benefit calculation tied to source systems.',
        preventsFailureModes: [1, 9],
      },
      {
        id: 'scale-pause-rollback',
        text: 'Is the decision to scale, pause, or roll back, and what signal would change that decision?',
        why:
          'Activation must end with a decision, not a status update. Operate needs a clear posture and thresholds for reversing course.',
        expectedAnswerShape:
          'Decision plus threshold: scale to named cohorts, pause pending fixes, or roll back with trigger and owner.',
        preventsFailureModes: [8, 10],
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
      preventsFailureModes: [5, 9],
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
      preventsFailureModes: [8, 10],
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
      preventsFailureModes: [4, 5, 8],
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
      preventsFailureModes: [3, 9],
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
      preventsFailureModes: [5, 8],
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

  // ── Step decomposition · OV2-5-P5 (design doc D.5.4) ─────────────────────
  //
  // 8 canonical P5 steps. P5 prevents failure modes #5 (workflow / operating-
  // model change executes), #8 (pilot-to-production scaling gap surfaces wave
  // by wave), and #9 (instrumentation — adoption telemetry baselined against
  // P4 criteria). The DAG threads the P4 handoff into a wave-aware sub-loop
  // (prep → launch → debrief, repeated per wave), with adoption-monitoring
  // running continuously in parallel across waves. Support-and-exceptions
  // converges on the operating-readiness DoDs once waves complete; CXO
  // verification reads the adoption telemetry baseline + outcome-report draft;
  // the final compose step locks benefits attestation and the outcome report
  // for the P5 → P6 gate.
  //
  // StepComplexity admits only 'simple' | 'complex'. The slice spec marks
  // p5-support-and-exceptions "medium-treat-as-simple" — it is encoded as
  // 'simple' per the slice rule. Adoption-monitoring is continuous (no off-
  // platform workshop) and is also 'simple'. The four wave/CXO interview
  // steps are 'complex' with intentCaptureRequired=true and
  // postMeetingUploadExpected=true.
  //
  // Output rules: outputs MUST reference real DoD ids on this pack, or be the
  // empty array for intermediate-artifact producers. Where the design doc
  // implies an output that has no canonical DoD id (handoff continuity, per-
  // wave prep, per-wave launch), the step's `outputs` is empty and downstream
  // steps reference the intermediate artifact id in their `inputs` so the DAG
  // stays legible:
  //   • p5-handoff-ingest        → p5-handoff-summary
  //   • p5-rollout-wave-prep     → p5-rollout-wave-prep-result
  //   • p5-rollout-wave-launch   → p5-rollout-wave-launch-result
  //   • p5-rollout-wave-debrief  → also emits the cumulative
  //                                p5-outcome-report-draft alongside the
  //                                canonical `rollout-waves-completed` DoD
  //
  // The CXO verification call reads adoption telemetry + outcome-report draft,
  // matching the slice spec. The benefits/outcome-report compose step reads
  // every substantive upstream artifact and emits the two final DoDs that
  // anchor the P5 → P6 gate alongside the cxo-verification DoD.
  steps: [
    // Continuity step. Tagged [5] because P5 monitors workflow / operating-
    // model change wave by wave; the handoff carries the P4 pilot result,
    // operating model, and rollout plan forward so wave prep never relitigates
    // them. No DoD output: this step ingests upstream artifacts and emits an
    // intermediate `p5-handoff-summary` consumed by wave-prep.
    {
      id: 'p5-handoff-ingest',
      label:
        'Confirm P4 build + pilot result + rollout plan carried forward',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: [],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [5],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Per-wave preparation: cohort named, success criteria, support staffed,
    // comms ready. Complex coached workshop (off-platform readiness review).
    // No DoD output: wave-prep produces an intermediate readiness assessment
    // consumed by wave-launch. Tagged [5, 8] because cohort-by-cohort
    // readiness is the explicit pilot-to-production scaling-gap prevention.
    {
      id: 'p5-rollout-wave-prep',
      label:
        'Per-wave preparation: cohort named, success criteria, support staffed, comms ready',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p5-handoff-summary'],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [5, 8],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Launch one rollout wave. Complex coached event (off-platform launch).
    // No DoD output: the launch produces an intermediate wave-result artifact
    // consumed by wave-debrief and adoption-monitoring. Tagged [5, 8] —
    // launching a cohort is where workflow change executes and where the
    // pilot-to-production scaling gap surfaces in real teams.
    {
      id: 'p5-rollout-wave-launch',
      label: 'Launch one rollout wave',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p5-rollout-wave-prep-result'],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [5, 8],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Per-wave debrief: did adoption hold, what broke, what to change for the
    // next wave. Complex coached workshop (off-platform debrief / retro). The
    // cumulative output of this step across all waves is the
    // `rollout-waves-completed` DoD. The step also emits the intermediate
    // `p5-outcome-report-draft` artifact (the running narrative of pass/fail
    // by wave) consumed by the CXO verification call. Tagged [5, 8].
    {
      id: 'p5-rollout-wave-debrief',
      label:
        'Per-wave debrief: did adoption hold, what broke, what to change for the next wave',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p5-rollout-wave-launch-result'],
      outputs: ['rollout-waves-completed'],
      templateRefs: [],
      preventsFailureModes: [5, 8],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Continuous adoption telemetry monitoring; flags the
    // `training-equals-adoption` and `silent-exceptions` anti-patterns when
    // they appear in evidence. Encoded as 'simple' per the slice rule —
    // continuous flagging is chat-resolvable (no off-platform workshop). Runs
    // in parallel with the wave loop and reads each launch result. Tagged
    // [5, 9] — adoption fade is the workflow-change failure mode and missing
    // telemetry is the instrumentation failure mode.
    {
      id: 'p5-adoption-monitoring',
      label:
        'Continuous adoption telemetry monitoring; flag training-equals-adoption and silent-exceptions',
      complexity: 'simple',
      agentRole: 'flag_anti_pattern',
      inputs: ['p5-rollout-wave-launch-result'],
      outputs: ['adoption-telemetry-baselined'],
      templateRefs: [],
      preventsFailureModes: [5, 9],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Slice spec marks this step "medium-treat-as-simple". Encoded as 'simple'
    // per the slice rule — support readiness validation and exception-path
    // control are chat-resolvable evidence checks once the wave debriefs have
    // produced the operating-model evidence. Outputs both canonical DoDs:
    // `support-readiness-live` and `exception-paths-controlled`. Tagged
    // [5, 8] — controlled exception paths and live support are the
    // operating-model proof that prevents value leakage and pilot-to-prod gaps.
    {
      id: 'p5-support-and-exceptions',
      label:
        'Support readiness live; exception paths controlled',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: ['rollout-waves-completed'],
      outputs: ['support-readiness-live', 'exception-paths-controlled'],
      templateRefs: [],
      preventsFailureModes: [5, 8],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Sponsor + CXO peer evidence-packet conversation; CXO attests benefits
    // or asks for rework. Complex coached interview (off-platform executive
    // verification meeting). Reads the adoption telemetry baseline + the
    // outcome-report draft accumulated through the wave debriefs. Outputs the
    // canonical `cxo-verification-complete` DoD. Tagged [1, 9]: CXO sign-off
    // concretizes failure mode #1 (sponsor commitment, re-tested under value)
    // and failure mode #9 (measurable outcomes the executive can attest to).
    {
      id: 'p5-cxo-verification-call',
      label:
        'Sponsor + CXO peer evidence-packet conversation; CXO attests benefits or asks for rework',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: [
        'adoption-telemetry-baselined',
        'p5-outcome-report-draft',
      ],
      outputs: ['cxo-verification-complete'],
      templateRefs: [],
      preventsFailureModes: [1, 9],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Lock the outcome report with benefits attested for handoff to P6.
    // Chat-resolvable compose step — the substantive work happened upstream
    // in the wave debriefs, adoption monitoring, support-and-exceptions, and
    // CXO verification. Reads everything substantive: rollout-waves-completed,
    // adoption-telemetry-baselined, support-readiness-live,
    // exception-paths-controlled, and cxo-verification-complete. Outputs the
    // remaining two P5 → P6 gate DoDs: `benefits-realization-attested` and
    // `outcome-report-drafted`. Tagged [9, 1] — benefits attestation is the
    // instrumentation closure and the sponsor/CXO commitment closure.
    {
      id: 'p5-benefits-attestation-and-outcome-report',
      label:
        'Lock outcome report with benefits attested for handoff to P6',
      complexity: 'simple',
      agentRole: 'compose_artifact',
      inputs: [
        'rollout-waves-completed',
        'adoption-telemetry-baselined',
        'support-readiness-live',
        'exception-paths-controlled',
        'cxo-verification-complete',
      ],
      outputs: ['benefits-realization-attested', 'outcome-report-drafted'],
      templateRefs: [],
      preventsFailureModes: [9, 1],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
  ],
};
