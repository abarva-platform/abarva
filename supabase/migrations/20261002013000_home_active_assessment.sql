-- Home selects an assessment only after an explicit, proof-bound declaration.
-- No row is inserted by this migration, so existing reads remain unchanged.

begin;

create table if not exists ecl_projection.home_active_assessment (
  tenant_key text not null,
  assessment_id text not null,
  projection_manifest_id uuid not null references ecl_projection.projection_manifest(id),
  source_set_hash text not null,
  projection_hash text not null,
  projection_proof_uri text not null,
  state text not null check (state in ('active', 'retired')),
  activated_at timestamptz not null default now(),
  retired_at timestamptz,
  primary key (tenant_key, assessment_id),
  constraint home_active_assessment_retired_at_check
    check ((state = 'retired') = (retired_at is not null))
);

create unique index if not exists home_active_assessment_one_active
  on ecl_projection.home_active_assessment (tenant_key)
  where state = 'active';

alter table ecl_projection.home_active_assessment enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'ecl_projection'
      and tablename = 'home_active_assessment'
      and policyname = 'home_active_assessment_tenant_select'
  ) then
    create policy home_active_assessment_tenant_select
      on ecl_projection.home_active_assessment
      for select
      using (
        tenant_key = current_setting('app.tenant_key', true)
        or tenant_key = current_setting('app.client_key', true)
        or current_setting('app.tenant_key', true) = 'internal-admin'
        or current_setting('app.client_key', true) = 'internal-admin'
      );
  end if;
end $$;

commit;
