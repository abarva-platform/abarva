import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const config = {
  clientKey: process.env.LAKESHORE_AZURE_CLIENT_KEY ?? 'lakeshore',
  outputRoot: process.env.LAKESHORE_AZURE_AUDIT_OUT ?? 'audit-artifacts/lakeshore-private-plane-health',
  dataResourceGroup: process.env.LAKESHORE_AZURE_DATA_RG ?? 'rg-abarva-lakeshore-pilot-data-eastus',
  dbResourceGroup: process.env.LAKESHORE_AZURE_DB_RG ?? 'rg-abarva-lakeshore-pilot-db-eastus2',
  controlResourceGroup: process.env.LAKESHORE_AZURE_CONTROL_RG ?? 'rg-abarva-lakeshore-pilot-control-eastus',
  securityResourceGroup: process.env.LAKESHORE_AZURE_SECURITY_RG ?? 'rg-abarva-lakeshore-pilot-security-eastus',
  obsResourceGroup: process.env.LAKESHORE_AZURE_OBS_RG ?? 'rg-abarva-lakeshore-pilot-obs-eastus',
  storageAccount: process.env.LAKESHORE_AZURE_STORAGE_ACCOUNT ?? 'stlakeshorepilotlsh001',
  postgresServer: process.env.LAKESHORE_AZURE_POSTGRES_SERVER ?? 'pglakeshorepilotlsh001',
  keyVault: process.env.LAKESHORE_AZURE_KEY_VAULT ?? 'kvlakeshorepilotlsh001',
  searchService: process.env.LAKESHORE_AZURE_SEARCH_SERVICE ?? 'srchlakeshorepilotlsh001',
  serviceBusNamespace: process.env.LAKESHORE_AZURE_SERVICE_BUS ?? 'sblakeshorepilotlsh001',
  containerAppsEnvironment: process.env.LAKESHORE_AZURE_CONTAINERAPPS_ENV ?? 'cae-abarva-lakeshore-pilot-eastus',
  managedIdentity: process.env.LAKESHORE_AZURE_MANAGED_IDENTITY ?? 'id-abarva-lakeshore-pilot-runtime-eastus',
  dataVnet: process.env.LAKESHORE_AZURE_DATA_VNET ?? 'vnet-abarva-lakeshore-pilot-data-eastus',
  dbVnet: process.env.LAKESHORE_AZURE_DB_VNET ?? 'vnet-abarva-lakeshore-pilot-db-eastus2',
  postgresDnsZone: process.env.LAKESHORE_AZURE_POSTGRES_DNS_ZONE ?? 'privatelink.postgres.database.azure.com',
  logAnalyticsWorkspace: process.env.LAKESHORE_AZURE_LOG_WORKSPACE ?? 'log-abarva-lakeshore-pilot-eastus',
  appInsights: process.env.LAKESHORE_AZURE_APP_INSIGHTS ?? 'appi-abarva-lakeshore-pilot-eastus',
  latestDeployment: process.env.LAKESHORE_AZURE_DEPLOYMENT ?? 'lakeshore-private-data-plane-namefix2-20260604105921',
};

const runId = `lakeshore-private-plane-health-${new Date().toISOString().replace(/[:.]/g, '-')}-${await gitSha()}`;
const outputDir = path.join(config.outputRoot, runId);

async function gitSha() {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    return stdout.trim();
  } catch {
    return 'nogit';
  }
}

async function az(args, options = {}) {
  try {
    const { stdout } = await execFileAsync('az', args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
      ...options,
    });
    const trimmed = stdout.trim();
    return trimmed ? JSON.parse(trimmed) : null;
  } catch (error) {
    return {
      __error: true,
      command: ['az', ...args].join(' '),
      message: error.message,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
    };
  }
}

function isError(value) {
  return Boolean(value?.__error);
}

function pass(id, area, message, evidence = {}) {
  return { id, area, status: 'pass', message, evidence };
}

function warn(id, area, message, evidence = {}) {
  return { id, area, status: 'watch', message, evidence };
}

function fail(id, area, message, evidence = {}) {
  return { id, area, status: 'fail', message, evidence };
}

