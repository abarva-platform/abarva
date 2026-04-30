// P2 Synthesis · Phase Intelligence Pack
//
// Phase semantics (from src/lib/programs/programs-fixture.ts PHASE_LABEL_MAP
// and src/lib/intelligence/program-lifecycle-patterns.ts P2-Synthesis stage):
//
//   P2 Synthesis is where Discovery findings become a recommended path
//   forward. The phase has TWO outputs that are signed-off together as
//   the gate package:
//
//   1. Synthesis recommendation — the analyst output: target-state options
//      compared with honest trade-offs, a recommended path, and an
//      architecture sketch reviewed by architecture.
//
//   2. Charter signed-off — the sponsor's binding commitment to the
//      recommended path: scope boundary, baseline KPI, value hypothesis
//      with mechanism, kill criterion, named dissenter, succession owner.
//
// Both must be present at exit. A signed charter without a credible
// synthesis is sponsor pressure. A credible synthesis without a signed
// charter is a deck. Programs fail at this gate either way.
//
// Hard gates (mirrors GATE_RULES P2→P3 in src/lib/programs/governance.ts):
//   • charter_signed_off (sponsor binding)
//   • sponsor_assigned with approval_authority='sponsor'
//
// Soft gates flagged when missing:
//   • synthesis option comparison with trade-offs
//   • architecture review attestation
//   • baseline KPI captured with source
//   • dissenter named
//   • kill criterion stated
//   • succession owner named
//
// This pack reflects the failure modes observed across Apex Retail's 4
// programs and 12+ AbarVa engagement post-mortems. The anti-patterns are
// observable in chat or evidence, not vibes.

import type { PhasePack } from './types';

