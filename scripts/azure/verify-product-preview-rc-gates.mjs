#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.md';
const PREVIEW_PROVISIONING_PATH = 'docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json';
const DEV_CICD_PATH = 'docs/azure/PRODUCT_DEV_CICD_PACKET_2026-06.json';
const SYNTHETIC_BASELINE_PATH = 'docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.json';
const LEDGER_PATH = 'docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json';

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
const previewBody = readRequired(PREVIEW_PROVISIONING_PATH);
const devCicdBody = readRequired(DEV_CICD_PATH);
const syntheticBody = readRequired(SYNTHETIC_BASELINE_PATH);
const ledgerBody = readRequired(LEDGER_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const preview = previewBody ? parseJson(PREVIEW_PROVISIONING_PATH, previewBody) : null;
const devCicd = devCicdBody ? parseJson(DEV_CICD_PATH, devCicdBody) : null;
const synthetic = syntheticBody ? parseJson(SYNTHETIC_BASELINE_PATH, syntheticBody) : null;
const ledger = ledgerBody ? parseJson(LEDGER_PATH, ledgerBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'product-preview');
  record('packet.status', packet.status === 'scaffold_ready_before_runtime');
  record('packet.pinnedDigest', packet.releaseCandidateIdentity?.promotionUnit === 'pinned_image_digest');
  record('packet.runtime', packet.releaseCandidateIdentity?.runtime === 'Azure Container Apps');
  record('packet.registry', packet.releaseCandidateIdentity?.registry === 'Azure Container Registry');
  record('packet.noVercelProductionRuntime', packet.releaseCandidateIdentity?.vercelProductionRuntimeAllowed === false);
  record('packet.noSupabaseRuntime', packet.releaseCandidateIdentity?.supabaseRuntimeAllowed === false);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  requireIncludes('packet.releaseCandidateIdentity.required', packet.releaseCandidateIdentity?.required ?? [], [
    'pr_number',
    'merge_commit_sha',
    'release_record_path',
    'image_tag',
    'image_digest',
    'migration_set',
    'rollback_target',
  ]);
  requireIncludes('packet.requiredCiGates', packet.requiredCiGates ?? [], [
    'release_check',
    'typecheck',
    'eslint',
    'gitleaks',
    'fresh_postgres_migration_replay',
    'production_readiness_gate',
    'context_corpus_governance_gate',
    'canonical_tenant_allowlist',
    'runtime_supabase_import_guard',
    'vercel_production_runtime_guard',
    'control_plane_purity',
    'browser_matrix_smoke',
    'public_axe_accessibility',
    'lighthouse_budget',
    'next_bundle_budget',
  ]);
  requireIncludes('packet.requiredPreviewEvidence', packet.requiredPreviewEvidence ?? [], [
    'azure_build_log',
    'image_digest',
    'aca_revision_export',
    'traffic_state_before',
    'traffic_state_after',
    'curl_root_headers',
    'curl_health_json',
    'no_vercel_headers',
    'azure_postgres_health',
    'direct_postgres_true',
    'signed_in_browser_qa_report',
    'context_healthcheck_report',
    'retrieval_citation_proof',
    'artifact_download_proof',
    'rollback_command',
  ]);
  requireIncludes('packet.dataReadiness.allowedData', packet.dataReadinessGates?.allowedData ?? [], [
    'synthetic',
    'pilot-reference',
    'client-approved-redacted',
  ]);
  requireIncludes('packet.dataReadiness.disallowedData', packet.dataReadinessGates?.disallowedData ?? [], [
    'client-confidential-unapproved',
    'phi',
    'pii',
    'raw-client-private-documents',
  ]);
  record('packet.requiresIngestionReceipt', packet.dataReadinessGates?.requiresIngestionReceipt === true);
  record('packet.requiresBlobProof', packet.dataReadinessGates?.requiresBlobProof === true);
  record('packet.requiresFactBackedRecords', packet.dataReadinessGates?.requiresFactBackedRecords === true);
  record('packet.requiresSearchIndexProof', packet.dataReadinessGates?.requiresSearchIndexProof === true);
  record('packet.requiresTenantScopedRetrieval', packet.dataReadinessGates?.requiresTenantScopedRetrieval === true);
  record('packet.requiresCitationMetadata', packet.dataReadinessGates?.requiresCitationMetadata === true);
  record('packet.requiresContextBundleTrace', packet.dataReadinessGates?.requiresContextBundleTrace === true);
  record('packet.noAutoPromote', packet.dataReadinessGates?.autoPromoteAgentReady === false);
  requireIncludes('packet.forbiddenReadyClaims', packet.dataReadinessGates?.forbiddenReadyClaims ?? [], [
    'chunks_only',
    'facts_only',
    'indexed_only',
  ]);
  requireIncludes('packet.promotionDecisionGates', packet.promotionDecisionGates ?? [], [
    'all_ci_gates_green',
    'all_preview_evidence_present',
    'context_healthcheck_passed_or_gaps_accepted',
    'signed_in_browser_qa_passed',
    'rollback_path_verified',
    'release_operator_approval_recorded',
    'product_owner_approval_recorded',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'deploy_release_candidate_to_product_preview',
    'run_database_migration_against_product_preview',
    'shift_product_preview_traffic',
    'load_preview_data',
    'accept_context_healthcheck_gaps',
    'promote_release_candidate_to_product_prod',
  ]);
}

if (packet && preview) {
  record('dependsOn.productPreviewProvisioning', packet.dependsOn?.includes(PREVIEW_PROVISIONING_PATH) === true);
  record('sameEnvironmentAsPreviewProvisioning', packet.environmentKey === preview.environmentKey);
}

if (packet && devCicd) {
  record('dependsOn.productDevCicd', packet.dependsOn?.includes(DEV_CICD_PATH) === true);
  record('inheritsRuntimeFromDevCicd', packet.releaseCandidateIdentity?.runtime === devCicd.deploymentModel?.runtime);
}

if (packet && synthetic) {
  record('dependsOn.syntheticBaseline', packet.dependsOn?.includes(SYNTHETIC_BASELINE_PATH) === true);
  record('syntheticBaselineNoAutoPromote', synthetic.readinessControls?.autoPromoteAgentReady === false);
}

if (packet && ledger) {
  record('dependsOn.executionLedger', packet.dependsOn?.includes(LEDGER_PATH) === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Vercel production runtime is not allowed.',
    'Supabase runtime is not allowed.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Do not call chunks-only data ready.',
    'Do not call facts-only data ready.',
    'Do not call indexed-only data ready.',
    'Context-bundle trace proof is the real bar.',
    'Nothing may auto-promote to `agent_ready`.',
    'Explicit approval is required before:',
    'These are templates only. Do not run without approval.',
    'ENV-10 is complete only after Product Preview exists',
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

console.log(JSON.stringify({ audit: 'product-preview-rc-gates', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
