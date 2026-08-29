create schema if not exists serving;

do $migration$
begin
  if to_regclass('ecl_projection.tower_command_center') is not null then
    execute $sql$
      create or replace function serving.tower_active_assessment_keys()
      returns table (
        tenant_key text,
        assessment_id text,
        projection_version integer
      )
      language sql
      stable
      as $function$
        with candidates as (
          select
            p.tenant_key,
            p.assessment_id,
            p.projection_version,
            max(p.created_at) as created_at,
            max(
              case
                when p.row_key = 'executive_summary'
                  and p.display_payload_json ? 'layer4_build_version'
                  then 3
                when p.row_key = 'executive_summary'
                  then 2
                when p.display_payload_json ? 'layer4_build_version'
                  then 1
                else 0
              end
            ) as priority
          from ecl_projection.tower_command_center p
          group by p.tenant_key, p.assessment_id, p.projection_version
        ),
        ranked as (
          select
            candidates.*,
            row_number() over (
              partition by candidates.tenant_key
              order by
                candidates.priority desc,
                candidates.projection_version desc,
                candidates.created_at desc,
                candidates.assessment_id desc
            ) as rn
          from candidates
        )
        select
          ranked.tenant_key,
          ranked.assessment_id,
          ranked.projection_version
        from ranked
        where ranked.rn = 1;
      $function$;
    $sql$;

    execute $sql$
      create or replace function serving.tower_command_rows(surface_key_arg text, page_key_arg text)
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
          coalesce(p.claim_id, p.row_key),
          p.claim_gate_reason_detail,
          p.primary_object_id,
          p.source_refs_json,
          to_jsonb(p)
        from ecl_projection.tower_command_center p
        join serving.tower_active_assessment_keys() active
          on active.tenant_key = p.tenant_key
         and active.assessment_id = p.assessment_id
         and active.projection_version = p.projection_version
        where page_key_arg = 'all' or p.page_key = page_key_arg;
      $function$;
    $sql$;
  end if;

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
        join serving.tower_active_assessment_keys() active
          on active.tenant_key = p.tenant_key
         and active.assessment_id = p.assessment_id
         and active.projection_version = p.projection_version
        where coalesce(p.display_payload_json ->> 'page_key', 'ai_portfolio') = page_key_arg;
      $function$;
    $sql$;
  end if;
end;
$migration$;
