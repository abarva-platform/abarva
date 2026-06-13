#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MODEL_PATH = 'docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json';
const DOC_PATH = 'docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.md';
const FACTORY_MANIFEST_PATH = 'docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json';

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

const modelBody = readRequired(MODEL_PATH);
const docBody = readRequired(DOC_PATH);
const manifestBody = readRequired(FACTORY_MANIFEST_PATH);

const model = modelBody ? parseJson(MODEL_PATH, modelBody) : null;
const manifest = manifestBody ? parseJson(FACTORY_MANIFEST_PATH, manifestBody) : null;

if (model) {
  record('model.version', model.version === '2026-06', 'expected 2026-06');
  requireIncludes('model.principles', model.principles ?? [], [
    'least_privilege',
    'managed_identity_first',
    'no_persistent_agent_owner_access',
    'human_approval_for_broad_rbac',
    'client_private_planes_isolated',
    'no_phi_pii',
    'auditable_operator_jobs',
  ]);

  const roleKeys = (model.roleDefinitions ?? []).map((role) => role.key);
  requireIncludes('model.roles', roleKeys, [
    'breakglass-owner',
    'platform-maintainer',
    'release-operator',
    'data-plane-operator',
    'ingestion-operator',
    'read-only-auditor',
    'agent-operator',
  ]);

  const agentRole = (model.roleDefinitions ?? []).find((role) => role.key === 'agent-operator');
  record('model.agentOperatorTimeboxed', agentRole?.persistence === 'timeboxed');
  record('model.agentOperatorApprovalRequired', agentRole?.requiresApproval === true);

  const envKeys = Object.keys(model.environmentRoleMatrix ?? {});
  requireIncludes('model.environmentMatrix', envKeys, [
    'product-dev',
    'product-preview',
    'product-prod',
    'client-preprod',
    'client-prod',
  ]);

  for (const [envKey, matrix] of Object.entries(model.environmentRoleMatrix ?? {})) {
    const persistent = matrix.persistent ?? [];
    record(
      `matrix.${envKey}.noPersistentAgentOperator`,
      !persistent.includes('agent-operator'),
      'agent operator must be timeboxed only',
    );
    record(
      `matrix.${envKey}.approvalListPresent`,
      Array.isArray(matrix.approvalRequiredFor) && matrix.approvalRequiredFor.length > 0,
      'each environment needs approval gates',
    );
  }

  const managedIdentityKeys = (model.managedIdentities ?? []).map((identity) => identity.key);
  requireIncludes('model.managedIdentities', managedIdentityKeys, [
    'aca-web-runtime',
    'aca-operator-job',
    'ingestion-worker',
  ]);
  for (const identity of model.managedIdentities ?? []) {
    const disallowed = identity.disallowedPermissions ?? [];
    record(
      `identity.${identity.key}.noOwnerOrUaa`,
      disallowed.includes('owner') && disallowed.includes('user_access_administrator'),
      'managed identities must explicitly disallow Owner/User Access Administrator',
    );
  }

  requireIncludes('model.approvalGates', model.approvalGates ?? [], [
    'subscription_creation',
    'owner_or_user_access_administrator_assignment',
    'product_prod_deploy',
    'product_prod_traffic_shift',
    'dns_change',
    'client_prod_data_action',
    'client_prod_migration',
    'breakglass_use',
    'phi_pii_exception',
  ]);

  requireIncludes('model.forbidden', model.forbidden ?? [], [
    'persistent_agent_owner_access',
    'agent_user_access_administrator',
    'direct_laptop_private_db_write',
    'real_client_data_in_product_dev',
    'phi_upload',
    'pii_upload',
    'unguarded_client_prod_mutation',
  ]);
}

if (manifest && model) {
  const productKeys = (manifest.productEnvironments ?? []).map((env) => env.key);
  const clientKeys = (manifest.clientEnvironmentPattern?.environments ?? []).map((env) => env.key);
  const envKeys = Object.keys(model.environmentRoleMatrix ?? {});
  for (const key of [...productKeys, ...clientKeys]) {
    record(`manifestEnvironment.${key}.hasRbacMatrix`, envKeys.includes(key));
  }
}

if (docBody) {
  [
    'This document defines the identity and access model',
    'It is intentionally non-mutating.',
    'No persistent agent Owner access.',
    'No agent User Access Administrator access.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Agents must stop for human approval before:',
    'creating subscriptions',
    'deploying to Product Prod',
    'mutating Client Prod data',
    'Managed identities must not receive Owner',
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

console.log(JSON.stringify({ audit: 'azure-environment-rbac-model', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
