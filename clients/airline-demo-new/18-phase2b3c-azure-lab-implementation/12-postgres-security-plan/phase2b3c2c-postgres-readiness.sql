\set ON_ERROR_STOP on

-- Phase 2B-3C-2C readiness SQL for Airline Demo New.
-- Plan-only artifact. Run only through the governed migration ACA job after independent approval.

do $$
begin
  if current_database() <> 'abarva_airline_demo_new_knowledge_lab' then
    raise exception 'wrong database target: %, expected abarva_airline_demo_new_knowledge_lab', current_database();
  end if;
end $$;

create schema if not exists audit;

create or replace function audit.assert_airdn_tenant(target_tenant text)
returns void language plpgsql as $$
begin
  if target_tenant is null or btrim(target_tenant) = '' then
    raise exception 'blank tenant is not allowed';
  end if;
  if target_tenant in ('all','*','%') then
    raise exception 'wildcard tenant is not allowed: %', target_tenant;
  end if;
  if target_tenant <> 'airline-demo-new' then
    raise exception 'wrong tenant: %, expected airline-demo-new', target_tenant;
  end if;
end $$;

do $$
declare
  role_row record;
begin
  for role_row in
    select * from (values
  ('ingest', 'airline_demo_new_ingest'),
  ('reviewer', 'airline_demo_new_reviewer'),
  ('publisher', 'airline_demo_new_publisher'),
  ('reader', 'airline_demo_new_reader'),
  ('evaluator', 'airline_demo_new_evaluator'),
  ('admin', 'airline_demo_new_admin')
    ) as r(role_kind, role_name)
  loop
    if not exists (select 1 from pg_roles where rolname = role_row.role_name) then
      execute format('create role %I nologin', role_row.role_name);
    end if;
  end loop;
end $$;

-- Entra users for managed identities are created by Azure PostgreSQL administrator bootstrap.
-- The governed migration job must map each managed identity principal to the role below before grants are used:
-- mi-airdn-ingest-lab-001 -> airline_demo_new_ingest
-- mi-airdn-review-lab-001 -> airline_demo_new_reviewer
-- mi-airdn-publish-lab-001 -> airline_demo_new_publisher
-- mi-airdn-read-lab-001 -> airline_demo_new_reader
-- mi-airdn-evaluator-lab-001 -> airline_demo_new_evaluator
-- mi-airdn-admin-lab-001 -> airline_demo_new_admin
do $$
declare
  role_map record;
begin
  for role_map in
    select * from (values
  ('mi-airdn-ingest-lab-001', 'airline_demo_new_ingest'),
  ('mi-airdn-review-lab-001', 'airline_demo_new_reviewer'),
  ('mi-airdn-publish-lab-001', 'airline_demo_new_publisher'),
  ('mi-airdn-read-lab-001', 'airline_demo_new_reader'),
  ('mi-airdn-evaluator-lab-001', 'airline_demo_new_evaluator'),
  ('mi-airdn-admin-lab-001', 'airline_demo_new_admin')
    ) as m(identity_name, role_name)
  loop
    if exists (select 1 from pg_roles where rolname = role_map.identity_name) then
      execute format('grant %I to %I', role_map.role_name, role_map.identity_name);
    end if;
  end loop;
end $$;

grant usage on schema source_registry, evidence, working, operations to airline_demo_new_ingest;
grant select, insert, update on all tables in schema source_registry, evidence, working, operations to airline_demo_new_ingest;
grant usage on all sequences in schema source_registry, evidence, working, operations to airline_demo_new_ingest;

grant usage on schema working, governance, operations to airline_demo_new_reviewer;
grant select, insert, update on all tables in schema working, governance, operations to airline_demo_new_reviewer;
grant usage on all sequences in schema working, governance, operations to airline_demo_new_reviewer;

grant usage on schema knowledge, metrics, publication, consumption, governance, operations to airline_demo_new_publisher;
grant select, insert, update on all tables in schema knowledge, metrics, publication, consumption, operations to airline_demo_new_publisher;
grant select, insert, update on table governance.evidence_gap to airline_demo_new_publisher;
grant usage on all sequences in schema knowledge, metrics, publication, consumption, operations to airline_demo_new_publisher;

