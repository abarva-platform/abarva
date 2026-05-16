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
param webImageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-parallel-run-20260515-r1'
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
    name: 'NEXT_PUBLIC_SUPABASE_URL'
    value: readEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL', '')
  }
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    value: readEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
  }
  {
    name: 'PINECONE_INDEX'
    value: readEnvironmentVariable('PINECONE_INDEX', 'nexus-knowledge')
  }
  {
    name: 'AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME'
    value: 'q-connectivity-smoke'
  }
  {
    name: 'NEXUS_COMPOSER_MODEL'
    value: readEnvironmentVariable('NEXUS_COMPOSER_MODEL', 'claude-opus-4-7')
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'CLERK_SECRET_KEY'
    containerAppSecretName: 'clerk-secret-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/clerk-secret-key'
  }
  {
    envName: 'SUPABASE_SERVICE_ROLE_KEY'
    containerAppSecretName: 'supabase-service-role-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/supabase-service-role-key'
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
    envName: 'PINECONE_API_KEY'
    containerAppSecretName: 'pinecone-api-key'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/pinecone-api-key'
  }
  {
    envName: 'NEO4J_URI'
    containerAppSecretName: 'neo4j-uri'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/neo4j-uri'
  }
  {
    envName: 'NEO4J_USERNAME'
    containerAppSecretName: 'neo4j-username'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/neo4j-username'
  }
  {
    envName: 'NEO4J_PASSWORD'
    containerAppSecretName: 'neo4j-password'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/neo4j-password'
  }
  {
    envName: 'DEMO_LOGIN_PASSWORD'
    containerAppSecretName: 'demo-login-password'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/demo-login-password'
  }
]
