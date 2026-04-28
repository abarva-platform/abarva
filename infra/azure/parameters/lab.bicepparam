using '../main.bicep'

param subscriptionId = '701a8554-a166-46e9-bf13-743bc50e3b20'
param location = 'eastus'

param tags = {
  environment: 'lab'
  costCenter: 'abarva-lab'
  dataClassification: 'synthetic'
  owner: 'platform-team'
  project: 'abarva'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param privateDataplaneResourceGroupName = 'rg-abarva-private-dataplane-lab-eastus'
param observabilityResourceGroupName = 'rg-abarva-observability-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'

param keyVaultName = 'kv-abarva-lab-001'
param keyVaultEnablePurgeProtection = false

param controlPlaneManagedIdentityName = 'id-abarva-controlplane-lab-eastus'
param controlPlaneAppServicePlanName = 'asp-abarva-controlplane-lab-eastus'
param controlPlaneWebAppName = 'app-abarva-controlplane-lab-eastus'
param controlPlaneApiManagementName = 'apim-abarva-controlplane-lab-eastus'
param deployApiManagement = true

param privateDataplaneVnetName = 'vnet-abarva-private-dataplane-lab-eastus'
param privateDataplaneNsgName = 'nsg-abarva-private-dataplane-lab-eastus'
param privateDataplaneDataSubnetName = 'snet-data'
param privateDataplanePeSubnetName = 'snet-private-endpoints'
param privateDataplaneVnetCidr = '10.42.0.0/16'
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

param defenderPricingTier = 'Free'

// Set these to concrete built-in/custom policy definition IDs in tenant-specific rollout.
param requireTagsPolicyDefinitionId = ''
param denyPublicIpPolicyDefinitionId = ''
param requireDiagnosticsPolicyDefinitionId = ''
