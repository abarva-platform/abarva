import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { timelineResourceEstimateDeliverableType } from '@/lib/deliverables/templates/timeline_resource_estimate';
import { executionRoadmapTrackerDeliverableType } from '@/lib/deliverables/templates/execution_roadmap_tracker';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// Pack L · Phase 3 · Deliverable type specifications. The Business Case (3.1)
// is fully spec'd; 3.2-3.5 are transcribed from spec hints plus consultant
// defaults. All templates carry quality_rubric + generation_prompt_template
// so the Phase 4 generation pipeline can call them end-to-end.
//
// Content maturity: Business Case = 'production', others = 'pilot' until
// the generation pipeline validates them.

interface DeliverableTypeSeed {
  type_key: string;
  title: string;
  description: string;
  applicable_phases: number[];
  applicable_topics: string[];
  template_structure: Record<string, unknown>;
  required_data_inputs: Record<string, unknown>;
  quality_rubric: Record<string, unknown> | Array<Record<string, unknown>>;
  generation_prompt_template: string;
  output_format: 'markdown' | 'docx' | 'pptx' | 'xlsx' | 'pdf';
  maturity: 'draft' | 'pilot' | 'production' | 'deprecated';
}

const ALL_SPEC_TOPICS = [
  'analytics_modernization',
  'ai_governance_implementation',
  'prior_auth_automation',
  'vendor_consolidation_ai',
];

const TYPES: DeliverableTypeSeed[] = [
  // ── Phase 0 · Start + Phase 1 · Diagnose core artifacts ───────────────
  {
    type_key: 'stakeholder_map',
    title: 'Stakeholder Map',
    description: 'Structured view of sponsor, co-sponsor, data owners, and influence dynamics around the program',
    applicable_phases: [0, 1],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'stakeholder_roster', title: 'Stakeholder Roster', required: true, components: ['name', 'role', 'relationship_to_program', 'commitment_status'] },
        { key: 'engagement_strategy', title: 'Engagement Strategy', required: true, components: ['what_we_need', 'how_to_approach', 'sensitivities', 'timing', 'intermediary'] },
        { key: 'power_interest_view', title: 'Power / Interest View', required: true, components: ['quadrant_assignment', 'influence_notes'] },
        { key: 'org_graph_view', title: 'Org Graph View', required: false, components: ['reporting_lines', 'influence_network'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_0.intake_turns', 'sponsor', 'co_sponsors', 'decision_rights'],
      client: ['org_context', 'known_stakeholders'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'stakeholder_specificity', weight: 30, criteria: 'Stakeholders are named with specific roles, asks, and sensitivities rather than generic placeholders' },
        { name: 'actionability', weight: 25, criteria: 'Each stakeholder has an explicit engagement strategy, timing, and what the team needs from them' },
        { name: 'political_honesty', weight: 25, criteria: 'Influence dynamics and likely resistance are named clearly, not softened into generic collaboration language' },
        { name: 'structural_completeness', weight: 20, criteria: 'Roster, engagement strategy, and power-interest view are all populated' },
      ],
    },
    generation_prompt_template: `Produce a Stakeholder Map for \${engagement.id} (\${client.name}), topic: \${topic?.title ?? 'program-wide'}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_0_turns}
\${recent_turn_summary}
\${client.org_context}

RULES
- Name real stakeholders only when the conversation or client context supports them.
- Every stakeholder needs a concrete ask and a practical engagement strategy.
- Explicitly call out sensitivities, likely resistance, and who should make the introduction.
- Use [DATA GAP: description] if a required section lacks signal.

Generate the full stakeholder map now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
  {
    type_key: 'risk_register',
    title: 'Risk Register',
    description: 'Early warning register covering political, data, timing, scope, stakeholder, and technical risks',
    applicable_phases: [0, 1, 2, 3, 4],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'risk_table', title: 'Risk Table', required: true, components: [{ table: { columns: ['id', 'category', 'description', 'likelihood', 'impact', 'mitigation', 'owner', 'status'] } }] },
        { key: 'triggering_signals', title: 'Triggering Signals', required: true, components: ['risk_id', 'signal_list'] },
        { key: 'contingencies', title: 'Contingencies', required: true, components: ['risk_id', 'contingency_plan'] },
        { key: 'history', title: 'History', required: false, components: ['timestamp', 'event', 'owner'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_0.intake_turns', 'current_phase', 'open_decisions'],
      topic: ['failure_modes'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'risk_honesty', weight: 35, criteria: 'Names realistic high-probability risks, including political and data-access risks, not just generic delivery boilerplate' },
        { name: 'signal_quality', weight: 25, criteria: 'Each meaningful risk has concrete triggering signals that a program lead could watch for in real time' },
        { name: 'mitigation_actionability', weight: 25, criteria: 'Mitigations and contingencies have named owners and practical steps' },
        { name: 'coverage', weight: 15, criteria: 'Register spans multiple categories relevant to the current phase and topic' },
      ],
    },
    generation_prompt_template: `Produce a Risk Register for \${engagement.id} (\${client.name}), topic: \${topic?.title ?? 'program-wide'}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_0_turns}
