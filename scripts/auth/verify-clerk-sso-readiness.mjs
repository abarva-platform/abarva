#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    checks.push({ name: `file.${relativePath}`, status: 'fail', detail: 'missing' });
    return '';
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  checks.push({ name: `file.${relativePath}`, status: 'pass' });
  return text;
}

function requireSnippet(relativePath, text, snippet) {
  const pass = text.includes(snippet);
  checks.push({
    name: `snippet.${relativePath}.${snippet}`,
    status: pass ? 'pass' : 'fail',
  });
}

function requireRegex(relativePath, text, pattern, label) {
  const pass = pattern.test(text);
  checks.push({
    name: `pattern.${relativePath}.${label}`,
    status: pass ? 'pass' : 'fail',
  });
}

const contractPath = 'docs/security/clerk-sso-claim-contract.md';
const runbookPath = 'docs/runbooks/enterprise-sso-connectivity-test-plan.md';
const ssoPagePath = 'src/app/(maestro)/admin/users-access/sso-configuration/page.tsx';
const currentUserPath = 'src/lib/auth/current-user.ts';
const tenantRolesPath = 'src/lib/auth/tenant-roles.ts';
const packagePath = 'package.json';

const contract = read(contractPath);
const runbook = read(runbookPath);
const ssoPage = read(ssoPagePath);
const currentUser = read(currentUserPath);
const tenantRoles = read(tenantRolesPath);
const packageJson = read(packagePath);

[
  'publicMetadata.clientId',
  'publicMetadata.role',
  'publicMetadata.tenantRoles',
  'publicMetadata.person_id',
  'SAML 2.0 or OIDC',
  'One client key; no cross-client organization membership',
  'No client IdP group maps to AbarVa platform admin',
  'T034 must remain `In progress`',
].forEach((snippet) => requireSnippet(contractPath, contract, snippet));

[
  'docs/security/clerk-sso-claim-contract.md',
  'npm run auth:clerk-sso:verify',
  'publicMetadata.clientId',
  'publicMetadata.tenantRoles',
  'Clerk Organization',
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  'Single-client role assignment',
  'SAML metadata URL',
  'OIDC client ID + issuer URL',
  'only inside',
].forEach((snippet) => requireSnippet(ssoPagePath, ssoPage, snippet));

requireSnippet(currentUserPath, currentUser, 'publicMetadata.clientId');
requireSnippet(currentUserPath, currentUser, 'publicMetadata?.clientId');
requireSnippet(currentUserPath, currentUser, 'metadataClientKey');

[
  "publicMetadata.tenantRoles",
  "'tenant_admin'",
  "'sponsor'",
  "'sme'",
  "'viewer'",
].forEach((snippet) => requireSnippet(tenantRolesPath, tenantRoles, snippet));

requireRegex(packagePath, packageJson, /"auth:clerk-sso:verify"\s*:\s*"node scripts\/auth\/verify-clerk-sso-readiness\.mjs"/, 'npm-script');

const failed = checks.filter((check) => check.status === 'fail');
const report = {
  audit: 'clerk-sso-readiness',
  status: failed.length === 0 ? 'pass' : 'fail',
  summary: {
    pass: checks.length - failed.length,
    fail: failed.length,
  },
  checks,
};

console.log(JSON.stringify(report, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
