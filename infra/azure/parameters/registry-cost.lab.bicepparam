using '../registry-cost-foundation.bicep'

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
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param registryName = 'acrabarvalab001'
param registrySku = 'Basic'

param acrPushPrincipalIds = [
  'f311efce-bf6b-43fd-8f4d-a4b8c5adba74'
]

param monthlyBudgetAmount = 250
param budgetStartDate = '2026-05-01'
param budgetEndDate = '2027-05-01'
param budgetContactEmails = [
  'alerts@abarva.ai'
]
