-- migration:destructive-allowed
-- P18-A deliberately drops/recreates only the tech_stack_items status CHECK
-- constraint so SAP ECC can be represented as mature_with_debt. No data,
-- table, schema, or column is dropped.

BEGIN;

ALTER TABLE public.tech_stack_items
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_initiatives
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.tech_stack_items'::regclass
      AND conname = 'tech_stack_items_status_check'
  ) THEN
    ALTER TABLE public.tech_stack_items DROP CONSTRAINT tech_stack_items_status_check;
  END IF;
END $$;

ALTER TABLE public.tech_stack_items
  ADD CONSTRAINT tech_stack_items_status_check
  CHECK (status IN ('active','in_procurement','sunsetting','terminated','mature_with_debt'));

DO $$
DECLARE
  v_apex_id UUID;
  v_old_client JSONB;
  v_new_client JSONB;
  v_sap_id UUID;
  v_old_sap JSONB;
  v_new_sap JSONB;
  v_initiative_old JSONB;
  v_initiative_new JSONB;
BEGIN
  SELECT id INTO v_apex_id
  FROM public.clients
  WHERE tenant_key IN ('apex-retail', 'apexretail')
     OR slug IN ('apex-retail', 'apexretail')
     OR name ILIKE '%Apex Retail%'
  ORDER BY CASE WHEN tenant_key = 'apex-retail' THEN 0 WHEN tenant_key = 'apexretail' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_apex_id IS NULL THEN
    RAISE EXCEPTION 'Packet 18 Apex truth reconciliation blocked: Apex client row not found.';
  END IF;

  SELECT to_jsonb(c) INTO v_old_client
  FROM public.clients c
  WHERE c.id = v_apex_id;

  UPDATE public.clients
  SET annual_revenue_usd = 24800000000,
      employee_count = 96000,
      it_budget_usd = 545000000,
      operational_units = 480,
      business_description = 'Fictional specialty retailer used as AbarVa''s richest synthetic enterprise tenant: $24.8B revenue, 480 stores across 42 states, 96,000 employees, and a $545M IT budget.',
      updated_at = now()
  WHERE id = v_apex_id
    AND (
      annual_revenue_usd IS DISTINCT FROM 24800000000
      OR employee_count IS DISTINCT FROM 96000
      OR it_budget_usd IS DISTINCT FROM 545000000
      OR operational_units IS DISTINCT FROM 480
      OR business_description IS DISTINCT FROM 'Fictional specialty retailer used as AbarVa''s richest synthetic enterprise tenant: $24.8B revenue, 480 stores across 42 states, 96,000 employees, and a $545M IT budget.'
    );

  SELECT to_jsonb(c) INTO v_new_client
  FROM public.clients c
  WHERE c.id = v_apex_id;

  INSERT INTO public.admin_audit_log (
    client_id, category, action, target_kind, target_id, summary, metadata
  )
  SELECT
    v_apex_id,
    'dataset',
    'packet18.apex.client_profile_reconciled',
    'clients',
    v_apex_id,
    'Packet 18 reconciled the Apex client profile to the approved $24.8B / 480 stores / 96,000 employees / $545M IT budget anchor.',
    jsonb_build_object(
      'actor', 'packet-18-bootstrap',
      'rationale', 'P18 requires Apex to be the richest synthetic enterprise tenant and to converge from older seed values during fresh migration replay.',
      'old_value', v_old_client,
      'new_value', v_new_client
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE client_id = v_apex_id
      AND action = 'packet18.apex.client_profile_reconciled'
      AND target_id = v_apex_id
  );

  SELECT id, to_jsonb(t) INTO v_sap_id, v_old_sap
  FROM public.tech_stack_items t
  WHERE t.client_id = v_apex_id
    AND lower(t.vendor_name) = 'sap'
  ORDER BY t.annual_spend_usd DESC NULLS LAST, t.created_at ASC
  LIMIT 1;

  IF v_sap_id IS NULL THEN
    INSERT INTO public.tech_stack_items (
      client_id,
      category,
      vendor_name,
      product_name,
      deployment_model,
      annual_spend_usd,
      owning_function,
      touches_ai,
      status,
      notes,
      is_demo_data,
      metadata
    ) VALUES (
      v_apex_id,
      'business_app',
      'SAP',
      'SAP ECC 6.0',
      'on_prem',
      22000000,
      'Enterprise Apps',
      false,
      'mature_with_debt',
      'Packet 18 bootstrap: current Apex ERP platform is SAP ECC 6.0; S/4HANA/RISE/Dynamics/Workday decision is pending.',
      true,
      jsonb_build_object(
        'age_years', 14,
        'customizations', 8400,
        'support_path', 'Extended Maintenance to 2030',
        'migration_decision_pending', true,
        'future_decision_move_id', 'APX-ERP-FUTURE-2027',
        'reconciled_by', 'packet-18-bootstrap',
        'reconciled_at', now(),
        'seeded_because_missing', true
      )
    )
    RETURNING id INTO v_sap_id;
  END IF;

  UPDATE public.tech_stack_items
  SET product_name = 'SAP ECC 6.0',
      status = 'mature_with_debt',
      annual_spend_usd = 22000000,
      notes = concat_ws(E'\n',
        NULLIF(notes, ''),
        'Packet 18 reconciliation: Apex remains on SAP ECC 6.0; S/4HANA/RISE/Dynamics/Workday decision is pending.'
      ),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'age_years', 14,
        'customizations', 8400,
        'support_path', 'Extended Maintenance to 2030',
        'migration_decision_pending', true,
        'future_decision_move_id', 'APX-ERP-FUTURE-2027',
        'reconciled_by', 'packet-18-bootstrap',
        'reconciled_at', now()
      )
  WHERE id = v_sap_id;

  SELECT to_jsonb(t) INTO v_new_sap
  FROM public.tech_stack_items t
  WHERE t.id = v_sap_id;

  INSERT INTO public.admin_audit_log (
    client_id, category, action, target_kind, target_id, summary, metadata
  )
  SELECT
    v_apex_id,
    'dataset',
    'packet18.apex.sap_reconciled',
    'tech_stack_items',
    v_sap_id,
    'Packet 18 reconciled Apex ERP platform from S/4HANA to SAP ECC 6.0 with migration decision pending.',
    jsonb_build_object(
      'actor', 'packet-18-bootstrap',
      'rationale', 'Product owner selected SAP ECC 6.0 as the demo-relevant CIO/CFO anchor; S/4HANA remains an evaluated future path, not current state.',
      'old_value', v_old_sap,
      'new_value', v_new_sap
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE client_id = v_apex_id
      AND action = 'packet18.apex.sap_reconciled'
      AND target_id = v_sap_id
  );

  INSERT INTO public.ai_business_goals (
    goal_id, client_id, name, strategic_context, display_order, loaded_via_template
  ) VALUES (
    'APX-GOAL-ERP-FUTURE',
    v_apex_id,
    'Resolve ERP future platform decision',
    'Apex must decide whether to remain on extended SAP ECC support while shaping S/4HANA, RISE with SAP, Dynamics 365 F&O, or Workday Financials as the next ERP path.',
    90,
    'packet-18-apex-truth-reconciliation'
  )
  ON CONFLICT (goal_id) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    name = EXCLUDED.name,
    strategic_context = EXCLUDED.strategic_context,
    display_order = EXCLUDED.display_order,
    loaded_via_template = EXCLUDED.loaded_via_template,
    updated_at = now();

  SELECT to_jsonb(i) INTO v_initiative_old
  FROM public.ai_initiatives i
  WHERE i.initiative_id = 'APX-ERP-FUTURE-2027';

  INSERT INTO public.ai_initiatives (
    initiative_id,
    client_id,
    display_id,
    name,
    description,
    primary_category_id,
    secondary_category_id,
    primary_goal_id,
    stage,
    stage_detail,
    owner_name,
    owner_title,
    owner_function,
    committed_annual_usd,
    committed_total_usd,
    measured_value_usd,
    status_flag,
    status_summary,
    confidence_level,
    aligned_callout,
    aligned_rationale,
    loaded_via_template,
    metadata
  ) VALUES (
    'APX-ERP-FUTURE-2027',
    v_apex_id,
    'APX-ERP-2027',
    'SAP ERP Future Decision: S/4HANA vs RISE with SAP vs Dynamics 365 F&O vs Workday Financials',
    'Strategic Move in active scoping to decide Apex Retail''s ERP future. Current state remains SAP ECC 6.0 with extended maintenance; this move evaluates the next platform path and sequencing constraints before RFP or transformation commitment.',
    'CAT-04',
    'CAT-06',
    'APX-GOAL-ERP-FUTURE',
    'in_strategic_move',
    'in_scoping',
    'Carlos Rivera',
    'CIO',
    'Enterprise Technology',
    14000000,
    14000000,
    NULL,
    'foundation_phase',
    'Scoping phase funded; full ERP program not yet approved. Decision should remain held until dependency sequencing, Oracle DB migration, and CFO capital posture are resolved.',
    'HIGH',
    true,
    'Board-priority platform decision; current SAP ECC 6.0 support runway buys time, but the future ERP path must be shaped before a sourcing event or full transformation spend is authorized.',
    'packet-18-apex-truth-reconciliation',
    jsonb_build_object(
      'packet', 'P18-A',
      'status', 'in_scoping',
      'sponsor_raci', jsonb_build_object(
        'accountable', 'CIO',
        'responsible', 'Head of Enterprise Apps',
        'consulted', jsonb_build_array('CFO','COO','CISO'),
        'informed', jsonb_build_array('CEO','Board')
      ),
      'projected_full_program_usd', jsonb_build_object('low', 80000000, 'high', 120000000),
      'decision_target_date', 'Q2 2027',
      'current_erp_platform', 'SAP ECC 6.0',
      'options', jsonb_build_array('S/4HANA','RISE with SAP','Dynamics 365 F&O','Workday Financials'),
      'binding_constraint', 'Oracle DB migration must precede ERP swap before RFP readiness.',
      'actor', 'packet-18-bootstrap'
    )
  )
  ON CONFLICT (initiative_id) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    display_id = EXCLUDED.display_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    primary_category_id = EXCLUDED.primary_category_id,
    secondary_category_id = EXCLUDED.secondary_category_id,
    primary_goal_id = EXCLUDED.primary_goal_id,
    stage = EXCLUDED.stage,
    stage_detail = EXCLUDED.stage_detail,
    owner_name = EXCLUDED.owner_name,
    owner_title = EXCLUDED.owner_title,
    owner_function = EXCLUDED.owner_function,
    committed_annual_usd = EXCLUDED.committed_annual_usd,
    committed_total_usd = EXCLUDED.committed_total_usd,
    measured_value_usd = EXCLUDED.measured_value_usd,
    status_flag = EXCLUDED.status_flag,
    status_summary = EXCLUDED.status_summary,
    confidence_level = EXCLUDED.confidence_level,
    aligned_callout = EXCLUDED.aligned_callout,
    aligned_rationale = EXCLUDED.aligned_rationale,
    loaded_via_template = EXCLUDED.loaded_via_template,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  SELECT to_jsonb(i) INTO v_initiative_new
  FROM public.ai_initiatives i
  WHERE i.initiative_id = 'APX-ERP-FUTURE-2027';

  INSERT INTO public.admin_audit_log (
    client_id, category, action, target_kind, summary, metadata
  )
  SELECT
    v_apex_id,
    'dataset',
    'packet18.apex.erp_future_move_upserted',
    'ai_initiatives',
    'Packet 18 added the SAP ERP Future Decision Strategic Move for Apex.',
    jsonb_build_object(
      'actor', 'packet-18-bootstrap',
      'initiative_id', 'APX-ERP-FUTURE-2027',
      'old_value', v_initiative_old,
      'new_value', v_initiative_new
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE client_id = v_apex_id
      AND action = 'packet18.apex.erp_future_move_upserted'
      AND metadata ->> 'initiative_id' = 'APX-ERP-FUTURE-2027'
  );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
