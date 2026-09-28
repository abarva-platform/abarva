// P3 Design - Phase Intelligence Pack
//
// Phase semantics (from src/lib/programs/programs-fixture.ts PHASE_LABEL_MAP
// and src/lib/intelligence/program-lifecycle-patterns.ts P3-Design stage):
//
//   P3 uses the human-validated P2 route to produce only the design detail
//   needed for a transparent P4 estimate. Technical-only work does not trigger
//   full process or operating-model redesign. P3 does not execute a pilot.
//
// Inputs inherited from P2 are binding:
//   - recommended target-state path
//   - architecture sketch and architecture reviewer
//   - baseline KPI/source/method
//   - sponsor commitment and succession owner
//   - scope boundary
//   - kill criterion
//   - named dissenter
//
// Exit output is an estimate-ready approach: approved evidence traceability,
// route-appropriate architecture/process detail, adoption and operating
// ownership, delivery assumptions, and material open questions. P4 estimates
// the roadmap; execution follows approval and P5 handoff outside Moves.
//
// Gate checks (mirrors GATE_RULES P3->P4 in src/lib/programs/governance.ts):
//   - phase_3_findings_written - soft
//   - cxo_interview_complete - soft
//
// The hard discipline in this pack is stricter than the platform gate because
// the platform allows a lead to advance with rationale. Nexus should still
// surface weak evidence loudly before P4 starts.

import type { PhasePack } from './types';

