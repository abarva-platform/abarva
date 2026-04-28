// AbarVa Azure Lab — Main Bicep Entry Point
// Slice ID: AZLAB6
// Status: STUB ONLY — not deployable without Azure credentials
// Authored: 2026-04-26
//
// This file orchestrates all AbarVa lab deployments as a subscription-scoped deployment.
// It creates resource groups and then deploys resources into them.
//
// NOTE: This is a scaffold stub. All TODO: comments require values before deployment.

targetScope = 'subscription'

// --- Parameters ---

@description('Deployment environment. Use "lab" for the Wave 24 lab.')
@allowed(['lab', 'staging', 'prod'])
param env string = 'lab'

@description('Azure region for all resources.')
param location string = 'eastus2'

@description('Project name token. Always abarva.')
param project string = 'abarva'

@description('Owner tag value for cost tracking.')
param owner string = 'abarva-lab'

// --- Resource Groups ---

// Control Plane resource group
resource rgControl 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${project}-${env}-control'
  location: location
  tags: {
    env: env
    project: '${project}-azlab1'
    owner: owner
    costCentre: 'rd-lab'
    plane: 'control'
  }
}

// Private Data Plane resource group
resource rgPrivateDp 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${project}-${env}-private-dp'
  location: location
  tags: {
    env: env
    project: '${project}-azlab1'
    owner: owner
    costCentre: 'rd-lab'
    plane: 'private-dp'
  }
}

// Observability resource group
resource rgObservability 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${project}-${env}-observability'
  location: location
  tags: {
    env: env
    project: '${project}-azlab1'
    owner: owner
    costCentre: 'rd-lab'
    plane: 'shared'
  }
}

// --- Module Deployments ---
// Uncomment each module when the corresponding stub is ready to deploy.

// module observability 'observability.bicep' = {
//   name: 'observability-${env}'
//   scope: rgObservability
//   params: {
//     env: env
//     location: location
//     project: project
//   }
// }

// module controlPlane 'control-plane.bicep' = {
//   name: 'control-plane-${env}'
//   scope: rgControl
//   dependsOn: [observability]
//   params: {
//     env: env
//     location: location
//     project: project
//     // TODO: logAnalyticsWorkspaceId from observability module output
//   }
// }

// module privateDataPlane 'private-data-plane.bicep' = {
//   name: 'private-data-plane-${env}'
//   scope: rgPrivateDp
//   dependsOn: [observability]
//   params: {
//     env: env
//     location: location
//     project: project
//   }
// }

// module budget 'budget-alert.bicep' = {
//   name: 'budget-${env}'
//   scope: subscription()
//   params: {
//     env: env
//     // TODO: notificationEmail — lab operator email address
//   }
// }

// --- Outputs ---

output rgControlName string = rgControl.name
output rgPrivateDpName string = rgPrivateDp.name
output rgObservabilityName string = rgObservability.name
