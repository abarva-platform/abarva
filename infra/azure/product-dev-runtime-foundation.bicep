targetScope = 'subscription'

param location string = 'eastus'
param tags object

@description('Product Dev control-plane resource group.')
param controlPlaneResourceGroupName string = 'rg-abarva-controlplane-product-dev-eus-001'

@description('Product Dev observability resource group.')
param observabilityResourceGroupName string = 'rg-abarva-observability-product-dev-eus-001'

@description('Product Dev Log Analytics workspace.')
param logAnalyticsWorkspaceName string = 'log-abarva-product-dev-eus-001'

@description('Product Dev Application Insights component.')
param applicationInsightsName string = 'appi-abarva-product-dev-eus-001'

@description('Product Dev action group for platform alerts.')
param actionGroupName string = 'ag-abarva-product-dev-eus-001'

@description('Action group short name, max 12 chars.')
param actionGroupShortName string = 'pddevops'

@description('Primary alert email.')
param actionGroupEmailAddress string = 'alerts@abarva.ai'

@description('Log Analytics retention in days.')
param logAnalyticsRetentionInDays int = 30

@description('Low daily cap for Product Dev spend control.')
param logAnalyticsDailyQuotaGb int = 1

@description('Product Dev runtime managed identity.')
param runtimeManagedIdentityName string = 'id-abarva-product-dev-runtime-eus-001'

@description('Product Dev Container Apps managed environment.')
param containerAppsEnvironmentName string = 'cae-abarva-product-dev-eus-001'

@description('Scale-to-zero smoke app. This is not the production AbarVa app.')
param smokeContainerAppName string = 'ca-abarva-product-dev-smoke-eus-001'

@description('Whether to deploy the smoke app.')
param deploySmokeApp bool = true

@description('Minimum smoke app replicas. Keep 0 for cost control.')
param smokeMinReplicas int = 0

@description('Maximum smoke app replicas. Keep low for Product Dev cost control.')
param smokeMaxReplicas int = 1

@description('Environment key exposed by the smoke app.')
param smokeEnvironmentKey string = 'product-dev'

@description('Data boundary label exposed by the smoke app.')
param smokeDataBoundary string = 'synthetic-no-client-data'

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: controlPlaneResourceGroupName
  location: location
  tags: tags
}

resource observabilityRg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: observabilityResourceGroupName
  location: location
  tags: tags
}

module observability './observability.bicep' = {
  name: 'product-dev-observability'
  scope: observabilityRg
  params: {
    subscriptionId: subscription().subscriptionId
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

module runtime './product-dev-containerapps-smoke.bicep' = {
  name: 'product-dev-containerapps-smoke'
  scope: controlPlaneRg
  params: {
    location: location
    tags: tags
    logAnalyticsWorkspaceResourceId: observability.outputs.logAnalyticsWorkspaceResourceId
    runtimeManagedIdentityName: runtimeManagedIdentityName
    containerAppsEnvironmentName: containerAppsEnvironmentName
    smokeContainerAppName: smokeContainerAppName
    deploySmokeApp: deploySmokeApp
    smokeMinReplicas: smokeMinReplicas
    smokeMaxReplicas: smokeMaxReplicas
    smokeEnvironmentKey: smokeEnvironmentKey
    smokeDataBoundary: smokeDataBoundary
  }
}

output controlPlaneResourceGroupName string = controlPlaneRg.name
output observabilityResourceGroupName string = observabilityRg.name
output logAnalyticsWorkspaceResourceId string = observability.outputs.logAnalyticsWorkspaceResourceId
output applicationInsightsName string = applicationInsightsName
output runtimeManagedIdentityPrincipalId string = runtime.outputs.runtimeManagedIdentityPrincipalId
output containerAppsEnvironmentName string = runtime.outputs.containerAppsEnvironmentName
output smokeContainerAppName string = runtime.outputs.smokeContainerAppName
output smokeContainerAppFqdn string = runtime.outputs.smokeContainerAppFqdn
