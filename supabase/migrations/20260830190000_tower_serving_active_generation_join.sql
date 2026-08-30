-- Make the active generation a property of the data, not of one reader.
--
-- `serving.tower_ai_portfolio` returns 415 rows for a tenant whose active generation holds 55.
-- 415 is 360 retired rows plus 55 current ones: the serving functions return every generation
-- ever built. The application is unaffected only because it filters generations itself, in
-- TypeScript, in `rowsForActiveServingIdentity` — so correctness is a property of that one caller.
-- Any other consumer of these views sees retired data, and the second consumer to exist will not
-- carry that filter.
--
-- Migration 20260829113000 defines both functions WITH this join and is already applied, yet the
-- deployed bodies do not contain it. Something replaced them afterwards. Re-creating from that
-- migration would therefore revert an unknown change on the read path of every Tower page, so
-- these bodies are the deployed text with the join added and nothing else altered.
--
-- Deliberately not fixed here: `tower_ai_rows` also lacks the `page_key` predicate the same
-- migration defines, which is why `serving.tower_ai_portfolio` and `serving.tower_adoption_lens`
-- return identical row sets. That is a real defect and a separate change; widening this one past
-- a single clause on a live read path is how a reporting bug becomes a data bug.

do $migration$
begin
  if to_regclass('ecl_projection.tower_ai_portfolio') is null then
    raise notice 'tower_ai_portfolio absent; skipping serving join migration';
    return;
  end if;

  execute $ai$
CREATE OR REPLACE FUNCTION serving.tower_ai_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
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
   and active.projection_version = p.projection_version;
$function$
  $ai$;

  execute $cmd$
CREATE OR REPLACE FUNCTION serving.tower_command_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
  $cmd$;
end
$migration$;
