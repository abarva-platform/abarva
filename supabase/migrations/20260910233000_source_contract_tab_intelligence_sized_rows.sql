-- Keep Contract 360 tab intelligence from treating signal-stage action rows
-- as sized evidence simply because an upstream directional amount exists.
-- The canonical opportunity spine owns stage and amount-state semantics; this
-- view may summarize those states, but must not convert advisory signals into
-- priced executive evidence.

BEGIN;

DO $$
BEGIN
  IF to_regclass('source.contract_360') IS NOT NULL
     AND to_regclass('source.contract_application_scope') IS NOT NULL
     AND to_regclass('source.contract_evidence_coverage_v1') IS NOT NULL
     AND to_regclass('source.contract_action_candidate_v1') IS NOT NULL
     AND (
       SELECT count(*)
       FROM information_schema.columns
       WHERE table_schema = 'source'
         AND table_name = 'contract_360'
         AND column_name = ANY(ARRAY[
           'annual_value',
           'commercial_thesis',
           'contract_id',
           'contract_name',
           'document_page_text_count',
           'end_date',
           'evidence_boundary_summary',
           'load_run_id',
           'purpose_summary',
           'relationship_summary',
           'source_confidence',
           'tenant_key',
           'vendor_name',
           'vendor_ref'
         ])
     ) = 14
  THEN
    EXECUTE $view$
CREATE OR REPLACE VIEW source.contract_tab_intelligence_v1 AS
WITH scope AS (
  SELECT
    tenant_key,
    contract_id,
    count(*)::bigint AS scope_rows,
    count(*) FILTER (WHERE annual_run_cost IS NULL)::bigint AS missing_run_cost_rows,
    string_agg(DISTINCT NULLIF(business_function, ''), ', ') FILTER (WHERE NULLIF(business_function, '') IS NOT NULL) AS business_functions,
    string_agg(DISTINCT NULLIF(hosting_model, ''), ', ') FILTER (WHERE NULLIF(hosting_model, '') IS NOT NULL) AS hosting_models,
    string_agg(DISTINCT NULLIF(criticality, ''), ', ') FILTER (WHERE NULLIF(criticality, '') IS NOT NULL) AS criticality_values
  FROM source.contract_application_scope
  GROUP BY tenant_key, contract_id
),
opportunity_ranked AS (
  SELECT
    a.tenant_key,
    a.contract_id,
    a.action_candidate_id,
    NULLIF(a.title, '') AS title,
    NULLIF(a.next_action, '') AS next_action,
    NULLIF(a.accountable_role, '') AS accountable_role,
    a.candidate_amount_usd,
    COALESCE(NULLIF(o.stage, ''), CASE WHEN a.candidate_amount_usd IS NOT NULL AND a.candidate_amount_usd > 0 THEN 'quantified' ELSE 'signal' END) AS source_stage,
    COALESCE(NULLIF(o.amount_state, ''), CASE WHEN a.candidate_amount_usd IS NOT NULL AND a.candidate_amount_usd > 0 THEN 'exact' ELSE 'not_sized' END) AS source_amount_state,
    o.confidence AS source_confidence,
    row_number() OVER (
      PARTITION BY a.tenant_key, a.contract_id
      ORDER BY
        CASE a.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        a.decision_due_date NULLS LAST,
        a.action_candidate_id
    ) AS action_rank
  FROM source.contract_action_candidate_v1 a
  LEFT JOIN source.optimization_opportunity o
    ON o.tenant_key = a.tenant_key
   AND o.contract_id = a.contract_id
   AND o.opportunity_id = a.opportunity_id
),
opportunity AS (
  SELECT
    tenant_key,
    contract_id,
    count(*)::bigint AS opportunity_rows,
    count(*) FILTER (
      WHERE candidate_amount_usd IS NOT NULL
        AND candidate_amount_usd > 0
        AND source_stage <> 'signal'
        AND source_amount_state <> 'not_sized'
    )::bigint AS sized_rows,
    count(*) FILTER (
      WHERE source_stage = 'signal'
         OR source_amount_state = 'not_sized'
         OR COALESCE(source_confidence, 1) < 0.5
    )::bigint AS signal_rows,
    COALESCE(sum(candidate_amount_usd) FILTER (
      WHERE candidate_amount_usd IS NOT NULL
        AND source_stage <> 'signal'
        AND source_amount_state <> 'not_sized'
    ), 0)::numeric AS candidate_amount_usd,
    string_agg(DISTINCT title, '; ') FILTER (WHERE title IS NOT NULL AND action_rank <= 5) AS top_actions,
    string_agg(DISTINCT next_action, '; ') FILTER (WHERE next_action IS NOT NULL AND action_rank <= 3) AS next_actions,
    string_agg(DISTINCT accountable_role, ', ') FILTER (WHERE accountable_role IS NOT NULL) AS accountable_roles
  FROM opportunity_ranked
  GROUP BY tenant_key, contract_id
),
contract_rows AS (
  SELECT
    c.*,
    CASE
      WHEN c.source_confidence::text ~ '^[0-9]+(\.[0-9]+)?$' THEN c.source_confidence::numeric
      ELSE NULL::numeric
    END AS confidence_num
  FROM source.contract_360 c
)
SELECT
  c.tenant_key,
  c.contract_id,
  c.vendor_ref,
  c.vendor_name,
  c.contract_name,
  tab.tab_key,
  tab.sort_order,
  tab.headline,
  tab.allowed_executive_statement,
  tab.supporting_evidence_summary,
  tab.missing_evidence_summary,
  tab.action_prompt,
  tab.source_basis,
  CASE
    WHEN tab.evidence_rows <= 0 THEN 'unverified'
    WHEN COALESCE(c.confidence_num, 0.9) >= 0.9 THEN 'high'
    WHEN COALESCE(c.confidence_num, 0.7) >= 0.7 THEN 'medium'
    ELSE 'low'
  END AS confidence_level,
  concat(
    'Generated from reviewed contract row ',
    c.contract_id,
    '; tab evidence rows=',
    tab.evidence_rows::text,
    '; no model-calculated money, dates, or benchmarks.'
  ) AS confidence_rationale,
  CASE
    WHEN tab.evidence_rows <= 0 THEN 'draft_gap'
    ELSE 'system_generated_from_reviewed_sources'
  END AS review_status,
  jsonb_build_object(
    'source.contract_360', c.contract_id,
    'source.contract_evidence_coverage_v1', COALESCE(cov.evidence_basis_json, '{}'::jsonb),
    'source.contract_application_scope', COALESCE(scope.scope_rows, 0),
    'source.contract_action_candidate_v1', COALESCE(opportunity.opportunity_rows, 0),
    'derived_from_load_run_id', c.load_run_id
  ) AS provenance,
  c.load_run_id AS derived_from_load_run_id
