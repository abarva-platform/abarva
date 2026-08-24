using '../app-runtime-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param webContainerAppName = 'ca-abarva-web-lab-eastus'
param webImageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:8a3533af71b5fd4a81f919245fc9026b946023c34b6a479a12d113d0e7afaa74'
param registryServer = 'acrabarvalab001.azurecr.io'
param webMinReplicas = 0
param webMaxReplicas = 2

param plainRuntimeEnv = [
  {
    name: 'NEXT_PUBLIC_DEMO_MODE'
    value: 'true'
  }
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
    value: readEnvironmentVariable('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '')
  }
  {
    name: 'AZURE_SEARCH_SERVICE_NAME'
    value: 'srch-abarva-context-lab-eastus'
  }
  {
    name: 'ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS'
    value: 'meridian-health,skyharbor-air'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: '3b6e0c9d-2265-499f-af46-965e0ad78b95'
  }
  {
    name: 'ABARVA_DATA_PLANE'
    value: 'azure-postgres'
  }
  {
    name: 'DATA_PLANE_OBJECT_STORE_ACCOUNT'
    value: 'stabarvaprivatedplab001'
  }
  {
    name: 'DATA_PLANE_OBJECT_STORE_CONTAINER'
    value: 'context-drops'
  }
  {
    name: 'AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME'
    value: 'q-connectivity-smoke'
  }
  {
    name: 'NEXUS_COMPOSER_MODEL'
    value: readEnvironmentVariable('NEXUS_COMPOSER_MODEL', 'claude-opus-4-7')
  }
  {
    name: 'ABARVA_PRIVATE_BROWSER_PROOF_ENABLED'
    value: '1'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'CLERK_SECRET_KEY'
    containerAppSecretName: 'clerk-secret-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/clerk-secret-key'
  }
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
  {
    envName: 'ANTHROPIC_API_KEY'
    containerAppSecretName: 'anthropic-api-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/anthropic-api-key'
  }
  {
    envName: 'OPENAI_API_KEY'
    containerAppSecretName: 'openai-api-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/openai-api-key'
  }
  {
    envName: 'DEMO_LOGIN_PASSWORD'
    containerAppSecretName: 'demo-login-password'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/demo-login-password'
  }
  {
    envName: 'ABARVA_PRIVATE_BROWSER_PROOF_TOKEN'
    containerAppSecretName: 'parallel-run-token'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/parallel-run-invariant-token'
  }
]
