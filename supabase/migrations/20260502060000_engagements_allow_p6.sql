-- Programs lifecycle now has seven visible phases: P0 Origination through
-- P6 Tower Handoff. The prior constraint capped current_phase at 5, which
-- made a successful P5 -> P6 gate impossible even when all hard-gate evidence
-- was present.

ALTER TABLE engagements
  DROP CONSTRAINT IF EXISTS engagements_current_phase_check;

ALTER TABLE engagements
  ADD CONSTRAINT engagements_current_phase_check
  CHECK (current_phase IS NULL OR (current_phase >= 0 AND current_phase <= 6));
