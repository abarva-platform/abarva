# 2026-07-23-home-knowledge-v4-cost-ledger — measured cost accounting for Home V4 generation runs

## Release ID

`2026-07-23-home-knowledge-v4-cost-ledger`

## Status

`candidate`

## Plain-English Summary

Adds `--cost-ledger`, which reconstructs the exact call/token/cost accounting of a past Home V4
generation run from the artifacts it already wrote — no rerun, no Claude call, no estimate.

Why it's needed: decisions about whether to authorise another paid generation run were being
made against arithmetic guesses ("roughly 92 calls, somewhere between $20 and $200"). Every
stored response already carries its `usage` block, so the measurement was sitting on disk the
whole time. A paid run should never be authorised against an estimate when the real number is
retrievable for free.

```
node scripts/knowledge/build-home-knowledge-v4-review-pack.mjs --cost-ledger <bundle> --out-dir <dir>
```

Reports per tenant and per pass type: calls, repaired calls, wasted empty-response attempts,
input/cache-write/cache-read/output tokens, wall-clock minutes, and USD. Emits greppable
`HOME_V4_COST_LEDGER` and `HOME_V4_CACHE_UTILISATION` lines and writes `cost-ledger.json`.
Pricing defaults to Opus list and is overridable via `HOME_V4_PRICE_*` for negotiated rates.

### First measured result

Against the five-tenant bundle of 2026-07-23T17:34Z:

| Tenant | Calls | Repaired | Input tokens | Cache reads | Output tokens | Minutes | USD |
|---|---:|---:|---:|---:|---:|---:|---:|
| apex-retail | 17 | 1 | 635,027 | 0 | 138,004 | 27.9 | 19.88 |
| first-capital | 17 | 1 | 633,790 | 0 | 135,533 | 27.6 | 19.67 |
| lakeshore-holdings | 16 | 0 | 607,762 | 0 | 122,791 | 23.3 | 18.33 |
| meridian-health | 20 | 4 | 862,674 | 0 | 175,371 | 39.7 | 26.09 |
| skyharbor-air | 16 | 0 | 594,360 | 0 | 117,273 | 22.1 | 17.71 |
| **Total** | **86** | **6** | **3,333,613** | **0** | **688,972** | **140.6** | **101.68** |

**Prompt-cache utilisation: 0.0%.** Not one cache read across 86 calls. Every call re-sent its
full context packet at full input price — 3.33M input tokens billed at the uncached rate. Input
is roughly half the total spend, and most of it is the same context sent again.

This is the largest single cost lever in the pipeline and it is a configuration change (cache
breakpoints on the system prompt and context packet), not an architecture rewrite. Cache reads
bill at $1.50/M against $15/M uncached.

Second observation: Meridian took 20 calls against 16-17 for every other tenant, with 4 repaired
calls against 0-1 elsewhere. Meridian is the most expensive tenant to generate and the least
reliable, which is worth knowing before it is chosen as the canary tenant again.

## Layer Impact

- `global-control-lane`: read-only reporting mode in one operator script. No schema, no runtime
  path, no writes, no generation.

## Client Applicability

- All clients: reports on any tenant bundle.
- Internal only: operator/FinOps tooling.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: `--cost-ledger <path>` mode,
  `pricePerMillion` (env-overridable), per-tenant and per-pass aggregation, cache-utilisation
  warning.
- `package.json`: adds `home:knowledge-v4:cost-ledger`.

## QA / Validation

- `pass` — `node --check` clean.
- `pass` — `npx eslint scripts/knowledge/build-home-knowledge-v4-review-pack.mjs` (exit 0).
- `pass` — Executed against the five-tenant bundle: 86 calls aggregated, per-tenant table and
  `cost-ledger.json` produced, zero Claude calls, sub-second runtime.
- `pass` — Cache-utilisation warning fires correctly on the 0% case.
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy through the normal ACA main lane. Run the ledger against any past or future
bundle to get its real cost. Use the measured cost of the next clean run — not a guess — to set
the `--max-cost-usd` cap when budget enforcement is implemented.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — read-only reporting.
- Migration application: none.
- Feature/env flag update path: optional `HOME_V4_PRICE_*` overrides, unset by default.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. The mode is additive and read-only; reverting removes a report only.

## Audit Evidence

- `cost-ledger.json` for the 2026-07-23T17:34Z five-tenant bundle, showing 86 calls,
  3,333,613 input tokens, 0 cache reads, 688,972 output tokens, $101.68 at Opus list.

## Known Gaps

- Pricing is a local constant, not a live rate lookup. If negotiated rates apply, set
  `HOME_V4_PRICE_*` or the USD column will be wrong. Token counts are always exact regardless.
- Empty-response attempts are counted but their token cost is not attributed — those files
  record the attempt, and a failed attempt still bills. The reported cost is therefore a floor,
  not a ceiling.
- Budget enforcement (`--max-cost-usd`, `--max-calls`, pre-flight estimate, hard stop) is not
  implemented here. This PR supplies the measurement those caps need to be set honestly.
- Prompt caching is not enabled by this PR. The 0% finding is reported, not fixed; enabling it
  changes request shape and needs a canary.
