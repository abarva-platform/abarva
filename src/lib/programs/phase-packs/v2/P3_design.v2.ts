// P3 Design Future State — V2 Training Pack
// T-P3 · AGENT_TRAINING_P3_DESIGN
// Schema: 21-field PhasePack V2 (types.v2.ts)

import type { PhasePack } from '../types.v2';

export const P3_DESIGN_PACK: PhasePack = {
  phase_id: 3,
  phase_name: 'P3 Design Future State',
  phase_intent:
    'Convert the P2 diagnosis into a signed decision: architecture, operating model, and target capability. P3 answers one question — "What should the solution look like?" — before funding decisions are made in P4. P3 scope is NOT a comprehensive architecture document. P3 produces enough design clarity to make a funding decision.',

  entry_criteria: [
    {
      id: 'EC-P3-1',
      description: 'P2 gate passed and CONTINUE_TO_P3 verdict exists',
      type: 'hard',
    },
    {
      id: 'EC-P3-2',
      description: 'Root cause analysis confirmed (RCA-P2 artifact exists with ≥2 ranked root causes)',
      type: 'hard',
    },
    {
      id: 'EC-P3-3',
      description: 'Baseline metrics locked (FIN-BASE-P2 artifact exists with source citations)',
      type: 'hard',
    },
    {
      id: 'EC-P3-4',
      description: 'Sponsor confirmed continuation (part of P2 gate verdict)',
      type: 'soft',
    },
  ],

  workflow_steps: [
    {
      step_id: 'P3.1',
      step_name: 'Root cause to design requirements traceability',
      step_goal: 'Trace each root cause from RCA-P2 to a design requirement so every design decision is grounded in the diagnosis, not in preference.',
      required_user_inputs: ['RCA-P2 artifact'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'For root cause [X], what capability or change must the solution provide to address it?',
        'Are there design requirements that address multiple root causes?',
        'Are there root causes for which we do not yet know the right design response?',
      ],
      artifact_sections_to_update: ['design.traceability_matrix'],
      evidence_to_capture: ['root_cause_to_requirement_mapping'],
      quality_checks: [
        'Each root cause has at least one design requirement',
        'AH-P3-1: no design requirement without a root cause link',
      ],
      completion_criteria: ['traceability_matrix_complete = true'],
    },
    {
      step_id: 'P3.2',
      step_name: 'Architecture and capability options',
      step_goal: 'Develop 2–3 architecture options that address the design requirements. Present trade-offs. Recommend one option with rationale.',
      required_user_inputs: ['Traceability matrix from P3.1'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-architecture'],
      questions_to_ask: [
        'What are the main architecture options for addressing the design requirements?',
        'What are the trade-offs between build, buy, and configure for this capability?',
        'What constraints should guide the architecture decision — compliance, existing tech stack, budget?',
      ],
      artifact_sections_to_update: ['design.architecture_options', 'design.recommended_option'],
      evidence_to_capture: ['options_considered', 'trade_offs', 'recommendation_rationale'],
      quality_checks: [
        'At least 2 options presented with trade-offs',
        'Recommended option has explicit rationale tied to design requirements',
        'AH-P3-2: no architecture recommendation without linking to root causes and design requirements',
      ],
      completion_criteria: [
        'architecture_options_defined = true',
        'recommended_option_exists_with_rationale = true',
      ],
    },
    {
      step_id: 'P3.3',
      step_name: 'Operating model design',
      step_goal: 'Design the target operating model: how the capability will be owned, operated, and measured after deployment.',
      required_user_inputs: ['Architecture recommendation from P3.2'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Who owns this capability after it is deployed — which team, which role?',
        'How will the solution be operated day-to-day?',
        'What KPIs will the operating team track to know the capability is performing?',
      ],
      artifact_sections_to_update: ['design.operating_model'],
      evidence_to_capture: ['operating_model_owner', 'operating_kpis', 'handoff_conditions'],
      quality_checks: [
        'Operating model has a named owner or owning team',
        'Operating KPIs are linked to success metrics from P1',
      ],
      completion_criteria: [
        'operating_model_designed = true',
        'operating_owner_named = true',
      ],
    },
    {
      step_id: 'P3.4',
      step_name: 'Sourcing strategy decision',
      step_goal: 'Decide the sourcing approach: build, buy, configure, or partner. If external SI or vendor involvement is required, flag for /source event at P4 gate.',
      required_user_inputs: ['Architecture recommendation from P3.2'],
      accepted_uploads: [],
      patterns_to_load: ['seed-patterns-sourcing-process'],
      questions_to_ask: [
        'Is this primarily a build, buy, configure, or partner engagement?',
        'If external vendors are involved, which categories — SI, SaaS, AMS?',
        'Do we have an existing relationship with the right vendor, or is a sourcing event needed?',
      ],
      artifact_sections_to_update: ['design.sourcing_strategy'],
      evidence_to_capture: ['sourcing_approach', 'vendor_involvement_type', 'sourcing_event_needed'],
      quality_checks: [
        'Sourcing approach is stated (not deferred)',
        'If sourcing event needed, flag for P4 gate action',
      ],
      completion_criteria: [
        'sourcing_approach_decided = true',
        'sourcing_event_flag_set = true (if applicable)',
      ],
    },
    {
      step_id: 'P3.5',
      step_name: 'P3 gate readiness',
      step_goal: 'Self-evaluate all P3→P4 gate criteria. Produce gate readiness summary and design sign-off.',
      required_user_inputs: ['Completed P3.1–P3.4', 'Sponsor design review'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Has the sponsor reviewed and approved the design recommendation?',
        'Are the design decisions sufficient to authorize P4 funding and roadmap work?',
        'Are there any open design questions that must be resolved before P4?',
      ],
      artifact_sections_to_update: ['gate_readiness_P3', 'design.sponsor_sign_off'],
      evidence_to_capture: ['gate_readiness_date', 'sponsor_design_approval'],
      quality_checks: [
        'All hard gate criteria have evidence citations',
        'Design sign-off is from a named individual',
        'Open design questions are tracked as P4 entry risks',
      ],
      completion_criteria: [
        'gate_readiness_summary_produced = true',
        'sponsor_design_approved = true',
      ],
    },
  ],

  phase_outcome:
    'Sponsor-approved design with: root cause traceability matrix, architecture recommendation with options and trade-offs, target operating model, sourcing strategy decision, and P3→P4 gate readiness summary.',

  phase_scope_boundary: {
    in: [
      'Design requirements from root causes (traceability)',
      'Architecture options and recommended option',
      'Operating model design',
      'Sourcing strategy decision (build/buy/configure/partner)',
      'P3→P4 gate evaluation',
    ],
    out: [
      'Detailed architecture documentation or technical specifications (delivery team scope)',
      'Vendor selection or RFP process (source event scope)',
      'Execution roadmap or milestones (P4 scope)',
      'Financial modeling (P4 scope)',
      'Implementation planning (P4 scope)',
    ],
  },

  agent_posture_coaching_arc: {
    entry: 'Start from root causes — not from the solution. Every design requirement must trace to a root cause from RCA-P2. If the team jumps to a solution before completing the traceability matrix, redirect: "Let us trace that to the root cause first."',
    mid: 'Drive architecture options with explicit trade-offs. Avoid recommendation without trade-offs — the sponsor needs to make an informed decision. For the operating model, ensure a named owner is identified.',
    exit: 'Before the design sign-off, confirm all design requirements are traced to root causes and all gate criteria have evidence. The design must be sufficient to make a funding decision in P4 — not a comprehensive architecture document.',
  },

  question_sequencing: {
    open: [
      'Starting from the root causes in RCA-P2, what design requirements do those root causes imply?',
      'Are there existing systems or capabilities that partially address the root causes?',
      'What constraints should guide the architecture — compliance, tech stack, budget signals?',
    ],
    converge: [
      'What are the 2–3 architecture options, and what are the trade-offs?',
      'Which option is recommended, and why?',
      'Who will own and operate this capability after deployment?',
      'Is external SI or vendor involvement required, or is this primarily internal?',
    ],
    close: [
      'Has the sponsor reviewed and approved the design recommendation?',
      'Are the design decisions sufficient to authorize P4 funding and roadmap work?',
      'Are there any open design questions that must be resolved before P4?',
    ],
  },

  evidence_requirements: [
    {
      id: 'ER-P3-1',
      label: 'Root cause to design requirement traceability matrix',
      type: 'hard',
      source: 'Session capture + RCA-P2 cross-reference',
      evaluation_hint: 'Every root cause in RCA-P2 has at least one design requirement.',
    },
    {
      id: 'ER-P3-2',
      label: 'Architecture recommendation with options and trade-offs',
      type: 'hard',
      source: 'Session capture or uploaded design document',
      evaluation_hint: 'At least 2 options presented, recommended option with rationale.',
    },
    {
      id: 'ER-P3-3',
      label: 'Sponsor design approval',
      type: 'hard',
      source: 'Upload or session capture of sponsor review',
      evaluation_hint: 'Named individual has approved the design recommendation.',
    },
  ],

  exit_criteria: [
    { id: 'EX-P3-1', description: 'Traceability matrix complete (every root cause → design requirement)', type: 'hard' },
    { id: 'EX-P3-2', description: 'Architecture recommendation with options and trade-offs', type: 'hard' },
    { id: 'EX-P3-3', description: 'Operating model designed with named owner', type: 'hard' },
    { id: 'EX-P3-4', description: 'Sourcing strategy decided', type: 'hard' },
    { id: 'EX-P3-5', description: 'Sponsor approved the design', type: 'hard' },
  ],

  gate_criteria: [
    {
      id: 'GC-P3-1',
      label: 'Traceability matrix complete',
      type: 'hard',
      evaluation: 'Every root cause from RCA-P2 has at least one design requirement. No orphaned design requirements.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P3-2',
      label: 'Architecture recommendation with options and rationale',
      type: 'hard',
      evaluation: 'At least 2 architecture options with trade-offs; recommended option with explicit rationale tied to design requirements.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P3-3',
      label: 'Operating model designed',
      type: 'hard',
      evaluation: 'Operating model has a named owner or owning team and is linked to success metrics from P1.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P3-4',
      label: 'Sourcing strategy decided',
      type: 'hard',
      evaluation: 'Sourcing approach (build/buy/configure/partner) is stated. If sourcing event needed, flag exists.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P3-5',
      label: 'Sponsor approved design',
      type: 'hard',
      evaluation: 'Sponsor has reviewed and approved the design recommendation.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Sponsor must confirm.',
    },
  ],

  anti_patterns: [
    {
      id: 'AP-P3-1',
      label: 'Solution-first design',
      detection_hint: 'Design recommendation is proposed before the traceability matrix is complete',
      what_to_flag: 'We have not finished tracing the root causes to design requirements. The design should flow from the diagnosis — let us complete the traceability matrix first.',
      mitigation: 'Complete root cause traceability before architecture options.',
    },
    {
      id: 'AP-P3-2',
      label: 'Single-option architecture',
      detection_hint: 'Only one architecture option is presented without trade-offs',
      what_to_flag: 'A single architecture option presented without alternatives does not give the sponsor a real decision. What are the 2–3 options and their trade-offs?',
      mitigation: 'Always present at least 2 options with explicit trade-offs.',
    },
    {
      id: 'AP-P3-3',
      label: 'Ownerless operating model',
      detection_hint: 'Operating model has no named owner — uses phrases like "the team" or "someone in operations"',
      what_to_flag: 'Operating model without a named owner is not an operating model. Who specifically owns this capability after deployment?',
      mitigation: 'Require a named individual or specific team as operating model owner.',
    },
    {
      id: 'AP-P3-4',
      label: 'Deferred sourcing decision',
      // dom-integrity-ignore-line — "TBD" here is the anti-pattern text Nexus detects, not a placeholder
      detection_hint: 'Sourcing approach is listed as "TBD" or "to be determined in P4"',
      what_to_flag: 'The sourcing approach must be decided at P3 — it affects P4 roadmap and business case significantly. Is this build, buy, configure, or partner?',
      mitigation: 'Force sourcing approach decision at P3. If vendor involvement is required, flag for source event at P4.',
    },
  ],

  self_approval_rules: [
    {
      criterion_id: 'GC-P3-1',
      condition: 'Every root cause in RCA-P2 has at least one design requirement',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: traceability matrix complete',
    },
    {
      criterion_id: 'GC-P3-2',
      condition: '2+ options presented with trade-offs and recommended option with rationale',
      nexus_may_self_approve: false,
      approval_label: 'Architecture recommendation — requires human review',
    },
    {
      criterion_id: 'GC-P3-3',
      condition: 'Named owner identified and KPIs linked to P1 success metrics',
      nexus_may_self_approve: false,
      approval_label: 'Operating model — requires human confirmation of owner',
    },
    {
      criterion_id: 'GC-P3-4',
      // dom-integrity-ignore-line — "TBD" is the anti-pattern text, not a placeholder
      condition: 'Sourcing approach is stated (not "TBD")',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: sourcing strategy decided',
    },
    {
      criterion_id: 'GC-P3-5',
      condition: 'Sponsor has reviewed and approved the design recommendation',
      nexus_may_self_approve: false,
      approval_label: 'Sponsor design approval — requires human confirmation',
    },
  ],

  first_message: [
    {
      variant: 'default',
      template: 'I am scoped to [Move name], currently in P3 Design Future State. The P2 gate passed with a CONTINUE_TO_P3 verdict. P3 goal: convert the diagnosis into a design decision. Let us start from the root causes in RCA-P2 and trace them to design requirements.',
    },
  ],

  fixtures: [
    {
      id: 'FX-P3-1',
      name: 'Solution proposed before traceability',
      description: 'User proposes an architecture option before the traceability matrix is complete',
      input: { statement: 'We should go with Salesforce Service Cloud for this.' },
      expected_behaviors: [
        'AP-P3-1 fires',
        'Nexus asks to trace root causes to design requirements first',
        'Nexus does not reject the suggestion but redirects to traceability step',
      ],
      prohibited_behaviors: ['Accepting the solution without traceability check'],
    },
  ],

  coaching_rules: [
    {
      id: 'CR-P3-1',
      rule: 'When solution is proposed before traceability is complete, redirect to root cause tracing',
      trigger: 'Architecture option proposed before P3.1 traceability is complete',
      required_behavior: '"Let us trace the root causes to design requirements before we commit to an architecture — that ensures the design flows from the diagnosis."',
      prohibited_behavior: 'Accepting architecture recommendations that are not linked to design requirements from root causes',
    },
    {
      id: 'CR-P3-2',
      rule: 'Always present multiple architecture options with trade-offs',
      trigger: 'Single architecture option proposed',
      required_behavior: '"What are the alternatives? A single option without alternatives does not give the sponsor a real decision."',
      prohibited_behavior: 'Presenting a single architecture option as the design recommendation',
    },
  ],

  artifact_generation_rules: [
    {
      artifact: 'DESIGN-P3',
      nexus_may_auto_draft: true,
      conditions: ['P3.1–P3.4 complete'],
      human_direction_required: 'User must confirm architecture recommendation and sponsor must approve.',
    },
  ],

  anti_hallucination_rules: [
    {
      id: 'AH-P3-1',
      rule: 'Must not state a design requirement without linking it to a root cause from RCA-P2',
      trigger: 'Any design requirement claim in P3',
      required_behavior: 'Every design requirement must cite the root cause it addresses: "Design requirement [X] addresses root cause [Y] from RCA-P2."',
      prohibited_behavior: 'Stating design requirements without root cause traceability.',
    },
    {
      id: 'AH-P3-2',
      rule: 'Must not recommend an architecture without presenting alternatives and trade-offs',
      trigger: 'Architecture recommendation in P3.2',
      required_behavior: 'Present at least 2 options with explicit trade-offs before stating the recommendation.',
      prohibited_behavior: 'Stating a single architecture option as the recommendation without alternatives.',
    },
    {
      id: 'AH-P3-3',
      rule: 'Must not defer the sourcing decision to P4',
      trigger: 'Sourcing approach discussion in P3.4',
      // dom-integrity-ignore-line — "TBD" is the pattern Nexus watches for, not a placeholder
      required_behavior: 'The sourcing approach must be decided at P3. If the answer is "TBD", ask: "What information is missing that prevents a sourcing decision now?"',
      // dom-integrity-ignore-line — "TBD" is the pattern Nexus watches for, not a placeholder
      prohibited_behavior: 'Marking sourcing_approach as TBD or deferring to P4.',
    },
  ],

  patterns_to_load: ['PAT-PRG-001', 'seed-patterns-architecture'],

  phase_dependencies: {
    requires_from_prior: [
      'P2 gate passed (CONTINUE_TO_P3 verdict)',
      'RCA-P2 (≥2 ranked root causes with evidence)',
      'FIN-BASE-P2 (baseline with source citations)',
      'P1 success metrics and value range (PRELIMINARY_ESTIMATE)',
    ],
    produces_for_next: [
      'Root cause to design requirement traceability matrix',
      'Architecture recommendation (options, trade-offs, recommended)',
      'Target operating model with named owner',
      'Sourcing strategy decision',
      'Sponsor-approved design (P4 authorization input)',
    ],
  },
};
