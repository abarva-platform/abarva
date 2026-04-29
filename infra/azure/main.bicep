targetScope = 'subscription'

@description('Subscription ID target for deployment.')
param subscriptionId string

@description('Primary region for lab deployment.')
param location string = 'eastus'

@description('Standard tags applied to all resources.')
param tags object

@description('Control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Private dataplane resource group name.')
param privateDataplaneResourceGroupName string

@description('Observability resource group name.')
param observabilityResourceGroupName string

@description('Shared security resource group name.')
param sharedSecurityResourceGroupName string

@description('Shared Key Vault name.')
param keyVaultName string

@description('Whether purge protection is enabled for Key Vault. Lab baseline is false.')
param keyVaultEnablePurgeProtection bool = false

@description('Control plane identity name.')
param controlPlaneManagedIdentityName string = 'id-abarva-controlplane-lab-eastus'

@description('Control plane app service plan name.')
param controlPlaneAppServicePlanName string = 'asp-abarva-controlplane-lab-eastus'

@description('Control plane web app name.')
param controlPlaneWebAppName string = 'app-abarva-controlplane-lab-eastus'

@description('Control plane API management name. Must be globally unique where required by service constraints.')
param controlPlaneApiManagementName string = 'apim-abarva-controlplane-lab-eastus'

@description('Control plane API management publisher email.')
param controlPlaneApiManagementPublisherEmail string = 'platform@abarva.ai'

@description('Control plane API management publisher name.')
param controlPlaneApiManagementPublisherName string = 'Abarva Platform'

@description('Set true to deploy API Management in the control plane module.')
param deployApiManagement bool = true

@description('Private dataplane VNet name.')
param privateDataplaneVnetName string = 'vnet-abarva-private-dataplane-lab-eastus'

@description('Private dataplane NSG name.')
param privateDataplaneNsgName string = 'nsg-abarva-private-dataplane-lab-eastus'

@description('Private dataplane data subnet name.')
param privateDataplaneDataSubnetName string = 'snet-data'

@description('Private dataplane private-endpoint subnet name.')
param privateDataplanePeSubnetName string = 'snet-private-endpoints'

@description('Private dataplane VNet CIDR.')
param privateDataplaneVnetCidr string = '10.42.0.0/16'

@description('Private dataplane data subnet CIDR.')
param privateDataplaneDataSubnetCidr string = '10.42.1.0/24'

@description('Private dataplane private endpoint subnet CIDR.')
param privateDataplanePeSubnetCidr string = '10.42.2.0/24'

@description('Private dataplane storage account name.')
param privateDataplaneStorageAccountName string = 'stabarvaprivatedplab001'

@description('Set true to deploy storage private endpoint.')
param deployStoragePrivateEndpoint bool = true

@description('Optional Postgres resource ID for private endpoint creation.')
param postgresResourceId string = ''

@description('Log Analytics workspace name.')
param logAnalyticsWorkspaceName string = 'log-abarva-observability-lab-eastus'

@description('Application Insights name.')
param applicationInsightsName string = 'appi-abarva-observability-lab-eastus'

@description('Action group name.')
param actionGroupName string = 'ag-abarva-observability-lab-eastus'

@description('Action group short name (max 12 chars).')
param actionGroupShortName string = 'abarvaOps'

@description('Alert notification email for action group.')
param actionGroupEmailAddress string = 'alerts@abarva.ai'

@description('Log Analytics retention in days for lab.')
param logAnalyticsRetentionInDays int = 30

@description('Log Analytics daily quota in GB for lab guardrails.')
param logAnalyticsDailyQuotaGb int = 1

@description('Assign built-in policy definition ID for required tags. Empty disables assignment.')
param requireTagsPolicyDefinitionId string = ''

@description('Assign built-in policy definition ID for denying public IPs in data plane. Empty disables assignment.')
param denyPublicIpPolicyDefinitionId string = ''

@description('Assign built-in policy definition ID for requiring diagnostic settings. Empty disables assignment.')
param requireDiagnosticsPolicyDefinitionId string = ''

@description('Defender pricing baseline for lab. Use Free for lab and Standard for production.')
@allowed([
  'Free'
  'Standard'
])
param defenderPricingTier string = 'Free'

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: controlPlaneResourceGroupName
  location: location
  tags: tags
}

resource privateDataplaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: privateDataplaneResourceGroupName
  location: location
  tags: tags
}

resource observabilityRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: observabilityResourceGroupName
  location: location
  tags: tags
}

resource sharedSecurityRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: sharedSecurityResourceGroupName
  location: location
  tags: tags
}

