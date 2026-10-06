function scopedIds(ids, label) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string" || !id.trim() || id.trim() !== id)) {
    throw new Error(`Opportunity rewrite guard requires nonempty ${label}`);
  }
  if (new Set(ids).size !== ids.length) throw new Error(`Opportunity rewrite guard requires unique ${label}`);
  return ids;
}

const ACTION_CHECKS = [
  ["approval_request", `SELECT EXISTS (
    SELECT 1 FROM source.approval_request
    WHERE tenant_key = $1 AND dataset_version = $2
      AND (opportunity_id = ANY($3::text[]) OR optimization_case_id = ANY($4::text[]))
  ) AS found`],
  ["approval_decision", `SELECT EXISTS (
    SELECT 1 FROM source.approval_decision decision
    JOIN source.approval_request request
      ON request.tenant_key = decision.tenant_key
     AND request.dataset_version = decision.dataset_version
     AND request.approval_request_id = decision.approval_request_id
    WHERE decision.tenant_key = $1 AND decision.dataset_version = $2
      AND (request.opportunity_id = ANY($3::text[]) OR request.optimization_case_id = ANY($4::text[]))
  ) AS found`],
  ["negotiated_outcome", `SELECT EXISTS (
    SELECT 1 FROM source.negotiated_outcome
    WHERE tenant_key = $1 AND dataset_version = $2
      AND (opportunity_id = ANY($3::text[]) OR optimization_case_id = ANY($4::text[]))
  ) AS found`],
  ["finance_realization", `SELECT EXISTS (
    SELECT 1 FROM source.finance_realization
    WHERE tenant_key = $1 AND dataset_version = $2
      AND (opportunity_id = ANY($3::text[]) OR optimization_case_id = ANY($4::text[]))
  ) AS found`],
  ["reviewed_claim", `SELECT EXISTS (
    SELECT 1 FROM source.opportunity_claim
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND (review_status <> 'draft' OR reviewer_ref IS NOT NULL
           OR reviewed_at IS NOT NULL OR produced_by = 'human_reviewer')
  ) AS found`],
  ["reviewed_evidence", `SELECT EXISTS (
    SELECT 1 FROM source.opportunity_evidence
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND review_state IS DISTINCT FROM 'system_evidenced'
  ) AS found`],
  ["stage_history", `SELECT EXISTS (
    SELECT 1 FROM source.opportunity_stage_event
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
  ) AS found`],
  ["selected_action", `SELECT EXISTS (
    SELECT 1 FROM source.case_opportunity
    WHERE tenant_key = $1 AND dataset_version = $2
      AND (opportunity_id = ANY($3::text[]) OR optimization_case_id = ANY($4::text[]))
      AND (selected_for_action OR payload <> '{}'::jsonb)
  ) AS found`],
  ["case_progress", `SELECT EXISTS (
    SELECT 1 FROM source.optimization_case
    WHERE tenant_key = $1 AND dataset_version = $2 AND optimization_case_id = ANY($4::text[])
      AND (case_state <> 'evidence_review' OR door1_event_id IS NOT NULL
           OR payload <> '{"synthetic_policy":"synthetic_demo_only_not_client_truth"}'::jsonb)
  ) AS found`],
  ["opportunity_progress", `SELECT EXISTS (
    SELECT 1 FROM source.optimization_opportunity
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND (stage <> 'signal' OR approval_state <> 'requires_sizing'
           OR payload->>'finance_confirmation_state' IS DISTINCT FROM 'not_confirmed')
  ) AS found`],
  ["valuation_progress", `SELECT EXISTS (
    SELECT 1 FROM source.opportunity_valuation
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND (valuation_type <> 'potential' OR valuation_state <> 'not_sized'
           OR amount_usd IS NOT NULL OR amount_low_usd IS NOT NULL OR amount_high_usd IS NOT NULL)
  ) AS found`],
  ["calculation_progress", `SELECT EXISTS (
    SELECT 1 FROM source.calculation_run
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND (run_state <> 'blocked' OR rule_id <> 'source.cloud_consumption_package.opportunity.v1')
  ) AS found`],
  ["calculation_review", `SELECT EXISTS (
    SELECT 1 FROM source.calculation_input
    WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($5::text[])
      AND inclusion_state <> 'pending_review'
  ) AS found`],
  ["calculation_output_value", `SELECT EXISTS (
    SELECT 1 FROM source.calculation_output
    WHERE tenant_key = $1 AND dataset_version = $2 AND calculation_run_id = ANY($5::text[])
      AND (amount_usd IS NOT NULL OR payload <> '{}'::jsonb)
  ) AS found`],
  ["baseline_review", `SELECT EXISTS (
    SELECT 1 FROM source.optimization_baseline
    WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($6::text[])
      AND (baseline_state <> 'ready'
           OR payload <> '{"synthetic_policy":"synthetic_demo_only_not_client_truth"}'::jsonb)
  ) AS found`],
  ["requirement_annotation", `SELECT EXISTS (
    SELECT 1 FROM source.evidence_requirement
    WHERE tenant_key = $1 AND dataset_version = $2
      AND requirement_id = ANY($7::text[]) AND payload <> '{}'::jsonb
  ) AS found`],
  ["evidence_request_progress", `SELECT EXISTS (
    SELECT 1 FROM source.evidence_request
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND (request_state <> 'open' OR payload <> '{}'::jsonb)
  ) AS found`],
  ["requirement_review", `SELECT EXISTS (
    SELECT 1 FROM source.opportunity_requirement_status
    WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])
      AND (status <> 'workflow_required' OR payload <> '{}'::jsonb)
  ) AS found`],
  ["overlap_link", `SELECT EXISTS (
    SELECT 1 FROM source.opportunity_overlap
    WHERE tenant_key = $1 AND dataset_version = $2
      AND (opportunity_id = ANY($3::text[]) OR overlaps_opportunity_id = ANY($3::text[]))
  ) AS found`],
  ["contract_decision", `SELECT EXISTS (
    SELECT 1 FROM source.contract_optimization_decision_record
    WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($6::text[])
      AND (door1_event_id IS NOT NULL OR optimization_state = 'VALUE_CONFIRMED'
           OR realized_value IS NOT NULL)
  ) AS found`],
];

