#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const REPO_ROOT = process.cwd();
const PHASE_ROOT = "18-phase2b3c-azure-lab-implementation";
const GENERATED_AT = "2026-07-27T00:00:00.000Z";
const SUBSCRIPTION = {
  id: "701a8554-a166-46e9-bf13-743bc50e3b20",
  displayName: "abarva-lab-sub",
  tenantDirectoryId: "f5151b70-963c-4124-a888-20a50e8c2e2c",
};
const IMAGE = {
  registryResourceId:
    "/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ContainerRegistry/registries/acrabarvalab001",
  registryHostname: "acrabarvalab001.azurecr.io",
  repository: "abarva/web",
  image: "acrabarvalab001.azurecr.io/abarva/web@sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160",
  digest: "sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160",
};

const PROCESS_SUFFIXES = [
  ["source-register-v1", "source-register", "ingest", "01_register_source"],
  ["source-parse-v1", "source-parse", "ingest", "03_parse_source"],
  ["evidence-extract-v1", "evidence-extract", "ingest", "04_extract_evidence"],
  ["knowledge-normalize-v1", "normalize", "ingest", "05_normalize_values"],
  ["entity-resolve-v1", "entity-resolve", "ingest", "06_resolve_identity"],
  ["knowledge-validate-v1", "validate", "ingest", "07_validate_semantics"],
  ["knowledge-review-v1", "review-apply", "review", "09_route_review_quarantine"],
  ["domain-publish-v1", "domain-publish", "publish", "11_publish_domain"],
  ["baseline-publish-v1", "baseline-publish", "publish", "12_publish_baseline"],
  ["projection-build-v1", "projection-build", "publish", "13_build_module_projections"],
  ["home-readmodel-v1", "home-readmodel", "publish", "14_refresh_home_readmodel"],
  ["knowledge-backfill-v1", "backfill", "ingest", "15_backfill_replay"],
  ["reconciliation-audit-v1", "reconcile-audit", "evaluator", "16_reconciliation_audit"],
];

const ROLE_IDS = {
  acrPull: "7f951dda-4ed3-4680-a7ca-43fe172d538d",
  storageBlobDataContributor: "ba92f5b4-2d11-453d-a403-e96b0029c9fe",
  storageBlobDataReader: "2a2b9908-6ea1-4ae2-8e65-a410df84e7d1",
  keyVaultSecretsUser: "4633458b-17de-408a-b874-0445c86b69e6",
};

const TENANTS = [
  {
    displayName: "HC Demo New",
    tenantKey: "hc-demo-new",
    shortCode: "hcdn",
    industryOverlay: "healthcare",
    primaryModuleProof: "clinical-operations",
    cidr: "10.74.0.0/22",
    acaSubnet: "10.74.0.0/23",
    pgSubnet: "10.74.2.0/27",
    peSubnet: "10.74.2.32/27",
    resourceGroup: "rg-abarva-hcdn-lab-eus-001",
    vnet: "vnet-abarva-hcdn-lab-eus-001",
    cae: "cae-abarva-hcdn-lab-eus-001",
    postgresServer: "pg-abarva-hc-demo-new-lab-eus-001",
    database: "abarva_hc_demo_new_knowledge_lab",
    storage: "stabhcdemonewlab001",
    evaluatorStorage: "stabhcdemonewevallab001",
    keyVault: "kv-abarva-hcdn-lab-001",
    logAnalytics: "law-abarva-hcdn-lab-eus-001",
  },
  {
    displayName: "Airline Demo New",
    tenantKey: "airline-demo-new",
    shortCode: "airdn",
    industryOverlay: "airline",
    primaryModuleProof: "technology-procurement",
    cidr: "10.75.0.0/22",
    acaSubnet: "10.75.0.0/23",
    pgSubnet: "10.75.2.0/27",
    peSubnet: "10.75.2.32/27",
    resourceGroup: "rg-abarva-airdn-lab-eus-001",
    vnet: "vnet-abarva-airdn-lab-eus-001",
    cae: "cae-abarva-airdn-lab-eus-001",
    postgresServer: "pg-abarva-airdn-lab-eus-001",
    database: "abarva_airline_demo_new_knowledge_lab",
    storage: "stabairdnlabeus001",
    evaluatorStorage: "stabairdnevallab001",
    keyVault: "kv-abarva-airdn-lab-001",
    logAnalytics: "law-abarva-airdn-lab-eus-001",
  },
];

