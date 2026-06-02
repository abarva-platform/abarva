-- T213 · Responsible AI annual re-acknowledgment cycle
--
-- T212 created an immutable per-user click-wrap ledger keyed by
-- client/user/text version. Annual re-acknowledgment needs additional immutable
-- rows without overwriting the original evidence, so this migration adds a
-- cycle key and expands the uniqueness contract.

BEGIN;

ALTER TABLE responsible_ai_acknowledgments
  ADD COLUMN IF NOT EXISTS acknowledgment_cycle TEXT NOT NULL DEFAULT 'initial';

ALTER TABLE responsible_ai_acknowledgments
  DROP CONSTRAINT IF EXISTS responsible_ai_acknowledgments_client_id_user_id_text_version_key;

CREATE UNIQUE INDEX IF NOT EXISTS ux_responsible_ai_ack_client_user_version_cycle
  ON responsible_ai_acknowledgments (
    client_id,
    user_id,
    text_version,
    acknowledgment_cycle
  );

CREATE INDEX IF NOT EXISTS idx_responsible_ai_ack_cycle
  ON responsible_ai_acknowledgments (acknowledgment_cycle, accepted_at DESC);

COMMENT ON COLUMN responsible_ai_acknowledgments.acknowledgment_cycle IS
  'Annual acknowledgment cycle key. Existing T212 rows default to initial; annual renewals use annual-YYYY.';

COMMIT;
