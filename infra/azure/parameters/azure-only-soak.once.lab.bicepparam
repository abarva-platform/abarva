using '../ingestion-worker-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'synthetic-smoke-only'
  purpose: 'azure-only-runtime-retrieval-soak'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param ingestionWorkerJobName = 'job-a24-azure-soak-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = '''
npx tsx src/scripts/azure-cutover-runtime-smoke.ts --tenant-key lakeshore-holdings
npx tsx src/scripts/azure-search-retriever-smoke.ts --require-results --tenant apex-retail --tenant meridian-health --tenant first-capital --tenant lakeshore-holdings --tenant skyharbor-air --tenant northstar-clinical "treasury modernization Kyriba bank connectivity ERP feed quality"
'''

param plainRuntimeEnv = [
  {
    name: 'AZURE_SEARCH_SERVICE_NAME'
    value: 'srch-abarva-context-lab-eastus'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: '3b6e0c9d-2265-499f-af46-965e0ad78b95'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
]
