-- Program lifecycle deliverable aliases used by Nexus tools and gate checks.
--
-- The live E2E crawler exposed a foreign-key failure when Nexus attempted to
-- persist P1 Discovery drafts as deliverables_v2 rows. The tool and gate logic
-- referenced lifecycle keys such as discovery_report, but older databases did
-- not have matching deliverable_types rows. Seed the aliases idempotently so
-- generated artifacts can be persisted instead of remaining chat-only.

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
  version,
  maturity
)
VALUES
  (
    'origination_brief',
    'Origination Brief',
    'P0 seed handoff artifact containing problem trigger, sponsor candidate, value hypothesis, scope boundary, classification, first evidence family, and Discovery stop condition.',
    ARRAY[0],
    ARRAY['analytics_modernization', 'ai_governance_implementation', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"trigger","title":"Trigger and Urgency","required":true},{"key":"value_hypothesis","title":"Value Hypothesis Seed","required":true},{"key":"sponsor","title":"Sponsor Candidate and Decision Rights","required":true},{"key":"scope_boundary","title":"Initial Scope Boundary","required":true},{"key":"classification","title":"Program Classification","required":true},{"key":"p1_handoff","title":"P1 Evidence Family and Stop Condition","required":true}]}'::jsonb,
    '{"engagement":["program_trigger","sponsor_candidate","target_outcome","scope_boundary","classification","first_evidence_request"]}'::jsonb,
    '{"dimensions":[{"name":"specificity","weight":30},{"name":"sponsor_authority","weight":25},{"name":"value_mechanism","weight":25},{"name":"p1_handoff_clarity","weight":20}]}'::jsonb,
    'Draft the P0 origination brief. Make the seed concrete enough for Discovery: problem trigger, target cohort, value mechanism, sponsor candidate, classification, first evidence request, and stop condition. Do not present P0 as proof of the problem.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'approval_packet',
    'Approval Packet',
    'Funding and mobilization approval packet assembled for sponsor or executive review.',
    ARRAY[5],
    ARRAY['analytics_modernization', 'ai_governance_implementation', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"decision_request","title":"Decision Request","required":true},{"key":"case_for_action","title":"Case for Action","required":true},{"key":"approval_path","title":"Approval Path","required":true}]}'::jsonb,
    '{"engagement":["program_scope","sponsor_alignment","business_case","readiness_plan"]}'::jsonb,
    '{"dimensions":[{"name":"decision_readiness","weight":40},{"name":"evidence_traceability","weight":35},{"name":"executive_clarity","weight":25}]}'::jsonb,
    'Draft a concise approval packet grounded in the program evidence ledger. Redact restricted financial values unless the requester is finance-authorized.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'baseline',
    'Baseline',
    'Current-state metric baseline with source, grain, method, owner, caveats, and target direction.',
    ARRAY[1,2],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"metric","title":"Metric","required":true},{"key":"source_grain_method","title":"Source, Grain, and Method","required":true},{"key":"owner_caveats","title":"Owner and Caveats","required":true}]}'::jsonb,
    '{"engagement":["captured_evidence","source_system","measurement_method","metric_owner"]}'::jsonb,
    '{"dimensions":[{"name":"measurement_specificity","weight":45},{"name":"source_traceability","weight":35},{"name":"decision_usefulness","weight":20}]}'::jsonb,
    'Draft the baseline record. Name current value, source, grain, method, owner, caveats, and whether it is decision-grade.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'baseline_metrics',
    'Baseline Metrics',
    'Set of program baseline metrics used to compare options and later track realized outcomes.',
    ARRAY[1,2],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"metric_table","title":"Metric Table","required":true},{"key":"data_quality_notes","title":"Data Quality Notes","required":true}]}'::jsonb,
    '{"engagement":["evidence_ledger","program_objectives","source_systems"]}'::jsonb,
    '{"dimensions":[{"name":"completeness","weight":35},{"name":"attribution_readiness","weight":35},{"name":"caveat_honesty","weight":30}]}'::jsonb,
    'Draft baseline metrics from captured evidence. Mark any missing source, grain, method, or owner as a data gap.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'change_management_plan',
    'Change Management Plan',
    'Business readiness, stakeholder adoption, communication, and training plan for execution mobilization.',
    ARRAY[5],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'],
    '{"sections":[{"key":"readiness_risks","title":"Readiness Risks","required":true},{"key":"communications","title":"Communications","required":true},{"key":"training_enablement","title":"Training and Enablement","required":true}]}'::jsonb,
    '{"engagement":["stakeholder_map","operating_model","execution_roadmap"]}'::jsonb,
    '{"dimensions":[{"name":"adoption_specificity","weight":35},{"name":"owner_clarity","weight":30},{"name":"launch_readiness","weight":35}]}'::jsonb,
    'Draft a change management plan grounded in the stakeholder map and execution roadmap.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'current_state_summary',
    'Current-State Summary',
    'Discovery summary of current-state conditions, boundaries, baselines, and unresolved evidence gaps.',
    ARRAY[1],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"observed_problem","title":"Observed Problem","required":true},{"key":"baseline_evidence","title":"Baseline Evidence","required":true},{"key":"open_gaps","title":"Open Gaps","required":true}]}'::jsonb,
    '{"engagement":["workshop_notes","interview_notes","evidence_ledger"]}'::jsonb,
    '{"dimensions":[{"name":"evidence_grounding","weight":45},{"name":"boundary_clarity","weight":30},{"name":"gap_honesty","weight":25}]}'::jsonb,
    'Draft the current-state summary. Separate captured evidence from unresolved gaps.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'discovery_report',
    'Discovery Report',
    'P1 Discovery package containing validated problem statement, OKR baseline, stakeholder map, contradictions, and P2 readiness recommendation.',
    ARRAY[1],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'],
    '{"sections":[{"key":"validated_problem_statement","title":"Validated Problem Statement","required":true},{"key":"baseline","title":"OKR Baseline","required":true},{"key":"stakeholder_map","title":"Stakeholder Map","required":true},{"key":"contradictions","title":"Contradictions and Falsifiers","required":true},{"key":"recommendation","title":"P2 Readiness Recommendation","required":true}]}'::jsonb,
    '{"engagement":["p0_seed","workshop_notes","evidence_ledger","stakeholders"]}'::jsonb,
    '{"dimensions":[{"name":"problem_validation","weight":30},{"name":"baseline_quality","weight":30},{"name":"stakeholder_specificity","weight":20},{"name":"recommendation_clarity","weight":20}]}'::jsonb,
    'Draft the P1 Discovery Report. Do not call the baseline decision-grade unless source, grain, method, and owner are present.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'discovery_notes',
    'Discovery Notes',
    'Ingested notes from discovery interviews, workshops, or working sessions.',
    ARRAY[1],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"attendees","title":"Attendees","required":false},{"key":"decisions","title":"Decisions","required":false},{"key":"actions","title":"Actions","required":false},{"key":"evidence","title":"Evidence","required":true}]}'::jsonb,
    '{"engagement":["uploaded_notes","captured_text"]}'::jsonb,
    '{"dimensions":[{"name":"extract_quality","weight":50},{"name":"actionability","weight":30},{"name":"provenance","weight":20}]}'::jsonb,
    'Summarize discovery notes into decisions, actions, evidence, and gaps.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'discovery_summary',
    'Discovery Summary',
    'Concise summary of P1 findings and P2 readiness.',
    ARRAY[1],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai'],
    '{"sections":[{"key":"finding_summary","title":"Finding Summary","required":true},{"key":"readiness","title":"P2 Readiness","required":true}]}'::jsonb,
    '{"engagement":["evidence_ledger","phase_gate_status"]}'::jsonb,
    '{"dimensions":[{"name":"conciseness","weight":30},{"name":"grounding","weight":40},{"name":"decision_usefulness","weight":30}]}'::jsonb,
    'Draft a concise P1 discovery summary and readiness recommendation.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'execution_roadmap',
    'Execution Roadmap',
    'P4 executable plan covering workstreams, milestones, estimates, dependencies, risks, RACI, and success criteria.',
    ARRAY[4],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'],
    '{"sections":[{"key":"workstreams","title":"Workstreams","required":true},{"key":"timeline_milestones","title":"Timeline and Milestones","required":true},{"key":"estimates","title":"Estimates","required":true},{"key":"risks_dependencies","title":"Risks and Dependencies","required":true},{"key":"raci","title":"RACI","required":true},{"key":"success_criteria","title":"Success Criteria","required":true}]}'::jsonb,
    '{"engagement":["solution_design","operating_model","baseline_metrics","resource_assumptions"]}'::jsonb,
    '{"dimensions":[{"name":"execution_specificity","weight":35},{"name":"assumption_quality","weight":25},{"name":"milestone_clarity","weight":25},{"name":"tower_readiness","weight":15}]}'::jsonb,
    'Draft the P4 execution roadmap. Make clear AbarVa plans execution; delivery happens outside the platform.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'requirements_traceability',
    'Requirements Traceability Matrix',
    'Trace from requirements to design choices, outcomes, evidence, and owners.',
    ARRAY[3,4],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'],
    '{"sections":[{"key":"trace_table","title":"Trace Table","required":true},{"key":"gaps","title":"Traceability Gaps","required":true}]}'::jsonb,
    '{"engagement":["requirements","design_spec","outcomes","evidence_ledger"]}'::jsonb,
    '{"dimensions":[{"name":"coverage","weight":40},{"name":"evidence_linkage","weight":35},{"name":"gap_honesty","weight":25}]}'::jsonb,
    'Draft a requirements-to-design-to-outcomes traceability matrix.',
    'markdown',
    1,
    'pilot'
  ),
  (
    'tower_handoff_plan',
    'Tower Handoff Plan',
    'P6 monitoring setup contract for execution tracking, alerts, cadence, owners, and closeout criteria.',
    ARRAY[6],
    ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'],
    '{"sections":[{"key":"monitoring_contract","title":"Monitoring Contract","required":true},{"key":"feeds_cadence","title":"Feeds and Cadence","required":true},{"key":"escalation_rules","title":"Escalation Rules","required":true},{"key":"closeout","title":"Closeout Criteria","required":true}]}'::jsonb,
    '{"engagement":["execution_roadmap","promise_contract","tower_metrics"]}'::jsonb,
    '{"dimensions":[{"name":"monitorability","weight":35},{"name":"owner_clarity","weight":30},{"name":"escalation_quality","weight":20},{"name":"benefits_tracking","weight":15}]}'::jsonb,
    'Draft the P6 Tower handoff plan. Make clear execution occurs outside AbarVa and Tower monitors it.',
    'markdown',
    1,
    'pilot'
  )
