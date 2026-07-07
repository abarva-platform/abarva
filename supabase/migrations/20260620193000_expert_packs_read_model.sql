-- SCB W2.3 · ExpertPack retrievable read model.
--
-- ExpertPack source files remain the authored source of truth in git. This
-- table is the deterministic Postgres read model the router/evals can query by
-- industry, function, or cross-cutting domain after loader admission.

CREATE TABLE IF NOT EXISTS public.expert_packs (
  pack_id                TEXT PRIMARY KEY,
  pack_version           TEXT NOT NULL,
  expert_name            TEXT NOT NULL,
  kind                   TEXT NOT NULL,
  industry               TEXT,
  function_key           TEXT,
  cross_cutting_domain   TEXT,
  scope_note             TEXT NOT NULL,
  pack                   JSONB NOT NULL,
  depth_counts           JSONB NOT NULL,
  gate_result            JSONB NOT NULL,
  gate_pass              BOOLEAN NOT NULL DEFAULT false,
  blocker_count          INTEGER NOT NULL DEFAULT 0,
  concern_count          INTEGER NOT NULL DEFAULT 0,
  pack_hash              TEXT NOT NULL,
  authored_by            TEXT,
  review_tier            TEXT,
  provenance_confidence  TEXT,
  as_of                  DATE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_packs
  ADD COLUMN IF NOT EXISTS pack_version TEXT,
  ADD COLUMN IF NOT EXISTS expert_name TEXT,
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS function_key TEXT,
  ADD COLUMN IF NOT EXISTS cross_cutting_domain TEXT,
  ADD COLUMN IF NOT EXISTS scope_note TEXT,
  ADD COLUMN IF NOT EXISTS pack JSONB,
  ADD COLUMN IF NOT EXISTS depth_counts JSONB,
  ADD COLUMN IF NOT EXISTS gate_result JSONB,
  ADD COLUMN IF NOT EXISTS gate_pass BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocker_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS concern_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pack_hash TEXT,
  ADD COLUMN IF NOT EXISTS authored_by TEXT,
  ADD COLUMN IF NOT EXISTS review_tier TEXT,
  ADD COLUMN IF NOT EXISTS provenance_confidence TEXT,
  ADD COLUMN IF NOT EXISTS as_of DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'expert_packs_kind_check'
       AND conrelid = 'public.expert_packs'::regclass
  ) THEN
    ALTER TABLE public.expert_packs
      ADD CONSTRAINT expert_packs_kind_check
      CHECK (kind IN ('industry-function', 'cross-cutting-domain'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'expert_packs_identity_axis_check'
       AND conrelid = 'public.expert_packs'::regclass
  ) THEN
    ALTER TABLE public.expert_packs
      ADD CONSTRAINT expert_packs_identity_axis_check
      CHECK (
        (
          kind = 'industry-function'
          AND industry IS NOT NULL
          AND function_key IS NOT NULL
        )
        OR (
          kind = 'cross-cutting-domain'
          AND cross_cutting_domain IS NOT NULL
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expert_packs_industry_function_ready
  ON public.expert_packs (industry, function_key)
  WHERE kind = 'industry-function' AND gate_pass = true;

CREATE INDEX IF NOT EXISTS idx_expert_packs_cross_cutting_ready
  ON public.expert_packs (cross_cutting_domain)
  WHERE kind = 'cross-cutting-domain' AND gate_pass = true;

CREATE INDEX IF NOT EXISTS idx_expert_packs_gate_pass
  ON public.expert_packs (gate_pass, blocker_count);

CREATE INDEX IF NOT EXISTS idx_expert_packs_pack_gin
  ON public.expert_packs USING GIN (pack);

COMMENT ON TABLE public.expert_packs IS
  'SCB Consilium ExpertPack read model. Authored source is git; rows are loader-admitted, gate-scored retrievable copies.';
COMMENT ON COLUMN public.expert_packs.gate_pass IS
  'True only when gateExpertPack() returns zero blockers at loader time.';

ALTER TABLE public.expert_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_packs_read_all_authenticated" ON public.expert_packs;
DROP POLICY IF EXISTS "expert_packs_service_role_all" ON public.expert_packs;

CREATE POLICY "expert_packs_read_all_authenticated"
  ON public.expert_packs FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR current_setting('app.current_role', true) = 'MAESTRO'
  );

CREATE POLICY "expert_packs_service_role_all"
  ON public.expert_packs FOR ALL
  USING (
    auth.role() = 'service_role'
    OR current_setting('app.current_role', true) = 'MAESTRO'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR current_setting('app.current_role', true) = 'MAESTRO'
  );
