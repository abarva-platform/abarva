-- Persist the contract-intelligence boundary as one governed record per contract.
-- The record is a read model over canonical Source rows; it is not a second
-- source of truth and it never stores Claude prose as canonical fact.

BEGIN;

CREATE TABLE IF NOT EXISTS source.contract_archetype_playbook (
  archetype_key text PRIMARY KEY,
  industry_key text NOT NULL,
  archetype_label text NOT NULL,
  headline text NOT NULL,
  body text NOT NULL,
  track_question text NOT NULL,
  track_guidance text NOT NULL,
  load_question text NOT NULL,
  load_guidance text NOT NULL,
  observe_question text NOT NULL,
  observe_guidance text NOT NULL,
  required_evidence_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  industry_context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_basis text NOT NULL,
  confidence_level text NOT NULL DEFAULT 'high',
  review_status text NOT NULL DEFAULT 'approved',
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version text NOT NULL DEFAULT 'source-contract-intelligence-v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contract_archetype_playbook_confidence_check
    CHECK (confidence_level IN ('high', 'medium', 'low')),
  CONSTRAINT contract_archetype_playbook_review_check
    CHECK (review_status IN ('draft', 'reviewed', 'approved'))
);

INSERT INTO source.contract_archetype_playbook (
  archetype_key,
  industry_key,
  archetype_label,
  headline,
  body,
  track_question,
  track_guidance,
  load_question,
  load_guidance,
  observe_question,
  observe_guidance,
  required_evidence_json,
  industry_context_json,
  source_basis,
  provenance
)
VALUES
(
  'cloud_consumption',
  'enterprise_cloud_and_data_platforms',
  'Cloud consumption commitment',
  'Manage the commitment against real workload demand.',
  'The commercial question is whether the buyer is paying for a commitment the workloads can actually consume. Keep usage, commitment coverage, billing, and renewal timing together before changing the commercial position.',
  'Are workloads using what the contract commits?',
  'Track committed amount, actual spend, covered spend, on-demand spend, utilization, and the workload or account consuming it each month.',
  'What makes the consumption number defensible?',
  'Load the executed order or enterprise discount paper, monthly billing export, commitment coverage, resource inventory, application ownership, tag quality, and AP reconciliation.',
  'What should change before the next commercial gate?',
  'Watch utilization trend, on-demand leakage, stable workload coverage, untagged spend, workload migration, and the notice window. Treat a signal as a sizing task until the underlying rows support an ask.',
  '["contract_document", "scope", "monthly_usage", "commitment_coverage", "invoice_reconciliation", "resource_inventory"]'::jsonb,
  '{"category":"cloud and data platform sourcing","decision_questions":["Is committed capacity aligned to production demand?","Which workloads qualify for commitment coverage?","What renewal or Marketplace route preserves flexibility?"],"benchmark_boundary":"Do not infer a market discount or rate without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
),
(
  'managed_services',
  'enterprise_it_managed_services',
  'Managed services agreement',
  'Manage the service promise against demand, quality, and scope.',
  'The commercial question is whether the fee, scope, service level, and change-order pattern still match the service the buyer receives. Operating evidence is part of the contract decision, not a separate report.',
  'Is the service being delivered at the contracted level?',
  'Track SLA attainment, breach counts, credits calculated and claimed, ticket volumes, recurring changes, service towers, and unit or fee movement.',
  'What proves the service and commercial baseline?',
  'Load the MSA, SOWs, SLA schedule, rate card, invoice lines, ITSM tickets, approved change orders, QBR scorecards, scope inventory, and transition or exit terms.',
  'Where is the agreement drifting over time?',
  'Watch chronic misses, unclaimed credits, recurring change-order spend, demand reduction without fee flex, scope outside the base service, and the evidence needed for an exit or rebid decision.',
  '["contract_document", "scope", "invoice_detail", "performance", "tickets", "change_orders", "qbr"]'::jsonb,
  '{"category":"enterprise IT managed services","decision_questions":["Does the fee still match demand and delivered service?","Are credits and remedies being claimed?","Is scope moving outside the base agreement?"],"benchmark_boundary":"Do not infer a market rate or service-price benchmark without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
),
(
  'saas_subscription',
  'enterprise_software_and_saas',
  'Software subscription',
  'Manage entitlement, adoption, and renewal economics together.',
  'The commercial question is whether paid entitlement matches active use and whether the renewal preserves flexibility as adoption changes. Seats, usage, price terms, and renewal rights need one evidence trail.',
  'Are entitlements aligned to active use?',
  'Track purchased units, assigned units, active users, feature or workload adoption, invoice quantities, price changes, and renewal commitments by period.',
  'What makes a renewal adjustment defensible?',
  'Load the agreement and order forms, seat or usage export, invoice detail, price list, support tier, true-up rules, termination rights, and business owner mapping.',
  'What should the owner decide before renewal?',
  'Watch inactive entitlement, tier thresholds, true-up exposure, price or index changes, unused support, adoption by business unit, and the date by which a reduction or exit must be served.',
  '["contract_document", "scope", "entitlement_usage", "invoice_detail", "pricing_terms", "owner_mapping"]'::jsonb,
  '{"category":"enterprise software and SaaS","decision_questions":["Do paid entitlements match active use?","What renewal flexibility is available?","Which tiers, add-ons, or support levels are unused?"],"benchmark_boundary":"Do not infer a market seat price or discount without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
),
(
  'unmapped',
  'unclassified',
  'Contract governance',
  'Map the contract before changing the deal.',
  'A stable baseline, clear scope, observable performance or usage, and an accountable owner are required before a commercial recommendation can be trusted. The first decision is to classify the agreement and load the evidence loop that matches it.',
  'What is the baseline that can move?',
  'Track the committed commercial baseline, actual spend or usage, scope, key obligations, renewal timing, and the owner accountable for the next decision.',
  'What evidence is needed to make the contract actionable?',
  'Load the executed agreement, SOWs or change orders, invoices, usage or performance records, scope inventory, and approved benchmark or finance evidence.',
  'What should improve before the next review?',
  'Observe variance, service or usage trend, scope change, exceptions, owner actions, and whether a candidate value becomes approved or finance-confirmed.',
  '["contract_document", "scope", "spend_or_usage", "owner_mapping"]'::jsonb,
  '{"category":"unclassified contract","decision_questions":["What kind of agreement is this?","Which evidence family governs the next decision?"],"benchmark_boundary":"No benchmark or archetype-specific advice is allowed until the contract is mapped and reviewed."}'::jsonb,
  'approved fallback playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"fallback guidance","version":"source-contract-intelligence-v1"}'::jsonb
)
ON CONFLICT (archetype_key) DO UPDATE SET
  industry_key = EXCLUDED.industry_key,
  archetype_label = EXCLUDED.archetype_label,
  headline = EXCLUDED.headline,
  body = EXCLUDED.body,
  track_question = EXCLUDED.track_question,
  track_guidance = EXCLUDED.track_guidance,
  load_question = EXCLUDED.load_question,
  load_guidance = EXCLUDED.load_guidance,
  observe_question = EXCLUDED.observe_question,
  observe_guidance = EXCLUDED.observe_guidance,
  required_evidence_json = EXCLUDED.required_evidence_json,
  industry_context_json = EXCLUDED.industry_context_json,
  source_basis = EXCLUDED.source_basis,
  provenance = EXCLUDED.provenance,
  updated_at = now();

