#!/usr/bin/env node
// Azure lab L1 resource parity audit.
//
// Verifies that the expected lab resources exist in the expected resource groups
// and flags unexpected resources in those groups for human review. Advisory by
// default; use --strict to fail on unexpected resources as well as missing ones.

import { execFileSync } from 'node:child_process';

const STRICT = process.argv.includes('--strict');

const LAB = {
  subscriptionId: '701a8554-a166-46e9-bf13-743bc50e3b20',
  resourceGroups: [
    'rg-abarva-controlplane-lab-eastus',
    'rg-abarva-private-dataplane-lab-eastus',
    'rg-abarva-database-lab-eastus2',
    'rg-abarva-shared-security-lab-eastus',
    'rg-abarva-observability-lab-eastus',
  ],
};

const EXPECTED_RESOURCES = [
  ['rg-abarva-controlplane-lab-eastus', 'acrabarvalab001', 'Microsoft.ContainerRegistry/registries'],
  ['rg-abarva-controlplane-lab-eastus', 'cae-abarva-scale-lab-eastus', 'Microsoft.App/managedEnvironments'],
  ['rg-abarva-controlplane-lab-eastus', 'ca-abarva-scale-smoke-lab-eastus', 'Microsoft.App/containerApps'],
  ['rg-abarva-controlplane-lab-eastus', 'ca-abarva-web-lab-eastus', 'Microsoft.App/containerApps'],
  ['rg-abarva-controlplane-lab-eastus', 'job-abarva-db-migrate-lab-eastus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'job-abarva-db-copy-lab-eastus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'job-a2b-ingest-lab-eus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'job-a2b-smoke-send-eus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'job-a2b-smoke-verify-eus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'job-azure-connectivity-smoke-eus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'job-a24-search-backfill-eus', 'Microsoft.App/jobs'],
  ['rg-abarva-controlplane-lab-eastus', 'id-abarva-scale-runtime-lab-eastus', 'Microsoft.ManagedIdentity/userAssignedIdentities'],
  ['rg-abarva-controlplane-lab-eastus', 'sb-abarva-lab-eastus', 'Microsoft.ServiceBus/namespaces'],
  ['rg-abarva-controlplane-lab-eastus', 'srch-abarva-context-lab-eastus', 'Microsoft.Search/searchServices'],

  ['rg-abarva-private-dataplane-lab-eastus', 'vnet-abarva-private-dataplane-lab-eastus', 'Microsoft.Network/virtualNetworks'],
  ['rg-abarva-private-dataplane-lab-eastus', 'nsg-abarva-private-dataplane-lab-eastus', 'Microsoft.Network/networkSecurityGroups'],
  ['rg-abarva-private-dataplane-lab-eastus', 'privatelink.blob.core.windows.net', 'Microsoft.Network/privateDnsZones'],
  ['rg-abarva-private-dataplane-lab-eastus', 'privatelink.blob.core.windows.net/vnet-abarva-private-dataplane-lab-eastus-blob-link', 'Microsoft.Network/privateDnsZones/virtualNetworkLinks'],
  ['rg-abarva-private-dataplane-lab-eastus', 'privatelink.vaultcore.azure.net', 'Microsoft.Network/privateDnsZones'],
  ['rg-abarva-private-dataplane-lab-eastus', 'privatelink.vaultcore.azure.net/vnet-abarva-private-dataplane-lab-eastus-vault-link', 'Microsoft.Network/privateDnsZones/virtualNetworkLinks'],
  ['rg-abarva-private-dataplane-lab-eastus', 'privatelink.gremlin.cosmos.azure.com', 'Microsoft.Network/privateDnsZones'],
  ['rg-abarva-private-dataplane-lab-eastus', 'privatelink.gremlin.cosmos.azure.com/vnet-abarva-private-dataplane-lab-eastus-gremlin-link', 'Microsoft.Network/privateDnsZones/virtualNetworkLinks'],
  ['rg-abarva-private-dataplane-lab-eastus', 'stabarvaprivatedplab001', 'Microsoft.Storage/storageAccounts'],
  ['rg-abarva-private-dataplane-lab-eastus', 'pe-stabarvaprivatedplab001-blob', 'Microsoft.Network/privateEndpoints'],
  ['rg-abarva-private-dataplane-lab-eastus', 'pe-kv-shared', 'Microsoft.Network/privateEndpoints'],
  ['rg-abarva-private-dataplane-lab-eastus', 'cos-abarva-graph-lab-001', 'Microsoft.DocumentDB/databaseAccounts'],
  ['rg-abarva-private-dataplane-lab-eastus', 'pe-cos-abarva-graph-lab-001-gremlin', 'Microsoft.Network/privateEndpoints'],

  ['rg-abarva-database-lab-eastus2', 'vnet-abarva-database-lab-eastus2', 'Microsoft.Network/virtualNetworks'],
  ['rg-abarva-database-lab-eastus2', 'privatelink.postgres.database.azure.com', 'Microsoft.Network/privateDnsZones'],
  ['rg-abarva-database-lab-eastus2', 'privatelink.postgres.database.azure.com/vnet-abarva-database-lab-eastus2-postgres-link', 'Microsoft.Network/privateDnsZones/virtualNetworkLinks'],
  ['rg-abarva-database-lab-eastus2', 'privatelink.postgres.database.azure.com/remote-private-dataplane-postgres-link', 'Microsoft.Network/privateDnsZones/virtualNetworkLinks'],
  ['rg-abarva-database-lab-eastus2', 'pg-abarva-context-lab-001', 'Microsoft.DBforPostgreSQL/flexibleServers'],

  ['rg-abarva-shared-security-lab-eastus', 'kv-abarva-lab-001', 'Microsoft.KeyVault/vaults'],

  ['rg-abarva-observability-lab-eastus', 'log-abarva-observability-lab-eastus', 'Microsoft.OperationalInsights/workspaces'],
  ['rg-abarva-observability-lab-eastus', 'appi-abarva-observability-lab-eastus', 'Microsoft.Insights/components'],
  ['rg-abarva-observability-lab-eastus', 'ag-abarva-observability-lab-eastus', 'Microsoft.Insights/actionGroups'],
  ['rg-abarva-observability-lab-eastus', 'ala-subscription-deployment-failures', 'Microsoft.Insights/activityLogAlerts'],
];

