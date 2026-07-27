using './main.bicep'

param location = 'eastus'
param subscriptionId = '701a8554-a166-46e9-bf13-743bc50e3b20'
param tenantId = 'f5151b70-963c-4124-a888-20a50e8c2e2c'
param resourceGroupName = 'rg-abarva-hcdn-lab-eus-001'
param tags = {
  tenantKey: 'hc-demo-new'
  environment: 'lab'
  phase: 'phase2b3c1-plan-only'
  managedBy: 'bicep'
  dataPlane: 'hc-demo-new-clean-room'
}
param postgresAdministratorLoginPassword = readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')