INSERT INTO source.contract_archetype_playbook (
  archetype_key,
  industry_key,
  archetype_label,
  headline,
  body,
  track_question,
  track_guidance,
  load_question,
  load_guidance,
  observe_question,
  observe_guidance,
  required_evidence_json,
  industry_context_json,
  source_basis,
  provenance
)
VALUES
(
  'productivity_platform',
  'enterprise_productivity_and_collaboration',
  'Productivity and collaboration platform',
  'Manage entitlement, adoption, and security coverage together.',
  'The commercial question is whether paid productivity capability matches active adoption and the operating controls the business actually needs. Seats, service tiers, security scope, and renewal rights need one evidence trail.',
  'Are paid capabilities aligned to active use?',
  'Track purchased units, assigned units, active users, feature adoption, security coverage, invoice quantities, and renewal commitments by period.',
  'What makes a productivity renewal adjustment defensible?',
  'Load the agreement and order forms, seat or usage export, invoice detail, service tier, true-up rules, termination rights, security schedules, and business owner mapping.',
  'What should the owner decide before renewal?',
  'Watch inactive entitlement, unused tiers, security or compliance obligations, price or index changes, adoption by business unit, and the date by which a reduction or exit must be served.',
  '["contract_document", "scope", "entitlement_usage", "invoice_detail", "pricing_terms", "owner_mapping"]'::jsonb,
  '{"category":"enterprise productivity and collaboration","decision_questions":["Do paid capabilities match active use?","Which security or service tiers are required?","What renewal flexibility is available?"],"benchmark_boundary":"Do not infer a market seat price or discount without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
),
(
  'crm_saas',
  'enterprise_crm_and_customer_operations',
  'CRM SaaS subscription',
  'Manage customer-workflow adoption against paid entitlement.',
  'The commercial question is whether CRM seats, modules, support, and integration scope match the customer operations the business runs. Adoption and renewal flexibility matter as much as the list price.',
  'Are CRM entitlements aligned to active workflow use?',
  'Track purchased seats, assigned seats, active users, module adoption, integration usage, invoice quantities, support tier, and renewal commitments by period.',
  'What makes a CRM renewal adjustment defensible?',
  'Load the agreement and order forms, seat and usage export, invoice detail, price list, support tier, true-up rules, termination rights, and business owner mapping.',
  'What should change before the renewal gate?',
  'Watch inactive seats, unused modules, tier thresholds, integration dependencies, price or index changes, and the date by which a reduction or exit must be served.',
  '["contract_document", "scope", "entitlement_usage", "invoice_detail", "pricing_terms", "owner_mapping"]'::jsonb,
  '{"category":"enterprise CRM and customer operations","decision_questions":["Do paid CRM capabilities match active workflows?","Which modules or tiers are unused?","What renewal flexibility is available?"],"benchmark_boundary":"Do not infer a market seat price or discount without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
),
(
  'application_managed_services',
  'enterprise_application_managed_services',
  'Application managed services agreement',
  'Manage application service quality, demand, and change scope together.',
  'The commercial question is whether the application service fee and delivery model still match supported systems, demand, service levels, and recurring changes. The operating evidence is part of the commercial decision.',
  'Is the application service being delivered at the contracted level?',
  'Track SLA attainment, incidents, ticket volume, service credits, recurring changes, supported applications, resource roles, and fee movement.',
  'What proves the application service baseline?',
  'Load the MSA, SOWs, SLA schedule, rate card, invoice lines, ITSM tickets, approved change orders, QBR scorecards, resource model, scope inventory, and transition terms.',
  'Where is the service drifting over time?',
  'Watch chronic misses, unclaimed credits, recurring change-order spend, demand reduction without fee flex, scope outside base service, and evidence needed for an exit or rebid decision.',
  '["contract_document", "scope", "invoice_detail", "performance", "tickets", "change_orders", "qbr", "resource_model"]'::jsonb,
  '{"category":"enterprise application managed services","decision_questions":["Does the fee match demand and delivered service?","Are credits and remedies being claimed?","Is scope moving outside the base agreement?"],"benchmark_boundary":"Do not infer a market rate or service-price benchmark without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
),
(
  'infra_service_desk_managed_services',
  'enterprise_infrastructure_and_service_desk',
  'Infrastructure and service desk managed services',
  'Manage support demand, service levels, and tower scope against the fee.',
  'The commercial question is whether infrastructure and service desk capacity, service levels, and recurring demand still match the commercial baseline. Ticket, staffing, asset, and invoice evidence must be read together.',
  'Is support demand aligned to the contracted service model?',
  'Track tickets by priority, response and resolution performance, supported assets, resource roles, recurring changes, credits, and fee movement.',
  'What proves the service desk baseline?',
  'Load the MSA, SOWs, SLA schedule, rate card, invoice lines, ITSM tickets, approved change orders, QBR scorecards, resource model, scope inventory, and exit terms.',
  'Where is the operating model over- or under-sized?',
  'Watch demand reduction without fee flex, chronic misses, unclaimed credits, unsupported scope, recurring changes, and the evidence needed for a rebid or service-tier change.',
  '["contract_document", "scope", "invoice_detail", "performance", "tickets", "change_orders", "qbr", "resource_model"]'::jsonb,
  '{"category":"enterprise infrastructure and service desk","decision_questions":["Does the fee match support demand?","Are service credits and remedies being claimed?","Which towers or assets are actually covered?"],"benchmark_boundary":"Do not infer a market rate or service-price benchmark without a cited benchmark source."}'::jsonb,
  'approved archetype playbook maintained by Source commercial intelligence',
  '{"object":"contract_archetype_playbook","review_basis":"authored archetype guidance","version":"source-contract-intelligence-v1"}'::jsonb
)
ON CONFLICT (archetype_key) DO UPDATE SET
  industry_key = EXCLUDED.industry_key,
  archetype_label = EXCLUDED.archetype_label,
  headline = EXCLUDED.headline,
  body = EXCLUDED.body,
  track_question = EXCLUDED.track_question,
  track_guidance = EXCLUDED.track_guidance,
  load_question = EXCLUDED.load_question,
  load_guidance = EXCLUDED.load_guidance,
  observe_question = EXCLUDED.observe_question,
  observe_guidance = EXCLUDED.observe_guidance,
  required_evidence_json = EXCLUDED.required_evidence_json,
  industry_context_json = EXCLUDED.industry_context_json,
  source_basis = EXCLUDED.source_basis,
  provenance = EXCLUDED.provenance,
  updated_at = now();

