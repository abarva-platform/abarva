using '../event-ingestion-foundation.bicep'

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
param privateDataplaneResourceGroupName = 'rg-abarva-private-dataplane-lab-eastus'
param privateDataplaneStorageAccountName = 'stabarvaprivatedplab001'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param serviceBusNamespaceName = 'sb-abarva-lab-eastus'
param serviceBusSkuName = 'Standard'
param contextIngestionQueueName = 'q-context-ingestion-events'
param agentWorkQueueName = 'q-agent-work-items'

param contextDropsContainerName = 'context-drops'
param contextProcessedContainerName = 'context-processed'
param storageBlobCreatedEventSubscriptionName = 'egsub-context-drop-created'

param serviceBusDataOwnerPrincipalIds = [
  'f311efce-bf6b-43fd-8f4d-a4b8c5adba74'
]
