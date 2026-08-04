# Tower Reconciliation And Data Quality

Date: 2026-08-02

Scope: local `tower.*` read model, fact-lineage report, and UI-safe treatment of unknown/conflicted value.

## Summary

The local Tower model is populated enough to render an operational command center, but it is not populated enough to claim realized or promised financial value. The correct posture is evidence-gathering and governance, not executive value proof.

## Local Reconciliation

| Check                                          | Result        |
| ---------------------------------------------- | ------------- |
| `tower.metric_observation` provenance coverage | 7,174 / 7,174 |
| Value claims with known dollar amount          | 0 / 162       |
| Claims with baseline/target/actual             | 0 / 162       |
| Finance attestation                            | 0 / 162       |
| Business attestation                           | 0 / 162       |
| Disputed metric rows                           | 0             |
| Stale metric rows                              | 0             |

Result hash: `f9cab2359aed07c0b2b9ff31899a6b165da650ae0724c26731e2067533fe2ce3`.

## Lineage Check

`node scripts/tower/fact-lineage-report.mjs` was run before quoting numbers.

Latest lineage report:

- `reports/tower-data-fix/fact-lineage/tower-lineage-summary.csv`
- `reports/tower-data-fix/fact-lineage/tower-command-metric-lineage.csv`
- `reports/tower-data-fix/fact-lineage/tower-command-metric-lineage.json`
- `reports/tower-data-fix/fact-lineage/tower-gap-lineage.csv`

Status totals:

- `ONE_SOURCE`: 20
- `CONFLICT`: 5
- `AGREE`: 3
- `ABSENT`: 2

Important blocker: `skyharbor-air` promised value is `CONFLICT`, with asserted values of `$3374.0M` and `$80.2M` from different source files. The product must not quote either as a governed promised-value fact until the conflict is resolved.

## DQ Interpretation

The 12 `usage_supported` claims show adoption/usage evidence. They do not prove business value because calculated value, baseline, target, actual, and attestation gates are missing.

The 150 `funded_no_baseline` claims show funded work without baseline evidence. They should drive Moves/Source follow-up actions, not Tower value totals.

The 162 unknown-value claims are evidence gaps. Unknown value is not the same as zero value.

## Required Data Quality Gates Before Claimable Value

Each claim needs:

1. Declared tenant key from registry/code, not inferred from file path.
2. Subject identity with stable ID.
3. Provenance to source system/report/file/row and formula version.
4. Baseline, target, actual, and measurement period.
5. Finance attestation.
6. Business-owner attestation.
7. No unresolved source conflicts.
8. Cite-render verification before model use.
