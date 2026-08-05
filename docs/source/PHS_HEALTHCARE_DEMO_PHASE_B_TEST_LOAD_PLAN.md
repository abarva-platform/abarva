# Synthetic Healthcare Demo Phase B Test-Load Plan

Status: designed_only, not_executed

Phase B may begin only after explicit Phase A audit approval.

1. Approve the Phase A proof ZIP, generator seed, package hashes, validation report and model-fit audit.
2. Add only approved tenant bootstrap and additive migrations through a separate PR.
3. Deploy web/Cube changes only to an isolated lab/test environment.
4. Load the package as `tenant_key=phs_health_demo_global`, `dataset_id=phs-health-source-v1-202608`, `activation_state=staged`.
5. Load source-shaped raw records, canonical candidates and document evidence.
6. Build `source.*`, `tower.*` and `consumption.sourcing_*` projections.
7. Refresh Cube models in the isolated environment with tenant security context.
8. Reconcile PostgreSQL versus Cube for vendors, contracts, spend, invoice lines, service credits, ITSM/SLA facts, off-contract med/surg spend, rate-card variance, SaaS usage, BPO TCO, Tower claim states and evidence counts.
9. Run Source, Home, Tower, Intelligence, Moves and aVa signed-in proof paths.
10. Run cross-tenant isolation checks against SkyHarbor and invalid tenant requests.
11. Keep the dataset staged and stop for approval.
