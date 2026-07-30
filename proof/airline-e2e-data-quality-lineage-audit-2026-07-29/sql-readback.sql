-- airline-demo-new data-quality / lineage audit — read-only SQL readback
-- Audit date: 2026-07-29
--
-- IMPORTANT: Direct Postgres access from this audit environment was UNREACHABLE.
--   pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com does not resolve from this shell
--   (private-DNS/VNet-only, confirmed via a Python socket.connect DNS resolution failure).
--   `az containerapp list --resource-group rg-abarva-airdn-lab-eus2-001` returned an EMPTY list —
--   there are no standing Container Apps to `az containerapp exec` into; only ACA *Jobs*
--   (job-airdn-*) exist, which run on-demand and would require triggering a new job execution.
--   Triggering a job execution is a mutating/code-running action and is explicitly out of scope
--   for this read-only audit, so the break-glass `az containerapp exec` path was NOT available
--   and was NOT used.
--
-- Every query below is one of two kinds, marked individually:
--   [ACTUALLY RUN <date>, evidence: <path>]  -- copied verbatim from a raw execution log already
--       checked into the repo (produced by a prior, different operator run of the governed ACA
--       job pipeline), with its captured output quoted in a comment below the query.
--   [NOT RUN — provided for an operator with live DB access]  -- written from table/column names
--       observed in the diagnostic SQL fragments and job contracts checked into the repo; schema
--       for `working.*`, `knowledge.*`, `publication.*` is INFERRED from those fragments, not from
--       a live information_schema query, so column names may not be exact. Treat as a starting
--       point, not a guaranteed-correct query.

-- =====================================================================================
-- SECTION 1 — queries ACTUALLY RUN by a prior operator (raw output captured in-repo)
-- =====================================================================================

-- [ACTUALLY RUN 2026-07-28T00:24Z, evidence:
--   clients/airline-demo-new/21-processing-wave-execution/06-knowledge-validate/
--   knowledge-validate-sql-diagnostic-20260728-logs.txt (worktree nexus-tenant-sunset-20260729)]
-- Combined validation query — cross-tenant leakage, broken relationship endpoints, hidden-truth
-- leakage into parser-visible working tables, invalid required IDs, silent source skips.
WITH parser_visible AS (
  SELECT count(*)::int AS count
  FROM source_registry.source
  WHERE tenant_key='airline-demo-new'
    AND source_visibility='client_visible'
    AND source_basis <> 'restricted_evaluator'
    AND metadata->>'releaseId' = 'airline-demo-new-source-corpus-v1.0.0'
),
parsed AS (
  SELECT count(*)::int AS count
  FROM audit.lineage_event
  WHERE tenant_key='airline-demo-new'
    AND lineage_ref LIKE 'parse:%'
    AND event_payload->>'terminalState' IN ('parsed','parsed_with_warnings','not_applicable')
),
hidden AS (
  SELECT (
    SELECT count(*) FROM working.entity_candidate WHERE tenant_key='airline-demo-new'
      AND candidate_payload::text ~* '(restricted[_ -]?evaluator|evaluator[_ -]?only|hidden[_ -]?truth|hidden[_ -]?canonical|not[_ -]?parser[_ -]?visible)'
  ) + (
    SELECT count(*) FROM working.fact_candidate WHERE tenant_key='airline-demo-new'
      AND fact_value::text ~* '(restricted[_ -]?evaluator|evaluator[_ -]?only|hidden[_ -]?truth|hidden[_ -]?canonical|not[_ -]?parser[_ -]?visible)'
  ) + (
    SELECT count(*) FROM working.relationship_candidate WHERE tenant_key='airline-demo-new'
      AND array_to_string(evidence_refs, ',') ~* '(restricted[_ -]?evaluator|evaluator[_ -]?only|hidden[_ -]?truth|hidden[_ -]?canonical|not[_ -]?parser[_ -]?visible)'
  ) AS count
),
invalid_ids AS (
  SELECT (
    SELECT count(*) FROM working.entity_candidate WHERE tenant_key='airline-demo-new' AND (candidate_ref='' OR display_name='')
  ) + (
    SELECT count(*) FROM working.fact_candidate WHERE tenant_key='airline-demo-new' AND candidate_ref=''
  ) + (
    SELECT count(*) FROM working.relationship_candidate WHERE tenant_key='airline-demo-new' AND (candidate_ref='' OR from_candidate_ref='' OR to_candidate_ref='')
  ) AS count
),
broken_rels AS (
  SELECT count(*)::int AS count
  FROM working.relationship_candidate
  WHERE tenant_key='airline-demo-new'
    AND (from_candidate_ref IS NULL OR to_candidate_ref IS NULL OR from_candidate_ref = to_candidate_ref)
)
SELECT
  0::int AS "crossTenantRecords",
  (SELECT count FROM broken_rels)::int AS "brokenRequiredRelationshipEndpoints",
  (SELECT count FROM hidden)::int AS "hiddenTruthReferences",
  (SELECT count FROM invalid_ids)::int AS "invalidRequiredIds",
  greatest((SELECT count FROM parser_visible) - (SELECT count FROM parsed), 0)::int AS "silentSourceSkips",
  0::int AS conflicts;
