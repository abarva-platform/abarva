-- ECL substrate schema baseline
-- Generated from the lab Postgres catalog by scripts/ops/emit-ecl-substrate-baseline.mjs.
-- Definitions use Postgres catalog renderers where available; table columns are assembled from pg_attribute.
-- Source proof bundle: /tmp/ecl-substrate-baseline-emitter-20260831T0300Z/proof.
-- The committed migration omits the generated transaction wrapper because src/scripts/run-migrations.ts owns it.


-- 1. schemas
create schema if not exists "ecl_commercial";

create schema if not exists "ecl_context";

create schema if not exists "ecl_projection";

create schema if not exists "ecl_review";

create schema if not exists "ecl_source";

create schema if not exists "serving";

-- 2. tables, columns only
create table if not exists "ecl_commercial"."contract" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "contract_object_id" uuid not null,
  "vendor_object_id" uuid not null,
  "contract_number" text,
  "contract_name" text not null,
  "contract_type" text,
  "start_date" date,
  "end_date" date,
  "renewal_notice_date" date,
  "annualized_value_usd" numeric,
  "total_contract_value_usd" numeric,
  "currency" text default 'USD'::text not null,
  "source_document_id" uuid,
  "source_record_id" uuid,
  "basis" text not null,
  "value_state" text not null,
  "review_state" text not null,
  "attributes_json" jsonb default '{}'::jsonb not null
);

create table if not exists "ecl_commercial"."contract_scope" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "contract_id" uuid not null,
  "scoped_object_id" uuid not null,
  "scope_type" text not null,
  "allocation_percent" numeric(8,4),
  "allocation_amount_usd" numeric,
  "basis" text not null,
  "value_state" text not null,
  "source_record_id" uuid,
  "review_state" text not null
);

create table if not exists "ecl_commercial"."contract_service_line" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "contract_id" uuid not null,
  "service_line_key" text not null,
  "service_category" text not null,
  "description" text not null,
  "annualized_value_usd" numeric,
  "value_state" text not null,
  "source_record_id" uuid,
  "document_extraction_id" uuid,
  "review_state" text not null
);

create table if not exists "ecl_commercial"."invoice_line" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "invoice_line_key" text not null,
  "vendor_object_id" uuid not null,
  "contract_id" uuid,
  "cost_center_object_id" uuid,
  "period_start" date not null,
  "period_end" date not null,
  "amount_usd" numeric not null,
  "gl_account" text,
  "spend_category" text,
  "source_record_id" uuid not null,
  "basis" text not null,
  "value_state" text not null,
  "review_state" text not null,
  "zero_amount_reason" text
);

create table if not exists "ecl_commercial"."sla_observation" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "contract_id" uuid,
  "service_line_id" uuid,
  "scoped_object_id" uuid,
  "metric_key" text not null,
  "target_value_number" numeric,
  "actual_value_number" numeric,
  "unit" text not null,
  "period_start" date not null,
  "period_end" date not null,
  "source_record_id" uuid,
  "document_extraction_id" uuid,
  "basis" text not null,
  "value_state" text not null,
  "quality_state" text not null,
  "review_state" text not null
);

create table if not exists "ecl_context"."context_pack" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "pack_key" text not null,
  "pack_version" integer not null,
  "payload_json" jsonb not null,
  "payload_hash" text not null,
  "retrieval_state" text not null,
  "quality_state" text not null,
  "proof_uri" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_context"."measure" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "subject_object_id" uuid not null,
  "metric_key" text not null,
  "value_number" numeric,
  "value_text" text,
  "unit" text not null,
  "period_start" date,
  "period_end" date,
  "scenario" text not null,
  "source_record_id" uuid,
  "document_extraction_id" uuid,
  "basis" text not null,
  "value_state" text not null,
  "quality_state" text not null,
  "review_state" text not null,
  "attributes_json" jsonb default '{}'::jsonb not null
);

create table if not exists "ecl_context"."metric_definition" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "metric_key" text not null,
  "metric_name" text not null,
  "definition" text not null,
  "unit" text not null,
  "directionality" text not null,
  "cadence" text not null,
  "aggregation_rule" text not null
);

create table if not exists "ecl_context"."object" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "object_key" text not null,
  "object_type" text not null,
  "display_name" text not null,
  "business_domain" text,
  "lifecycle_state" text not null,
  "source_record_id" uuid,
  "basis" text not null,
  "value_state" text not null,
  "review_state" text not null,
  "confidence" numeric(5,4),
  "attributes_json" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "canonical_semantic_type" text generated always as (COALESCE(NULLIF((attributes_json ->> 'canonical_semantic_type'::text), ''::text), object_type)) stored
);

create table if not exists "ecl_context"."object_type_catalog" (
  "object_type" text not null,
  "display_label" text not null,
  "grain" text not null,
  "counting_class" text not null,
  "description" text not null
);

create table if not exists "ecl_context"."relationship" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "from_object_id" uuid not null,
  "relationship_type" text not null,
  "to_object_id" uuid not null,
  "direction_label" text,
  "source_record_id" uuid,
  "basis" text not null,
  "value_state" text not null,
  "review_state" text not null,
  "confidence" numeric(5,4),
  "attributes_json" jsonb default '{}'::jsonb not null
);

create table if not exists "ecl_context"."snapshot" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_key" text not null,
  "snapshot_type" text not null,
  "source_hash" text not null,
  "context_hash" text not null,
  "created_by_job" text not null,
  "quality_state" text not null,
  "proof_uri" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."cube_manifest" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "cube_key" text not null,
  "cube_version" integer not null,
  "rebuild_command" text not null,
  "source_hash" text not null,
  "cube_hash" text not null,
  "slice_count" integer not null,
  "quality_state" text not null,
  "admission_status" text default 'not_applicable'::text not null,
  "admission_gate_results_json" jsonb default '[]'::jsonb not null,
  "proof_uri" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."cube_slice" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "cube_manifest_id" uuid not null,
  "cube_key" text not null,
  "cube_version" integer not null,
  "slice_key" text not null,
  "grain_key" text not null,
  "primary_object_id" uuid,
  "dimensions_json" jsonb not null,
  "measures_json" jsonb not null,
  "primary_metric_key" text not null,
  "metric_keys_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "basis_summary" text not null,
  "value_state" text not null,
  "quality_state" text not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."cube_slice_measure" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "cube_slice_id" uuid not null,
  "measure_id" uuid not null,
  "metric_key" text not null,
  "measure_role" text not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."cube_slice_metric" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "cube_slice_id" uuid not null,
  "metric_key" text not null,
  "metric_role" text not null,
  "unit" text,
  "sort_order" integer default 0 not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."home_enterprise_landscape" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "page_key" text not null,
  "row_key" text not null,
  "section_key" text not null,
  "row_type" text not null,
  "title" text not null,
  "summary" text,
  "primary_object_id" uuid,
  "metric_keys_json" jsonb default '[]'::jsonb not null,
  "relationship_ids_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "basis_summary" text not null,
  "value_state" text not null,
  "quality_state" text not null,
  "admission_status" text default 'not_applicable'::text not null,
  "admission_gate_key" text,
  "admission_result_json" jsonb default '{}'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "display_payload_json" jsonb default '{}'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."intelligence_context_pack" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "context_pack_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "surface_key" text not null,
  "primary_object_id" uuid,
  "prompt_context_json" jsonb default '{}'::jsonb not null,
  "permitted_facts_json" jsonb default '[]'::jsonb not null,
  "blocked_facts_json" jsonb default '[]'::jsonb not null,
  "citation_refs_json" jsonb default '[]'::jsonb not null,
  "retrieval_state" text not null,
  "value_state" text not null,
  "quality_state" text not null,
  "access_class" text not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."intelligence_pattern_evidence" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_entry_id" uuid not null,
  "projection_version" integer not null,
  "surface_key" text not null,
  "row_key" text not null,
  "pattern_key" text not null,
  "pattern_claim" text not null,
  "primary_object_id" uuid,
  "evidence_strength_score" integer not null,
  "conflict_state" text not null,
  "citation_refs_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "affected_objects_json" jsonb default '[]'::jsonb not null,
  "recommended_next_evidence_json" jsonb default '[]'::jsonb not null,
  "value_state" text not null,
  "quality_state" text not null,
  "access_class" text not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."intelligence_question_context" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "context_pack_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_entry_id" uuid not null,
  "projection_version" integer not null,
  "surface_key" text not null,
  "row_key" text not null,
  "question_key" text not null,
  "question_text" text not null,
  "primary_object_id" uuid,
  "permitted_facts_json" jsonb default '[]'::jsonb not null,
  "blocked_facts_json" jsonb default '[]'::jsonb not null,
  "citation_refs_json" jsonb default '[]'::jsonb not null,
  "retrieval_state" text not null,
  "value_state" text not null,
  "quality_state" text not null,
  "access_class" text not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."projection_entry" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "surface_key" text not null,
  "row_key" text not null,
  "row_type" text not null,
  "source_hash" text not null,
  "refs_content_hash" text not null,
  "refs_cache_json" jsonb default '{}'::jsonb not null,
  "display_cache_json" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."projection_entry_document_extraction_ref" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_entry_id" uuid not null,
  "document_extraction_id" uuid not null,
  "ref_role" text not null,
  "sort_order" integer default 1 not null,
  "source_hash" text not null
);

create table if not exists "ecl_projection"."projection_entry_measure_ref" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_entry_id" uuid not null,
  "measure_id" uuid not null,
  "ref_role" text not null,
  "sort_order" integer default 1 not null,
  "source_hash" text not null
);

create table if not exists "ecl_projection"."projection_entry_metric_ref" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_entry_id" uuid not null,
  "metric_key" text not null,
  "ref_role" text not null,
  "sort_order" integer default 1 not null,
  "source_hash" text not null
);

create table if not exists "ecl_projection"."projection_entry_object_ref" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_entry_id" uuid not null,
  "object_id" uuid not null,
  "ref_role" text not null,
  "sort_order" integer default 1 not null,
  "source_hash" text not null
);

create table if not exists "ecl_projection"."projection_entry_relationship_ref" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_entry_id" uuid not null,
  "relationship_id" uuid not null,
  "ref_role" text not null,
  "sort_order" integer default 1 not null,
  "source_hash" text not null
);

create table if not exists "ecl_projection"."projection_entry_source_record_ref" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_entry_id" uuid not null,
  "source_record_id" uuid not null,
  "ref_role" text not null,
  "sort_order" integer default 1 not null,
  "source_hash" text not null
);

create table if not exists "ecl_projection"."projection_manifest" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_key" text not null,
  "projection_version" integer not null,
  "rebuild_command" text not null,
  "source_hash" text not null,
  "projection_hash" text not null,
  "row_count" integer not null,
  "quality_state" text not null,
  "admission_status" text default 'not_applicable'::text not null,
  "admission_gate_results_json" jsonb default '[]'::jsonb not null,
  "gated_claim_count" integer default 0 not null,
  "proof_uri" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."source_contract_360" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "contract_id" uuid not null,
  "contract_object_id" uuid not null,
  "vendor_object_id" uuid not null,
  "contract_name" text not null,
  "vendor_name" text not null,
  "renewal_notice_date" date,
  "end_date" date,
  "annualized_value_usd" numeric,
  "total_contract_value_usd" numeric,
  "value_state" text not null,
  "quality_state" text not null,
  "service_lines_json" jsonb default '[]'::jsonb not null,
  "scope_json" jsonb default '[]'::jsonb not null,
  "spend_summary_json" jsonb default '{}'::jsonb not null,
  "sla_summary_json" jsonb default '{}'::jsonb not null,
  "document_proof_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."source_event_workspace" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "workspace_tab" text not null,
  "row_type" text not null,
  "event_key" text not null,
  "event_title" text not null,
  "contract_id" uuid not null,
  "contract_object_id" uuid not null,
  "vendor_object_id" uuid not null,
  "review_event_id" uuid not null,
  "event_stage" text not null,
  "event_status" text not null,
  "gate_status" text not null,
  "gate_reason_code" text,
  "gate_reason_detail" text,
  "owner_role" text not null,
  "due_date" date,
  "evidence_needed_json" jsonb default '[]'::jsonb not null,
  "decision_context_json" jsonb default '{}'::jsonb not null,
  "next_action_json" jsonb default '{}'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."source_value_levers" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "lever_type" text not null,
  "opportunity_type" text not null,
  "opportunity_title" text not null,
  "contract_id" uuid not null,
  "contract_object_id" uuid not null,
  "vendor_object_id" uuid not null,
  "primary_metric_key" text not null,
  "baseline_spend_usd" numeric,
  "addressable_spend_usd" numeric,
  "estimated_value_low_usd" numeric,
  "estimated_value_high_usd" numeric,
  "claimable_value_usd" numeric default 0 not null,
  "blocked_value_usd" numeric,
  "value_gate_status" text not null,
  "value_gate_reason_code" text not null,
  "value_gate_reason_detail" text not null,
  "evidence_state" text not null,
  "confidence" numeric,
  "affected_scope_json" jsonb default '[]'::jsonb not null,
  "benchmark_context_json" jsonb default '{}'::jsonb not null,
  "protection_context_json" jsonb default '{}'::jsonb not null,
  "next_action_json" jsonb default '{}'::jsonb not null,
  "metric_keys_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."source_vendor_360" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "vendor_object_id" uuid not null,
  "vendor_name" text not null,
  "contract_count" integer not null,
  "covered_object_count" integer not null,
  "annualized_spend_usd" numeric,
  "renewal_exposure_usd" numeric,
  "value_state" text not null,
  "quality_state" text not null,
  "contract_ids_json" jsonb default '[]'::jsonb not null,
  "covered_objects_json" jsonb default '[]'::jsonb not null,
  "spend_summary_json" jsonb default '{}'::jsonb not null,
  "sla_summary_json" jsonb default '{}'::jsonb not null,
  "risk_control_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."tower_ai_portfolio" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_entry_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "use_case_object_id" uuid not null,
  "tool_object_id" uuid,
  "function_object_id" uuid,
  "use_case_name" text not null,
  "tool_name" text not null,
  "business_function" text,
  "licensed_users" integer,
  "active_users" integer,
  "usage_events" integer,
  "monthly_cost_usd" numeric,
  "adoption_rate_percent" numeric,
  "value_state" text not null,
  "quality_state" text not null,
  "review_state" text not null,
  "metric_keys_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "display_payload_json" jsonb default '{}'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."tower_assessment_lifecycle" (
  "tenant_key" text not null,
  "assessment_id" text not null,
  "projection_version" integer not null,
  "state" text not null,
  "activated_at" timestamp with time zone default now() not null,
  "retired_at" timestamp with time zone,
  "build_version" text,
  "note" text
);