\${recent_turn_summary}
\${topic.failure_modes}

RULES
- Include political, stakeholder, data, timing, scope, and technical risks where supported.
- Each material risk needs triggering signals, mitigation owner, and contingency plan.
- Do not dilute severity; call out the few risks most likely to derail the program.
- Use [DATA GAP: description] when required information is missing.

Generate the full risk register now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
  {
    type_key: 'hypothesis_tree',
    title: 'Hypothesis Tree',
    description: 'Living decomposition of the root problem into testable hypotheses, evidence, and open questions',
    applicable_phases: [1],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'root_question', title: 'Root Question', required: true, components: ['question', 'initial_hypothesis', 'status'] },
        { key: 'branches', title: 'Branches', required: true, components: ['hypothesis', 'status', 'estimated_magnitude', 'confidence', 'evidence_supporting', 'evidence_contradicting', 'key_questions'] },
        { key: 'diagnostic_methodology', title: 'Diagnostic Methodology', required: true },
        { key: 'exclusions', title: 'Exclusions', required: false },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.turns', 'phase_0.problem_statement'],
      topic: ['failure_modes', 'success_signals'],
      peer_decisions: ['phase_cohort'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'causal_specificity', weight: 30, criteria: 'Hypotheses are concrete and causal, not vague restatements of the problem' },
        { name: 'evidence_balance', weight: 25, criteria: 'Each branch includes both supporting and contradicting evidence where available' },
        { name: 'magnitude_discipline', weight: 25, criteria: 'Estimated magnitude and confidence are explicit rather than implied' },
        { name: 'diagnostic_logic', weight: 20, criteria: 'Tree structure shows how the investigation will narrow the problem rather than just listing ideas' },
      ],
    },
    generation_prompt_template: `Produce a Hypothesis Tree for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_0_turns}
\${engagement.phase_1_turns}
\${topic.failure_modes}
\${recent_turn_summary}

RULES
- Root question must match the sponsor's actual problem statement.
- Branches must be causal, testable, and framed with status + confidence.
- Include contradicting evidence when it exists; do not force a tidy story.
- Use [DATA GAP: description] if evidence is still missing for a required branch.

Generate the full hypothesis tree now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
  {
    type_key: 'workstream_charter',
    title: 'Workstream Charter',
    description: 'Detailed charter for a diagnostic workstream tied to one or more hypothesis branches',
    applicable_phases: [1],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'objective', title: 'Objective', required: true },
        { key: 'scope', title: 'Scope', required: true, components: ['in_scope', 'out_of_scope'] },
        { key: 'analytical_approach', title: 'Analytical Approach', required: true, components: ['methodology', 'data_sources', 'techniques', 'deliverables'] },
        { key: 'timeline', title: 'Timeline', required: true, components: ['start_date', 'end_date', 'milestones'] },
        { key: 'team', title: 'Team', required: true, components: ['lead', 'contributors', 'data_providers', 'interview_subjects'] },
        { key: 'current_status', title: 'Current Status', required: true, components: ['phase', 'completion_pct', 'blockers', 'key_findings_so_far'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.turns', 'phase_1.hypotheses', 'stakeholders'],
      topic: ['phase_playbook'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'workstream_focus', weight: 30, criteria: 'Workstream objective is narrow and tied to specific hypothesis branches rather than broad consulting boilerplate' },
        { name: 'execution_clarity', weight: 25, criteria: 'Timeline, team, and analytical approach are specific enough that an operator could run the workstream from the charter' },
        { name: 'scope_discipline', weight: 25, criteria: 'In-scope and out-of-scope are explicit so the workstream does not sprawl' },
        { name: 'status_signal', weight: 20, criteria: 'Current status names blockers and early findings, not just generic progress language' },
      ],
    },
    generation_prompt_template: `Produce a Workstream Charter for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_1_turns}
