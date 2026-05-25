-- FOUNDATION-FIX-2 · Intelligence Ask session memory.
--
-- Persists /api/intelligence/ask turns by tenant + user + browser tab and
-- links an Intelligence-originated Move back to its source session.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.intelligence_ask_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Intelligence Ask session',
  summary TEXT,
  linked_move_id UUID REFERENCES public.engagements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_turn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, tab_id)
);

CREATE TABLE IF NOT EXISTS public.intelligence_ask_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.intelligence_ask_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.move_instances
  ADD COLUMN IF NOT EXISTS originating_intelligence_session_id UUID
  REFERENCES public.intelligence_ask_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS intelligence_ask_sessions_tenant_user_recent_idx
  ON public.intelligence_ask_sessions (tenant_id, user_id, last_turn_at DESC);

CREATE INDEX IF NOT EXISTS intelligence_ask_sessions_linked_move_idx
  ON public.intelligence_ask_sessions (linked_move_id)
  WHERE linked_move_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS intelligence_ask_turns_session_recent_idx
  ON public.intelligence_ask_turns (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS intelligence_ask_turns_tenant_user_recent_idx
  ON public.intelligence_ask_turns (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS move_instances_originating_intelligence_session_idx
  ON public.move_instances (originating_intelligence_session_id)
  WHERE originating_intelligence_session_id IS NOT NULL;

ALTER TABLE public.intelligence_ask_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_ask_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_intelligence_ask_sessions ON public.intelligence_ask_sessions;
CREATE POLICY service_role_all_intelligence_ask_sessions
  ON public.intelligence_ask_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_intelligence_ask_turns ON public.intelligence_ask_turns;
CREATE POLICY service_role_all_intelligence_ask_turns
  ON public.intelligence_ask_turns
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_select_own_intelligence_ask_sessions ON public.intelligence_ask_sessions;
CREATE POLICY authenticated_select_own_intelligence_ask_sessions
  ON public.intelligence_ask_sessions
  FOR SELECT TO authenticated
  USING (user_id = current_user_id() AND can_read_tenant_by_id(tenant_id));

DROP POLICY IF EXISTS authenticated_insert_own_intelligence_ask_sessions ON public.intelligence_ask_sessions;
CREATE POLICY authenticated_insert_own_intelligence_ask_sessions
  ON public.intelligence_ask_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_user_id() AND can_read_tenant_by_id(tenant_id));

DROP POLICY IF EXISTS authenticated_update_own_intelligence_ask_sessions ON public.intelligence_ask_sessions;
CREATE POLICY authenticated_update_own_intelligence_ask_sessions
  ON public.intelligence_ask_sessions
  FOR UPDATE TO authenticated
  USING (user_id = current_user_id() AND can_read_tenant_by_id(tenant_id))
  WITH CHECK (user_id = current_user_id() AND can_read_tenant_by_id(tenant_id));

DROP POLICY IF EXISTS authenticated_select_own_intelligence_ask_turns ON public.intelligence_ask_turns;
CREATE POLICY authenticated_select_own_intelligence_ask_turns
  ON public.intelligence_ask_turns
  FOR SELECT TO authenticated
  USING (user_id = current_user_id() AND can_read_tenant_by_id(tenant_id));

DROP POLICY IF EXISTS authenticated_insert_own_intelligence_ask_turns ON public.intelligence_ask_turns;
CREATE POLICY authenticated_insert_own_intelligence_ask_turns
  ON public.intelligence_ask_turns
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = current_user_id()
    AND can_read_tenant_by_id(tenant_id)
    AND EXISTS (
      SELECT 1
      FROM public.intelligence_ask_sessions s
      WHERE s.id = session_id
        AND s.tenant_id = intelligence_ask_turns.tenant_id
        AND s.user_id = intelligence_ask_turns.user_id
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.intelligence_ask_sessions TO authenticated;
GRANT SELECT, INSERT ON public.intelligence_ask_turns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.intelligence_ask_sessions TO service_role;
GRANT SELECT, INSERT ON public.intelligence_ask_turns TO service_role;

COMMENT ON TABLE public.intelligence_ask_sessions IS
  'Tenant/user/tab scoped continuity records for /api/intelligence/ask.';
COMMENT ON TABLE public.intelligence_ask_turns IS
  'Persisted user and assistant turns for Intelligence Ask session memory.';
COMMENT ON COLUMN public.move_instances.originating_intelligence_session_id IS
  'Intelligence Ask session that originated this Move instance, when applicable.';

NOTIFY pgrst, 'reload schema';

COMMIT;
