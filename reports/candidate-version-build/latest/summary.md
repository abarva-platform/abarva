# Reviewed Canonical Build to Inactive Candidate Versions

Generated: 2026-07-14T15:50:19.110Z

## Truth Split

- Candidate versions are inactive metadata/read-model artifacts.
- No production tenant data was written.
- The Active Tenant Access Layer was not updated.
- No candidate was promoted.
- Default Home and module runtime reads remain unchanged.

## Summary

- Source build: reports/canonical-data-build/latest
- Source build fingerprint: c6dba401db07e9a280869e59714a3c2374221cdf73c91843b1ef7b235b18c5a5
- Tenants processed: 6
- Candidate versions created: 6
- Tenants blocked: 0
- Canonical records represented: 6,593
- Evidence attachments represented: 6,593
- Relationship candidates represented: 9,330

## Tenant Candidate Versions

| Tenant | Candidate ID | Status | Records | Evidence | Relationships | Profile | Promotion blockers |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: |
| Apex Retail | `candidate:apex-retail:f778423b32c2` | created / inactive | 1,046 | 1,046 | 1,730 | ready | 0 |
| First Capital Financial | `candidate:first-capital-financial:4058ee9a40f9` | created / inactive | 1,327 | 1,327 | 1,991 | ready | 0 |
| Lakeshore Holdings | `candidate:lakeshore-holdings:e16ad063e5bd` | created / inactive | 249 | 249 | 373 | ready | 0 |
| Lakeshore Industries | `candidate:lakeshore-industries:bde306214d94` | created / inactive | 839 | 839 | 1,580 | ready | 0 |
| Meridian Health | `candidate:meridian-health:5698b1a4c532` | created / inactive | 1,066 | 1,066 | 1,662 | ready | 0 |
| SkyHarbor Air | `candidate:skyharbor-air:3565f457b05d` | created / inactive | 2,066 | 2,066 | 1,994 | ready | 0 |

## Required Proof Points

- SkyHarbor applications/systems: 613
- SkyHarbor data assets/integrations: 570
- SkyHarbor infrastructure/platforms: 686
- Meridian applications/systems: 116
- Meridian data assets/integrations: 147
- Meridian infrastructure/platforms: 0

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
