#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MANIFEST_PATH = 'docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json';
const DOC_PATH = 'docs/azure/ABARVA_ENVIRONMENT_FACTORY_2026-06.md';

const checks = [];

function pass(name, detail = '') {
  checks.push({ name, status: 'pass', detail });
}

function fail(name, detail = '') {
  checks.push({ name, status: 'fail', detail });
}

function requireFile(relativePath) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) {
    fail(`file.${relativePath}`, 'required file missing');
    return null;
  }
  pass(`file.${relativePath}`);
  return fs.readFileSync(full, 'utf8');
}

function requireSnippet(relativePath, body, snippet) {
  if (body.includes(snippet)) pass(`snippet.${relativePath}.${snippet}`);
  else fail(`snippet.${relativePath}.${snippet}`, 'required snippet missing');
}

function requireArrayIncludes(name, values, required) {
  const missing = required.filter((item) => !values.includes(item));
  if (missing.length === 0) pass(name);
  else fail(name, `missing: ${missing.join(', ')}`);
}

const manifestBody = requireFile(MANIFEST_PATH);
const docBody = requireFile(DOC_PATH);

let manifest = null;
if (manifestBody) {
  try {
    manifest = JSON.parse(manifestBody);
    pass('manifest.validJson');
  } catch (error) {
    fail('manifest.validJson', error.message);
  }
}

if (manifest) {
  if (manifest.version === '2026-06') pass('manifest.version');
  else fail('manifest.version', 'expected 2026-06');

  requireArrayIncludes('manifest.principles', manifest.principles ?? [], [
    'azure_first_runtime',
    'no_vercel_production_runtime',
    'no_supabase_runtime_reintroduction',
    'no_phi_pii',
    'context_bundle_proof_is_the_readiness_bar',
    'ingestion_receipts_required_for_data_loads',
    'policy_as_code_before_subscription_vending',
  ]);

  const productKeys = (manifest.productEnvironments ?? []).map((env) => env.key);
  requireArrayIncludes('manifest.productEnvironments', productKeys, [
    'product-dev',
    'product-preview',
    'product-prod',
  ]);
  if (new Set(productKeys).size === 3 && productKeys.length === 3) {
    pass('manifest.productEnvironmentCount');
  } else {
    fail('manifest.productEnvironmentCount', 'expected exactly three product environments');
  }
  for (const env of manifest.productEnvironments ?? []) {
    if (env.subscriptionBoundary === 'dedicated') pass(`product.${env.key}.dedicatedSubscription`);
    else fail(`product.${env.key}.dedicatedSubscription`, 'product environments require dedicated subscriptions');
    if ((env.disallowedData ?? []).includes('phi') && (env.disallowedData ?? []).includes('pii')) {
      pass(`product.${env.key}.noPhiPii`);
    } else {
      fail(`product.${env.key}.noPhiPii`, 'PHI/PII must be disallowed');
    }
  }

  const clientPattern = manifest.clientEnvironmentPattern ?? {};
  if (clientPattern.subscriptionBoundary === 'dedicated-per-client-per-environment') {
    pass('clientPattern.subscriptionBoundary');
  } else {
    fail('clientPattern.subscriptionBoundary', 'client preprod/prod must be dedicated per client per environment');
  }
  const clientKeys = (clientPattern.environments ?? []).map((env) => env.key);
  requireArrayIncludes('clientPattern.environments', clientKeys, ['client-preprod', 'client-prod']);

  requireArrayIncludes('manifest.requiredPromotionGates', manifest.requiredPromotionGates ?? [], [
    'production_readiness_gate',
    'context_corpus_governance',
    'no_vercel_production_runtime',
    'runtime_supabase_guard',
    'tenant_purity_guard',
    'fresh_migration_replay',
    'destructive_migration_guard',
    'ingestion_receipt_or_explicit_no_data_change',
    'signed_in_browser_qa',
    'context_bundle_trace_for_agent_surfaces',
    'budget_policy_check',
  ]);

  const dataRules = manifest.dataRules ?? {};
  if (dataRules.phiAllowed === false) pass('dataRules.phiAllowedFalse');
  else fail('dataRules.phiAllowedFalse', 'PHI must not be allowed');
  if (dataRules.piiAllowed === false) pass('dataRules.piiAllowedFalse');
  else fail('dataRules.piiAllowedFalse', 'PII must not be allowed');
  if (dataRules.idempotencyRequired === true) pass('dataRules.idempotencyRequired');
  else fail('dataRules.idempotencyRequired', 'idempotent upload/update behavior is required');
  if (dataRules.agentReadyAutoPromotionAllowed === false) pass('dataRules.noAutoPromote');
  else fail('dataRules.noAutoPromote', 'agent_ready auto-promotion must remain disabled');
}

if (docBody) {
  [
    'Product Dev',
    'Product Preview',
    'Product Prod',
    'Client Preprod',
    'Client Prod',
    'PHI is not accepted.',
    'PII is not accepted.',
    'context-bundle trace',
    'no Vercel production-runtime automation',
    'Synthetic data is a reference showcase, not a shortcut path.',
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

console.log(
  JSON.stringify(
    {
      audit: 'azure-environment-factory-scaffold',
      status,
      summary,
      checks,
    },
    null,
    2,
  ),
);

if (status !== 'pass') process.exit(1);