grant usage on schema knowledge, metrics, publication, consumption to airline_demo_new_reader;
grant select on all tables in schema knowledge, metrics, publication, consumption to airline_demo_new_reader;

grant usage on schema knowledge, metrics, publication, consumption, governance, evidence, audit, operations to airline_demo_new_evaluator;
grant select on all tables in schema knowledge, metrics, publication, consumption, governance, evidence, audit, operations to airline_demo_new_evaluator;
alter default privileges in schema knowledge, metrics, publication, consumption, governance, evidence, audit, operations grant select on tables to airline_demo_new_evaluator;

grant usage on schema source_registry, evidence, working, knowledge, metrics, governance, publication, consumption, audit, operations to airline_demo_new_admin;
grant all privileges on all tables in schema source_registry, evidence, working, knowledge, metrics, governance, publication, consumption, audit, operations to airline_demo_new_admin;
grant all privileges on all sequences in schema source_registry, evidence, working, knowledge, metrics, governance, publication, consumption, audit, operations to airline_demo_new_admin;

revoke all on schema working from airline_demo_new_reader;
revoke all on all tables in schema working from airline_demo_new_reader;
revoke insert, update, delete on all tables in schema knowledge, metrics, publication, consumption from airline_demo_new_reader, airline_demo_new_evaluator;
revoke insert, update, delete on all tables in schema publication, consumption from airline_demo_new_ingest, airline_demo_new_reviewer;

do $$
declare
  table_row record;
