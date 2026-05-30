# Substrate Snapshot

Generated: 2026-05-30T09:04:42.869Z

## Canonical Tenants

| Tenant | Name | Industry | Client ID |
| --- | --- | --- | --- |
| `apex-retail` | Apex Retail | `retail` | `bb8ed961-a049-4d0c-a38f-f8912138fceb` |
| `first-capital` | First Capital | `financial_services_banking` | `7dbf2cc9-79c2-44bd-98f7-95337b882807` |
| `meridian-health` | Meridian Health | `healthcare_provider` | `a20ecef5-f0ea-4890-b9d5-7375fab223ff` |
| `northstar-clinical` | Northstar Clinical Technologies | `healthcare_medtech` | `2702b525-4c6a-4fbe-973d-99a8480d8318` |
| `skyharbor-air` | SkyHarbor Air | `airline` | `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` |

## Enterprise Context Chunks

| Tenant | Chunks | Embedded | Source Docs |
| --- | ---: | ---: | ---: |
| `skyharbor-air` | 3,240 | 84 | 3,181 |
| `northstar-clinical` | 878 | 878 | 105 |
| `first-capital` | 400 | 400 | 60 |
| `meridian-health` | 320 | 320 | 48 |
| `apex-retail` | 280 | 280 | 42 |

## Pattern Tables

| Table | Rows |
| --- | ---: |
| `canonical_industry_ai_patterns` | 312 |
| `client_private_patterns` | 0 |
| `corpus_overlays` | 0 |
| `corpus_patterns` | 0 |
| `framework_overlays` | 0 |
| `pattern_packs` | 21 |

## Interpretation

The five canonical tenants are present and tenant IDs are stable. SkyHarbor has the deepest enterprise context substrate and is the certified demo tenant for this lock. Corpus canonicalization is still incomplete because `corpus_patterns` is empty while legacy pattern tables retain rows. Issue #2481 tracks that post-demo follow-up.
