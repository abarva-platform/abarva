-- A Home declaration may name only a projection manifest of its own tenant and assessment.
-- The declarations table referenced the manifest by id alone, so the database accepted a
-- declaration for one tenant that named another tenant's manifest; only the reader refused it.
-- Additive: one unique index on the manifest table and one foreign key. No row is written.
-- A declaration already stored that names another tenant's or assessment's manifest makes this
-- fail as a whole and change nothing, which is the intended way to find such a row.

begin;

-- Fail rather than queue behind a long writer on either table.
set local lock_timeout = '10s';

create unique index if not exists projection_manifest_id_tenant_assessment_key
  on ecl_projection.projection_manifest (id, tenant_key, assessment_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'ecl_projection.home_active_assessment'::regclass
      and conname = 'home_active_assessment_manifest_tenant_fkey'
  ) then
    alter table ecl_projection.home_active_assessment
      add constraint home_active_assessment_manifest_tenant_fkey
      foreign key (projection_manifest_id, tenant_key, assessment_id)
      references ecl_projection.projection_manifest (id, tenant_key, assessment_id);
  end if;
end $$;

commit;
