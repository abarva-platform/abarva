-- AIR-1c · Natural-key UNIQUE constraints on the 4 UUID-PK supporting
-- tables, plus dedup pass.
--
-- AIR-1 originally gave stakeholder_notes / decisions / vendors /
-- scenarios UUID primary keys with no natural-key uniqueness. The
-- AIR-2 loader's `upsert(... onConflict='<uuid>')` calls therefore
-- never hit a conflict and duplicated rows on re-runs. Apex's two
-- successful runs and Meridian's first-partial-then-full runs left
-- duplicates in the registry.
--
-- Fix:
--   1. Dedup existing rows (keep oldest by created_at per natural-key
--      tuple). Idempotent — a second apply finds 0 dups to delete.
--   2. Add UNIQUE constraints on the natural-key tuples so subsequent
--      loader runs upsert correctly.
--
-- Natural keys (one per row per initiative for these data shapes):
--   stakeholder_notes: (initiative_id, stakeholder_name, interview_date)
--   decisions:         (initiative_id, decision_name)
--   vendors:           (initiative_id, vendor_name)
--   scenarios:         (initiative_id, scenario_name)

BEGIN;

-- ---------------------------------------------------------------------
-- Dedup · stakeholder_notes
-- ---------------------------------------------------------------------

DELETE FROM ai_initiative_stakeholder_notes a
USING ai_initiative_stakeholder_notes b
WHERE a.note_id <> b.note_id
  AND a.initiative_id    = b.initiative_id
  AND a.stakeholder_name = b.stakeholder_name
  AND a.interview_date   = b.interview_date
  AND a.created_at       > b.created_at;

ALTER TABLE ai_initiative_stakeholder_notes
  ADD CONSTRAINT ai_initiative_stakeholder_notes_natural_key
  UNIQUE (initiative_id, stakeholder_name, interview_date);

-- ---------------------------------------------------------------------
-- Dedup · decisions
-- ---------------------------------------------------------------------

DELETE FROM ai_initiative_decisions a
USING ai_initiative_decisions b
WHERE a.decision_id <> b.decision_id
  AND a.initiative_id = b.initiative_id
  AND a.decision_name = b.decision_name
  AND a.created_at    > b.created_at;

ALTER TABLE ai_initiative_decisions
  ADD CONSTRAINT ai_initiative_decisions_natural_key
  UNIQUE (initiative_id, decision_name);

-- ---------------------------------------------------------------------
-- Dedup · vendors
-- ---------------------------------------------------------------------

DELETE FROM ai_initiative_vendors a
USING ai_initiative_vendors b
WHERE a.vendor_id <> b.vendor_id
  AND a.initiative_id = b.initiative_id
  AND a.vendor_name   = b.vendor_name
  AND a.created_at    > b.created_at;

ALTER TABLE ai_initiative_vendors
  ADD CONSTRAINT ai_initiative_vendors_natural_key
  UNIQUE (initiative_id, vendor_name);

-- ---------------------------------------------------------------------
-- Dedup · scenarios
-- ---------------------------------------------------------------------

DELETE FROM ai_initiative_scenarios a
USING ai_initiative_scenarios b
WHERE a.scenario_id <> b.scenario_id
  AND a.initiative_id = b.initiative_id
  AND a.scenario_name = b.scenario_name
  AND a.created_at    > b.created_at;

ALTER TABLE ai_initiative_scenarios
  ADD CONSTRAINT ai_initiative_scenarios_natural_key
  UNIQUE (initiative_id, scenario_name);

COMMIT;