export const P2_SYNTHESIS: PhasePack = {
  phase: 2,
  label: 'P2 Synthesis',
  outcome:
    'A signed gate package combining (a) a synthesis recommendation that names ' +
    'at least two viable target-state options, makes the trade-offs explicit, and ' +
    'recommends a path with an architecture sketch the architecture function has ' +
    'reviewed; AND (b) a charter the sponsor has personally signed — naming ' +
    'baseline KPIs (current value, target, source, method), the value hypothesis ' +
    'with causal mechanism, the scope boundary, a named dissenter, a kill ' +
    'criterion, and a succession owner. Both halves are required: synthesis ' +
    'without sponsor sign-off is a deck; sign-off without synthesis is sponsor ' +
    'pressure. Either alone fails P3 within weeks.',

  definitionOfDone: [
    {
      id: 'charter-signed-off',
      label: 'Charter signed off by sponsor',
      severity: 'hard',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="charter" and status="signed_off". ' +
        'The signing person must have approval_authority="sponsor" on engagement_participants — ' +
        'not delegate, not chief of staff.',
      preventsFailureModes: [1, 2],
    },
    {
      id: 'sponsor-assigned',
      label: 'Sponsor assigned with explicit approval authority',
      severity: 'hard',
      evaluationHint:
        'engagement_participants row with approval_authority="sponsor". The sponsor ' +
        'must be a real persons-table record, not a role label like "CIO".',
      preventsFailureModes: [1],
    },
    {
      id: 'synthesis-options-compared',
      label: 'At least two target-state options compared with explicit trade-offs',
      severity: 'soft',
      evaluationHint:
        'Synthesis prose names ≥2 options, lists what each gives up, and explains ' +
        'why the recommended path beats the alternatives. Single-option synthesis is ' +
        'a smell — usually means trade-offs were not actually examined.',
      preventsFailureModes: [2, 7],
    },
    {
      id: 'architecture-review-attested',
      label: 'Architecture sketch reviewed by architecture function',
      severity: 'soft',
      evaluationHint:
        'Synthesis package has a named architecture reviewer with a date and ' +
        'comments. "Reviewed by architecture team" without a name or date is ' +
        'ceremonial, not real.',
      preventsFailureModes: [6],
    },
    {
      id: 'baseline-kpi-captured',
      label: 'Baseline KPI: current value + target + source + measurement method',
      severity: 'soft',
      evaluationHint:
        'Charter prose names a numeric current value, numeric target, the system ' +
        'or report the number comes from, and the measurement method. ' +
        '"Reduce wait time" is not enough; "reduce avg answer time from 4.2 min ' +
        '(NICE WFM Q1 baseline) to <90s by Q4" is.',
      preventsFailureModes: [3, 9],
    },
    {
      id: 'value-hypothesis-with-mechanism',
      label: 'Value hypothesis with causal mechanism',
      severity: 'soft',
      evaluationHint:
        'Charter explains *how* the value materializes, not just *that* it does. ' +
        '"$3M savings" alone is wishful; "$3M savings via 22% reduction in ' +
        'escalations × $140 marginal cost per escalation" is testable in P5/P6.',
      preventsFailureModes: [2, 9],
    },
    {
      id: 'scope-boundary-stated',
      label: 'Scope boundary in one paragraph (in/out)',
      severity: 'soft',
      evaluationHint:
        'Charter has explicit "in scope" and "out of scope" prose. ' +
        '"Everywhere" or ">3 functional areas" is a smell.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'dissenter-named',
      label: 'A named dissenter who will lose if this works',
      severity: 'soft',
      evaluationHint:
        'Every real change has someone who loses status, headcount, vendor ' +
        'relationship, or political capital. If no dissenter is named, either the ' +
        'program is too small to matter or the sponsor is hiding the politics.',
      preventsFailureModes: [1, 5],
    },
    {
      id: 'kill-criterion-locked',
      label: 'Kill criterion (a measurable signal that justifies stopping)',
      severity: 'soft',
      evaluationHint:
        'Charter names a measurable signal that would justify stopping the ' +
        'program. Without one, the program drifts into zombie status when results ' +
        'disappoint.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'succession-owner-named',
      label: 'Succession owner if the sponsor leaves',
      severity: 'soft',
      evaluationHint:
        'Single-sponsor programs are fragile. A named succession owner reduces ' +
        'the risk of charter collapse mid-program.',
      preventsFailureModes: [1],
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'options-on-the-table',
        text:
          'What are the two or three target-state options on the table, and ' +
          'what does each give up?',
        why:
          'Forces the synthesis to be honest about alternatives. If the user can ' +
          'only name one option, they have not actually synthesized — they have ' +
          'rationalized.',
        expectedAnswerShape:
          'At least two named options with concrete trade-offs ' +
          '(cost vs. speed, build vs. buy, scope vs. risk). "There’s really only ' +
          'one option" is a fail.',
        preventsFailureModes: [2, 7],
      },
      {
        id: 'who-benefits-who-loses',
        text: 'Who personally benefits if this works, and who personally loses?',
        why:
          'Surfaces dissenters before they become P3/P4 blockers. Charters that ' +
          'cannot answer this are usually too vague or politically avoidant.',
        expectedAnswerShape:
          'Two named people (or two named functions with named heads). ' +
          '"Everyone wins" is a fail.',
        preventsFailureModes: [1, 5],
      },
      {
        id: 'baseline-source',
        text:
          'What does the sponsor measure today, and where does that number come from?',
        why:
          'Locks the baseline source before scope discussion. Without a source, ' +
          'targets are aspirational and P5 has nothing to verify against.',
        expectedAnswerShape:
          'A current numeric value tied to a specific system or report ' +
          '(NICE WFM dashboard, finance close, etc.) — not a remembered figure.',
        preventsFailureModes: [3, 9],
      },
      {
        id: 'why-now',
        text: "What's the trigger — why is this the right program to fund right now?",
        why:
          'Anchors urgency to a real event (board commitment, regulatory deadline, ' +
          'competitive pressure, contract renewal). Programs without urgency get ' +
          'orphaned when budget tightens.',
        expectedAnswerShape:
          'A concrete event with a date or window. "We always wanted to do this" is a fail.',
        preventsFailureModes: [2, 10],
      },
      {
        id: 'sponsor-time-committed',
        text:
          'How much of the sponsor’s personal calendar does this get over the next 90 days?',
        why:
          'Phantom sponsorship is the #1 P2 failure mode. Without committed ' +
          'calendar time, the charter is delegated and stalls at the first ' +
          'real decision.',
        expectedAnswerShape:
          'Specific cadence — e.g., "weekly 30-min steer + monthly 90-min review." ' +
          'Vague answers ("as needed") indicate phantom sponsorship.',
        preventsFailureModes: [1],
      },
    ],
    converge: [
      {
        id: 'recommended-path-defense',
        text:
          'Why does the recommended path beat the alternatives — what would have ' +
          'to be true for option 2 to win instead?',
        why:
          'Pressure-tests whether the synthesis examined the trade-offs honestly ' +
          'or rationalized a pre-decided answer. If the user cannot articulate the ' +
          'crossover condition, the synthesis is theatre.',
        expectedAnswerShape:
          'A concrete condition under which the recommendation flips ' +
          '("if integration cost > $X, option 2 wins"). Not "option 1 is just better."',
        preventsFailureModes: [2],
      },
      {
        id: 'architecture-review',
        text:
          'Who in architecture has reviewed the sketch, and what did they push back on?',
        why:
          'A synthesis without architecture pushback is either pre-aligned or ' +
          'unread. P3 design will surface the issues you avoided here.',
        preventsFailureModes: [6],
      },
      {
        id: 'cut-fifty-percent',
        text:
          'If we cut scope by 50% tomorrow, what stays? What is the one outcome ' +
          'that would still make this program worth doing?',
        why:
          'Forces priority on the charter. Programs that cannot survive a 50% ' +
          'cut are wishlists.',
        preventsFailureModes: [2, 10],
      },
      {
        id: 'value-mechanism',
        text:
          'How does the dollar value actually materialize — what behavior ' +
          'changes, and how do we measure it?',
        why:
          'Distinguishes a testable value hypothesis from a wishful number. ' +
          'Without a mechanism, P6 outcomes attestation becomes performative.',
        preventsFailureModes: [2, 9],
      },
      {
        id: 'sponsor-three-month-fear',
        text: 'What is the sponsor going to lose sleep over three months from now?',
        why:
          'Surfaces the real risk anchor — usually the sponsor’s reputation or ' +
          'political cover. Aligns P3/P4 risk work to what the sponsor cares about.',
        preventsFailureModes: [1, 6],
      },
    ],
    close: [
      {
        id: 'signature-authority',
        text:
          'Who signs the charter, and what authority does that person have to ' +
          'commit budget, headcount, and stakeholder access?',
        why:
          'A charter signed by someone without authority is theatre. Verify ' +
          'approval_authority="sponsor" on the persons record before close.',
        preventsFailureModes: [1],
      },
      {
        id: 'succession',
        text: 'If the sponsor leaves the company tomorrow, who owns this program?',
        why:
          'Single-sponsor programs are fragile. A named succession owner reduces ' +
          'the risk of charter collapse mid-program.',
        preventsFailureModes: [1],
      },
      {
        id: 'kill-criterion',
        text:
          'What is the kill criterion — what measurable signal would have to be ' +
          'true for us to stop this program?',
        why:
          'Without a kill criterion, programs drift into zombie status when ' +
          'results disappoint. Anchoring one in the charter gives Maestro and ' +
          'Nexus license to flag drift later.',
        expectedAnswerShape:
          'A measurable signal: "if pilot adoption stays under 30% after 8 weeks." ' +
          '"If it’s clearly not working" is not a kill criterion.',
        preventsFailureModes: [2, 10],
      },
    ],
  },

  antiPatterns: [
    {
      id: 'single-option-synthesis',
      label: 'The Single-Option Synthesis',
      detectionHint:
        'Synthesis package presents one recommended path with no alternative ' +
        'considered, OR alternatives mentioned but no trade-offs articulated, OR ' +
        'crossover conditions absent ("we evaluated cloud and on-prem and cloud is better").',
      whatToFlag:
        'Surface that the synthesis is rationalization, not analysis. Tell the ' +
        'user that without a credible alternative and a stated crossover condition, ' +
        'P3 will surface the trade-offs they skipped — usually as scope corrections.',
      mitigation:
        'Push for at least one credible alternative with a concrete crossover ' +
        '("if integration cost > $X" / "if vendor lock-in matters more than time-to-market"). ' +
        'Force the user to defend the recommendation against it.',
      preventsFailureModes: [2, 7],
    },
    {
      id: 'unread-architecture',
      label: 'The Unread Architecture',
      detectionHint:
        'Synthesis claims architecture review but cannot name a reviewer, date, ' +
        'or any pushback received. Or: architecture sign-off is from a delegate ' +
        'with no design experience.',
      whatToFlag:
        'Surface that the architecture review is ceremonial. Real review produces ' +
        'pushback; absence of pushback usually means absence of review.',
      mitigation:
        'Insist on a named senior architect and at least one substantive piece ' +
        'of feedback before closing the gate. If architecture is genuinely ' +
        'aligned, surface why.',
      preventsFailureModes: [6],
    },
    {
      id: 'everywhere-charter',
      label: 'The Everywhere Charter',
      detectionHint:
        'Charter prose mentions more than three functional areas, or scope is ' +
        '"the organization" / "all of customer service" / "across the business" ' +
        'with no further qualifier.',
      whatToFlag:
        'Tell the user the charter currently spans too many functions to advance ' +
        'into Design — P3 will fragment into parallel investigations and the ' +
        'sponsor will lose focus. Surface the specific functional areas mentioned.',
      mitigation:
        'Push for one primary function with at most one adjacent dependency named. ' +
        'Other functions become explicit P5 expansion candidates, not in-scope here.',
      preventsFailureModes: [2, 10],
    },
    {
      id: 'wishlist-baseline',
      label: 'The Wishlist Baseline',
      detectionHint:
        'Target value stated without a current value, OR current value stated ' +
        'without a measurement source, OR both numbers given without a method ' +
        '("we estimate average wait time is around 4 minutes").',
      whatToFlag:
        'The baseline is wishful. Tell the user explicitly: "We have a target ' +
        'but no source for the current value — P5 will not be able to verify ' +
        'movement against it." Refuse to advance without addressing.',
      mitigation:
        'Push for a specific system or report as the baseline source ' +
        '(NICE WFM, Tableau dashboard, finance close, etc.) and a measurement ' +
        'method (daily average, weekly p95, etc.).',
      preventsFailureModes: [3, 9],
    },
    {
      id: 'phantom-sponsor',
      label: 'The Phantom Sponsor',
      detectionHint:
        'Sponsor named but: (a) not present in any captured workshop or meeting, ' +
        '(b) cannot commit specific calendar time, (c) referred to via delegate, ' +
        '(d) all decisions are routed through a chief of staff or PMO without ' +
        'sponsor sign-off.',
      whatToFlag:
        'Surface that the sponsor pattern looks delegated rather than personal. ' +
        'Tell the user the program has high probability of stalling at the first ' +
        'real decision — this is the #1 reason charters fail in P3.',
      mitigation:
        'Insist on a recurring sponsor cadence on the calendar before close, AND ' +
        'name a succession owner. If the sponsor will not commit, the charter is ' +
        'not ready to advance — a wrong sponsor is more costly than no sponsor.',
      preventsFailureModes: [1],
    },
    {
      id: 'vendor-driven-charter',
      label: 'The Vendor-Driven Charter',
      detectionHint:
        'Charter language begins with a solution — "implement Salesforce Service ' +
        'Cloud" / "deploy CDP" / "stand up an LLM platform" — before naming the ' +
        'problem. Or: charter cites a specific vendor demo as the value hypothesis.',
      whatToFlag:
        'Tell the user the charter reads as solution-first, not problem-first. ' +
        'Vendor-driven charters lock in technology before P3 has validated the ' +
        'problem, leading to expensive scope correction in P4.',
      mitigation:
        'Reframe in problem language. The charter should name a measurable ' +
        'behavior change, not a tool. Tools belong in P3 design options.',
      preventsFailureModes: [2, 7],
    },
    {
      id: 'committee-charter',
      label: 'The Committee Charter',
      detectionHint:
        'More than one sponsor named, OR charter has multiple co-owners with ' +
        'shared authority, OR sign-off requires a steering committee vote.',
      whatToFlag:
        'Surface that authority is fragmented. Multi-sponsor programs cannot ' +
        'make fast decisions in P3/P4 and stall at gate transitions.',
      mitigation:
        'Push for one accountable sponsor. Other interested parties become ' +
        'advisors or stakeholders, not co-sponsors.',
      preventsFailureModes: [1],
    },
    {
      id: 'no-dissenter',
      label: 'The Conflict-Free Charter',
      detectionHint:
        'When asked who loses if this succeeds, the user says "no one" or ' +
        '"everyone wins."',
      whatToFlag:
        'Real change has losers. A charter with no named dissenter is either too ' +
        'small to matter or the sponsor is hiding the politics — both are P3/P4 risk.',
      mitigation:
        'Probe for the dissenter: which vendor relationship dies, which team loses ' +
        'headcount, which exec loses oversight, which process owner loses control. ' +
        'Name them in the charter risk register.',
      preventsFailureModes: [1, 5],
    },
    {
      id: 'orphaned-kill-criterion',
      label: 'The Open-Ended Charter',
      detectionHint: 'No kill criterion stated, or the kill criterion is unmeasurable.',
      whatToFlag:
        'Charters without a kill criterion drift into zombie status when results ' +
        'disappoint. Tell the user the charter is missing a stop signal.',
      mitigation:
        'Insist on a measurable kill criterion before close — adoption < X by ' +
        'week N, baseline movement < Y by quarter Q, etc.',
      preventsFailureModes: [2, 10],
    },
  ],

  coachingArc: {
    entry:
      'Verify the sponsor is real before discussing scope or options. Surface ' +
      'dissenters in the first two turns. Push baseline rigor before letting ' +
      'scope discussions take over. Ask what synthesis options are on the table — ' +
      'if there is only one, the synthesis has not happened yet.',
    midPhase:
      'Pressure-test BOTH halves of the gate package. On synthesis: force a ' +
      'crossover condition for at least one alternative; demand named architecture ' +
      'review with substantive pushback. On charter: 50% scope cut, 3-month ' +
      'sponsor fear, value mechanism (not just dollar amount). Flag any ' +
      'anti-pattern signal the moment it appears — do not wait for the user.',
    exit:
      'Validate signature authority on the persons record. Confirm sponsor ' +
      'calendar commitment, succession plan, kill criterion. Confirm synthesis ' +
      'has trade-offs articulated and architecture has signed off (named, dated, ' +
      'with comments). The exit posture is gate-locking, not consultative — ' +
      'refuse to call the gate done if hard items are unmet.',
  },

  dependencies: {
    requiresFromPrior: [
      'P0 Originate: business case, value hypothesis seed, sponsor candidate, classification',
      'P1 Discovery: validated problem statement, OKR baseline, stakeholder map',
      'P0/P1: tenant/client context — industry, vertical, prior programs in flight, pattern match',
    ],
    producesForNext: [
      'Recommended target-state path with stated trade-offs — P3 designs against this, not in spite of it',
      'Architecture sketch with named reviewer — P3 detailed design extends, does not re-litigate',
      'Baseline KPI with source and method — P5 measures movement against this',
      'Sponsor commitment and succession owner — P3/P4 stakeholder cadence draws on these',
      'Scope boundary — P3 investigation must stay within',
      'Kill criterion — gives Maestro and Nexus license to flag drift in P3/P4/P5',
      'Named dissenter — P3 stakeholder interviews must include them, not avoid them',
    ],
  },

  // ── Step decomposition · OV2-5-P2 (design doc D.2.4) ─────────────────────
  //
  // 9 canonical P2 steps. The DAG threads two roots (options authoring and
  // architecture review) through the synthesis workshop into the charter
  // composition, sponsor defense, and ultimately the sign-off gate. Three
  // steps produce intermediate artifacts (options table, charter draft,
  // sponsor commitment evidence) rather than DoD ids; their `outputs` are
  // empty arrays per the slice rule (no invented DoD ids), and downstream
  // steps reference the intermediate artifact id in their `inputs` so the
  // DAG remains legible.
  //
  // StepComplexity admits only 'simple' | 'complex'. Design doc rows tagged
  // "medium" are encoded as 'simple' when the work is chat-resolvable
  // (authoring a list, locking a criterion, engaging a dissenter via a
  // single 1:1) and as 'complex' when off-platform multi-stakeholder work
  // is required (workshop, architecture review, sponsor defense).
  steps: [
    // Authoring a static options list typically takes a turn or two; treated
    // as simple. Output is intermediate (the options table feeds the
    // workshop) so `outputs` is empty per slice rule. Downstream tradeoff
    // workshop references the intermediate artifact `p2-options-table`.
    {
      id: 'p2-options-author',
      label: 'Author the options-to-weigh list (≥3 options)',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: [],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [2, 10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p2-tradeoff-workshop',
      label: 'Run the synthesis workshop comparing options',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: ['p2-options-table'],
      outputs: ['synthesis-options-compared'],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Architecture / data / security / privacy review is one of the two DAG
    // roots — it can run in parallel with options authoring and the workshop
    // and feeds the charter composition. `coach_workshop` is the dominant
    // role even though the room contents differ from the tradeoff workshop.
    {
      id: 'p2-architecture-review',
      label: 'Architecture / data / security / privacy review',
      complexity: 'complex',
      agentRole: 'coach_workshop',
      inputs: [],
      outputs: ['architecture-review-attested'],
      templateRefs: [],
      preventsFailureModes: [6],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Composing the charter draft is chat-resolvable artifact authoring;
    // treated as simple. Output is the charter draft (intermediate) — the
    // signed charter is produced downstream by p2-charter-signoff. Tagged
    // [2] because the charter encodes the problem definition; without it
    // the program drifts back into slogan language (failure mode #2).
    {
      id: 'p2-charter-author',
      label: 'Compose the program charter',
      complexity: 'simple',
      agentRole: 'compose_artifact',
      inputs: [
        'synthesis-options-compared',
        'architecture-review-attested',
        'kill-criterion-locked',
        'succession-owner-named',
      ],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [2],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Sponsor 1:1 to defend the recommended path against the 3-month-fear
    // question. Complex (off-platform interview with intent capture and
    // post-meeting upload). Output is sponsor commitment evidence
    // (intermediate) consumed at sign-off; `outputs` is empty per slice
    // rule.
    {
      id: 'p2-sponsor-defense',
      label:
        'Sponsor 1:1 — defend recommended path against 3-month-fear question',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: ['p2-charter-draft'],
      outputs: [],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
    // Locking a measurable kill criterion is chat-resolvable validation
    // work; treated as simple. Authored alongside the charter so it can be
    // referenced by p2-charter-author and p2-charter-signoff.
    {
      id: 'p2-kill-criterion',
      label: 'Lock the kill criterion (specific and observable)',
      complexity: 'simple',
      agentRole: 'validate',
      inputs: [],
      outputs: ['kill-criterion-locked'],
      templateRefs: [],
      preventsFailureModes: [2, 10],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    {
      id: 'p2-succession-named',
      label: 'Name a sponsor succession owner',
      complexity: 'simple',
      agentRole: 'extract',
      inputs: [],
      outputs: ['succession-owner-named'],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Sponsor sign-off is the gate action — chat-resolvable approval
    // request; the substantive work happened in p2-sponsor-defense. Tagged
    // [1] because sponsor sign-off concretizes failure-mode #1 (sponsor
    // commitment).
    {
      id: 'p2-charter-signoff',
      label: 'Sponsor signs the charter',
      complexity: 'simple',
      agentRole: 'request_approval',
      inputs: [
        'synthesis-options-compared',
        'architecture-review-attested',
        'kill-criterion-locked',
        'succession-owner-named',
      ],
      outputs: ['charter-signed-off'],
      templateRefs: [],
      preventsFailureModes: [1],
      intentCaptureRequired: false,
      postMeetingUploadExpected: false,
    },
    // Identifying and engaging at least one dissenter requires an
    // off-platform 1:1 with its own intent capture and post-meeting
    // upload — encoded as complex.
    {
      id: 'p2-dissenter-engaged',
      label: 'Identify and engage at least one dissenter',
      complexity: 'complex',
      agentRole: 'coach_interview',
      inputs: ['synthesis-options-compared'],
      outputs: ['dissenter-named'],
      templateRefs: [],
      preventsFailureModes: [2, 10],
      intentCaptureRequired: true,
      postMeetingUploadExpected: true,
    },
  ],
};