export const P3_DESIGN: PhasePack = {
  phase: 3,
  label: 'P3 Design',
  outcome:
    'An estimate-ready approach derived from approved P2 evidence and the human-validated solution route. Include enough target architecture, data/integration design, traceability, ownership, and delivery assumptions to size work and compare internal, vendor, or hybrid approaches. Add process and operating-model detail only when validated evidence shows material change; otherwise state the adoption owner and business responsibility. P3 does not produce a full implementation specification or execute a pilot. P4 builds the reviewed roadmap and estimate; P5 hands it to external delivery.',

  definitionOfDone: [
    {
      id: 'p2-target-state-path-carried-forward',
      label: 'P2 recommended target-state path carried forward',
      severity: 'hard',
      evaluationHint:
        'Design package references the P2 synthesis recommendation and names the ' +
        'chosen target-state path. If the design silently changes direction, it ' +
        'must include a dated decision record from sponsor and architecture.',
      preventsFailureModes: [1, 2],
    },
    {
      id: 'detailed-design-signed-off',
      label: 'Route-appropriate design approach reviewed by accountable owners',
      severity: 'hard',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="design_spec" or "design" ' +
        'and status="signed_off", plus named technical reviewers as applicable. ' +
        'Full process and operating-model detail is required only when the ' +
        'approved P2 route shows material business change.',
      preventsFailureModes: [1, 6, 7],
    },
    {
      id: 'architecture-sketch-expanded',
      label: 'P2 architecture sketch expanded to estimate-ready detail',
      severity: 'hard',
      evaluationHint:
        'Design artifact shows integrations, data flows, system boundaries, owner ' +
        'for material interfaces, and explicit deltas from the P2 sketch. Include ' +
        'detail that changes scope, estimate, risk, or approval; low-level build ' +
        'specifications remain in delivery.',
      preventsFailureModes: [6, 7],
    },
    {
      id: 'pilot-cohort-named',
      label: 'Validation scope identified when applicable to the approved route',
      severity: 'hard',
      evaluationHint:
        'If a pilot or representative validation is needed, name the cohort and ' +
        'the limits of what it proves. Do not require a business-process pilot ' +
        'for a technical-only use case when technical validation is sufficient.',
      preventsFailureModes: [5, 8],
    },
    {
      id: 'success-criteria-locked',
      label: 'Success criteria tied to P2 baseline and route',
      severity: 'hard',
      evaluationHint:
        'Define measurable acceptance/validation criteria tied to the P2 baseline ' +
        'and name the source, owner, and decision rule. P4 plans the roadmap; P3 ' +
        'does not authorize or start execution.',
      preventsFailureModes: [8, 9],
    },
    {
      id: 'sponsor-commitment-confirmed',
      label: 'Sponsor commitment and decision cadence confirmed for Execution Roadmap',
      severity: 'hard',
      evaluationHint:
        'Design closeout records the sponsor cadence for P4, the decision forum, ' +
        'and the person with approval_authority="sponsor". If the sponsor is only ' +
        'represented by a delegate, the Execution Roadmap start is politically exposed.',
      preventsFailureModes: [1],
    },
    {
      id: 'scope-boundary-preserved',
      label: 'P2 scope boundary preserved in design and pilot scope',
      severity: 'hard',
      evaluationHint:
        'Design package includes in-scope/out-of-scope text and maps every design ' +
        'workstream to that boundary. New workstreams outside the charter require ' +
        'a sponsor-approved change record, not informal design expansion.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'kill-criterion-operationalized',
      label: 'Kill criterion translated into pilot stop rule',
      severity: 'hard',
      evaluationHint:
        'Pilot plan states how the P2 kill criterion will be observed in P4, who ' +
        'can call it, and what data source triggers the stop/re-baseline decision.',
      preventsFailureModes: [8, 10],
    },
    {
      id: 'named-dissenter-engaged',
      label: 'Named dissenter engaged or explicitly escalated',
      severity: 'soft',
      evaluationHint:
        'Phase-3 findings or stakeholder log includes the P2 named dissenter, ' +
        'their objection, and resolution/escalation status. Absence is a signal ' +
        'that political risk was deferred into Execution Roadmap.',
      preventsFailureModes: [1, 5],
    },
    {
      id: 'phase-3-findings-written',
      label: 'Phase 3 findings written',
      severity: 'soft',
      evaluationHint:
        'program_modules row with module_key="phase_3_findings" or "findings" ' +
        'and status="completed". Findings should include design decisions, open ' +
        'risks, pilot scope, dissent, and unresolved assumptions.',
      preventsFailureModes: [2, 6],
    },
    {
      id: 'cxo-interview-complete',
      label: 'CXO interview completed',
      severity: 'soft',
      evaluationHint:
        'program_modules row with module_key="cxo_interview" and status="completed". ' +
        'The interview should confirm sponsor appetite for the pilot, success ' +
        'thresholds, and the consequence of failing them.',
      preventsFailureModes: [1, 5],
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'what-from-p2-is-binding',
        text:
          'Which parts of the P2 recommendation are binding for this design, and ' +
          'which assumptions are still allowed to move?',
        why:
          'P3 fails when teams reopen P2 under the label of design discovery. This ' +
          'question separates accepted direction from assumptions that design must validate.',
        expectedAnswerShape:
          'A short list: binding target-state path, architecture posture, baseline ' +
          'source, scope boundary; open assumptions with owners and dates.',
        preventsFailureModes: [2, 7],
      },
      {
        id: 'who-builds-operates-approves',
        text:
          'For each major component, who builds it, who operates it after pilot, ' +
          'and who has approval authority if the design changes?',
        why:
          'A design without ownership becomes a P4 handoff problem. P4 needs ' +
          'operators and approvers, not just boxes on a diagram.',
        expectedAnswerShape:
          'Component-by-component ownership table with builder, run owner, approver, ' +
          'and escalation path for design changes.',
        preventsFailureModes: [4, 5],
      },
      {
        id: 'pilot-cohort-why-this-one',
        text:
          'Why is this the right pilot cohort, and what would make the result ' +
          'unrepresentative of broader rollout?',
        why:
          'Pilot cohorts are often selected for convenience. P4 evidence is only ' +
          'useful if Nexus knows what the cohort proves and what it cannot prove.',
        expectedAnswerShape:
          'Named cohort, inclusion/exclusion criteria, generalisation risks, and ' +
          'whether a control or comparison cohort is needed.',
        preventsFailureModes: [8, 9],
      },
      {
        id: 'baseline-to-measurement-lineage',
        text:
          'How does each success criterion trace back to the P2 baseline KPI, ' +
          'source system, and measurement method?',
        why:
          'Prevents the pilot from measuring convenient telemetry instead of the ' +
          'value case the sponsor signed.',
        preventsFailureModes: [3, 9],
      },
    ],
    converge: [
      {
        id: 'design-tradeoff-frozen',
        text:
          'What design trade-off are we freezing now, and what evidence would ' +
          'force us to reopen it during Execution Roadmap?',
        why:
          'P4 needs decision stability, but not denial. Naming the reopen ' +
          'condition prevents every disagreement from becoming scope churn.',
        expectedAnswerShape:
          'A frozen decision, its rationale, and a measurable reopen trigger such ' +
          'as integration latency, data quality, security finding, or adoption signal.',
        preventsFailureModes: [6, 7],
      },
      {
        id: 'dissenter-objection',
        text:
          'What did the named dissenter object to in the design, and what did we ' +
          'change or explicitly refuse to change?',
        why:
          'Avoiding dissent in P3 turns it into sabotage or passive non-adoption ' +
          'in P4/P5. The objection must be captured while design can still respond.',
        preventsFailureModes: [1, 5],
      },
      {
        id: 'pilot-stop-rule',
        text:
          'If the pilot is failing by week two, what signal proves it, and who ' +
          'has authority to stop or re-baseline?',
        why:
          'The P2 kill criterion has to become an operational stop rule before ' +
          'Execution Roadmap starts, otherwise schedule pressure will reinterpret failure as learning.',
        expectedAnswerShape:
          'Signal, threshold, data source, owner, and decision forum. Vague ' +
          'language like "we will review progress" is not enough.',
        preventsFailureModes: [8, 10],
      },
      {
        id: 'security-data-operating-gaps',
        text:
          'Which security, data, or operating-model gap is still open, and why is ' +
          'it safe to enter Execution Roadmap with it open?',
        why:
          'Soft gate does not mean no risk. If a gap remains, the user must name ' +
          'the containment plan rather than bury it in Execution Roadmap assumptions.',
        preventsFailureModes: [5, 6],
      },
    ],
    close: [
      {
        id: 'build-start-without-clarification',
        text:
          'Can the roadmap team start tomorrow without asking what to build, who to ' +
          'pilot with, or what counts as pass/fail?',
        why:
          'This is the practical P3 exit test. If any of those answers require a ' +
          'new meeting, the Execution Roadmap gate package is incomplete.',
        preventsFailureModes: [5, 8],
      },
      {
        id: 'cxo-commitment-to-consequence',
        text:
          'Has the CXO sponsor accepted the consequence of both pilot success and ' +
          'pilot failure?',
        why:
          'Sponsors often approve pilots while avoiding the hard decision that ' +
          'follows. P4 needs permission to scale, kill, or re-baseline based on evidence.',
        expectedAnswerShape:
          'Sponsor-attested consequence: scale path if pass; kill, remediate, or ' +
          're-baseline path if fail.',
        preventsFailureModes: [1, 5],
      },
      {
        id: 'findings-package-complete',
        text:
          'Do the Phase 3 findings name the decisions made, risks accepted, ' +
          'assumptions still open, and owners for each?',
        why:
          'The governance gate only checks that findings exist. Nexus should check ' +
          'whether they are useful enough for P4 to operate from.',
        preventsFailureModes: [2, 6],
      },
    ],
  },

  antiPatterns: [
    {
      id: 'p2-reopened-by-stealth',
      label: 'The Stealth Re-Synthesis',
      detectionHint:
        'Design conversations repeatedly revisit vendor choice, target-state path, ' +
        'architecture posture, or value hypothesis without a new decision record.',
      whatToFlag:
        'Tell the user P3 is being used to reopen P2. That may be necessary, but ' +
        'it is not free: the sponsor and architecture function must explicitly ' +
        'approve the change before execution-roadmap planning continues.',
      mitigation:
        'Create a dated design decision record with the changed assumption, why P2 ' +
        'was invalidated, sponsor/architecture approval, and impact to scope, KPI, ' +
        'and pilot timing.',
      preventsFailureModes: [1, 2],
    },
    {
      id: 'diagram-without-owners',
      label: 'The Ownerless Architecture',
      detectionHint:
        'Architecture diagram has systems and arrows but no named interface owner, ' +
        'run owner, data owner, security reviewer, or escalation path.',
      whatToFlag:
        'Surface that the design is not roadmap-ready. P4 will spend planning time finding ' +
        'owners instead of building the execution roadmap.',
      mitigation:
        'Force every component and integration to name builder, operator, approver, ' +
        'data steward, and incident owner before the execution roadmap is approved.',
      preventsFailureModes: [4, 5],
    },
    {
      id: 'convenience-pilot',
      label: 'The Convenience Pilot',
      detectionHint:
        'Pilot cohort is selected because the team is friendly, easy to schedule, ' +
        'already high-performing, or already using the tool; no exclusion logic or ' +
        'generalisation risk is stated.',
      whatToFlag:
        'Warn that P4 may plan around the easiest population, not the target ' +
        'population. That creates false confidence before approval and mobilization.',
      mitigation:
        'Require cohort rationale, matched control or comparison where relevant, ' +
        'and explicit limits on what the pilot result can generalise to.',
      preventsFailureModes: [8, 9],
    },
    {
      id: 'criteria-after-build-start',
      label: 'The Moving Finish Line',
      detectionHint:
        'Success metrics are described directionally, thresholds are missing, or ' +
        'the team says criteria will be finalized once pilot data starts coming in.',
      whatToFlag:
        'Tell the user the pilot will become subjective. If criteria move during ' +
        'P4, every stakeholder can reinterpret the same result to fit their politics.',
      mitigation:
        'Lock numeric thresholds, measurement source, comparison method, and pass/fail ' +
        'decision rule in the design package before roadmap planning starts.',
      preventsFailureModes: [8, 9],
    },
    {
      id: 'ignored-dissenter',
      label: 'The Quiet Dissenter',
      detectionHint:
        'P2 named a dissenter, but P3 notes, workshops, or findings never mention ' +
        'them; or the team says they are "not needed until rollout".',
      whatToFlag:
        'Surface that dissent has been deferred, not resolved. The person who loses ' +
        'from the change will usually wait until roadmap funding threatens their position.',
      mitigation:
        'Put the dissenter in the design review or record their objection and the ' +
        'sponsor decision that accepts or rejects it.',
      preventsFailureModes: [1, 5],
    },
    {
      id: 'pilot-as-production-shortcut',
      label: 'The Production Shortcut',
      detectionHint:
        'Pilot plan uses production users or customer data while security, consent, ' +
        'data residency, access model, or support ownership is still unnamed or unresolved.',
      whatToFlag:
        'Tell the user they are using pilot language to bypass production discipline. ' +
        'A pilot can be small, but it cannot be uncontrolled.',
      mitigation:
        'Constrain the cohort, document consent/access boundaries, obtain security ' +
        'and privacy review, and name support ownership before launch.',
      preventsFailureModes: [6, 8],
    },
  ],

  coachingArc: {
    entry:
      'First verify the human-validated P2 solution route is tied to approved evidence. ' +
      'If it is missing or stale, return to P2 rather than assuming a full redesign. ' +
      'Carry forward the recommended path, architecture sketch, baseline source, ' +
      'sponsor commitment, scope boundary, kill criterion, and dissenter.',
    midPhase:
      'Right-size detail to the validated route. Ask only for architecture, process, ' +
      'ownership, controls, and validation details that materially affect the P4 ' +
      'estimate. Record internal/vendor/hybrid assumptions and P2 evidence lineage.',
    exit:
      'Confirm human review, evidence citations, route-appropriate design depth, ' +
      'adoption ownership, and explicit sizing assumptions. Carry unresolved ' +
      'questions into P4; do not fill gaps with a full solution design or pretend ' +
      'execution has begun.',
  },

  dependencies: {
    requiresFromPrior: [
      'P2 Synthesis: recommended target-state path with stated trade-offs - P3 designs against this, not around it',
      'P2 Synthesis: architecture sketch and human-validated solution route - P3 expands only to estimate-ready detail',
      'P2 Synthesis: baseline KPI with source and method - P3 carries estimate-relevant validation criteria forward',
      'P2 Synthesis: sponsor commitment, decision cadence, and succession owner - P3/P4 use these for design and roadmap decisions',
      'P2 Synthesis: scope boundary - P3 keeps estimate-ready design inside it unless sponsor approves a change',
      'P2 Synthesis: kill criterion - P3 turns it into a roadmap stop/re-baseline rule',
      'P2 Synthesis: named dissenter - P3 must engage, record, or explicitly escalate their objection',
    ],
    producesForNext: [
      'Human-reviewed, route-appropriate estimate-ready design and traceability',
      'Validation scope and success criteria when applicable to the approved route',
      'Phase 3 findings with accepted risks, open assumptions, and decisions',
      'Sponsor decisions and kill/re-baseline conditions carried forward',
      'Adoption/operating ownership and internal/vendor/hybrid sizing assumptions for P4',
    ],
  },

  // -- Step decomposition - OV2-5-P3 (design doc D.3.4) --------------------
  //
  // 9 canonical P3 steps. The DAG roots at the P2 handoff-ingest, then forks
  // into two parallel substantive workstreams - architecture expansion and
  // (when in scope) vendor selection - both of which feed the detailed design
  // composition. The detailed design draft is the central intermediate
  // artifact: pilot-cohort design, the CXO interview, and the second
  // dissenter engagement all consume it. The findings package ingests every
  // substantive output, and design sign-off is the terminal node ingesting
  // the design draft, vendor selection, pilot cohort, criteria, sponsor
  // commitment, and dissenter engagement.
  //
  // Two intermediate artifacts referenced by `inputs` only (no DoD id, no
  // step `outputs` entry per slice rule):
  //   - `p3-detailed-design-draft`: produced by `p3-detailed-design`,
  //     consumed by pilot-cohort design, CXO interview, dissenter
  //     engagement, findings package, and sign-off.
  //   - `p3-vendor-selection-complete`: produced by `p3-vendor-selection`
  //     when sourcing is in scope, consumed by sign-off; the vendor BAFO
  //     event lives in /source, not in `definitionOfDone`.
  //
  // StepComplexity admits only 'simple' | 'complex'. The design doc D.3.4
  // labels listed in the task spec are encoded as 'complex' when off-platform
  // multi-stakeholder work is required (architecture expansion, vendor
  // selection workshops, pilot-cohort design workshop, CXO 1:1, dissenter
  // 1:1, detailed-design composition spanning ARB/security/data/privacy
  // iteration) and as 'simple' when the work is chat-resolvable (handoff
  // ingest, findings package authoring, gate sign-off request).
  //
  // agentRole is single-valued. For the design sign-off the dominant role
  // is `request_approval`; for workshops `coach_workshop`; for 1:1s
  // `coach_interview`; for artifact composition `compose_artifact`; for
  // the P2 carry-forward read `extract`.
  //
  // postMeetingUploadExpected is true for the five steps that involve
  // off-platform meetings (architecture expansion, vendor selection, pilot
  // cohort design, CXO interview, dissenter engagement). The complex
  // `p3-detailed-design` step is artifact composition with iterative review
  // rather than a single uploadable meeting, so it does NOT carry the
  // post-meeting upload flag. Simple steps and `compose_artifact` /
  // `request_approval` / `extract` steps are upload-false by rule.
  steps: [
    // Continuity step. Tagged [1, 2] because the P2 carry-forward keeps
    // sponsor commitment (#1) and problem definition (#2) intact across the
    // gate; without ingesting the carry-forward record, P3 silently
    // re-litigates target-state and dilutes both. Mirrors the underlying DoD
    // item `p2-target-state-path-carried-forward` (also tagged [1, 2]).
    {
      id: 'p3-handoff-ingest',
      label: 'Confirm P2 charter + architecture attestation carried forward',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: [],
      outputs: ['p2-target-state-path-carried-forward'],
      templateRefs: [],
      preventsFailureModes: [1, 2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Architecture / Security / Data / Privacy expansion workshop. One of
    // the two parallel substantive roots. Tagged [6] - this is where late
    // attention to governance/privacy/risk gets pre-empted.
    {
      id: 'p3-architecture-expansion',
      label:
        'Architecture expansion workshop with ARB + Security + Data + Privacy',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p2-target-state-path-carried-forward'],
      outputs: ['architecture-sketch-expanded'],
      templateRefs: [],
      preventsFailureModes: [6],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Detailed design composition. Encoded as `complex` because the spec
    // requires iterative work with ARB / security / data / privacy /
    // operating owners to produce a buildable spec - not a single-pass
    // authoring turn. agentRole is `compose_artifact` (dominant: the
    // artifact is the design spec). Output is intermediate
    // (`p3-detailed-design-draft`); the *signed* spec is produced
    // downstream by `p3-design-signoff`. Tagged [5, 6] because the design
    // commits the operating-model change (#5) and absorbs the
    // governance/privacy/risk controls surfaced by the architecture
    // expansion (#6).
    //
    // postMeetingUploadExpected is false: composition is iterative artifact
    // work, not a single uploadable meeting. The intent-capture flag
    // remains true per the slice rule for all complex steps.
    {
      id: 'p3-detailed-design',
      label: 'Compose the detailed design specification',
      complexity: 'complex',
      agentRole: 'compose_artifact',
      inputs: [
        'p2-target-state-path-carried-forward',
        'architecture-sketch-expanded',
      ],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [5, 6],
      intentCaptureRequired: true,
      postMeetingUploadExpected: false,
    },
    // Vendor selection. The second parallel substantive root; runs when
    // sourcing is in scope. Output is intermediate
    // (`p3-vendor-selection-complete`); the formal sourcing handoff is
    // closed by the vendor BAFO event in /source, not by a P3 DoD id.
    // Tagged [7] for build-vs-buy / vendor-selection failure mode.
    {
      id: 'p3-vendor-selection',
      label: 'Vendor selection (handoff to /source if vendor in scope)',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p2-target-state-path-carried-forward'],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [7],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Pilot cohort + success criteria + stop rule, run as a single design
    // workshop. Outputs span two DoD ids - `pilot-cohort-named` (cohort
    // with inclusion/exclusion) and `success-criteria-locked` (numeric
    // thresholds against the P2 baseline). Tagged [8, 5]: pilot-to-prod
    // gap (#8) is the dominant prevention; operating-model change (#5)
    // because cohort selection encodes which workflow actually changes.
    {
      id: 'p3-pilot-cohort-design',
      label: 'Pilot cohort selection + success criteria + stop-rule',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: [
        'p2-target-state-path-carried-forward',
        'p3-detailed-design-draft',
      ],
      outputs: ['pilot-cohort-named', 'success-criteria-locked'],
      templateRefs: [],
      preventsFailureModes: [8, 5],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // CXO 1:1 - sponsor commits to the consequence of pilot pass and pilot
    // fail. Outputs span `cxo-interview-complete` (governance gate item)
    // and `sponsor-commitment-confirmed` (the substantive commitment).
    // Tagged [1] - sponsor commitment failure mode.
    {
      id: 'p3-cxo-interview',
      label: 'CXO 1:1 - sponsor commitment to consequence',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: [
        'p2-target-state-path-carried-forward',
        'p3-detailed-design-draft',
      ],
      outputs: ['cxo-interview-complete', 'sponsor-commitment-confirmed'],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Re-engage the P2 named dissenter against the now-detailed design.
    // Decision is logged regardless of outcome (resolved / accepted /
    // escalated). Tagged [2, 10] per the slice spec - dissent that gets
    // deferred surfaces as scope sprawl (#10) or reopened problem
    // definition (#2) in P4/P5.
    {
      id: 'p3-dissenter-engagement-2',
      label:
        'Re-engage P2 dissenter with detailed design; log decision regardless of outcome',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: [
        'p2-target-state-path-carried-forward',
        'p3-detailed-design-draft',
      ],
      outputs: ['named-dissenter-engaged'],
      templateRefs: [],
      preventsFailureModes: [2, 10],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Phase-3 findings package. Continuity / governance step; chat-
    // resolvable composition once the substantive work is in. Tagged
    // [2, 6] mirroring the underlying DoD `phase-3-findings-written`
    // tags - the package keeps the problem definition (#2) honest and
    // captures the governance/privacy/risk decisions (#6) for P4 audit.
    {
      id: 'p3-findings-package',
      label: 'Compose phase 3 findings package',
      complexity: 'simple',
      agentRole: 'compose_artifact',
      inputs: [
        'p3-detailed-design-draft',
        'architecture-sketch-expanded',
        'pilot-cohort-named',
        'success-criteria-locked',
        'cxo-interview-complete',
        'sponsor-commitment-confirmed',
        'named-dissenter-engaged',
        'p3-vendor-selection-complete',
      ],
      outputs: ['phase-3-findings-written'],
      templateRefs: [],
      preventsFailureModes: [2, 6],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Terminal gate node. Sponsor + ARB sign the design (and vendor
    // selection if applicable). Output is `detailed-design-signed-off`.
    // `vendor_selection_approved` is a gate-check rather than a DoD id, so
    // it is intentionally NOT listed in `outputs`; it is referenced via
    // `p3-vendor-selection-complete` in `inputs` for DAG legibility.
    // Tagged [1] per the slice spec - sponsor sign-off concretizes
    // failure mode #1.
    {
      id: 'p3-design-signoff',
      label:
        'Sponsor + ARB sign the design (and vendor selection if applicable)',
      complexity: 'simple',
      agentRole: 'request_approval',
      inputs: [
        'p3-detailed-design-draft',
        'architecture-sketch-expanded',
        'pilot-cohort-named',
        'success-criteria-locked',
        'sponsor-commitment-confirmed',
        'named-dissenter-engaged',
        'p3-vendor-selection-complete',
      ],
      outputs: ['detailed-design-signed-off'],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
  ],
};
