# Wave 1 Modernization Pattern Pack Summary

Generated 630 governed corpus patterns across 12 batches.

| Batch | Patterns | File |
|---|---:|---|
| MOD-ARCH archetype library | 50 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-arch-archetype-library.jsonl` |
| MOD-ESTATE industry estate profile | 120 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-estate-industry-estate-profile.jsonl` |
| MOD-7R 7 Rs disposition policy | 70 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-7r-7-rs-disposition-policy.jsonl` |
| MOD-WA well-architected lakehouse pillar | 105 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-wa-well-architected-lakehouse-pillar.jsonl` |
| MOD-AUTO automation leverage | 30 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-auto-automation-leverage.jsonl` |
| MOD-SI SI methodology divergence | 50 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-si-si-methodology-divergence.jsonl` |
| MOD-BRICK brickbuilder migration solution | 25 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-brick-brickbuilder-migration-solution.jsonl` |
| MOD-RFP weighted RFP scorecard | 30 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-rfp-weighted-rfp-scorecard.jsonl` |
| MOD-EFFORT effort heuristic | 50 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-effort-effort-heuristic.jsonl` |
| MOD-INV workload inventory schema | 20 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-inv-workload-inventory-schema.jsonl` |
| MOD-ACCEL third-party accelerator coverage | 30 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-accel-third-party-accelerator-coverage.jsonl` |
| MOD-ANTI modernization anti-pattern | 50 | `scripts/corpus/generated/healthcare-modernization-wave1/mod-anti-modernization-anti-pattern.jsonl` |

## Loader Path

Patterns are authored as JSONL for `/api/admin/context-layer/corpus-import`, the governed admin loader lane. Default operator flow is validation-only; commit requires explicit attestation.

## Source Discipline

- Databricks Lakebridge Analyzer and overview for migration assessment/conversion/reconciliation taxonomy.
- Databricks Well-Architected Lakehouse framework for seven-pillar RFP scoring.
- AWS Prescriptive Guidance for the 7 Rs taxonomy.
- AbarVa June 3 modernization spec, industry profiles, and research notes for buyer-side comparator doctrine.

## Known Limits

- This is an authored corpus artifact and local loader validation target; live commit still requires an authenticated admin upload and the production database schema migration to be present.
- Automation and effort values are encoded as planning ranges and confidence notes, not exact promises.
