using '../foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param privateDataplaneResourceGroupName = 'rg-abarva-private-dataplane-lab-eastus'
param observabilityResourceGroupName = 'rg-abarva-observability-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'

param keyVaultName = 'kv-abarva-lab-001'
param keyVaultEnablePurgeProtection = true

param privateDataplaneVnetName = 'vnet-abarva-private-dataplane-lab-eastus'
param privateDataplaneNsgName = 'nsg-abarva-private-dataplane-lab-eastus'
param privateDataplaneAppSubnetName = 'snet-app'
param privateDataplaneDataSubnetName = 'snet-data'
param privateDataplanePeSubnetName = 'snet-private-endpoints'
param privateDataplaneVnetCidr = '10.42.0.0/16'
param privateDataplaneAppSubnetCidr = '10.42.4.0/23'
param privateDataplaneDataSubnetCidr = '10.42.1.0/24'
param privateDataplanePeSubnetCidr = '10.42.2.0/24'
param privateDataplaneStorageAccountName = 'stabarvaprivatedplab001'
param deployStoragePrivateEndpoint = true

param logAnalyticsWorkspaceName = 'log-abarva-observability-lab-eastus'
param applicationInsightsName = 'appi-abarva-observability-lab-eastus'
param actionGroupName = 'ag-abarva-observability-lab-eastus'
param actionGroupShortName = 'abarvaOps'
param actionGroupEmailAddress = 'alerts@abarva.ai'
param logAnalyticsRetentionInDays = 30
param logAnalyticsDailyQuotaGb = 1

param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'
param placeholderContainerAppName = 'ca-abarva-scale-smoke-lab-eastus'
param deployPlaceholderContainerApp = true
param scaleTestMinReplicas = 0
param scaleTestMaxReplicas = 10

param defenderPricingTier = 'Free'

// Set these to concrete built-in/custom policy definition IDs in tenant-specific rollout.
param requireTagsPolicyDefinitionId = ''
param denyPublicIpPolicyDefinitionId = ''
param requireDiagnosticsPolicyDefinitionId = ''
