-- Tenant isolation for the four Tower projection tables.
--
-- All four have RLS enabled with zero policies. In Postgres that denies every read to any role
-- which does not bypass RLS, and the application reads them successfully — so its role bypasses.
-- Tenant isolation therefore rests entirely on the `where tenant_key = $1` in
-- `readTowerCommandCenter`, which is a property of one reader rather than of the data. A query
-- that omits the predicate is stopped by nothing.
--
-- This is the same structural weakness that let the serving functions return retired generations:
-- a governed property living in a caller instead of in the substrate.
--
-- Adding a permissive policy here is strictly non-destructive. A table with RLS enabled and no
-- policies already denies everything to a non-bypassing role, so a policy can only grant access,
-- never remove it; and a bypassing role is unaffected either way. The change cannot reduce what
-- any current consumer can read.
--
-- The predicate follows the pattern already established in `intelligence_v7` and used on
-- `tower_assessment_lifecycle`. The Tower reader sets `app.tenant_key` via `set_config` before
-- every query, so it resolves.

do $migration$
declare
  target text;
begin
  foreach target in array array[
    'tower_ai_portfolio',
    'tower_command_center',
    'tower_value_chain',
    'tower_evidence_queue'
  ]
  loop
    if to_regclass('ecl_projection.' || target) is null then
      raise notice 'ecl_projection.% absent; skipping', target;
      continue;
    end if;

    execute format('alter table ecl_projection.%I enable row level security', target);

    if not exists (
      select 1 from pg_policies
       where schemaname = 'ecl_projection'
         and tablename = target
         and policyname = target || '_tenant_select'
    ) then
      execute format(
        'create policy %I on ecl_projection.%I for select using (
           tenant_key = current_setting(''app.tenant_key'', true)
           or tenant_key = current_setting(''app.client_key'', true)
           or current_setting(''app.tenant_key'', true) = ''internal-admin''
           or current_setting(''app.client_key'', true) = ''internal-admin''
         )',
        target || '_tenant_select',
        target
      );
      raise notice 'created % _tenant_select', target;
    end if;
  end loop;
end
$migration$;
