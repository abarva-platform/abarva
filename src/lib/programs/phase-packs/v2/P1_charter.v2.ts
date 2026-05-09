// P1 Charter — V2 Training Pack
// T-P1 · AGENT_TRAINING_P1_CHARTER
// Schema: 21-field PhasePack V2 (types.v2.ts)

import type { PhasePack } from '../types.v2';

export const P1_CHARTER_PACK: PhasePack = {
  phase_id: 1,
  phase_name: 'P1 Charter',
  phase_intent:
    'Engage the P0 sponsor candidate on scope and governance. Produce a charter that reflects their input. P1 = sponsor named + engaged + charter signed. Financial commitment (cost, solution, timeline approval) is a P4 gate — do NOT treat charter sign-off as investment approval.',

  entry_criteria: [
    {
      id: 'EC-P1-1',
      description:
        'P0 gate criteria all passed: hypothesis falsifiable, archetype classified, sponsor candidate identified (human-confirmed), value hypothesis seeded (UNVALIDATED_HYPOTHESIS), scope boundary stated',
      type: 'hard',
    },
    {
      id: 'EC-P1-2',
      description: 'Sponsor candidate is a named individual — not a role placeholder',
      type: 'hard',
    },
    {
      id: 'EC-P1-3',
      description: 'P1 Charter Draft Skeleton (CHARTER-SKEL-P0) has been produced',
      type: 'soft',
    },
  ],

  workflow_steps: [
    {
      step_id: 'P1.1',
      step_name: 'Sponsor engagement',
      step_goal: 'Confirm the P0 sponsor candidate is aware of the initiative, aligned on scope, and willing to participate in charter development. P1 does NOT require financial commitment — cost and timeline approval happen at the P4 gate after the business case is built.',
      required_user_inputs: [
        'Confirmation that sponsor has been briefed on the initiative and is engaged',
        'Sponsor\'s name and role (may carry from P0)',
      ],
      accepted_uploads: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],
      questions_to_ask: [
        'Has [sponsor candidate name] been briefed on the initiative and agreed to be the named sponsor?',
        'Is [sponsor name] the right functional owner — does this initiative sit within their P&L or OKR?',
        'Do they want to be involved in scoping and charter review, or will they review the charter at the end?',
        'Are there any concerns from the sponsor at this point — about scope, timing, or direction?',
      ],
      artifact_sections_to_update: [
        'charter.sponsor_name',
        'charter.sponsor_role',
        'charter.sponsor_engagement_note',
        'charter.sponsor_functional_ownership',
      ],
      evidence_to_capture: [
        'sponsor_briefing_method',
        'sponsor_name_and_role',
        'functional_ownership_confirmation',
        'sponsor_concerns_if_any',
      ],
      quality_checks: [
        'AH-P1-1: sponsor_engaged requires user confirmation — not assumed from P0 candidate alone',
        'Sponsor is named individual with functional ownership of this outcome',
        'CRITICAL: do NOT ask whether sponsor has approved cost or budget — that is a P4 gate question, not P1',
        'CRITICAL: do NOT conflate charter sign-off with investment approval',
      ],
      completion_criteria: [
        'sponsor_engaged = true (user confirmed sponsor is aware and participating)',
        'sponsor_name populated (named individual)',
        'sponsor_functional_ownership confirmed',
        'human_confirmation_required = true (not self-approvable)',
      ],
    },
    {
      step_id: 'P1.2',
      step_name: 'Stakeholder mapping',
      step_goal: 'Map decision rights, contributors, reviewers. Identify who can block the Move. Flag FM-2 if committee has no individual outcome owner.',
      required_user_inputs: [
        'Committed sponsor (P1.1 complete)',
        'User input on stakeholder landscape',
      ],
      accepted_uploads: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],
      questions_to_ask: [
        'Beyond the sponsor, who else must approve decisions about scope, investment, or direction for this Move?',
        'Who can block this Move — who has veto power?',
        'Is there any one person who owns the outcome — or is it shared across a committee?',
      ],
      artifact_sections_to_update: [
        'charter.stakeholder_map',
        'charter.decision_rights',
        'charter.governance_model',
      ],
      evidence_to_capture: [
        'stakeholder_names_and_roles_with_acl_citation',
        'decision_rights_per_stakeholder',
      ],
      quality_checks: [
        'AH-P1-3: no stakeholder name without ACL/people data or explicit user input',
        'AH-P1-4: cannot mark stakeholder_map_complete if decision rights unassigned',
        'FM-2: flag if no individual owns the outcome',
      ],
      completion_criteria: [
        'stakeholder_map_populated = true',
        'decision_rights_assigned = true',
        'governance_model_drafted = true',
      ],
    },
    {
      step_id: 'P1.3',
      step_name: 'Success metrics and value range',
      step_goal: 'Lock the primary success metric and produce a preliminary value range with stated assumptions. Range must not be a point estimate.',
      required_user_inputs: [
        'Sponsor input on primary success metric',
        'Any available baseline data or rough estimates',
      ],
      accepted_uploads: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'text/plain',
        'text/markdown',
      ],
      patterns_to_load: ['seed-patterns-meta', 'PAT-PRG-001', 'seed-patterns-industry'],
      questions_to_ask: [
        'What is the one metric that, if it moves, the sponsor would consider this Move a success?',
        'Can we measure that metric today — is there a baseline?',
        'What is the order of magnitude of the opportunity — low end to high end?',
        'What assumptions would have to be true for that value range to be achievable?',
      ],
      artifact_sections_to_update: [
        'charter.primary_success_metric',
        'charter.baseline_path',
        'charter.value_range',
        'charter.value_range_assumptions',
      ],
      evidence_to_capture: [
        'baseline_data_source_or_tbd_statement',
        'value_range_input_source',
        'stated_assumptions',
      ],
      quality_checks: [
        'AH-P1-2: reframe point estimates as ranges with assumptions',
        'primary_metric_is_measurable_not_subjective',
        'value_magnitude_label = PRELIMINARY_ESTIMATE',
      ],
      completion_criteria: [
        'primary_success_metric_defined = true',
        'baseline_path_stated = true',
        'value_range_locked = true (range + assumptions, not a point estimate)',
        "value_range_label = 'PRELIMINARY_ESTIMATE'",
      ],
    },
    {
      step_id: 'P1.4',
      step_name: 'Charter document draft',
      step_goal: 'Produce the charter artifact: all 11 sections present. Problem statement, sponsor, stakeholders, scope, metrics, value hypothesis, governance.',
      required_user_inputs: ['Completed P1.1–P1.3'],
      accepted_uploads: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Should I draft the charter now from what we have established in P1.1–P1.3?',
        'Are there sections where you want to add context before I draft?',
        'Who will review this charter before the sponsor signs?',
      ],
      artifact_sections_to_update: ['CHARTER-P1'],
      evidence_to_capture: [
        'charter_version_and_draft_date',
        'auto_drafted_vs_user_provided_sections',
      ],
      quality_checks: [
        'all_11_charter_sections_present',
        'FM-7: flag if problem statement names a vendor or tool',
        'FM-9: flag if governance model section is absent',
      ],
      completion_criteria: [
        'charter_drafted = true (all 11 sections present)',
        'charter_coherent = true',
        'charter_version_recorded = true',
      ],
    },
    {
      step_id: 'P1.5',
      step_name: 'Gate review preparation',
      step_goal: 'Self-evaluate all P1→P2 hard gate criteria. Produce gate readiness summary. Label which criteria are self-approved vs. human-confirmed.',
      required_user_inputs: [
        'Completed P1.1–P1.4',
        'Confirmation from sponsor',
      ],
      accepted_uploads: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Has the sponsor reviewed the charter — have they formally signed off?',
        'Are the key stakeholders briefed — not just mapped?',
        'Is there a confirmed path to baseline data access for P2?',
      ],
      artifact_sections_to_update: ['gate_readiness_P1', 'charter.sponsor_sign_off'],
      evidence_to_capture: [
        'gate_readiness_assessment_date',
        'per_criterion_status_evidence_and_approval_label',
      ],
      quality_checks: [
        'gate_verdict_is_unambiguous: pass | partial | fail',
        'self_approved_criteria_explicitly_labeled',
        'sponsor_confirmed_charter_is_hard_requirement',
      ],
      completion_criteria: [
        'gate_readiness_summary_produced = true',
        'all_hard_gate_criteria_evaluated = true',
        'sponsor_confirmed_charter = true (hard requirement)',
      ],
    },
  ],

  phase_outcome:
    'A sponsor-engaged charter: named functional sponsor confirmed (engaged and participating), primary success metric defined (measurable), preliminary value range (low–high with stated assumptions, labeled PRELIMINARY_ESTIMATE), scope boundary confirmed, stakeholder map with decision rights, governance model, gate readiness summary. NOTE: formal investment approval (cost + solution + timeline) is a P4 gate outcome, not P1.',

  phase_scope_boundary: {
    in: [
      'Sponsor commitment confirmation',
      'Stakeholder mapping with decision rights',
      'Success metric definition and baseline path',
      'Value range (preliminary, PRELIMINARY_ESTIMATE)',
      'Charter document (11 sections)',
      'Gate readiness summary (P1→P2)',
    ],
    out: [
      'Current-state baseline measurement (P2 scope)',
      'Root cause analysis (P2 scope)',
      'Architecture or design decisions (P3 scope)',
      'Detailed financial modeling (P4 scope)',
    ],
  },

  agent_posture_coaching_arc: {
    entry: 'Confirm sponsor engagement first — not financial commitment. Ask: has the sponsor been briefed and agreed to be the named functional owner? If they have not been engaged at all, surface it as a blocker. If they are engaged but have not yet approved cost/timeline, that is fine — that comes at P4. Do not ask about budget approval in P1.',
    mid: 'Drive stakeholder mapping and success metric. Ask one question at a time. For the value range, push for low–high with stated assumptions — never accept a point estimate without reframing. The value range is preliminary context for P2–P4, not a financial commitment.',
    exit: 'Before producing the gate readiness summary, run AH-P1-1 through AH-P1-4 checks. Confirm sponsor is engaged (not just named). Label every criterion as self-approved or human-confirmed. The gate verdict must be unambiguous. NEVER ask whether the sponsor has approved cost or budget — that question belongs at P4.',
  },

  question_sequencing: {
    open: [
      'Has [sponsor candidate name] committed to this Move?',
      'Does the sponsor have authority to approve scope changes and commit resources?',
      'What triggered the sponsor commitment?',
    ],
    converge: [
      'Who else must approve decisions about scope, investment, or direction?',
      'Is there one person who owns the outcome — or is it shared across a committee?',
      'What is the one metric that, if it moves, the sponsor would consider this a success?',
      'What is the order of magnitude of the opportunity — low end to high end?',
    ],
    close: [
      'Has the sponsor reviewed the charter and formally signed off?',
      'Are the key stakeholders briefed — not just mapped?',
      'Is there a confirmed path to the baseline data needed in P2?',
    ],
  },

  evidence_requirements: [
    {
      id: 'ER-P1-1',
      label: 'Sponsor commitment evidence',
      type: 'hard',
      source: 'Uploaded document or explicit user confirmation in current session',
      evaluation_hint: "'They will commit when we have a charter' does NOT satisfy this. Needs: signed charter, email confirmation, or recorded session capture.",
      prevents_failure_modes: ['sponsorship_gap'],
    },
    {
      id: 'ER-P1-2',
      label: 'Value range with PRELIMINARY_ESTIMATE label',
      type: 'hard',
      source: 'Session capture of value discussion',
      evaluation_hint: 'Range (low–high) + stated assumptions + PRELIMINARY_ESTIMATE label. A point estimate alone does not pass.',
    },
    {
      id: 'ER-P1-3',
      label: 'Stakeholder map with decision rights assigned',
      type: 'hard',
      source: 'Session capture or uploaded RACI',
      evaluation_hint: 'A stakeholder list without decision rights is not a complete stakeholder map (AH-P1-4).',
    },
  ],

  exit_criteria: [
    { id: 'EX-P1-1', description: 'Sponsor engaged — named functional owner, briefed, participating in or aligned on charter (investment approval is NOT required at P1 — that is P4)', type: 'hard' },
    { id: 'EX-P1-2', description: 'Primary success metric defined and measurable', type: 'hard' },
    { id: 'EX-P1-3', description: 'Value range locked (range + assumptions, PRELIMINARY_ESTIMATE)', type: 'hard' },
    { id: 'EX-P1-4', description: 'Scope boundary confirmed (in/out documented)', type: 'hard' },
    { id: 'EX-P1-5', description: 'Stakeholder map complete (decision rights assigned)', type: 'hard' },
    { id: 'EX-P1-6', description: 'Initial data access confirmed for P2', type: 'soft' },
  ],

  gate_criteria: [
    {
      id: 'GC-P1-1',
      label: 'Sponsor engaged — named functional owner, briefed and participating in charter',
      type: 'hard',
      evaluation: 'User has confirmed sponsor is aware of the initiative and is the named functional owner. Charter reflects their input or review. NOTE: financial commitment (cost + timeline approval) is NOT required at P1 — that is GC-P4-3 (Investment Approval). Do not conflate.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'User must confirm sponsor has been engaged and is the named functional owner.',
    },
    {
      id: 'GC-P1-2',
      label: 'Primary success metric defined and measurable',
      type: 'hard',
      evaluation: 'A named, measurable metric with a unit and measurement direction exists.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Nexus self-approves if metric is named and measurable.',
    },
    {
      id: 'GC-P1-3',
      label: 'Value range locked (rough range with stated assumptions)',
      type: 'hard',
      evaluation: 'A range (not point estimate) with stated assumptions and PRELIMINARY_ESTIMATE label exists.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Requires human deliberation — program lead confirms.',
    },
    {
      id: 'GC-P1-4',
      label: 'Scope boundary confirmed (in/out documented)',
      type: 'hard',
      evaluation: 'scope_in and scope_out both non-empty (from P0.4 or confirmed in P1).',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Nexus self-approves if both lists non-empty.',
    },
    {
      id: 'GC-P1-5',
      label: 'Stakeholder map complete (decision rights assigned)',
      type: 'hard',
      evaluation: 'Stakeholder table has named stakeholders AND decision rights assigned per row (AH-P1-4).',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Requires human review — program lead or admin confirms.',
    },
    {
      id: 'GC-P1-6',
      label: 'Initial data access confirmed (P2 baseline work can start)',
      type: 'soft',
      evaluation: 'A baseline data source was identified in P0.5 or P1.3.',
      gating_rule: 'warns_only',
      pilot_approval_note: 'Nexus self-approves if data source identified.',
    },
    {
      id: 'GC-P1-7',
      label: 'Key stakeholders briefed (not just mapped)',
      type: 'soft',
      evaluation: 'User confirms stakeholders have been informed of their roles.',
      gating_rule: 'warns_only',
      pilot_approval_note: 'Requires human confirmation.',
    },
  ],

  anti_patterns: [
    {
      id: 'AP-P1-1',
      label: 'Sponsor not yet engaged at all',
      detection_hint: "User says they haven't spoken to the sponsor yet or sponsor doesn't know the initiative exists",
      what_to_flag: "P1 needs the sponsor engaged — they should know this initiative is happening and have agreed to be the named functional owner. 'Will commit when we have a charter' is fine. 'Haven't talked to them yet' is not — charter development should happen with the sponsor, not before.",
      mitigation: 'Ask user to brief the sponsor before proceeding with charter work. Note: financial approval is NOT needed — just awareness and engagement.',
    },
    {
      id: 'AP-P1-2',
      label: 'Point estimate as value range',
      detection_hint: 'User provides a single dollar figure as the value (e.g., "$3.7M")',
      what_to_flag: 'I will record that as a preliminary estimate. We need a range with stated assumptions — point estimates become anchors.',
      mitigation: 'Reframe to low–high range with assumptions. Apply PRELIMINARY_ESTIMATE label.',
    },
    {
      id: 'AP-P1-3',
      label: 'Committee without individual outcome owner',
      detection_hint: 'Stakeholder map has a committee with no named individual owner',
      what_to_flag: 'This looks like a committee without an individual owner. Who is accountable if this Move fails to deliver?',
      mitigation: 'Push for a named individual who owns the outcome. Committees do not own outcomes.',
    },
    {
      id: 'AP-P1-4',
      label: 'Tool-framed problem statement',
      detection_hint: 'Charter problem statement names a vendor or tool before naming the problem',
      what_to_flag: 'The problem statement names a tool, not a problem. Let us reframe: what outcome should this Move achieve, independent of the tool?',
      mitigation: 'Require outcome-first problem statement. Flag FM-7.',
    },
  ],

  self_approval_rules: [
    {
      criterion_id: 'GC-P1-1',
      condition: 'Requires explicit confirmation from a human — P0 sponsor candidate does not count',
      nexus_may_self_approve: false,
      approval_label: 'Sponsor committed — requires human confirmation',
    },
    {
      criterion_id: 'GC-P1-2',
      condition: 'User provides a named, measurable metric with a unit and measurement direction',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: primary metric defined and measurable',
    },
    {
      criterion_id: 'GC-P1-3',
      condition: 'Requires human deliberation — Nexus formats but cannot mark met without explicit human confirmation of range and assumptions',
      nexus_may_self_approve: false,
      approval_label: 'Value range locked — requires human deliberation',
    },
    {
      criterion_id: 'GC-P1-4',
      condition: 'scope_in and scope_out both non-empty (from P0.4 or confirmed in P1)',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: scope boundary confirmed',
    },
    {
      criterion_id: 'GC-P1-5',
      condition: 'Requires human review — Nexus may draft map but cannot mark complete without human confirming decision rights (AH-P1-4)',
      nexus_may_self_approve: false,
      approval_label: 'Stakeholder map — requires human review',
    },
    {
      criterion_id: 'GC-P1-6',
      condition: 'A baseline data source was identified in P0.5 or P1.3',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: initial data access confirmed',
    },
    {
      criterion_id: 'GC-P1-7',
      condition: 'Requires human confirmation — Nexus cannot assert briefing from absence of objection',
      nexus_may_self_approve: false,
      approval_label: 'Stakeholders briefed — requires human confirmation',
    },
  ],

  first_message: [
    {
      variant: 'default',
      template: "I am scoped to [Move name], currently in P1 Charter. The P0 gate passed — we have a hypothesis and a sponsor candidate: [sponsor name]. P1 goal: engage the sponsor on scope and governance, then produce a charter that reflects their input. Has [sponsor name] been briefed on the initiative and agreed to be the named functional owner? Note: formal investment approval (cost, solution, and timeline) is a P4 gate milestone — we're not asking for that yet.",
    },
  ],

  fixtures: [
    {
      id: 'FX-P1-1',
      name: 'Sponsor will review charter — not yet financially committed',
      description: 'User says sponsor will commit when she sees the charter and the business case',
      input: { sponsorStatement: 'She will make her final decision once we have the business case' },
      expected_behaviors: [
        'Nexus acknowledges this is the correct sequence — P4 Investment Approval is where financial commitment is captured',
        'Nexus clarifies: "That is exactly right — the investment decision happens at the P4 gate. For P1, has she been briefed and agreed to be the named functional owner?"',
        'Does NOT block advancement because of absence of financial commitment',
      ],
      prohibited_behaviors: [
        'Treating absence of financial commitment as a P1 blocker',
        'Marking sponsor_engaged = false because investment has not been approved',
      ],
    },
    {
      id: 'FX-P1-2',
      name: 'Point estimate value',
      description: 'User provides $3.7M as the value',
      input: { valueStatement: 'Our CFO says this is a $3.7M opportunity' },
      expected_behaviors: [
        'AH-P1-2 fires',
        'Nexus records $3.7M as preliminary estimate',
        'Nexus asks for low and high ends with assumptions',
      ],
      prohibited_behaviors: ['Writing $3.7M in the charter without range conversion'],
    },
  ],

  coaching_rules: [
    {
      id: 'CR-P1-1',
      rule: 'Distinguish sponsor engagement (P1 requirement) from investment approval (P4 requirement)',
      trigger: 'Any reference to whether sponsor has approved cost, budget, or investment',
      required_behavior: 'Clarify: "Budget and timeline approval happens at the P4 Investment Approval gate — after the business case is built. For P1, we need the sponsor engaged and aligned on scope. Have they been briefed and agreed to be the named functional owner?"',
      prohibited_behavior: 'Treating absence of financial approval as a P1 blocker. Treating "will approve when they see the business case" as a problem — that is the correct P4 sequence.',
    },
    {
      id: 'CR-P1-2',
      rule: 'Reframe point estimates as ranges with stated assumptions',
      trigger: 'Value range is stated as a point estimate',
      required_behavior: "I'll record that as a preliminary estimate. We need a range with assumptions — what would make it higher, what would make it lower?",
      prohibited_behavior: "Writing a point estimate in the charter without range conversion and PRELIMINARY_ESTIMATE label",
    },
  ],

  artifact_generation_rules: [
    {
      artifact: 'CHARTER-P1',
      nexus_may_auto_draft: true,
      conditions: ['P1.1–P1.3 complete'],
      human_direction_required: 'Sponsor commitment and value range require human deliberation before Nexus marks gate criteria met.',
    },
    {
      artifact: 'GATE-P1',
      nexus_may_auto_draft: true,
      conditions: ['P1.4 complete'],
      human_direction_required: 'Human-gated criteria require explicit human confirmation.',
    },
  ],

  anti_hallucination_rules: [
    {
      id: 'AH-P1-1',
      rule: 'Must not conflate sponsor engagement (P1) with investment approval (P4)',
      trigger: 'Every reference to sponsor status or any question about cost, budget, or timeline approval',
      required_behavior: 'P1 requires sponsor ENGAGEMENT — they are briefed, named as functional owner, and participating in charter. NEVER ask whether the sponsor has approved the cost or budget in P1 — that is the P4 Investment Approval gate question. If user volunteers financial approval language, acknowledge it but clarify: "That formal approval will be captured at the P4 gate after the business case is complete."',
      prohibited_behavior: "Asking 'Has the sponsor approved the budget/cost?' or treating absence of financial approval as a P1 blocker. Also: 'They will commit when we have a charter' is OK for P1 — what matters is that they are engaged and will review the charter.",
    },
    {
      id: 'AH-P1-2',
      rule: 'Must not state a value range that implies precision — P1 ranges must be stated as ranges with assumptions, never point estimates',
      trigger: 'Any value magnitude claim in charter, responses, or artifact drafts',
      required_behavior: 'Value range must be: (a) a range (low–high), not a point estimate; (b) accompanied by stated assumptions; (c) labeled PRELIMINARY_ESTIMATE.',
      prohibited_behavior: 'Writing a single dollar figure in the charter without conversion to range with assumptions and PRELIMINARY_ESTIMATE label.',
    },
    {
      id: 'AH-P1-3',
      rule: 'Must not list a stakeholder by name unless from ACL/people data or explicit user input',
      trigger: 'Every stakeholder name mentioned in charter, stakeholder map, or responses',
      required_behavior: 'Each named stakeholder must have: (a) an ACL/people data citation, OR (b) an explicit user statement. If neither: "I do not have people data for this scope. Please name the stakeholders directly."',
      prohibited_behavior: 'Generating plausible stakeholder names based on title inference.',
    },
    {
      id: 'AH-P1-4',
      rule: "Must not mark 'stakeholder map complete' if decision rights are not assigned",
      trigger: 'Every gate evaluation involving the stakeholder map criterion',
      required_behavior: 'The stakeholder_map_complete criterion requires: (a) named stakeholders AND (b) decision rights assigned per row.',
      prohibited_behavior: 'Marking stakeholder_map_complete on a list that lacks decision rights assignment.',
    },
  ],

  patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta', 'seed-patterns-industry'],

  phase_dependencies: {
    requires_from_prior: [
      'P0 gate passed (all 5 hard criteria)',
      'Falsifiable hypothesis with mechanism',
      'Sponsor candidate — named, human-confirmed',
      'Archetype classification',
      'Scope boundary (in/out)',
      'Value hypothesis seed (UNVALIDATED_HYPOTHESIS)',
    ],
    produces_for_next: [
      'Sponsor-committed charter (signed artifact)',
      'Primary success metric with baseline path',
      'Preliminary value range (PRELIMINARY_ESTIMATE, with assumptions)',
      'Stakeholder map with decision rights',
      'Governance model and decision rights',
      'Evidence families confirmed for P2 baseline work',
    ],
  },
};
