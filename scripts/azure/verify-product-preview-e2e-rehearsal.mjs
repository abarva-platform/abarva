#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.md';
const PREVIEW_PROVISIONING_PATH = 'docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json';
const RC_GATES_PATH = 'docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.json';
const SYNTHETIC_BASELINE_PATH = 'docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.json';
const LEDGER_PATH = 'docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json';

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
const previewBody = readRequired(PREVIEW_PROVISIONING_PATH);
const rcBody = readRequired(RC_GATES_PATH);
const syntheticBody = readRequired(SYNTHETIC_BASELINE_PATH);
const ledgerBody = readRequired(LEDGER_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const preview = previewBody ? parseJson(PREVIEW_PROVISIONING_PATH, previewBody) : null;
const rcGates = rcBody ? parseJson(RC_GATES_PATH, rcBody) : null;
const synthetic = syntheticBody ? parseJson(SYNTHETIC_BASELINE_PATH, syntheticBody) : null;
const ledger = ledgerBody ? parseJson(LEDGER_PATH, ledgerBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'product-preview');
  record('packet.status', packet.status === 'scaffold_ready_before_runtime');
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  requireIncludes('packet.testSurfaces', packet.testSurfaces ?? [], [
    'browser_signed_in',
    'api_health',
    'api_programs',
    'context_healthcheck',
    'tenant_scoped_retrieval',
    'citation_rendering',
    'artifact_file_cabinet',
    'responsible_ai_acknowledgement',
    'audit_trace',
  ]);
  for (const [moduleKey, required] of Object.entries({
    intelligence: ['brief_loads', 'sentinel_answer_uses_validated_bundle', 'citations_visible'],
    moves: ['portfolio_loads', 'origination_p0_create', 'generated_artifact_downloadable'],
    source: ['source_home_loads', 'source_event_detail_loads', 'retrieval_sources_tenant_scoped'],
    tower: ['tower_home_loads', 'module_readiness_matches_context_health', 'no_cross_tenant_counts'],
  })) {
    requireIncludes(`packet.moduleMatrix.${moduleKey}`, packet.moduleMatrix?.[moduleKey] ?? [], required);
  }
  requireIncludes('packet.dataReadinessAssertions', packet.dataReadinessAssertions ?? [], [
    'source_files_staged',
    'source_metadata_registered',
    'records_present',
    'facts_current_active',
    'chunks_current_active',
    'no_orphan_facts',
    'no_duplicate_active_facts',
    'search_index_refreshed',
    'tenant_scoped_retrieval_passed',
    'citation_metadata_present',
    'promotion_status_calculated',
    'agent_ready_only_where_eligible',
    'context_bundle_trace_emitted',
  ]);
  requireIncludes('packet.securityAssertions', packet.securityAssertions ?? [], [
    'no_phi',
    'no_pii',
    'no_vercel_headers',
    'no_supabase_runtime',
    'wrong_tenant_context_excluded',
    'not_reviewed_blocked_quarantined_excluded',
    'restricted_context_requires_policy_allow',
  ]);
  requireIncludes('packet.requiredEvidence', packet.requiredEvidence ?? [], [
    'release_candidate_identity',
    'signed_in_browser_screenshots',
    'api_response_archive',
    'context_healthcheck_report',
    'retrieval_trace_report',
    'context_bundle_trace_hashes',
    'citation_evidence_register',
    'artifact_download_receipts',
    'module_readiness_summary',
    'defect_backlog',
    'go_no_go_decision',
    'rollback_command',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'start_preview_e2e_rehearsal',
    'use_client_approved_redacted_data',
    'accept_known_defects',
    'declare_preview_go',
    'promote_release_candidate_to_product_prod',
  ]);
}

if (packet && preview) {
  record('dependsOn.productPreviewProvisioning', packet.dependsOn?.includes(PREVIEW_PROVISIONING_PATH) === true);
  record('sameEnvironmentAsPreviewProvisioning', packet.environmentKey === preview.environmentKey);
}

if (packet && rcGates) {
  record('dependsOn.productPreviewRcGates', packet.dependsOn?.includes(RC_GATES_PATH) === true);
  record('sameEnvironmentAsRcGates', packet.environmentKey === rcGates.environmentKey);
}

if (packet && synthetic) {
  record('dependsOn.syntheticBaseline', packet.dependsOn?.includes(SYNTHETIC_BASELINE_PATH) === true);
}

if (packet && ledger) {
  record('dependsOn.executionLedger', packet.dependsOn?.includes(LEDGER_PATH) === true);
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Do not call chunks-only data ready.',
    'Do not call facts-only data ready.',
    'Do not call indexed-only data ready.',
    'Context-bundle proven is the real bar.',
    'no Vercel runtime headers',
    'no Supabase runtime',
    'wrong-tenant context is excluded',
    'Explicit approval is required before:',
    'These are templates only. Do not run without approval.',
    'ENV-11 is complete only after Product Preview exists',
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

console.log(JSON.stringify({ audit: 'product-preview-e2e-rehearsal', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
