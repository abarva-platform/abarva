targetScope = 'resourceGroup'

param location string
param tags object
param containerAppsEnvironmentId string
param operationalStorageAccountName string
param evaluatorStorageAccountName string
param identityIds object
param identityClientIds object
param imageName string

var tenantKey = 'airline-demo-new'
var registryServer = 'acrabarvalab001.azurecr.io'
var postgresHost = 'pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com'
var postgresDatabase = 'abarva_airline_demo_new_knowledge_lab'
var imageDigest = contains(imageName, '@') ? split(imageName, '@')[1] : ''
var identityDatabaseUsers = {
  admin: 'mi-airdn-admin-lab-001'
  ingest: 'mi-airdn-ingest-lab-001'
  review: 'mi-airdn-review-lab-001'
  publish: 'mi-airdn-publish-lab-001'
  read: 'mi-airdn-read-lab-001'
  evaluator: 'mi-airdn-evaluator-lab-001'
}
var jobs = [
  { name: 'job-airdn-backfill-lab', process: 'airline-demo-new-knowledge-backfill-v1', identityKey: 'ingest', stage: '15_backfill_replay' }
  { name: 'job-airdn-baseline-publish-lab', process: 'airline-demo-new-baseline-publish-v1', identityKey: 'publish', stage: '12_publish_baseline' }
  { name: 'job-airdn-domain-publish-lab', process: 'airline-demo-new-domain-publish-v1', identityKey: 'publish', stage: '11_publish_domain' }
  { name: 'job-airdn-entity-resolve-lab', process: 'airline-demo-new-entity-resolve-v1', identityKey: 'ingest', stage: '06_resolve_identity' }
  { name: 'job-airdn-evidence-extract-lab', process: 'airline-demo-new-evidence-extract-v1', identityKey: 'ingest', stage: '04_extract_evidence' }
  { name: 'job-airdn-home-readmodel-lab', process: 'airline-demo-new-home-readmodel-v1', identityKey: 'publish', stage: '14_refresh_home_readmodel' }
  { name: 'job-airdn-normalize-lab', process: 'airline-demo-new-knowledge-normalize-v1', identityKey: 'ingest', stage: '05_normalize_values' }
  { name: 'job-airdn-projection-build-lab', process: 'airline-demo-new-projection-build-v1', identityKey: 'publish', stage: '13_build_module_projections' }
  { name: 'job-airdn-reconcile-audit-lab', process: 'airline-demo-new-reconciliation-audit-v1', identityKey: 'evaluator', stage: '16_reconciliation_audit' }
  { name: 'job-airdn-metric-parity-lab', process: 'airline-demo-new-metric-parity-v1', identityKey: 'evaluator', stage: '17_cube_metric_parity' }
  { name: 'job-airdn-review-apply-lab', process: 'airline-demo-new-knowledge-review-v1', identityKey: 'review', stage: '09_route_review_quarantine' }
  { name: 'job-airdn-source-parse-lab', process: 'airline-demo-new-source-parse-v1', identityKey: 'ingest', stage: '03_parse_source' }
  { name: 'job-airdn-source-register-lab', process: 'airline-demo-new-source-register-v1', identityKey: 'ingest', stage: '01_register_source' }
  { name: 'job-airdn-validate-lab', process: 'airline-demo-new-knowledge-validate-v1', identityKey: 'ingest', stage: '07_validate_semantics' }
]

resource acaJobs 'Microsoft.App/jobs@2024-03-01' = [for job in jobs: {
  name: job.name
  location: location
  tags: union(tags, { process: job.process, tenantKey: tenantKey })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityIds[job.identityKey]}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnvironmentId
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 3600
      replicaRetryLimit: 1
      manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
      registries: [
        { server: registryServer, identity: identityIds[job.identityKey] }
      ]
    }
    template: {
      containers: [
        {
          name: 'airdn-job'
          image: imageName
          command: [ '/bin/sh' ]
          args: [ '-lc', 'node scripts/knowledge/hcdn-job-runner.mjs --tenant ${tenantKey} --process ${job.process} --stage ${job.stage} --mode preflight' ]
          env: [
            { name: 'ABARVA_TENANT_KEY', value: tenantKey }
            { name: 'ABARVA_HCDN_ENVIRONMENT', value: 'lab' }
            { name: 'ABARVA_HCDN_PROCESS', value: job.process }
            { name: 'ABARVA_HCDN_STAGE', value: job.stage }
            { name: 'ABARVA_HCDN_MODE', value: 'preflight' }
            { name: 'ABARVA_HCDN_DATABASE', value: postgresDatabase }
            { name: 'ABARVA_HCDN_STORAGE_ACCOUNT', value: operationalStorageAccountName }
            { name: 'ABARVA_HCDN_EVALUATOR_STORAGE_ACCOUNT', value: evaluatorStorageAccountName }
            { name: 'ABARVA_HCDN_SUBSCRIPTION_ID', value: subscription().subscriptionId }
            { name: 'ABARVA_HCDN_IMAGE', value: imageName }
            { name: 'ABARVA_HCDN_IMAGE_DIGEST', value: imageDigest }
            { name: 'ABARVA_HCDN_STRICT_IMAGE_LOCK', value: 'true' }
            { name: 'ABARVA_HCDN_USE_IN_MEMORY_STORE', value: 'false' }
            { name: 'AZURE_SUBSCRIPTION_ID', value: subscription().subscriptionId }
            { name: 'AZURE_CLIENT_ID', value: identityClientIds[job.identityKey] }
            // Compatibility only. Standard runners and preflight checks use ABARVA_HCDN_*.
            { name: 'ABARVA_AIRDN_PROCESS', value: job.process }
            { name: 'ABARVA_AIRDN_STAGE', value: job.stage }
            { name: 'ABARVA_AIRDN_DATABASE', value: postgresDatabase }
            { name: 'ABARVA_AIRDN_STORAGE_ACCOUNT', value: operationalStorageAccountName }
            { name: 'ABARVA_AIRDN_EVALUATOR_STORAGE_ACCOUNT', value: evaluatorStorageAccountName }
            { name: 'ABARVA_CONTAINER_IMAGE', value: imageName }
            { name: 'PGHOST', value: postgresHost }
            { name: 'PGPORT', value: '5432' }
            { name: 'PGUSER', value: identityDatabaseUsers[job.identityKey] }
            { name: 'PGDATABASE', value: postgresDatabase }
            { name: 'PGSSLMODE', value: 'require' }
            { name: 'ABARVA_POSTGRES_AAD_CLIENT_ID', value: identityClientIds[job.identityKey] }
            { name: 'MANAGED_IDENTITY_CLIENT_ID', value: identityClientIds[job.identityKey] }
          ]
          resources: { cpu: json('0.5'), memory: '1Gi' }
        }
      ]
    }
  }
}]
