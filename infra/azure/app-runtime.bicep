targetScope = 'resourceGroup'

param location string
param tags object

@description('Existing Container Apps managed environment name.')
param containerAppsEnvironmentName string

@description('Existing user-assigned managed identity name for image pulls and future runtime access.')
param managedIdentityName string

@description('Container App name for the AbarVa web runtime.')
param containerAppName string

@description('Full image name, including registry, repository, and tag.')
param imageName string

@description('ACR login server, e.g. acrabarvalab001.azurecr.io.')
param registryServer string

@description('Minimum replicas. Keep 0 for lab cost control; HTTP ingress scales from zero for smoke tests.')
param minReplicas int = 0

@description('Maximum replicas for the lab app runtime.')
param maxReplicas int = 2

@description('CPU allocated to the web container.')
param cpu string = '0.5'

@description('Memory allocated to the web container.')
param memory string = '1Gi'

@description('Non-secret runtime environment variables projected directly into the container. Do not put credentials here.')
param plainRuntimeEnv array = []

@description('Key Vault-backed secret references projected into the container as environment variables. Each object requires envName, containerAppSecretName, and keyVaultSecretUri.')
param keyVaultSecretRefs array = []

var staticRuntimeEnv = [
  {
    name: 'NODE_ENV'
    value: 'production'
  }
  {
    name: 'NEXT_TELEMETRY_DISABLED'
    value: '1'
  }
  {
    name: 'PORT'
    value: '3000'
  }
  {
    name: 'HOSTNAME'
    value: '0.0.0.0'
  }
]

var keyVaultRuntimeEnv = [for secretRef in keyVaultSecretRefs: {
  name: secretRef.envName
  secretRef: secretRef.containerAppSecretName
}]

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppsEnvironmentName
}

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: managedIdentityName
}

resource webApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: union(tags, {
    purpose: 'abarva-web-runtime'
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
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: registryServer
          identity: managedIdentity.id
        }
      ]
      secrets: [for secretRef in keyVaultSecretRefs: {
        name: secretRef.containerAppSecretName
        keyVaultUrl: secretRef.keyVaultSecretUri
        identity: managedIdentity.id
      }]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: imageName
          env: concat(staticRuntimeEnv, plainRuntimeEnv, keyVaultRuntimeEnv)
          resources: {
            cpu: json(cpu)
            memory: memory
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
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

output containerAppName string = webApp.name
output containerAppFqdn string = webApp.properties.configuration.ingress.fqdn
output imageName string = imageName