-- CAPTURED OUTPUT (2026-07-28T00:24Z): parser_visible=25, parsed=25, hidden_entity=0,
--   hidden_fact=0, hidden_relationship=0, invalid_ids=0, broken_relationships=0.
--   Combined row: crossTenantRecords=0, brokenRequiredRelationshipEndpoints=0,
--   hiddenTruthReferences=0, invalidRequiredIds=0, silentSourceSkips=0, conflicts=0.
--   This is real, dated, raw evidence (not a self-reported summary) and is the strongest
--   verified-clean result in this audit.

-- [ACTUALLY RUN 2026-07-28T00:45Z, evidence:
--   clients/airline-demo-new/21-processing-wave-execution/07-knowledge-review/
--   knowledge-review-decision-ledger-diagnostic-20260728-logs.txt]
-- Review decision ledger counts by state, and candidate counts awaiting review.
-- (Illustrative reconstruction of the two diagnostic queries actually executed that day —
--  exact SELECT text was not fully captured in the log excerpt read, only its tabular output.)
SELECT review_state, count(*) AS decisions
FROM working.review_decision_ledger   -- table name inferred from job/stage naming; unverified
WHERE tenant_key = 'airline-demo-new'
GROUP BY review_state;
-- CAPTURED OUTPUT (2026-07-28T00:45Z): (0 rows) — the review-decision ledger was EMPTY at this
--   timestamp. This was BEFORE any successful review-apply run (the one execution log we do
--   have for the apply stage that day, knowledge-review-via-validate-job-20260728-logs.txt,
--   status="failed_process", error.code="process_verification_failed",
--   details.blockers=["no_explicit_accepted_review_decisions"]).

SELECT candidate_table, count(*) AS candidates FROM (
  SELECT 'relationship_candidate' AS candidate_table, count(*) FROM working.relationship_candidate WHERE tenant_key='airline-demo-new'
  UNION ALL
  SELECT 'fact_candidate', count(*) FROM working.fact_candidate WHERE tenant_key='airline-demo-new'
  UNION ALL
  SELECT 'entity_candidate', count(*) FROM working.entity_candidate WHERE tenant_key='airline-demo-new'
) t GROUP BY candidate_table;
-- CAPTURED OUTPUT (2026-07-28T00:45Z): relationship_candidate=66200, fact_candidate=99015,
--   entity_candidate=99015. Total candidates = 264,230, which equals
--   112,201 (accepted) + 152,029 (deferred) + 0 (rejected) from the LATER 2026-07-29 closure
--   record exactly — internally consistent, but note the closure record's per-type accepted/
--   deferred split was never captured in any raw log this audit could find in the repository.

-- =====================================================================================
-- SECTION 2 — queries NOT run in this audit; provided for an operator with live DB access
-- =====================================================================================

-- 2.1 Per-type accepted/deferred/rejected breakdown — the single most important query to close
--     SD-10 (control totals corroborated by only one self-reported summary record). Running this
--     would let an operator confirm 112,201/152,029/0 is real and see the entity/fact/relationship
--     split that is currently missing from every checked-in artifact.
-- [NOT RUN — schema inferred, column/table names unverified against live information_schema]
SELECT candidate_type, review_state, count(*) AS decisions
FROM working.review_decision_ledger
WHERE tenant_key = 'airline-demo-new'
GROUP BY candidate_type, review_state
ORDER BY candidate_type, review_state;

-- 2.2 Reconcile accepted entity candidates against published canonical entities (why did 99,015
--     entity_candidate rows resolve to only 34,534 relationship_node_v1 rows?).
-- [NOT RUN]
SELECT
  (SELECT count(*) FROM working.entity_candidate WHERE tenant_key='airline-demo-new' AND review_state='accepted') AS accepted_entity_candidates,
  (SELECT count(*) FROM knowledge.entity WHERE tenant_key='airline-demo-new') AS canonical_entities,
  (SELECT count(*) FROM consumption.relationship_node_v1 WHERE tenant_key='airline-demo-new') AS projected_nodes;

-- 2.3 Confirm the grain of vendor_contract_inventory_v1 (SD-07): is it one row per vendor, or
--     per vendor-contract pair? If per-vendor, does the payload nest contract_state/renewal data?
-- [NOT RUN]
SELECT vendor_ref, jsonb_array_length(coalesce(payload->'contracts','[]'::jsonb)) AS nested_contract_count
FROM consumption.vendor_contract_inventory_v1
WHERE tenant_key = 'airline-demo-new'
ORDER BY nested_contract_count DESC
LIMIT 20;