\${engagement.phase_1_hypotheses}
\${topic.phase_playbook}

RULES
- Tie the charter to named hypothesis branches where possible.
- Scope must be explicit and bounded.
- Timeline must include milestones with dates or sequencing logic.
- Current status must name blockers honestly if the workstream is not clean.

Generate the workstream charter now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
  {
    type_key: 'data_request_log',
    title: 'Data Request Log',
    description: 'Central log of required data requests, status history, access strategy, and governance notes',
    applicable_phases: [1, 2],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'requests', title: 'Requests', required: true, components: ['data_needed', 'granularity', 'format', 'purpose', 'requested_from', 'status', 'access_strategy', 'expected_date'] },
        { key: 'status_history', title: 'Status History', required: true, components: ['request_id', 'timestamp', 'status', 'note', 'owner'] },
        { key: 'access_governance', title: 'Access Governance', required: true, components: ['who_can_see_raw_data', 'who_can_see_analysis', 'data_retention_policy', 'compliance_notes'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.turns', 'data_needs', 'stakeholders'],
      client: ['compliance_requirements'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'request_specificity', weight: 30, criteria: 'Requests are concrete about granularity, format, purpose, and requester rather than generic asks for data' },
        { name: 'political_realism', weight: 25, criteria: 'Access strategy reflects how the request actually gets made in the organization' },
        { name: 'governance_completeness', weight: 25, criteria: 'Raw-data access, analysis access, retention, and compliance notes are covered where relevant' },
        { name: 'status_accuracy', weight: 20, criteria: 'Status and history reflect the real current state, including blocked or denied requests' },
      ],
    },
    generation_prompt_template: `Produce a Data Request Log for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_1_turns}
\${recent_turn_summary}
\${client.compliance_requirements}

RULES
- Each request must say what data is needed, why, from whom, and how the team plans to get it.
- Keep blocked or denied requests visible; do not sanitize them away.
- Governance section must specify access boundaries if the data is sensitive.
- Use [DATA GAP: description] when required information is missing.

Generate the data request log now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
  {
    type_key: 'interview_log',
    title: 'Stakeholder Interview Log',
    description: 'Running log of stakeholder interviews, notes, synthesis, hypothesis updates, and follow-ups',
    applicable_phases: [1],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'interviews', title: 'Interviews', required: true, components: ['subject', 'status', 'scheduled_date', 'purpose', 'related_hypotheses'] },
        { key: 'pre_interview_brief', title: 'Pre-Interview Brief', required: true, components: ['background', 'sensitivities', 'approach', 'key_questions', 'avoid'] },
        { key: 'interview_notes', title: 'Interview Notes', required: false, components: ['raw_notes', 'key_quotes', 'body_language_observations', 'follow_ups_mentioned'] },
        { key: 'synthesis', title: 'Synthesis', required: false, components: ['key_findings', 'hypothesis_updates', 'pattern_observations', 'data_requests_generated', 'relationship_assessment'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.turns', 'stakeholders', 'hypothesis_tree'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'interview_preparation', weight: 25, criteria: 'Pre-brief is specific about background, sensitivities, and the right opening angle' },
        { name: 'note_quality', weight: 25, criteria: 'Notes capture actual quotes, observations, and follow-ups rather than generic summaries' },
        { name: 'diagnostic_linkage', weight: 30, criteria: 'Synthesis updates hypotheses or data requests explicitly rather than standing alone as an interview memo' },
        { name: 'relationship_signal', weight: 20, criteria: 'Log captures how the stakeholder now feels about the program, not just what they said' },
      ],
    },
    generation_prompt_template: `Produce a Stakeholder Interview Log for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_1_turns}
\${engagement.hypothesis_tree}
\${engagement.stakeholders}

RULES
- Distinguish scheduled, conducted, and synthesized interviews clearly.
- Include actual quotes and concrete follow-ups when the conversation supports them.
- Synthesis must update hypotheses, data requests, or relationship assessments explicitly.
- Do not invent interview notes for interviews that have not happened.

