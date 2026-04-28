-- ADMIN-DATA10 · admin_demo_seed
-- Apex Retail (rich tier) + Meridian Health (thin tier) demo content for the
-- 7 admin tables. Mirrors the existing fixture content in
-- src/lib/admin/connectors-readiness-view.ts and related view-models so that
-- ADMIN_DATA_MODE=live renders identical demo output once DATA11 wires the
-- live adapter.
--
-- Idempotent: every INSERT is guarded by NOT EXISTS so re-running this
-- migration is a no-op.
--
-- Arcturus is intentionally a shell-only tenant — no admin seed.
-- 'market_intelligence' and 'vendor_portal' connector kinds from the
-- view-model are normalised to the audit-spec 'other' kind, with the original
-- semantic preserved in the label/vendor copy.

BEGIN;

DO $$
DECLARE
  v_apex_id UUID;
  v_meridian_id UUID;
  v_dataset_orders_id UUID;
  v_dataset_vendors_id UUID;
BEGIN
  SELECT id INTO v_apex_id FROM clients WHERE name = 'Apex Retail' LIMIT 1;
  SELECT id INTO v_meridian_id FROM clients WHERE name ILIKE 'Meridian Health%' LIMIT 1;

  -- ----------------------------------------------------------------------
  -- Apex Retail · admin_connectors (mirrors APEX_RETAIL_CONNECTORS — 6 rows)
  -- ----------------------------------------------------------------------
  IF v_apex_id IS NOT NULL THEN

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_apex_id, 'erp', 'SAP S/4HANA (planned)', 'ERP / Finance System', 'not_configured',
      false, true,
      'ERP API credentials not provided. Data-sharing consent framework not approved.',
      'Steward requires: (1) ERP API credentials from IT Security, (2) data-sharing consent from Data Governance, (3) confirmation of which data domains are in scope. Do not configure until consent framework is approved.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_apex_id AND label = 'ERP / Finance System'
    );

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_apex_id, 'spend_analytics', NULL, 'Spend Analytics Platform', 'deferred',
      false, false,
      NULL,
      'Spend analytics connector is deferred to post-pilot. Manual spend data export is the interim workaround for the AMS BAFO analysis.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_apex_id AND label = 'Spend Analytics Platform'
    );

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_apex_id, 'contract_management', NULL, 'Contract Management System', 'configured_stub',
      true, true,
      NULL,
      'Stub connector is in place but has not been tested with live contract data. Steward requires: (1) end-to-end connectivity test, (2) contract field mapping review, (3) data classification confirmation before this connector can be trusted.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_apex_id AND label = 'Contract Management System'
    );

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_apex_id, 'other', NULL, 'Market Intelligence Feed', 'not_configured',
      false, false,
      'Market intelligence vendor subscription not procured.',
      'Market intelligence connector requires a vendor subscription and API key. Contact the procurement team to obtain subscription credentials.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_apex_id AND label = 'Market Intelligence Feed'
    );

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_apex_id, 'other', NULL, 'Vendor Portal Integration', 'deferred',
      false, true,
      NULL,
      'Vendor portal integration is deferred pending vendor onboarding process. BAFO responses are currently received via email — manual ingestion in place.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_apex_id AND label = 'Vendor Portal Integration'
    );

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_apex_id, 'identity', 'Clerk', 'Identity / SSO (Clerk)', 'configured_stub',
      true, true,
      NULL,
      'Clerk identity provider is configured for test users. Production SSO integration requires IT Security review and domain verification.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_apex_id AND label = 'Identity / SSO (Clerk)'
    );

    -- --------------------------------------------------------------------
    -- Apex Retail · admin_datasets (rich tier, 4 rows across rungs)
    -- --------------------------------------------------------------------
    INSERT INTO admin_datasets (
      client_id, slug, label, domain, rung, row_count, lineage_sources, description
    )
    SELECT v_apex_id, 'orders-raw', 'Orders (raw)', 'commerce', 'raw', 4820391,
      ARRAY['SAP S/4HANA · sales_orders'],
      'Raw order events landed from S/4HANA. No deduplication, no business filters.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_datasets WHERE client_id = v_apex_id AND slug = 'orders-raw'
    );

    INSERT INTO admin_datasets (
      client_id, slug, label, domain, rung, row_count, lineage_sources, description
    )
    SELECT v_apex_id, 'orders-verified', 'Orders (verified)', 'commerce', 'verified', 4791042,
      ARRAY['orders-raw'],
      'Deduplicated, schema-conformed orders. Awaiting steward approval for blessed rung.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_datasets WHERE client_id = v_apex_id AND slug = 'orders-verified'
    );

    INSERT INTO admin_datasets (
      client_id, slug, label, domain, rung, row_count, lineage_sources, description
    )
    SELECT v_apex_id, 'vendor-master', 'Vendor master', 'procurement', 'blessed', 1284,
      ARRAY['SAP S/4HANA · lfa1', 'Manual reconciliation'],
      'Steward-blessed vendor master. Authoritative for procurement programs.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_datasets WHERE client_id = v_apex_id AND slug = 'vendor-master'
    );

    INSERT INTO admin_datasets (
      client_id, slug, label, domain, rung, row_count, lineage_sources, description
    )
    SELECT v_apex_id, 'contract-corpus', 'Contract corpus', 'legal', 'verified', 4129,
      ARRAY['Contract Management System (stub)'],
      'Verified contracts ingested via stub connector. Live ingestion blocked.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_datasets WHERE client_id = v_apex_id AND slug = 'contract-corpus'
    );

    -- Resolve dataset ids for FK use below
    SELECT id INTO v_dataset_orders_id FROM admin_datasets
      WHERE client_id = v_apex_id AND slug = 'orders-verified' LIMIT 1;
    SELECT id INTO v_dataset_vendors_id FROM admin_datasets
      WHERE client_id = v_apex_id AND slug = 'vendor-master' LIMIT 1;

    -- --------------------------------------------------------------------
    -- Apex Retail · admin_dataset_approvals (3 rows)
    -- --------------------------------------------------------------------
    IF v_dataset_orders_id IS NOT NULL THEN
      INSERT INTO admin_dataset_approvals (
        dataset_id, client_id, from_rung, to_rung, status, reason
      )
      SELECT v_dataset_orders_id, v_apex_id, 'verified', 'blessed', 'pending',
        'Awaiting Steward review of completeness + lineage scores.'
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_dataset_approvals
        WHERE dataset_id = v_dataset_orders_id AND from_rung = 'verified' AND to_rung = 'blessed'
      );
    END IF;

    IF v_dataset_vendors_id IS NOT NULL THEN
      INSERT INTO admin_dataset_approvals (
        dataset_id, client_id, from_rung, to_rung, status, reason
      )
      SELECT v_dataset_vendors_id, v_apex_id, 'verified', 'blessed', 'approved',
        'Steward approved on 2026-04-12 after manual reconciliation pass.'
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_dataset_approvals
        WHERE dataset_id = v_dataset_vendors_id AND from_rung = 'verified' AND to_rung = 'blessed'
      );

      INSERT INTO admin_dataset_approvals (
        dataset_id, client_id, from_rung, to_rung, status, reason
      )
      SELECT v_dataset_vendors_id, v_apex_id, 'blessed', 'ground_truth', 'rejected',
        'Insufficient sample agreement vs procurement spreadsheet (78% — needs 95%).'
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_dataset_approvals
        WHERE dataset_id = v_dataset_vendors_id AND from_rung = 'blessed' AND to_rung = 'ground_truth'
      );
    END IF;

    -- --------------------------------------------------------------------
    -- Apex Retail · admin_dataset_quality (snapshots for the 4 datasets)
    -- --------------------------------------------------------------------
    INSERT INTO admin_dataset_quality (
      dataset_id, client_id, completeness, freshness, schema_conformance, lineage, sample_agreement, overall
    )
    SELECT d.id, v_apex_id, 96.4, 88.2, 99.1, 92.0, 90.5, 93.2
    FROM admin_datasets d
    WHERE d.client_id = v_apex_id AND d.slug = 'orders-verified'
      AND NOT EXISTS (
        SELECT 1 FROM admin_dataset_quality q WHERE q.dataset_id = d.id
      );

    INSERT INTO admin_dataset_quality (
      dataset_id, client_id, completeness, freshness, schema_conformance, lineage, sample_agreement, overall
    )
    SELECT d.id, v_apex_id, 99.0, 95.0, 99.5, 96.5, 95.0, 97.0
    FROM admin_datasets d
    WHERE d.client_id = v_apex_id AND d.slug = 'vendor-master'
      AND NOT EXISTS (
        SELECT 1 FROM admin_dataset_quality q WHERE q.dataset_id = d.id
      );

    INSERT INTO admin_dataset_quality (
      dataset_id, client_id, completeness, freshness, schema_conformance, lineage, sample_agreement, overall
    )
    SELECT d.id, v_apex_id, 82.0, 70.0, 88.0, 60.0, 72.0, 74.4
    FROM admin_datasets d
    WHERE d.client_id = v_apex_id AND d.slug = 'contract-corpus'
      AND NOT EXISTS (
        SELECT 1 FROM admin_dataset_quality q WHERE q.dataset_id = d.id
      );

    INSERT INTO admin_dataset_quality (
      dataset_id, client_id, completeness, freshness, schema_conformance, lineage, sample_agreement, overall
    )
    SELECT d.id, v_apex_id, 100.0, 99.0, 99.9, 88.0, 91.0, 95.5
    FROM admin_datasets d
    WHERE d.client_id = v_apex_id AND d.slug = 'orders-raw'
      AND NOT EXISTS (
        SELECT 1 FROM admin_dataset_quality q WHERE q.dataset_id = d.id
      );

    -- --------------------------------------------------------------------
    -- Apex Retail · admin_blockers (5 rows)
    -- --------------------------------------------------------------------
    INSERT INTO admin_blockers (
      client_id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps
    )
    SELECT v_apex_id,
      'ERP API credentials not provided',
      'high', 'pilot', 'open', 'steward',
      'IT Security has not released production-grade S/4HANA service-account credentials.',
      jsonb_build_array(
        'File request with IT Security · ticket SEC-4421',
        'Confirm data-sharing consent with Data Governance',
        'Validate domain scope with Procurement sponsor'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_blockers
      WHERE client_id = v_apex_id AND title = 'ERP API credentials not provided'
    );

    INSERT INTO admin_blockers (
      client_id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps
    )
    SELECT v_apex_id,
      'Contract corpus quality below blessed threshold',
      'medium', 'pilot', 'in_progress', 'steward',
      'Lineage score (60) and sample agreement (72) below blessed-rung floor of 90.',
      jsonb_build_array(
        'Run lineage backfill against Contract Management stub',
        'Manual sample reconciliation on top 50 contracts'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_blockers
      WHERE client_id = v_apex_id AND title = 'Contract corpus quality below blessed threshold'
    );

    INSERT INTO admin_blockers (
      client_id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps
    )
    SELECT v_apex_id,
      'Vendor portal integration deferred',
      'low', 'production', 'open', 'nexus',
      'Vendor onboarding workflow not codified — BAFO intake is manual via email.',
      jsonb_build_array(
        'Define vendor onboarding workflow with Procurement',
        'Stand up vendor portal connector stub'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_blockers
      WHERE client_id = v_apex_id AND title = 'Vendor portal integration deferred'
    );

    INSERT INTO admin_blockers (
      client_id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps
    )
    SELECT v_apex_id,
      'Production SSO requires domain verification',
      'medium', 'production', 'open', 'sentinel',
      'Clerk SSO is in stub mode — domain DNS verification has not been completed.',
      jsonb_build_array(
        'Add TXT record to apex-retail.com',
        'Trigger Clerk verification job'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_blockers
      WHERE client_id = v_apex_id AND title = 'Production SSO requires domain verification'
    );

    INSERT INTO admin_blockers (
      client_id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps
    )
    SELECT v_apex_id,
      'Spend analytics deferred to post-pilot',
      'low', 'pilot', 'waived', 'atlas',
      'Manual spend export accepted as interim. Re-evaluate at Phase 3 gate.',
      jsonb_build_array(
        'Schedule re-evaluation review at Phase 3 gate'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_blockers
      WHERE client_id = v_apex_id AND title = 'Spend analytics deferred to post-pilot'
    );

    -- --------------------------------------------------------------------
    -- Apex Retail · admin_audit_log (10 sample rows)
    -- --------------------------------------------------------------------
    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'auth', 'sign_in', 'Steward sign-in', '{}'::jsonb, now() - interval '1 day'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND action = 'sign_in' AND summary = 'Steward sign-in'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'connector', 'configured_stub', 'Contract Management System connector configured as stub',
      jsonb_build_object('connector_label', 'Contract Management System'), now() - interval '3 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Contract Management System connector configured as stub'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'connector', 'configured_stub', 'Identity / SSO (Clerk) connector configured as stub',
      jsonb_build_object('connector_label', 'Identity / SSO (Clerk)'), now() - interval '5 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Identity / SSO (Clerk) connector configured as stub'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'dataset', 'rung_promoted', 'Vendor master promoted verified → blessed',
      jsonb_build_object('dataset_slug', 'vendor-master', 'from_rung', 'verified', 'to_rung', 'blessed'),
      now() - interval '14 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Vendor master promoted verified → blessed'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'approval', 'rejected', 'Vendor master ground_truth approval rejected',
      jsonb_build_object('reason', 'sample agreement below threshold'),
      now() - interval '7 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Vendor master ground_truth approval rejected'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'blocker', 'opened', 'ERP API credentials blocker opened',
      jsonb_build_object('severity', 'high', 'scope', 'pilot'),
      now() - interval '21 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'ERP API credentials blocker opened'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'blocker', 'waived', 'Spend analytics blocker waived',
      jsonb_build_object('rationale', 'manual export accepted as interim'),
      now() - interval '10 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Spend analytics blocker waived'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'role_change', 'granted', 'Steward role granted to procurement lead',
      jsonb_build_object('person_email', 'procurement-lead@apex-retail.com'),
      now() - interval '30 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Steward role granted to procurement lead'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'setup_progress', 'recomputed', 'Setup progress recomputed', '{}'::jsonb,
      now() - interval '6 hours'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Setup progress recomputed'
    );

    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_apex_id, 'readiness_state', 'transitioned', 'Pilot readiness moved to partial',
      jsonb_build_object('from', 'not_ready', 'to', 'partial'),
      now() - interval '2 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_apex_id AND summary = 'Pilot readiness moved to partial'
    );

    -- --------------------------------------------------------------------
    -- Apex Retail · admin_setup_progress (6 canonical steps)
    -- --------------------------------------------------------------------
    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_apex_id, 'data_trust', 'in_progress',
      'Vendor master is blessed; orders/contracts pending steward approval.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_apex_id AND step_id = 'data_trust'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_apex_id, 'connectors', 'in_progress',
      '2 of 6 connectors configured as stubs; ERP and vendor portal still blocked or deferred.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_apex_id AND step_id = 'connectors'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_apex_id, 'users_access', 'in_progress',
      'Steward + procurement lead onboarded; production SSO awaits domain verification.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_apex_id AND step_id = 'users_access'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_apex_id, 'agent_readiness', 'pending',
      'Atlas + Sentinel postures pending blessed-rung promotions for orders dataset.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_apex_id AND step_id = 'agent_readiness'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_apex_id, 'production_readiness', 'pending',
      'Production SSO + ERP credentials gate production scope.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_apex_id AND step_id = 'production_readiness'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_apex_id, 'architecture', 'done',
      'Architecture canvas v2 reviewed and signed off by Steward + IT Architecture.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_apex_id AND step_id = 'architecture'
    );

  ELSE
    RAISE NOTICE 'Apex Retail client not found — skipping Apex admin demo seed';
  END IF;

  -- ----------------------------------------------------------------------
  -- Meridian Health · thin tier (mirrors MERIDIAN_CONNECTORS — 2 rows)
  -- ----------------------------------------------------------------------
  IF v_meridian_id IS NOT NULL THEN

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_meridian_id, 'identity', 'Clerk', 'Identity / SSO (Clerk)', 'configured_stub',
      true, true,
      NULL,
      'Clerk identity provider is configured for test users. Production SSO requires domain verification.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_meridian_id AND label = 'Identity / SSO (Clerk)'
    );

    INSERT INTO admin_connectors (
      client_id, kind, vendor, label, status,
      required_for_pilot, required_for_production,
      blocker_reason, steward_guidance
    )
    SELECT v_meridian_id, 'erp', NULL, 'ERP / Finance System', 'not_configured',
      false, true,
      'ERP API credentials not provided.',
      'ERP connector not configured. Requires IT Security approval and API credentials.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_connectors
      WHERE client_id = v_meridian_id AND label = 'ERP / Finance System'
    );

    -- One sample dataset (thin tier)
    INSERT INTO admin_datasets (
      client_id, slug, label, domain, rung, row_count, lineage_sources, description
    )
    SELECT v_meridian_id, 'portfolio-signals-raw', 'Portfolio signals (raw)', 'intelligence', 'raw', 412,
      ARRAY['portfolio_signals'],
      'Raw portfolio-signals stream sourced from the Intelligence layer.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_datasets WHERE client_id = v_meridian_id AND slug = 'portfolio-signals-raw'
    );

    -- One open blocker
    INSERT INTO admin_blockers (
      client_id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps
    )
    SELECT v_meridian_id,
      'ERP credentials not provided',
      'medium', 'production', 'open', 'steward',
      'Meridian Health IT has not issued production ERP credentials.',
      jsonb_build_array(
        'Open IT Security ticket for service-account creation'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_blockers
      WHERE client_id = v_meridian_id AND title = 'ERP credentials not provided'
    );

    -- One audit-log entry
    INSERT INTO admin_audit_log (client_id, category, action, summary, metadata, created_at)
    SELECT v_meridian_id, 'connector', 'configured_stub', 'Identity / SSO (Clerk) connector configured as stub',
      jsonb_build_object('connector_label', 'Identity / SSO (Clerk)'), now() - interval '5 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log WHERE client_id = v_meridian_id AND summary = 'Identity / SSO (Clerk) connector configured as stub'
    );

    -- Setup progress (6 canonical steps)
    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_meridian_id, 'data_trust', 'pending', 'No datasets yet promoted past raw rung.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_meridian_id AND step_id = 'data_trust'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_meridian_id, 'connectors', 'in_progress', '1 of 2 connectors configured as stub.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_meridian_id AND step_id = 'connectors'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_meridian_id, 'users_access', 'pending', 'Steward not yet assigned at Meridian.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_meridian_id AND step_id = 'users_access'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_meridian_id, 'agent_readiness', 'pending', 'Awaiting steward + connector progress.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_meridian_id AND step_id = 'agent_readiness'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_meridian_id, 'production_readiness', 'pending', 'ERP credentials gate production readiness.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_meridian_id AND step_id = 'production_readiness'
    );

    INSERT INTO admin_setup_progress (client_id, step_id, status, description)
    SELECT v_meridian_id, 'architecture', 'pending', 'Architecture canvas not yet drafted.'
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_setup_progress WHERE client_id = v_meridian_id AND step_id = 'architecture'
    );

  ELSE
    RAISE NOTICE 'Meridian Health client not found — skipping Meridian admin demo seed';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
