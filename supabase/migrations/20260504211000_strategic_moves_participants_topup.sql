-- Strategic Moves · engagement_participants top-up (Wave 2 · B of E)
--
-- Ensures every demo-tenant engagement has at least a sponsor and a
-- lead participant, drawn from the existing persons roster for the
-- tenant. This unblocks:
--   - detail kv panel "Sponsor & Team" (currently renders "Unassigned")
--   - any downstream role-gated approvals that require a sponsor row
--
-- Strategy:
--   - For each move, if no participant has approval_authority='sponsor',
--     insert one from a deterministic pick of the tenant's senior
--     persons (role matches *Sponsor | Chief | SVP | Director* etc.).
--   - For each move, if no participant has approval_authority='approver'
--     (what the reader code treats as the Program Lead), insert one
--     from a deterministic pick of the tenant's lead-role persons.
--   - Deterministic via row_number() over hashed person.id; two moves
--     rarely collapse onto the same person because hash distribution
--     spreads evenly.
--
-- Hard rules:
--   1. Non-destructive — INSERT only; never touches existing rows.
--   2. Scoped — 5 demo clients.
--   3. Idempotent — re-run is no-op (WHERE NOT EXISTS on each insert).
--   4. Deterministic — same input data, same assignments.
--   5. Traceable — inserted rows stamped with
--      notification_preferences->>'source' = 'participants_topup_2026_05_04'.
--
-- Reversal:
--   DELETE FROM engagement_participants
--   WHERE notification_preferences->>'source' = 'participants_topup_2026_05_04';

BEGIN;

-- ── Stage the demo tenant / persons / moves data into temp tables so
-- both INSERT statements can share the same derived data.
CREATE TEMP TABLE _wave2_demo_clients ON COMMIT DROP AS
SELECT id, name FROM clients WHERE name IN (
  'Apex Retail','First Capital','Helix Therapeutics',
  'Keystone Energy Holdings','Meridian Health'
);

CREATE TEMP TABLE _wave2_tenant_persons ON COMMIT DROP AS
SELECT
  dc.id AS client_id,
  dc.name AS client_name,
  p.id AS person_id,
  p.name AS person_name,
  p.role AS person_role,
  p.email AS person_email,
  (p.role ~* '(chief|\ycxo\y|\ycio\y|\ycto\y|\ycdo\y|\ycfo\y|\yceo\y|\ycoo\y|\ycmo\y|\ychro\y|\ygc\y|sponsor|\ysvp\y|\yevp\y)')
    AS is_sponsor_eligible,
  (p.role ~* '(director|program lead|program owner|\yvp\y|head of|principal|partner)')
    AS is_lead_eligible
FROM _wave2_demo_clients dc
JOIN persons p ON (
  (dc.name = 'Apex Retail' AND p.organization ILIKE 'apex%') OR
  (dc.name = 'First Capital' AND (p.organization ILIKE '%first capital%' OR p.organization ILIKE '%arcturus%')) OR
  (dc.name = 'Meridian Health' AND p.organization ILIKE '%meridian%') OR
  (dc.name = 'Keystone Energy Holdings' AND p.organization ILIKE '%keystone%') OR
  (dc.name = 'Helix Therapeutics' AND p.organization ILIKE '%helix%')
);

CREATE TEMP TABLE _wave2_sponsor_pool ON COMMIT DROP AS
SELECT client_id, person_id, person_name, person_role, person_email,
  ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY abs(hashtext(person_id::text))) AS pick_order
FROM _wave2_tenant_persons
WHERE is_sponsor_eligible;

CREATE TEMP TABLE _wave2_lead_pool ON COMMIT DROP AS
SELECT client_id, person_id, person_name, person_role, person_email,
  ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY abs(hashtext(person_id::text))) AS pick_order
FROM _wave2_tenant_persons
WHERE is_lead_eligible;

CREATE TEMP TABLE _wave2_demo_moves ON COMMIT DROP AS
SELECT
  e.id AS engagement_id,
  e.client_id,
  e.name,
  (abs(hashtext(e.id::text)) % GREATEST(1, (SELECT COUNT(*) FROM _wave2_sponsor_pool sp WHERE sp.client_id = e.client_id))) + 1
    AS sponsor_slot,
  (abs(hashtext(e.id::text || 'LEAD')) % GREATEST(1, (SELECT COUNT(*) FROM _wave2_lead_pool lp WHERE lp.client_id = e.client_id))) + 1
    AS lead_slot
FROM engagements e
WHERE e.client_id IN (SELECT id FROM _wave2_demo_clients)
  AND e.archived_at IS NULL
  AND e.deleted_at IS NULL;

-- ── Insert sponsors where missing.
INSERT INTO engagement_participants (
  engagement_id, user_id, user_name, role,
  approval_authority, person_id,
  notification_preferences,
  view_state,
  can_view_financial, can_upload, can_generate_deliverables,
  can_publish_deliverables, can_approve_phase_gates,
  program_access_level,
  added_at, last_touchpoint_at
)
SELECT
  dm.engagement_id,
  sp.person_id::text,
  sp.person_name,
  'Sponsor',
  'sponsor',
  sp.person_id,
  jsonb_build_object(
    'source', 'participants_topup_2026_05_04',
    'email_digest', 'weekly',
    'phase_gate', true,
    'approval', true
  ),
  '{}'::jsonb,
  true, false, false, false, true,
  'program_member',
  NOW(), NOW()
FROM _wave2_demo_moves dm
JOIN _wave2_sponsor_pool sp
  ON sp.client_id = dm.client_id
 AND sp.pick_order = dm.sponsor_slot
WHERE NOT EXISTS (
  SELECT 1 FROM engagement_participants ep
  WHERE ep.engagement_id = dm.engagement_id
    AND ep.approval_authority = 'sponsor'
);

-- ── Insert leads where missing.
INSERT INTO engagement_participants (
  engagement_id, user_id, user_name, role,
  approval_authority, person_id,
  notification_preferences,
  view_state,
  can_view_financial, can_upload, can_generate_deliverables,
  can_publish_deliverables, can_approve_phase_gates,
  program_access_level,
  added_at, last_touchpoint_at
)
SELECT
  dm.engagement_id,
  lp.person_id::text,
  lp.person_name,
  'Program Lead',
  'approver',
  lp.person_id,
  jsonb_build_object(
    'source', 'participants_topup_2026_05_04',
    'email_digest', 'daily',
    'phase_gate', true,
    'approval', true
  ),
  '{}'::jsonb,
  true, true, true, true, true,
  'program_member',
  NOW(), NOW()
FROM _wave2_demo_moves dm
JOIN _wave2_lead_pool lp
  ON lp.client_id = dm.client_id
 AND lp.pick_order = dm.lead_slot
WHERE NOT EXISTS (
  SELECT 1 FROM engagement_participants ep
  WHERE ep.engagement_id = dm.engagement_id
    AND ep.approval_authority = 'approver'
);

COMMIT;