Generate the interview log now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
  {
    type_key: 'diagnostic_findings',
    title: 'Diagnostic Findings Document',
    description: 'Living synthesis of the Phase 1 diagnostic, including executive summary, workstream findings, pattern matches, and recommendations',
    applicable_phases: [1, 2],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'executive_summary', title: 'Executive Summary', required: true, components: ['problem_restatement', 'current_working_attribution', 'key_insights', 'unexpected_findings', 'open_questions'] },
        { key: 'findings_by_workstream', title: 'Findings by Workstream', required: true, components: ['workstream_id', 'finding', 'evidence_summary', 'confidence', 'implications'] },
        { key: 'pattern_matches', title: 'Pattern Matches', required: true, components: ['pattern_id', 'pattern_name', 'confidence', 'evidence', 'implications'] },
        { key: 'contradictions_surfaced', title: 'Contradictions Surfaced', required: false, components: ['contradiction_type', 'description', 'stakes'] },
        { key: 'recommendations', title: 'Recommendations', required: true, components: ['phase_2_scope_implications', 'intervention_candidates', 'decision_needed'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.findings', 'workstream_outputs', 'hypothesis_tree', 'interview_log'],
      topic: ['failure_modes', 'success_signals'],
      peer_decisions: ['phase_cohort'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'executive_clarity', weight: 25, criteria: 'Exec summary explains the current working picture quickly and concretely' },
        { name: 'evidence_density', weight: 30, criteria: 'Findings cite evidence, confidence, and implications rather than reading like unsupported narrative' },
        { name: 'pattern_relevance', weight: 20, criteria: 'Pattern matches are tied to actual evidence and explain why they matter for next-phase design' },
        { name: 'decision_orientation', weight: 25, criteria: 'Recommendations clearly set up the Phase 2 decision rather than merely recapping findings' },
      ],
    },
    generation_prompt_template: `Produce a Diagnostic Findings Document for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

SOURCE CONTEXT
\${engagement.phase_1_findings}
\${engagement.workstream_outputs}
\${engagement.hypothesis_tree}
\${engagement.interview_log}
\${topic.failure_modes}
\${peer_cohort_summary}

RULES
- Executive summary must state the current working attribution and open questions explicitly.
- Findings by workstream must include evidence summary, confidence, and implications.
- Pattern matches must cite the evidence that triggered them.
- Recommendations must set up a concrete Phase 2 decision.

Generate the diagnostic findings document now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },

  // ── 3.1 · Business Case (spec-canonical) ──────────────────────────────
  {
    type_key: 'business_case',
    title: 'Business Case',
    description: 'Quantified investment rationale with scenarios and implementation path',
    applicable_phases: [2, 3],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'executive_summary', title: 'Executive Summary', length_words: [250, 400], required: true, components: ['recommendation', 'investment', 'return', 'timeline'] },
        { key: 'strategic_context', title: 'Strategic Context', length_words: [400, 700], required: true, components: ['business_driver', 'board_alignment', 'competitive_context'] },
        {
          key: 'current_state_baseline',
          title: 'Current State Baseline',
          required: true,
          data_sources: ['engagement.phase_1.findings', 'tech_stack', 'cost_centers', 'benchmarks'],
          components: [
            { narrative: '300-500 words' },
            { cost_breakdown_table: 'required' },
            { pattern_diagnosis: 'Genome patterns active' },
            { peer_benchmark_comparison: 'required' },
          ],
        },
        { key: 'target_state_vision', title: 'Target State Vision', length_words: [400, 600], required: true, components: ['outcomes', 'architecture_reference', 'governance_overlay'] },
        {
          key: 'investment_requirement',
          title: 'Investment Requirement',
          required: true,
          components: [
            { phased_investment_table: { columns: ['phase', 'year_1', 'year_2', 'year_3', 'total'] } },
            { investment_by_category_chart: { categories: ['software', 'services', 'internal_labor', 'infrastructure', 'training'] } },
            { assumptions_table: 'required' },
          ],
        },
        {
          key: 'financial_return',
          title: 'Financial Return',
          required: true,
          components: [
            { npv_calculation: { discount_rate: 10, time_horizon_years: 3, sensitivity_range: [-20, 20] } },
            { irr_calculation: 'required' },
            { payback_period_months: 'required' },
            { scenario_analysis: { scenarios: ['conservative', 'base', 'aggressive'] } },
            { risk_adjusted_npv: 'required' },
          ],
        },
        { key: 'qualitative_benefits', title: 'Qualitative Benefits', length_words: [300, 500], required: true, components: ['risk_reduction', 'strategic_optionality', 'capability_building'] },
        {
          key: 'implementation_approach',
          title: 'Implementation Approach',
          required: true,
          components: [
            { phased_timeline: 'required' },
            { governance_model: 'required' },
            { resource_plan: 'required' },
            { dependencies: 'required' },
          ],
        },
        {
          key: 'risks_and_mitigations',
          title: 'Risks & Mitigations',
          required: true,
          components: [{ risk_register_table: { columns: ['risk', 'probability', 'impact', 'mitigation', 'owner'] } }],
        },
        { key: 'decision_ask', title: 'Decision Ask', length_words: [150, 250], required: true },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.findings', 'phase_2.design', 'sponsor.decision_authority', 'industry'],
      client: ['financial_profile (revenue, IT budget, AI budget)', 'tech_stack', 'cost_breakdown', 'benchmarks'],
      topic: ['vendor_landscape', 'success_signals', 'failure_modes'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'quantification', weight: 25, criteria: 'Every claim about benefits, costs, timelines has specific numbers. No \'approximately\', \'significantly\', or vague percentages.', threshold: 'All 9+ required components have numbers; fewer than 3 vague quantifiers per section' },
        { name: 'source_traceability', weight: 20, criteria: 'Every benchmark + baseline + assumption cites a source (client data, industry source, or explicit assumption)', threshold: 'Zero uncited claims' },
        { name: 'scenario_rigor', weight: 20, criteria: 'Conservative / base / aggressive scenarios differ by at least 40% on NPV, have distinct assumptions, and risk-adjusted NPV is shown', threshold: 'All three scenarios have distinct narrative justifications' },
        { name: 'structural_completeness', weight: 15, criteria: 'All required sections present, all required components populated', threshold: '100%' },
        { name: 'clarity_and_narrative', weight: 10, criteria: "Reads like a senior consultant's work — tight prose, visual hierarchy, no filler" },
        { name: 'risk_honesty', weight: 10, criteria: 'Risk register includes high-probability risks (not just low-probability) and honest mitigation assessments' },
      ],
    },
    generation_prompt_template: `You are producing a Business Case for engagement \${engagement.id} with \${client.name}.

