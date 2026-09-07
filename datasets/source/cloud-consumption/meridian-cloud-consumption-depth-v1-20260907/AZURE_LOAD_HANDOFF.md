# Azure load handoff

Dataset: meridian-cloud-consumption-depth-v1-20260907
Tenant: meridian-health

Run as a governed ACA data-build job with tenant scope, idempotency key, proof bundle, validation output, quality gate, and release record.

Required sequence:

1. Register or update the dataset manifest.
2. Apply Layer 2 adapters for cloud contract register, cloud consumption, commitment coverage, resource inventory, tag quality, AP reconciliation, contract terms, and optimization actions.
3. Verify adapter row counts against qa/row-counts.json.
4. Apply Layer 3 canonical objects and observations.
5. Verify canonical row counts, keys, lineage, and synthetic policy.
6. Refresh Layer 4 Source/consumption cubes.
7. Live-proof Source 360, Contract 360, Optimize, aVa, and Tower-ready projections.

Stop if schema support is missing for cloud service usage, commitment coverage, resource inventory, tag quality, or opportunity evidence. Do not flatten these into generic spend rows only.
