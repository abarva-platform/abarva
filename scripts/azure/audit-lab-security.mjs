#!/usr/bin/env node
// Azure lab L3 security audit.
//
// Checks network exposure, local-auth posture, managed-identity role scope,
// and Container Apps literal-secret leakage for the AbarVa lab. The default
// mode is advisory so the lab can surface known gaps without blocking local
// development. Use --strict to exit non-zero on warnings.

import { execFileSync } from 'node:child_process';

const STRICT = process.argv.includes('--strict');

const LAB = {
  subscriptionId: '701a8554-a166-46e9-bf13-743bc50e3b20',
  controlPlaneRg: 'rg-abarva-controlplane-lab-eastus',
  privateDataRg: 'rg-abarva-private-dataplane-lab-eastus',
  databaseRg: 'rg-abarva-database-lab-eastus2',
  sharedSecurityRg: 'rg-abarva-shared-security-lab-eastus',
  managedIdentity: 'id-abarva-scale-runtime-lab-eastus',
  resources: {
    postgres: 'pg-abarva-context-lab-001',
    storage: 'stabarvaprivatedplab001',
    serviceBus: 'sb-abarva-lab-eastus',
    keyVault: 'kv-abarva-lab-001',
    search: 'srch-abarva-context-lab-eastus',
    cosmos: 'cos-abarva-graph-lab-001',
  },
};

const PUBLIC_LITERAL_ENV_ALLOWLIST = new Set([
  'NODE_ENV',
  'NEXT_TELEMETRY_DISABLED',
  'PORT',
  'HOSTNAME',
  'NEXT_PUBLIC_DEMO_MODE',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PINECONE_INDEX',
  'NEXUS_COMPOSER_MODEL',
  'AZURE_CLIENT_ID',
  'AZURE_SEARCH_SERVICE_NAME',
  'AZURE_CONNECTIVITY_SEARCH_INDEX_NAME',
  'AZURE_CONNECTIVITY_RUN_ID',
  'AZURE_KEY_VAULT_NAME',
  'AZURE_CONNECTIVITY_KEY_VAULT_SECRET_NAME',
  'INGESTION_SMOKE_STORAGE_ACCOUNT_NAME',
  'INGESTION_SMOKE_CONTAINER_NAME',
  'SERVICE_BUS_NAMESPACE',
  'SERVICE_BUS_QUEUE_NAME',
  'INGESTION_SMOKE_MODE',
  'INGESTION_SMOKE_TENANT_CLIENT_KEY',
  'AZURE_SEARCH_BACKFILL_BATCH_SIZE',
]);

const BROAD_ROLE_NAMES = new Set([
  'Owner',
  'Contributor',
  'User Access Administrator',
  'Role Based Access Control Administrator',
]);

function az(args) {
  const output = execFileSync('az', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 10,
  }).trim();
  if (!output) return null;
  return JSON.parse(output);
}

function azText(args) {
  return execFileSync('az', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 10,
  }).trim();
}

function result(name, severity, status, detail, evidence = undefined) {
  return { name, severity, status, detail, ...(evidence ? { evidence } : {}) };
}

function pass(name, detail, evidence) {
  return result(name, 'info', 'pass', detail, evidence);
}

function warn(name, detail, evidence) {
  return result(name, 'warn', 'attention', detail, evidence);
}

function fail(name, detail, evidence) {
  return result(name, 'fail', 'fail', detail, evidence);
}

function isDisabled(value) {
  return String(value ?? '').toLowerCase() === 'disabled';
}

function scopeLevel(scope) {
  const lower = scope.toLowerCase();
  if (/\/subscriptions\/[^/]+$/.test(lower)) return 'subscription';
  if (/\/resourcegroups\/[^/]+$/.test(lower)) return 'resource-group';
  if (lower.includes('/providers/')) return 'resource';
  return 'unknown';
}

function sensitiveEnvName(name) {
  if (PUBLIC_LITERAL_ENV_ALLOWLIST.has(name)) return false;
  if (name.startsWith('NEXT_PUBLIC_')) return false;
  return /(SECRET|PASSWORD|TOKEN|DATABASE_URL|CONNECTION|CONN|KEY|URI|DSN|CREDENTIAL)/i.test(name);
}