The topic is \${topic.title}. The sponsor is \${sponsor.name}, whose decision authority is \${sponsor.decision_authority}.

STRUCTURE (follow exactly):
\${structure_as_outline}

CLIENT CONTEXT
\${client.financial_profile}
\${current_state_baseline_from_phase_1}
\${target_state_from_phase_2}

TOPIC INTELLIGENCE
\${topic.vendor_landscape}
\${topic.success_signals}
\${topic.failure_modes}

BENCHMARKS (use these for peer comparisons)
\${industry_benchmarks_retrieved}

QUALITY BAR
\${quality_rubric.criteria}
Do not produce a section that doesn't meet the rubric. If data is missing for a section,
emit a placeholder marked [DATA GAP: description] so the user knows what to collect.

Generate the complete business case now.`,
    output_format: 'markdown',
    maturity: 'production',
  },

  // ── 3.2 · Current State Assessment ─────────────────────────────────────
  {
    type_key: 'current_state_assessment',
    title: 'Current State Assessment',
    description: "Diagnostic-phase synthesis of the client's current landscape, pain drivers, and quantified gaps",
    applicable_phases: [1],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'context', title: 'Context & Scope', length_words: [200, 400], required: true },
        { key: 'methodology', title: 'Methodology', length_words: [150, 300], required: true, components: ['data_sources', 'interview_list', 'analytical_frames_applied'] },
        {
          key: 'findings_by_dimension',
          title: 'Findings by Dimension',
          required: true,
          components: [
            { dimension: 'organization', narrative: '200-400 words', signals: 'quantified' },
            { dimension: 'technology', narrative: '200-400 words', tech_stack_table: 'required' },
            { dimension: 'data', narrative: '200-400 words', data_quality_scorecard: 'required' },
            { dimension: 'governance', narrative: '200-400 words', maturity_assessment: 'required' },
            { dimension: 'financials', narrative: '200-400 words', spend_attribution_table: 'required' },
          ],
        },
        { key: 'pattern_diagnosis', title: 'Pattern Diagnosis', required: true, components: ['active_genome_patterns', 'failure_rate_citations', 'confidence_scores'] },
        { key: 'peer_benchmark_comparison', title: 'Peer Benchmark Comparison', required: true, components: ['benchmark_table', 'percentile_positioning', 'outlier_narrative'] },
        { key: 'gaps_and_opportunities', title: 'Gaps & Opportunities', length_words: [400, 800], required: true },
        { key: 'priority_recommendations', title: 'Priority Recommendations', length_words: [200, 400], required: true, components: ['ranked_list', 'rationale', 'sequencing_hints'] },
        { key: 'appendices', title: 'Appendices', required: false },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.findings', 'turn_history', 'active_patterns'],
      client: ['tech_stack', 'data_sources', 'cost_centers', 'benchmarks'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'specificity', weight: 30, criteria: 'Every finding is anchored to specific systems, numbers, or quotes — not generic industry observations', threshold: 'Zero generic findings; every claim traceable' },
        { name: 'source_traceability', weight: 25, criteria: 'Interviews + data sources explicitly cited per finding', threshold: 'Every finding has ≥1 traced source' },
        { name: 'pattern_honesty', weight: 20, criteria: 'Pattern diagnosis names both confirmed and suspected patterns with confidence scores; does not over-claim', threshold: 'Confidence scores present for every named pattern' },
        { name: 'structural_completeness', weight: 15, criteria: 'All five dimensions covered, pattern diagnosis present, benchmark comparison present', threshold: '100%' },
        { name: 'narrative_cohesion', weight: 10, criteria: 'Findings build toward the priority recommendations — the reader can see why the recs fall out of the analysis' },
      ],
    },
    generation_prompt_template: `Produce a Current State Assessment for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

