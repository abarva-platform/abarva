#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.md';
const CLIENT_FACTORY_PATH = 'docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json';
const CLIENT_ONBOARDING_PATH = 'docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.json';
const PREVIEW_E2E_PATH = 'docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.json';
const CONTEXT_POLICY_PATH = 'docs/governance/CONTEXT_CORPUS_POLICY.md';

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
readRequired(CLIENT_ONBOARDING_PATH);
readRequired(PREVIEW_E2E_PATH);
readRequired(CONTEXT_POLICY_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'client-preprod-rehearsal');
  record('packet.status', packet.status === 'scaffold_ready_before_rehearsal');
  requireIncludes('packet.dependsOn', packet.dependsOn ?? [], [
    CLIENT_FACTORY_PATH,
    CLIENT_ONBOARDING_PATH,
    PREVIEW_E2E_PATH,
    CONTEXT_POLICY_PATH,
  ]);
  record('scope.targetPlane', packet.scope?.targetPlane === 'client-preprod');
  record('scope.explicitApprovalRequiredBeforeExecution', packet.scope?.explicitApprovalRequiredBeforeExecution === true);
  record('scope.readOnlyUntilApproved', packet.scope?.readOnlyUntilApproved === true);
  record('scope.clientProdExcluded', packet.scope?.clientProdExcluded === true);
  requireIncludes('packet.requiredApprovalsBeforeMutation', packet.requiredApprovalsBeforeMutation ?? [], [
    'approve_sample_client_code',
    'approve_client_preprod_subscription_creation',
    'approve_client_preprod_resource_deployment',
    'approve_client_preprod_rbac_assignments',
    'approve_client_upload_window',
    'approve_client_preprod_ingestion',
    'approve_search_index_refresh',
    'approve_signed_in_uat',
    'approve_context_health_acceptance',
  ]);
  requireIncludes('packet.rehearsalStages', packet.rehearsalStages ?? [], [
    'approval_packet',
    'subscription_and_resource_proof',
    'identity_rbac_proof',
    'private_connectivity_proof',
    'client_data_upload_receipt',
    'parse_and_review_queue_proof',
    'records_facts_chunks_proof',
    'idempotency_duplicate_proof',
    'search_index_proof',
    'tenant_scoped_retrieval_proof',
    'citation_rendering_proof',
    'promotion_preview_proof',
    'context_bundle_trace_proof',
    'module_readiness_proof',
    'signed_in_browser_uat',
    'artifact_file_cabinet_proof',
    'support_and_runbook_proof',
    'rollback_or_abandon_proof',
  ]);
  requireIncludes('packet.requiredEvidence', packet.requiredEvidence ?? [], [
    'explicit_approval_record',
    'client_preprod_subscription_id',
    'private_endpoint_exports',
    'rbac_assignment_exports',
    'postgres_private_connectivity_proof',
    'blob_private_connectivity_proof',
    'search_private_connectivity_proof',
    'upload_receipt',
    'context_healthcheck_report',
    'duplicate_fact_check',
    'search_index_count_report',
    'retrieval_citation_report',
    'promotion_preview_report',
    'context_bundle_trace_report',
    'signed_in_browser_screenshots',
    'uat_signoff',
    'rollback_or_abandon_plan',
  ]);
  requireIncludes('packet.moduleProofRequired', packet.moduleProofRequired ?? [], [
    'intelligence',
    'moves',
    'source',
    'tower',
  ]);
  requireIncludes('packet.contextHealthMustProve', packet.contextHealthMustProve ?? [], [
    'client_id_resolved',
    'tenant_key_resolved',
    'source_files_staged',
    'source_files_registered',
    'records_committed',
    'facts_committed_current',
    'chunks_committed_current',
    'orphan_facts_zero',
    'duplicate_active_facts_zero',
    'duplicate_active_chunks_zero',
    'search_indexed',
    'tenant_scoped_retrieval',
    'citation_metadata_present',
    'promotion_status_calculated',
    'agent_ready_only_where_eligible',
    'context_bundle_trace_present',
    'wrong_tenant_context_excluded',
    'not_reviewed_blocked_quarantined_excluded',
    'unsupported_claims_flagged',
  ]);
  requireIncludes('packet.uatRoutes', packet.uatRoutes ?? [], [
    '/home',
    '/intelligence',
    '/strategic-moves',
    '/strategic-moves/new',
    '/source',
    '/tower',
    '/setup/admin',
  ]);
  requireIncludes('packet.forbidden', packet.forbidden ?? [], [
    'client_prod_data_action',
    'dns_change',
    'production_traffic_shift',
    'destructive_migration',
    'owner_or_user_access_admin_grant',
    'phi',
    'pii',
    'ungoverned_context_to_model',
    'agent_ready_auto_promotion',
    'chunks_only_claimed_ready',
    'facts_only_claimed_ready',
    'indexed_only_claimed_ready',
  ]);
  record('completion.scaffoldReadyWhenPacketMerged', packet.completionBar?.scaffoldReadyWhenPacketMerged === true);
  record('completion.completeRequiresApprovedClientPreprodRun', packet.completionBar?.completeRequiresApprovedClientPreprodRun === true);
  record('completion.completeRequiresContextBundleProof', packet.completionBar?.completeRequiresContextBundleProof === true);
  record('completion.completeRequiresClientUatSignoff', packet.completionBar?.completeRequiresClientUatSignoff === true);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.doNotCreateAzureResourcesWithoutApproval', packet.doNotCreateAzureResourcesWithoutApproval === true);
  record('packet.doNotLoadClientDataWithoutApproval', packet.doNotLoadClientDataWithoutApproval === true);
  record('packet.doNotRunClientProdActions', packet.doNotRunClientProdActions === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'This packet applies only to `client-preprod`. Client prod is excluded.',
    'Explicit approval is required before:',
    'Context-bundle proven is the real bar.',
    'Do not call chunks-only, facts-only, or indexed-only data ready.',
    'At minimum, signed-in browser UAT must cover:',
    'PHI is present',
    'PII is present without a future explicit policy change',
    'wrong-tenant context appears',
    '`agent_ready` was auto-promoted',
    'ENV-16 is scaffold-ready when this rehearsal packet and its verifier are merged.',
    'ENV-16 is complete only after an approved client preprod rehearsal',
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

console.log(JSON.stringify({ audit: 'client-preprod-rehearsal-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
