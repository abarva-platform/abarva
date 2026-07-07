#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.json';
const DOC_PATH = 'docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.md';
const CLIENT_FACTORY_PATH = 'docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json';
const SYNTHETIC_BASELINE_PATH = 'docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.json';
const CONTEXT_POLICY_PATH = 'docs/governance/CONTEXT_CORPUS_POLICY.md';
const ONBOARDING_POLICY_PATH = 'docs/governance/NEW_DATASET_ONBOARDING_POLICY.md';

const checks = [];

function record(name, ok, detail = '') {
  checks.push({ name, status: ok ? 'pass' : 'fail', detail });
}

function readRequired(relativePath) {
  const full = path.join(ROOT, relativePath);
  const exists = fs.existsSync(full);
  record(`file.${relativePath}`, exists, exists ? '' : 'missing required file');
  return exists ? fs.readFileSync(full, 'utf8') : null;
}

function parseJson(relativePath, body) {
  try {
    const parsed = JSON.parse(body);
    record(`json.${relativePath}`, true);
    return parsed;
  } catch (error) {
    record(`json.${relativePath}`, false, error.message);
    return null;
  }
}

function requireIncludes(name, values, required) {
  const missing = required.filter((item) => !values.includes(item));
  record(name, missing.length === 0, missing.length === 0 ? '' : `missing: ${missing.join(', ')}`);
}

function requireSnippet(relativePath, body, snippet) {
  record(
    `snippet.${relativePath}.${snippet}`,
    body.includes(snippet),
    body.includes(snippet) ? '' : 'missing required snippet',
  );
}