DATA
\${engagement.phase_1_findings}
\${client.tech_stack}
\${client.cost_breakdown}
\${client.benchmarks}
Active Genome patterns: \${active_patterns_with_confidence}
Peer cohort: \${peer_cohort_summary}

RULES
- Every finding must cite its source (interview, data extract, or system of record).
- Pattern diagnosis: name only patterns where you can cite the evidence that triggered them.
- Use [DATA GAP: description] placeholders when a required dimension lacks data rather than filling with generic content.
- Avoid generic industry observations; every finding must be anchored to this client.

Generate the full assessment now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },

  // ── 3.3 · Target State Architecture ────────────────────────────────────
  {
    type_key: 'target_state_architecture',
    title: 'Target State Architecture',
    description: 'Design-phase blueprint of the target architecture, components, flows, and governance overlay',
    applicable_phases: [2],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'vision_statement', title: 'Vision Statement', length_words: [150, 300], required: true },
        { key: 'architectural_principles', title: 'Architectural Principles', length_words: [300, 600], required: true, components: ['named_principles', 'rationale_per_principle', 'trade_offs_acknowledged'] },
        { key: 'component_view', title: 'Component View', required: true, components: ['diagram_reference', 'component_table', 'per_component_ownership'] },
        { key: 'integration_view', title: 'Integration View', required: true, components: ['diagram_reference', 'data_contracts', 'api_surface'] },
        { key: 'data_flow', title: 'Data Flow', required: true },
        { key: 'governance_overlay', title: 'Governance Overlay', required: true },
        { key: 'migration_considerations', title: 'Migration Considerations', required: true },
        { key: 'implementation_approach', title: 'Implementation Approach', required: true },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.findings', 'phase_2.design_decisions'],
      client: ['tech_stack', 'data_sources'],
      topic: ['vendor_landscape', 'typical_deliverables'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'principle_clarity', weight: 25, criteria: 'Architectural principles are named, justified, and trade-offs acknowledged — not generic platitudes' },
        { name: 'component_coverage', weight: 25, criteria: 'Every in-scope capability has a named component with owner and interfaces' },
        { name: 'transition_realism', weight: 20, criteria: 'Migration path addresses concurrency of old and new, data preservation, and cutover criteria' },
        { name: 'governance_completeness', weight: 15, criteria: 'Governance overlay specifies who/what/when/how — not just that governance exists' },
        { name: 'visual_quality', weight: 15, criteria: 'Component and integration diagrams present and legible (even in markdown as mermaid or ascii)' },
      ],
    },
    generation_prompt_template: `Produce a Target State Architecture for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

DESIGN DECISIONS FROM PHASE 2
\${engagement.phase_2_design_decisions}

CURRENT STATE (for contrast)
\${current_state_summary}

TOPIC VENDOR LANDSCAPE
\${topic.vendor_landscape}

RULES
- Architectural principles must be testable — each one should make some design choices unambiguously better or worse.
- Every component must name an owner, an interface surface, and a lifecycle state.
- Include mermaid diagrams for component view, integration view, data flow.
- Migration section must address concurrency, data preservation, cutover criteria.

Generate the architecture document now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },

  // ── 3.4 · Roadmap ──────────────────────────────────────────────────────
  {
    type_key: 'roadmap',
    title: 'Roadmap',
    description: 'Phased execution plan with gates, initiatives, milestones, dependencies, and governance cadence',
    applicable_phases: [2, 3],
    applicable_topics: ALL_SPEC_TOPICS,
    template_structure: {
      sections: [
        { key: 'vision_recap', title: 'Vision Recap', length_words: [150, 300], required: true },
        { key: 'phase_definitions', title: 'Phase Definitions', required: true, components: ['phase_scope', 'gate_criteria_per_phase'] },
        { key: 'initiatives_per_phase', title: 'Initiatives Per Phase', required: true, components: ['initiative_table_with_owner_scope_target_outcome'] },
        { key: 'milestones', title: 'Milestones', required: true, components: ['milestone_table_with_date_owner_success_signal'] },
        { key: 'dependencies', title: 'Dependencies', required: true, components: ['dependency_graph', 'critical_path_call_out'] },
        { key: 'resource_plan', title: 'Resource Plan', required: true, components: ['roles_and_allocations', 'vendor_commitments'] },
        { key: 'risk_register', title: 'Risk Register', required: true, components: [{ table: { columns: ['risk', 'probability', 'impact', 'mitigation', 'owner'] } }] },
        { key: 'governance_cadence', title: 'Governance Cadence', required: true, components: ['review_rhythm', 'escalation_path', 'outcome_verification'] },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_2.design', 'sponsor.decision_authority'],
      topic: ['phase_playbook', 'typical_deliverables', 'failure_modes'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'sequencing_logic', weight: 25, criteria: "Phase order reflects dependencies and risk — no initiative scheduled before its prerequisites", threshold: 'Zero out-of-order initiatives' },
        { name: 'gate_criteria_clarity', weight: 20, criteria: 'Every gate has measurable exit criteria — not "review complete"', threshold: 'Every gate is falsifiable' },
        { name: 'dependency_realism', weight: 20, criteria: 'Dependencies include external ones (payer APIs, vendor SLA commits, regulatory timing) not just internal' },
        { name: 'resource_honesty', weight: 20, criteria: 'Resource plan reflects realistic FTE allocation + vendor committment, not wishful thinking' },
        { name: 'risk_coverage', weight: 15, criteria: 'Risk register includes realistic high-probability risks from topic.failure_modes' },
      ],
    },
    generation_prompt_template: `Produce an execution Roadmap for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

