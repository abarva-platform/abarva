# Applications & Systems Source To Loaded Proof

Generated: 2026-07-14T16:02:20.827Z

This proves the active universal input file used for each tenant and the canonical data-layer object that accepted the rows. This PR does not write a production DB table; it writes deterministic build proof artifacts.

| Tenant | Active input file | Source rows | Loaded layer/object | Accepted records | Skipped rows |
| --- | --- | ---: | --- | ---: | ---: |
| Apex Retail | `datasets/tenant-inputs/active/apex-retail/current/04_applications_systems.csv` | 122 | Canonical Fact Store / CanonicalIngestionRecord(application_system) | 122 | 0 |
| First Capital Financial | `datasets/tenant-inputs/active/first-capital-financial/current/04_applications_systems.csv` | 212 | Canonical Fact Store / CanonicalIngestionRecord(application_system) | 212 | 0 |
| Lakeshore Holdings | `datasets/tenant-inputs/active/lakeshore-holdings/current/04_applications_systems.csv` | 24 | Canonical Fact Store / CanonicalIngestionRecord(application_system) | 24 | 0 |
| Lakeshore Industries | `datasets/tenant-inputs/active/lakeshore-industries/current/04_applications_systems.csv` | 152 | Canonical Fact Store / CanonicalIngestionRecord(application_system) | 152 | 0 |
| Meridian Health | `datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv` | 116 | Canonical Fact Store / CanonicalIngestionRecord(application_system) | 116 | 0 |
| SkyHarbor Air | `datasets/tenant-inputs/active/skyharbor-air/current/04_applications_systems.csv` | 613 | Canonical Fact Store / CanonicalIngestionRecord(application_system) | 613 | 0 |

Full system-level row export:

- `reports/tenant-input-consolidation/latest/applications-systems-full-source-to-loaded.csv`

## Guardrails

- Northstar retired/excluded.
- No candidate data is read by default.
- No production tenant data is written by this PR.
- Active input files are one universal file per tenant for this dimension.
