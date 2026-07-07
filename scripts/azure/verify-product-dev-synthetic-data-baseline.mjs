#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.md';
const PROVISIONING_PATH = 'docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.json';
const CICD_PATH = 'docs/azure/PRODUCT_DEV_CICD_PACKET_2026-06.json';
const POLICY_PATH = 'docs/governance/CONTEXT_CORPUS_POLICY.md';
const ONBOARDING_PATH = 'docs/governance/NEW_DATASET_ONBOARDING_POLICY.md';

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
const provisioningBody = readRequired(PROVISIONING_PATH);
const cicdBody = readRequired(CICD_PATH);
const policyBody = readRequired(POLICY_PATH);
const onboardingBody = readRequired(ONBOARDING_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const provisioning = provisioningBody ? parseJson(PROVISIONING_PATH, provisioningBody) : null;
const cicd = cicdBody ? parseJson(CICD_PATH, cicdBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'product-dev');
  record('packet.status', packet.status === 'scaffold_ready_before_load');
  record('packet.adminBulkPathRequired', packet.sourceOfTruth?.adminBulkPathRequired === true);
  record('packet.seedShortcutBlocked', packet.sourceOfTruth?.seedShortcutAllowedForPilotReadiness === false);
  record('packet.ingestionReceiptRequired', packet.sourceOfTruth?.ingestionReceiptRequired === true);
  record('packet.zipHonesty', packet.allowedInputFormats?.zipSupportMayNotBeClaimedUnlessImplemented === true);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  requireIncludes('packet.requiredPipelineStates', packet.requiredPipelineStates ?? [], [
    'local_artifact_generated',
    'local_parse_preflight_passed',
    'product_loader_api_accepted_upload',
    'azure_blob_staged_original_files',
    'queue_or_private_worker_handoff',
    'parser_extracted_text_tables_facts_with_citations',
    'review_queue_received_low_confidence_evidence',
    'records_facts_chunks_committed',
    'embeddings_search_index_refreshed',
    'live_signed_in_retrieval_or_answer_qa_proved_usable',
  ]);
  requireIncludes('packet.requiredReceiptFields', packet.requiredReceiptFields ?? [], [
    'client_id',
    'tenant_key',
    'source_file_hash',
    'blob_uri',
    'parser_name',
    'record_count',
    'fact_count',
    'chunk_count',
    'citation_count',
    'search_index_refresh_id',
    'retrieval_probe_id',
  ]);
  record('packet.factKeyRequired', packet.idempotencyControls?.deterministicFactKeyRequired === true);
  record('packet.sameFileNoOp', packet.idempotencyControls?.reuploadSameFileNoOp === true);
  record('packet.supersedeChangedFact', packet.idempotencyControls?.changedFactSupersedesPreviousFact === true);
  record('packet.duplicateFactsBlocked', packet.idempotencyControls?.duplicateActiveFactsBlocked === true);
  record('packet.duplicateChunksBlocked', packet.idempotencyControls?.duplicateActiveChunksBlocked === true);
  record('packet.noAutoPromote', packet.readinessControls?.autoPromoteAgentReady === false);
  record('packet.initialNotReviewed', packet.readinessControls?.initialReadinessStatus === 'not_reviewed');
  record('packet.bundleProofRequired', packet.readinessControls?.agentReadyRequiresValidatedContextBundle === true);
  requireIncludes('packet.dimensions', packet.dimensionsRequiredForSyntheticReference ?? [], [
    'enterprise_profile',
    'leadership_org',
    'applications_systems',
    'infrastructure_cloud',
    'vendor_contracts',
    'it_financials',
    'kpis_value',
    'dora_engineering_metrics',
    'incidents_itsm',
    'initiatives_moves',
    'risks_controls',
    'artifacts_evidence',
    'ai_data_use_cases',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'run_product_dev_bulk_load',
    'write_to_product_dev_data_plane',
    'refresh_product_dev_search_index',
    'promote_any_row_to_agent_ready',
    'load_any_client_private_data',
    'accept_any_phi_or_pii',
  ]);
  requireIncludes('packet.forbidden', packet.forbidden ?? [], [
    'phi',
    'pii',
    'seed_shortcut_as_pilot_ready',
    'chunks_only_claimed_ready',
    'facts_only_claimed_ready',
    'indexed_only_claimed_ready',
    'auto_agent_ready',
  ]);
}

if (packet && provisioning) {
  record('dependsOn.productDevProvisioning', packet.dependsOn?.includes(PROVISIONING_PATH) === true);
  record('sameEnvironmentAsProvisioning', packet.environmentKey === provisioning.environmentKey);
}

if (packet && cicd) {
  record('dependsOn.productDevCicd', packet.dependsOn?.includes(CICD_PATH) === true);
  record('sameEnvironmentAsCicd', packet.environmentKey === cicd.environmentKey);
}

if (policyBody) record('policy.referencesAgentReady', policyBody.includes('agent_ready'));
if (onboardingBody) record('onboardingPolicyExists', onboardingBody.includes('manifest'));

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Synthetic data is a reference showcase, not a shortcut path.',
    'Do not call chunks-only data ready.',
    'Do not call facts-only data ready.',
    'Do not call indexed-only data ready.',
    'Context-bundle proven is the real bar.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Do not claim one-file ZIP support',
    'Every load must produce a receipt with:',
    'No row may auto-promote to `agent_ready`.',
    'Explicit approval is required before:',
    'ENV-08 is complete only when',
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

console.log(JSON.stringify({ audit: 'product-dev-synthetic-data-baseline', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
