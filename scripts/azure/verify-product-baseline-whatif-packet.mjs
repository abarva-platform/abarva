#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const JSON_PATH = 'docs/azure/PRODUCT_BASELINE_WHATIF_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_BASELINE_WHATIF_PACKET_2026-06.md';
const FACTORY_PATH = 'docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json';
const LEDGER_PATH = 'docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json';
const COST_PATH = 'docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json';
const RBAC_PATH = 'docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json';

const checks = [];
const expectedOrder = ['product-dev', 'product-preview', 'product-prod'];

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

function commandIncludes(plan, key, snippet) {
  const value = plan?.templateCommands?.[key] ?? '';
  record(
    `command.${plan?.environmentKey}.${key}`,
    typeof value === 'string' && value.includes(snippet),
    value ? '' : 'missing command',
  );
}

const packetBody = readRequired(JSON_PATH);
const docBody = readRequired(DOC_PATH);
const factoryBody = readRequired(FACTORY_PATH);
const ledgerBody = readRequired(LEDGER_PATH);
const costBody = readRequired(COST_PATH);
const rbacBody = readRequired(RBAC_PATH);

const packet = packetBody ? parseJson(JSON_PATH, packetBody) : null;
const factory = factoryBody ? parseJson(FACTORY_PATH, factoryBody) : null;
const ledger = ledgerBody ? parseJson(LEDGER_PATH, ledgerBody) : null;
const cost = costBody ? parseJson(COST_PATH, costBody) : null;
const rbac = rbacBody ? parseJson(RBAC_PATH, rbacBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.status', packet.status === 'non_mutating_scaffold');
  record('packet.whatIfPlansArray', Array.isArray(packet.environmentWhatIfPlans));
  record('packet.environmentOrder', JSON.stringify(packet.environmentOrder ?? []) === JSON.stringify(expectedOrder));
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'subscription_creation',
    'management_group_assignment',
    'broad_rbac_assignment',
    'budget_creation_or_increase',
    'resource_deployment',
    'product_prod_deploy',
    'dns_change',
    'traffic_shift',
  ]);
  requireIncludes('packet.forbiddenCommands', packet.forbiddenCommandPrefixesWithoutSeparateApproval ?? [], [
    'az account alias create',
    'az role assignment create',
    'az consumption budget create',
    'az deployment sub create',
    'az deployment group create',
    'az containerapp ingress traffic set',
    'az network dns',
  ]);
  record(
    'packet.verifierScript',
    packet.verification?.script === 'scripts/azure/verify-product-baseline-whatif-packet.mjs',
  );
  record('packet.verifierNpmScript', packet.verification?.npmScript === 'npm run azure:product-baseline-whatif:verify');

  const plans = packet.environmentWhatIfPlans ?? [];
  const keys = plans.map((plan) => plan.environmentKey);
  record('packet.planOrder', JSON.stringify(keys) === JSON.stringify(expectedOrder), `actual: ${keys.join(', ')}`);
  for (const key of expectedOrder) {
    const plan = plans.find((entry) => entry.environmentKey === key);
    record(`plan.${key}.exists`, Boolean(plan));
    if (!plan) continue;
    record(`plan.${key}.whatIfOnly`, plan.whatIfOnly === true);
    record(`plan.${key}.subscriptionPlaceholder`, String(plan.subscriptionDisplayName ?? '').startsWith(`sub-abarva-${key}`));
    record(`plan.${key}.managementGroup`, plan.managementGroupTarget === 'abarva-product');
    record(`plan.${key}.budgetPositive`, Number.isInteger(plan.monthlyBudgetUsd) && plan.monthlyBudgetUsd > 0);
    requireIncludes(`plan.${key}.requiredBeforeWhatIf`, plan.requiredBeforeWhatIf ?? [], [
      'approved_subscription_id_placeholder_or_real_id_after_creation',
      'approved_region',
      'approved_budget_owner',
      'approved_cost_center',
      'approved_policy_bundle',
      'approved_rbac_bundle',
    ]);
    commandIncludes(plan, 'setSubscriptionContext', 'az account set');
    commandIncludes(plan, 'subscriptionFoundationWhatIf', 'az deployment sub what-if');
    commandIncludes(plan, 'subscriptionFoundationWhatIf', 'infra/azure/foundation.bicep');
    commandIncludes(plan, 'appRuntimeWhatIf', 'az deployment sub what-if');
    commandIncludes(plan, 'appRuntimeWhatIf', 'infra/azure/app-runtime-foundation.bicep');
    commandIncludes(plan, 'budgetEvidenceRead', 'az consumption budget list');
    commandIncludes(plan, 'policyEvidenceRead', 'az policy assignment list');
    commandIncludes(plan, 'rbacEvidenceRead', 'az role assignment list');
    requireIncludes(`plan.${key}.expectedEvidence`, plan.expectedEvidence ?? [], [
      'what_if_foundation_json',
      'what_if_app_runtime_json',
      'policy_assignment_export',
      'budget_export',
      'rbac_export',
      'tag_export',
      'execution_ledger_reference',
    ]);
  }
}

if (factory) {
  const factoryKeys = (factory.productEnvironments ?? []).map((env) => env.key);
  record('factory.productKeysMatch', JSON.stringify(factoryKeys) === JSON.stringify(expectedOrder));
  record('factory.azureFirst', factory.principles?.includes('azure_first_runtime') === true);
  record('factory.noPhiPii', factory.principles?.includes('no_phi_pii') === true);
}

if (ledger) {
  const ledgerKeys = (ledger.entries ?? [])
    .filter((entry) => expectedOrder.includes(entry.environmentKey))
    .sort((a, b) => a.scope.creationOrder - b.scope.creationOrder)
    .map((entry) => entry.environmentKey);
  record('ledger.productKeysPresent', JSON.stringify(ledgerKeys) === JSON.stringify(expectedOrder));
  record(
    'ledger.hardGatesStillPresent',
    ['subscription_creation', 'budget_creation_or_increase', 'dns_change'].every((gate) =>
      ledger.hardApprovalGates?.includes(gate),
    ),
  );
}

if (cost) {
  record('cost.productDevBudget', cost.budgetRules?.defaultMonthlyBudgetUsd?.['product-dev'] === 500);
  record('cost.productPreviewBudget', cost.budgetRules?.defaultMonthlyBudgetUsd?.['product-preview'] === 500);
  record('cost.productProdBudget', cost.budgetRules?.defaultMonthlyBudgetUsd?.['product-prod'] === 500);
}

if (rbac) {
  for (const key of expectedOrder) {
    record(`rbac.${key}.matrix`, Boolean(rbac.environmentRoleMatrix?.[key]));
  }
}

if (docBody) {
  [
    'Status: non-mutating scaffold',
    'Do not create subscriptions',
    'Verifier: `npm run azure:product-baseline-whatif:verify`',
    'Pause for Anand before:',
    'running `az account alias create`',
    'running `az deployment sub create`',
    '`product-dev`',
    '`product-preview`',
    '`product-prod`',
    'Evidence Bundle',
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

console.log(JSON.stringify({ audit: 'product-baseline-whatif-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
