targetScope = 'resourceGroup'

param location string
param tags object
param containerAppsEnvironmentId string
param operationalStorageAccountName string
param evaluatorStorageAccountName string
param identityIds object

var tenantKey = 'airline-demo-new'
var registryServer = 'acrabarvalab001.azurecr.io'
var imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160'
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
          args: [ '-lc', 'node scripts/knowledge/hcdn-job-runner.mjs --tenant airline-demo-new --process ${job.process}' ]
          env: [
            { name: 'ABARVA_TENANT_KEY', value: tenantKey }
            { name: 'ABARVA_AIRDN_PROCESS', value: job.process }
            { name: 'ABARVA_AIRDN_STAGE', value: job.stage }
            { name: 'ABARVA_AIRDN_DATABASE', value: 'abarva_airline_demo_new_knowledge_lab' }
            { name: 'ABARVA_AIRDN_STORAGE_ACCOUNT', value: operationalStorageAccountName }
            { name: 'ABARVA_AIRDN_EVALUATOR_STORAGE_ACCOUNT', value: evaluatorStorageAccountName }
          ]
          resources: { cpu: json('0.5'), memory: '1Gi' }
        }
      ]
    }
  }
}]
