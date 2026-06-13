#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json';
const DOC_PATH = 'docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.md';
const FACTORY_PATH = 'docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json';
const VENDING_PATH = 'docs/azure/ENVIRONMENT_SUBSCRIPTION_VENDING_RUNBOOK_2026-06.md';
const RBAC_PATH = 'docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json';
const COST_PATH = 'docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json';
const CLIENT_IAC_SCRIPT = 'scripts/azure/verify-client-tenant-iac.mjs';
const IMMUTABLE_AUDIT_SCRIPT = 'scripts/azure/verify-immutable-audit-log.mjs';
const DEFENDER_SCRIPT = 'scripts/azure/verify-defender-storage-malware.mjs';

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
const factoryBody = readRequired(FACTORY_PATH);
readRequired(VENDING_PATH);
const rbacBody = readRequired(RBAC_PATH);
const costBody = readRequired(COST_PATH);
readRequired(CLIENT_IAC_SCRIPT);
readRequired(IMMUTABLE_AUDIT_SCRIPT);
readRequired(DEFENDER_SCRIPT);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const factory = factoryBody ? parseJson(FACTORY_PATH, factoryBody) : null;
const rbac = rbacBody ? parseJson(RBAC_PATH, rbacBody) : null;
const cost = costBody ? parseJson(COST_PATH, costBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'client-private-plane-factory');
  record('packet.status', packet.status === 'approval_required_before_mutation');
  record('packet.subscriptionsPerClient', packet.clientPlanePattern?.subscriptionsPerClient === 2);
  requireIncludes('packet.requiredEnvironments', packet.clientPlanePattern?.requiredEnvironments ?? [], [
    'client-preprod',
    'client-prod',
  ]);
  record(
    'packet.preprodNameTemplate',
    packet.clientPlanePattern?.subscriptionNameTemplates?.['client-preprod'] ===
      'sub-abarva-<client-code>-client-preprod-eus-001',
  );
  record(
    'packet.prodNameTemplate',
    packet.clientPlanePattern?.subscriptionNameTemplates?.['client-prod'] ===
      'sub-abarva-<client-code>-client-prod-eus-001',
  );
  record('packet.isolation', packet.clientPlanePattern?.isolation === 'single-client-per-subscription');
  requireIncludes('packet.preprodDisallowedData', packet.dataBoundary?.['client-preprod']?.disallowed ?? [], [
    'unapproved-client-confidential',
    'phi',
    'pii',
    'raw-client-prod-documents',
  ]);
  requireIncludes('packet.prodDisallowedData', packet.dataBoundary?.['client-prod']?.disallowed ?? [], [
    'phi',
    'pii-unless-future-contract-explicitly-allows',
    'unapproved-client-confidential',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'approve_client_code',
    'approve_client_preprod_subscription',
    'approve_client_prod_subscription',
    'approve_budget',
    'approve_rbac_assignments',
    'approve_private_network',
    'approve_data_services',
    'approve_ingestion_rehearsal',
    'approve_retrieval_and_context_bundle_proof',
    'approve_client_prod_data_action',
  ]);
  requireIncludes('packet.baselineResourceFamilies', packet.baselineResourceFamilies ?? [], [
    'vnet',
    'private_endpoint_subnets',
    'postgres_flexible_server',
    'blob_storage',
    'key_vault',
    'azure_ai_search',
    'container_apps_jobs',
    'immutable_audit_log',
    'defender_storage_malware',
    'private_dns_zones',
  ]);
  requireIncludes('packet.requiredEvidence', packet.requiredEvidence ?? [], [
    'explicit_approval_record',
    'client_code',
    'preprod_subscription_id',
    'prod_subscription_id',
    'what_if_output',
    'ingestion_receipt',
    'context_healthcheck_report',
    'retrieval_citation_proof',
    'context_bundle_trace_proof',
    'rollback_or_abandon_plan',
  ]);
  requireIncludes('packet.hardStops', packet.hardStops ?? [], [
    'missing_client_code',
    'missing_explicit_approval',
    'product_subscription_used_for_client_private_data',
    'client_prod_mutation_without_approval',
    'public_postgres',
    'public_blob_access',
    'public_keyvault',
    'missing_context_bundle_proof',
    'phi_or_pii_policy_exception_unapproved',
  ]);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.doNotCreateSubscriptionsWithoutApproval', packet.doNotCreateSubscriptionsWithoutApproval === true);
  record('packet.doNotLoadClientDataWithoutApproval', packet.doNotLoadClientDataWithoutApproval === true);
}

if (factory) {
  const clientKeys = new Set((factory.clientEnvironmentPattern?.environments ?? []).map((env) => env.key));
  record('factory.hasClientPreprod', clientKeys.has('client-preprod'));
  record('factory.hasClientProd', clientKeys.has('client-prod'));
}

if (rbac) {
  record('rbac.hasClientPreprodMatrix', Boolean(rbac.environmentRoleMatrix?.['client-preprod']));
  record('rbac.hasClientProdMatrix', Boolean(rbac.environmentRoleMatrix?.['client-prod']));
}

if (cost) {
  record('cost.hasClientPreprod', cost.environmentKeys?.includes('client-preprod') === true);
  record('cost.hasClientProd', cost.environmentKeys?.includes('client-prod') === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Do not create subscriptions',
    'Do not run without approval.',
    'Every client private plane has two subscriptions:',
    'one client per subscription, and two subscriptions per client.',
    'PHI is not accepted.',
    'PII is not accepted unless a future contract explicitly changes the policy',
    "Client private data belongs in that client's private preprod/prod subscriptions.",
    'context-bundle proof is missing',
    'ENV-14 is scaffold-ready when this factory packet and its verifier are merged.',
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

console.log(JSON.stringify({ audit: 'client-private-plane-factory', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
