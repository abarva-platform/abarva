# Product Dev Azure Finish Summary

Status date: 2026-06-15 CDT

## Result

Product Dev is now a real, evidence-backed Azure environment with a minimal
runtime baseline.

Created or updated:

- Subscription: `sub-abarva-product-dev-eus-001`
- Subscription ID: `58eef48c-3ed6-48e6-9af4-de1848ad3401`
- Control-plane resource group: `rg-abarva-controlplane-product-dev-eus-001`
- Placeholder Key Vault: `kv-abarva-pdev-eus-001`
- Monthly budget: `budget-abarva-product-dev-monthly`
- Budget amount: USD 500/month
- Budget alert recipients: `admin@abarva.ai`, `alerts@abarva.ai`
- Budget thresholds: actual 50%, actual 80%, actual 100%, forecasted 100%
- Observability resource group: `rg-abarva-observability-product-dev-eus-001`
- Log Analytics workspace: `log-abarva-product-dev-eus-001`
- Application Insights component: `appi-abarva-product-dev-eus-001`
- Alert action group: `ag-abarva-product-dev-eus-001`
- Activity log alert: `ala-subscription-deployment-failures`
- Runtime managed identity: `id-abv-pdev-runtime-eus1`
- Container Apps environment: `cae-abv-pdev-eus1`
- Scale-to-zero runtime smoke app: `ca-abv-pdev-smoke-eus1`

## Live Smoke Proof

The Product Dev smoke app is reachable over HTTPS:

- FQDN: `ca-abv-pdev-smoke-eus1.redwave-653318c8.eastus.azurecontainerapps.io`
- HTTP proof: `smoke-http-head.txt`
- Body proof: `smoke-http-body.txt`
- Result: `HTTP/2 200`

The smoke app uses the Microsoft Container Apps hello-world image only. It does
not contain AbarVa application secrets, client data, PHI, or PII.

## Controls Verified

- Product Dev subscription state is `Enabled`.
- Product Dev subscription and resource-group tags are applied.
- Key Vault uses RBAC authorization.
- Key Vault purge protection is enabled.
- Key Vault public network access is disabled.
- No Key Vault secrets were added.
- Required runtime providers are registered.
- Runtime deploy completed successfully with deployment correlation ID captured.
- Container Apps smoke baseline is deployed with `minReplicas = 0` and
  `maxReplicas = 1`.
- Log Analytics daily cap is set to 1 GB.
- Product Dev cost circuit breaker status is `OK`.
- Current Product Dev spend is USD 0.00 against the USD 500 budget at the time
  of the check.
- No client private-plane resources were created.
- No Product Preview or Product Prod resources were created.
- No DNS or production traffic changes were performed.

## Evidence Files

- Approval: `docs/approvals/AZURE_MUTATION_APPROVED.md`
- Runtime what-if: `product-dev-runtime-whatif.json`
- Runtime deployment: `product-dev-runtime-deploy-summary.json`
- Full deployment evidence, with telemetry connection string redacted:
  `product-dev-runtime-deploy.json`
- Smoke FQDN: `smoke-fqdn.txt`
- Smoke HTTP head: `smoke-http-head.txt`
- Smoke HTTP body: `smoke-http-body.txt`
- Cost circuit breaker:
  `cost-circuit-breaker/cost-circuit-breaker-report.md`
- Budget update: `product-dev-budget-alerts-updated.json`
- Control-plane resources: `controlplane-resources-final.json`
- Observability resources: `observability-resources-final.json`
- Resource groups: `resource-groups-final.json`
- Role assignments: `role-assignments-final.json`
- Policy assignments: `policy-assignments-final.json`
- Provider states: `provider-final-Microsoft.*.json`

## Remaining Blockers

Product Dev is not yet 100% complete.

1. Management group placement is still externally blocked. The current Azure
   principal does not have usable management-group read/placement access for
   `abarva-product`.
2. Baseline policy assignments are still pending. They should be applied after
   management-group ownership is clear or after a narrower subscription-level
   policy packet is approved.
3. GitHub `product-dev` environment secret wiring is not complete. No secrets
   were invented or copied.
4. The real AbarVa application image is not deployed to Product Dev yet. The
   current runtime is a smoke shell only.
5. Product Dev synthetic data load/retrieval rehearsal has not been run.

## Completion Assessment

- Product Dev subscription vending: complete.
- Product Dev baseline tags: complete.
- Product Dev budget and alert hygiene: complete.
- Product Dev read-only cost circuit breaker: complete.
- Product Dev placeholder Key Vault: complete.
- Product Dev provider registration: complete.
- Product Dev runtime smoke baseline: complete.
- Product Dev HTTPS smoke proof: complete.
- Product Dev management group placement: blocked.
- Product Dev policy baseline: pending.
- Product Dev GitHub environment/secrets: pending.
- Product Dev real app deployment and synthetic data rehearsal: pending.

Overall Product Dev Azure execution estimate: 75%.
