targetScope = 'resourceGroup'

param location string = 'eastus'
param tags object
param logAnalyticsWorkspaceResourceId string
param runtimeManagedIdentityName string
param containerAppsEnvironmentName string
param smokeContainerAppName string
param deploySmokeApp bool = true
param smokeMinReplicas int = 0
param smokeMaxReplicas int = 1
param smokeEnvironmentKey string = 'product-dev'
param smokeDataBoundary string = 'synthetic-no-client-data'

resource runtimeIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: runtimeManagedIdentityName
  location: location
  tags: tags
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppsEnvironmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceResourceId, '2022-10-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceResourceId, '2022-10-01').primarySharedKey
      }
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    zoneRedundant: false
  }
}

resource smokeApp 'Microsoft.App/containerApps@2024-03-01' = if (deploySmokeApp) {
  name: smokeContainerAppName
  location: location
  tags: union(tags, {
    Purpose: '${smokeEnvironmentKey}-runtime-smoke'
    RuntimeDataBoundary: smokeDataBoundary
  })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${runtimeIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
        transport: 'auto'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'smoke'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          env: [
            {
              name: 'ABARVA_ENVIRONMENT_KEY'
              value: smokeEnvironmentKey
            }
            {
              name: 'ABARVA_DATA_BOUNDARY'
              value: smokeDataBoundary
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: smokeMinReplicas
        maxReplicas: smokeMaxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '25'
              }
            }
          }
        ]
      }
    }
  }
}

output runtimeManagedIdentityPrincipalId string = runtimeIdentity.properties.principalId
output containerAppsEnvironmentName string = containerAppsEnvironment.name
output smokeContainerAppName string = deploySmokeApp ? smokeApp!.name : ''
output smokeContainerAppFqdn string = deploySmokeApp ? smokeApp!.properties.configuration.ingress.fqdn : ''
