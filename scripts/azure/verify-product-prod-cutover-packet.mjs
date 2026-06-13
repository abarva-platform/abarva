#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKET_PATH = 'docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.json';
const DOC_PATH = 'docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.md';
const PROD_PACKET_PATH = 'docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.json';
const RC_PACKET_PATH = 'docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.json';
const E2E_PACKET_PATH = 'docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.json';

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
const prodPacketBody = readRequired(PROD_PACKET_PATH);
const rcPacketBody = readRequired(RC_PACKET_PATH);
const e2ePacketBody = readRequired(E2E_PACKET_PATH);

const packet = packetBody ? parseJson(PACKET_PATH, packetBody) : null;
const prodPacket = prodPacketBody ? parseJson(PROD_PACKET_PATH, prodPacketBody) : null;
const rcPacket = rcPacketBody ? parseJson(RC_PACKET_PATH, rcPacketBody) : null;
const e2ePacket = e2ePacketBody ? parseJson(E2E_PACKET_PATH, e2ePacketBody) : null;

if (packet) {
  record('packet.version', packet.version === '2026-06');
  record('packet.environmentKey', packet.environmentKey === 'product-prod');
  record('packet.status', packet.status === 'approval_required_before_cutover');
  record('packet.publicHost', packet.cutoverScope?.publicHost === 'app.abarva.ai');
  record('packet.runtime', packet.cutoverScope?.runtime === 'azure-container-apps');
  requireIncludes('packet.sourceRuntimeMustNotBe', packet.cutoverScope?.sourceRuntimeMustNotBe ?? [], ['vercel']);
  requireIncludes('packet.disallowedData', packet.cutoverScope?.dataBoundary?.disallowed ?? [], [
    'client-private-production-data',
    'client-confidential-unapproved',
    'phi',
    'pii',
    'raw-client-private-documents',
  ]);
  requireIncludes('packet.approvalGates', packet.approvalGates ?? [], [
    'approve_product_prod_subscription_ready',
    'approve_pinned_digest',
    'approve_database_migrations_applied',
    'approve_product_prod_smoke',
    'approve_signed_in_browser_qa',
    'approve_context_healthcheck',
    'approve_monitoring_and_alerts',
    'approve_rollback_rehearsal',
    'approve_dns_or_frontdoor_change',
    'approve_public_cutover',
  ]);
  requireIncludes('packet.preCutoverEvidenceRequired', packet.preCutoverEvidenceRequired ?? [], [
    'product_prod_subscription_id',
    'pinned_image_digest',
    'migration_replay_green',
    'health_endpoint_200',
    'api_health_azure_postgres_direct_postgres_true',
    'no_vercel_headers',
    'no_x_vercel_id',
    'no_supabase_runtime_dependency',
    'signed_in_browser_qa_report',
    'context_healthcheck_report',
    'retrieval_citation_bundle_proof',
    'rollback_command',
    'explicit_approval_record',
  ]);
  requireIncludes('packet.postCutoverEvidenceRequired', packet.postCutoverEvidenceRequired ?? [], [
    'public_curl_headers',
    'public_health_json',
    'dns_or_frontdoor_export',
    'active_revision_after_cutover',
    'traffic_split_export',
    'signed_in_smoke_after_cutover',
    'context_bundle_trace_after_cutover',
    'rollback_still_available',
  ]);
  requireIncludes('packet.hardStops', packet.hardStops ?? [], [
    'missing_explicit_cutover_approval',
    'vercel_header_present',
    'x_vercel_id_present',
    'supabase_runtime_dependency_present',
    'health_endpoint_not_200',
    'direct_postgres_false',
    'context_bundle_not_proven',
    'signed_in_qa_missing',
    'rollback_command_missing',
    'monitoring_missing',
    'phi_or_pii_present',
  ]);
  record('packet.commandsAreTemplatesOnly', packet.commandsAreTemplatesOnly === true);
  record('packet.doNotRunWithoutApproval', packet.doNotRunWithoutApproval === true);
  record('packet.doNotChangeDnsWithoutApproval', packet.doNotChangeDnsWithoutApproval === true);
  record('packet.doNotShiftTrafficWithoutApproval', packet.doNotShiftTrafficWithoutApproval === true);
}

if (packet && prodPacket && rcPacket && e2ePacket) {
  requireIncludes('packet.dependsOn', packet.dependsOn ?? [], [
    'PRODUCT_PROD_PROVISIONING_PACKET_2026-06',
    'PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06',
    'PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06',
  ]);
  record('dependency.productProdEnvironment', prodPacket.environmentKey === 'product-prod');
  record('dependency.rcEnvironment', rcPacket.environmentKey === 'product-preview');
  record('dependency.e2eEnvironment', e2ePacket.environmentKey === 'product-preview');
}

if (docBody) {
  [
    'It is intentionally non-mutating.',
    'Do not change DNS',
    'Do not run without approval.',
    'PHI is not accepted.',
    'PII is not accepted.',
    'Client private data belongs in client private planes.',
    'no `server: Vercel`',
    'no `x-vercel-id`',
    'no Supabase runtime dependency',
    'context bundle is not proven',
    'signed-in QA is missing',
    'rollback command is missing',
    'ENV-13 is not complete until pre-cutover evidence',
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

console.log(JSON.stringify({ audit: 'product-prod-cutover-packet', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
