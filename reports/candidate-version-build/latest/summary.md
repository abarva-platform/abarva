# Reviewed Canonical Build to Inactive Candidate Versions

Generated: 2026-07-14T12:00:00.000Z

## Truth Split

- Candidate versions are inactive metadata/read-model artifacts.
- No production tenant data was written.
- The Active Tenant Access Layer was not updated.
- No candidate was promoted.
- Default Home and module runtime reads remain unchanged.

## Summary

- Source build: reports/canonical-data-build/latest
- Source build fingerprint: 24693eef8c783cd336d3a3419b9adcfed12c6c13a76c81f2775387ed3b9ab0f5
- Tenants processed: 6
- Candidate versions created: 6
- Tenants blocked: 0
- Canonical records represented: 20,230
- Evidence attachments represented: 20,230
- Relationship candidates represented: 10,835

## Tenant Candidate Versions

| Tenant | Candidate ID | Status | Records | Evidence | Relationships | Profile | Promotion blockers |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: |
| Apex Retail | `candidate:apex-retail:c4c22f56df29` | created / inactive | 3,589 | 3,589 | 1,690 | gaps | 7 |
| First Capital Financial | `candidate:first-capital-financial:7d49ae021b1e` | created / inactive | 5,609 | 5,609 | 2,757 | gaps | 7 |
| Lakeshore Holdings | `candidate:lakeshore-holdings:307719ab1500` | created / inactive | 457 | 457 | 183 | gaps | 7 |
| Lakeshore Industries | `candidate:lakeshore-industries:24713a2beb6f` | created / inactive | 3,040 | 3,040 | 892 | gaps | 5 |
| Meridian Health | `candidate:meridian-health:386677f11404` | created / inactive | 4,078 | 4,078 | 2,177 | ready | 0 |
| SkyHarbor Air | `candidate:skyharbor-air:942cb1f220fa` | created / inactive | 3,457 | 3,457 | 3,136 | gaps | 7 |

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
