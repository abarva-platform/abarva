-- Source canvas · per-event artifact body
--
-- Closes the "where do I retrieve the document?" gap. Until this
-- migration, source_event_artifact_states stored only status / tier /
-- requirementLevel — there was no per-event content. Mark complete
-- flipped a status pill but the document body was always the static
-- template from src/content/source-templates/. That meant a sourcing
-- lead could promote a stage without actually authoring anything.
--
-- This adds:
--   - body         · per-event markdown content for the artifact
--   - body_format  · 'markdown' (default) / 'html' / 'plain' for future formats
--   - body_authored_by · clerk user id of the last author (audit)
--   - body_updated_at  · stamped on every body PATCH
--
-- The body field is nullable — when null, the canvas falls back to the
-- canonical template body, exactly as it does today. Authoring real
-- content fills the column and the template fallback is bypassed.
--
-- For uploaded files (paperclip), the existing source_artifacts
-- registry + linked_artifact_id bridge stays the path. This column is
-- specifically for inline-authored markdown drafted on the canvas.

BEGIN;

ALTER TABLE source_event_artifact_states
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE source_event_artifact_states
  ADD COLUMN IF NOT EXISTS body_format TEXT NOT NULL DEFAULT 'markdown'
    CHECK (body_format IN ('markdown', 'html', 'plain'));

ALTER TABLE source_event_artifact_states
  ADD COLUMN IF NOT EXISTS body_authored_by TEXT;

ALTER TABLE source_event_artifact_states
  ADD COLUMN IF NOT EXISTS body_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN source_event_artifact_states.body IS
  'Per-event inline-authored artifact body (typically markdown). NULL '
  'means no content has been authored yet; the canvas falls back to '
  'the canonical template body in that case.';

COMMENT ON COLUMN source_event_artifact_states.body_format IS
  'Format of the body column. Defaults to markdown. html / plain are '
  'reserved for future content types (e.g. structured forms).';

COMMENT ON COLUMN source_event_artifact_states.body_authored_by IS
  'Clerk user id of the last author of the body. NULL until first save.';

COMMENT ON COLUMN source_event_artifact_states.body_updated_at IS
  'Last time the body was saved. Distinct from updated_at, which '
  'changes on any column update including status flips.';

COMMIT;
