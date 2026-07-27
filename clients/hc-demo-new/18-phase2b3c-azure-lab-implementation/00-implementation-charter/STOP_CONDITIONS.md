# Stop Conditions

Stop and report before applying, running, or loading if any of these are true:

1. The Azure subscription, resource group, VNet, subnet, Container Apps environment, Log Analytics workspace, database server, database, storage account, Key Vault, managed identity, or job name is not exactly frozen in an approved manifest.
2. The requested database is a schema in the shared app database rather than `abarva_hc_demo_new_knowledge_lab` on `pg-abarva-hc-demo-new-lab-eus-001`.
3. PostgreSQL or Storage would be publicly reachable.
4. A job would use a local DB password rather than managed identity / Key Vault-backed secret.
5. Parser, Claude, runtime, Home, or product modules can read hidden truth or restricted source-to-truth crosswalk assets.
6. Candidate facts, Claude enrichments, or reconstructed records would be published without review/acceptance gates.
7. A prior active baseline would be replaced by a failed, partial, or empty projection.
8. Any command uses `TENANT=all`, blank tenant, wildcard tenant, or a tenant list.
9. The plan would mutate an existing/shared tenant data plane.
10. The operation cannot produce a run id, idempotency key, checksum ledger, execution ledger, reconstruction scorecard, conflict/review ledger, and publication manifest.
