# Tower — risk is not readiness printed twice

## Release ID

`2026-08-30-tower-risk-is-not-readiness-twice`

## Status

`candidate`

## Plain-English Summary

The **Value case lanes** table on AI bets → Value proof showed two columns side by side, headed
**Readiness** and **Risk**. Layer 4 writes them as:

```
proof_maturity_score: readiness_score
risk_pressure_score:  100 - readiness_score
```

They are one number and its complement. On the live page, eight consecutive pairs read
64/36, 53/47, 75/25, 70/30, 48/52, 43/57, 59/41, 81/19 — **every pair summing to exactly 100**.

Under separate headings a reader takes those as two independent assessments of a case: how ready it
is, and how risky it is. There is only one assessment. The second column is arithmetic performed on
the first and given a different name.

The Risk column is removed from that table. Readiness stays, because that is the measurement that
actually exists.

**The AI portfolio table keeps its Risk column.** There the value is genuinely absent — no loader
writes `risk_score` anywhere in the pipeline — and it renders "Not scored" on every row. That names
a gap rather than inventing a dimension, which is the opposite failure and worth keeping visible.

## Layer Impact

Lane: `global-control-lane` — shared behaviour for all clients, not feature-gated. Tower product
surface only. One column removed from one table. No reader, loader, schema or data change, and no
value recalculated.

## Client Applicability

**All clients** reading AI bets → Value proof. Not flagged, not tenant-scoped. Any tenant whose
Layer 4 build writes `risk_pressure_score` as the complement of readiness — which is every tenant,
since the expression is a constant in the loader — loses a column that told them nothing.

## Changes Included

- `views/ContractTabs.tsx` — the Risk header and cell removed from Value case lanes, with the
  reason recorded at the table.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — three guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 41/41, three new guards |
| Tower suites | PASS against baseline — 529 pass / 21 fail across 6 suites; failing set identical to `origin/main` |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Live confirmation before the change | PASS — eight pairs read from the deployed page, all summing to 100 |
| Live confirmation after | NOT RUN — pending deploy |

One guard asserts the loader **still** computes `risk_pressure_score` as `100 - readiness_score`.
The day that stops being true, risk becomes a real measurement worth showing again, and the guard
fails so the decision gets revisited rather than staying buried.

## Rollout Plan

Ships with the next `main` deploy. No flag, no env change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-runtime mutation from this branch.

## Rollback Plan

Revert the commit. Display-only; nothing computed or stored changes.

## Known Gaps

- **No risk model exists anywhere in the pipeline.** `risk_score` is written by no loader, and
  `risk_pressure_score` is a restatement of readiness. This change removes the misleading
  presentation; it does not create the missing measurement. Whether to build one is a product
  decision, and the honest interim state — "Not scored" on the AI portfolio table — is already
  live.
- `TowerAiView.dependencyRisk` is still assigned from `riskScore`. It reaches no rendered surface
  today, so it is inert, but it would carry the same emptiness if one were built on it.
- `ContractTabs` still uses `riskScore` as a sort tiebreak on AI rows, where it is 0 for every row.
  A no-op, left alone to keep this change to one column.

## Audit Evidence

`scripts/tower/load-healthcare-demo-layer4-products.mjs` lines 573-574:
`proof_maturity_score: sqlNum(row.readiness_score)` immediately followed by
`risk_pressure_score: sqlNum(100 - num(row.readiness_score))`. Confirmed on the deployed page at
`/tower?tab=initiatives&view=proof` before the change: the first sixteen percentages rendered as
eight pairs, each summing to 100.
