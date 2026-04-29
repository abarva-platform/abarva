// P4 Build - Phase Intelligence Pack
//
// Phase semantics (from src/lib/programs/programs-fixture.ts PHASE_LABEL_MAP
// and src/lib/intelligence/program-lifecycle-patterns.ts P4-Build stage):
//
//   P4 Build stands up the pilot environment, executes the named pilot, and
//   measures outcomes against criteria locked in P3. It is the evidence phase,
//   not a second design phase and not a quiet rollout. Teams may iterate on
//   defects and implementation findings, but they may not expand cohort,
//   weaken thresholds, or reinterpret the baseline without sponsor-visible
//   re-baseline.
//
// Inputs inherited from P3 are binding:
//   - detailed design signed off
//   - pilot cohort named
//   - success criteria locked
//   - phase-3 findings and CXO sponsor interview
//   - operating ownership assumptions and stop/re-baseline rule
//
// Exit output is the Activate gate package: pilot outcome pass/fail vs locked
// criteria, operating model ready for scale, rollout plan for P5, sponsor design
// approval, vendor selection approval if applicable, and execution plan drafted.
// A pilot result without an operating model is a demo. An operating model
// without pilot evidence is theatre.
//
// Gate checks (mirrors GATE_RULES P4->P5 in src/lib/programs/governance.ts):
//   - design_approved - hard
//   - vendor_selection_approved - soft
//   - execution_plan_drafted - soft
//
// This pack keeps Nexus focused on evidence integrity: pass, fail, kill, or
// re-baseline must be explicit before Activate begins.

import type { PhasePack } from './types';

