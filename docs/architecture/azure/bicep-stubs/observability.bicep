// AbarVa Azure Lab — Observability Resources
// Slice ID: AZLAB6
// Status: STUB ONLY — not deployable without Azure credentials
// Authored: 2026-04-26
//
// Deploys into: rg-abarva-lab-observability
// Provisions: Log Analytics Workspace, Application Insights

targetScope = 'resourceGroup'

param env string = 'lab'
param location string = 'eastus2'
param project string = 'abarva'

// --- Log Analytics Workspace ---

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${project}-${env}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30  // 30 days for lab; 90 days for production
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'shared'
    costCentre: 'rd-lab'
  }
}

// --- Application Insights ---

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${project}-${env}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    RetentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
  tags: {
    env: env
    project: '${project}-azlab1'
    plane: 'shared'
    costCentre: 'rd-lab'
  }
}

// --- Outputs ---

output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name
output appInsightsName string = appInsights.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
