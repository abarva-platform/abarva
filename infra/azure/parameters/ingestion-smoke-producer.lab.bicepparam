using '../ingestion-worker-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'synthetic-smoke-only'
  purpose: 'enterprise-saas-scale-test'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param ingestionWorkerJobName = 'job-a2b-smoke-send-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:8a3533af71b5fd4a81f919245fc9026b946023c34b6a479a12d113d0e7afaa74'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = 'npx tsx src/scripts/azure-ingestion-e2e-smoke.ts'

param plainRuntimeEnv = [
  {
    name: 'INGESTION_SMOKE_MODE'
    value: 'produce'
  }
  {
    name: 'INGESTION_SMOKE_RUN_ID'
    value: 'azlab22-replace-before-run'
  }
  {
    name: 'INGESTION_SMOKE_TENANT_CLIENT_KEY'
    value: 'meridian-health'
  }
  {
    name: 'INGESTION_SMOKE_STORAGE_ACCOUNT_NAME'
    value: 'stabarvaprivatedplab001'
  }
  {
    name: 'INGESTION_SMOKE_CONTAINER_NAME'
    value: 'context-drops'
  }
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
]

param keyVaultSecretRefs = []
