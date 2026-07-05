-- ============================================================
-- Lakeshore Holdings IT budget seed — cio_tower schema
-- Source: F12_it-budget-financials.csv (v4, corrected 2026-07-05)
-- Tenant: lakeshore-industries
-- Total: $190.6M = $154.1M OpCo IT + $36.5M corporate (incl. $11.8M AI)
-- ============================================================

-- ── 1. Measures (global — no tenant_key) ─────────────────────────────────────

INSERT INTO cio_tower.measures (
  measure_key, label, description, default_scope,
  grain_filter, aggregation, artifact_default, formula_version
) VALUES
  (
    'run_budget_fy26',
    'Run Budget FY26',
    'Total run (keep-the-lights-on) IT budget for FY2026, committed.',
    'enterprise_envelope',
    '{"view":"it_budget","amount_type":"run","basis":"committed","period":"fy26"}'::jsonb,
    'sum', 'metric_card', 'cio_tower_v1'
  ),
  (
    'change_budget_fy26',
    'Change Budget FY26',
    'Total change (transformation and new capability) IT budget for FY2026, committed.',
    'enterprise_envelope',
    '{"view":"it_budget","amount_type":"change","basis":"committed","period":"fy26"}'::jsonb,
    'sum', 'metric_card', 'cio_tower_v1'
  ),
  (
    'total_it_budget_fy26',
    'Total IT Budget FY26',
    'Total IT budget (run + change) for FY2026, committed.',
    'enterprise_envelope',
    '{"view":"it_budget","amount_type":"none","basis":"committed","period":"fy26"}'::jsonb,
    'sum', 'metric_card', 'cio_tower_v1'
  ),
  (
    'ai_innovation_budget_fy26',
    'AI & Innovation Budget FY26',
    'Dedicated AI and innovation office budget for FY2026, committed.',
    'enterprise_envelope',
    '{"view":"it_budget","amount_type":"none","basis":"committed","period":"fy26","entity_key":"lakeshore-industries:lak-cs-008"}'::jsonb,
    'sum', 'metric_card', 'cio_tower_v1'
  )
ON CONFLICT (measure_key) DO UPDATE
  SET label       = EXCLUDED.label,
      description = EXCLUDED.description,
      updated_at  = now();

-- ── 2. Question contracts (global — no tenant_key) ───────────────────────────

INSERT INTO cio_tower.question_contracts (
  contract_key, surface, intent, question_family, measure_key, artifact_type, examples
) VALUES
  (
    'tower_total_it_spend',
    'tower', 'lookup',
    'What is our total IT spend / budget for the year?',
    'total_it_budget_fy26', 'metric_card',
    '["What is our total IT spend?","What is the FY26 IT budget?","How much are we spending on IT?"]'::jsonb
  ),
  (
    'tower_run_change_split',
    'tower', 'table',
    'How is IT budget split between run and change, by portfolio company?',
    'run_budget_fy26', 'table',
    '["What is our run vs change split?","How much is run vs transformation?","Run change breakdown"]'::jsonb
  ),
  (
    'tower_top_it_programs_by_budget',
    'tower', 'table',
    'Which IT programs or initiatives have the largest budgets?',
    NULL, 'table',
    '["Top 5 IT programs by budget","Largest IT initiatives","Which programs get the most funding?"]'::jsonb
  ),
  (
    'tower_value_realization',
    'tower', 'table',
    'Where is measured value showing up vs what was promised?',
    NULL, 'table',
    '["Where is value being measured?","Which initiatives show realized value?","Value realization report"]'::jsonb
  ),
  (
    'tower_trend_it_budget',
    'tower', 'chart',
    'How has IT budget trended from FY25 to FY26?',
    'total_it_budget_fy26', 'table',
    '["Budget trend year over year","FY25 vs FY26 IT spend","How did IT spend change?"]'::jsonb
  ),
  (
    'tower_outside_scope',
    'tower', 'decision_handoff',
    'Question is outside the scope of the AI Control Tower.',
    NULL, 'handoff',
    '[]'::jsonb
  )
ON CONFLICT (contract_key) DO UPDATE
  SET intent          = EXCLUDED.intent,
      question_family = EXCLUDED.question_family,
      artifact_type   = EXCLUDED.artifact_type;

