// P3 Design - Phase Intelligence Pack
//
// Phase semantics (from src/lib/programs/programs-fixture.ts PHASE_LABEL_MAP
// and src/lib/intelligence/program-lifecycle-patterns.ts P3-Design stage):
//
//   P3 Design turns the P2 recommendation into a buildable, measurable
//   pilot. It does not re-litigate the target-state path unless new evidence
//   invalidates P2. It extends the architecture sketch into detailed design,
//   names the pilot cohort, locks success criteria, and records the phase-3
//   findings and CXO interview needed for the P3->P4 gate.
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
// Exit output is the Build gate package: detailed design signed off, pilot
// cohort named, success criteria locked, phase-3 findings written, and CXO
// interview complete. A beautiful design without cohort and criteria is a
// diagram. A named pilot without signed design is an experiment looking for
// permission.
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
    'A Build gate package that converts the P2 recommendation into a buildable ' +
    'pilot: detailed solution and integration design signed off by the right ' +
    'architecture and operating owners; pilot cohort named with inclusion and ' +
    'exclusion logic; success criteria locked against the P2 baseline KPI and ' +
    'measurement source; phase-3 findings written; CXO interview completed; and ' +
    'scope, kill criterion, sponsor commitment, and named dissenter carried ' +
    'forward without being blurred. P3 is done when Build can start without ' +
    'asking what we are building, who we are piloting with, or what counts as a win.',

  definitionOfDone: [
    {
      id: 'p2-target-state-path-carried-forward',
      label: 'P2 recommended target-state path carried forward',
      severity: 'hard',
      evaluationHint:
        'Design package references the P2 synthesis recommendation and names the ' +
        'chosen target-state path. If the design silently changes direction, it ' +
        'must include a dated decision record from sponsor and architecture.',
    },
    {
      id: 'detailed-design-signed-off',
      label: 'Detailed design signed off by accountable owners',
      severity: 'hard',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="design_spec" or "design" ' +
        'and status="signed_off", plus named architecture, data, security, and ' +
        'business-operation reviewers in the design prose or approval metadata.',
    },
    {
      id: 'architecture-sketch-expanded',
      label: 'P2 architecture sketch expanded into build architecture',
      severity: 'hard',
      evaluationHint:
        'Design artifact shows integrations, data flows, system boundaries, owner ' +
        'for each interface, and explicit deltas from the P2 architecture sketch. ' +
        'A diagram without owner and interface detail is not build architecture.',
    },
    {
      id: 'pilot-cohort-named',
      label: 'Pilot cohort named with inclusion and exclusion logic',
      severity: 'hard',
      evaluationHint:
        'Build gate package names the pilot cohort as real teams, stores, intents, ' +
        'users, customers, or data domains, not a generic segment. It also states ' +
        'who is excluded and why, so P4 cannot cherry-pick success.',
    },
    {
      id: 'success-criteria-locked',
      label: 'Success criteria locked against baseline KPI and source',
      severity: 'hard',
      evaluationHint:
        'Pilot measurement plan names numeric thresholds, comparison method, ' +
        'baseline current value, baseline source, measurement owner, and decision ' +
        'rule for pass/fail. Criteria must be locked before P4 pilot start.',
    },
    {
      id: 'sponsor-commitment-confirmed',
      label: 'Sponsor commitment and decision cadence confirmed for Build',
      severity: 'hard',
      evaluationHint:
        'Design closeout records the sponsor cadence for P4, the decision forum, ' +
        'and the person with approval_authority="sponsor". If the sponsor is only ' +
        'represented by a delegate, the Build start is politically exposed.',
    },
    {
      id: 'scope-boundary-preserved',
      label: 'P2 scope boundary preserved in design and pilot scope',
      severity: 'hard',
      evaluationHint:
        'Design package includes in-scope/out-of-scope text and maps every design ' +
        'workstream to that boundary. New workstreams outside the charter require ' +
        'a sponsor-approved change record, not informal design expansion.',
    },
    {
      id: 'kill-criterion-operationalized',
      label: 'Kill criterion translated into pilot stop rule',
      severity: 'hard',
      evaluationHint:
        'Pilot plan states how the P2 kill criterion will be observed in P4, who ' +
        'can call it, and what data source triggers the stop/re-baseline decision.',
    },
    {
      id: 'named-dissenter-engaged',
      label: 'Named dissenter engaged or explicitly escalated',
      severity: 'soft',
      evaluationHint:
        'Phase-3 findings or stakeholder log includes the P2 named dissenter, ' +
        'their objection, and resolution/escalation status. Absence is a signal ' +
        'that political risk was deferred into Build.',
    },
    {
      id: 'phase-3-findings-written',
      label: 'Phase 3 findings written',
      severity: 'soft',
      evaluationHint:
        'program_modules row with module_key="phase_3_findings" or "findings" ' +
        'and status="completed". Findings should include design decisions, open ' +
        'risks, pilot scope, dissent, and unresolved assumptions.',
    },
    {
      id: 'cxo-interview-complete',
      label: 'CXO interview completed',
      severity: 'soft',
      evaluationHint:
        'program_modules row with module_key="cxo_interview" and status="completed". ' +
        'The interview should confirm sponsor appetite for the pilot, success ' +
        'thresholds, and the consequence of failing them.',
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
      },
      {
        id: 'who-builds-operates-approves',
        text:
          'For each major component, who builds it, who operates it after pilot, ' +
          'and who has approval authority if the design changes?',
        why:
          'A design without ownership becomes a P4 handoff problem. Build needs ' +
          'operators and approvers, not just boxes on a diagram.',
        expectedAnswerShape:
          'Component-by-component ownership table with builder, run owner, approver, ' +
          'and escalation path for design changes.',
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
      },
      {
        id: 'baseline-to-measurement-lineage',
        text:
          'How does each success criterion trace back to the P2 baseline KPI, ' +
          'source system, and measurement method?',
        why:
          'Prevents the pilot from measuring convenient telemetry instead of the ' +
          'value case the sponsor signed.',
      },
    ],
    converge: [
      {
        id: 'design-tradeoff-frozen',
        text:
          'What design trade-off are we freezing now, and what evidence would ' +
          'force us to reopen it during Build?',
        why:
          'Build needs decision stability, but not denial. Naming the reopen ' +
          'condition prevents every disagreement from becoming scope churn.',
        expectedAnswerShape:
          'A frozen decision, its rationale, and a measurable reopen trigger such ' +
          'as integration latency, data quality, security finding, or adoption signal.',
      },
      {
        id: 'dissenter-objection',
        text:
          'What did the named dissenter object to in the design, and what did we ' +
          'change or explicitly refuse to change?',
        why:
          'Avoiding dissent in P3 turns it into sabotage or passive non-adoption ' +
          'in P4/P5. The objection must be captured while design can still respond.',
      },
      {
        id: 'pilot-stop-rule',
        text:
          'If the pilot is failing by week two, what signal proves it, and who ' +
          'has authority to stop or re-baseline?',
        why:
          'The P2 kill criterion has to become an operational stop rule before ' +
          'Build starts, otherwise schedule pressure will reinterpret failure as learning.',
        expectedAnswerShape:
          'Signal, threshold, data source, owner, and decision forum. Vague ' +
          'language like "we will review progress" is not enough.',
      },
      {
        id: 'security-data-operating-gaps',
        text:
          'Which security, data, or operating-model gap is still open, and why is ' +
          'it safe to enter Build with it open?',
        why:
          'Soft gate does not mean no risk. If a gap remains, the user must name ' +
          'the containment plan rather than bury it in Build assumptions.',
      },
    ],
    close: [
      {
        id: 'build-start-without-clarification',
        text:
          'Can the Build team start tomorrow without asking what to build, who to ' +
          'pilot with, or what counts as pass/fail?',
        why:
          'This is the practical P3 exit test. If any of those answers require a ' +
          'new meeting, the Build gate package is incomplete.',
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
      },
      {
        id: 'findings-package-complete',
        text:
          'Do the Phase 3 findings name the decisions made, risks accepted, ' +
          'assumptions still open, and owners for each?',
        why:
          'The governance gate only checks that findings exist. Nexus should check ' +
          'whether they are useful enough for P4 to operate from.',
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
        'approve the change before Build planning continues.',
      mitigation:
        'Create a dated design decision record with the changed assumption, why P2 ' +
        'was invalidated, sponsor/architecture approval, and impact to scope, KPI, ' +
        'and pilot timing.',
    },
    {
      id: 'diagram-without-owners',
      label: 'The Ownerless Architecture',
      detectionHint:
        'Architecture diagram has systems and arrows but no named interface owner, ' +
        'run owner, data owner, security reviewer, or escalation path.',
      whatToFlag:
        'Surface that the design is not buildable. P4 will spend pilot time finding ' +
        'owners instead of testing the capability.',
      mitigation:
        'Force every component and integration to name builder, operator, approver, ' +
        'data steward, and incident owner before Build starts.',
    },
    {
      id: 'convenience-pilot',
      label: 'The Convenience Pilot',
      detectionHint:
        'Pilot cohort is selected because the team is friendly, easy to schedule, ' +
        'already high-performing, or already using the tool; no exclusion logic or ' +
        'generalisation risk is stated.',
      whatToFlag:
        'Warn that P4 may prove adoption in the easiest population, not the target ' +
        'population. That creates false confidence before Activate.',
      mitigation:
        'Require cohort rationale, matched control or comparison where relevant, ' +
        'and explicit limits on what the pilot result can generalise to.',
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
        'decision rule in the Build gate package before pilot launch.',
    },
    {
      id: 'ignored-dissenter',
      label: 'The Quiet Dissenter',
      detectionHint:
        'P2 named a dissenter, but P3 notes, workshops, or findings never mention ' +
        'them; or the team says they are "not needed until rollout".',
      whatToFlag:
        'Surface that dissent has been deferred, not resolved. The person who loses ' +
        'from the change will usually wait until Build evidence threatens their position.',
      mitigation:
        'Put the dissenter in the design review or record their objection and the ' +
        'sponsor decision that accepts or rejects it.',
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
    },
  ],

  coachingArc: {
    entry:
      'Start by pinning P2 as the contract: recommended path, architecture sketch, ' +
      'baseline source, sponsor commitment, scope boundary, kill criterion, and ' +
      'dissenter. Do not let the conversation drift into solution brainstorming ' +
      'until those inherited constraints are visible.',
    midPhase:
      'Drive from diagram to buildability. Ask owner-by-owner, interface-by-interface, ' +
      'cohort-by-cohort questions. Force success criteria to become numeric and ' +
      'traceable to the P2 baseline. Surface dissent and operating-model gaps while ' +
      'the design can still absorb them.',
    exit:
      'Switch to gate-locking posture. Verify findings and CXO interview, but do ' +
      'not confuse governance completion with readiness. Refuse to call P3 done if ' +
      'Build would still need clarification on design, cohort, success criteria, ' +
      'or stop rules.',
  },

  dependencies: {
    requiresFromPrior: [
      'P2 Synthesis: recommended target-state path with stated trade-offs - P3 designs against this, not around it',
      'P2 Synthesis: architecture sketch with named reviewer - P3 expands it into build architecture',
      'P2 Synthesis: baseline KPI with current value, source, and measurement method - P3 locks pilot criteria against it',
      'P2 Synthesis: sponsor commitment, decision cadence, and succession owner - P3/P4 use these for design and pilot decisions',
      'P2 Synthesis: scope boundary - P3 keeps investigation and pilot design inside it unless sponsor approves change',
      'P2 Synthesis: kill criterion - P3 turns it into a pilot stop/re-baseline rule',
      'P2 Synthesis: named dissenter - P3 must engage, record, or explicitly escalate their objection',
    ],
    producesForNext: [
      'Detailed design signed off - P4 builds the pilot from this design rather than inventing during execution',
      'Pilot cohort named with inclusion/exclusion logic - P4 executes against the named cohort and records generalisation limits',
      'Success criteria locked against baseline KPI/source/method - P4 reports pass/fail without moving the finish line',
      'Phase 3 findings written - P4 inherits accepted risks, open assumptions, and design decisions',
      'CXO interview complete - P4 has sponsor acceptance of success, failure, and kill/re-baseline consequences',
      'Operating ownership and support assumptions - P4 tests whether the design can be operated, not just configured',
    ],
  },
};
