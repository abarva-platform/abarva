targetScope = 'subscription'

@description('Primary region for the registry and budget-supporting metadata.')
param location string = 'eastus'

@description('Standard tags applied to deployed resources.')
param tags object

@description('Existing control plane resource group name.')
param controlPlaneResourceGroupName string

@description('Existing runtime managed identity name that Container Apps uses to pull images.')
param scaleRuntimeManagedIdentityName string

@description('Azure Container Registry name.')
param registryName string

@description('ACR SKU. Basic is enough for lab image supply chain validation.')
param registrySku string = 'Basic'

@description('Service principal object IDs allowed to push images.')
param acrPushPrincipalIds array = []

@description('Monthly lab budget amount in the subscription billing currency.')
param monthlyBudgetAmount int = 250

@description('Budget start date in yyyy-mm-dd format. Use the first day of the current month.')
param budgetStartDate string

@description('Budget end date in yyyy-mm-dd format.')
param budgetEndDate string

@description('Budget alert email recipients.')
param budgetContactEmails array = []

resource controlPlaneRg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: controlPlaneResourceGroupName
}

resource scaleRuntimeIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  scope: controlPlaneRg
  name: scaleRuntimeManagedIdentityName
}

module registry './container-registry.bicep' = {
  name: 'azfound-container-registry'
  scope: controlPlaneRg
  params: {
    location: location
    tags: tags
    registryName: registryName
    registrySku: registrySku
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    acrPullPrincipalIds: [
      scaleRuntimeIdentity.properties.principalId
    ]
    acrPushPrincipalIds: acrPushPrincipalIds
  }
}

resource monthlyBudget 'Microsoft.Consumption/budgets@2023-05-01' = {
  name: 'budget-abarva-lab-monthly'
  properties: {
    category: 'Cost'
    amount: monthlyBudgetAmount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: budgetStartDate
      endDate: budgetEndDate
    }
    notifications: {
      Actual_50_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 50
        contactEmails: budgetContactEmails
      }
      Actual_80_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: budgetContactEmails
      }
      Actual_100_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        contactEmails: budgetContactEmails
      }
      Forecasted_100_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Forecasted'
        contactEmails: budgetContactEmails
      }
    }
  }
}

output registryLoginServer string = registry.outputs.registryLoginServer
output registryResourceId string = registry.outputs.registryResourceId
output budgetName string = monthlyBudget.name