-- ── 3. Source registry ───────────────────────────────────────────────────────

INSERT INTO cio_tower.source_registry (
  source_key, tenant_key, source_system, source_file, source_kind,
  source_version, trust_tier, row_count, freshness_date,
  metadata
) VALUES (
  'lakeshore_industries_f12_fy26_v4',
  'lakeshore-industries',
  'synthetic_dataset',
  'datasets/lakeshore-industries-synthetic-v4/family-4-financial-commercial/F12_it-budget-financials.csv',
  'file',
  'v4',
  'synthetic_demo',
  13,
  '2026-07-05',
  '{"correction":"Restructured from standalone-opco functional areas to PE holdco structure: OpCo IT + corporate shared services + AI/Innovation","grand_total_usd":190600000}'::jsonb
) ON CONFLICT (source_key) DO UPDATE
  SET freshness_date = EXCLUDED.freshness_date,
      row_count      = EXCLUDED.row_count,
      metadata       = EXCLUDED.metadata;

-- ── 4. Entities ───────────────────────────────────────────────────────────────

INSERT INTO cio_tower.entities (
  entity_key, tenant_key, entity_type, display_name, source_key, source_row
) VALUES
  -- Holding company
  ('lakeshore-industries:holdco',     'lakeshore-industries', 'holding_company',    'Lakeshore Holdings',                     'lakeshore_industries_f12_fy26_v4', 'rollup'),
  -- Portfolio companies
  ('lakeshore-industries:lak-pc-001', 'lakeshore-industries', 'portfolio_company',  'Northline Industries',                   'lakeshore_industries_f12_fy26_v4', 'LAK-PC-001'),
  ('lakeshore-industries:lak-pc-002', 'lakeshore-industries', 'portfolio_company',  'Brightmark Capital',                     'lakeshore_industries_f12_fy26_v4', 'LAK-PC-002'),
  ('lakeshore-industries:lak-pc-003', 'lakeshore-industries', 'portfolio_company',  'Forge and Field',                        'lakeshore_industries_f12_fy26_v4', 'LAK-PC-003'),
  ('lakeshore-industries:lak-pc-004', 'lakeshore-industries', 'portfolio_company',  'Great Lakes Pantry',                     'lakeshore_industries_f12_fy26_v4', 'LAK-PC-004'),
  ('lakeshore-industries:lak-pc-005', 'lakeshore-industries', 'portfolio_company',  'Additional Portfolio Companies',          'lakeshore_industries_f12_fy26_v4', 'LAK-PC-005'),
  -- Corporate shared services
  ('lakeshore-industries:lak-cs-001', 'lakeshore-industries', 'org_unit',           'Corporate · CIO Office and Governance',  'lakeshore_industries_f12_fy26_v4', 'LAK-CS-001'),
  ('lakeshore-industries:lak-cs-002', 'lakeshore-industries', 'org_unit',           'Corporate · Cloud and Infrastructure',   'lakeshore_industries_f12_fy26_v4', 'LAK-CS-002'),
  ('lakeshore-industries:lak-cs-003', 'lakeshore-industries', 'org_unit',           'Corporate · Cybersecurity and Identity', 'lakeshore_industries_f12_fy26_v4', 'LAK-CS-003'),
  ('lakeshore-industries:lak-cs-004', 'lakeshore-industries', 'org_unit',           'Corporate · Data Platform and Analytics','lakeshore_industries_f12_fy26_v4', 'LAK-CS-004'),
  ('lakeshore-industries:lak-cs-005', 'lakeshore-industries', 'org_unit',           'Corporate · Enterprise Applications',    'lakeshore_industries_f12_fy26_v4', 'LAK-CS-005'),
  ('lakeshore-industries:lak-cs-006', 'lakeshore-industries', 'org_unit',           'Corporate · Integration and Middleware', 'lakeshore_industries_f12_fy26_v4', 'LAK-CS-006'),
  ('lakeshore-industries:lak-cs-007', 'lakeshore-industries', 'org_unit',           'Corporate · ServiceNow and IT Operations','lakeshore_industries_f12_fy26_v4','LAK-CS-007'),
  ('lakeshore-industries:lak-cs-008', 'lakeshore-industries', 'org_unit',           'Corporate · AI and Innovation Office',   'lakeshore_industries_f12_fy26_v4', 'LAK-CS-008')