export const P4_BUILD: PhasePack = {
  phase: 4,
  label: 'P4 Build',
  outcome:
    'An Activate gate package that proves what happened in the pilot against ' +
    'the P3-locked criteria: pass/fail result with baseline comparison, defects ' +
    'and incidents adjudicated, design approved by the sponsor, vendor selection ' +
    'approved if applicable, execution plan drafted, operating model named, and ' +
    'rollout plan for P5 sequenced with owners, support capacity, change readiness, ' +
    'and stop/re-baseline consequences. P4 is done when the sponsor can decide ' +
    'whether to scale, kill, or re-baseline from evidence rather than enthusiasm.',

  definitionOfDone: [
    {
      id: 'detailed-design-available',
      label: 'Detailed design from P3 available to Build team',
      severity: 'hard',
      evaluationHint:
        'Build artifacts reference the signed P3 design_spec/design deliverable and ' +
        'record any implementation delta as a decision record. If Build cannot point ' +
        'to the design it used, the pilot evidence is not traceable.',
    },
    {
      id: 'pilot-cohort-executed-as-named',
      label: 'Pilot executed against the named P3 cohort',
      severity: 'hard',
      evaluationHint:
        'Pilot results report names the same cohort locked in P3, records any ' +
        'dropouts or additions, and explains whether cohort changes affect ' +
        'generalisation. Silent cohort substitution invalidates the pilot.',
    },
    {
      id: 'pilot-outcome-pass-fail',
      label: 'Pilot outcome stated as pass/fail vs locked criteria',
      severity: 'hard',
      evaluationHint:
        'Pilot report compares actual results to each P3 success threshold using ' +
        'the baseline source and measurement method. The report must explicitly ' +
        'say pass, fail, partial pass with sponsor re-baseline, or kill.',
    },
    {
      id: 'baseline-comparison-preserved',
      label: 'Baseline comparison uses the P2/P3 source and method',
      severity: 'hard',
      evaluationHint:
        'Outcome tables cite current value, target, actual pilot value, measurement ' +
        'window, source system/report, and method. Replacing the baseline source ' +
        'during P4 requires sponsor-visible re-baseline.',
    },
    {
      id: 'design-approved',
      label: 'Design approved by sponsor',
      severity: 'hard',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="design_spec" or "design" ' +
        'and status="signed_off". The signer should map to a sponsor-level ' +
        'approval authority, not only a technical reviewer.',
    },
    {
      id: 'operating-model-ready',
      label: 'Operating model ready for scaled activation',
      severity: 'hard',
      evaluationHint:
        'Activate package names process owner, run owner, support owner, data owner, ' +
        'security/privacy owner where relevant, cadence, escalation path, training ' +
        'or enablement owner, and steady-state measurement owner.',
    },
    {
      id: 'rollout-plan-for-p5',
      label: 'Rollout plan for P5 sequenced and owner-backed',
      severity: 'hard',
      evaluationHint:
        'Execution or rollout plan names waves, populations, dates/windows, entry ' +
        'criteria per wave, rollback criteria, change-management actions, support ' +
        'capacity, and accountable owner for each wave.',
    },
    {
      id: 'kill-or-rebaseline-decision-recorded',
      label: 'Kill, scale, or re-baseline decision recorded',
      severity: 'hard',
      evaluationHint:
        'Activate gate package contains a sponsor-visible decision record tying ' +
        'pilot result to action: scale, kill, remediate and repeat, or re-baseline ' +
        'with named scope and KPI changes.',
    },
    {
      id: 'vendor-selection-approved',
      label: 'Vendor selection approved if applicable',
      severity: 'soft',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="vendor_selection" is absent ' +
        'or has status="signed_off". If a vendor remains provisional, Nexus should ' +
        'flag activation risk even though the governance check is soft.',
    },
    {
      id: 'execution-plan-drafted',
      label: 'Execution plan drafted',
      severity: 'soft',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="execution_plan" exists. ' +
        'The draft should include rollout waves, owner map, support model, comms, ' +
        'training, risks, and measurement cadence.',
    },
    {
      id: 'pilot-incidents-adjudicated',
      label: 'Pilot defects, incidents, and regressions adjudicated',
      severity: 'soft',
      evaluationHint:
        'Pilot report includes defect log, security/privacy incidents if relevant, ' +
        'quality regressions, owner, severity, remediation status, and whether each ' +
        'blocks Activate. Empty incident logs should be explained, not assumed.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'are-we-building-the-signed-design',
        text:
          'Are we building the signed P3 design exactly, or has Build already ' +
          'changed scope, cohort, architecture, or criteria?',
        why:
          'P4 evidence only means something if it traces to the approved design. ' +
          'Unrecorded changes make the pilot impossible to interpret.',
        expectedAnswerShape:
          'No change, or a list of deltas with decision record, sponsor visibility, ' +
          'and impact on criteria/baseline/cohort.',
      },
      {
        id: 'what-is-the-pilot-calendar',
        text:
          'What is the pilot calendar, and which measurement windows count for ' +
          'the pass/fail decision?',
        why:
          'Build teams often report early anecdotes as outcomes. Nexus needs the ' +
          'official measurement window before interpreting signals.',
        expectedAnswerShape:
          'Pilot start/end, ramp period, excluded dates, official measurement window, ' +
          'and reporting date.',
      },
      {
        id: 'who-owns-run-during-pilot',
        text:
          'Who owns run operations during the pilot, and is that the same team ' +
          'expected to own it in P5?',
        why:
          'A pilot operated by heroes or vendors does not prove the operating model. ' +
          'The Activate decision needs to know who can run the capability at scale.',
      },
      {
        id: 'what-would-force-kill',
        text:
          'Which pilot signal would force a kill or re-baseline instead of another ' +
          'round of fixes?',
        why:
          'Reinforces the P2/P3 kill criterion before sunk-cost pressure arrives. ' +
          'The answer gives Nexus permission to challenge zombie pilots.',
      },
    ],
    converge: [
      {
        id: 'actuals-vs-criteria',
        text:
          'Against each locked success criterion, what was the baseline, target, ' +
          'actual result, source, and pass/fail interpretation?',
        why:
          'This is the core P4 evidence. If the team cannot answer criterion by ' +
          'criterion, they are substituting narrative for measurement.',
        expectedAnswerShape:
          'A table-like answer: criterion, baseline, target, actual, source/method, ' +
          'pass/fail, confidence, and notes.',
      },
      {
        id: 'defects-that-change-decision',
        text:
          'Which defect, incident, adoption gap, or quality regression changes the ' +
          'Activate decision even if the headline KPI looks good?',
        why:
          'Pilots can hit the headline metric while creating unacceptable risk. ' +
          'Nexus should force the downside evidence into the same decision package.',
      },
      {
        id: 'can-operators-run-this',
        text:
          'Could the named operating team run this without the Build team in the ' +
          'room, and what evidence proves that?',
        why:
          'Activate fails when the pilot depends on implementation-team heroics. ' +
          'Operating model proof is as important as technical proof.',
        expectedAnswerShape:
          'Runbook rehearsal, support tickets, training completion, handoff acceptance, ' +
          'or named gaps with remediation date.',
      },
      {
        id: 'rollout-rate-vs-capacity',
        text:
          'What rollout rate can support, training, data, and change teams actually ' +
          'absorb in P5?',
        why:
          'P5 plans usually fail by moving faster than the operating system can ' +
          'absorb. The rollout plan has to match capacity, not ambition.',
      },
    ],
    close: [
      {
        id: 'sponsor-decision-from-evidence',
        text:
          'What exact decision is the sponsor being asked to make from the pilot ' +
          'evidence: scale, kill, remediate and repeat, or re-baseline?',
        why:
          'P4 must end in a decision, not a progress update. Ambiguous asks let ' +
          'stakeholders claim agreement while avoiding consequence.',
        expectedAnswerShape:
          'One decision option, rationale tied to pass/fail evidence, and named ' +
          'conditions if re-baseline or repeat is chosen.',
      },
      {
        id: 'p5-first-wave-ready',
        text:
          'If Activate starts next week, who is in wave one, what must be true ' +
          'before they start, and who supports them on day one?',
        why:
          'Tests whether the rollout plan is operational or merely sequenced. P5 ' +
          'needs wave readiness, not a roadmap slide.',
      },
      {
        id: 'what-is-not-proven',
        text:
          'What did the pilot not prove, and how will the P5 rollout contain that ' +
          'uncertainty?',
        why:
          'Every pilot has limits. Naming them prevents over-generalising success ' +
          'and helps P5 design guardrails around the unknowns.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'moving-finish-line',
      label: 'The Moving Finish Line',
      detectionHint:
        'Pilot thresholds, measurement windows, baseline source, or cohort are ' +
        'changed during P4 without sponsor-visible re-baseline.',
      whatToFlag:
        'Tell the user the pilot evidence is being weakened. If criteria move ' +
        'after the fact, the Activate decision becomes political rather than empirical.',
      mitigation:
        'Freeze original criteria in the report, record the proposed re-baseline ' +
        'separately, and require sponsor decision on whether to judge against old ' +
        'or new thresholds.',
    },
    {
      id: 'demo-mistaken-for-pilot',
      label: 'The Demo Pilot',
      detectionHint:
        'Build shows a working environment, happy-path demo, or selected anecdotes ' +
        'but lacks cohort usage, baseline comparison, defect log, or measurement window.',
      whatToFlag:
        'Surface that the team has demonstrated capability, not proven pilot outcome. ' +
        'A demo cannot justify Activate.',
      mitigation:
        'Run the named cohort through the locked measurement window and report ' +
        'actuals vs criteria, including defects and non-use.',
    },
    {
      id: 'hero-operated-pilot',
      label: 'The Hero-Operated Pilot',
      detectionHint:
        'Pilot succeeds only because vendor specialists, implementation leads, or ' +
        'a single internal expert manually intervene; run ownership is not transferred.',
      whatToFlag:
        'Warn that the pilot may not scale. P5 will expose the missing operating ' +
        'model when hero support disappears.',
      mitigation:
        'Require runbook rehearsal, named operating owner, support model, training, ' +
        'and evidence the steady-state team can execute the process.',
    },
    {
      id: 'partial-pass-spin',
      label: 'The Partial-Pass Spin',
      detectionHint:
        'Pilot hits one visible metric but misses adoption, quality, cost, security, ' +
        'or satisfaction criteria; narrative emphasizes the pass and buries the miss.',
      whatToFlag:
        'Tell the user the result is a partial pass or fail, not a pass. The ' +
        'Activate decision must account for the failed criterion explicitly.',
      mitigation:
        'Present criterion-by-criterion outcome and force sponsor decision: accept ' +
        'risk, remediate and repeat, re-baseline, or kill.',
    },
    {
      id: 'rollout-plan-as-calendar',
      label: 'The Calendar Rollout',
      detectionHint:
        'P5 plan lists dates and waves but does not include entry criteria, support ' +
        'capacity, rollback triggers, training readiness, or accountable owners.',
      whatToFlag:
        'Surface that the rollout is a calendar, not an execution plan. P5 will ' +
        'create adoption debt if waves move without readiness checks.',
      mitigation:
        'Add wave entry criteria, support and training capacity, rollback rules, ' +
        'change-owner per population, and measurement cadence.',
    },
    {
      id: 'vendor-provisional-scale',
      label: 'The Provisional Vendor Scale-Up',
      detectionHint:
        'Activate planning assumes a vendor, platform, licence, or sourcing decision ' +
        'that remains unsigned or marked provisional.',
      whatToFlag:
        'Warn that P5 is being planned on an unstable commercial foundation. Soft ' +
        'gate does not mean no consequence.',
      mitigation:
        'Separate technical pilot result from commercial readiness, obtain vendor ' +
        'selection sign-off, or constrain P5 wave one to what the approved contract supports.',
    },
    {
      id: 'failure-renamed-learning',
      label: 'The Learning Loop Escape Hatch',
      detectionHint:
        'Pilot misses locked criteria but the team proposes to proceed because of ' +
        'learnings, momentum, stakeholder excitement, or roadmap pressure.',
      whatToFlag:
        'Tell the user that learning is valuable, but it is not the same as meeting ' +
        'the success criteria. A miss requires kill, repeat, or sponsor-approved re-baseline.',
      mitigation:
        'Document the miss, identify root cause, and force the explicit decision: ' +
        'kill, remediate and repeat pilot, or re-baseline with changed scope and economics.',
    },
  ],

  coachingArc: {
    entry:
      'Enter as an evidence custodian. Pin the signed design, named cohort, locked ' +
      'criteria, baseline source, and measurement window before discussing pilot ' +
      'progress. Treat scope changes as decision records, not casual implementation notes.',
    midPhase:
      'Interrogate actuals against criteria while the pilot is still running. Pull ' +
      'defects, incidents, non-use, operator friction, and support burden into the ' +
      'same conversation as headline KPI movement. Do not let anecdotes outrank measurement.',
    exit:
      'Switch to decision forcing. Summarize pass/fail criterion by criterion, state ' +
      'what is not proven, verify design approval, vendor readiness, execution plan, ' +
      'operating model, and rollout capacity. Push the sponsor to scale, kill, repeat, ' +
      'or re-baseline explicitly.',
  },

  dependencies: {
    requiresFromPrior: [
      'P3 Design: detailed design signed off - P4 builds from the approved design and records any delta',
      'P3 Design: pilot cohort named with inclusion/exclusion logic - P4 executes against this cohort and reports changes',
      'P3 Design: success criteria locked against baseline KPI/source/method - P4 judges pass/fail without moving thresholds',
      'P3 Design: phase-3 findings written - P4 inherits accepted risks, open assumptions, and design decisions',
      'P3 Design: CXO interview complete - P4 has sponsor acceptance of success, failure, and kill/re-baseline consequences',
      'P3 Design: operating ownership and support assumptions - P4 tests whether the design can be run at scale',
    ],
    producesForNext: [
      'Pilot outcome pass/fail vs locked criteria - P5 activates only from explicit evidence, not momentum',
      'Operating model with named run, support, data, security/privacy, training, and measurement owners - P5 uses it to scale',
      'Rollout plan for P5 with waves, owners, entry criteria, support capacity, rollback criteria, and measurement cadence',
      'Sponsor-approved design and gate decision - P5 has authority to scale, kill, repeat, or re-baseline',
      'Vendor selection status and commercial constraints - P5 knows whether rollout depends on unresolved sourcing or licences',
      'Pilot incident/defect/adoption limits - P5 contains the risks the pilot did not eliminate',
    ],
  },
};