module sharedSecurityBootstrap './shared-security.bicep' = {
  name: 'azfound-shared-security'
  scope: sharedSecurityRg
  params: {
    location: location
    keyVaultName: keyVaultName
    tags: tags
    enablePurgeProtection: keyVaultEnablePurgeProtection
  }
}

module controlPlane './control-plane.bicep' = {
  name: 'azfound-control-plane'
  scope: controlPlaneRg
  params: {
    location: location
    keyVaultName: keyVaultName
    managedIdentityName: controlPlaneManagedIdentityName
    appServicePlanName: controlPlaneAppServicePlanName
    webAppName: controlPlaneWebAppName
    apiManagementName: controlPlaneApiManagementName
    apiManagementPublisherEmail: controlPlaneApiManagementPublisherEmail
    apiManagementPublisherName: controlPlaneApiManagementPublisherName
    deployApiManagement: deployApiManagement
    tags: tags
  }
  dependsOn: [
    sharedSecurityBootstrap
  ]
}

module sharedSecurityRbac './shared-security.bicep' = {
  name: 'azfound-shared-security-rbac'
  scope: sharedSecurityRg
  params: {
    location: location
    keyVaultName: keyVaultName
    tags: tags
    enablePurgeProtection: keyVaultEnablePurgeProtection
    keyVaultReaderPrincipalId: controlPlane.outputs.managedIdentityPrincipalId
  }
}

module privateDataplane './private-dataplane.bicep' = {
  name: 'azfound-private-dataplane'
  scope: privateDataplaneRg
  params: {
    location: location
    vnetName: privateDataplaneVnetName
    nsgName: privateDataplaneNsgName
    dataSubnetName: privateDataplaneDataSubnetName
    privateEndpointSubnetName: privateDataplanePeSubnetName
    vnetCidr: privateDataplaneVnetCidr
    dataSubnetCidr: privateDataplaneDataSubnetCidr
    privateEndpointSubnetCidr: privateDataplanePeSubnetCidr
    storageAccountName: privateDataplaneStorageAccountName
    keyVaultResourceId: sharedSecurityBootstrap.outputs.keyVaultResourceId
    postgresResourceId: postgresResourceId
    controlPlanePrincipalIds: [
      controlPlane.outputs.managedIdentityPrincipalId
    ]
    deployStoragePrivateEndpoint: deployStoragePrivateEndpoint
    tags: tags
  }
}

module observability './observability.bicep' = {
  name: 'azfound-observability'
  scope: observabilityRg
  params: {
    subscriptionId: subscriptionId
    location: location
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    applicationInsightsName: applicationInsightsName
    actionGroupName: actionGroupName
    actionGroupShortName: actionGroupShortName
    actionGroupEmailAddress: actionGroupEmailAddress
    retentionInDays: logAnalyticsRetentionInDays
    dailyQuotaGb: logAnalyticsDailyQuotaGb
    tags: tags
  }
}

resource requireTagsPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = if (!empty(requireTagsPolicyDefinitionId)) {
  name: 'azfound-require-tags'
  properties: {
    displayName: 'AZFOUND Require Standard Tags'
    policyDefinitionId: requireTagsPolicyDefinitionId
    enforcementMode: 'Default'
  }
}

resource denyPublicIpPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = if (!empty(denyPublicIpPolicyDefinitionId)) {
  name: 'azfound-deny-public-ip-dataplane'
  properties: {
    displayName: 'AZFOUND Deny Public IP In Dataplane'
    policyDefinitionId: denyPublicIpPolicyDefinitionId
    enforcementMode: 'Default'
  }
}

resource requireDiagnosticsPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = if (!empty(requireDiagnosticsPolicyDefinitionId)) {
  name: 'azfound-require-diagnostics'
  properties: {
    displayName: 'AZFOUND Require Diagnostic Settings'
    policyDefinitionId: requireDiagnosticsPolicyDefinitionId
    enforcementMode: 'Default'
  }
}

resource defenderPricing 'Microsoft.Security/pricings@2024-01-01' = [for planName in [
  'VirtualMachines'
  'AppServices'
  'StorageAccounts'
  'KeyVaults'
]: {
  name: planName
  properties: {
    pricingTier: defenderPricingTier
  }
}]

output controlPlaneManagedIdentityPrincipalId string = controlPlane.outputs.managedIdentityPrincipalId
output sharedKeyVaultResourceId string = sharedSecurityBootstrap.outputs.keyVaultResourceId
output observabilityWorkspaceResourceId string = observability.outputs.logAnalyticsWorkspaceResourceId
