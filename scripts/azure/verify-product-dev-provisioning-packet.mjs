#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.md';
const FACTORY_PATH = 'docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json';
const RBAC_PATH = 'docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json';
const COST_PATH = 'docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json';

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
const rbacBody = readRequired(RBAC_PATH);
const costBody = readRequired(COST_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const factory = factoryBody ? parseJson(FACTORY_PATH, factoryBody) : null;
const rbac = rbacBody ? parseJson(RBAC_PATH, rbacBody) : null;
const cost = costBody ? parseJson(COST_PATH, costBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'product-dev');
  record('packet.statusRequiresApproval', packet.status === 'approval_required_before_mutation');
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.subscriptionName', packet.subscription?.displayName === 'sub-abarva-product-dev-eus-001');
  record('packet.budget', packet.subscription?.budgetUsdMonthly === 500);
  requireIncludes('packet.budgetThresholds', packet.subscription?.budgetAlertThresholdsPercent ?? [], [50, 80, 100]);
  requireIncludes('packet.disallowedData', packet.subscription?.dataBoundary?.disallowed ?? [], [
    'client-confidential',
    'phi',
    'pii',
    'raw-client-private-documents',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'create_subscription',
    'move_subscription_to_management_group',
    'assign_breakglass_owner',
    'assign_platform_maintainer',
    'create_budget',
    'apply_policy_assignments',
    'create_baseline_resources',
  ]);
  requireIncludes('packet.baselineControls', packet.baselineControls ?? [], [
    'deny_public_blob_access',
    'deny_public_postgres',
    'deny_public_keyvault',
    'require_tags',
    'require_budget',
    'require_diagnostic_settings',
    'no_phi_pii',
  ]);
  record('packet.noPhiPiiTag', packet.requiredTags?.NoPhiPii === 'true');
  requireIncludes('packet.evidenceRequired', packet.evidenceRequired ?? [], [
    'explicit_approval_record',
    'subscription_id',
    'management_group_path',
    'role_assignment_export',
    'policy_assignment_export',
    'budget_id',
    'tag_export',
    'execution_ledger_entry',
  ]);
}

if (factory && packet) {
  const productDev = (factory.productEnvironments ?? []).find((env) => env.key === 'product-dev');
  record('factory.productDevExists', Boolean(productDev));
  record('factory.productDevNoPhi', productDev?.disallowedData?.includes('phi') === true);
  record('factory.productDevNoPii', productDev?.disallowedData?.includes('pii') === true);
}

if (rbac && packet) {
  record('rbac.hasProductDevMatrix', Boolean(rbac.environmentRoleMatrix?.['product-dev']));
}

if (cost && packet) {
  record('cost.hasProductDev', cost.environmentKeys?.includes('product-dev') === true);
  record('cost.productDevBudgetMatches', cost.budgetRules?.defaultMonthlyBudgetUsd?.['product-dev'] === 500);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Do not create the subscription',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Explicit approval is required before:',
    'creating the Product Dev subscription',
    'Budget',
    'These are templates only. Do not run without approval.',
    'Product Dev is not complete until the execution ledger has:',
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

console.log(JSON.stringify({ audit: 'product-dev-provisioning-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
