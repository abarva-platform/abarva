# Foundation Closure Authority Record — 2026-07-29

## Scope

- Tenant key: `airline-demo-new`
- Source release: `airline-demo-new-source-corpus-v1.0.0`
- Environment: isolated lab data plane
- Subscription: `701a8554-a166-46e9-bf13-743bc50e3b20`
- Resource group: `rg-abarva-airdn-lab-eus2-001`
- Postgres host: `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com`
- Postgres database: `abarva_airline_demo_new_knowledge_lab`

This record closes the state-authority confusion that occurred during foundation recovery. It binds the accepted foundation state to readback evidence and explicitly blocks rerunning review apply, domain publication, baseline activation, or projection build when the same state is already present.

## Authoritative Readback

| Area                      |                                                                         Authoritative value | Status    |
| ------------------------- | ------------------------------------------------------------------------------------------: | --------- |
| Accepted review decisions |                                                                                   `112,201` | Confirmed |
| Deferred review decisions |                                                                                   `152,029` | Confirmed |
| Rejected review decisions |                                                                                         `0` | Confirmed |
| Domain publication        |                    `airline-demo-new-source-corpus-v1.0.0:enterprise:domain-publication-v1` | Confirmed |
| Active baseline           |                               `airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1` | Confirmed |
| Baseline hash             |                          `135d860b9b104b2a2891fd108ea57286dc28bc057327498c63934c6552425549` | Confirmed |
| Projection version        | `airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1:knowledge-consumption-core-v1` | Confirmed |
| Projection rows           |                                                                                   `114,566` | Confirmed |
| Projection hash           |                          `e043827303034319199613dcdac3631629ddd399e9ae841411a370b274655ef5` | Confirmed |
| Home read model check     |                      `1` enterprise brief, `37,000` search rows, `16,605` relationship rows | Confirmed |
| Cube/Postgres parity      |                                                  `4` passed, `0` failed, `4` not applicable | Confirmed |

## Consumption Projection Counts

| Projection                     |     Rows |
| ------------------------------ | -------: |
| `enterprise_brief_v1`          |      `1` |
| `enterprise_identity_v1`       |      `1` |
| `domain_summary_v1`            |     `10` |
| `application_inventory_v1`     |  `1,405` |
| `technology_estate_v1`         |  `1,405` |
| `data_product_inventory_v1`    |  `6,580` |
| `vendor_contract_inventory_v1` |    `420` |
| `search_document_v1`           | `37,000` |
| `relationship_node_v1`         | `34,534` |
| `relationship_edge_v1`         | `16,605` |
| `relationship_evidence_v1`     | `16,605` |

## Permanent Job Template Correction

PR `#5733` converted the Airline foundation ACA jobs from recovery/override behavior into persistent, responsibility-specific jobs:

- every job is bound to the single tenant key;
- every job declares its process and stage;
- every job uses the HCDN job runner entrypoint;
- every job uses digest-pinned image configuration;
- every job is private-Postgres-bound through `PGHOST`, `PGDATABASE`, `PGUSER`, and AAD identity env;
- every job is safe by default in `preflight` mode;
- no job template carries `PGPASSWORD`;
- `execute` mode requires `ABARVA_HCDN_EXECUTE_ACK=EXECUTE_SHARED_TENANT_JOB`.

Live post-apply preflight result:

| Check         | Result                     |
| ------------- | -------------------------- |
| Expected jobs | `14`                       |
| Passed jobs   | `14`                       |
| Failed jobs   | `0`                        |
| Failed checks | `0`                        |
| Checked at    | `2026-07-29T07:46:56.858Z` |

## Runtime Image Binding

After PR `#5733`, the shared ACA runtime invariant passed:

- Web revision: `ca-abarva-web-lab-eastus--mf12a3457`
- Web image: `acrabarvalab001.azurecr.io/abarva/web@sha256:b827ec5bfb709df9cc958efcfc09f4370b22d84e7e668b6d85c4aa3c0a2d5423`
- Traffic: `100%`
- Worker jobs: same digest
- Health: passed

The Airline foundation jobs were also standardized to the same digest-pinned image.

## Decision Rules From This Point

If readback returns the values in this record, operators must not rerun:

- review decision apply;
- domain publication;
- baseline publication or activation;
- projection build;
- Home read-model refresh;
- reconciliation audit;
- metric parity;
- provider activation as a side effect of data-plane repair.

The next allowed work is product consumption proof and identity mapping only.

## Next Allowed Gates

1. Bind the governed HTTP provider for `airline-demo-new` only.
2. Create or update the Clerk identity mapping for `airline-demo-new`.
3. Prove a platform-admin route can read the active baseline and projection identity.
4. Prove a tenant-scoped user can reach the same baseline.
5. Prove Home / Knowledge without fixture fallback.
6. Prove aVa context packets carry the same tenant key, baseline ID, baseline hash, projection version, and refresh run.
7. Prove Source, Moves, Tower, Cube, Superset, and Observable only after they bind to the same projection identity.
8. Capture rollback evidence before calling this tenant product-ready.

## Hard Stops

Stop execution if any of these occur:

- accepted/deferred/rejected review counts differ from this record without an intentional, approved new review package;
- rejected or deferred records enter publication;
- active baseline hash changes without a new approved baseline activation;
- projection hash or row count changes without an approved projection run;
- a product surface falls back to fixtures;
- cross-tenant records appear in a packet, API response, dashboard, or UI;
- rollback path cannot be demonstrated.

## Evidence References

Raw logs and JSON proof are retained in the operator proof bundle for the 2026-07-29 foundation recovery run. This repo record intentionally stores only the public-safe identity, counts, hashes, and decision rules needed to prevent duplicate mutation.
