begin;

alter table ecl_context.object_type_catalog
  drop constraint object_type_catalog_grain_check;
alter table ecl_context.object_type_catalog
  add constraint object_type_catalog_grain_check check (
    grain in (
      'enterprise', 'business_segment', 'business_function', 'organization',
      'process', 'application', 'application_deployment', 'data_platform',
      'data_product', 'infrastructure', 'vendor', 'contract', 'program', 'metric',
      'risk', 'control', 'ai_program', 'ai_use_case', 'ai_tool', 'persona',
      'application_module', 'data_flow', 'spend_line', 'evidence_request',
      'leadership_observation', 'strategic_priority', 'external_benchmark'
    )
  );

alter table ecl_context.object_type_catalog
  drop constraint object_type_catalog_counting_class_check;
alter table ecl_context.object_type_catalog
  add constraint object_type_catalog_counting_class_check check (
    counting_class in (
      'enterprise_scope', 'business_entity', 'deployment_instance',
      'technical_component', 'commercial_entity', 'initiative', 'risk_control',
      'metric_definition', 'persona', 'context_detail'
    )
  );

insert into ecl_context.object_type_catalog
  (object_type, display_label, grain, counting_class, description)
values
  ('application_module', 'Application Module', 'application_module', 'context_detail',
   'Governed workflow or service-area module of one logical application; excluded from application totals.'),
  ('data_flow', 'Data Flow', 'data_flow', 'context_detail',
   'Source-declared integration flow with its own lineage and cadence; not a data product.'),
  ('spend_line', 'Spend Line', 'spend_line', 'context_detail',
   'Source financial line; not an independently aggregated spend measure.'),
  ('evidence_request', 'Evidence Request', 'evidence_request', 'context_detail',
   'Requested artifact not yet received; never counted as supporting evidence.'),
  ('leadership_observation', 'Leadership Observation', 'leadership_observation', 'context_detail',
   'Synthetic or sourced role observation with explicit response basis.'),
  ('strategic_priority', 'Strategic Priority', 'strategic_priority', 'context_detail',
   'Declared priority distinct from a funded program or initiative.'),
  ('external_benchmark', 'External Benchmark', 'external_benchmark', 'context_detail',
   'External reference with a comparability boundary; not a client metric.')
on conflict (object_type) do update set
  display_label = excluded.display_label,
  grain = excluded.grain,
  counting_class = excluded.counting_class,
  description = excluded.description;

alter table ecl_context.object
  drop constraint object_type_check;
alter table ecl_context.object
  add constraint object_type_check check (
    object_type in (
      'enterprise', 'business_segment', 'business_function', 'organization',
      'process', 'application', 'application_deployment', 'data_platform',
      'data_product', 'infrastructure', 'vendor', 'contract', 'program', 'metric',
      'risk', 'control', 'ai_program', 'ai_use_case', 'ai_tool', 'persona',
      'application_module', 'data_flow', 'spend_line', 'evidence_request',
      'leadership_observation', 'strategic_priority', 'external_benchmark'
    )
  );

alter table ecl_context.relationship
  drop constraint relationship_type_check;
alter table ecl_context.relationship
  add constraint relationship_type_check check (
    relationship_type in (
      'HAS_FUNCTION', 'OWNED_BY', 'SUPPORTED_BY', 'SUPPLIED_BY', 'COVERED_BY',
      'HOSTED_ON', 'DEPLOYMENT_OF', 'INTEGRATES_WITH', 'PRODUCES', 'CONSUMES',
      'DEPENDS_ON', 'CHANGES', 'MITIGATES', 'CONTROLS', 'MEASURED_BY', 'USED_BY',
      'FUNDED_BY', 'ACCOUNTABLE_TO', 'ADVANCES_PRIORITY', 'APPLIES_TO',
      'ATTRIBUTED_TO', 'BELONGS_TO_SEGMENT', 'COST_OF',
      'EVIDENCE_REQUESTED_FOR', 'FEEDS', 'GROUNDED_IN', 'HAS_PRIORITY',
      'HAS_SEGMENT', 'MEASURES', 'MODULE_OF', 'SPONSORED_BY',
      'TARGETS_SEGMENT', 'WORKS_IN'
    )
  );

commit;
