# Read-only RBAC audit export

- Timestamp: 2026-06-19T21:56:18-0500
- Subscription: abarva-lab-sub / 701a8554-a166-46e9-bf13-743bc50e3b20
- Resource group: rg-abarva-controlplane-lab-eastus
- Container App: ca-abarva-web-lab-eastus
- ACA environment ID: /subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.App/managedEnvironments/cae-abarva-scale-lab-eastus
- ACR: acrabarvalab001
- Worker jobs: job-abarva-deliv-worker job-abarva-deliv-worker-event
- Mutation performed: no. Commands executed were Azure read-only show/list exports only.
- Redaction: full Container App and job configuration exports were replaced with runtime summaries; secret names, Key Vault URLs, and environment variables are intentionally not included.

## Files
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/README.md
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/aca-environment.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/account.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/acr.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/containerapp-runtime-summary.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/high-risk-role-assignments-summary.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/job-job-abarva-deliv-worker-event-runtime-summary.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/job-job-abarva-deliv-worker-event.stderr
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/job-job-abarva-deliv-worker-runtime-summary.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/job-job-abarva-deliv-worker.stderr
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/resource-group.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-aca-environment-inherited.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-acr-inherited.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-combined.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-containerapp-inherited.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-job-job-abarva-deliv-worker-event-inherited.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-job-job-abarva-deliv-worker-inherited.json
- docs/build/rbac/2026-06-19-migration-outer-lock-readonly/role-assignments-resource-group-inherited.json
