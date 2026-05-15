targetScope = 'resourceGroup'

param location string
param tags object

@description('Existing Container Apps managed environment name.')
param containerAppsEnvironmentName string

@description('Existing user-assigned managed identity name for image pulls, Key Vault, Service Bus, Blob Storage, and Postgres secret access.')
param managedIdentityName string

@description('Container Apps Job name for the context ingestion worker.')
param ingestionWorkerJobName string

@description('Full image name, including registry, repository, and tag.')
param imageName string

@description('ACR login server, e.g. acrabarvalab001.azurecr.io.')
param registryServer string

@description('Non-secret runtime environment variables projected directly into the worker.')
param plainRuntimeEnv array = []

@description('Key Vault-backed secret references projected into the worker. Each object requires envName, containerAppSecretName, and keyVaultSecretUri.')
param keyVaultSecretRefs array = []

@description('Command run by the worker container.')
param workerCommand string = 'npx tsx src/scripts/azure-context-ingestion-worker.ts'

@description('CPU allocated to the worker container.')
param cpu string = '0.5'

@description('Memory allocated to the worker container.')
param memory string = '1Gi'

@description('Maximum time in seconds for one worker execution.')
param replicaTimeout int = 1800

@description('Retry limit for failed executions.')
param replicaRetryLimit int = 1

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

resource ingestionWorkerJob 'Microsoft.App/jobs@2024-03-01' = {
  name: ingestionWorkerJobName
  location: location
  tags: union(tags, {
    purpose: 'abarva-context-ingestion-worker'
  })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnvironment.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: replicaTimeout
      replicaRetryLimit: replicaRetryLimit
      manualTriggerConfig: {
        parallelism: 1
        replicaCompletionCount: 1
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
          name: 'context-ingestion-worker'
          image: imageName
          command: [
            '/bin/sh'
          ]
          args: [
            '-lc'
            workerCommand
          ]
          env: concat(plainRuntimeEnv, keyVaultRuntimeEnv)
          resources: {
            cpu: json(cpu)
            memory: memory
          }
        }
      ]
    }
  }
}

output ingestionWorkerJobName string = ingestionWorkerJob.name
output imageName string = imageName
