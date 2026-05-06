// P2 Discover & Diagnose — V2 Training Pack
// T-P2 · AGENT_TRAINING_P2_DIAGNOSE
// Schema: 21-field PhasePack V2 (types.v2.ts)

import type { PhasePack } from '../types.v2';

export const P2_DIAGNOSE_PACK: PhasePack = {
  phase_id: 2,
  phase_name: 'P2 Discover & Diagnose',
  phase_intent:
    'Lock the current-state baseline with auditable evidence. P2 is the last gate before design investment. If the evidence does not support the hypothesis, recommend discontinuation here. This is the system working correctly.',

  entry_criteria: [
    {
      id: 'EC-P2-1',
      description: 'P1 gate passed and sponsor-signed charter exists',
      type: 'hard',
    },
    {
      id: 'EC-P2-2',
      description: 'Success metrics with baseline measurement path defined (from P1 gate)',
      type: 'hard',
    },
    {
      id: 'EC-P2-3',
      description: 'Evidence families planned in P0 confirmed as starting collection scope for P2',
      type: 'soft',
    },
  ],

  workflow_steps: [
    {
      step_id: 'P2.1',
      step_name: 'Evidence collection planning',
      step_goal: 'Confirm the evidence families from P0.5, establish data access, and plan the collection workplan.',
      required_user_inputs: [
        'Evidence families from P0.5',
        'Confirmation that data access is in place or identified',
      ],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],
      questions_to_ask: [
        'Which evidence families are confirmed as in scope for P2?',
        'Is data access confirmed — do we have access to the systems and data sources needed?',
        'Who is the primary data contact — who can pull the baseline metrics?',
      ],
      artifact_sections_to_update: ['discovery.evidence_plan'],
      evidence_to_capture: ['confirmed_evidence_families', 'data_access_status', 'primary_data_contact'],
      quality_checks: [
        'At least one evidence family confirmed',
        'Data access status is known (not assumed)',
        'If data access is blocked, flag as hard gate blocker',
      ],
      completion_criteria: [
        'evidence_plan_confirmed = true',
        'data_access_status_known = true',
      ],
    },
    {
      step_id: 'P2.2',
      step_name: 'Baseline data collection',
      step_goal: 'Collect the baseline data for the primary success metric and value levers. Data must be sourced from primary systems — not estimates.',
      required_user_inputs: [
        'Evidence plan from P2.1',
        'Data uploads or system-extracted data',
      ],
      accepted_uploads: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'text/plain',
        'text/csv',
        'text/markdown',
      ],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Can you upload the baseline data for [primary metric]?',
        'What is the current state of [metric] — what does the data show?',
        'Are there any gaps in the baseline data — missing time periods, excluded populations?',
      ],
      artifact_sections_to_update: ['discovery.baseline_data', 'FIN-BASE-P2'],
      evidence_to_capture: ['baseline_values_with_sources', 'data_gaps_noted', 'collection_date'],
      quality_checks: [
        'AH-P2-1: no baseline value without a source citation',
        'AH-P2-2: no estimate-based baseline when primary data is available',
        'Baseline covers the date range needed for trend analysis',
      ],
      completion_criteria: [
        'baseline_data_collected = true',
        'all_baseline_values_have_source_citations = true',
        'data_gaps_documented = true',
      ],
    },
    {
      step_id: 'P2.3',
      step_name: 'Root cause analysis',
      step_goal: 'Identify and rank the root causes of the gap between current state and target state. Root causes must be linked to evidence — not inferred from symptoms.',
      required_user_inputs: [
        'Baseline data from P2.2',
        'User input on observed causes and contributing factors',
      ],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],
      questions_to_ask: [
        'What are the 2–3 root causes of the gap — what is actually causing the current state?',
        'How confident are you that these are root causes, not symptoms — what evidence supports each?',
        'Are there any causes that are outside the scope of this Move?',
      ],
      artifact_sections_to_update: ['RCA-P2'],
      evidence_to_capture: ['root_cause_list_with_evidence_citations', 'root_cause_confidence'],
      quality_checks: [
        'Each root cause has an evidence citation',
        'Root causes are ranked by significance',
        'AH-P2-3: no root cause stated without evidence — do not infer from symptoms',
      ],
      completion_criteria: [
        'root_causes_identified = true (at least 2 ranked root causes)',
        'each_root_cause_has_evidence_citation = true',
        'RCA-P2_artifact_exists = true',
      ],
    },
    {
      step_id: 'P2.4',
      step_name: 'Hypothesis validation',
      step_goal: 'Evaluate whether the baseline evidence supports or refutes the P0/P1 hypothesis. If evidence refutes hypothesis, recommend discontinuation.',
      required_user_inputs: [
        'Root cause analysis from P2.3',
        'Baseline data from P2.2',
      ],
      accepted_uploads: [],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Does the baseline data support the hypothesis — is the problem real and significant enough?',
        'Do the root causes point to a solvable problem within scope?',
        'Is the value hypothesis still credible — should the value range be updated?',
      ],
      artifact_sections_to_update: ['discovery.hypothesis_validation'],
      evidence_to_capture: ['hypothesis_verdict', 'value_range_update'],
      quality_checks: [
        'AH-P2-4: if evidence contradicts hypothesis, Nexus must surface this directly — not soften it',
        'Discontinuation recommendation is made when evidence does not support hypothesis',
      ],
      completion_criteria: [
        'hypothesis_validated_or_refuted = true',
        'value_range_updated_from_baseline = true',
      ],
    },
    {
      step_id: 'P2.5',
      step_name: 'P2 gate readiness',
      step_goal: 'Self-evaluate all P2→P3 gate criteria. Produce gate readiness summary and gate recommendation (CONTINUE_TO_P3 or DISCONTINUE).',
      required_user_inputs: ['Completed P2.1–P2.4', 'Sponsor review of gate recommendation'],
      accepted_uploads: ['application/pdf', 'text/plain', 'text/markdown'],
      patterns_to_load: ['PAT-PRG-001'],
      questions_to_ask: [
        'Has the sponsor reviewed the discovery findings and gate recommendation?',
        'Should we recommend CONTINUE_TO_P3 or DISCONTINUE — and what is the reasoning?',
        'Are there any open items that must be resolved before P3 can begin?',
      ],
      artifact_sections_to_update: ['gate_readiness_P2', 'P2_gate_verdict'],
      evidence_to_capture: [
        'gate_recommendation',
        'per_criterion_status_evidence',
        'sponsor_review_status',
      ],
      quality_checks: [
        'Gate recommendation is CONTINUE_TO_P3 or DISCONTINUE — no ambiguous verdicts',
        'If DISCONTINUE: rationale is explicit and sponsor-confirmed',
        'All hard gate criteria have evidence citations',
      ],
      completion_criteria: [
        'gate_readiness_summary_produced = true',
        'gate_recommendation_explicit = true',
        'sponsor_confirmed_gate_recommendation = true',
      ],
    },
  ],

  phase_outcome:
    'Auditable current-state baseline with source citations, root cause analysis with ranked root causes, hypothesis validation verdict (CONTINUE_TO_P3 or DISCONTINUE), and gate readiness summary. If CONTINUE: value range refined from baseline evidence.',

  phase_scope_boundary: {
    in: [
      'Baseline data collection with source citations',
      'Root cause analysis (ranked, evidence-linked)',
      'Hypothesis validation',
      'Value range refinement from baseline',
      'P2→P3 gate evaluation and recommendation',
    ],
    out: [
      'Architecture or solution design (P3 scope)',
      'Vendor or sourcing decisions (P3/source scope)',
      'Implementation planning (P4 scope)',
      'Financial model construction (P4 scope)',
    ],
  },

  agent_posture_coaching_arc: {
    entry: 'Confirm evidence access and data availability. If data access is blocked, surface it immediately as a hard gate blocker — do not proceed with baseline collection until access is confirmed.',
    mid: 'Drive toward root cause clarity. Each root cause must have an evidence citation. If the evidence starts to contradict the hypothesis, surface this honestly — do not soften it.',
    exit: 'Produce the gate recommendation with clear rationale. If recommending discontinuation, say so directly. A DISCONTINUE verdict is not failure — it is the system working correctly.',
  },

  question_sequencing: {
    open: [
      'Is data access confirmed for the primary success metric?',
      'Which evidence families are we starting with — are these still the right ones from P0.5?',
      'Who is the primary data contact — who can pull the baseline data?',
    ],
    converge: [
      'What does the baseline data show — what is the current state of [metric]?',
      'What are the 2–3 root causes of the gap — linked to evidence?',
      'Does the baseline support the hypothesis, or does it suggest a different problem?',
    ],
    close: [
      'Should we recommend CONTINUE_TO_P3 or DISCONTINUE — and why?',
      'Has the sponsor reviewed the discovery findings and gate recommendation?',
      'Is the value range still credible, and should it be updated?',
    ],
  },

  evidence_requirements: [
    {
      id: 'ER-P2-1',
      label: 'Baseline data with source citations (FIN-BASE-P2)',
      type: 'hard',
      source: 'Uploaded data files, system exports, or direct user input with source named',
      evaluation_hint: 'Every baseline value must have a source. "Estimated" or "from memory" does not pass.',
    },
    {
      id: 'ER-P2-2',
      label: 'Root cause analysis with ranked root causes (RCA-P2)',
      type: 'hard',
      source: 'Session capture + evidence citations',
      evaluation_hint: 'At least 2 ranked root causes, each with an evidence citation.',
    },
    {
      id: 'ER-P2-3',
      label: 'Gate recommendation (CONTINUE_TO_P3 or DISCONTINUE)',
      type: 'hard',
      source: 'Gate readiness evaluation',
      evaluation_hint: 'Gate recommendation must be explicit — no ambiguous verdicts.',
    },
  ],

  exit_criteria: [
    { id: 'EX-P2-1', description: 'Baseline data collected with source citations (FIN-BASE-P2)', type: 'hard' },
    { id: 'EX-P2-2', description: 'Root cause analysis complete (RCA-P2, ≥2 ranked causes)', type: 'hard' },
    { id: 'EX-P2-3', description: 'Hypothesis validated or refuted with evidence', type: 'hard' },
    { id: 'EX-P2-4', description: 'Gate recommendation explicit (CONTINUE_TO_P3 or DISCONTINUE)', type: 'hard' },
    { id: 'EX-P2-5', description: 'Sponsor confirmed gate recommendation', type: 'hard' },
  ],

  gate_criteria: [
    {
      id: 'GC-P2-1',
      label: 'Baseline data collected with source citations',
      type: 'hard',
      evaluation: 'FIN-BASE-P2 artifact exists with data values and source citations. No estimated baselines.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P2-2',
      label: 'Root cause analysis complete',
      type: 'hard',
      evaluation: 'RCA-P2 artifact exists with at least 2 ranked root causes, each with evidence citation.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P2-3',
      label: 'Gate recommendation explicit',
      type: 'hard',
      evaluation: 'Gate verdict is CONTINUE_TO_P3 or DISCONTINUE — no hedging.',
      gating_rule: 'blocks_promotion',
    },
    {
      id: 'GC-P2-4',
      label: 'Sponsor confirmed gate recommendation',
      type: 'hard',
      evaluation: 'Sponsor has reviewed and confirmed the gate recommendation.',
      gating_rule: 'blocks_promotion',
      pilot_approval_note: 'Sponsor must confirm.',
    },
    {
      id: 'GC-P2-5',
      label: 'Value range updated from baseline evidence',
      type: 'soft',
      evaluation: 'Value range has been refined based on baseline data (or explicitly confirmed unchanged with rationale).',
      gating_rule: 'warns_only',
    },
  ],

  anti_patterns: [
    {
      id: 'AP-P2-1',
      label: 'Estimated baseline',
      detection_hint: 'Baseline values are stated without source citations or as estimates',
      what_to_flag: 'P2 baseline must be sourced from primary data. Estimates are not acceptable as the baseline for design investment.',
      mitigation: 'Require source citation for every baseline value. Push for uploaded data or system export.',
    },
    {
      id: 'AP-P2-2',
      label: 'Symptom-based root causes',
      detection_hint: 'Root causes are stated without evidence links — they describe symptoms rather than underlying causes',
      what_to_flag: 'These look like symptoms, not root causes. What is driving [symptom]? Link each root cause to the evidence that supports it.',
      mitigation: 'Push for evidence-linked root causes. Each must have a citation.',
    },
    {
      id: 'AP-P2-3',
      label: 'Hypothesis confirmation bias',
      detection_hint: 'Evidence is cherry-picked to support the hypothesis; contradicting evidence is not surfaced',
      what_to_flag: 'The evidence should tell us whether the hypothesis is right — not confirm it. Are there any data points that challenge the hypothesis?',
      mitigation: 'Surface contradicting evidence explicitly. If evidence refutes hypothesis, recommend DISCONTINUE.',
    },
    {
      id: 'AP-P2-4',
      label: 'Ambiguous gate recommendation',
      detection_hint: 'Gate recommendation uses hedging language like "proceed with caution" or "conditionally continue"',
      what_to_flag: 'The gate recommendation must be CONTINUE_TO_P3 or DISCONTINUE. Ambiguous recommendations leave the team in limbo.',
      mitigation: 'Force a binary verdict. If the team cannot decide, that itself is a signal — surface the specific blocker preventing a clear verdict.',
    },
  ],

  self_approval_rules: [
    {
      criterion_id: 'GC-P2-1',
      condition: 'FIN-BASE-P2 exists with data values and source citations',
      nexus_may_self_approve: false,
      approval_label: 'Baseline data — requires human confirmation of source citations',
    },
    {
      criterion_id: 'GC-P2-2',
      condition: 'RCA-P2 exists with ranked root causes and evidence citations',
      nexus_may_self_approve: false,
      approval_label: 'Root cause analysis — requires human review',
    },
    {
      criterion_id: 'GC-P2-3',
      condition: 'Gate recommendation is explicit (CONTINUE_TO_P3 or DISCONTINUE)',
      nexus_may_self_approve: false,
      approval_label: 'Gate recommendation — requires sponsor confirmation',
    },
    {
      criterion_id: 'GC-P2-4',
      condition: 'Sponsor has confirmed gate recommendation in session or via upload',
      nexus_may_self_approve: false,
      approval_label: 'Sponsor confirmation — requires human confirmation',
    },
    {
      criterion_id: 'GC-P2-5',
      condition: 'Value range updated or explicitly confirmed unchanged',
      nexus_may_self_approve: true,
      approval_label: 'Nexus self-approved: value range updated from baseline',
    },
  ],

  first_message: [
    {
      variant: 'default',
      template: "I am scoped to [Move name], currently in P2 Discover & Diagnose. The P1 charter is signed. P2 goal: establish the current-state baseline with auditable evidence and recommend whether to continue to P3 or discontinue. Let us start with data access — is the data we need available?",
    },
  ],

  fixtures: [
    {
      id: 'FX-P2-1',
      name: 'Estimated baseline',
      description: 'User provides baseline values from memory without sources',
      input: { baseline: 'AHT is about 8 minutes based on what the team told me' },
      expected_behaviors: [
        'AH-P2-1 fires',
        'Nexus flags that "about" and "team told me" are not source citations',
        'Nexus asks for system-extracted data or report with source',
      ],
      prohibited_behaviors: ['Accepting estimated baseline without source citation'],
    },
  ],

  coaching_rules: [
    {
      id: 'CR-P2-1',
      rule: 'When evidence contradicts hypothesis, surface it directly — do not soften the finding',
      trigger: 'Baseline data does not support the P0/P1 hypothesis',
      required_behavior: '"The baseline data shows [X]. This challenges the hypothesis that [Y]. I recommend we discuss whether to recommend DISCONTINUE."',
      prohibited_behavior: 'Softening or omitting contradicting evidence to preserve momentum',
    },
    {
      id: 'CR-P2-2',
      rule: 'Require source citations for all baseline values',
      trigger: 'User provides baseline value without naming a source',
      required_behavior: '"What is the source for that value — is there a report, system, or upload we can cite?"',
      prohibited_behavior: 'Accepting baseline values without source citations',
    },
  ],

  artifact_generation_rules: [
    {
      artifact: 'FIN-BASE-P2',
      nexus_may_auto_draft: true,
      conditions: ['P2.2 complete', 'source citations confirmed'],
      human_direction_required: 'User must confirm source citations are accurate.',
    },
    {
      artifact: 'RCA-P2',
      nexus_may_auto_draft: true,
      conditions: ['P2.3 complete', 'each root cause has evidence citation'],
      human_direction_required: 'User must confirm root cause rankings and evidence links.',
    },
  ],

  anti_hallucination_rules: [
    {
      id: 'AH-P2-1',
      rule: 'Must not state a baseline value without a source citation',
      trigger: 'Any baseline value claim in P2',
      required_behavior: 'Every baseline value must be accompanied by a source: system name, report name, upload reference, or explicit user statement with date.',
      prohibited_behavior: 'Stating baseline values from general knowledge or estimates without a named source.',
    },
    {
      id: 'AH-P2-2',
      rule: 'Must not recommend CONTINUE_TO_P3 when evidence does not support the hypothesis',
      trigger: 'Hypothesis validation step when evidence contradicts hypothesis',
      required_behavior: 'If evidence contradicts hypothesis: "The data does not support the hypothesis as stated. I recommend we discuss DISCONTINUE."',
      prohibited_behavior: 'Recommending CONTINUE_TO_P3 when baseline evidence contradicts the hypothesis.',
    },
    {
      id: 'AH-P2-3',
      rule: 'Must not state root causes without evidence citations',
      trigger: 'Any root cause claim in P2',
      required_behavior: 'Each root cause must have an evidence citation: "Root cause [X] is supported by [evidence citation]."',
      prohibited_behavior: 'Stating root causes from inference or analogy without evidence links.',
    },
    {
      id: 'AH-P2-4',
      rule: 'Must surface contradicting evidence directly, not soften it',
      trigger: 'Any evidence that challenges the hypothesis',
      required_behavior: 'State the contradiction directly: "This data challenges the hypothesis that [Y] because [X]."',
      prohibited_behavior: 'Omitting contradicting evidence or reframing it to appear supportive.',
    },
  ],

  patterns_to_load: ['PAT-PRG-001', 'seed-patterns-meta'],

  phase_dependencies: {
    requires_from_prior: [
      'P1 gate passed (all 5 hard criteria)',
      'Sponsor-signed charter',
      'Primary success metric with baseline path',
      'Evidence families identified (P0.5)',
    ],
    produces_for_next: [
      'Auditable baseline (FIN-BASE-P2 with source citations)',
      'Root cause analysis (RCA-P2, ≥2 ranked causes)',
      'CONTINUE_TO_P3 gate verdict',
      'Value range refined from baseline evidence',
      'Design requirements derived from root causes',
    ],
  },
};
