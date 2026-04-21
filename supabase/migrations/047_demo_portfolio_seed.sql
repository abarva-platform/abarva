-- Migration 047 · Demo portfolio seed data
-- Extracted from 013/014 so schema DDL and demo DML run independently.

BEGIN;

INSERT INTO persons (graph_node_id, name, email, role, organization, familiarity, communication_style)
VALUES
  ('person_sarah_chen', 'Sarah Chen', 'sarah.chen@meridian-health.com', 'CIO', 'Meridian Health', 'first_meeting', '{}'::jsonb),
  ('person_anand_sundaram', 'Anand Sundaram', 'anand+clerk_test@abarva.com', 'maestro', 'AbarVa', 'frequent_collaborator', '{"title": "Founder", "cxo_function": "Strategy", "primary_focus": "Building AbarVa. Running all client engagements. Product + sales + delivery."}'::jsonb),
  ('person_james_park', 'James Park', 'james.park@firstcapital.example', 'sponsor_cxo', 'First Capital Financial', 'returning_recent', '{"title": "CTO", "cxo_function": "IT", "primary_focus": "Wealth platform modernization across the CIO organization."}'::jsonb),
  ('person_maria_delgado', 'Maria Delgado', 'maria.delgado@apexretail.example', 'sponsor_cxo', 'Apex Retail Group', 'first_meeting', '{"title": "CHRO", "cxo_function": "HR", "primary_focus": "HR ERP replacement and back-office rationalization."}'::jsonb)
ON CONFLICT (graph_node_id) DO NOTHING;

INSERT INTO engagements (
  graph_node_id, name, industry_code, function_code, objective_code, topic_code,
  sponsor_person_id, current_phase, status, phase_0_started_at
)
SELECT
  'eng_meridian_analytics_mod',
  'Meridian Analytics Modernization',
  'HEALTHCARE_IDN',
  'MIDDLE_OFFICE',
  'OPTIMISE',
  'analytics_modernization',
  p.id,
  0,
  'active',
  NOW()
FROM persons p
WHERE p.graph_node_id = 'person_sarah_chen'
ON CONFLICT (graph_node_id) DO NOTHING;

INSERT INTO engagements (
  graph_node_id, name, industry_code, function_code, objective_code, topic_code,
  sponsor_person_id, maestro_person_id, current_phase, status,
  charter, gates_passed, decisions, deliverables, sponsor_approvals,
  baseline_metrics, actual_metrics, phase_0_started_at
)
SELECT
  'eng_arcturus_wealth_platform',
  'Arcturus Wealth Platform Modernization',
  'FINSERV',
  'MIDDLE_OFFICE',
  'OPTIMISE',
  'wealth_platform_modernization',
  s.id,
  m.id,
  3,
  'active',
  '{"problem": "Legacy wealth platform cannot handle alt-asset reporting at scale. Advisors building shadow Excel workbooks.", "scope": "Rebuild on modern data stack. Preserve regulatory reporting continuity."}'::jsonb,
  '[
    {"phase": 0, "status": "approved", "signed_at": "2026-02-14T10:00:00Z"},
    {"phase": 1, "status": "approved", "signed_at": "2026-02-28T10:00:00Z"},
    {"phase": 2, "status": "approved", "signed_at": "2026-03-20T10:00:00Z"},
    {"phase": 3, "status": "awaiting_review", "submitted_at": "2026-04-17T10:00:00Z"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{"annual_platform_cost_usd": 14200000, "advisor_shadow_hours_weekly": 340}'::jsonb,
  '{}'::jsonb,
  '2026-02-01T00:00:00Z'
FROM persons s
CROSS JOIN persons m
WHERE s.graph_node_id = 'person_james_park'
  AND m.graph_node_id = 'person_anand_sundaram'
ON CONFLICT (graph_node_id) DO NOTHING;

INSERT INTO engagements (
  graph_node_id, name, industry_code, function_code, objective_code, topic_code,
  sponsor_person_id, maestro_person_id, current_phase, status,
  charter, gates_passed, decisions, deliverables, sponsor_approvals,
  baseline_metrics, actual_metrics, phase_0_started_at
)
SELECT
  'eng_apex_retail_hr_erp',
  'Apex Retail HR ERP Replacement',
  'RETAIL',
  'BACK_OFFICE',
  'OPTIMISE',
  'hr_erp_replacement',
  s.id,
  m.id,
  2,
  'active',
  '{"problem": "14-year-old HR ERP reaching end of vendor support. 2,400 store managers manually reconciling.", "scope": "Replace core HR ERP with modern platform. Eliminate manual reconciliation."}'::jsonb,
  '[
    {"phase": 0, "status": "approved", "signed_at": "2026-03-05T10:00:00Z"},
    {"phase": 1, "status": "approved", "signed_at": "2026-03-22T10:00:00Z"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{"manual_reconciliation_hours_weekly": 8400, "vendor_support_eol_month": "2027-03"}'::jsonb,
  '{}'::jsonb,
  '2026-02-25T00:00:00Z'
FROM persons s
CROSS JOIN persons m
WHERE s.graph_node_id = 'person_maria_delgado'
  AND m.graph_node_id = 'person_anand_sundaram'
ON CONFLICT (graph_node_id) DO NOTHING;

UPDATE engagements
SET maestro_person_id = (SELECT id FROM persons WHERE graph_node_id = 'person_anand_sundaram')
WHERE graph_node_id = 'eng_meridian_analytics_mod'
  AND maestro_person_id IS NULL;

COMMIT;
