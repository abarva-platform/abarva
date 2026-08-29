create schema if not exists serving;

do $migration$
begin
  if to_regclass('ecl_projection.tower_ai_portfolio') is not null then
    execute $sql$
      create or replace function serving.tower_ai_rows(surface_key_arg text, page_key_arg text)
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
          'source_recorded'::text,
          p.value_state,
          p.review_state,
          'synthetic_generator'::text,
          p.gap_flags_json,
          'not_applicable'::text,
          null::text,
          '{}'::jsonb,
          p.id,
          page_key_arg,
          p.row_key,
          'ai_usage_observation'::text,
          p.use_case_name,
          p.tool_name,
          p.use_case_object_id,
          p.source_refs_json,
          to_jsonb(p)
        from ecl_projection.tower_ai_portfolio p
        where coalesce(p.display_payload_json ->> 'page_key', 'ai_portfolio') = page_key_arg;
      $function$;
    $sql$;

  end if;
end;
$migration$;