ON CONFLICT (tenant_key, entity_type, display_name) DO UPDATE
  SET entity_key = EXCLUDED.entity_key,
      source_key = EXCLUDED.source_key,
      source_row = EXCLUDED.source_row;

-- ── 5. Facts ─────────────────────────────────────────────────────────────────
-- 3 facts per entity (run, change, none=total) + 3 enterprise-envelope rollups
-- Scope: portfolio_company for LAK-PC-*, shared_services for LAK-CS-*

INSERT INTO cio_tower.facts (
  fact_key, tenant_key, entity_key, entity_type, measure,
  scope, view, amount_type, basis, period,
  value_numeric, unit, value_source, confidence,
  source_key, source_row
) VALUES
  -- LAK-PC-001 Northline Industries ($22.4M run, $10.1M change, $32.5M total)
  ('lak:f12:lak-pc-001:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-pc-001','portfolio_company','IT budget run',   'portfolio_company','it_budget','run',   'committed','fy26',22400000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-001'),
  ('lak:f12:lak-pc-001:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-pc-001','portfolio_company','IT budget change','portfolio_company','it_budget','change','committed','fy26',10100000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-001'),
  ('lak:f12:lak-pc-001:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-pc-001','portfolio_company','IT budget total', 'portfolio_company','it_budget','none',  'committed','fy26',32500000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-001'),
  -- LAK-PC-002 Brightmark Capital ($10.8M run, $4.8M change, $15.6M total)
  ('lak:f12:lak-pc-002:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-pc-002','portfolio_company','IT budget run',   'portfolio_company','it_budget','run',   'committed','fy26',10800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-002'),
  ('lak:f12:lak-pc-002:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-pc-002','portfolio_company','IT budget change','portfolio_company','it_budget','change','committed','fy26', 4800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-002'),
  ('lak:f12:lak-pc-002:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-pc-002','portfolio_company','IT budget total', 'portfolio_company','it_budget','none',  'committed','fy26',15600000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-002'),
  -- LAK-PC-003 Forge and Field ($11.9M run, $5.4M change, $17.3M total)
  ('lak:f12:lak-pc-003:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-pc-003','portfolio_company','IT budget run',   'portfolio_company','it_budget','run',   'committed','fy26',11900000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-003'),
  ('lak:f12:lak-pc-003:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-pc-003','portfolio_company','IT budget change','portfolio_company','it_budget','change','committed','fy26', 5400000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-003'),
  ('lak:f12:lak-pc-003:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-pc-003','portfolio_company','IT budget total', 'portfolio_company','it_budget','none',  'committed','fy26',17300000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-003'),
  -- LAK-PC-004 Great Lakes Pantry ($8.1M run, $3.6M change, $11.7M total)
  ('lak:f12:lak-pc-004:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-pc-004','portfolio_company','IT budget run',   'portfolio_company','it_budget','run',   'committed','fy26', 8100000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-004'),
  ('lak:f12:lak-pc-004:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-pc-004','portfolio_company','IT budget change','portfolio_company','it_budget','change','committed','fy26', 3600000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-004'),
  ('lak:f12:lak-pc-004:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-pc-004','portfolio_company','IT budget total', 'portfolio_company','it_budget','none',  'committed','fy26',11700000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-004'),
  -- LAK-PC-005 Additional Portfolio Companies ($53.2M run, $23.8M change, $77.0M total)
  ('lak:f12:lak-pc-005:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-pc-005','portfolio_company','IT budget run',   'portfolio_company','it_budget','run',   'committed','fy26',53200000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-005'),
  ('lak:f12:lak-pc-005:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-pc-005','portfolio_company','IT budget change','portfolio_company','it_budget','change','committed','fy26',23800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-005'),
  ('lak:f12:lak-pc-005:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-pc-005','portfolio_company','IT budget total', 'portfolio_company','it_budget','none',  'committed','fy26',77000000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-PC-005'),
  -- LAK-CS-001 CIO Office ($3.8M run, $1.7M change, $5.5M total)
  ('lak:f12:lak-cs-001:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-001','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 3800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-001'),
  ('lak:f12:lak-cs-001:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-001','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26', 1700000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-001'),
  ('lak:f12:lak-cs-001:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-001','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 5500000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-001'),
  -- LAK-CS-002 Cloud & Infrastructure ($3.1M run, $1.4M change, $4.5M total)
  ('lak:f12:lak-cs-002:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-002','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 3100000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-002'),
  ('lak:f12:lak-cs-002:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-002','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26', 1400000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-002'),
  ('lak:f12:lak-cs-002:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-002','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 4500000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-002'),
  -- LAK-CS-003 Cybersecurity ($2.8M run, $1.2M change, $4.0M total)
  ('lak:f12:lak-cs-003:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-003','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 2800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-003'),
  ('lak:f12:lak-cs-003:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-003','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26', 1200000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-003'),
  ('lak:f12:lak-cs-003:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-003','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 4000000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-003'),
  -- LAK-CS-004 Data Platform & Analytics ($2.6M run, $1.1M change, $3.7M total)
  ('lak:f12:lak-cs-004:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-004','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 2600000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-004'),
  ('lak:f12:lak-cs-004:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-004','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26', 1100000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-004'),
  ('lak:f12:lak-cs-004:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-004','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 3700000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-004'),
  -- LAK-CS-005 Enterprise Applications ($1.9M run, $0.9M change, $2.8M total)
  ('lak:f12:lak-cs-005:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-005','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 1900000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-005'),
  ('lak:f12:lak-cs-005:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-005','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26',  900000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-005'),
  ('lak:f12:lak-cs-005:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-005','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 2800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-005'),
  -- LAK-CS-006 Integration & Middleware ($1.4M run, $0.6M change, $2.0M total)
  ('lak:f12:lak-cs-006:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-006','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 1400000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-006'),
  ('lak:f12:lak-cs-006:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-006','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26',  600000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-006'),
  ('lak:f12:lak-cs-006:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-006','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 2000000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-006'),
  -- LAK-CS-007 ServiceNow & IT Operations ($1.5M run, $0.7M change, $2.2M total)
  ('lak:f12:lak-cs-007:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-007','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 1500000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-007'),
  ('lak:f12:lak-cs-007:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-007','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26',  700000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-007'),
  ('lak:f12:lak-cs-007:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-007','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26', 2200000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-007'),
  -- LAK-CS-008 AI & Innovation Office ($8.1M run, $3.7M change, $11.8M total)
  ('lak:f12:lak-cs-008:run:fy26:committed',   'lakeshore-industries','lakeshore-industries:lak-cs-008','org_unit','IT budget run',   'shared_services','it_budget','run',   'committed','fy26', 8100000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-008'),
  ('lak:f12:lak-cs-008:change:fy26:committed','lakeshore-industries','lakeshore-industries:lak-cs-008','org_unit','IT budget change','shared_services','it_budget','change','committed','fy26', 3700000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-008'),
  ('lak:f12:lak-cs-008:none:fy26:committed',  'lakeshore-industries','lakeshore-industries:lak-cs-008','org_unit','IT budget total', 'shared_services','it_budget','none',  'committed','fy26',11800000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','LAK-CS-008'),
  -- Enterprise envelope rollups (scope = enterprise_envelope, entity = holdco)
  ('lak:envelope:run:fy26:committed',    'lakeshore-industries','lakeshore-industries:holdco','holding_company','Total IT run budget enterprise',   'enterprise_envelope','it_budget','run',   'committed','fy26',131600000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','rollup'),
  ('lak:envelope:change:fy26:committed', 'lakeshore-industries','lakeshore-industries:holdco','holding_company','Total IT change budget enterprise', 'enterprise_envelope','it_budget','change','committed','fy26', 59000000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','rollup'),
  ('lak:envelope:none:fy26:committed',   'lakeshore-industries','lakeshore-industries:holdco','holding_company','Total IT budget enterprise',        'enterprise_envelope','it_budget','none',  'committed','fy26',190600000,'usd','synthetic','high','lakeshore_industries_f12_fy26_v4','rollup')
ON CONFLICT (fact_key) DO UPDATE
  SET value_numeric = EXCLUDED.value_numeric,
      value_source  = EXCLUDED.value_source,
      confidence    = EXCLUDED.confidence;

-- ── 6. Measure results (tenant-scoped aggregates for chat panel cards) ────────

INSERT INTO cio_tower.measure_results (
  result_key, tenant_key, measure_key, scope, period, basis,
  dimensions, value_numeric, source_fact_keys, formula_version
) VALUES
  -- total_it_budget_fy26
  ('lakeshore-industries:total_it_budget_fy26:enterprise_envelope:fy26:committed',
   'lakeshore-industries','total_it_budget_fy26','enterprise_envelope','fy26','committed',
   '{}'::jsonb, 190600000,
   ARRAY['lak:envelope:none:fy26:committed'], 'cio_tower_v1'),
  ('lakeshore-industries:total_it_budget_fy26:portfolio_company:fy26:committed',
   'lakeshore-industries','total_it_budget_fy26','portfolio_company','fy26','committed',
   '{}'::jsonb, 154100000,
   ARRAY['lak:f12:lak-pc-001:none:fy26:committed','lak:f12:lak-pc-002:none:fy26:committed',
         'lak:f12:lak-pc-003:none:fy26:committed','lak:f12:lak-pc-004:none:fy26:committed',
         'lak:f12:lak-pc-005:none:fy26:committed'], 'cio_tower_v1'),
  ('lakeshore-industries:total_it_budget_fy26:shared_services:fy26:committed',
   'lakeshore-industries','total_it_budget_fy26','shared_services','fy26','committed',
   '{}'::jsonb, 36500000,
   ARRAY['lak:f12:lak-cs-001:none:fy26:committed','lak:f12:lak-cs-002:none:fy26:committed',
         'lak:f12:lak-cs-003:none:fy26:committed','lak:f12:lak-cs-004:none:fy26:committed',
         'lak:f12:lak-cs-005:none:fy26:committed','lak:f12:lak-cs-006:none:fy26:committed',
         'lak:f12:lak-cs-007:none:fy26:committed','lak:f12:lak-cs-008:none:fy26:committed'], 'cio_tower_v1'),
  -- run_budget_fy26
  ('lakeshore-industries:run_budget_fy26:enterprise_envelope:fy26:committed',
   'lakeshore-industries','run_budget_fy26','enterprise_envelope','fy26','committed',
   '{}'::jsonb, 131600000,
   ARRAY['lak:envelope:run:fy26:committed'], 'cio_tower_v1'),
  -- change_budget_fy26
  ('lakeshore-industries:change_budget_fy26:enterprise_envelope:fy26:committed',
   'lakeshore-industries','change_budget_fy26','enterprise_envelope','fy26','committed',
   '{}'::jsonb, 59000000,
   ARRAY['lak:envelope:change:fy26:committed'], 'cio_tower_v1'),
  -- ai_innovation_budget_fy26
  ('lakeshore-industries:ai_innovation_budget_fy26:enterprise_envelope:fy26:committed',
   'lakeshore-industries','ai_innovation_budget_fy26','enterprise_envelope','fy26','committed',
   '{}'::jsonb, 11800000,
   ARRAY['lak:f12:lak-cs-008:none:fy26:committed'], 'cio_tower_v1')
ON CONFLICT (tenant_key, measure_key, scope, period, basis, dimensions) DO UPDATE
  SET value_numeric    = EXCLUDED.value_numeric,
      source_fact_keys = EXCLUDED.source_fact_keys,
      computed_at      = now();

-- ── 7. Retire stale enterprise_context_records for Lakeshore F12 ──────────────
-- The fallback path (tower-budget-rollups.ts line 358) reads enterprise_context_records
-- and would return the old $983M data if cio_tower.facts were absent.
-- Now that cio_tower.facts is populated (checked first), these stale rows are dead weight.
-- Soft-retire them so the fallback never surfaces wrong numbers.

UPDATE enterprise_context_records
   SET metadata = COALESCE(metadata, '{}'::jsonb) ||
                  '{"retired_by":"20260705180000_lakeshore_cio_tower_budget_seed","retirement_reason":"superseded_by_cio_tower_facts","prior_total_usd":983600000,"correct_total_usd":190600000}'::jsonb,
       record_subtype = 'it-budget-financials-retired'
 WHERE lower(tenant_key) IN ('lakeshore-industries','lakeshore-holdings','lakeshore')
   AND (
     source_file ILIKE '%F12_it-budget-financials%'
     OR record_type = 'it_budget_financials'
     OR record_subtype = 'it-budget-financials'
   );
