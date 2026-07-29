using './main.bicep'

param location = 'eastus2'
param postgresLocation = 'eastus2'
param tenantId = 'f5151b70-963c-4124-a888-20a50e8c2e2c'
param resourceGroupName = 'rg-abarva-airdn-lab-eus2-001'
param imageName = readEnvironmentVariable('ABARVA_HCDN_IMAGE_NAME')
param tags = {
  tenantKey: 'airline-demo-new'
  environment: 'lab'
  phase: 'phase2b3c1-plan-only'
  managedBy: 'bicep'
  dataPlane: 'airline-demo-new-clean-room'
}
param postgresAdministratorLoginPassword = readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')
