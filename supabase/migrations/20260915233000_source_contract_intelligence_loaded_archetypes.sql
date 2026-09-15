-- Keep Contract 360 identity and authored guidance aligned with the active
-- canonical contract. Package-specific archetype aliases normalize to the
-- approved playbook; they never fall through to generic guidance merely
-- because the source vocabulary is more specific than the playbook key.

BEGIN;

DO $$
BEGIN
  IF to_regclass('source.contract_intelligence_v2') IS NOT NULL
     AND to_regclass('source.contract_intelligence_v1') IS NOT NULL
     AND to_regclass('source.contract') IS NOT NULL
     AND to_regclass('source.contract_360') IS NOT NULL
     AND to_regclass('source.contract_archetype_playbook') IS NOT NULL
  THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW source.contract_intelligence_v2 AS
      WITH contract_mapping AS (
        SELECT
          c.tenant_key,
          c.contract_id,
          c.vendor_ref,
          c.vendor_name,
          c.contract_name,
          c.load_run_id,
          coalesce(
            nullif(canonical.raw_payload ->> 'contract_archetype', ''),
            nullif(canonical.raw_payload ->> 'archetype', '')
          ) AS raw_archetype,
          nullif(to_jsonb(c)->>'purpose_summary', '') AS purpose_summary
        FROM source.contract_360 c
        LEFT JOIN source.contract canonical
          ON canonical.tenant_key = c.tenant_key
         AND canonical.contract_id = c.contract_id
         AND canonical.load_run_id = c.load_run_id
      ),
      normalized AS (
        SELECT
          m.*,
          CASE
            WHEN m.raw_archetype IN (
              'cloud_consumption',
              'cloud_consumption_commit',
              'consumption_commit',
              'cloud_data_platform_subscription'
            ) THEN 'cloud_consumption'
            WHEN m.raw_archetype IN (
              'managed_services',
              'legacy_analytics_managed_services'
            ) THEN 'managed_services'
            WHEN m.raw_archetype IN (
              'application_managed_services',
              'infra_service_desk_managed_services',
              'productivity_platform',
              'crm_saas',
              'saas_subscription'
            ) THEN m.raw_archetype
            ELSE 'unmapped'
          END AS playbook_key
        FROM contract_mapping m
      ),
      mapped AS (
        SELECT
          n.*,
          p.archetype_label,
          p.industry_key,
          p.review_status AS playbook_status,
          p.headline,
          p.body,
          p.track_question,
          p.track_guidance,
          p.load_question,
          p.load_guidance,
          p.observe_question,
          p.observe_guidance,
          p.required_evidence_json,
          p.industry_context_json
        FROM normalized n
        JOIN source.contract_archetype_playbook p
          ON p.archetype_key = n.playbook_key
      )
      SELECT
        base.tenant_key,
        base.contract_id,
        mapped.vendor_ref,
        mapped.vendor_name,
        mapped.contract_name,
        mapped.playbook_key AS archetype_key,
        mapped.archetype_label,
        mapped.industry_key,
        mapped.playbook_status AS playbook_review_status,
        base.review_status,
        coalesce(base.intelligence_record, '{}'::jsonb)
        || jsonb_build_object(
          'vendorName', mapped.vendor_name,
          'contractName', mapped.contract_name,
          'archetype', coalesce(mapped.raw_archetype, 'unmapped'),
          'contract',
          coalesce(base.intelligence_record->'contract', '{}'::jsonb)
          || jsonb_build_object(
            'vendorId', mapped.vendor_ref,
            'vendorName', mapped.vendor_name,
            'title', mapped.contract_name,
            'archetypeKey', mapped.playbook_key,
            'archetypeLabel', mapped.archetype_label,
            'archetypeSourceBasis', CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unmapped' ELSE 'document_declared' END,
            'archetypeConfidence', CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unverified' ELSE 'high' END,
            'vendor_id', mapped.vendor_ref,
            'vendor_name', mapped.vendor_name,
            'archetype_key', mapped.playbook_key,
            'archetype_label', mapped.archetype_label,
            'archetype_source_basis', CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unmapped' ELSE 'document_declared' END,
            'archetype_confidence', CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unverified' ELSE 'high' END
          ),
          'story',
          coalesce(base.intelligence_record->'story', '{}'::jsonb)
          || jsonb_build_object(
            'purpose', CASE WHEN mapped.purpose_summary IS NULL THEN 'null'::jsonb ELSE to_jsonb(mapped.purpose_summary) END
          ),
          'education',
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
          'industry_intelligence',
          jsonb_build_object(
            'state', 'missing_benchmark',
            'industry_key', mapped.industry_key,
            'context', mapped.industry_context_json,
            'benchmark_sources', '[]'::jsonb,
            'allowed_uses', jsonb_build_array('select the authored archetype playbook', 'frame contract-specific questions'),
            'blocked_claims', jsonb_build_array('market percentile', 'industry discount range', 'external rate benchmark')
          )
        ) AS intelligence_record,
        jsonb_set(
          coalesce(base.provenance, '{}'::jsonb),
          '{archetype_mapping}',
          jsonb_build_object(
            'key', mapped.playbook_key,
            'declared_key', mapped.raw_archetype,
            'basis', CASE WHEN mapped.playbook_key = 'unmapped' THEN 'unmapped' ELSE 'explicit_contract_mapping' END,
            'source_ref', CASE WHEN mapped.playbook_key = 'unmapped' THEN NULL ELSE mapped.contract_id END,
            'source_field', CASE WHEN mapped.raw_archetype IS NULL THEN NULL ELSE 'source.contract.raw_payload.archetype' END,
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
    EXECUTE 'COMMENT ON VIEW source.contract_intelligence_v2 IS ''Hardened contract intelligence projection. Active canonical identity and declared archetype aliases select approved playbooks; vendor category cannot classify a contract.''';
  END IF;
END $$;

COMMIT;
