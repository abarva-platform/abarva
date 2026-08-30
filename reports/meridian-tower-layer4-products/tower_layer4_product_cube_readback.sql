select jsonb_build_object(
  'tenant_key', 'meridian-health',
  'assessment_id', 'meridian-tower-layer2-source-adapters-v2026-08',
  'projection_manifest', (select count(*) from ecl_projection.projection_manifest where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2 and projection_key like 'tower_%'),
  'projection_entry', (select count(*) from ecl_projection.projection_entry where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2 and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio')),
  'projection_entry_source_record_ref', (select count(*) from ecl_projection.projection_entry_source_record_ref where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_entry_id in (select id from ecl_projection.projection_entry where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2 and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio'))),
  'tower_command_center', (select count(*) from ecl_projection.tower_command_center where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2),
  'tower_value_chain', (select count(*) from ecl_projection.tower_value_chain where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2),
  'tower_evidence_queue', (select count(*) from ecl_projection.tower_evidence_queue where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2),
  'tower_ai_portfolio', (select count(*) from ecl_projection.tower_ai_portfolio where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2),
  'cube_manifest', (select count(*) from ecl_projection.cube_manifest where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and cube_version = 2 and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube')),
  'cube_slice', (select count(*) from ecl_projection.cube_slice where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and cube_version = 2 and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube')),
  'cube_slice_metric', (select count(*) from ecl_projection.cube_slice_metric where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and cube_slice_id in (select id from ecl_projection.cube_slice where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and cube_version = 2 and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube'))),
  'cube_slice_measure', (select count(*) from ecl_projection.cube_slice_measure where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and cube_slice_id in (select id from ecl_projection.cube_slice where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and cube_version = 2 and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube'))),
  'serving_counts', jsonb_build_object(
    'tower_command_center', (select count(*) from serving.tower_command_center where tenant_key = 'meridian-health'),
    'tower_value_proof', (select count(*) from serving.tower_value_proof where tenant_key = 'meridian-health'),
    'tower_decision_lanes', (select count(*) from serving.tower_decision_lanes where tenant_key = 'meridian-health'),
    'tower_evidence', (select count(*) from serving.tower_evidence where tenant_key = 'meridian-health'),
    'tower_recommended_actions', (select count(*) from serving.tower_recommended_actions where tenant_key = 'meridian-health'),
    'tower_ai_portfolio', (select count(*) from serving.tower_ai_portfolio where tenant_key = 'meridian-health'),
    'tower_cost_lens', (select count(*) from serving.tower_cost_lens where tenant_key = 'meridian-health'),
    'tower_risk_lens', (select count(*) from serving.tower_risk_lens where tenant_key = 'meridian-health'),
    'tower_adoption_lens', (select count(*) from serving.tower_adoption_lens where tenant_key = 'meridian-health')
  ),
  'source_ref_missing', (
    select count(*) from (
      select source_refs_json from ecl_projection.tower_command_center where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2
      union all select source_refs_json from ecl_projection.tower_value_chain where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2
      union all select source_refs_json from ecl_projection.tower_evidence_queue where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2
      union all select source_refs_json from ecl_projection.tower_ai_portfolio where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2
    ) rows where coalesce(jsonb_array_length(source_refs_json), 0) = 0
  ),
  'tower_value_chain_measure_drift', (
    select count(*) from ecl_projection.tower_value_chain p
    left join ecl_context.measure m on m.tenant_key = p.tenant_key and m.assessment_id = p.assessment_id and m.id = p.measure_id
    where p.tenant_key = 'meridian-health' and p.assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and p.projection_version = 2 and p.measure_id is not null and m.id is null
  ),
  'tower_ai_primary_object_drift', (
    select count(*) from ecl_projection.tower_ai_portfolio p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.use_case_object_id
    where p.tenant_key = 'meridian-health' and p.assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and p.projection_version = 2 and o.id is null
  ),
  'cube_metric_drift', (
    select count(*) from ecl_projection.cube_slice_metric csm
    left join ecl_context.metric_definition md on md.tenant_key = csm.tenant_key and md.metric_key = csm.metric_key
    where csm.tenant_key = 'meridian-health' and csm.assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and md.metric_key is null
  ),
  'cube_measure_drift', (
    select count(*) from ecl_projection.cube_slice_measure csm
    left join ecl_context.measure m on m.tenant_key = csm.tenant_key and m.assessment_id = csm.assessment_id and m.id = csm.measure_id
    where csm.tenant_key = 'meridian-health' and csm.assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and m.id is null
  ),
  'executive_totals', (
    select display_payload_json from ecl_projection.tower_command_center
    where tenant_key = 'meridian-health' and assessment_id = 'meridian-tower-layer2-source-adapters-v2026-08' and projection_version = 2 and row_key = 'executive_summary'
    limit 1
  )
)::text;
