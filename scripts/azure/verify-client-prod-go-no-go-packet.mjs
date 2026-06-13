#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/CLIENT_PROD_GO_NO_GO_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/CLIENT_PROD_GO_NO_GO_PACKET_2026-06.md';
const CLIENT_FACTORY_PATH = 'docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json';
const CLIENT_ONBOARDING_PATH = 'docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.json';
const CLIENT_PREPROD_PATH = 'docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.json';
const CONTEXT_POLICY_PATH = 'docs/governance/CONTEXT_CORPUS_POLICY.md';

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
readRequired(CLIENT_FACTORY_PATH);
readRequired(CLIENT_ONBOARDING_PATH);
readRequired(CLIENT_PREPROD_PATH);
readRequired(CONTEXT_POLICY_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'client-prod-go-no-go');
  record('packet.status', packet.status === 'scaffold_ready_before_client_prod_execution');
  requireIncludes('packet.dependsOn', packet.dependsOn ?? [], [
    CLIENT_FACTORY_PATH,
    CLIENT_ONBOARDING_PATH,
    CLIENT_PREPROD_PATH,
    CONTEXT_POLICY_PATH,
  ]);
  record('scope.targetPlane', packet.scope?.targetPlane === 'client-prod');
  record('scope.requiresApprovedClientPreprod', packet.scope?.requiresApprovedClientPreprod === true);
  record('scope.explicitApprovalRequiredBeforeExecution', packet.scope?.explicitApprovalRequiredBeforeExecution === true);
  record('scope.readOnlyUntilApproved', packet.scope?.readOnlyUntilApproved === true);
  record('scope.productProdExcluded', packet.scope?.productProdExcluded === true);
  record('scope.dnsExcludedUntilSeparateApproval', packet.scope?.dnsExcludedUntilSeparateApproval === true);
  record('scope.trafficShiftExcludedUntilSeparateApproval', packet.scope?.trafficShiftExcludedUntilSeparateApproval === true);
  requireIncludes('packet.requiredApprovalsBeforeMutation', packet.requiredApprovalsBeforeMutation ?? [], [
    'approve_client_preprod_acceptance_evidence',
    'approve_client_prod_subscription_creation',
    'approve_client_prod_resource_deployment',
    'approve_client_prod_rbac_assignments',
    'approve_client_prod_data_migration_or_reload',
    'approve_client_prod_search_index_refresh',
    'approve_client_prod_smoke_test_window',
    'approve_client_prod_support_readiness',
    'approve_client_prod_go_no_go_decision',
  ]);
  requireIncludes('packet.goNoGoStages', packet.goNoGoStages ?? [], [
    'preprod_acceptance_review',
    'data_policy_review',
    'security_and_rbac_review',
    'network_private_connectivity_review',
    'cost_budget_and_tag_review',
    'observability_and_alerting_review',
    'backup_restore_and_dr_review',
    'migration_or_reload_plan_review',
    'context_health_acceptance_review',
    'retrieval_citation_acceptance_review',
    'context_bundle_acceptance_review',
    'module_uat_acceptance_review',
    'artifact_file_cabinet_acceptance_review',
    'support_runbook_acceptance_review',
    'rollback_and_abandon_review',
    'executive_go_no_go',
  ]);
  requireIncludes('packet.requiredEvidence', packet.requiredEvidence ?? [], [
    'client_preprod_uat_signoff',
    'client_preprod_context_health_report',
    'client_preprod_context_bundle_trace_report',
    'client_preprod_rollback_or_abandon_proof',
    'client_prod_subscription_id',
    'client_prod_resource_group_id',
    'client_prod_private_endpoint_exports',
    'client_prod_rbac_assignment_exports',
    'client_prod_budget_id',
    'client_prod_backup_restore_proof',
    'client_prod_go_no_go_minutes',
    'client_prod_rollback_plan',
    'client_prod_support_coverage_plan',
  ]);
  requireIncludes('packet.promotionFromPreprodMustProve', packet.promotionFromPreprodMustProve ?? [], [
    'same_canonical_client_key',
    'same_approved_policy_manifest',
    'same_no_phi_no_pii_posture',
    'same_template_versions',
    'same_fact_identity_rules',
    'same_citation_requirements',
    'same_context_bundle_bar',
    'no_unreviewed_data_promoted',
    'no_agent_ready_auto_promotion',
  ]);
  requireIncludes('packet.clientProdSmokeRoutes', packet.clientProdSmokeRoutes ?? [], [
    '/home',
    '/intelligence',
    '/strategic-moves',
    '/source',
    '/tower',
    '/setup/admin',
  ]);
  requireIncludes('packet.hardStops', packet.hardStops ?? [], [
    'client_preprod_not_approved',
    'missing_go_no_go_minutes',
    'phi_present',
    'pii_present_without_future_explicit_policy_change',
    'wrong_tenant_context_detected',
    'duplicate_active_facts_detected',
    'duplicate_active_chunks_detected',
    'orphan_facts_detected',
    'context_bundle_trace_missing',
    'citations_missing',
    'unsupported_claims_unflagged',
    'backup_restore_unproven',
    'rollback_plan_missing',
    'support_coverage_missing',
    'dns_change_requested_without_separate_approval',
    'traffic_shift_requested_without_separate_approval',
    'owner_or_user_access_admin_grant_requested',
  ]);
  record('completion.scaffoldReadyWhenPacketMerged', packet.completionBar?.scaffoldReadyWhenPacketMerged === true);
  record('completion.completeRequiresApprovedClientPreprod', packet.completionBar?.completeRequiresApprovedClientPreprod === true);
  record('completion.completeRequiresClientProdGoNoGoApproval', packet.completionBar?.completeRequiresClientProdGoNoGoApproval === true);
  record('completion.completeRequiresClientProdEvidenceBundle', packet.completionBar?.completeRequiresClientProdEvidenceBundle === true);
  record('completion.completeRequiresSignedInSmokeProof', packet.completionBar?.completeRequiresSignedInSmokeProof === true);
  record('completion.completeRequiresRollbackPlan', packet.completionBar?.completeRequiresRollbackPlan === true);
  record('completion.completeRequiresSupportCoverage', packet.completionBar?.completeRequiresSupportCoverage === true);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.doNotCreateAzureResourcesWithoutApproval', packet.doNotCreateAzureResourcesWithoutApproval === true);
  record('packet.doNotRunClientProdDataActions', packet.doNotRunClientProdDataActions === true);
  record('packet.doNotChangeDnsWithoutSeparateApproval', packet.doNotChangeDnsWithoutSeparateApproval === true);
  record('packet.doNotShiftTrafficWithoutSeparateApproval', packet.doNotShiftTrafficWithoutSeparateApproval === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'This packet applies only to `client-prod`.',
    'It also does not authorize DNS changes or production traffic shifts',
    'Explicit approval is required before:',
    'same no-PHI/no-PII posture',
    'no `agent_ready` auto-promotion',
    'At minimum, signed-in client prod smoke proof must cover:',
    'PHI is present',
    'PII is present without a future explicit policy change',
    'wrong-tenant context is detected',
    'DNS change is requested without separate approval',
    'production traffic shift is requested without separate approval',
    'ENV-17 is scaffold-ready when this packet and its verifier are merged.',
    'ENV-17 is complete only after an approved client prod go/no-go run',
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

console.log(JSON.stringify({ audit: 'client-prod-go-no-go-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
