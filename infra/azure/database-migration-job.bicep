targetScope = 'resourceGroup'

param location string
param tags object

@description('Existing Container Apps managed environment name.')
param containerAppsEnvironmentName string

@description('Existing user-assigned managed identity name for image pulls and Key Vault secret references.')
param managedIdentityName string

@description('Container Apps Job name for Azure Postgres schema migration.')
param migrationJobName string

@description('Full image name, including registry, repository, and tag.')
param imageName string

@description('ACR login server, e.g. acrabarvalab001.azurecr.io.')
param registryServer string

@description('Key Vault-backed secret references projected into the job. Each object requires envName, containerAppSecretName, and keyVaultSecretUri.')
param keyVaultSecretRefs array

@description('Command run by the migration container.')
param migrationCommand string = 'npx tsx src/scripts/bootstrap-azure-postgres-compat.ts && npx tsx src/scripts/run-migrations.ts --ci --allow-destructive'

@description('CPU allocated to the migration container.')
param cpu string = '0.5'

@description('Memory allocated to the migration container.')
param memory string = '1Gi'

@description('Maximum time in seconds for one migration execution.')
param replicaTimeout int = 3600

@description('Retry limit for failed executions. Keep low to avoid repeated destructive-looking attempts.')
param replicaRetryLimit int = 0

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppsEnvironmentName
}

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: managedIdentityName
}

resource migrationJob 'Microsoft.App/jobs@2024-03-01' = {
  name: migrationJobName
  location: location
  tags: union(tags, {
    purpose: 'abarva-azure-postgres-migration'
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
          name: 'db-migrate'
          image: imageName
          command: [
            '/bin/sh'
          ]
          args: [
            '-lc'
            migrationCommand
          ]
          env: [for secretRef in keyVaultSecretRefs: {
            name: secretRef.envName
            secretRef: secretRef.containerAppSecretName
          }]
          resources: {
            cpu: json(cpu)
            memory: memory
          }
        }
      ]
    }
  }
}

output migrationJobName string = migrationJob.name
output imageName string = imageName
