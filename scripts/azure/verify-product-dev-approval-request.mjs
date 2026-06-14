#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const JSON_PATH = 'docs/azure/PRODUCT_DEV_APPROVAL_REQUEST_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_DEV_APPROVAL_REQUEST_2026-06.md';
const TEMPLATE_PATH = 'docs/approvals/AZURE_MUTATION_APPROVAL_TEMPLATE.md';
const FORBIDDEN_APPROVAL_PATH = 'docs/approvals/AZURE_MUTATION_APPROVED.md';

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

const jsonBody = readRequired(JSON_PATH);
const docBody = readRequired(DOC_PATH);
const templateBody = readRequired(TEMPLATE_PATH);
record(
  `file.${FORBIDDEN_APPROVAL_PATH}.absent`,
  !fs.existsSync(path.join(ROOT, FORBIDDEN_APPROVAL_PATH)),
  'real approval file must not exist in non-mutating PRs',
);

const request = jsonBody ? parseJson(JSON_PATH, jsonBody) : null;

if (request) {
  record('request.version', request.version === '2026-06');
  record('request.status', request.status === 'human_review_ready_non_mutating');
  record('request.approvalFileRequired', request.approvalFileRequired === FORBIDDEN_APPROVAL_PATH);
  record('request.templateOnlyFile', request.templateOnlyFile === TEMPLATE_PATH);
  record('request.scopeModel', request.requestedScope?.model === 'product-control-plane');
  record('request.environmentProductDevOnly', request.requestedScope?.environment === 'product-dev');
  requireIncludes('request.exclusions', request.requestedScope?.explicitlyExcluded ?? [], [
    'product-preview',
    'product-prod',
    'client-preprod',
    'client-prod',
    'dns-changes',
    'traffic-shifts',
    'client-production-data-actions',
    'phi-pii-exceptions',
    'secret-values',
  ]);
  requireIncludes('request.preflightValidation', request.preflightValidation ?? [], [
    'npm run azure:environment-vending:verify',
    'npm run azure:environment-rbac:verify',
    'npm run azure:environment-cost-controls:verify',
    'npm run azure:product-dev-provisioning:verify',
    'npm run azure:product-baseline-whatif:verify',
  ]);
  requireIncludes('request.requiredFields', request.approvalFileRequiredFields ?? [], [
    'tenant_id',
    'subscription_ids_or_creation_authority',
    'approved_environments',
    'approved_commands',
    'approved_time_window',
    'approver_name',
    'rollback_owner',
  ]);
  record(
    'request.verifierScript',
    request.verification?.script === 'scripts/azure/verify-product-dev-approval-request.mjs',
  );
  record('request.verifierNpmScript', request.verification?.npmScript === 'npm run azure:product-dev-approval:verify');
}

if (docBody) {
  [
    'Status: ready for human review. Non-mutating request packet.',
    'Product Dev only',
    'Actual mutation remains blocked',
    'Explicit Exclusions',
    'Stop Conditions',
    'Approve Product Dev only first',
  ].forEach((snippet) => requireSnippet(DOC_PATH, docBody, snippet));
}

if (templateBody) {
  [
    'Status: template only. This file does not authorize Azure mutation.',
    'copy this template to `docs/approvals/AZURE_MUTATION_APPROVED.md`',
    'Do not create `AZURE_MUTATION_APPROVED.md` with placeholders.',
    'Recommended First Approval Scope',
  ].forEach((snippet) => requireSnippet(TEMPLATE_PATH, templateBody, snippet));
}

const summary = checks.reduce(
  (acc, check) => {
    acc[check.status] = (acc[check.status] ?? 0) + 1;
    return acc;
  },
  { pass: 0, fail: 0 },
);
const status = summary.fail > 0 ? 'fail' : 'pass';

console.log(JSON.stringify({ audit: 'product-dev-approval-request', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);

