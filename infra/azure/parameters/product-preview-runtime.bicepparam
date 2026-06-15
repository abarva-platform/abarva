using '../product-dev-runtime-foundation.bicep'

param location = 'eastus'

param tags = {
  Environment: 'Product Preview'
  EnvironmentKey: 'product-preview'
  Plane: 'control-plane'
  Owner: 'AbarVa Platform'
  CostCenter: 'product-development'
  DataClassification: 'synthetic-or-client-approved-redacted'
  ClientCode: 'abarva'
  ManagedBy: 'manual-approved'
  Repository: 'abarva-platform/abarva'
  ReleaseLane: 'global-control-lane'
  Criticality: 'high'
  CreatedBy: 'codex'
  CreatedAt: '2026-06-15T03:32:00Z'
  ReviewBy: '2026-09-30'
  NoPhiPii: 'true'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-product-preview-eus-001'
param observabilityResourceGroupName = 'rg-abarva-observability-product-preview-eus-001'
param logAnalyticsWorkspaceName = 'log-abarva-product-preview-eus-001'
param applicationInsightsName = 'appi-abarva-product-preview-eus-001'
param actionGroupName = 'ag-abarva-product-preview-eus-001'
param actionGroupShortName = 'pprevops'
param actionGroupEmailAddress = 'alerts@abarva.ai'
param logAnalyticsRetentionInDays = 30
param logAnalyticsDailyQuotaGb = 1
param runtimeManagedIdentityName = 'id-abv-pprev-runtime-eus1'
param containerAppsEnvironmentName = 'cae-abv-pprev-eus1'
param smokeContainerAppName = 'ca-abv-pprev-smoke-eus1'
param deploySmokeApp = true
param smokeMinReplicas = 0
param smokeMaxReplicas = 1
param smokeEnvironmentKey = 'product-preview'
param smokeDataBoundary = 'synthetic-or-client-approved-redacted-no-phi-pii'
