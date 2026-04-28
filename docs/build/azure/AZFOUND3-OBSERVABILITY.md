# AZFOUND3 - Observability Runbook

Resource Group: `rg-abarva-observability-lab-eastus`
Subscription: `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)
Region: `eastus`

## Resource Inventory (LA Workspace, App Insights, Action Groups)
- Log Analytics workspace (central aggregation target)
- Application Insights instance (workspace-based)
- Action group scaffold for notifications/escalation
- Alert rule scaffold for health, deployment failure, and anomaly monitoring
- Azure Monitor workbooks (as follow-on artifacts)

## Diagnostic Settings Routing (Control Plane -> LA, Data Plane -> LA, Security -> LA)
- Control plane resources emit logs/metrics to the observability workspace.
- Private dataplane resources emit logs/metrics to the same workspace.
- Shared security resources (including Key Vault) emit audit and diagnostic streams to the workspace.
- Routing is enforced by deployment policy and post-deploy validation checks.

## Retention Policy (Synthetic = 30 Days, Future Production = 90+)
- Lab retention baseline: `30` days.
- Production target baseline: `90+` days, subject to legal/compliance policy.
- Retention changes require explicit change-control approval.

## Cost Guardrails (Daily Cap on LA Ingestion to Prevent Surprise Bills)
- Log Analytics daily cap is set in the module (GB/day) to reduce unplanned spend.
- Cap values are intentionally conservative in lab.
- Cap exceptions require explicit owner approval.

## Alert Rule Scaffolding (Resource Health, Deployment Failures, Cost Anomalies)
- Starter alert scaffolds include:
  - Activity log alert for failed deployments at subscription scope
  - Action group wiring for operational notifications
- Cost anomaly alerting is tracked as follow-on because subscription cost signals can require finance integration decisions.

## Tagging Strategy
Required tags:
- `environment=lab`
- `costCenter=<team-or-budget-code>`
- `dataClassification=synthetic`
- `owner=<primary-owner-alias>`
- `project=abarva`

## Bicep Template Path
- `infra/azure/observability.bicep`

## Pre-Deployment Checklist
- [ ] Confirm observability RG exists or will be created by IaC.
- [ ] Confirm retention and ingestion cap settings for lab.
- [ ] Confirm notification receiver endpoints for action group are lab-safe.

## Post-Deployment Validation (Smoke Tests)
- [ ] Log Analytics workspace deployed and accessible.
- [ ] Application Insights linked to workspace.
- [ ] Action group created with expected receivers.
- [ ] Test activity log alert deployment and verify notification path.

## Rollback Procedure
1. Disable noisy or misconfigured alert rules first.
2. Revert observability module to previous known-good version.
3. Validate ingestion and retention settings after rollback.
4. Confirm no diagnostic stream destinations were orphaned.
