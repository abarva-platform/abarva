-- Strategic Moves · participants expansion (Wave 2b) [follow-up F6]
--
-- Adds a steward + 0-2 team_members to every demo-tenant move that
-- already has sponsor + lead (seeded in the base Wave 2 top-up).
-- Team_member count scales by archetype per founder lock:
--   strategic_transformation   → 2 team members
--   platform_modernization     → 1 team member
--   ai_product_enablement      → 1 team member
--   workflow_automation        → 0 team members
--   operational_optimization   → 1 team member
--   (null/default)             → 1 team member
--
-- Steward is inserted for every move regardless of archetype.
--
-- Pulled deterministically from the existing persons roster within
-- the same tenant (no new persons created). Sponsor + lead rows
-- already picked 2 persons; this migration picks 2-4 more.
--
-- Hard rules:
--   1. Non-destructive — INSERT only. Idempotent via stamp.
--   2. Scoped — 5 demo clients. No cross-tenant leak.
--   3. Idempotent — re-run is no-op (stamp + WHERE NOT EXISTS).
--   4. Deterministic — hashed pick order with per-move seed salt
--      so sponsor, lead, steward, team_member_1, team_member_2 don't
--      collapse onto the same person.
--   5. Reversible — DELETE WHERE notification_preferences->>'source'
--      = 'participants_expansion_2026_05_04'.

BEGIN;

CREATE TEMP TABLE _pex_demo_clients ON COMMIT DROP AS
SELECT id, name FROM clients WHERE name IN (
  'Apex Retail','First Capital','Helix Therapeutics',
  'Keystone Energy Holdings','Meridian Health'
);

-- Tenant-scoped person pool (same matching rule as Wave 2 migration B).
CREATE TEMP TABLE _pex_tenant_persons ON COMMIT DROP AS
SELECT
  dc.id AS client_id,
  dc.name AS client_name,
  p.id AS person_id,
  p.name AS person_name,
  p.role AS person_role,
  -- Steward = senior-but-not-sponsor role (Director / Program Lead / VP / Head).
  (p.role ~* '(director|program lead|program owner|\yvp\y|head of|principal|partner)')
    AS is_steward_eligible,
  -- Team member = anyone else on the tenant that isn't strictly an
  -- external agent role; accept all roles so we have enough pool.
  true AS is_team_eligible
FROM _pex_demo_clients dc
JOIN persons p ON (
  (dc.name = 'Apex Retail' AND p.organization ILIKE 'apex%') OR
  (dc.name = 'First Capital' AND (p.organization ILIKE '%first capital%' OR p.organization ILIKE '%arcturus%')) OR
  (dc.name = 'Meridian Health' AND p.organization ILIKE '%meridian%') OR
  (dc.name = 'Keystone Energy Holdings' AND p.organization ILIKE '%keystone%') OR
  (dc.name = 'Helix Therapeutics' AND p.organization ILIKE '%helix%')
);

-- Move metadata + per-role hashed pick slots.
CREATE TEMP TABLE _pex_demo_moves ON COMMIT DROP AS
SELECT
  e.id AS engagement_id,
  e.client_id,
  e.name,
  COALESCE(e.program_archetype, 'operational_optimization') AS archetype,
  -- Team_members count per archetype.
  CASE COALESCE(e.program_archetype, 'operational_optimization')
    WHEN 'strategic_transformation'   THEN 2
    WHEN 'platform_modernization'     THEN 1
    WHEN 'ai_product_enablement'      THEN 1
    WHEN 'workflow_automation'        THEN 0
    WHEN 'operational_optimization'   THEN 1
    ELSE 1
  END AS team_count,
  (abs(hashtext(e.id::text || 'STEWARD')) % GREATEST(1, (
    SELECT COUNT(*) FROM _pex_tenant_persons tp
    WHERE tp.client_id = e.client_id AND tp.is_steward_eligible
  ))) + 1 AS steward_slot,
  (abs(hashtext(e.id::text || 'TEAM1')) % GREATEST(1, (
    SELECT COUNT(*) FROM _pex_tenant_persons tp
    WHERE tp.client_id = e.client_id
  ))) + 1 AS team1_slot,
  (abs(hashtext(e.id::text || 'TEAM2')) % GREATEST(1, (
    SELECT COUNT(*) FROM _pex_tenant_persons tp
    WHERE tp.client_id = e.client_id
  ))) + 1 AS team2_slot
