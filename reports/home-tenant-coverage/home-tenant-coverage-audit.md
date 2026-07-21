# Home Tenant Coverage Audit

Generated: 2026-07-21T16:51:35.222Z

Read-only audit of active relationship rows, approved Home design packs, and derived relationship graphs.

| Tenant             | Source tenant           | Status | Relationship rows | Graph nodes | Graph edges | Dimensions | Issues |
| ------------------ | ----------------------- | ------ | ----------------: | ----------: | ----------: | ---------: | ------ |
| skyharbor-air      | skyharbor-air           | pass   |               380 |       2,203 |       2,278 |         19 | none   |
| first-capital      | first-capital-financial | pass   |               380 |         790 |       1,425 |         19 | none   |
| lakeshore-holdings | lakeshore-holdings      | pass   |               364 |         316 |         364 |         19 | none   |
| apex-retail        | apex-retail             | pass   |             1,713 |         892 |       1,713 |         19 | none   |
| meridian-health    | meridian-health         | pass   |             1,037 |       1,668 |       2,642 |         19 | none   |

## Boundary

- This audit proves local Home render artifacts and active CSV relationship coverage only.
- Azure/Postgres materialization still requires the governed ACA data-build job and live signed-in proof.