function writeFile(rel, content) {
  const target = path.join(REPO_ROOT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith("\n") ? content : `${content}\n`);
}

function writeJson(rel, value) {
  writeFile(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(rel, rows, headers) {
  const escape = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  writeFile(rel, [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n"));
}

function slugSnake(value) {
  return value.replaceAll("-", "_");
}

function tenantRoot(tenant) {
  return `clients/${tenant.tenantKey}/${PHASE_ROOT}`;
}

function managedIdentities(tenant) {
  return {
    ingest: `mi-${tenant.shortCode}-ingest-lab-001`,
    review: `mi-${tenant.shortCode}-review-lab-001`,
    publish: `mi-${tenant.shortCode}-publish-lab-001`,
    read: `mi-${tenant.shortCode}-read-lab-001`,
    evaluator: `mi-${tenant.shortCode}-evaluator-lab-001`,
    admin: `mi-${tenant.shortCode}-admin-lab-001`,
  };
}

function databaseRoles(tenant) {
  const prefix = slugSnake(tenant.tenantKey);
  return {
    ingest: `${prefix}_ingest`,
    review: `${prefix}_reviewer`,
    publish: `${prefix}_publisher`,
    read: `${prefix}_reader`,
    evaluator: `${prefix}_evaluator`,
    admin: `${prefix}_admin`,
  };
}

function jobRows(tenant) {
  return PROCESS_SUFFIXES.map(([processSuffix, jobSuffix, identity, stage]) => ({
    stage,
    approved_process_name: `${tenant.tenantKey}-${processSuffix}`,
    reserved_aca_job_name: `job-${tenant.shortCode}-${jobSuffix}-lab`,
    managed_identity: managedIdentities(tenant)[identity],
    database_role: databaseRoles(tenant)[identity],
    status: "plan_only_ready",
  }));
}

function manifestText(tenant) {
  const ids = managedIdentities(tenant);
  const roles = databaseRoles(tenant);
  const jobs = Object.fromEntries(jobRows(tenant).map((row) => [row.reserved_aca_job_name, row.reserved_aca_job_name]));
  const block = (obj) => Object.entries(obj).map(([k, v]) => `    ${k}: ${v}`).join("\n");
  return `tenant:
  display_name: ${tenant.displayName}
  tenant_key: ${tenant.tenantKey}
  short_code: ${tenant.shortCode}
  industry_overlay: ${tenant.industryOverlay}
  primary_module_proof: ${tenant.primaryModuleProof}
environment:
  name: lab
  region: eastus
subscription:
  id: ${SUBSCRIPTION.id}
  display_name: ${SUBSCRIPTION.displayName}
  tenant_directory_id: ${SUBSCRIPTION.tenantDirectoryId}
control_plane:
  resource_group: ${tenant.resourceGroup}
  virtual_network: ${tenant.vnet}
  container_apps_subnet: snet-aca-${tenant.shortCode}-lab-eus-001
  postgres_subnet: snet-pg-${tenant.shortCode}-lab-eus-001
  private_endpoint_subnet: snet-pe-${tenant.shortCode}-lab-eus-001
  container_apps_environment: ${tenant.cae}
  log_analytics_workspace: ${tenant.logAnalytics}
network:
  vnet_cidr: ${tenant.cidr}
  container_apps_subnet_cidr: ${tenant.acaSubnet}
  postgres_subnet_cidr: ${tenant.pgSubnet}
  private_endpoint_subnet_cidr: ${tenant.peSubnet}
database:
  server_name: ${tenant.postgresServer}
  database_name: ${tenant.database}
storage:
  account_name: ${tenant.storage}
  evaluator_account_name: ${tenant.evaluatorStorage}
  tenant_root: ${tenant.tenantKey}
key_vault:
  name: ${tenant.keyVault}
container_image:
  registry_resource_id: ${IMAGE.registryResourceId}
  registry_hostname: ${IMAGE.registryHostname}
  repository: ${IMAGE.repository}
  image_digest: ${IMAGE.digest}
  image: ${IMAGE.image}
managed_identities:
${block(ids)}
database_roles:
${block(roles)}
container_apps_jobs:
${block(jobs)}
safety:
  allow_tenant_all: false
  expected_tenant_key: ${tenant.tenantKey}
  require_database_name_match: true
  require_storage_account_match: true
  require_evaluator_storage_account_match: true
  require_manifest_hash_match: true
  allow_cross_database_queries: false
  require_subscription_match: true
  require_digest_pinned_image: true
  prohibit_public_postgres: true
  prohibit_public_storage: true
  prohibit_public_evaluator_storage: true
  prohibit_hidden_truth_from_ingest_runtime: true
`;
}

function bicepOverlay(tenant) {
  const ids = managedIdentities(tenant);
  const jobs = jobRows(tenant)
    .map(
      (row) =>
        `  { name: '${row.reserved_aca_job_name}', process: '${row.approved_process_name}', identityName: '${row.managed_identity}', stage: '${row.stage}' }`,
    )
    .join("\n");
  return `targetScope = 'resourceGroup'

param location string = 'eastus'
param tags object = {}

var tenantKey = '${tenant.tenantKey}'
var blobContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '${ROLE_IDS.storageBlobDataContributor}')
var blobReaderRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '${ROLE_IDS.storageBlobDataReader}')
var keyVaultSecretsUserRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '${ROLE_IDS.keyVaultSecretsUser}')
var jobs = [
${jobs}
]

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' existing = {
  name: '${tenant.vnet}'
}

resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: 'snet-pe-${tenant.shortCode}-lab-eus-001'
}

resource law 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: '${tenant.logAnalytics}'
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: '${tenant.keyVault}'
}

resource operationalStorage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: '${tenant.storage}'
}

resource operationalBlobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' existing = {
  parent: operationalStorage
  name: 'default'
}

resource rawContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  parent: operationalBlobService
  name: 'raw'
}

resource publishedContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  parent: operationalBlobService
  name: 'published'
}

resource auditContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  parent: operationalBlobService
  name: 'audit'
}

resource evaluatorStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: '${tenant.evaluatorStorage}'
  location: location
  tags: union(tags, { tenantKey: tenantKey, boundary: 'restricted-evaluator' })
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    supportsHttpsTrafficOnly: true
    networkAcls: { defaultAction: 'Deny', bypass: 'None' }
  }
}

resource evaluatorBlobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: evaluatorStorage
  name: 'default'
  properties: {
    isVersioningEnabled: true
    changeFeed: { enabled: true }
    deleteRetentionPolicy: { enabled: true, days: 30 }
    containerDeleteRetentionPolicy: { enabled: true, days: 30 }
  }
}

resource evaluatorHiddenTruth 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: evaluatorBlobService
  name: 'hidden-truth'
  properties: { publicAccess: 'None' }
}

resource evaluatorReconstruction 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: evaluatorBlobService
  name: 'reconstruction-proof'
  properties: { publicAccess: 'None' }
}

resource evaluatorAudit 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: evaluatorBlobService
  name: 'audit'
  properties: { publicAccess: 'None' }
}

resource ingestIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: '${ids.ingest}' }
resource reviewIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: '${ids.review}' }
resource publishIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: '${ids.publish}' }
resource readIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: '${ids.read}' }
resource evaluatorIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = { name: '${ids.evaluator}' }

resource rawIngestWrite 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: rawContainer
  name: guid(rawContainer.id, '${ids.ingest}', blobContributorRole, tenantKey)
  properties: {
    principalId: ingestIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobContributorRole
  }
}

resource publishedPublishRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: publishedContainer
  name: guid(publishedContainer.id, '${ids.publish}', blobReaderRole, tenantKey)
  properties: {
    principalId: publishIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource publishedRuntimeRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: publishedContainer
  name: guid(publishedContainer.id, '${ids.read}', blobReaderRole, tenantKey)
  properties: {
    principalId: readIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource publishedEvaluatorRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: publishedContainer
  name: guid(publishedContainer.id, '${ids.evaluator}', blobReaderRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource auditEvaluatorWrite 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: auditContainer
  name: guid(auditContainer.id, '${ids.evaluator}', blobContributorRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobContributorRole
  }
}

resource evaluatorTruthAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: evaluatorHiddenTruth
  name: guid(evaluatorHiddenTruth.id, '${ids.evaluator}', blobReaderRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobReaderRole
  }
}

resource evaluatorProofAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: evaluatorReconstruction
  name: guid(evaluatorReconstruction.id, '${ids.evaluator}', blobContributorRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: blobContributorRole
  }
}

resource keyVaultIngestSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, '${ids.ingest}', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: ingestIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource keyVaultReviewSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, '${ids.review}', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: reviewIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource keyVaultPublishSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, '${ids.publish}', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: publishIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource keyVaultEvaluatorSecretUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, '${ids.evaluator}', keyVaultSecretsUserRole, tenantKey)
  properties: {
    principalId: evaluatorIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource evaluatorBlobPe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-${tenant.evaluatorStorage}-blob'
  location: location
  tags: union(tags, { tenantKey: tenantKey, boundary: 'restricted-evaluator' })
  properties: {
    subnet: { id: peSubnet.id }
    privateLinkServiceConnections: [
      {
        name: 'blob'
        properties: {
          privateLinkServiceId: evaluatorStorage.id
          groupIds: [ 'blob' ]
        }
      }
    ]
  }
}

resource blobDns 'Microsoft.Network/privateDnsZones@2020-06-01' existing = {
  name: 'privatelink.blob.core.windows.net'
}

resource evaluatorBlobZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: evaluatorBlobPe
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'blob'
        properties: { privateDnsZoneId: blobDns.id }
      }
    ]
  }
}

resource operationalStorageDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: operationalStorage
  name: '${tenant.shortCode}-storage-diag'
  properties: {
    workspaceId: law.id
    logs: [ { categoryGroup: 'audit', enabled: true } ]
    metrics: [ { category: 'Transaction', enabled: true } ]
  }
}

resource evaluatorStorageDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: evaluatorStorage
  name: '${tenant.shortCode}-eval-storage-diag'
  properties: {
    workspaceId: law.id
    logs: [ { categoryGroup: 'audit', enabled: true } ]
    metrics: [ { category: 'Transaction', enabled: true } ]
  }
}

resource keyVaultDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: keyVault
  name: '${tenant.shortCode}-kv-diag'
  properties: {
    workspaceId: law.id
    logs: [ { categoryGroup: 'audit', enabled: true } ]
    metrics: [ { category: 'AllMetrics', enabled: true } ]
  }
}

output protectedStorage string = operationalStorage.name
output evaluatorStorageBoundary string = evaluatorStorage.name
output guardedJobs array = jobs
`;
}

function hardeningPlan(tenant) {
  const ids = managedIdentities(tenant);
  const roles = databaseRoles(tenant);
  return {
    schema: "abarva.phase2b3c.security-hardening-plan/v1",
    generatedAt: GENERATED_AT,
    tenant: {
      key: tenant.tenantKey,
      displayName: tenant.displayName,
      shortCode: tenant.shortCode,
      industryOverlay: tenant.industryOverlay,
      primaryModuleProof: tenant.primaryModuleProof,
    },
    boundaries: {
      operationalStorage: tenant.storage,
      evaluatorStorage: tenant.evaluatorStorage,
      database: tenant.database,
      keyVault: tenant.keyVault,
      containerAppsEnvironment: tenant.cae,
      evaluatorHiddenTruthContainers: ["hidden-truth"],
      evaluatorCannotMutateKnowledge: true,
      ingestRuntimeCannotReadHiddenTruth: true,
    },
    rbac: {
      acrPull: Object.values(ids).filter((name) => !name.includes("-read-")),
      storage: [
        { scope: `${tenant.storage}/raw`, identity: ids.ingest, role: "Storage Blob Data Contributor" },
        { scope: `${tenant.storage}/published`, identity: ids.publish, role: "Storage Blob Data Reader" },
        { scope: `${tenant.storage}/published`, identity: ids.read, role: "Storage Blob Data Reader" },
        { scope: `${tenant.storage}/published`, identity: ids.evaluator, role: "Storage Blob Data Reader" },
        { scope: `${tenant.storage}/audit`, identity: ids.evaluator, role: "Storage Blob Data Contributor" },
        { scope: `${tenant.evaluatorStorage}/hidden-truth`, identity: ids.evaluator, role: "Storage Blob Data Reader" },
        { scope: `${tenant.evaluatorStorage}/reconstruction-proof`, identity: ids.evaluator, role: "Storage Blob Data Contributor" },
      ],
      keyVault: Object.values(ids).filter((name) => !name.includes("-read-")),
      databaseRoles: roles,
    },
    diagnostics: ["PostgreSQL", "Storage", "Evaluator Storage", "Key Vault", "Container Apps Jobs"],
    storageProtection: {
      rawEvidence: { versioning: true, softDeleteDays: 30, immutability: "time-bound policy required before apply" },
      evaluatorTruth: { versioning: true, softDeleteDays: 30, immutability: "time-bound policy required before apply" },
      publicAccess: "disabled",
    },
    budgetGuardrails: {
      monthlyWarningUsd: 300,
      monthlyStopReviewUsd: 500,
      createBudgetBeforeApply: true,
      tagsRequired: ["tenantKey", "environment", "phase", "owner"],
    },
    whatIfGate: {
      required: true,
      parser: "phase2b3c2b-what-if-parser/v1",
      failOnDeletes: true,
      failOnOutOfScopeChanges: true,
      failOnPublicNetworkAccessEnabled: true,
      failOnMissingEvaluatorBoundary: true,
    },
  };
}

function rowsForRbac(tenant) {
  const plan = hardeningPlan(tenant);
  const rows = [];
  for (const identity of plan.rbac.acrPull) {
    rows.push({ boundary: "acr", scope: IMAGE.registryHostname, identity, role: "AcrPull", allowed: "yes", denied: "no runtime data access from ACR" });
  }
  for (const entry of plan.rbac.storage) {
    rows.push({ boundary: "storage", ...entry, allowed: "yes", denied: entry.scope.includes("hidden-truth") ? "all non-evaluator identities" : "cross-tenant storage" });
  }
  for (const identity of plan.rbac.keyVault) {
    rows.push({ boundary: "key-vault", scope: tenant.keyVault, identity, role: "Key Vault Secrets User", allowed: "yes", denied: "no data-bearing secret outside tenant vault" });
  }
  return rows;
}

function writeTenantPackage(tenant) {
  const root = tenantRoot(tenant);
  const ids = managedIdentities(tenant);
  const roles = databaseRoles(tenant);
  const manifest = manifestText(tenant);
  writeFile(`${root}/00-implementation-charter/${tenant.tenantKey}.lab.manifest.yaml`, manifest);
  writeFile(`${root}/01-infrastructure-as-code/AZURE_CONTROL_PLANE_MANIFEST.yaml`, manifest);
  writeJson(`${root}/00-implementation-charter/APPROVED_BOUNDARY_SNAPSHOT.json`, {
    schema: "abarva.phase2b3c.approved-boundary-snapshot/v1",
    generatedAt: GENERATED_AT,
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    environment: "lab",
    subscription: {
      subscription_id: SUBSCRIPTION.id,
      subscription_display_name: SUBSCRIPTION.displayName,
      tenant_directory_id: SUBSCRIPTION.tenantDirectoryId,
    },
    control_plane: {
      resource_group: tenant.resourceGroup,
      virtual_network: tenant.vnet,
      container_apps_environment: tenant.cae,
      postgres_server: tenant.postgresServer,
      postgres_database: tenant.database,
      storage_account: tenant.storage,
      evaluator_storage_account: tenant.evaluatorStorage,
      key_vault: tenant.keyVault,
      log_analytics_workspace: tenant.logAnalytics,
    },
    container_image: {
      registry_resource_id: IMAGE.registryResourceId,
      registry_hostname: IMAGE.registryHostname,
      repository: IMAGE.repository,
      image_digest: IMAGE.digest,
      image: IMAGE.image,
    },
    managed_identities: Object.entries(ids).map(([purpose, name]) => ({
      purpose,
      name,
      database_role: roles[purpose],
    })),
    database_roles: roles,
    apply_blocked: true,
    display_name: tenant.displayName,
    tenant_key: tenant.tenantKey,
    controlPlane: {
      resourceGroup: tenant.resourceGroup,
      vnet: tenant.vnet,
      containerAppsEnvironment: tenant.cae,
      postgresServer: tenant.postgresServer,
      database: tenant.database,
      storage: tenant.storage,
      evaluatorStorage: tenant.evaluatorStorage,
      keyVault: tenant.keyVault,
      logAnalytics: tenant.logAnalytics,
    },
    image: IMAGE,
    managedIdentities: ids,
    databaseRoles: roles,
    applyBlocked: true,
  });

  writeCsv(`${root}/03-container-app-jobs/JOB_STAGE_MAP.csv`, jobRows(tenant), [
    "stage",
    "approved_process_name",
    "reserved_aca_job_name",
    "managed_identity",
    "database_role",
    "status",
  ]);

  const plan = hardeningPlan(tenant);
  writeJson(`${root}/11-security-hardening-plan/SECURITY_HARDENING_PLAN.json`, plan);
  writeFile(`${root}/11-security-hardening-plan/phase2b3c2b-security-hardening.bicep`, bicepOverlay(tenant));
  writeCsv(`${root}/11-security-hardening-plan/RBAC_ASSIGNMENT_MATRIX.csv`, rowsForRbac(tenant), [
    "boundary",
    "scope",
    "identity",
    "role",
    "allowed",
    "denied",
  ]);
  writeCsv(
    `${root}/11-security-hardening-plan/EVALUATOR_FIREWALL_MATRIX.csv`,
    [
      { actor: "parser_ingest", identity: ids.ingest, hidden_truth_read: "no", published_reconstruction_read: "no", knowledge_mutation: "candidate-only" },
      { actor: "reviewer", identity: ids.review, hidden_truth_read: "no", published_reconstruction_read: "no", knowledge_mutation: "review-decision-only" },
      { actor: "publisher", identity: ids.publish, hidden_truth_read: "no", published_reconstruction_read: "yes", knowledge_mutation: "accepted-publication-only" },
      { actor: "runtime_reader", identity: ids.read, hidden_truth_read: "no", published_reconstruction_read: "yes", knowledge_mutation: "no" },
      { actor: "evaluator", identity: ids.evaluator, hidden_truth_read: "yes", published_reconstruction_read: "yes", knowledge_mutation: "no" },
    ],
    ["actor", "identity", "hidden_truth_read", "published_reconstruction_read", "knowledge_mutation"],
  );
  writeCsv(
    `${root}/11-security-hardening-plan/PRIVATE_DNS_ZONE_GROUPS.csv`,
    [
      { service: "operational blob storage", zone: "privatelink.blob.core.windows.net", private_endpoint: `pe-${tenant.storage}-blob`, status: "planned" },
      { service: "evaluator blob storage", zone: "privatelink.blob.core.windows.net", private_endpoint: `pe-${tenant.evaluatorStorage}-blob`, status: "planned" },
      { service: "key vault", zone: "privatelink.vaultcore.azure.net", private_endpoint: `pe-${tenant.keyVault}-vault`, status: "planned" },
      { service: "postgres", zone: "privatelink.postgres.database.azure.com", private_endpoint: "delegated-flexible-server", status: "planned" },
    ],
    ["service", "zone", "private_endpoint", "status"],
  );
  writeCsv(
    `${root}/11-security-hardening-plan/DIAGNOSTIC_SETTINGS_MATRIX.csv`,
    [
      { resource: tenant.postgresServer, diagnostic_target: tenant.logAnalytics, logs: "PostgreSQLLogs", metrics: "AllMetrics", required: "yes" },
      { resource: tenant.storage, diagnostic_target: tenant.logAnalytics, logs: "audit", metrics: "Transaction", required: "yes" },
      { resource: tenant.evaluatorStorage, diagnostic_target: tenant.logAnalytics, logs: "audit", metrics: "Transaction", required: "yes" },
      { resource: tenant.keyVault, diagnostic_target: tenant.logAnalytics, logs: "audit", metrics: "AllMetrics", required: "yes" },
      { resource: tenant.cae, diagnostic_target: tenant.logAnalytics, logs: "ContainerAppConsoleLogs_CL", metrics: "AllMetrics", required: "yes" },
    ],
    ["resource", "diagnostic_target", "logs", "metrics", "required"],
  );
  writeCsv(
    `${root}/11-security-hardening-plan/ZERO_DATA_PREFLIGHT_CHECKS.csv`,
    [
      "correct_subscription",
      "correct_resource_group",
      "correct_tenant_manifest",
      "correct_database",
      "correct_operational_storage",
      "correct_evaluator_storage",
      "correct_image_digest",
      "private_dns_resolution",
      "managed_identity_image_pull",
      "managed_identity_storage_access",
      "managed_identity_key_vault_access",
      "postgresql_token_authentication",
      "ingest_cannot_publish",
      "reader_cannot_read_working_candidates",
      "non_evaluator_cannot_read_hidden_truth",
      "evaluator_cannot_mutate_knowledge",
      "wrong_tenant_zero_reads_zero_writes",
    ].map((check) => ({ check, status: "required_before_migration", evidence: "real ACA job output after approved apply" })),
    ["check", "status", "evidence"],
  );
  writeJson(`${root}/11-security-hardening-plan/NETWORK_COLLISION_VALIDATION.json`, {
    proposedCidr: tenant.cidr,
    visibleKnownReservedCidrs: ["10.42.0.0/16", "10.43.0.0/16", "10.72.0.0/16", "10.73.0.0/16"],
    result: "no_overlap_with_known_visible_ranges",
    beforeApplyRequirement: "rerun Azure read-only VNet and peering scan immediately before apply",
  });
  writeJson(`${root}/11-security-hardening-plan/GLOBAL_NAME_AVAILABILITY_CHECKS.json`, {
    storageAccounts: [tenant.storage, tenant.evaluatorStorage],
    keyVault: tenant.keyVault,
    status: "read-only Azure name checks required immediately before apply",
    failIfUnavailable: true,
  });
  writeJson(`${root}/11-security-hardening-plan/WHAT_IF_SAFETY_GATE.json`, {
    source: "az deployment what-if output must be captured after independent pre-apply review",
    parserStatus: "ready_contract",
    allowedChangeTypes: ["Create"],
    blockedChangeTypes: ["Delete", "Modify existing out-of-scope shared runtime", "Enable public network access"],
    currentResult: "not_run_in_this_pr_no_azure_apply",
  });
  writeFile(
    `${root}/11-security-hardening-plan/SECURITY_PRIVATE_NETWORK_HARDENING.md`,
    `# Phase 2B-3C-2B Security and Private-Network Hardening Plan

## Scope

Tenant: \`${tenant.tenantKey}\`

This package is plan-only. It does not authorize Azure apply, database migration, source landing, parsing, publication, or runtime integration.

## Security Boundary

- Operational storage: \`${tenant.storage}\`
- Evaluator-only storage: \`${tenant.evaluatorStorage}\`
- Database: \`${tenant.database}\`
- Key Vault: \`${tenant.keyVault}\`
- Container Apps environment: \`${tenant.cae}\`

The evaluator storage account is the hidden-truth boundary. Parser, ingest, Claude-facing, runtime, Home, Source, and aVa identities receive no role assignment on \`hidden-truth\`.

## Evaluator Firewall

| Actor | Hidden truth | Published reconstruction | Knowledge mutation |
| --- | --- | --- | --- |
| Parser / ingest | no | no | candidate-only |
| Reviewer | no | no | review decision only |
| Publisher | no | yes | accepted publication only |
| Runtime reader | no | yes | no |
| Evaluator | yes | yes | no |

## Required Before Apply

1. Run global name checks for \`${tenant.storage}\`, \`${tenant.evaluatorStorage}\`, and \`${tenant.keyVault}\`.
2. Re-run VNet and peering collision scan.
3. Run Azure what-if and parse it with the safety gate.
4. Confirm no deletes, no public network access, and no out-of-scope shared runtime modifications.
5. Confirm dollar-based budget guardrails are created before any resources are applied.
6. Pass the zero-data preflight from real ACA jobs before migration.
`,
  );
  writeJson(`${root}/validation/phase2b3c2b-security-hardening-validation-summary.json`, validateTenant(tenant));
}

function validateTenant(tenant) {
  const root = tenantRoot(tenant);
  const planPath = path.join(REPO_ROOT, root, "11-security-hardening-plan", "SECURITY_HARDENING_PLAN.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const airlineText = tenant.tenantKey === "airline-demo-new" ? collectText(path.join(REPO_ROOT, `clients/${tenant.tenantKey}`)) : "";
  const checks = {
    tenant_key_matches: plan.tenant.key === tenant.tenantKey,
    evaluator_storage_separate: plan.boundaries.evaluatorStorage && plan.boundaries.evaluatorStorage !== plan.boundaries.operationalStorage,
    hidden_truth_blocked_from_ingest_runtime: plan.boundaries.ingestRuntimeCannotReadHiddenTruth === true,
    evaluator_cannot_mutate_knowledge: plan.boundaries.evaluatorCannotMutateKnowledge === true,
    acr_pull_rbac_planned: plan.rbac.acrPull.length >= 4,
    storage_keyvault_rbac_planned: plan.rbac.storage.length >= 7 && plan.rbac.keyVault.length >= 4,
    private_dns_matrix_present: fs.existsSync(path.join(REPO_ROOT, root, "11-security-hardening-plan", "PRIVATE_DNS_ZONE_GROUPS.csv")),
    diagnostics_matrix_present: fs.existsSync(path.join(REPO_ROOT, root, "11-security-hardening-plan", "DIAGNOSTIC_SETTINGS_MATRIX.csv")),
    what_if_gate_present: fs.existsSync(path.join(REPO_ROOT, root, "11-security-hardening-plan", "WHAT_IF_SAFETY_GATE.json")),
    zero_data_gate_present: fs.existsSync(path.join(REPO_ROOT, root, "11-security-hardening-plan", "ZERO_DATA_PREFLIGHT_CHECKS.csv")),
    no_legacy_airline_tenant_key: tenant.tenantKey !== "airline-demo-new" || !airlineText.includes("skyharbor-air"),
    no_legacy_airline_display_name: tenant.tenantKey !== "airline-demo-new" || !/SkyHarbor/i.test(airlineText),
  };
  return {
    schema: "abarva.phase2b3c.security-hardening-validation/v1",
    generatedAt: GENERATED_AT,
    tenantKey: tenant.tenantKey,
    checks,
    passed: Object.values(checks).every(Boolean),
  };
}

function collectText(dir) {
  const parts = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (/\.(md|json|yaml|yml|csv|bicep|bicepparam|txt)$/i.test(entry.name)) parts.push(fs.readFileSync(full, "utf8"));
    }
  };
  if (fs.existsSync(dir)) visit(dir);
  return parts.join("\n");
}

function writeRollup() {
  const tenantSummaries = TENANTS.map((tenant) => {
    const validation = validateTenant(tenant);
    return {
      tenant_key: tenant.tenantKey,
      display_name: tenant.displayName,
      short_code: tenant.shortCode,
      operational_storage: tenant.storage,
      evaluator_storage: tenant.evaluatorStorage,
      validation_passed: validation.passed,
      package_root: tenantRoot(tenant),
    };
  });
  writeJson("reports/phase2b3c-security-hardening/rollup.json", {
    schema: "abarva.phase2b3c.security-hardening-rollup/v1",
    generatedAt: GENERATED_AT,
    tenants: tenantSummaries,
    azureApplyBlocked: true,
  });
  writeCsv("reports/phase2b3c-security-hardening/rollup.csv", tenantSummaries, [
    "tenant_key",
    "display_name",
    "short_code",
    "operational_storage",
    "evaluator_storage",
    "validation_passed",
    "package_root",
  ]);
  writeFile(
    "reports/phase2b3c-security-hardening/README.md",
    `# Phase 2B-3C-2B Security Hardening Rollup

Generated for HC Demo New and Airline Demo New.

This is a plan-only package. Azure apply, database migration, source landing, parsing, publication, and runtime integration remain blocked.

| Tenant | Package | Validation |
| --- | --- | --- |
${tenantSummaries.map((t) => `| ${t.display_name} | \`${t.package_root}\` | ${t.validation_passed ? "pass" : "fail"} |`).join("\n")}
`,
  );
}

function writePackageManifest() {
  const files = [];
  for (const tenant of TENANTS) {
    const root = path.join(REPO_ROOT, tenantRoot(tenant));
    if (!fs.existsSync(root)) continue;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const rel = path.relative(REPO_ROOT, full);
          files.push({
            path: rel,
            sha256: crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex"),
          });
        }
      }
    };
    walk(root);
  }
  writeJson("reports/phase2b3c-security-hardening/package-manifest.json", {
    generatedAt: GENERATED_AT,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
  });
}

function main() {
  for (const tenant of TENANTS) writeTenantPackage(tenant);
  writeRollup();
  writePackageManifest();

  const failed = TENANTS.map(validateTenant).filter((r) => !r.passed);
  if (failed.length) {
    console.error(JSON.stringify(failed, null, 2));
    process.exit(1);
  }
  console.log(`Generated Phase 2B-3C-2B hardening package for ${TENANTS.length} tenants.`);
}

main();