FROM contract_rows c
LEFT JOIN source.contract_evidence_coverage_v1 cov
  ON cov.tenant_key = c.tenant_key
 AND cov.contract_id = c.contract_id
LEFT JOIN scope
  ON scope.tenant_key = c.tenant_key
 AND scope.contract_id = c.contract_id
LEFT JOIN opportunity
  ON opportunity.tenant_key = c.tenant_key
 AND opportunity.contract_id = c.contract_id
CROSS JOIN LATERAL (
  VALUES
    (
      'story'::text,
      10::int,
      COALESCE(NULLIF(c.purpose_summary, ''), concat(c.vendor_name, ': contract purpose is not yet reviewed.')),
      COALESCE(
        NULLIF(c.commercial_thesis, ''),
        concat('Use the contract header, archetype, renewal timing, evidence coverage, and opportunity rows to decide whether ', c.vendor_name, ' needs recovery, avoidance, or negotiation action.')
      ),
      concat_ws(
        '; ',
        CASE WHEN c.annual_value IS NOT NULL THEN 'annual value loaded' END,
        CASE WHEN c.end_date IS NOT NULL THEN 'end date loaded' END,
        CASE WHEN COALESCE(c.document_page_text_count, 0) > 0 THEN concat(c.document_page_text_count::text, ' document page rows') END,
        CASE WHEN COALESCE(opportunity.opportunity_rows, 0) > 0 THEN concat(opportunity.opportunity_rows::text, ' opportunity rows') END
      ),
      CASE WHEN NULLIF(c.purpose_summary, '') IS NULL THEN 'Contract purpose summary needs a reviewed extraction from executed agreement, order form, SOW, or approved archetype brief.' ELSE NULL END,
      'Start with what the contract is for; only then discuss value or action.',
      'source.contract_360 plus reviewed contract narrative fact assertions',
      1 + COALESCE(cov.document_page_text_rows, 0) + COALESCE(opportunity.opportunity_rows, 0)
    ),
    (
      'scope',
      20,
      CASE
        WHEN COALESCE(scope.scope_rows, 0) > 0 THEN concat(scope.scope_rows::text, ' scoped application or service rows are loaded.')
        ELSE 'No application or service scope rows are loaded.'
      END,
      CASE
        WHEN COALESCE(scope.scope_rows, 0) > 0
          THEN concat('Scope covers ', COALESCE(scope.business_functions, 'the loaded business functions'), ' on ', COALESCE(scope.hosting_models, 'recorded hosting'), '. Treat this as declared scope, not enterprise-wide dependency coverage.')
        ELSE 'The contract header is loaded, but the systems, services, and business functions it covers are not governed yet.'
      END,
      concat_ws('; ', concat(COALESCE(scope.scope_rows, 0)::text, ' scope rows'), CASE WHEN scope.criticality_values IS NOT NULL THEN concat('criticality: ', scope.criticality_values) END),
      CASE
        WHEN COALESCE(scope.scope_rows, 0) = 0 THEN 'Load application/service scope rows before claiming blast radius, rationalization, or tower dependency coverage.'
        WHEN COALESCE(scope.missing_run_cost_rows, 0) > 0 THEN concat(scope.missing_run_cost_rows::text, ' scope rows still need annual run cost before scope can become a sized economics claim.')
        ELSE NULL
      END,
      'Use scope to say what is explicitly covered; do not expand to CMDB or Tower relationships without rows.',
      'source.contract_application_scope',
      COALESCE(scope.scope_rows, 0)
    ),
    (
      'economics',
      30,
      CASE
        WHEN COALESCE(cov.spend_rows, 0) > 0 THEN concat(cov.spend_rows::text, ' monthly spend rows support the economics view.')
        ELSE 'Monthly spend evidence is not loaded.'
      END,
      CASE
        WHEN COALESCE(cov.spend_rows, 0) > 0 THEN 'Committed, invoiced, paid, and actual amounts can be trended without turning opportunity into realized savings.'
        ELSE 'Show recorded contract value only; do not treat missing monthly spend as zero or as a run-rate.'
      END,
      concat_ws('; ', concat(COALESCE(cov.spend_rows, 0)::text, ' spend rows'), CASE WHEN COALESCE(cov.actual_spend_usd, 0) > 0 THEN 'actual spend loaded' END),
      CASE WHEN COALESCE(cov.spend_rows, 0) = 0 THEN 'Load AP, billing, or consumption-month rows before drawing a consumption ramp or variance story.' ELSE NULL END,
      'Keep contract value, actual spend, invoiced, paid, and finance-confirmed outcomes in separate ledgers.',
      'consumption.sourcing_spend_monthly_v1 and source.contract_360',
      COALESCE(cov.spend_rows, 0)
    ),
    (
      'performance',
      40,
      CASE
        WHEN COALESCE(cov.performance_rows, 0) > 0 THEN concat(cov.performance_rows::text, ' performance periods are loaded.')
        ELSE 'Performance periods are not loaded.'
      END,
      CASE
        WHEN COALESCE(cov.performance_rows, 0) > 0 THEN 'SLA misses and service credits stay visible as evidence; they become recovered value only after finance confirms claim outcome.'
        ELSE 'No SLA, service-credit, or performance-trend claim is allowed for this contract yet.'
      END,
      concat_ws('; ', concat(COALESCE(cov.performance_rows, 0)::text, ' performance rows'), concat(COALESCE(cov.breach_rows, 0)::text, ' breach rows'), concat(COALESCE(cov.unclaimed_credit_usd, 0)::text, ' unclaimed credit dollars')),
      CASE WHEN COALESCE(cov.performance_rows, 0) = 0 THEN 'Load ITSM, SLA, service-credit, or monthly performance rows before making service-quality claims.' ELSE NULL END,
      'Use performance to decide whether the ask is a contractual credit or a commercial negotiation.',
      'consumption.sourcing_performance_v1',
      COALESCE(cov.performance_rows, 0)
    ),
    (
      'relationship',
      50,
      CASE
        WHEN COALESCE(scope.scope_rows, 0) > 0 THEN concat(c.vendor_name, ' links to ', scope.scope_rows::text, ' scoped workloads.')
        ELSE 'Relationship is limited to vendor and contract header.'
      END,
      COALESCE(
        NULLIF(c.relationship_summary, ''),
        CASE
          WHEN COALESCE(scope.scope_rows, 0) > 0 THEN concat('Loaded relationship path is vendor -> contract -> ', COALESCE(scope.business_functions, 'scoped functions'), ' -> ', COALESCE(scope.hosting_models, 'recorded hosting'), '.')
          ELSE 'Do not infer application, tower, or business-unit dependency coverage until relationship rows are loaded.'
        END
      ),
      concat_ws('; ', concat(COALESCE(scope.scope_rows, 0)::text, ' scope relationships'), CASE WHEN scope.business_functions IS NOT NULL THEN concat('functions: ', scope.business_functions) END),
      CASE WHEN COALESCE(scope.scope_rows, 0) = 0 THEN 'Load declared relationship rows before drawing dependency maps or owner paths.' ELSE NULL END,
      'Show declared relationships and the boundary; no inferred dependency graph.',
      'source.contract_application_scope and reviewed relationship summary',
      COALESCE(scope.scope_rows, 0)
    ),
    (
      'evidence',
      60,
      'Evidence rows and missing inputs stay separate.',
      COALESCE(
        NULLIF(c.evidence_boundary_summary, ''),
        'Structured rows, document pages, and missing inputs are reported separately so the tab can explain why a claim is allowed or blocked.'
      ),
      concat_ws(
        '; ',
        concat(COALESCE(cov.spend_rows, 0)::text, ' spend rows'),
        concat(COALESCE(cov.performance_rows, 0)::text, ' performance rows'),
        concat(COALESCE(cov.scope_rows, 0)::text, ' scope rows'),
        concat(COALESCE(cov.document_page_text_rows, 0)::text, ' document page rows'),
        concat(COALESCE(cov.opportunity_rows, 0)::text, ' opportunity rows')
      ),
      NULLIF(cov.blocker_if_missing, ''),
      'Render evidence lanes only when rows exist; otherwise show the specific missing input.',
      'source.contract_evidence_coverage_v1',
      COALESCE(cov.spend_rows, 0) + COALESCE(cov.performance_rows, 0) + COALESCE(cov.scope_rows, 0) + COALESCE(cov.document_page_text_rows, 0) + COALESCE(cov.opportunity_rows, 0)
    ),
    (
      'optimize',
      70,
      CASE
        WHEN COALESCE(opportunity.opportunity_rows, 0) > 0 THEN concat(opportunity.opportunity_rows::text, ' governed optimization levers are loaded.')
        ELSE 'No governed optimization levers are loaded.'
      END,
      CASE
        WHEN COALESCE(opportunity.opportunity_rows, 0) > 0 THEN concat('Use these actions in sequence: ', COALESCE(opportunity.top_actions, 'loaded opportunity rows'), '. Every row remains candidate until the required approval or finance gate closes.')
        ELSE 'Do not recommend a vendor ask until an opportunity row, evidence basis, owner, and blocker are loaded.'
      END,
      concat_ws('; ', concat(COALESCE(opportunity.opportunity_rows, 0)::text, ' opportunity rows'), concat(COALESCE(opportunity.sized_rows, 0)::text, ' sized rows'), concat(COALESCE(opportunity.signal_rows, 0)::text, ' signal-stage rows'), CASE WHEN opportunity.accountable_roles IS NOT NULL THEN concat('owners: ', opportunity.accountable_roles) END),
      CASE WHEN COALESCE(opportunity.opportunity_rows, 0) = 0 THEN 'Load opportunity rows with action type, buyer ask, evidence reference, value state, owner, and next step.' ELSE NULL END,
      COALESCE(NULLIF(opportunity.next_actions, ''), 'Work only the governed opportunity rows; keep signal-stage rows unsized.'),
      'source.contract_action_candidate_v1 and source.contract_claim_card_v1',
      COALESCE(opportunity.opportunity_rows, 0)
    )
) AS tab(tab_key, sort_order, headline, allowed_executive_statement, supporting_evidence_summary, missing_evidence_summary, action_prompt, source_basis, evidence_rows)
WHERE source.can_read_sourcing_tenant(c.tenant_key);

    $view$;

    EXECUTE 'GRANT SELECT ON source.contract_tab_intelligence_v1 TO authenticated, service_role';
    EXECUTE $comment$
      COMMENT ON VIEW source.contract_tab_intelligence_v1 IS
        'Governed load-time Contract 360 tab stories. Each tab gets an allowed executive statement, evidence basis, blocker, confidence, review state, and provenance derived from existing Source read models.'
    $comment$;
  END IF;
END $$;

COMMIT;
