#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredFiles = [
  'docs/azure/ENVIRONMENT_SETUP_EXECUTION_STATUS_2026-06.md',
  'docs/azure/PRODUCT_BASELINE_WHATIF_PACKET_2026-06.json',
  'docs/azure/PRODUCT_BASELINE_WHATIF_PACKET_2026-06.md',
  'docs/environments/product-preview/provisioning-packet.md',
  'docs/environments/product-preview/azure-parameters.example.json',
  'docs/environments/product-preview/preflight-checklist.md',
  'docs/environments/product-preview/post-provision-validation.md',
  'docs/release/product-preview-rc-gates.md',
  'docs/release/product-preview-evidence-checklist.md',
  'docs/release/product-preview-go-no-go.md',
  'docs/environments/client-private-plane/factory.md',
  'docs/environments/client-private-plane/client-preprod-template.md',
  'docs/environments/client-private-plane/client-prod-template.md',
  'docs/environments/client-private-plane/network-and-data-boundary.md',
  'docs/environments/client-private-plane/security-controls.md',
  'docs/environments/client-private-plane/data-onboarding.md',
  'docs/environments/client-private-plane/evidence-handling.md',
  'docs/environments/client-private-plane/secrets-and-key-management.md',
  'docs/environments/client-private-plane/client-artifact-retention.md',
  'docs/environments/client-private-plane/first-client-preprod-rehearsal.md',
  'docs/environments/client-private-plane/rehearsal-pass-fail.md',
  'docs/environments/client-private-plane/rehearsal-evidence-log.md',
  'docs/environments/client-private-plane/client-prod-go-no-go.md',
  'docs/environments/client-private-plane/client-prod-rollback.md',
  'docs/environments/client-private-plane/client-prod-risk-register.md',
  'docs/operating-model/azure-environment-cadence.md',
  'docs/operating-model/environment-ownership-raci.md',
  'docs/operating-model/monthly-governance-review.md',
  'docs/operating-model/cost-security-operations-cadence.md',
  'infra/azure/environments/product-dev/README.md',
  'infra/azure/environments/product-preview/README.md',
  'infra/azure/environments/product-prod/README.md',
  'infra/azure/environments/client-preprod/README.md',
  'infra/azure/environments/client-prod/README.md',
  'infra/azure/modules/README.md',
];

const requiredTerms = [
  'Product Dev',
  'Product Preview',
  'Product Prod',
  'Client Preprod',
  'Client Prod',
  'non-mutating',
  'PHI',
  'PII',
  'budget',
  'RBAC',
  'policy',
  'Key Vault',
  'private',
  'evidence',
];

const checks = [];

function record(name, ok, detail = '') {
  checks.push({ name, status: ok ? 'pass' : 'fail', detail });
}

function read(relativePath) {
  const full = path.join(ROOT, relativePath);
  const exists = fs.existsSync(full);
  record(`file.${relativePath}`, exists, exists ? '' : 'missing required artifact');
  return exists ? fs.readFileSync(full, 'utf8') : '';
}

for (const relativePath of requiredFiles) {
  const text = read(relativePath);
  if (!text) continue;
  if (relativePath.endsWith('.md')) {
    record(`content.${relativePath}.substantive`, text.trim().length > 200, 'markdown artifact must be substantive');
  }
  record(
    `guard.${relativePath}.noRawCreateCommand`,
    !/(^|\n)\s*az (account alias create|deployment (sub|group) create|role assignment create|consumption budget create)/i.test(text),
    'default artifact text must not expose an ungated mutating az command',
  );
  record(
    `guard.${relativePath}.noHardcodedAzureGuid`,
    !/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(text),
    'do not hardcode tenant/subscription/client GUIDs in scaffold artifacts',
  );
}

const combined = requiredFiles.map((file) => read(file)).join('\n');
for (const term of requiredTerms) {
  const present = combined.includes(term);
  record(`combined.includes.${term}`, present, present ? '' : `missing required term: ${term}`);
}

const approvalPath = path.join(ROOT, 'docs/approvals/AZURE_MUTATION_APPROVED.md');
if (fs.existsSync(approvalPath)) {
  const approval = fs.readFileSync(approvalPath, 'utf8');
  for (const term of [
    'Tenant ID',
    'Subscription IDs',
    'Approved environments',
    'Approved commands',
    'Approved time window',
    'Approver name',
    'Rollback owner',
  ]) {
    record(`approval.includes.${term}`, approval.includes(term), 'approval file is present but incomplete');
  }
} else {
  record('approval.absentNonMutatingMode', true, 'no Azure mutation approval file present');
}

const summary = checks.reduce(
  (acc, check) => {
    acc[check.status] = (acc[check.status] ?? 0) + 1;
    return acc;
  },
  { pass: 0, fail: 0 },
);
const status = summary.fail > 0 ? 'fail' : 'pass';

console.log(JSON.stringify({ audit: 'azure-environment-backlog-artifacts', status, summary, checks }, null, 2));
if (status !== 'pass') process.exit(1);
