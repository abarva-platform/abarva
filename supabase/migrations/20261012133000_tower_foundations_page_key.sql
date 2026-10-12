-- Admit source-backed Foundation inventory rows to the existing Tower projection table.
-- The active assessment selector is unchanged; this migration does not publish a candidate.
begin;

alter table ecl_projection.tower_command_center
  drop constraint if exists tower_command_center_page_key_check;

alter table ecl_projection.tower_command_center
  add constraint tower_command_center_page_key_check
  check (page_key = any (array[
    'command_center', 'value_proof', 'decision_lanes', 'evidence', 'recommended_actions',
    'ai_portfolio', 'cost_lens', 'risk_lens', 'adoption_lens', 'foundations'
  ]));

-- These declared source types retain their meaning in Layer 3. They are not inferred edges.
alter table ecl_context.object_type_catalog
  drop constraint if exists object_type_catalog_grain_check;

alter table ecl_context.object_type_catalog
  add constraint object_type_catalog_grain_check
  check (grain = any (array[
    'enterprise', 'enterprise_profile', 'business_segment', 'business_function',
    'organization', 'process', 'application', 'application_deployment', 'data_platform',
    'data_product', 'data_flow', 'infrastructure', 'vendor', 'contract', 'program',
    'metric', 'risk', 'control', 'ai_program', 'ai_use_case', 'ai_tool', 'persona',
    'application_module', 'spend_line', 'evidence_request', 'leadership_observation',
    'strategic_priority', 'external_benchmark', 'workforce_role', 'managed_service_scope'
  ]));

insert into ecl_context.object_type_catalog
  (object_type, display_label, grain, counting_class, description)
values
  ('enterprise_profile', 'Enterprise Profile', 'enterprise_profile', 'enterprise_scope',
   'One source-declared enterprise profile, separate from approved fiscal budget.'),
  ('workforce_role', 'Workforce Role', 'workforce_role', 'persona',
   'One source-declared role with count and function text; no inferred person or function link.'),
  ('managed_service_scope', 'Managed Service Scope', 'managed_service_scope', 'context_detail',
   'One source-declared service scope; cost overlap and provider identity remain unresolved.')
on conflict (object_type) do nothing;

alter table ecl_context.object
  drop constraint if exists object_type_check;

alter table ecl_context.object
  add constraint object_type_check
  check (object_type = any (array[
    'enterprise', 'enterprise_profile', 'business_segment', 'business_function',
    'organization', 'process', 'application', 'application_deployment', 'data_platform',
    'data_product', 'data_flow', 'infrastructure', 'vendor', 'contract', 'program',
    'metric', 'risk', 'control', 'ai_program', 'ai_use_case', 'ai_tool', 'persona',
    'application_module', 'spend_line', 'evidence_request', 'leadership_observation',
    'strategic_priority', 'external_benchmark', 'workforce_role', 'managed_service_scope'
  ]));

commit;
