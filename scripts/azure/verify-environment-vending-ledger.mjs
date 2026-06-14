#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RUNBOOK_PATH = 'docs/azure/ENVIRONMENT_SUBSCRIPTION_VENDING_RUNBOOK_2026-06.md';
const LEDGER_PATH = 'docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json';
const FACTORY_MANIFEST_PATH = 'docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json';

const checks = [];

function record(name, ok, detail = '') {
  checks.push({ name, status: ok ? 'pass' : 'fail', detail });
}

function requireFile(relativePath) {
  const full = path.join(ROOT, relativePath);
  const exists = fs.existsSync(full);
  record(`file.${relativePath}`, exists, exists ? '' : 'missing required file');
  return exists ? fs.readFileSync(full, 'utf8') : null;
}

function requireSnippet(relativePath, body, snippet) {
  record(
    `snippet.${relativePath}.${snippet}`,
    body.includes(snippet),
    body.includes(snippet) ? '' : 'missing required snippet',
  );
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

const runbook = requireFile(RUNBOOK_PATH);
const ledgerBody = requireFile(LEDGER_PATH);
const manifestBody = requireFile(FACTORY_MANIFEST_PATH);
const ledger = ledgerBody ? parseJson(LEDGER_PATH, ledgerBody) : null;
const manifest = manifestBody ? parseJson(FACTORY_MANIFEST_PATH, manifestBody) : null;

if (runbook) {
  [
    'This runbook is deliberately non-mutating.',
    'Product Dev',
    'Product Preview',
    'Product Prod',
    'Client Preprod',
    'Client Prod',
    'Agents must pause for explicit human approval before:',
    'creating a subscription',
    'assigning broad Owner/User Access Administrator roles',
    'loading real client production data',
    'No subscription is considered factory-complete unless its ledger entry has status `verified`.',
  ].forEach((snippet) => requireSnippet(RUNBOOK_PATH, runbook, snippet));
}

if (ledger) {
  record('ledger.version', ledger.ledgerVersion === '2026-06', 'expected 2026-06');
  record('ledger.entriesArray', Array.isArray(ledger.entries), 'entries must be an array');
  record(
    'ledger.hardApprovalGates',
    Array.isArray(ledger.hardApprovalGates) &&
      [
        'subscription_creation',
        'management_group_assignment',
        'broad_rbac_assignment',
        'budget_creation_or_increase',
        'product_prod_deploy',
        'client_prod_data_action',
        'dns_change',
      ].every((gate) => ledger.hardApprovalGates.includes(gate)),
    'ledger must preserve hard approval gates',
  );
  const first = Array.isArray(ledger.entries) ? ledger.entries[0] : null;
  record('ledger.templateEntryPresent', Boolean(first), 'template must include at least one example entry');
  if (first) {
    record('ledger.entry.environmentKey', typeof first.environmentKey === 'string' && first.environmentKey.length > 0);
    record('ledger.entry.statusPlanned', first.status === 'planned');
    record('ledger.entry.approvalRequired', first.approval?.required === true);
    record('ledger.entry.subscriptionIdNull', first.subscriptionId === null, 'template must not contain a real subscription id');
    record('ledger.entry.controlsPresent', Boolean(first.controls));
    record('ledger.entry.evidencePresent', Boolean(first.evidence));
    record('ledger.entry.exceptionsArray', Array.isArray(first.exceptions));
  }
  for (const entry of ledger.entries ?? []) {
    record(
      `ledger.${entry.environmentKey}.statusPlanned`,
      entry.status === 'planned',
      'ledger template entries must remain planned until explicit approval',
    );
    record(
      `ledger.${entry.environmentKey}.approvalRequired`,
      entry.approval?.required === true,
      'all environment creation requires explicit approval',
    );
    record(
      `ledger.${entry.environmentKey}.subscriptionIdNull`,
      entry.subscriptionId === null,
      'template must not contain real subscription ids',
    );
    record(
      `ledger.${entry.environmentKey}.creationOrder`,
      Number.isInteger(entry.scope?.creationOrder) && entry.scope.creationOrder > 0,
      'each entry must have a positive creationOrder',
    );
  }
}

if (manifest && ledger) {
  const productKeys = new Set((manifest.productEnvironments ?? []).map((env) => env.key));
  const clientKeys = new Set((manifest.clientEnvironmentPattern?.environments ?? []).map((env) => env.key));
  const ledgerKeys = new Set((ledger.entries ?? []).map((entry) => entry.environmentKey));
  const expectedKeys = [...productKeys, ...clientKeys];
  record('manifest.includes.product-dev', productKeys.has('product-dev'));
  record('manifest.includes.product-preview', productKeys.has('product-preview'));
  record('manifest.includes.product-prod', productKeys.has('product-prod'));
  record('manifest.includes.client-preprod', clientKeys.has('client-preprod'));
  record('manifest.includes.client-prod', clientKeys.has('client-prod'));
  for (const key of expectedKeys) {
    record(`ledger.includes.${key}`, ledgerKeys.has(key), 'ledger must include every factory environment key');
  }
  record(
    'ledger.onlyKnownKeys',
    [...ledgerKeys].every((key) => productKeys.has(key) || clientKeys.has(key)),
    'ledger contains an unknown environment key',
  );
  const ordered = [...(ledger.entries ?? [])]
    .map((entry) => [entry.environmentKey, entry.scope?.creationOrder])
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
  record(
    'ledger.creationOrder',
    JSON.stringify(ordered) ===
      JSON.stringify(['product-dev', 'product-preview', 'product-prod', 'client-preprod', 'client-prod']),
    `unexpected order: ${ordered.join(', ')}`,
  );
}

const summary = checks.reduce(
  (acc, check) => {
    acc[check.status] = (acc[check.status] ?? 0) + 1;
    return acc;
  },
  { pass: 0, fail: 0 },
);
const status = summary.fail > 0 ? 'fail' : 'pass';

console.log(JSON.stringify({ audit: 'azure-environment-vending-ledger', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
