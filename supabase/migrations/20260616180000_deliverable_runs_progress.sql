-- Deliverable runs — live progress for the multi-pass generation band.
--
-- The orchestrator runs six passes (~30–60s). To replace the spinner with a real
-- progress band, the background worker updates these columns after each pass and the
-- poll endpoint surfaces them. Additive + nullable, so in-flight runs are unaffected.

ALTER TABLE deliverable_runs
  ADD COLUMN IF NOT EXISTS progress_pct INT NULL
    CHECK (progress_pct IS NULL OR (progress_pct >= 0 AND progress_pct <= 100)),
  ADD COLUMN IF NOT EXISTS progress_label TEXT NULL,
  ADD COLUMN IF NOT EXISTS progress_pass TEXT NULL;
