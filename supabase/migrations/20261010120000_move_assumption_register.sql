-- Move assumptions register — storage for the Move-level register of working
-- figures and the append-only history of every change to it.
--
-- Why: a Move's value and delivery documents rest on assumptions that are not
-- yet evidence. Each one becomes a canonical object with a stable register ID
-- (V3, D2, DL1, A4) that documents cite as [A:V3], an owner role, a source, a
-- confidence of 1, 3 or 5, and a status. aVa may only PROPOSE a row; a person
-- accepts, rejects, answers or supersedes it. Working figures are labelled
-- assumptions, never facts.
-- Safety: additive-only. Two new tables, no change to any existing table, no
-- seed rows. Re-runnable (IF NOT EXISTS / DROP POLICY IF EXISTS throughout).
-- No BEGIN/COMMIT here: the migration runner wraps each file in its own
-- transaction, and an inner COMMIT would end that transaction early.
-- Depends on: engagements (Moves are engagements rows).
--
-- Read/write path: the server writes through the service role
-- (src/lib/programs/assumption-register/store.ts), fenced by tenant aliases +
-- program_id and guarded by `revision`. Authenticated sessions may only read
-- their own tenant's rows. Gated by the `moves_assumption_register_v1` flag.
--
-- ID scheme: register_id = area prefix || seq, prefixes V (value), D (data),
-- DL (delivery), A (adoption). A register ID is never reused: rows are never
-- deleted by the product, seq is allocated as max+1 per (program, area), and
-- (program_id, area, seq) and (program_id, register_id) are both unique. A
-- correction keeps its ID; a supersede creates a new row with a new ID and
-- points the old row at it.

CREATE TABLE IF NOT EXISTS move_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  seq INT NOT NULL,
  register_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  why_it_matters TEXT NULL,
  working_figure TEXT NULL,
  working_value NUMERIC NULL,
  unit TEXT NULL,
  source TEXT NOT NULL,
  confidence SMALLINT NOT NULL,
  owner_role TEXT NOT NULL,
  owner_name TEXT NULL,
  owner_person_id UUID NULL,
  status TEXT NOT NULL,
  origin TEXT NOT NULL,
  answer TEXT NULL,
  answer_figure TEXT NULL,
  answer_value NUMERIC NULL,
  answer_source TEXT NULL,
  answered_by_user_id TEXT NULL,
  answered_at TIMESTAMPTZ NULL,
  accepted_by_user_id TEXT NULL,
  accepted_at TIMESTAMPTZ NULL,
  superseded_by UUID NULL REFERENCES move_assumptions(id),
  raised_phase INT NULL,
  raised_step_id TEXT NULL,
  evidence_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  charter_section_key TEXT NULL,
  charter_value_revision TEXT NULL,
  revision INT NOT NULL DEFAULT 1,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT move_assumptions_area_check
    CHECK (area IN ('value', 'data', 'delivery', 'adoption')),
  CONSTRAINT move_assumptions_seq_check CHECK (seq > 0),
  -- The register ID is derived from area + seq, so it can never disagree with
  -- them and the unique (program_id, area, seq) index also fences the ID.
  CONSTRAINT move_assumptions_register_id_check
    CHECK (
      register_id = (
        CASE area
          WHEN 'value' THEN 'V'
          WHEN 'data' THEN 'D'
          WHEN 'delivery' THEN 'DL'
          WHEN 'adoption' THEN 'A'
        END
      ) || seq::text
    ),
  CONSTRAINT move_assumptions_statement_check
    CHECK (length(btrim(statement)) > 0),
  CONSTRAINT move_assumptions_source_check
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT move_assumptions_owner_role_check
    CHECK (length(btrim(owner_role)) > 0),
  CONSTRAINT move_assumptions_confidence_check
    CHECK (confidence IN (1, 3, 5)),
  CONSTRAINT move_assumptions_status_check
    CHECK (status IN ('proposed', 'open', 'confirmed', 'corrected', 'superseded', 'rejected')),
  CONSTRAINT move_assumptions_origin_check
    CHECK (origin IN ('team', 'ava_proposal', 'charter_carry_forward', 'evidence_extraction')),
  CONSTRAINT move_assumptions_raised_phase_check
    CHECK (raised_phase IS NULL OR (raised_phase >= 0 AND raised_phase <= 5)),
  CONSTRAINT move_assumptions_revision_check CHECK (revision >= 1),
  -- An answered row names where the answer came from and when.
  CONSTRAINT move_assumptions_answered_check
    CHECK (
      status NOT IN ('confirmed', 'corrected')
      OR (
        answer_source IS NOT NULL
        AND length(btrim(answer_source)) > 0
        AND answered_at IS NOT NULL
      )
    ),
  -- A correction states what the right answer is.
  CONSTRAINT move_assumptions_corrected_check
    CHECK (status <> 'corrected' OR (answer IS NOT NULL AND length(btrim(answer)) > 0)),
  -- A superseded row points at the row that replaced it, never at itself.
  CONSTRAINT move_assumptions_superseded_check
    CHECK (status <> 'superseded' OR superseded_by IS NOT NULL),
  CONSTRAINT move_assumptions_superseded_self_check
    CHECK (superseded_by IS NULL OR superseded_by <> id),
  -- An aVa proposal reaches the working register only through a person's
  -- acceptance; a rejected or still-proposed row carries none.
  CONSTRAINT move_assumptions_ava_acceptance_check
    CHECK (
      origin <> 'ava_proposal'
      OR status IN ('proposed', 'rejected')
      OR (accepted_by_user_id IS NOT NULL AND accepted_at IS NOT NULL)
    )
);