function auditNetwork() {
  const checks = [];

  const postgres = az([
    'postgres', 'flexible-server', 'show',
    '-g', LAB.databaseRg,
    '-n', LAB.resources.postgres,
    '--query', '{publicNetworkAccess:network.publicNetworkAccess}',
    '-o', 'json',
  ]);
  checks.push(isDisabled(postgres.publicNetworkAccess)
    ? pass('network.postgres.public_access', 'Postgres public network access is disabled.', postgres)
    : fail('network.postgres.public_access', 'Postgres public network access is not disabled.', postgres));

  const storage = az([
    'storage', 'account', 'show',
    '-g', LAB.privateDataRg,
    '-n', LAB.resources.storage,
    '--query', '{publicNetworkAccess:publicNetworkAccess,defaultAction:networkRuleSet.defaultAction,allowBlobPublicAccess:allowBlobPublicAccess}',
    '-o', 'json',
  ]);
  const storagePass = isDisabled(storage.publicNetworkAccess)
    && storage.defaultAction === 'Deny'
    && storage.allowBlobPublicAccess === false;
  checks.push(storagePass
    ? pass('network.storage.public_access', 'Storage public network access is disabled and default action is deny.', storage)
    : fail('network.storage.public_access', 'Storage public network posture is not private-data-lane ready.', storage));

  const serviceBus = az([
    'servicebus', 'namespace', 'show',
    '-g', LAB.controlPlaneRg,
    '-n', LAB.resources.serviceBus,
    '--query', '{publicNetworkAccess:publicNetworkAccess,disableLocalAuth:disableLocalAuth}',
    '-o', 'json',
  ]);
  checks.push(isDisabled(serviceBus.publicNetworkAccess)
    ? pass('network.service_bus.public_access', 'Service Bus public network access is disabled.', serviceBus)
    : warn('network.service_bus.public_access', 'Service Bus public network access is enabled; add private endpoint before customer private-data-lane pilot.', serviceBus));
  checks.push(serviceBus.disableLocalAuth === true
    ? pass('identity.service_bus.local_auth', 'Service Bus local auth is disabled.', serviceBus)
    : warn('identity.service_bus.local_auth', 'Service Bus local auth is enabled; prefer managed identity only after the private endpoint lane lands.', serviceBus));

  const keyVault = az([
    'keyvault', 'show',
    '-g', LAB.sharedSecurityRg,
    '-n', LAB.resources.keyVault,
    '--query', '{publicNetworkAccess:properties.publicNetworkAccess,defaultAction:properties.networkAcls.defaultAction,enableRbacAuthorization:properties.enableRbacAuthorization}',
    '-o', 'json',
  ]);
  checks.push(isDisabled(keyVault.publicNetworkAccess) && keyVault.defaultAction === 'Deny'
    ? pass('network.key_vault.public_access', 'Key Vault public network access is disabled and default action is deny.', keyVault)
    : warn('network.key_vault.public_access', 'Key Vault is still public-network reachable for lab manageability; close when private operator path exists.', keyVault));
  checks.push(keyVault.enableRbacAuthorization === true
    ? pass('identity.key_vault.rbac', 'Key Vault RBAC authorization is enabled.', keyVault)
    : fail('identity.key_vault.rbac', 'Key Vault RBAC authorization is not enabled.', keyVault));

  const search = az([
    'search', 'service', 'show',
    '-g', LAB.controlPlaneRg,
    '-n', LAB.resources.search,
    '--query', '{publicNetworkAccess:publicNetworkAccess,disableLocalAuth:disableLocalAuth,authOptions:authOptions}',
    '-o', 'json',
  ]);
  checks.push(isDisabled(search.publicNetworkAccess)
    ? pass('network.ai_search.public_access', 'Azure AI Search public network access is disabled.', search)
    : warn('network.ai_search.public_access', 'Azure AI Search public network access is enabled; add private endpoint before customer private-data-lane pilot.', search));
  checks.push(search.disableLocalAuth === true || !search.authOptions?.apiKeyOnly
    ? pass('identity.ai_search.local_auth', 'Azure AI Search is not API-key-only.', search)
    : warn('identity.ai_search.local_auth', 'Azure AI Search is API-key-only/local-auth enabled; move to RBAC-only after Search private endpoint lands.', search));

  const cosmos = az([
    'cosmosdb', 'show',
    '-g', LAB.privateDataRg,
    '-n', LAB.resources.cosmos,
    '--query', '{publicNetworkAccess:publicNetworkAccess,disableLocalAuth:disableLocalAuth}',
    '-o', 'json',
  ]);
  checks.push(isDisabled(cosmos.publicNetworkAccess)
    ? pass('network.cosmos.public_access', 'Cosmos graph public network access is disabled.', cosmos)
    : fail('network.cosmos.public_access', 'Cosmos graph public network access is not disabled.', cosmos));
  checks.push(cosmos.disableLocalAuth === true
    ? pass('identity.cosmos.local_auth', 'Cosmos local auth is disabled.', cosmos)
    : warn('identity.cosmos.local_auth', 'Cosmos local auth is enabled; move to managed identity/RBAC before customer private-data-lane pilot.', cosmos));

  return checks;
}

