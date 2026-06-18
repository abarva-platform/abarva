-- Lakeshore Industries V2 client-scoped replacement SQL
-- Review counts and archive before executing deletes.
BEGIN;

-- Client id expected: 3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667
-- Tenant aliases: lakeshore, lakeshore-holdings, lakeshore-industries

-- Pre-counts
SELECT 'context_insights' AS table_name, count(*)::int AS rows_before FROM public.context_insights WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_stewardship_tasks' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_stewardship_tasks WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_quality_issues' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_quality_issues WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_relationships' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_relationships WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_evidence' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_evidence WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_facts' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_facts WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_chunks' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_chunks WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_records' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_records WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_source_files' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_source_files WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_sources' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_sources WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'enterprise_context_template_runs' AS table_name, count(*)::int AS rows_before FROM public.enterprise_context_template_runs WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'data_ingestion_runs' AS table_name, count(*)::int AS rows_before FROM public.data_ingestion_runs WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
SELECT 'client_private_patterns' AS table_name, count(*)::int AS rows_before FROM public.client_private_patterns WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_atlas_context_packs' AS table_name, count(*)::int AS rows_before FROM public.ai_control_atlas_context_packs WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_context_relationships' AS table_name, count(*)::int AS rows_before FROM public.ai_control_context_relationships WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_context_facts' AS table_name, count(*)::int AS rows_before FROM public.ai_control_context_facts WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_evidence_items' AS table_name, count(*)::int AS rows_before FROM public.ai_control_evidence_items WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_actions' AS table_name, count(*)::int AS rows_before FROM public.ai_control_actions WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_risk_governance' AS table_name, count(*)::int AS rows_before FROM public.ai_control_risk_governance WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_spend_contracts' AS table_name, count(*)::int AS rows_before FROM public.ai_control_spend_contracts WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_benefit_realization' AS table_name, count(*)::int AS rows_before FROM public.ai_control_benefit_realization WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_agent_outcomes' AS table_name, count(*)::int AS rows_before FROM public.ai_control_agent_outcomes WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_dora_metrics' AS table_name, count(*)::int AS rows_before FROM public.ai_control_dora_metrics WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_persona_productivity' AS table_name, count(*)::int AS rows_before FROM public.ai_control_persona_productivity WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_tool_usage_monthly' AS table_name, count(*)::int AS rows_before FROM public.ai_control_tool_usage_monthly WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_initiatives' AS table_name, count(*)::int AS rows_before FROM public.ai_control_initiatives WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_sources' AS table_name, count(*)::int AS rows_before FROM public.ai_control_sources WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_control_refresh_runs' AS table_name, count(*)::int AS rows_before FROM public.ai_control_refresh_runs WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_cloud_cost' AS table_name, count(*)::int AS rows_before FROM public.tower_cloud_cost WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_program_financials' AS table_name, count(*)::int AS rows_before FROM public.tower_program_financials WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_vendor_spend' AS table_name, count(*)::int AS rows_before FROM public.tower_vendor_spend WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_ai_tool_usage' AS table_name, count(*)::int AS rows_before FROM public.tower_ai_tool_usage WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_dora_metrics' AS table_name, count(*)::int AS rows_before FROM public.tower_dora_metrics WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_itsm_records' AS table_name, count(*)::int AS rows_before FROM public.tower_itsm_records WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_jira_issues' AS table_name, count(*)::int AS rows_before FROM public.tower_jira_issues WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'tower_workforce' AS table_name, count(*)::int AS rows_before FROM public.tower_workforce WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'ai_initiatives' AS table_name, count(*)::int AS rows_before FROM public.ai_initiatives WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'vendor_contracts' AS table_name, count(*)::int AS rows_before FROM public.vendor_contracts WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
SELECT 'applications' AS table_name, count(*)::int AS rows_before FROM public.applications WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';

-- Deletes in FK-safe order. Keep clients/users/audit/global corpus untouched.
DELETE FROM public.context_insights WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_stewardship_tasks WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_quality_issues WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_relationships WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_evidence WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_facts WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_chunks WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_records WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_source_files WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_sources WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.enterprise_context_template_runs WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.data_ingestion_runs WHERE tenant_key = any(array['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']::text[]);
DELETE FROM public.client_private_patterns WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_atlas_context_packs WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_context_relationships WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_context_facts WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_evidence_items WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_actions WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_risk_governance WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_spend_contracts WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_benefit_realization WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_agent_outcomes WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_dora_metrics WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_persona_productivity WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_tool_usage_monthly WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_initiatives WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_sources WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_control_refresh_runs WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_cloud_cost WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_program_financials WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_vendor_spend WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_ai_tool_usage WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_dora_metrics WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_itsm_records WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_jira_issues WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.tower_workforce WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.ai_initiatives WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.vendor_contracts WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';
DELETE FROM public.applications WHERE client_id = '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667';

COMMIT;
