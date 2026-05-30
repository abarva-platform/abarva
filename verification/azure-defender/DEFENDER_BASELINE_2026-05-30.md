# Defender for Cloud Baseline — 2026-05-30

## Scope

Subscription: `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)

Tenant: `f5151b70-963c-4124-a888-20a50e8c2e2c`

Command context: authenticated Azure CLI service principal.

## Result

Defender for Cloud is active for the production-relevant Azure service plans used by the AbarVa control/data lane.

| Plan | Tier | Sub-plan |
|---|---|---|
| AppServices | Standard | n/a |
| StorageAccounts | Standard | DefenderForStorageV2 |
| ContainerRegistry | Standard | n/a |
| KeyVaults | Standard | PerKeyVault |
| OpenSourceRelationalDatabases | Standard | n/a |
| Containers | Standard | n/a |
| Discovery | Standard | n/a |
| FoundationalCspm | Standard | n/a |

## Commands Run

```bash
az account show --output json
az security pricing list --query 'value[].{name:name, pricingTier:pricingTier, subPlan:subPlan, extensions:extensions}' --output json

for plan in AppServices Containers ContainerRegistry KeyVaults StorageAccounts OpenSourceRelationalDatabases; do
  az security pricing create -n "$plan" --tier Standard --output none
done

az security pricing list \
  --query 'value[?contains(`AppServices Containers ContainerRegistry KeyVaults StorageAccounts OpenSourceRelationalDatabases Discovery FoundationalCspm`, name)].{name:name, pricingTier:pricingTier, subPlan:subPlan}' \
  --output table
```

## Auto-Provisioning Note

The legacy Log Analytics auto-provisioning setting remains `Off` because Azure rejected the enable command:

```text
ERROR: (Deprecated) Log Analytics auto provisioning is deprecated and can no longer be enabled.
```

This does not prevent the Defender plans above from being Standard. Future vulnerability-report automation should use the current Defender for Cloud recommendation/export path rather than the deprecated Log Analytics auto-provisioning setting.

## Weekly Vulnerability Scanning

Defender plans that provide vulnerability findings for containers, registry, storage, key vault, app service, and open-source relational database resources are now Standard. The weekly scan/report operating item is to export Defender recommendations from this subscription on a scheduled cadence and attach the result to the release/audit evidence pack.

## Acceptance Mapping

- C13 Defender active: closed for the service plans listed above.
- Weekly vulnerability scanning enabled: platform capability enabled through Defender Standard plans; recurring export/report automation remains the next operationalization step.
- No application runtime change.
- No data/schema change.
