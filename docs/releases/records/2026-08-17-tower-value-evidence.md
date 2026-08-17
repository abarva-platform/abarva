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

## Addendum — ask the client why, do not infer it

The projector derived a claim state from which observations existed: no actual meant `evidence_gap`,
no attestation meant not claimable. Defensible, and the wrong place for the answer to come from.

Sitting with a client filling in the metrics sheet, these are the questions asked out loud:

- What evidence would you accept that this outcome happened?
- Who has to sign it off before it goes in front of the board?
- What is stopping you claiming it today?
- What would have to be true, and by when?

**None of that had a column.** So the reason a claim was blocked got reconstructed downstream from
the shape of the data, producing a label that is technically accurate and nearly useless. *Missing
actual* tells you a field is blank. *The instrumentation was never funded* tells you who to call.

Six columns added to the metrics intake — `evidence_basis`, `attestation_owner`, `claim_readiness`,
`claim_blocked_reason`, `unblock_action`, `unblock_target_period` — and the projector now prefers the
client's answer over its own inference.

### What that changed

| State | Derived-only | With declared readiness |
| --- | --- | --- |
| `claimable` | 80 | **16** |
| `awaiting_attestation` | — | 41 |
| `blocked_by_owner` | — | 24 |
| `blocked_by_policy` | 21 | 21 |
| `evidence_gap` | 1 | **0** |

**Claimable dropped from 80 to 16, and that is the improvement.** The derived rule said any metric
with an actual and an attestation is claimable. The client's own assessment says most of them are
not — the benefit is not separable from concurrent changes, the cohort is disputed, the supplier owns
the evidence. A board seeing 80 claimable would have been reading a number the client would not
stand behind.

The declared reason wins over the derived one whenever both exist. A metric the client marks
`not_ready` stays blocked even when every field is populated, because they know something the columns
do not. `reasonSource` records `declared` (41) against `inferred` (61) so a reader can tell which is
which.

### Top declared reasons

- 11 — Instrumentation for this metric was never funded, so no post-change measurement exists.
- 9 — Benefit is real but not separable from two other concurrent changes in the same process.
- 8 — Operational KPI movement must be reconciled to finance before realized value is presentable.

Each carries an `attestation_owner`, an `unblock_action` and a target period, so the gap report names
a person and a date rather than a null column.

### Gap this opens

**The client intake instructions (§20 of the engineering design) do not yet cover these columns.** A
client following the current guidance would supply metrics with no readiness assessment, and the
projector would silently fall back to inference for all of them. The instructions are the deliverable
that makes this work at a real engagement, and they are owed.

## Addendum — AI usage telemetry against what the platforms publish

The AI usage feed captured a seat-adoption view: licensed, enabled, active and power users, an event
count, and adoption against target. That answers "how many people log in" and reconciles to no
invoice.

What the platforms actually expose:

| Platform | Billed unit | Endpoint | Refresh |
| --- | --- | --- | --- |
| Microsoft 365 Copilot | prompts | Graph `getMicrosoft365CopilotUsageUserDetail` | ~48h |
| ServiceNow Now Assist | assists | `sys_gen_ai_usage_log` + Now Assist Analytics | ~24h |
| Workday | assisted transactions | Prism analytics extract | ~24h |
| Coding assistants | tokens | vendor seat and token report | ~12h |

Copilot also splits activity by app — Word, Excel, PowerPoint, Outlook, Teams, chat — and its agent
report segments by license state and agent creator type. ServiceNow publishes workflow latency and
task closure rate.

Three gaps mattered:

- **No metered unit.** `usage_events` is generic and ties to no invoice. Every platform bills on
  something specific, and a consumption figure that cannot be reconciled to a bill cannot support a
  cost conversation.
- **No quality signal.** 306 active users who discard every suggestion is not adoption. Acceptance
  rate is the difference between a tool being opened and a tool being used.
- **No collection provenance.** A 48-hour-stale export presented as current is a different claim from
  a live read, and nothing recorded which it was.

Fourteen columns added, including `metered_unit`, `metered_quantity`, `contracted_quantity`,
`acceptance_rate_pct`, `task_completion_rate_pct`, `median_latency_seconds`,
`license_state_breakdown`, `per_surface_breakdown`, `collection_method`, `collection_endpoint`,
`refresh_lag_hours` and `shadow_usage_flag`.

### What one row now says

```
1,035 licensed · 900 enabled · 135 disabled-but-billed · 594 enabled-never-active
31,536 prompts against 39,000 contracted
20% acceptance
Teams 54% · Outlook 45% · Word 35% · Excel 26% · PowerPoint 16% · chat 7%
MS Graph · getMicrosoft365CopilotUsageUserDetail · 48h lag
```

That is a renewal conversation. None of it was visible from "34% adoption".

### How this is meant to work in practice

**The sheet is a bootstrap, not the mechanism.** The first engagement exports a quarter by hand from
each admin centre. After that it has to become a collector on a cadence, because a spreadsheet cannot
track a 48-hour refresh and nobody will re-key it.

That is the **F2 pattern** in §21: observed telemetry publishing into canonical with `basis: observed`.
The declared adoption target is `declared`; the metered actual arrives from Graph and ServiceNow as
`observed`; the gap is the finding. `shadow_usage_flag` distinguishes `none_detected` from
`unknown_not_instrumented` — a manual export cannot see usage outside the licensed tenant, and that
absence is a different statement from "no shadow usage".
