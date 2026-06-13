#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_DEV_CICD_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_DEV_CICD_PACKET_2026-06.md';
const PROVISIONING_PATH = 'docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.json';
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
const provisioningBody = readRequired(PROVISIONING_PATH);
const ledgerBody = readRequired(LEDGER_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const provisioning = provisioningBody ? parseJson(PROVISIONING_PATH, provisioningBody) : null;
const ledger = ledgerBody ? parseJson(LEDGER_PATH, ledgerBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'product-dev');
  record('packet.status', packet.status === 'scaffold_ready_before_runtime');
  record('packet.runtime', packet.deploymentModel?.runtime === 'Azure Container Apps');
  record('packet.registry', packet.deploymentModel?.registry === 'Azure Container Registry');
  record('packet.pinnedDigest', packet.deploymentModel?.promotionUnit === 'pinned_image_digest');
  record('packet.noVercelProductionRuntime', packet.deploymentModel?.vercelProductionRuntimeAllowed === false);
  record('packet.noSupabaseRuntime', packet.deploymentModel?.supabaseRuntimeAllowed === false);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  requireIncludes('packet.requiredPrChecks', packet.requiredPrChecks ?? [], [
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
  ]);
  requireIncludes('packet.preDeployEvidence', packet.preDeployEvidence ?? [], [
    'pr_number',
    'merge_commit_sha',
    'ci_check_rollup',
    'migration_replay_result',
    'image_tag',
    'image_digest',
    'rollback_target_revision',
  ]);
  requireIncludes('packet.postDeployEvidence', packet.postDeployEvidence ?? [], [
    'aca_revision',
    'traffic_state_before',
    'traffic_state_after',
    'curl_root_headers',
    'curl_health_json',
    'no_vercel_headers',
    'direct_postgres_true',
    'rollback_command',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'create_or_change_github_environment_secret',
    'create_or_change_azure_federated_credential',
    'deploy_runtime_to_product_dev',
    'run_database_migration_against_product_dev',
    'shift_product_dev_traffic',
    'increase_budget_or_runtime_capacity',
    'load_any_client_private_data',
  ]);
  requireIncludes('packet.dataControls.disallowedData', packet.dataControls?.disallowedData ?? [], [
    'client-confidential',
    'phi',
    'pii',
    'raw-client-private-documents',
  ]);
  record('packet.noAutoPromote', packet.dataControls?.autoPromoteAgentReady === false);
}

if (packet && provisioning) {
  record('dependsOn.productDevProvisioning', packet.dependsOn?.includes(PROVISIONING_PATH) === true);
  record('sameEnvironmentAsProvisioning', packet.environmentKey === provisioning.environmentKey);
}

if (packet && ledger) {
  record('dependsOn.executionLedger', packet.dependsOn?.includes(LEDGER_PATH) === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Explicit approval is required before:',
    'pinned image digest',
    'proof that no Vercel headers are present',
    'Nothing may auto-promote to `agent_ready`.',
    'These are templates only. Do not run without approval.',
    'ENV-07 is complete only when',
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

console.log(JSON.stringify({ audit: 'product-dev-cicd-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