begin
  for table_row in
    select * from (values
  ('operations', 'job_run', 'airdn_operations_job_run_tenant_policy'),
  ('operations', 'backfill_queue', 'airdn_operations_backfill_queue_tenant_policy'),
  ('source_registry', 'source', 'airdn_source_registry_source_tenant_policy'),
  ('source_registry', 'source_version', 'airdn_source_registry_source_version_tenant_policy'),
  ('source_registry', 'source_manifest', 'airdn_source_registry_source_manifest_tenant_policy'),
  ('evidence', 'evidence_item', 'airdn_evidence_evidence_item_tenant_policy'),
  ('working', 'entity_candidate', 'airdn_working_entity_candidate_tenant_policy'),
  ('working', 'fact_candidate', 'airdn_working_fact_candidate_tenant_policy'),
  ('working', 'relationship_candidate', 'airdn_working_relationship_candidate_tenant_policy'),
  ('working', 'metric_candidate', 'airdn_working_metric_candidate_tenant_policy'),
  ('working', 'entity_resolution_candidate', 'airdn_working_entity_resolution_candidate_tenant_policy'),
  ('working', 'normalization_result', 'airdn_working_normalization_result_tenant_policy'),
  ('working', 'quarantine_item', 'airdn_working_quarantine_item_tenant_policy'),
  ('knowledge', 'entity', 'airdn_knowledge_entity_tenant_policy'),
  ('knowledge', 'fact_assertion', 'airdn_knowledge_fact_assertion_tenant_policy'),
  ('knowledge', 'relationship_assertion', 'airdn_knowledge_relationship_assertion_tenant_policy'),
  ('metrics', 'metric_definition', 'airdn_metrics_metric_definition_tenant_policy'),
  ('metrics', 'metric_observation', 'airdn_metrics_metric_observation_tenant_policy'),
  ('metrics', 'metric_target', 'airdn_metrics_metric_target_tenant_policy'),
  ('governance', 'review_batch', 'airdn_governance_review_batch_tenant_policy'),
  ('governance', 'review_batch_approval', 'airdn_governance_review_batch_approval_tenant_policy'),
  ('governance', 'review_decision', 'airdn_governance_review_decision_tenant_policy'),
  ('governance', 'authority_transition', 'airdn_governance_authority_transition_tenant_policy'),
  ('governance', 'knowledge_gap', 'airdn_governance_knowledge_gap_tenant_policy'),
  ('governance', 'knowledge_conflict', 'airdn_governance_knowledge_conflict_tenant_policy'),
  ('governance', 'completion_work_item', 'airdn_governance_completion_work_item_tenant_policy'),
  ('governance', 'supersession_record', 'airdn_governance_supersession_record_tenant_policy'),
  ('publication', 'domain_publication', 'airdn_publication_domain_publication_tenant_policy'),
  ('publication', 'knowledge_baseline', 'airdn_publication_knowledge_baseline_tenant_policy'),
  ('publication', 'publication_activation', 'airdn_publication_publication_activation_tenant_policy'),
  ('consumption', 'enterprise_brief', 'airdn_consumption_enterprise_brief_tenant_policy'),
  ('consumption', 'domain_overview', 'airdn_consumption_domain_overview_tenant_policy'),
  ('consumption', 'entity_inventory', 'airdn_consumption_entity_inventory_tenant_policy'),
  ('consumption', 'entity_detail', 'airdn_consumption_entity_detail_tenant_policy'),
  ('consumption', 'relationship_projection', 'airdn_consumption_relationship_projection_tenant_policy'),
  ('consumption', 'relationship_node_v1', 'airdn_consumption_relationship_node_v1_tenant_policy'),
  ('consumption', 'relationship_edge_v1', 'airdn_consumption_relationship_edge_v1_tenant_policy'),
  ('consumption', 'relationship_graph_v1', 'airdn_consumption_relationship_graph_v1_tenant_policy'),
  ('consumption', 'relationship_evidence_v1', 'airdn_consumption_relationship_evidence_v1_tenant_policy'),
  ('consumption', 'relationship_query_index_v1', 'airdn_consumption_relationship_query_index_v1_tenant_policy'),
  ('consumption', 'entity_impact_summary_v1', 'airdn_consumption_entity_impact_summary_v1_tenant_policy'),
  ('consumption', 'metric_projection', 'airdn_consumption_metric_projection_tenant_policy'),
  ('consumption', 'evidence_gap_projection', 'airdn_consumption_evidence_gap_projection_tenant_policy'),
  ('consumption', 'strategic_insight', 'airdn_consumption_strategic_insight_tenant_policy'),
  ('consumption', 'executive_perspective', 'airdn_consumption_executive_perspective_tenant_policy'),
  ('consumption', 'industry_assessment', 'airdn_consumption_industry_assessment_tenant_policy'),
  ('consumption', 'search_document', 'airdn_consumption_search_document_tenant_policy'),
  ('consumption', 'module_packet_projection', 'airdn_consumption_module_packet_projection_tenant_policy'),
  ('audit', 'change_event', 'airdn_audit_change_event_tenant_policy'),
  ('audit', 'access_event', 'airdn_audit_access_event_tenant_policy'),
  ('audit', 'model_execution', 'airdn_audit_model_execution_tenant_policy'),
  ('audit', 'rule_execution', 'airdn_audit_rule_execution_tenant_policy'),
  ('audit', 'publication_lineage', 'airdn_audit_publication_lineage_tenant_policy')
    ) as t(schema_name, table_name, policy_name)
  loop
    if to_regclass(format('%I.%I', table_row.schema_name, table_row.table_name)) is not null then
      execute format('alter table %I.%I enable row level security', table_row.schema_name, table_row.table_name);
      execute format('alter table %I.%I force row level security', table_row.schema_name, table_row.table_name);
      execute format('drop policy if exists %I on %I.%I', table_row.policy_name, table_row.schema_name, table_row.table_name);
      execute format(
        'create policy %I on %I.%I for all using (tenant_key = %L) with check (tenant_key = %L)',
        table_row.policy_name,
        table_row.schema_name,
        table_row.table_name,
        'airline-demo-new',
        'airline-demo-new'
      );
    end if;
  end loop;
end $$;

-- Strategic insight must not default to accepted. It stays planning-grade/candidate until explicit review.
do $$
begin
  if to_regclass('consumption.strategic_insight') is not null then
    alter table consumption.strategic_insight alter column authority_state set default 'planning_grade';
  end if;
end $$;
