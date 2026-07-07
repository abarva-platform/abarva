#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.md';
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
  record('packet.environmentKey', packet.environmentKey === 'product-preview');
  record('packet.statusRequiresApproval', packet.status === 'approval_required_before_mutation');
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.subscriptionName', packet.subscription?.displayName === 'sub-abarva-product-preview-eus-001');
  record('packet.budget', packet.subscription?.budgetUsdMonthly === 500);
  requireIncludes('packet.budgetThresholds', packet.subscription?.budgetAlertThresholdsPercent ?? [], [50, 80, 100]);
  requireIncludes('packet.allowedData', packet.subscription?.dataBoundary?.allowed ?? [], [
    'synthetic',
    'pilot-reference',
    'client-approved-redacted',
  ]);
  requireIncludes('packet.disallowedData', packet.subscription?.dataBoundary?.disallowed ?? [], [
    'client-confidential-unapproved',
    'phi',
    'pii',
    'raw-client-private-documents',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'create_subscription',
    'move_subscription_to_management_group',
    'assign_breakglass_owner',
    'assign_platform_maintainer',
    'assign_release_operator',
    'create_budget',
    'apply_policy_assignments',
    'create_baseline_resources',
    'deploy_release_candidate',
    'run_preview_acceptance',
    'approve_promotion_to_product_prod',
  ]);
  requireIncludes('packet.baselineControls', packet.baselineControls ?? [], [
    'deny_public_blob_access',
    'deny_public_postgres',
    'deny_public_keyvault',
    'require_private_endpoints_for_data_services',
    'require_tags',
    'require_budget',
    'require_diagnostic_settings',
    'require_release_candidate_digest',
    'require_context_healthcheck',
    'require_signed_in_browser_qa',
    'no_phi_pii',
  ]);
  record('packet.noPhiPiiTag', packet.requiredTags?.NoPhiPii === 'true');
  record('packet.criticality', packet.requiredTags?.Criticality === 'high');
  requireIncludes('packet.evidenceRequired', packet.evidenceRequired ?? [], [
    'explicit_approval_record',
    'subscription_id',
    'management_group_path',
    'role_assignment_export',
    'policy_assignment_export',
    'budget_id',
    'tag_export',
    'pinned_image_digest',
    'aca_revision_export',
    'health_endpoint_200',
    'no_vercel_headers',
    'context_healthcheck_report',
    'signed_in_browser_qa_report',
    'rollback_revision_or_digest',
    'execution_ledger_entry',
  ]);
}

if (factory && packet) {
  const productPreview = (factory.productEnvironments ?? []).find((env) => env.key === 'product-preview');
  record('factory.productPreviewExists', Boolean(productPreview));
  record('factory.productPreviewNoPhi', productPreview?.disallowedData?.includes('phi') === true);
  record('factory.productPreviewNoPii', productPreview?.disallowedData?.includes('pii') === true);
  record('factory.productPreviewPromotesToProd', productPreview?.promotionTarget === 'product-prod');
}

if (rbac && packet) {
  record('rbac.hasProductPreviewMatrix', Boolean(rbac.environmentRoleMatrix?.['product-preview']));
}

if (cost && packet) {
  record('cost.hasProductPreview', cost.environmentKeys?.includes('product-preview') === true);
  record('cost.productPreviewBudgetMatches', cost.budgetRules?.defaultMonthlyBudgetUsd?.['product-preview'] === 500);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Do not create the subscription',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Product Preview is the release-candidate proving ground.',
    'Explicit approval is required before:',
    'creating the Product Preview subscription',
    'deploying a release candidate',
    'Budget',
    'These are templates only. Do not run without approval.',
    'Product Preview is not complete until the execution ledger has:',
    'proof that no Vercel runtime headers are present',
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

console.log(JSON.stringify({ audit: 'product-preview-provisioning-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
