// P1 Discovery - Phase Intelligence Pack
//
// Phase semantics (from src/lib/intelligence/program-lifecycle-patterns.ts
// P1-Discovery stage):
//
//   P1 Discovery is where the P0 seed is tested against current-state evidence.
//   The phase has three outputs P2 cannot synthesize without:
//
//   1. Validated problem statement - not the sponsor's first wording, but the
//      evidence-backed problem, affected cohort/use case, severity, and boundary.
//
//   2. OKR baseline - current value, target direction, source, grain, method,
//      owner, and known caveats for the metrics P2 will charter.
//
//   3. Stakeholder map - named sponsor, business owner, technical/data/security
//      owners, dissenters, approvers, and people who can block access or adoption.
//
// P1 does not choose the target-state architecture. P2 does that. P1 earns the
// right to synthesize by proving the problem exists at a measurable grain and
// by naming the humans who will make or break the program.
//
// This pack reflects the failure modes observed across Apex Retail's 4
// programs and the lifecycle patterns in program-lifecycle-patterns.ts. The
// anti-patterns are observable in chat or evidence, not vibes.

import type { PhasePack } from './types';

export const P1_DISCOVERY: PhasePack = {
  phase: 1,
  label: 'P1 Discovery',
  outcome:
    'A Discovery package that validates or rejects the P0 seed with current-state ' +
    'evidence: a problem statement with observed severity and boundary, OKR ' +
    'baselines with current values, sources, grain, method, and owners, plus a ' +
    'stakeholder map naming sponsor, business owner, technical/data/security ' +
    'owners, dissenters, and adoption blockers. P1 is not done when interviews ' +
    'are complete. It is done when P2 has enough evidence to compare target-state ' +
    'options without re-litigating whether the problem is real.',

  definitionOfDone: [
    {
      id: 'p0-seed-ingested',
      label: 'P0 seed ingested: value hypothesis, sponsor candidate, classification',
      severity: 'hard',
      evaluationHint:
        'Discovery notes or program seed references the P0 handoff fields: value ' +
        'hypothesis seed, sponsor candidate, classification, first cohort/use case, ' +
        'and first evidence request. If P1 starts from a blank page, the P0 handoff failed.',
      preventsFailureModes: [1, 2, 4],
    },
    {
      id: 'validated-problem-statement',
      label: 'Validated problem statement with severity and boundary',
      severity: 'hard',
      evaluationHint:
        'Discovery Report artifact or deliverables_v2 row contains problem prose ' +
        'that names affected cohort/use case, current-state symptom, quantified ' +
        'severity, and what is out of scope. Interview-only summaries without ' +
        'measured severity are not validated.',
      preventsFailureModes: [2],
    },
    {
      id: 'okr-baseline-captured',
      label: 'OKR baseline captured with source, grain, method, and owner',
      severity: 'hard',
      evaluationHint:
        'program_modules has baseline_capture or pattern-specific baseline modules ' +
        'completed, or Discovery artifacts include current value, target direction, ' +
        'source system/report, measurement grain, method, owner, and caveats. ' +
        'Examples: PR-cycle time from GitHub/Jira; SharePoint oversharing audit; ' +
        'IVR top-intent volume and CSAT; source-system completeness/freshness; ' +
        'identity overlap rate across source systems.',
      preventsFailureModes: [3, 9],
    },
    {
      id: 'stakeholder-map-named',
      label: 'Stakeholder map names decision owners, operators, and blockers',
      severity: 'hard',
      evaluationHint:
        'Stakeholder Map artifact or engagement_participants rows identify named ' +
        'people for sponsor, business owner, technical/data/security owner as ' +
        'applicable, adoption owner, approver, and at least one dissenter or blocker. ' +
        'A department-only RACI is not a stakeholder map.',
      preventsFailureModes: [1, 4],
    },
    {
      id: 'pattern-specific-evidence-complete',
      label: 'Pattern-specific evidence family completed or explicitly waived',
      severity: 'soft',
      evaluationHint:
        'Discovery package includes the evidence implied by classification: CDP ' +
        'fragmentation baseline and stakeholder map; AI coding productivity baseline ' +
        'and repository/IP inventory; Copilot oversharing audit and time-spent ' +
        'baseline; contact-center AI intent inventory and automation baseline; ' +
        'data fabric source-system inventory, data-quality baseline, and use-case ' +
        'readiness matrix. Waivers must name sponsor rationale.',
      preventsFailureModes: [2, 3],
    },
    {
      id: 'discovery-contradictions-logged',
      label: 'Contradictions and falsifiers logged',
      severity: 'soft',
      evaluationHint:
        'Discovery notes identify where evidence contradicted P0 assumptions: ' +
        'problem smaller than expected, sponsor authority weaker, data unavailable, ' +
        'classification changed, or baseline source unreliable. Absence of any ' +
        'contradiction is suspicious on complex programs.',
      preventsFailureModes: [2],
    },
    {
      id: 'p2-readiness-recommendation',
      label: 'Discovery recommendation: proceed, re-scope, reclassify, or stop',
      severity: 'soft',
      evaluationHint:
        'Discovery Report ends with an explicit recommendation for P2: proceed ' +
        'to Synthesis, re-scope cohort/use case, reclassify pattern, gather missing ' +
        'baseline evidence, or stop. "Continue analysis" is not a recommendation.',
      preventsFailureModes: [2, 10],
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'p0-hypothesis-check',
        text:
          'What exactly did P0 claim, and what evidence would make us change or kill that claim?',
        why:
          'Discovery must test the seed, not admire it. This establishes falsifiers ' +
          'before interviews and baselines become confirmation work.',
        expectedAnswerShape:
          'P0 value hypothesis in one sentence plus 2-3 falsifiers tied to measured ' +
          'severity, stakeholder authority, data availability, or cohort fit.',
        preventsFailureModes: [2],
      },
      {
        id: 'current-state-system-of-record',
        text:
          'Where does the current-state number live today, and who trusts that source?',
        why:
          'Locks the baseline source early. P2 cannot charter an OKR if P1 cannot ' +
          'name the system/report and the owner who will defend it.',
        expectedAnswerShape:
          'Specific system/report/table/export and named owner: GitHub/Jira, NICE ' +
          'WFM, IVR analytics, SharePoint audit, finance close, data-quality profile, ' +
          'CDP source-system extract.',
        preventsFailureModes: [3, 9],
      },
      {
        id: 'who-feels-the-pain',
        text:
          'Who feels the pain weekly, and who only hears about it in status meetings?',
        why:
          'Separates operators from sponsors. P1 needs both: operators reveal the ' +
          'real workflow; sponsors decide whether it matters enough to fund.',
        expectedAnswerShape:
          'Named operators and named executive/business owner, with the cadence at ' +
          'which each sees the pain.',
        preventsFailureModes: [1, 4],
      },
      {
        id: 'pattern-evidence-family',
        text:
          'Given the P0 classification, which evidence family are we collecting first?',
        why:
          'Keeps Discovery pattern-specific. CDP, Copilot, data fabric, AI coding, ' +
          'and contact-center AI fail in different ways and need different baselines.',
        expectedAnswerShape:
          'Named evidence family and first artifact/export/workshop. Generic ' +
          '"stakeholder interviews" is not enough.',
        preventsFailureModes: [2, 3],
      },
      {
        id: 'scope-boundary-now',
        text:
          'What is definitely out of scope for Discovery, even if stakeholders keep bringing it up?',
        why:
          'Discovery sprawl is one of the fastest ways to lose P2 signal. Boundary ' +
          'lets Nexus distinguish adjacent issues from the problem being validated.',
        expectedAnswerShape:
          'Explicit out-of-scope list by cohort, function, channel, system, or ' +
          'metric. "We will capture everything" is a fail.',
        preventsFailureModes: [2, 10],
      },
    ],
    converge: [
      {
        id: 'problem-statement-pressure-test',
        text:
          'State the validated problem without naming the solution. What is happening, ' +
          'to whom, at what measurable severity, and why now?',
        why:
          'Forces problem validation before target-state options. If the answer ' +
          'requires the solution name, Discovery has not separated symptom from remedy.',
        expectedAnswerShape:
          'Problem, cohort/use case, quantified severity, baseline source, and trigger. ' +
          'No vendor, tool, or architecture name required.',
        preventsFailureModes: [2],
      },
      {
        id: 'baseline-grain',
        text:
          'At what grain is the baseline measured, and is that the same grain P4/P5 will use?',
        why:
          'Prevents aggregate baselines that cannot evaluate pilot or activation ' +
          'results later. Grain mismatch is a common value-attribution failure.',
        expectedAnswerShape:
          'Metric grain by cohort, channel, team, repository, source system, segment, ' +
          'intent, or time window, with a note on whether downstream measurement ' +
          'will use the same grain.',
        preventsFailureModes: [3, 9],
      },
      {
        id: 'stakeholder-map-gaps',
        text:
          'Which critical role on the stakeholder map is still a blank name?',
        why:
          'Blank roles become P2/P3 blockers. P1 must expose missing owners before ' +
          'Synthesis recommends a path that no one can operate or approve.',
        expectedAnswerShape:
          'Named missing role and plan to fill it. An unassigned role without owner or date is a risk.',
        preventsFailureModes: [1, 4],
      },
      {
        id: 'evidence-contradicts-p0',
        text:
          'Where did the evidence contradict the P0 hypothesis or classification?',
        why:
          'Healthy Discovery changes the seed. If nothing changed, either the seed ' +
          'was unusually precise or Discovery avoided uncomfortable evidence.',
        expectedAnswerShape:
          'One or more contradictions, or a defended statement that evidence confirmed ' +
          'the seed across named checks.',
        preventsFailureModes: [2],
      },
      {
        id: 'p2-option-inputs',
        text:
          'What are the two or three option dimensions P2 must compare because Discovery found real trade-offs?',
        why:
          'Prepares Synthesis. P1 should not recommend the answer, but it should ' +
          'surface the trade-off terrain P2 must evaluate.',
        expectedAnswerShape:
          'Option dimensions such as build/buy, assist/deflect/resolve, managed vs ' +
          'composable, cohort scope, remediation-first vs constrained pilot, ' +
          'centralized vs domain-owned.',
        preventsFailureModes: [2],
      },
    ],
    close: [
      {
        id: 'discovery-package-ready',
        text:
          'Can P2 read the package and know the validated problem, OKR baseline, stakeholder map, contradictions, and option dimensions without asking us to redo Discovery?',
        why:
          'Closes P1 as a usable handoff, not a collection of notes. P2 should ' +
          'synthesize, not reconstruct.',
        expectedAnswerShape:
          'Yes with artifact names and owners, or no with exact missing item and ' +
          'blocking owner/date.',
        preventsFailureModes: [2, 9],
      },
      {
        id: 'baseline-owner-attestation',
        text:
          'Who owns the baseline source, and have they confirmed the number is fit for decision-making?',
        why:
          'Prevents P2 charters built on numbers the operating team later rejects. ' +
          'Baseline ownership matters as much as the number.',
        expectedAnswerShape:
          'Named owner, source, date, caveats, and whether the number is decision-grade.',
        preventsFailureModes: [3, 9],
      },
      {
        id: 'sponsor-readout-decision',
        text:
          'What did the sponsor decide from Discovery: proceed, re-scope, reclassify, collect more evidence, or stop?',
        why:
          'Discovery without a sponsor decision becomes endless analysis. P2 should ' +
          'start only after the sponsor accepts the evidence-backed direction.',
        expectedAnswerShape:
          'One of proceed/re-scope/reclassify/more evidence/stop, with sponsor name ' +
          'and rationale.',
        preventsFailureModes: [1],
      },
    ],
  },

  antiPatterns: [
    {
      id: 'interview-only-discovery',
      label: 'Interview-Only Discovery',
      detectionHint:
        'Discovery package contains stakeholder quotes and workshop notes but no ' +
        'current-state baseline, system export, report, audit, inventory, or measured severity.',
      whatToFlag:
        'Tell the user Discovery is anecdotal. P2 cannot compare options against ' +
        'unmeasured pain, and P5 cannot verify value against remembered stories.',
      mitigation:
        'Require at least one decision-grade baseline source before close. If the ' +
        'source does not exist, record that absence as a finding and baseline the gap.',
      preventsFailureModes: [3, 9],
    },
    {
      id: 'solution-shadow',
      label: 'The Solution Shadow',
      detectionHint:
        'Every problem statement contains the proposed solution name, vendor, or ' +
        'architecture; stakeholders describe missing tooling more than current-state pain.',
      whatToFlag:
        'Surface that Discovery is being pulled by the answer. P2 will become ' +
        'single-option synthesis if P1 does not restate the problem independently.',
      mitigation:
        'Rewrite the problem statement without solution nouns. Keep vendor/tool ' +
        'claims in an assumptions section for P2 to evaluate.',
      preventsFailureModes: [2],
    },
    {
      id: 'baseline-without-grain',
      label: 'Baseline Without Grain',
      detectionHint:
        'Metric is stated as a single aggregate number with no cohort, channel, ' +
        'repository, segment, source-system, intent, or time-window grain.',
      whatToFlag:
        'Tell the user the baseline is not decision-grade. Aggregate numbers hide ' +
        'where the problem lives and cannot guide pilot scope.',
      mitigation:
        'Re-baseline at the grain P3/P4 will use for pilot and P5 will use for ' +
        'activation. Record caveats if only aggregate data exists.',
      preventsFailureModes: [9],
    },
    {
      id: 'department-raci',
      label: 'The Department RACI',
      detectionHint:
        'Stakeholder map lists departments or roles only - Marketing, IT, Security, ' +
        'Data, Operations - with few or no named humans.',
      whatToFlag:
        'Surface that no one can be interviewed, challenged, or held accountable ' +
        'from a department label. P2/P3 blockers will hide behind the RACI.',
      mitigation:
        'Name people for sponsor, business owner, technical/data/security owner, ' +
        'adoption owner, approver, and dissenter. Unknown names become explicit risks.',
      preventsFailureModes: [1, 4],
    },
    {
      id: 'confirmation-discovery',
      label: 'Confirmation Discovery',
      detectionHint:
        'No P0 assumption changes after Discovery; all evidence is framed as ' +
        'supporting the original idea; dissenting stakeholders or negative data ' +
        'are absent from notes.',
      whatToFlag:
        'Tell the user Discovery reads like confirmation work. Real Discovery ' +
        'usually changes boundary, metric, stakeholder map, classification, or risk posture.',
      mitigation:
        'Ask for contradictions explicitly. If none exist, document the checks ' +
        'that could have contradicted the seed and why they did not.',
      preventsFailureModes: [2],
    },
    {
      id: 'missing-business-owner',
      label: 'Missing Business Owner',
      detectionHint:
        'Sponsor is named but no operating business owner is accountable for ' +
        'use-case priority, adoption, process change, or value realization.',
      whatToFlag:
        'Flag adoption risk. Sponsor authority can fund the program; a business ' +
        'owner makes the capability used after launch.',
      mitigation:
        'Find the named business owner before P2. If the program is IT-owned only, ' +
        'P2 must treat adoption ownership as a gate risk.',
      preventsFailureModes: [1, 4],
    },
    {
      id: 'baseline-owner-dispute',
      label: 'Baseline Owner Dispute',
      detectionHint:
        'Different teams cite different current-state numbers, or the owner of ' +
        'the report disputes the metric used in Discovery.',
      whatToFlag:
        'Surface that the baseline is contested. A contested baseline will break ' +
        'P2 chartering and P5 value attestation.',
      mitigation:
        'Choose one source of record, name caveats, and get owner attestation. If ' +
        'no source is decision-grade, make baseline instrumentation part of P2 scope.',
      preventsFailureModes: [3, 9],
    },
  ],

  coachingArc: {
    entry:
      'Open by restating the P0 value hypothesis, sponsor candidate, classification, ' +
      'first cohort/use case, and falsifiers. Then select the pattern-specific ' +
      'evidence family. P1 posture is investigative: test the seed before expanding it.',
    midPhase:
      'Drive from interviews into baselines. Keep asking for source, grain, owner, ' +
      'method, and caveat. Build the stakeholder map with names, not departments. ' +
      'Log contradictions as useful signal, not as bad news.',
    exit:
      'Lock the handoff to P2: validated problem statement, OKR baseline, stakeholder ' +
      'map, contradictions, scope boundary, and option dimensions. The exit posture ' +
      'is evidence adjudication - proceed, re-scope, reclassify, gather missing ' +
      'evidence, or stop.',
  },

  dependencies: {
    requiresFromPrior: [
      'P0 Originate: value hypothesis seed with causal mechanism',
      'P0 Originate: sponsor candidate and expected decision rights',
      'P0 Originate: classification / lead lifecycle pattern',
      'P0 Originate: first cohort or consuming use case and first evidence request',
      'P0 Originate: Discovery capacity and stop condition',
    ],
    producesForNext: [
      'Validated problem statement - P2 compares options against this problem, not the P0 slogan',
      'OKR baseline with source, grain, method, owner, and caveats - P2 charter and P5 value attestation depend on it',
      'Stakeholder map with named sponsor, business owner, technical/data/security owners, approvers, dissenters, and blockers - P2 uses it for sign-off and politics',
      'Pattern-specific evidence package - P2 knows which architecture/value trade-offs are real',
      'Contradiction log and falsifier results - P2 can avoid single-option rationalization',
      'Option dimensions surfaced by Discovery - P2 turns them into target-state alternatives and trade-offs',
    ],
  },

  steps: [
    // Continuity step. Tagged [2] because the P0 handoff carries the value-
    // hypothesis seed forward; without ingestion P1 would relitigate problem
    // definition (failure mode #2) instead of testing it.
    {
      id: 'p1-handoff-ingest',
      label: 'Confirm P0 handoff received and active',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: [],
      outputs: ['p0-seed-ingested'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Output `current-state-system-of-record` is a `rightQuestions.open` id,
    // not a DoD id. Kept as the step output to make the DAG legible to readers
    // (data discovery produces the system-of-record before baseline capture
    // can sample it); the closest hard DoD item this step ultimately feeds is
    // `okr-baseline-captured`, which is captured by the next step.
    {
      id: 'p1-data-discovery',
      label: 'Identify data sources / system-of-record / ownership / accessibility',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p0-seed-ingested'],
      outputs: ['current-state-system-of-record'],
      templateRefs: [],
      preventsFailureModes: [3],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    {
      id: 'p1-baseline-capture',
      label: 'Capture OKR baseline (archetype-parameterized metric)',
      complexity: 'complex',
      agentRole: 'coach_baseline',
      inputs: ['current-state-system-of-record'],
      outputs: ['okr-baseline-captured'],
      templateRefs: [],
      preventsFailureModes: [9],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Stakeholder mapping is interview-driven (coach_interview is the dominant
    // role) but treated as complex per the slice spec because each 1:1 has its
    // own intent capture and post-interview upload.
    {
      id: 'p1-stakeholder-mapping',
      label: 'Identify and validate full stakeholder map',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: ['p0-seed-ingested'],
      outputs: ['stakeholder-map-named'],
      templateRefs: [],
      preventsFailureModes: [1, 4],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    {
      id: 'p1-root-cause-synthesis',
      label:
        'Synthesize root causes from evidence into validated problem statement',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['okr-baseline-captured', 'stakeholder-map-named'],
      outputs: ['validated-problem-statement'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    {
      id: 'p1-pattern-evidence',
      label:
        'Capture archetype-specific evidence family (CDP identity overlap, CC-AI intent inventory, AMS app footprint, etc.)',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['validated-problem-statement', 'okr-baseline-captured'],
      outputs: ['pattern-specific-evidence-complete'],
      templateRefs: [],
      preventsFailureModes: [2, 3],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    {
      id: 'p1-contradictions-log',
      label: 'Log contradictions surfaced during Discovery for P2',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: ['validated-problem-statement', 'pattern-specific-evidence-complete'],
      outputs: ['discovery-contradictions-logged'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Design doc D.1.4 marks this step "medium" with role "coach_interview +
    // request_approval"; StepComplexity has no `medium` value and agentRole is
    // single-valued, so we encode it as `simple` (chat-resolvable sponsor
    // briefing, no off-platform workshop) with `coach_interview` as the
    // dominant role. The `request_approval` action is a side effect at the
    // end (sponsor sign-off on the proceed/pivot/kill recommendation).
    {
      id: 'p1-p2-readiness-call',
      label:
        'Sponsor briefing + P2 readiness recommendation (proceed / pivot / kill)',
      complexity: 'simple',
      agentRole: 'coach_interview',
      inputs: [
        'validated-problem-statement',
        'okr-baseline-captured',
        'stakeholder-map-named',
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
      ],
      outputs: ['p2-readiness-recommendation'],
      templateRefs: [],
      preventsFailureModes: [1, 10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
  ],
};
