begin;

-- Candidates remain immutable and unready; reviewed product admission is a separate version.
create table ecl_projection.home_insight_admission (
  tenant_key text not null,
  assessment_id text not null,
  release_id uuid not null,
  base_home_record_token text not null check (base_home_record_token ~ '^[0-9a-f]{64}$'),
  admission_hash text not null check (admission_hash ~ '^[0-9a-f]{64}$'),
  admission_json jsonb not null,
  review_proof_uri text not null,
  first_run_id text not null,
  created_at timestamptz not null default now(),
  primary key (tenant_key, assessment_id, base_home_record_token),
  foreign key (tenant_key, assessment_id, release_id)
    references ecl_projection.enterprise_insight_release (tenant_key, assessment_id, id),
  check (coalesce(admission_json->'review'->>'tenantKey' = tenant_key, false)),
  check (coalesce(admission_json->'review'->>'assessmentId' = assessment_id, false)),
  check (coalesce(admission_json->'review'->>'releaseId' = release_id::text, false)),
  check (coalesce(admission_json->'review'->>'baseHomeRecordToken' = base_home_record_token, false))
);
create function ecl_projection.refuse_home_insight_admission_change() returns trigger
language plpgsql as $$
begin
  raise exception 'Home insight admissions are immutable; revoke serving approval instead';
end;
$$;
create trigger home_insight_admission_immutable before update or delete
  on ecl_projection.home_insight_admission for each row
  execute function ecl_projection.refuse_home_insight_admission_change();
alter table ecl_projection.home_insight_admission enable row level security;
alter table ecl_projection.home_insight_admission force row level security;
create policy home_insight_tenant_fence on ecl_projection.home_insight_admission for all
  using (tenant_key = current_setting('app.tenant_key', true))
  with check (tenant_key = current_setting('app.tenant_key', true));
revoke all on ecl_projection.home_insight_admission from public;

create view serving.home_insight_admissions with (security_invoker = true) as
  select a.tenant_key, a.assessment_id, a.release_id, a.base_home_record_token,
    a.admission_hash, a.admission_json
  from ecl_projection.home_insight_admission a
  join ecl_projection.enterprise_insight_release r
    on r.tenant_key = a.tenant_key and r.assessment_id = a.assessment_id and r.id = a.release_id
  where a.tenant_key = current_setting('app.tenant_key', true)
    and a.admission_json->'plan'->>'loadVersionHash' = r.load_version_hash
    and a.admission_json->'plan'->>'resultHash' = r.result_hash;
revoke all on serving.home_insight_admissions from public;

commit;
