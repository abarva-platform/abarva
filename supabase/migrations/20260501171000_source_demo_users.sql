-- Migration 056 · Source demo operator users
--
-- Creates Source-only operator identities for the demo clients. These users
-- are not client admins: they can create Source events and work assigned
-- Source records inside their one client, but cannot approve stages, approve
-- awards, administer users, publish artifacts, or view exact financial values.

BEGIN;

WITH source_people AS (
  SELECT *
  FROM (VALUES
    (
      'source_operator_apex_retail',
      'demo-apexretail-source+clerk_test@abarva.com',
      'Sara Patel',
      'Sourcing Operator',
      'Apex Retail Group',
      'Apex Retail',
      'apexretail',
      'apex-retail-ams-outsourcing-2026'
    ),
    (
      'source_operator_meridian_health',
      'demo-meridian-source+clerk_test@abarva.com',
      'Noah Reed',
      'Sourcing Operator',
      'Meridian Health System',
      'Meridian Health',
      'meridian',
      NULL
    ),
    (
      'source_operator_first_capital',
      'demo-firstcapital-source+clerk_test@abarva.com',
      'Rowan Shah',
      'Sourcing Operator',
      'First Capital',
      'First Capital',
      'arcturus',
      NULL
    )
  ) AS t(graph_node_id, email, name, role, organization, client_name, client_key, seed_source_event_id)
),
upsert_people AS (
  INSERT INTO persons (
    graph_node_id,
    email,
    name,
    role,
    organization,
    primary_role,
    familiarity,
    communication_style,
    working_rhythm,
    personal_threads
  )
  SELECT
    graph_node_id,
    email,
    name,
    role,
    organization,
    'client_viewer'::user_role_type,
    'first_meeting',
    '{}'::jsonb,
    '{}'::jsonb,
    ARRAY[]::text[]
  FROM source_people
  ON CONFLICT (email) DO UPDATE
  SET
    graph_node_id = EXCLUDED.graph_node_id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    organization = EXCLUDED.organization,
    primary_role = 'client_viewer'::user_role_type
  RETURNING id, graph_node_id, email
),
resolved_people AS (
  SELECT
    up.id,
    sp.email,
    sp.name,
    sp.client_key,
    sp.client_name,
    sp.seed_source_event_id
  FROM source_people sp
  JOIN upsert_people up ON up.email = sp.email
),
resolved_clients AS (
  SELECT rp.*, c.id AS client_id
  FROM resolved_people rp
  JOIN clients c ON c.name = rp.client_name
),
membership_upsert AS (
  INSERT INTO person_client_memberships (
    person_id,
    client_id,
    role,
    access_level,
    financial_visibility,
    can_admin_users,
    can_create_programs,
    can_approve_gates,
    can_create_source_events,
    can_approve_source_stages,
    can_approve_award,
    can_upload_source_artifacts,
    can_generate_sourcing_artifacts,
    can_publish_sourcing_artifacts
  )
  SELECT
    id,
    client_id,
    'client_viewer'::user_role_type,
    'source_member',
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    true,
    true,
    false
  FROM resolved_clients
  ON CONFLICT (person_id, client_id) DO UPDATE
  SET
    role = EXCLUDED.role,
    access_level = EXCLUDED.access_level,
    financial_visibility = false,
    can_admin_users = false,
    can_create_programs = false,
    can_approve_gates = false,
    can_create_source_events = true,
    can_approve_source_stages = false,
    can_approve_award = false,
    can_upload_source_artifacts = true,
    can_generate_sourcing_artifacts = true,
    can_publish_sourcing_artifacts = false
  RETURNING person_id
)
INSERT INTO source_event_participants (
  client_key,
  source_event_id,
  source_event_row_id,
  user_id,
  user_name,
  role,
  approval_authority,
  source_access_level,
  can_view_financial,
  can_upload_source_artifacts,
  can_generate_sourcing_artifacts,
  can_publish_sourcing_artifacts,
  can_approve_source_stages,
  can_approve_award,
  notify_on
)
SELECT
  rc.client_key,
  COALESCE(se.id::text, rc.seed_source_event_id),
  se.id,
  rc.id::text,
  rc.name,
  'source contributor',
  'contributor',
  'source_member',
  false,
  true,
  true,
  false,
  false,
  false,
  ARRAY['source_event_update', 'approval_needed']::text[]
FROM resolved_clients rc
LEFT JOIN source_events se ON se.client_key = rc.client_key AND se.lifecycle_state <> 'archived'
WHERE se.id IS NOT NULL OR rc.seed_source_event_id IS NOT NULL
ON CONFLICT (client_key, source_event_id, user_id) DO UPDATE
SET
  user_name = EXCLUDED.user_name,
  role = EXCLUDED.role,
  approval_authority = EXCLUDED.approval_authority,
  source_access_level = EXCLUDED.source_access_level,
  can_view_financial = false,
  can_upload_source_artifacts = true,
  can_generate_sourcing_artifacts = true,
  can_publish_sourcing_artifacts = false,
  can_approve_source_stages = false,
  can_approve_award = false,
  notify_on = EXCLUDED.notify_on;

NOTIFY pgrst, 'reload schema';

COMMIT;
