#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCRIPT_PATH = 'scripts/azure/cost-circuit-breaker.mjs';
const DOC_PATH = 'docs/azure/COST_CIRCUIT_BREAKER_2026-06.md';
const MODEL_PATH = 'docs/azure/COST_CIRCUIT_BREAKER_2026-06.json';
const PACKAGE_PATH = 'package.json';

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

function requireSnippet(relativePath, body, snippet) {
  record(
    `snippet.${relativePath}.${snippet}`,
    body.includes(snippet),
    body.includes(snippet) ? '' : 'missing required snippet',
  );
}

function forbidSnippet(relativePath, body, snippet) {
  record(
    `forbid.${relativePath}.${snippet}`,
    !body.includes(snippet),
    body.includes(snippet) ? 'forbidden mutating command/pattern present' : '',
  );
}

const scriptBody = readRequired(SCRIPT_PATH);
const docBody = readRequired(DOC_PATH);
const modelBody = readRequired(MODEL_PATH);
const packageBody = readRequired(PACKAGE_PATH);

const model = modelBody ? parseJson(MODEL_PATH, modelBody) : null;
const packageJson = packageBody ? parseJson(PACKAGE_PATH, packageBody) : null;

if (scriptBody) {
  [
    'read-only',
    '--subscriptions',
    '--fail-on-breach',
    'Microsoft.Consumption/budgets',
    'No automatic deletion.',
    'No automatic resource scaling.',
    'No automatic job disablement.',
  ].forEach((snippet) => requireSnippet(SCRIPT_PATH, scriptBody, snippet));

  [
    'az group delete',
    'az resource delete',
    'az containerapp update',
    'az containerapp job update',
    'az role assignment create',
    'az account subscription create',
    '--method delete',
    '--method patch',
    '--method put',
  ].forEach((snippet) => forbidSnippet(SCRIPT_PATH, scriptBody, snippet));
}

if (docBody) {
  [
    'Budgets are alerting controls, not hard spending caps.',
    'read-only first',
    'does not create, update, stop, delete, scale, pause, or mutate Azure resources',
    'No automatic shutdown',
    'Human approval required',
    'Product Dev',
    'Lab',
    'Client Preprod',
    'Client Prod',
  ].forEach((snippet) => requireSnippet(DOC_PATH, docBody, snippet));
}

if (model) {
  record('model.version', model.version === '2026-06');
  record('model.mode', model.mode === 'read-only-first');
  record('model.defaultMonthlyBudgetUsd', model.defaultMonthlyBudgetUsd === 500);
  record('model.failClosedMutation', model.mutationPolicy?.automaticMutation === false);
  record('model.requiresHumanApproval', model.mutationPolicy?.humanApprovalRequired === true);
  record('model.hasEnvironments', Array.isArray(model.environmentScopes) && model.environmentScopes.length >= 5);
  record('model.watchThreshold', model.thresholds?.watchPercent === 50);
  record('model.warnThreshold', model.thresholds?.warnPercent === 80);
  record('model.breachThreshold', model.thresholds?.breachPercent === 100);
}

record(
  'package.script.check',
  packageJson?.scripts?.['azure:cost-circuit-breaker:check'] === 'node scripts/azure/cost-circuit-breaker.mjs',
);
record(
  'package.script.verify',
  packageJson?.scripts?.['azure:cost-circuit-breaker:verify'] === 'node scripts/azure/verify-cost-circuit-breaker.mjs',
);

const summary = checks.reduce(
  (acc, check) => {
    acc[check.status] = (acc[check.status] ?? 0) + 1;
    return acc;
  },
  { pass: 0, fail: 0 },
);
const status = summary.fail > 0 ? 'fail' : 'pass';

console.log(JSON.stringify({ audit: 'azure-cost-circuit-breaker', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
