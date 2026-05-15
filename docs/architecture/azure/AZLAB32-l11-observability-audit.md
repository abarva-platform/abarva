# AZLAB32 - L11 Observability And Cost Audit

Date: 2026-05-15  
Status: wired, live local audit run  
Layer: L11 observability / SLO / cost

## Why This Exists

The Azure lab now has enough services that a portal screenshot is not a control. AbarVa needs a repeatable evidence check that proves the operational plane exists: logs, traces, deployment-failure alerts, budget notifications, and Container Apps diagnostic plumbing.

This gate does not replace Application Insights availability tests or production SLO dashboards. It is the first control that says the evidence plane itself is present.

## Artifacts

| Artifact | Purpose |
|---|---|
| `scripts/azure/audit-observability.mjs` | Azure CLI audit for Log Analytics, Application Insights, action group, deployment-failure alert, budget, Container Apps environment diagnostics, and web-app App Insights binding. |
| `npm run azure:observability:audit` | Local/manual command. Advisory by default; `-- --strict` fails on attention items. |
| `.github/workflows/azure-l11-observability-audit.yml` | Manual GitHub Actions gate using OIDC Azure login. Uploads the JSON report as an artifact. |

## Checks

| Check family | Expected posture |
|---|---|
| Log Analytics | Workspace exists, provisioning succeeded, retention is at least 30 days. |
| Application Insights | Component exists, provisioning succeeded, workspace-backed mode is enabled. |
| Action group | Enabled and has at least one receiver. |
| Deployment-failure alert | Activity-log alert exists and is enabled. |
| Cost budget | Monthly lab budget exists and has notification threshold at or below 80%. |
| Container Apps diagnostics | Environment is provisioned with Log Analytics configuration. |
| Web app telemetry | Web Container App has an Application Insights connection-string env binding. |

## How To Run

Local:

```bash
npm run azure:observability:audit
npm run azure:observability:audit -- --strict
```

GitHub Actions:

```bash
gh workflow run azure-l11-observability-audit.yml
gh workflow run azure-l11-observability-audit.yml -f strict=true
```

Required repository secrets for the workflow:

| Secret | Purpose |
|---|---|
| `AZURE_LAB_CLIENT_ID` | Federated service principal / managed app used by GitHub Actions. |
| `AZURE_LAB_TENANT_ID` | Entra tenant for the lab subscription. |

The subscription id is pinned in the workflow because the lab subscription is fixed: `701a8554-a166-46e9-bf13-743bc50e3b20`.

## Expected Output

```json
{
  "audit": "azure-l11-observability",
  "status": "attention",
  "summary": {
    "pass": 8,
    "attention": 1,
    "fail": 0
  },
  "checks": []
}
```

## Live Audit Result - 2026-05-15

Local command:

```bash
npm run azure:observability:audit
```

Result:

| Status | Count |
|---|---:|
| Pass | 11 |
| Attention | 2 |
| Fail | 0 |

Attention items:

| Check | Finding | Close path |
|---|---|---|
| `observability.app_insights.workspace_link` | Application Insights is provisioned but not workspace-backed. | Recreate or migrate the App Insights component to workspace-backed mode before pilot strict mode. |
| `observability.web_app.app_insights_env` | `ca-abarva-web-lab-eastus` does not expose `APPLICATIONINSIGHTS_CONNECTION_STRING` / `APPINSIGHTS_CONNECTION_STRING`. | Project the App Insights connection string through Key Vault / Container Apps secrets and wire OpenTelemetry or app insights SDK emission. |

Positive evidence:

- Log Analytics workspace `log-abarva-observability-lab-eastus` is provisioned with 30-day retention.
- Action group `ag-abarva-observability-lab-eastus` is enabled and sends to `alerts@abarva.ai`.
- Deployment failure activity-log alert `ala-subscription-deployment-failures` is enabled at subscription scope.
- Monthly lab budget `budget-abarva-lab-monthly` is `$250` with 50%, 80%, 100%, and forecasted 100% notifications.
- Container Apps environment `cae-abarva-scale-lab-eastus` is provisioned and configured for Log Analytics.
- Web app `ca-abarva-web-lab-eastus` is provisioned with latest ready revision `ca-abarva-web-lab-eastus--0000004`.

## Next Controls

This is the evidence-plane audit. The next L11 controls are:

- Application Insights availability tests against `/api/health` and one authenticated surface.
- SLO workbook queries for p95 latency, 5xx rate, agent-turn latency, guard violation rate, and RLS denial rate.
- Cost workbook pinned to the lab resource groups and the AI/model services.
- End-to-end agent trace coverage with retrieval ids, model call ids, and latency breakdown.
