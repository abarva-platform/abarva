#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MODEL_PATH = 'docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json';
const DOC_PATH = 'docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.md';
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

const requiredEnvironmentKeys = ['product-dev', 'product-preview', 'product-prod', 'client-preprod', 'client-prod'];

if (model) {
  record('model.version', model.version === '2026-06', 'expected 2026-06');
  requireIncludes('model.principles', model.principles ?? [], [
    'canonical_environment_keys_only',
    'no_real_client_names_in_resource_names',
    'required_tags_before_resource_creation',
    'budget_before_workload',
    'cost_alerts_before_runtime',
    'no_phi_pii',
  ]);
  requireIncludes('model.environmentKeys', model.environmentKeys ?? [], requiredEnvironmentKeys);

  const naming = model.naming ?? {};
  record('naming.subscriptionPattern', naming.subscriptionPattern === 'sub-abarva-{environmentKey}-{regionCode}-{sequence}');
  record(
    'naming.clientSubscriptionPattern',
    naming.clientSubscriptionPattern === 'sub-abarva-{clientCode}-{environmentKey}-{regionCode}-{sequence}',
  );
  record('naming.noRealClientNamesRule', String(naming.clientCodeRule ?? '').includes('Do not use legal/client display names'));
  requireIncludes('naming.regionCodes', naming.allowedRegionCodes ?? [], ['eus', 'eus2', 'cus']);

  requireIncludes('model.requiredTags', model.requiredTags ?? [], [
    'Environment',
    'EnvironmentKey',
    'Plane',
    'Owner',
    'CostCenter',
    'DataClassification',
    'ClientCode',
    'ManagedBy',
    'Repository',
    'ReleaseLane',
    'Criticality',
    'CreatedBy',
    'CreatedAt',
    'Expiry',
    'NoPhiPii',
  ]);

  const tagRules = model.tagRules ?? {};
  requireIncludes('tagRules.EnvironmentKey', tagRules.EnvironmentKey ?? [], requiredEnvironmentKeys);
  requireIncludes('tagRules.NoPhiPii', tagRules.NoPhiPii ?? [], ['true']);
  requireIncludes('tagRules.ReleaseLane', tagRules.ReleaseLane ?? [], [
    'global-control-lane',
    'client-data-lane',
    'internal-admin',
    'public-demo',
    'experimental',
  ]);

  const budgetRules = model.budgetRules ?? {};
  record('budget.beforeRuntime', budgetRules.budgetRequiredBeforeRuntime === true);
  record('budget.alertsRequired', budgetRules.alertsRequired === true);
  requireIncludes('budget.thresholds', budgetRules.alertThresholdsPercent ?? [], [50, 80, 100]);
  record('budget.recipientsRequired', budgetRules.alertRecipientsRequired === true);
  record('budget.changeRequiresApproval', budgetRules.budgetChangeRequiresApproval === true);
  for (const key of requiredEnvironmentKeys) {
    record(
      `budget.defaultMonthlyBudgetUsd.${key}`,
      Number.isFinite(budgetRules.defaultMonthlyBudgetUsd?.[key]) && budgetRules.defaultMonthlyBudgetUsd[key] > 0,
      'each environment requires a positive planning budget',
    );
  }

  requireIncludes('model.forbidden', model.forbidden ?? [], [
    'untagged_resource_creation',
    'runtime_without_budget',
    'real_client_legal_name_in_resource_name',
    'missing_owner_tag',
    'missing_data_classification_tag',
    'no_phi_pii_false',
    'manual_resource_creation_without_ledger',
  ]);
}

if (manifest && model) {
  const productKeys = (manifest.productEnvironments ?? []).map((env) => env.key);
  const clientKeys = (manifest.clientEnvironmentPattern?.environments ?? []).map((env) => env.key);
  for (const key of [...productKeys, ...clientKeys]) {
    record(`manifestEnvironment.${key}.hasNamingBudgetPolicy`, (model.environmentKeys ?? []).includes(key));
  }
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Client code rule: use canonical short client codes only.',
    'Do not use legal/client display names in Azure resource names.',
    'Every subscription and resource group must have the required tags before workload provisioning:',
    '`NoPhiPii` must be `true`.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Budgets must exist before runtime workloads are created.',
    'alert thresholds at 50%, 80%, and 100%',
    'Any budget increase requires explicit approval.',
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

console.log(JSON.stringify({ audit: 'azure-environment-cost-controls', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
