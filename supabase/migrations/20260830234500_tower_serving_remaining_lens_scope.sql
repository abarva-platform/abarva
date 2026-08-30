-- Scope the remaining Tower lens row functions to the active generation and requested page.
--
-- The command and AI row functions already enforce active-generation identity. The value and
-- evidence row functions feed several Tower lenses too, and they must carry the same boundary:
-- one active assessment per tenant, and one requested page per lens.

create schema if not exists serving;

do $migration$
begin
  if to_regclass('ecl_projection.tower_value_chain') is not null then
    execute $sql$
      create or replace function serving.tower_value_rows(surface_key_arg text, page_key_arg text)
      returns table (
        surface_key text,
        product text,
        tenant_key text,
        assessment_id text,
        snapshot_id uuid,
        projection_manifest_id uuid,
        projection_entry_id uuid,
        projection_version integer,
        source_hash text,
        basis text,
        value_state text,
        review_state text,
        origin text,
        gap_flags_json jsonb,
        admission_status text,
        admission_gate_key text,
        admission_result_json jsonb,
        projection_row_id uuid,
        page_key text,
        row_key text,
        row_type text,
        title text,
        summary text,
        primary_object_id uuid,
        source_refs_json jsonb,
        payload_json jsonb
      )
      language sql
      stable
      as $function$
        select
          surface_key_arg,
          'Tower'::text,
          p.tenant_key,
          p.assessment_id,
          p.snapshot_id,
          p.projection_manifest_id,
          p.projection_entry_id,
          p.projection_version,
          p.source_hash,
          p.evidence_state,
          p.value_state,
          'not_reviewed'::text,
          'synthetic_generator'::text,
          p.gap_flags_json,
          'not_applicable'::text,
          null::text,
          '{}'::jsonb,
          p.id,
          p.page_key,
          p.row_key,
          p.row_type,
          p.claim_id,
          p.claim_gate_reason_detail,
          p.primary_object_id,
          p.source_refs_json,
          to_jsonb(p) || jsonb_build_object(
            'measure_period_start', m.period_start,
            'measure_period_end', m.period_end,
            'measure_scenario', m.scenario,
            'measure_value_number', m.value_number
          )
        from ecl_projection.tower_value_chain p
        join serving.tower_active_assessment_keys() active
          on active.tenant_key = p.tenant_key
         and active.assessment_id = p.assessment_id
         and active.projection_version = p.projection_version
        left join ecl_context.measure m
          on m.tenant_key = p.tenant_key
         and m.assessment_id = p.assessment_id
         and m.id = p.measure_id
        where page_key_arg = 'all' or p.page_key = page_key_arg;
      $function$;
    $sql$;
  end if;

  if to_regclass('ecl_projection.tower_evidence_queue') is not null then
    execute $sql$
      create or replace function serving.tower_evidence_rows(surface_key_arg text, page_key_arg text)
      returns table (
        surface_key text,
        product text,
        tenant_key text,
        assessment_id text,
        snapshot_id uuid,
        projection_manifest_id uuid,
        projection_entry_id uuid,
        projection_version integer,
        source_hash text,
        basis text,
        value_state text,
        review_state text,
        origin text,
        gap_flags_json jsonb,
        admission_status text,
        admission_gate_key text,
        admission_result_json jsonb,
        projection_row_id uuid,
        page_key text,
        row_key text,
        row_type text,
        title text,
        summary text,
        primary_object_id uuid,
        source_refs_json jsonb,
        payload_json jsonb
      )
      language sql
      stable
      as $function$
        select
          surface_key_arg,
          'Tower'::text,
          p.tenant_key,
          p.assessment_id,
          p.snapshot_id,
          p.projection_manifest_id,
          p.projection_entry_id,
          p.projection_version,
          p.source_hash,
          p.evidence_state,
          'known'::text,
          'not_reviewed'::text,
          'synthetic_generator'::text,
          p.gap_flags_json,
          'not_applicable'::text,
          null::text,
          '{}'::jsonb,
          p.id,
          p.page_key,
          p.row_key,
          p.row_type,
          p.claim_id,
          p.claim_gate_reason_detail,
          p.primary_object_id,
          p.source_refs_json,
          to_jsonb(p)
        from ecl_projection.tower_evidence_queue p
        join serving.tower_active_assessment_keys() active
          on active.tenant_key = p.tenant_key
         and active.assessment_id = p.assessment_id
         and active.projection_version = p.projection_version
        where p.page_key = page_key_arg;
      $function$;
    $sql$;
  end if;
end
$migration$;
