-- Tower assessment lifecycle: declare the active generation instead of inferring it.
--
-- `serving.tower_active_assessment_keys()` decided which generation a CXO sees by ranking on four
-- inferred signals — a priority derived from payload shape, projection_version, created_at, and
-- finally assessment_id. Every one of those is a guess about intent. A tenant once saw $492.5M
-- instead of $677.8M because that ranking picked a retired generation, and the retired rows are
-- still present: tower_ai_portfolio holds 720 rows at projection_version 1 against 55 at
-- version 2.
--
-- `AGENTS.md`: identity is declared, never inferred. This adds the declaration.
--
-- The change is deliberately backward compatible. Until a loader writes a lifecycle row, the
-- function falls back to exactly the ranking it used before, so no tenant's reads move on this
-- migration alone.

do $migration$
begin
  if to_regclass('ecl_projection.tower_command_center') is null then
    raise notice 'ecl_projection.tower_command_center absent; skipping lifecycle migration';
    return;
  end if;

  create table if not exists ecl_projection.tower_assessment_lifecycle (
    tenant_key text not null,
    assessment_id text not null,
    projection_version integer not null,
    -- `active` is what every product surface reads. `retired` is unreadable, not merely ranked
    -- lower: a retired generation must not be one ranking bug away from a client's screen.
    state text not null,
    activated_at timestamptz not null default now(),
    retired_at timestamptz,
    build_version text,
    note text,
    constraint tower_assessment_lifecycle_pkey
      primary key (tenant_key, assessment_id, projection_version),
    constraint tower_assessment_lifecycle_state_check
      check (state in ('active', 'retired')),
    constraint tower_assessment_lifecycle_retired_at_check
      check ((state = 'retired') = (retired_at is not null))
  );

  -- The structural guarantee: a tenant cannot have two active generations. Previously nothing
  -- prevented it, and the ranking silently picked one.
  create unique index if not exists tower_assessment_lifecycle_one_active
    on ecl_projection.tower_assessment_lifecycle (tenant_key)
    where state = 'active';

  create index if not exists idx_tower_assessment_lifecycle_tenant_state
    on ecl_projection.tower_assessment_lifecycle (tenant_key, state);

  alter table ecl_projection.tower_assessment_lifecycle enable row level security;

  -- The four sibling projection tables have RLS enabled with zero policies, which denies reads to
  -- any role that does not bypass RLS and leaves tenant isolation resting on the reader's
  -- `where tenant_key = $1`. This table carries a real policy, following the pattern already
  -- established in `intelligence_v7`. The Tower reader sets `app.tenant_key` via `set_config`
  -- before every query, so the predicate resolves.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'ecl_projection'
       and tablename = 'tower_assessment_lifecycle'
       and policyname = 'tower_assessment_lifecycle_tenant_select'
  ) then
    execute $policy$
      create policy tower_assessment_lifecycle_tenant_select
        on ecl_projection.tower_assessment_lifecycle
        for select
        using (
          tenant_key = current_setting('app.tenant_key', true)
          or tenant_key = current_setting('app.client_key', true)
          or current_setting('app.tenant_key', true) = 'internal-admin'
          or current_setting('app.client_key', true) = 'internal-admin'
        )
    $policy$;
  end if;

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
      -- 1. A declared active generation wins outright, for the tenants that have one.
      select
        l.tenant_key,
        l.assessment_id,
        l.projection_version
      from ecl_projection.tower_assessment_lifecycle l
      where l.state = 'active'

      union all

      -- 2. The prior ranking, kept verbatim, and applied only to tenants with no declaration yet.
      --    This is what makes the migration inert on the day it lands. It is a bridge, not a
      --    design: every tenant reaching this branch is one whose active generation is still a
      --    guess.
      select
        ranked.tenant_key,
        ranked.assessment_id,
        ranked.projection_version
      from (
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
        from (
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
        ) candidates
      ) ranked
      where ranked.rn = 1
        and not exists (
          select 1
          from ecl_projection.tower_assessment_lifecycle declared
          where declared.tenant_key = ranked.tenant_key
            and declared.state = 'active'
        );
    $function$;
  $sql$;
end
$migration$;
