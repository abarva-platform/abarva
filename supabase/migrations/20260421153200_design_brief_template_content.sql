-- Migration 20260421153200 · design brief template content
--
-- Why: populate the design_brief deliverable_type with a real template,
-- rubric, and generation prompt for Phase 2 sign-off.
-- Safety: insert-or-fill-only. Existing populated rows are preserved.

BEGIN;

INSERT INTO deliverable_types (
  type_key,
  title,
  description,
  applicable_phases,
  applicable_topics,
  template_structure,
  required_data_inputs,
  quality_rubric,
  generation_prompt_template,
  output_format,
  maturity
)
VALUES (
  'design_brief',
  'Design Brief',
  'Phase 2 design brief covering solution shape, options, tradeoffs, data flow, and the decision to lock before Execute',
  ARRAY[2, 3],
  ARRAY[
    'analytics_modernization',
    'ai_governance_implementation',
    'prior_auth_automation',
    'vendor_consolidation_ai'
  ],
  '{
    "sections": [
      {
        "key": "design_objective",
        "title": "Design Objective",
        "required": true,
        "description": "Restate the business problem as a design goal that the solution must satisfy.",
        "example_completed": "Design an AI-assisted operating model that reduces associate task friction without introducing new shadow workflows or store-manager burden."
      },
      {
        "key": "one_irreversible_decision",
        "title": "One Irreversible Decision",
        "required": true,
        "description": "Name the architectural or vendor decision that matters most and explain why it is hard to unwind.",
        "example_completed": "The irreversible decision is whether task orchestration becomes the system of engagement or remains a thin layer on top of existing store tools."
      },
      {
        "key": "solution_architecture",
        "title": "Solution Architecture",
        "required": true,
        "description": "Describe the target solution shape, components, and operating boundaries.",
        "example_completed": "Architecture: workflow orchestration layer, associate mobile surface, manager exception console, analytics telemetry feed, and governance controls for policy updates."
      },
      {
        "key": "vendor_or_build_options",
        "title": "Vendor or Build Options",
        "required": true,
        "description": "Summarize the shortlist or build options and the case for each.",
        "example_completed": "Options considered: extend existing WFM stack, deploy a workflow-orchestration vendor, or build a thin custom layer around existing mobile tooling."
      },
      {
        "key": "tradeoffs_and_recommendation",
        "title": "Tradeoffs + Recommendation",
        "required": true,
        "description": "Make the tradeoffs explicit and recommend the preferred path.",
        "example_completed": "Recommendation: workflow-orchestration vendor with limited custom extensions. Tradeoff: faster time to value versus less full-stack control."
      },
      {
        "key": "data_flow_and_control_points",
        "title": "Data Flow + Control Points",
        "required": true,
        "description": "Show what data moves, where controls sit, and which decisions require governance.",
        "example_completed": "Data flows from task systems, store telemetry, and labor planning into orchestration; control points include policy updates, exception routing, and KPI threshold changes."
      },
      {
        "key": "delivery_dependencies",
        "title": "Delivery Dependencies",
        "required": true,
        "description": "Call out the prerequisite teams, systems, and commitments needed before Execute starts.",
        "example_completed": "Dependencies: mobile-device readiness, store-ops enablement owner, labor-policy review, and API access to the tasking backbone."
      },
      {
        "key": "decision_and_open_questions",
        "title": "Decision + Open Questions",
        "required": true,
        "description": "State the design decision to be signed off and the remaining open questions that must be closed in Execute planning.",
        "example_completed": "Approve the preferred design path and pilot vendor approach; open questions are rollout cadence, field support coverage, and store-format exceptions."
      }
    ],
    "format": "markdown",
    "rendering_notes": "Optimize for design sign-off. Keep the brief commercially sharp, explicit about tradeoffs, and free of generic architecture filler."
  }'::jsonb,
  '{
    "engagement": [
      "phase_1.findings",
      "phase_2.design_decisions",
      "sponsor.name"
    ],
    "client": [
      "name",
      "industry"
    ],
    "topic": [
      "topic_key",
      "vendor_landscape",
      "phase_playbook",
      "failure_modes"
    ]
  }'::jsonb,
  '[
    {
      "criterion": "architecture_is_specific",
      "rationale": "The brief must name the actual solution components and boundaries; vague architecture language is not actionable.",
      "severity": "blocker"
    },
    {
      "criterion": "tradeoffs_are_real",
      "rationale": "A design recommendation is only credible if it names the downside of the chosen path and the upside of the rejected paths.",
      "severity": "blocker"
    },
    {
      "criterion": "design_claims_are_cited",
      "rationale": "Assertions about sponsor preference, design constraints, vendor fit, or dependency risk must trace back to source turns or topic evidence.",
      "severity": "blocker"
    },
    {
      "criterion": "irreversible_decision_is_explicit",
      "rationale": "The sponsor should immediately understand the biggest lock-in decision and why it matters now.",
      "severity": "major"
    },
    {
      "criterion": "dependencies_support_execute",
      "rationale": "The brief should set Execute up for success by naming the real dependencies that could stall delivery.",
      "severity": "major"
    },
    {
      "criterion": "recommendation_reads_confident_not_hyped",
      "rationale": "The writing should feel like a strong consulting recommendation, not marketing copy or speculative product prose.",
      "severity": "minor"
    }
  ]'::jsonb,
  $prompt$
You are drafting a Design Brief in Markdown.

ENGAGEMENT
${engagement.id}

CLIENT
${client.name}

STRUCTURE
${structure_as_outline}

CURRENT STATE
${current_state_baseline_from_phase_1}

TOPIC PLAYBOOK
${topic.phase_playbook}

TOPIC VENDOR LANDSCAPE
${topic.vendor_landscape}

TOPIC FAILURE MODES
${topic.failure_modes}

QUALITY RUBRIC
${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Every specific claim, recommendation, dependency, and tradeoff must cite one or more bracketed turn references like [turn 04].
- Be explicit about the one irreversible design decision and why it is hard to unwind.
- Name at least two credible options before recommending one.
- If the evidence is incomplete, write [DATA GAP: what is missing] rather than filling with generic architecture boilerplate.
- Keep the tone sponsor-ready, commercially grounded, and decisive.

Write the full design brief now.
  $prompt$,
  'markdown',
  'production'
)
ON CONFLICT (type_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  applicable_phases = EXCLUDED.applicable_phases,
  applicable_topics = EXCLUDED.applicable_topics,
  template_structure = EXCLUDED.template_structure,
  required_data_inputs = EXCLUDED.required_data_inputs,
  quality_rubric = EXCLUDED.quality_rubric,
  generation_prompt_template = EXCLUDED.generation_prompt_template,
  output_format = EXCLUDED.output_format,
  maturity = EXCLUDED.maturity
WHERE
  deliverable_types.template_structure = '{}'::jsonb
  OR deliverable_types.quality_rubric = '{}'::jsonb
  OR deliverable_types.quality_rubric = '[]'::jsonb
  OR COALESCE(deliverable_types.generation_prompt_template, '') = '';

NOTIFY pgrst, 'reload schema';

COMMIT;
