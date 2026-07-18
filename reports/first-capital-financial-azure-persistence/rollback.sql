-- Candidate rollback SQL generated for dry-run review only.
-- Run only in the approved non-prod database after explicit operator approval.
-- tenant_key: first-capital-financial
-- candidate_contract_version: first-capital-financial-rich-standard-candidate-20260717
-- load_run_id: FCF-CANDIDATE-LOAD-20260717
BEGIN;
DELETE FROM intelligence_v7.tenant_pack_runs WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.source_files WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_sources WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_source_files WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.data_ingestion_runs WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.pilot_ingestion_file_manifests WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.pilot_ingestion_load_commits WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.business_records WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.record_fields WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_records WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_facts WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_evidence WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_quality_issues WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_stewardship_tasks WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.derived_intelligence_quality_reports WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.module_readiness_scores WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.home_expected_fields WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.graph_nodes WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM intelligence_v7.relationship_edges WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_relationships WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_graph_nodes WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_graph_edges WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_chunks WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.enterprise_context_chunk_queue WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.governed_object_readiness WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.source_registry WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.entities WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.facts WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.relationships WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.measures WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.measure_results WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.question_contracts WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.validation_runs WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM cio_tower.validation_results WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.program_origination_drafts WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.generated_artifacts WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.source_context_receipts WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.source_contract_evidence_manifests WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.source_contract_evidence_rows WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.admin_datasets WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.admin_dataset_quality WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.admin_blockers WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
DELETE FROM public.admin_audit_log WHERE tenant_key = 'first-capital-financial' AND load_run_id = 'FCF-CANDIDATE-LOAD-20260717';
COMMIT;
