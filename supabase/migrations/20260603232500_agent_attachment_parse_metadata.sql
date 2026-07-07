-- Agent attachment parse economics metadata.
--
-- Persists the normalized parser/economics packet returned by
-- POST /api/v1/agent/attachments so cost-per-document dashboards and weekly
-- tenant reports can read parse cost, parser, document hash, and routing
-- evidence without reparsing uploads.

BEGIN;

ALTER TABLE agent_attachment
  ADD COLUMN IF NOT EXISTS parse_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_agent_attachment_parse_document_key
  ON agent_attachment ((parse_metadata->>'document_key'))
  WHERE parse_metadata IS NOT NULL
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agent_attachment_parse_provider
  ON agent_attachment ((parse_metadata->>'parse_provider'))
  WHERE parse_metadata IS NOT NULL
    AND deleted_at IS NULL;

COMMIT;