DESIGN DECISIONS
\${engagement.phase_2_design_decisions}

TOPIC PLAYBOOK
\${topic.phase_playbook}

TOPIC FAILURE MODES TO MITIGATE
\${topic.failure_modes}

RULES
- Every phase must have falsifiable gate criteria.
- Dependencies include external (vendor SLA, payer API, regulatory) and internal.
- Resource plan uses realistic FTEs; flag shortfall if the plan assumes resources not in place.
- Risk register draws at least 3 entries from topic.failure_modes.

Generate the roadmap now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },

  // ── 3.5 · Vendor Evaluation Scorecard ──────────────────────────────────
  {
    type_key: 'vendor_evaluation_scorecard',
    title: 'Vendor Evaluation Scorecard',
    description: 'Weighted-scoring comparison of shortlisted vendors with commercial, capability, security, and reference dimensions',
    applicable_phases: [2],
    applicable_topics: ['analytics_modernization', 'ai_governance_implementation', 'vendor_consolidation_ai', 'prior_auth_automation'],
    template_structure: {
      sections: [
        { key: 'context_and_requirements', title: 'Context & Requirements', length_words: [300, 600], required: true },
        { key: 'evaluation_methodology', title: 'Evaluation Methodology', required: true, components: ['criteria_weights', 'scoring_scale', 'evidence_sources'] },
        { key: 'vendor_shortlist_rationale', title: 'Vendor Shortlist Rationale', length_words: [200, 400], required: true },
        { key: 'capability_matrix', title: 'Capability Matrix', required: true, components: [{ matrix: { rows: 'capabilities', columns: 'vendors', cells: 'weighted_score + evidence' } }] },
        { key: 'commercial_terms', title: 'Commercial Terms Comparison', required: true, components: ['pricing_model', '3yr_tco', 'contract_flexibility'] },
        { key: 'security_posture', title: 'Security Posture Assessment', required: true, components: ['certifications', 'data_residency', 'breach_history'] },
        { key: 'reference_checks', title: 'Reference Check Summary', required: true, components: ['reference_list', 'themes', 'dissenting_voices'] },
        { key: 'recommendation', title: 'Recommendation', required: true, components: ['ranked_choice', 'dissenting_considerations', 'fallback_path'] },
        { key: 'decision_ask', title: 'Decision Ask', length_words: [100, 200], required: true },
      ],
    },
    required_data_inputs: {
      engagement: ['phase_1.requirements', 'phase_2.design'],
      topic: ['vendor_landscape'],
      client: ['security_requirements', 'compliance_requirements'],
    },
    quality_rubric: {
      dimensions: [
        { name: 'criterion_clarity', weight: 25, criteria: "Weighting + scoring criteria are explicit and defensible — a peer evaluator would score within 10% of yours" },
        { name: 'scoring_transparency', weight: 25, criteria: "Every cell in the matrix cites evidence (demo, reference call, contract term, documented feature)" },
        { name: 'honest_weaknesses', weight: 20, criteria: "Each vendor's weaknesses are named explicitly, not hedged" },
        { name: 'commercial_rigor', weight: 15, criteria: '3-year TCO present with breakdown; pricing model characterized (per-seat, per-query, platform, etc.)' },
        { name: 'security_depth', weight: 15, criteria: 'Certifications + breach history + data residency covered; not just "SOC2 compliant"' },
      ],
    },
    generation_prompt_template: `Produce a Vendor Evaluation Scorecard for \${engagement.id} (\${client.name}), topic: \${topic.title}.

STRUCTURE
\${structure_as_outline}

REQUIREMENTS
\${engagement.phase_1_requirements}

TOPIC VENDOR LANDSCAPE
\${topic.vendor_landscape}

CLIENT SECURITY + COMPLIANCE REQUIREMENTS
\${client.security_requirements}

RULES
- Every matrix cell must cite evidence — demo, reference, documented feature, or contract term.
- Each vendor gets explicit weaknesses named — no hedging.
- 3-year TCO with breakdown; pricing model characterized.
- Security section goes beyond "SOC2 compliant": certifications, data residency, breach history.
- Recommendation includes dissenting considerations + fallback path.

Generate the scorecard now.`,
    output_format: 'markdown',
    maturity: 'pilot',
  },
];

