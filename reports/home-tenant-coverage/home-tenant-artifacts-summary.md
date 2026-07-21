# Home Tenant Coverage Artifacts

Generated: 2026-07-21T16:51:34.811Z

This run generated missing Home design-contract packs and source-derived relationship graphs from active tenant CSVs. It did not mutate Azure/Postgres or production data.

| Tenant             | Source tenant           | Validation | Source rows | Graph nodes | Graph edges | Unresolved explicit relationship rows |
| ------------------ | ----------------------- | ---------- | ----------: | ----------: | ----------: | ------------------------------------: |
| skyharbor-air      | skyharbor-air           | pass       |       3,532 |       2,203 |       2,278 |                                     0 |
| first-capital      | first-capital-financial | pass       |       1,715 |         790 |       1,425 |                                     0 |
| lakeshore-holdings | lakeshore-holdings      | pass       |         621 |         316 |         364 |                                     0 |
| apex-retail        | apex-retail             | pass       |       2,767 |         892 |       1,713 |                                     0 |

## Generated Files

- skyharbor-air: datasets/context-artifacts/approved/skyharbor-air/home-knowledge/approved-home-knowledge-design-contract-pack.json
- skyharbor-air: datasets/tenant-inputs/skyharbor-air/approved-content/home/design-contract-pack.json
- skyharbor-air: datasets/tenant-inputs/skyharbor-air/derived/relationship-graph.json
- first-capital: datasets/context-artifacts/approved/first-capital/home-knowledge/approved-home-knowledge-design-contract-pack.json
- first-capital: datasets/tenant-inputs/first-capital/approved-content/home/design-contract-pack.json
- first-capital: datasets/tenant-inputs/first-capital/derived/relationship-graph.json
- lakeshore-holdings: datasets/context-artifacts/approved/lakeshore-holdings/home-knowledge/approved-home-knowledge-design-contract-pack.json
- lakeshore-holdings: datasets/tenant-inputs/lakeshore-holdings/approved-content/home/design-contract-pack.json
- lakeshore-holdings: datasets/tenant-inputs/lakeshore-holdings/derived/relationship-graph.json
- apex-retail: datasets/context-artifacts/approved/apex-retail/home-knowledge/approved-home-knowledge-design-contract-pack.json
- apex-retail: datasets/tenant-inputs/apex-retail/approved-content/home/design-contract-pack.json
- apex-retail: datasets/tenant-inputs/apex-retail/derived/relationship-graph.json

## Existing Graph Cleanup

| Tenant          | Graph                                                                  | Edges before | Edges after | Self-loops removed |
| --------------- | ---------------------------------------------------------------------- | -----------: | ----------: | -----------------: |
| meridian-health | datasets/tenant-inputs/meridian-health/derived/relationship-graph.json |        2,670 |       2,642 |                 28 |

## Boundary

- These are approved local render artifacts for Home cockpit coverage.
- They are planning-grade synthetic/demo context, not client-certified production evidence.
- Azure layer promotion still requires the governed ACA data-build job, idempotency key, quality gate, and release evidence.