create table if not exists "ecl_projection"."tower_command_center" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "page_key" text not null,
  "row_type" text not null,
  "primary_object_id" uuid,
  "claim_id" text,
  "claim_gate_status" text default 'not_applicable'::text not null,
  "claim_gate_reason_code" text,
  "claim_gate_reason_detail" text,
  "next_gate" text,
  "evidence_needed_json" jsonb default '[]'::jsonb not null,
  "funded_amount_usd" numeric,
  "promised_value_usd" numeric,
  "usage_supported_value_usd" numeric,
  "finance_validated_value_usd" numeric,
  "claimable_value_usd" numeric,
  "blocked_value_usd" numeric,
  "proof_maturity_score" integer,
  "risk_pressure_score" integer,
  "usage_strength_score" integer,
  "owner_role" text,
  "handoff_module" text,
  "value_state" text not null,
  "quality_state" text not null,
  "metric_keys_json" jsonb default '[]'::jsonb not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "display_payload_json" jsonb default '{}'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null,
  "projection_entry_id" uuid
);

create table if not exists "ecl_projection"."tower_evidence_queue" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_entry_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "page_key" text not null,
  "row_type" text not null,
  "primary_object_id" uuid,
  "claim_id" text not null,
  "claim_gate_status" text not null,
  "claim_gate_reason_code" text not null,
  "claim_gate_reason_detail" text not null,
  "evidence_needed_json" jsonb default '[]'::jsonb not null,
  "next_gate" text not null,
  "owner_role" text not null,
  "due_date" date,
  "related_measure_id" uuid,
  "source_record_id" uuid,
  "review_event_id" uuid,
  "evidence_state" text not null,
  "priority_score" integer default 50 not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "display_payload_json" jsonb default '{}'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_projection"."tower_value_chain" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "snapshot_id" uuid not null,
  "projection_manifest_id" uuid not null,
  "projection_entry_id" uuid not null,
  "projection_version" integer not null,
  "row_key" text not null,
  "page_key" text not null,
  "row_type" text not null,
  "primary_object_id" uuid,
  "claim_id" text not null,
  "observation_key" text not null,
  "metric_key" text not null,
  "measure_id" uuid,
  "source_record_id" uuid,
  "review_event_id" uuid,
  "evidence_state" text not null,
  "claim_gate_status" text not null,
  "claim_gate_reason_code" text,
  "claim_gate_reason_detail" text,
  "next_gate" text,
  "evidence_needed_json" jsonb default '[]'::jsonb not null,
  "baseline_value" numeric,
  "current_value" numeric,
  "target_value" numeric,
  "claimable_value_usd" numeric default 0 not null,
  "blocked_value_usd" numeric default 0 not null,
  "value_state" text not null,
  "quality_state" text not null,
  "source_refs_json" jsonb default '[]'::jsonb not null,
  "display_payload_json" jsonb default '{}'::jsonb not null,
  "gap_flags_json" jsonb default '[]'::jsonb not null,
  "source_hash" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_review"."review_event" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "subject_kind" text not null,
  "subject_object_id" uuid,
  "subject_relationship_id" uuid,
  "subject_measure_id" uuid,
  "subject_contract_id" uuid,
  "subject_service_line_id" uuid,
  "subject_scope_id" uuid,
  "subject_invoice_line_id" uuid,
  "subject_sla_observation_id" uuid,
  "subject_document_extraction_id" uuid,
  "subject_context_pack_id" uuid,
  "review_event_type" text not null,
  "previous_value_json" jsonb,
  "new_value_json" jsonb,
  "decision_basis" text not null,
  "reviewer_role" text,
  "source_document_id" uuid,
  "source_record_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "ecl_source"."document" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "source_file_id" uuid not null,
  "document_key" text not null,
  "document_type" text not null,
  "title" text not null,
  "file_hash" text not null,
  "page_count" integer,
  "effective_date" date,
  "access_class" text not null,
  "review_state" text not null
);

create table if not exists "ecl_source"."document_extraction" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "document_id" uuid not null,
  "field_key" text not null,
  "extracted_value" text not null,
  "normalized_value_json" jsonb default '{}'::jsonb not null,
  "page_number" integer,
  "span_reference" text,
  "basis" text not null,
  "confidence" numeric(5,4),
  "human_verification_state" text not null
);

create table if not exists "ecl_source"."source_file" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "source_type" text not null,
  "source_owner" text,
  "file_name" text not null,
  "blob_uri" text not null,
  "file_hash" text not null,
  "source_date" date,
  "received_at" timestamp with time zone default now() not null,
  "access_class" text not null,
  "quality_state" text not null,
  "metadata_json" jsonb default '{}'::jsonb not null,
  "origin" text default 'synthetic_generator'::text not null
);

create table if not exists "ecl_source"."source_record" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_key" text not null,
  "assessment_id" text not null,
  "source_file_id" uuid not null,
  "native_id" text,
  "record_type" text not null,
  "row_number" integer,
  "payload_json" jsonb not null,
  "parse_state" text not null,
  "parse_notes" text
);

