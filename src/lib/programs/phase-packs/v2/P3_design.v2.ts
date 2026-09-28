// P3 Design Future State — V2 Training Pack
// T-P3 · AGENT_TRAINING_P3_DESIGN
// Schema: 21-field PhasePack V2 (types.v2.ts)

import type { PhasePack } from '../types.v2';

export const P3_DESIGN_PACK: PhasePack = {
  phase_id: 3,
  phase_name: 'P3 Design Future State',
  phase_intent:
    'Convert the approved P2 recommendation into an estimate-ready solution approach. The evidence-validated P2 route controls depth: technical-only work gets the target architecture and sizing inputs it needs; limited workflow change gets only the affected deltas; material business change gets the necessary process and accountability design. P3 is not a full implementation specification or a months-long operating-model redesign. P4 builds the transparent estimate and roadmap; P5 prepares handoff, while execution happens outside Moves.',

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
    {
      id: 'EC-P3-5',
      description: 'P2 solution route is human-validated against approved evidence and names the adoption owner',
      type: 'hard',
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
      step_name: 'Operating and adoption ownership',
      step_goal: 'Follow the validated P2 route. For technical-only or limited-change work, record the accountable owner, adoption responsibility, operational boundary, and estimate-relevant assumptions; design a broader operating model only when material role/accountability change is evidenced.',
      required_user_inputs: ['Architecture recommendation from P3.2'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'What does the approved P2 route say about workflow and role/accountability change?',
        'Who is the recorded business or delivery owner for adoption, training, and ongoing operation?',
        'What operating or handoff assumptions materially affect the P4 estimate?',
      ],
      artifact_sections_to_update: ['design.operating_and_adoption_ownership'],
      evidence_to_capture: ['validated_change_route', 'adoption_owner_and_responsibility', 'estimate_relevant_operating_assumptions'],
      quality_checks: [
        'The scope matches the evidence-validated P2 route',
        'Adoption owner and responsibility match the approved P1/P2 capture',
        'No full process or operating-model redesign is requested unless material change is validated',
      ],
      completion_criteria: [
        'route_appropriate_ownership_and_assumptions_recorded = true',
      ],
    },
    {
      step_id: 'P3.4',
      step_name: 'Delivery approach and estimate basis',
      step_goal: 'Record the internal, vendor, or hybrid delivery assumption needed for P4 sizing. Identify product-development skills and responsible use of Claude Code/Codex or similar accelerators where relevant; do not select a vendor or run procurement here.',
      required_user_inputs: ['Architecture recommendation from P3.2'],
      accepted_uploads: [],
      patterns_to_load: ['seed-patterns-sourcing-process'],
      questions_to_ask: [
        'Which work is expected to be delivered internally, by a vendor, or as a hybrid?',
        'Which product-development skills and AI coding accelerators could shorten delivery, and what human review/security controls are assumed?',
        'What rate, role, capacity, or procurement assumptions must P4 make explicit?',
      ],
      artifact_sections_to_update: ['design.delivery_approach'],
      evidence_to_capture: ['internal_vendor_hybrid_assumption', 'skills_and_accelerators', 'estimate_rate_and_capacity_inputs'],
      quality_checks: [
        'Internal-versus-vendor assumption is stated with evidence or labeled assumption',
        'No vendor selection or procurement decision is represented as complete',
        'P4 can expose and adjust the role, rate, and capacity assumptions',
      ],
      completion_criteria: [
        'delivery_approach_and_sizing_inputs_recorded = true',
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
    'Human-reviewed, estimate-ready solution approach with route-appropriate architecture/process detail, traceability to approved P2 findings, adoption and operating ownership, delivery-model assumptions, unresolved sizing inputs, and P3→P4 gate readiness. This is not a complete implementation specification or project execution plan.',

  phase_scope_boundary: {
    in: [
      'Design requirements from root causes (traceability)',
      'Architecture options and recommended option',
      'Route-appropriate adoption, operating ownership, and delivery assumptions',
      'Estimate inputs for internal, vendor, or hybrid delivery',
      'P3→P4 gate evaluation',
    ],
    out: [
      'Full implementation specifications, detailed work instructions, or complete process redesign',
      'Vendor selection or RFP process (Source scope)',
      'Execution roadmap or milestones (P4 scope)',
      'Financial modeling (P4 scope)',
      'Implementation planning (P4 scope)',
    ],
  },

  agent_posture_coaching_arc: {
    entry: 'Start from approved P2 evidence and the human-validated solution route. If that route is missing, stale, or not tied to approved evidence, return to P2; do not assume the use case needs process or operating-model redesign.',
    mid: 'Trace design choices to validated findings, then right-size detail to the route. Ask for only the process, ownership, controls, architecture, and integration detail needed to estimate. Capture internal/vendor/hybrid assumptions and relevant product-development skills or AI coding accelerators without treating them as guaranteed savings.',
    exit: 'Confirm the route-appropriate design, evidence, decisions, human edits, and open assumptions are carried forward. P4 must calculate transparent effort/cost/value scenarios with editable roles, rates, and assumptions. P5 prepares an approved roadmap for handoff; execution is outside Moves.',
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
      'Who owns adoption, training, and ongoing operation under the approved route?',
      'What internal, vendor, or hybrid resource assumptions should P4 model, including skills and AI development accelerators?',
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
    { id: 'EX-P3-3', description: 'Route-appropriate adoption/operating owner and responsibility recorded; full design only when material change is evidenced', type: 'hard' },
    { id: 'EX-P3-4', description: 'Internal/vendor/hybrid delivery assumptions and P4 sizing inputs recorded', type: 'hard' },
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
      label: 'Route-appropriate operating and adoption ownership',
      type: 'hard',
      evaluation: 'Record the named owner and responsibility for adoption/operation. Require broader process or operating-model design only when the approved P2 route and evidence show material change; for technical-only work, explicitly retain adoption with the named business owner.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P3-4',
      label: 'Delivery approach and estimate assumptions recorded',
      type: 'hard',
      evaluation: 'State internal/vendor/hybrid assumptions, required skills, and sizing inputs for P4. Do not select vendors or claim procurement is complete; Source owns any sourcing event.',
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
      label: 'Ownerless adoption or operating responsibility',
      detection_hint: 'The validated route has no named adoption or operating owner',
      what_to_flag: 'The team needs an accountable owner for adoption and operation, but this does not automatically require a full operating-model redesign.',
      mitigation: 'Confirm the owner and responsibility from approved P1/P2 capture; design broader role changes only when material change is evidenced.',
    },
    {
      id: 'AP-P3-4',
      label: 'Unstated delivery-model assumptions',
      // dom-integrity-ignore-line — "TBD" here is the anti-pattern text Nexus detects, not a placeholder
      detection_hint: 'Internal/vendor/hybrid delivery assumptions needed for sizing are absent or presented as a vendor selection',
      what_to_flag: 'P4 needs a transparent internal/vendor/hybrid estimate basis, not a premature vendor choice.',
      mitigation: 'Record the delivery-model assumption, role mix, rate basis, confidence, and open decisions; use Source for vendor selection.',
    },
  ],

  self_approval_rules: [
    {
      criterion_id: 'GC-P3-1',
      condition: 'Every root cause in the approved P2 diagnosis has at least one route-relevant design requirement',
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
      condition: 'Named adoption/operating owner and responsibility recorded; broader model only when material change is evidenced',
      nexus_may_self_approve: false,
      approval_label: 'Adoption and operating ownership — requires human confirmation',
    },
    {
      criterion_id: 'GC-P3-4',
      // dom-integrity-ignore-line — "TBD" is the anti-pattern text, not a placeholder
      condition: 'Internal/vendor/hybrid delivery assumptions and P4 sizing inputs are stated (not vendor selection)',
      nexus_may_self_approve: true,
      approval_label: 'Nexus drafted delivery-model assumptions; human review remains required',
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
      template: 'I am scoped to [Move name], currently in P3 Design Future State. First I will confirm the P2 solution route and approved evidence. P3 produces only the route-appropriate design detail needed for P4 estimation: a technical solution, bounded process delta, or material business-change design. It does not create a full implementation specification or project execution plan.',
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
      rule: 'Must not present vendor selection as a P3 decision',
      trigger: 'Delivery-model assumptions discussed in P3.4',
      // dom-integrity-ignore-line — "TBD" is the pattern Nexus watches for, not a placeholder
      required_behavior: 'Record the estimate-relevant internal/vendor/hybrid assumption, rate and role inputs, confidence, and decisions left for Source or P4.',
      // dom-integrity-ignore-line — "TBD" is the pattern Nexus watches for, not a placeholder
      prohibited_behavior: 'Naming or selecting a vendor without a governed Source process, or claiming precise effort/cost without basis.',
    },
  ],

  patterns_to_load: ['PAT-PRG-001', 'seed-patterns-architecture'],

  phase_dependencies: {
    requires_from_prior: [
      'P2 gate passed (CONTINUE_TO_P3 verdict)',
      'RCA-P2 (≥2 ranked root causes with evidence)',
      'FIN-BASE-P2 (baseline with source citations)',
      'P1 success metrics and value range (PRELIMINARY_ESTIMATE)',
      'Human-validated P2 solution route tied to approved evidence, with adoption owner recorded',
    ],
    produces_for_next: [
      'Root cause to design requirement traceability matrix',
      'Architecture recommendation (options, trade-offs, recommended)',
      'Route-appropriate adoption/operating ownership and delivery assumptions',
      'Internal/vendor/hybrid estimate inputs for P4; vendor selection stays in Source',
      'Sponsor-approved design (P4 authorization input)',
    ],
  },
};
