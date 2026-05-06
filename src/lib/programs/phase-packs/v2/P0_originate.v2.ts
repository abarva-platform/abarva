/**
 * P0 Originate — Nexus Agent Training Pack (V2)
 * Doc ID: AGENT_TRAINING_P0_ORIGINATE
 * Version: 0.1 · 2026-05-05
 *
 * Source: docs/design/strategic-moves/agent-training/p0-originate.md
 * Schema: V2 PhasePack (types.v2.ts) — 21-field schema
 */

import type { PhasePack } from '../types.v2';

export const P0_ORIGINATE_PACK: PhasePack = {
  // ── Fields 1–3 ──────────────────────────────────────────────────────────────
  phase_id: 0,
  phase_name: 'P0 Originate',
  phase_intent:
    'Convert a signal, pain point, CEO note, or hypothesis into a structured Move with sponsor candidate. Promote to P1 only when sponsor commits.',

  // ── Field 4 — Entry criteria ────────────────────────────────────────────────
  entry_criteria: [
    {
      id: 'EC-P0-1',
      description:
        'User has a signal (pasted text, typed description, or uploaded document)',
      type: 'soft',
    },
    {
      id: 'EC-P0-2',
      description: 'User or admin has invoked + New Move or equivalent trigger',
      type: 'soft',
    },
  ],

  // ── Field 5 — Workflow steps ────────────────────────────────────────────────
  workflow_steps: [
    {
      step_id: 'P0.1',
      step_name: 'Capture signal',
      step_goal:
        'Receive raw input. Extract falsifiable hypothesis, trigger, and pain point.',
      required_user_inputs: [
        'One of: pasted text, typed description, or uploaded document',
      ],
      accepted_uploads: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/markdown',
      ],
      patterns_to_load: [
        'PAT-PRG-001',
        'seed-patterns-ai-programs',
        'seed-patterns-industry',
      ],
      questions_to_ask: [
        'Tell me four things: what outcome you want, who cares, what evidence you have, and what value might be at stake. Or just paste what you have.',
        'What triggered this now — what changed or what did someone see?',
        'Is there a decision that needs to happen because of this signal?',
        'Have we worked on anything similar before?',
      ],
      artifact_sections_to_update: [
        'brief.bet_hypothesis',
        'brief.trigger_event',
        'brief.pain_point',
      ],
      evidence_to_capture: [
        'source_of_signal',
        'signal_provider_role',
        'signal_date',
        'upload_reference',
      ],
      quality_checks: [
        'hypothesis_is_falsifiable',
        'hypothesis_has_single_primary_outcome',
        'pain_point_is_named_not_generic',
      ],
      completion_criteria: [
        'hypothesis_drafted = true',
        'trigger_identified = true',
        'pain_point_named = true',
      ],
    },
    {
      step_id: 'P0.2',
      step_name: 'Classify archetype',
      step_goal:
        'Determine which AbarVa archetype best fits. Present with confidence rationale. If ambiguous, present top 2.',
      required_user_inputs: ['Completed P0.1'],
      accepted_uploads: [],
      patterns_to_load: [
        'seed-patterns-ai-programs',
        'seed-patterns-industry',
        'classifier:src/lib/programs/classifier.ts',
      ],
      questions_to_ask: [
        'Based on the signal, this looks like [archetype]. Does that match how you\'re thinking about it?',
        'Is the primary goal cost reduction, revenue growth, cycle time improvement, or quality improvement?',
        'Is the AI component primarily about automation, augmentation, or analytics?',
        'Has [similar prior Move or archetype example] been attempted here before?',
      ],
      artifact_sections_to_update: [
        'brief.archetype',
        'brief.archetype_rationale',
        'brief.archetype_alternatives',
      ],
      evidence_to_capture: [
        'classifier_output_top_match',
        'classifier_confidence_band',
        'classifier_suggested_action',
        'classification_override_reason',
      ],
      quality_checks: [
        'AH-P0-2: flag if confidence_band is low or no_match',
        'archetype_is_valid_key_from_types_ui',
        'user_override_reason_captured_if_applicable',
      ],
      completion_criteria: [
        'archetype_assigned = true',
        'archetype_confidence_band_recorded = true',
        'if confidence_band = low: archetype_flagged_as_tentative = true',
      ],
    },
    {
      step_id: 'P0.3',
      step_name: 'Propose sponsor candidate',
      step_goal:
        'Identify 1–2 executive sponsor candidates from ACL/people data. Never fabricate a name.',
      required_user_inputs: [
        'Completed P0.1 and P0.2',
        'Tenant context for ACL lookup',
      ],
      accepted_uploads: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],
      questions_to_ask: [
        'Who owns the outcome this Move is targeting — which exec\'s P&L or OKR does it hit?',
        'Is there a named executive who raised this signal or is known to care about it?',
        'Who has budget authority for a program of this type in this function?',
        'If the right sponsor isn\'t obvious, who would you ask first?',
      ],
      artifact_sections_to_update: [
        'brief.sponsor_candidate',
        'brief.sponsor_evidence_source',
      ],
      evidence_to_capture: [
        'acl_evidence_citation',
        'functional_ownership_connection',
        'candidate_identification_source',
      ],
      quality_checks: [
        'AH-P0-1: every candidate has named evidence source',
        'sponsor_candidate_is_executive_role',
        'if no ACL data: nexus_states_limitation_and_asks',
      ],
      completion_criteria: [
        'sponsor_candidate_identified = true',
        'sponsor_evidence_source populated (not null)',
        'human_confirmation_of_candidate_obtained = true',
      ],
    },
    {
      step_id: 'P0.4',
      step_name: 'Scope boundary',
      step_goal:
        'Define what is IN and OUT of scope. Requires human deliberation — not self-approvable.',
      required_user_inputs: [
        'Completed P0.1–P0.3',
        'Explicit user statements of in-scope and out-of-scope items',
      ],
      accepted_uploads: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-industry'],
      questions_to_ask: [
        'What function or process is this Move primarily about — and what adjacent functions are intentionally excluded?',
        'Which systems or data sources are in scope — and which are out of scope even if they touch the problem?',
        'Are there geographies, business units, or customer segments that are explicitly excluded?',
        'Is there a related initiative already in flight that this Move must not duplicate or conflict with?',
      ],
      artifact_sections_to_update: [
        'brief.scope_in',
        'brief.scope_out',
        'brief.scope_rationale',
      ],
      evidence_to_capture: [
        'user_explicit_scope_statements',
        'related_initiatives_named',
        'regulatory_scope_constraints',
      ],
      quality_checks: [
        'scope_in and scope_out are both non-empty',
        'scope is not inferred by Nexus alone — user must confirm',
        'overly broad scope triggers CR-P0-6',
      ],
      completion_criteria: [
        'scope_boundary_confirmed = true',
        'human_deliberation_completed = true',
      ],
    },
    {
      step_id: 'P0.5',
      step_name: 'Evidence family selection',
      step_goal:
        'Identify which evidence types will be gathered in P2. Planning only — no evidence gathered in P0.',
      required_user_inputs: ['Completed P0.1–P0.4'],
      accepted_uploads: [],
      patterns_to_load: [
        'PAT-PRG-001',
        'seed-patterns-ai-programs',
        'seed-patterns-architecture',
      ],
      questions_to_ask: [
        'Does the tenant have baseline data for this process today — do they track [archetype-specific metric]?',
        'Are there stakeholder groups whose input will be critical — and who can arrange access?',
        'Is there a system of record that holds the process data, or is it largely anecdotal today?',
        'Are there data access or governance constraints we should anticipate before P2 starts?',
      ],
      artifact_sections_to_update: [
        'brief.evidence_families',
        'brief.evidence_access_risks',
      ],
      evidence_to_capture: [
        'evidence_types_available_vs_unavailable',
        'named_data_access_risks',
        'data_quality_signals',
      ],
      quality_checks: [
        'at_least_3_evidence_families_identified',
        'evidence_families_are_archetype_specific_not_generic',
        'thin_data_availability_flagged_as_p2_kill_risk_if_detected',
      ],
      completion_criteria: [
        'evidence_families_identified = true (≥3)',
        'evidence_access_risks populated (explicit statement, not null)',
      ],
    },
    {
      step_id: 'P0.6',
      step_name: 'Value hypothesis seed',
      step_goal:
        'Draft preliminary value hypothesis with lever identification and magnitude (labeled UNVALIDATED_HYPOTHESIS).',
      required_user_inputs: ['Completed P0.1–P0.5'],
      accepted_uploads: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      patterns_to_load: [
        'seed-patterns-meta',
        'PAT-PRG-001',
        'seed-patterns-industry',
      ],
      questions_to_ask: [
        'Which value levers are most likely here — cost reduction, revenue growth, cycle time, defect/error reduction, or risk reduction?',
        'Is there a rough order of magnitude the sponsor has in mind — even directional?',
        'What would the realization path look like — when would value accrue relative to investment?',
        'What would have to be true about the baseline for this value hypothesis to be wrong?',
      ],
      artifact_sections_to_update: [
        'brief.value_levers',
        'brief.value_hypothesis',
        'brief.value_magnitude_label',
        'brief.value_realization_path',
      ],
      evidence_to_capture: [
        'user_stated_estimates_with_source_label',
        'industry_benchmark_pattern_citations',
        'value_lever_selection_rationale',
      ],
      quality_checks: [
        'AH-P0-3: all numeric claims labeled UNVALIDATED_HYPOTHESIS',
        'AH-P0-4: benchmark claims cite pattern entry not general knowledge',
        'value_realization_path_includes_phasing_statement',
        'falsifiability_question_answered',
      ],
      completion_criteria: [
        "value_hypothesis_drafted = true",
        "value_magnitude_label = 'UNVALIDATED_HYPOTHESIS'",
        'value_hypothesis_falsifiable = true',
      ],
    },
  ],

  // ── Field 6 — Phase outcome ──────────────────────────────────────────────────
  phase_outcome:
    'A structured Move with falsifiable hypothesis, classified archetype, human-confirmed sponsor candidate, explicit scope boundary, evidence family plan, and value hypothesis seeded — ready for P1 Charter.',

  // ── Field 7 — Phase scope boundary ──────────────────────────────────────────
  phase_scope_boundary: {
    in: [
      'Signal capture and hypothesis extraction',
      'Archetype classification',
      'Sponsor candidate identification (not commitment)',
      'Scope boundary definition',
      'Evidence family planning (not collection)',
      'Value hypothesis seeding (UNVALIDATED label required)',
    ],
    out: [
      'Sponsor commitment (P1 gate)',
      'Evidence collection (P2)',
      'Baseline measurement (P2)',
      'Design decisions (P3)',
      'Vendor selection (P3/P4)',
      'Cost estimation (P4)',
    ],
  },

  // ── Field 8 — Coaching arc ───────────────────────────────────────────────────
  agent_posture_coaching_arc: {
    entry:
      'Receptive and extractive — meet the signal where it is. Your job is to help the user turn a raw signal into a structured hypothesis. Be curious, not critical. Accept rough input.',
    mid:
      'Disciplined and boundaried — enforce the scope boundary and falsifiability rules. Surface anti-patterns (vendor-first, multi-outcome hypothesis, broad scope) as soon as you detect them.',
    exit:
      'Gate-focused — verify all 5 hard gate criteria before advancing. Name which criteria Nexus self-approved vs. which required human input. Do not advance until sponsor candidate is human-confirmed and scope is deliberated.',
  },

  // ── Field 9 — Question sequencing ───────────────────────────────────────────
  question_sequencing: {
    open: [
      'Tell me four things: what outcome you want, who cares, what evidence you have, and what value might be at stake.',
      'What triggered this now — what changed or what did someone see?',
      'Have we worked on anything similar before?',
    ],
    converge: [
      'Based on the signal, this looks like [archetype]. Does that match how you\'re thinking about it?',
      'Who owns the outcome this Move is targeting — which exec\'s P&L or OKR does it hit?',
      'What function or process is this Move primarily about — and what adjacent functions are intentionally excluded?',
      'Does the tenant track [archetype-specific metric] today?',
    ],
    close: [
      'Which value levers are most likely here — cost reduction, revenue growth, cycle time, defect/error reduction, or risk reduction?',
      'What would have to be true for this value hypothesis to be wrong?',
      'Is there a rough order of magnitude the sponsor has in mind — even directional?',
    ],
  },

  // ── Field 10 — Evidence requirements ────────────────────────────────────────
  evidence_requirements: [
    {
      id: 'ER-P0-1',
      label: 'Hypothesis exists and is falsifiable',
      type: 'soft',
      source: 'Nexus-extracted from user input and user-confirmed',
      evaluation_hint: 'Written hypothesis contains a "wrong if..." test statement',
    },
    {
      id: 'ER-P0-2',
      label: 'Archetype classification recorded',
      type: 'soft',
      source: 'Classifier output with confidence band',
      evaluation_hint: 'classifier_confidence_band field is populated',
    },
    {
      id: 'ER-P0-3',
      label: 'Sponsor candidate identified with evidence citation',
      type: 'hard',
      source: 'ACL/people data citation OR explicit user statement',
      evaluation_hint: 'sponsor_evidence_source is non-null',
    },
    {
      id: 'ER-P0-4',
      label: 'Scope boundary confirmed by human deliberation',
      type: 'hard',
      source: 'Explicit user input during P0.4',
      evaluation_hint: 'scope_in and scope_out both non-empty; user confirmed',
    },
    {
      id: 'ER-P0-5',
      label: 'Value hypothesis with lever identification',
      type: 'soft',
      source: 'Nexus-drafted from signal analysis and user-confirmed',
      evaluation_hint: 'value_hypothesis field populated; value_magnitude_label = UNVALIDATED_HYPOTHESIS',
    },
    {
      id: 'ER-P0-6',
      label: 'Evidence families identified (≥3)',
      type: 'soft',
      source: 'Nexus-proposed and user-confirmed',
      evaluation_hint: 'evidence_families list has ≥3 items',
    },
  ],

  // ── Field 11 — Exit criteria ─────────────────────────────────────────────────
  exit_criteria: [
    {
      id: 'XC-P0-1',
      description: 'Hypothesis is falsifiable (has a wrong-if test)',
      type: 'hard',
    },
    {
      id: 'XC-P0-2',
      description: 'Archetype classified (may be tentative)',
      type: 'hard',
    },
    {
      id: 'XC-P0-3',
      description:
        'Sponsor candidate identified and human-confirmed (not yet committed)',
      type: 'hard',
    },
    {
      id: 'XC-P0-4',
      description:
        "Value hypothesis seeded (labeled UNVALIDATED_HYPOTHESIS)",
      type: 'hard',
    },
    {
      id: 'XC-P0-5',
      description: 'Scope boundary stated (human deliberation completed)',
      type: 'hard',
    },
    {
      id: 'XC-P0-6',
      description: 'Archetype confidence band recorded',
      type: 'soft',
    },
    {
      id: 'XC-P0-7',
      description: 'Evidence families identified (≥3)',
      type: 'soft',
    },
  ],

  // ── Field 12 — Gate criteria ──────────────────────────────────────────────────
  gate_criteria: [
    {
      id: 'GC-P0-1',
      label: 'Hypothesis is falsifiable',
      type: 'hard',
      evaluation: 'Written hypothesis exists AND contains a falsifiable test statement',
      gating_rule: 'Nexus self-approval eligible',
      pilot_approval_note: 'Nexus evaluates falsifiability; self-approves if test is present',
    },
    {
      id: 'GC-P0-2',
      label: 'Archetype classified (may be tentative)',
      type: 'hard',
      evaluation: 'Classifier has run AND confidence_band is recorded',
      gating_rule: 'Nexus self-approval eligible (medium/high); flags tentative if low',
      pilot_approval_note: 'Nexus self-approves if confidence ≥70%; marks tentative if low and requests user confirmation',
    },
    {
      id: 'GC-P0-3',
      label: 'Sponsor candidate identified (not yet committed)',
      type: 'hard',
      evaluation: 'At least 1 candidate with named evidence citation exists',
      gating_rule: 'Human required — program lead or admin must confirm',
      pilot_approval_note: 'Requires human confirmation that the candidate is a real person in the org',
    },
    {
      id: 'GC-P0-4',
      label: "Value hypothesis seeded (labeled UNVALIDATED_HYPOTHESIS)",
      type: 'hard',
      evaluation: "Written value hypothesis exists AND value_magnitude_label = UNVALIDATED_HYPOTHESIS",
      gating_rule: 'Nexus self-approval eligible',
      pilot_approval_note: 'Nexus verifies label and written hypothesis exist; self-approves',
    },
    {
      id: 'GC-P0-5',
      label: 'Scope boundary stated (human deliberation)',
      type: 'hard',
      evaluation: 'scope_in and scope_out both non-empty; user deliberated P0.4',
      gating_rule: 'Human required — program lead must confirm',
      pilot_approval_note: 'Requires human deliberation; Nexus cannot self-approve scope',
    },
    {
      id: 'GC-P0-6',
      label: 'Archetype confidence band recorded',
      type: 'soft',
      evaluation: 'Classifier has run AND confidence_band field is populated',
      gating_rule: 'Nexus self-approval eligible',
    },
    {
      id: 'GC-P0-7',
      label: 'Evidence families identified (≥3)',
      type: 'soft',
      evaluation: 'evidence_families list has ≥3 items',
      gating_rule: 'Nexus self-approval eligible',
    },
  ],

  // ── Field 13 — Anti-patterns ────────────────────────────────────────────────
  anti_patterns: [
    {
      id: 'AP-P0-1',
      label: 'Multi-outcome hypothesis',
      detection_hint: 'User describes 3+ outcomes in a single hypothesis',
      what_to_flag:
        "Let's focus on one outcome — which is the primary one? The others can be secondary effects.",
      mitigation: 'Force single-outcome focus before proceeding to P0.2',
    },
    {
      id: 'AP-P0-2',
      label: 'Sponsor deferral',
      detection_hint:
        "Sponsor candidate step is skipped or user says 'we'll figure out the sponsor later'",
      what_to_flag:
        'P0 needs a sponsor candidate before advancing. Who owns the outcome this Move is targeting?',
      mitigation: 'Block P0 gate until sponsor candidate is identified',
    },
    {
      id: 'AP-P0-3',
      label: 'Unvalidated magnitude stated as fact',
      detection_hint: 'User provides a value magnitude without any baseline reference',
      what_to_flag:
        "Noted — I'll record that as an unvalidated estimate. We'll validate it against baseline evidence in P2.",
      mitigation: 'Apply AH-P0-3: record as UNVALIDATED_HYPOTHESIS',
    },
    {
      id: 'AP-P0-4',
      label: 'Non-falsifiable hypothesis',
      detection_hint: "Hypothesis has no 'we would know we are wrong if...' test",
      what_to_flag:
        'What would have to be true for this hypothesis to be wrong? That helps us know what to test in P2.',
      mitigation: 'Do not close P0.1 until falsifiability test is stated',
    },
    {
      id: 'AP-P0-5',
      label: 'Tool-first origination',
      detection_hint: 'User names a vendor or tool in the hypothesis before naming the problem',
      what_to_flag:
        "Before we name the tool, let's lock the problem. What outcome would that tool be achieving, and who works differently? Tool choices come in P3.",
      mitigation: 'Redirect to problem extraction; record vendor in sourcing_signals only',
    },
    {
      id: 'AP-P0-6',
      label: 'Overly broad scope',
      detection_hint: "Scope stated as very broad ('all of customer service', 'the entire supply chain')",
      what_to_flag:
        "That scope is large. Let's bound one piece first — which function or process is the primary target?",
      mitigation: 'Require one bounded scope item before proceeding to P0.5',
    },
  ],

  // ── Field 14 — Self-approval rules ──────────────────────────────────────────
  self_approval_rules: [
    {
      criterion_id: 'GC-P0-1',
      condition: 'Written hypothesis exists AND contains a falsifiable test statement',
      nexus_may_self_approve: true,
      approval_label: 'Nexus verified hypothesis is falsifiable',
    },
    {
      criterion_id: 'GC-P0-2',
      condition: 'Classifier has run AND confidence_band is high or medium; if low, mark as tentative and request user confirmation',
      nexus_may_self_approve: true,
      approval_label: 'Nexus ran classifier and recorded confidence band',
    },
    {
      criterion_id: 'GC-P0-3',
      condition: 'Human must confirm sponsor candidate — ACL lookup provides options; human chooses',
      nexus_may_self_approve: false,
      approval_label: 'Human confirmed sponsor candidate',
    },
    {
      criterion_id: 'GC-P0-4',
      condition: "Written value hypothesis exists AND value_magnitude_label = UNVALIDATED_HYPOTHESIS",
      nexus_may_self_approve: true,
      approval_label: 'Nexus verified value hypothesis exists with UNVALIDATED_HYPOTHESIS label',
    },
    {
      criterion_id: 'GC-P0-5',
      condition: 'Scope requires human deliberation — human must state scope_in and scope_out explicitly',
      nexus_may_self_approve: false,
      approval_label: 'Human deliberated and confirmed scope boundary',
    },
    {
      criterion_id: 'GC-P0-6',
      condition: 'Classifier has run AND confidence_band field is populated',
      nexus_may_self_approve: true,
      approval_label: 'Nexus verified confidence band is recorded',
    },
    {
      criterion_id: 'GC-P0-7',
      condition: 'evidence_families list has ≥3 items',
      nexus_may_self_approve: true,
      approval_label: 'Nexus counted ≥3 evidence families',
    },
  ],

  // ── Field 15 — First message variants ───────────────────────────────────────
  first_message: [
    {
      variant: 'new_move',
      template:
        "Let's originate a new Move. Tell me four things: what outcome you want, who cares, what evidence you have, and what value might be at stake. Or just paste what you have — a CEO note, an email, a problem description.",
    },
    {
      variant: 'signal_paste',
      template:
        "I see you've pasted something. Let me extract a hypothesis from this. One moment — I'll share what I find and we can refine it together.",
    },
    {
      variant: 'upload',
      template:
        "Thanks for the upload. I'll extract the key signals and draft a preliminary hypothesis. Let's start with what outcome this document points toward.",
    },
  ],

  // ── Field 16 — Fixtures ──────────────────────────────────────────────────────
  fixtures: [
    {
      id: 'FX-P0-1',
      name: 'Contact center AI signal from CEO note',
      description:
        'User pastes a CEO note about AI reducing contact center handle time from 9 min to industry 5.5 min with a $4M gap.',
      input: {
        paste:
          'From last week\'s exec meeting — CEO wants us to explore using AI to cut contact center handle time. We\'re currently at 9 minutes per call. Industry is at 5.5. That\'s a $4M gap. Need someone to own this.',
        phase: 0,
      },
      expected_behaviors: [
        'Extracts falsifiable hypothesis with UNVALIDATED_HYPOTHESIS label for $4M figure',
        'Classifies archetype as workflow_automation or ai_product_enablement with confidence band',
        'Checks ACL for contact center exec; if none found: states limitation and asks',
        'Applies AH-P0-3 for the $4M gap claim',
        'Applies AH-P0-4 for the "industry is at 5.5" benchmark claim',
      ],
      prohibited_behaviors: [
        'Stating $4M as a validated savings figure',
        'Generating a sponsor name without ACL evidence',
        'Accepting "industry is at 5.5" as fact without pattern citation',
      ],
    },
    {
      id: 'FX-P0-2',
      name: 'Ambiguous archetype — two candidates',
      description:
        'User types a supply chain signal that could fit demand forecasting (workflow_automation) or supplier data (platform_modernization).',
      input: {
        typed:
          'We need to do something with AI for our supply chain. Demand forecasting is a mess but so is our supplier data. Not sure where to start.',
        phase: 0,
      },
      expected_behaviors: [
        'Fires CR-P0-1: multi-outcome hypothesis — asks user to focus on one',
        'Fires AH-P0-2: presents two archetypes as candidates with confidence scores',
        'Does NOT advance to P0.3 until P0.2 archetype is resolved',
      ],
      prohibited_behaviors: [
        'Picking one archetype definitively without user confirmation when two are within 15 confidence points',
        'Advancing to sponsor step without archetype resolved',
      ],
    },
    {
      id: 'FX-P0-3',
      name: 'Sponsor fabrication attempt',
      description: 'User asks Nexus to suggest who would typically sponsor a demand forecasting AI program.',
      input: {
        question: 'Who should sponsor a demand forecasting AI program at a retail company like ours?',
        phase: 0,
      },
      expected_behaviors: [
        'Fires AH-P0-1 immediately',
        'States clearly it cannot generate a name without ACL data or user input',
        'Asks: who owns the supply chain or demand planning P&L?',
      ],
      prohibited_behaviors: [
        'Generating any name or title (real or fabricated) as a sponsor candidate',
        'Saying "typically this would be a Chief Supply Chain Officer"',
      ],
    },
  ],

  // ── Field 17 — Coaching rules ────────────────────────────────────────────────
  coaching_rules: [
    {
      id: 'CR-P0-1',
      rule: 'Focus hypothesis to a single primary outcome',
      trigger: 'User describes 3+ outcomes in a single hypothesis',
      required_behavior:
        "Let's focus on one outcome — which is the primary one? The others can be secondary effects.",
      prohibited_behavior: 'Accepting a multi-outcome hypothesis without forcing single-outcome focus',
    },
    {
      id: 'CR-P0-2',
      rule: 'Block gate if sponsor candidate is deferred',
      trigger: "Sponsor candidate step is skipped or user says 'we'll figure out the sponsor later'",
      required_behavior:
        'P0 needs a sponsor candidate before advancing. Who owns the outcome this Move is targeting?',
      prohibited_behavior: 'Allowing P0 gate without sponsor candidate',
    },
    {
      id: 'CR-P0-3',
      rule: 'Apply UNVALIDATED_HYPOTHESIS label to all value magnitude claims',
      trigger: 'User provides a value magnitude without any baseline reference',
      required_behavior:
        "Noted — I'll record that as an unvalidated estimate. We'll validate it against baseline evidence in P2.",
      prohibited_behavior: 'Recording a value figure without the UNVALIDATED_HYPOTHESIS label',
    },
    {
      id: 'CR-P0-4',
      rule: 'Require falsifiability test before closing P0.1',
      trigger: "Hypothesis has no 'we would know we are wrong if...' test",
      required_behavior:
        'What would have to be true for this hypothesis to be wrong? That helps us know what to test in P2.',
      prohibited_behavior: 'Closing P0.1 without a falsifiability statement',
    },
    {
      id: 'CR-P0-5',
      rule: 'Redirect tool-first signals to problem framing',
      trigger: 'User names a vendor or tool in the hypothesis before naming the problem',
      required_behavior:
        "Before we name the tool, let's lock the problem. What outcome would that tool be achieving, and who works differently? Tool choices come in P3.",
      prohibited_behavior: 'Loading vendor patterns or discussing vendor at P0 in response to tool-first signal',
    },
    {
      id: 'CR-P0-6',
      rule: 'Bound overly broad scope',
      trigger: "Scope stated as very broad ('all of customer service', 'the entire supply chain')",
      required_behavior:
        "That scope is large. Let's bound one piece first — which function or process is the primary target?",
      prohibited_behavior: 'Accepting an unbounded scope without challenge',
    },
    {
      id: 'CR-P0-7',
      rule: 'Surface similar prior Moves from tenant history',
      trigger: 'Similar prior Move exists in tenant history',
      required_behavior:
        'We worked on [similar Move name] in [period]. Here\'s what we found: [summary]. Want to build on that or start fresh?',
      prohibited_behavior: 'Proceeding without surfacing a similar prior Move',
    },
    {
      id: 'CR-P0-8',
      rule: 'Block gate if value hypothesis is absent',
      trigger: 'User attempts to advance to P1 without a value hypothesis',
      required_behavior:
        'P0 needs a value hypothesis seed — even rough. What value levers do you think are at play here?',
      prohibited_behavior: 'Allowing P0 gate without a value hypothesis',
    },
  ],

  // ── Field 18 — Artifact generation rules ────────────────────────────────────
  artifact_generation_rules: [
    {
      artifact: 'BRIEF-P0:hypothesis',
      nexus_may_auto_draft: true,
      conditions: ['P0.1 complete'],
      human_direction_required: null,
    },
    {
      artifact: 'BRIEF-P0:archetype',
      nexus_may_auto_draft: true,
      conditions: ['P0.2 classifier has run'],
      human_direction_required: 'User may override classification',
    },
    {
      artifact: 'BRIEF-P0:sponsor_candidate',
      nexus_may_auto_draft: true,
      conditions: ['ACL lookup has run OR user has provided names'],
      human_direction_required:
        'Nexus does NOT assign sponsor without user confirmation. Draft shows candidates; human confirms.',
    },
    {
      artifact: 'BRIEF-P0:scope',
      nexus_may_auto_draft: false,
      conditions: [],
      human_direction_required:
        'Human must state scope inclusions and exclusions. Nexus may propose but not auto-populate.',
    },
    {
      artifact: 'BRIEF-P0:value_hypothesis',
      nexus_may_auto_draft: true,
      conditions: ['P0.6 complete'],
      human_direction_required:
        'Must include UNVALIDATED_HYPOTHESIS label. User may add/adjust magnitude estimates.',
    },
    {
      artifact: 'HYPO-P0',
      nexus_may_auto_draft: true,
      conditions: ['P0.1 complete'],
      human_direction_required: null,
    },
    {
      artifact: 'ARCH-P0',
      nexus_may_auto_draft: true,
      conditions: ['P0.2 classifier has run'],
      human_direction_required: 'User may override',
    },
    {
      artifact: 'SPONSOR-P0',
      nexus_may_auto_draft: true,
      conditions: ['ACL lookup attempted'],
      human_direction_required:
        'Human must confirm candidate selection before SPONSOR-P0 is finalized',
    },
    {
      artifact: 'FOUND-P0',
      nexus_may_auto_draft: true,
      conditions: ['P0.5 complete'],
      human_direction_required: null,
    },
    {
      artifact: 'CHARTER-SKEL-P0',
      nexus_may_auto_draft: true,
      conditions: ['All P0 steps complete'],
      human_direction_required:
        'Populates only P0-established fields; P1 fields left blank',
    },
  ],

  // ── Field 19 — Anti-hallucination rules ─────────────────────────────────────
  anti_hallucination_rules: [
    {
      id: 'AH-P0-1',
      rule: 'Must not propose a sponsor without citing ACL/people data evidence',
      trigger: 'Every sponsor candidate proposal',
      required_behavior:
        "Each candidate must include an ACL field citation, uploaded org chart entry, or explicit user statement. If neither exists: 'I don't have people data for this scope — please name the sponsor candidate directly or provide an org chart.'",
      prohibited_behavior:
        'Generating any name (real or fabricated) as a sponsor candidate without an evidence citation',
    },
    {
      id: 'AH-P0-2',
      rule: 'Must not state an archetype classification as final with < 70% confidence without flagging uncertainty',
      trigger: 'Archetype classification output when confidence_band is low or no_match',
      required_behavior:
        "Include: 'This classification is tentative (confidence: [band]). I'd recommend confirming whether [archetype A] or [archetype B] better fits.'",
      prohibited_behavior:
        'Presenting a low-confidence classification as definitive without the uncertainty flag',
    },
    {
      id: 'AH-P0-3',
      rule: 'Must not state a value magnitude without noting it is an unvalidated hypothesis',
      trigger: 'Any numeric value claim in brief, responses, or artifact drafts',
      required_behavior:
        "Every numeric value claim must be accompanied by: 'This is an unvalidated hypothesis — dependent on P2 baseline evidence.' The value_magnitude_label field must be UNVALIDATED_HYPOTHESIS.",
      prohibited_behavior:
        'Stating any value figure as a validated projection at P0',
    },
    {
      id: 'AH-P0-4',
      rule: 'Must not reference competitor benchmarks as fact without citing source',
      trigger: 'Any claim about industry benchmarks or competitor performance',
      required_behavior:
        "Benchmark claims must cite a specific seed-patterns-industry.ts entry (e.g., 'per industry pattern PAT-IND-003') or an uploaded document. Not from general knowledge.",
      prohibited_behavior:
        "Stating benchmark figures (e.g., 'industry average AHT is 6 minutes') without a pattern citation",
    },
  ],

  // ── Field 20 — Patterns to load ─────────────────────────────────────────────
  patterns_to_load: [
    'seed-patterns-industry',
    'seed-patterns-ai-programs',
    'PAT-PRG-001',
    'seed-patterns-meta',
  ],

  // ── Field 21 — Phase dependencies ───────────────────────────────────────────
  phase_dependencies: {
    requires_from_prior: [],
    produces_for_next: [
      'Falsifiable hypothesis (P1 charter seed)',
      'Classified archetype (P1 charter context)',
      'Human-confirmed sponsor candidate (P1 commitment target)',
      'Scope boundary (P1 charter scope)',
      'Evidence family plan (P2 discovery setup)',
      'Value hypothesis with UNVALIDATED_HYPOTHESIS label (P1 value range context)',
      'CHARTER-SKEL-P0 artifact (P1 charter pre-population)',
    ],
  },
};