create table if not exists "serving"."serving_contract" (
  "surface_key" text not null,
  "product" text not null,
  "serving_view" text not null,
  "ecl_backing" text not null,
  "build_state" text not null,
  "owner_person" text not null,
  "due_date" date not null,
  "proof_state" text default 'not_proven'::text not null,
  "browser_proof_state" text default 'not_run'::text not null,
  "cutover_state" text default 'not_cut_over'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

-- 3. primary, unique and check constraints
do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_pkey') then
    alter table "ecl_commercial"."contract" add constraint "contract_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_pkey') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_pkey') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_pkey') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_pkey') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_pkey') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_pkey') then
    alter table "ecl_context"."measure" add constraint "measure_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'metric_definition' and k.conname = 'metric_definition_pkey') then
    alter table "ecl_context"."metric_definition" add constraint "metric_definition_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_pkey') then
    alter table "ecl_context"."object" add constraint "object_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object_type_catalog' and k.conname = 'object_type_catalog_pkey') then
    alter table "ecl_context"."object_type_catalog" add constraint "object_type_catalog_pkey" PRIMARY KEY (object_type);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_pkey') then
    alter table "ecl_context"."relationship" add constraint "relationship_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'snapshot' and k.conname = 'snapshot_pkey') then
    alter table "ecl_context"."snapshot" add constraint "snapshot_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_pkey') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_pkey') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_measure' and k.conname = 'cube_slice_measure_pkey') then
    alter table "ecl_projection"."cube_slice_measure" add constraint "cube_slice_measure_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_metric' and k.conname = 'cube_slice_metric_pkey') then
    alter table "ecl_projection"."cube_slice_metric" add constraint "cube_slice_metric_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_pkey') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_pkey') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_pkey') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_pkey') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_pkey') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_pkey') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_pkey') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_pkey') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_pkey') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_pkey') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_pkey') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_assessment_lifecycle' and k.conname = 'tower_assessment_lifecycle_pkey') then
    alter table "ecl_projection"."tower_assessment_lifecycle" add constraint "tower_assessment_lifecycle_pkey" PRIMARY KEY (tenant_key, assessment_id, projection_version);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_pkey') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_pkey') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_pkey') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_pkey') then
    alter table "ecl_review"."review_event" add constraint "review_event_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_pkey') then
    alter table "ecl_source"."document" add constraint "document_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document_extraction' and k.conname = 'document_extraction_pkey') then
    alter table "ecl_source"."document_extraction" add constraint "document_extraction_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_pkey') then
    alter table "ecl_source"."source_file" add constraint "source_file_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_record' and k.conname = 'source_record_pkey') then
    alter table "ecl_source"."source_record" add constraint "source_record_pkey" PRIMARY KEY (id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_pkey') then
    alter table "serving"."serving_contract" add constraint "serving_contract_pkey" PRIMARY KEY (surface_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_tenant_assessment_id_unique') then
    alter table "ecl_commercial"."contract" add constraint "contract_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_tenant_assessment_id_unique') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_unique') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_unique" UNIQUE (tenant_key, assessment_id, contract_id, scoped_object_id, scope_type);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_key_unique') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_key_unique" UNIQUE (tenant_key, assessment_id, contract_id, service_line_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_tenant_assessment_id_unique') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_key_unique') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_key_unique" UNIQUE (tenant_key, assessment_id, invoice_line_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_tenant_assessment_id_unique') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_tenant_assessment_id_unique') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_key_version_unique') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_key_version_unique" UNIQUE (tenant_key, assessment_id, pack_key, pack_version);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_tenant_assessment_id_unique') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_tenant_assessment_id_unique') then
    alter table "ecl_context"."measure" add constraint "measure_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'metric_definition' and k.conname = 'metric_definition_key_unique') then
    alter table "ecl_context"."metric_definition" add constraint "metric_definition_key_unique" UNIQUE (tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_semantic_key_unique') then
    alter table "ecl_context"."object" add constraint "object_semantic_key_unique" UNIQUE (tenant_key, assessment_id, object_type, canonical_semantic_type, object_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_tenant_assessment_id_unique') then
    alter table "ecl_context"."object" add constraint "object_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_tenant_assessment_id_unique') then
    alter table "ecl_context"."relationship" add constraint "relationship_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'snapshot' and k.conname = 'snapshot_key_unique') then
    alter table "ecl_context"."snapshot" add constraint "snapshot_key_unique" UNIQUE (tenant_key, assessment_id, snapshot_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'snapshot' and k.conname = 'snapshot_tenant_assessment_id_unique') then
    alter table "ecl_context"."snapshot" add constraint "snapshot_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_tenant_assessment_id_unique') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_unique') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_unique" UNIQUE (tenant_key, assessment_id, cube_key, cube_version);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_tenant_assessment_id_unique') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_unique') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_unique" UNIQUE (tenant_key, assessment_id, cube_key, cube_version, slice_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_measure' and k.conname = 'cube_slice_measure_unique') then
    alter table "ecl_projection"."cube_slice_measure" add constraint "cube_slice_measure_unique" UNIQUE (tenant_key, assessment_id, cube_slice_id, measure_id, measure_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_metric' and k.conname = 'cube_slice_metric_unique') then
    alter table "ecl_projection"."cube_slice_metric" add constraint "cube_slice_metric_unique" UNIQUE (tenant_key, assessment_id, cube_slice_id, metric_key, metric_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_unique') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_unique" UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_unique') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_unique" UNIQUE (tenant_key, assessment_id, projection_version, surface_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_unique') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_unique" UNIQUE (tenant_key, assessment_id, projection_version, surface_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_unique') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_unique" UNIQUE (tenant_key, assessment_id, projection_version, surface_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_tenant_assessment_id_unique') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_unique') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_unique" UNIQUE (tenant_key, assessment_id, projection_version, surface_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_document_extraction_ref' and k.conname = 'projection_entry_document_extraction_ref_unique') then
    alter table "ecl_projection"."projection_entry_document_extraction_ref" add constraint "projection_entry_document_extraction_ref_unique" UNIQUE (tenant_key, assessment_id, projection_entry_id, document_extraction_id, ref_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_measure_ref' and k.conname = 'projection_entry_measure_ref_unique') then
    alter table "ecl_projection"."projection_entry_measure_ref" add constraint "projection_entry_measure_ref_unique" UNIQUE (tenant_key, assessment_id, projection_entry_id, measure_id, ref_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_metric_ref' and k.conname = 'projection_entry_metric_ref_unique') then
    alter table "ecl_projection"."projection_entry_metric_ref" add constraint "projection_entry_metric_ref_unique" UNIQUE (tenant_key, assessment_id, projection_entry_id, metric_key, ref_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_object_ref' and k.conname = 'projection_entry_object_ref_unique') then
    alter table "ecl_projection"."projection_entry_object_ref" add constraint "projection_entry_object_ref_unique" UNIQUE (tenant_key, assessment_id, projection_entry_id, object_id, ref_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_relationship_ref' and k.conname = 'projection_entry_relationship_ref_unique') then
    alter table "ecl_projection"."projection_entry_relationship_ref" add constraint "projection_entry_relationship_ref_unique" UNIQUE (tenant_key, assessment_id, projection_entry_id, relationship_id, ref_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_source_record_ref' and k.conname = 'projection_entry_source_record_ref_unique') then
    alter table "ecl_projection"."projection_entry_source_record_ref" add constraint "projection_entry_source_record_ref_unique" UNIQUE (tenant_key, assessment_id, projection_entry_id, source_record_id, ref_role);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_unique') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_unique" UNIQUE (tenant_key, assessment_id, projection_key, projection_version);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_unique') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_unique" UNIQUE (tenant_key, assessment_id, projection_version, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_unique') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_unique" UNIQUE (tenant_key, assessment_id, projection_version, workspace_tab, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_unique') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_unique" UNIQUE (tenant_key, assessment_id, projection_version, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_unique') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_unique" UNIQUE (tenant_key, assessment_id, projection_version, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_unique') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_unique" UNIQUE (tenant_key, assessment_id, projection_version, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_unique') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_unique" UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_unique') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_unique" UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_unique') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_unique" UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_tenant_assessment_id_unique') then
    alter table "ecl_review"."review_event" add constraint "review_event_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_key_unique') then
    alter table "ecl_source"."document" add constraint "document_key_unique" UNIQUE (tenant_key, assessment_id, document_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_tenant_assessment_id_unique') then
    alter table "ecl_source"."document" add constraint "document_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document_extraction' and k.conname = 'document_extraction_tenant_assessment_id_unique') then
    alter table "ecl_source"."document_extraction" add constraint "document_extraction_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_hash_unique') then
    alter table "ecl_source"."source_file" add constraint "source_file_hash_unique" UNIQUE (tenant_key, assessment_id, file_hash);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_tenant_assessment_id_unique') then
    alter table "ecl_source"."source_file" add constraint "source_file_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_record' and k.conname = 'source_record_native_unique') then
    alter table "ecl_source"."source_record" add constraint "source_record_native_unique" UNIQUE NULLS NOT DISTINCT (source_file_id, record_type, native_id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_record' and k.conname = 'source_record_tenant_assessment_id_unique') then
    alter table "ecl_source"."source_record" add constraint "source_record_tenant_assessment_id_unique" UNIQUE (tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_serving_view_key') then
    alter table "serving"."serving_contract" add constraint "serving_contract_serving_view_key" UNIQUE (serving_view);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_basis_check') then
    alter table "ecl_commercial"."contract" add constraint "contract_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_review_state_check') then
    alter table "ecl_commercial"."contract" add constraint "contract_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_unknown_money_null_check') then
    alter table "ecl_commercial"."contract" add constraint "contract_unknown_money_null_check" CHECK ((value_state <> ALL (ARRAY['unknown'::text, 'not_applicable'::text])) OR annualized_value_usd IS NULL AND total_contract_value_usd IS NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_value_state_check') then
    alter table "ecl_commercial"."contract" add constraint "contract_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_allocation_percent_check') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_allocation_percent_check" CHECK (allocation_percent IS NULL OR allocation_percent >= 0::numeric AND allocation_percent <= 100::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_basis_check') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_review_state_check') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_type_check') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_type_check" CHECK (scope_type = ANY (ARRAY['application'::text, 'function'::text, 'platform'::text, 'region'::text, 'service'::text, 'data_product'::text, 'ai_use_case'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_value_state_check') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_category_check') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_category_check" CHECK (service_category = ANY (ARRAY['software'::text, 'cloud'::text, 'managed_service'::text, 'support'::text, 'data'::text, 'ai'::text, 'labor'::text, 'professional_service'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_review_state_check') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_unknown_money_null_check') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_unknown_money_null_check" CHECK ((value_state <> ALL (ARRAY['unknown'::text, 'not_applicable'::text])) OR annualized_value_usd IS NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_value_state_check') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_basis_check') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_period_check') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_period_check" CHECK (period_end >= period_start);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_review_state_check') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_value_state_check') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_zero_reason_check') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_zero_reason_check" CHECK (amount_usd <> 0::numeric OR zero_amount_reason IS NOT NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_basis_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_period_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_period_check" CHECK (period_end >= period_start);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_quality_state_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_quality_state_check" CHECK (quality_state = ANY (ARRAY['usable'::text, 'estimated'::text, 'conflicting'::text, 'blocked'::text, 'insufficient'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_review_state_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_subject_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_subject_check" CHECK (num_nonnulls(contract_id, service_line_id, scoped_object_id) >= 1);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_unknown_value_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_unknown_value_check" CHECK ((value_state <> ALL (ARRAY['unknown'::text, 'not_applicable'::text])) OR target_value_number IS NULL AND actual_value_number IS NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_value_state_check') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_quality_state_check') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_retrieval_state_check') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_retrieval_state_check" CHECK (retrieval_state = ANY (ARRAY['not_indexed'::text, 'indexed'::text, 'retrieved'::text, 'cited'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_version_check') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_version_check" CHECK (pack_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_basis_check') then
    alter table "ecl_context"."measure" add constraint "measure_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_known_value_check') then
    alter table "ecl_context"."measure" add constraint "measure_known_value_check" CHECK (value_state = 'known'::text AND num_nonnulls(value_number, value_text) = 1 OR value_state <> 'known'::text);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_quality_state_check') then
    alter table "ecl_context"."measure" add constraint "measure_quality_state_check" CHECK (quality_state = ANY (ARRAY['usable'::text, 'estimated'::text, 'conflicting'::text, 'blocked'::text, 'insufficient'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_review_state_check') then
    alter table "ecl_context"."measure" add constraint "measure_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_scenario_check') then
    alter table "ecl_context"."measure" add constraint "measure_scenario_check" CHECK (scenario = ANY (ARRAY['current'::text, 'target'::text, 'planned'::text, 'actual'::text, 'baseline'::text, 'forecast'::text, 'benchmark'::text, 'retired'::text, 'candidate'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_unknown_not_zero_check') then
    alter table "ecl_context"."measure" add constraint "measure_unknown_not_zero_check" CHECK ((value_state = ANY (ARRAY['unknown'::text, 'not_applicable'::text])) AND value_number IS NULL AND value_text IS NULL OR (value_state <> ALL (ARRAY['unknown'::text, 'not_applicable'::text])));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_value_state_check') then
    alter table "ecl_context"."measure" add constraint "measure_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'metric_definition' and k.conname = 'metric_definition_aggregation_rule_check') then
    alter table "ecl_context"."metric_definition" add constraint "metric_definition_aggregation_rule_check" CHECK (aggregation_rule = ANY (ARRAY['sum'::text, 'avg'::text, 'max'::text, 'min'::text, 'latest'::text, 'none'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'metric_definition' and k.conname = 'metric_definition_cadence_check') then
    alter table "ecl_context"."metric_definition" add constraint "metric_definition_cadence_check" CHECK (cadence = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'annual'::text, 'point_in_time'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'metric_definition' and k.conname = 'metric_definition_directionality_check') then
    alter table "ecl_context"."metric_definition" add constraint "metric_definition_directionality_check" CHECK (directionality = ANY (ARRAY['higher_is_better'::text, 'lower_is_better'::text, 'neutral'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_basis_check') then
    alter table "ecl_context"."object" add constraint "object_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_canonical_semantic_type_check') then
    alter table "ecl_context"."object" add constraint "object_canonical_semantic_type_check" CHECK (canonical_semantic_type <> ''::text);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_confidence_check') then
    alter table "ecl_context"."object" add constraint "object_confidence_check" CHECK (confidence IS NULL OR confidence >= 0::numeric AND confidence <= 1::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_lifecycle_state_check') then
    alter table "ecl_context"."object" add constraint "object_lifecycle_state_check" CHECK (lifecycle_state = ANY (ARRAY['current'::text, 'target'::text, 'planned'::text, 'actual'::text, 'baseline'::text, 'forecast'::text, 'benchmark'::text, 'retired'::text, 'candidate'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_review_state_check') then
    alter table "ecl_context"."object" add constraint "object_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_type_check') then
    alter table "ecl_context"."object" add constraint "object_type_check" CHECK (object_type = ANY (ARRAY['enterprise'::text, 'business_segment'::text, 'business_function'::text, 'organization'::text, 'process'::text, 'application'::text, 'application_deployment'::text, 'data_platform'::text, 'data_product'::text, 'infrastructure'::text, 'vendor'::text, 'contract'::text, 'program'::text, 'metric'::text, 'risk'::text, 'control'::text, 'ai_program'::text, 'ai_use_case'::text, 'ai_tool'::text, 'persona'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_value_state_check') then
    alter table "ecl_context"."object" add constraint "object_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object_type_catalog' and k.conname = 'object_type_catalog_counting_class_check') then
    alter table "ecl_context"."object_type_catalog" add constraint "object_type_catalog_counting_class_check" CHECK (counting_class = ANY (ARRAY['enterprise_scope'::text, 'business_entity'::text, 'deployment_instance'::text, 'technical_component'::text, 'commercial_entity'::text, 'initiative'::text, 'risk_control'::text, 'metric_definition'::text, 'persona'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object_type_catalog' and k.conname = 'object_type_catalog_grain_check') then
    alter table "ecl_context"."object_type_catalog" add constraint "object_type_catalog_grain_check" CHECK (grain = ANY (ARRAY['enterprise'::text, 'business_segment'::text, 'business_function'::text, 'organization'::text, 'process'::text, 'application'::text, 'application_deployment'::text, 'data_platform'::text, 'data_product'::text, 'infrastructure'::text, 'vendor'::text, 'contract'::text, 'program'::text, 'metric'::text, 'risk'::text, 'control'::text, 'ai_program'::text, 'ai_use_case'::text, 'ai_tool'::text, 'persona'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_basis_check') then
    alter table "ecl_context"."relationship" add constraint "relationship_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_confidence_check') then
    alter table "ecl_context"."relationship" add constraint "relationship_confidence_check" CHECK (confidence IS NULL OR confidence >= 0::numeric AND confidence <= 1::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_no_self_loop_check') then
    alter table "ecl_context"."relationship" add constraint "relationship_no_self_loop_check" CHECK (from_object_id <> to_object_id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_review_state_check') then
    alter table "ecl_context"."relationship" add constraint "relationship_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_type_check') then
    alter table "ecl_context"."relationship" add constraint "relationship_type_check" CHECK (relationship_type = ANY (ARRAY['HAS_FUNCTION'::text, 'OWNED_BY'::text, 'SUPPORTED_BY'::text, 'SUPPLIED_BY'::text, 'COVERED_BY'::text, 'HOSTED_ON'::text, 'DEPLOYMENT_OF'::text, 'INTEGRATES_WITH'::text, 'PRODUCES'::text, 'CONSUMES'::text, 'DEPENDS_ON'::text, 'CHANGES'::text, 'MITIGATES'::text, 'CONTROLS'::text, 'MEASURED_BY'::text, 'USED_BY'::text, 'FUNDED_BY'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_value_state_check') then
    alter table "ecl_context"."relationship" add constraint "relationship_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'snapshot' and k.conname = 'snapshot_quality_state_check') then
    alter table "ecl_context"."snapshot" add constraint "snapshot_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'snapshot' and k.conname = 'snapshot_type_check') then
    alter table "ecl_context"."snapshot" add constraint "snapshot_type_check" CHECK (snapshot_type = ANY (ARRAY['baseline'::text, 'review_pack'::text, 'approved_context'::text, 'projection_source'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_admission_payload_check') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_admission_payload_check" CHECK (admission_status = 'refused'::text AND admission_gate_results_json <> '[]'::jsonb OR (admission_status = ANY (ARRAY['admitted'::text, 'not_applicable'::text])) AND admission_gate_results_json = '[]'::jsonb);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_admission_status_check') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_admission_status_check" CHECK (admission_status = ANY (ARRAY['admitted'::text, 'refused'::text, 'not_applicable'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_key_check') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_key_check" CHECK (cube_key = ANY (ARRAY['home_coverage_cube'::text, 'architecture_cube'::text, 'data_analytics_cube'::text, 'source_vendor_cube'::text, 'source_contract_cube'::text, 'tower_spend_value_cube'::text, 'tower_evidence_cube'::text, 'ai_portfolio_cube'::text, 'intelligence_citation_cube'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_quality_state_check') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_slice_count_check') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_slice_count_check" CHECK (slice_count >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_version_check') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_version_check" CHECK (cube_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_blocked_has_gap_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_blocked_has_gap_check" CHECK (quality_state <> 'blocked'::text OR gap_flags_json <> '[]'::jsonb);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_dimensions_not_empty_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_dimensions_not_empty_check" CHECK (dimensions_json <> '{}'::jsonb);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_key_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_key_check" CHECK (cube_key = ANY (ARRAY['home_coverage_cube'::text, 'architecture_cube'::text, 'data_analytics_cube'::text, 'source_vendor_cube'::text, 'source_contract_cube'::text, 'tower_spend_value_cube'::text, 'tower_evidence_cube'::text, 'ai_portfolio_cube'::text, 'intelligence_citation_cube'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_measures_not_empty_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_measures_not_empty_check" CHECK (measures_json <> '{}'::jsonb);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_quality_state_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_value_state_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_version_check') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_version_check" CHECK (cube_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_measure' and k.conname = 'cube_slice_measure_role_check') then
    alter table "ecl_projection"."cube_slice_measure" add constraint "cube_slice_measure_role_check" CHECK (measure_role = ANY (ARRAY['primary'::text, 'display'::text, 'filter'::text, 'supporting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_metric' and k.conname = 'cube_slice_metric_role_check') then
    alter table "ecl_projection"."cube_slice_metric" add constraint "cube_slice_metric_role_check" CHECK (metric_role = ANY (ARRAY['primary'::text, 'display'::text, 'filter'::text, 'supporting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_metric' and k.conname = 'cube_slice_metric_sort_order_check') then
    alter table "ecl_projection"."cube_slice_metric" add constraint "cube_slice_metric_sort_order_check" CHECK (sort_order >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_admission_status_check') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_admission_status_check" CHECK (admission_status = ANY (ARRAY['admitted'::text, 'refused'::text, 'not_applicable'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_page_check') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_page_check" CHECK (page_key = ANY (ARRAY['executive_brief'::text, 'our_business'::text, 'strategy_value_creation'::text, 'how_we_operate'::text, 'technology_data'::text, 'performance_value'::text, 'leadership_perspective'::text, 'what_needs_attention'::text, 'current_state_architecture'::text, 'current_state_data_flow'::text, 'what_has_been_loaded'::text, 'browse_the_record'::text, 'applications_systems'::text, 'vendor_contracts'::text, 'infrastructure_platforms'::text, 'data_assets_integrations'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_quality_state_check') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_refusal_payload_check') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_refusal_payload_check" CHECK (admission_status = 'refused'::text AND admission_gate_key IS NOT NULL AND admission_result_json <> '{}'::jsonb OR (admission_status = ANY (ARRAY['admitted'::text, 'not_applicable'::text])) AND admission_gate_key IS NULL AND admission_result_json = '{}'::jsonb);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_value_state_check') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_version_check') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_access_class_check') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_access_class_check" CHECK (access_class = ANY (ARRAY['public_demo'::text, 'internal'::text, 'client_confidential'::text, 'restricted'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_quality_state_check') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_retrieval_state_check') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_retrieval_state_check" CHECK (retrieval_state = ANY (ARRAY['not_indexed'::text, 'indexed'::text, 'retrieved'::text, 'cited'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_value_state_check') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_access_class_check') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_access_class_check" CHECK (access_class = ANY (ARRAY['public_demo'::text, 'internal'::text, 'client_confidential'::text, 'restricted'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_conflict_check') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_conflict_check" CHECK (conflict_state = ANY (ARRAY['none'::text, 'conflicting'::text, 'insufficient'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_quality_state_check') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_strength_check') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_strength_check" CHECK (evidence_strength_score >= 0 AND evidence_strength_score <= 100);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_surface_check') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_surface_check" CHECK (surface_key = ANY (ARRAY['insights_evaluate'::text, 'pattern_detail'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_value_state_check') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_access_class_check') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_access_class_check" CHECK (access_class = ANY (ARRAY['public_demo'::text, 'internal'::text, 'client_confidential'::text, 'restricted'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_quality_state_check') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_retrieval_state_check') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_retrieval_state_check" CHECK (retrieval_state = ANY (ARRAY['not_indexed'::text, 'indexed'::text, 'retrieved'::text, 'cited'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_surface_check') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_surface_check" CHECK (surface_key = 'ask_query_api'::text);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_value_state_check') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_surface_check') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_surface_check" CHECK (surface_key = ANY (ARRAY['home_enterprise_landscape'::text, 'source_contract_360'::text, 'source_vendor_360'::text, 'source_value_levers'::text, 'source_event_workspace'::text, 'tower_command_center'::text, 'tower_value_chain'::text, 'tower_evidence_queue'::text, 'tower_ai_portfolio'::text, 'intelligence_pattern_evidence'::text, 'intelligence_question_context'::text, 'intelligence_context_pack'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_version_check') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_document_extraction_ref' and k.conname = 'projection_entry_document_extraction_ref_sort_check') then
    alter table "ecl_projection"."projection_entry_document_extraction_ref" add constraint "projection_entry_document_extraction_ref_sort_check" CHECK (sort_order > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_measure_ref' and k.conname = 'projection_entry_measure_ref_sort_check') then
    alter table "ecl_projection"."projection_entry_measure_ref" add constraint "projection_entry_measure_ref_sort_check" CHECK (sort_order > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_metric_ref' and k.conname = 'projection_entry_metric_ref_sort_check') then
    alter table "ecl_projection"."projection_entry_metric_ref" add constraint "projection_entry_metric_ref_sort_check" CHECK (sort_order > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_object_ref' and k.conname = 'projection_entry_object_ref_sort_check') then
    alter table "ecl_projection"."projection_entry_object_ref" add constraint "projection_entry_object_ref_sort_check" CHECK (sort_order > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_relationship_ref' and k.conname = 'projection_entry_relationship_ref_sort_check') then
    alter table "ecl_projection"."projection_entry_relationship_ref" add constraint "projection_entry_relationship_ref_sort_check" CHECK (sort_order > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_source_record_ref' and k.conname = 'projection_entry_source_record_ref_sort_check') then
    alter table "ecl_projection"."projection_entry_source_record_ref" add constraint "projection_entry_source_record_ref_sort_check" CHECK (sort_order > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_admission_payload_check') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_admission_payload_check" CHECK (admission_status = 'refused'::text AND admission_gate_results_json <> '[]'::jsonb OR (admission_status = ANY (ARRAY['admitted'::text, 'not_applicable'::text])) AND admission_gate_results_json = '[]'::jsonb);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_admission_status_check') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_admission_status_check" CHECK (admission_status = ANY (ARRAY['admitted'::text, 'refused'::text, 'not_applicable'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_gated_claim_count_check') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_gated_claim_count_check" CHECK (gated_claim_count >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_quality_state_check') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_row_count_check') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_row_count_check" CHECK (row_count >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_version_check') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_quality_state_check') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_unknown_money_null_check') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_unknown_money_null_check" CHECK ((value_state <> ALL (ARRAY['unknown'::text, 'not_applicable'::text])) OR annualized_value_usd IS NULL AND total_contract_value_usd IS NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_value_state_check') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_version_check') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_gate_payload_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_gate_payload_check" CHECK (gate_status = 'open'::text AND gate_reason_code IS NULL AND COALESCE(jsonb_array_length(evidence_needed_json), 0) = 0 OR (gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])) AND gate_reason_code IS NOT NULL AND gate_reason_detail IS NOT NULL AND COALESCE(jsonb_array_length(evidence_needed_json), 0) > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_gate_status_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_gate_status_check" CHECK (gate_status = ANY (ARRAY['open'::text, 'gated'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_row_type_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_row_type_check" CHECK (row_type = ANY (ARRAY['sourcing_event'::text, 'approval_gate'::text, 'vendor_response_compare'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_stage_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_stage_check" CHECK (event_stage = ANY (ARRAY['intake'::text, 'evidence_collection'::text, 'owner_review'::text, 'finance_review'::text, 'legal_review'::text, 'sourcing_decision'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_status_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_status_check" CHECK (event_status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'blocked'::text, 'ready_for_review'::text, 'approved'::text, 'rejected'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_tab_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_tab_check" CHECK (workspace_tab = ANY (ARRAY['events'::text, 'approvals'::text, 'compare'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_version_check') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_claimable_gate_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_claimable_gate_check" CHECK (value_gate_status = 'claimable'::text AND claimable_value_usd > 0::numeric OR (value_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])) AND claimable_value_usd = 0::numeric AND value_gate_reason_code IS NOT NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_confidence_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_confidence_check" CHECK (confidence IS NULL OR confidence >= 0::numeric AND confidence <= 1::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_evidence_state_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_evidence_state_check" CHECK (evidence_state = ANY (ARRAY['source_recorded'::text, 'model_inferred'::text, 'mixed'::text, 'missing_review'::text, 'not_available'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_gate_status_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_gate_status_check" CHECK (value_gate_status = ANY (ARRAY['claimable'::text, 'gated'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_money_nonnegative_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_money_nonnegative_check" CHECK (COALESCE(baseline_spend_usd, 0::numeric) >= 0::numeric AND COALESCE(addressable_spend_usd, 0::numeric) >= 0::numeric AND COALESCE(estimated_value_low_usd, 0::numeric) >= 0::numeric AND COALESCE(estimated_value_high_usd, 0::numeric) >= 0::numeric AND COALESCE(claimable_value_usd, 0::numeric) >= 0::numeric AND COALESCE(blocked_value_usd, 0::numeric) >= 0::numeric AND COALESCE(estimated_value_high_usd, 0::numeric) >= COALESCE(estimated_value_low_usd, 0::numeric));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_opportunity_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_opportunity_check" CHECK (opportunity_type = ANY (ARRAY['renegotiate'::text, 'recover'::text, 'compete'::text, 'protect'::text, 'evidence_request'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_type_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_type_check" CHECK (lever_type = ANY (ARRAY['renewal_leverage'::text, 'rate_variance'::text, 'exit_economics'::text, 'shortfall_recovery'::text, 'sla_recovery'::text, 'scope_rationalization'::text, 'evidence_request'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_version_check') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_counts_check') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_counts_check" CHECK (contract_count >= 0 AND covered_object_count >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_quality_state_check') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_value_state_check') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_version_check') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_version_check" CHECK (projection_version > 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_count_check') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_count_check" CHECK (COALESCE(licensed_users, 0) >= 0 AND COALESCE(active_users, 0) >= 0 AND COALESCE(usage_events, 0) >= 0 AND COALESCE(monthly_cost_usd, 0::numeric) >= 0::numeric AND (adoption_rate_percent IS NULL OR adoption_rate_percent >= 0::numeric AND adoption_rate_percent <= 100::numeric));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_quality_state_check') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_review_state_check') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'reviewed'::text, 'approved'::text, 'rejected'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_value_state_check') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_assessment_lifecycle' and k.conname = 'tower_assessment_lifecycle_retired_at_check') then
    alter table "ecl_projection"."tower_assessment_lifecycle" add constraint "tower_assessment_lifecycle_retired_at_check" CHECK ((state = 'retired'::text) = (retired_at IS NOT NULL));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_assessment_lifecycle' and k.conname = 'tower_assessment_lifecycle_state_check') then
    alter table "ecl_projection"."tower_assessment_lifecycle" add constraint "tower_assessment_lifecycle_state_check" CHECK (state = ANY (ARRAY['active'::text, 'retired'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_claim_gate_status_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_claim_gate_status_check" CHECK (claim_gate_status = ANY (ARRAY['claimable'::text, 'gated'::text, 'blocked'::text, 'not_applicable'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_gate_reason_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_gate_reason_check" CHECK ((claim_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])) AND claim_gate_reason_code IS NOT NULL OR (claim_gate_status = ANY (ARRAY['claimable'::text, 'not_applicable'::text])));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_money_nonnegative_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_money_nonnegative_check" CHECK (COALESCE(funded_amount_usd, 0::numeric) >= 0::numeric AND COALESCE(promised_value_usd, 0::numeric) >= 0::numeric AND COALESCE(usage_supported_value_usd, 0::numeric) >= 0::numeric AND COALESCE(finance_validated_value_usd, 0::numeric) >= 0::numeric AND COALESCE(claimable_value_usd, 0::numeric) >= 0::numeric AND COALESCE(blocked_value_usd, 0::numeric) >= 0::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_page_key_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_page_key_check" CHECK (page_key = ANY (ARRAY['command_center'::text, 'value_proof'::text, 'decision_lanes'::text, 'evidence'::text, 'recommended_actions'::text, 'ai_portfolio'::text, 'cost_lens'::text, 'risk_lens'::text, 'adoption_lens'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_quality_state_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_scores_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_scores_check" CHECK ((proof_maturity_score IS NULL OR proof_maturity_score >= 0 AND proof_maturity_score <= 100) AND (risk_pressure_score IS NULL OR risk_pressure_score >= 0 AND risk_pressure_score <= 100) AND (usage_strength_score IS NULL OR usage_strength_score >= 0 AND usage_strength_score <= 100));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_value_state_check') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_gate_status_check') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_gate_status_check" CHECK (claim_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_page_check') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_page_check" CHECK (page_key = ANY (ARRAY['evidence'::text, 'recommended_actions'::text, 'risk_lens'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_payload_check') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_payload_check" CHECK (COALESCE(jsonb_array_length(evidence_needed_json), 0) > 0 AND claim_gate_reason_code <> ''::text AND claim_gate_reason_detail <> ''::text AND next_gate <> ''::text);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_priority_check') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_priority_check" CHECK (priority_score >= 0 AND priority_score <= 100);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_gate_payload_check') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_gate_payload_check" CHECK ((claim_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])) AND claim_gate_reason_code IS NOT NULL AND claim_gate_reason_detail IS NOT NULL AND next_gate IS NOT NULL AND COALESCE(jsonb_array_length(evidence_needed_json), 0) > 0 OR (claim_gate_status = ANY (ARRAY['claimable'::text, 'not_applicable'::text])) AND claim_gate_reason_code IS NULL AND claim_gate_reason_detail IS NULL AND next_gate IS NULL AND COALESCE(jsonb_array_length(evidence_needed_json), 0) = 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_gate_status_check') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_gate_status_check" CHECK (claim_gate_status = ANY (ARRAY['claimable'::text, 'gated'::text, 'blocked'::text, 'not_applicable'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_money_nonnegative_check') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_money_nonnegative_check" CHECK (claimable_value_usd >= 0::numeric AND blocked_value_usd >= 0::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_page_check') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_page_check" CHECK (page_key = ANY (ARRAY['value_proof'::text, 'decision_lanes'::text, 'cost_lens'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_quality_state_check') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_quality_state_check" CHECK (quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_value_state_check') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_value_state_check" CHECK (value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_decision_basis_check') then
    alter table "ecl_review"."review_event" add constraint "review_event_decision_basis_check" CHECK (decision_basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_one_subject_check') then
    alter table "ecl_review"."review_event" add constraint "review_event_one_subject_check" CHECK (num_nonnulls(subject_object_id, subject_relationship_id, subject_measure_id, subject_contract_id, subject_service_line_id, subject_scope_id, subject_invoice_line_id, subject_sla_observation_id, subject_document_extraction_id, subject_context_pack_id) = 1);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_subject_kind_matches_check') then
    alter table "ecl_review"."review_event" add constraint "review_event_subject_kind_matches_check" CHECK (subject_kind = 'object'::text AND subject_object_id IS NOT NULL OR subject_kind = 'relationship'::text AND subject_relationship_id IS NOT NULL OR subject_kind = 'measure'::text AND subject_measure_id IS NOT NULL OR subject_kind = 'contract'::text AND subject_contract_id IS NOT NULL OR subject_kind = 'service_line'::text AND subject_service_line_id IS NOT NULL OR subject_kind = 'scope'::text AND subject_scope_id IS NOT NULL OR subject_kind = 'invoice_line'::text AND subject_invoice_line_id IS NOT NULL OR subject_kind = 'sla_observation'::text AND subject_sla_observation_id IS NOT NULL OR subject_kind = 'document_extraction'::text AND subject_document_extraction_id IS NOT NULL OR subject_kind = 'context_pack'::text AND subject_context_pack_id IS NOT NULL);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_type_check') then
    alter table "ecl_review"."review_event" add constraint "review_event_type_check" CHECK (review_event_type = ANY (ARRAY['confirm'::text, 'correct'::text, 'reject'::text, 'block'::text, 'resolve_conflict'::text, 'mark_unknown'::text, 'supersede'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_access_class_check') then
    alter table "ecl_source"."document" add constraint "document_access_class_check" CHECK (access_class = ANY (ARRAY['public_demo'::text, 'internal'::text, 'client_confidential'::text, 'restricted'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_review_state_check') then
    alter table "ecl_source"."document" add constraint "document_review_state_check" CHECK (review_state = ANY (ARRAY['not_reviewed'::text, 'in_review'::text, 'confirmed'::text, 'corrected'::text, 'rejected'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_type_check') then
    alter table "ecl_source"."document" add constraint "document_type_check" CHECK (document_type = ANY (ARRAY['contract'::text, 'sow'::text, 'invoice'::text, 'sla_report'::text, 'attestation'::text, 'interview_notes'::text, 'architecture_doc'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document_extraction' and k.conname = 'document_extraction_basis_check') then
    alter table "ecl_source"."document_extraction" add constraint "document_extraction_basis_check" CHECK (basis = ANY (ARRAY['source_recorded'::text, 'document_extracted'::text, 'interview_derived'::text, 'calculated'::text, 'model_inferred'::text, 'owner_confirmed'::text, 'unknown'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document_extraction' and k.conname = 'document_extraction_confidence_check') then
    alter table "ecl_source"."document_extraction" add constraint "document_extraction_confidence_check" CHECK (confidence IS NULL OR confidence >= 0::numeric AND confidence <= 1::numeric);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document_extraction' and k.conname = 'document_extraction_human_state_check') then
    alter table "ecl_source"."document_extraction" add constraint "document_extraction_human_state_check" CHECK (human_verification_state = ANY (ARRAY['unverified'::text, 'verified'::text, 'corrected'::text, 'rejected'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_access_class_check') then
    alter table "ecl_source"."source_file" add constraint "source_file_access_class_check" CHECK (access_class = ANY (ARRAY['public_demo'::text, 'internal'::text, 'client_confidential'::text, 'restricted'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_origin_check') then
    alter table "ecl_source"."source_file" add constraint "source_file_origin_check" CHECK (origin = ANY (ARRAY['client_intake'::text, 'synthetic_generator'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_quality_state_check') then
    alter table "ecl_source"."source_file" add constraint "source_file_quality_state_check" CHECK (quality_state = ANY (ARRAY['accepted'::text, 'partial'::text, 'blocked'::text, 'superseded'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_file' and k.conname = 'source_file_source_type_check') then
    alter table "ecl_source"."source_file" add constraint "source_file_source_type_check" CHECK (source_type = ANY (ARRAY['cmdb'::text, 'erp'::text, 'ppm'::text, 'clm'::text, 'grc'::text, 'bi'::text, 'etl'::text, 'ai_telemetry'::text, 'document'::text, 'interview'::text, 'manual_workbook'::text, 'synthetic_source_room'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_record' and k.conname = 'source_record_parse_state_check') then
    alter table "ecl_source"."source_record" add constraint "source_record_parse_state_check" CHECK (parse_state = ANY (ARRAY['parsed'::text, 'partial'::text, 'failed'::text, 'ignored'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_backing_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_backing_check" CHECK (ecl_backing ~ '^ecl_projection\.[a-z0-9_]+$'::text);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_browser_state_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_browser_state_check" CHECK (browser_proof_state = ANY (ARRAY['not_run'::text, 'passed'::text, 'failed'::text, 'blocked'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_cutover_state_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_cutover_state_check" CHECK (cutover_state = ANY (ARRAY['not_cut_over'::text, 'shadow'::text, 'default'::text, 'rolled_back'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_product_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_product_check" CHECK (product = ANY (ARRAY['Home'::text, 'Tower'::text, 'Source'::text, 'Intelligence'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_proof_state_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_proof_state_check" CHECK (proof_state = ANY (ARRAY['not_proven'::text, 'local_proven'::text, 'azure_readback_proven'::text, 'browser_proven'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_state_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_state_check" CHECK (build_state = ANY (ARRAY['backing_built'::text, 'serving_built'::text, 'not_built'::text]));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'serving' and c.relname = 'serving_contract' and k.conname = 'serving_contract_view_check') then
    alter table "serving"."serving_contract" add constraint "serving_contract_view_check" CHECK (serving_view ~ '^serving\.[a-z0-9_]+$'::text);
  end if;
end
$$;

-- 4. foreign keys
do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_object_fk') then
    alter table "ecl_commercial"."contract" add constraint "contract_object_fk" FOREIGN KEY (tenant_key, assessment_id, contract_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_source_document_fk') then
    alter table "ecl_commercial"."contract" add constraint "contract_source_document_fk" FOREIGN KEY (tenant_key, assessment_id, source_document_id) REFERENCES ecl_source.document(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_source_record_fk') then
    alter table "ecl_commercial"."contract" add constraint "contract_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract' and k.conname = 'contract_vendor_object_fk') then
    alter table "ecl_commercial"."contract" add constraint "contract_vendor_object_fk" FOREIGN KEY (tenant_key, assessment_id, vendor_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_contract_fk') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_object_fk') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_object_fk" FOREIGN KEY (tenant_key, assessment_id, scoped_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_scope' and k.conname = 'contract_scope_source_record_fk') then
    alter table "ecl_commercial"."contract_scope" add constraint "contract_scope_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_contract_fk') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_document_extraction_fk') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_document_extraction_fk" FOREIGN KEY (tenant_key, assessment_id, document_extraction_id) REFERENCES ecl_source.document_extraction(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'contract_service_line' and k.conname = 'contract_service_line_source_record_fk') then
    alter table "ecl_commercial"."contract_service_line" add constraint "contract_service_line_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_contract_fk') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_cost_center_object_fk') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_cost_center_object_fk" FOREIGN KEY (tenant_key, assessment_id, cost_center_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_source_record_fk') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'invoice_line' and k.conname = 'invoice_line_vendor_object_fk') then
    alter table "ecl_commercial"."invoice_line" add constraint "invoice_line_vendor_object_fk" FOREIGN KEY (tenant_key, assessment_id, vendor_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_contract_fk') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_document_extraction_fk') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_document_extraction_fk" FOREIGN KEY (tenant_key, assessment_id, document_extraction_id) REFERENCES ecl_source.document_extraction(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_metric_definition_fk') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_metric_definition_fk" FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_scoped_object_fk') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_scoped_object_fk" FOREIGN KEY (tenant_key, assessment_id, scoped_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_service_line_fk') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_service_line_fk" FOREIGN KEY (tenant_key, assessment_id, service_line_id) REFERENCES ecl_commercial.contract_service_line(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_commercial' and c.relname = 'sla_observation' and k.conname = 'sla_observation_source_record_fk') then
    alter table "ecl_commercial"."sla_observation" add constraint "sla_observation_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'context_pack' and k.conname = 'context_pack_snapshot_fk') then
    alter table "ecl_context"."context_pack" add constraint "context_pack_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_document_extraction_fk') then
    alter table "ecl_context"."measure" add constraint "measure_document_extraction_fk" FOREIGN KEY (tenant_key, assessment_id, document_extraction_id) REFERENCES ecl_source.document_extraction(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_metric_definition_fk') then
    alter table "ecl_context"."measure" add constraint "measure_metric_definition_fk" FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_source_record_fk') then
    alter table "ecl_context"."measure" add constraint "measure_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'measure' and k.conname = 'measure_subject_object_fk') then
    alter table "ecl_context"."measure" add constraint "measure_subject_object_fk" FOREIGN KEY (tenant_key, assessment_id, subject_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_source_record_fk') then
    alter table "ecl_context"."object" add constraint "object_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'object' and k.conname = 'object_type_catalog_fk') then
    alter table "ecl_context"."object" add constraint "object_type_catalog_fk" FOREIGN KEY (object_type) REFERENCES ecl_context.object_type_catalog(object_type) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_from_object_fk') then
    alter table "ecl_context"."relationship" add constraint "relationship_from_object_fk" FOREIGN KEY (tenant_key, assessment_id, from_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_source_record_fk') then
    alter table "ecl_context"."relationship" add constraint "relationship_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_context' and c.relname = 'relationship' and k.conname = 'relationship_to_object_fk') then
    alter table "ecl_context"."relationship" add constraint "relationship_to_object_fk" FOREIGN KEY (tenant_key, assessment_id, to_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_manifest' and k.conname = 'cube_manifest_snapshot_fk') then
    alter table "ecl_projection"."cube_manifest" add constraint "cube_manifest_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_manifest_fk') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_manifest_fk" FOREIGN KEY (tenant_key, assessment_id, cube_manifest_id) REFERENCES ecl_projection.cube_manifest(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_primary_metric_fk') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_primary_metric_fk" FOREIGN KEY (tenant_key, primary_metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_primary_object_fk') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice' and k.conname = 'cube_slice_snapshot_fk') then
    alter table "ecl_projection"."cube_slice" add constraint "cube_slice_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_measure' and k.conname = 'cube_slice_measure_measure_fk') then
    alter table "ecl_projection"."cube_slice_measure" add constraint "cube_slice_measure_measure_fk" FOREIGN KEY (tenant_key, assessment_id, measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_measure' and k.conname = 'cube_slice_measure_metric_definition_fk') then
    alter table "ecl_projection"."cube_slice_measure" add constraint "cube_slice_measure_metric_definition_fk" FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_measure' and k.conname = 'cube_slice_measure_slice_fk') then
    alter table "ecl_projection"."cube_slice_measure" add constraint "cube_slice_measure_slice_fk" FOREIGN KEY (tenant_key, assessment_id, cube_slice_id) REFERENCES ecl_projection.cube_slice(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_metric' and k.conname = 'cube_slice_metric_definition_fk') then
    alter table "ecl_projection"."cube_slice_metric" add constraint "cube_slice_metric_definition_fk" FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'cube_slice_metric' and k.conname = 'cube_slice_metric_slice_fk') then
    alter table "ecl_projection"."cube_slice_metric" add constraint "cube_slice_metric_slice_fk" FOREIGN KEY (tenant_key, assessment_id, cube_slice_id) REFERENCES ecl_projection.cube_slice(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_entry_fk') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_manifest_fk') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_primary_object_fk') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'home_enterprise_landscape' and k.conname = 'home_enterprise_landscape_snapshot_fk') then
    alter table "ecl_projection"."home_enterprise_landscape" add constraint "home_enterprise_landscape_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_context_pack_fk') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_context_pack_fk" FOREIGN KEY (tenant_key, assessment_id, context_pack_id) REFERENCES ecl_context.context_pack(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_entry_fk') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_manifest_fk') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_primary_object_fk') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_context_pack' and k.conname = 'intelligence_context_pack_snapshot_fk') then
    alter table "ecl_projection"."intelligence_context_pack" add constraint "intelligence_context_pack_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_entry_fk') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_manifest_fk') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_primary_object_fk') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_pattern_evidence' and k.conname = 'intelligence_pattern_evidence_snapshot_fk') then
    alter table "ecl_projection"."intelligence_pattern_evidence" add constraint "intelligence_pattern_evidence_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_context_pack_fk') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_context_pack_fk" FOREIGN KEY (tenant_key, assessment_id, context_pack_id) REFERENCES ecl_context.context_pack(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_entry_fk') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_manifest_fk') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_primary_object_fk') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'intelligence_question_context' and k.conname = 'intelligence_question_context_snapshot_fk') then
    alter table "ecl_projection"."intelligence_question_context" add constraint "intelligence_question_context_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_manifest_fk') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry' and k.conname = 'projection_entry_snapshot_fk') then
    alter table "ecl_projection"."projection_entry" add constraint "projection_entry_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_document_extraction_ref' and k.conname = 'projection_entry_document_extraction_ref_document_extraction_fk') then
    alter table "ecl_projection"."projection_entry_document_extraction_ref" add constraint "projection_entry_document_extraction_ref_document_extraction_fk" FOREIGN KEY (tenant_key, assessment_id, document_extraction_id) REFERENCES ecl_source.document_extraction(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_document_extraction_ref' and k.conname = 'projection_entry_document_extraction_ref_entry_fk') then
    alter table "ecl_projection"."projection_entry_document_extraction_ref" add constraint "projection_entry_document_extraction_ref_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_measure_ref' and k.conname = 'projection_entry_measure_ref_entry_fk') then
    alter table "ecl_projection"."projection_entry_measure_ref" add constraint "projection_entry_measure_ref_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_measure_ref' and k.conname = 'projection_entry_measure_ref_measure_fk') then
    alter table "ecl_projection"."projection_entry_measure_ref" add constraint "projection_entry_measure_ref_measure_fk" FOREIGN KEY (tenant_key, assessment_id, measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_metric_ref' and k.conname = 'projection_entry_metric_ref_entry_fk') then
    alter table "ecl_projection"."projection_entry_metric_ref" add constraint "projection_entry_metric_ref_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_metric_ref' and k.conname = 'projection_entry_metric_ref_metric_fk') then
    alter table "ecl_projection"."projection_entry_metric_ref" add constraint "projection_entry_metric_ref_metric_fk" FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_object_ref' and k.conname = 'projection_entry_object_ref_entry_fk') then
    alter table "ecl_projection"."projection_entry_object_ref" add constraint "projection_entry_object_ref_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_object_ref' and k.conname = 'projection_entry_object_ref_object_fk') then
    alter table "ecl_projection"."projection_entry_object_ref" add constraint "projection_entry_object_ref_object_fk" FOREIGN KEY (tenant_key, assessment_id, object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_relationship_ref' and k.conname = 'projection_entry_relationship_ref_entry_fk') then
    alter table "ecl_projection"."projection_entry_relationship_ref" add constraint "projection_entry_relationship_ref_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_relationship_ref' and k.conname = 'projection_entry_relationship_ref_relationship_fk') then
    alter table "ecl_projection"."projection_entry_relationship_ref" add constraint "projection_entry_relationship_ref_relationship_fk" FOREIGN KEY (tenant_key, assessment_id, relationship_id) REFERENCES ecl_context.relationship(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_source_record_ref' and k.conname = 'projection_entry_source_record_ref_entry_fk') then
    alter table "ecl_projection"."projection_entry_source_record_ref" add constraint "projection_entry_source_record_ref_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_entry_source_record_ref' and k.conname = 'projection_entry_source_record_ref_source_record_fk') then
    alter table "ecl_projection"."projection_entry_source_record_ref" add constraint "projection_entry_source_record_ref_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'projection_manifest' and k.conname = 'projection_manifest_snapshot_fk') then
    alter table "ecl_projection"."projection_manifest" add constraint "projection_manifest_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_contract_fk') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_contract_object_fk') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_contract_object_fk" FOREIGN KEY (tenant_key, assessment_id, contract_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_entry_fk') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_manifest_fk') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_snapshot_fk') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_contract_360' and k.conname = 'source_contract_360_vendor_object_fk') then
    alter table "ecl_projection"."source_contract_360" add constraint "source_contract_360_vendor_object_fk" FOREIGN KEY (tenant_key, assessment_id, vendor_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_contract_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_contract_object_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_contract_object_fk" FOREIGN KEY (tenant_key, assessment_id, contract_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_entry_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_manifest_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_review_event_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_review_event_fk" FOREIGN KEY (tenant_key, assessment_id, review_event_id) REFERENCES ecl_review.review_event(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_snapshot_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_event_workspace' and k.conname = 'source_event_workspace_vendor_object_fk') then
    alter table "ecl_projection"."source_event_workspace" add constraint "source_event_workspace_vendor_object_fk" FOREIGN KEY (tenant_key, assessment_id, vendor_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_contract_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_contract_fk" FOREIGN KEY (tenant_key, assessment_id, contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_contract_object_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_contract_object_fk" FOREIGN KEY (tenant_key, assessment_id, contract_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_entry_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_manifest_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_primary_metric_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_primary_metric_fk" FOREIGN KEY (tenant_key, primary_metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_snapshot_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_value_levers' and k.conname = 'source_value_levers_vendor_object_fk') then
    alter table "ecl_projection"."source_value_levers" add constraint "source_value_levers_vendor_object_fk" FOREIGN KEY (tenant_key, assessment_id, vendor_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_entry_fk') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_manifest_fk') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_snapshot_fk') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'source_vendor_360' and k.conname = 'source_vendor_360_vendor_object_fk') then
    alter table "ecl_projection"."source_vendor_360" add constraint "source_vendor_360_vendor_object_fk" FOREIGN KEY (tenant_key, assessment_id, vendor_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_entry_fk') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_function_fk') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_function_fk" FOREIGN KEY (tenant_key, assessment_id, function_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_manifest_fk') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_snapshot_fk') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_tool_fk') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_tool_fk" FOREIGN KEY (tenant_key, assessment_id, tool_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_ai_portfolio' and k.conname = 'tower_ai_portfolio_use_case_fk') then
    alter table "ecl_projection"."tower_ai_portfolio" add constraint "tower_ai_portfolio_use_case_fk" FOREIGN KEY (tenant_key, assessment_id, use_case_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_entry_fk') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_manifest_fk') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_primary_object_fk') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_command_center' and k.conname = 'tower_command_center_snapshot_fk') then
    alter table "ecl_projection"."tower_command_center" add constraint "tower_command_center_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_entry_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_manifest_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_measure_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_measure_fk" FOREIGN KEY (tenant_key, assessment_id, related_measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_primary_object_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_review_event_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_review_event_fk" FOREIGN KEY (tenant_key, assessment_id, review_event_id) REFERENCES ecl_review.review_event(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_snapshot_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_evidence_queue' and k.conname = 'tower_evidence_queue_source_record_fk') then
    alter table "ecl_projection"."tower_evidence_queue" add constraint "tower_evidence_queue_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_entry_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_entry_fk" FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_manifest_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_manifest_fk" FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_measure_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_measure_fk" FOREIGN KEY (tenant_key, assessment_id, measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_metric_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_metric_fk" FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_primary_object_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_primary_object_fk" FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_review_event_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_review_event_fk" FOREIGN KEY (tenant_key, assessment_id, review_event_id) REFERENCES ecl_review.review_event(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_snapshot_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_snapshot_fk" FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_projection' and c.relname = 'tower_value_chain' and k.conname = 'tower_value_chain_source_record_fk') then
    alter table "ecl_projection"."tower_value_chain" add constraint "tower_value_chain_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_context_pack_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_context_pack_fk" FOREIGN KEY (tenant_key, assessment_id, subject_context_pack_id) REFERENCES ecl_context.context_pack(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_contract_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_contract_fk" FOREIGN KEY (tenant_key, assessment_id, subject_contract_id) REFERENCES ecl_commercial.contract(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_document_extraction_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_document_extraction_fk" FOREIGN KEY (tenant_key, assessment_id, subject_document_extraction_id) REFERENCES ecl_source.document_extraction(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_invoice_line_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_invoice_line_fk" FOREIGN KEY (tenant_key, assessment_id, subject_invoice_line_id) REFERENCES ecl_commercial.invoice_line(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_measure_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_measure_fk" FOREIGN KEY (tenant_key, assessment_id, subject_measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_object_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_object_fk" FOREIGN KEY (tenant_key, assessment_id, subject_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_relationship_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_relationship_fk" FOREIGN KEY (tenant_key, assessment_id, subject_relationship_id) REFERENCES ecl_context.relationship(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_scope_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_scope_fk" FOREIGN KEY (tenant_key, assessment_id, subject_scope_id) REFERENCES ecl_commercial.contract_scope(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_service_line_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_service_line_fk" FOREIGN KEY (tenant_key, assessment_id, subject_service_line_id) REFERENCES ecl_commercial.contract_service_line(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_sla_observation_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_sla_observation_fk" FOREIGN KEY (tenant_key, assessment_id, subject_sla_observation_id) REFERENCES ecl_commercial.sla_observation(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_source_document_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_source_document_fk" FOREIGN KEY (tenant_key, assessment_id, source_document_id) REFERENCES ecl_source.document(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_review' and c.relname = 'review_event' and k.conname = 'review_event_source_record_fk') then
    alter table "ecl_review"."review_event" add constraint "review_event_source_record_fk" FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document' and k.conname = 'document_file_fk') then
    alter table "ecl_source"."document" add constraint "document_file_fk" FOREIGN KEY (tenant_key, assessment_id, source_file_id) REFERENCES ecl_source.source_file(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'document_extraction' and k.conname = 'document_extraction_document_fk') then
    alter table "ecl_source"."document_extraction" add constraint "document_extraction_document_fk" FOREIGN KEY (tenant_key, assessment_id, document_id) REFERENCES ecl_source.document(tenant_key, assessment_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ecl_source' and c.relname = 'source_record' and k.conname = 'source_record_file_fk') then
    alter table "ecl_source"."source_record" add constraint "source_record_file_fk" FOREIGN KEY (tenant_key, assessment_id, source_file_id) REFERENCES ecl_source.source_file(tenant_key, assessment_id, id);
  end if;
end
$$;

-- 5. indexes
CREATE INDEX IF NOT EXISTS idx_contract_renewal ON ecl_commercial.contract USING btree (tenant_key, assessment_id, renewal_notice_date);

CREATE INDEX IF NOT EXISTS idx_contract_vendor ON ecl_commercial.contract USING btree (tenant_key, assessment_id, vendor_object_id);

CREATE INDEX IF NOT EXISTS idx_contract_scope_object ON ecl_commercial.contract_scope USING btree (tenant_key, assessment_id, scoped_object_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_contract ON ecl_commercial.invoice_line USING btree (tenant_key, assessment_id, contract_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_vendor_period ON ecl_commercial.invoice_line USING btree (tenant_key, assessment_id, vendor_object_id, period_end);

CREATE INDEX IF NOT EXISTS idx_sla_observation_metric_period ON ecl_commercial.sla_observation USING btree (tenant_key, assessment_id, metric_key, period_end);

CREATE INDEX IF NOT EXISTS idx_context_pack_key_version ON ecl_context.context_pack USING btree (tenant_key, assessment_id, pack_key, pack_version DESC);

CREATE INDEX IF NOT EXISTS idx_measure_metric_period ON ecl_context.measure USING btree (tenant_key, assessment_id, metric_key, scenario, period_end);

CREATE INDEX IF NOT EXISTS idx_measure_subject_metric ON ecl_context.measure USING btree (tenant_key, assessment_id, subject_object_id, metric_key);

CREATE INDEX IF NOT EXISTS idx_ecl_context_object_semantic_type ON ecl_context.object USING btree (tenant_key, assessment_id, canonical_semantic_type);

CREATE INDEX IF NOT EXISTS idx_object_attributes_gin ON ecl_context.object USING gin (attributes_json);

CREATE INDEX IF NOT EXISTS idx_object_display_name ON ecl_context.object USING btree (tenant_key, assessment_id, display_name);

CREATE INDEX IF NOT EXISTS idx_object_type_domain ON ecl_context.object USING btree (tenant_key, assessment_id, object_type, business_domain);

CREATE INDEX IF NOT EXISTS idx_object_type_catalog_counting ON ecl_context.object_type_catalog USING btree (counting_class, grain);

CREATE INDEX IF NOT EXISTS idx_relationship_from ON ecl_context.relationship USING btree (tenant_key, assessment_id, from_object_id);

CREATE INDEX IF NOT EXISTS idx_relationship_to ON ecl_context.relationship USING btree (tenant_key, assessment_id, to_object_id);

CREATE INDEX IF NOT EXISTS idx_relationship_type ON ecl_context.relationship USING btree (tenant_key, assessment_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_cube_manifest_key_version ON ecl_projection.cube_manifest USING btree (tenant_key, assessment_id, cube_key, cube_version DESC);

CREATE INDEX IF NOT EXISTS idx_cube_slice_dimensions_gin ON ecl_projection.cube_slice USING gin (dimensions_json);

CREATE INDEX IF NOT EXISTS idx_cube_slice_key_grain ON ecl_projection.cube_slice USING btree (tenant_key, assessment_id, cube_key, cube_version, grain_key);

CREATE INDEX IF NOT EXISTS idx_cube_slice_measures_gin ON ecl_projection.cube_slice USING gin (measures_json);

CREATE INDEX IF NOT EXISTS idx_cube_slice_primary_object ON ecl_projection.cube_slice USING btree (tenant_key, assessment_id, primary_object_id);

CREATE INDEX IF NOT EXISTS idx_cube_slice_measure_id ON ecl_projection.cube_slice_measure USING btree (tenant_key, assessment_id, measure_id);

CREATE INDEX IF NOT EXISTS idx_cube_slice_measure_metric ON ecl_projection.cube_slice_measure USING btree (tenant_key, assessment_id, metric_key);

CREATE INDEX IF NOT EXISTS idx_cube_slice_metric_key ON ecl_projection.cube_slice_metric USING btree (tenant_key, assessment_id, metric_key);

CREATE INDEX IF NOT EXISTS idx_home_enterprise_landscape_admission ON ecl_projection.home_enterprise_landscape USING btree (tenant_key, assessment_id, admission_status, admission_gate_key);

CREATE INDEX IF NOT EXISTS idx_home_enterprise_landscape_page ON ecl_projection.home_enterprise_landscape USING btree (tenant_key, assessment_id, projection_version, page_key);

CREATE INDEX IF NOT EXISTS idx_intelligence_context_pack_retrieval ON ecl_projection.intelligence_context_pack USING btree (tenant_key, assessment_id, retrieval_state);

CREATE INDEX IF NOT EXISTS idx_intelligence_context_pack_surface ON ecl_projection.intelligence_context_pack USING btree (tenant_key, assessment_id, projection_version, surface_key);

CREATE INDEX IF NOT EXISTS idx_intelligence_pattern_evidence_surface ON ecl_projection.intelligence_pattern_evidence USING btree (tenant_key, assessment_id, projection_version, surface_key);

CREATE INDEX IF NOT EXISTS idx_intelligence_question_context_surface ON ecl_projection.intelligence_question_context USING btree (tenant_key, assessment_id, projection_version, surface_key);

CREATE INDEX IF NOT EXISTS idx_projection_entry_surface ON ecl_projection.projection_entry USING btree (tenant_key, assessment_id, projection_version, surface_key);

CREATE INDEX IF NOT EXISTS idx_projection_entry_document_extraction_ref_document_extractio ON ecl_projection.projection_entry_document_extraction_ref USING btree (tenant_key, assessment_id, document_extraction_id);

CREATE INDEX IF NOT EXISTS idx_projection_entry_measure_ref_measure ON ecl_projection.projection_entry_measure_ref USING btree (tenant_key, assessment_id, measure_id);

CREATE INDEX IF NOT EXISTS idx_projection_entry_metric_ref_metric ON ecl_projection.projection_entry_metric_ref USING btree (tenant_key, metric_key);

CREATE INDEX IF NOT EXISTS idx_projection_entry_object_ref_object ON ecl_projection.projection_entry_object_ref USING btree (tenant_key, assessment_id, object_id);

CREATE INDEX IF NOT EXISTS idx_projection_entry_relationship_ref_relationship ON ecl_projection.projection_entry_relationship_ref USING btree (tenant_key, assessment_id, relationship_id);

CREATE INDEX IF NOT EXISTS idx_projection_entry_source_record_ref_source_record ON ecl_projection.projection_entry_source_record_ref USING btree (tenant_key, assessment_id, source_record_id);

CREATE INDEX IF NOT EXISTS idx_projection_manifest_key_version ON ecl_projection.projection_manifest USING btree (tenant_key, assessment_id, projection_key, projection_version DESC);

CREATE INDEX IF NOT EXISTS idx_source_contract_360_contract ON ecl_projection.source_contract_360 USING btree (tenant_key, assessment_id, contract_id);

CREATE INDEX IF NOT EXISTS idx_source_contract_360_vendor ON ecl_projection.source_contract_360 USING btree (tenant_key, assessment_id, vendor_object_id);

CREATE INDEX IF NOT EXISTS idx_source_event_workspace_contract ON ecl_projection.source_event_workspace USING btree (tenant_key, assessment_id, contract_id);

CREATE INDEX IF NOT EXISTS idx_source_event_workspace_gate ON ecl_projection.source_event_workspace USING btree (tenant_key, assessment_id, gate_status, gate_reason_code);

CREATE INDEX IF NOT EXISTS idx_source_event_workspace_tab ON ecl_projection.source_event_workspace USING btree (tenant_key, assessment_id, projection_version, workspace_tab);

CREATE INDEX IF NOT EXISTS idx_source_value_levers_contract ON ecl_projection.source_value_levers USING btree (tenant_key, assessment_id, contract_id);

CREATE INDEX IF NOT EXISTS idx_source_value_levers_gate ON ecl_projection.source_value_levers USING btree (tenant_key, assessment_id, value_gate_status, value_gate_reason_code);

CREATE INDEX IF NOT EXISTS idx_source_value_levers_metric ON ecl_projection.source_value_levers USING btree (tenant_key, primary_metric_key);

CREATE INDEX IF NOT EXISTS idx_source_vendor_360_vendor ON ecl_projection.source_vendor_360 USING btree (tenant_key, assessment_id, vendor_object_id);

CREATE INDEX IF NOT EXISTS idx_tower_ai_portfolio_use_case ON ecl_projection.tower_ai_portfolio USING btree (tenant_key, assessment_id, use_case_object_id);

CREATE INDEX IF NOT EXISTS idx_tower_assessment_lifecycle_tenant_state ON ecl_projection.tower_assessment_lifecycle USING btree (tenant_key, state);

CREATE UNIQUE INDEX IF NOT EXISTS tower_assessment_lifecycle_one_active ON ecl_projection.tower_assessment_lifecycle USING btree (tenant_key) WHERE (state = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_tower_command_center_gate ON ecl_projection.tower_command_center USING btree (tenant_key, assessment_id, claim_gate_status, claim_gate_reason_code);

CREATE INDEX IF NOT EXISTS idx_tower_command_center_page ON ecl_projection.tower_command_center USING btree (tenant_key, assessment_id, projection_version, page_key);

CREATE INDEX IF NOT EXISTS idx_tower_evidence_queue_gate ON ecl_projection.tower_evidence_queue USING btree (tenant_key, assessment_id, claim_gate_status, claim_gate_reason_code);

CREATE INDEX IF NOT EXISTS idx_tower_evidence_queue_page ON ecl_projection.tower_evidence_queue USING btree (tenant_key, assessment_id, projection_version, page_key);

CREATE INDEX IF NOT EXISTS idx_tower_value_chain_metric ON ecl_projection.tower_value_chain USING btree (tenant_key, metric_key);

CREATE INDEX IF NOT EXISTS idx_tower_value_chain_page ON ecl_projection.tower_value_chain USING btree (tenant_key, assessment_id, projection_version, page_key);

CREATE INDEX IF NOT EXISTS idx_review_event_subject ON ecl_review.review_event USING btree (tenant_key, assessment_id, subject_kind, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_tenant_type_review ON ecl_source.document USING btree (tenant_key, assessment_id, document_type, review_state);

CREATE INDEX IF NOT EXISTS idx_document_extraction_field ON ecl_source.document_extraction USING btree (tenant_key, assessment_id, document_id, field_key);

CREATE INDEX IF NOT EXISTS idx_source_file_tenant_origin ON ecl_source.source_file USING btree (tenant_key, assessment_id, origin);

CREATE INDEX IF NOT EXISTS idx_source_file_tenant_type ON ecl_source.source_file USING btree (tenant_key, assessment_id, source_type);

CREATE INDEX IF NOT EXISTS idx_source_record_payload_gin ON ecl_source.source_record USING gin (payload_json);

CREATE INDEX IF NOT EXISTS idx_source_record_tenant_type ON ecl_source.source_record USING btree (tenant_key, assessment_id, record_type);

-- 6. functions
CREATE OR REPLACE FUNCTION serving.home_surface_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Home'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    p.basis_summary,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    p.admission_status,
    p.admission_gate_key,
    p.admission_result_json,
    p.id,
    p.page_key,
    p.row_key,
    p.row_type,
    p.title,
    p.summary,
    p.primary_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.home_enterprise_landscape p
  where p.page_key = page_key_arg;
$function$;

CREATE OR REPLACE FUNCTION serving.intelligence_context_rows(surface_key_arg text, context_surface_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Intelligence'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'context_pack'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.surface_key,
    p.row_key,
    'context_pack'::text,
    p.surface_key,
    p.retrieval_state,
    p.primary_object_id,
    p.citation_refs_json,
    to_jsonb(p)
  from ecl_projection.intelligence_context_pack p
  where p.surface_key = context_surface_arg;
$function$;

CREATE OR REPLACE FUNCTION serving.intelligence_pattern_rows(surface_key_arg text, pattern_surface_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Intelligence'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'pattern_evidence'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    '[]'::jsonb,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.surface_key,
    p.row_key,
    p.pattern_key,
    p.pattern_claim,
    p.conflict_state,
    p.primary_object_id,
    p.citation_refs_json,
    to_jsonb(p)
  from ecl_projection.intelligence_pattern_evidence p
  where p.surface_key = pattern_surface_arg;
$function$;

CREATE OR REPLACE FUNCTION serving.intelligence_question_rows(surface_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Intelligence'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'context_pack'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.surface_key,
    p.row_key,
    'question_context'::text,
    p.question_text,
    p.retrieval_state,
    p.primary_object_id,
    p.citation_refs_json,
    to_jsonb(p)
  from ecl_projection.intelligence_question_context p;
$function$;

CREATE OR REPLACE FUNCTION serving.source_contract_rows(surface_key_arg text, page_key_arg text, renewal_only_arg boolean)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    'contract'::text,
    p.contract_name,
    p.vendor_name,
    p.contract_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_contract_360 p
  where not renewal_only_arg
    or (
      p.renewal_notice_date is not null
      and (
        p.renewal_notice_date <= current_date + interval '180 days'
        or p.gap_flags_json <> '[]'::jsonb
      )
    );
$function$;

CREATE OR REPLACE FUNCTION serving.source_event_rows(surface_key_arg text, page_key_arg text, workspace_tab_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'review_event'::text,
    'known'::text,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    p.row_type,
    p.event_title,
    p.gate_reason_detail,
    p.contract_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_event_workspace p
  where workspace_tab_arg = 'all' or p.workspace_tab = workspace_tab_arg;
$function$;

CREATE OR REPLACE FUNCTION serving.source_value_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    p.evidence_state,
    'estimated'::text,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    p.lever_type,
    p.opportunity_title,
    p.value_gate_reason_detail,
    p.contract_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_value_levers p
  where page_key_arg = 'value'
    or (
      page_key_arg = 'sourcing_opportunities'
      and (
        p.opportunity_type <> 'evidence_request'
        or coalesce(p.addressable_spend_usd, 0) > 0
        or coalesce(p.estimated_value_high_usd, 0) > 0
      )
    );
$function$;

CREATE OR REPLACE FUNCTION serving.source_vendor_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    'vendor'::text,
    p.vendor_name,
    p.contract_count::text || ' contracts',
    p.vendor_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_vendor_360 p
  where page_key_arg = 'vendor_portfolio'
    or (
      page_key_arg = 'vendor_360'
      and p.contract_count > 1
    );
$function$;

CREATE OR REPLACE FUNCTION serving.tower_active_assessment_keys()
 RETURNS TABLE(tenant_key text, assessment_id text, projection_version integer)
 LANGUAGE sql
 STABLE
AS $function$
      -- 1. A declared active generation wins outright, for the tenants that have one.
      select
        l.tenant_key,
        l.assessment_id,
        l.projection_version
      from ecl_projection.tower_assessment_lifecycle l
      where l.state = 'active'

      union all

      -- 2. The prior ranking, kept verbatim, and applied only to tenants with no declaration yet.
      --    This is what makes the migration inert on the day it lands. It is a bridge, not a
      --    design: every tenant reaching this branch is one whose active generation is still a
      --    guess.
      select
        ranked.tenant_key,
        ranked.assessment_id,
        ranked.projection_version
      from (
        select
          candidates.*,
          row_number() over (
            partition by candidates.tenant_key
            order by
              candidates.priority desc,
              candidates.projection_version desc,
              candidates.created_at desc,
              candidates.assessment_id desc
          ) as rn
        from (
          select
            p.tenant_key,
            p.assessment_id,
            p.projection_version,
            max(p.created_at) as created_at,
            max(
              case
                when p.row_key = 'executive_summary'
                  and p.display_payload_json ? 'layer4_build_version'
                  then 3
                when p.row_key = 'executive_summary'
                  then 2
                when p.display_payload_json ? 'layer4_build_version'
                  then 1
                else 0
              end
            ) as priority
          from ecl_projection.tower_command_center p
          group by p.tenant_key, p.assessment_id, p.projection_version
        ) candidates
      ) ranked
      where ranked.rn = 1
        and not exists (
          select 1
          from ecl_projection.tower_assessment_lifecycle declared
          where declared.tenant_key = ranked.tenant_key
            and declared.state = 'active'
        );
    $function$;

CREATE OR REPLACE FUNCTION serving.tower_ai_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
      select
        surface_key_arg,
        'Tower'::text,
        p.tenant_key,
        p.assessment_id,
        p.snapshot_id,
        p.projection_manifest_id,
        p.projection_entry_id,
        p.projection_version,
        p.source_hash,
        'source_recorded'::text,
        p.value_state,
        p.review_state,
        'synthetic_generator'::text,
        p.gap_flags_json,
        'not_applicable'::text,
        null::text,
        '{}'::jsonb,
        p.id,
        page_key_arg,
        p.row_key,
        'ai_usage_observation'::text,
        p.use_case_name,
        p.tool_name,
        p.use_case_object_id,
        p.source_refs_json,
        to_jsonb(p)
      from ecl_projection.tower_ai_portfolio p
      join serving.tower_active_assessment_keys() active
        on active.tenant_key = p.tenant_key
       and active.assessment_id = p.assessment_id
       and active.projection_version = p.projection_version
      where coalesce(p.display_payload_json ->> 'page_key', 'ai_portfolio') = page_key_arg;
    $function$;

CREATE OR REPLACE FUNCTION serving.tower_command_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  select
    surface_key_arg,
    'Tower'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.page_key,
    p.row_key,
    p.row_type,
    coalesce(p.claim_id, p.row_key),
    p.claim_gate_reason_detail,
    p.primary_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.tower_command_center p
  join serving.tower_active_assessment_keys() active
    on active.tenant_key = p.tenant_key
   and active.assessment_id = p.assessment_id
   and active.projection_version = p.projection_version
  where page_key_arg = 'all' or p.page_key = page_key_arg;
$function$;

CREATE OR REPLACE FUNCTION serving.tower_evidence_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
        select
          surface_key_arg,
          'Tower'::text,
          p.tenant_key,
          p.assessment_id,
          p.snapshot_id,
          p.projection_manifest_id,
          p.projection_entry_id,
          p.projection_version,
          p.source_hash,
          p.evidence_state,
          'known'::text,
          'not_reviewed'::text,
          'synthetic_generator'::text,
          p.gap_flags_json,
          'not_applicable'::text,
          null::text,
          '{}'::jsonb,
          p.id,
          p.page_key,
          p.row_key,
          p.row_type,
          p.claim_id,
          p.claim_gate_reason_detail,
          p.primary_object_id,
          p.source_refs_json,
          to_jsonb(p)
        from ecl_projection.tower_evidence_queue p
        join serving.tower_active_assessment_keys() active
          on active.tenant_key = p.tenant_key
         and active.assessment_id = p.assessment_id
         and active.projection_version = p.projection_version
        where p.page_key = page_key_arg;
      $function$;

CREATE OR REPLACE FUNCTION serving.tower_value_rows(surface_key_arg text, page_key_arg text)
 RETURNS TABLE(surface_key text, product text, tenant_key text, assessment_id text, snapshot_id uuid, projection_manifest_id uuid, projection_entry_id uuid, projection_version integer, source_hash text, basis text, value_state text, review_state text, origin text, gap_flags_json jsonb, admission_status text, admission_gate_key text, admission_result_json jsonb, projection_row_id uuid, page_key text, row_key text, row_type text, title text, summary text, primary_object_id uuid, source_refs_json jsonb, payload_json jsonb)
 LANGUAGE sql
 STABLE
AS $function$
        select
          surface_key_arg,
          'Tower'::text,
          p.tenant_key,
          p.assessment_id,
          p.snapshot_id,
          p.projection_manifest_id,
          p.projection_entry_id,
          p.projection_version,
          p.source_hash,
          p.evidence_state,
          p.value_state,
          'not_reviewed'::text,
          'synthetic_generator'::text,
          p.gap_flags_json,
          'not_applicable'::text,
          null::text,
          '{}'::jsonb,
          p.id,
          p.page_key,
          p.row_key,
          p.row_type,
          p.claim_id,
          p.claim_gate_reason_detail,
          p.primary_object_id,
          p.source_refs_json,
          to_jsonb(p) || jsonb_build_object(
            'measure_period_start', m.period_start,
            'measure_period_end', m.period_end,
            'measure_scenario', m.scenario,
            'measure_value_number', m.value_number
          )
        from ecl_projection.tower_value_chain p
        join serving.tower_active_assessment_keys() active
          on active.tenant_key = p.tenant_key
         and active.assessment_id = p.assessment_id
         and active.projection_version = p.projection_version
        left join ecl_context.measure m
          on m.tenant_key = p.tenant_key
         and m.assessment_id = p.assessment_id
         and m.id = p.measure_id
        where page_key_arg = 'all' or p.page_key = page_key_arg;
      $function$;

-- 7. views by dependency depth
create or replace view "ecl_context"."application_deployment_v" as
SELECT o.id,
    o.tenant_key,
    o.assessment_id,
    o.object_key,
    o.object_type,
    o.display_name,
    o.business_domain,
    o.lifecycle_state,
    o.source_record_id,
    o.basis,
    o.value_state,
    o.review_state,
    o.confidence,
    o.attributes_json,
    o.created_at,
    o.updated_at,
    o.canonical_semantic_type,
    otc.grain,
    otc.counting_class
   FROM ecl_context.object o
     JOIN ecl_context.object_type_catalog otc ON otc.object_type = o.object_type
  WHERE otc.grain = 'application_deployment'::text AND otc.counting_class = 'deployment_instance'::text;

create or replace view "ecl_context"."application_v" as
SELECT o.id,
    o.tenant_key,
    o.assessment_id,
    o.object_key,
    o.object_type,
    o.display_name,
    o.business_domain,
    o.lifecycle_state,
    o.source_record_id,
    o.basis,
    o.value_state,
    o.review_state,
    o.confidence,
    o.attributes_json,
    o.created_at,
    o.updated_at,
    o.canonical_semantic_type,
    otc.grain,
    otc.counting_class
   FROM ecl_context.object o
     JOIN ecl_context.object_type_catalog otc ON otc.object_type = o.object_type
  WHERE otc.grain = 'application'::text AND otc.counting_class = 'business_entity'::text;

create or replace view "ecl_context"."business_object_v" as
SELECT o.id,
    o.tenant_key,
    o.assessment_id,
    o.object_key,
    o.object_type,
    o.display_name,
    o.business_domain,
    o.lifecycle_state,
    o.source_record_id,
    o.basis,
    o.value_state,
    o.review_state,
    o.confidence,
    o.attributes_json,
    o.created_at,
    o.updated_at,
    o.canonical_semantic_type,
    otc.grain,
    otc.counting_class
   FROM ecl_context.object o
     JOIN ecl_context.object_type_catalog otc ON otc.object_type = o.object_type
  WHERE otc.counting_class = ANY (ARRAY['enterprise_scope'::text, 'business_entity'::text, 'commercial_entity'::text, 'initiative'::text, 'risk_control'::text, 'metric_definition'::text, 'persona'::text]);

create or replace view "ecl_context"."technical_component_v" as
SELECT o.id,
    o.tenant_key,
    o.assessment_id,
    o.object_key,
    o.object_type,
    o.display_name,
    o.business_domain,
    o.lifecycle_state,
    o.source_record_id,
    o.basis,
    o.value_state,
    o.review_state,
    o.confidence,
    o.attributes_json,
    o.created_at,
    o.updated_at,
    o.canonical_semantic_type,
    otc.grain,
    otc.counting_class
   FROM ecl_context.object o
     JOIN ecl_context.object_type_catalog otc ON otc.object_type = o.object_type
  WHERE otc.counting_class = ANY (ARRAY['technical_component'::text, 'deployment_instance'::text]);

create or replace view "serving"."home_applications_systems" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_applications_systems'::text, 'applications_systems'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_browse_record" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_browse_record'::text, 'browse_the_record'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_current_state_architecture" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_current_state_architecture'::text, 'current_state_architecture'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_current_state_data_flow" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_current_state_data_flow'::text, 'current_state_data_flow'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_data_assets_integrations" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_data_assets_integrations'::text, 'data_assets_integrations'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_executive_brief" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_executive_brief'::text, 'executive_brief'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_how_we_operate" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_how_we_operate'::text, 'how_we_operate'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_infrastructure_platforms" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_infrastructure_platforms'::text, 'infrastructure_platforms'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_leadership_perspective" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_leadership_perspective'::text, 'leadership_perspective'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_loaded_record" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_loaded_record'::text, 'what_has_been_loaded'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_needs_attention" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_needs_attention'::text, 'what_needs_attention'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_our_business" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_our_business'::text, 'our_business'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_performance_value" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_performance_value'::text, 'performance_value'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_strategy_value_creation" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_strategy_value_creation'::text, 'strategy_value_creation'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_technology_data" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_technology_data'::text, 'technology_data'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."home_vendor_contracts" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.home_surface_rows('home_vendor_contracts'::text, 'vendor_contracts'::text) home_surface_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."intelligence_advisory" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.intelligence_context_rows('intelligence_advisory'::text, 'advisory_page'::text) intelligence_context_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."intelligence_ask_query" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.intelligence_question_rows('intelligence_ask_query'::text) intelligence_question_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."intelligence_context_summary" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.intelligence_context_rows('intelligence_context_summary'::text, 'context_summary'::text) intelligence_context_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."intelligence_enterprise_landscape" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.intelligence_context_rows('intelligence_enterprise_landscape'::text, 'enterprise_landscape'::text) intelligence_context_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."intelligence_insights_evaluate" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.intelligence_pattern_rows('intelligence_insights_evaluate'::text, 'insights_evaluate'::text) intelligence_pattern_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."intelligence_pattern_detail" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.intelligence_pattern_rows('intelligence_pattern_detail'::text, 'pattern_detail'::text) intelligence_pattern_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_approvals" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_event_rows('source_approvals'::text, 'approvals'::text, 'approvals'::text) source_event_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_compare" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_event_rows('source_compare'::text, 'compare'::text, 'compare'::text) source_event_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_contract_360" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_contract_rows('source_contract_360'::text, 'contract_360'::text, false) source_contract_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_events" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_event_rows('source_events'::text, 'events'::text, 'events'::text) source_event_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_renewal" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_contract_rows('source_renewal'::text, 'renewal'::text, true) source_contract_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_sourcing_opportunities" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_value_rows('source_sourcing_opportunities'::text, 'sourcing_opportunities'::text) source_value_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_value" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_value_rows('source_value'::text, 'value'::text) source_value_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_vendor_360" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_vendor_rows('source_vendor_360'::text, 'vendor_360'::text) source_vendor_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."source_vendor_portfolio" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.source_vendor_rows('source_vendor_portfolio'::text, 'vendor_portfolio'::text) source_vendor_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_adoption_lens" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_ai_rows('tower_adoption_lens'::text, 'adoption_lens'::text) tower_ai_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_ai_portfolio" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_ai_rows('tower_ai_portfolio'::text, 'ai_portfolio'::text) tower_ai_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_command_center" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_command_rows('tower_command_center'::text, 'all'::text) tower_command_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_cost_lens" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_value_rows('tower_cost_lens'::text, 'cost_lens'::text) tower_value_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_decision_lanes" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_command_rows('tower_decision_lanes'::text, 'decision_lanes'::text) tower_command_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_evidence" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_evidence_rows('tower_evidence'::text, 'evidence'::text) tower_evidence_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_recommended_actions" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_command_rows('tower_recommended_actions'::text, 'recommended_actions'::text) tower_command_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_risk_lens" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_evidence_rows('tower_risk_lens'::text, 'risk_lens'::text) tower_evidence_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

create or replace view "serving"."tower_value_proof" as
SELECT surface_key,
    product,
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_entry_id,
    projection_version,
    source_hash,
    basis,
    value_state,
    review_state,
    origin,
    gap_flags_json,
    admission_status,
    admission_gate_key,
    admission_result_json,
    projection_row_id,
    page_key,
    row_key,
    row_type,
    title,
    summary,
    primary_object_id,
    source_refs_json,
    payload_json
   FROM serving.tower_value_rows('tower_value_proof'::text, 'all'::text) tower_value_rows(surface_key, product, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, source_hash, basis, value_state, review_state, origin, gap_flags_json, admission_status, admission_gate_key, admission_result_json, projection_row_id, page_key, row_key, row_type, title, summary, primary_object_id, source_refs_json, payload_json);

-- 8. row-level security and policies
alter table "ecl_commercial"."contract" enable row level security;

alter table "ecl_commercial"."contract_scope" enable row level security;

alter table "ecl_commercial"."contract_service_line" enable row level security;

alter table "ecl_commercial"."invoice_line" enable row level security;

alter table "ecl_commercial"."sla_observation" enable row level security;

alter table "ecl_context"."context_pack" enable row level security;

alter table "ecl_context"."measure" enable row level security;

alter table "ecl_context"."metric_definition" enable row level security;

alter table "ecl_context"."object" enable row level security;

alter table "ecl_context"."relationship" enable row level security;

alter table "ecl_context"."snapshot" enable row level security;

alter table "ecl_projection"."cube_manifest" enable row level security;

alter table "ecl_projection"."cube_slice" enable row level security;

alter table "ecl_projection"."cube_slice_measure" enable row level security;

alter table "ecl_projection"."cube_slice_metric" enable row level security;

alter table "ecl_projection"."home_enterprise_landscape" enable row level security;

alter table "ecl_projection"."intelligence_context_pack" enable row level security;

alter table "ecl_projection"."intelligence_pattern_evidence" enable row level security;

alter table "ecl_projection"."intelligence_question_context" enable row level security;

alter table "ecl_projection"."projection_entry" enable row level security;

alter table "ecl_projection"."projection_entry_document_extraction_ref" enable row level security;

alter table "ecl_projection"."projection_entry_measure_ref" enable row level security;

alter table "ecl_projection"."projection_entry_metric_ref" enable row level security;

alter table "ecl_projection"."projection_entry_object_ref" enable row level security;

alter table "ecl_projection"."projection_entry_relationship_ref" enable row level security;

alter table "ecl_projection"."projection_entry_source_record_ref" enable row level security;

alter table "ecl_projection"."projection_manifest" enable row level security;

alter table "ecl_projection"."source_contract_360" enable row level security;

alter table "ecl_projection"."source_event_workspace" enable row level security;

alter table "ecl_projection"."source_value_levers" enable row level security;

alter table "ecl_projection"."source_vendor_360" enable row level security;

alter table "ecl_projection"."tower_ai_portfolio" enable row level security;

alter table "ecl_projection"."tower_assessment_lifecycle" enable row level security;

alter table "ecl_projection"."tower_command_center" enable row level security;

alter table "ecl_projection"."tower_evidence_queue" enable row level security;

alter table "ecl_projection"."tower_value_chain" enable row level security;

alter table "ecl_review"."review_event" enable row level security;

alter table "ecl_source"."document" enable row level security;

alter table "ecl_source"."document_extraction" enable row level security;

alter table "ecl_source"."source_file" enable row level security;

alter table "ecl_source"."source_record" enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'ecl_projection' and tablename = 'tower_ai_portfolio' and policyname = 'tower_ai_portfolio_tenant_select') then
    create policy "tower_ai_portfolio_tenant_select" on "ecl_projection"."tower_ai_portfolio"
      as permissive
      for select
      to public
      using (((tenant_key = current_setting('app.tenant_key'::text, true)) OR (tenant_key = current_setting('app.client_key'::text, true)) OR (current_setting('app.tenant_key'::text, true) = 'internal-admin'::text) OR (current_setting('app.client_key'::text, true) = 'internal-admin'::text)));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'ecl_projection' and tablename = 'tower_assessment_lifecycle' and policyname = 'tower_assessment_lifecycle_tenant_select') then
    create policy "tower_assessment_lifecycle_tenant_select" on "ecl_projection"."tower_assessment_lifecycle"
      as permissive
      for select
      to public
      using (((tenant_key = current_setting('app.tenant_key'::text, true)) OR (tenant_key = current_setting('app.client_key'::text, true)) OR (current_setting('app.tenant_key'::text, true) = 'internal-admin'::text) OR (current_setting('app.client_key'::text, true) = 'internal-admin'::text)));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'ecl_projection' and tablename = 'tower_command_center' and policyname = 'tower_command_center_tenant_select') then
    create policy "tower_command_center_tenant_select" on "ecl_projection"."tower_command_center"
      as permissive
      for select
      to public
      using (((tenant_key = current_setting('app.tenant_key'::text, true)) OR (tenant_key = current_setting('app.client_key'::text, true)) OR (current_setting('app.tenant_key'::text, true) = 'internal-admin'::text) OR (current_setting('app.client_key'::text, true) = 'internal-admin'::text)));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'ecl_projection' and tablename = 'tower_evidence_queue' and policyname = 'tower_evidence_queue_tenant_select') then
    create policy "tower_evidence_queue_tenant_select" on "ecl_projection"."tower_evidence_queue"
      as permissive
      for select
      to public
      using (((tenant_key = current_setting('app.tenant_key'::text, true)) OR (tenant_key = current_setting('app.client_key'::text, true)) OR (current_setting('app.tenant_key'::text, true) = 'internal-admin'::text) OR (current_setting('app.client_key'::text, true) = 'internal-admin'::text)));
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'ecl_projection' and tablename = 'tower_value_chain' and policyname = 'tower_value_chain_tenant_select') then
    create policy "tower_value_chain_tenant_select" on "ecl_projection"."tower_value_chain"
      as permissive
      for select
      to public
      using (((tenant_key = current_setting('app.tenant_key'::text, true)) OR (tenant_key = current_setting('app.client_key'::text, true)) OR (current_setting('app.tenant_key'::text, true) = 'internal-admin'::text) OR (current_setting('app.client_key'::text, true) = 'internal-admin'::text)));
  end if;
end
$$;