-- 2.4 Confirm whether data_product_inventory_v1 and technology_estate_v1 (both absent from
--     CONSUMPTION_PROJECTION_REGISTRY.json — SD-04) are real distinct tables or views, and what
--     populates them.
-- [NOT RUN]
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'consumption'
  AND table_name IN ('data_product_inventory_v1','technology_estate_v1','metric_catalog_v1','metric_observation_v1','module_knowledge_packet_v1')
ORDER BY table_name;

SELECT * FROM consumption.data_product_inventory_v1 WHERE tenant_key='airline-demo-new' LIMIT 5;
SELECT * FROM consumption.technology_estate_v1 WHERE tenant_key='airline-demo-new' LIMIT 5;

-- 2.5 Confirm evidence_gap_v1 emptiness (SD-05): did risk-register.csv rows ever reach
--     working.entity_candidate / knowledge.risk at all, or did they fail earlier in the pipeline?
-- [NOT RUN]
SELECT count(*) FROM working.entity_candidate
WHERE tenant_key='airline-demo-new' AND candidate_payload->>'sourceObjectType' = 'risk';

SELECT count(*) FROM knowledge.risk WHERE tenant_key='airline-demo-new';
SELECT count(*) FROM governance.evidence_gap WHERE tenant_key='airline-demo-new';
SELECT count(*) FROM consumption.evidence_gap_v1 WHERE tenant_key='airline-demo-new';

-- 2.6 Confirm KPI family fate (SD-06): did kpi-sla-catalog.csv rows reach working candidates,
--     and if so at what stage were they dropped before metrics.metric_definition?
-- [NOT RUN]
SELECT count(*) FROM working.fact_candidate
WHERE tenant_key='airline-demo-new' AND fact_value->>'sourceObjectType' = 'kpi';

SELECT count(*) FROM metrics.metric_definition WHERE tenant_key='airline-demo-new';
SELECT count(*) FROM metrics.metric_observation WHERE tenant_key='airline-demo-new';
SELECT count(*) FROM consumption.metric_observation_v1 WHERE tenant_key='airline-demo-new';
SELECT count(*) FROM consumption.metric_catalog_v1 WHERE tenant_key='airline-demo-new';

-- 2.7 Capability-origin relationship review state (SD-08): were the 3000 capability-origin
--     relationship rows accepted or deferred? If accepted, they are unbacked graph nodes in
--     production.
-- [NOT RUN]
SELECT review_state, count(*)
FROM working.relationship_candidate
WHERE tenant_key='airline-demo-new' AND from_object_type = 'capability'
GROUP BY review_state;

-- 2.8 Full per-item lineage crosswalk (the ideal query this audit could not produce because no
--     per-row lineage export exists in the repo for the operational-landing families — see
--     "Item-level lineage coverage" in the main report). If working/knowledge/publication tables
--     carry a stable source_row_ref or equivalent, this is the query that would make the
--     lineage.csv in this proof bundle exhaustive instead of a 20-item representative sample.
-- [NOT RUN — most speculative query in this file; source_row_ref column existence unverified]
SELECT
  sr.source_file_path, sr.source_file_hash, ec.source_row_ref, ec.candidate_ref, ec.review_state,
  ke.entity_id AS canonical_object_id, pr.publication_ref, pb.baseline_ref,
  cp.projection_name, cp.row_id AS projection_row_id
FROM source_registry.source sr
JOIN working.entity_candidate ec ON ec.source_id = sr.source_id
LEFT JOIN knowledge.entity ke ON ke.resolved_from_candidate_ref = ec.candidate_ref
LEFT JOIN publication.domain_publication pr ON pr.tenant_key = sr.tenant_key
LEFT JOIN publication.knowledge_baseline pb ON pb.tenant_key = sr.tenant_key AND pb.active = true
LEFT JOIN consumption.relationship_node_v1 cp ON cp.tenant_key = sr.tenant_key
WHERE sr.tenant_key = 'airline-demo-new'
LIMIT 200;

-- 2.9 Metric-parity script found checked in at repo root (main checkout, NOT this worktree):
--   /Users/anand/Projects/nexus/tmp-airline-metric-parity-current-20260728.yaml
--   This is an ACA job manifest for `npx tsx scripts/knowledge/consumption-metric-parity.ts
--   --tenant airline-demo-new --apply`. NOTE: this script takes an `--apply` flag, meaning its
--   default/only documented invocation in that manifest is NOT read-only — it was NOT run as
--   part of this audit and must not be run under this audit's read-only mandate without
--   confirming a read-only/dry-run mode exists.
