# Active Relationship Depth Promotion

Generated: 2026-07-21T16:51:28.062Z

This run promoted or derived planning-grade active relationship rows after structural validation. It did not mutate Azure/Postgres.

| Tenant                  | Mode              | Rows before | Rows after | Missing endpoints | Self-loops | Candidate graph check |
| ----------------------- | ----------------- | ----------: | ---------: | ----------------: | ---------: | --------------------- |
| skyharbor-air           | promote_candidate |          77 |        380 |                 0 |          0 | pass                  |
| first-capital-financial | promote_candidate |          11 |        380 |                 0 |          0 | pass                  |
| meridian-health         | derive_active     |         298 |      1,037 |                 0 |          0 | not_applicable        |
| apex-retail             | derive_active     |          13 |      1,713 |                 0 |          0 | not_applicable        |
| lakeshore-holdings      | derive_active     |          10 |        364 |                 0 |          0 | not_applicable        |

## Boundary

- Promoted rows are active planning-grade context, not client-certified production evidence.
- Rich candidate graph CSVs were structurally checked for orphan edges and self-loops where present.
- Lakeshore Holdings remains the only active Lakeshore path; stale `lakeshore-industries` was not used.
- Azure graph/materialized context promotion remains a separate governed ACA data-build job.