-- Register IDs are unique per Move and never reused.
CREATE UNIQUE INDEX IF NOT EXISTS uq_move_assumptions_program_register_id
  ON move_assumptions (program_id, register_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_move_assumptions_program_area_seq
  ON move_assumptions (program_id, area, seq);

-- One register row per carried-forward charter section per Move.
CREATE UNIQUE INDEX IF NOT EXISTS uq_move_assumptions_program_charter_section
  ON move_assumptions (program_id, charter_section_key)
  WHERE charter_section_key IS NOT NULL;

-- The hot path: "this Move's register, by status".
CREATE INDEX IF NOT EXISTS idx_move_assumptions_tenant_program_status
  ON move_assumptions (tenant_key, program_id, status);

-- Append-only history: one event per revision of a register row.
CREATE TABLE IF NOT EXISTS move_assumption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  assumption_id UUID NOT NULL REFERENCES move_assumptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT NULL,
  to_status TEXT NOT NULL,
  revision INT NOT NULL,
  before JSONB NULL,
  after JSONB NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT move_assumption_events_event_type_check
    CHECK (event_type IN ('created', 'edited', 'accepted', 'rejected', 'confirmed', 'corrected', 'superseded')),
  CONSTRAINT move_assumption_events_from_status_check
    CHECK (from_status IS NULL OR from_status IN ('proposed', 'open', 'confirmed', 'corrected', 'superseded', 'rejected')),
  CONSTRAINT move_assumption_events_to_status_check
    CHECK (to_status IN ('proposed', 'open', 'confirmed', 'corrected', 'superseded', 'rejected')),
  CONSTRAINT move_assumption_events_actor_kind_check
    CHECK (actor_kind IN ('person', 'ava')),
  CONSTRAINT move_assumption_events_revision_check CHECK (revision >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_move_assumption_events_assumption_revision
  ON move_assumption_events (assumption_id, revision);

CREATE INDEX IF NOT EXISTS idx_move_assumption_events_tenant_program
  ON move_assumption_events (tenant_key, program_id, created_at DESC);

-- ── Row-level security ────────────────────────────────────────────────────
ALTER TABLE move_assumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_move_assumptions" ON move_assumptions;
CREATE POLICY "service_role_all_move_assumptions" ON move_assumptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_move_assumptions" ON move_assumptions;
CREATE POLICY "authenticated_read_move_assumptions" ON move_assumptions
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM engagements)
  );

GRANT SELECT ON move_assumptions TO authenticated;

ALTER TABLE move_assumption_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_move_assumption_events" ON move_assumption_events;
CREATE POLICY "service_role_all_move_assumption_events" ON move_assumption_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_move_assumption_events" ON move_assumption_events;
CREATE POLICY "authenticated_read_move_assumption_events" ON move_assumption_events
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM engagements)
  );

-- History is append-only: an authenticated session can never rewrite or
-- remove an event (the same denial program_evidence_items uses).
DROP POLICY IF EXISTS "authenticated_update_move_assumption_events" ON move_assumption_events;
DROP POLICY IF EXISTS "authenticated_delete_move_assumption_events" ON move_assumption_events;
CREATE POLICY "authenticated_update_move_assumption_events" ON move_assumption_events
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "authenticated_delete_move_assumption_events" ON move_assumption_events
  FOR DELETE TO authenticated USING (false);

GRANT SELECT ON move_assumption_events TO authenticated;

NOTIFY pgrst, 'reload schema';