function auditManagedIdentityRoles() {
  const principalId = azText([
    'identity', 'show',
    '-g', LAB.controlPlaneRg,
    '-n', LAB.managedIdentity,
    '--query', 'principalId',
    '-o', 'tsv',
  ]);
  const assignments = az([
    'role', 'assignment', 'list',
    '--assignee-object-id', principalId,
    '--all',
    '--query', '[].{role:roleDefinitionName,scope:scope}',
    '-o', 'json',
  ]) ?? [];

  const checks = [];
  for (const assignment of assignments) {
    const level = scopeLevel(assignment.scope);
    if (BROAD_ROLE_NAMES.has(assignment.role) && level !== 'resource') {
      checks.push(fail(
        `rbac.${assignment.role.replaceAll(' ', '_').toLowerCase()}`,
        `Managed identity has broad role ${assignment.role} at ${level} scope.`,
        assignment,
      ));
      continue;
    }
    if (assignment.role === 'Storage Blob Data Contributor' && !assignment.scope.includes('/blobServices/default/containers/')) {
      checks.push(warn(
        'rbac.storage_scope',
        'Storage Blob Data Contributor is assigned above container scope; acceptable for lab, tighten to upload container before pilot.',
        assignment,
      ));
      continue;
    }
    if (assignment.role.startsWith('Azure Service Bus Data') && !assignment.scope.includes('/queues/')) {
      checks.push(warn(
        'rbac.service_bus_scope',
        'Service Bus data role is assigned at namespace scope; acceptable for lab, tighten to queue scope before pilot.',
        assignment,
      ));
      continue;
    }
    checks.push(pass(
      `rbac.${assignment.role.replaceAll(' ', '_').toLowerCase()}`,
      `Managed identity role ${assignment.role} is not subscription-wide broad access.`,
      assignment,
    ));
  }

  if (assignments.length === 0) {
    checks.push(fail('rbac.assignments_present', 'Managed identity has no role assignments.', { principalId }));
  }
  return checks;
}

function envChecksForContainer(containerName, envs) {
  const checks = [];
  for (const env of envs ?? []) {
    if (env.secretRef) {
      checks.push(pass(
        `env.${containerName}.${env.name}`,
        `${env.name} is projected from a Container Apps secret reference.`,
        { name: env.name, secretRef: true },
      ));
      continue;
    }
    if (sensitiveEnvName(env.name)) {
      checks.push(fail(
        `env.${containerName}.${env.name}`,
        `${env.name} is a sensitive-looking literal env var. Move it to Key Vault/secretRef.`,
        { name: env.name, literal: true },
      ));
      continue;
    }
    checks.push(pass(
      `env.${containerName}.${env.name}`,
      `${env.name} is an allowed non-secret literal.`,
      { name: env.name, literal: true },
    ));
  }
  return checks;
}

function auditContainerAppEnv() {
  const checks = [];
  const apps = az([
    'containerapp', 'list',
    '-g', LAB.controlPlaneRg,
    '--query', '[].name',
    '-o', 'json',
  ]) ?? [];
  for (const appName of apps) {
    const app = az([
      'containerapp', 'show',
      '-g', LAB.controlPlaneRg,
      '-n', appName,
      '--query', '{containers:properties.template.containers}',
      '-o', 'json',
    ]);
    for (const container of app.containers ?? []) {
      checks.push(...envChecksForContainer(`app.${appName}.${container.name}`, container.env ?? []));
    }
  }

  const jobs = az([
    'containerapp', 'job', 'list',
    '-g', LAB.controlPlaneRg,
    '--query', '[].name',
    '-o', 'json',
  ]) ?? [];
  for (const jobName of jobs) {
    const job = az([
      'containerapp', 'job', 'show',
      '-g', LAB.controlPlaneRg,
      '-n', jobName,
      '--query', '{containers:properties.template.containers}',
      '-o', 'json',
    ]);
    for (const container of job.containers ?? []) {
      checks.push(...envChecksForContainer(`job.${jobName}.${container.name}`, container.env ?? []));
    }
  }
  return checks;
}

function summarize(checks) {
  const failCount = checks.filter((check) => check.status === 'fail').length;
  const warnCount = checks.filter((check) => check.status === 'attention').length;
  return {
    event: 'azure_lab_security_audit',
    status: failCount > 0 ? 'fail' : warnCount > 0 ? 'attention' : 'pass',
    producedAt: new Date().toISOString(),
    strict: STRICT,
    summary: {
      pass: checks.filter((check) => check.status === 'pass').length,
      attention: warnCount,
      fail: failCount,
      total: checks.length,
    },
    checks,
  };
}

function main() {
  const checks = [
    ...auditNetwork(),
    ...auditManagedIdentityRoles(),
    ...auditContainerAppEnv(),
  ];
  const report = summarize(checks);
  console.log(JSON.stringify(report, null, 2));
  if (report.summary.fail > 0 || (STRICT && report.summary.attention > 0)) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(JSON.stringify({
    event: 'azure_lab_security_audit',
    status: 'fail',
    producedAt: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err),
  }, null, 2));
  process.exit(1);
}
