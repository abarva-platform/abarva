BEGIN;

-- Expand the persisted semantic metric catalog from the first six runtime seed
-- metrics to the governed registry used by the Enterprise Semantic Question
-- Layer contract. This migration intentionally does not mark every metric
-- computable for every tenant; tenant_metric_coverage remains the honest
-- readiness layer and is refreshed from available tenant evidence.

INSERT INTO semantic_metrics (
  tenant_key,
  metric_key,
  business_name,
  description,
  formula_type,
  formula_text,
  unit,
  default_grain,
  default_time_window,
  required_fields,
  confidence_rule,
  caveat_text,
  finance_validated_flag,
  is_global,
  is_active,
  updated_at
)
VALUES
  (NULL, 'record_count', 'Record count', 'Number of records in scope.', 'sql', 'count(records)', 'count', 'defined by primary semantic dimension', NULL, ARRAY['id'], 'high when all required fields are present and source is client-approved structured data; medium for benchmark or synthetic demo evidence; low when one or more required fields are missing', '', false, true, true, now()),
  (NULL, 'incident_count', 'Incident count', 'Incident or work item count in scope.', 'sql', 'count(records where record_type in incident/work_item)', 'count', 'work item', NULL, ARRAY['record_id','record_type'], 'high when work-item source rows are tenant-scoped and cited', '', false, true, true, now()),
  (NULL, 'sla_breach_rate', 'SLA breach rate', 'Percent of work items breaching SLA.', 'expression', 'sla_breached / total_work_items', 'percent', 'work item population', NULL, ARRAY['record_id','sla_breached'], 'high when numerator and denominator are present from the same tenant work-item source', '', false, true, true, now()),
  (NULL, 'reopen_rate', 'Reopen rate', 'Percent of work items reopened after closure.', 'expression', 'reopened_count / total_work_items', 'percent', 'work item population', NULL, ARRAY['record_id','reopened_count'], 'high when reopen and total counts are present from the same tenant work-item source', '', false, true, true, now()),
  (NULL, 'reassignment_rate', 'Reassignment rate', 'Average reassignment or handoff count per work item.', 'expression', 'sum(reassignment_count) / total_work_items', 'ratio', 'work item population', NULL, ARRAY['record_id','reassignment_count'], 'high when reassignment counts and work-item totals are complete', '', false, true, true, now()),
  (NULL, 'cycle_time', 'Cycle time', 'Elapsed time from open to close.', 'expression', 'closed_at - opened_at', 'hours', 'work item', NULL, ARRAY['opened_at','closed_at'], 'high when timestamp fields are populated and consistently normalized', '', false, true, true, now()),
  (NULL, 'app_friction_score', 'Application friction score', 'Composite rank score for apps creating operational friction.', 'composite', 'incident_count + (sla_breach_count * 4) + (reopen_count * 3) + (reassignment_count * 1.5) + linked_event_count + ownership_gap_penalty', 'score', 'application', NULL, ARRAY['app_id','incident_count','sla_breach_count','reopen_count'], 'high when application inventory, work items, events, and ownership fields are joined and cited', 'If logs or tickets are missing, label the score as ticket/Jira-based only.', false, true, true, now()),
  (NULL, 'automation_value_score', 'Automation value score', 'Relative score for automation value.', 'composite', 'weighted value, volume, effort saved, cycle-time reduction, and risk', 'score', 'automation opportunity', NULL, ARRAY['baseline_volume','effort_saved_hours'], 'high when baseline volume, labor effort, value estimate, and risk control fields are present', '', false, true, true, now()),
  (NULL, 'opportunity_feasibility_score', 'Opportunity feasibility score', 'Readiness score for executing an opportunity.', 'composite', 'data_readiness + process_stability + control_readiness - integration_complexity', 'score', 'opportunity', NULL, ARRAY['data_readiness','process_stability'], 'high when data, process, control, and integration-readiness evidence is present', '', false, true, true, now()),
  (NULL, 'normalized_tco', 'Normalized TCO', 'Comparable total cost of ownership.', 'composite', 'license + run + labor + implementation + risk-adjusted transition cost', 'currency', 'vendor/application/funding line', NULL, ARRAY['annual_value_usd'], 'high when client-approved commercial, labor, and implementation values are loaded', 'If client-approved rates are missing, label estimates as ROM planning assumptions.', true, true, true, now()),
  (NULL, 'vendor_score', 'Vendor score', 'Composite vendor performance and risk score.', 'composite', 'commercial_score + delivery_score + risk_score + exit_score', 'score', 'vendor contract', NULL, ARRAY['vendor_id','annual_value_usd'], 'high when vendor commercial, delivery, risk, and exit evidence is loaded', '', false, true, true, now()),
  (NULL, 'roadmap_readiness', 'Roadmap readiness', 'Readiness to proceed based on evidence, owner, dependency, and value clarity.', 'composite', 'evidence_score + owner_score + dependency_score + value_score', 'score', 'initiative', NULL, ARRAY['initiative_id','status'], 'high when initiative evidence, owner, dependency, and value fields are present', '', false, true, true, now()),
  (NULL, 'data_quality_score', 'Data quality score', 'Trust score for a data product or dataset.', 'composite', 'completeness + freshness + lineage + quality issue closure', 'score', 'data product', NULL, ARRAY['data_product_id','quality_score'], 'high when completeness, freshness, lineage, and issue-closure evidence is present', 'Do not claim governed data readiness when quality, lineage, or owner fields are missing.', false, true, true, now()),
  (NULL, 'governance_gap_count', 'Governance gap count', 'Open risk, control, compliance, or AI governance gaps.', 'sql', 'count(records where status is gap/open/noncompliant)', 'count', 'control/risk item', NULL, ARRAY['control_id','status'], 'high when open/closed status and control/risk scope are present', '', false, true, true, now()),
  (NULL, 'ownership_coverage', 'Ownership coverage', 'Percent of records with accountable owner fields populated.', 'expression', 'records_with_owner / total_records', 'percent', 'dimension record population', NULL, ARRAY['owner_role'], 'high when owner fields are loaded and source lineage is present', '', false, true, true, now()),
  (NULL, 'integration_risk_count', 'Integration risk count', 'Number of risky or failing integration edges.', 'sql', 'count(edges where failure_impact or kill_blocker_flag is high)', 'count', 'integration edge', NULL, ARRAY['edge_id','source_app_id','target_app_id'], 'high when source-to-target edge pairs and risk flags are present', 'If only integration counts exist and no edge pairs exist, say that specifically.', false, true, true, now()),
  (NULL, 'workforce_adoption_rate', 'Workforce adoption rate', 'Share of workforce/personas actively adopting a tool or workflow.', 'expression', 'active_users / eligible_users', 'percent', 'persona/workforce group', NULL, ARRAY['persona_id','head_count'], 'high when eligible-user and active-user populations are loaded for the same period', '', false, true, true, now()),
  (NULL, 'kpi_gap_to_target', 'KPI gap to target', 'Gap between current KPI value and target.', 'expression', 'target_value - current_value', 'ratio', 'KPI measurement period', NULL, ARRAY['kpi_id','current_value','target_value'], 'high when baseline, current, target, period, and source evidence are present', '', false, true, true, now())
ON CONFLICT (metric_key) WHERE is_global = true
DO UPDATE SET
  business_name = EXCLUDED.business_name,
  description = EXCLUDED.description,
  formula_type = EXCLUDED.formula_type,
  formula_text = EXCLUDED.formula_text,
  unit = EXCLUDED.unit,
  default_grain = EXCLUDED.default_grain,
  default_time_window = EXCLUDED.default_time_window,
  required_fields = EXCLUDED.required_fields,
  confidence_rule = EXCLUDED.confidence_rule,
  caveat_text = EXCLUDED.caveat_text,
  finance_validated_flag = EXCLUDED.finance_validated_flag,
  is_active = true,
  updated_at = now();

NOTIFY pgrst, 'reload schema';

COMMIT;
