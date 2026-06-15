#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.md';
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
  record('packet.environmentKey', packet.environmentKey === 'product-prod');
  record('packet.statusRequiresApproval', packet.status === 'approval_required_before_mutation');
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.subscriptionName', packet.subscription?.displayName === 'sub-abarva-product-prod-eus-001');
  record('packet.budget', packet.subscription?.budgetUsdMonthly === 500);
  requireIncludes('packet.budgetThresholds', packet.subscription?.budgetAlertThresholdsPercent ?? [], [50, 80, 100]);
  requireIncludes('packet.allowedData', packet.subscription?.dataBoundary?.allowed ?? [], [
    'synthetic',
    'approved-product-telemetry',
    'approved-reference-data',
  ]);
  requireIncludes('packet.disallowedData', packet.subscription?.dataBoundary?.disallowed ?? [], [
    'client-confidential-unapproved',
    'client-private-production-data',
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
    'approve_preview_release_candidate',
    'promote_pinned_digest_to_product_prod',
    'run_product_prod_smoke',
    'approve_public_cutover',
  ]);
  requireIncludes('packet.baselineControls', packet.baselineControls ?? [], [
    'deny_public_blob_access',
    'deny_public_postgres',
    'deny_public_keyvault',
    'require_private_endpoints_for_data_services',
    'require_tags',
    'require_budget',
    'require_diagnostic_settings',
    'require_purge_protection',
    'require_release_candidate_digest',
    'require_product_preview_e2e_report',
    'require_context_healthcheck',
    'require_signed_in_browser_qa',
    'require_rollback_rehearsal',
    'no_phi_pii',
    'no_client_private_data',
  ]);
  record('packet.noPhiPiiTag', packet.requiredTags?.NoPhiPii === 'true');
  record('packet.noClientPrivateDataTag', packet.requiredTags?.NoClientPrivateData === 'true');
  record('packet.criticality', packet.requiredTags?.Criticality === 'critical');
  requireIncludes('packet.promotionPrerequisites', packet.promotionPrerequisites ?? [], [
    'product_preview_release_candidate_approved',
    'pinned_image_digest_recorded',
    'migration_replay_green',
    'product_preview_e2e_rehearsal_green_or_waived',
    'context_healthcheck_green_or_no_go_exception',
    'signed_in_browser_qa_green',
    'rollback_command_recorded',
    'explicit_public_cutover_approval',
  ]);
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
    'no_supabase_runtime_dependency',
    'context_healthcheck_report',
    'signed_in_browser_qa_report',
    'rollback_revision_or_digest',
    'rollback_rehearsal_evidence',
    'execution_ledger_entry',
  ]);
}

if (factory && packet) {
  const productProd = (factory.productEnvironments ?? []).find((env) => env.key === 'product-prod');
  record('factory.productProdExists', Boolean(productProd));
  record('factory.productProdNoPhi', productProd?.disallowedData?.includes('phi') === true);
  record('factory.productProdNoPii', productProd?.disallowedData?.includes('pii') === true);
}

if (rbac && packet) {
  record('rbac.hasProductProdMatrix', Boolean(rbac.environmentRoleMatrix?.['product-prod']));
}

if (cost && packet) {
  record('cost.hasProductProd', cost.environmentKeys?.includes('product-prod') === true);
  record('cost.productProdBudgetMatches', cost.budgetRules?.defaultMonthlyBudgetUsd?.['product-prod'] === 500);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Do not create the subscription',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Client private production data belongs in client private planes',
    'Product Prod is the stable product/control-plane runtime.',
    'Explicit approval is required before:',
    'creating the Product Prod subscription',
    'promoting a pinned image digest to Product Prod',
    'approving public cutover',
    'Budget',
    'These are templates only. Do not run without approval.',
    'Product Prod is not complete until the execution ledger has:',
    'proof that no Vercel runtime headers are present',
    'proof that no Supabase runtime dependency is present',
    'rollback rehearsal evidence',
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

console.log(JSON.stringify({ audit: 'product-prod-provisioning-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
