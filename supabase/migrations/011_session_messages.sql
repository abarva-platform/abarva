-- ─────────────────────────────────────────────────────────────────────────────
-- 011_session_messages.sql
--
-- Per-engagement conversation memory for the advisor. Every turn (user + assistant)
-- is persisted with a monotonically increasing turn_number scoped to the
-- (engagement_id, user_id) pair. Lets the advisor read the last N turns + a
-- summary of anything older, and lets the UI restore conversation state on
-- page reload.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  engagement_id text not null,
  user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  turn_number integer not null,
  client_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_session_messages_lookup
  on session_messages(engagement_id, user_id, turn_number desc);

create index if not exists idx_session_messages_client
  on session_messages(client_id, user_id, created_at desc);
