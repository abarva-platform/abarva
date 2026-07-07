using '../product-dev-runtime-foundation.bicep'

param location = 'eastus'

param tags = {
  Environment: 'Product Dev'
  EnvironmentKey: 'product-dev'
  Plane: 'control-plane'
  Owner: 'AbarVa Platform'
  CostCenter: 'product-development'
  DataClassification: 'synthetic'
  ClientCode: 'abarva'
  ManagedBy: 'manual-approved'
  Repository: 'abarva-platform/abarva'
  ReleaseLane: 'global-control-lane'
  Criticality: 'medium'
  CreatedBy: 'codex'
  CreatedAt: '2026-06-15T01:59:22Z'
  Expiry: '2026-09-30'
  NoPhiPii: 'true'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-product-dev-eus-001'
param observabilityResourceGroupName = 'rg-abarva-observability-product-dev-eus-001'
param logAnalyticsWorkspaceName = 'log-abarva-product-dev-eus-001'
param applicationInsightsName = 'appi-abarva-product-dev-eus-001'
param actionGroupName = 'ag-abarva-product-dev-eus-001'
param actionGroupShortName = 'pddevops'
param actionGroupEmailAddress = 'alerts@abarva.ai'
param logAnalyticsRetentionInDays = 30
param logAnalyticsDailyQuotaGb = 1
param runtimeManagedIdentityName = 'id-abv-pdev-runtime-eus1'
param containerAppsEnvironmentName = 'cae-abv-pdev-eus1'
param smokeContainerAppName = 'ca-abv-pdev-smoke-eus1'
param deploySmokeApp = true
param smokeMinReplicas = 0
param smokeMaxReplicas = 1
