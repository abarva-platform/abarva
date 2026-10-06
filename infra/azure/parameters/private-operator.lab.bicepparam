using '../database-migration-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'private-plane-operator'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param migrationJobName = 'job-abarva-private-operator-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:ce60321e5adff81773a2121d1cde5d77599597a0ff485cfe6aa0e69b9e8dc14d'
param registryServer = 'acrabarvalab001.azurecr.io'
param replicaTimeout = 1800
param workloadProfileName = 'Consumption'

param preservedManagedIdentities = {
  '/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-airdn-lab-eus2-001/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-airdn-admin-lab-001': {}
  '/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-foundation-v2-golden-slice-reader-lab-001': {}
  '/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-foundation-v2-golden-slice-writer-lab-001': {}
  '/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-foundation-v2-healthcare-gs-reader-lab-001': {}
  '/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-foundation-v2-healthcare-gs-writer-lab-001': {}
}

param additionalEnvironmentBindings = [
  {
    envName: 'ABARVA_AZURE_DATABASE_URL'
    secretRef: 'azure-postgres-control-database-url'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
  {
    envName: 'ABARVA_PRIVATE_BROWSER_PROOF_TOKEN'
    containerAppSecretName: 'parallel-run-token'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/parallel-run-invariant-token'
  }
]

param migrationCommand = 'node -e \'const dns=require("dns").promises; const {Client}=require("pg"); (async()=>{const u=process.env.DATABASE_URL; if(!u) throw new Error("DATABASE_URL missing"); const h=new URL(u).hostname; const lookup=await dns.lookup(h,{all:true}); const c=new Client({connectionString:u,ssl:{rejectUnauthorized:false}}); await c.connect(); const r=await c.query("select current_database() as db, current_user as user_name, inet_server_addr()::text as server_addr"); await c.end(); console.log(JSON.stringify({ok:true,kind:"abarva-private-operator-smoke",host:h,lookup,database:r.rows[0]},null,2));})().catch(e=>{console.error(e.stack||e.message); process.exit(1)})\''
