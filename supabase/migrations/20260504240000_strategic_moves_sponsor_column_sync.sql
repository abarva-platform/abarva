-- Sponsor column sync: backfill engagements.sponsor_person_id from
-- engagement_participants where a sponsor row exists but the column is NULL.
-- Scoped to 5 demo clients. Stamped via value_assumptions_jsonb for tracing.
-- Idempotent: only updates rows where sponsor_person_id IS NULL.
-- Reversible: UPDATE engagements SET sponsor_person_id = NULL
--   WHERE value_assumptions_jsonb->>'sponsor_sync_source' = 'sponsor_column_sync_2026_05_04';

BEGIN;

UPDATE engagements
SET
  sponsor_person_id = ep.person_id,
  value_assumptions_jsonb = COALESCE(value_assumptions_jsonb, '{}'::jsonb)
    || '{"sponsor_sync_source": "sponsor_column_sync_2026_05_04"}'::jsonb
FROM engagement_participants ep
WHERE ep.engagement_id = engagements.id
  AND ep.approval_authority = 'sponsor'
  AND ep.notification_preferences->>'source' IN (
    'participants_topup_2026_05_04',
    'participants_expansion_2026_05_04'
  )
  AND engagements.sponsor_person_id IS NULL
  AND engagements.client_id IN (
    SELECT id FROM clients WHERE name IN (
      'Apex Retail',
      'First Capital',
      'Helix Therapeutics',
      'Keystone Energy Holdings',
      'Meridian Health'
    )
  );

COMMIT;
