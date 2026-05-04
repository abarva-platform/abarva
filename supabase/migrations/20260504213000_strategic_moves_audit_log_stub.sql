-- Strategic Moves · program_audit_log activity stream stub (Wave 2 · D of E)
--
-- Seeds 3–6 audit log entries per demo-tenant engagement that has
-- no existing audit rows. Entries are derived from the move's
-- current_phase so the timeline reads as: move created → P0
-- completed → P1 charter approved → … up to the current phase. This
-- unblocks the Recent Activity timeline on the Strategic Moves
-- detail view, which was empty for 42 of 50 demo moves.
--
-- Hard rules:
--   1. Non-destructive — INSERT only, only for moves with 0 existing
--      audit rows.
--   2. Scoped — 5 demo clients.
--   3. Idempotent — re-run is no-op (outer WHERE NOT EXISTS).
--   4. Deterministic — created_at anchored to engagement.created_at
--      + fixed offsets per phase.
--   5. Traceable — every inserted row carries
--      rationale starting with '[demo_audit_stub_2026_05_04]'.
--
-- Reversal:
--   DELETE FROM program_audit_log
--   WHERE rationale LIKE '[demo_audit_stub_2026_05_04]%';

BEGIN;

WITH demo_clients AS (
  SELECT id FROM clients WHERE name IN (
    'Apex Retail','First Capital','Helix Therapeutics',
    'Keystone Energy Holdings','Meridian Health'
  )
),
moves_without_audit AS (
  SELECT
    e.id AS engagement_id,
    c.slug AS tenant_key,
    e.name,
    COALESCE(e.current_phase, 0) AS current_phase,
    COALESCE(e.created_at, NOW()) AS anchor_date,
    -- Sponsor person id, if we can resolve one (used as actor_id).
    (SELECT ep.person_id
       FROM engagement_participants ep
       WHERE ep.engagement_id = e.id
         AND ep.approval_authority = 'sponsor'
       LIMIT 1) AS sponsor_person_id,
    (SELECT ep.person_id
       FROM engagement_participants ep
       WHERE ep.engagement_id = e.id
         AND ep.approval_authority = 'approver'
       LIMIT 1) AS lead_person_id
  FROM engagements e
  JOIN clients c ON c.id = e.client_id
  WHERE e.client_id IN (SELECT id FROM demo_clients)
    AND e.archived_at IS NULL
    AND e.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM program_audit_log pal WHERE pal.engagement_id = e.id
    )
),
-- Template of audit-log events per phase. phase 0 is the move
-- creation itself; phases 1..7 are the lifecycle transitions.
audit_templates AS (
  SELECT phase_number, action, from_state, to_state, offset_days, rationale_suffix, actor_kind FROM (VALUES
    (0, 'move_created',                NULL,       'originate', 0,   'Move created; P0 originate started.',                       'lead'),
    (1, 'program_phase_advanced',      'originate','charter',   12,  'P0 → P1; hypothesis ratified, charter drafting started.',   'lead'),
    (1, 'program_approval_submitted',  NULL,       NULL,        18,  'Charter submitted for sponsor approval.',                   'lead'),
    (1, 'program_approval_approved',   NULL,       NULL,        22,  'Charter approved by sponsor.',                              'sponsor'),
    (2, 'program_phase_advanced',      'charter',  'diagnose',  28,  'P1 → P2; diagnose workstream kicked off.',                  'lead'),
    (2, 'program_evidence_captured',   NULL,       NULL,        45,  'Baseline evidence captured from Intelligence + datasets.', 'lead'),
    (3, 'program_phase_advanced',      'diagnose', 'design',    70,  'P2 → P3; solution design workstream started.',              'lead'),
    (3, 'deliverable_drafted',         NULL,       NULL,        85,  'Solution blueprint draft ready for review.',                'lead'),
    (3, 'deliverable_signed_off',      NULL,       NULL,        95,  'Solution blueprint signed off.',                            'sponsor'),
    (4, 'program_phase_advanced',      'design',   'build',     110, 'P3 → P4; build workstream started.',                        'lead'),
    (4, 'deliverable_signed_off',      NULL,       NULL,        150, 'First build milestone deliverable signed off.',             'sponsor'),
    (5, 'program_phase_advanced',      'build',    'execute',   210, 'P4 → P5; execute / rollout started.',                       'lead'),
    (5, 'deliverable_signed_off',      NULL,       NULL,        240, 'Execute milestone deliverable signed off.',                 'sponsor'),
    (6, 'program_phase_advanced',      'execute',  'verify',    290, 'P5 → P6; verification started.',                            'lead'),
    (6, 'program_evidence_captured',   NULL,       NULL,        310, 'Verification evidence captured; KPIs tracked.',            'lead'),
    (7, 'program_phase_advanced',      'verify',   'handoff',   340, 'P6 → P7; handoff to BAU operations.',                       'lead'),
    (7, 'program_completed',           NULL,       'completed', 360, 'Program completed and handed off to BAU.',                  'sponsor')
  ) AS t(phase_number, action, from_state, to_state, offset_days, rationale_suffix, actor_kind)
)

INSERT INTO program_audit_log (
  tenant_key, program_id, engagement_id, actor_id, actor_role,
  action, from_state, to_state, rationale, evidence_refs, created_at
)
SELECT
  COALESCE(m.tenant_key, 'demo'),
  m.engagement_id::text,  -- program_id is TEXT display id; we use engagement uuid text
  m.engagement_id,
  CASE a.actor_kind
    WHEN 'sponsor' THEN m.sponsor_person_id
    WHEN 'lead'    THEN m.lead_person_id
    ELSE NULL
  END,
  CASE a.actor_kind
    WHEN 'sponsor' THEN 'Sponsor'
    WHEN 'lead'    THEN 'Program Lead'
    ELSE NULL
  END,
  a.action,
  a.from_state,
  a.to_state,
  '[demo_audit_stub_2026_05_04] ' || a.rationale_suffix,
  '{}',
  m.anchor_date + (a.offset_days || ' days')::interval
FROM moves_without_audit m
JOIN audit_templates a
  ON a.phase_number <= m.current_phase  -- only include events up to where the move actually is
ORDER BY m.engagement_id, a.offset_days;

COMMIT;