const SCOPE_BINDINGS = `WITH guard_scope AS (
  SELECT $1::text AS tenant_key, $2::text AS dataset_version,
         $3::text[] AS opportunity_ids, $4::text[] AS case_ids,
         $5::text[] AS calculation_run_ids, $6::text[] AS contract_ids,
         $7::text[] AS requirement_ids
)`;

export async function assertOpportunityRewriteSafe(client, scope) {
  const tenantKey = scope?.tenantKey;
  const datasetVersion = scope?.datasetVersion;
  if (typeof tenantKey !== "string" || !tenantKey.trim() || tenantKey.trim() !== tenantKey ||
      typeof datasetVersion !== "string" || !datasetVersion.trim() || datasetVersion.trim() !== datasetVersion) {
    throw new Error("Opportunity rewrite guard requires an exact tenant and dataset version");
  }
  const opportunityIds = scopedIds(scope.opportunityIds, "opportunity IDs");
  const caseIds = scopedIds(scope.caseIds, "case IDs");
  const calculationRunIds = scopedIds(scope.calculationRunIds, "calculation run IDs");
  const contractIds = scopedIds(scope.contractIds, "contract IDs");
  const requirementIds = scopedIds(scope.requirementIds, "requirement IDs");

  // SET LOCAL must take effect inside the caller's write transaction. Reject a
  // filtered role even if its visible result happens to contain no action rows.
  await client.query("SET LOCAL row_security = off");
  const access = await client.query(`SELECT current_setting('row_security') AS row_security,
    COALESCE((SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user), false) AS unfiltered`);
  if (access.rows.length !== 1 || access.rows[0].row_security !== "off" || access.rows[0].unfiltered !== true) {
    throw new Error("Opportunity rewrite guard requires an unfiltered database role in a transaction");
  }

  const params = [tenantKey, datasetVersion, opportunityIds, caseIds, calculationRunIds, contractIds, requirementIds];
  for (const [reason, sql] of ACTION_CHECKS) {
    const result = await client.query(`${SCOPE_BINDINGS}\n${sql}`, params);
    if (result.rows.length !== 1 || typeof result.rows[0].found !== "boolean") {
      throw new Error(`Opportunity rewrite guard could not verify ${reason}`);
    }
    if (result.rows[0].found) {
      throw new Error(`Opportunity rewrite refused: ${reason} exists for the selected writer scope`);
    }
  }
}

export async function preflightOpportunityRewrite(client, scope) {
  await client.query("BEGIN READ ONLY");
  try {
    await assertOpportunityRewriteSafe(client, scope);
  } finally {
    await client.query("ROLLBACK");
  }
}
