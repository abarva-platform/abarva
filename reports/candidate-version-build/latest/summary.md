# Reviewed Canonical Build to Inactive Candidate Versions

Generated: 2026-07-14T01:22:31.580Z

## Truth Split

- Candidate versions are inactive metadata/read-model artifacts.
- No production tenant data was written.
- The Active Tenant Access Layer was not updated.
- No candidate was promoted.
- Default Home and module runtime reads remain unchanged.

## Summary

- Source build: reports/canonical-data-build/latest
- Source build fingerprint: ca80432e6744f888ad49c8607df7dca7ba02848676d7d5142e3fc9b693b546c1
- Tenants processed: 6
- Candidate versions created: 6
- Tenants blocked: 0
- Canonical records represented: 20,230
- Evidence attachments represented: 20,230
- Relationship candidates represented: 10,835

## Tenant Candidate Versions

| Tenant | Candidate ID | Status | Records | Evidence | Relationships | Profile | Promotion blockers |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: |
| Apex Retail | `candidate:apex-retail:a8f372853cb9` | created / inactive | 3,589 | 3,589 | 1,690 | gaps | 8 |
| First Capital Financial | `candidate:first-capital-financial:3794217b5b8c` | created / inactive | 5,609 | 5,609 | 2,757 | gaps | 7 |
| Lakeshore Holdings | `candidate:lakeshore-holdings:f03c88db6e6c` | created / inactive | 457 | 457 | 183 | gaps | 9 |
| Lakeshore Industries | `candidate:lakeshore-industries:615216388101` | created / inactive | 3,040 | 3,040 | 892 | gaps | 7 |
| Meridian Health | `candidate:meridian-health:b8c7bed092e6` | created / inactive | 4,078 | 4,078 | 2,177 | gaps | 6 |
| SkyHarbor Air | `candidate:skyharbor-air:c44972185e16` | created / inactive | 3,457 | 3,457 | 3,136 | gaps | 7 |

## Required Proof Points

- SkyHarbor applications/systems: 626
- SkyHarbor data assets/integrations: 570
- SkyHarbor infrastructure/platforms: 691
- Meridian applications/systems: 192
- Meridian data assets/integrations: 432
- Meridian infrastructure/platforms: 4

## Proof Files

- `candidate-version-index.json`
- `tenant-candidate-versions.json`
- `quality-gate-results.json`
- `promotion-blockers.json`
- `skyharbor-candidate-preview.json`
- `meridian-candidate-preview.json`
- `candidate-read-model-samples.json`
- `active-vs-candidate-separation.json`
- `guardrails.json`
- `candidate-version-control.html`
