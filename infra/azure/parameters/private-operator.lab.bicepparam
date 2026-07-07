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
param imageName = 'acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1'
param registryServer = 'acrabarvalab001.azurecr.io'

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
]

param migrationCommand = 'node -e \'const dns=require("dns").promises; const {Client}=require("pg"); (async()=>{const u=process.env.DATABASE_URL; if(!u) throw new Error("DATABASE_URL missing"); const h=new URL(u).hostname; const lookup=await dns.lookup(h,{all:true}); const c=new Client({connectionString:u,ssl:{rejectUnauthorized:false}}); await c.connect(); const r=await c.query("select current_database() as db, current_user as user_name, inet_server_addr()::text as server_addr"); await c.end(); console.log(JSON.stringify({ok:true,kind:"abarva-private-operator-smoke",host:h,lookup,database:r.rows[0]},null,2));})().catch(e=>{console.error(e.stack||e.message); process.exit(1)})\''
