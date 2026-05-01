-- Migration 054 · Program demo users and program ownership mappings
--
-- Seeds one program-scoped user per demo client. These users are not admins:
-- they can create new programs for their active client, but they can only see
-- existing programs where an engagement_participants ownership row exists.

BEGIN;

INSERT INTO persons (graph_node_id, name, email, role, organization, familiarity, communication_style, primary_role)
VALUES
  (
    'person_demo_apexretail_programs',
    'Apex Programs Operator',
    'demo-apexretail-programs+clerk_test@abarva.com',
    'program_owner',
    'Apex Retail Group',
    'returning_recent',
    '{"title":"Programs Operator","module_access":["programs"],"demo_persona":"program_scoped_user"}'::jsonb,
    'client_viewer'::user_role_type
  ),
  (
    'person_demo_meridian_programs',
    'Meridian Programs Operator',
    'demo-meridian-programs+clerk_test@abarva.com',
    'program_owner',
    'Meridian Health System',
    'returning_recent',
    '{"title":"Programs Operator","module_access":["programs"],"demo_persona":"program_scoped_user"}'::jsonb,
    'client_viewer'::user_role_type
  ),
  (
    'person_demo_firstcapital_programs',
    'First Capital Programs Operator',
    'demo-firstcapital-programs+clerk_test@abarva.com',
    'program_owner',
    'First Capital',
    'returning_recent',
    '{"title":"Programs Operator","module_access":["programs"],"demo_persona":"program_scoped_user"}'::jsonb,
    'client_viewer'::user_role_type
  )
ON CONFLICT (graph_node_id) DO UPDATE
SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  organization = EXCLUDED.organization,
  communication_style = persons.communication_style || EXCLUDED.communication_style,
  primary_role = 'client_viewer'::user_role_type,
  updated_at = now();

WITH program_users AS (
  SELECT
    p.id AS person_id,
    CASE
      WHEN p.graph_node_id = 'person_demo_apexretail_programs' THEN 'Apex Retail'
      WHEN p.graph_node_id = 'person_demo_meridian_programs' THEN 'Meridian Health'
      WHEN p.graph_node_id = 'person_demo_firstcapital_programs' THEN 'First Capital'
    END AS client_name
  FROM persons p
  WHERE p.graph_node_id IN (
    'person_demo_apexretail_programs',
    'person_demo_meridian_programs',
    'person_demo_firstcapital_programs'
  )
)
INSERT INTO person_client_memberships (
  person_id,
  client_id,
  role,
  access_level,
  financial_visibility,
  can_admin_users,
  can_create_programs,
  can_approve_gates
)
SELECT
  pu.person_id,
  c.id,
  'client_viewer'::user_role_type,
  'program_member',
  false,
  false,
  true,
  false
FROM program_users pu
JOIN clients c ON c.name = pu.client_name OR c.legal_name ILIKE pu.client_name || '%'
ON CONFLICT (person_id, client_id) DO UPDATE
SET
  role = 'client_viewer'::user_role_type,
  access_level = 'program_member',
  financial_visibility = false,
  can_admin_users = false,
  can_create_programs = true,
  can_approve_gates = false;

WITH program_users AS (
  SELECT
    p.id AS person_id,
    p.name AS person_name,
    CASE
      WHEN p.graph_node_id = 'person_demo_apexretail_programs' THEN 'Apex Retail'
      WHEN p.graph_node_id = 'person_demo_meridian_programs' THEN 'Meridian Health'
      WHEN p.graph_node_id = 'person_demo_firstcapital_programs' THEN 'First Capital'
    END AS client_name
  FROM persons p
  WHERE p.graph_node_id IN (
    'person_demo_apexretail_programs',
    'person_demo_meridian_programs',
    'person_demo_firstcapital_programs'
  )
),
client_programs AS (
  SELECT
    e.id AS engagement_id,
    pu.person_id,
    pu.person_name
  FROM program_users pu
  JOIN clients c ON c.name = pu.client_name OR c.legal_name ILIKE pu.client_name || '%'
  JOIN engagements e ON e.client_id::text = c.id::text
  WHERE e.archived_at IS NULL
    AND e.deleted_at IS NULL
)
INSERT INTO engagement_participants (
  engagement_id,
  user_id,
  user_name,
  role,
  notify_on,
  approval_authority,
  program_access_level,
  can_view_financial,
  can_upload,
  can_generate_deliverables,
  can_publish_deliverables,
  can_approve_phase_gates
)
SELECT
  cp.engagement_id,
  cp.person_id::text,
  cp.person_name,
  'program_owner',
  ARRAY['phase_gate', 'deliverable', 'risk'],
  'contributor',
  'program_member',
  false,
  true,
  true,
  false,
  false
FROM client_programs cp
WHERE NOT EXISTS (
  SELECT 1
  FROM engagement_participants ep
  WHERE ep.engagement_id = cp.engagement_id
    AND ep.user_id = cp.person_id::text
);

NOTIFY pgrst, 'reload schema';

COMMIT;
