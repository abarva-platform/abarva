using './main.bicep'

param location = 'eastus2'
param postgresLocation = 'eastus2'
param tenantId = 'f5151b70-963c-4124-a888-20a50e8c2e2c'
param resourceGroupName = 'rg-abarva-skair-lab-eus2-001'
param imageName = readEnvironmentVariable('ABARVA_HCDN_IMAGE_NAME')
param tags = {
  tenantKey: 'skyharbor-air'
  environment: 'lab'
  phase: 'phase1-zero-data-plan-only'
  managedBy: 'bicep'
  dataPlane: 'skyharbor-air-clean-room'
}
param postgresAdministratorLoginPassword = readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')
