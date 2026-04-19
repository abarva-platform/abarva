-- ─────────────────────────────────────────────────────────────────────────────
-- 012_intake.sql
--
-- Package 2A — Partner-style engagement intake.
--
--   intake_turns       — per-turn conversation log for the five-act intake
--   engagement_charters — structured charter extracted from the intake,
--                         with approval workflow
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists intake_turns (
  id uuid primary key default gen_random_uuid(),
  engagement_id text not null,
  user_id text not null,
  client_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  turn_number integer not null,
  act integer not null check (act between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_intake_turns_lookup
  on intake_turns(engagement_id, user_id, turn_number desc);

create table if not exists engagement_charters (
  id uuid primary key default gen_random_uuid(),
  engagement_id text unique not null,
  client_id text not null,
  created_by_user_id text not null,
  status text not null default 'draft' check (status in (
    'draft', 'pending_approval', 'approved', 'rejected'
  )),
  problem text,
  desired_outcome text,
  timeline text,
  success_metrics text,
  primary_sponsor text,
  co_sponsor text,
  workstreams jsonb default '[]'::jsonb,
  dependencies text,
  data_available jsonb default '[]'::jsonb,
  data_gaps jsonb default '[]'::jsonb,
  risks jsonb default '[]'::jsonb,
  approval_required_from text[],
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_engagement_charters_client
  on engagement_charters(client_id, created_at desc);

create or replace function engagement_charters_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_engagement_charters_touch_updated_at on engagement_charters;
create trigger trg_engagement_charters_touch_updated_at
before update on engagement_charters
for each row execute function engagement_charters_touch_updated_at();