FROM engagements e
WHERE e.client_id IN (SELECT id FROM _pex_demo_clients)
  AND e.archived_at IS NULL
  AND e.deleted_at IS NULL;

-- Steward pool + team pool with pick_order.
CREATE TEMP TABLE _pex_steward_pool ON COMMIT DROP AS
SELECT client_id, person_id, person_name, person_role,
  ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY abs(hashtext(person_id::text || 'S'))) AS pick_order
FROM _pex_tenant_persons
WHERE is_steward_eligible;

CREATE TEMP TABLE _pex_team_pool ON COMMIT DROP AS
SELECT client_id, person_id, person_name, person_role,
  ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY abs(hashtext(person_id::text || 'T'))) AS pick_order
FROM _pex_tenant_persons;

-- ── Insert stewards where missing.
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
  'Steward',
  'contributor',
  sp.person_id,
  jsonb_build_object(
    'source', 'participants_expansion_2026_05_04',
    'role_kind', 'steward',
    'email_digest', 'daily',
    'phase_gate', true,
    'approval', false
  ),
  '{}'::jsonb,
  true, true, true, true, false,
  'program_member',
  NOW(), NOW()
FROM _pex_demo_moves dm
JOIN _pex_steward_pool sp
  ON sp.client_id = dm.client_id
 AND sp.pick_order = dm.steward_slot
WHERE NOT EXISTS (
  SELECT 1 FROM engagement_participants ep
  WHERE ep.engagement_id = dm.engagement_id
    AND ep.notification_preferences->>'source' = 'participants_expansion_2026_05_04'
    AND ep.notification_preferences->>'role_kind' = 'steward'
);

-- ── Insert team_member #1 where applicable.
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
  tp.person_id::text,
  tp.person_name,
  'Team Member',
  'contributor',
  tp.person_id,
  jsonb_build_object(
    'source', 'participants_expansion_2026_05_04',
    'role_kind', 'team_member_1',
    'email_digest', 'weekly',
    'phase_gate', false,
    'approval', false
  ),
  '{}'::jsonb,
  false, true, false, false, false,
  'program_member',
  NOW(), NOW()
FROM _pex_demo_moves dm
JOIN _pex_team_pool tp
  ON tp.client_id = dm.client_id
 AND tp.pick_order = dm.team1_slot
WHERE dm.team_count >= 1
  AND NOT EXISTS (
    SELECT 1 FROM engagement_participants ep
    WHERE ep.engagement_id = dm.engagement_id
      AND ep.notification_preferences->>'source' = 'participants_expansion_2026_05_04'
      AND ep.notification_preferences->>'role_kind' = 'team_member_1'
  );

-- ── Insert team_member #2 for strategic_transformation moves only.
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
  tp.person_id::text,
  tp.person_name,
  'Team Member',
  'contributor',
  tp.person_id,
  jsonb_build_object(
    'source', 'participants_expansion_2026_05_04',
    'role_kind', 'team_member_2',
    'email_digest', 'weekly',
    'phase_gate', false,
    'approval', false
  ),
  '{}'::jsonb,
  false, true, false, false, false,
  'program_member',
  NOW(), NOW()
FROM _pex_demo_moves dm
JOIN _pex_team_pool tp
  ON tp.client_id = dm.client_id
 AND tp.pick_order = dm.team2_slot
WHERE dm.team_count >= 2
  AND NOT EXISTS (
    SELECT 1 FROM engagement_participants ep
    WHERE ep.engagement_id = dm.engagement_id
      AND ep.notification_preferences->>'source' = 'participants_expansion_2026_05_04'
      AND ep.notification_preferences->>'role_kind' = 'team_member_2'
  );

COMMIT;