function hasApprovedConnection(privateEndpoints, namePart, groupId) {
  return privateEndpoints.some((endpoint) =>
    endpoint.name?.includes(namePart) &&
    endpoint.connections?.some((connection) => connection.status === 'Approved' && connection.groupIds?.includes(groupId)),
  );
}

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return escapeHtml(JSON.stringify(value));
  return escapeHtml(String(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderChecks(checks) {
  return `<table>
    <thead><tr><th>Status</th><th>Area</th><th>Check</th><th>Evidence</th></tr></thead>
    <tbody>${checks
      .map(
        (check) =>
          `<tr class="${check.status}"><td>${escapeHtml(check.status.toUpperCase())}</td><td>${escapeHtml(check.area)}</td><td><strong>${escapeHtml(check.id)}</strong><br>${escapeHtml(check.message)}</td><td>${renderValue(check.evidence)}</td></tr>`,
      )
      .join('')}</tbody>
  </table>`;
}

function renderReport(summary) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lakeshore Private-Plane Health Audit</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #17211d; background: #f7f4ed; }
    h1 { margin-bottom: 4px; }
    .meta, .note { color: #52615b; }
    .pill { display: inline-block; margin: 16px 0; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5cf; background: #fff; font-weight: 750; }
    .pass td:first-child { color: #116b3a; font-weight: 800; }
    .watch td:first-child { color: #8a5c00; font-weight: 800; }
    .fail td:first-child { color: #a61b1b; font-weight: 800; }
    table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #d8ded8; margin: 14px 0 26px; }
    th, td { text-align: left; border-bottom: 1px solid #e6e9e4; padding: 8px 10px; vertical-align: top; font-size: 13px; }
    th { background: #edf1ec; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    pre { white-space: pre-wrap; background: #18221f; color: #f7f4ed; padding: 14px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Lakeshore Private-Plane Health Audit</h1>
  <div class="meta">Checked at ${escapeHtml(summary.checkedAt)} · git ${escapeHtml(summary.gitSha)} · client ${escapeHtml(summary.clientKey)}</div>
  <div class="pill">Status: ${escapeHtml(summary.status)} · ${summary.totals.pass} pass · ${summary.totals.watch} watch · ${summary.totals.fail} fail</div>
  <p class="note">${escapeHtml(summary.demoTruth)}</p>
  <h2>Checks</h2>
  ${renderChecks(summary.checks)}
  <h2>Remaining Watch Items</h2>
  <pre>${escapeHtml(JSON.stringify(summary.watchItems, null, 2))}</pre>
</body>
</html>`;
}

function sanitizeForCommit(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeForCommit(item));
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value;
    return value
      .replaceAll(/\/subscriptions\/[0-9a-f-]{36}/gi, '/subscriptions/<redacted>')
      .replaceAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<redacted-guid>');
  }

  const sanitized = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'raw') continue;
    sanitized[key] = sanitizeForCommit(child);
  }
  return sanitized;
}

function compactForCommit(summary) {
  return {
    status: summary.status,
    checkedAt: summary.checkedAt,
    gitSha: summary.gitSha,
    clientKey: summary.clientKey,
    totals: summary.totals,
    checks: summary.checks.map((check) => ({
      id: check.id,
      area: check.area,
      status: check.status,
      message: check.message,
    })),
    watchItems: summary.watchItems.map((check) => ({
      id: check.id,
      area: check.area,
      status: check.status,
      message: check.message,
    })),
    demoTruth: summary.demoTruth,
    outputDir: summary.outputDir,
  };
}

async function collect() {
  const [
    deployment,
    resourceGroups,
    postgres,
    postgresDbs,
    storage,
    containers,
    managementPolicy,
    privateEndpoints,
    search,
    serviceBus,
    serviceBusQueues,
    keyVault,
    identity,
    containerAppEnv,
    containerApps,
    dataPeerings,
    dbPeerings,
    dnsLinks,
    dnsRecords,
    logAnalytics,
    appInsights,
  ] = await Promise.all([
    az(['deployment', 'sub', 'show', '--name', config.latestDeployment, '--query', '{name:name,provisioningState:properties.provisioningState,timestamp:properties.timestamp,outputs:properties.outputs}', '-o', 'json']),
    az(['group', 'list', '--query', '[].name', '-o', 'json']),
    az(['postgres', 'flexible-server', 'show', '-g', config.dbResourceGroup, '-n', config.postgresServer, '--query', '{name:name,state:state,version:version,publicNetworkAccess:network.publicNetworkAccess,delegatedSubnetResourceId:network.delegatedSubnetResourceId,privateDnsZoneArmResourceId:network.privateDnsZoneArmResourceId,storageSizeGb:storage.storageSizeGb,backupRetentionDays:backup.backupRetentionDays,highAvailability:highAvailability.mode}', '-o', 'json']),
    az(['postgres', 'flexible-server', 'db', 'list', '-g', config.dbResourceGroup, '-s', config.postgresServer, '--query', '[].name', '-o', 'json']),
    az(['storage', 'account', 'show', '-g', config.dataResourceGroup, '-n', config.storageAccount, '--query', '{name:name,kind:kind,sku:sku.name,provisioningState:provisioningState,minimumTlsVersion:minimumTlsVersion,allowBlobPublicAccess:allowBlobPublicAccess,publicNetworkAccess:publicNetworkAccess}', '-o', 'json']),
    az(['storage', 'container', 'list', '--account-name', config.storageAccount, '--auth-mode', 'login', '--query', '[].{name:name,publicAccess:properties.publicAccess,hasImmutabilityPolicy:properties.hasImmutabilityPolicy,hasLegalHold:properties.hasLegalHold}', '-o', 'json']),
    az(['storage', 'account', 'management-policy', 'show', '-g', config.dataResourceGroup, '--account-name', config.storageAccount, '--query', '{rules:policy.rules[].{name:name,enabled:enabled,filters:definition.filters,actions:definition.actions}}', '-o', 'json']),
    az(['network', 'private-endpoint', 'list', '-g', config.dataResourceGroup, '--query', '[].{name:name,provisioningState:provisioningState,connections:privateLinkServiceConnections[].{groupIds:groupIds,status:privateLinkServiceConnectionState.status}}', '-o', 'json']),
    az(['search', 'service', 'show', '-g', config.controlResourceGroup, '-n', config.searchService, '--query', '{name:name,status:status,provisioningState:provisioningState,sku:sku.name,publicNetworkAccess:publicNetworkAccess,replicaCount:replicaCount,partitionCount:partitionCount}', '-o', 'json']),
    az(['servicebus', 'namespace', 'show', '-g', config.controlResourceGroup, '-n', config.serviceBusNamespace, '--query', '{name:name,provisioningState:provisioningState,status:status,sku:sku.name}', '-o', 'json']),
    az(['servicebus', 'queue', 'list', '-g', config.controlResourceGroup, '--namespace-name', config.serviceBusNamespace, '--query', '[].{name:name,status:status,maxDeliveryCount:maxDeliveryCount}', '-o', 'json']),
    az(['keyvault', 'show', '-g', config.securityResourceGroup, '-n', config.keyVault, '--query', '{name:name,provisioningState:properties.provisioningState,enablePurgeProtection:properties.enablePurgeProtection,enableRbacAuthorization:properties.enableRbacAuthorization,publicNetworkAccess:properties.publicNetworkAccess}', '-o', 'json']),
    az(['identity', 'show', '-g', config.controlResourceGroup, '-n', config.managedIdentity, '--query', '{name:name}', '-o', 'json']),
    az(['containerapp', 'env', 'show', '-g', config.controlResourceGroup, '-n', config.containerAppsEnvironment, '--query', '{name:name,provisioningState:properties.provisioningState,defaultDomain:properties.defaultDomain,workloadProfiles:properties.workloadProfiles}', '-o', 'json']),
    az(['containerapp', 'list', '-g', config.controlResourceGroup, '--query', '[].{name:name,provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,latestRevisionName:properties.latestRevisionName,images:properties.template.containers[].image}', '-o', 'json']),
    az(['network', 'vnet', 'peering', 'list', '-g', config.dataResourceGroup, '--vnet-name', config.dataVnet, '--query', '[].{name:name,peeringState:peeringState,peeringSyncLevel:peeringSyncLevel}', '-o', 'json']),
    az(['network', 'vnet', 'peering', 'list', '-g', config.dbResourceGroup, '--vnet-name', config.dbVnet, '--query', '[].{name:name,peeringState:peeringState,peeringSyncLevel:peeringSyncLevel}', '-o', 'json']),
    az(['network', 'private-dns', 'link', 'vnet', 'list', '-g', config.dbResourceGroup, '-z', config.postgresDnsZone, '--query', '[].{name:name,virtualNetwork:virtualNetwork.id,provisioningState:provisioningState}', '-o', 'json']),
    az(['network', 'private-dns', 'record-set', 'a', 'list', '-g', config.dbResourceGroup, '-z', config.postgresDnsZone, '--query', '[].{name:name,records:aRecords[].ipv4Address}', '-o', 'json']),
    az(['monitor', 'log-analytics', 'workspace', 'show', '-g', config.obsResourceGroup, '-n', config.logAnalyticsWorkspace, '--query', '{name:name,provisioningState:provisioningState,retentionInDays:retentionInDays,sku:sku.name}', '-o', 'json']),
    az(['monitor', 'app-insights', 'component', 'show', '-g', config.obsResourceGroup, '-a', config.appInsights, '--query', '{name:name,provisioningState:provisioningState,applicationType:applicationType,workspaceResourceId:workspaceResourceId}', '-o', 'json']),
  ]);

  const expectedGroups = [
    config.dataResourceGroup,
    config.dbResourceGroup,
    config.controlResourceGroup,
    config.securityResourceGroup,
    config.obsResourceGroup,
  ];

  const raw = {
    deployment,
    resourceGroups,
    postgres,
    postgresDbs,
    storage,
    containers,
    managementPolicy,
    privateEndpoints,
    search,
    serviceBus,
    serviceBusQueues,
    keyVault,
    identity,
    containerAppEnv,
    containerApps,
    dataPeerings,
    dbPeerings,
    dnsLinks,
    dnsRecords,
    logAnalytics,
    appInsights,
  };

  const checks = [];

  if (deployment?.provisioningState === 'Succeeded') {
    checks.push(pass('latest-deployment-succeeded', 'Deployment', 'Latest Lakeshore private-plane deployment succeeded.', { name: deployment.name, timestamp: deployment.timestamp }));
  } else {
    checks.push(fail('latest-deployment-succeeded', 'Deployment', 'Latest Lakeshore private-plane deployment is not succeeded.', deployment));
  }

  const missingGroups = Array.isArray(resourceGroups) ? expectedGroups.filter((group) => !resourceGroups.includes(group)) : expectedGroups;
  checks.push(
    missingGroups.length === 0
      ? pass('resource-groups-exist', 'Deployment', 'Expected resource groups exist.', { expectedGroups })
      : fail('resource-groups-exist', 'Deployment', 'One or more expected resource groups are missing.', { missingGroups }),
  );

  checks.push(
    postgres?.state === 'Ready' && postgres?.publicNetworkAccess === 'Disabled'
      ? pass('postgres-private-ready', 'Database', 'Postgres Flexible Server is ready and public network access is disabled.', postgres)
      : fail('postgres-private-ready', 'Database', 'Postgres Flexible Server is not private-ready.', postgres),
  );

  const expectedDbs = ['abarva_context', 'abarva_control', 'abarva_audit'];
  const missingDbs = Array.isArray(postgresDbs) ? expectedDbs.filter((db) => !postgresDbs.includes(db)) : expectedDbs;
  checks.push(
    missingDbs.length === 0
      ? pass('postgres-logical-databases', 'Database', 'Expected Lakeshore logical databases exist.', { expectedDbs })
      : fail('postgres-logical-databases', 'Database', 'Expected Lakeshore logical databases are missing.', { missingDbs }),
  );

  checks.push(
    Array.isArray(dataPeerings) &&
      Array.isArray(dbPeerings) &&
      dataPeerings.every((peering) => peering.peeringState === 'Connected' && peering.peeringSyncLevel === 'FullyInSync') &&
      dbPeerings.every((peering) => peering.peeringState === 'Connected' && peering.peeringSyncLevel === 'FullyInSync')
      ? pass('vnet-peerings-connected', 'Network', 'Data and DB VNet peerings are connected and fully synced.', { dataPeerings, dbPeerings })
      : fail('vnet-peerings-connected', 'Network', 'Data and DB VNet peerings are not fully connected.', { dataPeerings, dbPeerings }),
  );

  checks.push(
    Array.isArray(dnsLinks) && dnsLinks.length >= 2 && Array.isArray(dnsRecords) && dnsRecords.length > 0
      ? pass('postgres-private-dns-linked', 'Network', 'Postgres private DNS is linked and has an A record.', { dnsLinks, dnsRecords })
      : fail('postgres-private-dns-linked', 'Network', 'Postgres private DNS links or A records are missing.', { dnsLinks, dnsRecords }),
  );

  checks.push(
    storage?.provisioningState === 'Succeeded' && storage?.minimumTlsVersion === 'TLS1_2' && storage?.allowBlobPublicAccess === false
      ? pass('storage-secure-baseline', 'Storage', 'Storage account is provisioned with TLS 1.2 and no public blob access.', storage)
      : fail('storage-secure-baseline', 'Storage', 'Storage account baseline is not healthy.', storage),
  );

  checks.push(
    storage?.publicNetworkAccess === 'Disabled'
      ? pass('storage-public-network-disabled', 'Storage', 'Storage public network access is disabled.', { publicNetworkAccess: storage.publicNetworkAccess })
      : warn('storage-public-network-disabled', 'Storage', 'Storage public network access is still enabled; private endpoint exists but pilot cutover should decide whether to lock this down.', { publicNetworkAccess: storage?.publicNetworkAccess }),
  );

  const expectedContainers = ['audit-ledger', 'context-drops', 'context-processed', 'program-attachments', 'source-artifacts'];
  const containerNames = Array.isArray(containers) ? containers.map((container) => container.name) : [];
  const missingContainers = expectedContainers.filter((container) => !containerNames.includes(container));
  checks.push(
    missingContainers.length === 0
      ? pass('storage-containers-exist', 'Storage', 'Expected Lakeshore storage containers exist.', { expectedContainers })
      : fail('storage-containers-exist', 'Storage', 'Expected Lakeshore storage containers are missing.', { missingContainers }),
  );

  const auditContainer = Array.isArray(containers) ? containers.find((container) => container.name === 'audit-ledger') : null;
  checks.push(
    auditContainer?.hasImmutabilityPolicy === true
      ? pass('audit-ledger-immutable', 'Storage', 'Audit ledger container has an immutability policy.', auditContainer)
      : fail('audit-ledger-immutable', 'Storage', 'Audit ledger immutability policy is missing.', auditContainer),
  );

  const lifecycleBlobTypes = managementPolicy?.rules?.flatMap((rule) => rule.filters?.blobTypes ?? []) ?? [];
  checks.push(
    lifecycleBlobTypes.includes('appendBlob')
      ? pass('audit-lifecycle-append-blob-aware', 'Storage', 'Audit lifecycle policy includes append blobs.', { lifecycleBlobTypes })
      : warn('audit-lifecycle-append-blob-aware', 'Storage', 'Audit lifecycle policy is deployment-safe but currently scoped to block blobs; confirm intended runtime blob type before pilot cutover.', { lifecycleBlobTypes }),
  );

  checks.push(
    Array.isArray(privateEndpoints) && hasApprovedConnection(privateEndpoints, 'kv', 'vault') && hasApprovedConnection(privateEndpoints, 'blob', 'blob')
      ? pass('data-plane-private-endpoints-approved', 'Network', 'Key Vault and storage blob private endpoints are approved.', privateEndpoints)
      : fail('data-plane-private-endpoints-approved', 'Network', 'Expected private endpoint approvals are missing.', privateEndpoints),
  );

  checks.push(
    keyVault?.provisioningState === 'Succeeded' && keyVault?.enablePurgeProtection === true && keyVault?.enableRbacAuthorization === true
      ? pass('key-vault-secure-baseline', 'Security', 'Key Vault is provisioned with purge protection and RBAC authorization.', keyVault)
      : fail('key-vault-secure-baseline', 'Security', 'Key Vault secure baseline is not healthy.', keyVault),
  );

  checks.push(
    keyVault?.publicNetworkAccess === 'Disabled'
      ? pass('key-vault-public-network-disabled', 'Security', 'Key Vault public network access is disabled.', { publicNetworkAccess: keyVault.publicNetworkAccess })
      : warn('key-vault-public-network-disabled', 'Security', 'Key Vault public network access is still enabled; private endpoint exists but pilot cutover should decide whether to lock this down.', { publicNetworkAccess: keyVault?.publicNetworkAccess }),
  );

  checks.push(
    search?.status === 'running' && search?.provisioningState === 'succeeded'
      ? pass('azure-ai-search-running', 'Search', 'Azure AI Search is running.', search)
      : fail('azure-ai-search-running', 'Search', 'Azure AI Search is not running.', search),
  );

  checks.push(
    serviceBus?.status === 'Active' && serviceBus?.provisioningState === 'Succeeded'
      ? pass('service-bus-active', 'Messaging', 'Service Bus namespace is active.', serviceBus)
      : fail('service-bus-active', 'Messaging', 'Service Bus namespace is not active.', serviceBus),
  );

  const expectedQueues = ['q-lakeshore-agent-work', 'q-lakeshore-context-ingestion'];
  const queueNames = Array.isArray(serviceBusQueues) ? serviceBusQueues.map((queue) => queue.name) : [];
  const missingQueues = expectedQueues.filter((queue) => !queueNames.includes(queue));
  checks.push(
    missingQueues.length === 0
      ? pass('service-bus-queues-active', 'Messaging', 'Expected Service Bus queues exist.', { expectedQueues, serviceBusQueues })
      : fail('service-bus-queues-active', 'Messaging', 'Expected Service Bus queues are missing.', { missingQueues, serviceBusQueues }),
  );

  checks.push(
    identity?.name === config.managedIdentity
      ? pass('managed-identity-exists', 'Identity', 'Runtime managed identity exists.', identity)
      : fail('managed-identity-exists', 'Identity', 'Runtime managed identity is missing.', identity),
  );

  checks.push(
    containerAppEnv?.provisioningState === 'Succeeded'
      ? pass('container-apps-env-ready', 'Runtime', 'Container Apps environment is provisioned.', containerAppEnv)
      : fail('container-apps-env-ready', 'Runtime', 'Container Apps environment is not provisioned.', containerAppEnv),
  );

  const runningApps = Array.isArray(containerApps) ? containerApps.filter((app) => app.runningStatus === 'Running') : [];
  checks.push(
    runningApps.length > 0
      ? warn('container-apps-smoke-only', 'Runtime', 'Container Apps substrate is running placeholder smoke apps, not the production AbarVa runtime.', { runningApps })
      : fail('container-apps-smoke-only', 'Runtime', 'No running Container Apps were found.', { containerApps }),
  );

  checks.push(
    logAnalytics?.provisioningState === 'Succeeded' && appInsights?.provisioningState === 'Succeeded'
      ? pass('observability-ready', 'Observability', 'Log Analytics and App Insights are provisioned.', { logAnalytics, appInsights })
      : fail('observability-ready', 'Observability', 'Observability resources are not healthy.', { logAnalytics, appInsights }),
  );

  const totals = {
    pass: checks.filter((check) => check.status === 'pass').length,
    watch: checks.filter((check) => check.status === 'watch').length,
    fail: checks.filter((check) => check.status === 'fail').length,
  };

  const status =
    totals.fail > 0 ? 'blocked' : totals.watch > 0 ? 'pilot_substrate_healthy_with_cutover_watches' : 'pilot_substrate_green';

  return {
    status,
    checkedAt: new Date().toISOString(),
    gitSha: await gitSha(),
    clientKey: config.clientKey,
    config,
    totals,
    checks,
    watchItems: checks.filter((check) => check.status === 'watch'),
    raw,
    demoTruth:
      'The Lakeshore Azure private data-plane substrate is deployed and healthy enough for pilot-readiness proof, while the live demo remains on the shared Vercel/Postgres app until runtime cutover is explicitly performed.',
    outputDir,
  };
}

const summary = compactForCommit(sanitizeForCommit(await collect()));
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(path.join(outputDir, 'report.html'), renderReport(summary));
console.log(JSON.stringify({ status: summary.status, totals: summary.totals, outputDir }, null, 2));
if (summary.totals.fail > 0) process.exitCode = 1;
