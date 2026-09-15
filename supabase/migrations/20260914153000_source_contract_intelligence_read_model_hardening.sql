-- Harden the contract-intelligence read model.
-- Archetype identity is explicit only. A vendor category is descriptive
-- context, not permission to classify a contract or select negotiation plays.

BEGIN;

DO $$
BEGIN
  IF to_regclass('source.contract_intelligence_v1') IS NOT NULL
     AND to_regclass('source.contract_360') IS NOT NULL
     AND to_regclass('source.contract_archetype_playbook') IS NOT NULL
  THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW source.contract_intelligence_v2 AS
      WITH contract_mapping AS (
        SELECT
          c.tenant_key,
          c.contract_id,
          coalesce(
            nullif(to_jsonb(c)->>'contract_archetype', ''),
            nullif(to_jsonb(c)->>'archetype', ''),
            'unmapped'
          ) AS declared_archetype_key,
          nullif(to_jsonb(c)->>'purpose_summary', '') AS purpose_summary,
          c.contract_name,
          c.load_run_id
        FROM source.contract_360 c
      ),
      normalized AS (
        SELECT
          m.*,
          CASE
            WHEN m.declared_archetype_key IN (
              'cloud_consumption', 'managed_services', 'saas_subscription',
              'productivity_platform', 'crm_saas',
              'application_managed_services',
              'infra_service_desk_managed_services', 'unmapped'
            ) THEN m.declared_archetype_key
            ELSE 'unmapped'
          END AS playbook_key
        FROM contract_mapping m
      ),
      mapped AS (
        SELECT n.*, p.archetype_label, p.industry_key, p.review_status AS playbook_status,
          p.headline, p.body, p.track_question, p.track_guidance,
          p.load_question, p.load_guidance, p.observe_question, p.observe_guidance,
          p.required_evidence_json, p.industry_context_json
        FROM normalized n
        JOIN source.contract_archetype_playbook p
          ON p.archetype_key = n.playbook_key
      )
      SELECT
        base.tenant_key,
        base.contract_id,
        base.vendor_ref,
        base.vendor_name,
        base.contract_name,
        mapped.playbook_key AS archetype_key,
        mapped.archetype_label,
        mapped.industry_key,
        mapped.playbook_status AS playbook_review_status,
        base.review_status,
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    base.intelligence_record,
                    '{contract,archetype_key}', to_jsonb(mapped.playbook_key), true
                  ),
                  '{contract,archetype_label}', to_jsonb(mapped.archetype_label), true
                ),
                '{contract,archetype_source_basis}',
                to_jsonb(CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unmapped' ELSE 'explicit_contract_mapping' END), true
              ),
              '{contract,archetype_confidence}',
              to_jsonb(CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unverified' ELSE 'high' END), true
            ),
            '{story,purpose}',
            CASE WHEN mapped.purpose_summary IS NULL THEN 'null'::jsonb ELSE to_jsonb(mapped.purpose_summary) END,
            true
            ),
            '{education}',
          jsonb_build_object(
            'archetype_key', mapped.playbook_key,
            'archetype_label', mapped.archetype_label,
            'headline', mapped.headline,
            'body', mapped.body,
            'track', jsonb_build_object('question', mapped.track_question, 'guidance', mapped.track_guidance, 'state', base.intelligence_record->'education'->'track'->>'state'),
            'load', jsonb_build_object('question', mapped.load_question, 'guidance', mapped.load_guidance, 'state', base.intelligence_record->'education'->'load'->>'state'),
            'observe', jsonb_build_object('question', mapped.observe_question, 'guidance', mapped.observe_guidance, 'state', base.intelligence_record->'education'->'observe'->>'state'),
            'required_evidence', mapped.required_evidence_json
          ),
            true
          ),
          '{industry_intelligence}',
          jsonb_build_object(
            'state', 'missing_benchmark',
            'industry_key', mapped.industry_key,
            'context', mapped.industry_context_json,
            'benchmark_sources', '[]'::jsonb,
            'allowed_uses', jsonb_build_array('select the authored archetype playbook', 'frame contract-specific questions'),
            'blocked_claims', jsonb_build_array('market percentile', 'industry discount range', 'external rate benchmark')
          ),
          true
        ) AS intelligence_record,
        jsonb_set(
          coalesce(base.provenance, '{}'::jsonb),
          '{archetype_mapping}',
          jsonb_build_object(
            'key', mapped.playbook_key,
            'basis', CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unmapped' ELSE 'explicit_contract_mapping' END,
            'source_ref', CASE WHEN mapped.playbook_key = 'unmapped' THEN NULL ELSE mapped.contract_id END,
            'review_status', mapped.playbook_status
          ),
          true
        ) AS provenance,
        base.derived_from_load_run_id
      FROM source.contract_intelligence_v1 base
      JOIN mapped
        ON mapped.tenant_key = base.tenant_key
       AND mapped.contract_id = base.contract_id
      WHERE source.can_read_sourcing_tenant(base.tenant_key);
    $view$;

    EXECUTE 'GRANT SELECT ON source.contract_intelligence_v2 TO authenticated, service_role';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('source.contract_intelligence_v2') IS NOT NULL THEN
    COMMENT ON VIEW source.contract_intelligence_v2 IS
      'Hardened contract intelligence projection. Explicit archetype mapping only; missing purpose remains null; v1 remains for rollback.';
  END IF;
END $$;

COMMIT;
