targetScope = 'resourceGroup'

param location string
param tags object
param managedIdentityName string
param containerAppsEnvironmentName string
param placeholderContainerAppName string
param appSubnetResourceId string
param logAnalyticsWorkspaceResourceId string
param deployPlaceholderApp bool = true
param scaleTestMinReplicas int = 0
param scaleTestMaxReplicas int = 10

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
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
    vnetConfiguration: {
      infrastructureSubnetId: appSubnetResourceId
      internal: false
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

resource placeholderContainerApp 'Microsoft.App/containerApps@2024-03-01' = if (deployPlaceholderApp) {
  name: placeholderContainerAppName
  location: location
  tags: union(tags, {
    purpose: 'scale-test-placeholder'
  })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
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
      }
    }
    template: {
      containers: [
        {
          name: 'app'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: scaleTestMinReplicas
        maxReplicas: scaleTestMaxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output managedIdentityResourceId string = managedIdentity.id
output containerAppsEnvironmentResourceId string = containerAppsEnvironment.id
output placeholderContainerAppFqdn string = deployPlaceholderApp ? placeholderContainerApp!.properties.configuration.ingress.fqdn : ''
