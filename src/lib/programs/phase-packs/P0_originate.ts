// P0 Originate - Phase Intelligence Pack
//
// Phase semantics (from src/lib/intelligence/program-lifecycle-patterns.ts
// P0-Originate stage):
//
//   P0 Originate is where a possible program stops being a slogan and becomes
//   a fundable discovery motion. The phase has three outputs that must travel
//   together into P1:
//
//   1. Value hypothesis seed - the first causal claim about what changes,
//      for whom, by how much, and through what mechanism.
//
//   2. Sponsor candidate - a named executive with plausible decision rights,
//      budget access, and calendar commitment. Candidate, not ceremony.
//
//   3. Classification - the program pattern, business domain, impacted cohort,
//      likely evidence family, and risk posture used to select Discovery work.
//
// P0 does not prove the problem. P1 does that. P0 proves the idea is specific
// enough, owned enough, and consequential enough to deserve Discovery spend.
// A funded idea with no value mechanism becomes theatre. A good idea with no
// sponsor becomes orphan work. A sponsor with no classification becomes a
// bespoke consulting exercise instead of a governed program.
//
// This pack reflects the failure modes observed across Apex Retail's 4
// programs and the lifecycle patterns in program-lifecycle-patterns.ts. The
// anti-patterns are observable in chat or evidence, not vibes.

import type { PhasePack } from './types';

