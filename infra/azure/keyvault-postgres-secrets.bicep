targetScope = 'resourceGroup'

param keyVaultName string
param postgresAdminLoginSecretName string
param postgresAdminPasswordSecretName string
param postgresServerNameSecretName string
param postgresFqdnSecretName string
param administratorLogin string
@secure()
param administratorLoginPassword string
param serverName string
param fullyQualifiedDomainName string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource postgresAdminLoginSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: postgresAdminLoginSecretName
  properties: {
    value: administratorLogin
    contentType: 'text/plain'
  }
}

resource postgresAdminPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: postgresAdminPasswordSecretName
  properties: {
    value: administratorLoginPassword
    contentType: 'text/plain'
  }
}

resource postgresServerNameSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: postgresServerNameSecretName
  properties: {
    value: serverName
    contentType: 'text/plain'
  }
}

resource postgresFqdnSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: postgresFqdnSecretName
  properties: {
    value: fullyQualifiedDomainName
    contentType: 'text/plain'
  }
}
