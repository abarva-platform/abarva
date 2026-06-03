#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'infra/azure/immutable-audit-log.bicep',
  'infra/azure/client-tenant-foundation.bicep',
  'infra/azure/parameters/client-tenant.preview.example.bicepparam',
  'docs/runbooks/immutable-audit-log.md',
  'docs/build/IMMUTABLE_AUDIT_LOG_2026-06-03.md',
];

const REQUIRED_SNIPPETS = [
  ['infra/azure/immutable-audit-log.bicep', "immutableStorageWithVersioning: {"],
  ['infra/azure/immutable-audit-log.bicep', "enabled: true"],
  ['infra/azure/immutable-audit-log.bicep', "Microsoft.Storage/storageAccounts/blobServices/containers/immutabilityPolicies@2023-05-01"],
  ['infra/azure/immutable-audit-log.bicep', "allowProtectedAppendWrites: allowProtectedAppendWrites"],
  ['infra/azure/immutable-audit-log.bicep', "immutabilityPeriodSinceCreationInDays: auditLogRetentionDays"],
  ['infra/azure/immutable-audit-log.bicep', "param auditLogSoftDeleteRetentionDays int = 365"],
  ['infra/azure/immutable-audit-log.bicep', "isVersioningEnabled: true"],
  ['infra/azure/immutable-audit-log.bicep', "changeFeed: {"],
  ['infra/azure/immutable-audit-log.bicep', "client_isolation: 'single-client'"],
  ['infra/azure/client-tenant-foundation.bicep', "module immutableAuditLog './immutable-audit-log.bicep'"],
  ['infra/azure/client-tenant-foundation.bicep', "param auditLogRetentionDays int = environmentName == 'prod' ? 730 : 365"],
  ['infra/azure/client-tenant-foundation.bicep', "auditLogSoftDeleteRetentionDays: 365"],
  ['infra/azure/client-tenant-foundation.bicep', "output auditLogContainerName string = immutableAuditLog.outputs.auditLogContainerName"],
  ['infra/azure/parameters/client-tenant.preview.example.bicepparam', "param auditLogRetentionDays = 365"],
  ['docs/runbooks/immutable-audit-log.md', 'Do not shorten or remove an immutability policy after customer approval.'],
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function checkFile(relativePath) {
  return {
    name: `file.${relativePath}`,
    status: fs.existsSync(path.join(ROOT, relativePath)) ? 'pass' : 'fail',
  };
}

function checkSnippet([relativePath, snippet]) {
  return {
    name: `snippet.${relativePath}.${snippet}`,
    status: read(relativePath).includes(snippet) ? 'pass' : 'fail',
  };
}

const checks = [
  ...REQUIRED_FILES.map(checkFile),
  ...REQUIRED_SNIPPETS.map(checkSnippet),
];

const summary = checks.reduce((acc, check) => {
  acc[check.status] = (acc[check.status] ?? 0) + 1;
  return acc;
}, {});

const status = checks.some((check) => check.status === 'fail') ? 'fail' : 'pass';

console.log(JSON.stringify({
  audit: 'immutable-audit-log-readiness',
  status,
  summary,
  checks,
}, null, 2));

if (status !== 'pass') process.exit(1);