export const P0_ORIGINATE: PhasePack = {
  phase: 0,
  label: 'P0 Originate',
  outcome:
    'A Discovery-ready program seed: a named sponsor candidate with plausible ' +
    'decision rights, a value hypothesis seed that states the target cohort, ' +
    'behavior change, expected direction of value, and causal mechanism, plus ' +
    'a classification that selects the program pattern, business domain, risk ' +
    'posture, and evidence family for P1. P0 is not done when someone likes the ' +
    'idea. It is done when the idea is specific enough to investigate, owned ' +
    'enough to fund Discovery, and classified enough that Nexus knows what ' +
    'evidence P1 must collect.',

  definitionOfDone: [
    {
      id: 'program-seed-recorded',
      label: 'Program seed recorded with pattern and business domain',
      severity: 'hard',
      evaluationHint:
        'Program record has a non-null pattern/classification field aligned to ' +
        'program-lifecycle-patterns.ts stage ids (for example PAT-PRG-CDP-001, ' +
        'PAT-PRG-AI-CODING-001, PAT-PRG-COPILOT-001, PAT-PRG-CC-AI-001, ' +
        'PAT-PRG-DATA-FAB-001). Free-text "AI initiative" is not classification.',
      preventsFailureModes: [2, 4],
    },
    {
      id: 'value-hypothesis-seed',
      label: 'Value hypothesis seed with mechanism',
      severity: 'hard',
      evaluationHint:
        'Seed or business-case prose names the target cohort/use case, current ' +
        'pain, expected value direction, and causal mechanism. Look for a claim ' +
        'that can be tested later against baseline modules such as baseline_capture, ' +
        'program_modules, or Discovery artifacts. "$5M opportunity" without ' +
        'mechanism is not sufficient.',
      preventsFailureModes: [2],
    },
    {
      id: 'sponsor-candidate-named',
      label: 'Sponsor candidate named with plausible authority',
      severity: 'hard',
      evaluationHint:
        'engagement_participants includes a real person candidate for sponsor or ' +
        'approver authority, or the seed explicitly names the executive expected ' +
        'to sign. Role labels like "CIO office" or "business" do not satisfy this.',
      preventsFailureModes: [1],
    },
    {
      id: 'discovery-funding-envelope',
      label: 'Discovery funding or capacity envelope stated',
      severity: 'soft',
      evaluationHint:
        'Business case, founder_approval_requests context_jsonb, or program seed ' +
        'states the budget/capacity/time box for Discovery. P0 can proceed with ' +
        'a soft flag if the envelope is provisional, but not if Discovery has no ' +
        'named capacity at all.',
      preventsFailureModes: [10],
    },
    {
      id: 'initial-scope-boundary',
      label: 'Initial scope boundary names one primary cohort or use case',
      severity: 'soft',
      evaluationHint:
        'Seed names the first cohort, channel, function, repository set, intent ' +
        'family, or consuming use case. "Enterprise-wide" or "all employees" ' +
        'without the first cohort is a smell that P1 will sprawl.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'evidence-family-selected',
      label: 'Evidence family selected for P1',
      severity: 'soft',
      evaluationHint:
        'Classification maps to concrete P1 evidence: CDP requires fragmentation ' +
        'baseline and stakeholder map; AI coding requires productivity baseline ' +
        'and repository/IP inventory; Copilot requires oversharing audit and ' +
        'time-spent baseline; contact-center AI requires intent inventory and ' +
        'automation baseline; data fabric requires source-system inventory and ' +
        'data-quality baseline.',
      preventsFailureModes: [2],
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'what-triggered-this-now',
        text: 'What triggered this program now, and what breaks if we do nothing for 90 days?',
        why:
          'P0 needs urgency, not interest. A real trigger gives P1 the right ' +
          'current-state evidence to collect; a vague aspiration usually becomes ' +
          'an orphaned Discovery exercise.',
        expectedAnswerShape:
          'A concrete event, pressure, renewal, board commitment, operational ' +
          'threshold, or customer-impact signal with a date or decision window.',
        preventsFailureModes: [2, 10],
      },
      {
        id: 'who-is-the-first-cohort',
        text:
          'Who is the first cohort or consuming use case this program must serve, ' +
          'before we talk about the enterprise-wide version?',
        why:
          'Forces the seed out of platform-slogan language. P1 cannot baseline ' +
          '"everyone"; it can baseline sales reps, claims agents, demand planners, ' +
          'top call intents, or one customer-data use case.',
        expectedAnswerShape:
          'One named cohort, function, intent family, repository set, channel, or ' +
          'consuming use case. "All teams" is not good enough for P0 close.',
        preventsFailureModes: [2, 10],
      },
      {
        id: 'what-value-mechanism',
        text:
          'What behavior changes if this works, and how does that create value?',
        why:
          'Separates value hypothesis from benefit slogan. P1 will validate the ' +
          'problem and baseline the metric, but P0 must name the causal path to test.',
        expectedAnswerShape:
          'Behavior change plus mechanism: fewer escalations, faster PR cycle, ' +
          'higher identity match rate, cleaner forecast consumption, lower ' +
          'oversharing exposure. A dollar number alone fails.',
        preventsFailureModes: [2],
      },
      {
        id: 'who-can-say-no',
        text:
          'Who can say no to this program, and who can force it through if teams resist?',
        why:
          'Surfaces whether the sponsor candidate has authority or whether P0 is ' +
          'being driven by an enthusiast with no decision rights.',
        expectedAnswerShape:
          'Named executive and authority shape: budget, policy, operating model, ' +
          'vendor decision, stakeholder access. A committee is a warning sign.',
        preventsFailureModes: [1],
      },
      {
        id: 'which-pattern-is-this',
        text:
          'Which lifecycle pattern does this look like: CDP, AI coding assistant, ' +
          'productivity copilot, contact-center AI, data fabric, or something else?',
        why:
          'Classification selects the P1 evidence family. Without it, Nexus asks ' +
          'generic discovery questions and misses pattern-specific failure modes.',
        expectedAnswerShape:
          'One primary pattern with the reason it fits, plus any uncertainty that ' +
          'P1 must resolve. Multiple patterns are allowed only with a declared lead pattern.',
        preventsFailureModes: [2, 4],
      },
    ],
    converge: [
      {
        id: 'hypothesis-in-one-sentence',
        text:
          'State the value hypothesis in one sentence: for which cohort, changing ' +
          'which behavior, measured by what directional signal?',
        why:
          'Forces the idea into a seed P1 can test. If it cannot fit in one ' +
          'sentence, the program is still a conversation, not a Discovery motion.',
        expectedAnswerShape:
          'For [cohort/use case], we believe [intervention/capability] will change ' +
          '[behavior] and move [metric direction] because [mechanism].',
        preventsFailureModes: [2],
      },
      {
        id: 'classification-defense',
        text:
          'What evidence would prove this classification wrong during Discovery?',
        why:
          'Prevents premature pattern lock. P1 should be allowed to reclassify if ' +
          'the current-state evidence contradicts the P0 assumption.',
        expectedAnswerShape:
          'A falsifier tied to evidence: e.g., no cross-channel identity problem, ' +
          'tool sprawl not material, oversharing already remediated, source-system ' +
          'quality not in scope, contact intents too low volume.',
        preventsFailureModes: [2],
      },
      {
        id: 'discovery-capacity',
        text:
          'What Discovery capacity is actually approved: people, data access, sponsor time, and calendar window?',
        why:
          'A P0 seed without Discovery capacity creates a waiting room. P1 needs ' +
          'permission to interview, inspect systems, and capture baselines.',
        expectedAnswerShape:
          'Named access commitments and time box. "We will find time" means P0 is not ready.',
        preventsFailureModes: [4, 10],
      },
      {
        id: 'first-evidence-request',
        text:
          'What is the first evidence request P1 should make on day one?',
        why:
          'Tests whether classification has operational teeth. A good P0 seed ' +
          'points P1 toward a real table, report, export, inventory, or workshop.',
        expectedAnswerShape:
          'A specific evidence artifact: PR metrics export, SharePoint permission ' +
          'audit, IVR intent report, source-system inventory, RFM baseline, ' +
          'identity-overlap report, or similar.',
        preventsFailureModes: [2],
      },
    ],
    close: [
      {
        id: 'p1-entry-package',
        text:
          'Before we open Discovery, do we have the sponsor candidate, value ' +
          'hypothesis seed, classification, first cohort, and first evidence request in one place?',
        why:
          'P1 should start with a usable packet, not a transcript archaeology ' +
          'exercise. This question closes P0 into a handoff artifact.',
        expectedAnswerShape:
          'A compact packet with five named fields and no placeholders.',
        preventsFailureModes: [2, 10],
      },
      {
        id: 'sponsor-calendar',
        text:
          'What sponsor touchpoint is already on the calendar during Discovery?',
        why:
          'Discovery without sponsor cadence drifts into analyst work. P1 needs a ' +
          'known sponsor check-in to validate or kill the problem statement.',
        expectedAnswerShape:
          'Specific meeting or cadence. "Ad hoc" is a soft fail and should be flagged.',
        preventsFailureModes: [1],
      },
      {
        id: 'stop-condition-for-discovery',
        text:
          'What would cause us to stop after Discovery instead of moving to Synthesis?',
        why:
          'Introduces kill discipline early. If P1 cannot falsify the idea, it is ' +
          'performing confirmation work.',
        expectedAnswerShape:
          'A measurable or observable stop condition tied to problem severity, ' +
          'baseline size, sponsor authority, or access constraints.',
        preventsFailureModes: [10],
      },
    ],
  },

  antiPatterns: [
    {
      id: 'slogan-program',
      label: 'The Slogan Program',
      detectionHint:
        'Seed language is a noun phrase like "AI transformation", "data fabric", ' +
        '"customer 360", or "copilot rollout" with no named cohort, behavior ' +
        'change, or value mechanism.',
      whatToFlag:
        'Tell the user the idea is still a slogan. It cannot enter Discovery ' +
        'until P0 names who changes behavior and what evidence P1 should collect.',
      mitigation:
        'Force one cohort/use case and one value mechanism. Convert the slogan ' +
        'into a falsifiable hypothesis before discussing solutions.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'enthusiast-without-authority',
      label: 'The Enthusiast Without Authority',
      detectionHint:
        'The person driving P0 is a PM, architect, innovation lead, vendor contact, ' +
        'or chief-of-staff delegate, while the executive who controls budget or ' +
        'policy is absent or unnamed.',
      whatToFlag:
        'Surface that the program has energy but not authority. P1 will collect ' +
        'evidence no one is obliged to act on.',
      mitigation:
        'Name the sponsor candidate and the exact decision right they hold. If ' +
        'authority is uncertain, make sponsor validation the first P1 work item.',
      preventsFailureModes: [1],
    },
    {
      id: 'funding-before-hypothesis',
      label: 'Funding Before Hypothesis',
      detectionHint:
        'A budget envelope, licence allocation, or vendor SOW exists before the ' +
        'value hypothesis seed names a measurable behavior change.',
      whatToFlag:
        'Tell the user funding is ahead of logic. Spend without a causal claim ' +
        'will make P5 value attribution impossible.',
      mitigation:
        'Backfill the hypothesis seed before Discovery starts. P1 should validate ' +
        'whether the funded motion has a real problem, not assume it does.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'pattern-shopping',
      label: 'Pattern Shopping',
      detectionHint:
        'The same seed is described as multiple unrelated patterns with no lead ' +
        'classification, or classification changes based on who is in the room.',
      whatToFlag:
        'Surface that Nexus cannot select the right Discovery evidence family. ' +
        'Pattern ambiguity is acceptable; unowned ambiguity is not.',
      mitigation:
        'Pick one lead pattern and name falsifiers. P1 can reclassify if evidence ' +
        'contradicts the assumption.',
      preventsFailureModes: [2],
    },
    {
      id: 'enterprise-wide-first',
      label: 'Enterprise-Wide First',
      detectionHint:
        'P0 scope is "all employees", "all customers", "all data", or "all ' +
        'channels" and no first cohort/use case is named.',
      whatToFlag:
        'Tell the user enterprise-wide language is blocking Discovery. Baselines ' +
        'must be collected at a cohort/use-case grain or they will be meaningless.',
      mitigation:
        'Name the first cohort, channel, repository set, intent family, or ' +
        'consuming use case. Treat broader rollout as P5 expansion, not P0 scope.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'vendor-demo-origin',
      label: 'The Vendor-Demo Origin',
      detectionHint:
        'The origin story is a vendor demo, executive offsite demo, or product ' +
        'roadmap commitment, and the problem statement is reverse-engineered from it.',
      whatToFlag:
        'Flag solution-first origin. P1 must validate the problem independently ' +
        'or the program will carry vendor assumptions into Synthesis.',
      mitigation:
        'Restate the hypothesis in problem language and make vendor claims ' +
        'explicit assumptions for P1 evidence checks.',
      preventsFailureModes: [2],
    },
  ],

  coachingArc: {
    entry:
      'Start by stripping the idea down to sponsor, cohort, behavior change, ' +
      'classification, and first evidence request. Do not reward enthusiasm with ' +
      'program status. P0 posture is origination discipline: make the seed concrete.',
    midPhase:
      'Force the value mechanism into one sentence, test sponsor authority, and ' +
      'map the classification to P1 evidence. If the user drifts into solution ' +
      'design, pull them back to what Discovery must prove or disprove.',
    exit:
      'Package the handoff for P1. Confirm no placeholders remain in sponsor ' +
      'candidate, value hypothesis seed, classification, first cohort/use case, ' +
      'Discovery capacity, and first evidence request. Exit posture is not ' +
      'approval theatre; it is deciding whether the seed deserves investigation.',
  },

  dependencies: {
    requiresFromPrior: [
      'Tenant/client context - industry, vertical, strategic pressure, known programs in flight',
      'Initial trigger - board ask, operational pain, renewal event, customer-impact signal, regulatory date, or sponsor request',
      'Any available source material - seed notes, founder intake, executive ask, vendor claim, or workshop transcript',
    ],
    producesForNext: [
      'Value hypothesis seed - P1 validates the problem and baselines the metric against it',
      'Sponsor candidate - P1 confirms authority, cadence, and stakeholder access',
      'Classification - P1 selects evidence family and pattern-specific baselines from program-lifecycle-patterns.ts',
      'First cohort or consuming use case - P1 scopes interviews, evidence requests, and baseline grain',
      'First evidence request - P1 starts with a concrete report/table/export/workshop rather than generic discovery',
      'Discovery stop condition - P1 can recommend no-go instead of manufacturing Synthesis work',
    ],
  },

  steps: [
    {
      id: 'p0-trigger-and-window',
      label: 'Capture what triggered the program now and the decision window',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: [],
      outputs: ['program_trigger_note'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p0-first-cohort',
      label: 'Name the first cohort or use case',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: ['program_trigger_note'],
      outputs: ['initial-scope-boundary'],
      templateRefs: [],
      preventsFailureModes: [2, 10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p0-value-hypothesis',
      label:
        'Compose the value hypothesis seed (cohort × behavior × mechanism × direction)',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['program_trigger_note', 'initial-scope-boundary'],
      outputs: ['value-hypothesis-seed'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: true,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p0-sponsor-candidate',
      label: 'Identify a real sponsor candidate with authority via sponsor 1:1',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: ['value-hypothesis-seed'],
      outputs: ['sponsor-candidate-named'],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    {
      id: 'p0-pattern-classification',
      label: 'Select the pattern / archetype for the program',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: ['value-hypothesis-seed', 'initial-scope-boundary'],
      outputs: ['program-seed-recorded'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p0-discovery-envelope',
      label: 'State Discovery funding / capacity / time-box',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: ['program-seed-recorded'],
      outputs: ['discovery-funding-envelope'],
      templateRefs: [],
      preventsFailureModes: [10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p0-evidence-family',
      label: 'Confirm which Discovery evidence family P1 will collect',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: ['program-seed-recorded'],
      outputs: ['evidence-family-selected'],
      templateRefs: [],
      preventsFailureModes: [2, 3],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p0-submit-for-approval',
      label: 'Submit the brief to Tenant Admin for approval',
      complexity: 'simple',
      agentRole: 'request_approval',
      inputs: [
        'program-seed-recorded',
        'value-hypothesis-seed',
        'sponsor-candidate-named',
        'initial-scope-boundary',
        'discovery-funding-envelope',
        'evidence-family-selected',
      ],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
  ],
};
