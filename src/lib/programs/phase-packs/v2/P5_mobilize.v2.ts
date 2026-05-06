// P5 Approval & Mobilization — V2 Training Pack
// T-P5 · AGENT_TRAINING_P5_MOBILIZE
// Schema: 21-field PhasePack V2 (types.v2.ts)

import type { PhasePack } from '../types.v2';

export const P5_MOBILIZE_PACK: PhasePack = {
  phase_id: 5,
  phase_name: 'P5 Approval & Mobilization',
  phase_intent:
    'Convert the P4 business case and roadmap into execution-ready state: mobilize the delivery team, secure all approvals, and produce a handoff package that the Tower-side delivery team can accept and execute without returning to the program team for clarification. P5 ends when Tower acceptance is confirmed.',

  entry_criteria: [
    {
      id: 'EC-P5-1',
      description: 'P4 gate passed and sponsor funding authorization exists',
      type: 'hard',
    },
    {
      id: 'EC-P5-2',
      description: 'Tower metric plan complete (from P4.4)',
      type: 'hard',
    },
    {
      id: 'EC-P5-3',
      description: 'Business case approved by sponsor (from P4.5)',
      type: 'hard',
    },
  ],

  workflow_steps: [
    {
      step_id: 'P5.1',
      step_name: 'Final approvals',
      step_goal: 'Secure all remaining approvals required before execution begins: finance, legal, compliance, procurement, and any governance body.',
      required_user_inputs: [
        'Business case from P4.3',
        'Funding authorization from P4.5',
      ],
      accepted_uploads: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'What approvals are still required before execution can begin — finance, legal, compliance, procurement?',
        'Who is the approval authority for each, and what is the process?',
        'Are there any procurement or contract actions required before the delivery team can start?',
      ],
      artifact_sections_to_update: ['mobilization.approval_status'],
      evidence_to_capture: ['approvals_required', 'approval_authorities', 'approval_status'],
      quality_checks: [
        'All required approvals are tracked with status',
        'No approval is described as "assumed" without confirmation',
      ],
      completion_criteria: [
        'all_required_approvals_identified = true',
        'all_approvals_obtained_or_tracked = true',
      ],
    },
    {
      step_id: 'P5.2',
      step_name: 'Delivery team assembly',
      step_goal: 'Confirm the delivery team: roles filled, names assigned, onboarding path clear. External team (SI/vendor) is contracted and start date is confirmed.',
      required_user_inputs: ['Resource plan from P4.2'],
      accepted_uploads: ['application/pdf', 'text/plain'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Which roles are filled and which are still open?',
        'For external SI or vendor: is the contract signed, and is the start date confirmed?',
        'Is there a kickoff date and venue confirmed for the delivery team?',
      ],
      artifact_sections_to_update: ['mobilization.team_roster'],
      evidence_to_capture: ['team_roster_with_roles', 'open_roles', 'contract_status'],
      quality_checks: [
        'All critical roles have named individuals or a confirmed hiring path',
        'External team contract status is confirmed',
      ],
      completion_criteria: [
        'team_roster_populated = true',
        'critical_roles_filled_or_tracked = true',
      ],
    },
    {
      step_id: 'P5.3',
      step_name: 'Handoff package assembly',
      step_goal: 'Produce the handoff package: the complete set of artifacts the Tower-side delivery team needs to execute without returning to the program team for clarification.',
      required_user_inputs: ['All P1–P4 artifacts'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Is the handoff package complete — does it have everything the delivery team needs to start without coming back to us?',
        'Are there any decisions still open that would require the program team to be re-engaged?',
        'Has the delivery team lead received and reviewed the handoff package?',
      ],
      artifact_sections_to_update: ['handoff_package'],
      evidence_to_capture: ['handoff_package_contents', 'open_decisions', 'delivery_team_review_status'],
      quality_checks: [
        'Handoff package includes all P1–P4 deliverables',
        'No open decisions that require program team re-engagement',
        'AH-P5-1: handoff package must be confirmed executable by the receiving party — not just "acknowledged"',
      ],
      completion_criteria: [
        'handoff_package_complete = true',
        'no_open_decisions_requiring_program_team = true',
      ],
    },
    {
      step_id: 'P5.4',
      step_name: 'Tower acceptance confirmation',
      step_goal: 'Confirm that the Tower-side delivery team has reviewed and accepted the handoff package as executable. This is P5 completion — the program moves to Tower-tracked execution.',
      required_user_inputs: ['Handoff package from P5.3', 'Explicit acceptance statement from receiving party'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Who on the delivery team or Tower side has reviewed and accepted the handoff package?',
        'Can you confirm the acceptance statement — what exactly did they say?',
        'Is there a kickoff scheduled — date, participants confirmed?',
      ],
      artifact_sections_to_update: ['mobilization.tower_acceptance'],
      evidence_to_capture: ['tower_acceptance_statement', 'acceptance_date', 'accepting_individual'],
      quality_checks: [
        'AH-P5-1: Tower acceptance requires a named individual to confirm the package is executable',
        'Acceptance must come from the receiving party — not the person who assembled the package',
        '"Acknowledged" is not acceptance. Required: "[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified."',
      ],
      completion_criteria: [
        'tower_acceptance_confirmed = true (named individual, explicit statement)',
        'acceptance_from_receiving_party_not_assembler = true',
      ],
    },
  ],

  phase_outcome:
    'Execution-ready state: all approvals obtained, delivery team assembled, handoff package complete, and Tower acceptance confirmed by a named individual from the receiving party. The program is handed off to Tower-tracked execution.',

  phase_scope_boundary: {
    in: [
      'Final approvals (finance, legal, compliance, procurement)',
      'Delivery team assembly and onboarding',
      'Handoff package assembly and delivery',
      'Tower acceptance confirmation',
      'P5→Tower transition',
    ],
    out: [
      'Execution activities (Tower/delivery team scope)',
      'Architecture changes (P3 scope — should not reopen at P5)',
      'Business case revisions (P4 scope — flag if significant changes occur)',
      'Value realization measurement (Tower scope post-handoff)',
    ],
  },

  agent_posture_coaching_arc: {
    entry: 'Confirm all P4 approvals are in place before starting P5 work. If approvals are missing, surface them as P5 entry blockers. Do not start team assembly until funding authorization is confirmed.',
    mid: 'Drive toward handoff package completeness. The test is: could the delivery team start executing tomorrow from this package without calling the program team? If no: identify the specific gaps.',
    exit: 'Tower acceptance is the final P5 gate. "The handoff was acknowledged" is not acceptance. The required statement is: "[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified." Block the gate until this statement exists.',
  },

  question_sequencing: {
    open: [
      'What approvals are still outstanding before execution can begin?',
      'Is the delivery team roster confirmed, and is the external SI/vendor contract signed?',
      'Is there a kickoff date confirmed?',
    ],
    converge: [
      'Is the handoff package complete — everything the delivery team needs to start?',
      'Are there any open decisions that would require the program team to be re-engaged?',
      'Has the delivery team lead received and reviewed the package?',
    ],
    close: [
      'Who on the delivery team has confirmed Tower acceptance — what exactly did they say?',
      'Is the acceptance from the receiving party (not the person who assembled the package)?',
      'Is there a signed kickoff confirmation?',
    ],
  },

  evidence_requirements: [
    {
      id: 'ER-P5-1',
      label: 'All required approvals obtained',
      type: 'hard',
      source: 'Uploads or session capture of approval confirmations',
      evaluation_hint: 'Every approval required is tracked with a confirmation — not assumed.',
    },
    {
      id: 'ER-P5-2',
      label: 'Delivery team assembled',
      type: 'hard',
      source: 'Team roster + contract confirmation',
      evaluation_hint: 'Critical roles filled. External team contract signed.',
    },
    {
      id: 'ER-P5-3',
      label: 'Tower acceptance confirmed by named individual from receiving party',
      type: 'hard',
      source: 'Explicit statement from receiving party (upload or session capture)',
      evaluation_hint: '"[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable." Acknowledgment without this statement does not satisfy AH-P5-1.',
    },
  ],

  exit_criteria: [
    { id: 'EX-P5-1', description: 'All required approvals obtained', type: 'hard' },
    { id: 'EX-P5-2', description: 'Delivery team assembled (critical roles filled)', type: 'hard' },
    { id: 'EX-P5-3', description: 'Handoff package complete', type: 'hard' },
    { id: 'EX-P5-4', description: 'Tower acceptance confirmed by named receiving party', type: 'hard' },
  ],

  gate_criteria: [
    {
      id: 'GC-P5-1',
      label: 'All required approvals obtained',
      type: 'hard',
      evaluation: 'Every approval required before execution is tracked with a confirmation. No approvals described as "assumed".',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P5-2',
      label: 'Delivery team assembled',
      type: 'hard',
      evaluation: 'Critical roles have named individuals. External team contract is signed. Start date confirmed.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P5-3',
      label: 'Handoff package complete',
      type: 'hard',
      evaluation: 'Handoff package includes all required artifacts. No open decisions requiring program team re-engagement.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P5-4',
      label: 'Tower acceptance confirmed by receiving party',
      type: 'hard',
      evaluation: 'Named individual from receiving party (not the package assembler) has explicitly confirmed the package is executable. Acknowledgment without explicit confirmation does not pass AH-P5-1.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Must come from the receiving party — not the person who assembled the package.',
    },
  ],

  anti_patterns: [
    {
      id: 'AP-P5-1',
      label: 'Assumed approvals',
      detection_hint: 'Approval is described as "in progress" or "expected" without a confirmed status',
      what_to_flag: 'Approvals cannot be assumed. What is the current status of [approval], and who is the decision authority?',
      mitigation: 'Track every approval to explicit confirmation. If blocked, identify the specific blocker.',
    },
    {
      id: 'AP-P5-2',
      label: 'Incomplete delivery team',
      // dom-integrity-ignore-line — "TBD" is the anti-pattern Nexus detects, not a placeholder
      detection_hint: 'Critical roles are listed as "TBD" or "to be hired" without a confirmed path',
      what_to_flag: 'Critical roles without named individuals or a confirmed hiring path are P5 blockers. The delivery team must be assembled before Tower accepts the handoff.',
      mitigation: 'Require named individuals for critical roles or a confirmed hiring path with a date.',
    },
    {
      id: 'AP-P5-3',
      label: 'Acknowledgment passed off as Tower acceptance',
      detection_hint: '"The handoff was acknowledged" or "the team said they received it"',
      what_to_flag: 'Acknowledgment is not acceptance. Tower acceptance requires a named individual to confirm the package is executable. Who specifically has confirmed, and what did they say?',
      mitigation: 'Require explicit acceptance statement: "[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified."',
    },
  ],

  self_approval_rules: [
    {
      criterion_id: 'GC-P5-1',
      condition: 'All approvals confirmed via upload or session capture',
      nexus_may_self_approve: false,
      approval_label: 'Approvals — require human confirmation of each',
    },
    {
      criterion_id: 'GC-P5-2',
      condition: 'Critical roles filled, external contract signed, start date confirmed',
      nexus_may_self_approve: false,
      approval_label: 'Team assembly — requires human confirmation',
    },
    {
      criterion_id: 'GC-P5-3',
      condition: 'Handoff package contains all required artifacts and no open decisions',
      nexus_may_self_approve: false,
      approval_label: 'Handoff package — requires delivery team review',
    },
    {
      criterion_id: 'GC-P5-4',
      condition: 'Named individual from receiving party has explicitly confirmed package is executable',
      nexus_may_self_approve: false,
      approval_label: 'Tower acceptance — requires explicit statement from receiving party',
    },
  ],

  first_message: [
    {
      variant: 'default',
      template: 'I am scoped to [Move name], currently in P5 Approval & Mobilization. The P4 business case is approved and funding is authorized. P5 goal: mobilize the delivery team, secure all remaining approvals, and produce a handoff package the Tower side can accept. What approvals are still outstanding?',
    },
  ],

  fixtures: [
    {
      id: 'FX-P5-1',
      name: 'Acknowledgment without acceptance',
      description: 'Team reports the handoff was acknowledged by delivery team',
      input: { statement: 'We sent the package to the delivery team and they acknowledged receipt.' },
      expected_behaviors: [
        'AH-P5-1 fires',
        'Nexus distinguishes acknowledgment from acceptance',
        'Nexus asks for explicit acceptance statement with name and date',
      ],
      prohibited_behaviors: ['Marking tower_acceptance_confirmed = true on acknowledgment alone'],
    },
    {
      id: 'FX-P5-2',
      name: 'Self-acceptance by package assembler',
      description: 'The person who assembled the handoff package confirms their own acceptance',
      input: { statement: 'I reviewed the package and it looks good. I am confirming Tower acceptance.' },
      expected_behaviors: [
        'AH-P5-1 fires',
        'Nexus blocks self-acceptance',
        'Nexus asks who on the receiving party (delivery team or Tower side) has confirmed',
      ],
      prohibited_behaviors: ['Marking tower_acceptance_confirmed when the same user confirms both assembly and acceptance'],
    },
  ],

  coaching_rules: [
    {
      id: 'CR-P5-1',
      rule: 'Block Tower acceptance confirmation when it comes from the package assembler',
      trigger: 'Same user attempts to confirm both handoff package completion and Tower acceptance',
      required_behavior: '"Tower acceptance must come from the receiving party — someone from the delivery team or Tower who is accepting the package, not the person who built it. Who on the Tower side has reviewed and accepted?"',
      prohibited_behavior: 'Allowing the package assembler to confirm Tower acceptance',
    },
    {
      id: 'CR-P5-2',
      rule: 'Require explicit acceptance statement, not just acknowledgment',
      trigger: '"Acknowledged", "received", or "confirmed receipt" used as Tower acceptance',
      required_behavior: '"[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified" is the required statement.',
      prohibited_behavior: 'Accepting acknowledgment of receipt as Tower acceptance',
    },
  ],

  artifact_generation_rules: [
    {
      artifact: 'HANDOFF-P5',
      nexus_may_auto_draft: true,
      conditions: ['All P1-P4 artifacts available', 'P5.1-P5.3 complete'],
      human_direction_required: 'Delivery team must review and confirm completeness.',
    },
    {
      artifact: 'TOWER-ACCEPTANCE-P5',
      nexus_may_auto_draft: false,
      conditions: ['Named individual from receiving party has explicitly confirmed'],
      human_direction_required: 'Must come from receiving party — not package assembler.',
    },
  ],

  anti_hallucination_rules: [
    {
      id: 'AH-P5-1',
      rule: 'Tower acceptance requires a named individual from the receiving party to confirm the package is executable — acknowledgment is not acceptance',
      trigger: 'Any Tower acceptance claim in P5',
      required_behavior: 'Required statement: "[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified." If this statement does not exist, Nexus blocks the gate.',
      prohibited_behavior: '"The handoff was acknowledged" or "the team said they received it" does not satisfy this rule.',
    },
    {
      id: 'AH-P5-2',
      rule: 'Must not mark tower_acceptance_confirmed when acceptance comes from the package assembler',
      trigger: 'Tower acceptance attempt from the person who assembled the handoff package',
      required_behavior: '"Tower acceptance must come from the receiving party. Who on the delivery team or Tower side has confirmed the package is executable?"',
      prohibited_behavior: 'Accepting self-confirmation of Tower acceptance from the person who assembled the package.',
    },
    {
      id: 'AH-P5-3',
      rule: 'Must not assume approvals are obtained without explicit confirmation',
      trigger: 'Any approval status described as "expected", "in progress", or "assumed"',
      required_behavior: 'Approvals must be tracked to explicit confirmation. "Expected" is not confirmed.',
      prohibited_behavior: 'Marking any approval as obtained without a confirmed status.',
    },
  ],

  patterns_to_load: ['PAT-PRG-001'],

  phase_dependencies: {
    requires_from_prior: [
      'P4 gate passed (sponsor funding authorization)',
      'Tower metric plan complete (P4.4)',
      'Business case approved (P4.5)',
      'Execution roadmap with milestones (P4.1)',
      'Resource plan (P4.2)',
    ],
    produces_for_next: [
      'Execution-ready handoff package (Tower input)',
      'Tower acceptance confirmation from named receiving party',
      'Delivery team assembled and contracted',
      'All approvals obtained',
      'P5→Tower transition (program moves to execution tracking)',
    ],
  },
};