ON CONFLICT (type_key) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  applicable_phases = EXCLUDED.applicable_phases,
  applicable_topics = EXCLUDED.applicable_topics,
  template_structure = EXCLUDED.template_structure,
  required_data_inputs = EXCLUDED.required_data_inputs,
  quality_rubric = EXCLUDED.quality_rubric,
  generation_prompt_template = EXCLUDED.generation_prompt_template,
  output_format = EXCLUDED.output_format,
  version = GREATEST(deliverable_types.version, EXCLUDED.version),
  maturity = EXCLUDED.maturity;

-- Additional aliases used by gate logic; these intentionally reuse the
-- canonical template rows above where the artifact meaning is equivalent.
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
  version,
  maturity
)
SELECT *
FROM (
  VALUES
    ('meeting_notes', 'Meeting Notes', 'Captured meeting notes used as evidence.', ARRAY[1], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"notes","title":"Notes","required":true}]}'::jsonb, '{"engagement":["captured_text"]}'::jsonb, '{"dimensions":[{"name":"provenance","weight":50},{"name":"extractability","weight":50}]}'::jsonb, 'Summarize meeting notes into evidence, decisions, and actions.', 'markdown', 1, 'pilot'),
    ('workshop_notes', 'Workshop Notes', 'Captured workshop notes used as P1/P2 evidence.', ARRAY[1,2], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"workshop_output","title":"Workshop Output","required":true}]}'::jsonb, '{"engagement":["captured_text"]}'::jsonb, '{"dimensions":[{"name":"evidence_quality","weight":60},{"name":"action_quality","weight":40}]}'::jsonb, 'Summarize workshop notes into evidence, decisions, actions, and gaps.', 'markdown', 1, 'pilot'),
    ('value_baseline', 'Value Baseline', 'Baseline used to connect program outcomes to value realization.', ARRAY[1,2,5], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"baseline","title":"Baseline","required":true}]}'::jsonb, '{"engagement":["baseline_metrics"]}'::jsonb, '{"dimensions":[{"name":"attribution_readiness","weight":100}]}'::jsonb, 'Draft a value baseline with source, grain, method, owner, and caveats.', 'markdown', 1, 'pilot'),
    ('mobilization_roadmap', 'Mobilization Roadmap', 'Roadmap for mobilizing execution after approval.', ARRAY[4,5], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"mobilization_plan","title":"Mobilization Plan","required":true}]}'::jsonb, '{"engagement":["execution_roadmap"]}'::jsonb, '{"dimensions":[{"name":"launch_readiness","weight":100}]}'::jsonb, 'Draft a mobilization roadmap from the execution roadmap and approval package.', 'markdown', 1, 'pilot'),
    ('funding_business_case', 'Funding Business Case', 'Funding-oriented version of the business case.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"funding_request","title":"Funding Request","required":true}]}'::jsonb, '{"engagement":["business_case","approval_packet"]}'::jsonb, '{"dimensions":[{"name":"approval_readiness","weight":100}]}'::jsonb, 'Draft a funding business case and redact restricted financial values where required.', 'markdown', 1, 'pilot'),
    ('approval_memo', 'Approval Memo', 'Executive decision memo recording the approve, reject, defer, or approve-with-conditions decision.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'], '{"sections":[{"key":"decision","title":"Decision","required":true},{"key":"authority","title":"Authority","required":true},{"key":"conditions","title":"Conditions and Caveats","required":true}]}'::jsonb, '{"engagement":["business_case","sponsor_alignment","readiness_and_change_plan","tower_handoff_plan"]}'::jsonb, '{"dimensions":[{"name":"decision_clarity","weight":45},{"name":"authority_traceability","weight":35},{"name":"condition_specificity","weight":20}]}'::jsonb, 'Draft the approval memo. Record the decision authority, conditions, dissent, and evidence. Redact restricted financial values where required.', 'markdown', 1, 'pilot'),
    ('funding_approval', 'Funding Approval', 'Signed funding or capacity approval record required before Tower handoff.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'], '{"sections":[{"key":"approval_decision","title":"Approval Decision","required":true},{"key":"approved_scope","title":"Approved Scope","required":true},{"key":"funding_or_capacity","title":"Funding or Capacity Envelope","required":true},{"key":"conditions","title":"Conditions","required":false}]}'::jsonb, '{"engagement":["business_case","approval_packet","sponsor_alignment","finance_attestation"]}'::jsonb, '{"dimensions":[{"name":"authority","weight":40},{"name":"scope_specificity","weight":30},{"name":"financial_firewall","weight":30}]}'::jsonb, 'Draft the funding approval record. Capture approval authority and scope while redacting exact financial values unless finance visibility is granted.', 'markdown', 1, 'pilot'),
    ('capacity_approval', 'Capacity Approval', 'Signed capacity approval record when mobilization is approved by capacity rather than explicit funding.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'], '{"sections":[{"key":"approval_decision","title":"Approval Decision","required":true},{"key":"capacity_envelope","title":"Capacity Envelope","required":true},{"key":"conditions","title":"Conditions","required":false}]}'::jsonb, '{"engagement":["business_case","execution_roadmap","resource_assumptions"]}'::jsonb, '{"dimensions":[{"name":"capacity_specificity","weight":45},{"name":"owner_clarity","weight":30},{"name":"financial_firewall","weight":25}]}'::jsonb, 'Draft the capacity approval record. Capture capacity envelope, owner, conditions, and restricted-value handling.', 'markdown', 1, 'pilot'),
    ('sponsor_alignment', 'Sponsor Alignment', 'Signed sponsor and stakeholder alignment record required before Tower handoff.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'], '{"sections":[{"key":"sponsor_decision","title":"Sponsor Decision","required":true},{"key":"stakeholder_alignment","title":"Stakeholder Alignment","required":true},{"key":"dissent_or_conditions","title":"Dissent or Conditions","required":false},{"key":"handoff_acceptance","title":"Handoff Acceptance","required":true}]}'::jsonb, '{"engagement":["sponsor_notes","stakeholder_map","execution_roadmap","tower_handoff_plan"]}'::jsonb, '{"dimensions":[{"name":"sponsor_authority","weight":35},{"name":"stakeholder_specificity","weight":35},{"name":"handoff_readiness","weight":30}]}'::jsonb, 'Draft the sponsor alignment record. Separate true decision authority from social alignment and record dissent or conditions.', 'markdown', 1, 'pilot'),
    ('stakeholder_alignment', 'Stakeholder Alignment', 'Stakeholder alignment record used in P5 approval and mobilization packages.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai', 'ai_governance_implementation'], '{"sections":[{"key":"aligned_stakeholders","title":"Aligned Stakeholders","required":true},{"key":"open_objections","title":"Open Objections","required":false},{"key":"commitments","title":"Commitments","required":true}]}'::jsonb, '{"engagement":["stakeholder_map","sponsor_alignment","readiness_and_change_plan"]}'::jsonb, '{"dimensions":[{"name":"commitment_specificity","weight":45},{"name":"objection_honesty","weight":30},{"name":"owner_clarity","weight":25}]}'::jsonb, 'Draft the stakeholder alignment record. Name commitments, dissent, and follow-up owners.', 'markdown', 1, 'pilot'),
    ('readiness_and_change_plan', 'Readiness and Change Plan', 'Combined readiness and change plan for P5 mobilization.', ARRAY[5], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"readiness_and_change","title":"Readiness and Change","required":true}]}'::jsonb, '{"engagement":["stakeholder_map","execution_roadmap"]}'::jsonb, '{"dimensions":[{"name":"readiness","weight":50},{"name":"change_quality","weight":50}]}'::jsonb, 'Draft readiness and change plan for mobilization approval.', 'markdown', 1, 'pilot'),
    ('requirements_design_outcome_trace', 'Requirements Design Outcome Trace', 'Traceability artifact linking requirements, design choices, and outcomes.', ARRAY[3,4], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"trace","title":"Trace","required":true}]}'::jsonb, '{"engagement":["requirements","design_spec","outcomes"]}'::jsonb, '{"dimensions":[{"name":"traceability","weight":100}]}'::jsonb, 'Draft the requirements-design-outcome trace.', 'markdown', 1, 'pilot'),
    ('traceability_matrix', 'Traceability Matrix', 'Matrix linking requirements, design decisions, evidence, and outcomes.', ARRAY[3,4], ARRAY['analytics_modernization', 'vendor_consolidation_ai'], '{"sections":[{"key":"matrix","title":"Matrix","required":true}]}'::jsonb, '{"engagement":["requirements","design_spec","outcomes"]}'::jsonb, '{"dimensions":[{"name":"coverage","weight":100}]}'::jsonb, 'Draft the traceability matrix.', 'markdown', 1, 'pilot')
) AS aliases(
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
  version,
  maturity
)
ON CONFLICT (type_key) DO NOTHING;

UPDATE deliverable_types
SET applicable_phases = ARRAY[2,3,5]
WHERE type_key = 'business_case'
  AND NOT (5 = ANY(applicable_phases));
