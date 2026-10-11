-- A tenant with any lifecycle declaration must never fall back to a ranked projection.
-- This preserves the legacy selector only for tenants that have not entered lifecycle control.

create or replace function serving.tower_active_assessment_keys()
returns table (tenant_key text, assessment_id text, projection_version integer)
language sql
stable
as $function$
  select l.tenant_key, l.assessment_id, l.projection_version
    from ecl_projection.tower_assessment_lifecycle l
   where l.state = 'active'

  union all

  select ranked.tenant_key, ranked.assessment_id, ranked.projection_version
    from (
      select candidates.*,
             row_number() over (
               partition by candidates.tenant_key
               order by candidates.priority desc,
                        candidates.projection_version desc,
                        candidates.created_at desc,
                        candidates.assessment_id desc
             ) as rn
        from (
          select p.tenant_key,
                 p.assessment_id,
                 p.projection_version,
                 max(p.created_at) as created_at,
                 max(case
                   when p.row_key = 'executive_summary'
                     and p.display_payload_json ? 'layer4_build_version' then 3
                   when p.row_key = 'executive_summary' then 2
                   when p.display_payload_json ? 'layer4_build_version' then 1
                   else 0
                 end) as priority
            from ecl_projection.tower_command_center p
           group by p.tenant_key, p.assessment_id, p.projection_version
        ) candidates
    ) ranked
   where ranked.rn = 1
     and not exists (
       select 1 from ecl_projection.tower_assessment_lifecycle declaration
        where declaration.tenant_key = ranked.tenant_key
     );
$function$;