DO $$
BEGIN
  IF to_regclass('source.contract_360') IS NOT NULL
     AND to_regclass('source.contract_tab_intelligence_v1') IS NOT NULL
     AND to_regclass('source.contract_evidence_coverage_v1') IS NOT NULL
     AND to_regclass('source.contract_application_scope') IS NOT NULL
  THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW source.contract_intelligence_v1 AS
      WITH scope_rows AS (
        SELECT
          s.*,
          row_number() OVER (PARTITION BY tenant_key, contract_id ORDER BY application_ref) AS scope_rank
        FROM source.contract_application_scope s
      ),
      scope AS (
        SELECT
          tenant_key,
          contract_id,
          count(*)::bigint AS scope_rows,
          jsonb_agg(
            jsonb_build_object(
              'id', contract_id || ':scope:' || coalesce(application_ref, scope_rank::text),
              'kind', 'scope',
              'label', coalesce(nullif(application_name, ''), nullif(application_ref, ''), 'Named scope row'),
              'description', concat_ws('; ', nullif(business_function, ''), nullif(hosting_model, ''), nullif(criticality, '')),
              'source_refs', jsonb_build_array(coalesce(nullif(application_ref, ''), contract_id))
            )
          ) AS scope_nodes,
          string_agg(DISTINCT nullif(business_function, ''), ', ') FILTER (WHERE nullif(business_function, '') IS NOT NULL) AS business_functions
        FROM scope_rows
        GROUP BY tenant_key, contract_id
      ),
      tabs AS (
        SELECT
          tenant_key,
          contract_id,
          jsonb_agg(
            jsonb_build_object(
              'tab_key', tab_key,
              'sort_order', sort_order,
              'headline', headline,
              'allowed_executive_statement', allowed_executive_statement,
              'supporting_evidence_summary', supporting_evidence_summary,
              'missing_evidence_summary', missing_evidence_summary,
              'action_prompt', action_prompt,
              'source_basis', source_basis,
              'confidence_level', confidence_level,
              'review_status', review_status,
              'provenance', provenance
            ) ORDER BY sort_order
          ) AS tab_rows
        FROM source.contract_tab_intelligence_v1
        GROUP BY tenant_key, contract_id
      ),
      coverage AS (
        SELECT * FROM source.contract_evidence_coverage_v1
      ),
      contract_rows AS (
        SELECT
          c.*,
          coalesce(nullif(to_jsonb(c)->>'contract_archetype', ''), nullif(to_jsonb(c)->>'archetype', ''), nullif(c.vendor_category, ''), 'unmapped') AS archetype_key,
          nullif(to_jsonb(c)->>'purpose_summary', '') AS purpose_summary_json,
          nullif(to_jsonb(c)->>'scope_summary', '') AS scope_summary_json,
          nullif(to_jsonb(c)->>'commercial_thesis', '') AS commercial_thesis_json,
          nullif(to_jsonb(c)->>'evidence_boundary_summary', '') AS evidence_boundary_json
        FROM source.contract_360 c
      )
      SELECT
        c.tenant_key,
        c.contract_id,
        c.vendor_ref,
        c.vendor_name,
        c.contract_name,
        p.archetype_key AS archetype_key,
        p.archetype_label,
        p.industry_key,
        p.review_status AS playbook_review_status,
        CASE
          WHEN coalesce(cov.scope_rows, 0) > 0
           AND (coalesce(cov.spend_rows, 0) > 0 OR coalesce(cov.performance_rows, 0) > 0)
          THEN 'partial'
          ELSE 'blocked_missing_evidence'
        END AS review_status,
        jsonb_build_object(
          'model_version', 'source-contract-intelligence-v1',
          'contract', jsonb_build_object(
            'contract_id', c.contract_id,
            'vendor_id', c.vendor_ref,
            'vendor_name', c.vendor_name,
            'title', c.contract_name,
            'archetype_key', p.archetype_key,
            'archetype_label', p.archetype_label,
            'archetype_source_basis', CASE
              WHEN c.archetype_key = 'unmapped' THEN 'unmapped'
              WHEN nullif(to_jsonb(c)->>'contract_archetype', '') IS NOT NULL
                OR nullif(to_jsonb(c)->>'archetype', '') IS NOT NULL
              THEN 'explicit_contract_mapping'
              ELSE 'controlled_category_mapping'
            END,
            'archetype_confidence', CASE
              WHEN c.archetype_key = 'unmapped' THEN 'unverified'
              WHEN nullif(to_jsonb(c)->>'contract_archetype', '') IS NOT NULL
                OR nullif(to_jsonb(c)->>'archetype', '') IS NOT NULL
              THEN 'high'
              ELSE 'medium'
            END,
            'start_date', to_jsonb(c)->>'start_date',
            'end_date', c.end_date,
            'notice_period_days', c.notice_period_days,
            'annual_value_usd', c.annual_value
          ),
          'story', jsonb_build_object(
            'headline', coalesce(nullif(c.purpose_summary_json, ''), concat(c.vendor_name, ': contract purpose requires reviewed context.')),
            'purpose', coalesce(nullif(c.purpose_summary_json, ''), concat(c.vendor_name, ' provides ', p.archetype_label, ' under this agreement.')),
            'scope', coalesce(nullif(c.scope_summary_json, ''), concat(coalesce(cov.scope_rows, 0)::text, ' governed scope rows are loaded.')),
            'decision', coalesce(nullif(c.commercial_thesis_json, ''), 'Use the loaded evidence lanes to determine whether the next move is recovery, avoidance, or negotiation.'),
            'evidence_boundary', coalesce(nullif(c.evidence_boundary_json, ''), 'Only loaded and reviewed evidence may support a contract claim.')
          ),
          'education', jsonb_build_object(
            'archetype_key', p.archetype_key,
            'archetype_label', p.archetype_label,
            'headline', p.headline,
            'body', p.body,
            'track', jsonb_build_object('question', p.track_question, 'guidance', p.track_guidance, 'state', CASE WHEN coalesce(cov.spend_rows, 0) > 0 OR coalesce(cov.performance_rows, 0) > 0 THEN 'loaded' ELSE 'next' END),
            'load', jsonb_build_object('question', p.load_question, 'guidance', p.load_guidance, 'state', CASE WHEN coalesce(cov.document_page_text_rows, 0) > 0 OR nullif(c.purpose_summary_json, '') IS NOT NULL THEN 'loaded' ELSE 'next' END),
            'observe', jsonb_build_object('question', p.observe_question, 'guidance', p.observe_guidance, 'state', CASE WHEN coalesce(cov.opportunity_rows, 0) > 0 THEN 'loaded' ELSE 'next' END),
            'required_evidence', p.required_evidence_json
          ),
          'industry_intelligence', jsonb_build_object(
            'state', 'missing_benchmark',
            'industry_key', p.industry_key,
            'context', p.industry_context_json,
            'benchmark_sources', '[]'::jsonb,
            'allowed_uses', jsonb_build_array('select the authored archetype playbook', 'frame contract-specific questions'),
            'blocked_claims', jsonb_build_array('market percentile', 'industry discount range', 'external rate benchmark')
          ),
          'anatomy', jsonb_build_object(
            'plain_english', concat('This contract is provided by ', c.vendor_name, ', classified as ', p.archetype_label, ', and explicitly covers ', coalesce(scope.business_functions, 'the loaded scope'), '.'),
            'nodes', jsonb_build_array(
              jsonb_build_object('id', c.contract_id, 'kind', 'contract', 'label', c.contract_name, 'source_refs', jsonb_build_array(c.contract_id)),
              jsonb_build_object('id', coalesce(c.vendor_ref, c.vendor_name), 'kind', 'vendor', 'label', c.vendor_name, 'source_refs', jsonb_build_array(coalesce(c.vendor_ref, c.contract_id))),
              jsonb_build_object('id', 'archetype:' || p.archetype_key, 'kind', 'archetype', 'label', p.archetype_label, 'source_refs', jsonb_build_array(c.contract_id))
            ) || coalesce(scope.scope_nodes, '[]'::jsonb),
            'relationships', jsonb_build_array(
              jsonb_build_object('from', c.contract_id, 'to', coalesce(c.vendor_ref, c.vendor_name), 'type', 'provided_by', 'confidence', 'high'),
              jsonb_build_object('from', c.contract_id, 'to', 'archetype:' || p.archetype_key, 'type', 'classified_as', 'confidence', CASE WHEN c.archetype_key = 'unmapped' THEN 'unverified' ELSE 'high' END)
            )
          ),
          'tabs', coalesce(tabs.tab_rows, '[]'::jsonb),
          'review', jsonb_build_object(
            'status', CASE WHEN coalesce(cov.scope_rows, 0) > 0 AND (coalesce(cov.spend_rows, 0) > 0 OR coalesce(cov.performance_rows, 0) > 0) THEN 'reviewed' ELSE 'blocked_missing_evidence' END,
            'missing_evidence', jsonb_build_array(
              CASE WHEN coalesce(cov.scope_rows, 0) = 0 THEN 'declared scope' END,
              CASE WHEN coalesce(cov.spend_rows, 0) = 0 AND coalesce(cov.performance_rows, 0) = 0 THEN 'usage, spend, or performance evidence' END,
              CASE WHEN coalesce(cov.document_page_text_rows, 0) = 0 THEN 'searchable document page text' END
            ),
            'derived_from_load_run_id', c.load_run_id
          ),
          'provenance', jsonb_build_object(
            'tenant_key', c.tenant_key,
            'dataset_version', to_jsonb(c)->>'dataset_version',
            'load_run_id', c.load_run_id,
            'source_refs', jsonb_build_array(c.contract_id),
            'model_version', 'source-contract-intelligence-v1'
          )
        ) AS intelligence_record,
        jsonb_build_object(
          'source.contract_360', c.contract_id,
          'source.contract_tab_intelligence_v1', coalesce(tabs.tab_rows, '[]'::jsonb),
          'source.contract_archetype_playbook', p.archetype_key,
          'derived_from_load_run_id', c.load_run_id
        ) AS provenance,
        c.load_run_id AS derived_from_load_run_id
      FROM contract_rows c
      LEFT JOIN source.contract_archetype_playbook p
        ON p.archetype_key = CASE
          WHEN c.archetype_key LIKE '%productivity%' THEN 'productivity_platform'
          WHEN c.archetype_key LIKE '%crm%saas%' THEN 'crm_saas'
          WHEN c.archetype_key LIKE '%application%managed%service%' THEN 'application_managed_services'
          WHEN c.archetype_key LIKE '%infra%service%desk%managed%service%' THEN 'infra_service_desk_managed_services'
          WHEN c.archetype_key LIKE '%managed%service%' OR c.archetype_key LIKE '%service_desk%' THEN 'managed_services'
          WHEN c.archetype_key LIKE '%cloud%' OR c.archetype_key LIKE '%consumption%' OR c.archetype_key LIKE '%edp%' THEN 'cloud_consumption'
          WHEN c.archetype_key LIKE '%saas%' OR c.archetype_key LIKE '%subscription%' OR c.archetype_key LIKE '%software%' OR c.archetype_key LIKE '%license%' THEN 'saas_subscription'
          ELSE 'unmapped'
        END
      LEFT JOIN coverage cov
        ON cov.tenant_key = c.tenant_key AND cov.contract_id = c.contract_id
      LEFT JOIN scope
        ON scope.tenant_key = c.tenant_key AND scope.contract_id = c.contract_id
      LEFT JOIN tabs
        ON tabs.tenant_key = c.tenant_key AND tabs.contract_id = c.contract_id
      WHERE source.can_read_sourcing_tenant(c.tenant_key);
    $view$;

    EXECUTE 'GRANT SELECT ON source.contract_intelligence_v1 TO authenticated, service_role';
  END IF;
END $$;

COMMENT ON TABLE source.contract_archetype_playbook IS
  'Reviewed, reusable Track/Load/Observe guidance and industry context by contract archetype. It selects education; it does not assert contract facts.';

COMMIT;
