-- Wave 3c: unified artifact index VIEW.
--
-- UNION ALLs four artifact sources keyed on engagement_id:
-- deliverables_v2, engagement_deliverables, program_evidence_items, program_attachments.
--
-- No actor_id in v1. Non-disruptive — downstream code can adopt at its own pace.
-- Reversal: DROP VIEW IF EXISTS move_artifact_index;

CREATE OR REPLACE VIEW move_artifact_index AS
  SELECT
    engagement_id,
    'deliverable'::text AS artifact_type,
    id::text AS artifact_id,
    title,
    NULL::text AS summary,
    deliverable_type_key AS artifact_kind,
    status,
    NULL::int AS phase_number,
    created_at,
    updated_at
  FROM deliverables_v2

  UNION ALL

  SELECT
    engagement_id,
    'legacy_deliverable'::text,
    id::text,
    title,
    NULL::text,
    document_type,
    NULL::text,
    NULL::int,
    generated_at AS created_at,
    generated_at AS updated_at
  FROM engagement_deliverables
  WHERE engagement_id IS NOT NULL

  UNION ALL

  SELECT
    program_id AS engagement_id,
    'evidence'::text,
    id::text,
    title,
    summary,
    evidence_type AS artifact_kind,
    NULL::text,
    phase AS phase_number,
    created_at,
    created_at AS updated_at
  FROM program_evidence_items

  UNION ALL

  SELECT
    program_id AS engagement_id,
    'attachment'::text,
    id::text,
    original_name AS title,
    NULL::text,
    mime_type AS artifact_kind,
    scan_status AS status,
    phase AS phase_number,
    created_at,
    created_at AS updated_at
  FROM program_attachments
  WHERE deleted_at IS NULL;
