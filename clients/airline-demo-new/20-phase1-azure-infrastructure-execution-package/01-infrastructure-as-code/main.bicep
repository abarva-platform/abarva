targetScope = 'subscription'

param location string = 'eastus2'
param postgresLocation string = 'eastus2'
param tenantId string
param resourceGroupName string
param tags object

@secure()
param postgresAdministratorLoginPassword string

module lab './airdn-lab-foundation.bicep' = {
  name: 'airdn-lab-foundation-plan'
  scope: resourceGroup(resourceGroupName)
  dependsOn: [
    rg
  ]
  params: {
    location: location
    postgresLocation: postgresLocation
    tenantId: tenantId
    tags: tags
    postgresAdministratorLoginPassword: postgresAdministratorLoginPassword
  }
}

module acrPull './airdn-acr-pull.bicep' = {
  name: 'airdn-acr-pull-plan'
  scope: resourceGroup('rg-abarva-controlplane-lab-eastus')
  params: {
    principalIds: [
      lab.outputs.ingestPrincipalId
      lab.outputs.reviewPrincipalId
      lab.outputs.publishPrincipalId
      lab.outputs.readPrincipalId
      lab.outputs.evaluatorPrincipalId
      lab.outputs.adminPrincipalId
    ]
  }
}

module jobs './airdn-lab-jobs.bicep' = {
  name: 'airdn-lab-jobs-plan'
  scope: resourceGroup(resourceGroupName)
  dependsOn: [
    acrPull
  ]
  params: {
    location: location
    tags: tags
    containerAppsEnvironmentId: lab.outputs.containerAppsEnvironmentId
    operationalStorageAccountName: lab.outputs.operationalStorageAccountName
    evaluatorStorageAccountName: lab.outputs.evaluatorStorageAccountName
    postgresAdministratorLoginPassword: postgresAdministratorLoginPassword
    identityIds: {
      ingest: lab.outputs.ingestIdentityId
      review: lab.outputs.reviewIdentityId
      publish: lab.outputs.publishIdentityId
      read: lab.outputs.readIdentityId
      evaluator: lab.outputs.evaluatorIdentityId
      admin: lab.outputs.adminIdentityId
    }
    identityClientIds: {
      ingest: lab.outputs.ingestClientId
      review: lab.outputs.reviewClientId
      publish: lab.outputs.publishClientId
      read: lab.outputs.readClientId
      evaluator: lab.outputs.evaluatorClientId
      admin: lab.outputs.adminClientId
    }
  }
}

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}