const packetBody = readRequired(PACKET_PATH);
const docBody = readRequired(DOC_PATH);
readRequired(CLIENT_FACTORY_PATH);
readRequired(SYNTHETIC_BASELINE_PATH);
readRequired(CONTEXT_POLICY_PATH);
readRequired(ONBOARDING_POLICY_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'client-data-onboarding-process');
  record('packet.status', packet.status === 'scaffold_ready_before_client_upload');
  record('packet.appliesToAllUploadPaths', packet.scope?.appliesToAllUploadPaths === true);
  record('packet.adminBulkPathRequired', packet.scope?.adminBulkPathRequired === true);
  record('packet.manifestRequired', packet.scope?.manifestRequired === true);
  record('packet.contextBundleProofRequired', packet.scope?.contextBundleProofRequired === true);
  requireIncludes('packet.scope.appliesTo', packet.scope?.appliesTo ?? [], ['client-preprod', 'client-prod']);
  requireIncludes('packet.dependsOn', packet.dependsOn ?? [], [
    CLIENT_FACTORY_PATH,
    SYNTHETIC_BASELINE_PATH,
    CONTEXT_POLICY_PATH,
    ONBOARDING_POLICY_PATH,
  ]);
  requireIncludes('packet.allowedCommitFormats', packet.allowedInputFormats?.commitEligibleWhenSchemaValid ?? [], [
    'csv',
    'json',
    'jsonl',
    'yaml',
  ]);
  requireIncludes(
    'packet.reviewRequiredFormats',
    packet.allowedInputFormats?.reviewRequiredUnlessDeterministicParserExists ?? [],
    ['xlsx', 'pdf', 'docx', 'pptx'],
  );
  record('packet.zipSupportHonesty', packet.allowedInputFormats?.zipSupportMayNotBeClaimedUnlessImplemented === true);
  requireIncludes('packet.requiredTemplates', packet.requiredTemplates ?? [], [
    'enterprise_profile',
    'leadership_org',
    'applications_systems',
    'infrastructure_cloud',
    'integrations',
    'vendor_contracts',
    'it_financials',
    'kpis_value',
    'dora_engineering_metrics',
    'incidents_itsm',
    'slas',
    'initiatives_moves',
    'risks_controls',
    'artifacts_evidence',
    'ai_data_use_cases',
  ]);
  requireIncludes('packet.requiredPipelineStates', packet.requiredPipelineStates ?? [], [
    'source_files_received',
    'azure_blob_staged_original_files',
    'source_files_registered_in_postgres',
    'enterprise_context_records_committed',
    'enterprise_context_facts_committed',
    'enterprise_context_chunks_committed',
    'facts_default_current_view_refreshed',
    'embeddings_search_index_refreshed',
    'tenant_scoped_retrieval_proved',
    'citation_rendering_proved',
    'promotion_status_calculated',
    'context_bundle_trace_proved',
    'module_readiness_calculated',
  ]);
  requireIncludes('packet.requiredReceiptFields', packet.requiredReceiptFields ?? [], [
    'client_id',
    'tenant_key',
    'client_plane',
    'dataset_manifest_id',
    'upload_batch_id',
    'source_file_hash',
    'blob_uri',
    'source_file_id',
    'template_id',
    'template_version',
    'superseded_fact_count',
    'duplicate_fact_count',
    'search_index_refresh_id',
    'retrieval_probe_id',
    'context_bundle_trace_id',
  ]);
  const idempotency = packet.idempotencyControls ?? {};
  record('idempotency.deterministicFactKeyRequired', idempotency.deterministicFactKeyRequired === true);
  record('idempotency.sameFileReuploadNoOp', idempotency.sameFileReuploadNoOp === true);
  record('idempotency.changedFactSupersedesPreviousFact', idempotency.changedFactSupersedesPreviousFact === true);
  record('idempotency.oldFactExcludedFromDefaultCurrentView', idempotency.oldFactExcludedFromDefaultCurrentView === true);
  record('idempotency.duplicateActiveFactsBlocked', idempotency.duplicateActiveFactsBlocked === true);
  record('idempotency.duplicateSearchDocumentsBlocked', idempotency.duplicateSearchDocumentsBlocked === true);
  const readiness = packet.readinessControls ?? {};
  record('readiness.autoPromoteAgentReadyFalse', readiness.autoPromoteAgentReady === false);
  record('readiness.initialNotReviewed', readiness.initialReadinessStatus === 'not_reviewed');
  record(
    'readiness.promotionCandidateRequiresRetrievalAndCitationProof',
    readiness.promotionCandidateRequiresRetrievalAndCitationProof === true,
  );
  record('readiness.agentReadyRequiresValidatedContextBundle', readiness.agentReadyRequiresValidatedContextBundle === true);
  record('readiness.notReviewedExcludedFromModelInput', readiness.notReviewedExcludedFromModelInput === true);
  requireIncludes('packet.requiredHealthChecks', packet.requiredHealthChecks ?? [], [
    'blob_staging_proof',
    'record_count_by_type',
    'fact_count_by_lifecycle_state',
    'orphan_fact_count',
    'duplicate_active_fact_count',
    'search_document_count',
    'tenant_scoped_retrieval_count',
    'citation_metadata_present',
    'promotion_status_counts',
    'context_bundle_trace_proof',
    'module_readiness_summary',
  ]);
  requireIncludes('packet.moduleProofRequired', packet.moduleProofRequired ?? [], [
    'intelligence',
    'moves',
    'source',
    'tower',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'approve_client_upload_window',
    'approve_client_preprod_ingestion',
    'approve_client_prod_ingestion',
    'approve_search_index_refresh',
    'approve_agent_ready_promotion',
    'approve_client_prod_data_action',
  ]);
  requireIncludes('packet.forbidden', packet.forbidden ?? [], [
    'phi',
    'pii',
    'chunks_only_claimed_ready',
    'facts_only_claimed_ready',
    'indexed_only_claimed_ready',
    'agent_ready_without_context_bundle_proof',
    'ungoverned_context_to_model',
    'wrong_tenant_context_in_bundle',
    'duplicate_current_facts',
  ]);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.doNotLoadClientDataWithoutApproval', packet.doNotLoadClientDataWithoutApproval === true);
  record('packet.doNotPromoteAgentReadyWithoutApproval', packet.doNotPromoteAgentReadyWithoutApproval === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Every client upload path must produce the same evidence chain:',
    'Do not call chunks-only data ready.',
    'Do not call facts-only data ready.',
    'Do not call indexed-only data ready.',
    'Context-bundle proven is the real bar.',
    'PHI is not accepted.',
    'PII is not accepted unless a future contract explicitly changes the policy',
    'The governed Admin bulk path is manifest-driven and supports loose multi-file uploads.',
    'Do not claim one-file ZIP support',
    'Updating org structure, financial KPIs, vendor contracts, systems, or any other dimension must update or supersede existing current facts.',
    'No row may auto-promote to `agent_ready`.',
    'Each client data onboarding run must produce at least one context-bundle proof',
    'ENV-15 is scaffold-ready when this onboarding process packet and its verifier are merged.',
  ].forEach((snippet) => requireSnippet(DOC_PATH, docBody, snippet));
}

const summary = checks.reduce(
  (acc, check) => {
    acc[check.status] = (acc[check.status] ?? 0) + 1;
    return acc;
  },
  { pass: 0, fail: 0 },
);
const status = summary.fail > 0 ? 'fail' : 'pass';

console.log(JSON.stringify({ audit: 'client-data-onboarding-process', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
