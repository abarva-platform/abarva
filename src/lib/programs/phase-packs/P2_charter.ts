// P2 Charter · Phase Intelligence Pack
//
// Phase outcome:
//   A signed charter that names the sponsor with explicit approval authority,
//   captures the baseline KPI (current state and target with measurement
//   method), states the value hypothesis with mechanism (not just dollar
//   amount), defines the scope boundary, and names a kill criterion.
//
// Hard gates (mirrors GATE_RULES P2→P3 in src/lib/programs/governance.ts):
//   • charter_signed_off
//   • sponsor_assigned with approval_authority='sponsor'
// Soft gates flagged when missing:
//   • baseline KPI captured with source
//   • dissenter named (every real charter has one)
//   • succession owner named (sponsor-leaves-tomorrow plan)
//
// This pack reflects the failure modes observed across Apex Retail's 4
// programs and 12+ AbarVa engagement post-mortems. The anti-patterns are
// the real ones: phantom sponsors, wishlist baselines, vendor-driven
// charters, committee charters. They're observable in chat, not vibes.

import type { PhasePack } from './types';

export const P2_CHARTER: PhasePack = {
  phase: 2,
  label: 'P2 Charter',
  outcome:
    'A signed charter that names the sponsor (with explicit approval authority), ' +
    'captures the baseline KPI (current value, target value, measurement method, source), ' +
    'states the value hypothesis with the causal mechanism — not just the dollar amount — ' +
    'defines the scope boundary in one paragraph, names a dissenter, names a succession ' +
    'owner if the sponsor leaves, and locks a kill criterion. The sponsor has personally ' +
    'committed time, budget, and stakeholder access — not just delegated.',

  definitionOfDone: [
    {
      id: 'charter-signed-off',
      label: 'Charter signed off',
      severity: 'hard',
      evaluationHint:
        'deliverables_v2 row with deliverable_type_key="charter" and status="signed_off". ' +
        'Verify the signing person has approval_authority="sponsor" on engagement_participants.',
    },
    {
      id: 'sponsor-assigned',
      label: 'Sponsor assigned with explicit approval authority',
      severity: 'hard',
      evaluationHint:
        'engagement_participants row with approval_authority="sponsor". The sponsor ' +
        'must be a real person record (persons table), not a role label like "CIO".',
    },
    {
      id: 'baseline-kpi-captured',
      label: 'Baseline KPI captured with current value, target, and source',
      severity: 'soft',
      evaluationHint:
        'Charter prose names a numeric current value, numeric target, and where the ' +
        'measurement comes from. "Reduce contact center wait time" is not enough; ' +
        '"reduce average answer time from 4.2 min (NICE WFM Q1 baseline) to <90s by Q4" is.',
    },
    {
      id: 'value-hypothesis-with-mechanism',
      label: 'Value hypothesis with causal mechanism',
      severity: 'soft',
      evaluationHint:
        'Charter explains *how* the value materializes, not just *that* it does. ' +
        '"$3M savings" alone is wishful; "$3M savings via 22% reduction in escalations × ' +
        '$140 marginal cost per escalation" is testable.',
    },
    {
      id: 'scope-boundary-stated',
      label: 'Scope boundary in one paragraph (in/out)',
      severity: 'soft',
      evaluationHint:
        'Charter has explicit "in scope" and "out of scope" prose. "Everywhere" or ' +
        '">3 functional areas" is a smell.',
    },
    {
      id: 'dissenter-named',
      label: 'A named dissenter who will lose if this works',
      severity: 'soft',
      evaluationHint:
        'Every real change has someone who loses status, headcount, vendor relationship, ' +
        'or political capital. If no dissenter is named, either the charter is too small ' +
        'to matter or the sponsor is hiding the politics.',
    },
    {
      id: 'kill-criterion-locked',
      label: 'Kill criterion (what would make us stop)',
      severity: 'soft',
      evaluationHint:
        'Charter names a measurable signal that would justify stopping the program. ' +
        'Without one, the program drifts into zombie status when results disappoint.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'who-benefits-who-loses',
        text: 'Who personally benefits if this works, and who personally loses?',
        why:
          'Surfaces dissenters before they become blockers in P3 or P4. Charters that ' +
          'cannot answer this are usually too vague to mean anything.',
        expectedAnswerShape:
          'Two named people (or two named functions with named heads). If "everyone wins," ' +
          'the change is too small or the sponsor is avoiding politics.',
      },
      {
        id: 'baseline-source',
        text: 'What does the sponsor measure today, and where does that number come from?',
        why:
          'Locks the baseline source before scope discussion. Without a source, ' +
          'targets are aspirational and Phase 3 has nothing to verify against.',
        expectedAnswerShape:
          'A current numeric value tied to a specific system or report ' +
          '(e.g., "NICE WFM dashboard, Q1 2026 average") — not a remembered figure.',
      },
      {
        id: 'why-now',
        text: "What's the trigger — why is this the right program to fund right now?",
        why:
          'Anchors urgency to a real event (board commitment, regulatory deadline, ' +
          'competitive pressure, contract renewal). Charters with no urgency become ' +
          'orphaned when budget tightens.',
        expectedAnswerShape:
          'A concrete event with a date or window. "We always wanted to do this" is a fail.',
      },
      {
        id: 'sponsor-time-committed',
        text:
          'How much of the sponsor’s personal calendar does this get over the next 90 days?',
        why:
          'Phantom sponsorship is the #1 charter failure mode. If the sponsor cannot ' +
          'commit hours, the charter is delegated and will stall at the first decision.',
        expectedAnswerShape:
          'Specific cadence — e.g., "weekly 30-min steer + monthly 90-min review." ' +
          'Vague answers ("as needed") indicate phantom sponsorship.',
      },
    ],
    converge: [
      {
        id: 'cut-fifty-percent',
        text:
          'If we cut scope by 50% tomorrow, what stays? What is the one outcome that ' +
          'would still make this program worth doing?',
        why:
          'Forces priority. Charters that cannot survive a 50% cut are wishlists, ' +
          'not programs.',
        expectedAnswerShape:
          'A single outcome the sponsor would defend if everything else fell off. ' +
          '"All of it" is not an answer.',
      },
      {
        id: 'smallest-useful-version',
        text: "What's the smallest version of this that's still useful in production?",
        why:
          'Anti-bloat. Compresses the charter to its irreducible value before P3 expansion.',
      },
      {
        id: 'sponsor-three-month-fear',
        text: 'What is the sponsor going to lose sleep over three months from now?',
        why:
          'Surfaces the real risk anchor — usually the sponsor’s reputation or political ' +
          'cover. Aligns Phase 3/4 risk work to what the sponsor actually cares about.',
      },
      {
        id: 'value-mechanism',
        text:
          'How does the dollar value actually materialize — what behavior changes, ' +
          'and how do we measure it?',
        why:
          'Distinguishes a testable value hypothesis from a wishful number. ' +
          'Without a mechanism, P6 outcomes attestation becomes performative.',
      },
    ],
    close: [
      {
        id: 'signature-authority',
        text:
          'Who signs the charter, and what authority does that person have to commit ' +
          'budget, headcount, and stakeholder access?',
        why:
          'A charter signed by someone without authority is theatre. ' +
          'Verify approval_authority=sponsor on the persons record before close.',
      },
      {
        id: 'succession',
        text: 'If the sponsor leaves the company tomorrow, who owns this program?',
        why:
          'Single-sponsor programs are fragile. A named succession owner reduces ' +
          'the risk of charter collapse mid-program.',
      },
      {
        id: 'kill-criterion',
        text: 'What is the kill criterion — what would have to be true for us to stop?',
        why:
          'Without a kill criterion, programs drift into zombie status. Anchoring ' +
          'one in the charter gives Maestro and Nexus license to flag drift later.',
        expectedAnswerShape:
          'A measurable signal: "if pilot adoption stays under 30% after 8 weeks." ' +
          'Vague answers ("if it’s clearly not working") are not kill criteria.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'everywhere-charter',
      label: 'The Everywhere Charter',
      detectionHint:
        'Charter prose mentions more than three functional areas, or scope is "the ' +
        'organization" / "all of customer service" / "across the business" with no ' +
        'further qualifier.',
      whatToFlag:
        'Tell the user the charter currently spans too many functions to advance into ' +
        'Discovery — Phase 3 will fragment into parallel investigations and the ' +
        'sponsor will lose focus. Surface the specific functional areas mentioned.',
      mitigation:
        'Push for one primary function with at most one adjacent dependency named. ' +
        'Other functions become explicit Phase 5 or Phase 6 expansion candidates, not ' +
        'in-scope here.',
    },
    {
      id: 'wishlist-baseline',
      label: 'The Wishlist Baseline',
      detectionHint:
        'Target value stated without a current value, OR current value stated without ' +
        'a measurement source, OR both numbers given without a method ' +
        '("we estimate average wait time is around 4 minutes").',
      whatToFlag:
        'The baseline is wishful. Tell the user explicitly: ' +
        '"We have a target but no source for the current value — Phase 3 will not be ' +
        'able to verify movement against it." Refuse to advance without addressing.',
      mitigation:
        'Push for a specific system or report as the baseline source ' +
        '(NICE WFM, Tableau dashboard, finance close, etc.) and a measurement method ' +
        '(daily average, weekly p95, etc.).',
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
        'Reframe in problem language. The charter should name a measurable behavior ' +
        'change, not a tool. Tools belong in P3 design options.',
    },
    {
      id: 'committee-charter',
      label: 'The Committee Charter',
      detectionHint:
        'More than one sponsor named, OR charter has multiple co-owners with shared ' +
        'authority, OR sign-off requires a steering committee vote.',
      whatToFlag:
        'Surface that authority is fragmented. Multi-sponsor programs cannot make ' +
        'fast decisions in P3/P4 and stall at gate transitions.',
      mitigation:
        'Push for one accountable sponsor. Other interested parties become advisors ' +
        'or stakeholders, not co-sponsors.',
    },
    {
      id: 'no-dissenter',
      label: 'The Conflict-Free Charter',
      detectionHint:
        'When asked who loses if this succeeds, the user says "no one" or "everyone wins."',
      whatToFlag:
        'Real change has losers. A charter with no named dissenter is either too ' +
        'small to matter or the sponsor is hiding the politics — both are P3/P4 risk.',
      mitigation:
        'Probe for the dissenter: which vendor relationship dies, which team loses ' +
        'headcount, which exec loses oversight, which process owner loses control. ' +
        'Name them in the charter risk register.',
    },
    {
      id: 'orphaned-kill-criterion',
      label: 'The Open-Ended Charter',
      detectionHint: 'No kill criterion stated, or the kill criterion is unmeasurable.',
      whatToFlag:
        'Charters without a kill criterion drift into zombie status when results ' +
        'disappoint. Tell the user the charter is missing a stop signal.',
      mitigation:
        'Insist on a measurable kill criterion before close — adoption < X by week N, ' +
        'baseline movement < Y by quarter Q, etc.',
    },
  ],

  coachingArc: {
    entry:
      'Verify the sponsor is real before discussing scope. Surface dissenters in the ' +
      'first two turns. Push baseline rigor before letting scope discussions take over.',
    midPhase:
      'Pressure-test scope: force the 50% cut, the smallest-useful-version, the ' +
      'three-month fear. Drive toward a value hypothesis with mechanism, not just ' +
      'a dollar amount. Flag any anti-pattern signal the moment it appears — do not ' +
      'wait for the user to ask.',
    exit:
      'Validate signature authority on the persons record. Confirm sponsor calendar ' +
      'commitment, succession plan, kill criterion. The exit posture is gate-locking, ' +
      'not consultative — refuse to call the charter done if hard items are unmet.',
  },

  dependencies: {
    requiresFromPrior: [
      'P0/P1: pattern match and classification (so the charter draws on the right pattern playbook)',
      'P0/P1: initial value hypothesis seed and stakeholder shortlist',
      'P0/P1: tenant/client context — industry, vertical, prior programs in flight',
    ],
    producesForNext: [
      'Baseline KPI with source — Phase 3 Discovery measures movement against this',
      'Sponsor commitment and succession owner — Phase 3 stakeholder interview list draws on these',
      'Scope boundary — Phase 3 investigation must stay within',
      'Kill criterion — gives Maestro and Nexus license to flag drift in P3/P4',
      'Named dissenter — Phase 3 stakeholder interviews must include them, not avoid them',
    ],
  },
};