function toSeedFromTemplate(template: {
  type_key: string;
  title: string;
  description: string;
  applicable_phases: readonly number[];
  applicable_topics: readonly string[];
  template_structure: unknown;
  required_data_inputs: unknown;
  quality_rubric: unknown;
  generation_prompt_template: string;
  output_format: 'markdown' | 'docx' | 'pptx' | 'xlsx' | 'pdf';
  maturity: 'draft' | 'pilot' | 'production' | 'deprecated';
}): DeliverableTypeSeed {
  return {
    type_key: template.type_key,
    title: template.title,
    description: template.description,
    applicable_phases: [...template.applicable_phases],
    applicable_topics: [...template.applicable_topics],
    template_structure: template.template_structure as Record<string, unknown>,
    required_data_inputs: template.required_data_inputs as Record<string, unknown>,
    quality_rubric: template.quality_rubric as DeliverableTypeSeed['quality_rubric'],
    generation_prompt_template: template.generation_prompt_template,
    output_format: template.output_format,
    maturity: template.maturity,
  };
}

TYPES.push(
  toSeedFromTemplate(timelineResourceEstimateDeliverableType),
  toSeedFromTemplate(executionRoadmapTrackerDeliverableType),
);

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const sb = getSb();
  let inserted = 0;
  let updated = 0;
  for (const type of TYPES) {
    const { data: existing } = await sb
      .from('deliverable_types')
      .select('id')
      .eq('type_key', type.type_key)
      .maybeSingle();

    const payload = {
      type_key: type.type_key,
      title: type.title,
      description: type.description,
      applicable_phases: type.applicable_phases,
      applicable_topics: type.applicable_topics,
      template_structure: type.template_structure,
      required_data_inputs: type.required_data_inputs,
      quality_rubric: type.quality_rubric,
      generation_prompt_template: type.generation_prompt_template,
      output_format: type.output_format,
      maturity: type.maturity,
    };

    if (existing) {
      const { error } = await sb.from('deliverable_types').update(payload).eq('id', (existing as { id: string }).id);
      if (error) throw error;
      updated += 1;
    } else {
      const { error } = await sb.from('deliverable_types').insert(payload);
      if (error) throw error;
      inserted += 1;
    }
  }
  console.log(`Deliverable types seed complete — ${inserted} inserted, ${updated} updated, ${TYPES.length} total`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
