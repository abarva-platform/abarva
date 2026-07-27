# Clean East US 2 Empty Infrastructure Apply - 2026-07-27

## Status

Pass. The clean `eastus2` empty private data-plane apply completed successfully.

## Deployment

- Subscription: `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)
- Deployment name: `airdn-phase1-zero-data-apply-clean-eastus2-20260727`
- Resource group: `rg-abarva-airdn-lab-eus2-001`
- Region: `eastus2`
- Provisioning state: `Succeeded`
- Duration: `PT7M8.8334589S`
- Correlation ID: `540b583d-5db4-4de3-9ead-df8072634f37`
- Raw apply output: `APPLY_CLEAN_EASTUS2_20260727.json`

## Created Scope

The apply created the empty Airline Demo New private data plane:

- PostgreSQL Flexible Server: `pg-abarva-airdn-lab-eus2-001`
- Database: `abarva_airline_demo_new_knowledge_lab`
- Operational storage: `stabairdnlabeus2001`
- Evaluator storage: `stabairdnevaleus2001`
- Key Vault: `kv-abarva-airdn-lab-eus2`
- VNet and private endpoints in `eastus2`
- Container Apps environment and manual ACA jobs
- ACR pull grants for the tenant managed identities

## Explicit Non-Mutations

- Source files landed: no
- Evaluator truth landed: no
- Parser jobs executed: no
- PostgreSQL migrations/RLS applied: no
- Knowledge Baseline published: no
- Product/Home/Source/Cube/aVa runtime wired: no
- Shared web ACA traffic changed: no

## Next Gate

Run zero-data certification against the created resources. Only after zero-data certification passes should the shared PostgreSQL migrations/RLS be applied to the empty tenant database.
