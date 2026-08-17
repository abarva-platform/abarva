# 2026-08-17-tower-value-evidence — Tower's claim chain, fed from canonical

## Release ID

`2026-08-17-tower-value-evidence`

## Status

`candidate`

## Plain-English Summary

Tower's Evidence tab reported **every** claim as missing baseline, target, actual, outcome metric,
attribution, quality guardrail, risk guardrail and finance attestation — between 89 and 164 claims per
gap. Read one way that is a client problem: they never supplied outcome evidence.

They did, and the audit found two separate causes.

**One: the evidence was never projected.** `ai_kpi_outcome_observation` carries `baselineValue`,
`targetValue`, `actualValue`, measurement period and owner, `financeValidatedValueUsd`,
`valueClaimStatus`, `towerClaimAllowed` and `evidenceId`. Every field Tower reported as absent existed
in canonical and had never reached `tower.metric_observation` or `tower.value_claim`.

**Two — and this is the one worth remembering: the intake template never asked the question.**
`14_metrics_outcomes.csv` had `baseline_value`, `baseline_period` and `target_value`, and stopped. A
client filling it in perfectly still supplied metrics nobody had measured since the baseline, so Tower
was correct that no outcome could be claimed — and the template made that unavoidable.

No amount of loader or projector work would have surfaced that. Everything downstream was faithfully
carrying an absence that originated in a column which does not exist.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1:** the metrics intake gains `actual_value`, `actual_period`,
  `finance_attested_value_usd`, `value_claim_status`.
- **Layer 3:** those flow into `metric_outcome` with no adapter change.
- **Layer 4:** a projector writes `tower.tracked_subject`, `tower.metric_observation` and
  `tower.value_claim`. Tower's views are unchanged.

## Client Applicability

- Specific clients: both active tenants
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-tower-value-evidence.ts` — the projector.
- `scripts/data/fixtures/add-metric-actuals.mjs` — the intake columns and their values.
- `package.json` — `data-build:tower-evidence`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.
- Pass: dry-run across both tenants —

  | | Before actuals | After |
  | --- | --- | --- |
  | Subjects | 50 | 50 |
  | Observations | 229 (102 baseline / 101 target / **26 actual**) | 305 (102 / 101 / **102 actual**) |
  | Claimable | 5 | **80** |
  | Blocked by policy | 21 | 21 |
  | Evidence gap | 76 | **1** |

**The 21 blocked-by-policy claims are correct and stay.** Canonical says `towerClaimAllowed` is false
for those: the client's own governance has not cleared them. A projector that overrode that to make a
dashboard look complete would be doing the opposite of its job.

**A third of metrics are deliberately left baseline-only.** A portfolio where every tracked metric has
a measured outcome and a finance signature is not a realistic enterprise — it is one that has already
solved the problem the product exists to work on.

## Rollout Plan

Merge, deploy, run `data-build:tower-evidence` as an ACA Job with write approval, then confirm the
Evidence tab on the signed-in surface.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow; the build runs as an ACA Job under
`docs/ops/aca-data-build-job-rule.md`.

## Rollback Plan

Revert. Claims return to their prior state; no observation rows are destroyed, because the projector
upserts by a deterministic id rather than deleting.

## Audit Evidence

- The commit and its PR.
- The projector's `summary.json` with per-scenario observation counts and per-state claim counts.
- The ACA Job run id and pre-commit readback from the write run.

## Known Gaps

- **`calculated_value` is only set where an actual and a finance attestation both exist.** Deriving it
  from a target would turn an expectation into a result, which is precisely what the claim chain
  exists to prevent.
- **One claim still shows a genuine gap** — a metric with no target. That is a real intake gap and is
  reported rather than filled.
- **The attribution and risk-guardrail gap groups are only partly addressed.** The projector sets
  quality guardrail state and attribution where canonical carries an `evidenceId`; risk guardrail
  state has no canonical source yet.
- **The template change is not yet reflected in the client intake instructions** (§20 of the
  engineering design). A client following the current guidance would still supply metrics without
  actuals.