const IGNORED_EXTRA_TYPES = new Set([
  'microsoft.eventgrid/systemtopics',
  'microsoft.network/networkinterfaces',
]);

const IGNORED_EXTRA_NAMES = new Set([
  'application insights smart detection',
]);

function az(args) {
  const output = execFileSync('az', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 20,
  }).trim();
  if (!output) return null;
  return JSON.parse(output);
}

function keyFor(resource) {
  return `${String(resource.resourceGroup).toLowerCase()}::${String(resource.name).toLowerCase()}`;
}

function expectedKey([resourceGroup, name]) {
  return `${resourceGroup.toLowerCase()}::${name.toLowerCase()}`;
}

function expectedRecord([resourceGroup, name, type]) {
  return { resourceGroup, name, type };
}

function ignoreUnexpected(resource) {
  const type = String(resource.type ?? '').toLowerCase();
  const name = String(resource.name ?? '').toLowerCase();
  return IGNORED_EXTRA_TYPES.has(type) || IGNORED_EXTRA_NAMES.has(name);
}

function summarize(items) {
  return items.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] ?? 0) + 1;
    return summary;
  }, { pass: 0, attention: 0, fail: 0 });
}

const resources = az([
  'resource', 'list',
  '--subscription', LAB.subscriptionId,
  '--query', '[].{name:name,type:type,resourceGroup:resourceGroup,location:location,id:id}',
  '-o', 'json',
]) ?? [];

const scopedResources = resources.filter((resource) => LAB.resourceGroups.includes(resource.resourceGroup));
const actualByKey = new Map(scopedResources.map((resource) => [keyFor(resource), resource]));

const checks = [];
for (const expected of EXPECTED_RESOURCES.map(expectedRecord)) {
  const actual = actualByKey.get(expectedKey([expected.resourceGroup, expected.name]));
  if (!actual) {
    checks.push({
      name: `resource.${expected.resourceGroup}.${expected.name}`,
      status: 'fail',
      severity: 'fail',
      detail: 'Expected Azure lab resource is missing.',
      expected,
    });
    continue;
  }

  const typeMatches = String(actual.type).toLowerCase() === expected.type.toLowerCase();
  checks.push({
    name: `resource.${expected.resourceGroup}.${expected.name}`,
    status: typeMatches ? 'pass' : 'fail',
    severity: typeMatches ? 'info' : 'fail',
    detail: typeMatches ? 'Expected Azure lab resource exists.' : 'Expected resource exists with a different type.',
    expected,
    actual,
  });
}

const expectedKeys = new Set(EXPECTED_RESOURCES.map(expectedKey));
for (const resource of scopedResources) {
  if (expectedKeys.has(keyFor(resource))) continue;
  if (ignoreUnexpected(resource)) continue;
  checks.push({
    name: `resource.${resource.resourceGroup}.${resource.name}`,
    status: 'attention',
    severity: 'warn',
    detail: 'Resource exists in a tracked lab resource group but is not in the expected-resource manifest.',
    actual: resource,
  });
}

const summary = summarize(checks);
const status = summary.fail > 0 ? 'fail' : summary.attention > 0 ? 'attention' : 'pass';

console.log(JSON.stringify({
  audit: 'azure-l1-resource-parity',
  status,
  strict: STRICT,
  summary,
  expectedResourceCount: EXPECTED_RESOURCES.length,
  scopedResourceCount: scopedResources.length,
  checks,
}, null, 2));

if (summary.fail > 0 || (STRICT && summary.attention > 0)) {
  process.exit(1);
}
