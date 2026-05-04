-- Strategic Moves · audit log addendum (Wave 2b) [follow-up F5]
--
-- Adds two audit-log action types not present in Wave 2's base stub:
--   1. milestone_completed — one entry per completed milestone
--      (i.e. program_milestones.status='hit' AND actual_date IS NOT NULL).
--      created_at = milestone.actual_date, actor = lead participant.
--   2. sponsor_review_held — one entry per active demo move
--      (current_phase 1..6), dated in the last 30 days from a
--      deterministic hash of move.id. Actor = sponsor participant.
--
-- Hard rules:
--   1. Non-destructive — INSERT only. Does not touch prior-stamped
--      rows from the base Wave 2 stub.
--   2. Scoped — 5 demo clients.
--   3. Idempotent — re-run is a no-op (WHERE NOT EXISTS clauses).
--   4. Deterministic — milestone_completed takes actual_date from the
--      milestone row; sponsor_review_held offset derived from
--      hashtext(id) % 30.
--   5. Reversible — DELETE WHERE rationale LIKE '[demo_audit_addendum_2026_05_04]%'.

BEGIN;

CREATE TEMP TABLE _adx_demo_clients ON COMMIT DROP AS
SELECT id FROM clients WHERE name IN (
  'Apex Retail','First Capital','Helix Therapeutics',
  'Keystone Energy Holdings','Meridian Health'
);

-- Step 1 · milestone_completed entries.
-- One per hit milestone for every demo-tenant move.
INSERT INTO program_audit_log (
  tenant_key, program_id, engagement_id, actor_id, actor_role,
  action, from_state, to_state, rationale, evidence_refs, created_at
)
SELECT
  COALESCE(c.slug, 'demo') AS tenant_key,
  e.id::text AS program_id,
  e.id AS engagement_id,
  -- Lead participant as actor (milestones are lead's operational responsibility).
  (SELECT ep.person_id
     FROM engagement_participants ep
     WHERE ep.engagement_id = e.id
       AND ep.approval_authority = 'approver'
     LIMIT 1) AS actor_id,
  'Program Lead' AS actor_role,
  'milestone_completed' AS action,
  NULL AS from_state,
  'completed' AS to_state,
  '[demo_audit_addendum_2026_05_04] Milestone completed: ' || pm.name AS rationale,
  '{}' AS evidence_refs,
  -- Anchor at actual_date with a small time-of-day spread so multiple
  -- milestones completed on the same day show distinct times.
  (pm.actual_date::timestamptz + ((abs(hashtext(pm.id::text)) % 86400) || ' seconds')::interval)
FROM engagements e
JOIN clients c ON c.id = e.client_id
JOIN program_milestones pm ON pm.engagement_id = e.id
WHERE e.client_id IN (SELECT id FROM _adx_demo_clients)
  AND e.archived_at IS NULL
  AND e.deleted_at IS NULL
  AND pm.status = 'hit'
  AND pm.actual_date IS NOT NULL
  AND pm.description LIKE '[demo_milestones_v2_2026_05_04]%'  -- only against the v2 milestones
  AND NOT EXISTS (
    SELECT 1 FROM program_audit_log pal
    WHERE pal.engagement_id = e.id
      AND pal.action = 'milestone_completed'
      AND pal.rationale = '[demo_audit_addendum_2026_05_04] Milestone completed: ' || pm.name
  );

-- Step 2 · sponsor_review_held for active moves.
-- One per move where current_phase in [1..6] (active programs that a
-- sponsor would actually meet about). Date placed within the last 30
-- days, deterministic by hash of move id.
INSERT INTO program_audit_log (
  tenant_key, program_id, engagement_id, actor_id, actor_role,
  action, from_state, to_state, rationale, evidence_refs, created_at
)
SELECT
  COALESCE(c.slug, 'demo') AS tenant_key,
  e.id::text AS program_id,
  e.id AS engagement_id,
  (SELECT ep.person_id
     FROM engagement_participants ep
     WHERE ep.engagement_id = e.id
       AND ep.approval_authority = 'sponsor'
     LIMIT 1) AS actor_id,
  'Sponsor' AS actor_role,
  'sponsor_review_held' AS action,
  NULL AS from_state,
  'review_held' AS to_state,
  '[demo_audit_addendum_2026_05_04] Sponsor review held; progress + risks walkthrough.' AS rationale,
  '{}' AS evidence_refs,
  -- Last 30 days: today - (hash % 30) days + time-of-day spread.
  (NOW() - ((abs(hashtext(e.id::text)) % 30) || ' days')::interval
         - ((abs(hashtext(e.id::text || 'HOUR')) % 86400) || ' seconds')::interval)
FROM engagements e
JOIN clients c ON c.id = e.client_id
WHERE e.client_id IN (SELECT id FROM _adx_demo_clients)
  AND e.archived_at IS NULL
  AND e.deleted_at IS NULL
  AND e.current_phase BETWEEN 1 AND 6
  AND NOT EXISTS (
    SELECT 1 FROM program_audit_log pal
    WHERE pal.engagement_id = e.id
      AND pal.action = 'sponsor_review_held'
      AND pal.rationale LIKE '[demo_audit_addendum_2026_05_04]%'
  );

COMMIT;
