// AbarVa Azure Lab — Cost Management Budget Alert
// Slice ID: AZLAB6
// Status: STUB ONLY — not deployable without Azure credentials
// Authored: 2026-04-26
//
// Deploys at: subscription scope
// Creates: $200/month budget with $150 warning and $200 ceiling alerts

targetScope = 'subscription'

param env string = 'lab'

@description('Lab operator email for cost alerts.')
param notificationEmail string = '' // TODO: set to lab operator email before deployment

@description('Budget amount in USD per month.')
param budgetAmount int = 200

@description('Warning threshold as percent of budget (default 75% = $150).')
param warningThresholdPercent int = 75

// --- Action Group for scale-down at ceiling ---
// NOTE: Action groups must be deployed in a resource group, not subscription scope.
// Deploy ag-abarva-lab-scale-down separately into rg-abarva-lab-observability first.

// --- Budget ---

resource labBudget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: 'budget-abarva-${env}'
  properties: {
    category: 'Cost'
    amount: budgetAmount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: '2026-05-01' // TODO: update to actual lab start date
      // endDate: optional; omit for ongoing budget
    }
    filter: {
      tags: {
        name: 'project'
        operator: 'In'
        values: ['abarva-azlab1']
      }
    }
    notifications: {
      warningAlert: {
        enabled: true
        operator: 'GreaterThan'
        threshold: warningThresholdPercent
        contactEmails: [
          !empty(notificationEmail) ? notificationEmail : 'TODO-set-email@example.com'
        ]
        thresholdType: 'Actual'
      }
      ceilingAlert: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100  // 100% = $200
        contactEmails: [
          !empty(notificationEmail) ? notificationEmail : 'TODO-set-email@example.com'
        ]
        // TODO: add contactGroups with action group ARM ID for auto-scale-down
        // contactGroups: [
        //   '/subscriptions/<sub-id>/resourceGroups/rg-abarva-lab-observability/providers/microsoft.insights/actionGroups/ag-abarva-lab-scale-down'
        // ]
        thresholdType: 'Actual'
      }
    }
  }
}

output budgetName string = labBudget.name
