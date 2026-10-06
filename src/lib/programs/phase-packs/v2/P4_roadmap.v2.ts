// P4 Roadmap & Business Case — V2 Training Pack
// T-P4 · AGENT_TRAINING_P4_ROADMAP
// Schema: 21-field PhasePack V2 (types.v2.ts)

import type { PhasePack } from '../types.v2';

export const P4_ROADMAP_PACK: PhasePack = {
  phase_id: 4,
  phase_name: 'P4 Roadmap & Business Case',
  phase_intent:
    'Convert the P3-signed design into an estimate-ready roadmap and business case. P4 answers five questions: How could work be sequenced after approval? What effort and cost range does it require? What value could it deliver and when? How should it be governed and resourced? How will success be measured after handoff? P4 plans and estimates; it does not execute. Define Tower metrics here so they are ready for mobilization and external execution after required approvals.',

  entry_criteria: [
    {
      id: 'EC-P4-1',
      description:
        'P3 gate passed and design approved by an authorized workspace user',
      type: 'hard',
    },
    {
      id: 'EC-P4-2',
      description:
        'Sourcing strategy decided at P3 (build/buy/configure/partner)',
      type: 'hard',
    },
    {
      id: 'EC-P4-3',
      description:
        'If sourcing event needed (from P3.4), /source event has been initiated or is in plan',
      type: 'soft',
    },
  ],

  workflow_steps: [
    {
      step_id: 'P4.1',
      step_name: 'Workstream and milestone planning',
      step_goal:
        'Decompose the design into workstreams and critical milestones. Sequence workstreams by dependency. Identify the critical path.',
      required_user_inputs: ['Authorized-user-approved design from P3'],
      accepted_uploads: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'text/plain',
        'text/markdown',
      ],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'What are the 3–5 major workstreams for this Move?',
        'What are the critical milestones — the deliverables or decisions that unlock downstream work?',
        'What is the critical path — which sequence of work determines the minimum completion time?',
      ],
      artifact_sections_to_update: [
        'roadmap.workstreams',
        'roadmap.milestones',
      ],
      evidence_to_capture: [
        'workstream_list',
        'critical_milestones',
        'critical_path',
      ],
      quality_checks: [
        'Milestones are specific dates or conditions, not vague phases',
        'Critical path is identified',
        'AH-P4-1: no milestone dates without a dependency basis',
      ],
      completion_criteria: [
        'workstreams_defined = true (at least 3)',
        'critical_milestones_defined = true',
        'critical_path_identified = true',
      ],
    },
    {
      step_id: 'P4.2',
      step_name: 'Resource and cost plan',
      step_goal:
        'Build transparent low/base/high effort and cost scenarios by work package and role. Separate internal capacity/rates from vendor rates, show effort × rate arithmetic, and expose evidence, assumptions, confidence, and human-adjustable inputs.',
      required_user_inputs: [
        'Workstream plan from P4.1',
        'Sourcing strategy from P3.4',
      ],
      accepted_uploads: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
      ],
      patterns_to_load: ['seed-patterns-meta'],
      questions_to_ask: [
        'Which roles and skills are needed, with low/base/high effort, internal capacity, loaded-rate source, and backfill assumptions?',
        'Which work packages are internal, vendor-delivered, or hybrid, and what evidence supports each rate and effort assumption?',
        'Where could Claude Code/Codex or similar product-development accelerators change effort, and how are human review, testing, security, and rework represented?',
        'What other costs and dependencies apply, and when does spend occur relative to value realization?',
      ],
      artifact_sections_to_update: [
        'business_case.cost_plan',
        'business_case.resource_plan',
      ],
      evidence_to_capture: [
        'role_based_effort_and_rate_inputs',
        'internal_vendor_hybrid_scenarios',
        'ai_accelerator_assumptions_and_controls',
        'cost_phasing',
        'human_review_record',
      ],
      quality_checks: [
        'AH-P4-2: cost estimates show arithmetic, source or explicit assumption, range, and confidence',
        'Internal and vendor scenarios are distinguishable and roles/rates/capacity are editable by reviewers',
        'AI accelerator effects are assumptions, not guaranteed savings, and include human review/testing effort',
      ],
      completion_criteria: [
        'total_cost_estimated = true',
        'cost_assumptions_and_ranges_stated = true',
        'role_rate_and_delivery_model_inputs_reviewable = true',
      ],
    },
    {
      step_id: 'P4.3',
      step_name: 'Business case and value model',
      step_goal:
        'Build the business case: NPV, payback period, and value realization timeline. Value claims must trace to the baseline from FIN-BASE-P2.',
      required_user_inputs: [
        'FIN-BASE-P2 baseline',
        'Cost plan from P4.2',
        'Value range from P1 (PRELIMINARY_ESTIMATE)',
      ],
      accepted_uploads: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
      ],
      patterns_to_load: ['seed-patterns-meta'],
      questions_to_ask: [
        'For each value lever from P1, what is the expected annual benefit — traced to the FIN-BASE-P2 baseline?',
        'What is the payback period assuming the projected benefit and the cost plan?',
        'What would need to be true for the value case to be 20% stronger? 20% weaker?',
      ],
      artifact_sections_to_update: [
        'business_case.value_model',
        'business_case.npv',
        'business_case.payback',
      ],
      evidence_to_capture: [
        'value_estimates_with_baseline_citations',
        'payback_period',
        'sensitivity_analysis',
      ],
      quality_checks: [
        'AH-P4-3: every value claim must trace to FIN-BASE-P2 baseline — not to benchmarks or analogies',
        'Sensitivity analysis included — at least one downside scenario',
      ],
      completion_criteria: [
        'value_model_complete = true',
        'all_value_claims_traced_to_FIN-BASE-P2 = true',
        'payback_period_calculated = true',
        'sensitivity_analysis_included = true',
      ],
    },
    {
      step_id: 'P4.4',
      step_name: 'Tower metric plan',
      step_goal:
        'Define the Tower metrics: how value realization will be tracked after handoff. Every value lever must have at least one Tower metric. This is a P4-critical step — do not defer beyond mobilization.',
      required_user_inputs: [
        'Value model from P4.3',
        'Success metrics from P1',
        'Operating model owner from P3.3',
      ],
      accepted_uploads: [],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'For each value lever, what is the Tower metric that will track whether the lever is delivering?',
        'Who is accountable for each Tower metric — who owns the number after handoff?',
        'What is the reporting cadence — monthly, quarterly?',
        'What target value and timeline should each metric track against?',
      ],
      artifact_sections_to_update: ['tower_metric_plan'],
      evidence_to_capture: [
        'tower_metrics_per_lever',
        'metric_owners',
        'reporting_cadence',
        'targets',
      ],
      quality_checks: [
        'Every value lever has at least one Tower metric',
        'Each metric has a named owner',
        'AH-P4-4: no Tower metric without a baseline from FIN-BASE-P2',
      ],
      completion_criteria: [
        'tower_metric_plan_complete = true',
        'all_value_levers_have_tower_metrics = true',
        'all_metrics_have_named_owners = true',
      ],
    },
    {
      step_id: 'P4.5',
      step_name: 'P4 gate readiness and funding authorization',
      step_goal:
        'Self-evaluate P4→P5 gate criteria. Produce the roadmap and business-case decision package for authorized workspace-user approval.',
      required_user_inputs: [
        'Completed P4.1–P4.4',
        'Stakeholder review inputs',
      ],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Has the authorized workspace user reviewed and approved the business case and funding request?',
        'Is the Tower metric plan complete — does every value lever have a tracked metric?',
        'Are there any open items in the roadmap or business case that must be resolved before P5?',
      ],
      artifact_sections_to_update: [
        'gate_readiness_P4',
        'funding_authorization',
      ],
      evidence_to_capture: [
        'gate_readiness_date',
        'authorized_user_funding_decision',
      ],
      quality_checks: [
        'Tower metric plan complete before gate passes — not deferrable to P5',
        'All hard gate criteria have evidence citations',
      ],
      completion_criteria: [
        'gate_readiness_summary_produced = true',
        'authorized_workspace_user_approved_funding_decision = true',
        'tower_metric_plan_complete = true',
      ],
    },
  ],

  phase_outcome:
    'Approved roadmap and business-case decision package: workstream plan with milestones, resource and cost ranges with assumptions, business case and sensitivity, Tower metric plan with named owners, and P4→P5 gate readiness summary. Project execution remains outside Moves and starts only after required approvals and handoff.',

  phase_scope_boundary: {
    in: [
      'Workstream decomposition and milestone planning',
      'Role-based effort and cost estimates with internal/vendor/hybrid scenarios, ranges, rate basis, and human-adjustable assumptions',
      'Business case (NPV, payback, sensitivity)',
      'Tower metric plan (per value lever, with owners)',
      'Change management plan',
      'P4→P5 gate evaluation and funding authorization',
    ],
    out: [
      'Detailed project management planning (delivery team scope)',
      'Architecture specifications (P3 output — do not redesign)',
      'Project execution (outside Moves, after approval and P5 handoff)',
      'Vendor selection (source event scope — flag if needed)',
    ],
  },

  agent_posture_coaching_arc: {
    entry:
      'Begin with the workstream plan — sequence is more important than precision at P4. Once the workstreams are clear, cost estimation can proceed. Do not start the business case before the workstream plan is complete.',
    mid: 'Build estimate math transparently: roles × effort × rate, other cost drivers, low/base/high cases, confidence, and evidence versus assumption. Keep internal, vendor, and hybrid cases separate. Treat AI development accelerators as adjustable productivity assumptions that include human review and testing. Drive value claims from P2 evidence; do not invent numbers.',
    exit: 'Before the gate passes, confirm the Tower metric plan is complete. This is P4-critical — it cannot be deferred to P5. Every value lever must have at least one Tower metric with a named owner.',
  },

  question_sequencing: {
    open: [
      'What are the 3–5 major workstreams for this Move, and what are their dependencies?',
      'What are the critical milestones — the deliverables that unlock downstream work?',
      'Is there any external SI or vendor work that must be scoped and contracted in P5?',
    ],
    converge: [
      'For each value lever from P1, what is the expected annual benefit — traced to the FIN-BASE-P2 baseline?',
      'What is the total investment — internal + external + license + infrastructure?',
      'What is the payback period given the cost and benefit estimates?',
      'For each value lever, what is the Tower metric that will track whether it is delivering?',
    ],
    close: [
      'Has the authorized workspace user reviewed and approved the business case and funding request?',
      'Is the Tower metric plan complete — does every value lever have a tracked metric with a named owner?',
      'Are there any open items that must be resolved before P5?',
    ],
  },

  evidence_requirements: [
    {
      id: 'ER-P4-1',
      label: 'Business case with value claims traced to FIN-BASE-P2',
      type: 'hard',
      source: 'P4.3 business case artifact',
      evaluation_hint:
        'Every value claim cites a specific baseline value from FIN-BASE-P2.',
    },
    {
      id: 'ER-P4-2',
      label: 'Tower metric plan (per value lever, named owners)',
      type: 'hard',
      source: 'P4.4 Tower metric plan artifact',
      evaluation_hint:
        'All value levers have at least one Tower metric with a named owner.',
    },
    {
      id: 'ER-P4-3',
      label: 'Funding decision and authority evidence',
      type: 'hard',
      source: 'Approved evidence package and authorized-user decision record',
      evaluation_hint:
        'The roadmap records the funding decision and cites the evidence or assumptions establishing authority before external execution. A sponsor signature or sponsor action is not required.',
    },
  ],

  exit_criteria: [
    {
      id: 'EX-P4-1',
      description: 'Workstream plan with milestones and critical path',
      type: 'hard',
    },
    {
      id: 'EX-P4-2',
      description: 'Business case complete (NPV, payback, sensitivity)',
      type: 'hard',
    },
    {
      id: 'EX-P4-3',
      description:
        'Tower metric plan complete (all value levers, named owners)',
      type: 'hard',
    },
    {
      id: 'EX-P4-4',
      description:
        'Authorized-user decision and required funding authority recorded',
      type: 'hard',
    },
    {
      id: 'EX-P4-5',
      description: 'Change management plan drafted',
      type: 'soft',
    },
  ],

  gate_criteria: [
    {
      id: 'GC-P4-1',
      label: 'Workstream plan with milestones and critical path',
      type: 'hard',
      evaluation:
        'At least 3 workstreams, critical milestones defined, critical path identified.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P4-2',
      label: 'Business case complete with baseline-traced value claims',
      type: 'hard',
      evaluation:
        'Every value claim traces to FIN-BASE-P2. NPV and payback period calculated. Sensitivity analysis included.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P4-3',
      label: 'Tower metric plan complete',
      type: 'hard',
      evaluation:
        'All value levers have at least one Tower metric with a named owner. This criterion cannot be deferred to P5.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note:
        'This is a hard gate. Tower metrics must be defined before P5 begins.',
    },
    {
      id: 'GC-P4-4',
      label: 'Authorized-user decision recorded for P5 mobilization',
      type: 'hard',
      evaluation:
        'An authorized workspace user has recorded the funding decision in Moves, with supporting authority evidence or an explicit unresolved assumption before P5 mobilization.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'An authorized workspace user must confirm.',
    },
    {
      id: 'GC-P4-5',
      label: 'Change management plan drafted',
      type: 'soft',
      evaluation:
        'A change management plan exists with stakeholder communication and training approach.',
      gating_rule: 'warns_only',
    },
  ],

  anti_patterns: [
    {
      id: 'AP-P4-1',
      label: 'Value claims without baseline traceability',
      detection_hint:
        'Business case uses benchmarks, analogies, or estimates instead of FIN-BASE-P2 values',
      what_to_flag:
        'Value claims must trace to the baseline we established in P2. Benchmarks are useful context but cannot substitute for our baseline.',
      mitigation:
        'Redirect to FIN-BASE-P2. If the baseline lacks the needed data, flag as a P2 gap.',
    },
    {
      id: 'AP-P4-2',
      label: 'Tower metrics deferred beyond P4',
      detection_hint:
        'Team says Tower metrics will be defined after P5 handoff or when project execution starts',
      what_to_flag:
        'Tower metrics must be defined in the P4 roadmap. They must be ready before mobilization and external execution — not invented after handoff.',
      mitigation:
        'Block gate if Tower metric plan is incomplete. Redirect: "Which value lever should we start with — let us define its Tower metric now."',
    },
    {
      id: 'AP-P4-3',
      label: 'Business case without sensitivity analysis',
      detection_hint:
        'Business case presents single-scenario projections without a downside scenario',
      what_to_flag:
        'A business case without a sensitivity analysis is an optimistic story, not a business case. What happens to the case if [key assumption] is 20% worse?',
      mitigation:
        'Require at least one downside scenario in the sensitivity analysis.',
    },
  ],

  self_approval_rules: [
    {
      criterion_id: 'GC-P4-1',
      condition:
        'At least 3 workstreams, milestones defined, critical path identified',
      nexus_may_self_approve: false,
      approval_label: 'Workstream plan — requires human review',
    },
    {
      criterion_id: 'GC-P4-2',
      condition:
        'All value claims trace to FIN-BASE-P2, NPV calculated, sensitivity included',
      nexus_may_self_approve: false,
      approval_label:
        'Business case — requires authorized workspace-user approval',
    },
    {
      criterion_id: 'GC-P4-3',
      condition: 'All value levers have Tower metrics with named owners',
      nexus_may_self_approve: false,
      approval_label:
        'Tower metric plan — requires human confirmation of owners',
    },
    {
      criterion_id: 'GC-P4-4',
      condition:
        'Authorized workspace user has recorded the funding decision in Moves',
      nexus_may_self_approve: false,
      approval_label: 'Funding decision — requires authorized-user approval',
    },
    {
      criterion_id: 'GC-P4-5',
      condition:
        'Change management plan exists with communication and training approach',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: change management plan drafted',
    },
  ],

  first_message: [
    {
      variant: 'default',
      template:
        'I am scoped to [Move name], currently in P4 Roadmap & Business Case. The P3 design is approved. P4 goal: produce an estimate-ready roadmap and business case — workstreams, cost and effort ranges with assumptions, value logic traced to approved baselines, and Tower metrics. Moves plans the work; external project execution starts only after approval and handoff. Let us start with workstream decomposition.',
    },
  ],

  fixtures: [
    {
      id: 'FX-P4-1',
      name: 'Tower metrics deferred',
      description: 'Team says Tower metrics will be defined after P5 handoff',
      input: {
        statement: 'We will define the Tower metrics after P5 handoff.',
      },
      expected_behaviors: [
        'Tower metric plan authority fires',
        'Nexus blocks Tower metric deferral',
        'Nexus asks which value lever to start with',
      ],
      prohibited_behaviors: ['Accepting Tower metric deferral to P5'],
    },
    {
      id: 'FX-P4-2',
      name: 'Value claim without baseline',
      description: 'Business case uses benchmark instead of FIN-BASE-P2',
      input: {
        valueStatement:
          'Industry benchmarks show 20-30% efficiency gains are typical.',
      },
      expected_behaviors: [
        'AH-P4-3 fires',
        'Nexus asks for the baseline value from FIN-BASE-P2',
        'Nexus notes benchmarks are useful context but not a substitute for the baseline',
      ],
      prohibited_behaviors: [
        'Accepting benchmark as the basis for value claim without FIN-BASE-P2 citation',
      ],
    },
  ],

  coaching_rules: [
    {
      id: 'CR-P4-1',
      rule: 'When Tower metrics are deferred beyond P4, block and redirect to define them now',
      trigger: 'Team attempts to defer Tower metric plan to P5',
      required_behavior:
        '"Tower metrics must be defined at P4. Which value lever should we start with — let us define its Tower metric now."',
      prohibited_behavior: 'Allowing Tower metric plan to be deferred to P5',
    },
    {
      id: 'CR-P4-2',
      rule: 'Require FIN-BASE-P2 baseline citations for all value claims in business case',
      trigger:
        'Value claim uses benchmark or analogy instead of FIN-BASE-P2 values',
      required_behavior:
        '"This value claim should trace to the FIN-BASE-P2 baseline from P2. What does our baseline say about [metric]?"',
      prohibited_behavior:
        'Accepting benchmarks or analogies as the basis for value claims without FIN-BASE-P2 citation',
    },
  ],

  artifact_generation_rules: [
    {
      artifact: 'ROADMAP-P4',
      nexus_may_auto_draft: true,
      conditions: ['P4.1 workstream plan complete'],
      human_direction_required:
        'User must confirm milestones and critical path.',
    },
    {
      artifact: 'BUSINESS-CASE-P4',
      nexus_may_auto_draft: true,
      conditions: [
        'P4.3 value model complete',
        'all value claims traced to FIN-BASE-P2',
      ],
      human_direction_required:
        'An authorized workspace user must review the business case and record the funding decision. Supporting authority evidence and unresolved assumptions remain visible.',
    },
    {
      artifact: 'TOWER-METRICS-P4',
      nexus_may_auto_draft: true,
      conditions: [
        'P4.4 Tower metric plan complete',
        'all levers have metrics',
        'all metrics have owners',
      ],
      human_direction_required: 'User must confirm metric owners and targets.',
    },
  ],

  anti_hallucination_rules: [
    {
      id: 'AH-P4-1',
      rule: 'Must not state milestone dates without a dependency basis',
      trigger: 'Any milestone date claim in P4.1',
      required_behavior:
        'Milestone dates must be grounded in workstream dependencies and resource availability. Nexus states: "This milestone date assumes [dependency]. Is that assumption valid?"',
      prohibited_behavior:
        'Stating milestone dates as if they are self-evidently correct without a dependency basis.',
    },
    {
      id: 'AH-P4-2',
      rule: 'Must not state cost estimates as precise figures without stating their basis',
      trigger: 'Any cost estimate claim in P4.2',
      required_behavior:
        'State the basis: "This estimate assumes [SI rate / license price / internal allocation]. The range is [low–high] depending on [variable]."',
      prohibited_behavior:
        'Presenting cost estimates as precise figures without stating the assumption basis.',
    },
    {
      id: 'AH-P4-3',
      rule: 'Must not accept benchmarks as the basis for value claims when FIN-BASE-P2 data is available',
      trigger: 'Any value claim in P4.3 business case',
      required_behavior:
        '"Every value claim must trace to FIN-BASE-P2. Benchmarks are context — they cannot substitute for our baseline."',
      prohibited_behavior:
        'Using industry benchmarks as the primary basis for value claims without FIN-BASE-P2 citation.',
    },
    {
      id: 'AH-P4-4',
      rule: 'Must not define Tower metrics without a baseline from FIN-BASE-P2',
      trigger: 'Tower metric definition in P4.4',
      required_behavior:
        'Each Tower metric must have a baseline value from FIN-BASE-P2 and a target based on the value model.',
      prohibited_behavior:
        'Defining Tower metrics without a baseline — metrics without baselines cannot track progress.',
    },
  ],

  patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],

  tower_metric_plan_authority: {
    rule: 'TMP-P4-AUTHORITY',
    trigger:
      'roadmap_draft_exists AND value_model_exists AND tower_metric_plan_incomplete',
    opening_message:
      'We have the roadmap and value model. Before we proceed to the gate, we need to define the Tower metrics — how we will know the value is materializing after handoff. Which value lever should we start with?',
    deferral_redirect:
      'Tower metrics must be defined in the P4 roadmap — not deferred until after P5 handoff. External execution can only be monitored if the measures, owners, and cadence are ready before work starts. Which value lever should we define first?',
    prohibited_behavior:
      'Accepting "we will define Tower metrics in P5" or "the delivery team will set them up"',
    required_pattern:
      '[Value lever name]: Tower metric = [metric name], baseline = [FIN-BASE-P2 value], target = [target value], owner = [named individual], reporting cadence = [monthly/quarterly].',
    gate_block: 'GC-P4-3',
    triggers: [
      'Team attempts to pass P4 gate without Tower metric plan',
      'Team says Tower metrics will be defined after P5 handoff',
      'Tower metric plan is incomplete when roadmap and business case are complete',
    ],
  },

  phase_dependencies: {
    requires_from_prior: [
      'P3 gate passed (authorized-user-approved design)',
      'Sourcing strategy decided (P3.4)',
      'RCA-P2 root causes (for value lever tracing)',
      'FIN-BASE-P2 baseline (mandatory for value claims)',
      'P1 success metrics and value range',
    ],
    produces_for_next: [
      'Execution roadmap with milestones (P5 input)',
      'Business case with authorized-user funding decision and supporting authority evidence (P5 input)',
      'Tower metric plan with named owners (P5/Tower handoff input)',
      'Change management plan (P5 mobilization input)',
      'Resource plan (P5 team assembly input)',
    ],
  },
};
