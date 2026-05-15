using '../ingestion-worker-foundation.bicep'

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

param ingestionWorkerJobName = 'job-a2b-ingest-lab-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:lab-ingestion-worker-20260515-r2'
param registryServer = 'acrabarvalab001.azurecr.io'

param plainRuntimeEnv = [
  {
    name: 'SERVICE_BUS_NAMESPACE'
    value: 'sb-abarva-lab-eastus'
  }
  {
    name: 'SERVICE_BUS_QUEUE_NAME'
    value: 'q-context-ingestion-events'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: '3b6e0c9d-2265-499f-af46-965e0ad78b95'
  }
  {
    name: 'INGESTION_WORKER_MAX_MESSAGES'
    value: '10'
  }
  {
    name: 'INGESTION_WORKER_MAX_WAIT_MS'
    value: '5000'
  }
  {
    name: 'INGESTION_PIPELINE_MODE'
    value: 'audit_only'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
]
