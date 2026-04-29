targetScope = 'resourceGroup'

param subscriptionId string
param location string
param logAnalyticsWorkspaceName string
param applicationInsightsName string
param actionGroupName string
param actionGroupShortName string
param actionGroupEmailAddress string
param retentionInDays int = 30
param dailyQuotaGb int = 1
param tags object

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    workspaceCapping: {
      dailyQuotaGb: dailyQuotaGb
    }
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    RetentionInDays: retentionInDays
    IngestionMode: 'LogAnalytics'
  }
}

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    groupShortName: actionGroupShortName
    emailReceivers: [
      {
        name: 'platform-email'
        emailAddress: actionGroupEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

resource failedDeploymentAlert 'Microsoft.Insights/activityLogAlerts@2020-10-01' = {
  name: 'ala-subscription-deployment-failures'
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    description: 'Alerts on failed ARM/Bicep deployments in the subscription.'
    scopes: [
      '/subscriptions/${subscriptionId}'
    ]
    condition: {
      allOf: [
        {
          field: 'category'
          equals: 'Administrative'
        }
        {
          field: 'operationName'
          equals: 'Microsoft.Resources/deployments/write'
        }
        {
          field: 'status'
          equals: 'Failed'
        }
      ]
    }
    actions: {
      actionGroups: [
        {
          actionGroupId: actionGroup.id
        }
      ]
    }
  }
}

output logAnalyticsWorkspaceResourceId string = logAnalyticsWorkspace.id
output applicationInsightsConnectionString string = appInsights.properties.ConnectionString
