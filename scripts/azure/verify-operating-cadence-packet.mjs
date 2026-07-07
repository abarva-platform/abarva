#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/OPERATING_CADENCE_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/OPERATING_CADENCE_PACKET_2026-06.md';
const PRODUCT_PROD_CUTOVER_PATH = 'docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.json';
const CLIENT_PREPROD_PATH = 'docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.json';
const CLIENT_PROD_PATH = 'docs/azure/CLIENT_PROD_GO_NO_GO_PACKET_2026-06.json';
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
readRequired(PRODUCT_PROD_CUTOVER_PATH);
readRequired(CLIENT_PREPROD_PATH);
readRequired(CLIENT_PROD_PATH);
readRequired(CONTEXT_POLICY_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'operating-cadence');
  record('packet.status', packet.status === 'scaffold_ready_before_recurring_operations');
  requireIncludes('packet.dependsOn', packet.dependsOn ?? [], [
    PRODUCT_PROD_CUTOVER_PATH,
    CLIENT_PREPROD_PATH,
    CLIENT_PROD_PATH,
    CONTEXT_POLICY_PATH,
  ]);
  requireIncludes('scope.targetPlanes', packet.scope?.targetPlanes ?? [], [
    'product-dev',
    'product-preview',
    'product-prod',
    'client-preprod',
    'client-prod',
  ]);
  record('scope.recurringOperations', packet.scope?.recurringOperations === true);
  record('scope.nonMutatingPacket', packet.scope?.nonMutatingPacket === true);
  record('scope.explicitApprovalRequiredBeforeDrillExecution', packet.scope?.explicitApprovalRequiredBeforeDrillExecution === true);
  record('scope.explicitApprovalRequiredBeforeAccessRevocation', packet.scope?.explicitApprovalRequiredBeforeAccessRevocation === true);
  record('scope.explicitApprovalRequiredBeforeClientProdAction', packet.scope?.explicitApprovalRequiredBeforeClientProdAction === true);

  const cadenceKeys = (packet.cadences ?? []).map((cadence) => cadence.key);
  requireIncludes('packet.cadenceKeys', cadenceKeys, [
    'weekly_release_readiness',
    'monthly_access_review',
    'quarterly_dr_restore_drill',
    'post_release_retrospective',
  ]);

  const cadenceEvidence = Object.fromEntries((packet.cadences ?? []).map((cadence) => [cadence.key, cadence.requiredEvidence ?? []]));
  requireIncludes('weekly_release_readiness.evidence', cadenceEvidence.weekly_release_readiness ?? [], [
    'open_pr_summary',
    'release_candidate_status',
    'ci_gate_summary',
    'azure_deploy_status',
    'rollback_readiness',
    'known_risks',
    'next_week_actions',
  ]);
  requireIncludes('monthly_access_review.evidence', cadenceEvidence.monthly_access_review ?? [], [
    'clerk_role_export',
    'azure_rbac_export',
    'database_role_export',
    'service_principal_export',
    'stale_access_list',
    'proposed_changes',
    'approval_or_defer_record',
  ]);
  requireIncludes('quarterly_dr_restore_drill.evidence', cadenceEvidence.quarterly_dr_restore_drill ?? [], [
    'restore_scope',
    'restore_target_environment',
    'backup_snapshot_id',
    'restore_execution_log',
    'rto_rpo_result',
    'validation_queries',
    'lessons_learned',
    'follow_up_actions',
  ]);
  requireIncludes('post_release_retrospective.evidence', cadenceEvidence.post_release_retrospective ?? [], [
    'release_id',
    'change_summary',
    'user_visible_outcome',
    'incidents_or_near_misses',
    'test_escape_analysis',
    'process_improvements',
    'backlog_actions',
  ]);
  requireIncludes('packet.requiredDashboardsOrRegisters', packet.requiredDashboardsOrRegisters ?? [], [
    'release_readiness_register',
    'access_review_register',
    'dr_restore_register',
    'post_release_retro_register',
    'risk_and_exception_register',
    'client_plane_evidence_register',
  ]);
  requireIncludes('packet.hardStops', packet.hardStops ?? [], [
    'missing_release_record',
    'failed_required_ci_gate',
    'unreviewed_owner_or_user_access_admin_grant',
    'stale_service_principal_without_owner',
    'dr_restore_not_tested_within_quarter',
    'rollback_plan_missing_for_material_release',
    'client_prod_action_without_explicit_approval',
    'phi_or_pii_exception_requested',
    'context_bundle_proof_missing_for_data_release',
    'tenant_leakage_not_investigated',
  ]);
  requireIncludes('automationPolicy.allowed', packet.automationPolicy?.allowed ?? [], [
    'send_progress_email',
    'generate_status_report',
    'summarize_ci_status',
    'prepare_approval_request',
    'collect_read_only_evidence',
  ]);
  requireIncludes('automationPolicy.requiresExplicitApproval', packet.automationPolicy?.requiresExplicitApproval ?? [], [
    'revoke_access',
    'grant_access',
    'run_dr_restore_drill',
    'deploy_to_client_prod',
    'change_dns',
    'shift_traffic',
    'mutate_client_data',
    'accept_phi_or_pii_exception',
  ]);
  record('completion.scaffoldReadyWhenPacketMerged', packet.completionBar?.scaffoldReadyWhenPacketMerged === true);
  record('completion.completeRequiresFirstWeeklyReleaseReadinessRecord', packet.completionBar?.completeRequiresFirstWeeklyReleaseReadinessRecord === true);
  record('completion.completeRequiresFirstMonthlyAccessReviewRecord', packet.completionBar?.completeRequiresFirstMonthlyAccessReviewRecord === true);
  record('completion.completeRequiresFirstQuarterlyDrRestoreDrillRecord', packet.completionBar?.completeRequiresFirstQuarterlyDrRestoreDrillRecord === true);
  record('completion.completeRequiresFirstPostReleaseRetroRecord', packet.completionBar?.completeRequiresFirstPostReleaseRetroRecord === true);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotMutateWithoutApproval', packet.doNotMutateWithoutApproval === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'It cannot revoke or grant access',
    'product dev',
    'product preview',
    'product prod',
    'client preprod',
    'client prod',
    'Every week, produce a release-readiness record with:',
    'Every month, produce an access-review record with:',
    'Every quarter, produce a DR/restore drill record with:',
    'Access review can identify issues. It must not revoke or grant access without explicit approval.',
    'Running the drill itself requires explicit approval',
    'PHI or PII exception is requested',
    'context-bundle proof is missing for a data release',
    'ENV-18 is scaffold-ready when this packet and its verifier are merged.',
    'ENV-18 is complete only after the first weekly release readiness record',
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

console.log(JSON.stringify({ audit: 'operating-cadence-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
