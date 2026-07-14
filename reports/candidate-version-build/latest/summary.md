# Reviewed Canonical Build to Inactive Candidate Versions

Generated: 2026-07-14T13:00:00.000Z

## Truth Split

- Candidate versions are inactive metadata/read-model artifacts.
- No production tenant data was written.
- The Active Tenant Access Layer was not updated.
- No candidate was promoted.
- Default Home and module runtime reads remain unchanged.

## Summary

- Source build: reports/canonical-data-build/latest
- Source build fingerprint: c32e4ed2326c5825e7797f488656be1967641a2108b9176b089e3e84bd34bd22
- Tenants processed: 6
- Candidate versions created: 6
- Tenants blocked: 0
- Canonical records represented: 20,230
- Evidence attachments represented: 20,230
- Relationship candidates represented: 10,835

## Tenant Candidate Versions

| Tenant | Candidate ID | Status | Records | Evidence | Relationships | Profile | Promotion blockers |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: |
| Apex Retail | `candidate:apex-retail:16bf9cad3198` | created / inactive | 3,589 | 3,589 | 1,690 | ready | 0 |
| First Capital Financial | `candidate:first-capital-financial:dd4a1abcf54b` | created / inactive | 5,609 | 5,609 | 2,757 | ready | 0 |
| Lakeshore Holdings | `candidate:lakeshore-holdings:dfa86cb1154b` | created / inactive | 457 | 457 | 183 | ready | 0 |
| Lakeshore Industries | `candidate:lakeshore-industries:929f574689fc` | created / inactive | 3,040 | 3,040 | 892 | ready | 0 |
| Meridian Health | `candidate:meridian-health:aef0edc75fad` | created / inactive | 4,078 | 4,078 | 2,177 | ready | 0 |
| SkyHarbor Air | `candidate:skyharbor-air:80f0be2d1c76` | created / inactive | 3,457 | 3,457 | 3,136 | ready | 0 |

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
